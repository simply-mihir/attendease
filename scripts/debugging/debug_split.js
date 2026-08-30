const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 2000));
  
  const midY = 400; // middle of 800
  
  // Let's get the elements at x=100 (left side of the screen) at y=390 and y=410
  const result = await page.evaluate((y1, y2) => {
    function getStack(y) {
      const elements = document.elementsFromPoint(100, y);
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName,
          className: el.className,
          rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
          bg: style.backgroundColor,
          bgImage: style.backgroundImage,
          zIndex: style.zIndex
        };
      });
    }
    return { top: getStack(y1), bottom: getStack(y2) };
  }, midY - 10, midY + 10);
  
  console.log(JSON.stringify(result, null, 2));
  
  await browser.close();
})();
