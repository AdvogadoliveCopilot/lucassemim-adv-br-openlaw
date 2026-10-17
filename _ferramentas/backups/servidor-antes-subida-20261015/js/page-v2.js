/* Design V2 — páginas internas (hubs, "o que fazer agora", cidades).
   Injeta: barra de progresso, selos, bloco Central do Caso, CTA duplo, busca no hub, reveal.
   Sem JS a página continua 100% normal. */
(function () {
  'use strict';
  var d = document, path = location.pathname.replace(/\/index\.html$/, '/');
  var isOQFA = /\/o-que-fazer-agora\//.test(path);
  var isHubOQFA = /\/o-que-fazer-agora\/$/.test(path);
  var isCriminalistaDir = /\/advogado-criminalista\//.test(path);
  var isHubCrim = /\/advogado-criminalista\/$/.test(path);
  var isCity = isCriminalistaDir && !isHubCrim;
  /* molde V3 (css/oqfa-v3.css + js/oqfa-v3.js) traz os próprios CTAs e a busca do índice: aqui ficam só o progresso de leitura e o reveal */
  var oq3 = d.documentElement.classList.contains('oq3');
  if (!isOQFA && !isCriminalistaDir) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CC = '/diagnostico.html';

  function el(html) { var t = d.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }

  /* --- bloco Central do Caso --- */
  function ccBlock(titulo, sub) {
    return el(
      '<section class="v2p-cc" aria-label="Central do Caso">' +
      '<p class="v2p-cc-kicker"><i class="fas fa-bolt"></i> Central do Caso Criminal</p>' +
      '<h2 class="v2p-cc-title">' + titulo + '</h2>' +
      '<p class="v2p-cc-sub">' + sub + '</p>' +
      '<div class="v2p-cc-grid">' +
      '<a class="v2p-cc-btn urg" href="' + CC + '?modo=urgencia"><b><i class="fas fa-bolt"></i> Preso / urgente</b><span>Plantão: o Dr. Lucas é acionado na hora.</span></a>' +
      '<a class="v2p-cc-btn" href="' + CC + '?modo=processo"><b><i class="fas fa-folder-open"></i> Já tenho processo</b><span>Envie o número e receba uma análise.</span></a>' +
      '<a class="v2p-cc-btn" href="' + CC + '?modo=busca"><b><i class="fas fa-magnifying-glass"></i> Busca e apreensão</b><span>Celular, documentos e bens levados.</span></a>' +
      '</div>' +
      '<div class="v2p-cc-foot"><span><i class="fas fa-lock"></i>Sigilo profissional</span><span><i class="fas fa-clock"></i>Resposta rápida</span><span><i class="fas fa-circle-check"></i>OAB/MG 222.539</span></div>' +
      '</section>'
    );
  }

  function chips() {
    return el(
      '<ul class="v2p-chips" aria-label="Diferenciais">' +
      '<li class="live"><i class="fas fa-circle"></i>Plantão 24h</li>' +
      '<li><i class="fas fa-shield-halved"></i>Sigilo total</li>' +
      '<li><i class="fas fa-location-dot"></i>Sabará &amp; Grande BH</li>' +
      '<li><i class="fas fa-scale-balanced"></i>OAB/MG 222.539</li>' +
      '</ul>'
    );
  }

  function insertAfter(ref, node) { ref.parentNode.insertBefore(node, ref.nextSibling); }

  function build() {
    d.documentElement.classList.add('v2p');
    if (isHubCrim) d.body.classList.add('v2p-hub');

    /* progresso de leitura */
    var bar = el('<div class="v2p-progress" aria-hidden="true"></div>');
    d.body.appendChild(bar);
    var tick = false;
    function prog() {
      var h = d.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();

    /* OQFA: selos + Central do Caso */
    if (isOQFA && !oq3) {
      var h1 = d.querySelector('.h1-urgency');
      var box = d.querySelector('.urgent-box');
      if (h1 && !d.querySelector('.v2p-chips')) insertAfter(h1, chips());
      if (box && !d.querySelector('.v2p-cc')) {
        insertAfter(box, ccBlock(
          isHubOQFA ? 'Conte o seu caso em 2 minutos' : 'Quer um advogado no seu caso agora?',
          'Responda poucas perguntas e o Dr. Lucas recebe tudo organizado, com protocolo. Urgência de prisão é encaminhada na hora.'
        ));
      }
      /* CTA duplo no rodapé fixo */
      var st = d.querySelector('.sticky-cta-urgency');
      if (st && !st.querySelector('.v2p-sticky-cc')) {
        st.appendChild(el('<a class="v2p-sticky-cc" href="' + CC + '?modo=urgencia"><i class="fas fa-bolt"></i><span>Central</span></a>'));
      }
      /* bloco de fechamento antes do FAQ ou do fim do conteúdo */
      var closing = d.querySelector('.faq-container-urgency') || d.querySelector('.guide-grid');
      if (closing && !isHubOQFA && !d.querySelector('.v2p-cc.fim')) {
        var c2 = ccBlock('Não deixe para depois', 'Prazos em processo criminal correm contra você. Fale com a defesa antes que a próxima decisão saia.');
        c2.classList.add('fim');
        closing.parentNode.insertBefore(c2, closing);
      }
    }

    /* Hub OQFA: busca nos guias */
    if (isHubOQFA && !oq3) {
      var grid = d.querySelector('.guide-grid');
      if (grid && !d.getElementById('v2p-q')) {
        var box2 = el(
          '<div class="v2p-search"><i class="fas fa-magnifying-glass"></i>' +
          '<input id="v2p-q" type="search" placeholder="Busque sua situação: flagrante, mandado, tráfico, filho preso…" aria-label="Buscar guia" autocomplete="off"></div>'
        );
        var empty = el('<p class="v2p-empty" id="v2p-empty">Não achou o seu caso? <a href="' + CC + '?modo=urgencia">Conte para o Dr. Lucas pela Central do Caso</a>.</p>');
        grid.parentNode.insertBefore(box2, grid);
        grid.parentNode.insertBefore(empty, grid.nextSibling);
        var cards = Array.prototype.slice.call(grid.querySelectorAll('.guide-card'));
        var norm = function (s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
        box2.querySelector('input').addEventListener('input', function (e) {
          var q = norm(e.target.value).trim(), n = 0;
          cards.forEach(function (c) {
            var ok = !q || norm(c.textContent).indexOf(q) > -1;
            c.style.display = ok ? '' : 'none'; if (ok) n++;
          });
          empty.style.display = n ? 'none' : 'block';
        });
      }
    }

    /* Cidades: Central do Caso logo depois do hero + fechamento */
    if (isCity) {
      var hero = d.querySelector('main > section');
      if (hero && !d.querySelector('.v2p-cc')) {
        var wrap = d.createElement('div'); wrap.className = 'container';
        wrap.appendChild(ccBlock('Conte o seu caso em 2 minutos', 'Atendimento criminal em toda a comarca. Responda poucas perguntas e o Dr. Lucas recebe tudo organizado, com protocolo.'));
        insertAfter(hero, wrap);
      }
      var main = d.querySelector('main');
      if (main && !d.querySelector('.v2p-cc.fim')) {
        var w2 = d.createElement('div'); w2.className = 'container';
        var c3 = ccBlock('Cada hora conta na defesa criminal', 'Prisão, intimação ou processo em andamento: comece pela Central do Caso e saia com um plano.');
        c3.classList.add('fim'); w2.appendChild(c3); main.appendChild(w2);
      }
    }

    /* Hub criminalista: Central logo após a seção de autoridade */
    if (isHubCrim) {
      var anchor = d.querySelector('.trust-section') || d.querySelector('.authority-section');
      if (anchor && !d.querySelector('.v2p-cc')) {
        insertAfter(anchor, ccBlock('Conte o seu caso em 2 minutos', 'Escolha a sua situação e o Dr. Lucas recebe tudo organizado, com protocolo. Urgência de prisão é encaminhada na hora.'));
      }
    }

    reveal();
  }

  /* reveal só abaixo da dobra */
  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = [
      '.check-item-urgency', '.guide-card', '.age-card', '.warning-box', '.faq-item-urgency', '.section-title-urgency',
      '.timeline-step', '[class*="crime-card"]', '[class*="tese-card"]', '[class*="tese-mini"]', '[class*="live-card"]',
      '.bairro-card', '.counter-card', '.depo-card', '.v2p-cc'
    ].join(',');
    var vh = window.innerHeight || 800;
    var els = Array.prototype.slice.call(d.querySelectorAll(sel)).filter(function (e) {
      return e.getBoundingClientRect().top > vh * 0.95;
    });
    if (!els.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('v2p-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (e, i) {
      e.classList.add('v2p-reveal'); e.style.setProperty('--v2-d', ((i % 3) * 0.07) + 's'); io.observe(e);
    });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('v2p-in'); }); }, 6000);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', build); else build();
})();
