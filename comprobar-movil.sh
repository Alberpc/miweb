#!/bin/bash
# ============================================================
# comprobar-movil.sh — revisa las 14 paginas en un movil de verdad
# ============================================================
# El verificador de la migracion compara HTML/CSS/JS, pero no MIRA la
# pagina: no vio que el menu de escritorio salia apretado y cortado en
# movil, ni que la tabla de cookies desplazaba la pagina. Esto si.
#
# Ojo con dos trampas que ya me comi:
#   - el comando es `set device`, no `device`;
#   - body lleva overflow-x:hidden, asi que un desborde NO se ve en
#     scrollWidth: hay que comparar cada hijo con su contenedor.
#
# Uso:  bash comprobar-movil.sh          (arranca el servidor solo)
# ============================================================
set -u
PUERTO=8899
BASE="http://localhost:$PUERTO"

if ! curl -s -o /dev/null "$BASE/"; then
    echo "Levantando servidor en $PUERTO..."
    (python -m http.server $PUERTO >/dev/null 2>&1 &)
    sleep 2
fi

agent-browser set device "iPhone 16" >/dev/null 2>&1

PAGINAS=("" "blog/" "diagnostico-operativo/" "no-perder-clientes/"
         "automatizar-asesoria/" "automatizar-inmobiliaria/"
         "automatizar-leads-clinicas/" "automatizar-mi-negocio/"
         "negocio-depende-de-ti/" "sistematizar-centro-formacion/"
         "sistematizar-negocio-local/" "aviso-legal.html" "cookies.html"
         "politica-de-privacidad.html")

SONDA='(()=>new Promise(res=>{
  const d=document.documentElement, vw=d.clientWidth, fallos=[];
  // 1. desborde real: quien se sale de SU contenedor (no vale scrollWidth,
  //    body lleva overflow-x:hidden y lo tapa)
  const nav=document.querySelector(".navbar,.subnav");
  if(nav){const nr=nav.getBoundingClientRect().right;
    nav.querySelectorAll("*").forEach(e=>{const b=e.getBoundingClientRect();
      if(b.width>0&&b.right>nr+1)fallos.push("nav se sale: "+e.className)})}
  // 2. el menu de escritorio tiene que estar oculto
  const m=document.querySelector(".nav-menu");
  if(m&&getComputedStyle(m).display!=="none")fallos.push("menu escritorio visible");
  // 3. la hamburguesa tiene que existir y abrir
  const b=document.querySelector(".nav-burger"), mob=document.querySelector(".nav-mobile");
  if(!b||!mob){fallos.push("falta hamburguesa");return res(JSON.stringify(fallos))}
  b.click();
  setTimeout(()=>{
    const s=getComputedStyle(mob);
    if(s.opacity!=="1"||s.pointerEvents==="none")fallos.push("el menu movil no abre");
    // 4. nada mas ancho que la pantalla
    document.querySelectorAll("table,pre,img,iframe,video").forEach(e=>{
      const r=e.getBoundingClientRect();
      if(r.width>vw+1){const p=e.parentElement;
        if(!p||getComputedStyle(p).overflowX==="visible")
          fallos.push("no cabe y no scrollea: "+e.tagName.toLowerCase())}});
    res(JSON.stringify(fallos))},400)}))()'

fallos=0
for u in "${PAGINAS[@]}"; do
    agent-browser open "$BASE/$u" >/dev/null 2>&1
    r=$(agent-browser eval "$SONDA" 2>&1 | tr -d '\\"')
    if [ "$r" = "[]" ]; then
        printf "OK     /%s\n" "$u"
    else
        printf "FALLA  /%-28s %s\n" "$u" "$r"
        fallos=$((fallos+1))
    fi
done

echo
if [ $fallos -eq 0 ]; then
    echo "${#PAGINAS[@]}/${#PAGINAS[@]} paginas bien en movil"
else
    echo "$fallos pagina(s) con fallos en movil"
    exit 1
fi
