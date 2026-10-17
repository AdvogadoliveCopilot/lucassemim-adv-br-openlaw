/* Design V2 — revelação ao rolar. Tudo já está visível ao carregar;
   só o que está abaixo da dobra ganha o efeito. Sem JS = página normal. */
(function () {
  'use strict';
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  var SEL = [
    '.social-proof-bar .proof-item',
    '.situacoes-section .col-md-4',
    '.depoimentos-section .depoimento-card',
    '.autoridade-section .foto-dr-lucas',
    '.autoridade-section .diferencial-item',
    'body > section h2'
  ].join(',');

  function run() {
    var vh = window.innerHeight || 800;
    var els = Array.prototype.slice.call(document.querySelectorAll(SEL)).filter(function (el) {
      return el.getBoundingClientRect().top > vh * 0.95; // só abaixo da dobra
    });
    if (!els.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('v2-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    els.forEach(function (el, i) {
      el.classList.add('v2-reveal');
      el.style.setProperty('--v2-d', ((i % 3) * 0.08) + 's');
      io.observe(el);
    });

    // rede de segurança: nada fica escondido
    setTimeout(function () {
      els.forEach(function (el) { el.classList.add('v2-in'); });
    }, 6000);
  }

  if (document.readyState === 'complete') run();
  else window.addEventListener('load', run);
})();
