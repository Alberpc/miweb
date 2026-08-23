(function () {
    'use strict';

    var STORAGE_KEY = 'acc_consent_v1';

    function leerConsentimiento() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            var data = JSON.parse(raw);
            if (typeof data.analytics !== 'boolean') return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function guardarConsentimiento(analytics) {
        var data = { analytics: analytics, ts: Date.now() };
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) { /* localStorage no disponible: el banner volvera a salir, no es grave */ }
        return data;
    }

    function aplicarConsentimiento(analytics) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('consent', 'update', {
            analytics_storage: analytics ? 'granted' : 'denied'
        });
    }

    function crearBanner() {
        var root = document.createElement('div');
        root.className = 'acc-root';
        root.innerHTML =
            '<div class="acc-banner acc-banner--on" role="dialog" aria-live="polite" aria-label="Preferencias de cookies">' +
                '<div class="acc-card">' +
                    '<p class="acc-text">Uso cookies propias tecnicas (necesarias) y, si lo aceptas, cookies de analitica para entender como se usa esta web. Puedes aceptarlas, rechazarlas o elegir. Mas info en la <a href="/cookies">politica de cookies</a>.</p>' +
                    '<div class="acc-prefs">' +
                        '<div class="acc-pref-row">' +
                            '<div class="acc-pref-info">' +
                                '<p class="acc-pref-title">Necesarias</p>' +
                                '<p class="acc-pref-desc">Imprescindibles para que la web funcione. Siempre activas.</p>' +
                            '</div>' +
                            '<label class="acc-switch">' +
                                '<input type="checkbox" checked disabled aria-label="Cookies necesarias, siempre activas">' +
                                '<span class="acc-switch-track"></span>' +
                            '</label>' +
                        '</div>' +
                        '<div class="acc-pref-row">' +
                            '<div class="acc-pref-info">' +
                                '<p class="acc-pref-title">Analitica</p>' +
                                '<p class="acc-pref-desc">Google Analytics, para saber que paginas se visitan mas y mejorar el sitio.</p>' +
                            '</div>' +
                            '<label class="acc-switch">' +
                                '<input type="checkbox" id="acc-toggle-analytics" aria-label="Cookies de analitica">' +
                                '<span class="acc-switch-track"></span>' +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                    '<div class="acc-actions">' +
                        '<button type="button" class="acc-btn" id="acc-btn-prefs">Elegir</button>' +
                        '<button type="button" class="acc-btn" id="acc-btn-reject">Rechazar</button>' +
                        '<button type="button" class="acc-btn" id="acc-btn-save" style="display:none;">Guardar preferencias</button>' +
                        '<button type="button" class="acc-btn acc-btn--primary" id="acc-btn-accept">Aceptar todas</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(root);
        return root;
    }

    function ocultar(root) {
        var banner = root.querySelector('.acc-banner');
        banner.classList.remove('acc-banner--on');
        setTimeout(function () { root.remove(); }, 50);
    }

    function iniciar() {
        var guardado = leerConsentimiento();
        if (guardado) {
            aplicarConsentimiento(guardado.analytics);
            return;
        }

        var root = crearBanner();
        var prefs = root.querySelector('.acc-prefs');
        var toggle = root.querySelector('#acc-toggle-analytics');
        var btnPrefs = root.querySelector('#acc-btn-prefs');
        var btnReject = root.querySelector('#acc-btn-reject');
        var btnAccept = root.querySelector('#acc-btn-accept');
        var btnSave = root.querySelector('#acc-btn-save');

        btnPrefs.addEventListener('click', function () {
            prefs.classList.add('acc-prefs--on');
            btnPrefs.style.display = 'none';
            btnReject.style.display = 'none';
            btnSave.style.display = '';
        });

        btnAccept.addEventListener('click', function () {
            aplicarConsentimiento(true);
            guardarConsentimiento(true);
            ocultar(root);
        });

        btnReject.addEventListener('click', function () {
            aplicarConsentimiento(false);
            guardarConsentimiento(false);
            ocultar(root);
        });

        btnSave.addEventListener('click', function () {
            var analytics = toggle.checked;
            aplicarConsentimiento(analytics);
            guardarConsentimiento(analytics);
            ocultar(root);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }

    // Permite reabrir el panel desde un enlace del footer ("Preferencias de cookies")
    window.accReabrirPreferencias = function () {
        var existente = document.querySelector('.acc-root');
        if (existente) existente.remove();
        var root = crearBanner();
        root.querySelector('.acc-prefs').classList.add('acc-prefs--on');
        root.querySelector('#acc-btn-prefs').style.display = 'none';
        root.querySelector('#acc-btn-reject').style.display = 'none';
        root.querySelector('#acc-btn-save').style.display = '';
        var guardado = leerConsentimiento();
        if (guardado) {
            root.querySelector('#acc-toggle-analytics').checked = guardado.analytics;
        }
        root.querySelector('#acc-btn-save').addEventListener('click', function () {
            var analytics = root.querySelector('#acc-toggle-analytics').checked;
            aplicarConsentimiento(analytics);
            guardarConsentimiento(analytics);
            ocultar(root);
        });
        root.querySelector('#acc-btn-accept').addEventListener('click', function () {
            aplicarConsentimiento(true);
            guardarConsentimiento(true);
            ocultar(root);
        });
    };
})();
