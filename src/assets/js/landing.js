/* ============================================================
   landing.js — comportamiento propio de las landings/articulos
   ============================================================
   FAQ acordeon y TOC. Va aparte de base.js porque /blog/ no tiene
   ni FAQ ni TOC: cargarselo seria anyadirle codigo que hoy no tiene.

   Es defensivo igualmente: si una landing no lleva FAQ o no lleva TOC,
   los selectores devuelven vacio y no pasa nada.
   ============================================================ */
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
