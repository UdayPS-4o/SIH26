const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const REVIEW_DIR = path.join(__dirname, '..', 'review');
const BASE_URL = 'http://localhost:5178';

// All 16 pages with their routes and filenames
const pages = [
  { name: 'dashboard',     path: '/',            title: 'Dashboard' },
  { name: 'live-threats',  path: '/live-threats', title: 'Live Threats' },
  { name: 'network-map',   path: '/network-map',  title: 'Network Map' },
  { name: 'analytics',     path: '/analytics',    title: 'Analytics' },
  { name: 'ai-analyzer',   path: '/ai-analyzer',  title: 'AI Analyzer' },
  { name: 'attack',        path: '/attack',       title: 'Attack Lab' },
  { name: 'diode-lab',     path: '/diode-lab',    title: 'Diode Lab' },
  { name: 'activity',      path: '/activity',     title: 'Activity Log' },
  { name: 'admin',         path: '/admin',        title: 'Administration' },
  { name: 'integrations',  path: '/integrations', title: 'Integrations' },
  { name: 'match',         path: '/match',        title: 'Match Analysis' },
  { name: 'materials',     path: '/materials',    title: 'Materials' },
  { name: 'review',        path: '/review',       title: 'Review' },
  { name: 'evidence',      path: '/evidence',     title: 'Evidence Locker' },
  { name: 'egress',        path: '/egress',       title: 'Egress Terminal' },
];

const waitTimes = {
  '/attack': 4000,
  '/diode-lab': 2000,
  '/network-map': 3000,
};

async function capturePage(page, pageConfig, theme) {
  const url = BASE_URL + pageConfig.path;

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('watchtower-theme', t);
  }, theme);

  const waitMs = waitTimes[pageConfig.path] || 2500;
  await page.waitForTimeout(waitMs);

  const suffix = theme === 'dark' ? '' : '-light';
  const screenshotPath = path.join(REVIEW_DIR, `${pageConfig.name}${suffix}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: false });

  console.log(`  [${theme}] ${pageConfig.name}${suffix}.png`);
  return screenshotPath;
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch();

  const darkContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const lightContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  await lightContext.addInitScript(() => {
    localStorage.setItem('watchtower-theme', 'light');
  });

  console.log('\n=== Dark Mode Screenshots ===');
  for (const pageConfig of pages) {
    const page = await darkContext.newPage();
    await capturePage(page, pageConfig, 'dark');
    await page.close();
  }

  console.log('\n=== Light Mode Screenshots ===');
  for (const pageConfig of pages) {
    const page = await lightContext.newPage();
    await capturePage(page, pageConfig, 'light');
    await page.close();
  }

  await darkContext.close();
  await lightContext.close();
  await browser.close();

  const files = fs.readdirSync(REVIEW_DIR).filter(f => f.endsWith('.png'));
  console.log(`\nTotal PNG files in ${REVIEW_DIR}: ${files.length}`);
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
