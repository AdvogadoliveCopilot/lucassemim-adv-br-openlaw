/* "O que fazer agora" V3 — molde de conversão.
   Só melhora o que o HTML já entrega (a página funciona 100% sem este arquivo):
   1) barra fixa do celular recolhida enquanto os botões do topo estão na tela; no computador, o card lateral
      recolhe quando a faixa de ação ou o fechamento aparecem;
   2) registra de qual botão veio o clique (evento oq_cta_click, sem duplicar as conversões do site);
   3) índice (/o-que-fazer-agora/): busca por situação;
   4) revela os blocos novos ao rolar (somente os que estão abaixo da dobra). */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (!root.classList.contains('oq3')) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1) barra fixa só aparece depois que o botão do topo sai da tela */
  var heroCta = d.querySelector('.oq-hero-cta');
  if (heroCta && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { root.classList.toggle('oq-hero-in', e.isIntersecting); });
    }, { threshold: 0.35, rootMargin: '-80px 0px 0px 0px' }); /* 80px = altura do menu fixo */
    io.observe(heroCta);
  }

  /* 1b) desktop: o card lateral recolhe quando a faixa de ação ou o fechamento aparecem (evita dois blocos de CTA lado a lado) */
  var quiet = d.querySelectorAll('.oq-band, .oq-final');
  if (quiet.length && 'IntersectionObserver' in window) {
    var vis = [];
    var iq = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var i = vis.indexOf(e.target);
        if (e.isIntersecting && i < 0) vis.push(e.target);
        else if (!e.isIntersecting && i > -1) vis.splice(i, 1);
      });
      root.classList.toggle('oq-card-quiet', vis.length > 0);
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(quiet, function (e) { iq.observe(e); });
  }

  /* 2) medição de posição: evento próprio (oq_cta_click) só para comparar qual botão foi usado.
     As conversões (generate_lead, Google Ads) continuam sendo contadas pelo analytics.js e pelo
     ads-intelligence.js do site, que já escutam todo link wa.me e tel: — aqui nada é contado em duplicidade. */
  d.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('[data-oq-cta]') : null;
    if (!a) return;
    var parts = (a.getAttribute('data-oq-cta') || '').split('_');
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'oq_cta_click', { oq_canal: parts[0] || '', oq_local: parts[1] || '', page_path: location.pathname });
      }
    } catch (e) { /* medição nunca pode atrapalhar o clique */ }
  }, true);

  /* 2b) índice: busca por situação (filtra todos os cartões e esconde os grupos vazios) */
  var qi = d.getElementById('oq-q');
  if (qi) {
    var cards = Array.prototype.slice.call(d.querySelectorAll('.guide-card'));
    var groups = Array.prototype.slice.call(d.querySelectorAll('.oq-group'));
    var empty = d.getElementById('oq-empty');
    var norm = function (t) { return (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
    qi.addEventListener('input', function (e) {
      var term = norm(e.target.value).trim(), n = 0;
      cards.forEach(function (c) {
        var ok = !term || norm(c.textContent).indexOf(term) > -1;
        c.classList.toggle('oq-hide', !ok);
        if (ok) n++;
      });
      groups.forEach(function (g) { g.classList.toggle('oq-hide', !g.querySelector('.guide-card:not(.oq-hide)')); });
      if (empty) empty.classList.toggle('is-on', n === 0);
    });
  }

  /* 3) revelar ao rolar — nunca esconde nada que já está na primeira tela */
  if (!reduce && 'IntersectionObserver' in window) {
    var vh = window.innerHeight || 800;
    var els = Array.prototype.slice.call(d.querySelectorAll('.oq-how, .oq-pledge, .oq-band, .oq-final'))
      .filter(function (e) { return e.getBoundingClientRect().top > vh * 0.95; });
    if (els.length) {
      var rv = new IntersectionObserver(function (es) {
        es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('oq-in'); rv.unobserve(x.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      els.forEach(function (e) { e.classList.add('oq-rv'); rv.observe(e); });
      setTimeout(function () { els.forEach(function (e) { e.classList.add('oq-in'); }); }, 6000);
    }
  }
})();
