const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  { path: '/', name: '01-overview' },
  { path: '/heatmap', name: '02-heatmap' },
  { path: '/elasticity', name: '03-elasticity' },
  { path: '/cross-check', name: '04-cross-check' },
  { path: '/decomposition', name: '05-decomposition' },
  { path: '/methodology', name: '06-methodology' },
  { path: '/backtest', name: '07-backtest' },
  { path: '/compliance', name: '08-compliance' },
  { path: '/health', name: '09-health' },
  { path: '/quotes', name: '10-quotes' },
  { path: '/anomaly', name: '11-anomaly' },
  { path: '/api', name: '12-api' },
  { path: '/forecast', name: '13-forecast' },
  { path: '/reports', name: '14-reports' },
  { path: '/scraper', name: '15-scraper' },
  { path: '/scraper-config', name: '16-scraper-config' },
  { path: '/design-system', name: '17-design-system' },
  { path: '/sectors', name: '18-sectors' },
  { path: '/model-management', name: '19-model-management' },
  { path: '/proxy-pool', name: '20-proxy-pool' },
];

async function main() {
  const baseURL = 'http://localhost:5174';
  const outDir = path.join(__dirname, 'review');

  // Clear the review folder
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  for (const route of ROUTES) {
    console.log(`Capturing ${route.name} at ${route.path}...`);
    await page.goto(`${baseURL}${route.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout; // let charts render
    const filePath = path.join(outDir, `${route.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    console.log(`  -> saved ${filePath}`);
  }

  await browser.close();
  console.log(`\nDone! ${ROUTES.length} screenshots in ${outDir}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
