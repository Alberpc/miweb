/* ══════════════════════════════════════════════════════════════════
   index.js — HOME · contravía × Refero (2-nov-2026)
   ══════════════════════════════════════════════════════════════════
   Menú móvil y reveal viven en assets/js/base.js. Aquí solo lo de la
   home: pausa de movimiento, pestañas de servicios con su recorrido de
   ejemplo, parallax del hero, envío del formulario y el email ofuscado.
   ══════════════════════════════════════════════════════════════════ */

document.documentElement.classList.add('js');

/* ── Movimiento: respeta el sistema y deja pausarlo a mano ───────── */
const prefiereQuieto = matchMedia('(prefers-reduced-motion: reduce)');
const botonMovimiento = document.getElementById('movimiento');
let pausado = prefiereQuieto.matches;

const videoPortada = document.getElementById('portada-video');
function fijarMovimiento(valor) {
    pausado = valor;
    document.documentElement.classList.toggle('pausado', pausado);
    if (videoPortada) {
        if (pausado) videoPortada.pause();
        else videoPortada.play().catch(() => {});
    }
    if (!botonMovimiento) return;
    botonMovimiento.setAttribute('aria-pressed', String(pausado));
    botonMovimiento.innerHTML = pausado
        ? 'Activar movimiento <span aria-hidden="true">▷</span>'
        : 'Pausar movimiento <span aria-hidden="true">Ⅱ</span>';
}
fijarMovimiento(pausado);
if (botonMovimiento) botonMovimiento.addEventListener('click', () => fijarMovimiento(!pausado));
prefiereQuieto.addEventListener('change', (e) => fijarMovimiento(e.matches));

/* ── Parallax suave del hero ─────────────────────────────────────── */
const arte = document.querySelector('.hero-arte');
let esperando = false;
addEventListener('scroll', () => {
    if (!arte || esperando || pausado) return;
    esperando = true;
    requestAnimationFrame(() => {
        const y = scrollY;
        if (y < 1100) arte.style.transform = `translateY(${Math.min(y * 0.15, 110)}px)`;
        esperando = false;
    });
}, { passive: true });

/* ── Servicios: tablist con paneles reales en el HTML ────────────── */
const pestanas = Array.from(document.querySelectorAll('.servicios-lista [role="tab"]'));
const paneles = pestanas.map((t) => document.getElementById(t.getAttribute('aria-controls')));
let temporizadores = [];

function pararRecorrido() {
    temporizadores.forEach(clearTimeout);
    temporizadores = [];
    paneles.forEach((p) => {
        if (!p) return;
        p.classList.remove('corriendo');
        const b = p.querySelector('.panel-recorrido');
        if (b) { b.disabled = false; b.innerHTML = 'Ver el recorrido <span class="flecha" aria-hidden="true">→</span>'; }
        const t = p.querySelector('.actividad-t');
        const d = p.querySelector('.actividad-p');
        if (t && t.dataset.original) { t.textContent = t.dataset.original; d.textContent = d.dataset.original; }
    });
}

function elegir(i, enfocar) {
    pararRecorrido();
    pestanas.forEach((t, j) => {
        const activa = i === j;
        t.setAttribute('aria-selected', String(activa));
        t.tabIndex = activa ? 0 : -1;
        if (paneles[j]) paneles[j].hidden = !activa;
    });
    if (enfocar) pestanas[i].focus();
}

if (pestanas.length) {
    elegir(0, false);
    pestanas.forEach((t, i) => {
        t.addEventListener('click', () => elegir(i, false));
        t.addEventListener('keydown', (e) => {
            const n = pestanas.length;
            let sig;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') sig = (i + 1) % n;
            if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') sig = (i + n - 1) % n;
            if (e.key === 'Home') sig = 0;
            if (e.key === 'End') sig = n - 1;
            if (sig !== undefined) { e.preventDefault(); elegir(sig, true); }
        });
    });

    paneles.forEach((p) => {
        if (!p) return;
        const boton = p.querySelector('.panel-recorrido');
        const titulo = p.querySelector('.actividad-t');
        const texto = p.querySelector('.actividad-p');
        if (!boton || !titulo || !texto) return;
        titulo.dataset.original = titulo.textContent;
        texto.dataset.original = texto.textContent;
        const pasos = (p.dataset.pasos || '').split('|').filter(Boolean);

        boton.addEventListener('click', () => {
            pararRecorrido();
            boton.disabled = true;
            boton.textContent = 'Recorrido en curso…';
            p.classList.add('corriendo');
            pasos.forEach((paso, k) => {
                temporizadores.push(setTimeout(() => {
                    titulo.textContent = paso;
                    texto.textContent = `Paso ${k + 1} de ${pasos.length} · Ejemplo ilustrativo`;
                }, k * 1150));
            });
            temporizadores.push(setTimeout(() => {
                p.classList.remove('corriendo');
                boton.disabled = false;
                boton.innerHTML = 'Repetir recorrido <span class="flecha" aria-hidden="true">↻</span>';
            }, pasos.length * 1150 + 300));
        });
    });
}

