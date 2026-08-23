# -*- coding: utf-8 -*-
"""Compara cada pagina generada contra el HTML original del repo.

No compara byte a byte el archivo entero (el CSS y el JS salen ahora en
archivos aparte, asi que eso cambia a proposito). Compara lo que NO debe
cambiar nunca:

  - el texto visible
  - los enlaces
  - los meta/SEO y los bloques JSON-LD
  - el CSS y el JS efectivos, vengan de donde vengan

El HTML de referencia es la copia congelada en _migracion/originales/,
no la raiz del repo: desde que Eleventy compila ahi, la raiz ES el
resultado, y compararla consigo misma no probaria nada.

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

# Donde escribe Eleventy. Se compila a la raiz del repo para que el deploy
# de Hostinger (que sube la raiz) siga funcionando sin tocar su panel.
SALIDA = "."

# Paginas sueltas en la raiz (mismo nombre en el original y en lo generado).
SUELTAS = [
    "aviso-legal.html",
    "cookies.html",
    "politica-de-privacidad.html",
    "diagnostico-operativo/index.html",
    "no-perder-clientes/index.html",
    "index.html",
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

# --- Cambios de diseno hechos a proposito -------------------------------
# El verificador nacio para probar que la migracion no cambiaba NADA. Desde
# que ademas se retoca el diseno, hay cambios que si son queridos: se listan
# aqui para que no se confundan con una regresion. Si un cambio no esta en
# esta lista, sigue saltando como fallo.
CAMBIOS_QUERIDOS = {
    # 23-ago. Los posts no heredaban el sistema Bosque Inteligente: seguian
    # con Inter grueso en los titulares y un boton pildora. Paso 5 del spec.
    #
    # Titulares a Instrument Serif (--font-display), peso 400: la serif no
    # necesita los 700/800 que llevaba Inter.
    ".article-hero.inverse h1": {"font-family"},
    ".prose h2":                {"font-family", "font-weight"},
    ".prose h3":                {"font-family"},
    ".related h2":              {"font-family", "font-weight"},
    ".related-card h3":         {"font-family"},
    ".faq-head h2":             {"font-family", "font-weight"},
    ".cta-card h2":             {"font-family", "font-weight"},
    # La seccion del CTA deja de ser .inverse: iban tres franjas verdes
    # seguidas (CTA + pie) y se leian como un solo bloque.
    ".cta-final.inverse":       {"padding"},
    ".cta-card":                {"background", "border", "border-radius", "box-shadow"},
    # El boton pasa a ser el mismo que .btn-primary de la home: radio 8px
    # (el sistema prohibe la pildora) y texto oscuro sobre el dorado.
    ".cta-card .btn-main":      {"font-size", "color", "background", "padding",
                                 "border-radius", "transition"},
    ".cta-card .btn-main:hover": {"transform", "background", "box-shadow"},
}

def es_querido(cambio):
    sel = cambio.split("{")[0].strip()
    prop = cambio.split("{", 1)[1].split(":", 1)[0].strip() if "{" in cambio else ""
    return prop in CAMBIOS_QUERIDOS.get(sel, set())


fallos = 0
# De donde sale cada lado de la comparacion.
ORIG = os.path.join("_migracion", "originales")   # el HTML de antes, congelado
NUEVO = SALIDA                                     # lo que genera Eleventy hoy

TODAS = ([(s, os.path.join(ORIG, s, "index.html"),
           os.path.join(NUEVO, s, "index.html")) for s in PAGINAS]
         + [(o.replace(".html", ""), os.path.join(ORIG, o),
             os.path.join(NUEVO, o)) for o in SUELTAS])

for slug, ruta_orig, ruta_nueva in TODAS:
    orig = leer(ruta_orig)
    nuevo = leer(ruta_nueva)
    problemas = []
    avisos = []

    to, tn = texto_visible(orig), texto_visible(nuevo)
    if to != tn:
        # Mismas palabras en otro orden no es perdida de contenido. Pasa en
        # /blog/: las tarjetas ahora salen de la coleccion ordenada por fecha,
        # asi que el post mas nuevo subio al primer puesto. Se avisa, no falla.
        if sorted(to.split()) == sorted(tn.split()):
            avisos.append("texto reordenado, ni una palabra distinta")
        else:
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
    co, cn = css_efectivo(orig, ORIG), css_efectivo(nuevo, NUEVO)
    if co != cn:
        # Primero por efecto: que valor gana en cada selector.
        po, pn = props_por_selector(co), props_por_selector(cn)
        cambiados = []
        for sel, d in po.items():
            dn = pn.get(sel, {})
            for k, v in d.items():
                if dn.get(k) != v:
                    cambiados.append("%s{%s: %s -> %s}" % (sel, k, v, dn.get(k)))
        queridos = [c for c in cambiados if es_querido(c)]
        cambiados = [c for c in cambiados if not es_querido(c)]
        if queridos:
            avisos.append("CSS: %d cambio(s) de diseno a proposito (%s)" % (
                len(queridos), queridos[0].split("{")[0]))
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
    if js_efectivo(orig, ORIG) != js_efectivo(nuevo, NUEVO):
        problemas.append("JS efectivo")

    if problemas:
        fallos += 1
        print("FALLA  %-32s %s" % (slug, "; ".join(problemas)))
    else:
        extra = ("  [%s]" % "; ".join(avisos)) if avisos else ""
        print("OK     %-32s texto, enlaces, SEO, JSON-LD, CSS y JS equivalentes%s" % (slug, extra))

# --- Paginas que aparecen de la nada -------------------------------
# Comparar solo las paginas conocidas no basta: Eleventy puede renderizar
# un .md que solo era una nota interna y publicarlo. Paso el 23-ago con
# los AGENTS.md/CLAUDE.md de videos/. Aqui se comprueba que la salida no
# tiene ninguna pagina que no estuviera ya en el repo.
# Carpetas que estan en el repo pero NO se despliegan: la fuente, la copia
# congelada del HTML de antes, los scripts de la migracion y node_modules.
NO_SE_SIRVE = {"src", "_migracion", "_site", "node_modules", ".git"}

def rutas_publicadas(raiz):
    out = set()
    for base, dirs, ficheros in os.walk(raiz):
        if os.path.abspath(raiz) == os.path.abspath("."):
            dirs[:] = [d for d in dirs if d not in NO_SE_SIRVE]
        for f in ficheros:
            if f.endswith((".html", ".md")):
                r = os.path.relpath(os.path.join(base, f), raiz)
                out.add(r.replace(os.sep, "/"))
    return out

def comprobar_paginas_nuevas():
    antes = set()
    for o in SUELTAS:
        antes.add(o)
    for s in PAGINAS:
        antes.add(s + '/index.html')
    # lo que ya venia servido tal cual desde carpetas copiadas
    for extra in ('assets', 'videos', 'design-system'):
        antes |= {extra + '/' + r for r in rutas_publicadas(os.path.join('src', extra))}
    ahora = rutas_publicadas(NUEVO)
    nuevas = sorted(ahora - antes)
    if nuevas:
        print('')
        print('AVISO: %d pagina(s) que no existian antes:' % len(nuevas))
        for r in nuevas:
            print('   +', r)
        return 1
    print('')
    print('Sin paginas nuevas: no se publica nada que no estuviera ya.')
    return 0

fallos += comprobar_paginas_nuevas()

print("\n%d/%d paginas verificadas" % (len(TODAS) - fallos, len(TODAS)))
sys.exit(1 if fallos else 0)
