// Capturar TODOS os erros JS da página o-que-fazer com stack
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  const errs = [];
  page.on('pageerror', e => errs.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type().toUpperCase() + ': ' + m.text().slice(0, 160)); });
  page.on('requestfailed', r => errs.push('REQFAIL: ' + r.url().slice(0, 100) + ' -> ' + (r.failure() && r.failure().errorText)));
  await page.goto('http://localhost:8137/o-que-fazer-agora/acabei-de-ser-preso-em-flagrante.html', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2500));
  const temHeader = await page.evaluate(() => !!document.getElementById('header-elite-nav'));
  console.log('temHeader: ' + temHeader);
  errs.slice(0, 25).forEach(e => console.log(e));
  await browser.close();
})();
