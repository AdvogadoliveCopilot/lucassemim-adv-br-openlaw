/* =========================================================== */
/* === ARQUIVO: js/lgpd.js (LgpdConsent V1)                  === */
/* === FUNÇÃO: Banner de Consentimento de Cookies (LGPD)     === */
/* === Integra com o Google Consent Mode v2 via window.gtag  === */
/* === Lei nº 13.709/2018 (LGPD) — Dr. Lucas Renan Semim      === */
/* =========================================================== */

/*
  COMO FUNCIONA:
  1. No primeiro carregamento (sem escolha salva/válida), exibe uma barra
     fixa inferior com 3 ações: Aceitar Todos, Rejeitar Não-Essenciais,
     Personalizar (abre painel com toggles por categoria).
  2. A escolha é salva em localStorage (chave `semim_lgpd_consent`) com
     categorias + timestamp + versão da política, válida por 180 dias.
     Enquanto for válida, a barra não aparece de novo.
  3. A cada carregamento de página, se já existe uma escolha válida,
     ela é reaplicada via gtag('consent','update', ...) — sempre atrás de
     `typeof window.gtag === 'function'`, então funciona (sem erro) mesmo
     em páginas sem GTM/gtag carregado.
  4. A barra nunca fica por baixo de uma sticky bar mobile de CTA já
     existente na página (detecta por uma lista de seletores conhecidos
     e se posiciona acima dela) e empurra para cima outros botões
     flutuantes de canto (WhatsApp, chat) enquanto estiver visível,
     detectando-os por geometria (fixed + próximo do canto), não por
     nome de classe — já que cada página nomeia esses widgets diferente.
*/

