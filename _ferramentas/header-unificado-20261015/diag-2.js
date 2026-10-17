// Título overflow? text metrics e quebra possível
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8137/news/advocacia-humanizada-reintegracao-esperanca.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 900));
  const d = await page.evaluate(() => {
    const brand = document.querySelector('.he-brand');
    const text = brand.querySelector('.he-text-group');
    const title = brand.querySelector('.he-title');
    const toggle = document.querySelector('.he-toggle');
    const actions = document.querySelector('.he-actions');
    const r = el => { const x = el.getBoundingClientRect(); return { l: Math.round(x.left), r: Math.round(x.right), w: Math.round(x.width) }; };
    return {
      brand: r(brand), text: r(text), title: r(title),
      textoTitle: title.textContent,
      whitespace: getComputedStyle(title).whiteSpace,
      toggle: r(toggle), actions: r(actions),
      containerPad: getComputedStyle(brand.parentElement).padding,
      gap: getComputedStyle(brand.parentElement).gap,
    };
  });
  console.log(JSON.stringify(d, null, 1));
  await browser.close();
})();
