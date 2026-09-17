const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Capture light mode
  await page.goto('http://localhost:5178/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(2000);
  const btn = await page.$('[title="Switch to dark mode"]') || await page.$('[title="Switch to light mode"]');
  if (btn) { await btn.click(); await page.waitForTimeout(600); }
  await page.screenshot({ path: 'C:/Users/udayp/Documents/code/SIH26/26145/SCREENSHOTS/00-dashboard-light.png', fullPage: false });
  console.log('Light mode saved');

  // Capture attack page
  await page.goto('http://localhost:5178/attack', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/udayp/Documents/code/SIH26/26145/SCREENSHOTS/06-attack.png', fullPage: false });
  console.log('Attack page saved');

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
