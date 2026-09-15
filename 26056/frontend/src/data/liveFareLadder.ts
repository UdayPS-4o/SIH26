import raw from './liveFareLadder.json'
import { type Aggregator } from './crossCheck'

const AIRLINE_NAME: Record<string, string> = {
  '6E': 'IndiGo',
  AI: 'Air India',
  IX: 'Air India Express',
  QP: 'Akasa Air',
  SG: 'SpiceJet',
}

function airlineCode(name: string): string {
  const entry = Object.entries(AIRLINE_NAME).find(([, n]) => n === name)
  return entry?.[0] ?? name
}

function parts(departDate: string) {
  const d = new Date(`${departDate}T00:00:00`)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]
  return { dd, mm, yyyy, mon }
}

const CLEARTRIP_SEARCH: Aggregator = {
  id: 'cleartrip',
  name: 'Cleartrip',
  multiplier: 1,
  buildUrl: (r, origin, dest) => {
    const { dd, mm, yyyy } = parts(r.departDate)
    const code = airlineCode(r.airline)
    return `https://www.cleartrip.com/flights/${origin}-${dest}-${dd}${mm}${yyyy}-?adults=1&class=Economy&airline=${code}`
  },
}

export function buildVerifyUrl(rung: LiveFareRung, origin: string, dest: string): string {
  return CLEARTRIP_SEARCH.buildUrl(rung, origin, dest)
}

export interface LiveFareRung {
  leadDays: number
  departDate: string
  scrapedAt: string
  sourceUrl: string
  price: number
  airline: string
  flightNumber: string
  stops: number
  departTime: string
  arriveTime: string
}

interface RawResult {
  leadDays: number
  departDate: string
  scrapedAt: string
  sourceUrl: string
  cardCount: number
  cheapest: {
    price: number
    airlineCode: string
    flightNumber: string
    stops: number
    departTime: string
    arriveTime: string
  } | null
  error?: string
}

const data = raw as {
  origin: string
  dest: string
  originCity: string
  destCity: string
  results: RawResult[]
}

export const LIVE_FARE_LADDER_ROUTE = {
  originCode: data.origin,
  destCode: data.dest,
  originCity: data.originCity,
  destCity: data.destCity,
}

export const LIVE_FARE_LADDER: LiveFareRung[] = data.results
  .filter((r): r is RawResult & { cheapest: NonNullable<RawResult['cheapest']> } => r.cheapest != null)
  .map((r) => ({
    leadDays: r.leadDays,
    departDate: r.departDate,
    scrapedAt: r.scrapedAt,
    sourceUrl: r.sourceUrl,
    price: r.cheapest.price,
    airline: AIRLINE_NAME[r.cheapest.airlineCode] ?? r.cheapest.airlineCode,
    flightNumber: r.cheapest.flightNumber,
    stops: r.cheapest.stops,
    departTime: r.cheapest.departTime,
    arriveTime: r.cheapest.arriveTime,
  }))
