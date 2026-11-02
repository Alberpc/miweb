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
