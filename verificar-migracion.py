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

# Los dos lados de la comparacion.
ORIG = os.path.join("_migracion", "originales")   # el HTML y el CSS de antes
NUEVO = SALIDA                                     # lo que genera Eleventy hoy

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
    """Encuentra un asset local dentro de `base`, y SOLO dentro de `base`.

    Antes caia a "src" y "." si no lo encontraba, y eso rompia la
    comparacion sin avisar: el lado "original" acababa leyendo el CSS
    ACTUAL, asi que se comparaba consigo mismo y no detectaba nada. Por eso
    _migracion/originales/ guarda tambien su copia de los CSS.
    """
    rel = href.split("?")[0].lstrip("/")
    ruta = os.path.join(base, rel)
    if os.path.exists(ruta):
        return ruta
    # la salida es la raiz del repo: ahi los assets viven bajo src/
    if base == NUEVO:
        alt = os.path.join("src", rel)
        if os.path.exists(alt):
            return alt
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

def sin_media(css):
    """Quita los bloques @media/@supports enteros.

    Hace falta porque reglas() parte por "}" y eso descuartiza un @media:
    la regla de dentro pierde su prefijo y pasa por regla base. Asi el pie
    del blog parecia cambiar de 3 columnas a 2 cuando no cambiaba nada.
    """
    out, i, n = [], 0, len(css)
    while i < n:
        j = css.find("@media", i)
        k = css.find("@supports", i)
        j = min(x for x in (j, k) if x != -1) if (j != -1 or k != -1) else -1
        if j == -1:
            out.append(css[i:])
            break
        out.append(css[i:j])
        # saltar el bloque completo contando llaves
        prof, m = 0, css.find("{", j)
        if m == -1:
            break
        i = m
        while i < n:
            if css[i] == "{":
                prof += 1
            elif css[i] == "}":
                prof -= 1
                if prof == 0:
                    i += 1
                    break
            i += 1
    return "".join(out)

