/* ==========================================================================
   Widget de chat - albercabrera.com
   Agente que informa, cualifica y cierra a la llamada de 20 minutos.

   IMPORTANTE: aqui NO hay claves ni prompt. Todo eso vive en n8n, porque
   cualquier cosa en este archivo es publica (la web es estatica).
   Los guardrails de este archivo son solo para ahorrar llamadas de red:
   la defensa de verdad esta en n8n, que revalida todo.
   ========================================================================== */

(function () {
    'use strict';

    // ----------------------------------------------------------------------
    // Configuracion
    // ----------------------------------------------------------------------

    var config = {
        // Endpoint del agente (workflow "Agente Web - Chat" en n8n).
        endpoint: 'https://alberto-core-n8n.saeasu.easypanel.host/webhook/agente-web-chat',
        // Webhook de leads que YA existe (el mismo del formulario de la web).
        endpointLead: 'https://alberto-core-n8n.saeasu.easypanel.host/webhook/d127116a-771a-4670-8f52-1288034a25e5',
        maxMsgLength: 500,
        maxTurns: 20,
        timeoutMs: 20000,
        /* El saludo dice que es IA a proposito: el Reglamento de IA de la UE
           exige que quien habla con un sistema de IA lo sepa. Ademas, Alberto
           vende IA: decirlo demuestra el producto en vez de esconderlo. */
        tooltip: '¿Hablamos con Alba? (IA)',
        saludo: 'Hola, soy Alba, la asistente con IA de Alberto. Puedo contarte cómo trabaja y, si le veo encaje, dejarte una llamada con él. ¿Qué te ronda?',
        avisoPrivacidad: 'Alba es una IA y puede equivocarse. Guardamos la conversación para mejorar el servicio. <a href="politica-de-privacidad.html#asistente-ia" target="_blank" rel="noopener">Más info</a>.'
    };

    // Respuestas fijas. Copia literal de _docs/sistemas/agente-web-prompt-sistema.md
    var RESPUESTAS = {
        RECHAZO_TRABAJO_GRATIS: 'De eso no te puedo ayudar, que no es lo mío. Pero cuéntame una cosa: ¿qué es lo que más tiempo te está quitando en tu negocio?',
        RECHAZO_PRECIO: 'El precio depende de lo que estés perdiendo hoy, y eso se ve en 20 minutos hablando con Alberto. ¿Te cuento cómo va la llamada?',
        RECHAZO_INTERNO: 'De cómo funciono por dentro no hablo. Cuéntame mejor qué es lo que te está frenando a ti.',
        RECHAZO_FUERA_TEMA: 'Yo de eso no sé, lo siento. Lo mío es tu negocio: ¿qué es lo que te está comiendo el día?',
        LIMITE_ALCANZADO: 'Creo que esto se ve mejor hablando. Déjame tu nombre y tu correo y Alberto te escribe para cuadrar 20 minutos.',
        ERROR_TECNICO: 'Se me ha cruzado un cable. Déjame tus datos aquí abajo y Alberto te escribe.'
    };

    // ----------------------------------------------------------------------
    // Sanitizado y deteccion de abuso
    // ----------------------------------------------------------------------

    /* Quita acentos y pasa a minusculas, para que "cuánto" y "cuanto"
       caigan en el mismo patron. */
    function normalizar(texto) {
        return String(texto)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '');
    }

    function sanitizeInput(texto) {
        if (texto === null || texto === undefined) { return ''; }
        return String(texto)
            .replace(/<[^>]*>/g, '')   // etiquetas completas
            .replace(/[<>]/g, '')      // angulos sueltos
            .replace(/\s+/g, ' ')      // colapsa espacios y saltos
            .trim()
            .slice(0, config.maxMsgLength);
    }

    /* Orden deliberado: primero lo que intenta sonsacar configuracion,
       luego trabajo gratis, luego precio. Un mensaje que mezcle varias
       cosas se corta por la mas grave. */
    var PATRONES = [
        {
            nombre: 'RECHAZO_INTERNO',
            regex: [
                /ignora (tus |las )?(instrucciones|reglas|ordenes)/,
                /olvida (todo|tus|las)/,
                /(system|sistema) prompt/,
                /prompt del sistema/,
                /tus instrucciones/,
                /repite (todo )?(lo que|tus|tu)/,
                /actua como/,
                /haz como si (fueras|no)/,
                /(eres|seras) ahora/,
                /sin (restricciones|limites|filtros)/,
                /jailbreak|\bdan\b/,
                /que (modelo|ia|inteligencia artificial|version|chatbot|bot)\b/,
                /(eres|usas) (chatgpt|gpt|claude|gemini|llama|openai)/,
                /con que (estas|te han) (hecho|montado|programado|construido)/,
                /(api[ _-]?key|clave api|token de)/,
                /quien te (ha )?(programado|creado|hecho)/
            ]
        },
        {
            nombre: 'RECHAZO_TRABAJO_GRATIS',
            regex: [
                /(redacta|redactame|escribe|escribeme|hazme|generame|genera|creame|crea|dame) (un |una |el |la |unos |unas )?(email|correo|texto|post|articulo|codigo|funcion|script|programa|guion|copy|anuncio|carta|mensaje para)/,
                /\btraduce\b|\btraduceme\b/,
                /\bresume\b|\bresumeme\b/,
                /corrige (esto|este|mi)/,
                /analiza (este|esta|mi) (documento|texto|codigo|archivo)/,
                /dame ideas de (marketing|contenido|posts)/
            ]
        },
        {
            nombre: 'RECHAZO_PRECIO',
            regex: [
                /cuanto (cuesta|vale|cobra|cobras|cobrais|seria|me costaria)/,
                /\bprecio\b|\bprecios\b/,
                /\btarifa\b|\btarifas\b/,
                /\bpresupuesto\b/,
                /\bhonorarios\b/,
                /que (vale|cuesta)/,
                /rango de precio/
            ]
        }
    ];

    function detectAbuse(texto) {
        var t = normalizar(texto);
        for (var i = 0; i < PATRONES.length; i++) {
            var grupo = PATRONES[i];
            for (var j = 0; j < grupo.regex.length; j++) {
                if (grupo.regex[j].test(t)) {
                    return grupo.nombre;
                }
            }
        }
        return null;
    }

    // ----------------------------------------------------------------------
    // Estado
    // ----------------------------------------------------------------------

    /* Id de sesion: agrupa la conversacion en la memoria del servidor.
       Vive solo en esta pestaña (sessionStorage): si el visitante recarga sigue
       su charla, y si cierra el navegador empieza de cero. No identifica a nadie. */
    function idSesion() {
        try {
            var guardado = sessionStorage.getItem('acw_sesion');
            if (guardado) { return guardado; }
            var nuevo = 'web-' + Date.now().toString(36) + '-' +
                Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem('acw_sesion', nuevo);
            return nuevo;
        } catch (e) {
            // Navegador con almacenamiento bloqueado: sesion de usar y tirar
            return 'web-' + Date.now().toString(36);
        }
    }

    var estado = {
        abierto: false,
        turno: 0,
        historial: [],   // [{ rol: 'user'|'bot', texto: string }]
        enviando: false,
        cerrado: false,  // true cuando el lead ya se envio o se agoto el cupo
        montado: false,
        sesion: idSesion()
    };

    var el = {};   // referencias del DOM, se rellenan en montar()

    // ----------------------------------------------------------------------
    // Interfaz
    // ----------------------------------------------------------------------

    /* Robot, no bocadillo: el bocadillo se confunde con el boton de WhatsApp
       que hay justo debajo, y ademas deja claro de un vistazo que es una IA. */
    var ICONO_CHAT = '<svg class="acw-bubble-icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 8V4.5"/><circle cx="12" cy="3" r="1.4"/><path d="M2 13v3M22 13v3"/><circle cx="9" cy="13.5" r="1.3" fill="#B44100" stroke="none"/><circle cx="15" cy="13.5" r="1.3" fill="#B44100" stroke="none"/><path d="M9.5 17h5"/></svg>';
    var ICONO_CERRAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    var ICONO_ENVIAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';

    function crear(tag, clase, html) {
        var n = document.createElement(tag);
        if (clase) { n.className = clase; }
        if (html !== undefined) { n.innerHTML = html; }
        return n;
    }

    function montar() {
        if (estado.montado) { return; }

        var raiz = crear('div', 'acw-root');

        // Burbuja
        el.bubble = crear('button', 'acw-bubble',
            ICONO_CHAT + '<span class="acw-tooltip">' + config.tooltip + '</span>');
        el.bubble.setAttribute('type', 'button');
        el.bubble.setAttribute('aria-label', 'Abrir el chat con Alba, la asistente con IA');

        // Panel
        el.panel = crear('div', 'acw-panel');
        el.panel.setAttribute('role', 'dialog');
        el.panel.setAttribute('aria-label', 'Chat con el asistente de Alberto');
        el.panel.setAttribute('aria-modal', 'false');

        // Cabecera
        var header = crear('div', 'acw-header');
        var titulos = crear('div', '',
            '<p class="acw-header-title">Alba</p>' +
            '<p class="acw-header-sub">Asistente IA de Alberto</p>');
        el.close = crear('button', 'acw-close', ICONO_CERRAR);
        el.close.setAttribute('type', 'button');
        el.close.setAttribute('aria-label', 'Cerrar el chat');
        header.appendChild(titulos);
        header.appendChild(el.close);

        // Mensajes
        el.messages = crear('div', 'acw-messages');
        el.messages.setAttribute('aria-live', 'polite');
        el.typing = crear('div', 'acw-typing', '<span></span><span></span><span></span>');
        el.messages.appendChild(el.typing);

        // Barra de escritura
        el.form = crear('form', 'acw-form');
        el.input = crear('textarea', 'acw-input');
        el.input.setAttribute('rows', '1');
        el.input.setAttribute('placeholder', 'Escribe aquí...');
        el.input.setAttribute('aria-label', 'Tu mensaje');
        el.input.setAttribute('maxlength', String(config.maxMsgLength));
        el.send = crear('button', 'acw-send', ICONO_ENVIAR);
        el.send.setAttribute('type', 'submit');
        el.send.setAttribute('aria-label', 'Enviar mensaje');
        el.form.appendChild(el.input);
        el.form.appendChild(el.send);

        // Formulario de respaldo
        el.fallback = construirFallback();

        el.panel.appendChild(header);
        el.panel.appendChild(el.messages);
        el.panel.appendChild(el.form);
        el.panel.appendChild(el.fallback);

        raiz.appendChild(el.bubble);
        raiz.appendChild(el.panel);
        document.body.appendChild(raiz);

        // Eventos
        el.bubble.addEventListener('click', abrir);
        el.close.addEventListener('click', cerrar);
        el.form.addEventListener('submit', alEnviar);
        el.input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                alEnviar(e);
            }
        });
        el.input.addEventListener('input', function () {
            el.input.style.height = 'auto';
            el.input.style.height = Math.min(el.input.scrollHeight, 96) + 'px';
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && estado.abierto) { cerrar(); }
        });

        estado.montado = true;
    }

    function construirFallback() {
        var f = crear('form', 'acw-fallback');
        f.innerHTML =
            '<p class="acw-fallback-note">Déjame tus datos y Alberto te escribe para cuadrar 20 minutos.</p>' +
            '<input class="acw-field" type="text" name="nombre" placeholder="Tu nombre" maxlength="100" required>' +
            '<input class="acw-field" type="text" name="empresa" placeholder="Tu empresa" maxlength="100" required>' +
            '<input class="acw-field" type="email" name="email" placeholder="Tu correo" maxlength="150" required>' +
            '<input class="acw-field" type="tel" name="telefono" placeholder="Teléfono (opcional)" maxlength="30">' +
            '<textarea class="acw-field acw-field--area" name="problema" placeholder="¿Qué te está frenando?" maxlength="2000" required></textarea>' +
            '<div class="acw-hp"><input type="text" name="validation_honey" tabindex="-1" autocomplete="off"></div>' +
            '<button class="acw-submit" type="submit">Enviar</button>' +
            '<p class="acw-status"></p>';
        f.addEventListener('submit', alEnviarFallback);
        return f;
    }

    function abrir() {
        if (!estado.montado) { return; }
        estado.abierto = true;
        el.panel.classList.add('acw-panel--open');
        el.bubble.classList.add('acw-bubble--hidden');
        if (estado.historial.length === 0) {
            addMessage(config.saludo, 'bot');
            mostrarAvisoPrivacidad();
        }
        el.input.focus();
    }

    function cerrar() {
        if (!estado.montado) { return; }
        estado.abierto = false;
        el.panel.classList.remove('acw-panel--open');
        el.bubble.classList.remove('acw-bubble--hidden');
        el.bubble.focus();
    }

    function addMessage(texto, autor) {
        estado.historial.push({ rol: autor === 'user' ? 'user' : 'bot', texto: texto });
        if (!estado.montado) { return; }
        var m = crear('div', 'acw-msg acw-msg--' + (autor === 'user' ? 'user' : 'bot'));
        m.textContent = texto;   // textContent, nunca innerHTML: el texto no se interpreta
        el.messages.insertBefore(m, el.typing);
        el.messages.scrollTop = el.messages.scrollHeight;
    }

    /* Aviso de privacidad bajo el saludo. Lleva un enlace, asi que usa
       innerHTML, pero con texto FIJO nuestro, nunca del visitante. */
    function mostrarAvisoPrivacidad() {
        if (!estado.montado) { return; }
        var aviso = crear('p', 'acw-aviso', config.avisoPrivacidad);
        el.messages.insertBefore(aviso, el.typing);
    }

    function mostrarEscribiendo(on) {
        if (!estado.montado) { return; }
        el.typing.classList.toggle('acw-typing--on', on);
        if (on) { el.messages.scrollTop = el.messages.scrollHeight; }
    }

    function bloquearEntrada(on) {
        if (!estado.montado) { return; }
        el.input.disabled = on;
        el.send.disabled = on;
    }

    function showFallback() {
        if (!estado.montado) { return; }
        estado.cerrado = true;
        el.form.classList.add('acw-form--hidden');
        el.fallback.classList.add('acw-fallback--on');
        el.messages.scrollTop = el.messages.scrollHeight;
    }

    // ----------------------------------------------------------------------
    // Envio
    // ----------------------------------------------------------------------

    function alEnviar(e) {
        if (e && e.preventDefault) { e.preventDefault(); }
        if (estado.enviando || estado.cerrado) { return; }

        var bruto = el.input.value;
        var texto = sanitizeInput(bruto);
        if (!texto) { return; }

        addMessage(texto, 'user');
        el.input.value = '';
        el.input.style.height = 'auto';
        estado.turno++;

        // Corte local por numero de turnos.
        if (estado.turno > config.maxTurns) {
            addMessage(RESPUESTAS.LIMITE_ALCANZADO, 'bot');
            showFallback();
            return;
        }

        // Guardrail de cliente: ahorra la llamada de red en lo obvio.
        // n8n vuelve a comprobarlo igualmente.
        var abuso = detectAbuse(texto);
        if (abuso) {
            addMessage(RESPUESTAS[abuso], 'bot');
            return;
        }

        sendToBackend(texto);
    }

    function sendToBackend(texto) {
        estado.enviando = true;
        bloquearEntrada(true);
        mostrarEscribiendo(true);

        var control = new AbortController();
        var reloj = setTimeout(function () { control.abort(); }, config.timeoutMs);

        fetch(config.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mensaje: texto,
                historial: estado.historial.slice(-12),
                turno: estado.turno,
                sesion: estado.sesion
            }),
            signal: control.signal
        })
            .then(function (res) {
                if (!res.ok) { throw new Error('respuesta ' + res.status); }
                return res.json();
            })
            .then(function (data) {
                var respuesta = (data && data.respuesta) ? String(data.respuesta) : RESPUESTAS.ERROR_TECNICO;
                addMessage(respuesta, 'bot');
                if (data && data.leadCompleto) {
                    estado.cerrado = true;
                    bloquearEntrada(true);
                    el.form.classList.add('acw-form--hidden');
                    return;
                }
                if (data && data.limite) {
                    showFallback();
                }
            })
            .catch(function () {
                addMessage(RESPUESTAS.ERROR_TECNICO, 'bot');
                showFallback();
            })
            .then(function () {
                clearTimeout(reloj);
                estado.enviando = false;
                mostrarEscribiendo(false);
                if (!estado.cerrado) {
                    bloquearEntrada(false);
                    el.input.focus();
                }
            });
    }

    function alEnviarFallback(e) {
        e.preventDefault();
        var f = el.fallback;
        var estadoTxt = f.querySelector('.acw-status');
        var boton = f.querySelector('.acw-submit');

        // Honeypot: si viene relleno, es un bot. Fingimos exito y no enviamos.
        if (f.validation_honey && f.validation_honey.value) {
            estadoTxt.className = 'acw-status acw-status--ok';
            estadoTxt.textContent = 'Hecho. Alberto te escribe en breve.';
            return;
        }

        if (!f.checkValidity()) { f.reportValidity(); return; }

        boton.disabled = true;
        estadoTxt.className = 'acw-status';
        estadoTxt.textContent = 'Enviando...';

        // Nombres de campo obligatorios: el workflow "Registro CRM" lee
        // body.nombre, body.empresa, body.email, body.telefono y body.problema.
        var datos = {
            nombre: sanitizeInput(f.nombre.value),
            empresa: sanitizeInput(f.empresa.value),
            email: sanitizeInput(f.email.value),
            telefono: sanitizeInput(f.telefono.value),
            problema: sanitizeInput(f.problema.value) || resumenConversacion(),
            fecha: new Date().toISOString(),
            origen: 'Chat web'
        };

        fetch(config.endpointLead, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        })
            .then(function (res) {
                if (!res.ok) { throw new Error('respuesta ' + res.status); }
                estadoTxt.className = 'acw-status acw-status--ok';
                estadoTxt.textContent = 'Hecho. Te acabo de mandar un correo para que elijas hora. Revisa tu bandeja (y el spam, por si acaso).';
                f.querySelector('.acw-submit').style.display = 'none';
            })
            .catch(function () {
                estadoTxt.className = 'acw-status acw-status--error';
                estadoTxt.textContent = 'No he podido enviarlo. Prueba otra vez o escribe a alberto@albercabrera.com';
                boton.disabled = false;
            });
    }

    /* Si el visitante no rellena el "que te frena" pero ya lo conto en el chat,
       aprovechamos lo que escribio en vez de mandar el campo vacio. */
    function resumenConversacion() {
        var suyos = [];
        for (var i = 0; i < estado.historial.length; i++) {
            if (estado.historial[i].rol === 'user') { suyos.push(estado.historial[i].texto); }
        }
        return suyos.join(' | ').slice(0, 1500);
    }

    // ----------------------------------------------------------------------
    // Arranque
    // ----------------------------------------------------------------------

    function init() {
        montar();   // el panel NO se abre solo: solo al pulsar la burbuja
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // API publica, para los tests y para poder abrirlo desde un boton de la web
    window.ACW = {
        config: config,
        respuestas: RESPUESTAS,
        sanitizeInput: sanitizeInput,
        detectAbuse: detectAbuse,
        open: abrir,
        close: cerrar,
        addMessage: addMessage,
        showFallback: showFallback
    };
})();
