// Screenshot de zoom no canto direito do header (escudo + plantão) no desktop
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8137/index.html', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 2500));
  const el = await page.$('#header-elite-nav .he-actions');
  const nav = await page.$('#header-elite-nav');
  if (nav) await nav.screenshot({ path: '_ferramentas/header-unificado-20261015/shots/nav-zoom-desktop.png' });
  await browser.close();
  console.log('ok');
})();