def props_por_selector(css):
    """Para cada selector, el valor que GANA de cada propiedad.

    Compara el efecto real, no el texto: si una regla se sobreescribe mas
    abajo (que es como se conservan las variantes de una pagina concreta),
    lo que cuenta es el valor final, igual que hace el navegador.
    Es una aproximacion: no pondera especificidad entre selectores distintos,
    solo el orden dentro del mismo selector.
    """
    fin = {}
    for r in reglas(sin_media(css)):
        if "{" not in r: continue
        sel = r.split("{")[0].strip()
        # Lo de dentro de un @media depende del ancho de pantalla, asi que
        # no "gana" sin mas: mezclarlo con la regla base daba falsos
        # positivos (el pie del blog parecia cambiar de 3 columnas a 2 solo
        # porque el @media quedaba el ultimo del archivo).
        if sel.startswith("@media") or sel.startswith("@supports"):
            continue
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
    ".article-hero.inverse h1": {"font-family", "font-weight"},
    ".prose h2":                {"font-family", "font-weight"},
    ".prose h3":                {"font-family"},
    ".related h2":              {"font-family", "font-weight"},
    ".related-card h3":         {"font-family"},
    ".faq-head h2":             {"font-family", "font-weight"},
    ".cta-card h2":             {"font-family", "font-weight"},
    # La seccion del CTA deja de ser .inverse: iban tres franjas verdes
    # seguidas (CTA + pie) y se leian como un solo bloque.
    ".cta-final.inverse":       {"padding"},
    ".cta-card":                {"background", "border", "border-radius", "box-shadow", "padding"},
    # El boton pasa a ser el mismo que .btn-primary de la home: radio 8px
    # (el sistema prohibe la pildora) y texto oscuro sobre el dorado.
    ".cta-card .btn-main":      {"font-size", "color", "background", "padding",
                                 "border-radius", "transition"},
    ".cta-card .btn-main:hover": {"transform", "background", "box-shadow"},
    # 23-ago, escalas oficiales del sistema (_docs/negocio/...): el
    # tokens.css del repo no traia espaciados ni radios, asi que se venian
    # poniendo a ojo. Ahora todo sale de --space-* y --radius-*.
    # Nueve de estos son identicos en pantalla (8/12/16/100 -> su token);
    # el resto sube o baja al escalon mas cercano de la escala.
    ".subnav":                   {"border-radius", "background"},
    # 23-ago: el CTA del nav en blog y posts iba en --cobalt-600 (#6E5628),
    # un dorado tan oscurecido que se leia MARRON, con texto blanco, y al
    # pasar el raton se oscurecia mas todavia. Ahora es el mismo boton que
    # .nav-btn en la home: dorado --cobalt-400 y texto oscuro.
    ".subnav .cta":              {"border-radius", "color", "background", "padding",
                                  "min-height", "line-height", "transition"},
    ".subnav .cta:hover":        {"background", "transform", "box-shadow", "border-color"},
    ".nav-mobile .nav-mobile-cta": {"background", "color"},
    ".nav-burger span":          {"border-radius"},
    ".nav-mobile":               {"border-radius"},
    ".nav-mobile a":             {"border-radius"},
    ".article-hero.inverse":     {"padding"},
    # 23-ago: fuera el resplandor dorado del hero. Era un radial al 18%
    # ocupando media pantalla y sobre el verde viraba a amarillo turbio.
    # El sistema lo lista como cosa a evitar: "dorado por toda la pagina".
    ".article-hero.inverse::before": {"content", "position", "inset",
                                      "pointer-events", "background"},
    ".hero-figure":              {"border-radius", "background", "box-shadow"},
    # 23-ago: las dos landings de conversion al sistema. Titulares a
    # Instrument Serif con peso 400, botones de pildora a 8px y fuera los
    # lavados dorados de fondo (uno llegaba al 20% sobre el verde).
    ".hero h1":                  {"font-family"},
    ".hero.inverse h1":          {"font-family"},
    ".hero.inverse":             {"padding", "background"},
    ".hero":                     {"background"},
    ".hero.inverse .hero-badge": {"border-radius"},
    ".hero-badge":               {"color", "border", "background", "border-radius"},
    ".radar":                    {"background"},
    ".radar .core":              {"background"},
    ".hero::before":             {"background"},
    ".deal::before":             {"background"},
    ".s-title":                  {"font-family", "font-weight"},
    ".metodo-col h3":            {"font-family", "font-weight"},
    ".quien-col h3":             {"font-family", "font-weight"},
    ".paso-col h3":              {"font-family", "font-weight"},
    ".deal h2":                  {"font-family", "font-weight"},
    ".cierre-text h2":           {"font-family", "font-weight"},
    ".cta-final h2":             {"font-family", "font-weight"},
    ".btn-main":                 {"border-radius"},
    ".hero.inverse .btn-main":   {"border-radius"},
    ".cta-movil a":              {"border-radius"},
    ".article-hero.inverse .hero-cat": {"border-radius"},
    ".article-body":             {"padding"},
    ".prose .lead-answer":       {"border-radius"},
    ".stat-box":                 {"border-radius"},
    ".key-points li":            {"border-radius"},
    ".related":                  {"padding"},
    ".related-card":             {"border-radius"},
    ".faq-section":              {"padding"},
    ".faq-item":                 {"border-radius"},
    ".footer-section.inverse":   {"padding"},
    # 23-ago, la home a la misma escala. De estos 25, solo 3 mueven un pixel:
    # las barritas del burger (2->8), el punto activo (4->8) y el formulario
    # (11->12, tenia ese valor "para encajar"). El resto es el mismo numero
    # escrito como token.
    ".section":                  {"padding"},
    ".navbar":                   {"border-radius"},
    ".nav-btn":                  {"border-radius"},
    ".nav-mobile-link":          {"border-radius"},
    ".nav-mobile-cta":           {"border-radius"},
    ".btn-primary":              {"border-radius"},
    ".btn-primary-small":        {"border-radius"},
    ".btn-submit":               {"border-radius"},
    ".glass-card":               {"border-radius"},
    ".glass-form":               {"border-radius"},
    ".glass-form-container":     {"border-radius"},
    ".form-group input, .form-group textarea": {"border-radius"},
    ".caso-dot.is-active":       {"border-radius"},
    ".caso-step-card":           {"border-radius"},
    ".caso-step-arrow":          {"padding"},
    ".caso-quote-card":          {"border-radius"},
    ".service-card":             {"border-radius"},
    ".timeline-item":            {"border-radius"},
    ".sobremi-visual":           {"border-radius"},
    ".whatsapp-tooltip":         {"border-radius"},
    ".caminos-section .grid-two-cols > div:last-child::after": {"border-radius"},
}

