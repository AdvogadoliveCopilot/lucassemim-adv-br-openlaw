/* =========================================================== */
/* === FICHEIRO: js/lgpd.js (LgpdConsent V3) ================= */
/* === FUNÇÃO: Consent Mode v2, Integração GA4 e Compliance == */
/* === DATA: 11/06/2026                                    === */
/* =========================================================== */

/* 
  NOTA TÉCNICA (Consent Mode v2):
  Para conformidade absoluta, o ideal é incluir o script de 'default' do Consent Mode
  diretamente no <head> do HTML, ANTES do carregamento do script do Google Analytics (gtag.js).
  Exemplo:
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('consent', 'default', {
      'analytics_storage': 'denied', 'ad_storage': 'denied',
      'ad_user_data': 'denied', 'ad_personalization': 'denied'
    });
  </script>
  Este módulo (lgpd.js) gerencia a interface, a atualização (update) e atua como fallback.
*/

window.LgpdConsent = {
    config: {
        storageKey: 'semim_lgpd_v',
        version: '2', // Incrementar se a Política de Privacidade mudar
        privacyUrl: '/politica-de-privacidade.html',
        animDurationMs: 400,
        styleId: 'lgpd-consent-styles',
        isDebug: window.location.hostname !== 'lucassemim.adv.br'
    },

    state: {
        banner: null,
        consentStatus: null,
        reducedMotion: false
    },

    init() {
        this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const saved = this.loadConsent();

        if (saved) {
            this.setConsent(saved);
            if (this.config.isDebug) console.log(`[LgpdConsent V3] Consentimento restaurado: ${saved}`);
            return;
        }

        this.setConsent('denied');
        this.injectStyles();
        this.buildBanner();
        this.coordenateWithMobileBar();
    },

    loadConsent() {
        try {
            const raw = localStorage.getItem(this.config.storageKey);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (data.version !== this.config.version) return null;
            return data.status;
        } catch {
            return null;
        }
    },

    saveConsent(status) {
        try {
            localStorage.setItem(this.config.storageKey, JSON.stringify({
                status,
                version: this.config.version,
                timestamp: new Date().toISOString()
            }));
        } catch { }
    },

    setConsent(status) {
        this.state.consentStatus = status;
        const s = status === 'granted' ? 'granted' : 'denied';

        const consentObj = {
            analytics_storage: s,
            ad_storage: s,
            ad_user_data: s,
            ad_personalization: s
        };

        const action = status === 'denied' && !this.loadConsent() ? 'default' : 'update';

        if (typeof gtag === 'function') {
            gtag('consent', action, consentObj);
        }

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(function() {
            if (typeof this.set === 'function') {
                this.set('consent', consentObj);
            }
        });
        window.dataLayer.push(['consent', action, consentObj]);
    },

    buildBanner() {
        const banner = document.createElement('div');
        banner.id = 'lgpd-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-modal', 'false');
        banner.setAttribute('aria-label', 'Aviso de privacidade e cookies — LGPD');
        banner.setAttribute('aria-live', 'polite');

        const text = this.buildText();
        const buttons = this.buildButtons();

        banner.appendChild(text);
        banner.appendChild(buttons);
        document.body.appendChild(banner);
        this.state.banner = banner;

        if (!this.state.reducedMotion) {
            setTimeout(() => {
                const firstBtn = banner.querySelector('.lgpd-btn-aceitar');
                if (firstBtn) firstBtn.focus();
            }, 450);
        }
    },

    buildText() {
        const p = document.createElement('p');
        p.className = 'lgpd-texto';

        const label = document.createElement('strong');
        label.className = 'lgpd-label';
        label.textContent = 'PRIVACIDADE & DEFESA:';

        const textNode1 = document.createTextNode(' Utilizamos cookies para garantir a segurança e a melhor experiência, em conformidade com a ');

        const lgpdStrong = document.createElement('strong');
        lgpdStrong.textContent = 'LGPD';

        const textNode2 = document.createTextNode(' e o Sigilo Advocatício. ');

        const link = document.createElement('a');
        link.href = this.config.privacyUrl;
        link.className = 'lgpd-link-politica';
        link.textContent = 'Saiba mais.';
        link.setAttribute('aria-label', 'Leia nossa Política de Privacidade');
        link.target = '_self';

        p.appendChild(label);
        p.appendChild(textNode1);
        p.appendChild(lgpdStrong);
        p.appendChild(textNode2);
        p.appendChild(link);
        
        return p;
    },

    buildButtons() {
        const wrapper = document.createElement('div');
        wrapper.className = 'lgpd-btns-wrapper';

        wrapper.appendChild(this.buildAcceptBtn());
        wrapper.appendChild(this.buildRejectBtn());
        
        return wrapper;
    },

    buildAcceptBtn() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lgpd-btn lgpd-btn-aceitar';
        btn.setAttribute('aria-label', 'Aceitar todos os cookies e continuar');
        btn.textContent = 'CONCORDAR E PROSSEGUIR';
        btn.addEventListener('click', () => this.accept());
        return btn;
    },

    buildRejectBtn() {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'lgpd-btn lgpd-btn-recusar';
        btn.setAttribute('aria-label', 'Aceitar apenas cookies essenciais');
        btn.textContent = 'APENAS ESSENCIAIS';
        btn.addEventListener('click', () => this.reject());
        return btn;
    },

    accept() {
        this.setConsent('granted');
        this.saveConsent('granted');
        this.trackEvent('lgpd_consent_aceito');
        this.closeBanner();
        if (this.config.isDebug) console.log('[LgpdConsent V3] Usuário aceitou todos os cookies.');
    },

    reject() {
        this.setConsent('denied');
        this.saveConsent('denied');
        this.trackEvent('lgpd_consent_recusado');
        this.closeBanner();
        if (this.config.isDebug) console.log('[LgpdConsent V3] Usuário recusou cookies não essenciais.');
    },

    closeBanner() {
        const banner = this.state.banner;
        if (!banner) return;

        banner.classList.add('lgpd-saindo');

        if (this.state.reducedMotion) {
            banner.remove();
            this.state.banner = null;
            return;
        }

        banner.addEventListener('transitionend', () => {
            banner.remove();
            this.state.banner = null;
        }, { once: true });
    },

    coordenateWithMobileBar() {
        const mobileBar = document.getElementById('mobile-sticky-bar');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        if (this.state.banner && isMobile && mobileBar) {
            const barH = mobileBar.offsetHeight || 75;
            this.state.banner.style.bottom = `calc(${barH + 10}px + env(safe-area-inset-bottom, 0px))`;
        }

        const obs = new MutationObserver(() => {
            if (document.getElementById('mobile-sticky-bar')) {
                this.coordenateWithMobileBar();
                obs.disconnect();
            }
        });
        obs.observe(document.body, { childList: true });
    },

    injectStyles() {
        if (document.getElementById(this.config.styleId)) return;
        const style = document.createElement('style');
        style.id = this.config.styleId;
        style.textContent = `
            /* === LgpdConsent V3 === */
            #lgpd-banner {
                position: fixed;
                bottom: 20px; left: 50%;
                transform: translateX(-50%);
                width: 92%; max-width: 1000px;
                background: rgba(10,10,10,0.97);
                border: 1px solid #2a2a2a;
                border-left: 5px solid #d4af37;
                color: #fff;
                padding: 20px 24px;
                border-radius: 8px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.85);
                z-index: 10001;
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 16px;
                backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
                animation: lgpdSlideUp 0.45s cubic-bezier(0.25,0.46,0.45,0.94) both;
                transition: opacity 0.4s ease, transform 0.4s ease;
            }
            #lgpd-banner.lgpd-saindo {
                opacity: 0;
                transform: translateX(-50%) translateY(20px);
            }
            
            @keyframes lgpdSlideUp {
                from { opacity: 0; transform: translateX(-50%) translateY(40px); }
                to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
            }
            
            @media (prefers-reduced-motion: reduce) {
                #lgpd-banner             { animation: none; }
                #lgpd-banner.lgpd-saindo { transition: none; opacity: 0; }
            }
            
            .lgpd-texto {
                margin: 0; font-size: 0.88rem;
                color: #bbb; flex: 1; min-width: 260px;
                font-family: 'Lato', sans-serif;
                line-height: 1.55;
            }
            .lgpd-label   { color: #d4af37; }
            .lgpd-texto strong { color: #d4af37; }
            .lgpd-link-politica {
                color: #d4af37; text-decoration: underline; text-underline-offset: 2px;
                font-weight: 600;
            }
            .lgpd-link-politica:hover { color: #fff; }
            
            .lgpd-btns-wrapper {
                display: flex; gap: 10px; flex-wrap: wrap; flex-shrink: 0;
            }
            .lgpd-btn {
                cursor: pointer; border-radius: 4px;
                font-family: 'Teko', sans-serif; font-size: 1.1rem;
                text-transform: uppercase; letter-spacing: 0.5px;
                padding: 9px 20px;
                transition: background 0.2s ease, color 0.2s ease, transform 0.15s ease;
                white-space: nowrap;
            }
            .lgpd-btn:focus-visible { outline: 2px solid #d4af37; outline-offset: 3px; }
            
            .lgpd-btn-aceitar {
                background: #d4af37; color: #000; border: none;
                font-size: 1.15rem;
            }
            .lgpd-btn-aceitar:hover { background: #fff; color: #000; }
            @media (prefers-reduced-motion: no-preference) {
                .lgpd-btn-aceitar:hover { transform: scale(1.04); }
            }
            
            .lgpd-btn-recusar {
                background: transparent; color: #888;
                border: 1px solid #444;
            }
            .lgpd-btn-recusar:hover { border-color: #888; color: #ccc; }
            
            @media (max-width: 600px) {
                #lgpd-banner { padding: 16px; gap: 12px; }
                .lgpd-btns-wrapper { width: 100%; }
                .lgpd-btn { flex: 1; text-align: center; justify-content: center; }
            }
        `;
        document.head.appendChild(style);
    },

    trackEvent(action) {
        try {
            if (typeof gtag !== 'function') return;
            gtag('event', action, {
                event_category: 'LGPD_Consent',
                event_label: action,
                pagina_origem: window.location.pathname
            });
        } catch { }
    }
};

document.addEventListener('DOMContentLoaded', () => window.LgpdConsent.init());