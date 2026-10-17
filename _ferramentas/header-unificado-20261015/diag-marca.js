// Diagnóstico computado: font-size do título da marca no celular nas notícias
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8137/news/advocacia-humanizada-reintegracao-esperanca.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 900));
  const d = await page.evaluate(() => {
    const g = s => { const el = document.querySelector(s); if (!el) return null; const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return { fs: cs.fontSize, w: Math.round(r.width), h: Math.round(r.height), display: cs.display }; };
    return {
      title: g('.he-title'), brand: g('.he-brand'), balanca: g('.he-balanca'),
      navH: Math.round(document.getElementById('header-elite-nav').getBoundingClientRect().height),
      fonts: Array.from(document.querySelectorAll('link[href*="fonts.googleapis"]')).map(l => l.href.slice(0, 80)),
    };
  });
  console.log(JSON.stringify(d, null, 1));
  await browser.close();
})();
