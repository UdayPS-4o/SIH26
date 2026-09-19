import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5173;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const pages = [
    { path: '/', name: 'dashboard' },
    { path: '/live-threats', name: 'live-threats' },
    { path: '/network-map', name: 'network-map' },
    { path: '/analytics', name: 'analytics' },
    { path: '/ai-analyzer', name: 'ai-analyzer' },
    { path: '/attack', name: 'attack' },
    { path: '/diode-lab', name: 'diode-lab' },
  ];

  const reviewDir = path.join(__dirname, 'review');
  const lightDir = path.join(reviewDir, 'light');
  const darkDir = path.join(reviewDir, 'dark');

  // Ensure dirs exist
  import('fs').then(fs => {
    [lightDir, darkDir].forEach(d => { try { fs.mkdirSync(d, { recursive: true }); } catch {} });
  }).then(async () => {

    for (const p of pages) {
      // ── Dark mode ──
      await page.goto(`http://localhost:${PORT}${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(2000);
      // Ensure dark mode
      const darkBtn = page.locator('button[title="Switch to light mode"]');
      if (await darkBtn.count() > 0) await darkBtn.click();
      await page.waitForTimeout(500);
      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(darkDir, `${p.name}.png`),
        fullPage: true,
      });
      console.log(`✓ Dark: ${p.name}`);

      // ── Light mode ──
      await page.goto(`http://localhost:${PORT}${p.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(1500);
      // Switch to light
      const lightBtn = page.locator('button[title="Switch to dark mode"]');
      if (await lightBtn.count() > 0) await lightBtn.click();
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      await page.screenshot({
        path: path.join(lightDir, `${p.name}.png`),
        fullPage: true,
      });
      console.log(`✓ Light: ${p.name}`);
    }

    await browser.close();
    console.log('\n✅ All screenshots captured!');
  });
}

main().catch(e => { console.error(e); process.exit(1); });
