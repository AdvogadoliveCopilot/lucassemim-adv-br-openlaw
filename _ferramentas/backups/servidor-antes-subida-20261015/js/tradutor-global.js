/* =========================================================== */
/* === FICHEIRO: js/tradutor-global.js (TradutorGlobal V3.1) == */
/* === FUNÇÃO: Tradução via Google com Interface de Elite  === */
/* === DATA: 11/06/2026                                    === */
/* === V3.1: fallback de timeout + onerror no script do    === */
/* ===       Google Translate legado (widget instável) —   === */
/* ===       esconde o seletor em vez de deixá-lo quebrado. === */
/* =========================================================== */

window.TradutorGlobal = {
  config: {
    pageLanguage: 'pt',
    languages: [
      {
        code: 'pt', label: 'Português',
        abbr: 'PT', flagClass: 'flag-br',
        flagUrl: 'https://flagcdn.com/w80/br.png'
      },
      {
        code: 'en', label: 'English',
        abbr: 'EN', flagClass: 'flag-us',
        flagUrl: 'https://flagcdn.com/w80/us.png'
      },
      {
        code: 'es', label: 'Español',
        abbr: 'ES', flagClass: 'flag-es',
        flagUrl: 'https://flagcdn.com/w80/es.png'
      }
    ],
    cookieName:    'googtrans',
    storageKey:    'semim_lang',
    googleScriptUrl: '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit',
    loadDelayMs:   2000,
    /* V3.1: tempo máximo de espera pelo script externo do Google antes de
       assumir falha e esconder o seletor de idiomas (widget legado e
       historicamente instável/depreciado). */
    fallbackTimeoutMs: 5000,
    styleId:       'tradutor-global-styles',
    isDebug:       window.location.hostname !== 'lucassemim.adv.br'
  },

  state: {
    currentLang:  'pt',
    container:    null,
    googleLoaded: false,
    reducedMotion: false,
    /* V3.1: controle do fallback de indisponibilidade do Google Translate */
    fallbackTimerId:   null,
    fallbackTriggered: false
  },

  init() {
    this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.state.currentLang  = this.detectCurrentLang();

    this.injectStyles();
    this.buildContainer();
    this.setActive(this.state.currentLang);
    this.coordenateWithMobileBar();

    const googleEl = document.createElement('div');
    googleEl.id = 'google_translate_element';
    googleEl.className = 'tradutor-google-hidden';
    document.body.appendChild(googleEl);

    this.loadGoogleTranslate();

    if (this.config.isDebug) {
      console.log(`[TradutorGlobal V3] Idioma ativo: ${this.state.currentLang}`);
    }
  },

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      /* === TradutorGlobal V3 === */

      .goog-te-banner-frame { display: none !important; }
      .goog-te-gadget       { display: none !important; }
      .goog-te-gadget-icon  { display: none !important; }
      body                  { top: 0px !important; }

      .tradutor-google-hidden { display: none !important; }

      /* V3.1: aplicado quando o script externo do Google Translate falha
         ao carregar (erro de rede/bloqueador) ou não responde dentro do
         tempo limite — esconde o seletor em vez de deixar um widget
         quebrado e clicável (que recarregaria a página sem traduzir). */
      #flags-container.tradutor-unavailable { display: none !important; }

      #flags-container {
        position: fixed;
        bottom: 20px; left: 20px;
        z-index: 9998;
        display: flex; flex-direction: row;
        align-items: center; gap: 10px;
        background: rgba(10,10,12,0.88);
        padding: 8px 14px;
        border-radius: 50px;
        border: 1px solid rgba(212,175,55,0.3);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        box-shadow: 0 8px 24px rgba(0,0,0,0.6);
        transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.25s ease;
      }
      #flags-container:hover {
        border-color: #d4af37;
        box-shadow: 0 8px 28px rgba(212,175,55,0.2);
        transform: translateY(-3px);
      }
      @media (prefers-reduced-motion: reduce) {
        #flags-container:hover { transform: none; }
        #flags-container { transition: border-color 0.3s; }
      }

      .globe-icon {
        color: #d4af37; font-size: 1.05rem;
        opacity: 0.75; flex-shrink: 0;
        animation: spinGlobe 18s linear infinite;
      }
      @media (prefers-reduced-motion: reduce) {
        .globe-icon { animation: none; }
      }
      @keyframes spinGlobe { to { transform: rotate(360deg); } }

      .flag-btn {
        width: 26px; height: 26px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        background-size: cover;
        background-position: center;
        background-color: #333;
        filter: grayscale(55%);
        transition: transform 0.2s ease, border-color 0.2s ease, filter 0.25s ease;
        color: transparent;
        display: flex; align-items: center; justify-content: center;
        font-family: 'Teko', sans-serif; font-size: 0.65rem; font-weight: 700;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
      }
      .flag-btn:hover, .flag-btn:focus-visible {
        transform: scale(1.22);
        filter: grayscale(0%);
        outline: none;
      }
      .flag-btn:focus-visible { box-shadow: 0 0 0 2px #d4af37; }

      .flag-active {
        border-color: #d4af37;
        filter: grayscale(0%);
        box-shadow: 0 0 10px rgba(212,175,55,0.45);
        transform: scale(1.12);
      }

      .flag-img-error {
        background-image: none !important;
        background-color: rgba(212,175,55,0.15) !important;
        color: #d4af37 !important;
        border-color: rgba(212,175,55,0.4);
        filter: none !important;
      }

      @media (max-width: 768px) {
        #flags-container {
          bottom: 15px; left: 15px;
          padding: 6px 12px; gap: 8px;
        }
        .flag-btn  { width: 24px; height: 24px; }
        .globe-icon { font-size: 0.95rem; }
      }
    `;
    document.head.appendChild(style);
  },

  buildContainer() {
    const container = document.createElement('div');
    container.id = 'flags-container';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Seletor de idioma');

    container.appendChild(this.buildGlobeIcon());

    this.config.languages.forEach(lang => {
      container.appendChild(this.buildButton(lang));
    });

    document.body.appendChild(container);
    this.state.container = container;
  },

  buildGlobeIcon() {
    const i = document.createElement('i');
    i.className = 'fas fa-globe-americas globe-icon';
    i.setAttribute('aria-hidden', 'true');
    return i;
  },

  buildButton(lang) {
    const btn = document.createElement('div');
    btn.className = `flag-btn ${lang.flagClass}`;
    btn.setAttribute('role', 'button');
    btn.setAttribute('tabindex', '0');
    btn.setAttribute('aria-label', `Traduzir página para ${lang.label}`);
    btn.setAttribute('title', lang.label);
    btn.setAttribute('data-lang', lang.code);

    btn.textContent = lang.abbr;

    btn.style.backgroundImage = `url('${lang.flagUrl}')`;

    const testImg = new Image();
    testImg.onerror = () => btn.classList.add('flag-img-error');
    testImg.src = lang.flagUrl;

    if (this.state.currentLang === lang.code) {
      btn.classList.add('flag-active');
      btn.setAttribute('aria-pressed', 'true');
    }

    btn.addEventListener('click', () => this.changeLanguage(lang.code));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.changeLanguage(lang.code);
      }
    });

    return btn;
  },

  setActive(code) {
    if (!this.state.container) return;
    this.state.container.querySelectorAll('.flag-btn').forEach(btn => {
      const isActive = btn.getAttribute('data-lang') === code;
      btn.classList.toggle('flag-active', isActive);
      btn.setAttribute('aria-pressed', String(isActive));
    });
  },

  detectCurrentLang() {
    try {
      const cookieMatch = document.cookie.match(/googtrans=\/auto\/([a-z]{2})/i);
      if (cookieMatch) return cookieMatch[1].toLowerCase();
      
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored && this.config.languages.some(l => l.code === stored)) return stored;
    } catch { }
    return this.config.pageLanguage;
  },

  changeLanguage(code) {
    if (code === this.state.currentLang) return;

    this.trackEvent('idioma_trocado', code);

    try {
      localStorage.setItem(this.config.storageKey, code);
    } catch { }

    this.setCookie(this.config.cookieName, `/auto/${code}`);

    window.location.reload();
  },

  setCookie(name, value) {
    const domain = window.location.hostname;
    const sameSite = 'SameSite=Lax';

    document.cookie = `${name}=${value}; domain=${domain}; path=/; ${sameSite}`;
    document.cookie = `${name}=${value}; path=/; ${sameSite}`;
  },

  loadGoogleTranslate() {
    setTimeout(() => {
      const googleEl = document.getElementById('google_translate_element');
      if (!googleEl) return;

      const script = document.createElement('script');
      script.src = this.config.googleScriptUrl;
      script.async = true;
      script.defer = true;

      // V3.1: sem handler de erro o script simplesmente falhava em
      // silêncio (bloqueador de anúncios, CSP, rede) e o seletor de
      // idioma ficava visível e clicável sem nunca traduzir nada.
      script.onerror = () => this.handleGoogleTranslateFailure('script_error');

      document.body.appendChild(script);

      this.state.fallbackTimerId = setTimeout(() => {
        if (!this.state.googleLoaded) {
          this.handleGoogleTranslateFailure('timeout');
        }
      }, this.config.fallbackTimeoutMs);

    }, this.config.loadDelayMs);
  },

  /* V3.1: chamado quando o script do Google Translate falha ao carregar
     (onerror) ou não fica pronto dentro do tempo limite (timeout). Em vez
     de deixar o seletor de bandeiras visível e quebrado — clicar nele só
     recarregaria a página sem traduzir nada — o widget é escondido. Se o
     Google ainda responder depois (rede lenta), onGoogleTranslateReady()
     reverte esse estado e mostra o seletor novamente. */
  handleGoogleTranslateFailure(reason) {
    if (this.state.googleLoaded || this.state.fallbackTriggered) return;
    this.state.fallbackTriggered = true;

    if (this.state.fallbackTimerId) {
      clearTimeout(this.state.fallbackTimerId);
      this.state.fallbackTimerId = null;
    }

    if (this.state.container) {
      this.state.container.classList.add('tradutor-unavailable');
    }

    if (this.config.isDebug) {
      console.warn(`[TradutorGlobal] Google Translate indisponível (${reason}). Seletor de idioma ocultado.`);
    }
  },

  onGoogleTranslateReady() {
    try {
      new window.google.translate.TranslateElement({
        pageLanguage: this.config.pageLanguage,
        includedLanguages: this.config.languages.map(l => l.code).join(','),
        autoDisplay: false
      }, 'google_translate_element');

      this.state.googleLoaded = true;

      // V3.1: limpar o timer de fallback e, caso o widget já tivesse
      // sido escondido por uma resposta lenta, mostrá-lo novamente.
      if (this.state.fallbackTimerId) {
        clearTimeout(this.state.fallbackTimerId);
        this.state.fallbackTimerId = null;
      }
      if (this.state.fallbackTriggered && this.state.container) {
        this.state.container.classList.remove('tradutor-unavailable');
      }
      this.state.fallbackTriggered = false;

      if (this.config.isDebug) console.log('[TradutorGlobal] Google Translate carregado.');
    } catch (err) {
      if (this.config.isDebug) console.error('[TradutorGlobal] Erro ao inicializar Google Translate:', err);
      this.handleGoogleTranslateFailure('init_error');
    }
  },

  coordenateWithMobileBar() {
    const mobileBar = document.getElementById('mobile-sticky-bar');
    const isMobile  = window.matchMedia('(max-width: 768px)').matches;

    if (isMobile && mobileBar && this.state.container) {
      const barH = mobileBar.offsetHeight || 75;
      this.state.container.style.bottom =
        `calc(${barH + 10}px + env(safe-area-inset-bottom, 0px))`;
    }

    const obs = new MutationObserver(() => {
      if (document.getElementById('mobile-sticky-bar')) {
        this.coordenateWithMobileBar();
        obs.disconnect();
      }
    });
    obs.observe(document.body, { childList: true });
  },

  trackEvent(action, label) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', action, {
        event_category: 'Tradutor_Global',
        event_label: label,
        idioma_destino: label,
        pagina_origem: window.location.pathname
      });
    } catch { }
  }
};

window.googleTranslateElementInit = function() {
  window.TradutorGlobal.onGoogleTranslateReady();
};

document.addEventListener('DOMContentLoaded', () => window.TradutorGlobal.init());