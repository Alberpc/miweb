/* ============================================================
   aurora.js — aurora animada del hero y del pie (canvas)
   ============================================================
   Sacado de index.js (migracion Eleventy, 3-sep-2026): la home lo
   cargaba dentro de su propio script, pero el mismo efecto hacia
   falta en el cierre oscuro de diagnostico-operativo (.cta-final) y
   no tenia sentido copiar 100 lineas de canvas para eso. Pinta
   cualquier <canvas class="aurora-canvas"> que haya en la pagina,
   sea la home o cualquier otra.
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    // AURORA DEL HERO Y DEL PIE
    //    Manchas de color muy difuminadas sobre el carbon. Va en canvas y
    //    no en un radial-gradient de CSS porque a este tamano el CSS corta
    //    en bandas visibles; aqui el degradado es continuo y ademas se
    //    puede mover sin repintar capas.
    //
    //    Sustituye a la masa de fibras 3D que habia antes: aquella tenia
    //    el verde #0F1F1B cocido dentro (rgba(15,31,27) y una formula que
    //    generaba tonos verdosos), asi que sobre el carbon nuevo salia
    //    sucia. El original esta guardado por si hiciera falta.
    //
    //    El terracota manda: mancha mas ancha, mas opaca y mas alta que
    //    las demas, porque es el color de accion. El resto acompana y cae
    //    en intensidad hacia la derecha, para que el conjunto se lea como
    //    una sola luz calida y no como cinco focos iguales.
    const auroraLienzos = document.querySelectorAll('.aurora-canvas');
    if (auroraLienzos.length) {
        // Las manchas viven FUERA del cuadro por abajo (y > 1) y solo
        // asoma su halo: la luz entra por el borde inferior, no baña la
        // pantalla.
        //
        // Altura y opacidad se compensan. Al principio estaban altas Y
        // opacas, y el titular caia sobre el rosa claro con 1.17 de
        // contraste. Bajarlas lo arreglo pero dejo el hero casi negro.
        // Ahora suben otra vez pero a la MITAD de opacidad: el color se
        // ve en toda la mitad inferior y el titular sigue sobre carbon.
        const PARADAS = [
            { x: 0.02, y: 1.10, r: 0.72, c: [222, 104,  48], a: 0.40 },  // terracota
            { x: 0.28, y: 1.20, r: 0.58, c: [172,  58, 112], a: 0.28 },  // magenta
            { x: 0.52, y: 1.16, r: 0.58, c: [134,  66, 196], a: 0.30 },  // violeta
            { x: 0.76, y: 1.22, r: 0.52, c: [ 58,  80, 190], a: 0.25 },  // azul
            { x: 0.97, y: 1.12, r: 0.54, c: [  0, 138, 126], a: 0.23 }   // teal
        ];
        const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

        const auroras = Array.from(auroraLienzos).map((lienzo) => {
            const ctx = lienzo.getContext('2d');
            // El pie es mucho mas bajo que el hero: sin este factor las
            // manchas quedarian fuera de cuadro y solo se veria negro.
            const alto = parseFloat(lienzo.dataset.alto) || 1;
            let w = 0, h = 0, raf = null;

            function medir() {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                w = Math.max(1, lienzo.offsetWidth);
                h = Math.max(1, lienzo.offsetHeight);
                lienzo.width = Math.round(w * dpr);
                lienzo.height = Math.round(h * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            function pintar(t) {
                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = '#121316';
                ctx.fillRect(0, 0, w, h);

                const d = Math.max(w, h);
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < PARADAS.length; i++) {
                    const p = PARADAS[i];
                    let dx = 0, dy = 0;
                    if (t) {
                        // Cada mancha con su propia fase: si compartieran
                        // una sola, se moverian en bloque y se notaria.
                        dx = Math.sin(t * 0.00021 + i * 1.7) * 0.055;
                        dy = Math.cos(t * 0.00017 + i * 2.3) * 0.035;
                    }
                    const cx = (p.x + dx) * w;
                    const cy = (p.y + dy) * h * alto;
                    const rr = p.r * d;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
                    const [r0, g0, b0] = p.c;
                    g.addColorStop(0,    `rgba(${r0},${g0},${b0},${p.a})`);
                    g.addColorStop(0.45, `rgba(${r0},${g0},${b0},${p.a * 0.36})`);
                    g.addColorStop(1,    `rgba(${r0},${g0},${b0},0)`);
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
            }

            function bucle(ms) {
                pintar(ms);
                raf = requestAnimationFrame(bucle);
            }

            medir();
            pintar(0);

            return {
                arrancar() { if (raf === null && !menosMovimiento.matches) raf = requestAnimationFrame(bucle); },
                parar()    { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } pintar(0); },
                remedir()  { medir(); pintar(0); }
            };
        });

        function refrescarAuroras() {
            auroras.forEach((a) => (menosMovimiento.matches ? a.parar() : a.arrancar()));
        }
        refrescarAuroras();
        menosMovimiento.addEventListener('change', refrescarAuroras);

        let idRedim = null;
        window.addEventListener('resize', () => {
            clearTimeout(idRedim);
            idRedim = setTimeout(() => {
                auroras.forEach((a) => a.remedir());
                refrescarAuroras();
            }, 120);
        });
    }
});
