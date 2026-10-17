/* =========================================================== */
/* === ARQUIVO: js/ads-intelligence.js (AdsIntelligence V4) === */
/* === FUNÇÃO: Conversão, Call Tracking, GCLID, Smart Bid   === */
/* === Corrigido: window.gtag, inline styles, value track   === */
/* =========================================================== */

/*
  ═══════════════════════════════════════════════════════════════
  ⚠️⚠️⚠️  AÇÃO OBRIGATÓRIA ANTES DE RODAR CAMPANHAS  ⚠️⚠️⚠️
  ═══════════════════════════════════════════════════════════════
  Os 3 valores em "config.labels" (logo abaixo) são PLACEHOLDERS.
  Enquanto começarem com "INSERIR_", NENHUM evento de conversão é
  enviado ao Google Ads (o código já bloqueia isso de propósito —
  ver isLabelConfigured() e trackEvent()). Ou seja: hoje está
  seguro, mas o Smart Bidding não recebe sinal nenhum de conversão
  paga até você colar os 3 códigos reais aqui.

  COMO PEGAR OS 3 VALORES REAIS (uma vez, na conta do Google Ads):
    1. Entre em ads.google.com com a conta do Dr. Lucas.
    2. Menu superior → "Ferramentas e configurações" (ícone de
       chave inglesa) → seção "Medição" → "Conversões".
    3. Clique em cada ação de conversão já criada (WhatsApp,
       Telefone, Formulário). Se ainda não existirem, crie 3
       ações de conversão desse tipo antes.
    4. Dentro de cada uma, clique em "Configuração da tag" →
       "Usar Google Tag Manager" ou "Instalar você mesmo".
    5. Vai aparecer um trecho parecido com:
           gtag('event', 'conversion', {
             'send_to': 'AW-8834506682/aLkx8CnU_abc123'
           });
       O label é SÓ a parte depois da barra: "aLkx8CnU_abc123".
       NÃO é número de telefone, NÃO é o "AW-8834506682" (esse já
       está certo em config.adsId), e NÃO invente um valor.
    6. Cole cada label na chave correspondente em config.labels
       logo abaixo, substituindo o "INSERIR_LABEL_..." inteiro.

  DIAGNÓSTICO DA CAMPANHA (baseado nos dados de 08/09/2026):
  ⛔ Problema crítico: ZERO impressões em TODAS as 24 horas.
     Causa provável: conta Google Ads suspensa por falta de
     pagamento. Ação imediata: regularizar o saldo em
     ads.google.com → Faturamento → Efetuar pagamento.

  🎯 Sem os labels configurados, o Smart Bidding do Google
     fica cego e desperdiça orçamento sem otimizar.
  ═══════════════════════════════════════════════════════════════
*/

