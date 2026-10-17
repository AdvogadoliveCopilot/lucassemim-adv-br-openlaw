/* =========================================================== */
/* === FICHEIRO: js/chat-elite.js (ChatElite V5 - Claude API) = */
/* === FUNÇÃO: IA Generativa, Qualificação e Triagem         === */
/* === Site: lucassemim.adv.br — Advocacia Criminal         === */
/* =========================================================== */

/**
 * Configuração estática do widget. Nunca muda em runtime.
 * @typedef {Object} ChatEliteTriggerConfig
 * @property {string[]} contexts            Contextos de página que ativam este modo
 * @property {number|null} autoOpenDelayMs  Atraso do auto-open (null = nunca abre sozinho)
 * @property {boolean} skipAI               Pula a IA e vai direto para o WhatsApp
 * @property {boolean} badge                Mostra o badge vermelho de notificação
 */

/**
 * @typedef {Object} ChatEliteAIConfig
 * @property {boolean} enabled              Liga/desliga as respostas de IA
 * @property {string} model                 Modelo enviado ao proxy
 * @property {number} maxTokens             Limite de tokens por resposta
 * @property {string} endpoint              Proxy local (/api/claude-chat.php)
 * @property {number} maxAiReplies          Quantas respostas de IA antes do CTA de WhatsApp
 * @property {string[]} disableOnContexts   Contextos em que a IA não é usada
 */

/**
 * @typedef {Object} ChatEliteConfig
 * @property {string} whatsapp              Número no formato internacional, só dígitos
 * @property {string} waBase                Prefixo do link do WhatsApp
 * @property {string} avatar                Caminho da foto do advogado
 * @property {string} storageKey            Chave usada no sessionStorage
 * @property {{wrapper: number, window: number}} zIndex
 * @property {ChatEliteAIConfig} ai
 * @property {{urgency: ChatEliteTriggerConfig, assisted: ChatEliteTriggerConfig, passive: ChatEliteTriggerConfig}} triggers
 */

/**
 * Estado mutável do widget. Tudo aqui é recriado no load da página.
 * @typedef {Object} ChatEliteState
 * @property {boolean} isOpen                    Janela de chat aberta
 * @property {boolean} triggered                 Algum gatilho (scroll/exit/auto) já disparou
 * @property {boolean} userClosed                Usuário fechou manualmente — não reabrir sozinho
 * @property {string} context                    Contexto detectado (flagrante, habeas, default, ...)
 * @property {HTMLElement|null} wrapper          Container fixo do widget
 * @property {HTMLElement|null} chatWindow       Painel do chat
 * @property {HTMLElement|null} chatBody         Área rolável das mensagens
 * @property {HTMLInputElement|null} inputEl     Campo de digitação
 * @property {HTMLElement|null} btnEl            Botão flutuante
 * @property {HTMLElement|null} badgeEl          Badge de notificação
 * @property {number[]} timers                   IDs de setTimeout pendentes
 * @property {boolean} mutationObserverActive    Observador de layout já registrado (evita duplicar)
 * @property {boolean} messagesShown             Mensagens iniciais já exibidas
 * @property {number} aiRepliesCount             Respostas de IA já enviadas
 * @property {boolean} aiMode                    Requisição de IA em andamento
 * @property {{role: 'user'|'assistant', content: string}[]} conversationHistory
 */

/**
 * @typedef {Object} ChatEliteMessage
 * @property {'user'|'assistant'} role
 * @property {string} content
 */

