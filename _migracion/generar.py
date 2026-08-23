# -*- coding: utf-8 -*-
"""Genera src/landings/*.njk a partir del HTML actual de cada landing.

Es reproducible: se puede volver a lanzar sobre los originales y debe dar
el mismo resultado. Verificar despues con verificar-migracion.py.
"""
import io, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from extraer import (LANDINGS, OTRAS, LEGALES, CONVERSION,
                     extraer, extraer_legal, extraer_conversion)

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

def main_legales():
    """Las legales van sueltas en la raiz: /aviso-legal.html, no carpeta.
    Se conserva esa ruta exacta para no romper los enlaces del pie."""
    for slug in LEGALES:
        d = extraer_legal(slug)
        fm = ["---", "layout: legal.njk",
              "title: " + yaml_str(d["title"]),
              "permalink: " + yaml_str("/" + slug + ".html")]
        if d.get("robots"):
            fm.append("robots: " + yaml_str(d["robots"]))
        fm.append("---")
        salida = chr(10).join(fm) + chr(10) + d["cuerpo"] + chr(10)
        ruta = os.path.join("src", "paginas", slug + ".njk")
        io.open(ruta, "w", encoding="utf-8", newline=chr(10)).write(salida)
        print("escrito %-45s %6d bytes" % (ruta, len(salida.encode("utf-8"))))


# Cabecera reducida: los textos y destinos que tiene hoy cada pagina.
NAV_MINIMA = {
    "diagnostico-operativo": ["navMinima: true", 'volverTexto: "Inicio"',
                  'ctaHref: "/#contacto"', 'ctaTexto: "Pedir mi diagnóstico"'],
    "no-perder-clientes": ["navMinima: true", "logoEnlazado: false",
                  'ctaHref: "#cierre"', 'ctaTexto: "Pide tu llamada"',
                  'ctaData: "cta_nav"'],
}

# Paginas con pie propio (otro copy, no una variante del comun).
PIE_PROPIO = {}

# Donde escribe cada pagina de conversion (se conserva la URL de hoy).
PERMALINK_CONV = {
    "diagnostico-operativo": "/diagnostico-operativo/index.html",
    "no-perder-clientes": "/no-perder-clientes/index.html",
}

def main_conversion():
    for slug in CONVERSION:
        d = extraer_conversion(slug)
        fm = ["---", "layout: pagina.njk",
              "permalink: " + yaml_str(PERMALINK_CONV[slug])]
        for k in CAMPOS:
            if d.get(k):
                fm.append("%s: %s" % (k, yaml_str(d[k])))
        if not d.get("ogImageWidth"):
            fm.append("ogImageSize: false")
        else:
            if d["ogImageWidth"] != "1200":
                fm.append("ogImageWidth: " + yaml_str(d["ogImageWidth"]))
            if d["ogImageHeight"] != "675":
                fm.append("ogImageHeight: " + yaml_str(d["ogImageHeight"]))
        if d.get("ogImageAlt"):
            fm.append("ogImageAlt: " + yaml_str(d["ogImageAlt"]))
        for k in ("robots", "canonical"):
            if d.get(k):
                fm.append("%s: %s" % (k, yaml_str(d[k])))
        fm += NAV_MINIMA[slug]
        # Con cabecera reducida no hay burger ni .reveal gestionado por
        # base.js: estas paginas traen su propio <script>. Cargar base.js
        # seria anyadirles codigo que hoy no tienen.
        fm.append("baseJs: false")
        if slug in PIE_PROPIO:
            fm.append("pie: " + yaml_str(PIE_PROPIO[slug]))
        if not d["footerInverse"]:
            fm.append("footerInverse: false")
        if not d["footerBlog"]:
            fm.append("footerBlog: false")
        elif d.get("footerBlogHref") and d["footerBlogHref"] != "/blog/":
            fm.append("footerBlogHref: " + yaml_str(d["footerBlogHref"]))
        if d.get("footerDai360Href") and d["footerDai360Href"] != "/diagnostico-operativo/":
            fm.append("footerDai360Href: " + yaml_str(d["footerDai360Href"]))
        if not d["footerAgentesAut"]:
            fm.append("footerAgentesAut: false")
        if d.get("estilo"):
            fm += bloque_yaml("cssPagina", d["estilo"], "")
        if d.get("script"):
            fm += bloque_yaml("jsPagina", d["script"], "")
        if d["schemas"]:
            fm.append("schemas:")
            for bloque in d["schemas"]:
                fm.append("  - |")
                for linea in bloque.split(chr(10)):
                    fm.append("    " + linea)
        fm.append("---")
        salida = chr(10).join(fm) + chr(10) + d["cuerpo"] + chr(10)
        ruta = os.path.join("src", "paginas", slug + ".njk")
        io.open(ruta, "w", encoding="utf-8", newline=chr(10)).write(salida)
        print("escrito %-45s %6d bytes" % (ruta, len(salida.encode("utf-8"))))

if __name__ == "__main__":
    main()
    main_legales()
    main_conversion()
