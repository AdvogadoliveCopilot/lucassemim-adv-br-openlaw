// Teste visual do header unificado — desktop e mobile
const path = require('path');
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');

const BASE = 'http://localhost:8137';
const paginas = [
  { nome: 'news-migrada', url: '/news/advocacia-humanizada-reintegracao-esperanca.html' },
  { nome: 'news-padrao',  url: '/news/stj-busca-apreensao-5h-manha.html' },
  { nome: 'home-lux',     url: '/index.html' },
  { nome: 'calculadora',  url: '/legal-tech/calculadora-prescricao.html' },
  { nome: 'custodia',     url: '/defesa-criminal/audiencia-de-custodia-prazos-direitos-liberdade-provisoria-bh.html' },
  { nome: 'politica',     url: '/politica-de-privacidade.html' },
  { nome: 'portal-investidor', url: '/portal-investidor.html' },
  { nome: 'o-que-fazer',  url: '/o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html' },
];

const viewports = [
  { nome: 'desktop', w: 1440, h: 900 },
  { nome: 'notebook', w: 1200, h: 800 },
  { nome: 'celular', w: 390, h: 844, mobile: true },
];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const out = [];
  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewport({ width: vp.w, height: vp.h, isMobile: !!vp.mobile, hasTouch: !!vp.mobile });
    for (const p of paginas) {
      const erros = [];
      page.on('pageerror', e => erros.push(e.message));
      try {
        await page.goto(BASE + p.url, { waitUntil: 'networkidle2', timeout: 30000 });
      } catch (e) { erros.push('nav: ' + e.message); }
      await new Promise(r => setTimeout(r, 700));
      const info = await page.evaluate(() => {
        const nav = document.getElementById('header-elite-nav');
        const legacy = document.querySelectorAll('nav.navbar-custom, nav.navbar-vip').length;
        let visivel = false, toggleNaTela = true;
        if (nav) {
          const r = nav.getBoundingClientRect();
          visivel = r.width > 0 && r.height > 30 && r.top <= 5;
          const t = nav.querySelector('.he-toggle');
          if (t) { const tr = t.getBoundingClientRect(); toggleNaTela = tr.right <= window.innerWidth + 1 && tr.left >= -1; }
        }
        return { temHeader: !!nav, visivel, legacy, toggleNaTela, largura: innerWidth };
      });
      out.push({ vp: vp.nome, pagina: p.nome, ...info, errosJs: erros.slice(0, 3) });
      await page.screenshot({ path: `_ferramentas/header-unificado-20261015/shots/${vp.nome}-${p.nome}.png` });
      // teste mobile: abrir a gaveta
      if (vp.mobile) {
        const abriu = await page.evaluate(() => {
          const t = document.querySelector('#header-elite-nav .he-toggle');
          if (!t) return false;
          t.click();
          const c = document.querySelector('.he-collapse');
          return c && c.classList.contains('open');
        });
        out.push({ vp: vp.nome, pagina: p.nome + '+gaveta', gavetaAbriu: abriu });
      }
    }
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(out, null, 1));
})();
