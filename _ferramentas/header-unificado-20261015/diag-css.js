// Por que o CSS mobile do header-elite não se aplica nas notícias?
const puppeteer = require(process.env.APPDATA + '\\npm\\node_modules\\puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto('http://localhost:8137/news/advocacia-humanizada-reintegracao-esperanca.html', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 900));
  const d = await page.evaluate(() => {
    const styles = Array.from(document.querySelectorAll('style')).map(s => ({ id: s.id, len: s.textContent.length, temMobile: /Marca compacta no celular/.test(s.textContent), tem991: s.textContent.includes('max-width: 991px') }));
    const t = document.querySelector('.he-title');
    const cs = t && getComputedStyle(t);
    // o que define o font-size?
    let regraVenceu = null;
    for (const sheet of document.styleSheets) {
      try {
        for (const r of sheet.cssRules) {
          if (r.type === 4) { // media
            for (const rr of r.cssRules) {
              if (rr.selectorText && rr.selectorText.includes('.he-title') && rr.style && rr.style.fontSize) {
                regraVenceu = { media: r.conditionText, fs: rr.style.fontSize };
              }
            }
          }
        }
      } catch (e) { /* cross-origin */ }
    }
    return { styles: styles.filter(s => s.id.includes('header-elite') || s.temMobile), fsComputado: cs && cs.fontSize, regraVenceu, nStyles: document.querySelectorAll('style').length };
  });
  console.log(JSON.stringify(d, null, 1));
  await browser.close();
})();
