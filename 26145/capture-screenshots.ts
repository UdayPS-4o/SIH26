import { chromium } from 'playwright';

const BASE = 'http://localhost:5178';
const OUT = 'C:/Users/udayp/Documents/code/SIH26/26145/review';

const PAGES = [
  { name: 'dashboard',      path: '/' },
  { name: 'live-threats',   path: '/live-threats' },
  { name: 'network-map',    path: '/network-map' },
  { name: 'ai-analyzer',    path: '/ai-analyzer' },
  { name: 'diode-lab',      path: '/diode-lab' },
  { name: 'analytics',      path: '/analytics' },
  { name: 'materials',      path: '/materials' },
  { name: 'activity',       path: '/activity' },
  { name: 'admin',          path: '/admin' },
  { name: 'integrations',   path: '/integrations' },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const p of PAGES) {
    // ---- Dark mode ----
    const page = await context.newPage();
    await page.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${OUT}/dark/${p.name}.png`, fullPage: true });
    console.log(`  dark:  ${p.name}`);
    await page.close();

    // ---- Light mode ----
    const pageL = await context.newPage();
    await pageL.goto(`${BASE}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 });
    await pageL.waitForTimeout(500);
    // Flip to light mode via theme toggle button
    await pageL.click('.theme-toggle');
    await pageL.waitForTimeout(1000);
    await pageL.screenshot({ path: `${OUT}/light/${p.name}.png`, fullPage: true });
    console.log(`  light: ${p.name}`);
    await pageL.close();
  }

  await browser.close();
  console.log('\nDone — screenshots saved to', OUT);
}

main().catch(e => { console.error(e); process.exit(1); });
