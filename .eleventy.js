// Configuracion de Eleventy para albercabrera.com
//
// Principio de esta migracion: Eleventy COPIA y SUSTITUYE, no transforma.
// El HTML generado en _site/ debe salir byte a byte igual al que hoy hay en
// la raiz del repo, salvo el <link> al CSS extraido. Esa comparacion es el
// control de que la migracion no rompe nada (ver el spec del 23-ago-2026).
//
// Las URLs NO deben cambiar: hay posts indexados en Google y enlaces con
// ?origen=. Cada landing sigue siendo /<slug>/index.html.

import { writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { htmlAMarkdown, faqAMarkdown, landingAMarkdown } from "./src/_utils/html-a-markdown.js";

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
    // Compilando a la raiz, el HTML generado y la copia congelada del de
    // antes conviven con la fuente. Sin esto Eleventy los tomaria por
    // plantillas y se leeria a si mismo.
    eleventyConfig.ignores.add("_migracion/**/*");
    eleventyConfig.ignores.add("_site/**/*");

    // Los posts del blog, del mas nuevo al mas viejo. Se ordena por el campo
    // `fecha` del frontmatter y no por la fecha del archivo: la del archivo
    // cambia sola al editarlo y reordenaria el indice sin querer.
    // Ojo: YAML convierte 2026-07-29 en un Date, no en un texto, asi que se
    // compara por tiempo. Comparar como cadena no ordenaba nada.
    eleventyConfig.addCollection("postsPorFecha", (api) =>
        api.getFilteredByTag("posts")
           .sort((a, b) => new Date(b.data.fecha) - new Date(a.data.fecha)));

    // Las categorias del blog, en el orden en que aparecen los posts y
    // con cuantos tiene cada una. Se calcula aqui y no en la plantilla
    // porque Nunjucks no deja acumular en un array dentro de un bucle
    // ({% set %} no sale del ambito del for). Crear un post con una
    // categoria nueva la anade al menu sin tocar nada.
    eleventyConfig.addCollection("categoriasBlog", (api) => {
        const cuenta = new Map();
        api.getFilteredByTag("posts").forEach((post) => {
            const cat = post.data.categoria;
            if (cat) cuenta.set(cat, (cuenta.get(cat) || 0) + 1);
        });
        return Array.from(cuenta, ([nombre, n]) => ({ nombre, n }));
    });

    // Convierte "Automatizacion con IA" en "automatizacion-con-ia" para
    // usarlo como valor de data-* y como id del filtro. Los acentos se
    // normalizan (NFD + quitar diacriticos) o "IA y visibilidad" y
    // "IA y visibilidád" darian slugs distintos.
    eleventyConfig.addFilter("slug", (texto) =>
        String(texto)
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            .toLowerCase().trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""));

    // Genera un .md gemelo de cada post del blog, junto a su index.html.
    // Cubre el check "Markdown Negotiation" de la auditoria AEO: un agente
    // que pida Accept: text/markdown recibe contenido real, no el HTML
    // completo con nav/footer. Sale solo en cada build a partir del mismo
    // `content` ya renderizado — nunca se edita a mano, no puede
    // desincronizarse del post real.
    eleventyConfig.on("eleventy.after", ({ results }) => {
        for (const pagina of results) {
            if (!pagina.outputPath.endsWith(".html")) continue;

            const tituloMatch = pagina.content.match(/<title>([^<]*)<\/title>/);
            const titulo = tituloMatch ? tituloMatch[1].replace(/ \| Alber Cabrera$/, "") : "";

            let markdown = null;

            if (pagina.content.includes('class="prose"')) {
                // Posts del blog: prosa lineal dentro de <article class="prose">.
                const cuerpoMatch = pagina.content.match(
                    /<article class="prose">([\s\S]*?)<\/article>/
                );
                if (cuerpoMatch) {
                    const faq = faqAMarkdown(pagina.content);
                    markdown = `# ${titulo}\n\n${htmlAMarkdown(cuerpoMatch[1])}\n\n${faq}\n`;
                }
            } else if (/<section[^>]*class="[^"]*section/.test(pagina.content)) {
                // Landings de venta (home, diagnostico): secciones con
                // <h2 class="section-title">, sin prosa lineal.
                markdown = landingAMarkdown(pagina.content);
            }

            if (!markdown) continue;
            const rutaMd = pagina.outputPath.replace(/index\.html$/, "index.md");
            writeFileSync(rutaMd, markdown.replace(/\n{3,}/g, "\n\n"), "utf8");
        }
    });

    return {
        dir: {
            input: "src",
            // Se compila a la RAIZ, no a _site/: el deploy de Hostinger sube
            // la raiz del repo, asi que el HTML generado tiene que caer donde
            // hoy estan los originales. Si se compilara a _site/, la web
            // acabaria colgando de albercabrera.com/_site/.
            // La copia congelada del HTML de antes vive en
            // _migracion/originales/, que es contra lo que compara
            // verificar-migracion.py.
            output: ".",
            includes: "_includes",
            data: "_data",
        },
        // Rutas limpias: src/landings/foo.njk -> _site/foo/index.html
        htmlTemplateEngine: "njk",
        markdownTemplateEngine: "njk",
    };
}