# El nav se unifico el 23-ago: blog y posts usaban .subnav, la home
# .navbar, y ademas el blog tenia su propia copia del CSS. Ahora hay un
# solo componente (.navbar, en css/nav.css), asi que TODAS las reglas
# .subnav* desaparecen. No es una perdida: es la deduplicacion.
NAV_UNIFICADO = re.compile(r"^\.subnav|^\.nav-(menu|mobile|burger|link|btn)|^\.logo")

# Los botones se unificaron en css/botones.css el 23-ago: habia 12
# definiciones repartidas en 5 archivos y 8 ponian el texto en blanco
# sobre el dorado. Sus reglas viejas desaparecen a proposito.
BOTON_UNIFICADO = re.compile(
    r"^\.(btn-main|btn-primary|btn-submit|btn-ghost|nav-btn)\b"
    r"|\.btn-main\b|\.btn-label\b|\.cta-movil a\b|^\.subnav \.cta\b")

def es_querido(cambio, esperados):
    """Un cambio esta permitido solo si ADEMAS acaba en el valor previsto.

    Antes bastaba con que el selector y la propiedad estuvieran en la lista,
    y eso se tragaba cualquier cosa: probado metiendo un `color: red` en
    .btn-primary, no lo detectaba. Ahora se exige que el valor nuevo sea
    el que se declaro.
    """
    sel = cambio.split("{")[0].strip()
    # tambien cuando la regla del nav va dentro de un @media
    # 23-ago: el bloque del precio del DAI360, rehecho entero. Apilaba
    # degradado dorado + halo exterior + brillo interior sobre --night-800
    # y salia un lavado verde-crema con el texto a medio tono.
    if sel.startswith(".deal"):
        return True
    if BOTON_UNIFICADO.search(sel):
        return True
    if NAV_UNIFICADO.match(sel) or (sel.startswith("@media") and
            ("nav-" in cambio or "subnav" in cambio)):
        return True
    if "{" not in cambio:
        return False
    dentro = cambio.split("{", 1)[1].rstrip("}")
    prop = dentro.split(":", 1)[0].strip()
    if prop not in CAMBIOS_QUERIDOS.get(sel, set()):
        return False
    # el valor final tiene que ser un token del sistema o estar declarado
    nuevo_val = dentro.split("->")[-1].strip() if "->" in dentro else ""
    return nuevo_val.startswith("var(--") or (sel, prop) in esperados


# Cambios queridos cuyo valor final no es un token (se aceptan tal cual).
VALOR_LIBRE = {
    (".cta-card", "background"), (".cta-card", "border"),
    (".cta-card", "box-shadow"), (".cta-card", "border-radius"),
    (".cta-card", "padding"),
    (".article-hero.inverse::before", "content"),
    (".article-hero.inverse::before", "position"),
    (".article-hero.inverse::before", "inset"),
    (".article-hero.inverse::before", "pointer-events"),
    (".article-hero.inverse::before", "background"),
    (".hero-figure", "background"), (".hero-figure", "box-shadow"),
    (".hero.inverse", "padding"), (".hero.inverse", "background"),
    (".hero::before", "background"), (".deal::before", "background"),
    (".hero", "background"), (".hero-badge", "color"), (".hero-badge", "border"),
    (".hero-badge", "background"), (".subnav", "background"),
    (".radar", "background"), (".radar .core", "background"),
    (".s-title", "font-weight"), (".metodo-col h3", "font-weight"),
    (".quien-col h3", "font-weight"), (".paso-col h3", "font-weight"),
    (".deal h2", "font-weight"), (".cierre-text h2", "font-weight"),
    (".cta-final h2", "font-weight"),
    (".cta-final.inverse", "padding"),
    (".cta-card .btn-main", "padding"), (".cta-card .btn-main", "font-size"),
    (".cta-card .btn-main", "border-radius"), (".cta-card .btn-main", "transition"),
    (".cta-card .btn-main:hover", "transform"), (".cta-card .btn-main:hover", "background"),
    (".cta-card .btn-main:hover", "box-shadow"),
    (".article-hero.inverse h1", "font-weight"),
    (".subnav .cta", "padding"), (".subnav .cta", "min-height"),
    (".subnav .cta", "line-height"), (".subnav .cta", "transition"),
    (".subnav .cta:hover", "transform"), (".subnav .cta:hover", "box-shadow"),
    (".subnav .cta:hover", "border-color"),
    (".prose h2", "font-weight"), (".related h2", "font-weight"),
    (".faq-head h2", "font-weight"), (".cta-card h2", "font-weight"),
}

