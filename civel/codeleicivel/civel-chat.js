/* ===========================================================================
   civel-chat.js — Chat do Dr. Lucas Semim (Advocacia Cível)
   Versão cível do ChatElite do site criminal: mesma ideia (balão dourado,
   triagem guiada + IA + WhatsApp), com visual preto/dourado/petróleo, ícones
   de linha (SVG) e conteúdo de direito civil.
   - IA: usa o proxy já existente em lucassemim.adv.br/api/claude-chat.php
     (a chave da Anthropic fica só no servidor).
   - Não coleta dado sensível: o próprio chat pede para não enviar CPF/documentos.
   - Se a IA falhar, cai direto no WhatsApp com o resumo da conversa.
   =========================================================================== */
(function () {
  'use strict';
  if (window.ChatCivel) return;

  var CFG = {
    whatsapp: '5531989420094',
    avatar: '/img/lucasrenansemimeadvogado.jpeg',
    endpoint: 'https://lucassemim.adv.br/api/claude-chat.php',
    model: 'claude-sonnet-5',
    central: '/central-do-caso-civel.html',
    maxAiReplies: 4,
    teaserDelayMs: 14000,
    skipPages: /^\/?(painel-|cadastro-|sala-reuniao|central-do-caso-civel|central-documentos|google|offline)/i,
    sk: 'semim_civel_chat_v1'
  };

  /* ---------- ícones (linha, 24x24) ---------- */
  var ICON = {
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/><path d="M8 11h.01M12 11h.01M16 11h.01"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    wa: '<path d="M3 21l1.65-4.9A9 9 0 1 1 8 19.4Z"/><path d="M9 10c0 3 2.5 5.5 5.5 5.5l1.2-1.4-2-1-.9.8a4 4 0 0 1-2-2l.8-.9-1-2Z"/>',
    folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M12 10v6M9 13h6"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z"/>'
  };
  function svg(name, cls) {
    return '<svg class="' + (cls || 'cc-i') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + ICON[name] + '</svg>';
  }

  /* ---------- assuntos: detecção pela página + textos ---------- */
  var T = {
    saude: {
      assunto: 'saude', nome: 'plano de saúde',
      msg: ['Plano de saúde negou ou reajustou demais?', 'Negativa de cobertura, reajuste abusivo e cancelamento costumam ser discutidos na Justiça. Conte o que aconteceu e eu oriento o próximo passo.'],
      qs: ['O plano negou um tratamento. E agora?', 'Reajuste de 40% pode ser abusivo?', 'Cancelaram meu plano sem aviso']
    },
    rmc: {
      assunto: 'rmc', nome: 'cartão RMC / consignado',
      msg: ['Desconto no benefício do INSS que você não reconhece?', 'Cartão RMC e consignado não contratados são um problema comum entre aposentados. Conte o que aparece no extrato.'],
      qs: ['O que é cartão RMC?', 'Nunca contratei, o que fazer?', 'Posso pedir o dinheiro de volta?']
    },
    golpe: {
      assunto: 'golpe', nome: 'golpe do Pix',
      msg: ['Caiu em golpe ou fez um Pix errado?', 'As primeiras horas importam. Me conte o que houve e o banco envolvido; eu explico os caminhos possíveis.'],
      qs: ['Fiz um Pix para golpista, e agora?', 'O banco é obrigado a devolver?', 'Quais provas guardar?']
    },
    banco: {
      assunto: 'banco', nome: 'banco e dívidas',
      msg: ['Problema com banco, juros ou nome negativado?', 'Cobrança indevida, juros acima do pactuado e negativação sem aviso podem ser questionados. Descreva a situação.'],
      qs: ['Meu nome foi negativado indevidamente', 'Como saber se os juros são abusivos?', 'Estou superendividado, tem saída?']
    },
    seguro: {
      assunto: 'seguro', nome: 'seguro negado',
      msg: ['A seguradora recusou o pagamento?', 'Negativa de seguro de vida, auto ou DPVAT pode ser contestada. Conte qual seguro e o motivo alegado.'],
      qs: ['A seguradora negou o seguro de vida', 'Prazo para cobrar o seguro?', 'O que é DPVAT hoje?']
    },
    acidente: {
      assunto: 'acidente', nome: 'acidente de trânsito',
      msg: ['Sofreu ou perdeu alguém em acidente?', 'Lesão, morte e danos materiais podem gerar direito a indenização. Conte quando foi e se houve boletim de ocorrência.'],
      qs: ['Qual o prazo para pedir indenização?', 'Preciso de boletim de ocorrência?', 'Quem responde: motorista ou seguradora?']
    },
    'erro-medico': {
      assunto: 'erro-medico', nome: 'erro médico',
      msg: ['Suspeita de erro médico?', 'Cada caso exige análise de prontuário e perícia. Me conte o que aconteceu e onde foi o atendimento.'],
      qs: ['Como saber se foi erro médico?', 'Quais documentos reunir?', 'Qual o prazo para agir?']
    },
    bets: {
      assunto: 'bets', nome: 'bets e apostas',
      msg: ['Problema com site de apostas?', 'Saque bloqueado, conta zerada ou perdas ligadas ao vício em jogo são discutidos na Justiça. Conte o que ocorreu.'],
      qs: ['Bet bloqueou meu saque', 'É possível reaver o que perdi?', 'Quais provas guardar?']
    },
    usucapiao: {
      assunto: 'usucapiao', nome: 'usucapião',
      msg: ['Mora em imóvel sem escritura?', 'A usucapião regulariza quem ocupa o imóvel há anos, inclusive no cartório. Diga há quanto tempo mora e onde fica.'],
      qs: ['Quanto tempo de posse eu preciso?', 'Dá para fazer no cartório?', 'Quais documentos preciso?']
    },
    familia: {
      assunto: 'familia', nome: 'família e inventário',
      msg: ['Dúvida sobre herança ou partilha?', 'Inventário, divórcio e pensão têm prazos e custos diferentes. Descreva a situação da sua família.'],
      qs: ['Dá para fazer inventário no cartório?', 'Qual o prazo para abrir o inventário?', 'Como funciona a partilha?']
    },
    contratos: {
      assunto: 'contratos', nome: 'contratos e cobranças',
      msg: ['Contrato descumprido ou dívida a receber?', 'Execução, cobrança e rescisão têm caminhos específicos. Conte o que foi combinado e o que aconteceu.'],
      qs: ['Contrato verbal vale?', 'Como cobrar quem não pagou?', 'Quais provas eu preciso?']
    },
    patrimonio: {
      assunto: 'contratos', nome: 'proteção patrimonial',
      msg: ['Quer proteger o patrimônio da família?', 'Holding familiar e planejamento sucessório exigem análise individual. Conte o que você tem em mente.'],
      qs: ['Holding familiar vale a pena?', 'Como evitar briga de herança?', 'Quanto custa estruturar?']
    },
    local: {
      assunto: 'outro', nome: 'sua região',
      msg: ['Atendimento em Sabará e Grande BH.', 'Conte o que aconteceu: eu dou a orientação inicial e indico o melhor caminho para o seu caso.'],
      qs: ['Quero entender meus direitos', 'Preciso de uma análise do meu caso', 'Como funcionam os honorários?']
    },
    default: {
      assunto: 'outro', nome: 'seu caso',
      msg: ['Olá! Sou o assistente do Dr. Lucas Semim.', 'Conte em poucas palavras o que aconteceu. Eu dou uma orientação geral e, se fizer sentido, encaminho seu caso para análise.'],
      qs: ['O banco cobrou algo indevido', 'O plano de saúde negou um tratamento', 'Sofri um acidente de trânsito']
    }
  };

  var MAPA = [
    ['rmc', ['rmc', 'consignado']],
    ['golpe', ['golpe', 'pix']],
    ['bets', ['bets', 'aposta', 'ludopatia']],
    ['saude', ['plano-saude', 'plano-de-saude', 'saude', 'reajuste']],
    ['erro-medico', ['erro-medico', 'erro medico']],
    ['acidente', ['acidente', 'dpvat']],
    ['seguro', ['seguro', 'seguradora', 'sinistro']],
    ['banco', ['banco', 'bancario', 'juros', 'superendivid', 'master']],
    ['usucapiao', ['usucapiao']],
    ['familia', ['familia', 'inventario', 'itcmd']],
    ['patrimonio', ['blindagem', 'holding']],
    ['contratos', ['contrato', 'execucao', 'cobranca']],
    ['local', ['sabara', 'belohorizonte']]
  ];

  var S = { open: false, ctx: 'default', aiCount: 0, hist: [], busy: false, shown: false, closed: false, teased: false, el: {} };

  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function detect() {
    var p = norm(location.pathname.replace(/\.html$/, ''));
    if (p === '/' || p === '' || p === '/index') { S.ctx = 'default'; return; }
    for (var i = 0; i < MAPA.length; i++) {
      for (var j = 0; j < MAPA[i][1].length; j++) {
        if (p.indexOf(MAPA[i][1][j]) !== -1) { S.ctx = MAPA[i][0]; return; }
      }
    }
    S.ctx = 'default';
  }
  function topic() { return T[S.ctx] || T.default; }

  function track(ev, x) {
    try {
      window.dataLayer = window.dataLayer || [];
      var o = { event: 'chat_civel_' + ev, chat_ctx: S.ctx, page: location.pathname };
      for (var k in (x || {})) o[k] = x[k];
      window.dataLayer.push(o);
    } catch (e) {}
  }
  function store(get, v) {
    try {
      if (get) return JSON.parse(sessionStorage.getItem(CFG.sk) || '{}');
      sessionStorage.setItem(CFG.sk, JSON.stringify(v));
    } catch (e) {}
    return {};
  }

  /* ---------- estilos ---------- */
  function styles() {
    if (document.getElementById('cc-styles')) return;
    var css = [
      '#cc-root{--cc-gold:#d4af37;--cc-gold-hi:#f6e7a6;--cc-teal:#2aa6a0;--cc-teal-hi:#8ae8dd;--cc-bg:#0b0b0d;--cc-panel:#121215;--cc-line:rgba(212,175,55,.26);--cc-txt:#ece8dc;--cc-mut:#a6a196;',
      'position:fixed;right:22px;bottom:22px;z-index:99997;font-family:"Inter","Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:var(--cc-txt);-webkit-font-smoothing:antialiased}',
      '#cc-root *{box-sizing:border-box}',
      '#cc-root[hidden]{display:none!important}',
      '.cc-i{width:1.25em;height:1.25em;flex:none}',

      /* balão */
      '#cc-btn{position:relative;display:flex;align-items:center;gap:10px;height:58px;min-width:58px;padding:0 17px;border-radius:29px;border:1px solid rgba(255,255,255,.18);cursor:pointer;color:#14110a;',
      'background:linear-gradient(135deg,#f6e7a6 0%,#d4af37 52%,#b8901f 100%);box-shadow:0 12px 34px rgba(212,175,55,.38),0 2px 0 rgba(255,255,255,.35) inset;',
      'transition:transform .25s cubic-bezier(.2,.7,.2,1),box-shadow .25s;-webkit-tap-highlight-color:transparent;font-family:inherit;font-weight:600;font-size:.92rem;line-height:1;letter-spacing:.2px}',
      '#cc-btn:hover{transform:translateY(-3px);box-shadow:0 18px 42px rgba(212,175,55,.52),0 2px 0 rgba(255,255,255,.35) inset}',
      '#cc-btn:focus-visible{outline:2px solid var(--cc-teal-hi);outline-offset:3px}',
      '#cc-btn .cc-i{width:26px;height:26px;stroke-width:1.6}',
      '#cc-btn .cc-lbl{white-space:nowrap}',
      '#cc-btn::before{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;box-shadow:0 0 0 0 rgba(212,175,55,.5);animation:ccRing 3.2s ease-out infinite}',
      '@keyframes ccRing{0%{box-shadow:0 0 0 0 rgba(212,175,55,.5)}70%,100%{box-shadow:0 0 0 14px rgba(212,175,55,0)}}',
      '#cc-root.cc-open #cc-btn .cc-lbl{display:none}',
      '#cc-root.cc-open #cc-btn{padding:0;width:58px;justify-content:center}',
      '#cc-root.cc-open #cc-btn::before{animation:none}',

      /* teaser */
      '#cc-teaser{position:absolute;right:0;bottom:72px;width:268px;padding:14px 38px 14px 16px;border-radius:16px 16px 4px 16px;background:var(--cc-panel);border:1px solid var(--cc-line);',
      'box-shadow:0 18px 44px rgba(0,0,0,.55);font-size:.9rem;line-height:1.45;cursor:pointer;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .35s,transform .35s}',
      '#cc-teaser.cc-on{opacity:1;transform:none;pointer-events:auto}',
      '#cc-teaser b{display:block;color:var(--cc-gold-hi);font-weight:600;margin-bottom:2px}',
      '#cc-teaser span{color:var(--cc-mut)}',
      '#cc-teaser button{position:absolute;top:8px;right:8px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:var(--cc-mut);cursor:pointer;border-radius:50%}',
      '#cc-teaser button:hover{color:#fff;background:rgba(255,255,255,.08)}',
      '#cc-teaser .cc-i{width:15px;height:15px}',

      /* janela */
      '#cc-win{position:absolute;right:0;bottom:74px;width:372px;max-width:calc(100vw - 28px);height:min(560px,calc(100vh - 130px));display:flex;flex-direction:column;overflow:hidden;',
      'background:radial-gradient(120% 60% at 100% 0%,rgba(42,166,160,.12),transparent 60%),var(--cc-bg);border:1px solid var(--cc-line);border-radius:20px;',
      'box-shadow:0 30px 80px rgba(0,0,0,.7),0 0 0 1px rgba(0,0,0,.6);opacity:0;transform:translateY(14px) scale(.97);transform-origin:bottom right;pointer-events:none;',
      'transition:opacity .28s cubic-bezier(.2,.7,.2,1),transform .28s cubic-bezier(.2,.7,.2,1)}',
      '#cc-root.cc-open #cc-win{opacity:1;transform:none;pointer-events:auto}',
      '#cc-win::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--cc-teal),var(--cc-gold-hi),var(--cc-gold))}',

      '.cc-head{display:flex;align-items:center;gap:12px;padding:16px 16px 14px;border-bottom:1px solid rgba(255,255,255,.07)}',
      '.cc-av{position:relative;flex:none;width:44px;height:44px}',
      '.cc-av img,.cc-av b{width:44px;height:44px;border-radius:50%;object-fit:cover;display:flex;align-items:center;justify-content:center;border:1.5px solid var(--cc-gold);background:#1a1a1d;color:var(--cc-gold-hi);font-family:inherit;font-weight:600;font-size:.95rem}',
      '.cc-av i{position:absolute;right:0;bottom:1px;width:11px;height:11px;border-radius:50%;background:#34d399;border:2px solid var(--cc-bg);box-shadow:0 0 8px rgba(52,211,153,.7)}',
      '.cc-who{flex:1;min-width:0}',
      '.cc-who strong{display:block;font:600 1.02rem/1.2 "Playfair Display",Georgia,serif;color:#fff;letter-spacing:.2px}',
      '.cc-who small{display:block;margin-top:3px;color:var(--cc-mut);font-size:.74rem;letter-spacing:.3px}',
      '.cc-x{flex:none;width:34px;height:34px;display:flex;align-items:center;justify-content:center;border:0;border-radius:50%;background:transparent;color:var(--cc-mut);cursor:pointer;transition:background .2s,color .2s}',
      '.cc-x:hover{background:rgba(255,255,255,.08);color:#fff}',
      '.cc-x:focus-visible{outline:2px solid var(--cc-teal-hi)}',

      '.cc-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:16px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth}',
      '.cc-body::-webkit-scrollbar{width:6px}.cc-body::-webkit-scrollbar-thumb{background:rgba(212,175,55,.25);border-radius:3px}',
      '.cc-m{max-width:88%;padding:11px 14px;font-size:.92rem;line-height:1.5;word-wrap:break-word;white-space:pre-wrap;animation:ccIn .3s cubic-bezier(.2,.7,.2,1)}',
      '@keyframes ccIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
      '.cc-m.b{align-self:flex-start;background:var(--cc-panel);border:1px solid rgba(255,255,255,.07);border-radius:4px 16px 16px 16px;color:var(--cc-txt)}',
      '.cc-m.b.lead{color:var(--cc-gold-hi);font-weight:600}',
      '.cc-m.u{align-self:flex-end;background:linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.1));border:1px solid var(--cc-line);border-radius:16px 4px 16px 16px;color:#fff}',
      '.cc-typing{align-self:flex-start;display:flex;gap:5px;padding:14px 16px;background:var(--cc-panel);border:1px solid rgba(255,255,255,.07);border-radius:4px 16px 16px 16px}',
      '.cc-typing span{width:7px;height:7px;border-radius:50%;background:var(--cc-gold);animation:ccDot 1.2s infinite}',
      '.cc-typing span:nth-child(2){animation-delay:.18s}.cc-typing span:nth-child(3){animation-delay:.36s}',
      '@keyframes ccDot{0%,80%,100%{transform:scale(.55);opacity:.35}40%{transform:scale(1);opacity:1}}',

      '.cc-chips{display:flex;flex-direction:column;gap:7px;margin-top:2px;animation:ccIn .35s}',
      '.cc-chips p{margin:0 0 1px;color:var(--cc-mut);font-size:.72rem;letter-spacing:.6px;text-transform:uppercase}',
      '.cc-chip{text-align:left;padding:10px 13px;border-radius:12px;border:1px solid var(--cc-line);background:rgba(212,175,55,.06);color:var(--cc-txt);font:inherit;font-size:.86rem;cursor:pointer;transition:background .2s,border-color .2s,transform .2s}',
      '.cc-chip:hover{background:rgba(42,166,160,.12);border-color:rgba(42,166,160,.5);transform:translateX(3px)}',
      '.cc-chip:focus-visible{outline:2px solid var(--cc-teal-hi)}',

      '.cc-acts{display:flex;flex-direction:column;gap:8px;margin-top:4px;animation:ccIn .35s}',
      '.cc-act{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;border:0;font:inherit;font-size:.9rem;font-weight:600;cursor:pointer;text-decoration:none;text-align:left;transition:transform .2s,box-shadow .2s}',
      '.cc-act:hover{transform:translateY(-2px)}',
      '.cc-act.gold{color:#14110a;background:linear-gradient(135deg,#f6e7a6,#d4af37 55%,#b8901f);box-shadow:0 10px 26px rgba(212,175,55,.3)}',
      '.cc-act.wa{color:#fff;background:linear-gradient(135deg,#0f8a63,#1fb57a);box-shadow:0 10px 26px rgba(31,181,122,.25)}',
      '.cc-act small{display:block;font-weight:400;opacity:.8;font-size:.74rem;margin-top:1px}',
      '.cc-act .cc-i{width:22px;height:22px}',

      '.cc-foot{padding:12px 14px 10px;border-top:1px solid rgba(255,255,255,.07);background:rgba(0,0,0,.25)}',
      '.cc-form{display:flex;align-items:flex-end;gap:8px;padding:5px 5px 5px 14px;border-radius:24px;background:#0e0e11;border:1px solid rgba(255,255,255,.12);transition:border-color .2s}',
      '.cc-form:focus-within{border-color:var(--cc-gold)}',
      '.cc-in{flex:1;min-width:0;max-height:96px;padding:9px 0;border:0;outline:0;resize:none;background:transparent;color:#fff;font:inherit;font-size:16px;line-height:1.35}',
      '.cc-in::placeholder{color:#6f6b62}',
      '.cc-go{flex:none;width:38px;height:38px;border:0;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#14110a;background:linear-gradient(135deg,#f6e7a6,#d4af37);cursor:pointer;transition:transform .2s,opacity .2s}',
      '.cc-go:hover{transform:scale(1.08)}.cc-go:disabled{opacity:.45;cursor:default;transform:none}',
      '.cc-go .cc-i{width:18px;height:18px}',
      '.cc-note{display:flex;align-items:center;gap:6px;margin:9px 2px 0;color:#7d786d;font-size:.68rem;line-height:1.35}',
      '.cc-note .cc-i{width:12px;height:12px;flex:none;color:var(--cc-teal)}',

      '@media(max-width:768px){',
      '#cc-root{right:14px;bottom:14px}',
      '#cc-btn{height:54px;min-width:54px;padding:0 15px}',
      '#cc-btn .cc-lbl{display:none}',
      '#cc-btn{padding:0;width:54px;justify-content:center}',
      '#cc-win{position:fixed;left:10px;right:10px;bottom:10px;width:auto;max-width:none;height:min(78vh,620px)}',
      '#cc-teaser{width:min(268px,calc(100vw - 92px));bottom:66px}',
      '#cc-root.cc-open #cc-btn{display:none}',
      '}',
      '@media(prefers-reduced-motion:reduce){#cc-btn::before,.cc-typing span{animation:none}.cc-m,.cc-chips,.cc-acts,#cc-win,#cc-teaser{transition:none;animation:none}}'
    ].join('\n');
    var st = document.createElement('style');
    st.id = 'cc-styles';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------- montagem ---------- */
  function h(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  function build() {
    if (document.getElementById('cc-root')) return;
    var t = topic();
    var root = h(
      '<div id="cc-root" role="region" aria-label="Chat com o Dr. Lucas Semim">' +
      '<div id="cc-teaser" role="status"><b>Dúvida sobre o seu caso?</b><span>Responda em 1 minuto e receba uma orientação inicial.</span>' +
      '<button type="button" aria-label="Dispensar aviso">' + svg('close') + '</button></div>' +
      '<div id="cc-win" role="dialog" aria-label="Chat com o Dr. Lucas Semim" aria-modal="false">' +
      '<div class="cc-head"><div class="cc-av"><img src="' + CFG.avatar + '" alt="Dr. Lucas Semim" width="44" height="44"><i></i></div>' +
      '<div class="cc-who"><strong>Dr. Lucas Semim</strong><small>Advocacia Cível · Assistente virtual</small></div>' +
      '<button type="button" class="cc-x" aria-label="Fechar chat">' + svg('close') + '</button></div>' +
      '<div class="cc-body" aria-live="polite"></div>' +
      '<div class="cc-foot"><form class="cc-form" autocomplete="off">' +
      '<textarea class="cc-in" rows="1" id="cc-in" aria-label="Escreva sua mensagem" placeholder="Escreva sua dúvida…" maxlength="600"></textarea>' +
      '<button type="submit" class="cc-go" aria-label="Enviar">' + svg('send') + '</button></form>' +
      '<p class="cc-note">' + svg('lock') + '<span>Orientação geral, sem substituir a análise do seu caso. Não envie CPF, senhas ou documentos por aqui.</span></p></div>' +
      '</div>' +
      '<button type="button" id="cc-btn" aria-label="Abrir chat com o Dr. Lucas Semim" aria-expanded="false">' + svg('chat') + '<span class="cc-lbl">Tire sua dúvida</span></button>' +
      '</div>');
    document.body.appendChild(root);
    var q = function (s) { return root.querySelector(s); };
    S.el = { root: root, btn: q('#cc-btn'), win: q('#cc-win'), body: q('.cc-body'), form: q('.cc-form'), input: q('.cc-in'), go: q('.cc-go'), teaser: q('#cc-teaser'), av: q('.cc-av img') };

    S.el.av.addEventListener('error', function () {
      var b = document.createElement('b'); b.textContent = 'LS';
      S.el.av.replaceWith(b);
    });
    S.el.btn.addEventListener('click', function () { S.open ? close() : open('botao'); });
    q('.cc-x').addEventListener('click', close);
    S.el.teaser.addEventListener('click', function (e) {
      if (e.target.closest('button')) { hideTeaser(); store(false, { closed: S.closed, teased: true }); return; }
      open('teaser');
    });
    S.el.form.addEventListener('submit', function (e) { e.preventDefault(); sendTyped(); });
    S.el.input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTyped(); }
    });
    S.el.input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 96) + 'px';
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && S.open) close(); });
  }

  /* ---------- posição (convive com dock, WhatsApp flutuante e cookies) ---------- */
  function place() {
    var r = S.el.root;
    if (!r) return;
    var mobile = window.matchMedia('(max-width:768px)').matches;
    var bottom = mobile ? 14 : 22;
    var dock = document.querySelector('.c2-dock');
    if (dock && dock.offsetHeight > 0 && getComputedStyle(dock).display !== 'none') bottom = Math.max(bottom, dock.offsetHeight + 12);
    var wa = document.querySelector('.wa-fab');
    if (!mobile && wa && wa.offsetHeight > 0 && getComputedStyle(wa).display !== 'none') {
      var rect = wa.getBoundingClientRect();
      bottom = Math.max(bottom, window.innerHeight - rect.top + 14);
    }
    r.style.bottom = 'calc(' + Math.round(bottom) + 'px + env(safe-area-inset-bottom,0px))';
    // no celular o cartão de cookies ocupa a largura toda: esconde o balão até o aceite
    var lg = document.getElementById('lgpd-stealth');
    var lgVisible = lg && lg.offsetHeight > 0 && getComputedStyle(lg).display !== 'none' && getComputedStyle(lg).visibility !== 'hidden';
    r.hidden = !!(mobile && lgVisible && !S.open);
  }

  /* ---------- abrir / fechar ---------- */
  function hideTeaser() { S.el.teaser && S.el.teaser.classList.remove('cc-on'); }
  function open(src) {
    if (S.open) return;
    S.open = true;
    S.el.root.classList.add('cc-open');
    S.el.btn.setAttribute('aria-expanded', 'true');
    hideTeaser();
    S.el.root.hidden = false;
    track('open', { source: src });
    if (!S.shown) { S.shown = true; opening(); }
    setTimeout(function () { if (window.innerWidth > 768) S.el.input.focus(); }, 300);
  }
  function close() {
    if (!S.open) return;
    S.open = false;
    S.closed = true;
    S.el.root.classList.remove('cc-open');
    S.el.btn.setAttribute('aria-expanded', 'false');
    store(false, { closed: true, teased: true });
    track('close', { ai: S.aiCount });
    place();
  }

  /* ---------- mensagens ---------- */
  function scroll() { S.el.body.scrollTop = S.el.body.scrollHeight; }
  function add(cls, text) {
    var m = document.createElement('div');
    m.className = 'cc-m ' + cls;
    m.textContent = text;
    S.el.body.appendChild(m);
    scroll();
    return m;
  }
  function typing(on) {
    var old = S.el.body.querySelector('.cc-typing');
    if (old) old.remove();
    if (!on) return;
    var t = document.createElement('div');
    t.className = 'cc-typing';
    t.setAttribute('aria-label', 'Digitando');
    t.innerHTML = '<span></span><span></span><span></span>';
    S.el.body.appendChild(t);
    scroll();
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  async function botSay(list, firstLead) {
    for (var i = 0; i < list.length; i++) {
      typing(true);
      await wait(Math.min(Math.max(list[i].length * 16, 600), 1500));
      typing(false);
      add('b' + (i === 0 && firstLead ? ' lead' : ''), list[i]);
      if (i < list.length - 1) await wait(250);
    }
  }
  async function opening() {
    var t = topic();
    await botSay(t.msg, true);
    chips(t.qs, 'Perguntas frequentes');
  }
  function chips(list, label) {
    var old = S.el.body.querySelector('.cc-chips');
    if (old) old.remove();
    var w = document.createElement('div');
    w.className = 'cc-chips';
    w.innerHTML = '<p>' + label + '</p>';
    list.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cc-chip';
      b.textContent = q;
      b.addEventListener('click', function () { w.remove(); ask(q); });
      w.appendChild(b);
    });
    S.el.body.appendChild(w);
    scroll();
  }
  function actions() {
    if (S.el.body.querySelector('.cc-acts')) return;
    var t = topic();
    var w = document.createElement('div');
    w.className = 'cc-acts';
    var a1 = document.createElement('a');
    a1.className = 'cc-act gold';
    a1.href = CFG.central + '?assunto=' + encodeURIComponent(t.assunto) + '&origem=chat';
    a1.innerHTML = svg('folder') + '<span>Criar a Central do Caso<small>Organize seu caso e envie documentos com sigilo</small></span>';
    a1.addEventListener('click', function () { track('click_central'); });
    var a2 = document.createElement('button');
    a2.type = 'button';
    a2.className = 'cc-act wa';
    a2.innerHTML = svg('wa') + '<span>Falar com o Dr. Lucas no WhatsApp<small>Envia o resumo desta conversa</small></span>';
    a2.addEventListener('click', function () { toWhatsApp(); });
    w.appendChild(a1);
    w.appendChild(a2);
    S.el.body.appendChild(w);
    scroll();
  }

  function resumo() {
    var us = S.hist.filter(function (m) { return m.role === 'user'; }).map(function (m) { return m.content; });
    return us.join(' | ');
  }
  function toWhatsApp(extra) {
    var t = topic();
    var txt = 'Olá, Dr. Lucas! Vim pelo chat do site (assunto: ' + t.nome + ').';
    var r = extra || resumo();
    if (r) txt += '\n\nMeu relato: ' + r.slice(0, 700);
    var url = 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(txt);
    track('whatsapp');
    window.open(url, '_blank', 'noopener');
  }

  /* ---------- envio / IA ---------- */
  function sendTyped() {
    var v = S.el.input.value.trim();
    if (!v || S.busy) return;
    S.el.input.value = '';
    S.el.input.style.height = 'auto';
    var c = S.el.body.querySelector('.cc-chips');
    if (c) c.remove();
    ask(v);
  }

  function systemPrompt() {
    var t = topic();
    return [
      'Você é o assistente virtual do advogado Lucas Renan Semim (OAB/MG 222.539), de Sabará/BH, na área de DIREITO CIVIL (indenizações, consumidor, bancos, planos de saúde, seguros, acidentes, golpes, bets, usucapião, família e contratos).',
      'REGRAS: responda só sobre direito civil e do consumidor brasileiro, em português simples, em no máximo 3 parágrafos curtos.',
      'Dê apenas orientação geral e informativa. NUNCA prometa resultado, valor de indenização ou prazo de decisão, e não diga que o caso "vai ganhar".',
      'Não peça CPF, senhas ou documentos. Não invente leis nem súmulas; cite norma só se tiver certeza.',
      'Se a pergunta for criminal, diga que o atendimento criminal é feito em lucassemim.adv.br.',
      'Termine sugerindo, com naturalidade, criar a Central do Caso ou falar com o Dr. Lucas, que analisa o caso concreto.',
      'ASSUNTO DA PÁGINA: ' + t.nome + '.'
    ].join('\n');
  }

  async function ask(text) {
    if (S.busy) return;
    S.busy = true;
    S.el.go.disabled = true;
    add('u', text);
    track('msg', { n: S.hist.length + 1 });
    S.hist.push({ role: 'user', content: text });

    if (S.aiCount >= CFG.maxAiReplies) {
      await botSay(['Já tenho o essencial. Para uma análise do seu caso concreto, o melhor é falar direto com o Dr. Lucas.']);
      actions();
      done();
      return;
    }
    typing(true);
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function () { ctrl.abort(); }, 15000);
      var res = await fetch(CFG.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: CFG.model, max_tokens: 350, system: systemPrompt(), messages: S.hist.slice(-8) }),
        signal: ctrl.signal
      });
      clearTimeout(to);
      if (!res.ok) throw new Error('http ' + res.status);
      var data = await res.json();
      var reply = data && data.content && data.content[0] && data.content[0].text;
      if (!reply) throw new Error('vazio');
      S.hist.push({ role: 'assistant', content: reply });
      S.aiCount++;
      typing(false);
      add('b', reply.trim());
      track('ai_reply', { n: S.aiCount });
      await wait(450);
      actions();
    } catch (e) {
      typing(false);
      track('ai_error');
      await botSay(['Entendi. Para não te deixar sem resposta, o caminho mais rápido é falar direto com o Dr. Lucas — ele analisa o seu caso com atenção.']);
      actions();
    }
    done();
  }
  function done() { S.busy = false; S.el.go.disabled = false; if (window.innerWidth > 768) S.el.input.focus(); }

  /* ---------- teaser e inicialização ---------- */
  function consent() {
    try { return !!localStorage.getItem('lgpd_civel_consent'); } catch (e) { return true; }
  }
  function scheduleTeaser() {
    var st = store(true);
    if (st.teased || st.closed) return;
    setTimeout(function tick() {
      if (S.open || S.closed || S.teased) return;
      var mobile = window.matchMedia('(max-width:768px)').matches;
      var toast = document.querySelector('.social-proof-toast');
      var toastOn = toast && toast.offsetHeight > 0;
      if ((mobile && !consent()) || toastOn) { setTimeout(tick, 4000); return; }
      S.teased = true;
      S.el.teaser.classList.add('cc-on');
      store(false, { closed: false, teased: true });
      setTimeout(hideTeaser, 12000);
    }, CFG.teaserDelayMs);
  }

  function init() {
    var path = location.pathname.replace(/^\//, '');
    if (CFG.skipPages.test(path)) return;
    detect();
    styles();
    build();
    place();
    window.addEventListener('resize', place);
    var n = 0;
    var iv = setInterval(function () { place(); if (++n > 40) clearInterval(iv); }, 1500);
    new MutationObserver(function () { place(); }).observe(document.body, { childList: true });
    document.addEventListener('click', function () { setTimeout(place, 120); }, true);
    scheduleTeaser();
    window.ChatCivel = { open: function () { open('api'); }, close: close };
  }

  if (window.civelReady) window.civelReady(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
