# SEO / Search Console — albercabrera.com

## Migración WordPress → web nueva (Hostinger)

- Web anterior en WordPress sustituida por la web nueva de este proyecto,
  servida en Hostinger.
- Sitemaps viejos de WordPress (`sitemap_index.xml`, `page-sitemap.xml`)
  ya no existen (404) — es esperado, no es un error a arreglar.

## [12-jul-2026] Reenvío de sitemap.xml

- El `sitemap.xml` nuevo (`taller/Proyectos/miweb-premium/sitemap.xml`) está
  publicado y accesible en `https://albercabrera.com/sitemap.xml` (HTTP 200).
- Se reenvió en Search Console (antes daba "No se ha podido obtener" porque
  el archivo aún no estaba desplegado en el momento del primer intento).
- Se solicitó indexación manual de las páginas principales vía "Inspección
  de URLs" → "Solicitar indexación":
  - `https://albercabrera.com/`
  - `https://albercabrera.com/diagnostico-operativo/`
  - `https://albercabrera.com/negocio-depende-de-ti/`
  - `https://albercabrera.com/automatizar-leads-clinicas/`
  - `https://albercabrera.com/sistematizar-negocio-local/`
  - `https://albercabrera.com/sistematizar-centro-formacion/`
  - `https://albercabrera.com/blog/`
- **Nota:** `servicios.html` está fuera del sitemap a propósito (decisión
  de Alberto, no incluir en indexación).
- Estado al cerrar el paso: páginas "Descubiertas: actualmente sin indexar"
  (normal justo después de enviar sitemap nuevo). Pendiente de revisar en
  1-2 semanas si ya están indexadas; si alguna sigue sin indexar pasado ese
  plazo, investigar causa (no repetir solicitudes mientras tanto).
