import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER_ERR:', err.message || err));
  
  await page.goto('http://localhost:5173');
  await new Promise(r => setTimeout(r, 2000));
  
  try {
    console.log('Clicking admin tab...');
    await page.click('.nav-item.admin-nav-item');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('Clicking Novo Registro...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text.includes('Novo Registro')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
  } catch (e) {
    console.error('Test script error:', e);
  }
  
  await browser.close();
  process.exit(0);
})();
