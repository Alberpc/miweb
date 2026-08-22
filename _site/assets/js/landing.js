/* ============================================================
   landing.js — comportamiento comun de las landings/articulos
   ============================================================
   Extraido el 23-ago-2026 del bloque <script> inline que estaba
   duplicado literalmente en 7 landings (solo variaba un comentario).

   Todo es defensivo: si una pagina no tiene FAQ o no tiene TOC,
   los selectores devuelven vacio y no pasa nada.
   ============================================================ */
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
}

// Reveal al hacer scroll
const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); obs.unobserve(e.target); } });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

// FAQ acordeón
document.querySelectorAll('.faq-trigger').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const content = item.querySelector('.faq-content');
        const wasOpen = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(f => {
            f.classList.remove('active');
            f.querySelector('.faq-content').style.maxHeight = null;
        });
        if (!wasOpen) { item.classList.add('active'); content.style.maxHeight = content.scrollHeight + 'px'; }
    });
});

// TOC: resaltar el apartado activo según el scroll
const tocLinks = Array.from(document.querySelectorAll('.toc a'));
const targets = tocLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const spy = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            tocLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id));
        }
    });
}, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
targets.forEach(t => spy.observe(t));
