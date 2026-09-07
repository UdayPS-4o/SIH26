/** One real fare, intercepted from a live OTA search API, kept alongside the
 *  panel so the published index can be checked against a source anyone can
 *  open. Refreshed by re-running the capture against the same endpoint —
 *  see the sourceUrl below, which reproduces the exact search.
 */
export interface LiveFareCheck {
  originCode: string
  destCode: string
  originCity: string
  destCity: string
  airline: string
  flightNumber: string
  departDate: string
  departTime: string
  arriveTime: string
  price: number
  currency: 'INR'
  scrapedAt: string
  source: string
  sourceUrl: string
}

export const LIVE_FARE_CHECK: LiveFareCheck = {
  originCode: 'DEL',
  destCode: 'BOM',
  originCity: 'Delhi',
  destCity: 'Mumbai',
  airline: 'IndiGo',
  flightNumber: '6E-324',
  departDate: '2026-09-08',
  departTime: '13:00',
  arriveTime: '15:10',
  price: 6530,
  currency: 'INR',
  scrapedAt: '2026-09-07T02:12:00+05:30',
  source: 'Cleartrip',
  sourceUrl:
    'https://www.cleartrip.com/flights/results?adults=1&childs=0&infants=0&class=Economy&depart_date=08/09/2026&from=DEL&to=BOM&intl=false&carrier=&airline=&&sd=&mmb=false',
}
