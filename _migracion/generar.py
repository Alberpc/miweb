# -*- coding: utf-8 -*-
"""Genera src/landings/*.njk a partir del HTML actual de cada landing.

Es reproducible: se puede volver a lanzar sobre los originales y debe dar
el mismo resultado. Verificar despues con verificar-migracion.py.
"""
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extraer import LANDINGS, OTRAS, extraer

# Reglas propias de una pagina que difieren del CSS comun. Se conservan
# como cssExtra en vez de unificarlas: son el aspecto real de la pagina hoy.
CSS_EXTRA = {
    "negocio-depende-de-ti":
        "/* Titular algo mas estrecho que el comun (20ch vs 22ch): era asi"
        " en el original, se conserva tal cual. */" "\n"
        ".article-hero.inverse h1 { max-width: 20ch; }",
}


# Paginas con layout propio. automatizar-mi-negocio no usa el sistema
# .inverse (colores oscuros en :root, cero clases "inverse"), asi que
# lleva su CSS aparte en vez de romperse con el comun.
LAYOUT = {
    "automatizar-mi-negocio": "landing-oscura.njk",
    "blog": "pagina.njk",
}

# Parametros sueltos que conservan como esta hoy la navegacion de una pagina.
# En /blog/ el enlace "Blog" apunta a "/" (tanto en el nav como en el pie).
# Se conserva; si es un fallo, se arregla aparte y a la vista.
EXTRA_FM = {
    # /blog/ hoy no declara el tamano de la og:image (las landings si).
    # Se conserva asi para que la migracion no cambie nada; anyadirlo es
    # una mejora aparte, no parte de este refactor.
    "blog": ['navBlogHref: "/"', "ogImageSize: false"],
}

CAMPOS = ("title", "description", "slug", "ogType", "ogTitle", "ogDescription",
          "twitterTitle", "twitterDescription", "themeColor", "ogImage",
          "publicada", "modificada")

def yaml_str(s):
    """Escapa un valor para YAML entre comillas dobles."""
    BS = chr(92)
    Q  = chr(34)
    return Q + s.replace(BS, BS + BS).replace(Q, BS + Q) + Q

def bloque_yaml(clave, texto, sangria="    "):
    """Escribe un valor multilinea como bloque literal YAML."""
    out = [clave + ": |"]
    for linea in texto.split(chr(10)):
        out.append(sangria + linea)
    return out

def main():
    for slug in LANDINGS + OTRAS:
        d = extraer(slug)
        layout = LAYOUT.get(slug, "landing.njk")
        fm = ["---", "layout: " + layout, "paginaActual: blog"]
        for k in CAMPOS:
            if d.get(k):
                fm.append("%s: %s" % (k, yaml_str(d[k])))
        if not d["footerInverse"]:
            fm.append("footerInverse: false")
        if not d["footerBlog"]:
            fm.append("footerBlog: false")
        elif d.get("footerBlogHref") and d["footerBlogHref"] != "/blog/":
            fm.append("footerBlogHref: " + yaml_str(d["footerBlogHref"]))
        for linea in EXTRA_FM.get(slug, []):
            fm.append(linea)
        if d.get("estilo") and slug in OTRAS:
            fm += bloque_yaml("cssPagina", d["estilo"], "")
        if slug in CSS_EXTRA:
            fm += bloque_yaml("cssExtra", CSS_EXTRA[slug], "        ")
        if d["schemas"]:
            fm.append("schemas:")
            for bloque in d["schemas"]:
                fm.append("  - |")
                for linea in bloque.split(chr(10)):
                    fm.append("    " + linea)
        fm.append("---")
        salida = chr(10).join(fm) + chr(10) + d["cuerpo"] + chr(10)
        ruta = os.path.join("src", "landings", slug + ".njk")
        io.open(ruta, "w", encoding="utf-8", newline=chr(10)).write(salida)
        print("escrito %-45s %6d bytes" % (ruta, len(salida.encode("utf-8"))))

if __name__ == "__main__":
    main()
