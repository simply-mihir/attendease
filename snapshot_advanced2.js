const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  const heights = await page.evaluate(() => {
    return {
      html: { clientHeight: document.documentElement.clientHeight, scrollHeight: document.documentElement.scrollHeight },
      body: { clientHeight: document.body.clientHeight, scrollHeight: document.body.scrollHeight }
    };
  });
  fs.writeFileSync('heights2.json', JSON.stringify(heights, null, 2));

  await browser.close();
})();
