/* -------------------------------------------------------------
   INTERACTIVIDAD Y ANIMACIONES: CROMO LÍQUIDO & TITANIO
   ALBER CABRERA - WEB PREMIUM
   ------------------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    // Bloquear scroll inicial durante la breve carga
    document.body.classList.add('loading');

    // 1. LOADER MINIMALISTA (entrada suave, sin contador ni espera)
    const loaderEl = document.getElementById('loader');

    // Fundido de entrada rápido, sin cuenta atrás: la web aparece casi al instante
    setTimeout(() => {
        loaderEl.classList.add('cut-split');
        document.body.classList.remove('loading');
        setTimeout(() => {
            loaderEl.style.display = 'none';
        }, 900);

        // Si se llega con un #ancla en la URL (ej. desde el diagnóstico a #contacto),
        // el loader bloquea el scroll y el salto se pierde. Lo reejecutamos aquí.
        if (window.location.hash) {
            const target = document.querySelector(window.location.hash);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }, 400);


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


    // 3. HOVER SUTIL EN TARJETAS (sin tilt 3D: solo elevación + spotlight suave)
    const tiltCards = document.querySelectorAll('[data-tilt]');

    tiltCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            // Solo el resplandor sigue al ratón; sin rotación 3D
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
            card.style.transform = 'translateY(-6px)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
        });
    });

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


    // 4. SISTEMA DE PARTÍCULAS TÉCNICAS (CANVAS 2D) — desactivado: se deja solo el vídeo del hero
    const canvas = document.getElementById('hero-particles');
    if (canvas) {
    const ctx = canvas.getContext('2d');

    let particlesArray = [];
    const numberOfParticles = 65;
    
    // Dimensiones dinámicas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Clase Partícula
    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 1.5 + 0.5; // Partículas muy finas como polvo
            this.speedX = Math.random() * 0.4 - 0.2;
            this.speedY = Math.random() * 0.4 - 0.2;
            this.opacity = Math.random() * 0.5 + 0.1;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            // Rebotar en bordes
            if (this.x > canvas.width || this.x < 0) this.speedX = -this.speedX;
            if (this.y > canvas.height || this.y < 0) this.speedY = -this.speedY;
        }

        draw() {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Inicializar array
    function initParticles() {
        particlesArray = [];
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }
    }
    initParticles();

    // Dibujar conexiones finas entre partículas cercanas
    function connectParticles() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a; b < particlesArray.length; b++) {
                const dx = particlesArray[a].x - particlesArray[b].x;
                const dy = particlesArray[a].y - particlesArray[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 120) { // Distancia máxima de enlace
                    const opacity = (1 - (distance / 120)) * 0.06; // Enlaces casi invisibles, ultra-elegante
                    ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // Loop de animación
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
            particlesArray[i].draw();
        }
        connectParticles();
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
    } // fin if(canvas) — partículas desactivadas


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
            const originalBtnText = submitBtn ? submitBtn.innerHTML : "Enviar Solicitud de Proyecto &rarr;";
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = "PROCESANDO SOLICITUD...";
            }

            formMessage.className = "form-message";
            formMessage.textContent = "PROCESANDO SOLICITUD Y ENCRIPTANDO DATOS...";

            // Etiqueta legible del "camino" elegido para anteponerla al mensaje
            const selectCamino = document.getElementById('tipo-proyecto');
            const caminoTexto = selectCamino.selectedIndex > 0
                ? selectCamino.options[selectCamino.selectedIndex].text
                : "";
            const mensajeUsuario = document.getElementById('mensaje').value || "";
            const mensajeFinal = caminoTexto
                ? `[Cómo prefiere empezar: ${caminoTexto}]\n\n${mensajeUsuario}`
                : mensajeUsuario;

            const data = {
                nombre: document.getElementById('nombre').value,
                empresa: document.getElementById('empresa').value,
                email: document.getElementById('email').value,
                facturacion: document.getElementById('facturacion').value,
                tipo_proyecto: selectCamino.value,
                mensaje: mensajeFinal,
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
                    formMessage.textContent = "✓ ¡Solicitud enviada! Te acabo de mandar un correo para que agendes tu sesión. Revisa tu bandeja de entrada (y la carpeta de spam, por si acaso).";
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

    // 7. RED NEURONAL VIVA DEL HERO (nodos cobalto conectados, movimiento lento)
    const neuralCanvas = document.getElementById('hero-neural');
    if (neuralCanvas) {
        const nctx = neuralCanvas.getContext('2d');
        let nodes = [];
        let W, H;
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function resizeNeural() {
            W = neuralCanvas.width = neuralCanvas.offsetWidth;
            H = neuralCanvas.height = neuralCanvas.offsetHeight;
            // Densidad según ancho (menos nodos en móvil para rendimiento)
            const count = Math.min(70, Math.floor(W / 22));
            nodes = [];
            for (let i = 0; i < count; i++) {
                nodes.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    vx: (Math.random() - 0.5) * 0.22, // movimiento MUY lento
                    vy: (Math.random() - 0.5) * 0.22,
                    r: Math.random() * 1.6 + 0.8
                });
            }
        }
        resizeNeural();
        window.addEventListener('resize', resizeNeural);

        const LINK_DIST = 150;
        function drawNeural() {
            nctx.clearRect(0, 0, W, H);
            // Mover nodos
            for (const n of nodes) {
                n.x += n.vx; n.y += n.vy;
                if (n.x < 0 || n.x > W) n.vx *= -1;
                if (n.y < 0 || n.y > H) n.vy *= -1;
            }
            // Líneas de conexión (sinapsis)
            for (let i = 0; i < nodes.length; i++) {
                for (let j = i + 1; j < nodes.length; j++) {
                    const dx = nodes[i].x - nodes[j].x;
                    const dy = nodes[i].y - nodes[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < LINK_DIST) {
                        const alpha = (1 - dist / LINK_DIST) * 0.28;
                        nctx.strokeStyle = `rgba(90, 125, 255, ${alpha})`;
                        nctx.lineWidth = 1;
                        nctx.beginPath();
                        nctx.moveTo(nodes[i].x, nodes[i].y);
                        nctx.lineTo(nodes[j].x, nodes[j].y);
                        nctx.stroke();
                    }
                }
            }
            // Nodos
            for (const n of nodes) {
                nctx.fillStyle = 'rgba(120, 150, 255, 0.75)';
                nctx.beginPath();
                nctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
                nctx.fill();
            }
            if (!prefersReduced) requestAnimationFrame(drawNeural);
        }
        drawNeural();
    }

    // 8. BUCLE SIN CORTES PARA EL VÍDEO DEL FOOTER (FUNDIDO CRUZADO)
    const fvid1 = document.getElementById('footer-video-1');
    const fvid2 = document.getElementById('footer-video-2');

    if (fvid1 && fvid2) {
        let isFooterCrossfading = false;

        const onFooterTimeUpdate = (e) => {
            const active = e.target;
            const idle = active === fvid1 ? fvid2 : fvid1;
            const duration = active.duration;

            if (!duration || isFooterCrossfading) return;

            // Iniciamos el fundido cruzado 1.5 segundos antes de que termine el vídeo
            if (active.currentTime >= duration - 1.5) {
                isFooterCrossfading = true;
                idle.currentTime = 0;
                idle.play().then(() => {
                    idle.style.opacity = '0.45';
                    active.style.opacity = '0';

                    setTimeout(() => {
                        active.pause();
                        isFooterCrossfading = false;
                    }, 1300); // solape limpio
                }).catch(() => {
                    isFooterCrossfading = false;
                });
            }
        };

        fvid1.addEventListener('timeupdate', onFooterTimeUpdate);
        fvid2.addEventListener('timeupdate', onFooterTimeUpdate);
    }

    // 9. REVELADO DE TEXTO SCROLL-DRIVEN (ESTILO APPLE)
    const revealTexts = document.querySelectorAll('.reveal-text');
    function handleTextReveal() {
        const viewportCenter = window.innerHeight / 2;
        revealTexts.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elementCenter = rect.top + rect.height / 2;
            
            // Distancia del centro del elemento al centro de la pantalla
            const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
            const maxDistance = window.innerHeight * 0.45; // Radio de atenuación
            
            // Opacidad de 0.35 (en los bordes) a 1.0 (en el centro)
            let opacity = 1 - (distanceFromCenter / maxDistance);
            opacity = Math.max(0.35, Math.min(1.0, opacity));
            
            el.style.opacity = opacity;
        });
    }
    if (revealTexts.length > 0) {
        window.addEventListener('scroll', handleTextReveal);
        window.addEventListener('resize', handleTextReveal);
        handleTextReveal(); // Ejecución inicial
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
});
