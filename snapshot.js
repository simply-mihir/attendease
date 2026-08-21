const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  
  // Wait a couple of seconds for animations
  await new Promise(r => setTimeout(r, 2000));
  
  await page.screenshot({ path: 'snapshot_local.png' });
  await browser.close();
})();
