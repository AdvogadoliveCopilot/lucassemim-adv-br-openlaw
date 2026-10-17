/* =========================================================== */
/* === ARQUIVO: js/logo-elite.js (atalho do HeaderElite V5)  === */
/* === 15/10/2026 — o site passou a ter UM só cabeçalho:     === */
/* === js/header-elite.js. Este arquivo existe apenas porque === */
/* === ~120 páginas de notícias ainda carregam logo-elite.js; === */
/* === ele carrega o cabeçalho único e troca o menu antigo.  === */
/* === (O menu estático antigo da página continua no HTML    === */
/* === como reserva: se este script falhar, nada some.)      === */
/* =========================================================== */
(function () {
  'use strict';
  if (window.HeaderElite && window.HeaderElite.version) { window.HeaderElite.init(); return; }

  /* já existe um <script src=".../header-elite.js"> na página? então ele mesmo se inicia */
  var tags = document.getElementsByTagName('script');
  for (var i = 0; i < tags.length; i++) {
    if (/\/header-elite\.js(\?|$)/.test(tags[i].src || '')) return;
  }

  /* mesma pasta deste arquivo (funciona com caminho relativo ou absoluto) */
  var base = '/js/';
  try {
    var cur = document.currentScript;
    if (cur && cur.src) base = cur.src.slice(0, cur.src.lastIndexOf('/') + 1);
  } catch (e) { }

  var s = document.createElement('script');
  s.src = base + 'header-elite.js?v=20261015';
  s.async = false;
  (document.head || document.documentElement).appendChild(s);
})();
