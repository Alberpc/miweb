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

    // 7. MASA DE FIBRAS 3D DEL HERO
    //    Hélices que recorren un volumen de sección irregular en diagonal
    //    ascendente. Cada fibra se dibuja por tramos ordenados por
    //    profundidad, de modo que las cercanas ocultan a las lejanas: eso
    //    es lo que da la lectura de volumen y de fibras entrelazadas.
    //    El tiempo nunca se SUMA a la posición (eso haría viajar la masa
    //    fuera del cuadro); solo MODULA amplitudes, así la forma queda
    //    anclada y lo que gira es el material sobre su propio eje.
    const meshCanvas = document.getElementById('hero-mesh');
    if (meshCanvas) {
        const mctx = meshCanvas.getContext('2d');
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let W, H, dpr, FIBERS, PORTRAIT = 0;
        const BOTTOM_FADE = 0.30;  // último 30%: los hilos se apagan antes del corte
        const STEPS = 96, SEG = 6, CAM = 4.4;

        function resizeMesh() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = meshCanvas.offsetWidth;
            H = meshCanvas.offsetHeight;
            meshCanvas.width = W * dpr;
            meshCanvas.height = H * dpr;
            mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            // Menos fibras en pantallas pequeñas: ahorra CPU y batería
            FIBERS = W < 700 ? 58 : (W < 1100 ? 88 : 120);
            // En formato vertical (móvil) la diagonal hay que TUMBARLA y
            // alargarla: si no, el recorrido se comprime, sale casi
            // vertical y muere contra el borde de arriba.
            PORTRAIT = Math.max(0, Math.min(1, (H / W - 1.0) / 0.9));
        }
        resizeMesh();
        window.addEventListener('resize', resizeMesh);

        // Eje de la masa: diagonal fija abajo-izquierda → arriba-derecha.
        // En vertical se alarga el recorrido horizontal y se recorta el
        // ascenso, para que cruce en diagonal en vez de dispararse arriba.
        function axis(u, t) {
            const s1 = Math.sin(u * 3.1), s2 = Math.sin(u * 5.4), s3 = Math.cos(u * 2.2);
            const spanX = 3.5 + PORTRAIT * 1.5;    // más ancho al estrecharse
            const startX = -1.75 - PORTRAIT * 0.75;
            const rise = 2.30 - PORTRAIT * 0.95;   // menos subida: se tumba
            const startY = 1.15 - PORTRAIT * 0.28;
            return {
                x: startX + u * spanX + s2 * 0.14 * (0.6 + 0.4 * Math.sin(t * 0.42)),
                y: startY - u * rise + s1 * 0.16 * (0.6 + 0.4 * Math.sin(t * 0.33)),
                z: s3 * 0.50 * (0.5 + 0.5 * Math.sin(t * 0.27 + 1.4))
            };
        }

        function tangent(u, t) {
            const e = 0.005;
            const a = axis(Math.max(0, u - e), t), b = axis(Math.min(1, u + e), t);
            const d = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
            const L = Math.hypot(d.x, d.y, d.z) || 1;
            return { x: d.x / L, y: d.y / L, z: d.z / L };
        }

        // Dos perpendiculares al eje: definen la sección del volumen
        function frame(u, t) {
            const T = tangent(u, t);
            const up = Math.abs(T.z) > 0.9 ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 };
            let n1 = {
                x: T.y * up.z - T.z * up.y,
                y: T.z * up.x - T.x * up.z,
                z: T.x * up.y - T.y * up.x
            };
            const L = Math.hypot(n1.x, n1.y, n1.z) || 1;
            n1 = { x: n1.x / L, y: n1.y / L, z: n1.z / L };
            const n2 = {
                x: T.y * n1.z - T.z * n1.y,
                y: T.z * n1.x - T.x * n1.z,
                z: T.x * n1.y - T.y * n1.x
            };
            return { n1, n2 };
        }

        // Sección irregular a propósito: un radio constante se leería
        // como un tubo literal en vez de como una masa de fibras.
        function radius(u, a, t) {
            const body = 0.30 + Math.sin(Math.PI * Math.pow(u, 0.9)) * 0.85;
            const lobe = 1 + Math.sin(a * 2 + u * 3.0) * 0.26
                           + Math.sin(a * 3 - u * 2.1) * 0.15
                           + Math.sin(u * 6.0) * 0.12 * Math.sin(t * 0.3);
            return 0.34 * body * lobe;
        }

        function point(a0, u, t, shell) {
            const c = axis(u, t);
            const fr = frame(u, t);
            const ang = a0 + u * 5.0 + t * 0.55;
            const r = radius(u, ang, t) * shell;
            const ca = Math.cos(ang), sa = Math.sin(ang);
            return {
                x: c.x + (fr.n1.x * ca + fr.n2.x * sa) * r,
                y: c.y + (fr.n1.y * ca + fr.n2.y * sa) * r,
                z: c.z + (fr.n1.z * ca + fr.n2.z * sa) * r,
                nz: (fr.n1.z * ca + fr.n2.z * sa)
            };
        }

        function project(p) {
            const k = CAM / Math.max(0.6, CAM - p.z);
            const S = Math.min(W, H * 1.75) * 0.29;
            // En vertical la masa se centra y baja: deja respirar el
            // titular arriba y ocupa la mitad inferior del hero.
            const cx = 0.66 - PORTRAIT * 0.10;
            const cy = 0.50 + PORTRAIT * 0.16;
            return { x: W * cx + p.x * k * S, y: H * cy + p.y * k * S, k };
        }

        // Desvanecido de borde: ninguna fibra llega viva al corte con la
        // sección clara de debajo, ni choca contra la barra de navegación.
        function edgeFade(y) {
            const bottom = 1 - Math.max(0, (y - H * (1 - BOTTOM_FADE)) / (H * BOTTOM_FADE));
            const top = Math.max(0, Math.min(1, y / (H * 0.10)));
            return Math.max(0, Math.min(1, bottom)) * top;
        }

        const dotSeeds = Array.from({ length: 1400 }, () => ({
            a0: Math.random() * Math.PI * 2 * 3.2,
            u: Math.random(),
            shell: 0.42 + Math.random() * 0.85,
            r: 0.4 + Math.random() * 0.9,
            a: 0.25 + Math.random() * 0.65,
            ph: Math.random() * 10
        }));

        function drawMesh(now) {
            const t = prefersReduced ? 0 : now * 0.00010;   // movimiento lento y sereno
            mctx.clearRect(0, 0, W, H);

            const segs = [];
            for (let i = 0; i < FIBERS; i++) {
                const a0 = (i / FIBERS) * Math.PI * 2 * 3.2;
                const shell = 0.42 + ((i * 0.618) % 1) * 0.78;
                let pts = [], zs = 0, ks = 0, nz = 0, n = 0;
                for (let s = 0; s <= STEPS; s++) {
                    const P3 = point(a0, s / STEPS, t, shell);
                    const P = project(P3);
                    pts.push(P); zs += P3.z; ks += P.k; nz += P3.nz; n++;
                    if (pts.length >= SEG || s === STEPS) {
                        segs.push({ pts: pts.slice(), z: zs / n, k: ks / n, nz: nz / n });
                        pts = [P]; zs = 0; ks = 0; nz = 0; n = 0;
                    }
                }
            }

            // Pintor: del fondo hacia delante, para que lo cercano oculte
            segs.sort((a, b) => a.z - b.z);

            for (const sg of segs) {
                const near = Math.max(0.25, Math.min(1.9, sg.k));
                const fog = Math.max(0, Math.min(1, (near - 0.62) / 0.75));
                const lit = Math.max(0, sg.nz) * 0.8 + 0.2;
                const fade = edgeFade(sg.pts[Math.floor(sg.pts.length / 2)].y);
                if (fade <= 0.02) continue;

                const path = () => {
                    mctx.beginPath();
                    mctx.moveTo(sg.pts[0].x, sg.pts[0].y);
                    for (let i = 1; i < sg.pts.length; i++) mctx.lineTo(sg.pts[i].x, sg.pts[i].y);
                };

                // Oclusión: las fibras del frente borran lo que pasa detrás
                if (fog > 0.60) {
                    path();
                    mctx.strokeStyle = `rgba(15, 31, 27, ${(fog - 0.60) * 1.7 * fade})`;
                    mctx.lineWidth = 2.4 * near;
                    mctx.stroke();
                }

                path();
                const light = lit * (0.35 + fog * 0.75);
                const lum = 58 + light * 128;
                mctx.strokeStyle = `rgba(${Math.round(lum * 0.40)}, ${Math.round(lum)}, ${Math.round(lum * 0.62)}, ${(0.05 + light * 0.34) * fade})`;
                mctx.lineWidth = 0.40 + near * 0.42;
                mctx.stroke();
            }

            // Polvo dorado sobre la masa. En pantallas pequeñas se dibuja
            // solo una parte de las semillas: mantiene la densidad visual
            // sin cargar el móvil con 1400 puntos por fotograma.
            const dotCount = W < 700 ? 520 : (W < 1100 ? 900 : dotSeeds.length);
            for (let di = 0; di < dotCount; di++) {
                const d = dotSeeds[di];
                const P = project(point(d.a0, d.u, t, d.shell));
                // En escritorio el texto ocupa la izquierda, así que el
                // polvo se recorta ahí. En móvil el texto es a todo ancho:
                // el recorte lateral no aplica, protege el desvanecido.
                if (P.x < W * 0.28 * (1 - PORTRAIT)) continue;
                const near = Math.max(0.25, Math.min(1.9, P.k));
                const fog = Math.max(0, Math.min(1, (near - 0.62) / 0.75));
                // Titileo lento y desfasado: sin filo dorado, el polvo es
                // el único acento cálido, así que se le da más presencia.
                const tw = (Math.sin(t * 1.4 + d.ph * 3.1) + 1) / 2;
                const alpha = d.a * (0.20 + fog * 0.80) * (0.28 + tw * 0.72) * 0.80 * edgeFade(P.y);
                if (alpha < 0.02) continue;
                mctx.fillStyle = `rgba(222, 196, 142, ${alpha})`;
                mctx.beginPath();
                mctx.arc(P.x, P.y, d.r * (0.6 + near * 0.5), 0, Math.PI * 2);
                mctx.fill();
            }

            if (!prefersReduced && heroVisible) requestAnimationFrame(drawMesh);
        }

        // Solo se anima mientras el hero está en pantalla: fuera de vista
        // no se gasta CPU ni batería en dibujar algo que nadie ve.
        let heroVisible = true;
        if (prefersReduced) {
            drawMesh(0);
        } else {
            requestAnimationFrame(drawMesh);
            const heroEl = meshCanvas.closest('.hero-section') || meshCanvas;
            new IntersectionObserver((entries) => {
                const wasVisible = heroVisible;
                heroVisible = entries[0].isIntersecting;
                if (heroVisible && !wasVisible) requestAnimationFrame(drawMesh);
            }, { threshold: 0 }).observe(heroEl);
        }
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
});
