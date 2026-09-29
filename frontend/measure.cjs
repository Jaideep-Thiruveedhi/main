const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  const start = Date.now();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !msg.text().includes('React DevTools')) {
      errors.push({ t: Date.now() - start, text: msg.text().slice(0, 90) });
    }
  });
  page.on('pageerror', (err) => errors.push({ t: Date.now() - start, text: 'PAGEERROR ' + err.message.slice(0, 90) }));

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('canvas', { timeout: 60000 });
  console.log('canvas at', Date.now() - start, 'ms');

  await new Promise((r) => setTimeout(r, 8000));
  const fps = await page.evaluate(() => new Promise((resolve) => {
    let f = 0; const t0 = performance.now();
    (function tick(){ f++; performance.now()-t0 < 2000 ? requestAnimationFrame(tick) : resolve(Math.round(f*1000/(performance.now()-t0))); })();
  }));

  const info = await page.evaluate(() => {
    const c = document.querySelector('canvas');
    return { canvasW: c?.width, canvasH: c?.height, hasWebGL: !!(c && (c.getContext('webgl2') || c.getContext('webgl'))) };
  });

  console.log('FPS', fps, '| canvas', info.canvasW + 'x' + info.canvasH, '| webgl', info.hasWebGL);
  console.log('error count:', errors.length);
  const buckets = {};
  errors.forEach(e => { const k = Math.floor(e.t/1000); buckets[k] = (buckets[k]||0)+1; });
  console.log('errors per second:', JSON.stringify(buckets));
  if (errors.length) console.log('first:', errors[0].text, '| last:', errors[errors.length-1].t, 'ms');

  await page.screenshot({ path: 'C:\\Users\\jaide\\AppData\\Local\\Temp\\opencode\\world-check.png' });
  await browser.close();
})();
