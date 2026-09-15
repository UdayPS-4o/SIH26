import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:5173';
const SCREENSHOTS_DIR = 'C:/Users/udayp/Documents/code/SIH26/26109/review';

async function screenshot(page, filename) {
  await page.screenshot({ path: `${SCREENSHOTS_DIR}/${filename}` });
  console.log(`Saved ${filename}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Dashboard
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await screenshot(page, '01-dashboard.png');

  // Animals
  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await screenshot(page, '02-animals.png');

  // Animal Details (first animal)
  await page.goto(`${BASE_URL}/animals`, { waitUntil: 'networkidle' });
  await page.locator('a[href*="/animals/"]').first().click();
  await page.waitForURL(/\/animals\/\d+/, { timeout: 5000 }).catch(() => {});
  await screenshot(page, '03-animal-details.png');

  // Alerts
  await page.goto(`${BASE_URL}/alerts`, { waitUntil: 'networkidle' });
  await screenshot(page, '04-alerts.png');

  // Herd Intelligence
  await page.goto(`${BASE_URL}/herd`, { waitUntil: 'networkidle' });
  await screenshot(page, '05-herd-intelligence.png');

  // Milk Quality
  await page.goto(`${BASE_URL}/milk-quality`, { waitUntil: 'networkidle' });
  await screenshot(page, '06-milk-quality.png');

  // Environment
  await page.goto(`${BASE_URL}/environment`, { waitUntil: 'networkidle' });
  await screenshot(page, '07-environment.png');

  // Worker Hygiene
  await page.goto(`${BASE_URL}/worker-hygiene`, { waitUntil: 'networkidle' });
  await screenshot(page, '08-worker-hygiene.png');

  // Devices
  await page.goto(`${BASE_URL}/devices`, { waitUntil: 'networkidle' });
  await screenshot(page, '09-iot-devices.png');

  // Model Benchmarks
  await page.goto(`${BASE_URL}/model`, { waitUntil: 'networkidle' });
  await screenshot(page, '10-model-benchmarks.png');

  // AI Simulator
  await page.goto(`${BASE_URL}/simulator`, { waitUntil: 'networkidle' });
  await screenshot(page, '11-ai-simulator.png');

  // Reports
  await page.goto(`${BASE_URL}/reports`, { waitUntil: 'networkidle' });
  await screenshot(page, '12-reports.png');

  // Settings
  await page.goto(`${BASE_URL}/settings`, { waitUntil: 'networkidle' });
  await screenshot(page, '13-settings.png');

  await browser.close();
  console.log('All screenshots captured!');
})();
