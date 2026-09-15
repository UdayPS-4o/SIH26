import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:59331';
const OUT = 'C:/Users/udayp/Documents/code/SIH26/26099/frontend/review';
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Login
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  await page.getByPlaceholder('Your name (optional)').fill('Admin');
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Admin' }).click();
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForTimeout(800);

  // Capture login and dashboard
  await page.screenshot({ path: path.join(OUT, '01-login.png') });
  await page.screenshot({ path: path.join(OUT, '02-dashboard.png') });

  // Navigate to each page via URL
  const routes = [
    { url: '/overview', file: '03-overview.png' },
    { url: '/explorer', file: '04-explorer.png' },
    { url: '/matching', file: '05-matching.png' },
    { url: '/duplicates', file: '06-duplicates.png' },
    { url: '/savings', file: '07-savings.png' },
    { url: '/registry', file: '08-registry.png' },
    { url: '/migration', file: '09-migration.png' },
    { url: '/integration', file: '10-integration.png' },
    { url: '/import', file: '11-import.png' },
    { url: '/normalize', file: '12-normalize.png' },
    { url: '/activity', file: '13-activity.png' },
    { url: '/engine', file: '14-engine.png' },
  ];

  for (const r of routes) {
    await page.goto(BASE + r.url, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, r.file) });
    console.log('Captured:', r.file);
  }

  await browser.close();
  console.log('Done. All screenshots in', OUT);
})();
