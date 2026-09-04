/* ============================================================
   riel-entregas.js — la linea del tiempo de "Que te llevas".

   [3-sep-2026 v6] La seccion pasa de 4 filas alternando lado (cada
   una con un punto SVG girando en bucle infinito) a una linea del
   tiempo: todo a un lado, una linea que se llena de naranja segun se
   baja y un nodo por entrega que se enciende cuando la linea lo
   alcanza.

   Es el MISMO mecanismo que el riel de "Como trabajo" en la home
   (index.js:38): cabeza de lectura al 50% de la pantalla, rAF
   coalescido, y si hay prefers-reduced-motion se deja el estado final
   sin el viaje. No se inventa un sistema nuevo — el sitio habla un
   solo idioma.

   El avance se mide contra los NODOS y no contra la seccion entera
   para que la linea y los puntos no puedan desincronizarse: son el
   mismo calculo.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const riel = document.querySelector('[data-riel]');
    if (!riel) return;

    const nodos = Array.from(riel.querySelectorAll('.entrega'));
    if (!nodos.length) return;

    /* El tramo que cruza de la ultima entrega al bloque del precio.
       El riel vive dentro de .entregas y moria ahi: la linea se
       cortaba y la bola del precio quedaba flotando sin nada que la
       uniera. Este tramo se pinta con su propio avance, medido con la
       misma cabeza de lectura. */
    const puente = document.querySelector('.entregas-puente');

    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    let raf = null;

    /* Coloca cada punto a la altura del TITULAR de su entrega, no a
       media altura del bloque: con la pieza visual debajo, el centro
       caeria en mitad del diagrama y el punto no senyalaria nada. Se
       mide en vez de fijarlo en el CSS para que siga cuadrando si un
       titular ocupa dos lineas o cambia la tipografia. */
    function alinearMarcas() {
        nodos.forEach((entrega) => {
            const titulo = entrega.querySelector('.entrega-texto h3');
            if (!titulo) return;
            const y = titulo.offsetTop + titulo.offsetHeight / 2;
            entrega.style.setProperty('--marca-y', y + 'px');
        });
    }

    function pintar() {
        raf = null;

        const cabeza = window.innerHeight * 0.5;
        const cajaRiel = riel.getBoundingClientRect();

        /* Posicion de cada nodo. Se lee del PUNTO y no del bloque,
           porque el punto es lo que el ojo ve encenderse. */
        const marcas = nodos.map((entrega) => {
            const marca = entrega.querySelector('.entrega-marca');
            const caja = (marca || entrega).getBoundingClientRect();
            return {
                entrega: entrega,
                enPantalla: caja.top + caja.height / 2,
                enRiel: caja.top + caja.height / 2 - cajaRiel.top
            };
        });

        const primero = marcas[0];
        const ultimo = marcas[marcas.length - 1];
        const alto = cajaRiel.height || 1;

        /* Cuanto ha recorrido la cabeza de lectura entre el primer
           nodo y el ultimo, de 0 a 1. */
        const recorrido = ultimo.enPantalla - primero.enPantalla;
        let t = recorrido > 0 ? (cabeza - primero.enPantalla) / recorrido : 0;
        t = Math.min(1, Math.max(0, t));

        /* De ahi al alto real de la linea: se traduce a la posicion
           del nodo correspondiente para que el frente naranja muera
           justo en un punto y no a media altura entre dos. Pasado el
           ultimo nodo sigue hasta el final de la linea, o ese tramo se
           quedaria gris y la linea se veria cortada en dos. */
        let avance;
        if (t < 1) {
            avance = (primero.enRiel + (ultimo.enRiel - primero.enRiel) * t) / alto;
        } else {
            const restante = alto - ultimo.enRiel;
            const ya = cabeza - ultimo.enPantalla;
            const t2 = restante > 0 ? Math.min(1, Math.max(0, ya / restante)) : 1;
            avance = (ultimo.enRiel + restante * t2) / alto;
        }

        riel.style.setProperty('--riel-avance', avance.toFixed(4));

        /* Un nodo se enciende cuando el frente ya lo ha pasado. */
        const frente = avance * alto;
        marcas.forEach((m) => {
            m.entrega.classList.toggle('riel-alcanzado', frente >= m.enRiel - 1);
        });

        /* El puente arranca cuando el riel ya esta lleno: solo entonces
           tiene sentido que la linea siga bajando hacia el precio. */
        if (puente) {
            const cajaP = puente.getBoundingClientRect();
            const t3 = cajaP.height > 0
                ? (cabeza - cajaP.top) / cajaP.height
                : 0;
            puente.style.setProperty('--puente-avance',
                Math.min(1, Math.max(0, t3)).toFixed(4));
        }
    }

    function pedir() {
        if (raf === null) raf = requestAnimationFrame(pintar);
    }

    alinearMarcas();

    if (sinMovimiento.matches) {
        /* Sin movimiento: la linea aparece entera y los puntos
           encendidos. Se mantiene el resultado, se quita el viaje. */
        riel.style.setProperty('--riel-avance', '1');
        nodos.forEach((e) => e.classList.add('riel-alcanzado'));
        if (puente) puente.style.setProperty('--puente-avance', '1');
        return;
    }

    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', () => { alinearMarcas(); pedir(); });
    pintar();

    /* Las fuentes de Google llegan despues del primer pintado y
       cambian el alto de los titulares: hay que remedir o los puntos
       quedan desplazados respecto a su entrega. */
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => { alinearMarcas(); pedir(); });
    }
});
