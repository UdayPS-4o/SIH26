import { chromium } from 'playwright';

const BASE = 'http://localhost:5178';
const PAGES = [
  { name: 'dashboard', path: '/' },
  { name: 'live-threats', path: '/live-threats' },
  { name: 'network-map', path: '/network-map' },
  { name: 'analytics', path: '/analytics' },
  { name: 'ai-analyzer', path: '/ai-analyzer' },
  { name: 'materials', path: '/materials' },
  { name: 'activity', path: '/activity' },
  { name: 'integrations', path: '/integrations' },
  { name: 'admin', path: '/admin' },
  { name: 'match', path: '/match' },
  { name: 'attack', path: '/attack' },
  { name: 'review', path: '/review' },
];

const OUT = 'C:/Users/udayp/Documents/code/SIH26/26145/review';

async function screenshotPages() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const pageDef of PAGES) {
    // Dark mode
    const page = await context.newPage();
    await page.goto(`${BASE}${pageDef.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}/dark/${pageDef.name}.png`, fullPage: false });
    await page.close();

    // Light mode
    const pageL = await context.newPage();
    await pageL.goto(`${BASE}${pageDef.path}`, { waitUntil: 'networkidle', timeout: 15000 });
    // Toggle theme
    await pageL.evaluate(() => {
      const btn = document.querySelector('.theme-toggle') as HTMLElement | null;
      if (btn) btn.click();
    });
    await pageL.waitForTimeout(500);
    await pageL.screenshot({ path: `${OUT}/light/${pageDef.name}.png`, fullPage: false });
    await pageL.close();
  }

  await browser.close();
  console.log('Screenshots saved to', OUT);
}

screenshotPages().catch(e => { console.error(e); process.exit(1); });
