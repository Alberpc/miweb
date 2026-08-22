/* Runner del banner de cookies en Node, sin navegador.
   Carga cookie-banner.js en un DOM minimo simulado y comprueba que:
   - sin consentimiento guardado, el banner se muestra
   - "Aceptar todas" guarda analytics:true y llama gtag consent update granted
   - "Rechazar" guarda analytics:false y llama gtag consent update denied
   - con consentimiento ya guardado, el banner no se vuelve a crear
   Uso: node assets/cookies/test/run-tests.js */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const scriptPath = path.join(__dirname, '..', 'cookie-banner.js');
const codigo = fs.readFileSync(scriptPath, 'utf8');

let fallos = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FALLO: ' + msg);
    fallos++;
  } else {
    console.log('OK: ' + msg);
  }
}

// --- DOM falso minimo, suficiente para el codigo de cookie-banner.js ---
function crearElementoFalso(tag) {
  const el = {
    tagName: tag,
    _children: [],
    style: {},
    classList: {
      _set: new Set(),
      add(c) { this._set.add(c); },
      remove(c) { this._set.delete(c); },
      contains(c) { return this._set.has(c); }
    },
    _listeners: {},
    addEventListener(evt, fn) {
      this._listeners[evt] = this._listeners[evt] || [];
      this._listeners[evt].push(fn);
    },
    click() {
      (this._listeners.click || []).forEach(fn => fn());
    },
    appendChild(child) { this._children.push(child); return child; },
    remove() {},
    querySelector(sel) {
      // busqueda simplificada por id o clase, suficiente para este script
      return buscar(this, sel);
    },
    querySelectorAll() { return []; },
    setAttribute() {},
    get checked() { return this._checked || false; },
    set checked(v) { this._checked = v; },
    innerHTML: ''
  };
  return el;
}

function buscar(root, sel) {
  // El codigo real usa innerHTML con un string; aqui simulamos que
  // querySelector encuentra "elementos" creados a mano via id conocido.
  return root._fakeQuery ? root._fakeQuery[sel] : undefined;
}

const bodyChildren = [];
const documentoFalso = {
  readyState: 'complete',
  createElement: (tag) => crearElementoFalso(tag),
  body: {
    appendChild(el) { bodyChildren.push(el); return el; }
  },
  addEventListener() {},
  querySelector(sel) {
    if (sel === '.acc-root') return bodyChildren.length ? bodyChildren[bodyChildren.length - 1] : null;
    return null;
  }
};

// localStorage falso
function crearLocalStorage() {
  const store = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store
  };
}

const gtagLlamadas = [];
function ejecutarEnSandbox(localStorageFalso) {
  const root = { _children: [] };
  // Sobreescribimos createElement para que el root devuelto por
  // crearBanner() exponga los botones via un mapa manual (mas simple
  // que parsear innerHTML de verdad).
  const botones = {};
  const elFalso = crearElementoFalso('div');
  elFalso.innerHTML = '';
  elFalso._fakeQuery = botones;
  elFalso.querySelector = (sel) => botones[sel];
  elFalso.remove = () => {};

  const docFalso = {
    readyState: 'complete',
    createElement: () => elFalso,
    body: { appendChild: (el) => { root._children.push(el); return el; } },
    addEventListener: () => {}
  };

  const sandbox = {
    window: {},
    document: docFalso,
    localStorage: localStorageFalso,
    console,
    setTimeout: (fn) => fn(), // ejecuta el remove() sincrono para el test
    Date
  };
  sandbox.window.gtag = function () { gtagLlamadas.push(Array.from(arguments)); };
  sandbox.window.document = sandbox.document;
  sandbox.window.localStorage = sandbox.localStorage;
  sandbox.globalThis = sandbox;

  // Los botones/checkbox se registran al construir el HTML: como no
  // parseamos innerHTML real, los creamos a mano con las mismas ids
  // que usa el codigo real para que querySelector los encuentre.
  ['#acc-btn-prefs', '#acc-btn-reject', '#acc-btn-save', '#acc-btn-accept', '#acc-toggle-analytics']
    .forEach(sel => { botones[sel] = crearElementoFalso('button'); });
  botones['.acc-prefs'] = crearElementoFalso('div');
  botones['.acc-banner'] = crearElementoFalso('div');
  botones['.acc-banner'].classList.add('acc-banner--on');

  vm.createContext(sandbox);
  vm.runInContext(codigo, sandbox, { filename: 'cookie-banner.js' });

  return { sandbox, botones, appended: root._children.length };
}

// --- Caso 1: sin consentimiento previo, el banner se crea ---
{
  const ls = crearLocalStorage();
  const { appended } = ejecutarEnSandbox(ls);
  assert(appended === 1, 'sin consentimiento guardado, el banner se añade al body');
}

// --- Caso 2: aceptar todas guarda analytics:true y notifica granted ---
{
  gtagLlamadas.length = 0;
  const ls = crearLocalStorage();
  const { botones } = ejecutarEnSandbox(ls);
  botones['#acc-btn-accept'].click();
  const guardado = JSON.parse(ls.getItem('acc_consent_v1'));
  assert(guardado.analytics === true, 'aceptar todas guarda analytics:true en localStorage');
  const ultimaLlamada = gtagLlamadas[gtagLlamadas.length - 1];
  assert(ultimaLlamada[0] === 'consent' && ultimaLlamada[2].analytics_storage === 'granted',
    'aceptar todas llama gtag consent update con analytics_storage granted');
}

// --- Caso 3: rechazar guarda analytics:false y notifica denied ---
{
  gtagLlamadas.length = 0;
  const ls = crearLocalStorage();
  const { botones } = ejecutarEnSandbox(ls);
  botones['#acc-btn-reject'].click();
  const guardado = JSON.parse(ls.getItem('acc_consent_v1'));
  assert(guardado.analytics === false, 'rechazar guarda analytics:false en localStorage');
  const ultimaLlamada = gtagLlamadas[gtagLlamadas.length - 1];
  assert(ultimaLlamada[0] === 'consent' && ultimaLlamada[2].analytics_storage === 'denied',
    'rechazar llama gtag consent update con analytics_storage denied');
}

// --- Caso 4: guardar preferencias respeta el estado del checkbox ---
{
  gtagLlamadas.length = 0;
  const ls = crearLocalStorage();
  const { botones } = ejecutarEnSandbox(ls);
  botones['#acc-toggle-analytics'].checked = true;
  botones['#acc-btn-save'].click();
  const guardado = JSON.parse(ls.getItem('acc_consent_v1'));
  assert(guardado.analytics === true, 'guardar preferencias con checkbox marcado guarda analytics:true');
}

// --- Caso 5: con consentimiento previo, NO se crea banner nuevo, solo se aplica ---
{
  gtagLlamadas.length = 0;
  const ls = crearLocalStorage();
  ls.setItem('acc_consent_v1', JSON.stringify({ analytics: true, ts: Date.now() }));
  const { appended } = ejecutarEnSandbox(ls);
  assert(appended === 0, 'con consentimiento ya guardado, no se vuelve a crear el banner');
  const ultimaLlamada = gtagLlamadas[gtagLlamadas.length - 1];
  assert(ultimaLlamada && ultimaLlamada[2].analytics_storage === 'granted',
    'con consentimiento previo granted, se reaplica gtag consent update granted sin banner');
}

console.log('\n' + (fallos === 0 ? 'TODOS LOS TESTS PASAN' : fallos + ' TEST(S) FALLARON'));
process.exit(fallos === 0 ? 0 : 1);
