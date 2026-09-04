/* ============================================================
   blog-filtro.js — el menu de categorias del blog.

   Filtra las tarjetas en la propia vista, sin recargar y sin tocar la
   URL: son 8 posts, no hace falta paginar ni navegar a /blog/categoria/.

   El HTML ya sale renderizado con TODAS las tarjetas visibles, asi que
   sin JS la pagina sigue funcionando entera — solo se pierde el filtro.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const filtros = Array.from(document.querySelectorAll('[data-filtro]'));
    const tarjetas = Array.from(document.querySelectorAll('[data-categoria]'));
    const vacio = document.querySelector('[data-posts-vacio]');
    if (!filtros.length || !tarjetas.length) return;

    function aplicar(cat) {
        let visibles = 0;

        tarjetas.forEach((t) => {
            const coincide = cat === 'todos' || t.dataset.categoria === cat;
            /* .hidden y no style.display: el CSS ya define
               .post-card[hidden] { display: none } y asi la tarjeta
               sale del grid — con visibility dejaria el hueco. */
            t.hidden = !coincide;
            if (coincide) visibles++;
        });

        filtros.forEach((f) => {
            f.setAttribute('aria-pressed', String(f.dataset.filtro === cat));
        });

        if (vacio) vacio.hidden = visibles > 0;
    }

    filtros.forEach((f) => {
        f.addEventListener('click', () => aplicar(f.dataset.filtro));
    });
});
