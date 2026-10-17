/* =========================================================== */
/* === ARQUIVO: js/header-elite.js (HeaderElite V4)         === */
/* === FUNÇÃO: Navegação Premium + Plantão Ao Vivo          === */
/* === Corrigido: inline styles, fa-scale, gtag, ARIA       === */
/* =========================================================== */

window.HeaderElite = {

  config: {
    whatsapp:   'https://wa.me/5531989420094?text=Dr.%20Lucas%2C%20preciso%20de%20atendimento%20urgente.',
    telefone:   'tel:+5531989420094',
    logoHref:   '/index.html',
    navLinks: [
      { label: 'Início',          href: '/index.html',                  match: ['/', '/index.html'] },
      { label: 'Soluções',        href: '/solucoes.html',                match: ['/solucoes', '/servicos'] },
      { label: 'Defesa Criminal', href: '/artigos.html',                 match: ['/artigos', '/defesa-criminal'] },
      { label: 'Comarcas',        href: '/advogado-criminalista/',       match: ['/advogado-criminalista'] },
      { label: 'Notícias',        href: '/noticias.html',                match: ['/noticias', '/news'] },
      { label: 'Dr. Lucas',       href: '/sobre-mim.html',               match: ['/sobre-mim'] }
    ],
    scrollThreshold: 50,
    contextBadges: {
      noticias:   { text: 'UNIDADE NEWS',   cssClass: 'he-badge-news' },
      emergencia: { text: 'PLANTÃO ATIVO',  cssClass: 'he-badge-emergencia' },
      execucao:   { text: 'EXECUÇÃO PENAL', cssClass: 'he-badge-execucao' },
      default:    null
    }
  },

  state: {
    nav:            null,
    mobileMenuOpen: false,
    scrollTicking:  false,
    clockTimer:     null
  },

  /* ── UNIFICAÇÃO DE HEADER (2026-10-15) ──────────────────────
     Remove navs estáticas antigas (pattern das notícias antigas:
     navbar-custom com marca "SEMIM & ASSOCIADOS" e 2 links) para
     não haver dois menus na mesma página. O header-elite injeta
     o menu padrão unificado no lugar. Breadcrumb (nav[aria-label])
     NUNCA é tocado. */

  removeLegacyNav() {
    try {
      document.querySelectorAll('nav.navbar-custom, nav.navbar-vip').forEach(nav => {
        // só remove navs de topo que o próprio header-elite não criou
        if (nav.id !== 'header-elite-nav' && !nav.querySelector('.he-container')) {
          nav.remove();
        }
      });
    } catch (e) { /* silencioso: a página continua navegável */ }
  },

  /* Garante as fontes usadas pelo header (Teko/Lato/Playfair).
     Só injeta se a página ainda não carregar nenhuma delas. */
  ensureFonts() {
    try {
      const jaTem = Array.from(document.querySelectorAll('link[href*="fonts.googleapis.com"]'))
        .some(l => /Teko|Lato|Playfair/.test(l.href || ''));
      if (jaTem || document.getElementById('he-fonts')) return;
      const l = document.createElement('link');
      l.id = 'he-fonts';
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Lato:wght@400;700&family=Teko:wght@400;500;600&display=swap';
      document.head.appendChild(l);
    } catch (e) { /* sem rede: fallback sans-serif nativo */ }
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    try {
      if (document.getElementById('header-elite-nav')) return;
      this.removeLegacyNav();
      this.ensureFonts();
      this.injectStyles();
      this.buildNav();
      this.setActiveLinkByPath();
      this.initScrollGlass();
      this.initMobileMenu();
      this.initKeyboardNav();
      this.startClock();
    } catch (err) {
      if (window.location.hostname !== 'lucassemim.adv.br') console.error('[HeaderElite V4]', err);
    }
  },

  /* ── CSS (style.textContent — zero innerHTML) ──────────────── */

  injectStyles() {
    if (document.getElementById('header-elite-styles')) return;
    const style = document.createElement('style');
    style.id = 'header-elite-styles';
    style.textContent = `
      /* === HeaderElite V4 === */

      /* ── Ticker de emergência (contextual) ── */
      #he-ticker {
        background: linear-gradient(90deg, #7b0000, #8b0000, #7b0000);
        background-size: 200% 100%;
        animation: heTicker 3s ease infinite;
        text-align: center;
        padding: 5px 0;
        font-family: 'Lato', sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 1px;
        color: #fff;
        text-transform: uppercase;
        display: none; /* só aparece em contexto de emergência */
      }
      #he-ticker.ativo { display: block; }
      @keyframes heTicker {
        0%,100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      @media (prefers-reduced-motion: reduce) {
        #he-ticker { animation: none; }
      }
      #he-ticker a { color: #ffd700; text-decoration: none; margin-left: 8px; }

      /* ── Nav principal ── */
      #header-elite-nav {
        position: fixed; top: 0; left: 0; width: 100%;
        z-index: 10000;
        padding: 12px 0;
        transition: padding 0.4s ease, background 0.4s ease,
                    border-color 0.4s ease, box-shadow 0.4s ease;
        background: rgba(5,5,5,0);
        border-bottom: 1px solid rgba(212,175,55,0);
      }
      #header-elite-nav.scrolled {
        padding: 8px 0;
        background: rgba(5,5,5,0.92);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid rgba(212,175,55,0.3);
        box-shadow: 0 4px 24px rgba(0,0,0,0.6);
      }

      /* ── Container ── */
      .he-container {
        max-width: 1200px; margin: 0 auto;
        padding: 0 20px;
        display: flex; align-items: center;
        justify-content: space-between; gap: 20px;
      }

      /* ── Brand / Logo ── */
      .he-brand {
        display: flex; align-items: center; gap: 12px;
        text-decoration: none; flex-shrink: 0;
      }
      /* A marca não pode disputar largura com o botão do menu:
      sem isto, em telas estreitas o toggle saía da viewport */
      .he-brand { max-width: calc(100% - 62px); }
      .he-text-group { min-width: 0; }
      .he-brand:focus-visible { outline: 2px solid #d4af37; outline-offset: 4px; border-radius: 4px; }

      /* Balança em SVG, com os dois pratos oscilando (SMIL) + brilho dourado */
      .he-balanca {
        width: 46px; height: 46px; flex-shrink: 0; display: block; overflow: visible;
        filter: drop-shadow(0 0 6px rgba(212,175,55,0.35));
        animation: heBalancaGlow 4s ease-in-out infinite;
      }
      .he-brand:hover .he-balanca { filter: drop-shadow(0 0 14px rgba(246,231,166,0.75)); }
      @media (prefers-reduced-motion: reduce) { .he-balanca { animation: none; } }
      @keyframes heBalancaGlow {
        0%,100% { filter: drop-shadow(0 0 4px rgba(212,175,55,0.25)); }
        50%      { filter: drop-shadow(0 0 16px rgba(212,175,55,0.75)); }
      }

      .he-text-group { display: flex; flex-direction: column; line-height: 1.1; }
      .he-title {
        font-family: 'Teko', sans-serif; color: #fff;
        font-size: 1.8rem; font-weight: 500;
        text-transform: uppercase; letter-spacing: 1px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .he-subtitle {
        font-family: 'Lato', sans-serif; color: #999;
        font-size: 0.68rem; letter-spacing: 0.5px; text-transform: uppercase;
        display: flex; align-items: center; gap: 6px;
      }

      /* BUGFIX 1: badges via classes CSS (não inline style) */
      .he-badge {
        display: inline-flex; align-items: center;
        font-family: 'Lato', sans-serif; font-size: 0.58rem; font-weight: 700;
        padding: 2px 7px; border-radius: 3px;
        text-transform: uppercase; letter-spacing: 0.5px; color: #fff;
      }
      .he-badge-news       { background: #cc2200; }
      .he-badge-emergencia { background: #c05000; animation: heBadgePulse 2s infinite; }
      .he-badge-execucao   { background: #1a6b2e; }
      @keyframes heBadgePulse {
        0%,100% { opacity: 1; } 50% { opacity: 0.7; }
      }
      @media (prefers-reduced-motion: reduce) { .he-badge-emergencia { animation: none; } }

      /* ── Indicador de plantão ao vivo ── */
      .he-live {
        display: inline-flex; align-items: center; gap: 5px;
        font-family: 'Lato', sans-serif; font-size: 0.68rem;
        color: #2ecc71; letter-spacing: 0.5px;
        text-transform: uppercase;
      }
      .he-live-dot {
        width: 7px; height: 7px; background: #2ecc71;
        border-radius: 50%; flex-shrink: 0;
        animation: heLivePulse 1.5s ease-in-out infinite;
      }
      @keyframes heLivePulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.5); }
        50%      { box-shadow: 0 0 0 5px rgba(46,204,113,0); }
      }
      @media (prefers-reduced-motion: reduce) { .he-live-dot { animation: none; } }

      /* ── Nav links ── */
      .he-nav {
        display: flex; align-items: center; gap: 4px;
        list-style: none; margin: 0; padding: 0;
      }
      .he-nav-link {
        font-family: 'Teko', sans-serif; font-size: 1.2rem;
        color: #e1e1e6; text-decoration: none; text-transform: uppercase;
        padding: 6px 10px; border-radius: 4px;
        transition: color 0.25s, background 0.25s;
        position: relative;
      }
      .he-nav-link::after {
        content: ''; position: absolute; left: 14px; right: 14px; bottom: 1px;
        height: 1px; background: #d4af37;
        transform: scaleX(0); transform-origin: center;
        transition: transform 0.25s ease;
      }
      .he-nav-link { white-space: nowrap; }
      .he-nav-link:hover,
      .he-nav-link:focus-visible { color: #d4af37; background: rgba(212,175,55,0.08); outline: none; }
      .he-nav-link:hover::after,
      .he-nav-link:focus-visible::after { transform: scaleX(1); }
      .he-nav-link[aria-current="page"] { color: #d4af37; }
      .he-nav-link[aria-current="page"]::after { transform: scaleX(1); }

      /* ── Botões de CTA ── */
      .he-actions {
        display: flex; align-items: center; gap: 10px; flex-shrink: 0;
      }

      /* Botão secundário — Telefone (visível no mobile para tap-to-call) */
      .he-btn-tel {
        font-family: 'Lato', sans-serif; font-size: 0.82rem;
        font-weight: 700; color: #d4af37; text-decoration: none;
        display: inline-flex; align-items: center; gap: 6px;
        padding: 7px 14px; border-radius: 4px;
        border: 1px solid rgba(212,175,55,0.3);
        transition: border-color 0.2s, background 0.2s;
        white-space: nowrap;
      }
      .he-btn-tel:hover { border-color: #d4af37; background: rgba(212,175,55,0.07); }
      .he-btn-tel:focus-visible { outline: 2px solid #d4af37; outline-offset: 3px; }

      /* Área do Cliente — escudo dourado */
      .he-btn-cliente {
        position: relative; width: 42px; height: 42px; flex-shrink: 0;
        display: inline-flex; align-items: center; justify-content: center;
        color: #d4af37; text-decoration: none; font-size: 1.15rem;
        border: 1px solid rgba(212,175,55,0.45); border-radius: 50%;
        background: radial-gradient(circle at 50% 30%, rgba(212,175,55,0.16), rgba(212,175,55,0.02) 70%);
        transition: background 0.25s, color 0.25s, transform 0.2s, box-shadow 0.25s;
      }
      .he-btn-cliente:hover, .he-btn-cliente:focus-visible {
        color: #111; background: linear-gradient(135deg, #f6e7a6, #d4af37 55%, #b8901f);
        box-shadow: 0 0 0 4px rgba(212,175,55,0.18), 0 6px 22px rgba(212,175,55,0.35);
        transform: translateY(-1px); outline: none;
      }
      .he-btn-cliente .he-cliente-txt {
        position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap;
      }
      .he-btn-cliente::after { /* dica ao passar o mouse */
        content: attr(data-tip); position: absolute; top: calc(100% + 10px); right: 0;
        background: #0c0c0e; color: #f6e7a6; border: 1px solid rgba(212,175,55,0.35);
        font: 700 0.68rem/1 'Lato', sans-serif; letter-spacing: 0.6px; text-transform: uppercase;
        padding: 7px 10px; border-radius: 4px; white-space: nowrap;
        opacity: 0; transform: translateY(-4px); pointer-events: none; transition: opacity 0.2s, transform 0.2s;
      }
      .he-btn-cliente:hover::after, .he-btn-cliente:focus-visible::after { opacity: 1; transform: none; }

      /* Botão principal — WhatsApp / Plantão */
      .he-btn-plantao {
        font-family: 'Teko', sans-serif; font-size: 1.15rem;
        text-transform: uppercase; letter-spacing: 0.5px;
        color: #fff; text-decoration: none;
        background: linear-gradient(180deg, #8b0000, #5c0000);
        border: 1px solid rgba(255,77,77,0.4);
        padding: 7px 20px; border-radius: 4px;
        display: inline-flex; align-items: center; gap: 7px;
        transition: opacity 0.2s, transform 0.15s;
        animation: hePlantaoPulse 2.5s infinite;
        white-space: nowrap;
      }
      .he-btn-plantao:hover  { opacity: 0.9; transform: translateY(-1px); }
      .he-btn-plantao:focus-visible { outline: 2px solid #ff4d4d; outline-offset: 3px; }
      @media (prefers-reduced-motion: reduce) { .he-btn-plantao { animation: none; } }
      @keyframes hePlantaoPulse {
        0%,100% { box-shadow: 0 0 0 0   rgba(255,77,77,0.4); }
        70%      { box-shadow: 0 0 0 10px rgba(255,77,77,0);   }
      }

      /* ── Hamburger ── */
      .he-toggle {
        display: none; background: none; border: 1px solid #444;
        border-radius: 4px; padding: 6px 10px; cursor: pointer;
        flex-direction: column; gap: 5px; flex-shrink: 0;
      }
      .he-toggle:focus-visible { outline: 2px solid #d4af37; }
      .he-toggle span {
        display: block; width: 22px; height: 2px; background: #e1e1e6;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }
      .he-toggle[aria-expanded="true"] span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
      .he-toggle[aria-expanded="true"] span:nth-child(2) { opacity: 0; }
      .he-toggle[aria-expanded="true"] span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

      /* ── Collapse mobile ── */
      .he-collapse { display: flex; align-items: center; gap: 14px; }

      @media (max-width: 991px) {
        .he-toggle { display: flex; }
        .he-btn-tel { display: none; } /* ocultar no mobile para economizar espaço */
        .he-collapse {
          position: absolute; top: 100%; left: 0; width: 100%;
          flex-direction: column; align-items: flex-start; gap: 4px;
          background: rgba(8,8,8,0.98);
          backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
          padding: 0 20px;
          border-top: 1px solid rgba(212,175,55,0.2);
          border-bottom: 1px solid rgba(212,175,55,0.2);
          max-height: 0; overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.25,0.46,0.45,0.94),
                      padding 0.3s ease;
        }
        .he-collapse.open { max-height: 540px; padding: 16px 20px 22px; }
        .he-nav { flex-direction: column; align-items: flex-start; width: 100%; gap: 0; }
        .he-nav-link { font-size: 1.45rem; padding: 10px 0; width: 100%; border-bottom: 1px solid #1a1a1a; }
        .he-nav li:last-child .he-nav-link { border-bottom: none; }
        .he-actions { flex-direction: column; width: 100%; margin-top: 10px; }
        .he-btn-plantao { width: 100%; justify-content: center; }
        .he-btn-cliente { width: 100%; height: auto; border-radius: 4px; padding: 10px; gap: 8px; font-size: 1rem; order: -1; }
        .he-btn-cliente .he-cliente-txt { position: static; width: auto; height: auto; clip: auto; font: 700 0.9rem 'Lato', sans-serif; letter-spacing: 0.4px; }
        .he-btn-cliente::after { display: none; }
        /* No mobile, mostrar telefone dentro do collapse */
        .he-btn-tel-mobile {
          display: inline-flex; align-items: center; gap: 6px;
          width: 100%; justify-content: center;
          font-family: 'Lato', sans-serif; font-size: 0.9rem;
          font-weight: 700; color: #d4af37; text-decoration: none;
          padding: 8px; border: 1px solid rgba(212,175,55,0.3); border-radius: 4px;
          margin-bottom: 4px;
        }
      }
      @media (min-width: 992px) {
        .he-btn-tel-mobile { display: none; }
      }
      @media (min-width: 992px) and (max-width: 1239px) { .he-btn-tel { display: none; } }
      @media (min-width: 992px) and (max-width: 1099px) { .he-nav-link { padding: 6px 7px; font-size: 1.1rem; } .he-btn-plantao { padding: 7px 12px; } .he-brand { gap: 8px; } .he-actions { gap: 8px; } .he-subtitle { display: none; } }

      /* ── Encaixe em notebook (Lote E): conteúdo do cabeçalho ~1180px; sem isto o botão PLANTÃO 24H saía da tela ── */
      @media (min-width: 1240px) { .he-container { max-width: 1260px; } }
      @media (min-width: 992px) and (max-width: 1439px) { .he-subtitle .he-badge { display: none; } }
      @media (min-width: 1440px) { .he-container { max-width: 1400px; } }

      /* ── Body offset ── */
      body { padding-top: 65px; }
      @media (max-width: 991px) { body { padding-top: 60px; } }

      /* ── Marca compacta no celular (2026-10-15) ──
         Nas páginas que só têm este CSS (notícias etc.), a marca em
         1.8rem empurrava o botão do menu para fora da tela em 390px.
         Compacta marca + esconde a linha do plantão (a informação
         continua no botão PLANTÃO 24H e no relógio do collapse). */
      @media (max-width: 991px) {
        .he-container { padding: 0 14px; gap: 10px; }
        .he-brand { gap: 9px; min-width: 0; }
        .he-balanca { width: 34px; height: 34px; }
        .he-title { font-size: 1.28rem; letter-spacing: 0.5px; }
        .he-subtitle { font-size: 0.58rem; }
        .he-badge { font-size: 0.52rem; padding: 2px 5px; }
        .he-live { display: none; }
      }
      @media (max-width: 359px) {
        .he-subtitle { display: none; }
      }
    `;
    document.head.appendChild(style);
  },

  /* ── BUILD DO NAV ──────────────────────────────────────────── */

  buildNav() {
    // Ticker de emergência contextual
    const ctx = this.detectContext();
    if (ctx === 'emergencia' || ctx === 'flagrante') {
      const ticker = document.createElement('div');
      ticker.id = 'he-ticker';
      ticker.className = 'ativo';
      ticker.setAttribute('aria-live', 'polite');
      ticker.setAttribute('role', 'status');

      const txt = document.createTextNode('⚡ PLANTÃO CRIMINAL 24H — Atendimento para flagrante e custódia — ');
      const link = document.createElement('a');
      link.href = this.config.whatsapp;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '(31) 98942-0094';

      ticker.appendChild(txt);
      ticker.appendChild(link);
      document.body.insertBefore(ticker, document.body.firstChild);
    }

    const nav = document.createElement('nav');
    nav.id = 'header-elite-nav';
    nav.setAttribute('aria-label', 'Menu Principal');

    const container = document.createElement('div');
    container.className = 'he-container';

    const brand   = this.buildBrand();
    const toggle  = this.buildMobileToggle();
    const collapse = document.createElement('div');
    collapse.className = 'he-collapse';

    const ul      = this.buildNavLinks();
    const actions = this.buildActions();

    collapse.appendChild(ul);
    collapse.appendChild(actions);

    container.appendChild(brand);
    container.appendChild(toggle);
    container.appendChild(collapse);
    nav.appendChild(container);

    document.body.insertBefore(nav, document.body.firstChild);
    this.state.nav = nav;
  },

  /* ── BRAND ─────────────────────────────────────────────────── */

  buildBrand() {
    const a = document.createElement('a');
    a.href = this.config.logoHref;
    a.className = 'he-brand';
    a.setAttribute('aria-label', 'Dr. Lucas Semim Advocacia Criminal — Página inicial');

    // BUGFIX 3: fa-scale-balanced (FA 6 Free) em vez de fa-balance-scale (FA 5)
    const icon = document.createElement('span');
    icon.className = 'he-balanca-wrap';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = this.balancaSVG(); // marcação estática, sem dado de usuário

    const textGroup = document.createElement('div');
    textGroup.className = 'he-text-group';

    const title = document.createElement('span');
    title.className = 'he-title';
    title.textContent = 'LUCAS SEMIM';

    const subtitle = document.createElement('span');
    subtitle.className = 'he-subtitle';
    subtitle.textContent = 'Advocacia Criminal · OAB/MG 222.539';

    // BUGFIX 1: badge via classe CSS (não inline style.background)
    const ctx   = this.detectContext();
    const badge = this.config.contextBadges[ctx];
    if (badge) {
      const badgeEl = document.createElement('span');
      badgeEl.className = `he-badge ${badge.cssClass}`;
      badgeEl.textContent = badge.text;
      badgeEl.setAttribute('aria-label', badge.text);
      subtitle.appendChild(badgeEl);
    }

    // Indicador de plantão ao vivo
    const live = document.createElement('span');
    live.className = 'he-live';
    live.setAttribute('aria-label', 'Plantão ativo agora');

    const dot = document.createElement('span');
    dot.className = 'he-live-dot';
    dot.setAttribute('aria-hidden', 'true');

    const liveText = document.createElement('span');
    liveText.id = 'he-live-time';
    liveText.textContent = 'PLANTÃO ATIVO';

    live.appendChild(dot);
    live.appendChild(liveText);

    textGroup.appendChild(title);
    textGroup.appendChild(subtitle);
    textGroup.appendChild(live);

    a.appendChild(icon);
    a.appendChild(textGroup);

    return a;
  },

  /* ── BALANÇA ANIMADA (SVG) ─────────────────────────────────── */

  balancaSVG() {
    const spl = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"';
    return '' +
    '<svg class="he-balanca" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" focusable="false">' +
      '<defs><linearGradient id="heGold" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#f6e7a6"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#9a7a16"/>' +
      '</linearGradient></defs>' +
      '<g fill="url(#heGold)" stroke="url(#heGold)">' +
        '<rect x="48.5" y="22" width="3" height="60" rx="1.5" stroke="none"/>' +
        '<path d="M30 88 Q50 80 70 88 L70 92 L30 92 Z" stroke="none"/>' +
        '<circle cx="50" cy="19" r="4" stroke="none"/>' +
        '<g>' +
          '<animateTransform attributeName="transform" type="rotate" values="-5 50 24;5 50 24;-5 50 24" dur="6s" repeatCount="indefinite" ' + spl + '/>' +
          '<rect x="12" y="22.5" width="76" height="3" rx="1.5" stroke="none"/>' +
          '<g>' +
            '<animateTransform attributeName="transform" type="rotate" values="5 14 24;-5 14 24;5 14 24" dur="6s" repeatCount="indefinite" ' + spl + '/>' +
            '<path d="M14 24 L4 58 M14 24 L24 58" fill="none" stroke-width="1.2"/>' +
            '<path d="M2 58 H26 Q24 68 14 68 Q4 68 2 58 Z" stroke="none"/>' +
          '</g>' +
          '<g>' +
            '<animateTransform attributeName="transform" type="rotate" values="5 86 24;-5 86 24;5 86 24" dur="6s" repeatCount="indefinite" ' + spl + '/>' +
            '<path d="M86 24 L76 58 M86 24 L96 58" fill="none" stroke-width="1.2"/>' +
            '<path d="M74 58 H98 Q96 68 86 68 Q76 68 74 58 Z" stroke="none"/>' +
          '</g>' +
        '</g>' +
      '</g>' +
    '</svg>';
  },

  /* ── NAV LINKS ─────────────────────────────────────────────── */

  buildNavLinks() {
    const ul = document.createElement('ul');
    ul.className = 'he-nav';
    // BUGFIX 5: sem role="menubar" (requer Arrow Key navigation não implementada)
    // HTML semântico <ul>/<li>/<a> já é suficiente para navegação acessível

    this.config.navLinks.forEach(linkData => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.className = 'he-nav-link';
      a.href = linkData.href;
      a.textContent = linkData.label;
      li.appendChild(a);
      ul.appendChild(li);
    });

    return ul;
  },

  /* ── AÇÕES (WhatsApp + Telefone) ───────────────────────────── */

  buildActions() {
    const wrapper = document.createElement('div');
    wrapper.className = 'he-actions';

    // Botão telefone — visível em desktop, oculto no mobile collapse
    const btnTel = document.createElement('a');
    btnTel.className = 'he-btn-tel';
    btnTel.href = this.config.telefone;
    btnTel.setAttribute('aria-label', 'Ligar para o Dr. Lucas Semim');

    const telIcon = document.createElement('i');
    telIcon.className = 'fas fa-phone';
    telIcon.setAttribute('aria-hidden', 'true');

    btnTel.appendChild(telIcon);
    btnTel.appendChild(document.createTextNode(' (31) 98942-0094'));
    btnTel.addEventListener('click', () => this.trackClick('tel_header'));

    // Botão WhatsApp / Plantão
    const btnPlantao = this.buildBtnPlantao();

    // Botão telefone mobile (dentro do collapse)
    const btnTelMobile = document.createElement('a');
    btnTelMobile.className = 'he-btn-tel-mobile';
    btnTelMobile.href = this.config.telefone;
    btnTelMobile.setAttribute('aria-label', 'Ligar para o Dr. Lucas Semim');

    const telMobileIcon = document.createElement('i');
    telMobileIcon.className = 'fas fa-phone';
    telMobileIcon.setAttribute('aria-hidden', 'true');

    btnTelMobile.appendChild(telMobileIcon);
    btnTelMobile.appendChild(document.createTextNode(' (31) 98942-0094'));
    btnTelMobile.addEventListener('click', () => this.trackClick('tel_header_mobile'));

    // Área do Cliente (escudo)
    const btnCliente = document.createElement('a');
    btnCliente.className = 'he-btn-cliente';
    btnCliente.href = '/portal/painel-cliente.html';
    btnCliente.setAttribute('aria-label', 'Área do Cliente — acompanhe seu processo');
    btnCliente.setAttribute('data-tip', 'Área do Cliente');
    const shield = document.createElement('i');
    shield.className = 'fas fa-shield-halved';
    shield.setAttribute('aria-hidden', 'true');
    const shieldTxt = document.createElement('span');
    shieldTxt.className = 'he-cliente-txt';
    shieldTxt.textContent = 'Área do Cliente';
    btnCliente.appendChild(shield);
    btnCliente.appendChild(shieldTxt);
    btnCliente.addEventListener('click', () => this.trackClick('area_cliente_header'));

    wrapper.appendChild(btnTelMobile);
    wrapper.appendChild(btnTel);
    wrapper.appendChild(btnCliente);
    wrapper.appendChild(btnPlantao);

    return wrapper;
  },

  buildBtnPlantao() {
    const btn = document.createElement('a');
    btn.className = 'he-btn-plantao';
    btn.href = this.config.whatsapp;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.setAttribute('aria-label', 'Falar com o Dr. Lucas Semim pelo WhatsApp — Plantão 24h');

    const icon = document.createElement('i');
    icon.className = 'fab fa-whatsapp';
    icon.setAttribute('aria-hidden', 'true');

    btn.appendChild(icon);
    btn.appendChild(document.createTextNode(' PLANTÃO 24H'));
    btn.addEventListener('click', () => this.trackClick('whatsapp_header'));

    return btn;
  },

  /* ── HAMBURGER ─────────────────────────────────────────────── */

  buildMobileToggle() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'he-toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Abrir menu de navegação');
    btn.setAttribute('aria-controls', 'he-collapse-menu');

    for (let i = 0; i < 3; i++) {
      btn.appendChild(document.createElement('span'));
    }

    return btn;
  },

  /* ── CONTEXTO DA PÁGINA ────────────────────────────────────── */

  detectContext() {
    const combined = (window.location.pathname + ' ' + document.title).toLowerCase();
    if (combined.includes('noticias') || combined.includes('news') || combined.includes('artigos')) return 'noticias';
    if (combined.includes('flagrante') || combined.includes('preso') || combined.includes('delegacia')) return 'emergencia';
    if (combined.includes('execucao') || combined.includes('saidinha') || combined.includes('progressao')) return 'execucao';
    return 'default';
  },

  /* ── ACTIVE LINK ───────────────────────────────────────────── */

  setActiveLinkByPath() {
    const path  = window.location.pathname;
    const links = this.state.nav.querySelectorAll('.he-nav-link');

    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const rule = this.config.navLinks.find(nl => nl.href === href);
      if (!rule) return;

      // Match exato ou startsWith (mais seguro que includes)
      const matched = rule.match.some(m => {
        if (m === '/') return path === '/' || path === '/index.html';
        return path.startsWith(m);
      });

      if (matched) link.setAttribute('aria-current', 'page');
    });
  },

  /* ── GLASSMORPHISM NO SCROLL ───────────────────────────────── */

  initScrollGlass() {
    const onScroll = () => {
      if (!this.state.scrollTicking) {
        requestAnimationFrame(() => {
          const scrolled = window.scrollY > this.config.scrollThreshold;
          this.state.nav.classList.toggle('scrolled', scrolled);
          this.state.scrollTicking = false;
        });
        this.state.scrollTicking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // estado inicial
  },

  /* ── MENU MOBILE ───────────────────────────────────────────── */

  initMobileMenu() {
    const toggle   = this.state.nav.querySelector('.he-toggle');
    const collapse = this.state.nav.querySelector('.he-collapse');
    if (!toggle || !collapse) return;

    collapse.id = 'he-collapse-menu';

    toggle.addEventListener('click', () => {
      const isOpen = collapse.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      this.state.mobileMenuOpen = isOpen;
      if (isOpen) {
        // Focar no primeiro link para acessibilidade
        const firstLink = collapse.querySelector('.he-nav-link');
        if (firstLink) requestAnimationFrame(() => firstLink.focus());
      }
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.state.mobileMenuOpen && !this.state.nav.contains(e.target)) {
        collapse.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        this.state.mobileMenuOpen = false;
      }
    });

    // Fechar ao clicar em um link
    collapse.querySelectorAll('.he-nav-link, .he-btn-plantao, .he-btn-tel-mobile').forEach(el => {
      el.addEventListener('click', () => {
        collapse.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        this.state.mobileMenuOpen = false;
      });
    });
  },

  /* ── TECLADO ───────────────────────────────────────────────── */

  initKeyboardNav() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.mobileMenuOpen) {
        const collapse = this.state.nav.querySelector('.he-collapse');
        const toggle   = this.state.nav.querySelector('.he-toggle');
        if (!collapse || !toggle) return;
        collapse.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
        this.state.mobileMenuOpen = false;
      }
    });
  },

  /* ── RELÓGIO DO PLANTÃO (mostra hora atual = disponível agora) */

  startClock() {
    const el = document.getElementById('he-live-time');
    if (!el) return;

    const update = () => {
      const now  = new Date();
      const h    = String(now.getHours()).padStart(2, '0');
      const m    = String(now.getMinutes()).padStart(2, '0');
      el.textContent = `PLANTÃO · ${h}h${m}`;
    };

    update();
    this.state.clockTimer = setInterval(update, 30000);
  },

  /* ── GA4 (BUGFIX 4: window.gtag em vez de gtag solto) ──────── */

  trackClick(label) {
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', label, {
          event_category: 'Header_Elite',
          pagina_origem:  window.location.pathname
        });
      }
    } catch { }
  }
};

