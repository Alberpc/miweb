# _migracion/

## Qué es esto

`originales/` es una copia **congelada** del HTML, CSS y JS que tenía la
web antes de migrarla a Eleventy (23-ago-2026, rama de partida
`web-v2-reestructura-home`).

No es un respaldo cualquiera: es contra esto contra lo que compara
`verificar-migracion.py`. **No lo borres ni lo actualices.** Si se
actualiza, el verificador pasa a compararse consigo mismo y deja de
detectar nada — ya pasó una vez.

## Qué había aquí y ya no

`extraer.py` y `generar.py`, los scripts que trocearon el HTML original
en plantillas. Cumplieron su función y se han borrado a propósito:
regeneraban las páginas desde `originales/`, así que ejecutarlos hoy
**borraría todo el trabajo de diseño** hecho después de la migración.
Si alguna vez hicieran falta, están en el historial de git.
