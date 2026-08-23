/* ============================================================
   base.js — comportamiento que necesita CUALQUIER pagina
   ============================================================
   Menu movil y reveal al hacer scroll. Estaba copiado inline en las
   7 landings y tambien, palabra por palabra, en /blog/.
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
