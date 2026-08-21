const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // Set viewport exactly like the user's screenshot
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://attendease-c7wl.vercel.app/login', { waitUntil: 'networkidle0' });
  
  await page.screenshot({ path: 'live_test.png' });
  await browser.close();
})();
