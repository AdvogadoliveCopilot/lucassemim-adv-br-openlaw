// Diagnóstico: o que ultrapassa a largura da viewport nas notícias (celular)
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8137/news/advocacia-humanizada-reintegracao-esperanca.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 800));
  const d = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const nav = document.getElementById('header-elite-nav');
    const t = nav && nav.querySelector('.he-toggle');
    const tr = t && t.getBoundingClientRect();
    const brand = nav && nav.querySelector('.he-brand');
    const br = brand && brand.getBoundingClientRect();
    const container = nav && nav.querySelector('.he-container');
    const cr = container && container.getBoundingClientRect();
    // quem causa scroll horizontal no body?
    const docW = document.documentElement.scrollWidth;
    const estourados = [];
    document.querySelectorAll('body *').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        if (estourados.length < 8) estourados.push(el.tagName + '.' + String(el.className).slice(0, 40) + ' right=' + Math.round(r.right) + ' left=' + Math.round(r.left));
      }
    });
    return { vw, innerW: innerWidth, docW, toggle: tr && { l: Math.round(tr.left), r: Math.round(tr.right) }, brand: br && { l: Math.round(br.left), r: Math.round(br.right) }, container: cr && { l: Math.round(cr.left), r: Math.round(cr.right) }, estourados };
  });
  console.log(JSON.stringify(d, null, 1));
  await browser.close();
})();
