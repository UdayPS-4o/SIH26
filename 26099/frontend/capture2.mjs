import { chromium } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = 'http://localhost:5173'
const OUT = path.join(__dirname, 'review')

// Actual routes from App.tsx, in demo flow order
const ROUTES = [
  { href: '/',            file: '02-dashboard.png' },
  { href: '/overview',    file: '03-overview.png' },
  { href: '/explorer',   file: '04-explorer.png' },
  { href: '/matching',    file: '05-matching.png' },
  { href: '/duplicates',  file: '06-duplicates.png' },
  { href: '/savings',     file: '07-savings.png' },
  { href: '/registry',    file: '08-registry.png' },
  { href: '/migration',   file: '09-migration.png' },
  { href: '/integration', file: '10-integration.png' },
  { href: '/import',      file: '11-import.png' },
  { href: '/normalize',   file: '12-normalize.png' },
  { href: '/activity',    file: '13-activity.png' },
  { href: '/engine',      file: '14-engine.png' },
]

;(async () => {
  const browser = await chromium.launch()

  // Login: fresh session (no sessionStorage)
  const loginCtx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const loginPage = await loginCtx.newPage()
  const loginPath = path.join(OUT, '01-login.png')
  console.log('Capturing login ->', loginPath)
  await loginPage.goto(BASE + '/login', { waitUntil: 'networkidle', timeout: 30000 })
  await loginPage.waitForTimeout(500)
  await loginPage.screenshot({ path: loginPath })
  console.log('login:', fs.existsSync(loginPath) ? fs.statSync(loginPath).size + ' bytes' : 'MISSING')
  await loginCtx.close()

  // Authenticated pages: pre-seeded sessionStorage (3 CPSEs loaded)
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } })
  const page = await ctx.newPage()
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('codeone.role', 'reviewer')
      sessionStorage.setItem('codeone.name', 'Reviewer')
      sessionStorage.setItem('codeone.learned', '[]')
      sessionStorage.setItem('codeone.loaded', JSON.stringify(['IOCL', 'NTPC', 'SAIL']))
    } catch (e) { /* storage disabled */ }
  })

  for (const route of ROUTES) {
    const fp = path.join(OUT, route.file)
    console.log('Capturing', route.href, '->', route.file)
    await page.goto(BASE + route.href, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(800)
    await page.screenshot({ path: fp })
    const ok = fs.existsSync(fp)
    const sz = ok ? fs.statSync(fp).size : 0
    console.log('  written:', ok, 'size:', sz)
  }

  await browser.close()
  console.log('\nDone. All files:')
  for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.png')).sort()) {
    console.log(' ', f, fs.statSync(path.join(OUT, f)).size, 'bytes')
  }
})()
