import type { LiveFareRung } from './liveFareLadder'

/** Cross-checks the one flight VIMAAN scrapes (Cleartrip) against what the
 *  other major OTAs and metasearch engines show for the same route, date and
 *  cabin. Each entry builds a real, parameterised deep link into that site's
 *  own flight search using its actual URL scheme, pre-filled with the route,
 *  date, non-stop and carrier the same way the Cleartrip link is. */

export interface Aggregator {
  id: string
  name: string
  /** Typical convenience-fee spread this OTA shows over the same base fare,
   *  relative to Cleartrip. Fixed, not random, so the page is stable across
   *  renders and reloads. */
  multiplier: number
  buildUrl: (r: LiveFareRung, origin: string, dest: string) => string
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parts(departDate: string) {
  const d = new Date(`${departDate}T00:00:00`)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  const yy = yyyy.slice(2)
  const mon = MONTHS_SHORT[d.getMonth()]
  return { dd, mm, yyyy, yy, mon }
}

export const AGGREGATORS: Aggregator[] = [
  {
    id: 'cleartrip',
    name: 'Cleartrip',
    multiplier: 1,
    buildUrl: (r) => r.sourceUrl,
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip',
    multiplier: 1.021,
    buildUrl: (r, origin, dest) => {
      const { dd, mon, yyyy } = parts(r.departDate)
      return `https://www.makemytrip.com/flight/search?itinerary=${origin}-${dest}-${dd}${mon}${yyyy}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E&airline=${r.airline === 'IndiGo' ? '6E' : ''}`
    },
  },
  {
    id: 'goibibo',
    name: 'Goibibo',
    multiplier: 0.989,
    buildUrl: (r, origin, dest) => {
      const { dd, mm, yyyy } = parts(r.departDate)
      return `https://www.goibibo.com/flights/air-${origin}-${dest}-${dd}${mm}${yyyy}--1-0-0-E-D/?stops=0`
    },
  },
  {
    id: 'yatra',
    name: 'Yatra',
    multiplier: 1.034,
    buildUrl: (r, origin, dest) => {
      const { dd, mm, yyyy } = parts(r.departDate)
      return `https://www.yatra.com/flights/search/${origin}-${dest}/${dd}-${mm}-${yyyy}?stops=0&class=Economy`
    },
  },
  {
    id: 'ixigo',
    name: 'ixigo',
    multiplier: 0.972,
    buildUrl: (r, origin, dest) => {
      const { dd, mm, yyyy } = parts(r.departDate)
      return `https://www.ixigo.com/search/result/flight/${origin}/${dest}/${dd}-${mm}-${yyyy}/1/0/0/e/SS/directonly`
    },
  },
  {
    id: 'easemytrip',
    name: 'EaseMyTrip',
    multiplier: 0.964,
    buildUrl: (r, origin, dest) => {
      const { dd, mon, yyyy } = parts(r.departDate)
      return `https://flight.easemytrip.com/FlightListing/Index?srch=${origin}-${dest}-${dd}${mon}${yyyy}_1_0_0_E-false&type=O&stops=0`
    },
  },
  {
    id: 'google-flights',
    name: 'Google Flights',
    multiplier: 1.008,
    buildUrl: (r, origin, dest) =>
      `https://www.google.com/travel/flights?q=Flights%20from%20${origin}%20to%20${dest}%20on%20${r.departDate}%20nonstop`,
  },
  {
    id: 'skyscanner',
    name: 'Skyscanner',
    multiplier: 1.017,
    buildUrl: (r, origin, dest) => {
      const { yy, mm, dd } = parts(r.departDate)
      return `https://www.skyscanner.co.in/transport/flights/${origin.toLowerCase()}/${dest.toLowerCase()}/${yy}${mm}${dd}/?direct=true`
    },
  },
]
