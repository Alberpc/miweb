# AEO: cómo hacer tu web visible para la IA

Cada vez más gente pregunta directamente a ChatGPT, Claude o Perplexity en vez de navegar por Google: Gartner calcula que el tráfico tradicional de búsqueda podría caer un 25% en 2026 y más de un 50% en 2028. El SEO sigue importando, pero ya no basta: el nuevo objetivo es el AEO (Answer Engine Optimization), optimizar tu web para que la IA te lea, te entienda y te recomiende como respuesta.

## ¿Por qué el SEO tradicional pierde fuerza?

La forma en que buscamos información está cambiando de raíz. En lugar de escribir una consulta en Google y navegar entre varios resultados, cada vez más gente le pregunta directamente a un asistente de IA —ChatGPT, Claude, Perplexity— o se queda con el resumen que la propia IA genera dentro de Google, sin hacer clic en ningún enlace. Es lo que se conoce como _zero-click search_: distintos análisis sitúan ya en torno al 60% las búsquedas globales que no generan ninguna visita a una web, y hasta un 80-83% cuando la respuesta viene de un resumen de IA.

Gartner, la consultora tecnológica, ha ido más lejos con una previsión concreta: el tráfico de búsqueda tradicional podría caer un **25% de aquí a 2026** a medida que los chatbots y agentes de IA asumen las consultas, y más de un **50% en 2028**. No es un hecho consumado, es una tendencia que ya se nota y que va a acelerarse.

Esto no significa que el SEO haya muerto, pero sí que está perdiendo peso como única estrategia. El objetivo ya no es solo posicionar para que una persona haga clic en tu resultado: es posicionar para que una **inteligencia artificial recomiende tu página** cuando alguien le pregunta algo relacionado con lo que tú ofreces. A esa disciplina se le llama **AEO (Answer Engine Optimization)**, optimización para motores de respuesta.

La diferencia práctica es enorme. En el SEO clásico, tu web compite por aparecer en una lista de diez resultados. En el AEO, compites por ser _la_ fuente que la IA cita —o directamente la recomendación que da— cuando alguien pregunta "cuál es la mejor agencia de IA" o "cuál es la mejor peluquería de mi zona". Si no apareces ahí, es como si no existieras para ese usuario.

## ¿Qué son los AI Crawlers y por qué son tus nuevos clientes?

Cuando alguien le pregunta a ChatGPT "cuál es la mejor agencia de IA", OpenAI no tiene esa respuesta guardada de antemano. Lo que hace es lanzar sus **robots rastreadores de IA** (los llamados _AI Crawlers_), que entran en las webs, leen la información y se la devuelven procesada al usuario en forma de respuesta.

Cada gran empresa de IA tiene los suyos, y ya son parte habitual del tráfico de cualquier web:

- **OpenAI:** GPTBot (entrena sus modelos) y OAI-SearchBot (indexa para ChatGPT Search).

- **Google:** Google-Extended, el permiso que controla si tu contenido se usa para Gemini y las AI Overviews.

- **Anthropic:** ClaudeBot.

- **Perplexity:** PerplexityBot (indexación) y Perplexity-User (entra cuando un usuario concreto pregunta algo en ese momento).

Piensa en estos bots como a tus nuevos clientes silenciosos: no compran directamente, pero deciden si te recomiendan o no a quien sí va a comprar. Para triunfar hoy, tu web tiene que estar **estructurada para ser "amiga" de estos robots** y dejarles extraer la información con facilidad, en vez de bloquearlos o esconder el contenido detrás de una estructura que no entienden.

**Solo el 4%.** De 200.000 webs analizadas por Cloudflare Radar, el 78% tiene un archivo robots.txt, pero casi siempre pensado para buscadores clásicos: apenas un 4% declara explícitamente sus preferencias de uso de IA, y solo un 3,9% soporta ya los estándares que permiten a un agente leer el contenido en formato Markdown. (Cloudflare Radar, análisis sobre adopción de estándares de IA en la web.)

## ¿Cómo saber si tu web está lista para la IA?

