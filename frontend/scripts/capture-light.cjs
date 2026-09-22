const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REVIEW_DIR = path.join(__dirname, '..', 'review', 'light-new');
const BASE_URL = 'http://localhost:5178';

// Pages to screenshot (matching the route paths)
const pages = [
  { name: 'dashboard', path: '/' },
  { name: 'live-threats', path: '/live-threats' },
  { name: 'network-map', path: '/network-map' },
  { name: 'analytics', path: '/analytics' },
  { name: 'ai-analyzer', path: '/ai-analyzer' },
  { name: 'attack', path: '/attack' },
  { name: 'diode-lab', path: '/diode-lab' },
];

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Enable light mode by setting localStorage before any page loads
  await context.addInitScript(() => {
    localStorage.setItem('watchtower-theme', 'light');
  });

  for (const pageConfig of pages) {
    console.log(`Capturing ${pageConfig.name}...`);
    const page = await context.newPage();

    // Set light mode in localStorage before navigation
    await page.goto(BASE_URL + pageConfig.path, { waitUntil: 'networkidle', timeout: 30000 });

    // Ensure light mode is active
    await page.evaluate(() => {
      const root = document.documentElement;
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('watchtower-theme', 'light');
    });

    // Wait for WebSocket connections and data to populate
    if (pageConfig.path === '/attack') {
      await page.waitForTimeout(5000); // Let demo sequence run
    } else if (pageConfig.path === '/diode-lab') {
      await page.waitForTimeout(2000);
    } else {
      await page.waitForTimeout(3000); // Let WS data flow in
    }

    // Take screenshot
    const screenshotPath = path.join(REVIEW_DIR, `${pageConfig.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`  Saved: ${screenshotPath}`);
    await page.close();
  }

  await browser.close();
  console.log('\nAll screenshots captured!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
