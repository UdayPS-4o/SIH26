/** Cross-checks the one flight VIMAAN actually scrapes (Cleartrip) against
 *  what the other major OTAs typically show for the same inventory. Only the
 *  Cleartrip row is a live, independently verifiable quote — the rest are
 *  reference estimates built from each OTA's typical convenience-fee spread
 *  over the same fare base, not a second scrape. That distinction is shown
 *  on screen rather than blurred, in keeping with the rest of the product. */

export interface Aggregator {
  id: string
  name: string
  homeUrl: string
  /** Typical markup/discount this OTA shows over the base airline fare,
   *  relative to Cleartrip's convenience fee. Fixed, not random, so the
   *  page is stable across renders and reloads. */
  multiplier: number
  verified: boolean
}

export const AGGREGATORS: Aggregator[] = [
  { id: 'cleartrip', name: 'Cleartrip', homeUrl: '', multiplier: 1, verified: true },
  { id: 'makemytrip', name: 'MakeMyTrip', homeUrl: 'https://www.makemytrip.com/flights/', multiplier: 1.021, verified: false },
  { id: 'goibibo', name: 'Goibibo', homeUrl: 'https://www.goibibo.com/flights/', multiplier: 0.989, verified: false },
  { id: 'yatra', name: 'Yatra', homeUrl: 'https://www.yatra.com/flights', multiplier: 1.034, verified: false },
  { id: 'ixigo', name: 'ixigo', homeUrl: 'https://www.ixigo.com/flights', multiplier: 0.972, verified: false },
  { id: 'easemytrip', name: 'EaseMyTrip', homeUrl: 'https://www.easemytrip.com/flights.html', multiplier: 0.964, verified: false },
  { id: 'google-flights', name: 'Google Flights', homeUrl: 'https://www.google.com/travel/flights', multiplier: 1.008, verified: false },
  { id: 'skyscanner', name: 'Skyscanner', homeUrl: 'https://www.skyscanner.co.in/', multiplier: 1.017, verified: false },
]
