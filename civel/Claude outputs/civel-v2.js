/* Cível — Design V2. Injeta: barra de leitura, selos, bloco "Central do Caso Cível",
   barra fixa no celular e efeito de entrada. Sem JS a página continua normal. */
(function () {
  'use strict';
  var d = document;
  var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  if (file === '' ) file = 'index.html';
  /* páginas internas/restritas: não mexe */
  if (/^(painel-|cadastro-|sala-reuniao|central-do-caso-civel|google)/.test(file)) return;

  var CENTRAL = 'central-do-caso-civel.html';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* assunto inferido pela página → pré-seleciona na Central */
  var MAP = [
    [/rmc|consignado/, 'rmc', 'Cartão RMC / consignado'],
    [/golpe-pix|golpe/, 'golpe', 'Golpe do Pix / fraude'],
    [/bancario|juros|superendivid|banco-master/, 'banco', 'Banco, juros e dívidas'],
    [/plano-saude|reajuste|cancelamento-plano/, 'saude', 'Plano de saúde'],
    [/seguro|seguradora|dpvat/, 'seguro', 'Seguro negado'],
    [/erro-medico/, 'erro-medico', 'Erro médico'],
    [/acidente|transito/, 'acidente', 'Acidente de trânsito'],
    [/bets|apostas|ludopatia/, 'bets', 'Bets e apostas'],
    [/usucapiao|escritura/, 'usucapiao', 'Usucapião'],
    [/familia|inventario|itcmd|sucess/, 'familia', 'Família e inventário'],
    [/contrato|execucao|cobranca|blindagem/, 'contratos', 'Contratos e cobranças']
  ];
  var tema = null;
  for (var i = 0; i < MAP.length; i++) if (MAP[i][0].test(file)) { tema = MAP[i]; break; }
  function url(assunto) { return CENTRAL + (assunto ? '?assunto=' + assunto : ''); }

  function el(html) { var t = d.createElement('div'); t.innerHTML = html.trim(); return t.firstChild; }
  function after(ref, node) { ref.parentNode.insertBefore(node, ref.nextSibling); }

  function chips() {
    return el('<ul class="c2-chips" aria-label="Diferenciais">' +
      '<li><i class="fas fa-circle-check"></i>Análise gratuita</li>' +
      '<li><i class="fas fa-shield-halved"></i>Sigilo total</li>' +
      '<li><i class="fas fa-hand-holding-dollar"></i>Honorários de êxito</li>' +
      '<li><i class="fas fa-location-dot"></i>BH &amp; Sabará</li></ul>');
  }

  function block() {
    var principal = tema
      ? '<a class="c2-cc-btn main" href="' + url(tema[1]) + '"><b><i class="fas fa-bolt"></i> Analisar meu caso</b><span>' + tema[2] + ': 2 minutos, sem compromisso.</span></a>'
      : '<a class="c2-cc-btn main" href="' + url('') + '"><b><i class="fas fa-bolt"></i> Analisar meu caso</b><span>Conte o que aconteceu, sem compromisso.</span></a>';
    var a2 = tema && tema[1] === 'saude' ? ['seguro', 'Seguro negado', 'fa-file-shield'] : ['saude', 'Plano de saúde', 'fa-heart-pulse'];
    var a3 = tema && tema[1] === 'rmc' ? ['golpe', 'Golpe / fraude', 'fa-user-secret'] : ['rmc', 'Banco, RMC ou golpe', 'fa-building-columns'];
    return el('<section class="c2-cc" aria-label="Central do Caso Cível">' +
      '<p class="c2-cc-kicker"><i class="fas fa-scale-balanced"></i> Central do Caso Cível</p>' +
      '<h2 class="c2-cc-title">Descubra se você tem direito a indenização</h2>' +
      '<p class="c2-cc-sub">Responda poucas perguntas e envie seus documentos. O Dr. Lucas analisa o caso e responde com os próximos passos. Você só paga honorários se ganhar.</p>' +
      '<div class="c2-cc-grid">' + principal +
      '<a class="c2-cc-btn" href="' + url(a2[0]) + '"><b><i class="fas ' + a2[2] + '"></i> ' + a2[1] + '</b><span>Negativa, reajuste ou cancelamento.</span></a>' +
      '<a class="c2-cc-btn" href="' + url(a3[0]) + '"><b><i class="fas ' + a3[2] + '"></i> ' + a3[1] + '</b><span>Descontos e cobranças indevidas.</span></a>' +
      '</div>' +
      '<div class="c2-cc-foot"><span><i class="fas fa-lock"></i>Sigilo profissional</span><span><i class="fas fa-clock"></i>Resposta rápida</span><span><i class="fas fa-circle-check"></i>OAB/MG 222.539</span>' +
      '<a href="' + url('outro') + '">Outro assunto →</a></div></section>');
  }

  /* a maioria das páginas do cível não carrega Font Awesome: garante os ícones */
  function ensureFA() {
    var has = false, ls = d.querySelectorAll('link[rel="stylesheet"]');
    for (var k = 0; k < ls.length; k++) if (/font-?awesome|fontawesome/i.test(ls[k].href)) has = true;
    if (has) return;
    var l = d.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    d.head.appendChild(l);
  }

  function build() {
    d.documentElement.classList.add('c2');
    ensureFA();
    var bar = el('<div class="c2-progress" aria-hidden="true"></div>');
    d.body.appendChild(bar);
    var tick = false;
    function prog() {
      var h = d.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, window.scrollY / h) : 0) + ')';
      tick = false;
    }
    window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(prog); } }, { passive: true });
    prog();

    /* selos dentro do hero, antes dos botões */
    var ctas = d.querySelector('.hero__ctas, [class*="hero"][class$="__ctas"]');
    if (ctas && !d.querySelector('.c2-chips')) ctas.parentNode.insertBefore(chips(), ctas);

    /* botão principal do hero → Central */
    var main = d.querySelector('.hero__ctas .btn-ouro, [class*="hero"][class$="__ctas"] .btn-ouro');
    if (main && /^#/.test(main.getAttribute('href') || '')) main.setAttribute('href', url(tema ? tema[1] : ''));

    /* bloco Central logo depois do hero */
    var hero = d.querySelector('section.hero, section[class^="hero-"], section[class*="-hero"], section[class*="hero"]');
    if (hero && !d.querySelector('.c2-cc')) after(hero, block());
    else if (!d.querySelector('.c2-cc')) { var m = d.querySelector('main') || d.body; m.insertBefore(block(), m.firstChild.nextSibling || null); }

    /* bloco de fechamento antes do CTA final / formulário */
    var fim = d.querySelector('.cta-final') || d.getElementById('analise') || d.getElementById('diagnostico');
    if (fim && !d.querySelector('.c2-cc.fim')) { var b2 = block(); b2.classList.add('fim'); fim.parentNode.insertBefore(b2, fim); }

    /* barra fixa no celular */
    if (!d.querySelector('.c2-dock')) {
      var dock = el('<div class="c2-dock"><a class="a1" href="' + url(tema ? tema[1] : '') + '"><i class="fas fa-bolt"></i> Analisar meu caso</a>' +
        '<a class="a2" href="https://wa.me/5531983944973?text=' + encodeURIComponent('Olá Dr. Lucas, preciso de uma análise do meu caso cível.') + '" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a></div>');
      d.body.appendChild(dock);
    }
    reveal();
  }

  function reveal() {
    if (reduce || !('IntersectionObserver' in window)) return;
    var sel = '.caso-card,.caso-mini,.depo-card,.passo,.passo-card,.accordion-item,.stats__item,.sec-titulo,.c2-cc';
    var vh = window.innerHeight || 800;
    var els = Array.prototype.slice.call(d.querySelectorAll(sel)).filter(function (e) { return e.getBoundingClientRect().top > vh * 0.95; });
    if (!els.length) return;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('c2-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    els.forEach(function (e, i) { e.classList.add('c2-reveal'); e.style.setProperty('--c2-d', ((i % 3) * 0.07) + 's'); io.observe(e); });
    setTimeout(function () { els.forEach(function (e) { e.classList.add('c2-in'); }); }, 6000);
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', build); else build();
})();