window.AdsIntelligence = {

  config: {
    adsId: 'AW-8834506682',

    // ── COLE AQUI OS 3 LABELS REAIS (ver instruções no topo) ──
    // Google Ads → Ferramentas → Medição → Conversões
    // Formato correto: "aLkx8CnU_abc123" (NÃO número de telefone)
    // Enquanto começarem com "INSERIR_", o envio fica bloqueado
    // de propósito (ver isLabelConfigured() mais abaixo).
    labels: {
      whatsapp:  'INSERIR_LABEL_WHATSAPP',
      telefone:  'INSERIR_LABEL_TELEFONE',
      formulario: 'INSERIR_LABEL_FORMULARIO'
    },

    // Valor estimado por tipo de conversão (para Smart Bidding por valor)
    conversionValues: {
      whatsapp:  80.00,   // lead quente — contato direto
      telefone:  120.00,  // lead mais quente — ligou
      formulario: 50.00   // lead morno — preencheu formulário
    },

    phoneNumbers: ['5531989420094', '(31) 98942-0094', '31989420094', '989420094'],
    isDebug: window.location.hostname !== 'lucassemim.adv.br',

    gclid: {
      storageKey: 'semim_gclid',
      ttlDays:    90
    },

    // Horários de pico para advocacia criminal (delegacia, audiências)
    // Baseado em padrão de urgência jurídica — ajustar com dados reais após reativar
    peakHours: {
      madrugada: [0, 1, 2, 3, 4, 5],    // família acordada por preso
      manha:     [8, 9, 10, 11],         // audiências matinais
      noite:     [18, 19, 20, 21, 22]    // após expediente, retorno de delegacia
    }
  },

  state: {
    scrollMilestones: new Set(),
    timeMilestones:   new Set(),
    timeOnPage:       0,
    intervalId:       null,
    prefetchTimers:   new Map(),
    isPeakHour:       false,
    styleInjected:    false
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    try {
      this.captureGclid();
      this.warnPendingLabels();
      this.detectPeakHour();
      this.injectStyles();     // ← NOVO: CSS para elementos criados via JS

      this.log('🚀 [AdsIntelligence V4] Iniciando módulos...');

      this.initCameleon();
      this.initClickTracking();
      this.initScrollDepth();
      this.initTimeTracking();
      this.initPrefetch();
      this.initBidSignals();   // ← NOVO: sinais de qualidade para Smart Bidding
      this.initUrgencyBadge(); // ← NOVO: badge de urgência por horário
    } catch (error) {
      this.log('❌ Erro fatal na inicialização:', error);
    }
  },

  /* ── NOVO: CSS via style.textContent (Elite V3) ────────────── */

  injectStyles() {
    if (document.getElementById('ads-intelligence-styles')) return;
    const style = document.createElement('style');
    style.id = 'ads-intelligence-styles';
    style.textContent = `
      /* Camaleão — span de keyword dourada */
      .ai-keyword-span {
        color: #d4af37;
        text-transform: uppercase;
      }
      /* Scroll depth container invisível */
      .ai-scroll-container {
        position: absolute; top: 0; left: 0;
        width: 1px; height: 100%;
        pointer-events: none; z-index: -9999;
        visibility: hidden;
      }
      /* Scroll depth markers */
      .ai-scroll-marker {
        position: absolute; width: 1px; height: 1px;
      }
      /* Badge de urgência por horário */
      .ai-urgency-badge {
        position: fixed; top: 70px; right: 16px;
        z-index: 9990;
        background: rgba(139,0,0,0.9);
        border: 1px solid rgba(255,80,80,0.4);
        border-radius: 6px; padding: 8px 14px;
        font-family: 'Lato', sans-serif; font-size: 0.78rem;
        color: #fff; line-height: 1.4;
        box-shadow: 0 4px 20px rgba(0,0,0,0.6);
        max-width: 200px;
        animation: aiUrgencyIn 0.4s ease;
        backdrop-filter: blur(8px);
      }
      .ai-urgency-badge strong { display: block; color: #ffd700; margin-bottom: 2px; }
      .ai-urgency-badge-dismiss {
        position: absolute; top: 4px; right: 7px;
        background: none; border: none; color: #aaa;
        cursor: pointer; font-size: 0.9rem; padding: 0; line-height: 1;
      }
      .ai-urgency-badge-dismiss:hover { color: #fff; }
      @keyframes aiUrgencyIn {
        from { opacity: 0; transform: translateX(20px); }
        to   { opacity: 1; transform: translateX(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .ai-urgency-badge { animation: none; }
      }
      @media (max-width: 768px) {
        .ai-urgency-badge { top: auto; bottom: 100px; right: 10px; }
      }
    `;
    document.head.appendChild(style);
  },

  /* ── GCLID ──────────────────────────────────────────────────── */

  captureGclid() {
    try {
      const gclid = new URLSearchParams(window.location.search).get('gclid');
      if (!gclid) return;

      const payload = {
        gclid,
        timestamp:   Date.now(),
        landingPage: window.location.pathname
      };

      sessionStorage.setItem(this.config.gclid.storageKey, JSON.stringify(payload));
      localStorage.setItem(this.config.gclid.storageKey, JSON.stringify(payload));
      this.log(`📌 GCLID capturado: ${gclid.slice(0, 12)}...`);
    } catch (e) {
      this.log('❌ Erro ao capturar GCLID', e);
    }
  },

  getStoredGclid() {
    try {
      const raw = sessionStorage.getItem(this.config.gclid.storageKey)
               || localStorage.getItem(this.config.gclid.storageKey);
      if (!raw) return null;

      const { gclid, timestamp } = JSON.parse(raw);
      const ttlMs = this.config.gclid.ttlDays * 86400000;
      return (Date.now() - timestamp) < ttlMs ? gclid : null;
    } catch { return null; }
  },

  /* ── DIAGNÓSTICO DE LABELS ──────────────────────────────────── */

  // Verificação defensiva: um label só é considerado "pronto para uso"
  // se existir e não for mais o placeholder "INSERIR_...". Usado tanto
  // no aviso de debug quanto no guard real do trackEvent(), para que
  // nunca seja possível disparar um send_to inválido tipo
  // "AW-8834506682/INSERIR_LABEL_WHATSAPP" para o Google Ads.
  isLabelConfigured(key) {
    const label = this.config.labels[key];
    return typeof label === 'string' && label.trim() !== '' && !label.startsWith('INSERIR_');
  },

  warnPendingLabels() {
    if (!this.config.isDebug) return;

    const pendentes = Object.keys(this.config.labels)
      .filter(k => !this.isLabelConfigured(k));

    if (pendentes.length > 0) {
      console.warn(
        `[AdsIntelligence V4] ⚠️ Labels pendentes: ${pendentes.join(', ')}\n` +
        `→ Google Ads → Ferramentas → Medição → Conversões\n` +
        `→ Formato: "aLkx8CnU_abc123" (não número de telefone)\n` +
        `→ Sem labels, o Smart Bidding não consegue otimizar!`
      );
    }

    // Verificar se a campanha está ativa (GCLID presente = clique pago)
    const gclid = this.getStoredGclid();
    if (!gclid) {
      console.info('[AdsIntelligence V4] ℹ️ Nenhum GCLID nesta sessão (acesso orgânico ou direto).');
    }
  },

  /* ── HORÁRIO DE PICO ────────────────────────────────────────── */

  detectPeakHour() {
    const hora = new Date().getHours();
    const peaks = this.config.peakHours;
    this.state.isPeakHour = [
      ...peaks.madrugada,
      ...peaks.manha,
      ...peaks.noite
    ].includes(hora);

    if (this.state.isPeakHour) {
      this.log(`⏰ Horário de pico detectado: ${hora}h`);
    }
  },

  /* ── LOG ────────────────────────────────────────────────────── */

  log(msg, extra = '') {
    if (this.config.isDebug) console.log(msg, extra);
  },

  /* ── TRACK EVENT (BUGFIX 1,2,3: window.gtag em todos) ─────── */

  trackEvent(label, tipo, adsLabelKey = null) {
    try {
      // BUGFIX 1: window.gtag (não gtag solto)
      if (typeof window.gtag !== 'function') {
        this.log('⚠️ window.gtag não encontrado. Evento não disparado:', label);
        return;
      }

      const urlParams = new URLSearchParams(window.location.search);
      const campanha  = urlParams.get('utm_campaign') || urlParams.get('busca') || 'organico';
      const gclid     = this.getStoredGclid();

      // 1. Conversão Google Ads
      // Verificação defensiva (isLabelConfigured): nunca envia send_to
      // com o placeholder "INSERIR_..." ainda não preenchido — evita
      // lixo/erro na conta de Ads enquanto os labels reais não forem
      // colados em config.labels (ver instruções no topo do arquivo).
      if (adsLabelKey && this.isLabelConfigured(adsLabelKey)) {

        const valorConversao = this.config.conversionValues[adsLabelKey] || 1.0;

        const convData = {
          send_to:  `${this.config.adsId}/${this.config.labels[adsLabelKey]}`,
          value:    valorConversao,   // ← NOVO: valor real por tipo de lead
          currency: 'BRL'
        };
        if (gclid) convData.transaction_id = gclid;

        // BUGFIX 2: window.gtag
        window.gtag('event', 'conversion', convData);
        this.log(`💰 Conversão Ads: ${adsLabelKey} = R$ ${valorConversao}`);

      } else if (adsLabelKey) {
        this.log(`⚠️ Label "${adsLabelKey}" não configurado ainda (placeholder). Conversão de Ads não enviada — apenas o evento GA4 abaixo será registrado.`);
      }

      // 2. Evento GA4 semântico
      // BUGFIX 3: window.gtag
      window.gtag('event', 'generate_lead', {
        event_category: 'Conversão',
        event_label:    label,
        tipo_contato:   tipo,
        pagina_origem:  window.location.pathname,
        campanha,
        is_peak_hour:   this.state.isPeakHour,
        ...(gclid ? { gclid } : {})
      });

      // Evento legado para compatibilidade
      window.gtag('event', 'contato_iniciado', {
        event_category: 'Conversão',
        event_label:    label,
        tipo_contato:   tipo,
        pagina_origem:  window.location.pathname,
        campanha
      });

      this.log(`📊 Evento GA4: ${label} (${tipo})`);

    } catch (e) {
      this.log('❌ Erro no trackEvent', e);
    }
  },

  /* ── TRACK ANALYTICS (BUGFIX 4: window.gtag) ───────────────── */

  trackAnalyticsEvent(eventName, category, params = {}) {
    try {
      // BUGFIX 4: window.gtag
      if (typeof window.gtag !== 'function') return;

      window.gtag('event', eventName, {
        event_category: category,
        pagina_origem:  window.location.pathname,
        is_peak_hour:   this.state.isPeakHour,
        ...params
      });

      this.log(`📈 Analytics: ${eventName}`, params);
    } catch (e) {
      this.log('❌ Erro no trackAnalyticsEvent', e);
    }
  },

  /* ── CAMALEÃO (BUGFIX 5: classe CSS em vez de style inline) ── */

  initCameleon() {
    try {
      const params      = new URLSearchParams(window.location.search);
      const termoBusca  = params.get('busca') || params.get('utm_term') || params.get('keyword');
      if (!termoBusca) return;

      const termoLimpo = termoBusca
        .replace(/[^a-zA-Z0-9\sÀ-ú]/g, '')
        .trim()
        .slice(0, 60);

      const heroTitle = document.querySelector('.hero-title');
      if (!heroTitle || termoLimpo.length < 3) return;

      const span = document.createElement('span');
      // BUGFIX 5: classe CSS (não style.color/textTransform inline)
      span.className   = 'ai-keyword-span';
      span.textContent = termoLimpo;

      heroTitle.textContent = '';
      heroTitle.appendChild(span);
      heroTitle.appendChild(document.createElement('br'));
      heroTitle.appendChild(document.createTextNode('ADVOGADO CRIMINALISTA EM SABARÁ E BH'));

      // Enviar sinal de personalização para o Google Ads
      this.trackAnalyticsEvent('camaleao_ativado', 'Personalizacao', {
        termo:    termoLimpo,
        campanha: params.get('utm_campaign') || 'direto'
      });

      this.log(`🎯 Camaleão: "${termoLimpo}"`);
    } catch (e) {
      this.log('❌ Erro no initCameleon', e);
    }
  },

  /* ── CLICK TRACKING ─────────────────────────────────────────── */

  initClickTracking() {
    try {
      // WhatsApp — identificação de origem
      document.querySelectorAll('a[href*="whatsapp"], a[href*="wa.me"]').forEach(btn => {
        btn.addEventListener('click', () => {
          let ctx = 'WhatsApp_Geral';
          if (btn.closest('.hero-title, .hero, #header-placeholder, header')) ctx = 'WhatsApp_Hero';
          else if (btn.closest('.sticky, .fixed, .floating-btn, #mobile-sticky-bar')) ctx = 'WhatsApp_Sticky';
          else if (btn.closest('footer, #footer-placeholder'))                        ctx = 'WhatsApp_Footer';
          else if (btn.closest('.card, .servico, .section-services'))                 ctx = 'WhatsApp_Servico';
          this.trackEvent(ctx, 'Mensagem', 'whatsapp');
        });
      });

      // Ligações
      document.querySelectorAll('a[href^="tel:"]').forEach(btn => {
        btn.addEventListener('click', () => {
          this.trackEvent('Clique_Ligar', 'Chamada', 'telefone');
        });
      });

      // Cópia de telefone
      document.addEventListener('copy', () => {
        try {
          const sel       = (window.getSelection() || document.getSelection())?.toString() || '';
          const cleanSel  = sel.replace(/\D/g, '');

          const isPhone = this.config.phoneNumbers.some(n => {
            const clean = n.replace(/\D/g, '');
            return cleanSel.includes(clean) && cleanSel.length >= 8;
          });

          if (isPhone) this.trackEvent('Copiar_Telefone', 'Intencao_Chamada', 'telefone');
        } catch { }
      });
    } catch (e) {
      this.log('❌ Erro no initClickTracking', e);
    }
  },

  /* ── SCROLL DEPTH (BUGFIX 6: classes CSS em vez de style inline) */

  initScrollDepth() {
    try {
      const markers = [25, 50, 75, 90];

      // BUGFIX 6: classe CSS (não style.* inline)
      const container = document.createElement('div');
      container.className = 'ai-scroll-container';
      container.setAttribute('aria-hidden', 'true');

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const depth = parseInt(entry.target.dataset.depth, 10);
          if (this.state.scrollMilestones.has(depth)) return;

          this.state.scrollMilestones.add(depth);
          this.trackAnalyticsEvent('scroll_depth', 'Engajamento', {
            percent_scrolled: depth
          });

          // Sinal de qualidade para Smart Bidding
          if (depth >= 75) {
            this.trackAnalyticsEvent('high_engagement_scroll', 'Qualidade_Lead', {
              percent_scrolled: depth
            });
          }
        });
      }, { threshold: 0.1 });

      markers.forEach(pct => {
        const marker = document.createElement('div');
        // BUGFIX 6: classe CSS (não style.position/top/width/height inline)
        marker.className    = 'ai-scroll-marker';
        marker.style.top    = `${pct}%`; // top é dinâmico — aceitável
        marker.dataset.depth = String(pct);
        container.appendChild(marker);
        observer.observe(marker);
      });

      document.body.appendChild(container);
    } catch (e) {
      this.log('❌ Erro no initScrollDepth', e);
    }
  },

  /* ── TIME TRACKING ──────────────────────────────────────────── */

  initTimeTracking() {
    try {
      const startTimer = () => {
        this.state.intervalId = setInterval(() => {
          if (document.hidden) return;
          this.state.timeOnPage++;
          const t = this.state.timeOnPage;

          if ([30, 60, 120].includes(t) && !this.state.timeMilestones.has(t)) {
            this.state.timeMilestones.add(t);
            this.trackAnalyticsEvent('time_on_page', 'Engajamento', { seconds: t });

            // 60s+ = lead de alta qualidade — sinalizar para Smart Bidding
            if (t >= 60) {
              this.trackAnalyticsEvent('qualified_time_on_page', 'Qualidade_Lead', {
                seconds: t
              });
            }
          }
        }, 1000);
      };

      startTimer();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) clearInterval(this.state.intervalId);
        else startTimer();
      });
    } catch (e) {
      this.log('❌ Erro no initTimeTracking', e);
    }
  },

  /* ── PREFETCH ───────────────────────────────────────────────── */

  initPrefetch() {
    try {
      const ownDomain = window.location.hostname;
      const links = [...document.querySelectorAll('a[href]')].filter(link => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('/')) return true;
        try {
          return new URL(href, window.location.origin).hostname === ownDomain;
        } catch { return false; }
      });

      links.forEach(link => {
        link.addEventListener('mouseover', () => {
          const href = link.getAttribute('href');
          if (!href || href.includes('#') || href.includes('tel:') || href.includes('wa.me')) return;

          if (this.state.prefetchTimers.has(href)) clearTimeout(this.state.prefetchTimers.get(href));

          const timer = setTimeout(() => {
            if (!document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
              const tag = document.createElement('link');
              tag.rel  = 'prefetch';
              tag.href = href;
              document.head.appendChild(tag);
              this.log(`⚡ Prefetch: ${href}`);
            }
          }, 300);

          this.state.prefetchTimers.set(href, timer);
        });

        link.addEventListener('mouseout', () => {
          const href = link.getAttribute('href');
          if (this.state.prefetchTimers.has(href)) clearTimeout(this.state.prefetchTimers.get(href));
        });
      });
    } catch (e) {
      this.log('❌ Erro no initPrefetch', e);
    }
  },

  /* ── NOVO: BID SIGNALS — sinais de qualidade para Smart Bidding */

  initBidSignals() {
    try {
      const gclid = this.getStoredGclid();
      if (!gclid) return; // só interessa se veio de clique pago

      // Sinal 1: tipo de dispositivo
      const isMobile = window.innerWidth < 768;
      this.trackAnalyticsEvent('bid_signal_device', 'SmartBidding', {
        device_type: isMobile ? 'mobile' : 'desktop',
        gclid_present: true
      });

      // Sinal 2: hora de acesso
      const hora = new Date().getHours();
      this.trackAnalyticsEvent('bid_signal_hour', 'SmartBidding', {
        hora_acesso:  hora,
        is_peak_hour: this.state.isPeakHour
      });

      // Sinal 3: página de entrada (qual serviço interessa)
      const path  = window.location.pathname;
      let servico = 'geral';
      if (path.includes('flagrante'))   servico = 'flagrante';
      else if (path.includes('habeas')) servico = 'habeas_corpus';
      else if (path.includes('trafico')) servico = 'trafico';
      else if (path.includes('execucao')) servico = 'execucao_penal';
      else if (path.includes('tornozeleira')) servico = 'tornozeleira';

      this.trackAnalyticsEvent('bid_signal_landing', 'SmartBidding', {
        servico_interesse: servico,
        pagina:            path
      });

      this.log(`📡 Bid Signals enviados → hora: ${hora}h, serviço: ${servico}, pico: ${this.state.isPeakHour}`);
    } catch (e) {
      this.log('❌ Erro no initBidSignals', e);
    }
  },

  /* ── NOVO: URGENCY BADGE por horário ────────────────────────── */

  initUrgencyBadge() {
    try {
      // Só mostrar se veio de clique pago (GCLID presente)
      const gclid = this.getStoredGclid();
      if (!gclid && !this.config.isDebug) return;

      // Só mostrar em horários de pico
      if (!this.state.isPeakHour && !this.config.isDebug) return;

      // Não mostrar se já fechou antes nesta sessão
      if (sessionStorage.getItem('ai_badge_dismissed')) return;

      const hora = new Date().getHours();
      let mensagem = '';

      if (this.config.peakHours.madrugada.includes(hora)) {
        mensagem = 'Plantão criminal 24h: atendimento de flagrantes também de madrugada.';
      } else if (this.config.peakHours.manha.includes(hora)) {
        mensagem = 'Se houve prisão ou intimação, fale com o plantão do escritório pelo WhatsApp.';
      } else {
        mensagem = 'Descreva a situação pelo WhatsApp e o escritório retorna o contato.';
      }

      // Mostrar após 8 segundos (usuário já leu algo)
      setTimeout(() => {
        if (document.getElementById('ai-urgency-badge')) return;

        const badge = document.createElement('div');
        badge.id = 'ai-urgency-badge';
        badge.className = 'ai-urgency-badge';
        badge.setAttribute('role', 'status');
        badge.setAttribute('aria-live', 'polite');

        const strong = document.createElement('strong');
        strong.textContent = '⚡ PLANTÃO CRIMINAL 24H';

        const txt = document.createElement('span');
        txt.textContent = mensagem;

        const dismiss = document.createElement('button');
        dismiss.className = 'ai-urgency-badge-dismiss';
        dismiss.setAttribute('aria-label', 'Fechar aviso');
        dismiss.textContent = '×';
        dismiss.addEventListener('click', () => {
          badge.remove();
          sessionStorage.setItem('ai_badge_dismissed', '1');
        });

        badge.appendChild(dismiss);
        badge.appendChild(strong);
        badge.appendChild(txt);
        document.body.appendChild(badge);

        this.trackAnalyticsEvent('urgency_badge_shown', 'Engajamento_Pago', { hora });

        // Auto-dismiss após 12 segundos
        setTimeout(() => badge.remove(), 12000);
      }, 8000);
    } catch (e) {
      this.log('❌ Erro no initUrgencyBadge', e);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => window.AdsIntelligence.init());
