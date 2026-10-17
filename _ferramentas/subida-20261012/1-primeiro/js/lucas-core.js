/* =====================================================================
   LUCAS SEMIM — núcleo V3 · JS leve (sem dependências)
   - mede cliques nos botões de ação (evento próprio lc_cta_click; os cliques
     de WhatsApp/telefone continuam sendo contados pelo analytics.js)
   - recolhe a barra fixa do celular enquanto os botões do topo, de uma faixa
     de ação ou do final estão na tela
   - FAQ: busca, abrir/fechar todas, link direto para uma pergunta (#q-...)
   Se algo falhar, a página continua inteira e funcional (nada fica escondido).
   ===================================================================== */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  if (!root.classList.contains('lc')) return;
  root.classList.add('lc-js');

  /* ---------- "Pular para o conteúdo": o menu do site é injetado no topo da página
     e passaria na frente do atalho; mantém o atalho como primeiro item ---------- */
  var skip = d.querySelector('a.lc-skip');
  if (skip && skip.parentNode === d.body) {
    var keepFirst = function () { if (d.body.firstChild !== skip) d.body.insertBefore(skip, d.body.firstChild); };
    keepFirst();
    if ('MutationObserver' in window) {
      var mo = new MutationObserver(keepFirst);
      mo.observe(d.body, { childList: true });
      setTimeout(function () { mo.disconnect(); }, 8000);
    }
  }

  /* ---------- medição ---------- */
  d.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-lc-cta]') : null;
    if (!a) return;
    try {
      var v = a.getAttribute('data-lc-cta') || '', p = v.split('_');
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'lc_cta_click', { lc_canal: p[0], lc_local: p.slice(1).join('_'), page_path: location.pathname });
      }
    } catch (_) {}
  }, true);

  /* ---------- barra fixa do celular ---------- */
  if ('IntersectionObserver' in window) {
    /* Observa os BOTÕES (.lc-cta) de cada bloco, não o bloco inteiro: um painel alto que aparece só pela
       metade na primeira tela do celular não pode esconder a barra enquanto os botões ainda estão fora da tela.
       A faixa de baixo (altura da própria barra) fica fora da conta (rootMargin). */
    var watch = function (sel, cls) {
      var els = d.querySelectorAll(sel);
      if (!els.length) return;
      var vis = {};
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { vis[en.target.__lcId] = en.isIntersecting; });
        var any = false; for (var k in vis) { if (vis[k]) { any = true; break; } }
        root.classList.toggle(cls, any);
      }, { threshold: 0.25, rootMargin: '0px 0px -72px 0px' });
      for (var i = 0; i < els.length; i++) {
        var tg = els[i].querySelector('.lc-cta') || els[i];
        tg.__lcId = cls + i; vis[cls + i] = false; io.observe(tg);
      }
    };
    watch('[data-lc-hero]', 'lc-hero-in');
    watch('[data-lc-band]', 'lc-band-in');
    watch('[data-lc-end]', 'lc-end-in');
  }

  /* ---------- "Gerenciar cookies": reabre o painel do aviso de cookies (js/lgpd.js) ---------- */
  var ckBtns = d.querySelectorAll('[data-lc-cookies]');
  for (var q = 0; q < ckBtns.length; q++) {
    (function (btn) {
      var ready = function () { return !!(window.LgpdConsent && typeof window.LgpdConsent.openModal === 'function'); };
      if (ready()) btn.hidden = false;
      btn.addEventListener('click', function () { if (ready()) window.LgpdConsent.openModal(); });
    })(ckBtns[q]);
  }

  /* ---------- sumário/chips: destaca a seção que está na tela (FAQ e políticas) ---------- */
  var cats = d.querySelectorAll('.lc-cat');
  var chips = d.querySelectorAll('[data-lc-chip]');
  if (chips.length && cats.length) {
    var ticking = false;
    var mark = function () {
      ticking = false;
      var line = window.innerHeight * 0.35, cur = '';
      for (var k = 0; k < cats.length; k++) {
        if (cats[k].classList.contains('is-hidden')) continue;
        var r = cats[k].getBoundingClientRect();
        if (r.top <= line && r.bottom > line) cur = cats[k].id;
      }
      for (var c = 0; c < chips.length; c++) {
        if (cur && chips[c].getAttribute('data-lc-chip') === cur) chips[c].setAttribute('aria-current', 'true');
        else chips[c].removeAttribute('aria-current');
      }
    };
    var onScroll = function () { if (!ticking) { ticking = true; window.requestAnimationFrame(mark); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    mark();
  }

  /* ---------- FAQ ---------- */
  var list = d.querySelectorAll('.lc-q');
  if (!list.length) return;
  var input = d.getElementById('lc-q-search');
  var count = d.getElementById('lc-q-count');
  var empty = d.getElementById('lc-q-empty');
  var toggle = d.getElementById('lc-q-toggle');

  var norm = function (s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  };
  var index = [];
  for (var i = 0; i < list.length; i++) index.push({ el: list[i], txt: norm(list[i].textContent) });

  var autoOpened = [];
  function apply() {
    var q = norm(input ? input.value : '');
    var tokens = q ? q.split(' ') : [];
    var shown = 0, last = null;
    autoOpened.forEach(function (el) { el.removeAttribute('open'); });
    autoOpened = [];
    index.forEach(function (it) {
      var ok = true;
      for (var t = 0; t < tokens.length; t++) { if (it.txt.indexOf(tokens[t]) === -1) { ok = false; break; } }
      it.el.classList.toggle('is-hidden', !ok);
      if (ok) { shown++; last = it.el; }
    });
    for (var c = 0; c < cats.length; c++) {
      var any = cats[c].querySelector('.lc-q:not(.is-hidden)');
      cats[c].classList.toggle('is-hidden', !any);
    }
    if (tokens.length && shown > 0 && shown <= 3) {
      index.forEach(function (it) {
        if (!it.el.classList.contains('is-hidden') && !it.el.hasAttribute('open')) { it.el.setAttribute('open', ''); autoOpened.push(it.el); }
      });
    }
    if (count) count.textContent = shown + (shown === 1 ? ' pergunta' : ' perguntas');
    if (empty) empty.hidden = shown !== 0;
  }
  if (input) {
    input.addEventListener('input', apply);
    input.addEventListener('keydown', function (e) { if (e.key === 'Escape') { input.value = ''; apply(); } });
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('data-open') !== '1';
      index.forEach(function (it) { if (!it.el.classList.contains('is-hidden')) { if (open) it.el.setAttribute('open', ''); else it.el.removeAttribute('open'); } });
      toggle.setAttribute('data-open', open ? '1' : '0');
      toggle.querySelector('span').textContent = open ? 'Fechar todas' : 'Abrir todas';
      toggle.querySelector('i').className = open ? 'fas fa-compress' : 'fas fa-expand';
    });
  }

  function fromHash() {
    var h = (location.hash || '').replace('#', '');
    if (!h) return;
    var el = d.getElementById(h);
    if (el && el.classList.contains('lc-q')) { el.setAttribute('open', ''); }
  }
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