/* ── Formulario de contacto → n8n ────────────────────────────────── */
const contactForm = document.getElementById('diagnostico-form');
const formMessage = document.getElementById('form-message');

if (contactForm && formMessage) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const honey = document.getElementById('validation_honey');
        if (honey && honey.value.trim() !== '') return;

        const submitBtn = contactForm.querySelector('.btn-submit');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Enviando…'; }

        formMessage.className = 'form-message';
        formMessage.textContent = 'Enviando…';

        const data = {
            nombre: document.getElementById('nombre').value,
            empresa: document.getElementById('empresa').value,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            problema: document.getElementById('mensaje').value || '',
            fecha: new Date().toISOString(),
            origen: 'Web Home v3'
        };

        try {
            const response = await fetch('https://alberto-core-n8n.saeasu.easypanel.host/webhook/d127116a-771a-4670-8f52-1288034a25e5', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Server error');
            if (typeof gtag === 'function') {
                gtag('event', 'generate_lead', { form_name: 'diagnostico_home' });
            }
            formMessage.className = 'form-message success';
            formMessage.textContent = '✓ Hecho. Te acabo de mandar un correo para que elijas hora. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).';
            contactForm.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            formMessage.className = 'form-message error';
            formMessage.textContent = 'Hubo un error al enviar la solicitud. Por favor, inténtalo de nuevo o escríbeme por WhatsApp.';
        } finally {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = originalBtnText; }
        }
    });
}

/* ── Email ofuscado: se arma aquí para no dejarlo en el HTML ─────── */
document.querySelectorAll('a[data-mail][data-dom]').forEach((a) => {
    const destino = a.dataset.mail + String.fromCharCode(64) + a.dataset.dom;
    a.href = 'mailto:' + destino;
    a.title = destino;
});

/* ── Casos reales: pestañas ──────────────────────────────────────── */
(function () {
    const tabs = Array.from(document.querySelectorAll('.casos-tabs [role="tab"]'));
    if (!tabs.length) return;
    const contador = document.querySelector('.casos-tabs-n b');
    function ver(i, enfocar) {
        tabs.forEach((t, j) => {
            const activa = i === j;
            t.setAttribute('aria-selected', String(activa));
            t.tabIndex = activa ? 0 : -1;
            const panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !activa;
        });
        if (contador) contador.textContent = i + 1;
        if (enfocar) tabs[i].focus();
    }
    tabs.forEach((t, i) => {
        t.addEventListener('click', () => ver(i, false));
        t.addEventListener('keydown', (e) => {
            const n = tabs.length;
            let sig;
            if (e.key === 'ArrowRight') sig = (i + 1) % n;
            if (e.key === 'ArrowLeft') sig = (i + n - 1) % n;
            if (sig !== undefined) { e.preventDefault(); ver(sig, true); }
        });
    });
    ver(0, false);
})();

/* ── Calculadora de horas (misma lógica que paginas.js) ─────────── */
(function () {
    /* Calculadora: minutos × veces por semana → horas al mes */
    const calc = document.querySelector('[data-calc]');
    if (calc) {
        const min = calc.querySelector('#calc-min');
        const veces = calc.querySelector('#calc-veces');
        const oMin = calc.querySelector('#calc-min-o');
        const oVeces = calc.querySelector('#calc-veces-o');
        const horas = calc.querySelector('#calc-horas');
        const dias = calc.querySelector('#calc-dias');
        function calcular() {
            const h = (+min.value * +veces.value * 52 / 12) / 60;
            oMin.textContent = min.value + ' min';
            oVeces.textContent = veces.value + ' veces';
            horas.textContent = h >= 10 ? Math.round(h) : h.toFixed(1).replace('.', ',');
            dias.textContent = Math.round(h * 12 / 8);
        }
        min.addEventListener('input', calcular);
        veces.addEventListener('input', calcular);
        calcular();
    }

})();
