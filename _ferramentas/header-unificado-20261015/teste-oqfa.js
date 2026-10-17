// Teste da página o-que-fazer servindo o domínio real via hosts local:
// intercepta requests para lucassemim.adv.br e responde do disco (request interception)
const path = require('path');
const fs = require('fs');
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');

const ROOT = 'C:\\Users\\adm\\Desktop\\lucassemim.adv.br';
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain' };

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.setRequestInterception(true);
  page.on('request', req => {
    const url = new URL(req.url());
    if (url.hostname === 'lucassemim.adv.br') {
      let p = decodeURIComponent(url.pathname).replace(/^\//, '').replace(/\//g, '\\');
      let f = path.join(ROOT, p);
      if (!fs.existsSync(f) && fs.existsSync(path.join(f, 'index.html'))) f = path.join(f, 'index.html');
      if (fs.existsSync(f)) {
        req.respond({ status: 200, contentType: MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', body: fs.readFileSync(f) });
      } else { req.respond({ status: 404, body: 'nf' }); }
    } else { req.continue(); }
  });
  await page.goto('https://lucassemim.adv.br/o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html', { waitUntil: 'networkidle2', timeout: 60000 }).catch(e => console.log('nav:', e.message));
  await new Promise(r => setTimeout(r, 1200));
  const d = await page.evaluate(() => {
    const nav = document.getElementById('header-elite-nav');
    const t = nav && nav.querySelector('.he-toggle');
    const tr = t && t.getBoundingClientRect();
    return { temHeader: !!nav, toggleDentro: tr ? (tr.right <= innerWidth + 1 && tr.left >= -1) : null, legacy: document.querySelectorAll('nav.navbar-custom').length };
  });
  console.log(JSON.stringify(d));
  await page.screenshot({ path: ROOT + '\\_ferramentas\\header-unificado-20261015\\shots\\celular-oqfa-intercept.png' });
  await browser.close();
})();
