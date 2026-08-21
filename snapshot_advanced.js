const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'snapshot_advanced.png' });
  
  // Dump outerHTML
  const html = await page.evaluate(() => document.documentElement.outerHTML);
  fs.writeFileSync('dom_dump.html', html);
  
  // Dump computed heights of major containers
  const heights = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll('div'));
    return divs.filter(d => d.className && d.className.includes('min-h-screen')).map(d => ({
      className: d.className,
      clientHeight: d.clientHeight,
      offsetHeight: d.offsetHeight,
      scrollHeight: d.scrollHeight,
      getBoundingClientRect: d.getBoundingClientRect()
    }));
  });
  fs.writeFileSync('heights.json', JSON.stringify(heights, null, 2));

  await browser.close();
})();
