/* ============================================================
   base.js — comportamiento que necesita CUALQUIER pagina
   ============================================================
   Menu movil, reveal al hacer scroll y la barra transparente sobre
   el hero. Estaba copiado inline en las 7 landings y tambien, palabra
   por palabra, en /blog/.
   ============================================================ */

// Barra transparente sobre el hero (paginas con heroEnBloque: true)
//   Solo con la pagina arriba del todo la barra va sin fondo y con el
//   texto en blanco sobre el hero. En cuanto se baja UN POCO aparece
//   el cristal, sin esperar a que termine el hero.
//   Se vigila un centinela de 1px puesto al principio de la pagina en
//   vez de escuchar el scroll: el navegador avisa solo al cruzar el
//   umbral, no en cada pixel.
//   Movido de index.js (3-sep-2026): .navbar--en-hero ya no es
//   exclusivo de la home.
const navbar = document.querySelector('.navbar--en-hero');

if (navbar) {
    navbar.classList.add('navbar--sobre-hero');

    const centinela = document.createElement('div');
    centinela.setAttribute('aria-hidden', 'true');
    centinela.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(centinela);

    const arribaObserver = new IntersectionObserver(
        ([entry]) => {
            navbar.classList.toggle('navbar--sobre-hero', entry.isIntersecting);
        },
        { threshold: 0 }
    );

    arribaObserver.observe(centinela);
}

// Menú móvil (burger)
const burger = document.getElementById('nav-burger');
const mobile = document.getElementById('nav-mobile');
if (burger && mobile) {
    burger.addEventListener('click', () => {
        const open = burger.classList.toggle('open');
        mobile.classList.toggle('open', open);
        burger.setAttribute('aria-expanded', open);
    });
    mobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        burger.classList.remove('open'); mobile.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
    }));
    // Cerrar al tocar fuera del menú. Solo la home lo tenia (dentro de
    // index.js); se sube aqui para que las 14 paginas se comporten igual.
    document.addEventListener('click', (e) => {
        if (mobile.classList.contains('open') && !e.target.closest('.navbar')) {
            burger.classList.remove('open'); mobile.classList.remove('open'); burger.setAttribute('aria-expanded', 'false');
        }
    });
}

// Reveal al hacer scroll
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// Clics a WhatsApp (24-sep-2026)
//   Es la via de contacto que mas se usa y Analytics no se enteraba: los
//   enlaces wa.me salen de la web sin dejar rastro. Un solo escuchador en
//   el documento cubre la burbuja flotante, el bloque de contacto de la
//   home y cualquier enlace wa.me que se anada despues.
//   Igual que generate_lead en index.js: gtag solo empuja al dataLayer, y
//   hace falta en GTM un activador de evento personalizado
//   "whatsapp_click" + su etiqueta de evento GA4 (y publicar el
//   contenedor). Va envuelto en typeof gtag porque sin cookies aceptadas
//   gtag no existe y el clic tiene que seguir funcionando.
document.addEventListener('click', (e) => {
    const enlace = e.target.closest('a[href*="wa.me/"]');
    if (!enlace || typeof gtag !== 'function') return;
    gtag('event', 'whatsapp_click', {
        link_location: enlace.classList.contains('whatsapp-float') ? 'burbuja_flotante' : 'contacto',
        page_path: location.pathname
    });
});
