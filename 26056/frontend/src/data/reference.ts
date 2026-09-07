/** Reference tables: the basket, the carriers, the source registry.
 *
 *  Passenger volumes below are ORDER-OF-MAGNITUDE PLACEHOLDERS standing in for
 *  the DGCA city-pair-wise monthly domestic traffic extract that supplies the
 *  real stratum weights. They are here so the weighting machinery has something
 *  to run on before that extract is loaded, and every screen that uses them
 *  says so.
 */

export interface Airport {
  iata: string
  city: string
  name: string
}

export const AIRPORTS: Airport[] = [
  { iata: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl' },
  { iata: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Maharaj Intl' },
  { iata: 'BLR', city: 'Bengaluru', name: 'Kempegowda Intl' },
  { iata: 'CCU', city: 'Kolkata', name: 'Netaji Subhas Chandra Bose Intl' },
  { iata: 'HYD', city: 'Hyderabad', name: 'Rajiv Gandhi Intl' },
  { iata: 'MAA', city: 'Chennai', name: 'Chennai Intl' },
  { iata: 'PNQ', city: 'Pune', name: 'Pune' },
  { iata: 'GOI', city: 'Goa', name: 'Dabolim' },
  { iata: 'GAU', city: 'Guwahati', name: 'Lokpriya Gopinath Bordoloi Intl' },
  { iata: 'AMD', city: 'Ahmedabad', name: 'Sardar Vallabhbhai Patel Intl' },
  { iata: 'SXR', city: 'Srinagar', name: 'Sheikh ul-Alam Intl' },
  { iata: 'LKO', city: 'Lucknow', name: 'Chaudhary Charan Singh Intl' },
  { iata: 'COK', city: 'Kochi', name: 'Cochin Intl' },
  { iata: 'BBI', city: 'Bhubaneswar', name: 'Biju Patnaik Intl' },
]

export const airportOf = (iata: string) => AIRPORTS.find((a) => a.iata === iata)!

export interface Carrier {
  code: string
  name: string
  isLcc: boolean
  /** Rough domestic seat-share, used only to weight how often a carrier
   *  appears in the fixture panel. */
  presence: number
}

export const CARRIERS: Carrier[] = [
  { code: '6E', name: 'IndiGo', isLcc: true, presence: 0.61 },
  { code: 'AI', name: 'Air India', isLcc: false, presence: 0.16 },
  { code: 'IX', name: 'Air India Express', isLcc: true, presence: 0.09 },
  { code: 'QP', name: 'Akasa Air', isLcc: true, presence: 0.07 },
  { code: 'SG', name: 'SpiceJet', isLcc: true, presence: 0.07 },
]

export const carrierOf = (code: string) => CARRIERS.find((c) => c.code === code)!

export interface SectorDef {
  id: string
  origin: string
  destination: string
  /** Placeholder monthly passengers, thousands. Stands in for the DGCA extract. */
  paxK: number
  isTrunk: boolean
  /** Sectors whose demand peaks on a distinct calendar (hills, festivals). */
  seasonality: 'trunk' | 'metro' | 'leisure' | 'regional'
  carriers: string[]
}

/** 20 city pairs. The count and the shape follow the problem statement; the
 *  membership follows the busiest domestic pairs, which is what a DGCA-traffic
 *  cut would produce. */
export const SECTORS: SectorDef[] = [
  { id: 'DEL-BOM', origin: 'DEL', destination: 'BOM', paxK: 520, isTrunk: true, seasonality: 'trunk', carriers: ['6E', 'AI', 'QP', 'SG'] },
  { id: 'DEL-BLR', origin: 'DEL', destination: 'BLR', paxK: 415, isTrunk: true, seasonality: 'trunk', carriers: ['6E', 'AI', 'QP'] },
  { id: 'BOM-BLR', origin: 'BOM', destination: 'BLR', paxK: 330, isTrunk: true, seasonality: 'trunk', carriers: ['6E', 'AI', 'QP'] },
  { id: 'DEL-CCU', origin: 'DEL', destination: 'CCU', paxK: 300, isTrunk: true, seasonality: 'metro', carriers: ['6E', 'AI', 'SG'] },
  { id: 'DEL-HYD', origin: 'DEL', destination: 'HYD', paxK: 250, isTrunk: true, seasonality: 'metro', carriers: ['6E', 'AI', 'QP'] },
  { id: 'DEL-MAA', origin: 'DEL', destination: 'MAA', paxK: 205, isTrunk: true, seasonality: 'metro', carriers: ['6E', 'AI', 'SG'] },
  { id: 'BOM-HYD', origin: 'BOM', destination: 'HYD', paxK: 148, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'IX', 'QP'] },
  { id: 'BLR-CCU', origin: 'BLR', destination: 'CCU', paxK: 140, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'AI', 'SG'] },
  { id: 'BOM-CCU', origin: 'BOM', destination: 'CCU', paxK: 132, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'AI', 'IX'] },
  { id: 'DEL-PNQ', origin: 'DEL', destination: 'PNQ', paxK: 128, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'AI', 'QP'] },
  { id: 'BOM-GOI', origin: 'BOM', destination: 'GOI', paxK: 118, isTrunk: false, seasonality: 'leisure', carriers: ['6E', 'IX', 'SG'] },
  { id: 'DEL-GAU', origin: 'DEL', destination: 'GAU', paxK: 112, isTrunk: false, seasonality: 'regional', carriers: ['6E', 'AI', 'SG'] },
  { id: 'BLR-HYD', origin: 'BLR', destination: 'HYD', paxK: 105, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'IX', 'QP'] },
  { id: 'DEL-AMD', origin: 'DEL', destination: 'AMD', paxK: 102, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'AI', 'IX'] },
  { id: 'DEL-SXR', origin: 'DEL', destination: 'SXR', paxK: 96, isTrunk: false, seasonality: 'leisure', carriers: ['6E', 'AI'] },
  { id: 'BOM-AMD', origin: 'BOM', destination: 'AMD', paxK: 88, isTrunk: false, seasonality: 'regional', carriers: ['6E', 'IX', 'QP'] },
  { id: 'DEL-LKO', origin: 'DEL', destination: 'LKO', paxK: 84, isTrunk: false, seasonality: 'regional', carriers: ['6E', 'AI', 'IX'] },
  { id: 'BLR-MAA', origin: 'BLR', destination: 'MAA', paxK: 78, isTrunk: false, seasonality: 'metro', carriers: ['6E', 'IX', 'QP'] },
  { id: 'BOM-COK', origin: 'BOM', destination: 'COK', paxK: 72, isTrunk: false, seasonality: 'leisure', carriers: ['6E', 'IX', 'SG'] },
  { id: 'DEL-BBI', origin: 'DEL', destination: 'BBI', paxK: 68, isTrunk: false, seasonality: 'regional', carriers: ['6E', 'AI', 'IX'] },
]

