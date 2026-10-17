/* =========================================================== */
/* === ARQUIVO: js/header-elite.js (HeaderElite V5)         === */
/* === FUNÇÃO: Cabeçalho ÚNICO do site (todas as páginas)   === */
/* ===                                                       === */
/* === V5 (15/10/2026) — o que mudou em relação ao V4:       === */
/* ===  - um só cabeçalho para o site inteiro (o js/logo-elite.js e o css/header-lux.css === */
/* ===    viraram atalhos deste arquivo);                      === */
/* ===  - HTML semântico: <header> + <nav aria-label> + listas <ul>/<li>/<a href> reais; === */
/* ===  - submenus "Defesa Criminal" e "Comarcas" (links reais para os guias e as 17 páginas de cidade); === */
/* ===  - versão celular em gaveta (ESC, foco preso, trava de rolagem); === */
/* ===  - ícones em SVG embutido (não depende mais do Font Awesome); === */
/* ===  - botão "Plantão 24h" em destaque, telefone e Área do Cliente mantidos; === */
/* ===  - altura fixa 78px (>=992px) / 66px (<992px) = valores que os CSS das páginas já assumem; === */
/* ===  - respeita "reduzir movimento" do sistema operacional.  === */
/* === Mantidos do V4: HeroCinematic e registro do service worker (final deste arquivo), === */
/* === eventos do GA4 (Header_Elite), ticker de emergência, selo de contexto. === */
/* =========================================================== */

