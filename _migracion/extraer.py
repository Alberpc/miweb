# -*- coding: utf-8 -*-
"""Extrae de cada landing su contenido propio + frontmatter.
No inventa nada: todo lo que escribe sale del HTML actual."""
import io, os, re, json, sys

LANDINGS = [
    "automatizar-asesoria", "automatizar-inmobiliaria", "automatizar-leads-clinicas",
    "automatizar-mi-negocio", "negocio-depende-de-ti",
    "sistematizar-centro-formacion", "sistematizar-negocio-local",
]

# El indice del blog tiene la misma estructura (nav + cuerpo + pie) pero su
# propio CSS y su propio nav ("Blog" apunta a "/"), asi que se extrae igual
# pero con su layout y sus parametros.
OTRAS = ["blog"]

# Paginas legales: viven sueltas en la raiz (aviso-legal.html), no en
# carpeta, y tienen su propio layout. Solo se les extrae el titulo y el
# cuerpo; el resto del <head> es fijo y vive en legal.njk.
LEGALES = ["aviso-legal", "cookies", "politica-de-privacidad"]

# Paginas de conversion: cabecera reducida, CSS propio y su propio
# <script> al final. Comparten pie y bloque de consent+GTM.
# La clave es el slug; el valor, donde vive el HTML original.
CONVERSION = {
    "diagnostico-operativo": "diagnostico-operativo/index.html",
    "no-perder-clientes": "no-perder-clientes/index.html",
}

def meta(html, attr, name):
    m = re.search(r'<meta\s+%s="%s"\s+content="(.*?)"\s*/?>' % (attr, re.escape(name)), html, re.S)
    return m.group(1) if m else None

def script_final(html):
    """El <script> inline que va despues del pie, si lo hay."""
    fin = html.rindex("</footer>")
    m = re.search(r"    <script>\n(.*?)\n    </script>", html[fin:], re.S)
    return m.group(1) if m else None

def extraer_conversion(slug):
    """Pagina de conversion: cabecera reducida, CSS propio y script propio."""
    html = io.open(CONVERSION[slug], encoding='utf-8').read()
    d = {'slug': slug}
    d["title"] = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    d["description"]       = meta(html, "name", "description")
    d["robots"]            = meta(html, "name", "robots")
    d["themeColor"]        = meta(html, "name", "theme-color")
    d["ogType"]            = meta(html, "property", "og:type")
    d["ogTitle"]           = meta(html, "property", "og:title")
    d["ogDescription"]     = meta(html, "property", "og:description")
    d["ogImage"]           = meta(html, "property", "og:image")
    d["ogImageWidth"]      = meta(html, "property", "og:image:width")
    d["ogImageHeight"]     = meta(html, "property", "og:image:height")
    d["ogImageAlt"]        = meta(html, "property", "og:image:alt")
    d["twitterTitle"]      = meta(html, "name", "twitter:title")
    d["twitterDescription"]= meta(html, "name", "twitter:description")
    d["publicada"]         = meta(html, "property", "article:published_time")
    d["modificada"]        = meta(html, "property", "article:modified_time")
    m = re.search(r'<link rel="canonical" href="([^"]*)"', html)
    d["canonical"] = m.group(1) if m else None

    d["schemas"] = re.findall(
        r'<script type="application/ld\+json">\s*\n(.*?)\n\s*</script>', html, re.S)

    m = re.search(r'    <style>\n(.*?)\n    </style>', html, re.S)
    d["estilo"] = m.group(1) if m else None
    d["script"] = script_final(html)

    # Cuerpo: entre el cierre de la cabecera y el pie.
    ini = html.index("</nav>") + len("</nav>")
    fin = html.rindex("<footer")
    d["cuerpo"] = html[ini:fin].strip(chr(10))

    pie = html[fin:]
    d["footerInverse"]  = "footer-section inverse" in pie
    mb = re.search(r'<li><a href="([^"]*)">Blog</a></li>', pie)
    d["footerBlog"]     = bool(mb)
    d["footerBlogHref"] = mb.group(1) if mb else None
    md = re.search(r'<li><a href="([^"]*)">Diagn.stico DAI360</a></li>', pie)
    d["footerDai360Href"] = md.group(1) if md else None
    d["footerAgentesAut"] = "Agentes Aut" in pie
    return d

def extraer_legal(slug):
    """El cuerpo de una pagina legal: entre el cierre del nav y el pie."""
    html = io.open(slug + ".html", encoding="utf-8").read()
    d = {"slug": slug}
    d["title"] = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    d["robots"] = meta(html, "name", "robots")
    ini = html.index("</nav>") + len("</nav>")
    fin = html.rindex('<footer class="footer-section')
    d["cuerpo"] = html[ini:fin].strip(chr(10))
    return d

def extraer(slug):
    html = io.open(os.path.join(slug, "index.html"), encoding="utf-8").read()
    d = {"slug": slug}
    d["title"] = re.search(r"<title>(.*?)</title>", html, re.S).group(1)
    d["description"]    = meta(html, "name", "description")
    d["ogTitle"]        = meta(html, "property", "og:title")
    d["ogDescription"]  = meta(html, "property", "og:description")
    d["ogImage"]        = meta(html, "property", "og:image")
    d["ogType"]         = meta(html, "property", "og:type")
    d["twitterDescription"] = meta(html, "name", "twitter:description")
    d["twitterTitle"]   = meta(html, "name", "twitter:title")
    d["themeColor"]     = meta(html, "name", "theme-color")
    d["publicada"]      = meta(html, "property", "article:published_time")
    d["modificada"]     = meta(html, "property", "article:modified_time")

    # Bloque <style> propio de la pagina (el blog tiene el suyo)
    m = re.search(r"    <style>\n(.*?)\n    </style>", html, re.S)
    d["estilo"] = m.group(1) if m else None

    # Bloques JSON-LD, tal cual estan (se re-serializan indentados igual)
    d["schemas"] = re.findall(
        r'<script type="application/ld\+json">\s*\n(.*?)\n\s*</script>', html, re.S)

    # Cuerpo: desde el cierre del nav movil hasta el <footer> final
    ini = html.index('id="nav-mobile"')
    ini = html.index("</div>", ini) + len("</div>")
    fin = html.rindex('<footer class="footer-section')
    cuerpo = html[ini:fin]
    cuerpo = re.sub(r"\s*<!-- FOOTER -->\s*$", "\n", cuerpo)
    d["cuerpo"] = cuerpo.strip("\n")

    # Variantes del pie detectadas en el original
    pie = html[fin:]
    d["footerInverse"] = "footer-section inverse" in pie
    # Hay o no enlace "Blog" en el pie, apunte a donde apunte: /blog/ la
    # mayoria, "/" en la propia pagina del blog.
    mb = re.search(r'<li><a href="([^"]*)">Blog</a></li>', pie)
    d["footerBlog"]     = bool(mb)
    d["footerBlogHref"] = mb.group(1) if mb else None
    return d

if __name__ == "__main__":
    for slug in LANDINGS:
        d = extraer(slug)
        print("%-32s title=%-3s desc=%-3s og:img=%-3s schemas=%d cuerpo=%5d ch inverse=%s blog=%s" % (
            slug, bool(d["title"]), bool(d["description"]), bool(d["ogImage"]),
            len(d["schemas"]), len(d["cuerpo"]), d["footerInverse"], d["footerBlog"]))
