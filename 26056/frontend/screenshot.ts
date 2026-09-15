import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:5173'
const OUT = path.join(process.cwd(), 'screenshots')

const routes = [
  { path: '/login', label: '01-login' },
  { path: '/', label: '02-dashboard' },
  { path: '/overview', label: '03-overview' },
  { path: '/trends', label: '04-trends' },
  { path: '/forecast', label: '05-forecast' },
  { path: '/elasticity', label: '06-elasticity' },
  { path: '/backtest', label: '07-backtest' },
  { path: '/anomaly', label: '08-anomaly' },
  { path: '/decomposition', label: '09-decomposition' },
  { path: '/methodology', label: '10-methodology' },
  { path: '/api', label: '11-api' },
  { path: '/playground', label: '12-playground' },
  { path: '/sectors', label: '13-sectors' },
  { path: '/cross-check', label: '14-cross-check' },
  { path: '/scraper-config', label: '15-scraper-config' },
  { path: '/scraper-arch', label: '16-scraper-arch' },
  { path: '/proxy-pool', label: '17-proxy-pool' },
  { path: '/audit', label: '18-audit' },
  { path: '/model-management', label: '19-model-management' },
  { path: '/health', label: '20-health' },
]

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()

  // Login once
  console.log('Logging in...')
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' })
  await page.fill('input[type="text"]', 'admin')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')
  await page.waitForURL((url) => url.pathname === '/', { timeout: 10000 })
  await page.waitForTimeout(500)
  console.log('Logged in.')

  for (const route of routes) {
    console.log(`Capturing ${route.label}...`)
    try {
      await page.goto(`${BASE}${route.path}`, { waitUntil: 'networkidle', timeout: 15000 })
      await page.waitForTimeout(500)
      await page.screenshot({ path: path.join(OUT, `${route.label}.png`), fullPage: false })
      console.log(`  ✓ ${route.label}.png`)
    } catch (err) {
      console.error(`  ✗ ${route.label}: ${err.message}`)
    }
  }

  await browser.close()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