export const sectorOf = (id: string) => SECTORS.find((s) => s.id === id)!

export const LEAD_BUCKETS = [1, 7, 15, 30, 45] as const
export type LeadBucket = (typeof LEAD_BUCKETS)[number]

/** Lead-time booking shares.
 *  Actual booking-curve distributions are not published anywhere. These are an
 *  assumption, and the Methodology console exposes them as an editable input
 *  rather than burying them in a constant. */
export const BOOKING_SHARE: Record<LeadBucket, number> = {
  1: 0.12,
  7: 0.23,
  15: 0.27,
  30: 0.24,
  45: 0.14,
}

export const DOW_BANDS = ['WEEKDAY', 'WEEKEND'] as const
export type DowBand = (typeof DOW_BANDS)[number]

/* --------------------------------------------------------------------------
   Source registry
   -------------------------------------------------------------------------- */

export type SourceKind = 'AIRLINE' | 'OTA' | 'LICENSED_API' | 'MOU'
export type AccessMethod = 'PLAYWRIGHT' | 'SCRAPY' | 'API' | 'FEED' | 'NOT_ROUTED'
export type Posture = 'PENDING_REVIEW' | 'ALLOW' | 'DISALLOW' | 'PARTIAL' | 'LICENSED' | 'STATUTORY'

