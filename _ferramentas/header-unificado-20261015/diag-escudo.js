// O glifo do escudo (fa-shield-halved) renderiza?
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:8137/index.html', { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise(r => setTimeout(r, 1500));
  const d = await page.evaluate(() => {
    const i = document.querySelector('.he-btn-cliente i');
    if (!i) return { tem: false };
    const cs = getComputedStyle(i, '::before');
    return { tem: true, cls: i.className, content: cs.content, family: cs.fontFamily, weight: cs.fontWeight };
  });
  console.log(JSON.stringify(d, null, 1));
  await browser.close();
})();
