/* ============================================================
   faq.js — acordeón FAQ de las landings de conversión
   ============================================================
   Compartido por diagnostico-operativo y no-perder-clientes: las dos
   usan el mismo marcado (.faq > button + span.ico, .body). Antes vivia
   como jsPagina inline en cada una y en algun punto de la migracion a
   Eleventy se perdio de las dos — el FAQ no abria en ninguna pagina.
   Se saca a archivo compartido para que no vuelva a pasar.

   Es defensivo: si la pagina no tiene .faq, el selector no encuentra
   nada y no pasa nada (igual que landing.js con .faq-trigger).
   ============================================================ */
document.querySelectorAll('.faq button').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const body = item.querySelector('.body');
        const wasOpen = item.classList.contains('open');
        document.querySelectorAll('.faq').forEach(f => {
            f.classList.remove('open');
            f.querySelector('.body').style.maxHeight = null;
        });
        if (!wasOpen) {
            item.classList.add('open');
            body.style.maxHeight = body.scrollHeight + 'px';
        }
    });
});
