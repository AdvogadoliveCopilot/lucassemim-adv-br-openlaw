/* =========================================================== */
/* === ARQUIVO: js/vlibras-plugin.js (VLibrasElite V4.1)    === */
/* === FUNÇÃO: Acessibilidade inteligente + modo Claude     === */
/* === Corrigido: window.gtag, race condition, posição      === */
/* === V4.1: posicionamento por detecção dinâmica de        === */
/* ===       geometria (getBoundingClientRect) em vez de    === */
/* ===       coordenadas fixas de outros widgets; removida  === */
/* ===       colisão global com googleTranslateElementInit  === */
/* ===       (conflitava com tradutor-global.js).           === */
/* =========================================================== */

window.VLibrasElite = {

  config: {
    widgetUrl:     'https://vlibras.gov.br/app',
    scriptUrl:     'https://vlibras.gov.br/app/vlibras-plugin.js',
    maxDelayMs:    5000,
    styleId:       'vlibras-elite-styles',
    storageKey:    'semim_vlibras_active',
    isDebug:       window.location.hostname !== 'lucassemim.adv.br',
    /* V4.1: parâmetros da detecção dinâmica de widgets fixos por geometria
       (mesma técnica usada em chat-elite.js) — usados para posicionar o
       botão de acesso do VLibras sem depender de coordenadas/seletores
       hardcoded de outros widgets da página. */
    cornerZoneDetectPx: 160,  // distância da borda p/ considerar "no canto"
    cornerMarginPx:     16,   // espaço mínimo entre o VLibras e o vizinho
    cornerDefaultPx:    20    // posição padrão quando o canto está livre
  },

  state: {
    /* BUGFIX 2: lock síncrono — evita race condition entre
       requestIdleCallback e eventos de interação */
    locked:       false,
    loaded:       false,
    retried:      false,  // V4.1: permite uma única retentativa após erro
    startTime:    0,
    cleanupFns:   [],
    accessMode:   false,  // true quando VLibras foi ativado pelo usuário
    repositionScheduled: false // V4.1: debounce do recálculo de posição
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    if (document.querySelector('[vw]')) return;
    this.injectStyles();
    this.scheduleLoad();
    this.restoreAccessMode(); // lembrar preferência do usuário
    this.log('[VLibrasElite V4] Agendando carregamento...');
  },

  /* ── CSS (sem conflito com outros widgets) ─────────────────── */

  injectStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      /* === VLibrasElite V4 === */

      /* ── Suprimir barra do Google Translate (gerada pelo VLibras) */
      .goog-te-banner-frame.skiptranslate { display: none !important; }
      body.translated-ltr,
      body.translated-rtl { top: 0 !important; }

      /* ── Posição do botão de acesso ────────────────────────────
         V4.1: a posição final NÃO é mais assumida via seletores/
         coordenadas fixas de outros widgets (isso ficava obsoleto
         sempre que outro widget mudava de classe/posição). O método
         applyDynamicPosition() varre os elementos fixos da página em
         tempo de execução (getBoundingClientRect), a mesma técnica
         usada em chat-elite.js, e define top/right/bottom/left via
         JS com !important, sobrepondo os valores abaixo.
         Os valores aqui são só o estado inicial/seguro antes do
         primeiro cálculo (evita o botão nascer sem position:fixed). */
      [vw] {
        z-index: 9994 !important; /* abaixo do chat e do tradutor */
      }
      [vw-access-button] {
        position: fixed !important;
        right: 20px !important;
        left: auto !important;
        bottom: 20px !important;
        z-index: 9994 !important;
      }

      /* No mobile, subir acima da sticky bar (ajuste fino via JS também) */
      @media (max-width: 768px) {
        [vw-access-button] {
          right: 16px !important;
          left: auto !important;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px)) !important;
        }
      }

      /* ── Badge de modo acessível (quando VLibras está ativo)
         V4.1: bottom/right também são recalculados via JS para
         acompanhar a posição dinâmica do botão de acesso. */
      #vlibras-access-badge {
        position: fixed;
        bottom: 72px; right: 20px;
        z-index: 9993;
        background: rgba(0, 80, 160, 0.92);
        color: #fff;
        font-family: 'Lato', sans-serif;
        font-size: 0.7rem; font-weight: 700;
        letter-spacing: 0.5px; text-transform: uppercase;
        padding: 3px 8px; border-radius: 4px;
        opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none;
      }
      #vlibras-access-badge.visible { opacity: 1; }
      @media (max-width: 768px) {
        #vlibras-access-badge {
          right: 16px;
          bottom: calc(160px + env(safe-area-inset-bottom, 0px));
        }
      }
      @media (prefers-reduced-motion: reduce) {
        #vlibras-access-badge { transition: none; }
      }
    `;
    document.head.appendChild(style);
  },

  /* ── AGENDAMENTO INTELIGENTE ───────────────────────────────── */

  scheduleLoad() {
    // BUGFIX 4: remover todos os event listeners quando qualquer um disparar
    const triggerOnce = () => {
      this.cleanupEventListeners();
      this.triggerLoad();
    };

    // Idle callback — carrega quando o browser está ocioso
    if ('requestIdleCallback' in window) {
      const idleId = requestIdleCallback(
        () => triggerOnce(),
        { timeout: this.config.maxDelayMs }
      );
      this.state.cleanupFns.push(() => cancelIdleCallback(idleId));
    } else {
      const t = setTimeout(() => triggerOnce(), this.config.maxDelayMs);
      this.state.cleanupFns.push(() => clearTimeout(t));
    }

    // Primeira interação do usuário — antecipa o carregamento
    const events = ['scroll', 'mousemove', 'touchstart', 'keydown', 'click'];
    events.forEach(ev => {
      // BUGFIX 4: um único handler compartilhado por tipo de evento
      const fn = () => triggerOnce();
      window.addEventListener(ev, fn, { once: true, passive: true });
      this.state.cleanupFns.push(() => window.removeEventListener(ev, fn));
    });

    // Safety timer
    const safety = setTimeout(() => triggerOnce(), this.config.maxDelayMs + 1000);
    this.state.cleanupFns.push(() => clearTimeout(safety));
  },

  cleanupEventListeners() {
    this.state.cleanupFns.forEach(fn => { try { fn(); } catch { } });
    this.state.cleanupFns = [];
  },

  /* ── CARREGAMENTO ──────────────────────────────────────────── */

  triggerLoad() {
    // BUGFIX 2: lock síncrono — evita race condition
    if (this.state.locked || this.state.loaded) return;
    this.state.locked    = true;
    this.state.startTime = Date.now();

    this.log('[VLibrasElite V4] Carregando widget...');

    const domOk = this.buildVLibrasDOM();
    if (domOk) this.loadScript();
  },

  buildVLibrasDOM() {
    if (document.querySelector('[vw]')) return false;

    const root = document.createElement('div');
    root.setAttribute('vw', '');
    root.classList.add('enabled');

    const accessBtn = document.createElement('div');
    accessBtn.setAttribute('vw-access-button', '');
    accessBtn.classList.add('active');

    const pluginWrapper = document.createElement('div');
    pluginWrapper.setAttribute('vw-plugin-wrapper', '');
    pluginWrapper.appendChild(document.createElement('div'))
      .classList.add('vw-plugin-top-wrapper');

    root.appendChild(accessBtn);
    root.appendChild(pluginWrapper);
    document.body.appendChild(root);

    // Observar quando o botão de acesso for clicado
    this.observeAccessButton(accessBtn);

    // V4.1: calcular a posição já na criação do DOM, antes mesmo do
    // script do VLibras terminar de carregar, evitando que o botão
    // "pule" de lugar quando applyDynamicPosition() rodar de novo depois.
    this.applyDynamicPosition();
    this.watchLayoutChanges();

    return true;
  },

  loadScript() {
    const script = document.createElement('script');
    script.src = this.config.scriptUrl;
    script.addEventListener('load',  () => this.onScriptLoad());
    script.addEventListener('error', () => this.onScriptError());
    document.body.appendChild(script);
  },

  onScriptLoad() {
    try {
      new window.VLibras.Widget(this.config.widgetUrl);
      this.state.loaded = true;

      const ms = Date.now() - this.state.startTime;
      this.log(`[VLibrasElite V4] Widget ativado em ${ms}ms`);
      this.trackEvent('vlibras_loaded', ms);

      // V4.1: o script do VLibras pode inserir/alterar elementos —
      // recalcular a posição por geometria após o carregamento.
      this.applyDynamicPosition();

    } catch (err) {
      this.log('[VLibrasElite V4] Falha ao iniciar:', err);
    }
  },

  onScriptError() {
    this.log('[VLibrasElite V4] vlibras.gov.br inacessível.');
    this.trackEvent('vlibras_error', 0);
    this.state.locked = false; // liberar para retry

    // V4.1: o comentário acima já prometia uma retentativa, mas nada a
    // disparava de fato. Uma única nova tentativa após 3s cobre falhas
    // transitórias de rede sem martelar o endpoint indefinidamente. Não
    // chama triggerLoad() de novo porque o DOM ([vw]) já foi criado na
    // primeira tentativa — buildVLibrasDOM() recusaria criá-lo de novo
    // e a retentativa nunca chegaria a loadScript().
    if (!this.state.retried) {
      this.state.retried = true;
      setTimeout(() => {
        if (!this.state.loaded) {
          this.state.locked    = true;
          this.state.startTime = Date.now();
          this.loadScript();
        }
      }, 3000);
    }
  },

  /* ── COORDENAÇÃO COM OUTROS WIDGETS (detecção dinâmica por geometria) ──
     V4.1: a versão anterior assumia coordenadas fixas de widgets
     específicos (ex.: "#flags-container fica bottom:20px left:20px",
     "chat-elite fica right:20px"). Essas suposições ficam desatualizadas
     sempre que um widget muda de posição, classe ou é removido — e nomes
     de classe já variam de página para página no site (ex.:
     .whatsapp-floating numa página, .float-emergencia-sa em outra).

     A solução, alinhada com a reescrita recente de chat-elite.js, é
     detectar em tempo real QUALQUER elemento fixo próximo aos cantos da
     tela por geometria (getBoundingClientRect), sem depender de saber
     quem ele é. Assim o botão do VLibras sempre se posiciona no canto
     livre mais próximo do preferido, ou "empilha" ao lado/acima de quem
     já estiver lá — independente de qual widget específico é. */

  /* Varre elementos fixos candidatos e classifica os que estão perto de
     algum canto da tela (mesma varredura usada em chat-elite.js). */
  detectFixedCornerWidgets() {
    const candidates = document.querySelectorAll('body > a, body > div, body > button');
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zone = this.config.cornerZoneDetectPx;
    const widgets = [];

    candidates.forEach(el => {
      // Ignorar os próprios elementos do VLibras para não "detectar a si mesmo"
      if (el.hasAttribute('vw') || el.hasAttribute('vw-access-button') ||
          el.hasAttribute('vw-plugin-wrapper') || el.id === 'vlibras-access-badge') {
        return;
      }

      let cs;
      try { cs = window.getComputedStyle(el); } catch { return; }
      if (!cs || cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;

      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const nearRight  = (vw - rect.right) < zone;
      const nearLeft   = rect.left < zone;
      const nearBottom = (vh - rect.bottom) < zone;
      const nearTop    = rect.top < zone;

      if ((nearLeft || nearRight) && (nearTop || nearBottom)) {
        widgets.push({
          rect,
          corner: `${nearBottom ? 'bottom' : 'top'}-${nearRight ? 'right' : 'left'}`
        });
      }
    });

    return widgets;
  },

  /* Escolhe, entre os cantos preferidos, o primeiro livre — ou, se todos
     estiverem ocupados, calcula um deslocamento que empilha o botão do
     VLibras acima do widget mais "alto" já presente naquele canto. */
  computeAccessButtonPosition() {
    const widgets = this.detectFixedCornerWidgets();
    const margin  = this.config.cornerMarginPx;
    const base    = this.config.cornerDefaultPx;
    const preferredCorners = ['bottom-right', 'bottom-left', 'top-right', 'top-left'];

    for (const corner of preferredCorners) {
      const occupants = widgets.filter(w => w.corner === corner);
      if (occupants.length === 0) {
        return this.cornerToStyle(corner, base);
      }

      const isBottom = corner.startsWith('bottom');
      const tallest = occupants.reduce((furthest, w) => {
        const reach = isBottom ? (window.innerHeight - w.rect.top) : w.rect.bottom;
        const furthestReach = isBottom ? (window.innerHeight - furthest.rect.top) : furthest.rect.bottom;
        return reach > furthestReach ? w : furthest;
      });

      const offset = (isBottom
        ? (window.innerHeight - tallest.rect.top)
        : tallest.rect.bottom) + margin;

      return this.cornerToStyle(corner, offset);
    }

    // Nunca deveria chegar aqui (sempre há 4 cantos), mas mantém um
    // fallback seguro no canto inferior direito.
    return this.cornerToStyle('bottom-right', base);
  },

  cornerToStyle(corner, offsetPx) {
    const [vSide, hSide] = corner.split('-'); // 'bottom'|'top', 'right'|'left'
    return {
      top:    vSide === 'top'    ? `${offsetPx}px` : 'auto',
      bottom: vSide === 'bottom' ? `${offsetPx}px` : 'auto',
      left:   hSide === 'left'   ? `${offsetPx}px` : 'auto',
      right:  hSide === 'right'  ? `${offsetPx}px` : 'auto'
    };
  },

  /* Aplica a posição calculada via inline style (!important sobrepõe o
     CSS estático injetado em injectStyles, que serve só de estado
     inicial/fallback). No mobile mantemos a posição definida pelo
     @media do CSS (mais previsível ao lado da sticky bar). */
  applyDynamicPosition() {
    const btn = document.querySelector('[vw-access-button]');
    if (!btn) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile) return; // CSS @media já cuida do layout mobile

    const pos = this.computeAccessButtonPosition();
    btn.style.setProperty('position', 'fixed', 'important');
    btn.style.setProperty('top',    pos.top,    'important');
    btn.style.setProperty('bottom', pos.bottom, 'important');
    btn.style.setProperty('left',   pos.left,   'important');
    btn.style.setProperty('right',  pos.right,  'important');

    // O badge acompanha o botão, ~52px acima dele
    const badge = document.getElementById('vlibras-access-badge');
    if (badge) {
      badge.style.setProperty('top',    pos.top    !== 'auto' ? `calc(${pos.top} + 52px)`    : 'auto', 'important');
      badge.style.setProperty('bottom', pos.bottom !== 'auto' ? `calc(${pos.bottom} + 52px)` : 'auto', 'important');
      badge.style.setProperty('left',   pos.left,  'important');
      badge.style.setProperty('right',  pos.right, 'important');
    }
  },

  /* Recalcula a posição quando o layout muda: outros widgets aparecendo/
     desaparecendo (ex.: banner de cookies, chat carregando depois) ou a
     janela sendo redimensionada/rotacionada. Debounced via rAF para não
     recalcular a cada pixel de resize. */
  watchLayoutChanges() {
    const scheduleRecalc = () => {
      if (this.state.repositionScheduled) return;
      this.state.repositionScheduled = true;
      requestAnimationFrame(() => {
        this.state.repositionScheduled = false;
        this.applyDynamicPosition();
      });
    };

    const obs = new MutationObserver(scheduleRecalc);
    obs.observe(document.body, { childList: true, subtree: false });

    window.addEventListener('resize', scheduleRecalc, { passive: true });
    window.addEventListener('orientationchange', scheduleRecalc, { passive: true });
  },

  /* ── OBSERVER DO BOTÃO DE ACESSO ──────────────────────────── */

  observeAccessButton(btn) {
    // Detectar quando o usuário clicou para ativar o VLibras
    btn.addEventListener('click', () => {
      this.state.accessMode = true;
      try { localStorage.setItem(this.config.storageKey, 'true'); } catch { }
      this.showAccessBadge();
      this.notifyChatElite(true);
      this.trackEvent('vlibras_activated', 0);
    });
  },

  /* ── LEMBRAR PREFERÊNCIA DO USUÁRIO ───────────────────────── */

  restoreAccessMode() {
    try {
      const saved = localStorage.getItem(this.config.storageKey);
      if (saved === 'true') {
        this.state.accessMode = true;
        this.notifyChatElite(true);
      }
    } catch { }
  },

  /* ── BADGE DE MODO ACESSÍVEL ───────────────────────────────── */

  showAccessBadge() {
    if (document.getElementById('vlibras-access-badge')) return;

    const badge = document.createElement('div');
    badge.id = 'vlibras-access-badge';
    badge.textContent = '♿ Modo Acessível';
    badge.setAttribute('aria-live', 'polite');
    badge.setAttribute('role', 'status');
    document.body.appendChild(badge);

    // Forçar reflow antes de adicionar classe para a transição funcionar
    badge.getBoundingClientRect();
    badge.classList.add('visible');

    setTimeout(() => badge.classList.remove('visible'), 4000);
  },

  /* ── INTEGRAÇÃO COM CLAUDE VIA chat-elite.js ──────────────── */
  /*
      V4.1 — nota de decisão: esta seção documentava um contrato com o
      chat-elite.js ("chat-elite.js lê window.__vlibrasAccessMode e
      ajusta o system prompt") que nunca foi implementado do lado de
      chat-elite.js (confirmado por busca no arquivo — zero ocorrências
      de __vlibrasAccessMode). Esse comentário foi removido para não
      documentar uma promessa não cumprida.

      chat-elite.js não é reaberto nesta tarefa (já tratado numa rodada
      anterior e possivelmente em edição paralela por outra pessoa), e o
      problema de sobreposição visual que essa integração também tentava
      mitigar já é resolvido de forma independente pelo posicionamento
      dinâmico por geometria (ver applyDynamicPosition() acima).

      O código abaixo continua funcional por si só: window.__vlibrasAccessMode
      é mantido como uma flag informativa para qualquer script que queira
      lê-la no futuro, e quando window.ChatElite.buildSystemPrompt já
      existe em tempo de execução, ele é envolvido diretamente aqui —
      sem exigir nenhuma mudança em chat-elite.js.
  */

  notifyChatElite(active) {
    // Flag global informativa — não depende de chat-elite.js lê-la.
    window.__vlibrasAccessMode = active;

    // Se o ChatElite já está inicializado, atualizar o system prompt
    if (window.ChatElite && active) {
      // Injetar instrução de linguagem simples no buildSystemPrompt
      const originalBuild = window.ChatElite.buildSystemPrompt?.bind(window.ChatElite);
      if (originalBuild) {
        window.ChatElite.buildSystemPrompt = (context) => {
          const base = originalBuild(context);
          return base + `