window.LgpdConsent = {

  config: {
    storageKey:    'semim_lgpd_consent',
    policyVersion: '1.0',
    validityDays:  180,
    privacyHref:   'politica-de-privacidade.html',
    styleId:       'lgpd-consent-styles',
    isDebug:       window.location.hostname !== 'lucassemim.adv.br',

    // Mesma lista de seletores usada em chat-elite.js para reconhecer
    // barras fixas full-width de CTA mobile já existentes na página.
    barSelectors: ['#mobile-sticky-bar', '#stickyMobileCta', '.sticky-mobile-cta', '.sticky-cta-urgency', '.sticky-mobile-bar'],

    categories: [
      {
        key:    'necessary',
        label:  'Necessários',
        locked: true,
        desc:   'Essenciais para o funcionamento do site (navegação, segurança, preferências salvas). Não podem ser desativados.'
      },
      {
        key:    'analytics',
        label:  'Analytics / Desempenho',
        locked: false,
        desc:   'Ajudam a entender como o site é utilizado (páginas visitadas, tempo de navegação) para melhorar o conteúdo. Ex.: Google Analytics.'
      },
      {
        key:    'marketing',
        label:  'Marketing / Anúncios',
        locked: false,
        desc:   'Usados para medir a eficácia de campanhas e personalizar anúncios. Ex.: Google Ads, remarketing.'
      }
    ]
  },

  state: {
    consent:          null,
    bannerEl:         null,
    modalEl:          null,
    lastFocusEl:       null,
    reducedMotion:    false,
    pushedEls:        [],
    resizeHandler:    null,
    resizeTimer:      null,
    mutationObserver: null,
    mutationTimer:    null,
    coordInterval:    null,
    escHandler:       null
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    try {
      this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.injectStyles();

      const saved = this.loadConsent();

      if (saved && this.isValid(saved)) {
        this.state.consent = saved;
        this.applyConsentToGtag(saved.categories);
      } else {
        this.state.consent = null;
        this.showBanner();
      }

      this.bindGlobalEvents();

      if (this.config.isDebug) {
        console.log('🍪 [LgpdConsent V1] Inicializado. Consentimento salvo:', saved || '(nenhum / expirado)');
      }
    } catch (e) {
      if (this.config.isDebug) console.error('[LgpdConsent] Erro na inicialização:', e);
    }
  },

  /* ── PERSISTÊNCIA ──────────────────────────────────────────── */

  loadConsent() {
    try {
      const raw = localStorage.getItem(this.config.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !parsed.categories) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  },

  isValid(consentObj) {
    try {
      if (!consentObj || !consentObj.timestamp || !consentObj.version) return false;
      if (consentObj.version !== this.config.policyVersion) return false;
      const ageMs    = Date.now() - consentObj.timestamp;
      const maxAgeMs = this.config.validityDays * 24 * 60 * 60 * 1000;
      return ageMs >= 0 && ageMs < maxAgeMs;
    } catch (e) {
      return false;
    }
  },

  saveConsent(categories) {
    const consentObj = {
      categories: {
        necessary: true,
        analytics: !!categories.analytics,
        marketing: !!categories.marketing
      },
      timestamp: Date.now(),
      version:   this.config.policyVersion
    };
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(consentObj));
    } catch (e) {
      if (this.config.isDebug) console.warn('[LgpdConsent] Não foi possível salvar em localStorage:', e);
    }
    this.state.consent = consentObj;
    return consentObj;
  },

  /* ── GOOGLE CONSENT MODE V2 ────────────────────────────────── */

  applyConsentToGtag(categories) {
    try {
      if (typeof window.gtag !== 'function') return;
      window.gtag('consent', 'update', {
        analytics_storage:   categories.analytics ? 'granted' : 'denied',
        ad_storage:          categories.marketing ? 'granted' : 'denied',
        ad_user_data:        categories.marketing ? 'granted' : 'denied',
        ad_personalization:  categories.marketing ? 'granted' : 'denied'
      });
      if (this.config.isDebug) console.log('🍪 [LgpdConsent] gtag consent update ->', categories);
    } catch (e) {
      if (this.config.isDebug) console.warn('[LgpdConsent] Erro ao atualizar consent do gtag:', e);
    }
  },

  /* ── AÇÕES DO USUÁRIO ──────────────────────────────────────── */

  acceptAll() {
    const c = this.saveConsent({ analytics: true, marketing: true });
    this.applyConsentToGtag(c.categories);
    this.closeModal();
    this.hideBanner();
  },

  rejectNonEssential() {
    const c = this.saveConsent({ analytics: false, marketing: false });
    this.applyConsentToGtag(c.categories);
    this.closeModal();
    this.hideBanner();
  },

  saveCustomFromModal() {
    if (!this.state.modalEl) return;
    const analyticsInput = this.state.modalEl.querySelector('[data-lgpd-toggle="analytics"]');
    const marketingInput = this.state.modalEl.querySelector('[data-lgpd-toggle="marketing"]');
    const c = this.saveConsent({
      analytics: !!(analyticsInput && analyticsInput.checked),
      marketing: !!(marketingInput && marketingInput.checked)
    });
    this.applyConsentToGtag(c.categories);
    this.closeModal();
    this.hideBanner();
  },

  /* ── BANNER (BARRA INFERIOR) ───────────────────────────────── */

  buildBanner() {
    const el = document.createElement('div');
    el.id = 'lgpd-consent-bar';
    el.className = 'lgpd-consent-bar';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Aviso de cookies e privacidade');
    el.setAttribute('aria-live', 'polite');

    el.innerHTML = `
      <div class="lgpd-consent-bar__inner">
        <div class="lgpd-consent-bar__icon" aria-hidden="true"><i class="fas fa-shield-halved"></i></div>
        <div class="lgpd-consent-bar__text">
          <p class="lgpd-consent-bar__title">Sua privacidade importa</p>
          <p class="lgpd-consent-bar__desc">
            Utilizamos cookies para garantir o funcionamento do site e, mediante seu consentimento,
            para analisar o tráfego e personalizar conteúdo, em conformidade com a
            <strong>LGPD (Lei nº 13.709/2018)</strong>. Você pode aceitar, rejeitar ou personalizar
            suas preferências a qualquer momento. Saiba mais na
            <a href="${this.config.privacyHref}" class="lgpd-consent-bar__link">Política de Privacidade</a>.
          </p>
        </div>
        <div class="lgpd-consent-bar__actions">
          <button type="button" class="lgpd-btn lgpd-btn--ghost" data-lgpd-action="customize">Personalizar</button>
          <button type="button" class="lgpd-btn lgpd-btn--outline" data-lgpd-action="reject">Rejeitar Não-Essenciais</button>
          <button type="button" class="lgpd-btn lgpd-btn--gold" data-lgpd-action="accept">Aceitar Todos</button>
        </div>
      </div>
    `;

    el.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lgpd-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-lgpd-action');
      if (action === 'accept') this.acceptAll();
      else if (action === 'reject') this.rejectNonEssential();
      else if (action === 'customize') this.openModal();
    });

    return el;
  },

  showBanner() {
    try {
      if (this.state.bannerEl) return;
      this.state.bannerEl = this.buildBanner();
      document.body.appendChild(this.state.bannerEl);

      this.coordinatePosition();
      this.startCoordinationWatch();

      requestAnimationFrame(() => {
        if (this.state.bannerEl) this.state.bannerEl.classList.add('is-visible');
      });
    } catch (e) {
      if (this.config.isDebug) console.error('[LgpdConsent] Erro ao exibir a barra:', e);
    }
  },

  hideBanner() {
    try {
      if (!this.state.bannerEl) return;
      const el = this.state.bannerEl;
      this.state.bannerEl = null;

      el.classList.remove('is-visible');
      this.stopCoordinationWatch();
      this.restorePushedElements();

      const remove = () => { if (el && el.parentNode) el.parentNode.removeChild(el); };
      if (this.state.reducedMotion) remove();
      else setTimeout(remove, 320);
    } catch (e) {
      if (this.config.isDebug) console.error('[LgpdConsent] Erro ao ocultar a barra:', e);
    }
  },

  /* ── MODAL DE PERSONALIZAÇÃO ───────────────────────────────── */

  buildModal() {
    const saved = this.state.consent && this.state.consent.categories;
    const analyticsChecked = saved ? !!saved.analytics : false;
    const marketingChecked = saved ? !!saved.marketing : false;

    const overlay = document.createElement('div');
    overlay.className = 'lgpd-modal-overlay';

    const toggleRow = (cat, checked) => `
      <div class="lgpd-modal__row">
        <div class="lgpd-modal__row-text">
          <p class="lgpd-modal__row-title">${cat.label}${cat.locked ? ' <span class="lgpd-modal__badge">Sempre ativo</span>' : ''}</p>
          <p class="lgpd-modal__row-desc">${cat.desc}</p>
        </div>
        <label class="lgpd-switch" for="lgpd-toggle-${cat.key}">
          <span class="lgpd-sr-only">${cat.label}</span>
          <input
            type="checkbox"
            id="lgpd-toggle-${cat.key}"
            data-lgpd-toggle="${cat.key}"
            ${cat.locked ? 'checked disabled aria-disabled="true"' : (checked ? 'checked' : '')}
          />
          <span class="lgpd-switch__track" aria-hidden="true"><span class="lgpd-switch__thumb"></span></span>
        </label>
      </div>
    `;

    const rowsHtml = this.config.categories.map(cat => {
      if (cat.key === 'analytics') return toggleRow(cat, analyticsChecked);
      if (cat.key === 'marketing') return toggleRow(cat, marketingChecked);
      return toggleRow(cat, true);
    }).join('');

    overlay.innerHTML = `
      <div
        class="lgpd-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lgpd-modal-title"
        aria-describedby="lgpd-modal-desc"
      >
        <div class="lgpd-modal__header">
          <i class="fas fa-shield-halved lgpd-modal__header-icon" aria-hidden="true"></i>
          <h2 id="lgpd-modal-title" class="lgpd-modal__title">Preferências de Privacidade</h2>
          <button type="button" class="lgpd-modal__close" data-lgpd-action="close" aria-label="Fechar painel de preferências">
            <i class="fas fa-xmark" aria-hidden="true"></i>
          </button>
        </div>
        <p id="lgpd-modal-desc" class="lgpd-modal__intro">
          Escolha quais categorias de cookies você permite. Você pode alterar essa escolha quando quiser.
          Mais detalhes na <a href="${this.config.privacyHref}" class="lgpd-consent-bar__link">Política de Privacidade</a>.
        </p>
        <div class="lgpd-modal__rows">${rowsHtml}</div>
        <div class="lgpd-modal__actions">
          <button type="button" class="lgpd-btn lgpd-btn--outline" data-lgpd-action="reject">Rejeitar Não-Essenciais</button>
          <button type="button" class="lgpd-btn lgpd-btn--ghost-border" data-lgpd-action="save">Salvar Preferências</button>
          <button type="button" class="lgpd-btn lgpd-btn--gold" data-lgpd-action="accept">Aceitar Todos</button>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lgpd-action]');
      if (btn) {
        const action = btn.getAttribute('data-lgpd-action');
        if (action === 'accept') return this.acceptAll();
        if (action === 'reject') return this.rejectNonEssential();
        if (action === 'save') return this.saveCustomFromModal();
        if (action === 'close') return this.closeModal();
        return;
      }
      // Clique no backdrop (fora do painel) apenas fecha o painel, sem gravar escolha.
      if (e.target === overlay) this.closeModal();
    });

    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') this.trapFocus(e, overlay);
    });

    return overlay;
  },

  openModal() {
    try {
      if (this.state.modalEl) return;
      this.state.lastFocusEl = document.activeElement;
      this.state.modalEl = this.buildModal();
      document.body.appendChild(this.state.modalEl);
      document.body.classList.add('lgpd-modal-open');

      requestAnimationFrame(() => {
        if (!this.state.modalEl) return;
        this.state.modalEl.classList.add('is-visible');
        const focusables = this.getFocusable(this.state.modalEl);
        if (focusables.length) focusables[0].focus();
      });
    } catch (e) {
      if (this.config.isDebug) console.error('[LgpdConsent] Erro ao abrir personalização:', e);
    }
  },

  closeModal() {
    try {
      if (!this.state.modalEl) return;
      const el = this.state.modalEl;
      this.state.modalEl = null;

      el.classList.remove('is-visible');
      document.body.classList.remove('lgpd-modal-open');

      const remove = () => { if (el && el.parentNode) el.parentNode.removeChild(el); };
      if (this.state.reducedMotion) remove();
      else setTimeout(remove, 250);

      if (this.state.lastFocusEl && typeof this.state.lastFocusEl.focus === 'function') {
        this.state.lastFocusEl.focus();
      }
      this.state.lastFocusEl = null;
    } catch (e) {
      if (this.config.isDebug) console.error('[LgpdConsent] Erro ao fechar personalização:', e);
    }
  },

  /* ── ACESSIBILIDADE ────────────────────────────────────────── */

  getFocusable(container) {
    try {
      return Array.from(
        container.querySelectorAll('button, [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => el.offsetParent !== null || el === document.activeElement);
    } catch (e) {
      return [];
    }
  },

  trapFocus(e, container) {
    const focusables = this.getFocusable(container);
    if (!focusables.length) return;
    const first = focusables[0];
    const last  = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  },

  bindGlobalEvents() {
    this.state.escHandler = (e) => {
      if (e.key !== 'Escape') return;
      if (this.state.modalEl) this.closeModal();
    };
    document.addEventListener('keydown', this.state.escHandler);
  },

  /* ── COORDENAÇÃO COM OUTROS WIDGETS FLUTUANTES ─────────────── */
  /* Mesma abordagem geométrica usada em chat-elite.js: nunca fixa    */
  /* offsets/nomes de classe — detecta via getBoundingClientRect().   */

  coordinatePosition() {
    if (!this.state.bannerEl) return;

    try {
      // 1) Já existe uma sticky bar mobile de CTA na página? Sobe a barra
      //    LGPD para cima dela em vez de sobrepor.
      let stickyBarH = 0;
      this.config.barSelectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (!el || el === this.state.bannerEl) return;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || el.offsetHeight === 0) return;
        const rect = el.getBoundingClientRect();
        if ((window.innerHeight - rect.bottom) < 60) {
          stickyBarH = Math.max(stickyBarH, el.offsetHeight);
        }
      });
      this.state.bannerEl.style.setProperty('--lgpd-sticky-offset', stickyBarH > 0 ? `${stickyBarH}px` : '0px');
    } catch (e) {
      if (this.config.isDebug) console.warn('[LgpdConsent] Erro ao calcular offset de sticky bar:', e);
    }

    this.pushFloatingWidgets();
  },

  pushFloatingWidgets() {
    if (!this.state.bannerEl) return;

    try {
      const bannerRect = this.state.bannerEl.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const knownBars = this.config.barSelectors
        .map(sel => document.querySelector(sel))
        .filter(Boolean);

      const stillPushed = new Set();

      document.querySelectorAll('body > a, body > div, body > button').forEach(el => {
        if (el === this.state.bannerEl || el === this.state.modalEl) return;
        if (el.id === 'lgpd-consent-bar') return;
        if (knownBars.indexOf(el) !== -1) return; // barra full-width já tratada via offset de posição

        const cs = getComputedStyle(el);
        if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
        if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

        const rect = el.getBoundingClientRect();
        const isFullWidthBar = rect.width > vw * 0.6;
        if (isFullWidthBar) return; // barras largas são tratadas à parte, não empurradas

        const nearBottom = (vh - rect.bottom) < 160;
        if (!nearBottom) return;

        // Só empurra quem realmente ficaria coberto pela barra LGPD.
        if (rect.bottom <= bannerRect.top) return;

        if (!el.dataset.lgpdPushed) {
          el.dataset.lgpdPushed = '1';
          el.dataset.lgpdPrevBottom = el.style.bottom || '';
          el.dataset.lgpdPrevTransition = el.style.transition || '';
          this.state.pushedEls.push(el);
        }
        stillPushed.add(el);

        const currentBottom = parseFloat(cs.bottom) || 0;
        const needed = Math.max(currentBottom, (vh - bannerRect.top) + 12);

        if (!this.state.reducedMotion) el.style.transition = 'bottom .25s ease';
        el.style.bottom = `${needed}px`;
      });

      // Elementos que estavam empurrados mas somem do DOM/perdem o fixed
      // são restaurados imediatamente (evita "prender" outro widget).
      this.state.pushedEls = this.state.pushedEls.filter(el => {
        if (stillPushed.has(el)) return true;
        this.restoreOneElement(el);
        return false;
      });
    } catch (e) {
      if (this.config.isDebug) console.warn('[LgpdConsent] Erro ao coordenar widgets flutuantes:', e);
    }
  },

  restoreOneElement(el) {
    try {
      if (!el) return;
      if (el.dataset.lgpdPrevBottom) el.style.bottom = el.dataset.lgpdPrevBottom;
      else el.style.removeProperty('bottom');

      if (el.dataset.lgpdPrevTransition) el.style.transition = el.dataset.lgpdPrevTransition;
      else el.style.removeProperty('transition');

      delete el.dataset.lgpdPushed;
      delete el.dataset.lgpdPrevBottom;
      delete el.dataset.lgpdPrevTransition;
    } catch (e) {}
  },

  restorePushedElements() {
    this.state.pushedEls.forEach(el => this.restoreOneElement(el));
    this.state.pushedEls = [];
  },

  startCoordinationWatch() {
    this.stopCoordinationWatch();

    const recalc = () => this.coordinatePosition();

    this.state.resizeHandler = () => {
      clearTimeout(this.state.resizeTimer);
      this.state.resizeTimer = setTimeout(recalc, 150);
    };
    window.addEventListener('resize', this.state.resizeHandler);

    this.state.mutationObserver = new MutationObserver(() => {
      clearTimeout(this.state.mutationTimer);
      this.state.mutationTimer = setTimeout(recalc, 200);
    });
    this.state.mutationObserver.observe(document.body, { childList: true });

    // Outros scripts (ex.: widgets de chat) reafirmam sua própria posição em
    // observers/timers independentes; um recheck leve periódico evita que a
    // barra LGPD e os widgets empurrados fiquem "brigando" de posição.
    this.state.coordInterval = setInterval(recalc, 1200);
  },

  stopCoordinationWatch() {
    if (this.state.resizeHandler) window.removeEventListener('resize', this.state.resizeHandler);
    if (this.state.mutationObserver) this.state.mutationObserver.disconnect();
    if (this.state.coordInterval) clearInterval(this.state.coordInterval);
    clearTimeout(this.state.resizeTimer);
    clearTimeout(this.state.mutationTimer);

    this.state.resizeHandler    = null;
    this.state.mutationObserver = null;
    this.state.coordInterval    = null;
  },

  /* ── ESTILOS ────────────────────────────────────────────────── */

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;

    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      #lgpd-consent-bar, .lgpd-consent-bar {
        --lgpd-gold: #d4af37;
        --lgpd-gold-dark: #b8860b;
        --lgpd-bg: #0a0a0a;
        --lgpd-border: rgba(212,175,55,.35);
        --lgpd-text: #f2f2f2;
        --lgpd-text-muted: #b8b8b8;
        --lgpd-sticky-offset: 0px;

        position: fixed;
        left: 0;
        right: 0;
        bottom: calc(var(--lgpd-sticky-offset, 0px) + env(safe-area-inset-bottom, 0px));
        z-index: 999995;
        background: linear-gradient(180deg, #0d0d0d 0%, var(--lgpd-bg) 100%);
        border-top: 1px solid var(--lgpd-border);
        box-shadow: 0 -8px 30px rgba(0,0,0,.55);
        transform: translateY(100%);
        opacity: 0;
        transition: transform .35s ease, opacity .35s ease, bottom .25s ease;
        font-family: 'Lato', Arial, sans-serif;
      }
      #lgpd-consent-bar.is-visible { transform: translateY(0); opacity: 1; }

      .lgpd-consent-bar__inner {
        max-width: 1280px;
        margin: 0 auto;
        padding: 18px 24px;
        display: flex;
        align-items: center;
        gap: 20px;
      }
      .lgpd-consent-bar__icon {
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(212,175,55,.12);
        border: 1px solid var(--lgpd-border);
        color: var(--lgpd-gold);
        font-size: 18px;
      }
      .lgpd-consent-bar__text { flex: 1 1 auto; min-width: 0; }
      .lgpd-consent-bar__title {
        margin: 0 0 4px;
        font-family: 'Teko', Arial, sans-serif;
        font-weight: 600;
        letter-spacing: .03em;
        font-size: 22px;
        line-height: 1;
        color: var(--lgpd-gold);
        text-transform: uppercase;
      }
      .lgpd-consent-bar__desc {
        margin: 0;
        font-size: 13.5px;
        line-height: 1.5;
        color: var(--lgpd-text-muted);
      }
      .lgpd-consent-bar__link {
        color: var(--lgpd-gold);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .lgpd-consent-bar__link:hover { color: #fff; }

      .lgpd-consent-bar__actions {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }

      .lgpd-btn {
        font-family: 'Lato', Arial, sans-serif;
        font-weight: 700;
        font-size: 13px;
        letter-spacing: .02em;
        white-space: nowrap;
        border-radius: 8px;
        padding: 11px 18px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform .15s ease, box-shadow .15s ease, background .2s ease, color .2s ease;
      }
      .lgpd-btn:focus-visible {
        outline: 2px solid var(--lgpd-gold);
        outline-offset: 2px;
      }
      .lgpd-btn--gold {
        background: linear-gradient(135deg, var(--lgpd-gold-dark), var(--lgpd-gold));
        color: #0a0a0a;
      }
      .lgpd-btn--gold:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(212,175,55,.35); }
      .lgpd-btn--outline {
        background: transparent;
        color: var(--lgpd-text);
        border-color: rgba(255,255,255,.25);
      }
      .lgpd-btn--outline:hover { border-color: var(--lgpd-gold); color: var(--lgpd-gold); }
      .lgpd-btn--ghost {
        background: transparent;
        color: var(--lgpd-text-muted);
        text-decoration: underline;
        text-underline-offset: 3px;
        padding: 11px 6px;
      }
      .lgpd-btn--ghost:hover { color: var(--lgpd-gold); }
      .lgpd-btn--ghost-border {
        background: transparent;
        color: var(--lgpd-gold);
        border-color: var(--lgpd-border);
      }
      .lgpd-btn--ghost-border:hover { background: rgba(212,175,55,.1); }

      /* ── Modal de Personalização ─────────────────────────────── */

      .lgpd-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        opacity: 0;
        transition: opacity .25s ease;
      }
      .lgpd-modal-overlay.is-visible { opacity: 1; }

      .lgpd-modal {
        width: 100%;
        max-width: 560px;
        max-height: 88vh;
        overflow-y: auto;
        background: #111;
        border: 1px solid var(--lgpd-border);
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(0,0,0,.6);
        padding: 26px 26px 22px;
        font-family: 'Lato', Arial, sans-serif;
        transform: scale(.96);
        transition: transform .25s ease;
      }
      .lgpd-modal-overlay.is-visible .lgpd-modal { transform: scale(1); }

      .lgpd-modal__header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 6px;
      }
      .lgpd-modal__header-icon { color: var(--lgpd-gold); font-size: 20px; }
      .lgpd-modal__title {
        flex: 1 1 auto;
        margin: 0;
        font-family: 'Teko', Arial, sans-serif;
        font-weight: 600;
        letter-spacing: .02em;
        font-size: 26px;
        line-height: 1;
        color: var(--lgpd-gold);
        text-transform: uppercase;
      }
      .lgpd-modal__close {
        background: transparent;
        border: none;
        color: var(--lgpd-text-muted);
        font-size: 18px;
        cursor: pointer;
        padding: 6px;
        line-height: 1;
        border-radius: 6px;
      }
      .lgpd-modal__close:hover { color: var(--lgpd-gold); }
      .lgpd-modal__close:focus-visible { outline: 2px solid var(--lgpd-gold); outline-offset: 2px; }

      .lgpd-modal__intro {
        margin: 6px 0 18px;
        font-size: 13.5px;
        line-height: 1.55;
        color: var(--lgpd-text-muted);
      }

      .lgpd-modal__rows { display: flex; flex-direction: column; gap: 4px; }
      .lgpd-modal__row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        padding: 14px 0;
        border-top: 1px solid rgba(255,255,255,.08);
      }
      .lgpd-modal__row:first-child { border-top: none; }
      .lgpd-modal__row-text { flex: 1 1 auto; }
      .lgpd-modal__row-title {
        margin: 0 0 4px;
        font-weight: 700;
        font-size: 14.5px;
        color: var(--lgpd-text);
      }
      .lgpd-modal__badge {
        display: inline-block;
        margin-left: 6px;
        padding: 2px 8px;
        border-radius: 20px;
        background: rgba(212,175,55,.15);
        border: 1px solid var(--lgpd-border);
        color: var(--lgpd-gold);
        font-size: 10.5px;
        font-weight: 700;
        letter-spacing: .04em;
        text-transform: uppercase;
        vertical-align: middle;
      }
      .lgpd-modal__row-desc {
        margin: 0;
        font-size: 12.5px;
        line-height: 1.5;
        color: var(--lgpd-text-muted);
      }

      .lgpd-modal__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 18px;
        border-top: 1px solid rgba(255,255,255,.08);
      }

      .lgpd-sr-only {
        position: absolute;
        width: 1px; height: 1px;
        padding: 0; margin: -1px;
        overflow: hidden;
        clip: rect(0,0,0,0);
        white-space: nowrap;
        border: 0;
      }

      /* Switch estilo iOS, dourado quando ativo */
      .lgpd-switch {
        position: relative;
        flex: 0 0 auto;
        display: inline-block;
        width: 46px;
        height: 26px;
        cursor: pointer;
      }
      .lgpd-switch input {
        position: absolute;
        width: 1px; height: 1px;
        opacity: 0;
        pointer-events: none;
      }
      .lgpd-switch__track {
        position: absolute;
        inset: 0;
        background: rgba(255,255,255,.18);
        border: 1px solid rgba(255,255,255,.25);
        border-radius: 999px;
        transition: background .2s ease, border-color .2s ease;
      }
      .lgpd-switch__thumb {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #e6e6e6;
        transition: transform .2s ease, background .2s ease;
      }
      .lgpd-switch input:checked + .lgpd-switch__track { background: rgba(212,175,55,.35); border-color: var(--lgpd-gold); }
      .lgpd-switch input:checked + .lgpd-switch__track .lgpd-switch__thumb { transform: translateX(20px); background: var(--lgpd-gold); }
      .lgpd-switch input:disabled + .lgpd-switch__track { opacity: .7; cursor: not-allowed; }
      .lgpd-switch input:focus-visible + .lgpd-switch__track { outline: 2px solid var(--lgpd-gold); outline-offset: 2px; }

      body.lgpd-modal-open { overflow: hidden; }

      @media (prefers-reduced-motion: reduce) {
        #lgpd-consent-bar, .lgpd-modal-overlay, .lgpd-modal, .lgpd-switch__track, .lgpd-switch__thumb, .lgpd-btn {
          transition: none !important;
        }
      }

      @media (max-width: 860px) {
        .lgpd-consent-bar__inner {
          flex-wrap: wrap;
          padding: 16px 16px calc(16px + env(safe-area-inset-bottom, 0px));
          gap: 12px;
        }
        .lgpd-consent-bar__icon { display: none; }
        .lgpd-consent-bar__actions {
          width: 100%;
          justify-content: stretch;
        }
        .lgpd-consent-bar__actions .lgpd-btn { flex: 1 1 auto; text-align: center; }
        .lgpd-consent-bar__actions .lgpd-btn--ghost { flex: 0 0 100%; order: 3; text-align: center; }
      }

      @media (max-width: 420px) {
        .lgpd-modal { padding: 20px 18px 18px; }
        .lgpd-modal__title { font-size: 22px; }
      }
    `;
    document.head.appendChild(style);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    window.LgpdConsent.init();
  } catch (e) {
    if (window.location.hostname !== 'lucassemim.adv.br') console.error('[LgpdConsent] Falha fatal na inicialização:', e);
  }
});