Cloudflare ha creado una herramienta pública y gratuita llamada **[isitagentready.com](https://isitagentready.com) (Agent Readiness Score)**. Le pegas el enlace de cualquier web y te da una puntuación que mide cuatro cosas: si los agentes de IA pueden _encontrar_ tu web (Discoverability), si tu _contenido_ está en un formato que puedan leer bien (Content), qué _control de acceso_ tienes configurado para esos bots (Bot Access Control) y qué tan preparada está tu web para que un agente pueda _actuar_ sobre ella, por ejemplo completar una reserva (Capabilities).

El dato de Cloudflare Radar de arriba lo deja claro: la inmensa mayoría de webs de negocio no han tocado nada de esto. No es que estén todas a cero, pero sí muy lejos de estar preparadas: tienen bloqueado sin querer el acceso a estos bots, o su estructura de código es tan confusa que la IA no consigue entenderla. En cualquiera de los dos casos, el resultado es el mismo: esa web difícilmente va a aparecer recomendada en una conversación con IA, por muy buena que sea la empresa detrás.

El trabajo de AEO consiste, en la práctica, en hacer los ajustes necesarios —tanto en el servidor como en el HTML y el CSS de la web— para subir esa puntuación: permitir el acceso a los bots correctos, estructurar el contenido de forma legible para una máquina y dar a la IA razones claras para citarte como la mejor opción cuando alguien pregunte por lo que tú ofreces.

## De la web de lectura a la web de agentes

Este cambio no es un capricho puntual, es la tercera gran etapa de internet:

- **Web 1.0 (años 90):** de solo lectura. El visitante tenía un papel pasivo.

- **Web 2.0 (años 2000):** participativa y social, con capacidad de interacción y creación de contenido por parte del usuario.

- **Web 3.0 / agéntica (ahora):** convivencia entre humanos y agentes de IA autónomos, capaces de leer, decidir, e incluso negociar y comprar directamente en la red sin que el usuario rellene un formulario.

En esa tercera etapa, Cloudflare ya está moviendo pieza: paneles como **AI Crawl Control** para decidir qué bots entran, herramientas de diagnóstico como **Agent Readiness**, modelos de monetización como **Pay Per Crawl** —cobrar a las empresas de IA por cada extracción de datos— y protocolos de compra para agentes que permiten completar una compra en una tienda online directamente desde el chat, sin que el usuario toque un carrito.

Si un negocio no ajusta su web ahora, no es que pierda una visita: pierde la recomendación completa antes de que el cliente sepa que existía.

## ¿Qué hacer ahora con tu web?

No hace falta rehacer la web entera de golpe. El orden razonable es:

- **Audita primero:** comprueba tu puntuación real en [isitagentready.com](https://isitagentready.com) antes de suponer nada. Es gratis y tarda un minuto.

- **Revisa qué bots tienes bloqueados** a nivel de servidor (robots.txt, firewall, CDN) y decide cuáles te interesa dejar pasar.

- **Ordena la estructura** del contenido para que sea legible por una máquina, no solo bonita para un humano.

- **Da respuestas claras y verificables** en tu propio contenido: es lo que una IA necesita para citarte con confianza.

Esto no es una moda pasajera de SEO. Es la misma lógica de siempre —que te encuentren donde tu cliente busca— aplicada al canal donde tu cliente busca ahora. Y ese canal, cada mes que pasa, es más una conversación con IA que una lista de enlaces azules.

## Preguntas frecuentes

### ¿Qué es el AEO (Answer Engine Optimization)?

Es la evolución del SEO para un mundo donde la gente ya no navega, pregunta directamente a herramientas como ChatGPT, Claude, Perplexity o los resúmenes con IA de Google. En vez de optimizar para que un humano haga clic en tu resultado, el AEO optimiza tu web para que sea la IA quien te lea, entienda y recomiende como respuesta.

### ¿Qué son los AI Crawlers y por qué me deberían importar?

Son los robots rastreadores que usan las empresas de IA para leer páginas web y construir sus respuestas: GPTBot y OAI-SearchBot de OpenAI, Google-Extended de Google, ClaudeBot de Anthropic o PerplexityBot de Perplexity, entre otros. Si tu web les bloquea el acceso o tiene una estructura que no entienden, esos asistentes nunca te van a recomendar, por bueno que sea tu contenido.

### ¿Cómo sé si mi web está preparada para la IA?

Cloudflare ha creado una herramienta gratuita, isitagentready.com (Agent Readiness Score), que audita cualquier web en cuatro dimensiones: si los agentes te encuentran, si tu contenido es legible para ellos, qué control de acceso tienes configurado y si tu web soporta que un agente actúe sobre ella. Según Cloudflare Radar, solo un 4% de las webs declara hoy sus preferencias de uso de IA.

### ¿Por qué está bajando el tráfico web tradicional?

Porque el hábito de búsqueda está cambiando: cada vez menos gente navega de resultado en resultado y más gente pregunta directamente a un asistente de IA, quedándose con la respuesta sin visitar la web de origen. Gartner calcula que el tráfico de búsqueda tradicional podría caer un 25% en 2026 y más de un 50% en 2028 a medida que los chatbots y agentes de IA absorben las consultas.

### ¿El SEO tradicional ya no sirve de nada?

El SEO sigue siendo necesario, pero ya no es suficiente por sí solo. Posicionar para que un humano haga clic en Google pierde peso frente a estar bien estructurado para que una IA te lea, te entienda y te cite como fuente. Lo sensato es trabajar ambos frentes: seguir cuidando el SEO clásico y añadir la capa de AEO.
