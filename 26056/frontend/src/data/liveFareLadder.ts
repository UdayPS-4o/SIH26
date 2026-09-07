import raw from './liveFareLadder.json'

const AIRLINE_NAME: Record<string, string> = {
  '6E': 'IndiGo',
  AI: 'Air India',
  IX: 'Air India Express',
  QP: 'Akasa Air',
  SG: 'SpiceJet',
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
