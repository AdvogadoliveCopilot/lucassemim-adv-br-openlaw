/* =========================================================== */
/* === ARQUIVO: js/footer-seo.js (FooterElite V4)           === */
/* === FUNÇÃO: Rodapé Premium Black & Gold + CTA Urgência   === */
/* === Corrigido: FA6 icons, inline style, gtag, CSS vars   === */
/* =========================================================== */

window.FooterSeo = {

  config: {
    whatsapp:     'https://wa.me/5531989420094?text=Dr.%20Lucas%2C%20preciso%20de%20atendimento%20urgente.',
    telefone:     'tel:+5531989420094',
    calLink:      'https://cal.read.ai/lucas-fjd9a',
    transparencia: { href: 'transparencia-ia.html', label: 'Site conduzido com agentes de IA, sob responsabilidade do advogado — conheça todos' },
    atualizacao:   { numero: 14, data: '15/10/2026', texto: 'finalizada em nome de Jesus' },
    injectTarget: 'footer-master-injecao',

    cidades: [
      { label: 'Sabará',         href: 'advogado-criminalista/sabara.html' },
      { label: 'Belo Horizonte', href: 'advogado-criminalista/belohorizonte.html' },
      { label: 'Contagem',       href: 'advogado-criminalista/contagem.html' },
      { label: 'Betim',          href: 'advogado-criminalista/betim.html' },
      { label: 'Nova Lima',      href: 'advogado-criminalista/novalima.html' },
      { label: 'Santa Luzia',    href: 'advogado-criminalista/santaluzia.html' },
      { label: 'Vespasiano',     href: 'advogado-criminalista/vespasiano.html' },
      { label: 'Esmeraldas',     href: 'advogado-criminalista/esmeraldas.html' },
      { label: 'Igarapé',        href: 'advogado-criminalista/igarape.html' },
      { label: 'Brumadinho',     href: 'advogado-criminalista/brumadinho.html' }
    ],
    cidadesHub: { label: 'Ver todas as regiões atendidas', href: 'advogado-criminalista/' },

    servicos: [
      { label: 'Audiência de Custódia',    href: 'defesa-criminal/audiencia-custodia.html' },
      { label: 'Tribunal do Júri',         href: 'defesa-criminal/defesa-tribunal-do-juri-guia-completo.html' },
      { label: 'Execução Penal (SEEU)',     href: 'defesa-criminal/execucao-penal-progressao-regime-remicao.html' },
      { label: 'Habeas Corpus / Liminares',href: 'defesa-criminal/habeas-corpus-guia-impetracao-liminar.html' },
      { label: 'Nulidades Processuais',    href: 'defesa-criminal/nulidade-processual-penal-defesa-absolvicao.html' },
      { label: 'Defesa Lei de Drogas',     href: 'defesa-criminal/trafico-de-drogas-defesa-desclassificacao-privilegiado.html' }
    ],

    sistemas: [
      { label: 'RADAR DE NOTÍCIAS',  href: 'noticias.html' },
      { label: 'CALCULADORA PENAL',  href: 'legal-tech/calculadora-prescricao.html' },
      { label: 'SISTEMA ANJO',       href: 'portal-investidor.html' }
    ],

    social: [
      { icon: 'fab fa-instagram',   href: 'https://www.instagram.com/lucasrenansemim/',         label: 'Instagram de Lucas Semim', tracking: 'Social_Instagram' },
      { icon: 'fab fa-linkedin-in', href: 'https://www.linkedin.com/in/lucas-renan-a2a52910b/', label: 'LinkedIn de Lucas Semim',  tracking: 'Social_LinkedIn' },
      { icon: 'fab fa-whatsapp',    href: 'https://wa.me/5531989420094',                        label: 'WhatsApp — Plantão 24h',   tracking: 'Social_WhatsApp' },
      { icon: 'fas fa-gavel',       href: 'https://lucasrenansemim.jusbrasil.com.br/',           label: 'Perfil Jusbrasil',         tracking: 'Social_Jusbrasil' }
    ],

    trust: [
      { icon: 'fas fa-shield-halved', text: 'Registro ',  bold: 'OAB/MG 222.539' },
      { icon: 'fas fa-map-pin',       text: 'Sabará & ',  bold: 'Comarca BH/MG' },
      { icon: 'fas fa-clock',         text: 'Plantão ',   bold: '24h · 7 dias' },
      { icon: 'fas fa-lock',          text: 'Sigilo ',    bold: 'profissional' }
    ]
  },

  state: {
    base:          '',
    footerEl:      null,
    reducedMotion: false
  },

  /* ── INICIALIZAÇÃO ─────────────────────────────────────────── */

  init() {
    try {
      this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.state.base = this.getBasePath();
      this.injectStyles();
      this.build();
      this.initScrollReveal();
      this.injectSchema();

      // BUGFIX 1: window.location.hostname (não location.hostname solto)
      if (window.location.hostname !== 'lucassemim.adv.br') {
        console.log('⚖️ [FooterElite V4] Injetado · Base:', this.state.base || '(root)');
      }
    } catch (e) {
      if (window.location.hostname !== 'lucassemim.adv.br') console.error('[FooterElite V4]', e);
    }
  },

  getBasePath() {
    const path  = window.location.pathname;
    const isDir = path.endsWith('/') || !path.split('/').pop().includes('.');
    const parts = path.split('/').filter(Boolean);
    const depth = isDir ? parts.length : Math.max(0, parts.length - 1);
    return depth === 0 ? '' : '../'.repeat(depth);
  },

  /* ── CSS PREMIUM BLACK & GOLD ──────────────────────────────── */

  injectStyles() {
    if (document.getElementById('semim-footer-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'semim-footer-styles';
    styleEl.textContent = `

      /* BUGFIX 4: CSS vars sem auto-referência — valores diretos */
      :root {
        --ft-ouro:        #d4af37;
        --ft-ouro-light:  #e8c84a;
        --ft-ouro-dim:    rgba(212,175,55,0.07);
        --ft-ouro-border: rgba(212,175,55,0.22);
        --ft-preto:       #040404;
        --ft-preto-mid:   #080808;
        --ft-text-dim:    #555;
        --ft-text-mid:    #888;
        --ft-text-lite:   #bbb;
        --ff-display:     'Teko', sans-serif;
        --ff-body:        'Lato', sans-serif;
      }

      /* ── Wrapper principal ── */
      .footer-semim {
        background: var(--ft-preto);
        color: var(--ft-text-mid);
        font-family: var(--ff-body);
        position: relative;
        overflow: hidden;
        opacity: 0;
        transform: translateY(24px);
        transition: opacity 0.7s ease, transform 0.6s ease;
      }
      .footer-semim.footer-visible {
        opacity: 1; transform: translateY(0);
      }
      @media (prefers-reduced-motion: reduce) {
        .footer-semim { opacity: 1; transform: none; transition: none; }
      }

      /* ── Textura de fundo luxury (linhas diagonais douradas) ── */
      .footer-semim::after {
        content: '';
        position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background-image: repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 48px,
          rgba(212,175,55,0.018) 48px,
          rgba(212,175,55,0.018) 50px
        );
      }

      /* ── Shimmer dourado no topo — luxury accent ── */
      .footer-semim::before {
        content: '';
        position: absolute; top: 0; left: -100%; width: 300%; height: 3px; z-index: 2;
        background: linear-gradient(
          90deg,
          transparent 0%,
          rgba(212,175,55,0.15) 20%,
          #d4af37 50%,
          rgba(212,175,55,0.15) 80%,
          transparent 100%
        );
        animation: ftShimmer 4s ease-in-out infinite;
      }
      @keyframes ftShimmer {
        0%   { left: -100%; }
        100% { left: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .footer-semim::before {
          animation: none; left: 0; width: 100%;
          background: linear-gradient(90deg, transparent, #d4af37, transparent);
        }
      }

      /* Garantir que conteúdo fica acima das pseudo-camadas */
      .footer-semim > * { position: relative; z-index: 1; }

      /* ── CTA Strip premium ── */
      .footer-cta-strip {
        background: linear-gradient(135deg,
          rgba(100,0,0,0.18) 0%,
          rgba(80,0,0,0.12) 50%,
          rgba(100,0,0,0.18) 100%
        );
        border-top: 1px solid rgba(139,0,0,0.3);
        border-bottom: 1px solid rgba(212,175,55,0.1);
        padding: 52px 0 48px;
        text-align: center;
        position: relative;
      }
      /* Cantos dourados decorativos */
      .footer-cta-strip::before,
      .footer-cta-strip::after {
        content: ''; position: absolute; width: 40px; height: 40px;
        border-color: rgba(212,175,55,0.3);
        border-style: solid; border-width: 0;
      }
      .footer-cta-strip::before { top: 20px; left: 30px; border-top-width: 1px; border-left-width: 1px; }
      .footer-cta-strip::after  { bottom: 20px; right: 30px; border-bottom-width: 1px; border-right-width: 1px; }
      @media (max-width: 575px) {
        .footer-cta-strip::before,
        .footer-cta-strip::after { display: none; }
      }

      .footer-cta-eyebrow {
        font-family: var(--ff-body);
        font-size: 0.72rem; font-weight: 700;
        letter-spacing: 3px; color: var(--ft-ouro);
        text-transform: uppercase; margin-bottom: 12px; opacity: 0.8;
        display: block;
      }
      .footer-cta-strip h3 {
        font-family: var(--ff-display); font-size: 2.4rem;
        font-weight: 500; color: #f0ede8;
        margin-bottom: 10px; line-height: 1.1;
        letter-spacing: 0.5px;
      }
      .footer-cta-strip h3 span { color: var(--ft-ouro); }
      .footer-cta-strip p {
        color: var(--ft-text-mid); font-size: 1rem;
        margin-bottom: 8px; line-height: 1.5;
      }
      .footer-cta-urgencia {
        display: inline-flex; align-items: center; gap: 7px;
        background: rgba(46,204,113,0.08);
        border: 1px solid rgba(46,204,113,0.25);
        border-radius: 50px; padding: 5px 14px;
        font-size: 0.78rem; color: #2ecc71;
        font-weight: 700; letter-spacing: 0.5px;
        text-transform: uppercase; margin-bottom: 26px;
        display: inline-flex;
      }
      .footer-cta-dot {
        width: 7px; height: 7px; background: #2ecc71;
        border-radius: 50%; flex-shrink: 0;
        animation: ftDotPulse 1.5s ease-in-out infinite;
      }
      @keyframes ftDotPulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(46,204,113,0.5); }
        50%      { box-shadow: 0 0 0 5px rgba(46,204,113,0); }
      }
      @media (prefers-reduced-motion: reduce) { .footer-cta-dot { animation: none; } }

      /* ── Botões CTA ── */
      .footer-btn-wpp {
        display: inline-flex; align-items: center; gap: 10px;
        background: linear-gradient(135deg, #128c7e, #075e54);
        color: #fff !important;
        font-family: var(--ff-display); font-size: 1.35rem; letter-spacing: 1px;
        padding: 14px 32px; border-radius: 5px; text-decoration: none;
        transition: transform 0.2s, box-shadow 0.3s;
        box-shadow: 0 4px 20px rgba(18,140,126,0.25);
        text-transform: uppercase;
      }
      .footer-btn-wpp:hover { transform: translateY(-3px); box-shadow: 0 10px 35px rgba(18,140,126,0.4); color: #fff !important; }
      .footer-btn-wpp:focus-visible { outline: 2px solid #2ecc71; outline-offset: 3px; }

      .footer-btn-agendar {
        display: inline-flex; align-items: center; gap: 10px;
        background: transparent; color: var(--ft-ouro) !important;
        font-family: var(--ff-display); font-size: 1.25rem; letter-spacing: 1px;
        padding: 13px 28px; border-radius: 5px;
        border: 1px solid var(--ft-ouro-border);
        text-decoration: none; transition: background 0.25s, transform 0.2s, border-color 0.25s;
        text-transform: uppercase;
      }
      .footer-btn-agendar:hover { background: var(--ft-ouro-dim); transform: translateY(-2px); border-color: var(--ft-ouro); color: var(--ft-ouro) !important; }
      .footer-btn-agendar:focus-visible { outline: 2px solid var(--ft-ouro); outline-offset: 3px; }

      /* ── Body do footer ── */
      .footer-body { padding: 64px 0 48px; }

      /* Separador dourado entre colunas (desktop) */
      .footer-body .row > [class*="col-lg"]:not(:last-child) {
        border-right: 1px solid rgba(212,175,55,0.06);
      }
      @media (max-width: 991px) {
        .footer-body .row > [class*="col-lg"] { border-right: none; }
      }

      /* ── Coluna identidade ── */
      .footer-brand-mark {
        display: flex; align-items: center; justify-content: center;
        width: 52px; height: 52px; border-radius: 50%;
        border: 1px solid var(--ft-ouro-border);
        background: var(--ft-ouro-dim);
        margin-bottom: 16px;
      }
      .footer-brand-mark i { color: var(--ft-ouro); font-size: 1.4rem; }
      .footer-brand-name { font-family: var(--ff-display); font-size: 1.25rem; font-weight: 700; color: #f0ede8; letter-spacing: 1px; display: block; margin-bottom: 2px; }
      .footer-brand-sub  { font-family: var(--ff-display); font-size: 1.05rem; letter-spacing: 2.5px; color: var(--ft-ouro); display: block; margin-bottom: 14px; opacity: 0.85; }

      .footer-tagline {
        font-size: 0.88rem; line-height: 1.7; color: #4a4a47;
        border-left: 2px solid var(--ft-ouro-border);
        padding-left: 12px; margin-bottom: 18px; font-style: italic;
      }

      .footer-info-line { display: flex; align-items: center; gap: 10px; font-size: 0.88rem; color: var(--ft-text-dim); margin-bottom: 9px; }
      .footer-info-line i { color: var(--ft-ouro); flex-shrink: 0; width: 14px; text-align: center; }
      .footer-info-line a { color: var(--ft-text-dim); text-decoration: none; transition: color 0.2s; }
      .footer-info-line a:hover { color: var(--ft-ouro); }

      .footer-oab-badge {
        display: inline-flex; align-items: center; gap: 8px;
        background: rgba(212,175,55,0.05);
        border: 1px solid var(--ft-ouro-border);
        border-radius: 5px; padding: 10px 16px; margin-top: 14px;
        font-family: var(--ff-display); font-size: 1.1rem;
        color: var(--ft-ouro); letter-spacing: 1px;
        transition: background 0.25s;
      }
      .footer-oab-badge:hover { background: var(--ft-ouro-dim); }

      /* ── Colunas de links ── */
      .footer-col-title {
        font-family: var(--ff-display); font-size: 1.45rem; font-weight: 600;
        color: #e8e6e0; letter-spacing: 1.5px; text-transform: uppercase;
        border-left: 3px solid var(--ft-ouro);
        padding-left: 11px; margin-bottom: 20px; line-height: 1.2;
      }

      /* Links com seta dourada sutil no hover */
      .footer-link {
        display: flex; align-items: center; gap: 0;
        color: var(--ft-text-dim); text-decoration: none;
        font-size: 0.88rem; padding: 5px 0;
        border-bottom: 1px solid #0e0e0e;
        transition: color 0.2s, padding-left 0.2s, gap 0.2s;
        position: relative;
      }
      .footer-link::before {
        content: '›'; color: var(--ft-ouro); opacity: 0;
        font-size: 1rem; line-height: 1;
        transition: opacity 0.2s, margin-right 0.2s;
        margin-right: 0; display: inline-block;
      }
      .footer-link:hover { color: var(--ft-ouro); padding-left: 6px; }
      .footer-link:hover::before { opacity: 1; margin-right: 4px; }

      .footer-cities-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; }

      .footer-link-hub {
        color: var(--ft-ouro); font-weight: 700; margin-top: 12px;
        justify-content: space-between; border-bottom-color: rgba(212,175,55,0.12);
      }
      .footer-link-hub i { font-size: 0.75rem; transition: transform 0.2s; }
      .footer-link-hub:hover { padding-left: 0; }
      .footer-link-hub:hover i { transform: translateX(3px); }
      .footer-link-hub::before { display: none; }

      /* Botões de sistema */
      .footer-btn-sistema {
        display: block; text-align: center;
        font-family: var(--ff-display); font-size: 1.05rem; letter-spacing: 1px;
        padding: 9px; border-radius: 4px;
        border: 1px solid #1a1a1a; color: var(--ft-text-dim) !important;
        text-decoration: none; margin-bottom: 9px;
        transition: border-color 0.25s, color 0.25s, background 0.25s;
        text-transform: uppercase;
      }
      .footer-btn-sistema:hover { border-color: var(--ft-ouro-border); color: var(--ft-ouro) !important; background: var(--ft-ouro-dim); }

      /* Redes sociais */
      .footer-social-links { display: flex; gap: 12px; margin-top: 20px; flex-wrap: wrap; }
      .footer-social-link {
        display: flex; align-items: center; justify-content: center;
        width: 38px; height: 38px; border-radius: 50%;
        border: 1px solid #1c1c1c; color: #555 !important;
        text-decoration: none; font-size: 0.95rem;
        transition: border-color 0.25s, color 0.25s, background 0.25s, transform 0.2s;
      }
      .footer-social-link:hover { border-color: var(--ft-ouro); color: var(--ft-ouro) !important; background: var(--ft-ouro-dim); transform: translateY(-3px); }
      .footer-social-link:focus-visible { outline: 2px solid var(--ft-ouro); outline-offset: 3px; }

      /* ── Trust Strip luxury ── */
      .footer-trust-strip {
        border-top: 1px solid #101010;
        border-bottom: 1px solid #101010;
        padding: 22px 0;
        background: rgba(212,175,55,0.012);
      }
      .footer-trust-item { display: flex; align-items: center; gap: 10px; justify-content: center; }
      .footer-trust-item i { color: var(--ft-ouro); font-size: 1rem; flex-shrink: 0; }
      .footer-trust-item span { font-size: 0.82rem; color: #484845; }
      .footer-trust-item strong { color: #767672; }

      /* Separadores verticais entre itens de trust */
      .footer-trust-divider {
        width: 1px; height: 28px; background: rgba(212,175,55,0.1);
        flex-shrink: 0;
      }
      @media (max-width: 767px) {
        .footer-trust-divider { display: none; }
        .footer-trust-item { flex-direction: column; gap: 4px; text-align: center; }
      }

      /* ── Legal bar ── */
      .footer-legal {
        padding: 18px 0;
        background: rgba(0,0,0,0.3);
        text-align: center;
        border-top: 1px solid #0c0c0c;
      }
      .footer-legal p { font-size: 0.78rem; color: var(--ft-text-mid); margin: 0; line-height: 1.6; }
      .footer-legal p + p { margin-top: 6px; }
      .footer-legal a { color: var(--ft-text-mid); text-decoration: none; transition: color 0.2s; }
      .footer-legal a:hover, .footer-legal a:focus-visible { color: var(--ft-ouro); }
      .footer-legal-ia a { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: rgba(212,175,55,0.45); }
      .footer-legal-gold { color: rgba(212,175,55,0.3); margin: 0 6px; }

      /* ── Responsive ── */
      @media (max-width: 991px) {
        .footer-body { padding: 44px 0 32px; }
        .footer-cta-strip h3 { font-size: 1.9rem; }
        .footer-cta-strip .d-flex { flex-direction: column; align-items: center; gap: 12px; }
        .footer-btn-wpp, .footer-btn-agendar { width: 100%; max-width: 340px; justify-content: center; }
      }
      @media (max-width: 575px) {
        .footer-cta-strip h3 { font-size: 1.6rem; }
        .footer-cities-grid { grid-template-columns: 1fr 1fr; }
      }
    `;
    document.head.appendChild(styleEl);
  },

  /* ── BUILD ─────────────────────────────────────────────────── */

  build() {
    const footer = document.createElement('footer');
    footer.className = 'footer-semim';
    footer.setAttribute('role', 'contentinfo');
    footer.setAttribute('itemscope', '');
    footer.setAttribute('itemtype', 'https://schema.org/WPFooter');

    footer.appendChild(this.buildCtaStrip());
    footer.appendChild(this.buildBody());
    footer.appendChild(this.buildTrustStrip());
    footer.appendChild(this.buildLegal());

    const target = document.getElementById(this.config.injectTarget);
    if (target) target.appendChild(footer);
    else        document.body.appendChild(footer);

    this.state.footerEl = footer;
  },

  /* ── CTA STRIP ─────────────────────────────────────────────── */

  buildCtaStrip() {
    const strip = document.createElement('div');
    strip.className = 'footer-cta-strip';

    const container = document.createElement('div');
    container.className = 'container';

    // Eyebrow
    const eyebrow = document.createElement('span');
    eyebrow.className = 'footer-cta-eyebrow';
    eyebrow.textContent = 'Defesa Criminal de Urgência';

    // Título com destaque dourado
    const h3 = document.createElement('h3');
    const h3txt = document.createTextNode('Preso? Familiar em ');
    const h3span = document.createElement('span');
    h3span.textContent = 'Flagrante Agora?';
    h3.appendChild(h3txt);
    h3.appendChild(h3span);

    const p = document.createElement('p');
    p.textContent = 'O Dr. Lucas Semim atende 24 horas — inclusive em delegacias, fins de semana e feriados.';

    // Badge de urgência com pulsação ao vivo
    const urgBadge = document.createElement('div');
    urgBadge.className = 'footer-cta-urgencia';
    const dot = document.createElement('span');
    dot.className = 'footer-cta-dot';
    dot.setAttribute('aria-hidden', 'true');
    urgBadge.appendChild(dot);
    urgBadge.appendChild(document.createTextNode('Plantão criminal 24h'));

    const btnRow = document.createElement('div');
    btnRow.className = 'd-flex justify-content-center gap-3 flex-wrap';

    const btnWpp = document.createElement('a');
    btnWpp.href = this.config.whatsapp;
    btnWpp.target = '_blank';
    btnWpp.rel = 'noopener noreferrer';
    btnWpp.className = 'footer-btn-wpp';
    btnWpp.setAttribute('aria-label', 'Contato via WhatsApp — Plantão 24 horas');
    // BUGFIX 5,6,7,8: ícones FA 6 corretos
    btnWpp.appendChild(this.buildIcon('fab fa-whatsapp'));
    btnWpp.appendChild(document.createTextNode(' WHATSAPP · PLANTÃO 24H'));
    btnWpp.addEventListener('click', () => this.trackClick('Footer_CTA_WhatsApp', 'whatsapp'));

    const btnAgendar = document.createElement('a');
    btnAgendar.href = this.config.calLink;
    btnAgendar.target = '_blank';
    btnAgendar.rel = 'noopener noreferrer';
    btnAgendar.className = 'footer-btn-agendar';
    btnAgendar.setAttribute('aria-label', 'Agendar consulta com Dr. Lucas Semim');
    // BUGFIX 8: fa-calendar-days (FA 6) em vez de fa-calendar-alt (FA 5)
    btnAgendar.appendChild(this.buildIcon('far fa-calendar-days'));
    btnAgendar.appendChild(document.createTextNode(' AGENDAR CONSULTA'));
    btnAgendar.addEventListener('click', () => this.trackClick('Footer_CTA_Agendar', 'agendamento'));

    btnRow.appendChild(btnWpp);
    btnRow.appendChild(btnAgendar);

    container.appendChild(eyebrow);
    container.appendChild(h3);
    container.appendChild(p);
    container.appendChild(urgBadge);
    container.appendChild(btnRow);
    strip.appendChild(container);

    return strip;
  },

  /* ── BODY ──────────────────────────────────────────────────── */

  buildBody() {
    const bodyDiv   = document.createElement('div');
    bodyDiv.className = 'footer-body';

    const container = document.createElement('div');
    container.className = 'container';

    const row = document.createElement('div');
    row.className = 'row g-5';

    row.appendChild(this.buildColIdentidade());
    row.appendChild(this.buildColCidades());
    row.appendChild(this.buildColServicos());
    row.appendChild(this.buildColSistemas());

    container.appendChild(row);
    bodyDiv.appendChild(container);
    return bodyDiv;
  },

  /* ── COL IDENTIDADE ─────────────────────────────────────────── */

  buildColIdentidade() {
    const col = document.createElement('div');
    col.className = 'col-lg-4 col-md-6';

    // Selo brasão + nome — mesmo lockup do cabeçalho (sem depender de arquivo de logo)
    const brandMark = document.createElement('div');
    brandMark.className = 'footer-brand-mark';
    brandMark.appendChild(this.buildIcon('fas fa-scale-balanced'));

    const brandName = document.createElement('span');
    brandName.className = 'footer-brand-name';
    brandName.textContent = 'SEMIM & ASSOCIADOS';

    const brandSub = document.createElement('span');
    brandSub.className = 'footer-brand-sub';
    brandSub.textContent = 'ADVOCACIA CRIMINAL';

    const tagline = document.createElement('p');
    tagline.className = 'footer-tagline';
    tagline.textContent = 'Advocacia criminal em Sabará e Belo Horizonte: defesa técnica em delegacias, audiências e processos, com sigilo profissional.';

    const oabBadge = document.createElement('div');
    oabBadge.className = 'footer-oab-badge';
    // BUGFIX 5: fa-shield-halved (FA 6) em vez de fa-shield-alt (FA 5)
    oabBadge.appendChild(this.buildIcon('fas fa-shield-halved'));
    oabBadge.appendChild(document.createTextNode(' OAB/MG 222.539'));

    col.appendChild(brandMark);
    col.appendChild(brandName);
    col.appendChild(brandSub);
    col.appendChild(tagline);

    // BUGFIX 6: fa-location-dot (FA 6) em vez de fa-map-marker-alt (FA 5)
    col.appendChild(this.buildInfoLine('fas fa-location-dot', 'R. Cel. Abílio Pereira, 337 · Sabará/MG'));
    // BUGFIX 7: fa-phone (FA 6) em vez de fa-phone-alt (FA 5)
    col.appendChild(this.buildInfoLine('fas fa-phone', '(31) 98942-0094', 'tel:+5531989420094'));
    col.appendChild(this.buildInfoLine('fas fa-clock', 'Plantão Criminal 24h · 7 dias'));
    col.appendChild(oabBadge);

    return col;
  },

  /* ── COL CIDADES ────────────────────────────────────────────── */

  buildColCidades() {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-6';

    const title = document.createElement('h3');
    title.className = 'footer-col-title';
    title.textContent = 'Comarcas Atendidas';

    const grid = document.createElement('div');
    grid.className = 'footer-cities-grid';

    this.config.cidades.forEach(({ label, href }) => {
      grid.appendChild(this.buildLink(href, label, 'footer-link'));
    });

    col.appendChild(title);
    col.appendChild(grid);

    if (this.config.cidadesHub) {
      const hubLink = this.buildLink(this.config.cidadesHub.href, this.config.cidadesHub.label, 'footer-link footer-link-hub');
      hubLink.appendChild(this.buildIcon('fas fa-arrow-right'));
      col.appendChild(hubLink);
    }

    return col;
  },

  /* ── COL SERVIÇOS ───────────────────────────────────────────── */

  buildColServicos() {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-6';

    const title = document.createElement('h3');
    title.className = 'footer-col-title';
    title.textContent = 'Áreas de Atuação';

    const ul = document.createElement('ul');
    ul.className = 'list-unstyled';

    this.config.servicos.forEach(({ label, href }) => {
      const li = document.createElement('li');
      li.appendChild(this.buildLink(href, label, 'footer-link'));
      ul.appendChild(li);
    });

    col.appendChild(title);
    col.appendChild(ul);
    return col;
  },

  /* ── COL SISTEMAS ───────────────────────────────────────────── */

  buildColSistemas() {
    const col = document.createElement('div');
    col.className = 'col-lg-2 col-md-6';

    const title = document.createElement('h3');
    title.className = 'footer-col-title';
    title.textContent = 'Recursos';
    col.appendChild(title);

    this.config.sistemas.forEach(({ label, href }) => {
      col.appendChild(this.buildLink(href, label, 'footer-btn-sistema'));
    });

    const socialDiv = document.createElement('div');
    socialDiv.className = 'footer-social-links';

    this.config.social.forEach(({ icon, href, label, tracking }) => {
      const a = document.createElement('a');
      a.href   = href;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';
      a.className = 'footer-social-link';
      a.setAttribute('aria-label', label);
      a.appendChild(this.buildIcon(icon));
      a.addEventListener('click', () => this.trackClick(tracking, 'social'));
      socialDiv.appendChild(a);
    });

    col.appendChild(socialDiv);
    return col;
  },

  /* ── TRUST STRIP ────────────────────────────────────────────── */

  buildTrustStrip() {
    const strip     = document.createElement('div');
    strip.className = 'footer-trust-strip';

    const container = document.createElement('div');
    container.className = 'container';

    const inner = document.createElement('div');
    inner.className = 'd-flex align-items-center justify-content-center flex-wrap gap-3';

    this.config.trust.forEach(({ icon, text, bold }, idx) => {
      const item = document.createElement('div');
      item.className = 'footer-trust-item';

      const iconEl = this.buildIcon(icon);
      const span   = document.createElement('span');
      const strong = document.createElement('strong');
      strong.textContent = bold;
      span.textContent = text;
      span.appendChild(strong);

      item.appendChild(iconEl);
      item.appendChild(span);
      inner.appendChild(item);

      // Separador dourado entre itens (exceto após o último)
      if (idx < this.config.trust.length - 1) {
        const div = document.createElement('div');
        div.className = 'footer-trust-divider';
        div.setAttribute('aria-hidden', 'true');
        inner.appendChild(div);
      }
    });

    container.appendChild(inner);
    strip.appendChild(container);
    return strip;
  },

  /* ── LEGAL BAR ─────────────────────────────────────────────── */

  buildLegal() {
    const div = document.createElement('div');
    div.className = 'footer-legal';

    const container = document.createElement('div');
    container.className = 'container';

    const p = document.createElement('p');

    // ©
    const copy = document.createTextNode(
      `© ${new Date().getFullYear()} Semim & Associados · Advocacia Criminal`
    );

    const sep1 = document.createElement('span');
    sep1.className = 'footer-legal-gold';
    sep1.setAttribute('aria-hidden', 'true');
    sep1.textContent = '◆';

    const sep2 = document.createElement('span');
    sep2.className = 'footer-legal-gold';
    sep2.setAttribute('aria-hidden', 'true');
    sep2.textContent = '◆';

    p.appendChild(copy);
    p.appendChild(sep1);
    p.appendChild(this.buildLink('politica-privacidade.html', 'Política de Privacidade'));
    p.appendChild(sep2);
    p.appendChild(this.buildLink('sobre-mim.html', 'Dr. Lucas Semim · OAB/MG 222.539'));

    container.appendChild(p);

    // Transparência: site conduzido com agentes de IA + registro da atualização
    const t = this.config.transparencia;
    if (t) {
      const pIa = document.createElement('p');
      pIa.className = 'footer-legal-ia';
      pIa.appendChild(this.buildLink(t.href, t.label));
      container.appendChild(pIa);
    }
    const u = this.config.atualizacao;
    if (u) {
      const pVer = document.createElement('p');
      pVer.className = 'footer-legal-ver';
      pVer.textContent = `Software jurídico · Atualização nº ${u.numero} · ${u.data} · ${u.texto}`;
      container.appendChild(pVer);
    }

    div.appendChild(container);
    return div;
  },

  /* ── HELPERS ────────────────────────────────────────────────── */

  buildLink(href, text, className = '', attrs = {}) {
    const a  = document.createElement('a');
    a.href   = href.startsWith('http') ? href : `${this.state.base}${href}`;
    a.className = className;
    a.textContent = text;

    if (href.startsWith('http')) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    Object.entries(attrs).forEach(([k, v]) => a.setAttribute(k, v));
    return a;
  },

  buildIcon(classes) {
    const i = document.createElement('i');
    i.className = classes;
    i.setAttribute('aria-hidden', 'true');
    return i;
  },

  buildInfoLine(iconClass, content, linkHref = null) {
    const div = document.createElement('div');
    div.className = 'footer-info-line';
    div.appendChild(this.buildIcon(iconClass));

    if (linkHref) {
      const a = document.createElement('a');
      a.href = linkHref;
      a.textContent = content;
      div.appendChild(a);
    } else {
      const span = document.createElement('span');
      span.textContent = content;
      div.appendChild(span);
    }
    return div;
  },

  /* ── SCROLL REVEAL ──────────────────────────────────────────── */

  initScrollReveal() {
    const footer = this.state.footerEl;
    if (!footer) return;

    if (this.state.reducedMotion || !('IntersectionObserver' in window)) {
      footer.classList.add('footer-visible');
      return;
    }

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('footer-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04 });

    obs.observe(footer);
  },

  /* ── SCHEMA ─────────────────────────────────────────────────── */

  injectSchema() {
    window._schemaRegistry = window._schemaRegistry || new Set();
    const id = 'footer-localbusiness';
    if (window._schemaRegistry.has(id)) return;
    if (document.querySelector(`script[data-schema-id="${id}"]`)) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type':    'LegalService',
      '@id':      'https://lucassemim.adv.br/#escritorio',
      'name':         'Semim & Associados Advocacia Criminal',
      'url':          'https://lucassemim.adv.br',
      'telephone':    '+5531989420094',
      'openingHours': 'Mo-Su 00:00-23:59',
      'address': {
        '@type':           'PostalAddress',
        'streetAddress':   'R. Cel. Abílio Pereira, 337',
        'addressLocality': 'Sabará',
        'addressRegion':   'MG',
        'postalCode':      '34575-020',
        'addressCountry':  'BR'
      },
      'geo': {
        '@type':     'GeoCoordinates',
        'latitude':  -19.8878,
        'longitude': -43.8069
      },
      'sameAs': [
        'https://www.instagram.com/lucasrenansemim/',
        'https://www.linkedin.com/in/lucas-renan-a2a52910b/',
        'https://lucasrenansemim.jusbrasil.com.br/'
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-schema-id', id);
    script.setAttribute('data-source', 'footer-seo-v4');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    window._schemaRegistry.add(id);
  },

  /* ── GA4 (BUGFIX 3: window.gtag) ───────────────────────────── */

  trackClick(label, tipo) {
    try {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', 'footer_click', {
        event_category: 'Footer_Elite',
        event_label:    label,
        tipo_contato:   tipo,
        pagina_origem:  window.location.pathname
      });
    } catch { }
  }
};

document.addEventListener('DOMContentLoaded', () => window.FooterSeo.init());

/* Aviso temporario de troca de WhatsApp removido em 08/10/2026 (numero definitivo no ar). */
