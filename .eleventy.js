// Configuracion de Eleventy para albercabrera.com
//
// Principio de esta migracion: Eleventy COPIA y SUSTITUYE, no transforma.
// El HTML generado en _site/ debe salir byte a byte igual al que hoy hay en
// la raiz del repo, salvo el <link> al CSS extraido. Esa comparacion es el
// control de que la migracion no rompe nada (ver el spec del 23-ago-2026).
//
// Las URLs NO deben cambiar: hay posts indexados en Google y enlaces con
// ?origen=. Cada landing sigue siendo /<slug>/index.html.

export default function (eleventyConfig) {
    // Assets que se copian tal cual, sin pasar por el motor de plantillas.
    // .htaccess va aqui a proposito: el deploy de Hostinger lo borra si no
    // aparece en lo desplegado (ver memoria deploy-borra-htaccess-albercabrera).
    eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
    eleventyConfig.addPassthroughCopy({ "src/css": "css" });
    eleventyConfig.addPassthroughCopy({ "src/design-system": "design-system" });
    eleventyConfig.addPassthroughCopy({ "src/.htaccess": ".htaccess" });
    eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });
    eleventyConfig.addPassthroughCopy({ "src/sitemap.xml": "sitemap.xml" });
    eleventyConfig.addPassthroughCopy({ "src/favicon.svg": "favicon.svg" });
    eleventyConfig.addPassthroughCopy({ "src/index.css": "index.css" });
    eleventyConfig.addPassthroughCopy({ "src/index.js": "index.js" });
    eleventyConfig.addPassthroughCopy({ "src/legal.css": "legal.css" });
    // De videos/ solo se despliega lo que se ve (el HTML del proyecto y sus
    // renders/snapshots). Los .md y los package.json son notas y config
    // internas: se quedan en el repo, no en el servidor publico.
    eleventyConfig.addPassthroughCopy({ "src/videos": "videos" }, {
        filter: (ruta) => !/\.(md|json)$/i.test(ruta),
    });

    // Estos archivos viven dentro de carpetas que se copian tal cual; sin
    // esto Eleventy los trataria como plantillas y los reescribiria
    // (test-guardrails.html -> test-guardrails/index.html, README.md -> HTML).
    eleventyConfig.ignores.add("src/assets/**/*");
    eleventyConfig.ignores.add("src/design-system/**/*");
    // videos/ son proyectos de HyperFrames (AGENTS.md, CLAUDE.md, package.json).
    // Sin esto Eleventy los renderiza y publica las notas internas como
    // paginas: /videos/<x>/AGENTS/ y /videos/<x>/CLAUDE/. Ver la regla de
    // no dejar notas internas en carpetas desplegadas.
    eleventyConfig.ignores.add("src/videos/**/*");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data",
        },
        // Rutas limpias: src/landings/foo.njk -> _site/foo/index.html
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
    };
}
