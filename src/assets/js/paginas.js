/* ══════════════════════════════════════════════════════════════════
   paginas.js — comportamiento de las páginas interiores (2-nov-2026)
   ══════════════════════════════════════════════════════════════════
   · Pasos: el índice fijo sigue al paso que se lee (escritorio) y los
     puntos siguen al carrusel (móvil).
   · Calculadora de horas de la página de automatización.
   · El informe del diagnóstico se endereza al hacer scroll.
   Todo es defensivo: si la página no tiene la pieza, no hace nada.
   ══════════════════════════════════════════════════════════════════ */
(function () {
    const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.querySelectorAll('[data-pasos]').forEach((bloque) => {
        const pasos = Array.from(bloque.querySelectorAll('.pg-paso'));
        const enlaces = Array.from(bloque.querySelectorAll('.pg-pasos-indice a'));
        const cont = bloque.querySelector('.pg-pasos-cont b');
        const barra = bloque.querySelector('.pg-barra i');
        const lista = bloque.querySelector('.pg-pasos-lista');
        const puntos = bloque.querySelector('.pg-puntos');
        const total = pasos.length;

        function marcar(i) {
            enlaces.forEach((a, j) => a.classList.toggle('activo', i === j));
            if (cont) cont.textContent = String(i + 1).padStart(2, '0');
            if (barra) barra.style.width = ((i + 1) / total * 100) + '%';
            if (puntos) Array.from(puntos.children).forEach((p, j) => {
                p.classList.toggle('activo', i === j);
                p.setAttribute('aria-current', i === j ? 'step' : 'false');
            });
        }

        const obs = new IntersectionObserver((entradas) => {
            entradas.forEach((e) => { if (e.isIntersecting) marcar(pasos.indexOf(e.target)); });
        }, { rootMargin: '-45% 0px -45% 0px' });
        pasos.forEach((p) => obs.observe(p));

        if (puntos && lista) {
            pasos.forEach((p, i) => {
                const b = document.createElement('button');
                b.type = 'button';
                b.setAttribute('aria-label', 'Paso ' + (i + 1));
                b.addEventListener('click', () => lista.scrollTo({ left: p.offsetLeft - lista.offsetLeft - parseFloat(getComputedStyle(lista).paddingLeft || 0), behavior: quieto ? 'auto' : 'smooth' }));
                puntos.appendChild(b);
            });
            let espera = false;
            lista.addEventListener('scroll', () => {
                if (espera) return;
                espera = true;
                requestAnimationFrame(() => {
                    const centro = lista.scrollLeft + lista.clientWidth / 2;
                    let mejor = 0, dist = Infinity;
                    pasos.forEach((p, i) => {
                        const d = Math.abs(p.offsetLeft - lista.offsetLeft + p.offsetWidth / 2 - centro);
                        if (d < dist) { dist = d; mejor = i; }
                    });
                    marcar(mejor);
                    espera = false;
                });
            }, { passive: true });
        }
        marcar(0);
    });

    /* Calculadora: minutos × veces × personas → horas y euros al mes.
       Tiempo y veces van por una escala de pasos que crecen
       (data-escala "1-10:1,15-60:5" = de 1 en 1 hasta 10, luego de 5 en 5),
       para que los valores pequeños, los más habituales, tengan sitio. */
    const calc = document.querySelector('[data-calc]');
    if (calc) (() => {
        const q = (s) => calc.querySelector(s);
        const escala = (input) => {
            const d = input.dataset.escala;
            if (!d) return null;
            const v = [];
            d.split(',').forEach((tramo) => {
                const [rango, paso] = tramo.split(':');
                const [ini, fin] = rango.split('-').map(Number);
                for (let x = ini; x <= fin; x += +paso) v.push(x);
            });
            return v;
        };
        const ctrl = ['min', 'veces', 'personas', 'coste'].map((id) => {
            const input = q('#calc-' + id);
            return { id, input, out: q('#calc-' + id + '-o'), valores: input && escala(input) };
        });
        if (ctrl.some((c) => !c.input)) return;
        const valor = (c) => c.valores ? c.valores[+c.input.value] : +c.input.value;
        const durac = (m) => m < 60 ? m + ' min' : Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '');
        const texto = {
            min: durac,
            veces: (n) => n + (n === 1 ? ' vez' : ' veces'),
            personas: (n) => n + (n === 1 ? ' persona' : ' personas'),
            coste: (n) => n + ' €/h'
        };
        const euros = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' }); // 3.830, no 3830
        function calcular() {
            const v = {};
            ctrl.forEach((c) => {
                v[c.id] = valor(c);
                const t = texto[c.id](v[c.id]);
                c.out.textContent = t;
                c.input.setAttribute('aria-valuetext', t);
            });
            const h = v.min * v.veces * v.personas * 46 / 12 / 60;
            q('#calc-horas').textContent = h >= 10 ? euros.format(Math.round(h)) : h.toFixed(1).replace('.', ',');
            const e = h * v.coste;
            q('#calc-euros').textContent = euros.format(e >= 100 ? Math.round(e / 10) * 10 : Math.round(e)) + ' €';
            q('#calc-dias').textContent = euros.format(Math.round(h * 12 / 8));
        }
        ctrl.forEach((c) => c.input.addEventListener('input', calcular));
        calcular();
    })();

    /* Informe del diagnóstico: llega inclinado y se endereza */
    const informe = document.querySelector('.pg-informe');
    if (informe && !quieto) {
        let esperando = false;
        const mover = () => {
            const r = informe.getBoundingClientRect();
            const p = Math.min(Math.max((innerHeight - r.top) / (innerHeight * 0.9), 0), 1);
            informe.style.setProperty('--giro', (14 * (1 - p)).toFixed(2) + 'deg');
            informe.style.setProperty('--escala', (0.94 + 0.06 * p).toFixed(3));
            esperando = false;
        };
        addEventListener('scroll', () => { if (!esperando) { esperando = true; requestAnimationFrame(mover); } }, { passive: true });
        mover();
    } else if (informe) {
        informe.style.setProperty('--giro', '0deg');
        informe.style.setProperty('--escala', '1');
    }
})();

