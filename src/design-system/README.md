# Sistema de diseño — albercabrera.com

Fuente de verdad del color del sitio. Los valores viven en
`design-system/tokens.css`; este documento explica el porqué y las reglas
de uso.

---

## 1. Dirección de marca

**Cuerpo claro, hero y footer oscuros, cobalto como único color de marca.**

### Por qué cobalto

Es el color de la fiabilidad y la competencia técnica sin caer en el azul
corporativo genérico. El cliente compra un sistema que no entiende
técnicamente y tiene que confiar en que no le va a romper el negocio: el
cobalto compra esa confianza antes de que lea una palabra.

### Por qué no hay color de acento

Se evaluaron y descartaron tres:

- **Cian** — lo usa la mayoría de webs del sector IA. Parecerse a todas
  las demás contradice la promesa de la marca.
- **Lima eléctrico** — proyecta startup y gaming.
- **Naranja** — proyecta urgencia y descuento, contrario a un
  posicionamiento consultivo.

Sobre fondo claro el cobalto ya destaca lo suficiente. Un solo color es
mejor marca que dos.

### Por qué el cuerpo va en claro

La audiencia son dueños de pymes de servicios, 40-55 años, mayoría en
móvil y a plena luz. El sitio tiene bloques de lectura larga (FAQ,
"Sobre mí", descripciones de servicio) que son exactamente donde se
resuelven las objeciones y se decide la venta. En oscuro esos bloques
cansan al doble. Además, el fondo claro se percibe como más transparente
en sectores donde el cliente arriesga dinero sin dominar la tecnología.

### Por qué el hero sigue oscuro

Conserva el impacto visual y el vídeo de fondo, y hace que la página abra
y cierre igual con el cuerpo claro en medio. El contraste hero → cuerpo
es intencional: marca el paso de "impresión" a "lectura".

---

## 2. Reglas de uso

Estas reglas no son estéticas: cada una evita un fallo concreto de
contraste o de jerarquía.

1. **Ningún valor de color literal fuera de `tokens.css`.** Ni en CSS, ni
   inline en HTML, ni en SVG.
2. **Ninguna página define su propio `:root` de color.** Si una zona
   necesita fondo oscuro, se le pone `class="inverse"`. Un `:root`
   paralelo por página es lo que produjo la incoherencia actual.
3. **El tono de cobalto depende del fondo.** Sobre claro: `--cobalt-600`
   para relleno y `--cobalt-700` para texto. Sobre oscuro:
   `--cobalt-500` para relleno y `--cobalt-300` para texto. El saturado
   sobre negro da 3.21:1 y solo vale para texto muy grande.
4. **`--ink-decor` y `--cobalt-400` nunca en texto.** Solo bordes,
   puntos, iconos decorativos y scrollbar.
5. **Un solo CTA de color pleno por pantalla.** El resto en variante
   fantasma (borde + texto). Si el botón de marca aparece cuatro veces
   en una vista, deja de significar nada.
6. **Foco visible obligatorio** en todo elemento interactivo. Es el
   punto donde más webs suspenden AA y es una línea de código.
7. **Mínimo WCAG 2.1 AA:** 4.5:1 texto normal, 3:1 texto ≥24px y
   componentes de interfaz.
8. **Overlay de vídeo en `rgba(14,17,22,…)`**, nunca negro puro.

---

## 3. Mapa de aplicación

| Zona | Fondo | Texto principal | Acción |
|---|---|---|---|
| Hero | `--night-900` (`.inverse`) | `--on-night` | `--cobalt-500` |
| Secciones impares | `--bg` | `--ink` | `--cobalt-600` |
| Secciones pares | `--bg-alt` | `--ink` | `--cobalt-600` |
| Tarjetas | `--bg` + `--line` | `--ink` | — |
| Inputs | `--bg-input` + `--line-strong` | `--ink` | foco `--cobalt-600` |
| Footer | `--night-900` (`.inverse`) | `--on-night` | — |

Eyebrows y etiquetas de sección: `--cobalt-600` en claro,
`--cobalt-300` en oscuro.

---

## 4. Estado del sitio antes de la migración

Conviven dos sistemas incompatibles:

| Zona | Fondo actual | Origen |
|---|---|---|
| Home `/` | Oscuro `#070708` | Migración parcial desde el tema dorado |
| Landing `/no-perder-clientes/` | Claro cálido `#fbfaf8` | Diseñada aparte, sin publicar |
| Footers | `#171614` | Resto del tema dorado |

La landing **no está publicada**: es el banco de pruebas donde se validó
esta paleta antes de tocar el resto.

### Deuda técnica confirmada

| Problema | Ratio | Impacto |
|---|---|---|
| `--ink-faint: #a3a099` usado como texto | **2.50:1** | Suspende AA. Afecta al microcopy del hero, `.beneficio p`, `.auto-nota` |
| `--cobalt: #3b5eff` | 4.76 texto / 4.96 botón | Pasa raspando y vibra sobre base cálida |
| Verde `#1a8a4c` | **4.21:1** | Suspende AA |
| Rojo de error `#d43737` | 4.57:1 | Al límite, en validación de formulario |
| `.faq:hover { border-color: rgba(255,255,255,0.12) }` | — | Resto del tema oscuro: invisible sobre claro. El hover del FAQ no hace nada hoy |
| `.subfooter { border-top: rgba(255,255,255,0.05) }` | — | Mismo caso |
| Opacidades sueltas en footer (`rgba(246,245,242,0.4)`) | — | Sin contraste medido; el copyright queda al límite |
| `<meta name="theme-color">` | — | Inconsistente entre páginas |

---

## 5. Fuera de alcance

- **Tipografía.** El Cormorant Garamond en titulares se eligió para
  acompañar al dorado y ya no encaja. Decisión pendiente, aparte.
- **Copy y estructura de secciones.**
- **Layout.**

---

## 6. Activos que hay que revisar

- **Logos de cliente** en versión blanca (Mafhesa, Top Boutique, GEKO,
  Bioresina): invisibles si su franja pasa a fondo claro. Necesitan
  versión en positivo, o esa franja se marca como `.inverse`.
- **Logo de la nav**: es un PNG blanco con `filter: invert(1)`.
  Funciona sobre claro; sobre el hero oscuro queda negro sobre negro.
- **Botón flotante de WhatsApp**: sobre cuerpo claro competirá
  directamente con el CTA de cobalto. Valorar quitarle peso.
