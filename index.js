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
    //     Movida a assets/js/base.js (3-sep-2026): buscaba
    //     .navbar--en-hero, que ya no es exclusivo de la home
    //     (diagnostico-operativo tambien tiene hero en bloque). Vive en
    //     base.js porque lo cargan los tres layouts.

    // 1.5 MENÚ HAMBURGUESA (MÓVIL) y 2. SCROLL REVEAL
    //     Movidos a assets/js/base.js (3-sep-2026): eran copia exacta
    //     de lo que ya hacia base.js para el resto de paginas. La home
    //     no cargaba base.js y por eso llevaba su propia copia; ahora
    //     home.njk tambien lo carga (ver ese archivo).

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
                    // Marca para el bucle encadenado: si el video estaba
                    // en su respiro entre pasadas, al volver sabe que
                    // sigue a la vista y tiene que arrancar.
                    video.dataset.visible = '1';
                    // play() devuelve promesa: si el navegador la rechaza
                    // (politica de autoplay) no debe romper el resto.
                    const p = video.play();
                    if (p) p.catch(() => {});
                } else {
                    video.dataset.visible = '0';
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
    //    Movida a assets/js/aurora.js (3-sep-2026): el mismo motor de
    //    canvas ahora lo carga tambien diagnostico-operativo, asi que
    //    vive en un archivo compartido en vez de solo aqui.

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
            // EL BUCLE, a mano en vez de con el `loop` nativo.
            // La animacion de dentro se apaga sola antes de que acabe el
            // archivo (fundido de salida ~0.4s antes del final), asi que
            // el ULTIMO fotograma y el PRIMERO son identicos: papel liso.
            // Con `loop` el navegador corta de uno a otro de golpe y ese
            // salto de tiempo se nota igual aunque los dos extremos sean
            // iguales.
            // Aqui no se funde nada — tocar la opacidad seria peor, porque
            // el <video> se volveria transparente y se veria el panel gris
            // de la seccion. Lo que se hace es quedarse quieto en ese
            // ultimo fotograma blanco y rebobinar parado: el corte es de
            // un blanco a otro blanco identico, invisible por definicion,
            // y el respiro hace que se lea como un ciclo y no como un
            // bucle nervioso.
            // Minimo a proposito: la animacion YA deja ~0.4s de papel en
            // blanco al final del archivo, asi que este respiro se SUMA a
            // esos. A 500ms el hueco total pasaba de un segundo y se leia
            // como un paron. Con 120 el ciclo encadena casi seguido y
            // sigue sin el tiron del reinicio instantaneo.
            const REPOSO = 120;   // ms parado en el fotograma final

            const encadenar = (v) => {
                if (v.dataset.reiniciando === '1') return;
                v.dataset.reiniciando = '1';

                // Se queda como esta (ultimo fotograma, blanco) el respiro
                // entero; solo despues rebobina y arranca.
                window.setTimeout(() => {
                    v.currentTime = 0;
                    // Solo sigue si el video continua a la vista: si el
                    // usuario se ha ido, lo despierta el observer.
                    if (v.dataset.visible === '1') {
                        v.play().catch(() => {});
                    }
                    v.dataset.reiniciando = '0';
                }, REPOSO);
            };

            pilarVideos.forEach((v) => {
                // El `loop` del HTML estorba: reiniciaria al instante y no
                // dejaria el respiro.
                v.loop = false;
                v.addEventListener('ended', () => encadenar(v));
            });

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    const v = entry.target;
                    v.dataset.visible = entry.isIntersecting ? '1' : '0';
                    if (entry.isIntersecting) {
                        // play() devuelve una promesa que el navegador puede
                        // rechazar (politicas de autoplay): sin catch salta un
                        // error no capturado en consola.
                        if (v.dataset.reiniciando !== '1') {
                            v.play().catch(() => {});
                        }
                    } else {
                        v.pause();
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


// ── EL EMAIL, ARMADO EN CLIENTE ──────────────────────────────────────
// La direccion no viaja escrita en el HTML: los recolectores de spam
// rastrean `mailto:` y texto con arroba en el marcado. Aqui se junta a
// partir de los dos data-* y se convierte en enlace de verdad.
// Sin JS el enlace apunta al formulario, que hace el mismo trabajo.
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[data-mail][data-dom]').forEach((a) => {
        const destino = a.dataset.mail + String.fromCharCode(64) + a.dataset.dom;
        a.href = 'mailto:' + destino;
        a.setAttribute('aria-label', 'Escribir un correo');
        // El texto visible sigue diciendo "Email": la direccion se ve al
        // pasar el raton y al abrir el cliente de correo.
        a.title = destino;
    });
});