document.addEventListener('DOMContentLoaded', () => window.HeaderElite.init());


/* =========================================================== */
/* === HeroCinematic V4 — Slideshow com lazy load e pausa   === */
/* =========================================================== */

window.HeroCinematic = {

  config: {
    target:             '.page-header',
    interval:           6000,
    transitionDuration: 2000,
    slides: [
      { url: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=1600&auto=format', alt: 'Balança da Justiça' },
      { url: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=1600&auto=format', alt: 'Pilares do Direito' },
      { url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1600&auto=format', alt: 'Documentos Jurídicos' },
      { url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?q=80&w=1600&auto=format', alt: 'Grades — Privação de Liberdade' }
    ]
  },

  state: {
    current:       0,
    intervalId:    null,
    slides:        [],
    header:        null,
    paused:        false,
    reducedMotion: false
  },

  init() {
    const header = document.querySelector(this.config.target);
    if (!header) return;

    this.state.header        = header;
    this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.injectStyles();
    this.buildBackground();

    if (this.state.reducedMotion) return;

    this.initIntersectionObserver();
    this.initHoverPause();
  },

  injectStyles() {
    if (document.getElementById('hero-cinematic-styles')) return;
    const style = document.createElement('style');
    style.id = 'hero-cinematic-styles';
    style.textContent = `
      .page-header {
        position: relative; overflow: hidden;
        background: #050505;
        min-height: 45vh;
        display: flex; align-items: center; justify-content: center;
        border-bottom: 2px solid rgba(212,175,55,0.3);
      }
      .hc-bg-container {
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
      }
      .hc-slide {
        position: absolute; inset: 0;
        background-size: cover; background-position: center;
        opacity: 0;
        transition: opacity 2s ease-in-out;
        will-change: opacity, transform;
      }
      .hc-slide.active { opacity: 1; }
      @media (prefers-reduced-motion: no-preference) {
        .hc-slide.active { animation: hcKenBurns 12s linear forwards; }
      }
      @keyframes hcKenBurns {
        from { transform: scale(1); }
        to   { transform: scale(1.12); }
      }
      @media (prefers-reduced-motion: reduce) {
        .hc-slide { transition: none; animation: none; }
      }
      .hc-overlay {
        position: absolute; inset: 0; z-index: 1;
        background: linear-gradient(to bottom, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.5) 50%, #050505 100%);
        pointer-events: none;
      }
      .page-header > .container,
      .page-header > [class*="container"] { position: relative; z-index: 2; }
      @media (prefers-reduced-motion: no-preference) {
        .page-header > .container { animation: hcTextUp 1.2s ease-out; }
      }
      @keyframes hcTextUp {
        from { opacity: 0; transform: translateY(40px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  },

  buildBackground() {
    const bgContainer = document.createElement('div');
    bgContainer.className = 'hc-bg-container';
    bgContainer.setAttribute('aria-hidden', 'true');

    this.config.slides.forEach((_, index) => {
      const slide = this.buildSlide(index);
      this.state.slides.push(slide);
      bgContainer.appendChild(slide);
    });

    const overlay = document.createElement('div');
    overlay.className = 'hc-overlay';

    this.state.header.insertBefore(bgContainer, this.state.header.firstChild);
    this.state.header.insertBefore(overlay, this.state.header.children[1]);
  },

  buildSlide(index) {
    const slide = document.createElement('div');
    slide.className = index === 0 ? 'hc-slide active' : 'hc-slide';
    slide.setAttribute('aria-hidden', 'true');
    slide.setAttribute('data-slide-index', String(index));

    if (index === 0) {
      // Slide inicial carregado imediatamente
      slide.style.backgroundImage = `url('${this.config.slides[0].url}')`;
      slide.setAttribute('data-loaded', 'true');
    }

    return slide;
  },

  preloadNext() {
    const nextIndex = (this.state.current + 1) % this.config.slides.length;
    const nextSlide = this.state.slides[nextIndex];
    if (!nextSlide || nextSlide.getAttribute('data-loaded')) return;

    const img = new Image();

    // BUGFIX 2: addEventListener em vez de img.onload (Elite V3)
    img.addEventListener('load', () => {
      nextSlide.style.backgroundImage = `url('${this.config.slides[nextIndex].url}')`;
      nextSlide.setAttribute('data-loaded', 'true');
    });

    img.src = this.config.slides[nextIndex].url;
  },

  goToSlide(index) {
    this.state.slides[this.state.current].classList.remove('active');
    this.state.current = index;
    this.state.slides[this.state.current].classList.add('active');
    this.preloadNext();
  },

  startInterval() {
    if (this.state.intervalId || this.state.paused) return;
    this.preloadNext();
    this.state.intervalId = setInterval(() => {
      const next = (this.state.current + 1) % this.config.slides.length;
      this.goToSlide(next);
    }, this.config.interval);
  },

  stopInterval() {
    if (!this.state.intervalId) return;
    clearInterval(this.state.intervalId);
    this.state.intervalId = null;
  },

  initIntersectionObserver() {
    if (!('IntersectionObserver' in window)) { this.startInterval(); return; }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => e.isIntersecting ? this.startInterval() : this.stopInterval());
    }, { threshold: 0.1 });

    obs.observe(this.state.header);
  },

  initHoverPause() {
    this.state.header.addEventListener('mouseenter', () => { this.state.paused = true;  this.stopInterval(); });
    this.state.header.addEventListener('mouseleave', () => { this.state.paused = false; this.startInterval(); });
  },

  destroy() {
    this.stopInterval();
    this.state.slides = [];
    this.state.header = null;
  }
};

document.addEventListener('DOMContentLoaded', () => window.HeroCinematic.init());


/* V11 (04/10/2026) — registra o service worker em TODAS as paginas que carregam o menu.
   Antes so 3 paginas registravam /sw.js, entao quase ninguem recebia a protecao de cache.
   updateViaCache:'none' = o navegador sempre confere sw.js novo no servidor (ignora o cache de 10 anos). */
(function () {
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:') return;
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then(function (reg) { try { reg.update(); } catch (e) {} })
      .catch(function () {});
  });
})();
