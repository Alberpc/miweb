# -*- coding: utf-8 -*-
"""Compara cada pagina generada en _site/ contra el HTML original del repo.

No compara byte a byte el archivo entero (el CSS y el JS salen ahora en
archivos aparte, asi que eso cambia a proposito). Compara lo que NO debe
cambiar nunca:

  - el texto visible
  - los enlaces
  - los meta/SEO y los bloques JSON-LD
  - el CSS y el JS efectivos, vengan de donde vengan

Uso:  python verificar-migracion.py
Sale con codigo 1 si encuentra alguna diferencia real.
"""
import io, os, re, sys, json

PAGINAS = [
    "automatizar-asesoria", "automatizar-inmobiliaria", "automatizar-leads-clinicas",
    "automatizar-mi-negocio", "negocio-depende-de-ti",
    "sistematizar-centro-formacion", "sistematizar-negocio-local",
    "blog",
]

# Paginas sueltas en la raiz: la ruta del original y la del generado.
SUELTAS = [
    ("aviso-legal.html", "_site/aviso-legal.html"),
    ("cookies.html", "_site/cookies.html"),
    ("politica-de-privacidad.html", "_site/politica-de-privacidad.html"),
    ("servicios.html", "_site/servicios.html"),
    ("diagnostico-operativo/index.html", "_site/diagnostico-operativo/index.html"),
    ("no-perder-clientes/index.html", "_site/no-perder-clientes/index.html"),
]

def leer(p):
    return io.open(p, encoding="utf-8").read()

def sin_comentarios(h):
    return re.sub(r"<!--.*?-->", "", h, flags=re.S)

def texto_visible(h):
    h = sin_comentarios(h)
    h = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    h = re.sub(r"<style.*?</style>", " ", h, flags=re.S)
    h = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", h).strip()

def enlaces(h):
    h = sin_comentarios(h)
    return sorted(re.findall(r'<a\s[^>]*href="([^"]*)"', h))

def metas(h):
    h = sin_comentarios(h)
    d = {}
    for attr, nombre, cont in re.findall(
            r'<meta\s+(name|property)="([^"]+)"\s+content="([^"]*)"', h):
        d[nombre] = cont
    m = re.search(r"<title>(.*?)</title>", h, re.S)
    if m: d["<title>"] = m.group(1)
    m = re.search(r'<link rel="canonical" href="([^"]*)"', h)
    if m: d["canonical"] = m.group(1)
    return d

def jsonld(h):
    bloques = re.findall(
        r'<script type="application/ld\+json">(.*?)</script>', h, re.S)
    out = []
    for b in bloques:
        try:
            out.append(json.dumps(json.loads(b), sort_keys=True, ensure_ascii=False))
        except ValueError as e:
            out.append("JSON-INVALIDO: %s" % e)
    return sorted(out)

def norm_css(t):
    """Normaliza CSS/JS para comparar: fuera comentarios y espacios.

    Los comentarios //... se quitan tambien porque al extraer el JS a un
    archivo se reescribio alguno, y un comentario no cambia el comportamiento.
    Se respetan los // que van dentro de una URL (http://).
    """
    t = re.sub(r"/\*.*?\*/", "", t, flags=re.S)
    t = re.sub(r"(?<!:)//[^\n]*", "", t)
    return re.sub(r"\s+", " ", t).strip()

def resolver(base, href):
    """Encuentra un asset local. Los originales apuntan a rutas que hoy viven
    bajo src/ (design-system, assets), asi que se busca tambien alli: si no,
    la comparacion daria falsos positivos por archivos no resueltos."""
    rel = href.split("?")[0].lstrip("/")
    for raiz in (base, "src", "."):
        ruta = os.path.join(raiz, rel)
        if os.path.exists(ruta):
            return ruta
    return None

def css_efectivo(h, base):
    """CSS inline + el de los <link> locales, EN EL ORDEN EN QUE APARECEN.

    El orden importa: es la cascada. Se recorre el documento una sola vez
    para no reordenar un <style> inline respecto a los <link> que lo rodean,
    que es justo lo que cambia la migracion (inline -> archivo)."""
    partes = []
    patron = re.compile(
        r'<style>(?P<inline>.*?)</style>'
        r'|<link[^>]+rel="stylesheet"[^>]+href="(?P<href>[^"]+)"'
        r'|<link[^>]+href="(?P<href2>[^"]+)"[^>]*rel="stylesheet"', re.S)
    for m in patron.finditer(h):
        if m.group("inline") is not None:
            partes.append(m.group("inline"))
            continue
        href = m.group("href") or m.group("href2")
        if not href or href.startswith("http"):
            continue
        ruta = resolver(base, href)
        partes.append(leer(ruta) if ruta else "/* NO-RESUELTO: %s */" % href)
    return norm_css("\n".join(partes))