MODO ACESSÍVEL ATIVO (usuário usa VLibras — Língua Brasileira de Sinais):
- Use frases CURTAS — máximo 2 linhas por parágrafo
- Palavras SIMPLES — evite termos jurídicos sem explicação
- Estrutura DIRETA — primeiro a ação, depois a explicação
- Números em ALGARISMOS (24h, 3 dias, não "vinte e quatro horas")
- No final, sempre diga: "Posso explicar de outro jeito se quiser."`;
        };
      }
      this.log('[VLibrasElite V4] Modo acessível ativado no ChatElite');
    }

    // Desfazer quando desativado
    if (!active && window.ChatElite) {
      delete window.ChatElite.buildSystemPrompt;
    }
  },

  /* ── GA4 (BUGFIX 1: window.gtag) ───────────────────────────── */

  trackEvent(action, ms) {
    try {
      // BUGFIX 1: window.gtag (não gtag solto)
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', action, {
        event_category: 'Acessibilidade',
        event_label:    'VLibras_Elite_V4',
        load_time_ms:   ms,
        access_mode:    this.state.accessMode,
        pagina_origem:  window.location.pathname
      });
    } catch { }
  },

  log(msg, extra = '') {
    if (this.config.isDebug) console.log(msg, extra);
  }
};

/* V4.1: removida a definição de window.googleTranslateElementInit que
   existia aqui. Esse callback pertence ao widget legado do Google
   Translate usado por tradutor-global.js (script carregado com
   ?cb=googleTranslateElementInit) — o VLibras não usa Google Translate
   e não precisa desse callback. Como window.googleTranslateElementInit
   é global, ter as duas definições era uma colisão real: o script que
   terminasse de parsear por último sobrescrevia a função do outro, e se
   vlibras-plugin.js viesse depois de tradutor-global.js no HTML, a
   inicialização do Google Translate (new google.translate.TranslateElement)
   nunca era chamada — o widget de idiomas ficava permanentemente sem
   inicializar, por mais que o script do Google carregasse com sucesso. */

document.addEventListener('DOMContentLoaded', () => window.VLibrasElite.init());