/* Barra fija de móvil (no-perder-clientes): aparece al pasar el hero y
   se esconde cuando el formulario ya está a la vista. */
(function () {
    const barra = document.getElementById('cta-movil');
    const hero = document.querySelector('.pg-hero');
    const cierre = document.getElementById('cierre');
    if (!barra || !hero || !cierre) return;
    let pasadoHero = false, formVisible = false;
    const pintar = () => barra.classList.toggle('visible', pasadoHero && !formVisible);
    new IntersectionObserver(([e]) => { pasadoHero = !e.isIntersecting; pintar(); }).observe(hero);
    new IntersectionObserver(([e]) => { formVisible = e.isIntersecting; pintar(); }, { threshold: 0.15 }).observe(cierre);
})();

/* Formulario de no-perder-clientes → mismo webhook de n8n que la home
   (3-nov-2026). Antes no tenía envío: el botón no mandaba nada. Va con
   origen propio para distinguir estos leads en n8n. */
(function () {
    const form = document.getElementById('leads-form');
    const msg = document.getElementById('form-message');
    if (!form || !msg) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const honey = document.getElementById('validation_honey');
        if (honey && honey.value.trim() !== '') return;
        const btn = form.querySelector('.btn-submit');
        const textoBtn = btn ? btn.innerHTML : '';
        if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
        msg.className = 'form-message';
        msg.textContent = 'Enviando…';
        const negocio = document.getElementById('negocio').value || '';
        const data = {
            nombre: document.getElementById('nombre').value,
            empresa: negocio,
            email: document.getElementById('email').value,
            telefono: document.getElementById('telefono').value,
            problema: negocio ? 'Negocio: ' + negocio : '',
            fecha: new Date().toISOString(),
            origen: 'Landing no-perder-clientes'
        };
        try {
            const r = await fetch('https://alberto-core-n8n.saeasu.easypanel.host/webhook/d127116a-771a-4670-8f52-1288034a25e5', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!r.ok) throw new Error('Server error');
            if (typeof gtag === 'function') gtag('event', 'generate_lead', { form_name: 'no_perder_clientes' });
            msg.className = 'form-message success';
            msg.textContent = '✓ Hecho. Te acabo de mandar un correo para que elijas hora. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).';
            form.reset();
        } catch (err) {
            console.error('Error al enviar el formulario:', err);
            msg.className = 'form-message error';
            msg.textContent = 'No se ha podido enviar. Inténtalo de nuevo o escríbeme por WhatsApp.';
        } finally {
            if (btn) { btn.disabled = false; btn.innerHTML = textoBtn; }
        }
    });
})();