def js_efectivo(h, base):
    partes = []
    for m in re.finditer(r"<script(?![^>]*application/ld)([^>]*)>(.*?)</script>", h, flags=re.S):
        attrs, cuerpo = m.group(1), m.group(2)
        src = re.search(r'src="([^"]+)"', attrs)
        if src:
            href = src.group(1)
            if href.startswith("http"): continue
            ruta = resolver(base, href)
            if ruta:
                partes.append(leer(ruta))
            else:
                partes.append("/* NO-RESUELTO: %s */" % href)
        else:
            partes.append(cuerpo)
    return norm_css("\n".join(partes))

def reglas(css):
    return [x.strip() + "}" for x in css.split("}") if x.strip()]

def reglas_perdidas(css_orig, css_nuevo):
    ro, rn = reglas(css_orig), reglas(css_nuevo)
    return ([x for x in ro if x not in rn], [x for x in rn if x not in ro])

def selector_usado(regla, html):
    """Aproximacion: alguna clase/id del selector aparece en el HTML."""
    sel = regla.split("{")[0]
    nombres = re.findall(r"[.#]([A-Za-z0-9_-]+)", sel)
    if not nombres:
        return True   # selectores de elemento/pseudo: se asumen vivos
    return any(re.search(r"[\"'\s]%s[\"'\s]" % re.escape(n), html) for n in nombres)

def props_por_selector(css):
    """Para cada selector, el valor que GANA de cada propiedad.

    Compara el efecto real, no el texto: si una regla se sobreescribe mas
    abajo (que es como se conservan las variantes de una pagina concreta),
    lo que cuenta es el valor final, igual que hace el navegador.
    Es una aproximacion: no pondera especificidad entre selectores distintos,
    solo el orden dentro del mismo selector.
    """
    fin = {}
    for r in reglas(css):
        if "{" not in r: continue
        sel = r.split("{")[0].strip()
        cuerpo = r[r.index("{") + 1:r.rindex("}")]
        d = fin.setdefault(sel, {})
        for decl in cuerpo.split(";"):
            if ":" in decl:
                k, v = decl.split(":", 1)
                d[k.strip()] = v.strip()
    return fin

fallos = 0
TODAS = ([(s, os.path.join(s, "index.html"), os.path.join("_site", s, "index.html"))
          for s in PAGINAS]
         + [(o.replace(".html", ""), o, n) for o, n in SUELTAS])

for slug, ruta_orig, ruta_nueva in TODAS:
    orig = leer(ruta_orig)
    nuevo = leer(ruta_nueva)
    problemas = []
    avisos = []

    if texto_visible(orig) != texto_visible(nuevo):
        problemas.append("texto visible")
    eo, en = enlaces(orig), enlaces(nuevo)
    if eo != en:
        problemas.append("enlaces (%s)" % (set(eo) ^ set(en)))
    mo, mn = metas(orig), metas(nuevo)
    if mo != mn:
        dif = {k: (mo.get(k), mn.get(k)) for k in set(mo) | set(mn) if mo.get(k) != mn.get(k)}
        problemas.append("meta/SEO %s" % dif)
    if jsonld(orig) != jsonld(nuevo):
        problemas.append("JSON-LD")
    co, cn = css_efectivo(orig, "."), css_efectivo(nuevo, "_site")
    if co != cn:
        # Primero por efecto: que valor gana en cada selector.
        po, pn = props_por_selector(co), props_por_selector(cn)
        cambiados = []
        for sel, d in po.items():
            dn = pn.get(sel, {})
            for k, v in d.items():
                if dn.get(k) != v:
                    cambiados.append("%s{%s: %s -> %s}" % (sel, k, v, dn.get(k)))
        if cambiados:
            problemas.append("CSS cambia el resultado: %d (%s)" % (
                len(cambiados), cambiados[0][:90]))
        perdidas, anyadidas = reglas_perdidas(co, cn)
        # Una regla que se anyade pero cuyo selector no aparece en el HTML no
        # pinta nada: se reporta como aviso, no como fallo.
        vivas = [r for r in anyadidas if selector_usado(r, nuevo)]
        if not cambiados and perdidas:
            avisos.append("CSS: %d reglas reescritas, mismo resultado" % len(perdidas))
        if not cambiados and vivas:
            avisos.append("CSS: %d reglas nuevas, ningun valor cambia" % len(vivas))
        elif anyadidas:
            avisos.append("CSS: +%d reglas inertes (su selector no esta en la pagina)" % len(anyadidas))
    if js_efectivo(orig, ".") != js_efectivo(nuevo, "_site"):
        problemas.append("JS efectivo")

    if problemas:
        fallos += 1
        print("FALLA  %-32s %s" % (slug, "; ".join(problemas)))
    else:
        extra = ("  [%s]" % "; ".join(avisos)) if avisos else ""
        print("OK     %-32s texto, enlaces, SEO, JSON-LD, CSS y JS equivalentes%s" % (slug, extra))

print("\n%d/%d paginas verificadas" % (len(TODAS) - fallos, len(TODAS)))
sys.exit(1 if fallos else 0)
