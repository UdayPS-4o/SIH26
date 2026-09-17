const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Screenshot 1: Light mode dashboard
  await page.goto('http://localhost:5178/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(2000);
  const btn = await page.$('[title="Switch to dark mode"]') || await page.$('[title="Switch to light mode"]');
  if (btn) { await btn.click(); await page.waitForTimeout(800); }
  await page.screenshot({ path: 'C:/Users/udayp/Documents/code/SIH26/26145/SCREENSHOTS/00-dashboard-light.png', fullPage: false });
  console.log('Light mode saved');

  // Screenshot 2: Attack panel
  await page.goto('http://localhost:5178/attack', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/udayp/Documents/code/SIH26/26145/SCREENSHOTS/06-attack.png', fullPage: false });
  console.log('Attack page saved');

  // Screenshot 3: Review page top
  await page.goto('http://localhost:5178/review', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'C:/Users/udayp/Documents/code/SIH26/26145/SCREENSHOTS/07-review.png', fullPage: false });
  console.log('Review page saved');

  await browser.close();
  console.log('Done');
})().catch(e => { console.error(e); process.exit(1); });
