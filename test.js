import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => {
    if(!response.ok()) console.log('RESPONSE FAILED:', response.url(), response.status());
  });

  await page.goto('https://yantrabyte.anantatechcare.com/', {waitUntil: 'networkidle0'});
  console.log("PAGE TITLE:", await page.title());
  await browser.close();
})();