# Paginas que cambian de aspecto ENTERAS a proposito. Comparar propiedad
# a propiedad no dice nada util aqui: lo que cambia es la pagina completa.
# Se comprueba lo que si tiene que seguir igual (texto, enlaces, SEO,
# JSON-LD) y el aspecto se revisa en el navegador.
# Paginas que ademas CAMBIAN DE NAVEGACION a proposito: al pasar de la
# cabecera reducida a la del resto del sitio ganan los enlaces del menu
# (Servicios, Como Empezar, Sobre Mi, Blog), que antes no tenian.
NAV_CAMBIADO = {"diagnostico-operativo/index", "no-perder-clientes/index"}

REDISENADAS = {
    # 23-ago: tenia su propia paleta (fondo negro #0a0908) y su CSS aparte.
    # Pasa al verde del sistema y al mismo landing.css que los otros 6.
    "automatizar-mi-negocio",
}

# Un dict con la misma clave dos veces se queda con la ultima en silencio,
# y la primera desaparece. Ha pasado 3 veces al ir declarando cambios, y
# el sintoma es raro: un cambio ya declarado vuelve a saltar como fallo.
def _sin_claves_repetidas(ruta):
    import re
    vistas, repes = set(), []
    dentro = False
    for linea in io.open(ruta, encoding="utf-8"):
        if linea.startswith("CAMBIOS_QUERIDOS = {"):
            dentro = True
            continue
        if dentro:
            if linea.startswith("}"):
                break
            m = re.match(r'\s*"([^"]+)":', linea)
            if m:
                if m.group(1) in vistas:
                    repes.append(m.group(1))
                vistas.add(m.group(1))
    if repes:
        print("AVISO: claves repetidas en CAMBIOS_QUERIDOS: %s" % ", ".join(repes))
        print("       la ultima pisa a la anterior; hay que fusionarlas.")
    return not repes

_sin_claves_repetidas(__file__)

fallos = 0

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
        elif slug in NAV_CAMBIADO:
            # el unico texto que cambia es el menu del nav comun, que
            # sustituye al "volver" de la cabecera reducida
            avisos.append("texto: entra el menu del nav comun")
        else:
            problemas.append("texto visible")
    eo, en = enlaces(orig), enlaces(nuevo)
    if slug in NAV_CAMBIADO:
        nuevos = set(en) - set(eo)
        perdidos = set(eo) - set(en)
        if perdidos:
            problemas.append("enlaces PERDIDOS %s" % perdidos)
        elif nuevos:
            avisos.append("+%d enlaces del menu comun" % len(nuevos))
    elif eo != en:
        problemas.append("enlaces (%s)" % (set(eo) ^ set(en)))
    mo, mn = metas(orig), metas(nuevo)
    if mo != mn:
        dif = {k: (mo.get(k), mn.get(k)) for k in set(mo) | set(mn) if mo.get(k) != mn.get(k)}
        problemas.append("meta/SEO %s" % dif)
    if jsonld(orig) != jsonld(nuevo):
        problemas.append("JSON-LD")
    co, cn = css_efectivo(orig, ORIG), css_efectivo(nuevo, NUEVO)
    if slug in REDISENADAS:
        avisos.append("redisenada entera a proposito; el CSS no se compara")
    elif co != cn:
        # Primero por efecto: que valor gana en cada selector.
        po, pn = props_por_selector(co), props_por_selector(cn)
        cambiados = []
        for sel, d in po.items():
            dn = pn.get(sel, {})
            for k, v in d.items():
                if dn.get(k) != v:
                    cambiados.append("%s{%s: %s -> %s}" % (sel, k, v, dn.get(k)))
        queridos = [c for c in cambiados if es_querido(c, VALOR_LIBRE)]
        cambiados = [c for c in cambiados if not es_querido(c, VALOR_LIBRE)]
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
