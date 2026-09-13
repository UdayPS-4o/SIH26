/**
 * @module lib/liveFeed
 *
 * Self-contained live-collection simulation engine.
 * Pure functions — no React dependency.
 */

export interface LiveQuote {
  id: string
  source: string
  sector: string
  window: string
  fare: number
  cabin: string
  timestamp: string
  status: 'fresh' | 'clean' | 'flagged'
}

export interface FeedStats {
  totalQuotes: number
  freshThisMinute: number
  sourcesActive: number
  avgLatency: number
}

export interface SourceInfo {
  name: string
  type: 'airline' | 'ota' | 'gds'
}

const SOURCES: SourceInfo[] = [
  { name: 'IndiGo',     type: 'airline' },
  { name: 'Air India',  type: 'airline' },
  { name: 'SpiceJet',   type: 'airline' },
  { name: 'Akasa Air',  type: 'airline' },
  { name: 'Cleartrip',  type: 'ota' },
  { name: 'MakeMyTrip', type: 'ota' },
  { name: 'Yatra',      type: 'ota' },
  { name: 'Amadeus',    type: 'gds' },
  { name: 'Duffel',     type: 'gds' },
  { name: 'EaseMyTrip', type: 'ota' },
  { name: 'ixigo',      type: 'ota' },
  { name: 'Goibibo',    type: 'ota' },
]

const SECTORS = [
  'DEL-BOM', 'DEL-BLR', 'BOM-BLR', 'DEL-CCU', 'BLR-HYD', 'MAA-DEL',
  'BOM-CCU', 'CCU-DEL', 'DEL-HYD', 'BLR-CCU', 'BOM-GOA', 'DEL-PNQ',
  'BOM-GOI', 'DEL-GAU', 'DEL-AMD', 'DEL-SXR', 'BOM-AMD', 'DEL-LKO',
  'BLR-MAA', 'BOM-COK', 'DEL-BBI',
]

const WINDOWS = ['T+1', 'T+7', 'T+15', 'T+30', 'T+45'] as const
const CABINS = ['Economy', 'Premium Economy', 'Business'] as const

const BASE_FARE_RANGES: Record<string, [number, number]> = {
  'T+1':  [8000, 20000],
  'T+7':  [5000, 12000],
  'T+15': [3500, 9000],
  'T+30': [2500, 7000],
  'T+45': [2000, 5500],
}

const CABIN_MULTIPLIER: Record<string, number> = {
  'Economy':         1.0,
  'Premium Economy': 1.6,
  'Business':        2.8,
}

const INITIAL_COUNT = 20
const DRIFT_MIN = 0.01
const DRIFT_MAX = 0.03

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1))
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function baseFareFor(window: string): number {
  const [lo, hi] = BASE_FARE_RANGES[window] ?? [2500, 7000]
  return randInt(lo, hi)
}

export function createInitialQuotes(): LiveQuote[] {
  const quotes: LiveQuote[] = []
  for (let i = 0; i < INITIAL_COUNT; i++) {
    const source = pick(SOURCES)
    const window = pick(WINDOWS)
    const base = baseFareFor(window)
    const cabin = pick(CABINS)
    const fare = Math.round(base * CABIN_MULTIPLIER[cabin])
    const statuses: Array<LiveQuote['status']> = ['fresh', 'clean', 'clean', 'clean', 'clean', 'flagged']
    quotes.push({
      id: uid(),
      source: source.name,
      sector: pick(SECTORS),
      window,
      fare,
      cabin,
      timestamp: new Date(Date.now() - randInt(0, 120_000)).toISOString(),
      status: pick(statuses),
    })
  }
  return quotes.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
}

export function driftQuote(quote: LiveQuote): LiveQuote {
  const drift = rand(DRIFT_MIN, DRIFT_MAX) * (Math.random() < 0.5 ? 1 : -1)
  const newFare = Math.max(500, Math.round(quote.fare * (1 + drift)))
  const newStatus: LiveQuote['status'] = Math.random() < 0.08 ? 'fresh' : quote.status
  return {
    ...quote,
    fare: newFare,
    timestamp: new Date().toISOString(),
    status: newStatus,
  }
}

export function generateNewQuote(): LiveQuote {
  const source = pick(SOURCES)
  const window = pick(WINDOWS)
  const base = baseFareFor(window)
  const cabin = pick(CABINS)
  const fare = Math.round(base * CABIN_MULTIPLIER[cabin])
  const statuses: Array<LiveQuote['status']> = ['fresh', 'clean', 'clean', 'clean', 'clean', 'flagged']
  return {
    id: uid(),
    source: source.name,
    sector: pick(SECTORS),
    window,
    fare,
    cabin,
    timestamp: new Date().toISOString(),
    status: pick(statuses),
  }
}

export function computeStats(quotes: LiveQuote[]): FeedStats {
  const now = Date.now()
  const freshWindow = now - 60_000
  let freshThisMinute = 0
  for (const q of quotes) {
    if (new Date(q.timestamp).getTime() >= freshWindow) {
      freshThisMinute++
    }
  }
  const uniqueSources = new Set(quotes.map((q) => q.source))
  const totalFare = quotes.reduce((s, q) => s + q.fare, 0)
  return {
    totalQuotes: quotes.length,
    freshThisMinute,
    sourcesActive: uniqueSources.size,
    avgLatency: quotes.length > 0 ? Math.round(totalFare / quotes.length) : 0,
  }
}
