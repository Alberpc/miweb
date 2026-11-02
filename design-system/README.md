# Sistema de diseño — contravía × Refero

Rama `feat/rebrand-contravia-refero` (2-nov-2026). Sustituye al sistema
anterior (cobalto/terracota, Bricolage Grotesque), que sigue en git.

Dos fuentes:

- **Marca** (NOI, 15-oct-2026): negro `#1D1D1B`, crema `#FFFDEB`, menta
  `#08FFAB`. Hepta Slab para titulares, Geist para cuerpo, IBM Plex Mono
  para rótulos. Logo "partido": *contravía* cortado por arriba y
  *alber cabrera* debajo, en texto (`_includes/logo.njk`).
- **Lenguaje visual**: la Variante 01 sacada de Refero
  (`mi-universo/taller/Proyectos/miweb-premium-variante/DIRECCION.md`):
  Exo Ape (tipografía grande y fina, composición asimétrica, radio 0,
  CTAs delineadas), Linear (demos sobre negro), Superlative (imagen de
  objeto y pequeños indicadores de color).

## Archivos

| Archivo | Qué hace |
|---|---|
| `tokens.css` | Color, tipo, espacio, radios. Los nombres heredados (`--cobalt-*`, `--night-*`) son el contrato que usa el CSS de cada página. |
| `css/nav.css`, `css/pie.css`, `css/botones.css` | Cabecera, pie y botones comunes. |
| `index.css` + `index.js` | La home, reescrita desde cero. |
| `css/sistema.css` | Se carga la última en todas las páginas interiores y aplica las reglas de abajo sobre su HTML existente (servicios, diagnóstico, landings, blog, legales). |

## Reglas

1. **Menta = señal y acción.** Botón primario sobre negro, puntos de
   estado de 8px, cifras destacadas. Nunca texto sobre crema (1,3:1);
   ahí el acento de texto es `--cobalt-700`.
2. **Radio 0** en todo lo editorial. 6px (`--radius-ui`) solo en piezas
   que imitan una interfaz (demos, paneles de ejemplo).
3. **Sin cajas**: las piezas se separan con una línea fina arriba
   (`1px --ink`) o entre filas (`1px --line`). Sin sombras ni degradados.
4. **Cabecera de sección asimétrica**: rótulo en mono a la izquierda
   (1fr), titular a la derecha (2.15fr). Todo alineado a la izquierda.
5. **Titulares** en Hepta Slab 400, apretados (`-0.035em` a `-0.045em`).
   El 800/900 se reserva al logo, a cifras y a precios.
6. **Ninguna palabra del titular en otro color.**
7. **Cada sección con composición propia**: no repetir la misma rejilla
   de tarjetas en dos secciones seguidas.
8. **Cierre en negro liso** con titular grande; sin aurora.
9. Movimiento: entrada por líneas en el hero, reveal suave, parallax leve.
   Botón para pausarlo y respeto a `prefers-reduced-motion`.

## Pendiente

- Copy: se mantuvo el de la web anterior; se revisa aparte.
- `diagnostico/index.html` (landing noindex autónoma) sigue con su
  estilo propio.
- Las hojas de cada página aún contienen reglas del sistema anterior que
  `sistema.css` anula. Cuando el diseño se dé por bueno, conviene
  limpiarlas página a página y bajar `sistema.css`.
