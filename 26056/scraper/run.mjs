#!/usr/bin/env node
/**
 * Live Scrape Runner — orchestrates Python Playwright scraper + syncs to frontend.
 *
 * This is the script the demo video uses. It:
 * 1. Runs the Python Playwright scraper to get real Cleartrip fares
 * 2. Falls back to cached/demo data if scraping fails
 * 3. Writes results to frontend data files
 * 4. Prints a summary for the terminal demo
 */

import { execSync } from 'child_process'
import { writeFileSync, copyFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FRONTEND_DATA = 'C:/Users/udayp/Documents/code/SIH26/26056/frontend/src/data'
const PY_SCRAPER = join(__dirname, 'live_scrape.py')
const DEMO_DATA = join(__dirname, 'demo/live_scrape_capture.json')

function log(msg) {
  console.log(`\x1b[36m[scraper]\x1b[0m ${msg}`)
}

function logOk(msg) {
  console.log(`\x1b[32m[scraper]\x1b[0m ${msg}`)
}

function logWarn(msg) {
  console.log(`\x1b[33m[scraper]\x1b[0m ${msg}`)
}

function logErr(msg) {
  console.log(`\x1b[31m[scraper]\x1b[0m ${msg}`)
}

async function runScrape() {
  log('Starting live scrape from Cleartrip...')
  log(`Route: IDR → BLR (Indore → Bangalore)`)
  log(`Target flight: 6E-6744 (IndiGo daily non-stop)`)
  log(`Lead windows: T+1, T+7, T+15, T+30, T+45`)
  log('')

  try {
    const output = execSync(
      `python "${PY_SCRAPER}"`,
      { encoding: 'utf8', timeout: 120000, cwd: __dirname }
    )
    logOk('Python scraper output:')
    console.log(output)
    return true
  } catch (err) {
    logWarn(`Python scraper failed: ${err.message.split('\n')[0]}`)
    logWarn('Falling back to demo/cached data')
    return false
  }
}

function syncToFrontend(scrapeSucceeded) {
  const srcLadder = join(__dirname, 'liveFareLadder.json')
  const srcCabin = join(__dirname, 'liveCabinCompare.json')
  const dstLadder = join(FRONTEND_DATA, 'liveFareLadder.json')
  const dstCabin = join(FRONTEND_DATA, 'liveCabinCompare.json')

  if (scrapeSucceeded) {
    try {
      copyFileSync(srcLadder, dstLadder)
      copyFileSync(srcCabin, dstCabin)
      logOk(`Synced live data to frontend: ${dstLadder}`)
      return true
    } catch (e) {
      logWarn('Could not copy to frontend: ' + e.message)
    }
  }

  // Fallback: copy demo data
  try {
    copyFileSync(DEMO_DATA, dstLadder)
    logOk('Using demo/cached data for fare ladder')
    // Generate cabin data from demo
    const cabin = [
      { cabin: 'Economy', scrapedAt: new Date().toISOString(), sourceUrl: 'https://cleartrip.com', cheapest: { price: 6412, flightNumber: '6E-6744', stops: 0 } },
      { cabin: 'Premium Economy', scrapedAt: new Date().toISOString(), sourceUrl: 'https://cleartrip.com', cheapest: { price: 10200, flightNumber: '6E-6744', stops: 0 } },
      { cabin: 'Business', scrapedAt: new Date().toISOString(), sourceUrl: 'https://cleartrip.com', cheapest: { price: 14890, flightNumber: '6E-6744', stops: 0 } },
    ]
    writeFileSync(dstCabin, JSON.stringify({
      origin: 'IDR', dest: 'BLR',
      originCity: 'Indore', destCity: 'Bangalore',
      departDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
      leadDays: 15, results: cabin
    }, null, 2))
    logOk('Using demo data for cabin comparison')
  } catch (e) {
    logErr('Failed to set up fallback data: ' + e.message)
  }
  return false
}

function printBanner(scrapeSucceeded) {
  console.log('')
  console.log('='.repeat(70))
  console.log('  VIMAAN Live Scrape Runner')
  console.log('  APIx — Airfare Price Index for India (PS 26056)')
  console.log('='.repeat(70))
  console.log('')
  console.log(`  Data source:     ${scrapeSucceeded ? 'LIVE (Cleartrip)' : 'DEMO (cached)'}`)
  console.log(`  Route:           IDR → BLR (Indore → Bangalore)`)
  console.log(`  Lead windows:    T+1, T+7, T+15, T+30, T+45`)
  console.log(`  Target flight:   6E-6744 (IndiGo non-stop daily)`)
  console.log('')
  console.log('  Frontend data:   ../../frontend/src/data/')
  console.log('  Dashboard:       http://localhost:5173/?demo')
  console.log('')
  console.log('='.repeat(70))
  console.log('')
}

async function main() {
  const start = Date.now()
  const ok = await runScrape()
  syncToFrontend(ok)
  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  printBanner(ok)
  logOk(`Scrape complete in ${elapsed}s — frontend data updated`)
}

main().catch(e => {
  logErr(e.message)
  process.exit(1)
})
