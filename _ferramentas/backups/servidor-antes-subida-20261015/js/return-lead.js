/* =========================================================== */
/* === ARQUIVO: js/return-lead.js (ReturnLead V1 — CORRIGIDO) */
/* === FUNÇÃO: Retargeting Orgânico + Claude + Google Sheets  */
/* === Bugs corrigidos: máscara tel, template literal GA4     */
/* =========================================================== */

window.ReturnLead = {

  config: {
    storageKey:          'semim_rv_v1',
    whatsapp:            '5531989420094',
    waBase:              'https://wa.me/',
    minVisitsToShow:     2,
    minDaysBetweenShows: 7,
    showDelayMs:         6000,
    scrollTriggerPct:    45,
    hideAfterShown:      3,
    claudeEndpoint:      '/api/claude-chat.php',
    googleScriptUrl:     'https://script.google.com/macros/s/AKfycbwIXxEnVYvyxfqwUD5TaVRgRfB1EYYd12vWq6i2Ac3p21JIis-HgHkFW2qW66Ljd7n0/exec',
    styleId:             'return-lead-styles',
    widgetId:            'return-lead-widget',
    isDebug:             window.location.hostname !== 'lucassemim.adv.br'
  },

  state: {
    visitData:     null,
    isReturning:   false,
    shown:         false,
    currentStep:   0,
    reducedMotion: false,
    userResponses: {},
    claudeReply:   '',
    timers:        []
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const isReturning = this.checkReturning();
    if (!isReturning || !this.shouldShow()) return;

    this.buildStyles();
    this.buildWidget();

    /* Trigger 1: tempo */
    const timeTimer = setTimeout(() => {
      if (!this.state.shown) this.showWidget('time_trigger');
    }, this.config.showDelayMs);
    this.state.timers.push(timeTimer);

    /* Trigger 2: scroll */
    const scrollHandler = () => {
      const scrollHeight = document.body.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const pct = (window.scrollY / scrollHeight) * 100;
      if (pct >= this.config.scrollTriggerPct && !this.state.shown) {
        this.showWidget('scroll_trigger');
        window.removeEventListener('scroll', scrollHandler);
      }
    };
    window.addEventListener('scroll', scrollHandler, { passive: true });
  },

  /* ── DETECÇÃO DE VISITANTE RECORRENTE ──────────────────────── */

  checkReturning() {
    try {
      const raw  = localStorage.getItem(this.config.storageKey);
      const data = raw ? JSON.parse(raw) : null;

      if (!data) {
        this.updateVisitData({ count: 1, firstVisit: Date.now(), lastVisit: Date.now(), showCount: 0, converted: false });
        this.state.isReturning = false;
        return false;
      }

      const updated = { ...data, count: data.count + 1, lastVisit: Date.now() };
      this.updateVisitData(updated);
      this.state.visitData   = updated;
      this.state.isReturning = updated.count >= this.config.minVisitsToShow;
      return this.state.isReturning;
    } catch {
      return false;
    }
  },

  updateVisitData(data) {
    try { localStorage.setItem(this.config.storageKey, JSON.stringify(data)); } catch { }
  },

  shouldShow() {
    const d = this.state.visitData;
    if (!d || !this.state.isReturning)            return false;
    if (d.converted)                               return false;
    if (d.showCount >= this.config.hideAfterShown) return false;
    const daysSince = d.lastShown
      ? (Date.now() - d.lastShown) / (1000 * 60 * 60 * 24)
      : 999;
    return daysSince >= this.config.minDaysBetweenShows;
  },

  markShown() {
    const d = { ...this.state.visitData, lastShown: Date.now(), showCount: (this.state.visitData?.showCount || 0) + 1 };
    this.updateVisitData(d);
    this.state.visitData = d;
  },

  markConverted() {
    const d = { ...this.state.visitData, converted: true };
    this.updateVisitData(d);
  },

  /* ── CSS ───────────────────────────────────────────────────── */

  buildStyles() {
    if (document.getElementById(this.config.styleId)) return;
    const style = document.createElement('style');
    style.id = this.config.styleId;
    style.textContent = `
      #return-lead-widget {
        position: fixed; bottom: 25px; left: 25px; z-index: 99990;
        width: 300px;
        background: rgba(10,10,12,0.97);
        border: 1px solid rgba(212,175,55,0.3);
        border-top: 3px solid #d4af37;
        border-radius: 10px; padding: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        font-family: 'Lato', sans-serif;
        opacity: 0; transform: translateY(20px); pointer-events: none;
        transition: opacity 0.4s ease, transform 0.4s ease;
      }
      #return-lead-widget.rl-visible { opacity: 1; transform: translateY(0); pointer-events: auto; }
      @media (prefers-reduced-motion: reduce) { #return-lead-widget { transition: none; } }

      .rl-close {
        position: absolute; top: 10px; right: 12px;
        background: none; border: none; color: #666;
        font-size: 1.4rem; cursor: pointer; padding: 0; line-height: 1;
      }
      .rl-close:hover { color: #d4af37; }

      .rl-icon { font-size: 2rem; text-align: center; margin-bottom: 8px; display: block; }

      .rl-title {
        color: #fff; font-family: 'Teko', sans-serif;
        font-size: 1.25rem; text-align: center; margin: 0 0 4px; letter-spacing: 0.5px;
      }
      .rl-question { color: #aaa; font-size: 0.88rem; text-align: center; margin: 0 0 14px; line-height: 1.4; }

      .rl-btn-group { display: flex; flex-direction: column; gap: 7px; }
      .rl-btn {
        background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.2);
        color: #ddd; font-size: 0.85rem; font-family: 'Lato', sans-serif;
        padding: 9px 12px; border-radius: 6px; cursor: pointer;
        text-align: left; transition: background 0.2s, border-color 0.2s; width: 100%;
      }
      .rl-btn:hover { background: rgba(212,175,55,0.15); border-color: rgba(212,175,55,0.4); color: #fff; }

      .rl-btn-primary { background: #d4af37; color: #000; font-weight: 700; text-align: center; border-color: #d4af37; }
      .rl-btn-primary:hover { background: #fff; }
      .rl-btn-primary:disabled { background: #555; color: #999; cursor: not-allowed; }

      .rl-btn-whatsapp {
        display: flex; align-items: center; justify-content: center; gap: 8px;
        background: linear-gradient(135deg, #128c7e, #25d366);
        color: #fff !important; text-decoration: none;
        font-family: 'Teko', sans-serif; font-size: 1.15rem; font-weight: 600;
        padding: 10px; border-radius: 6px; border: none;
        transition: opacity 0.2s; margin-top: 6px; width: 100%; box-sizing: border-box;
      }
      .rl-btn-whatsapp:hover { opacity: 0.9; }

      .rl-input {
        width: 100%; background: rgba(255,255,255,0.05);
        border: 1px solid #444; border-radius: 6px;
        color: #fff; padding: 9px 12px; font-size: 0.88rem;
        font-family: 'Lato', sans-serif; outline: none;
        margin-bottom: 8px; box-sizing: border-box; transition: border-color 0.2s;
      }
      .rl-input:focus { border-color: rgba(212,175,55,0.5); }
      .rl-input::placeholder { color: #666; }

      .rl-claude-reply {
        background: rgba(212,175,55,0.06); border-left: 3px solid #d4af37;
        color: #ccc; font-size: 0.85rem; line-height: 1.55;
        padding: 10px 12px; border-radius: 0 6px 6px 0; margin-bottom: 10px;
      }
      .rl-sigilo { color: #777; font-size: 0.72rem; text-align: center; margin: 0 0 10px; }

      .rl-close-link {
        display: block; width: 100%; background: none; border: none;
        color: #666; font-size: 0.78rem; cursor: pointer;
        text-align: center; padding: 4px; margin-top: 6px;
      }
      .rl-close-link:hover { color: #888; }

      @media (max-width: 768px) {
        #return-lead-widget {
          width: calc(100% - 32px); left: 16px; right: 16px;
          bottom: calc(90px + env(safe-area-inset-bottom, 0px));
        }
      }
    `;
    document.head.appendChild(style);
  },

  /* ── WIDGET ────────────────────────────────────────────────── */

  buildWidget() {
    const widget = document.createElement('div');
    widget.id = this.config.widgetId;
    widget.setAttribute('role', 'dialog');
    widget.setAttribute('aria-modal', 'false');
    widget.setAttribute('aria-label', 'Retomada de caso — Dr. Lucas Semim');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rl-close';
    closeBtn.setAttribute('aria-label', 'Fechar');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => this.hideWidget());

    const content = document.createElement('div');
    content.id = 'rl-content';
    content.className = 'rl-content';

    widget.appendChild(closeBtn);
    widget.appendChild(content);
    document.body.appendChild(widget);
    this.renderStep(1);
  },

  showWidget(trigger) {
    if (this.state.shown) return;
    this.state.shown = true;
    this.markShown();
    const widget = document.getElementById(this.config.widgetId);
    if (!widget) return;
    widget.classList.add('rl-visible');
    this.trackEvent('widget_shown', { trigger });
    if (this.config.isDebug) console.log('[ReturnLead] Widget exibido. Trigger:', trigger);
  },

  hideWidget() {
    const widget = document.getElementById(this.config.widgetId);
    if (widget) widget.classList.remove('rl-visible');
    this.trackEvent('widget_closed', { step: this.state.currentStep });
  },

  renderStep(step) {
    this.state.currentStep = step;
    const content = document.getElementById('rl-content');
    if (!content) return;
    content.innerHTML = '';
    if (step === 1) this.buildStep1(content);
    else if (step === 2) this.buildStep2(content);
    else if (step === 3) this.buildStep3(content);
    else if (step === 4) this.buildStep4(content);
  },

  /* ── PASSO 1 — Pergunta inicial ────────────────────────────── */

  buildStep1(container) {
    const icon = document.createElement('div');
    icon.className = 'rl-icon';
    icon.textContent = '⚖️';

    const title = document.createElement('p');
    title.className = 'rl-title';
    title.textContent = 'Olá! Notamos que você já nos visitou.';

    const question = document.createElement('p');
    question.className = 'rl-question';
    question.textContent = 'Já teve atendimento com o Dr. Lucas Semim?';

    const btns = document.createElement('div');
    btns.className = 'rl-btn-group';

    const opts = [
      { label: '✅ Sim, fui atendido', value: 'sim' },
      { label: '🔄 Estou pensando',    value: 'pensando' },
      { label: '❌ Ainda não',          value: 'nao' }
    ];

    opts.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'rl-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        this.state.userResponses.jaAtendido = opt.value;
        this.trackEvent('step1_answered', { answer: opt.value });
        this.renderStep(2);
      });
      btns.appendChild(btn);
    });

    [icon, title, question, btns].forEach(el => container.appendChild(el));
  },

  /* ── PASSO 2 — Pergunta contextual ────────────────────────── */

  buildStep2(container) {
    const resp = this.state.userResponses.jaAtendido;

    const icon     = document.createElement('div'); icon.className = 'rl-icon';
    const title    = document.createElement('p');   title.className = 'rl-title';
    const question = document.createElement('p');   question.className = 'rl-question';
    const btns     = document.createElement('div'); btns.className = 'rl-btn-group';

    let opcoes = [];

    if (resp === 'sim') {
      icon.textContent     = '🤝';
      title.textContent    = 'Que bom que nos conhecemos!';
      question.textContent = 'Como você avalia o atendimento na delegacia / audiência?';
      opcoes = [
        { label: '⭐⭐⭐⭐⭐ Excelente',             value: '5' },
        { label: '⭐⭐⭐ Bom',                       value: '3' },
        { label: '🔁 Quero dar continuidade ao caso', value: 'continuidade' }
      ];
    } else if (resp === 'pensando') {
      icon.textContent     = '🤔';
      title.textContent    = 'Podemos ajudar você a decidir.';
      question.textContent = 'Qual é a sua situação atual?';
      opcoes = [
        { label: '🚨 Familiar preso agora',      value: 'flagrante' },
        { label: '⚖️ Processo em andamento',     value: 'processo' },
        { label: '📡 Tornozeleira ou execução',  value: 'execucao' },
        { label: '❓ Quero tirar uma dúvida',    value: 'duvida' }
      ];
    } else {
      icon.textContent     = '📋';
      title.textContent    = 'Podemos fazer uma análise gratuita.';
      question.textContent = 'O que aconteceu?';
      opcoes = [
        { label: '🚨 Fui ou familiar foi preso',  value: 'preso' },
        { label: '📄 Recebi uma intimação',        value: 'intimacao' },
        { label: '⚖️ Processo aberto contra mim', value: 'processo' },
        { label: '🔍 Quero orientação jurídica',  value: 'orientacao' }
      ];
    }

    opcoes.forEach(op => {
      const btn = document.createElement('button');
      btn.className = 'rl-btn';
      btn.textContent = op.label;
      btn.addEventListener('click', () => {
        /* avaliacao para quem disse 'sim', situacao para os demais */
        if (resp === 'sim') this.state.userResponses.avaliacao = op.value;
        else                this.state.userResponses.situacao  = op.value;
        this.trackEvent('step2_answered', { answer: op.value });
        this.renderStep(3);
      });
      btns.appendChild(btn);
    });

    [icon, title, question, btns].forEach(el => container.appendChild(el));
  },

  /* ── PASSO 3 — Coleta de dados + Claude ────────────────────── */

  async buildStep3(container) {
    const icon = document.createElement('div'); icon.className = 'rl-icon'; icon.textContent = '📝';
    const title = document.createElement('p'); title.className = 'rl-title'; title.textContent = 'Quase lá — dois dados rápidos:';

    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.className = 'rl-input';
    nameInput.placeholder = 'Seu nome (ex: João Silva)';
    nameInput.setAttribute('autocomplete', 'given-name');

    const phoneInput = document.createElement('input');
    phoneInput.type = 'tel'; phoneInput.className = 'rl-input';
    phoneInput.placeholder = 'WhatsApp (31) 9XXXX-XXXX';
    phoneInput.setAttribute('autocomplete', 'tel');

    /* ── CORREÇÃO BUG 1: máscara com índices corretos ── */
    phoneInput.addEventListener('input', () => {
      const v = phoneInput.value.replace(/\D/g, '');
      const m = v.match(/^(\d{0,2})(\d{0,5})(\d{0,4})/);
      if (m) phoneInput.value = !m[2] ? m[1] : `(${m[1]}) ${m[2]}${m[3] ? '-' + m[3] : ''}`;
    });

    const sendBtn = document.createElement('button');
    sendBtn.className = 'rl-btn rl-btn-primary';
    sendBtn.textContent = '🔍 Analisar meu caso';

    sendBtn.addEventListener('click', async () => {
      const nome     = nameInput.value.trim();
      const telefone = phoneInput.value.trim();

      if (!nome || telefone.length < 14) {
        nameInput.style.borderColor  = nome ? '#444' : '#e74c3c';
        phoneInput.style.borderColor = telefone.length >= 14 ? '#444' : '#e74c3c';
        return;
      }

      this.state.userResponses.nome     = nome;
      this.state.userResponses.telefone = telefone;

      sendBtn.disabled    = true;
      sendBtn.textContent = '⏳ Analisando...';

      /* Claude — fallback gracioso se falhar */
      try {
        this.state.claudeReply = await this.askClaude();
      } catch {
        this.state.claudeReply = 'O Dr. Lucas Semim pode analisar seu caso com máxima prioridade. Entre em contato agora pelo WhatsApp.';
      }

      /* Google Sheets — não bloqueia o fluxo */
      this.sendToGoogleSheet().catch(() => { });

      this.trackEvent('lead_generated', {
        situacao:   this.state.userResponses.situacao || this.state.userResponses.avaliacao,
        jaAtendido: this.state.userResponses.jaAtendido
      });

      this.renderStep(4);
    });

    [icon, title, nameInput, phoneInput, sendBtn].forEach(el => container.appendChild(el));
  },

  /* ── PASSO 4 — Resposta do Claude + CTA WhatsApp ───────────── */

  buildStep4(container) {
    const icon = document.createElement('div'); icon.className = 'rl-icon'; icon.textContent = '⚖️';

    const title = document.createElement('p'); title.className = 'rl-title';
    title.textContent = `${this.state.userResponses.nome || 'Olá'}, aqui está a orientação:`;

    const replyCard = document.createElement('div');
    replyCard.className = 'rl-claude-reply';
    replyCard.textContent = this.state.claudeReply;

    const sigilo = document.createElement('p'); sigilo.className = 'rl-sigilo';
    sigilo.textContent = '🔒 Atendimento sigiloso — amparado pelo Estatuto da OAB';

    const waBtn = document.createElement('a');
    waBtn.className = 'rl-btn rl-btn-whatsapp';
    waBtn.href = this.buildWhatsAppUrl();
    waBtn.target = '_blank'; waBtn.rel = 'noopener noreferrer';
    waBtn.setAttribute('aria-label', 'Falar com Dr. Lucas Semim pelo WhatsApp');

    const waIcon = document.createElement('i');
    waIcon.className = 'fab fa-whatsapp'; waIcon.setAttribute('aria-hidden', 'true');
    waBtn.appendChild(waIcon);
    waBtn.appendChild(document.createTextNode(' Falar com Dr. Lucas agora'));
    waBtn.addEventListener('click', () => { this.markConverted(); this.trackEvent('whatsapp_click', { step: 4 }); });

    const closeLink = document.createElement('button');
    closeLink.className = 'rl-close-link'; closeLink.textContent = 'Fechar';
    closeLink.addEventListener('click', () => this.hideWidget());

    [icon, title, replyCard, sigilo, waBtn, closeLink].forEach(el => container.appendChild(el));
  },

  /* ── CLAUDE API ─────────────────────────────────────────────── */

  async askClaude() {
    const r = this.state.userResponses;
    const contexto = [
      r.jaAtendido === 'sim'      ? `Usuário já foi atendido pelo Dr. Lucas. Avaliação/Interesse: ${r.avaliacao}.` : '',
      r.jaAtendido === 'pensando' ? `Usuário está considerando contratar. Situação: ${r.situacao}.` : '',
      r.jaAtendido === 'nao'      ? `Usuário ainda não contratou. Situação: ${r.situacao}.` : '',
      `Nome: ${r.nome}. Página: ${window.location.pathname}.`
    ].filter(Boolean).join(' ');

    const systemPrompt = `Você é o assistente do Dr. Lucas Renan Semim — advogado criminalista OAB/MG 222.539 — plantão 24h em Sabará/BH.
Com base no contexto do visitante recorrente, gere UMA orientação jurídica objetiva de 2-3 frases que:
1. Reconheça a situação específica do usuário.
2. Explique por que a defesa criminal não pode esperar.
3. Sugira contato com o Dr. Lucas pelo WhatsApp.
Seja empático, urgente e específico. Nunca dê conselho definitivo.
Responda em no máximo 60 palavras.`;

    const response = await fetch(this.config.claudeEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system: systemPrompt, messages: [{ role: 'user', content: contexto }] }),
      signal: AbortSignal.timeout(8000)
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.content?.[0]?.text || '';
  },

  /* ── GOOGLE SHEETS ──────────────────────────────────────────── */

  async sendToGoogleSheet() {
    if (!this.config.googleScriptUrl) return;
    const r = this.state.userResponses;
    const payload = {
      timestamp:   new Date().toISOString(),
      nome:        r.nome        || '',
      telefone:    r.telefone    || '',
      jaAtendido:  r.jaAtendido  || '',
      avaliacao:   r.avaliacao   || '',
      situacao:    r.situacao    || '',
      resposta_ia: this.state.claudeReply || '',
      pagina:      window.location.pathname,
      titulo:      document.title.slice(0, 80),
      campanha:    new URLSearchParams(window.location.search).get('utm_campaign') || 'organico',
      visitas:     this.state.visitData?.count || 0
    };
    await fetch(this.config.googleScriptUrl, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  /* ── URL DO WHATSAPP ────────────────────────────────────────── */

  buildWhatsAppUrl() {
    const r = this.state.userResponses;
    const labels = {
      flagrante:    '🚨 Familiar preso em flagrante',
      processo:     '⚖️ Processo em andamento',
      execucao:     '📡 Tornozeleira / Execução penal',
      duvida:       '❓ Dúvida jurídica',
      preso:        '🚨 Fui preso',
      intimacao:    '📄 Recebi intimação',
      orientacao:   '🔍 Quero orientação',
      continuidade: '🔄 Dar continuidade ao caso',
      '5':          '⭐⭐⭐⭐⭐ Atendimento excelente — quero continuar',
      '3':          '⭐⭐⭐ Bom atendimento — tenho nova situação'
    };
    const sit = labels[r.avaliacao] || labels[r.situacao] || 'Visita recorrente ao site';
    const msg = [
      `Olá Dr. Lucas! Sou ${r.nome}.`,
      `Situação: ${sit}`,
      this.state.claudeReply ? `\n${this.state.claudeReply}` : '',
      '\n_Mensagem enviada pelo assistente do site_'
    ].filter(Boolean).join('\n');
    return `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(msg)}`;
  },

  /* ── GA4 ── CORREÇÃO BUG 2: template literal com backticks ─── */

  trackEvent(action, data = {}) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', `rl_${action}`.slice(0, 40), {
        event_category: 'ReturnLead',
        pagina:         window.location.pathname,
        visitas_total:  this.state.visitData?.count || 0,
        ...data
      });
    } catch { }
  }

};

document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => window.ReturnLead.init(), 100);
});
