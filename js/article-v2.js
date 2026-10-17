/* Design V2 — artigos (defesa-criminal e notícias).
   Injeta: barra de progresso, selos de confiança, sumário, convite curto, bloco Central do Caso, tabelas rolando de lado.
   Não troca nenhum texto do artigo. Sem JS a página continua 100% normal. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  if (root.getAttribute('data-v2a') === '1') return;
  root.setAttribute('data-v2a', '1');
  root.classList.add('v2a');

  var BASE = 'https://lucassemim.adv.br';
  var CC = BASE + '/diagnostico.html';
  var WA = '5531989420094';
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(html) { var t = d.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }
  function after(ref, node) { if (ref && ref.parentNode) ref.parentNode.insertBefore(node, ref.nextSibling); }
  function before(ref, node) { if (ref && ref.parentNode) ref.parentNode.insertBefore(node, ref); }
  function attr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
  function slug(s) {
    return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'secao';
  }

  var h1 = d.querySelector('h1');
  var titulo = h1 ? h1.textContent.replace(/\s+/g, ' ').trim() : (d.title || '');
  var waHref = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Olá, Dr. Lucas! Li "' + titulo + '" no seu site e preciso de orientação.');

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

  function ccFull(titulo2, sub) {
    return el(
      '<section class="v2p-cc" aria-label="Central do Caso">' +
      '<p class="v2p-cc-kicker"><i class="fas fa-bolt"></i> Central do Caso Criminal</p>' +
      '<p class="v2p-cc-title">' + titulo2 + '</p>' +
      '<p class="v2p-cc-sub">' + sub + '</p>' +
      '<div class="v2p-cc-grid">' +
      '<a class="v2p-cc-btn urg" href="' + CC + '?modo=urgencia"><b><i class="fas fa-bolt"></i> Preso / urgente</b><span>Plantão: aviso direto ao Dr. Lucas.</span></a>' +
      '<a class="v2p-cc-btn" href="' + CC + '?modo=processo"><b><i class="fas fa-folder-open"></i> Já tenho processo</b><span>Envie o número e receba uma análise.</span></a>' +
      '<a class="v2p-cc-btn" href="' + CC + '?modo=busca"><b><i class="fas fa-magnifying-glass"></i> Busca e apreensão</b><span>Celular, documentos e bens levados.</span></a>' +
      '</div>' +
      '<div class="v2p-cc-foot"><span><i class="fas fa-lock"></i>Sigilo profissional</span><span><i class="fas fa-user-tie"></i>Atendimento humano</span><span><i class="fas fa-circle-check"></i>OAB/MG 222.539</span></div>' +
      '</section>'
    );
  }

  function ccMini() {
    return el(
      '<aside class="v2a-mini" aria-label="Fale com a defesa">' +
      '<p class="v2a-mini-t"><b>Isso é o seu caso?</b><span>Conte em 2 minutos. O Dr. Lucas recebe tudo organizado, com protocolo.</span></p>' +
      '<div class="v2a-mini-act">' +
      '<a class="v2a-mini-btn" href="' + CC + '?modo=urgencia"><i class="fas fa-bolt"></i> Central do Caso</a>' +
      '<a class="v2a-mini-btn wa" href="' + attr(waHref) + '" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a>' +
      '</div></aside>'
    );
  }

  function build() {
    /* progresso de leitura */
    var bar = el('<div class="v2p-progress" aria-hidden="true"></div>');
    d.body.appendChild(bar);
    var tick = false;
    function prog() {
      var h = d.documentElement.scrollHeight - w.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, w.scrollY / h) : 0) + ')';
      tick = false;
    }
    w.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();

    /* abertura: selos de confiança */
    var hero = d.querySelector('.article-header') || d.querySelector('.hero-news') || (h1 && h1.parentNode);
    if (hero && !d.querySelector('.v2p-chips')) {
      var anchor = hero.querySelector('.article-meta') || hero.querySelector('.article-subtitle') ||
                   hero.querySelector('.article-lead') || h1;
      if (anchor) {
        var ch = chips();
        after(anchor, ch);
        try {
          var cs = w.getComputedStyle(anchor), pcs = w.getComputedStyle(anchor.parentNode || anchor);
          if (cs.textAlign === 'center' || cs.justifyContent === 'center' || pcs.textAlign === 'center') ch.classList.add('ctr');
        } catch (e) {}
      }
    }

    /* corpo do artigo */
    var art = d.querySelector('.content-area') || d.querySelector('.article-content') || d.querySelector('article');
    if (!art) return;

    /* tabelas rolam de lado no celular */
    var tabs = art.querySelectorAll('table');
    for (var i = 0; i < tabs.length; i++) {
      var t = tabs[i];
      if (t.parentNode && !t.parentNode.classList.contains('v2a-table') && !t.closest('.table-responsive')) {
        var wrap = d.createElement('div'); wrap.className = 'v2a-table';
        t.parentNode.insertBefore(wrap, t); wrap.appendChild(t);
      }
    }

    var h2s = Array.prototype.slice.call(art.querySelectorAll('h2'));
    var firstH2 = h2s[0];

    /* sumário (só em texto longo e se a página ainda não tem um) */
    var temSumario = !!d.querySelector('[class*="toc"],[class*="sumario"],[id*="toc"],[id*="sumario"]');
    if (h2s.length >= 4 && !temSumario) {
      var used = {}, items = '';
      h2s.forEach(function (h) {
        if (!h.id) { var s = slug(h.textContent), n = s, k = 2; while (used[n] || d.getElementById(n)) { n = s + '-' + (k++); } h.id = n; }
        used[h.id] = 1;
        items += '<li><a href="#' + attr(h.id) + '">' + h.textContent.replace(/\s+/g, ' ').trim().replace(/</g, '&lt;') + '</a></li>';
      });
      var toc = el('<nav class="v2a-toc" aria-label="Neste guia"><p class="v2a-toc-t">Neste guia</p><ol>' + items + '</ol></nav>');
      before(firstH2, toc);
    }

    /* convite curto antes do 1º subtítulo (ou depois do 2º parágrafo) */
    if (!d.querySelector('.v2a-mini')) {
      if (firstH2 && firstH2.previousElementSibling) before(firstH2, ccMini());
      else {
        var ps = art.querySelectorAll(':scope > p');
        if (ps.length >= 2) after(ps[1], ccMini());
      }
    }

    /* fechamento: Central do Caso completa antes de "leia também"/rodapé */
    if (!d.querySelector('.v2p-cc')) {
      var cc = ccFull('Cada hora conta na defesa criminal',
        'Prisão, intimação ou processo em andamento: comece pela Central do Caso e conte o que aconteceu. Se alguém foi preso, use o botão de plantão.');
      var raa = d.querySelector('.raa-section');
      if (raa && raa.parentNode) {
        var box = d.createElement('div'); box.className = 'container';
        box.appendChild(cc);
        before(raa, box);
      } else {
        /* se o texto e uma coluna da grade (row), o bloco vai DEPOIS da grade: assim nao empurra a barra lateral */
        var row = null, n = art;
        while (n && n.parentNode && n !== d.body) {
          if (n.parentNode.classList && n.parentNode.classList.contains('row')) { row = n.parentNode; break; }
          n = n.parentNode;
        }
        if (row && row.parentNode) {
          var wrap2 = d.createElement('div');
          wrap2.className = 'v2a-cc-wrap' + (row.parentNode.classList.contains('container') ? '' : ' container');
          wrap2.appendChild(cc);
          after(row, wrap2);
        } else {
          after(art, cc);
        }
      }
    }
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', build); else build();
})();