(function () {
  'use strict';

  /* ── utilitários ───────────────────────────────────────────── */

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === false || v === null || v === undefined) return;
        if (k === 'class') n.className = v;
        else if (k === 'text') n.textContent = v;
        else n.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (kids || []).forEach(function (c) {
      if (!c) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }

  /* Ícones: marcação estática (constantes deste arquivo, nenhum dado de usuário). */
  var ICON = {
    whatsapp: '<path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><circle cx="12" cy="10.5" r="2"/><path d="M12 12.5v3"/>',
    chevron: '<polyline points="6 9 12 15 18 9"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    arrow: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>'
  };

  function icon(name, cls) {
    var wrap = document.createElement('span');
    var fill = name === 'whatsapp';
    wrap.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"' +
      (fill ? '' : ' fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"') +
      (cls ? ' class="' + cls + '"' : '') + '>' + ICON[name] + '</svg>';
    return wrap.firstChild;
  }

  /* Balança (marca): pratos oscilando em SMIL; versão estática quando o usuário pede "reduzir movimento". */
  function balancaSVG(animated) {
    var spl = 'calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"';
    var a = function (vals, c) {
      return animated ? '<animateTransform attributeName="transform" type="rotate" values="' + vals + '" dur="6s" repeatCount="indefinite" ' + spl + '/>' : '';
    };
    return '' +
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" focusable="false" aria-hidden="true">' +
      '<defs><linearGradient id="shGold" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#f6e7a6"/><stop offset="0.5" stop-color="#d4af37"/><stop offset="1" stop-color="#9a7a16"/>' +
      '</linearGradient></defs>' +
      '<g fill="url(#shGold)" stroke="url(#shGold)">' +
        '<rect x="48.5" y="22" width="3" height="60" rx="1.5" stroke="none"/>' +
        '<path d="M30 88 Q50 80 70 88 L70 92 L30 92 Z" stroke="none"/>' +
        '<circle cx="50" cy="19" r="4" stroke="none"/>' +
        '<g>' + a('-5 50 24;5 50 24;-5 50 24') +
          '<rect x="12" y="22.5" width="76" height="3" rx="1.5" stroke="none"/>' +
          '<g>' + a('5 14 24;-5 14 24;5 14 24') +
            '<path d="M14 24 L4 58 M14 24 L24 58" fill="none" stroke-width="1.2"/>' +
            '<path d="M2 58 H26 Q24 68 14 68 Q4 68 2 58 Z" stroke="none"/>' +
          '</g>' +
          '<g>' + a('5 86 24;-5 86 24;5 86 24') +
            '<path d="M86 24 L76 58 M86 24 L96 58" fill="none" stroke-width="1.2"/>' +
            '<path d="M74 58 H98 Q96 68 86 68 Q76 68 74 58 Z" stroke="none"/>' +
          '</g>' +
        '</g>' +
      '</g>' +
    '</svg>';
  }

  function normPath(p) {
    return (p || '/').replace(/index\.html$/i, '').replace(/\/{2,}/g, '/') || '/';
  }

  /* ── HEADER ────────────────────────────────────────────────── */

  window.HeaderElite = {

    version: 'V5',

    config: {
      brandName:    'Lucas Semim',
      brandTagline: 'Advocacia Criminal',
      brandOab:     'OAB/MG 222.539',
      homeHref:     '/',
      whatsapp:     'https://wa.me/5531989420094?text=Dr.%20Lucas%2C%20preciso%20de%20atendimento%20urgente.',
      telefone:     'tel:+5531989420094',
      telefoneTxt:  '(31) 98942-0094',
      clienteHref:  '/portal/painel-cliente.html',
      breakpoint:   1200,          /* >= : menu em linha · < : gaveta (celular/tablet) */
      scrollThreshold: 8,
      /* faixas fixas no topo de páginas específicas: o cabeçalho desce abaixo delas */
      topStrips:    ['.faixa-custodia-urgente'],

      nav: [
        { id: 'urgencia', label: 'O que fazer agora', href: '/o-que-fazer-agora/', match: ['/o-que-fazer-agora'], alert: true },
        { id: 'defesa', label: 'Defesa Criminal', href: '/artigos.html', match: ['/artigos', '/defesa-criminal'],
          sub: {
            cols: [ { title: 'Guias de defesa', items: [
              ['Audiência de Custódia',     '/defesa-criminal/audiencia-custodia.html'],
              ['Tribunal do Júri',          '/defesa-criminal/defesa-tribunal-do-juri-guia-completo.html'],
              ['Execução Penal (SEEU)',     '/defesa-criminal/execucao-penal-progressao-regime-remicao.html'],
              ['Habeas Corpus e Liminares', '/defesa-criminal/habeas-corpus-guia-impetracao-liminar.html'],
              ['Nulidades Processuais',     '/defesa-criminal/nulidade-processual-penal-defesa-absolvicao.html'],
              ['Defesa em Lei de Drogas',   '/defesa-criminal/trafico-de-drogas-defesa-desclassificacao-privilegiado.html']
            ] } ],
            all: { label: 'Ver todos os guias', href: '/artigos.html' }
          } },
        { id: 'comarcas', label: 'Comarcas', href: '/advogado-criminalista/', match: ['/advogado-criminalista'],
          sub: {
            cols: [
              { title: 'Sabará e Belo Horizonte', items: [
                ['Sabará',         '/advogado-criminalista/sabara.html'],
                ['Belo Horizonte', '/advogado-criminalista/belohorizonte.html'],
                ['Barreiro (BH)',  '/advogado-criminalista/barreiro.html']
              ] },
              { title: 'Grande Belo Horizonte', twoCols: true, items: [
                ['Contagem',           '/advogado-criminalista/contagem.html'],
                ['Betim',              '/advogado-criminalista/betim.html'],
                ['Santa Luzia',        '/advogado-criminalista/santaluzia.html'],
                ['Ribeirão das Neves', '/advogado-criminalista/neves.html'],
                ['Nova Lima',          '/advogado-criminalista/novalima.html'],
                ['Vespasiano',         '/advogado-criminalista/vespasiano.html'],
                ['Ibirité',            '/advogado-criminalista/ibirite.html'],
                ['Esmeraldas',         '/advogado-criminalista/esmeraldas.html'],
                ['Caeté',              '/advogado-criminalista/caete.html'],
                ['Lagoa Santa',        '/advogado-criminalista/lagoasanta.html'],
                ['Pedro Leopoldo',     '/advogado-criminalista/pedroleopoldo.html'],
                ['São José da Lapa',   '/advogado-criminalista/saojosedalapa.html'],
                ['Igarapé',            '/advogado-criminalista/igarape.html'],
                ['Brumadinho',         '/advogado-criminalista/brumadinho.html']
              ] }
            ],
            all: { label: 'Todas as comarcas atendidas', href: '/advogado-criminalista/' }
          } },
        { id: 'solucoes', label: 'Soluções', href: '/solucoes.html', match: ['/solucoes'] },
        { id: 'noticias', label: 'Notícias', href: '/noticias.html', match: ['/noticias', '/news'] },
        { id: 'sobre',    label: 'Dr. Lucas', href: '/sobre-mim.html', match: ['/sobre-mim'] }
      ],

      contextBadges: {
        noticias:   { text: 'Unidade News',   cls: 'sh-badge-news' },
        emergencia: { text: 'Plantão ativo',  cls: 'sh-badge-alert' },
        execucao:   { text: 'Execução penal', cls: 'sh-badge-exec' },
        'default':  null
      }
    },

    state: {
      root: null, nav: null, burger: null, overlay: null,
      menuOpen: false, subOpen: null, hoverTimer: null, lastFocus: null,
      mq: null, scrollTicking: false, reduced: false
    },

    /* ── INICIALIZAÇÃO ───────────────────────────────────────── */

    init: function () {
      try {
        if (document.getElementById('site-header')) return;
        if (!document.body) {
          document.addEventListener('DOMContentLoaded', this.init.bind(this), { once: true });
          return;
        }
        var S = this.state;
        S.reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        S.mq = window.matchMedia ? window.matchMedia('(min-width:' + this.config.breakpoint + 'px)') : null;

        this.removeStale();
        this.ensureFonts();
        this.injectStyles();
        var header = this.build();
        document.body.insertBefore(header, document.body.firstChild);
        S.root = header;
        this.addTicker(header);
        this.removeLegacy();     /* só depois de o novo estar na página: se algo falhar antes, o menu antigo continua */
        this.setActive();
        this.bind();
        this.syncTopOffset();
      } catch (err) {
        if (window.location.hostname !== 'lucassemim.adv.br') console.error('[HeaderElite V5]', err);
      }
    },

    /* ── LIMPEZA ─────────────────────────────────────────────── */

    removeStale: function () {
      /* restos do V4 (caso uma página ainda tenha servido o script antigo do cache) */
      ['header-elite-nav', 'header-elite-styles'].forEach(function (id) {
        var n = document.getElementById(id);
        if (n && n.parentNode) n.parentNode.removeChild(n);
      });
    },

    ensureFonts: function () {
      /* páginas sem Lato/Playfair (ferramentas antigas) ficariam com a fonte do sistema: carrega só o que falta */
      try {
        if (document.getElementById('sh-fonts')) return;
        var links = document.querySelectorAll('link[href*="fonts.googleapis.com"]');
        var has = function (re) {
          for (var i = 0; i < links.length; i++) { if (re.test(links[i].href || '')) return true; }
          return false;
        };
        if (has(/Lato/) && has(/Playfair/)) return;
        var l = document.createElement('link');
        l.id = 'sh-fonts'; l.rel = 'stylesheet';
        l.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Playfair+Display:wght@700&display=swap';
        document.head.appendChild(l);
      } catch (e) { /* sem rede: a fonte do sistema assume */ }
    },

    removeLegacy: function () {
      /* menus estáticos antigos ("SEMIM & ASSOCIADOS", 2 links) das páginas de notícias/ferramentas
         e pontos de montagem vazios do menu antigo. */
      var kill = function (n) { if (n && n.parentNode) n.parentNode.removeChild(n); };
      var olds = document.querySelectorAll('nav.navbar-custom');
      for (var i = 0; i < olds.length; i++) kill(olds[i]);
      var mounts = document.querySelectorAll('#header-master-injecao');
      for (var j = 0; j < mounts.length; j++) {
        if (!mounts[j].children.length && !mounts[j].textContent.trim()) kill(mounts[j]);
      }
    },

    /* ── CONTEXTO DA PÁGINA ──────────────────────────────────── */

    detectContext: function () {
      var path = (window.location.pathname || '').toLowerCase();
      var combined = path + ' ' + (document.title || '').toLowerCase();
      if (path.indexOf('/news/') === 0 || path.indexOf('/noticias') === 0) return 'noticias';
      if (/flagrante|preso|delegacia/.test(combined)) return 'emergencia';
      if (/execucao|saidinha|progressao/.test(combined)) return 'execucao';
      return 'default';
    },

    /* ── CONSTRUÇÃO ──────────────────────────────────────────── */

    build: function () {
      var C = this.config;
      var header = el('header', { id: 'site-header', class: 'sh', 'data-versao': 'v5' });
      var bar = el('div', { class: 'sh-bar' });

      bar.appendChild(this.buildBrand());
      bar.appendChild(this.buildNav());
      bar.appendChild(this.buildActions());
      header.appendChild(bar);

      var overlay = el('div', { class: 'sh-overlay', 'aria-hidden': 'true' });
      header.appendChild(overlay);

      this.state.overlay = overlay;
      this.state.nav = header.querySelector('.sh-nav');
      this.state.burger = header.querySelector('.sh-burger');
      return header;
    },

    buildBrand: function () {
      var C = this.config;
      var a = el('a', {
        class: 'sh-brand', href: C.homeHref,
        'aria-label': C.brandName + ' — ' + C.brandTagline + ' — Página inicial'
      });
      var mark = el('span', { class: 'sh-mark', 'aria-hidden': 'true' });
      mark.innerHTML = balancaSVG(!this.state.reduced);   /* marcação estática deste arquivo */

      var tag = el('span', { class: 'sh-tag' }, [
        el('span', { class: 'sh-tag-a', text: C.brandTagline }),
        el('i', { class: 'sh-sep', 'aria-hidden': 'true', text: '·' }),
        el('b', { class: 'sh-oab', text: C.brandOab })
      ]);
      var badge = this.config.contextBadges[this.detectContext()];
      if (badge) tag.appendChild(el('span', { class: 'sh-badge ' + badge.cls, text: badge.text }));

      var id = el('span', { class: 'sh-id' }, [ el('span', { class: 'sh-name', text: C.brandName }), tag ]);
      a.appendChild(mark);
      a.appendChild(id);
      return a;
    },

    buildNav: function () {
      var C = this.config;
      var nav = el('nav', { class: 'sh-nav', id: 'sh-nav', 'aria-label': 'Menu principal' });

      /* cabeçalho da gaveta (só aparece no celular) */
      var close = el('button', { class: 'sh-close', type: 'button', 'aria-label': 'Fechar menu' }, [ icon('close') ]);
      nav.appendChild(el('div', { class: 'sh-panel-head' }, [ el('span', { class: 'sh-panel-title', text: 'Menu' }), close ]));

      var ul = el('ul', { class: 'sh-list' });
      ul.appendChild(el('li', { class: 'sh-item sh-only-m' }, [
        el('div', { class: 'sh-split' }, [ el('a', { class: 'sh-link', href: C.homeHref, 'data-nav': 'inicio', text: 'Início' }) ])
      ]));

      for (var i = 0; i < C.nav.length; i++) ul.appendChild(this.buildItem(C.nav[i]));
      nav.appendChild(ul);

      /* pilha de contato da gaveta (só aparece no celular) */
      var cta = el('a', { class: 'sh-cta sh-cta-block', href: C.whatsapp, target: '_blank', rel: 'noopener noreferrer', 'data-evt': 'whatsapp_header',
                          'aria-label': 'Falar com o Dr. Lucas Semim pelo WhatsApp — Plantão 24h' }, [
        icon('whatsapp'), el('span', { text: 'WhatsApp · Plantão 24h' }) ]);
      var tel = el('a', { class: 'sh-line', href: C.telefone, 'data-evt': 'tel_header_mobile',
                          'aria-label': 'Ligar para o Dr. Lucas Semim: ' + C.telefoneTxt }, [
        icon('phone'), el('span', { text: 'Ligar ' + C.telefoneTxt }) ]);
      var cli = el('a', { class: 'sh-line', href: C.clienteHref, rel: 'nofollow', 'data-evt': 'area_cliente_header',
                          'aria-label': 'Área do Cliente — acompanhe seu processo' }, [
        icon('shield'), el('span', { text: 'Área do Cliente' }) ]);
      var note = el('p', { class: 'sh-note', text: C.brandTagline + ' · ' + C.brandOab + ' · Sabará e Belo Horizonte' });
      nav.appendChild(el('div', { class: 'sh-panel-cta' }, [ cta, tel, cli, note ]));
      return nav;
    },

    buildItem: function (it) {
      var li = el('li', { class: 'sh-item' + (it.sub ? ' has-sub' : ''), 'data-id': it.id });
      var link = el('a', { class: 'sh-link', href: it.href, 'data-nav': it.id });
      if (it.alert) link.appendChild(el('span', { class: 'sh-dot', 'aria-hidden': 'true' }));
      link.appendChild(document.createTextNode(it.label));
      var split = el('div', { class: 'sh-split' }, [ link ]);
      li.appendChild(split);
      if (!it.sub) return li;

      var subId = 'sh-sub-' + it.id;
      var caret = el('button', {
        class: 'sh-caret', type: 'button', 'aria-expanded': 'false', 'aria-controls': subId,
        'aria-label': 'Mostrar opções de ' + it.label
      }, [ icon('chevron') ]);
      split.appendChild(caret);

      var panel = el('div', { class: 'sh-sub', id: subId, role: 'group', 'aria-label': it.label });
      var cols = el('div', { class: 'sh-sub-cols' });
      it.sub.cols.forEach(function (col) {
        var c = el('div', { class: 'sh-sub-col' });
        if (col.title) c.appendChild(el('p', { class: 'sh-sub-title', text: col.title }));
        var ul = el('ul', { class: col.twoCols ? 'sh-sub-list sh-two' : 'sh-sub-list' });
        col.items.forEach(function (row) {
          ul.appendChild(el('li', null, [ el('a', { class: 'sh-sublink', href: row[1], text: row[0] }) ]));
        });
        c.appendChild(ul);
        cols.appendChild(c);
      });
      panel.appendChild(cols);
      if (it.sub.all) {
        panel.appendChild(el('a', { class: 'sh-sub-all', href: it.sub.all.href }, [ document.createTextNode(it.sub.all.label), icon('arrow') ]));
      }
      li.appendChild(panel);
      return li;
    },

    buildActions: function () {
      var C = this.config;
      var cli = el('a', { class: 'sh-cliente', href: C.clienteHref, rel: 'nofollow', 'data-evt': 'area_cliente_header',
                          'data-tip': 'Área do Cliente', 'aria-label': 'Área do Cliente — acompanhe seu processo' }, [
        icon('shield'), el('span', { class: 'sh-cliente-txt', text: 'Área do Cliente' }) ]);
      var tel = el('a', { class: 'sh-tel', href: C.telefone, 'data-evt': 'tel_header',
                          'data-tip': 'Ligar ' + C.telefoneTxt,
                          'aria-label': 'Ligar para o Dr. Lucas Semim: ' + C.telefoneTxt }, [
        icon('phone'), el('span', { class: 'sh-tel-txt', text: C.telefoneTxt }) ]);
      var cta = el('a', { class: 'sh-cta', href: C.whatsapp, target: '_blank', rel: 'noopener noreferrer', 'data-evt': 'whatsapp_header',
                          'aria-label': 'Falar com o Dr. Lucas Semim pelo WhatsApp — Plantão 24h' }, [
        icon('whatsapp'), el('span', { class: 'sh-cta-txt', text: 'Plantão 24h' }) ]);
      var burger = el('button', { class: 'sh-burger', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'sh-nav',
                                  'aria-label': 'Abrir menu' }, [ el('span'), el('span'), el('span') ]);
      return el('div', { class: 'sh-actions' }, [ cli, tel, cta, burger ]);
    },

    addTicker: function (header) {
      if (this.detectContext() !== 'emergencia') return;
      if (document.getElementById('he-ticker')) return;
      var C = this.config;
      var t = el('div', { id: 'he-ticker', class: 'sh-ticker' }, [
        document.createTextNode('Plantão criminal 24h — atendimento para flagrante e custódia'),
        el('a', { href: C.whatsapp, target: '_blank', rel: 'noopener noreferrer', 'data-evt': 'whatsapp_header', text: C.telefoneTxt })
      ]);
      /* logo abaixo do cabeçalho fixo (o body já reserva a altura dele) */
      if (header.nextSibling) document.body.insertBefore(t, header.nextSibling);
      else document.body.appendChild(t);
    },

    /* ── LINK ATIVO ──────────────────────────────────────────── */

    setActive: function () {
      var path = normPath(window.location.pathname);
      var C = this.config;
      var root = this.state.root;
      C.nav.forEach(function (it) {
        var li = root.querySelector('.sh-item[data-id="' + it.id + '"]');
        if (!li) return;
        var link = li.querySelector('.sh-link');
        var section = it.match.some(function (m) { return path.indexOf(m) === 0; });
        if (path === normPath(it.href)) { link.setAttribute('aria-current', 'page'); li.classList.add('is-current'); }
        else if (section) { link.setAttribute('aria-current', 'true'); li.classList.add('is-current'); }
        var subs = li.querySelectorAll('.sh-sublink, .sh-sub-all');
        for (var i = 0; i < subs.length; i++) {
          if (normPath(subs[i].getAttribute('href')) === path) subs[i].setAttribute('aria-current', 'page');
        }
      });
      if (path === '/') {
        var home = root.querySelector('.sh-only-m .sh-link');
        if (home) home.setAttribute('aria-current', 'page');
      }
    },

    /* ── COMPORTAMENTO ───────────────────────────────────────── */

    isDesktop: function () {
      var mq = this.state.mq;
      return mq ? mq.matches : window.innerWidth >= this.config.breakpoint;
    },

    bind: function () {
      var self = this, S = this.state, root = S.root;

      /* rolagem: sombra e fundo mais fechado */
      var onScroll = function () {
        if (S.scrollTicking) return;
        S.scrollTicking = true;
        requestAnimationFrame(function () {
          root.classList.toggle('is-scrolled', (window.pageYOffset || document.documentElement.scrollTop || 0) > self.config.scrollThreshold);
          S.scrollTicking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();

      /* hambúrguer / fechar / fundo escuro */
      S.burger.addEventListener('click', function () { self.state.menuOpen ? self.closeMenu(true) : self.openMenu(); });
      root.querySelector('.sh-close').addEventListener('click', function () { self.closeMenu(true); });
      S.overlay.addEventListener('click', function () { self.closeMenu(true); });

      /* submenus */
      var items = root.querySelectorAll('.sh-item.has-sub');
      Array.prototype.forEach.call(items, function (li) {
        var caret = li.querySelector('.sh-caret');
        caret.addEventListener('click', function (e) {
          e.preventDefault();
          if (li.classList.contains('is-open')) self.closeSub(li); else self.openSub(li);
        });
        caret.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown') { e.preventDefault(); self.openSub(li); self.focusSub(li, 0); }
        });
        li.querySelector('.sh-link').addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' && self.isDesktop()) { e.preventDefault(); self.openSub(li); self.focusSub(li, 0); }
        });
        li.querySelector('.sh-sub').addEventListener('keydown', function (e) { self.onSubKey(e, li); });

        /* passar o mouse (somente mouse real, >= breakpoint) */
        li.addEventListener('mouseenter', function (e) {
          if (!self.isDesktop() || !self.finePointer()) return;
          clearTimeout(S.hoverTimer);
          S.hoverTimer = setTimeout(function () { self.openSub(li); }, 70);
        });
        li.addEventListener('mouseleave', function () {
          if (!self.isDesktop() || !self.finePointer()) return;
          clearTimeout(S.hoverTimer);
          S.hoverTimer = setTimeout(function () { self.closeSub(li); }, 200);
        });
        /* teclado: ao sair do item, fecha */
        li.addEventListener('focusout', function (e) {
          if (!self.isDesktop()) return;
          var to = e.relatedTarget;
          if (to && li.contains(to)) return;
          setTimeout(function () { if (!li.contains(document.activeElement)) self.closeSub(li); }, 0);
        });
      });

      /* clique fora fecha submenu (desktop) */
      document.addEventListener('click', function (e) {
        if (S.subOpen && self.isDesktop() && !S.subOpen.contains(e.target)) self.closeSub(S.subOpen);
      });

      /* ESC: submenu (desktop) ou gaveta (celular) */
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
          if (S.menuOpen) { e.preventDefault(); self.closeMenu(true); }
          else if (S.subOpen) { var li = S.subOpen; self.closeSub(li); var c = li.querySelector('.sh-caret'); if (c) c.focus(); }
        } else if (e.key === 'Tab' && S.menuOpen) {
          self.trapFocus(e);
        }
      });

      /* clicou num link da gaveta: fecha */
      S.nav.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[href]') : null;
        if (a && S.menuOpen) self.closeMenu(false);
      });

      /* GA4: um listener só, por delegação */
      root.addEventListener('click', function (e) {
        var a = e.target.closest ? e.target.closest('a[href]') : null;
        if (!a) return;
        var evt = a.getAttribute('data-evt');
        if (evt) self.trackClick(evt);
        else self.trackNav(a);
      });

      /* mudou de celular para desktop (girar o aparelho, redimensionar) */
      var onMq = function () { if (self.isDesktop()) self.closeMenu(false); self.closeAllSubs(); self.syncTopOffset(); };
      if (S.mq && S.mq.addEventListener) S.mq.addEventListener('change', onMq);
      else if (S.mq && S.mq.addListener) S.mq.addListener(onMq);

      var rz = 0;
      window.addEventListener('resize', function () {
        cancelAnimationFrame(rz);
        rz = requestAnimationFrame(function () { self.syncTopOffset(); });
      }, { passive: true });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { self.syncTopOffset(); });
      window.addEventListener('load', function () { self.syncTopOffset(); });
    },

    finePointer: function () {
      return !!(window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches);
    },

    openSub: function (li) {
      var S = this.state;
      if (S.subOpen && S.subOpen !== li) this.closeSub(S.subOpen);
      li.classList.add('is-open');
      var c = li.querySelector('.sh-caret');
      if (c) c.setAttribute('aria-expanded', 'true');
      S.subOpen = li;
    },

    closeSub: function (li) {
      if (!li) return;
      li.classList.remove('is-open');
      var c = li.querySelector('.sh-caret');
      if (c) c.setAttribute('aria-expanded', 'false');
      if (this.state.subOpen === li) this.state.subOpen = null;
    },

    closeAllSubs: function () {
      var open = this.state.root ? this.state.root.querySelectorAll('.sh-item.is-open') : [];
      for (var i = 0; i < open.length; i++) this.closeSub(open[i]);
    },

    focusSub: function (li, idx) {
      var links = li.querySelectorAll('.sh-sub a');
      if (!links.length) return;
      var n = links[Math.max(0, Math.min(idx, links.length - 1))];
      requestAnimationFrame(function () { n.focus(); });
    },

    onSubKey: function (e, li) {
      var links = Array.prototype.slice.call(li.querySelectorAll('.sh-sub a'));
      var i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); links[(i + 1) % links.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); links[(i - 1 + links.length) % links.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); links[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); links[links.length - 1].focus(); }
    },

    openMenu: function () {
      var S = this.state;
      S.lastFocus = document.activeElement;
      S.menuOpen = true;
      S.root.classList.add('is-open');
      document.documentElement.classList.add('sh-lock');
      S.burger.setAttribute('aria-expanded', 'true');
      S.burger.setAttribute('aria-label', 'Fechar menu');
      /* já abre mostrando a seção em que o visitante está */
      var cur = S.root.querySelector('.sh-item.has-sub.is-current');
      if (cur) this.openSub(cur);
      var first = S.root.querySelector('.sh-close');
      if (first) setTimeout(function () { first.focus(); }, 60);
    },

    closeMenu: function (returnFocus) {
      var S = this.state;
      if (!S.menuOpen) return;
      S.menuOpen = false;
      S.root.classList.remove('is-open');
      document.documentElement.classList.remove('sh-lock');
      S.burger.setAttribute('aria-expanded', 'false');
      S.burger.setAttribute('aria-label', 'Abrir menu');
      this.closeAllSubs();
      if (returnFocus && S.burger && S.burger.offsetParent !== null) S.burger.focus();
    },

    trapFocus: function (e) {
      var nav = this.state.nav;
      var list = Array.prototype.filter.call(nav.querySelectorAll('a[href], button:not([disabled])'), function (n) {
        return n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden';
      });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1], act = document.activeElement;
      if (!nav.contains(act)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && act === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && act === last) { e.preventDefault(); first.focus(); }
    },

    /* Faixas fixas no topo (ex.: faixa vermelha da página de custódia): o cabeçalho desce abaixo delas
       e o conteúdo ganha a altura somada (CSS: body padding-top = --sh-top + --sh-h). */
    syncTopOffset: function () {
      var h = 0;
      this.config.topStrips.forEach(function (sel) {
        var n = document.querySelector(sel);
        if (!n) return;
        var cs = getComputedStyle(n);
        if (cs.display === 'none' || cs.position !== 'fixed') return;
        h = Math.max(h, Math.round(n.getBoundingClientRect().bottom));
      });
      document.documentElement.style.setProperty('--sh-top', h + 'px');
    },

    /* ── GA4 ─────────────────────────────────────────────────── */

    trackClick: function (label) {
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', label, { event_category: 'Header_Elite', pagina_origem: window.location.pathname });
        }
      } catch (e) { }
    },

    trackNav: function (a) {
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'header_nav_click', {
            event_category: 'Header_Elite',
            event_label: (a.getAttribute('href') || '').slice(0, 120),
            pagina_origem: window.location.pathname
          });
        }
      } catch (e) { }
    },

    /* ── CSS ─────────────────────────────────────────────────── */

    injectStyles: function () {
      if (document.getElementById('site-header-styles')) return;
      var style = document.createElement('style');
      style.id = 'site-header-styles';
      style.textContent = window.HeaderElite.css;
      document.head.appendChild(style);
    }
  };

  window.HeaderElite.css = `
/* === HeaderElite V5 === */
:root{--sh-h:66px}
@media (min-width:992px){:root{--sh-h:78px}}
body{padding-top:calc(var(--sh-top,0px) + var(--sh-h))!important}
html.sh-lock,html.sh-lock body{overflow:hidden}

.sh{--g1:#f6e7a6;--g2:#d4af37;--g3:#9a7a16;--txt:#ebe7da;--mut:#a79f86;--line:rgba(212,175,55,.3);
  position:fixed;top:var(--sh-top,0px);left:0;right:0;right:max(0px,calc(100% - 100vw));z-index:10000;height:var(--sh-h);margin:0;padding:0;
  font-family:'Lato',system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.2;
  color:var(--txt);-webkit-font-smoothing:antialiased;-webkit-text-size-adjust:100%;text-align:left}
.sh *,.sh *::before,.sh *::after{box-sizing:border-box}
.sh::before{content:"";position:absolute;top:0;right:0;bottom:0;left:0;z-index:-1;background:rgba(7,7,10,.9);
  -webkit-backdrop-filter:blur(16px) saturate(1.15);backdrop-filter:blur(16px) saturate(1.15);
  transition:background .3s ease,box-shadow .3s ease}
.sh::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;pointer-events:none;
  background:linear-gradient(90deg,transparent 0,rgba(212,175,55,.55) 18%,rgba(212,175,55,.55) 82%,transparent 100%)}
.sh.is-scrolled::before{background:rgba(7,7,10,.97);box-shadow:0 12px 32px rgba(0,0,0,.5)}
.sh a,.sh a:hover,.sh a:focus{text-decoration:none;background:none}
.sh ul,.sh li{list-style:none;margin:0;padding:0}
.sh p{margin:0}
.sh button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;-webkit-appearance:none;appearance:none;text-transform:none}
.sh a:focus-visible,.sh button:focus-visible{outline:2px solid var(--g2);outline-offset:3px;border-radius:6px}

.sh .sh-bar{position:relative;max-width:1380px;height:100%;margin:0 auto;padding:0 28px;display:flex;align-items:center;gap:22px}

/* marca */
.sh .sh-brand{display:flex;align-items:center;gap:12px;flex:0 0 auto;min-width:0;color:#fff}
.sh .sh-mark{width:42px;height:42px;flex:0 0 auto;display:block}
.sh .sh-mark svg{width:100%;height:100%;display:block;overflow:visible;filter:drop-shadow(0 0 7px rgba(212,175,55,.3));transition:filter .3s ease}
.sh .sh-brand:hover .sh-mark svg{filter:drop-shadow(0 0 14px rgba(246,231,166,.7))}
.sh .sh-id{display:flex;flex-direction:column;gap:7px;min-width:0}
.sh .sh-name{font:700 18px/1 'Playfair Display',Georgia,'Times New Roman',serif;letter-spacing:.17em;text-transform:uppercase;color:#fff;white-space:nowrap}
.sh .sh-tag{display:flex;align-items:center;gap:6px;font:700 9.5px/1 'Lato',system-ui,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:var(--mut);white-space:nowrap}
.sh .sh-tag i{font-style:normal;opacity:.6}
.sh .sh-tag b{font-weight:700;color:var(--g2)}
.sh .sh-badge{display:none;margin-left:4px;padding:3px 7px;border-radius:3px;font-size:8.5px;letter-spacing:.1em;color:#fff}
.sh .sh-badge-news{background:#b3261e}.sh .sh-badge-alert{background:#b4540a}.sh .sh-badge-exec{background:#1a6b2e}
@media (min-width:1600px){.sh .sh-badge{display:inline-block}}

/* navegação */
.sh .sh-nav{flex:1 1 auto;min-width:0;display:flex;justify-content:center}
.sh .sh-panel-head,.sh .sh-panel-cta,.sh .sh-only-m{display:none}
.sh .sh-list{display:flex;align-items:center;gap:2px}
.sh .sh-item{position:relative}
.sh .sh-split{display:flex;align-items:center}
.sh .sh-link{position:relative;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 10px;border-radius:6px;
  font:700 12px/1 'Lato',system-ui,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--txt);white-space:nowrap;
  transition:color .2s ease,background .2s ease}
.sh .sh-link::after{content:"";position:absolute;left:10px;right:10px;bottom:7px;height:2px;border-radius:2px;
  background:linear-gradient(90deg,var(--g2),var(--g1));transform:scaleX(0);transform-origin:left center;transition:transform .28s ease}
.sh .sh-link:hover,.sh .sh-item:hover>.sh-split .sh-link,.sh .sh-link:focus-visible,.sh .sh-item.is-open>.sh-split .sh-link{color:var(--g1)}
.sh .sh-link:hover::after,.sh .sh-item:hover>.sh-split .sh-link::after,.sh .sh-link:focus-visible::after,.sh .sh-item.is-open>.sh-split .sh-link::after{transform:scaleX(1)}
.sh .sh-link[aria-current]{color:var(--g2)}
.sh .sh-link[aria-current]::after{transform:scaleX(1)}
.sh .sh-dot{width:7px;height:7px;border-radius:50%;background:#e5484d;flex:0 0 auto;box-shadow:0 0 0 0 rgba(229,72,77,.55);animation:shDot 2s ease-out infinite}
@keyframes shDot{0%{box-shadow:0 0 0 0 rgba(229,72,77,.55)}70%{box-shadow:0 0 0 7px rgba(229,72,77,0)}100%{box-shadow:0 0 0 0 rgba(229,72,77,0)}}
.sh .sh-caret{width:22px;height:44px;margin-left:-8px;display:inline-flex;align-items:center;justify-content:center;color:var(--mut);border-radius:6px;transition:color .2s ease}
.sh .sh-caret svg{width:12px;height:12px;transition:transform .2s ease}
.sh .sh-caret:hover,.sh .sh-item:hover>.sh-split .sh-caret,.sh .sh-item.is-open>.sh-split .sh-caret{color:var(--g1)}
.sh .sh-item.is-open>.sh-split .sh-caret svg{transform:rotate(180deg)}

/* submenus (desktop) */
.sh .sh-sub{position:absolute;top:calc(100% + 8px);left:50%;transform:translate(-50%,6px);min-width:290px;padding:16px;
  background:#0c0c11;border:1px solid var(--line);border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.65);
  opacity:0;visibility:hidden;transition:opacity .16s ease,transform .16s ease,visibility 0s linear .16s}
.sh .sh-sub::before{content:"";position:absolute;left:0;right:0;top:-10px;height:10px}
.sh .sh-item.is-open>.sh-sub{opacity:1;visibility:visible;transform:translate(-50%,0);transition-delay:0s}
.sh .sh-sub-cols{display:flex;gap:26px;align-items:flex-start}
.sh .sh-sub-col{min-width:210px}
.sh .sh-sub-title{margin:0 0 8px!important;padding:0 10px;font:700 9.5px/1 'Lato',system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:var(--g2)}
.sh .sh-sub-list.sh-two{column-count:2;column-gap:18px}
.sh .sh-sub-list.sh-two li{break-inside:avoid}
.sh .sh-sublink{display:block;padding:9px 10px;border-radius:6px;font:700 13.5px/1.25 'Lato',system-ui,sans-serif;letter-spacing:.01em;color:var(--txt);white-space:nowrap;transition:background .15s ease,color .15s ease}
.sh .sh-sublink:hover,.sh .sh-sublink:focus-visible{background:rgba(212,175,55,.11);color:var(--g1)}
.sh .sh-sublink[aria-current]{color:var(--g2)}
.sh .sh-sub-all{display:flex;align-items:center;gap:8px;margin-top:12px;padding:13px 10px 2px;border-top:1px solid rgba(255,255,255,.09);
  font:700 11px/1 'Lato',system-ui,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--g2)}
.sh .sh-sub-all svg{width:14px;height:14px;transition:transform .2s ease}
.sh .sh-sub-all:hover{color:var(--g1)}
.sh .sh-sub-all:hover svg{transform:translateX(3px)}

/* ações */
.sh .sh-actions{flex:0 0 auto;display:flex;align-items:center;gap:10px;margin-left:auto}
.sh .sh-cliente{position:relative;width:44px;height:44px;flex:0 0 auto;display:inline-flex;align-items:center;justify-content:center;color:var(--g2);
  border:1px solid rgba(212,175,55,.42);border-radius:8px;background:radial-gradient(circle at 50% 15%,rgba(212,175,55,.17),rgba(212,175,55,.02) 70%);
  transition:background .25s ease,color .25s ease,transform .2s ease,box-shadow .25s ease}
.sh .sh-cliente svg{width:20px;height:20px}
.sh .sh-cliente:hover,.sh .sh-cliente:focus-visible{color:#15110a;background:linear-gradient(135deg,var(--g1),var(--g2) 55%,#b8901f);
  box-shadow:0 0 0 4px rgba(212,175,55,.16),0 8px 22px rgba(212,175,55,.3);transform:translateY(-1px)}
.sh .sh-cliente-txt{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sh .sh-cliente::after,.sh .sh-tel::after{content:attr(data-tip);position:absolute;top:calc(100% + 10px);right:0;background:#0c0c0e;color:var(--g1);border:1px solid rgba(212,175,55,.35);
  font:700 10.5px/1 'Lato',system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;padding:8px 10px;border-radius:5px;white-space:nowrap;
  opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .2s ease,transform .2s ease}
.sh .sh-cliente:hover::after,.sh .sh-cliente:focus-visible::after,.sh .sh-tel:hover::after,.sh .sh-tel:focus-visible::after{opacity:1;transform:none}
/* telefone: botão só com o ícone de 1200 a 1599px (número no balão); a partir de 1600px mostra o número ao lado */
.sh .sh-tel{display:none;position:relative;align-items:center;justify-content:center;gap:8px;width:44px;height:44px;flex:0 0 auto;color:var(--g1);
  border:1px solid rgba(212,175,55,.42);border-radius:8px;background:radial-gradient(circle at 50% 15%,rgba(212,175,55,.17),rgba(212,175,55,.02) 70%);
  font:700 13px/1 'Lato',system-ui,sans-serif;letter-spacing:.02em;white-space:nowrap;
  transition:background .25s ease,color .25s ease,transform .2s ease,box-shadow .25s ease}
.sh .sh-tel svg{width:19px;height:19px;flex:0 0 auto}
.sh .sh-tel-txt{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.sh .sh-tel:hover,.sh .sh-tel:focus-visible{color:#15110a;background:linear-gradient(135deg,var(--g1),var(--g2) 55%,#b8901f);
  box-shadow:0 0 0 4px rgba(212,175,55,.16),0 8px 22px rgba(212,175,55,.3);transform:translateY(-1px)}
@media (min-width:1200px){.sh .sh-tel{display:inline-flex}}
@media (min-width:1600px){
  .sh .sh-bar{max-width:1520px}
  .sh .sh-tel{width:auto;padding:0 6px;border:0;border-radius:0;background:none}
  .sh .sh-tel svg{width:16px;height:16px}
  .sh .sh-tel-txt{position:static;width:auto;height:auto;overflow:visible;clip:auto}
  .sh .sh-tel::after{display:none}
  .sh .sh-tel:hover,.sh .sh-tel:focus-visible{color:#fff;background:none;box-shadow:none;transform:none}
}
.sh .sh-cta{display:inline-flex;align-items:center;justify-content:center;gap:9px;height:44px;padding:0 20px;border-radius:8px;
  font:700 12.5px/1 'Lato',system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#17130a;white-space:nowrap;
  background:linear-gradient(135deg,var(--g1) 0%,var(--g2) 55%,#b8901f 100%);
  box-shadow:0 8px 22px rgba(212,175,55,.22),inset 0 1px 0 rgba(255,255,255,.42);
  transition:transform .15s ease,box-shadow .2s ease,filter .2s ease}
.sh .sh-cta:hover,.sh .sh-cta:focus-visible{transform:translateY(-1px);filter:brightness(1.05);color:#17130a;box-shadow:0 12px 28px rgba(212,175,55,.34),inset 0 1px 0 rgba(255,255,255,.5)}
.sh .sh-cta svg{width:19px;height:19px;flex:0 0 auto}
.sh .sh-burger{display:none;position:relative;width:44px;height:44px;flex:0 0 auto;border:1px solid rgba(212,175,55,.4);border-radius:8px}
.sh .sh-burger span{position:absolute;left:12px;right:12px;height:2px;border-radius:2px;background:var(--g1);transition:transform .3s ease,opacity .2s ease,top .3s ease}
.sh .sh-burger span:nth-child(1){top:15px}.sh .sh-burger span:nth-child(2){top:21px}.sh .sh-burger span:nth-child(3){top:27px}
.sh.is-open .sh-burger span:nth-child(1){top:21px;transform:rotate(45deg)}
.sh.is-open .sh-burger span:nth-child(2){opacity:0}
.sh.is-open .sh-burger span:nth-child(3){top:21px;transform:rotate(-45deg)}
.sh .sh-overlay{display:none}

/* notebook pequeno */
@media (min-width:1200px) and (max-width:1359px){
  .sh .sh-bar{padding:0 18px;gap:12px}
  .sh .sh-link{padding:0 8px;letter-spacing:.06em}
  .sh .sh-link::after{left:8px;right:8px}
  .sh .sh-cta{padding:0 15px}
  .sh .sh-name{font-size:17px;letter-spacing:.15em}
  .sh .sh-oab,.sh .sh-sep{display:none}
}
@media (min-width:1360px){.sh .sh-badge{margin-left:2px}}

/* faixa de emergência */
.sh-ticker{position:relative;z-index:1;padding:8px 14px;text-align:center;background:linear-gradient(90deg,#4a0000,#7a0000,#4a0000);color:#fff;
  font:700 11px/1.35 'Lato',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;border-bottom:1px solid rgba(255,255,255,.08)}
.sh-ticker a{margin-left:10px;color:#ffd66b;text-decoration:none;white-space:nowrap}
.sh-ticker a:hover{text-decoration:underline}

/* celular e tablet: gaveta */
@media (max-width:1199px){
  .sh .sh-bar{padding:0 16px;gap:10px}
  .sh .sh-burger{display:inline-block}
  .sh .sh-cliente,.sh .sh-tel{display:none}
  .sh .sh-cta{width:44px;padding:0}
  .sh .sh-cta-txt{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
  .sh .sh-overlay{display:block;position:fixed;top:0;right:0;bottom:0;left:0;z-index:1;background:rgba(2,2,4,.68);opacity:0;visibility:hidden;
    transition:opacity .3s ease,visibility 0s linear .3s;-webkit-tap-highlight-color:transparent}
  .sh.is-open .sh-overlay{opacity:1;visibility:visible;transition-delay:0s}
  .sh.is-open{z-index:2147483000}
  .sh .sh-nav{position:fixed;top:0;right:0;right:max(0px,calc(100% - 100vw));bottom:0;z-index:2;width:min(92vw,410px);height:100vh;height:100dvh;display:flex;flex-direction:column;
    justify-content:flex-start;background:#0a0a0e;border-left:1px solid var(--line);box-shadow:-30px 0 80px rgba(0,0,0,.6);
    transform:translateX(104%);visibility:hidden;transition:transform .34s cubic-bezier(.2,.8,.2,1),visibility 0s linear .34s;
    overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
  .sh.is-open .sh-nav{transform:none;visibility:visible;transition-delay:0s}
  .sh .sh-panel-head{display:flex;align-items:center;justify-content:space-between;flex:0 0 auto;height:var(--sh-h);padding:0 10px 0 22px;border-bottom:1px solid rgba(255,255,255,.07)}
  .sh .sh-panel-title{font:700 13px/1 'Playfair Display',Georgia,serif;letter-spacing:.24em;text-transform:uppercase;color:var(--g2)}
  .sh .sh-close{width:44px;height:44px;display:inline-flex;align-items:center;justify-content:center;color:var(--g1);border-radius:8px}
  .sh .sh-close svg{width:22px;height:22px}
  .sh .sh-list{display:block;padding:6px 14px 10px}
  .sh .sh-only-m{display:block}
  .sh .sh-item{border-bottom:1px solid rgba(255,255,255,.06)}
  .sh .sh-split{align-items:stretch}
  .sh .sh-link{flex:1 1 auto;height:56px;padding:0 8px;font-size:14px;letter-spacing:.09em;border-radius:0}
  .sh .sh-link::after{display:none}
  .sh .sh-caret{width:56px;height:56px;margin:0;border-left:1px solid rgba(255,255,255,.06);border-radius:0;color:var(--g2)}
  .sh .sh-caret svg{width:15px;height:15px}
  .sh .sh-sub{position:static;display:none;min-width:0;transform:none;opacity:1;visibility:visible;padding:2px 4px 14px;background:transparent;border:0;border-radius:0;box-shadow:none;transition:none}
  .sh .sh-sub::before{display:none}
  .sh .sh-item.is-open>.sh-sub{display:block;transform:none}
  .sh .sh-sub-cols{display:block}
  .sh .sh-sub-col{min-width:0;margin-bottom:8px}
  .sh .sh-sub-title{padding:8px 10px 0}
  .sh .sh-sub-list.sh-two{column-count:1}
  .sh .sh-sublink{padding:12px 10px;font-size:14px;white-space:normal}
  .sh .sh-sub-all{margin-top:4px;padding:14px 10px 4px}
  .sh .sh-panel-cta{display:flex;flex-direction:column;gap:10px;margin-top:auto;padding:18px 16px 24px;border-top:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(212,175,55,.05),transparent)}
  .sh .sh-cta-block{width:100%;height:52px;font-size:13px}
  .sh .sh-line{display:flex;align-items:center;justify-content:center;gap:10px;height:48px;border:1px solid rgba(212,175,55,.38);border-radius:8px;
    font:700 12.5px/1 'Lato',system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:var(--g1)}
  .sh .sh-line svg{width:18px;height:18px;flex:0 0 auto}
  .sh .sh-note{text-align:center;font:700 9.5px/1.5 'Lato',system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
}
@media (max-width:420px){
  .sh .sh-tag-a{display:none}
  .sh .sh-tag i{display:none}
  .sh .sh-name{font-size:17px}
}

@media (prefers-reduced-motion:reduce){
  .sh *,.sh *::before,.sh *::after{transition-duration:.01ms!important;animation:none!important}
}
@media print{.sh,.sh-ticker{display:none!important}body{padding-top:0!important}}
`;

  /* inicialização imediata se o <body> já existe (script no fim da página); senão, ao carregar o DOM */
  if (document.body) window.HeaderElite.init();
  else document.addEventListener('DOMContentLoaded', function () { window.HeaderElite.init(); });
})();




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
