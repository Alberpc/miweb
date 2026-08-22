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

    // 7. MALLA ONDULANTE DEL HERO (rejilla de puntos dorados, oleaje lento)
    const meshCanvas = document.getElementById('hero-mesh');
    if (meshCanvas) {
        const mctx = meshCanvas.getContext('2d');
        let W, H, dpr;
        let points = [];
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const SPACING = 34; // separación de la rejilla en px CSS

        function resizeMesh() {
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = meshCanvas.offsetWidth;
            H = meshCanvas.offsetHeight;
            meshCanvas.width = W * dpr;
            meshCanvas.height = H * dpr;
            mctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            points = [];
            const cols = Math.ceil(W / SPACING) + 1;
            const rows = Math.ceil(H / SPACING) + 1;
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    const x = col * SPACING;
                    const y = row * SPACING;
                    // Distancia al centro del canvas: la malla se desvanece hacia los bordes
                    const dx = (x - W / 2) / (W / 2);
                    const dy = (y - H / 2) / (H / 2);
                    const edgeFade = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy));
                    points.push({ x, y, phase: (col * 0.5 + row * 0.35), edgeFade });
                }
            }
        }
        resizeMesh();
        window.addEventListener('resize', resizeMesh);

        function drawMesh(t) {
            mctx.clearRect(0, 0, W, H);
            const time = t * 0.00035;
            for (const p of points) {
                // Oleaje: desplazamiento vertical por seno con fase dependiente de la posición
                const wave = Math.sin(time + p.phase) * 6;
                const y = p.y + wave;
                const shimmer = (Math.sin(time * 1.6 + p.phase * 1.3) + 1) / 2; // 0..1
                const alpha = p.edgeFade * (0.16 + shimmer * 0.38);
                if (alpha <= 0.01) continue;
                mctx.fillStyle = `rgba(200, 168, 94, ${alpha})`;
                mctx.beginPath();
                mctx.arc(p.x, y, 1.6, 0, Math.PI * 2);
                mctx.fill();
            }
            if (!prefersReduced) requestAnimationFrame(drawMesh);
        }
        if (prefersReduced) {
            drawMesh(0);
        } else {
            requestAnimationFrame(drawMesh);
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
});
