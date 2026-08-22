# -*- coding: utf-8 -*-
"""Extrae de cada landing su contenido propio + frontmatter.
No inventa nada: todo lo que escribe sale del HTML actual."""
import io, os, re, json, sys

LANDINGS = [
    "automatizar-asesoria", "automatizar-inmobiliaria", "automatizar-leads-clinicas",
    "automatizar-mi-negocio", "negocio-depende-de-ti",
    "sistematizar-centro-formacion", "sistematizar-negocio-local",
]

def meta(html, attr, name):
    m = re.search(r'<meta\s+%s="%s"\s+content="(.*?)"\s*/?>' % (attr, re.escape(name)), html, re.S)
    return m.group(1) if m else None

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
    d["footerBlog"]    = '<li><a href="/blog/">Blog</a></li>' in pie
    return d

if __name__ == "__main__":
    for slug in LANDINGS:
        d = extraer(slug)
        print("%-32s title=%-3s desc=%-3s og:img=%-3s schemas=%d cuerpo=%5d ch inverse=%s blog=%s" % (
            slug, bool(d["title"]), bool(d["description"]), bool(d["ogImage"]),
            len(d["schemas"]), len(d["cuerpo"]), d["footerInverse"], d["footerBlog"]))
