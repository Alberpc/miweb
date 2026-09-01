/* -------------------------------------------------------------
   INTERACTIVIDAD Y ANIMACIONES: CROMO LÍQUIDO & TITANIO
   ALBER CABRERA - WEB PREMIUM
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Si se llega con un #ancla en la URL (ej. desde el diagnóstico a #contacto)
    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // 1.2 BARRA TRANSPARENTE SOBRE EL HERO
    //     Solo con la pagina arriba del todo la barra va sin fondo y con
    //     el texto en blanco sobre el hero. En cuanto se baja UN POCO
    //     aparece el cristal, sin esperar a que termine el hero.
    //     Se vigila un centinela de 1px puesto al principio de la pagina
    //     en vez de escuchar el scroll: el navegador avisa solo al cruzar
    //     el umbral, no en cada pixel.
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

    // 1.5 MENÚ HAMBURGUESA (MÓVIL)
    const burger = document.getElementById('nav-burger');
    const mobilePanel = document.getElementById('nav-mobile');

    if (burger && mobilePanel) {
        burger.addEventListener('click', () => {
            const isOpen = mobilePanel.classList.toggle('open');
            burger.classList.toggle('open', isOpen);
            burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        // Cerrar el panel al pulsar cualquier enlace del menú
        mobilePanel.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobilePanel.classList.remove('open');
                burger.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
            });
        });

        // Cerrar al tocar fuera del menú
        document.addEventListener('click', (e) => {
            if (mobilePanel.classList.contains('open') && !e.target.closest('.navbar')) {
                mobilePanel.classList.remove('open');
                burger.classList.remove('open');
                burger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // 2. SCROLL REVEAL (REVELADO DE ELEMENTOS EN SCROLL)
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                // Dejar de observar una vez revelado
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(element => {
        revealObserver.observe(element);
    });


    // 2.5 EL RIEL DE "COMO TRABAJO"
    //
    // La linea naranja sigue al scroll de forma CONTINUA, no a saltos de
    // fase. Antes iba con una escalera de :has() en el CSS y se veia
    // poco dinamica: pegaba cuatro tirones y ya.
    //
    // El avance se mide con el centro de la pantalla como cabeza de
    // lectura: 0 cuando el primer nodo llega a esa altura, 1 cuando la
    // alcanza el ultimo. Se mide contra los NODOS y no contra la
    // seccion entera para que la linea y los puntos no puedan
    // desincronizarse — son el mismo calculo.
    const rielFases = document.querySelector('.fases');

    if (rielFases) {
        const nodos = Array.from(rielFases.querySelectorAll('.fase'));
        const sinMovimientoRiel = window.matchMedia('(prefers-reduced-motion: reduce)');
        let rafRiel = null;

        // Coloca cada punto en el eje de su fase. Se mide en vez de
        // calcularlo en el CSS para que siga cuadrando si un titular
        // ocupa dos lineas o cambia la tipografia.
        //
        // [1-sep-2026] Dos alturas segun el ancho, porque el layout ya
        // no es el mismo a los dos lados del corte:
        //  · >900: texto y pieza van enfrentados y CENTRADOS, asi que
        //    el punto cae a media altura del bloque de texto — su eje
        //    de simetria. Antes iba al titulo y, con las columnas ya
        //    centradas, quedaba flotando por encima de todo.
        //  · <=900: una sola columna con el riel al borde. Ahi el punto
        //    tiene que marcar el ARRANQUE de la fase, o sea el titulo:
        //    a media altura caeria en mitad del parrafo, o mas abajo
        //    aun con la pieza debajo, y no senyalaria nada.
        const unaColumna = window.matchMedia('(max-width: 900px)');

        function alinearMarcas() {
            nodos.forEach((fase) => {
                const cuerpo = fase.querySelector('.fase-cuerpo');
                const titulo = fase.querySelector('.fase-t');
                const ref = unaColumna.matches ? titulo : cuerpo;
                if (!ref) return;
                const y = ref.offsetTop + ref.offsetHeight / 2;
                fase.style.setProperty('--marca-y', y + 'px');
            });
        }

        function pintarRiel() {
            rafRiel = null;

            const cabeza = window.innerHeight * 0.5;
            const rielCaja = rielFases.getBoundingClientRect();

            // Posicion de cada nodo dentro del riel. Se lee del punto
            // (.fase-marca) y no del <li>, porque el punto es lo que el
            // ojo ve encenderse.
            const marcas = nodos.map((fase) => {
                const marca = fase.querySelector('.fase-marca');
                const caja = (marca || fase).getBoundingClientRect();
                return {
                    fase: fase,
                    centroEnPantalla: caja.top + caja.height / 2,
                    centroEnRiel: caja.top + caja.height / 2 - rielCaja.top
                };
            });

            if (!marcas.length) return;

            const primero = marcas[0];
            const ultimo = marcas[marcas.length - 1];

            // Cuanto ha recorrido la cabeza de lectura entre el primer
            // nodo y el ultimo, de 0 a 1.
            const recorrido = ultimo.centroEnPantalla - primero.centroEnPantalla;
            let t = recorrido > 0
                ? (cabeza - primero.centroEnPantalla) / recorrido
                : 0;
            t = Math.min(1, Math.max(0, t));

            // De ahi al alto real de la linea: se traduce a la posicion
            // del nodo correspondiente para que el frente naranja muera
            // justo en un punto y no a media altura entre dos.
            //
            // [1-sep-2026] Salvo al final. El recorrido acaba en el ultimo
            // NODO, pero la linea sigue mas abajo hasta la bola del bloque
            // de cierre: parando el naranja en el nodo, ese tramo se
            // quedaba gris y la linea se veia cortada en dos.
            // Por eso, pasado el ultimo nodo, el frente sigue avanzando
            // hasta el final del riel — que es justo donde esta la bola.
            const alto = rielCaja.height || 1;
            let avance;
            if (t < 1) {
                avance = (primero.centroEnRiel +
                    (ultimo.centroEnRiel - primero.centroEnRiel) * t) / alto;
            } else {
                // Segundo tramo: del ultimo nodo al final de la linea,
                // medido con la misma cabeza de lectura.
                const restante = alto - ultimo.centroEnRiel;
                const yaRecorrido = cabeza - ultimo.centroEnPantalla;
                const t2 = restante > 0
                    ? Math.min(1, Math.max(0, yaRecorrido / restante))
                    : 1;
                avance = (ultimo.centroEnRiel + restante * t2) / alto;
            }

            rielFases.style.setProperty('--riel-avance', avance.toFixed(4));

            // Un nodo se enciende cuando el frente ya lo ha pasado.
            const frenteEnRiel = avance * alto;
            marcas.forEach((m) => {
                m.fase.classList.toggle('riel-alcanzado',
                    frenteEnRiel >= m.centroEnRiel - 1);
            });
        }

        function pedirRiel() {
            if (rafRiel === null) rafRiel = requestAnimationFrame(pintarRiel);
        }

        alinearMarcas();

        if (sinMovimientoRiel.matches) {
            // Sin movimiento: la linea aparece entera y los puntos
            // encendidos. Se mantiene el resultado, se quita el viaje.
            rielFases.style.setProperty('--riel-avance', '1');
            nodos.forEach((fase) => fase.classList.add('riel-alcanzado'));
        } else {
            window.addEventListener('scroll', pedirRiel, { passive: true });
            window.addEventListener('resize', () => {
                alinearMarcas();
                pedirRiel();
            });
            pintarRiel();
        }

        // Las fuentes de Google llegan despues del primer pintado y
        // cambian el alto de los titulares: sin esto los puntos quedan
        // desplazados hasta que alguien toca el scroll.
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                alinearMarcas();
                pedirRiel();
            });
        }
    }


    // 3. El hover de las tarjetas ya no necesita JS: era el resplandor que
    //    seguia al raton, retirado del CSS porque sobre fondo claro se leia
    //    como una mancha. La elevacion la hace ahora .glass-card:hover, que
    //    ademas respeta prefers-reduced-motion. [data-tilt] se queda en el
    //    HTML sin efecto; se puede limpiar al tocar la plantilla.


    // 3.2 PESTAÑAS DE "QUE CONSTRUYO"
    //     Solo se reproduce el video del panel visible: los tres a la vez
    //     gastaban CPU y bateria sin que nadie mirase dos de ellos.
    const tabs = document.querySelectorAll('.pieza-tab');

    if (tabs.length > 0) {
        const abrirPieza = (tab) => {
            tabs.forEach(otra => {
                const panel = document.getElementById(otra.getAttribute('aria-controls'));
                const activa = (otra === tab);

                otra.classList.toggle('is-active', activa);
                otra.setAttribute('aria-selected', activa ? 'true' : 'false');
                // Solo la pestaña activa entra en el orden de tabulacion:
                // dentro de un tablist las flechas mueven, no el tabulador.
                otra.tabIndex = activa ? 0 : -1;

                if (!panel) return;
                panel.hidden = !activa;

                const video = panel.querySelector('video');
                if (!video) return;
                if (activa) {
                    // play() devuelve promesa: si el navegador la rechaza
                    // (politica de autoplay) no debe romper el resto.
                    const p = video.play();
                    if (p) p.catch(() => {});
                } else {
                    video.pause();
                }
            });
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => abrirPieza(tab));

            tab.addEventListener('keydown', (e) => {
                const i = Array.from(tabs).indexOf(tab);
                let destino = null;

                if (e.key === 'ArrowRight') destino = tabs[(i + 1) % tabs.length];
                else if (e.key === 'ArrowLeft') destino = tabs[(i - 1 + tabs.length) % tabs.length];
                else if (e.key === 'Home') destino = tabs[0];
                else if (e.key === 'End') destino = tabs[tabs.length - 1];
                else return;

                e.preventDefault();
                abrirPieza(destino);
                destino.focus();
            });
        });
    }

    // 3.5 KPI COUNT UP FOR SYSTEMS CARD
    const kpis = document.querySelectorAll('.kpi-count');
    if (kpis.length > 0) {
        const kpiObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const val = parseInt(el.getAttribute('data-val'));
                    let current = 0;
                    const duration = 1500; // 1.5 segundos
                    const stepTime = Math.abs(Math.floor(duration / val));
                    
                    const isPlus = el.textContent.startsWith('+');
                    
                    const timer = setInterval(() => {
                        current += Math.ceil(val / 30); // incrementos más rápidos
                        if (current >= val) {
                            el.textContent = (isPlus ? '+' : '') + val;
                            clearInterval(timer);
                        } else {
                            el.textContent = (isPlus ? '+' : '') + current;
                        }
                    }, Math.max(stepTime, 20));
                    
                    kpiObserver.unobserve(el);
                }
            });
        }, { threshold: 0.2 });
        
        kpis.forEach(kpi => kpiObserver.observe(kpi));
    }


    // 5. ENVÍO DE FORMULARIO DE CONTACTO INTERACTIVO
    const contactForm = document.getElementById('diagnostico-form');
    const formMessage = document.getElementById('form-message');

    if (contactForm && formMessage) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Validar campo Honeypot para bloquear bots automatizados
            const honey = document.getElementById('validation_honey');
            if (honey && honey.value.trim() !== '') {
                console.warn("Spam bot detected. Submission aborted.");
                return;
            }

            const submitBtn = contactForm.querySelector('.btn-submit');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : "Reservar mi sesión de 20 min &rarr;";

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = "Enviando...";
            }

            formMessage.className = "form-message";
            formMessage.textContent = "Enviando...";

            const data = {
                nombre: document.getElementById('nombre').value,
                empresa: document.getElementById('empresa').value,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                problema: document.getElementById('mensaje').value || "",
                fecha: new Date().toISOString(),
                origen: "Web Home v3"
            };

            try {
                const response = await fetch("https://alberto-core-n8n.saeasu.easypanel.host/webhook/d127116a-771a-4670-8f52-1288034a25e5", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    formMessage.className = "form-message success";
                    formMessage.textContent = "✓ Hecho. Te acabo de mandar un correo para que elijas hora. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).";
                    contactForm.reset();
                    // Limpiar clases focused y has-value de los inputs para resetear floating labels
                    contactForm.querySelectorAll('.form-group').forEach(group => {
                        group.classList.remove('focused', 'has-value');
                    });
                } else {
                    throw new Error("Server error");
                }
            } catch (error) {
                console.error("Error submitting form:", error);
                formMessage.className = "form-message error";
                formMessage.textContent = "Hubo un error al enviar la solicitud. Por favor, inténtalo de nuevo o contáctanos por WhatsApp.";
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }

    // 6. ACORDEÓN DE PREGUNTAS FRECUENTES (FAQ)
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        
        trigger.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Cerrar todos los demás acordeones abiertos
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-content').style.maxHeight = null;
            });
            
            // Si el actual no estaba activo, abrirlo
            if (!isActive) {
                item.classList.add('active');
                const content = item.querySelector('.faq-content');
                // Ajustar dinámicamente la altura según el scrollHeight real
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    });

    // 7. AURORA DEL HERO Y DEL PIE
    //    Manchas de color muy difuminadas sobre el carbon. Va en canvas y
    //    no en un radial-gradient de CSS porque a este tamano el CSS corta
    //    en bandas visibles; aqui el degradado es continuo y ademas se
    //    puede mover sin repintar capas.
    //
    //    Sustituye a la masa de fibras 3D que habia antes: aquella tenia
    //    el verde #0F1F1B cocido dentro (rgba(15,31,27) y una formula que
    //    generaba tonos verdosos), asi que sobre el carbon nuevo salia
    //    sucia. El original esta guardado por si hiciera falta.
    //
    //    El terracota manda: mancha mas ancha, mas opaca y mas alta que
    //    las demas, porque es el color de accion. El resto acompana y cae
    //    en intensidad hacia la derecha, para que el conjunto se lea como
    //    una sola luz calida y no como cinco focos iguales.
    const auroraLienzos = document.querySelectorAll('.aurora-canvas');
    if (auroraLienzos.length) {
        // Las manchas viven FUERA del cuadro por abajo (y > 1) y solo
        // asoma su halo: la luz entra por el borde inferior, no baña la
        // pantalla.
        //
        // Altura y opacidad se compensan. Al principio estaban altas Y
        // opacas, y el titular caia sobre el rosa claro con 1.17 de
        // contraste. Bajarlas lo arreglo pero dejo el hero casi negro.
        // Ahora suben otra vez pero a la MITAD de opacidad: el color se
        // ve en toda la mitad inferior y el titular sigue sobre carbon.
        const PARADAS = [
            { x: 0.02, y: 1.10, r: 0.72, c: [222, 104,  48], a: 0.40 },  // terracota
            { x: 0.28, y: 1.20, r: 0.58, c: [172,  58, 112], a: 0.28 },  // magenta
            { x: 0.52, y: 1.16, r: 0.58, c: [134,  66, 196], a: 0.30 },  // violeta
            { x: 0.76, y: 1.22, r: 0.52, c: [ 58,  80, 190], a: 0.25 },  // azul
            { x: 0.97, y: 1.12, r: 0.54, c: [  0, 138, 126], a: 0.23 }   // teal
        ];
        const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

        const auroras = Array.from(auroraLienzos).map((lienzo) => {
            const ctx = lienzo.getContext('2d');
            // El pie es mucho mas bajo que el hero: sin este factor las
            // manchas quedarian fuera de cuadro y solo se veria negro.
            const alto = parseFloat(lienzo.dataset.alto) || 1;
            let w = 0, h = 0, raf = null;

            function medir() {
                const dpr = Math.min(window.devicePixelRatio || 1, 2);
                w = Math.max(1, lienzo.offsetWidth);
                h = Math.max(1, lienzo.offsetHeight);
                lienzo.width = Math.round(w * dpr);
                lienzo.height = Math.round(h * dpr);
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            function pintar(t) {
                ctx.clearRect(0, 0, w, h);
                ctx.fillStyle = '#121316';
                ctx.fillRect(0, 0, w, h);

                const d = Math.max(w, h);
                ctx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < PARADAS.length; i++) {
                    const p = PARADAS[i];
                    let dx = 0, dy = 0;
                    if (t) {
                        // Cada mancha con su propia fase: si compartieran
                        // una sola, se moverian en bloque y se notaria.
                        dx = Math.sin(t * 0.00021 + i * 1.7) * 0.055;
                        dy = Math.cos(t * 0.00017 + i * 2.3) * 0.035;
                    }
                    const cx = (p.x + dx) * w;
                    const cy = (p.y + dy) * h * alto;
                    const rr = p.r * d;
                    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
                    const [r0, g0, b0] = p.c;
                    g.addColorStop(0,    `rgba(${r0},${g0},${b0},${p.a})`);
                    g.addColorStop(0.45, `rgba(${r0},${g0},${b0},${p.a * 0.36})`);
                    g.addColorStop(1,    `rgba(${r0},${g0},${b0},0)`);
                    ctx.fillStyle = g;
                    ctx.beginPath();
                    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalCompositeOperation = 'source-over';
            }

            function bucle(ms) {
                pintar(ms);
                raf = requestAnimationFrame(bucle);
            }

            medir();
            pintar(0);

            return {
                arrancar() { if (raf === null && !menosMovimiento.matches) raf = requestAnimationFrame(bucle); },
                parar()    { if (raf !== null) { cancelAnimationFrame(raf); raf = null; } pintar(0); },
                remedir()  { medir(); pintar(0); }
            };
        });

        function refrescarAuroras() {
            auroras.forEach((a) => (menosMovimiento.matches ? a.parar() : a.arrancar()));
        }
        refrescarAuroras();
        menosMovimiento.addEventListener('change', refrescarAuroras);

        let idRedim = null;
        window.addEventListener('resize', () => {
            clearTimeout(idRedim);
            idRedim = setTimeout(() => {
                auroras.forEach((a) => a.remedir());
                refrescarAuroras();
            }, 120);
        });
    }


    // 10. INPUTS DE FORMULARIO ESTILO VERCEL (FLOATING LABELS)
    const formInputs = document.querySelectorAll('.glass-form input, .glass-form select, .glass-form textarea');
    formInputs.forEach(input => {
        const group = input.closest('.form-group');
        if (!group) return;

        input.addEventListener('focus', () => {
            group.classList.add('focused');
        });

        input.addEventListener('blur', () => {
            group.classList.remove('focused');
            if (input.value.trim() !== '') {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        });

        // Evento input para cuando cambia el valor
        input.addEventListener('input', () => {
            if (input.value.trim() !== '') {
                group.classList.add('has-value');
            } else {
                group.classList.remove('has-value');
            }
        });

        // Verificación inicial
        if (input.value && input.value.trim() !== '') {
            group.classList.add('has-value');
        }
    });

    // CARRUSEL DE CASOS REALES
    const casoTrack = document.querySelector('.caso-track');
    const casoDots = document.querySelectorAll('.caso-dot');

    if (casoTrack && casoDots.length) {
        const goToSlide = (index) => {
            casoTrack.style.transform = `translateX(-${index * 100}%)`;
            casoDots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
        };

        casoDots.forEach((dot) => {
            dot.addEventListener('click', () => {
                goToSlide(parseInt(dot.dataset.slide, 10));
            });
        });
    }

    // VIDEOS DE LOS PILARES
    // Dos cosas que el atributo autoplay no resuelve solo:
    // 1) Tres bucles a la vez son mucho movimiento para quien lo tiene
    //    desactivado en el sistema. El video se queda en su primer fotograma,
    //    pero sigue ahi: es contenido, no decoracion.
    // 2) Reproducir los tres a la vez desde el principio gasta CPU aunque
    //    esten fuera de pantalla, asi que solo corre el que se esta viendo.
    const pilarVideos = document.querySelectorAll('.pieza-video');

    if (pilarVideos.length) {
        const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (sinMovimiento) {
            pilarVideos.forEach((v) => {
                v.removeAttribute('autoplay');
                v.removeAttribute('loop');
                v.pause();
            });
        } else if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // play() devuelve una promesa que el navegador puede
                        // rechazar (politicas de autoplay): sin catch salta un
                        // error no capturado en consola.
                        entry.target.play().catch(() => {});
                    } else {
                        entry.target.pause();
                    }
                });
            }, { threshold: 0.25 });

            pilarVideos.forEach((v) => observer.observe(v));
        }
    }

    // ── LA FLOR QUE SE ABRE CON EL SCROLL ──────────────────────────
    // [1-sep-2026] La flor del bloque de cierre no va en bucle: su
    // apertura la controla el scroll, igual que el riel naranja de las
    // fases. El video no se reproduce — se le mueve currentTime a mano
    // segun donde este la tarjeta en pantalla.
    //
    // Con arranque automatico, no scroll puro: al entrar en pantalla se
    // abre sola una vez. Si no, quien pasa deprisa veria una flor
    // cerrada e inmovil — que es justo lo contrario de lo que la pieza
    // cuenta. A partir de esa primera apertura, manda el dedo.
    const flor = document.querySelector('.tarjeta--alta video');

    if (flor) {
        const sinMovimientoFlor = window.matchMedia('(prefers-reduced-motion: reduce)');
        let rafFlor = null;
        let arrancada = false;
        let manda = false;   // pasa a true cuando termina la apertura automatica

        // Sin autoplay ni loop: este video no se reproduce solo nunca.
        flor.removeAttribute('autoplay');
        flor.removeAttribute('loop');
        flor.loop = false;
        flor.pause();

        function pintarFlor() {
            rafFlor = null;
            if (!manda || !flor.duration) return;

            const caja = flor.getBoundingClientRect();
            // De 0 a 1 segun cuanto ha subido la tarjeta por la pantalla.
            // Se mide contra el alto de ventana + el de la tarjeta para
            // que el recorrido completo quepa en un scroll natural.
            const total = window.innerHeight + caja.height;
            const hecho = window.innerHeight - caja.top;
            let t = Math.min(1, Math.max(0, hecho / total));

            // El tramo util es el central: los extremos se gastarian
            // mientras la tarjeta aun entra o ya sale de pantalla.
            t = Math.min(1, Math.max(0, (t - 0.18) / 0.5));

            const destino = t * (flor.duration - 0.05);
            // Solo se toca si el salto es apreciable: escribir
            // currentTime en cada frame con diferencias minimas hace
            // que el video tartamudee.
            if (Math.abs(flor.currentTime - destino) > 0.03) {
                // seekable vacio = el navegador aun no puede saltar (el
                // video no tiene datos suficientes). Se reintenta al frame
                // siguiente en vez de perder la orden.
                if (flor.seekable && flor.seekable.length) {
                    flor.currentTime = destino;
                } else {
                    pedirFlor();
                }
            }
        }

        function pedirFlor() {
            if (rafFlor === null) rafFlor = requestAnimationFrame(pintarFlor);
        }

        if (sinMovimientoFlor.matches) {
            // Sin movimiento: la flor se queda abierta del todo. Se
            // mantiene el resultado y se quita el viaje.
            flor.addEventListener('loadedmetadata', () => {
                flor.currentTime = flor.duration - 0.05;
            });
        } else if ('IntersectionObserver' in window) {
            const obsFlor = new IntersectionObserver((entradas) => {
                entradas.forEach((e) => {
                    if (!e.isIntersecting || arrancada) return;
                    arrancada = true;
                    // La apertura automatica de bienvenida. Cuando
                    // termina, el scroll toma el control.
                    // Se escucha 'ended' en vez de vigilar currentTime a
                    // mano: al acabar, el navegador lo devuelve a 0 antes de
                    // que un requestAnimationFrame llegue a leerlo, y la flor
                    // se quedaba cerrada y sorda al scroll.
                    function tomaElMando() {
                        if (manda) return;
                        manda = true;
                        window.addEventListener('scroll', pedirFlor, { passive: true });
                        window.addEventListener('resize', pedirFlor);
                        pedirFlor();
                    }

                    // El mando pasa al scroll en cuanto acaba la apertura.
                    // No se toca currentTime aqui: al terminar, el navegador
                    // lo devuelve a 0 por su cuenta DESPUES de este manejador
                    // y cualquier valor que se escriba se pierde. Da igual —
                    // el primer pintarFlor() lo coloca donde toca segun el
                    // scroll, que es justo lo que queremos.
                    flor.addEventListener('ended', () => {
                        flor.pause();
                        tomaElMando();
                    }, { once: true });

                    // Si el navegador bloquea el autoplay, el scroll se hace
                    // cargo directamente y la flor nunca se queda cerrada.
                    flor.play().catch(tomaElMando);
                });
            }, { threshold: 0.3 });

            obsFlor.observe(flor);
        }
    }
});