export interface SourceDef {
  slug: string
  label: string
  domain: string
  kind: SourceKind
  /** Planned route. Nothing is collected until COLLECTION_ENABLED is turned on. */
  access: AccessMethod
  robots: Posture
  tos: Posture
  ratePerMin: number
  nightlyCap: number
  /** True only for the synthetic source used to demonstrate the demote path. */
  illustrative?: boolean
  demotedTo?: string
  demotedReason?: string
  /** Whether this source contributes quotes to the seeded fixture panel. */
  inPanel: boolean
}

export const SOURCES: SourceDef[] = [
  { slug: 'indigo', label: 'IndiGo', domain: 'goindigo.in', kind: 'AIRLINE', access: 'PLAYWRIGHT', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 10, nightlyCap: 400, inPanel: true },
  { slug: 'airindia', label: 'Air India', domain: 'airindia.com', kind: 'AIRLINE', access: 'PLAYWRIGHT', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 10, nightlyCap: 400, inPanel: true },
  { slug: 'airindiaexpress', label: 'Air India Express', domain: 'airindiaexpress.com', kind: 'AIRLINE', access: 'PLAYWRIGHT', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 10, nightlyCap: 300, inPanel: true },
  { slug: 'akasa', label: 'Akasa Air', domain: 'akasaair.com', kind: 'AIRLINE', access: 'PLAYWRIGHT', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 10, nightlyCap: 300, inPanel: false },
  { slug: 'spicejet', label: 'SpiceJet', domain: 'spicejet.com', kind: 'AIRLINE', access: 'PLAYWRIGHT', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 10, nightlyCap: 300, inPanel: false },
  { slug: 'makemytrip', label: 'MakeMyTrip', domain: 'makemytrip.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  { slug: 'yatra', label: 'Yatra', domain: 'yatra.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  { slug: 'easemytrip', label: 'EaseMyTrip', domain: 'easemytrip.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  { slug: 'cleartrip', label: 'Cleartrip', domain: 'cleartrip.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  { slug: 'ixigo', label: 'ixigo', domain: 'ixigo.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  { slug: 'goibibo', label: 'Goibibo', domain: 'goibibo.com', kind: 'OTA', access: 'SCRAPY', robots: 'PENDING_REVIEW', tos: 'PENDING_REVIEW', ratePerMin: 6, nightlyCap: 250, inPanel: false },
  {
    slug: 'portal-f',
    label: 'Portal F',
    domain: 'portal-f.example',
    kind: 'OTA',
    access: 'NOT_ROUTED',
    robots: 'DISALLOW',
    tos: 'DISALLOW',
    ratePerMin: 0,
    nightlyCap: 0,
    illustrative: true,
    demotedTo: 'amadeus',
    demotedReason: 'robots.txt Disallow on the fare-search path; terms decline automated retrieval',
    inPanel: false,
  },
  { slug: 'amadeus', label: 'Amadeus Self-Service', domain: 'api.amadeus.com', kind: 'LICENSED_API', access: 'API', robots: 'LICENSED', tos: 'LICENSED', ratePerMin: 30, nightlyCap: 2000, inPanel: true },
  { slug: 'duffel', label: 'Duffel', domain: 'api.duffel.com', kind: 'LICENSED_API', access: 'API', robots: 'LICENSED', tos: 'LICENSED', ratePerMin: 20, nightlyCap: 1200, inPanel: true },
  { slug: 'dgca-feed', label: 'DGCA tariff feed', domain: 'dgca.gov.in', kind: 'MOU', access: 'FEED', robots: 'STATUTORY', tos: 'STATUTORY', ratePerMin: 0, nightlyCap: 0, inPanel: true },
]

export const sourceOf = (slug: string) => SOURCES.find((s) => s.slug === slug)!

/** The six sources that actually carry quotes in the seeded panel. */
export const PANEL_SOURCES = SOURCES.filter((s) => s.inPanel)

export const POSTURE_LABEL: Record<Posture, string> = {
  PENDING_REVIEW: 'Pending review',
  ALLOW: 'Allow',
  DISALLOW: 'Disallow',
  PARTIAL: 'Partial',
  LICENSED: 'Licensed',
  STATUTORY: 'Statutory',
}

export const ACCESS_LABEL: Record<AccessMethod, string> = {
  PLAYWRIGHT: 'Playwright',
  SCRAPY: 'Scrapy',
  API: 'Licensed API',
  FEED: 'Bulk feed',
  NOT_ROUTED: 'Not routed',
}
