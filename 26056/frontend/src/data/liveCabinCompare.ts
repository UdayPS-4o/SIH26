import raw from './liveCabinCompare.json'

const AIRLINE_NAME: Record<string, string> = {
  '6E': 'IndiGo',
  AI: 'Air India',
  IX: 'Air India Express',
  QP: 'Akasa Air',
  SG: 'SpiceJet',
}

export interface LiveCabinFare {
  cabin: string
  price: number
  airline: string
  flightNumber: string
  stops: number
  departTime: string
  arriveTime: string
  scrapedAt: string
  sourceUrl: string
}

interface RawResult {
  cabin: string
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

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function parts(departDate: string) {
  const d = new Date(`${departDate}T00:00:00`)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const mon = MONTHS_SHORT[d.getMonth()]
  return { dd, mm, yyyy, mon }
}

export function buildCabinVerifyUrl(_c: LiveCabinFare, origin: string, dest: string, departDate: string): string {
  const { dd, mm, yyyy } = parts(departDate)
  return `https://www.cleartrip.com/flights/${origin}-${dest}-${dd}${mm}${yyyy}-?adults=1&class=Economy`
}

const data = raw as {
  origin: string
  dest: string
  originCity: string
  destCity: string
  departDate: string
  leadDays: number
  results: RawResult[]
}

export const LIVE_CABIN_COMPARE_ROUTE = {
  originCode: data.origin,
  destCode: data.dest,
  originCity: data.originCity,
  destCity: data.destCity,
  departDate: data.departDate,
  leadDays: data.leadDays,
}

export const LIVE_CABIN_COMPARE: LiveCabinFare[] = data.results
  .filter((r): r is RawResult & { cheapest: NonNullable<RawResult['cheapest']> } => r.cheapest != null)
  .map((r) => ({
    cabin: r.cabin,
    price: r.cheapest.price,
    airline: AIRLINE_NAME[r.cheapest.airlineCode] ?? r.cheapest.airlineCode,
    flightNumber: r.cheapest.flightNumber,
    stops: r.cheapest.stops,
    departTime: r.cheapest.departTime,
    arriveTime: r.cheapest.arriveTime,
    scrapedAt: r.scrapedAt,
    sourceUrl: r.sourceUrl,
  }))