/** Widget de chat + triagem por IA do site. */
/** @type {{config: ChatEliteConfig, state: ChatEliteState}} */
window.ChatElite = {
  config: {
    whatsapp: '5531989420094',
    waBase: 'https://wa.me/',
    avatar: '/img/lucasrenansemimeadvogado.jpeg',
    storageKey: 'semim_chat_v5',
    zIndex: {
      wrapper: 99998,
      window: 99998
    },
    ai: {
      enabled: true,
      model: 'claude-sonnet-5',
      maxTokens: 350,
      // Endpoint local seguro que repassa para a Anthropic sem expor a API key
      endpoint: '/api/claude-chat.php',
      maxAiReplies: 3,
      disableOnContexts: ['flagrante', 'emergencia', 'audiencia']
    },
    triggers: {
      urgency: {
        contexts: ['flagrante', 'emergencia', 'audiencia'],
        autoOpenDelayMs: 8000,
        skipAI: true,
        badge: false
      },
      assisted: {
        contexts: ['tornozeleira', 'saidinha', 'preventiva', 'habeas', 'trafico'],
        autoOpenDelayMs: 20000,
        skipAI: false,
        badge: true
      },
      passive: {
        contexts: ['default', 'cidade', 'canivete', 'fato_atipico', 'maria_penha', 'prescricao', 'pix_fraude', 'lei_seca', 'progressao'],
        autoOpenDelayMs: null,
        skipAI: false,
        badge: true
      }
    }
  },

  state: {
    isOpen: false,
    triggered: false,
    userClosed: false,
    context: 'default',
    wrapper: null,
    chatWindow: null,
    chatBody: null,
    inputEl: null,
    btnEl: null,
    badgeEl: null,
    timers: [],
    mutationObserverActive: false,
    messagesShown: false,
    aiRepliesCount: 0,
    aiMode: false,
    conversationHistory: []
  },

  async init() {
    if (document.getElementById('elite-chat-wrapper')) return;

    this.loadState();
    this.detectContext();
    this.buildStyles();
    this.buildWidget();

    requestAnimationFrame(() => {
      this.coordenateWithMobileBar();
      if (this.state.userClosed) return;

      const mode = this.getUrgencyMode();

      if (mode === 'urgency') {
        const t = setTimeout(() => {
          this.autoOpen('urgency_auto');
        }, this.config.triggers.urgency.autoOpenDelayMs);
        this.state.timers.push(t);
      } else if (mode === 'assisted') {
        this.initScrollTrigger();
        this.initExitIntent();
        const t = setTimeout(() => {
          this.autoOpen('assisted_auto');
        }, this.config.triggers.assisted.autoOpenDelayMs);
        this.state.timers.push(t);

        const bt = setTimeout(() => {
          if (!this.state.isOpen) this.showBadge(1);
        }, 10000);
        this.state.timers.push(bt);
      } else {
        const bt = setTimeout(() => {
          if (!this.state.isOpen && !this.state.triggered) this.showBadge(1);
        }, 15000);
        this.state.timers.push(bt);
        this.initExitIntent();
      }
    });
  },

  // Abertura automática educada: no celular não cobre o título nem o aviso de cookies.
  autoOpen(reason, tries) {
    tries = tries || 0;
    if (this.state.isOpen || this.state.userClosed) return;
    if (reason === 'assisted_auto' && this.state.triggered) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && tries < 6) {
      const bar = document.getElementById('lgpd-consent-bar');
      const consentVisible = bar && bar.classList.contains('is-visible');
      const stillAtTop = (window.scrollY || 0) < 120;
      if (consentVisible || stillAtTop) {
        const t = setTimeout(() => this.autoOpen(reason, tries + 1), 5000);
        this.state.timers.push(t);
        return;
      }
    }
    this.openChat(reason);
  },

  loadState() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.config.storageKey) || '{}');
      this.state.userClosed = saved.userClosed || false;
      this.state.triggered = saved.triggered || false;
    } catch { }
  },

  saveState() {
    try {
      sessionStorage.setItem(this.config.storageKey, JSON.stringify({
        userClosed: this.state.userClosed,
        triggered: this.state.triggered
      }));
    } catch { }
  },

  detectContext() {
    const path = window.location.pathname.toLowerCase();
    const title = document.title.toLowerCase();
    const meta = document.querySelector('meta[name="keywords"]')?.content?.toLowerCase() || '';
    const h1 = document.querySelector('h1')?.textContent?.toLowerCase() || '';
    const combined = [path, title, meta, h1].join(' ');

    const mapa = {
      flagrante: ['flagrante'],
      emergencia: ['emergencia', 'urgente', 'socorro', 'preso agora'],
      audiencia: ['audiencia', 'custódia', 'custodia'],
      habeas: ['habeas', ' hc '],
      trafico: ['trafico', 'tráfico', 'drogas'],
      tornozeleira: ['tornozel'],
      preventiva: ['preventiva'],
      saidinha: ['saidinha', 'saida-temporaria', 'saída temporária'],
      canivete: ['canivete', 'arma-branca', 'arma branca', 'faca no carro'],
      fato_atipico: ['fato-atipico', 'atípico', 'atipico', 'caso-atipico'],
      maria_penha: ['maria-da-penha', 'medida-protetiva', 'fianca', 'fiança'],
      prescricao: ['calculadora', 'prescricao', 'prescrição', 'legal-tech'],
      pix_fraude: ['pix', 'estelionato', 'laranja', 'receptacao', 'celular-roubado'],
      progressao: ['progressao', 'progressão', 'execucao-penal', 'seeu'],
      lei_seca: ['lei-seca', 'bafometro', 'bafômetro', 'blitz', 'cnh'],
      cidade: ['sabara', 'betim', 'contagem', 'neves', 'ibirite', 'caete', 'barreiro', 'esmeraldas', 'igarape']
    };

    for (const [ctx, palavras] of Object.entries(mapa)) {
      if (palavras.some(p => combined.includes(p))) {
        this.state.context = ctx;
        return ctx;
      }
    }

    this.state.context = 'default';
    return 'default';
  },

  getUrgencyMode() {
    const ctx = this.state.context;
    const t = this.config.triggers;

    if (t.urgency.contexts.includes(ctx)) return 'urgency';
    if (t.assisted.contexts.includes(ctx)) return 'assisted';
    return 'passive';
  },

  buildStyles() {
    if (document.getElementById('chat-elite-styles')) return;

    const style = document.createElement('style');
    style.id = 'chat-elite-styles';
    style.textContent = `
        #elite-chat-wrapper {
            position: fixed;
            bottom: 25px;
            right: 25px;
            z-index: ${this.config.zIndex.wrapper};
            font-family: 'Lato', sans-serif;
            pointer-events: none;
        }
        #elite-chat-wrapper * { pointer-events: auto; }
        
        #elite-chat-btn {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #d4af37 0%, #aa8c2c 100%);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 5px 20px rgba(212, 175, 55, 0.4);
            transition: transform 0.3s;
            border: 2px solid #000;
            position: absolute;
            bottom: 0;
            right: 0;
            -webkit-tap-highlight-color: transparent;
        }
        #elite-chat-btn:hover { transform: scale(1.1); }
        #elite-chat-btn i { color: #000; font-size: 1.8rem; }
        
        #elite-chat-window {
            position: absolute;
            bottom: 80px;
            right: 0;
            width: 320px;
            background: rgba(15, 15, 15, 0.95);
            backdrop-filter: blur(15px);
            -webkit-backdrop-filter: blur(15px);
            border: 1px solid #d4af37;
            border-radius: 12px;
            box-shadow: 0 15px 35px rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transform: translateY(20px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            transform-origin: bottom right;
            z-index: ${this.config.zIndex.window};
        }
        #elite-chat-window.active {
            transform: translateY(0);
            opacity: 1;
            pointer-events: auto;
        }
        
        .chat-header {
            background: #050505;
            padding: 15px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .chat-header-info { display: flex; align-items: center; gap: 12px; }
        .chat-name { color: #fff; font-family: 'Teko', sans-serif; font-size: 1.4rem; line-height: 1; margin: 0; letter-spacing: 1px;}
        .chat-status { color: #25D366; font-size: 0.8rem; display: flex; align-items: center; gap: 5px; margin-top: 3px; }
        .status-dot { width: 8px; height: 8px; background: #25D366; border-radius: 50%; box-shadow: 0 0 8px #25D366; animation: eliteBlink 2s infinite; }
        .close-chat { color: #888; background: none; border: none; font-size: 1.5rem; cursor: pointer; transition: 0.2s; padding: 0; }
        .close-chat:hover { color: #d4af37; }
        
        .chat-body {
            padding: 20px;
            background: rgba(0,0,0,0.3);
            max-height: 350px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .chat-msg-bot {
            background: #222;
            border-left: 3px solid #d4af37;
            padding: 12px 15px;
            border-radius: 0 10px 10px 10px;
            color: #e0e0e0;
            font-size: 0.95rem;
            line-height: 1.4;
            word-wrap: break-word;
        }
        
        .chat-footer { padding: 15px; background: #050505; border-top: 1px solid #333; }
        .chat-input-wrapper { display: flex; gap: 10px; background: #111; border: 1px solid #444; border-radius: 20px; padding: 5px 5px 5px 15px; }
        .chat-input { background: transparent; border: none; color: #fff; width: 100%; outline: none; font-size: 0.95rem; }
        .chat-input::placeholder { color: #666; }
        .chat-send-btn { background: #d4af37; border: none; width: 35px; height: 35px; min-width: 35px; border-radius: 50%; color: #000; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: 0.2s; padding: 0; }
        .chat-send-btn:hover { background: #fff; transform: scale(1.1); }
        
        @keyframes eliteBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        
        .chat-avatar-container { position: relative; flex-shrink: 0; }
        .chat-avatar { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #d4af37; object-fit: cover; display: block; }
        .chat-avatar-fallback { width: 45px; height: 45px; border-radius: 50%; border: 2px solid #d4af37; background: linear-gradient(135deg, #d4af37, #aa8c2c); color: #000; font-family: 'Teko', sans-serif; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; }
        
        .chat-typing { display: flex; gap: 5px; padding: 12px 15px; background: #222; border-left: 3px solid #d4af37; border-radius: 0 10px 10px 10px; width: fit-content; }
        .chat-typing span { width: 8px; height: 8px; background: #d4af37; border-radius: 50%; animation: chatTypingDot 1.2s infinite; }
        .chat-typing span:nth-child(2) { animation-delay: 0.2s; }
        .chat-typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes chatTypingDot { 0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; } 40% { transform: scale(1.0); opacity: 1.0; } }
        
        .chat-badge-notify { position: absolute; top: -4px; right: -4px; background: #e53935; color: #fff; font-family: 'Lato', sans-serif; font-size: 0.7rem; font-weight: 700; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: badgePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: none; }
        @keyframes badgePop { from { transform: scale(0); } to { transform: scale(1); } }
        
        .chat-ai-thinking { display: flex; align-items: center; gap: 8px; color: #d4af37; font-size: 0.85rem; font-family: 'Lato', sans-serif; padding: 8px 0; animation: aiBlink 1.2s ease-in-out infinite; }
        .chat-ai-thinking i { font-size: 1rem; }
        @keyframes aiBlink { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

        .chat-wa-cta { background: linear-gradient(135deg, #128c7e, #25d366); color: #fff; border: none; border-radius: 8px; padding: 10px 14px; cursor: pointer; width: 100%; margin-top: 10px; font-family: 'Teko', sans-serif; font-size: 1.1rem; letter-spacing: 0.5px; text-align: left; display: flex; align-items: center; gap: 8px; transition: opacity 0.2s; }
        .chat-wa-cta:hover { opacity: 0.9; }

        .chat-ai-badge { background: rgba(212,175,55,0.15); color: #d4af37; font-size: 0.65rem; font-family: 'Lato', sans-serif; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid rgba(212,175,55,0.3); letter-spacing: 0.5px; text-transform: uppercase; margin-left: 8px;}

        .chat-quick-questions { margin-top: 5px; }
        .chat-quick-label { color: #777; font-size: 0.78rem; margin: 0 0 8px; font-family: 'Lato', sans-serif; }
        .chat-quick-btn { display: block; width: 100%; text-align: left; background: rgba(212,175,55,0.07); border: 1px solid rgba(212,175,55,0.2); color: #ccc; font-family: 'Lato', sans-serif; font-size: 0.85rem; padding: 8px 12px; border-radius: 6px; cursor: pointer; margin-bottom: 6px; transition: background 0.2s, border-color 0.2s; }
        .chat-quick-btn:hover { background: rgba(212,175,55,0.14); border-color: rgba(212,175,55,0.4); color: #fff; }

        .chat-msg-user { background: rgba(212,175,55,0.12); border-right: 3px solid #d4af37; padding: 10px 14px; border-radius: 10px 0 10px 10px; color: #e0e0e0; font-size: 0.9rem; line-height: 1.4; align-self: flex-end; max-width: 85%; }

        @media(max-width: 768px) {
            #elite-chat-window { width: 300px; bottom: 80px; }
        }
    `;
    document.head.appendChild(style);
  },

  buildWidget() {
    const wrapper = document.createElement('div');
    wrapper.id = 'elite-chat-wrapper';
    this.state.wrapper = wrapper;

    const chatWindow = this.buildChatWindow();
    const btn = this.buildBtn();

    wrapper.appendChild(chatWindow);
    wrapper.appendChild(btn);
    document.body.appendChild(wrapper);
  },

  buildBtn() {
    const btn = document.createElement('div');
    btn.id = 'elite-chat-btn';
    btn.setAttribute('role', 'button');
    btn.setAttribute('aria-label', 'Abrir chat ao vivo');
    this.state.btnEl = btn;

    const icon = document.createElement('i');
    icon.className = 'fas fa-comments';
    icon.setAttribute('aria-hidden', 'true');
    btn.appendChild(icon);

    btn.addEventListener('click', () => {
      if (this.state.isOpen) {
        this.closeChat();
      } else {
        this.openChat('manual');
      }
    });

    return btn;
  },

  buildChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.id = 'elite-chat-window';
    this.state.chatWindow = chatWindow;

    const header = this.buildHeader();

    const body = document.createElement('div');
    body.className = 'chat-body';
    this.state.chatBody = body;

    const inputFooter = this.buildInput();

    chatWindow.appendChild(header);
    chatWindow.appendChild(body);
    chatWindow.appendChild(inputFooter);

    return chatWindow;
  },

  buildHeader() {
    const header = document.createElement('div');
    header.className = 'chat-header';

    const info = document.createElement('div');
    info.className = 'chat-header-info';
    info.appendChild(this.buildAvatar());
    info.appendChild(this.buildHeaderInfo({
      name: 'DR. LUCAS SEMIM',
      status: ' Online Agora',
      showAiBadge: this.config.ai.enabled
    }));

    header.appendChild(info);
    header.appendChild(this.buildCloseButton());

    return header;
  },

  // Bloco nome + badge IA + status "online" do cabecalho.
  buildHeaderInfo({ name, status, showAiBadge = false }) {
    const textDiv = document.createElement('div');

    const nameContainer = document.createElement('div');
    nameContainer.style.display = 'flex';
    nameContainer.style.alignItems = 'center';

    const nameEl = document.createElement('h4');
    nameEl.className = 'chat-name';
    nameEl.textContent = name;
    nameContainer.appendChild(nameEl);

    if (showAiBadge) {
      const aiBadge = document.createElement('span');
      aiBadge.className = 'chat-ai-badge';
      aiBadge.textContent = '⚡ IA';
      nameContainer.appendChild(aiBadge);
    }

    const statusEl = document.createElement('span');
    statusEl.className = 'chat-status';

    const dot = document.createElement('div');
    dot.className = 'status-dot';

    statusEl.appendChild(dot);
    statusEl.appendChild(document.createTextNode(status));

    textDiv.appendChild(nameContainer);
    textDiv.appendChild(statusEl);

    return textDiv;
  },

  // Botao "X" de fechar o chat.
  buildCloseButton() {
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-chat';
    closeBtn.setAttribute('aria-label', 'Fechar chat');

    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeIcon.setAttribute('aria-hidden', 'true');

    closeBtn.appendChild(closeIcon);
    closeBtn.addEventListener('click', () => this.closeChat());

    return closeBtn;
  },

  buildAvatar() {
    const container = document.createElement('div');
    container.className = 'chat-avatar-container';

    const img = document.createElement('img');
    img.src = this.config.avatar;
    img.className = 'chat-avatar';
    img.alt = 'Dr. Lucas Semim';
    img.width = 45;
    img.height = 45;

    img.addEventListener('error', () => this.handleAvatarError(img, container));

    container.appendChild(img);
    return container;
  },

  // Fallback quando a foto nao carrega: esconde a img e mostra as iniciais.
  handleAvatarError(img, container) {
    img.style.display = 'none';
    if (container.querySelector('.chat-avatar-fallback')) return;

    const fallback = document.createElement('div');
    fallback.className = 'chat-avatar-fallback';
    fallback.textContent = 'LS';
    container.appendChild(fallback);
  },

  buildInput() {
    const footer = document.createElement('div');
    footer.className = 'chat-footer';

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Digite sua mensagem...';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('aria-label', 'Mensagem para o Dr. Lucas Semim');
    input.className = 'chat-input';
    this.state.inputEl = input;

    const sendBtn = document.createElement('button');
    sendBtn.type = 'button';
    sendBtn.className = 'chat-send-btn';
    sendBtn.setAttribute('aria-label', 'Enviar mensagem');

    const icon = document.createElement('i');
    icon.className = 'fas fa-paper-plane';
    icon.setAttribute('aria-hidden', 'true');
    sendBtn.appendChild(icon);

    const doSend = () => {
      const text = input.value.trim();
      if (text) {
        this.trackUserQuestion(text);
        if (!this.config.ai.enabled || this.getUrgencyMode() === 'urgency') {
            this.sendToWhatsApp(text);
        } else {
            const userMsg = document.createElement('div');
            userMsg.className = 'chat-msg-user';
            userMsg.textContent = text;
            this.state.chatBody.appendChild(userMsg);
            this.state.chatBody.scrollTop = this.state.chatBody.scrollHeight;
            this.askAI(text);
        }
        input.value = '';
      }
    };

    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    wrapper.appendChild(input);
    wrapper.appendChild(sendBtn);
    footer.appendChild(wrapper);

    return footer;
  },

  openChat(source = 'manual') {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.state.chatWindow.classList.add('active');
    this.hideBadge();
    this.trackEvent('chat_open', { source });

    if (!this.state.messagesShown) {
      this.state.messagesShown = true;
      const msgs = this.getMessages(this.state.context);
      this.typingThenMessage(msgs).then(() => {
          if (this.state.aiRepliesCount === 0 && this.config.ai.enabled && this.getUrgencyMode() !== 'urgency') {
              this.showQuickQuestions();
          }
      });
    }

    setTimeout(() => {
      if (this.state.inputEl && window.innerWidth > 768) {
        this.state.inputEl.focus();
      }
    }, 320);
  },

  closeChat() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.userClosed = true;
    this.state.chatWindow.classList.remove('active');
    this.saveState();
    this.trackEvent('chat_close', {});
    this.state.conversationHistory = [];
    this.state.aiRepliesCount = 0;
  },

  showBadge(count = 1) {
    if (this.state.badgeEl) return;

    const badge = document.createElement('span');
    badge.id = 'chat-badge';
    badge.textContent = count.toString();
    badge.className = 'chat-badge-notify';

    this.state.btnEl.appendChild(badge);
    this.state.badgeEl = badge;
  },

  hideBadge() {
    if (this.state.badgeEl) {
      this.state.badgeEl.remove();
      this.state.badgeEl = null;
    }
  },

  async typingThenMessage(messages) {
    const body = this.state.chatBody;

    for (let i = 0; i < messages.length; i++) {
      const typing = document.createElement('div');
      typing.className = 'chat-typing';
      for (let d = 0; d < 3; d++) {
        const dot = document.createElement('span');
        typing.appendChild(dot);
      }
      body.appendChild(typing);
      body.scrollTop = body.scrollHeight;

      const delay = Math.min(Math.max(messages[i].length * 28, 800), 2400);
      await new Promise(r => setTimeout(r, delay));

      typing.remove();

      const msgEl = document.createElement('div');
      msgEl.className = 'chat-msg-bot';
      msgEl.textContent = messages[i];
      body.appendChild(msgEl);
      body.scrollTop = body.scrollHeight;

      if (i < messages.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
  },

  getMessages(context) {
    const msgs = {
      flagrante: [
        '🚨 PLANTÃO 24H ATIVO.',
        'Se alguém foi preso agora, cada minuto conta para a defesa no flagrante e na audiência de custódia. Descreva a situação.'
      ],
      habeas: [
        '⚖️ Habeas Corpus é urgente.',
        'O Dr. Lucas Semim atua em HC no TJMG, STJ e STF. Informe o caso do preso para iniciarmos o procedimento agora.'
      ],
      trafico: [
        '🔴 Preso por tráfico de drogas?',
        'A defesa nas primeiras horas define o resultado. O Dr. Lucas Semim age no flagrante, na custódia e na diferenciação entre uso e tráfico. Descreva o caso.'
      ],
      audiencia: [
        '⏱️ Audiência de custódia — o momento mais crítico.',
        'O Dr. Lucas Semim atua nessas audiências impedindo a decretação de preventiva. Informe o nome e a delegacia do preso.'
      ],
      tornozeleira: [
        '📡 Tornozeleira com problema?',
        'O STJ protege o monitorado de descarga de bateria (HC 978.495/MG). O Dr. Lucas Semim entra com defesa imediata. Descreva o que aconteceu.'
      ],
      saidinha: [
        '📋 Dúvida sobre saidinha temporária?',
        'As regras mudaram com a Lei 14.843/2024 e o TJMG julgou em 2025. O Dr. Lucas Semim analisa seu caso agora. Digite sua dúvida.'
      ],
      preventiva: [
        '🔒 Prisão preventiva pode ser revertida.',
        'Sem os requisitos do art. 312 do CPP, a prisão é ilegal. O Dr. Lucas Semim impugna via HC. Informe os dados do caso.'
      ],
      emergencia: [
        '🚨 EMERGÊNCIA CRIMINAL — PLANTÃO 24H.',
        'O Dr. Lucas Semim está disponível agora. Descreva a situação para atendimento imediato.'
      ],
      cidade: [
        '📍 Atendimento na sua região.',
        'O Dr. Lucas Semim atende Sabará, BH e toda a Grande BH com plantão 24h. Descreva o que aconteceu.'
      ],
      canivete: [
        '🔪 Dúvida sobre porte de canivete ou faca?',
        'O STJ diferencia ferramenta de arma branca. O Dr. Lucas Semim pode analisar se houve ilegalidade na abordagem. Digite sua dúvida.'
      ],
      fato_atipico: [
        '⚖️ Fato atípico no seu processo?',
        'Se a conduta não é crime, o juiz deve absolver ou o advogado pode pedir trancamento via HC. Descreva a situação.'
      ],
      maria_penha: [
        '🛡️ Dúvida sobre a Lei Maria da Penha?',
        'Maria da Penha não admite fiança, mas falsas acusações geram responsabilidade criminal. O Dr. Lucas Semim atua nessa defesa. Descreva o caso.'
      ],
      prescricao: [
        '⏳ Calculando a prescrição do seu caso?',
        'O Dr. Lucas Semim pode verificar se o processo já prescreveu. Informe o crime e a data do fato.'
      ],
      pix_fraude: [
        '💳 Problema com Pix ou conta bloqueada?',
        'Emprestar conta para Pix pode ser crime. O Dr. Lucas Semim analisa se há culpa e como defender. Descreva o que aconteceu.'
      ],
      progressao: [
        '📊 Dúvida sobre progressão de regime?',
        'O Dr. Lucas Semim pode verificar se seu familiar tem direito à progressão com base nos dados do SEEU. Informe o regime atual.'
      ],
      lei_seca: [
        '🚗 Problema na blitz da Lei Seca?',
        'Auto de infração da Lei Seca pode ter falhas. O Dr. Lucas Semim analisa gratuitamente. Descreva o que aconteceu na blitz.'
      ],
      default: [
        '⚖️ Plantão Jurídico 24h.',
        'O tempo é fundamental na defesa criminal. Descreva sua situação para iniciarmos o atendimento imediato.'
      ]
    };
    return msgs[context] || msgs.default;
  },

  sendToWhatsApp(text) {
    const context = this.state.context;
    const contextLabel = {
      flagrante: '🚨 FLAGRANTE',
      habeas: '⚖️ HABEAS CORPUS',
      trafico: '🔴 TRÁFICO',
      audiencia: '⏱️ AUDIÊNCIA DE CUSTÓDIA',
      emergencia: '🚨 URGÊNCIA',
      default: '💬 CHAT DO SITE'
    }[context] || '💬 CHAT DO SITE';

    const msg = `*${contextLabel}*\n\n${text}`;
    const url = `${this.config.waBase}${this.config.whatsapp}?text=${encodeURIComponent(msg)}`;

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.trackEvent('chat_send', { context });
    this.closeChat();
  },

  initScrollTrigger() {
    if (this.state.triggered || this.state.userClosed) return;

    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:45%;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(sentinel);

    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.state.triggered) {
        this.state.triggered = true;
        obs.disconnect();
        sentinel.remove();

        const t = setTimeout(() => {
          if (!this.state.isOpen && !this.state.userClosed) {
            this.openChat('scroll_trigger');
          }
        }, 1500);
        this.state.timers.push(t);
      }
    }, { threshold: 0 });

    obs.observe(sentinel);
  },

  initExitIntent() {
    if (window.matchMedia('(max-width: 768px)').matches) return;

    const handler = (e) => {
      if (e.clientY <= 5 && !this.state.triggered && !this.state.isOpen && !this.state.userClosed) {
        this.state.triggered = true;
        this.openChat('exit_intent');
        document.removeEventListener('mousemove', handler);
      }
    };
    document.addEventListener('mousemove', handler);
  },

  coordenateWithMobileBar() {
    if (!this.state.wrapper) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const safeArea = 'env(safe-area-inset-bottom, 0px)';

    // 1) Barra fixa inferior full-width (CTA mobile) — cada página usa um seletor diferente
    const barSelectors = ['#mobile-sticky-bar', '#stickyMobileCta', '.sticky-mobile-cta', '.sticky-cta-urgency', '.sticky-mobile-bar'];
    let barH = 0;
    barSelectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el && el.offsetHeight > 0 && getComputedStyle(el).display !== 'none') {
        barH = Math.max(barH, el.offsetHeight);
      }
    });

    // 2) Qualquer outro botão flutuante fixo no canto inferior direito (nome de classe varia por página:
    //    .whatsapp-floating, .float-emergencia-sa, etc.) — detecta por posição, não por nome
    let floatClearance = 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    document.querySelectorAll('body > a, body > div, body > button').forEach(el => {
      if (el === this.state.wrapper || el.id === 'elite-chat-wrapper') return;
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' || cs.display === 'none' || cs.visibility === 'hidden') return;
      if (el.offsetWidth === 0 || el.offsetHeight === 0) return;

      const rect = el.getBoundingClientRect();
      const nearRight = (vw - rect.right) < 110;
      const nearBottom = (vh - rect.bottom) < 140;
      const isFullWidthBar = rect.width > vw * 0.6; // já tratado no passo 1, ignora aqui

      if (nearRight && nearBottom && !isFullWidthBar) {
        floatClearance = Math.max(floatClearance, (vh - rect.top) + 14);
      }
    });

    const base = isMobile ? 16 : 25;
    const bottomPx = Math.max(base, barH > 0 ? barH + 12 : 0, floatClearance);

    this.state.wrapper.style.bottom = isMobile
      ? `calc(${bottomPx}px + ${safeArea})`
      : `${bottomPx}px`;

    if (!this.state.mutationObserverActive) {
      const obs = new MutationObserver(() => this.coordenateWithMobileBar());
      obs.observe(document.body, { childList: true });
      this.state.mutationObserverActive = true;

      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.coordenateWithMobileBar(), 150);
      });
    }
  },

  trackEvent(action, extra = {}) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', `chat_elite_${action}`.slice(0, 40), {
        event_category: 'Chat_Elite',
        event_label: action.slice(0, 100),
        context_pagina: this.state.context.slice(0, 100),
        pagina_origem: window.location.pathname.slice(0, 100),
        urgency_mode: this.getUrgencyMode().slice(0, 100),
        ai_enabled: this.config.ai.enabled,
        ai_replies_count: this.state.aiRepliesCount,
        campanha: new URLSearchParams(window.location.search).get('utm_campaign') || 'organico',
        ...extra
      });
    } catch { }
  },

  async askAI(userMessage) {
    const ctx = this.state.context;

    if (this.config.ai.disableOnContexts.includes(ctx)) {
      this.sendToWhatsApp(userMessage);
      return;
    }

    if (this.state.aiRepliesCount >= this.config.ai.maxAiReplies) {
      await this.typingThenMessage([
        '📋 Tenho o essencial sobre o seu caso. Para uma análise completa e personalizada, o Dr. Lucas Semim está disponível agora pelo WhatsApp.',
        'Vou enviar sua situação diretamente para ele com o resumo da nossa conversa.'
      ]);
      const historico = this.state.conversationHistory
        .map(m => `${m.role === 'user' ? 'Cliente' : 'Assistente'}: ${m.content}`)
        .join('\n');
      this.sendToWhatsApp(`Conversa via Chat:\n\n${historico}\n\nÚltima mensagem: ${userMessage}`);
      return;
    }

    this.state.aiMode = true;
    await this.showAIThinking();

    try {
      const systemPrompt = this.buildSystemPrompt(ctx);
      this.state.conversationHistory.push({ role: 'user', content: userMessage });

      const response = await fetch(this.config.ai.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.ai.model,
          max_tokens: this.config.ai.maxTokens,
          system: systemPrompt,
          messages: this.state.conversationHistory
        }),
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiReply = data.content?.[0]?.text || '';

      if (!aiReply) throw new Error('Resposta vazia da IA');

      this.state.conversationHistory.push({ role: 'assistant', content: aiReply });
      this.state.aiRepliesCount++;

      this.removeAIThinking();
      await this.typingThenMessage([aiReply]);

      if (this.state.aiRepliesCount >= this.config.ai.maxAiReplies) {
        await new Promise(r => setTimeout(r, 600));
        this.showWhatsAppCTA();
      }

      this.trackEvent('ai_reply', { context: ctx, reply_count: this.state.aiRepliesCount });

    } catch (err) {
      // Remove a pergunta do usuario que ficou sem resposta: sem isto ela era
      // reenviada na proxima chamada e aparecia duplicada no resumo do WhatsApp.
      const ultima = this.state.conversationHistory[this.state.conversationHistory.length - 1];
      if (ultima && ultima.role === 'user' && ultima.content === userMessage) {
        this.state.conversationHistory.pop();
      }
      this.removeAIThinking();
      await this.typingThenMessage([
        'Entendi a sua dúvida. Para uma análise precisa e imediata do seu caso, o Dr. Lucas Semim está de plantão agora pelo WhatsApp.'
      ]);
      this.showWhatsAppCTA();
    }

    this.state.aiMode = false;
  },

  buildSystemPrompt(context) {
    const base = `Você é o assistente virtual do Dr. Lucas Renan Semim, advogado criminalista em Sabará/BH com OAB/MG 222.539 e plantão 24h.

REGRAS ABSOLUTAS:
1. Responda APENAS sobre direito penal brasileiro — nunca sobre outros ramos do direito
2. Seja objetivo e claro — máximo 3 parágrafos curtos
3. NUNCA dê conselho jurídico definitivo — sempre ressalte que cada caso é único
4. Ao final de cada resposta, mencione naturalmente que o Dr. Lucas pode analisar o caso específico
5. Use linguagem simples, sem "juridiquês"
6. Baseie-se no CPP, CP, STJ e STF atualizados
7. Nunca invente leis ou jurisprudências`;

    const contextual = {
      flagrante: `\n\nCONTEXTO: O usuário está em uma situação de FLAGRANTE DELITO. Seja urgente e direto. Informe sobre o direito à audiência de custódia em 24h, ao advogado imediato e ao relaxamento da prisão ilegal.`,
      habeas: `\n\nCONTEXTO: O usuário busca informações sobre HABEAS CORPUS. Explique quando cabe HC, os fundamentos principais (excesso de prazo, ilegalidade da preventiva) e que HC pode ser impetrado a qualquer momento.`,
      trafico: `\n\nCONTEXTO: O usuário tem dúvidas sobre TRÁFICO DE DROGAS. Explique sobre tráfico privilegiado (art. 33 §4º), diferenciação uso/tráfico, e que o STF decidiu que tráfico privilegiado não é hediondo.`,
      audiencia: `\n\nCONTEXTO: Audiência de custódia. Explique que deve ocorrer em 24h, o que o juiz decide (soltura, liberdade provisória ou preventiva), e a importância do advogado estar presente.`,
      tornozeleira: `\n\nCONTEXTO: Problema com tornozeleira eletrônica. Informe sobre o HC 978.495/MG do STJ — descarga de bateria sem culpa não gera revogação automática. Explique que defesa imediata é essencial.`,
      saidinha: `\n\nCONTEXTO: Dúvida sobre saída temporária. Mencione o art. 122 da LEP, os requisitos, e que a Lei 14.843/2024 não pode retroagir para crimes anteriores.`,
      preventiva: `\n\nCONTEXTO: Prisão preventiva. Explique os requisitos do art. 312 do CPP, que fundamentação genérica é ilegal, e que a revisão é obrigatória a cada 90 dias (Pacote Anticrime).`,
      canivete: `\n\nCONTEXTO: Dúvida sobre porte de canivete/faca. Explique que o STJ diferencia ferramenta de arma branca — contexto e intenção de uso são determinantes. Porte utilitário geralmente é fato atípico.`,
      fato_atipico: `\n\nCONTEXTO: Fato atípico. Explique que conduta que não se enquadra em tipo penal não é crime, e que o advogado pode pedir trancamento via HC por falta de justa causa.`,
      maria_penha: `\n\nCONTEXTO: Lei Maria da Penha. Informe que crimes de violência doméstica não admitem fiança (art. 24-A), mas que falsas acusações geram responsabilidade criminal e civil.`,
      default: `\n\nCONTEXTO: Dúvida geral sobre direito penal. Identifique o tema da pergunta e responda de forma objetiva com base no CPP, CP e jurisprudência do STJ/STF.`
    };

    return base + (contextual[context] || contextual.default);
  },

  async showAIThinking() {
    const body = this.state.chatBody;
    const thinking = document.createElement('div');
    thinking.id = 'ai-thinking';
    thinking.className = 'chat-ai-thinking';

    const icon = document.createElement('i');
    icon.className = 'fas fa-brain';
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = 'Analisando seu caso...';

    thinking.appendChild(icon);
    thinking.appendChild(text);
    body.appendChild(thinking);
    body.scrollTop = body.scrollHeight;
  },

  removeAIThinking() {
    document.getElementById('ai-thinking')?.remove();
  },

  showWhatsAppCTA() {
    if (document.querySelector('.chat-wa-cta')) return;

    const body = this.state.chatBody;

    const cta = document.createElement('button');
    cta.className = 'chat-wa-cta';
    cta.setAttribute('aria-label', 'Falar com Dr. Lucas Semim pelo WhatsApp');

    const icon = document.createElement('i');
    icon.className = 'fab fa-whatsapp';
    icon.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.textContent = 'Falar com Dr. Lucas pelo WhatsApp';

    cta.appendChild(icon);
    cta.appendChild(text);
    body.appendChild(cta);
    body.scrollTop = body.scrollHeight;

    cta.addEventListener('click', () => {
      const resumo = this.state.conversationHistory
        .filter(m => m.role === 'user')
        .map(m => m.content)
        .join(' | ');
      this.sendToWhatsApp(`Dúvida via chat: ${resumo}`);
    });
  },

  buildQuickQuestions(context) {
    const questions = {
      tornozeleira: [
        'O que fazer quando a tornozeleira descarrega?',
        'Posso ser preso por descarga de bateria?',
        'Quanto tempo tenho para resolver o problema?'
      ],
      saidinha: [
        'Meu familiar tem direito à saidinha 2026?',
        'A nova lei afeta quem já cumpre pena?',
        'O que fazer se a saidinha foi negada?'
      ],
      preventiva: [
        'Como revogar prisão preventiva?',
        'A preventiva tem prazo máximo?',
        'O que é excesso de prazo na preventiva?'
      ],
      canivete: [
        'É crime andar com canivete?',
        'Fui autuado com faca no carro — o que fazer?',
        'Canivete utilitário é arma branca?'
      ],
      fato_atipico: [
        'O que significa fato atípico no meu processo?',
        'Posso pedir trancamento por atipicidade?',
        'Minha conduta é realmente um crime?'
      ],
      maria_penha: [
        'Maria da Penha tem direito a fiança?',
        'Como me defender de falsa acusação?',
        'O que é medida protetiva e como contestar?'
      ],
      prescricao: [
        'Como calcular a prescrição penal?',
        'Meu processo já prescreveu?',
        'Prescrição pode ser reconhecida a qualquer tempo?'
      ],
      default: [
        'Fui preso em flagrante — o que fazer?',
        'Como funciona a audiência de custódia?',
        'Tenho direito a advogado na delegacia?'
      ]
    };

    return questions[context] || questions.default;
  },

  showQuickQuestions() {
    if (this.state.aiRepliesCount > 0) return;
    const ctx = this.state.context;
    const qs = this.buildQuickQuestions(ctx);
    const body = this.state.chatBody;

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-quick-questions';

    const label = document.createElement('p');
    label.className = 'chat-quick-label';
    label.textContent = 'Perguntas frequentes:';
    wrapper.appendChild(label);

    qs.forEach(q => {
      const btn = document.createElement('button');
      btn.className = 'chat-quick-btn';
      btn.textContent = q;
      btn.addEventListener('click', async () => {
        wrapper.remove();
        
        const userMsg = document.createElement('div');
        userMsg.className = 'chat-msg-user';
        userMsg.textContent = q;
        body.appendChild(userMsg);
        body.scrollTop = body.scrollHeight;
        
        this.trackUserQuestion(q);
        await this.askAI(q);
      });
      wrapper.appendChild(btn);
    });

    body.appendChild(wrapper);
    body.scrollTop = body.scrollHeight;
  },

  trackUserQuestion(question) {
    try {
      if (typeof gtag !== 'function') return;
      gtag('event', 'chat_user_question', {
        question_preview: question.slice(0, 100),
        context: this.state.context.slice(0, 100),
        page_path: window.location.pathname.slice(0, 100)
      });
    } catch { }
  }
};

// Inicialização resiliente: como este script pode ser injetado dinamicamente
// (depois do parse do HTML), o evento DOMContentLoaded pode já ter disparado.
// window.civelReady executa na hora se o DOM já estiver pronto.
if (typeof window.civelReady === 'function') {
  window.civelReady(() => window.ChatElite.init());
} else {
  document.addEventListener('DOMContentLoaded', () => window.ChatElite.init());
}