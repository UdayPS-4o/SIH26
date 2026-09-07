#!/usr/bin/env node
/**
 * Pulls real DEL-BOM fares from Cleartrip:
 *  - the cheapest Economy fare for each of the app's five lead-time buckets
 *    (T+1, T+7, T+15, T+30, T+45 days from today) -> liveFareLadder.json
 *  - the cheapest fare in each cabin (Economy, Premium Economy, Business)
 *    for one representative date (the T+15 departure) -> liveCabinCompare.json
 *
 * Cleartrip's results page is gated by Akamai bot-manager, so a plain
 * cross-origin fetch (e.g. from the deployed static frontend) gets blocked.
 * Puppeteer drives a real Chromium instance instead, which passes the JS
 * challenge the same way a human visitor's browser would, then reads the
 * same flight/search/v2 API response the page itself renders from.
 *
 * Usage: node scrape-cleartrip.mjs
 */
import puppeteer from 'puppeteer'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LADDER_OUT_PATH = join(__dirname, '../frontend/src/data/liveFareLadder.json')
const CABIN_OUT_PATH = join(__dirname, '../frontend/src/data/liveCabinCompare.json')

const ORIGIN = 'DEL'
const DEST = 'SXR'
const ORIGIN_CITY = 'Delhi'
const DEST_CITY = 'Srinagar'
const LEAD_DAYS = [0, 1, 7, 15, 30, 45]
const CABIN_LEAD_DAYS = 15
const CABINS = [
  { param: 'Economy', label: 'Economy' },
  { param: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { param: 'Business', label: 'Business' },
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

function ddmmyyyy(d) {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function resultsUrl(depart, cabinParam) {
  const date = ddmmyyyy(depart)
  return (
    `https://www.cleartrip.com/flights/results?adults=1&childs=0&infants=0&class=${cabinParam}` +
    `&depart_date=${encodeURIComponent(date)}&from=${ORIGIN}&to=${DEST}&intl=false` +
    `&carrier=&airline=&&sd=&mmb=false`
  )
}

function pickCheapest(json) {
  const fares = json.fares || {}
  let best = null
  for (const fareId of Object.keys(fares)) {
    const fare = fares[fareId]
    const price = fare?.pricing?.totalPricing?.totalPrice
    if (typeof price === 'number' && (!best || price < best.price)) {
      best = { price, fare }
    }
  }
  if (!best) return null

  const legs = best.fare.subTravelOptionFare.flatMap((s) => s.flightFare.map((ff) => ff.flightId))
  const flightDetails = legs.map((id) => json.flights?.[id]).filter(Boolean)
  const first = flightDetails[0]
  const last = flightDetails[flightDetails.length - 1]

  return {
    price: best.price,
    airlineCode: first?.airlineCode,
    flightNumber: first ? `${first.airlineCode}-${first.fltNo}` : undefined,
    stops: Math.max(flightDetails.length - 1, 0),
    departTime: first?.departure?.airport?.time,
    arriveTime: last?.arrival?.airport?.time,
  }
}

async function fetchResults(browser, url) {
  const page = await browser.newPage()
  await page.setUserAgent(USER_AGENT)
  try {
    const apiResponse = page.waitForResponse(
      (res) => res.url().includes('/flight/search/v2') && res.status() === 200,
      { timeout: 30000 },
    )
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
    const res = await apiResponse
    return await res.json()
  } finally {
    await page.close()
  }
}

async function scrapeLadderRung(browser, leadDays) {
  const today = new Date()
  const depart = new Date(today)
  depart.setDate(depart.getDate() + leadDays)
  const url = resultsUrl(depart, 'Economy')

  const json = await fetchResults(browser, url)
  const cheapest = pickCheapest(json)

  return {
    leadDays,
    departDate: depart.toISOString().slice(0, 10),
    scrapedAt: new Date().toISOString(),
    sourceUrl: url,
    cheapest,
    cardCount: Object.keys(json.fares || {}).length,
  }
}

async function scrapeCabin(browser, depart, cabin) {
  const url = resultsUrl(depart, cabin.param)
  const json = await fetchResults(browser, url)
  const cheapest = pickCheapest(json)
  return {
    cabin: cabin.label,
    scrapedAt: new Date().toISOString(),
    sourceUrl: url,
    cheapest,
    cardCount: Object.keys(json.fares || {}).length,
  }
}

async function main() {
  const browser = await puppeteer.launch({ headless: true })
  const ladderResults = []
  const cabinResults = []
  try {
    for (const leadDays of LEAD_DAYS) {
      try {
        const r = await scrapeLadderRung(browser, leadDays)
        console.log(
          `T+${leadDays} (${r.departDate}): ${r.cheapest ? `${r.cheapest.flightNumber} ₹${r.cheapest.price}` : 'no fare found'} — ${r.cardCount} fares seen`,
        )
        ladderResults.push(r)
      } catch (err) {
        console.error(`T+${leadDays}: failed — ${err.message}`)
        ladderResults.push({ leadDays, error: err.message })
      }
    }

    const cabinDepart = new Date()
    cabinDepart.setDate(cabinDepart.getDate() + CABIN_LEAD_DAYS)
    for (const cabin of CABINS) {
      try {
        const r = await scrapeCabin(browser, cabinDepart, cabin)
        console.log(
          `${cabin.label}: ${r.cheapest ? `${r.cheapest.flightNumber} ₹${r.cheapest.price}` : 'no fare found'} — ${r.cardCount} fares seen`,
        )
        cabinResults.push(r)
      } catch (err) {
        console.error(`${cabin.label}: failed — ${err.message}`)
        cabinResults.push({ cabin: cabin.label, error: err.message })
      }
    }

    writeFileSync(
      LADDER_OUT_PATH,
      JSON.stringify(
        { origin: ORIGIN, dest: DEST, originCity: ORIGIN_CITY, destCity: DEST_CITY, results: ladderResults },
        null,
        2,
      ),
    )
    console.log(`Wrote ${LADDER_OUT_PATH}`)

    writeFileSync(
      CABIN_OUT_PATH,
      JSON.stringify(
        {
          origin: ORIGIN,
          dest: DEST,
          originCity: ORIGIN_CITY,
          destCity: DEST_CITY,
          departDate: cabinDepart.toISOString().slice(0, 10),
          leadDays: CABIN_LEAD_DAYS,
          results: cabinResults,
        },
        null,
        2,
      ),
    )
    console.log(`Wrote ${CABIN_OUT_PATH}`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
