/** The seeded fixture panel.
 *
 *  Everything the dashboard renders is produced here, from one seed, with no
 *  network access. It stands in for `backend/scripts/seed_demo.py` until live
 *  collection is switched on, and it is deliberately internally consistent:
 *  the cleaning funnel adds up, the weekly and monthly series are aggregated
 *  from the daily one, and the back-test metrics are computed from the two
 *  series actually plotted rather than typed in by hand.
 */
import { makeRng, seedFrom, clamp } from './rng'
import {
  BOOKING_SHARE,
  CARRIERS,
  DOW_BANDS,
  LEAD_BUCKETS,
  PANEL_SOURCES,
  SECTORS,
  type DowBand,
  type LeadBucket,
} from './reference'

/** cell_key = sector | carrier | lead bucket | cabin | departure weekday band.
 *  Not every carrier flies every sector, so the count comes from the basket
 *  rather than from a multiplication. */
export const EXPECTED_CELLS =
  SECTORS.reduce((a, s) => a + s.carriers.length, 0) * LEAD_BUCKETS.length * DOW_BANDS.length

export const SEED = 26056
export const DEMO_DATE = '2026-09-04'
export const DAYS = 90
export const BASE_YEAR_LABEL = '2024 = 100'

/* ==========================================================================
   Calendar
   ========================================================================== */

function isoAdd(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export const DATES: string[] = Array.from({ length: DAYS }, (_, i) =>
  isoAdd(DEMO_DATE, i - (DAYS - 1)),
)

const dowOf = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay()

export interface CalendarEvent {
  id: string
  from: string
  to: string
  label: string
  note: string
  kind: 'demand' | 'cost' | 'capacity' | 'ops'
  /** Multiplicative lift applied to the daily index across the window. */
  lift: number
}

export const EVENTS: CalendarEvent[] = [
  {
    id: 'monsoon',
    from: '2026-06-22',
    to: '2026-06-27',
    label: 'Monsoon capacity trim',
    note: 'Carriers pulled frequencies on western sectors; fewer seats at every lead window.',
    kind: 'capacity',
    lift: 0.021,
  },
  {
    id: 'atf',
    from: '2026-07-01',
    to: '2026-07-01',
    label: 'ATF price revision',
    note: 'Fuel cost step feeds into base fare, not into taxes. Visible as a level shift, not a spike.',
    kind: 'cost',
    lift: 0.009,
  },
  {
    id: 'independence',
    from: '2026-08-13',
    to: '2026-08-18',
    label: 'Independence Day weekend',
    note: 'Demand peak on trunk and regional sectors. The outlier filter is calibrated to keep this.',
    kind: 'demand',
    lift: 0.052,
  },
  {
    id: 'onam',
    from: '2026-08-26',
    to: '2026-08-31',
    label: 'Onam travel peak',
    note: 'Concentrated on southern sectors; the all-India index moves less than BOM-COK does.',
    kind: 'demand',
    lift: 0.028,
  },
]

const SUPPRESSED_DAYS = new Set(['2026-07-19', '2026-08-24'])

function eventLift(iso: string): number {
  let lift = 0
  for (const e of EVENTS) {
    if (e.kind === 'cost') {
      if (iso >= e.from) lift += e.lift // a cost step persists
    } else if (iso >= e.from && iso <= e.to) {
      lift += e.lift
    }
  }
  return lift
}

export function eventsOn(iso: string): CalendarEvent[] {
  return EVENTS.filter((e) => (e.kind === 'cost' ? e.from === iso : iso >= e.from && iso <= e.to))
}

/* ==========================================================================
   The APIx series
   ========================================================================== */

export type PublicationStatus = 'PROVISIONAL' | 'REVISED' | 'FROZEN' | 'SUPPRESSED'
export type Measure = 'TOTAL' | 'BASE'
export type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY'

export interface IndexPoint {
  date: string
  total: number
  totalLow: number
  totalHigh: number
  base: number
  baseLow: number
  baseHigh: number
  coverage: number
  status: PublicationStatus
  quotes: number
  cellsFilled: number
  cellsExpected: number
}

const START_TOTAL = 108.42
const START_BASE = 106.91

function buildDaily(): IndexPoint[] {
  const rng = makeRng(SEED)
  const out: IndexPoint[] = []
  let logTotal = Math.log(START_TOTAL)
  let logBase = Math.log(START_BASE)

  for (let i = 0; i < DAYS; i++) {
    const date = DATES[i]
    const dow = dowOf(date)
    // Weekly shape: Friday and Sunday travel peaks show up in fares even at a
    // constant lead time, because inventory depletes faster into those days.
    const weekly = 0.0055 * Math.sin((2 * Math.PI * (dow - 2)) / 7)
    const drift = 0.00042
    const shock = rng.gauss(0, 0.0033)

    if (i > 0) {
      logTotal += drift + weekly * 0.35 + shock
      logBase += drift * 0.82 + weekly * 0.3 + shock * 0.93
    }

    const lift = eventLift(date)
    // Taxes, UDF and convenience charges are levied on the ticket, not on the
    // airline's own price, so a demand spike lifts total fare more than base.
    const total = Math.exp(logTotal + weekly) * (1 + lift)
    const base = Math.exp(logBase + weekly) * (1 + lift * 0.86)

    const suppressed = SUPPRESSED_DAYS.has(date)
    const cellsExpected = EXPECTED_CELLS
    const coverage = suppressed ? rng.range(56, 64) : rng.range(78.5, 96.4)
    const cellsFilled = Math.round((coverage / 100) * cellsExpected)

    // Band width scales with how much of the panel actually filled.
    const halfBand = clamp(1.4 * (88 / coverage) + rng.gauss(0, 0.14), 1.0, 2.9)
    const baseHalfBand = halfBand * 0.94

    const daysBack = DAYS - 1 - i
    const status: PublicationStatus = suppressed
      ? 'SUPPRESSED'
      : daysBack < 7
        ? 'PROVISIONAL'
        : daysBack < 30
          ? 'REVISED'
          : 'FROZEN'

    out.push({
      date,
      total: Number(total.toFixed(2)),
      totalLow: Number((total - halfBand).toFixed(2)),
      totalHigh: Number((total + halfBand).toFixed(2)),
      base: Number(base.toFixed(2)),
      baseLow: Number((base - baseHalfBand).toFixed(2)),
      baseHigh: Number((base + baseHalfBand).toFixed(2)),
      coverage: Number(coverage.toFixed(1)),
      status,
      quotes: Math.round(cellsFilled * rng.range(4.2, 5.4)),
      cellsFilled,
      cellsExpected,
    })
  }
  return out
}

export const DAILY: IndexPoint[] = buildDaily()

/** Geometric mean, the aggregator used everywhere a set of index levels or
 *  price relatives has to collapse to one number. */
export function geomean(xs: number[]): number {
  if (xs.length === 0) return NaN
  return Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length)
}

function aggregate(points: IndexPoint[], keyOf: (d: string) => string): IndexPoint[] {
  const groups = new Map<string, IndexPoint[]>()
  for (const p of points) {
    if (p.status === 'SUPPRESSED') continue // a suppressed day is not carried upward
    const k = keyOf(p.date)
    const arr = groups.get(k)
    if (arr) arr.push(p)
    else groups.set(k, [p])
  }
  return [...groups.entries()].map(([date, ps]) => ({
    date,
    total: Number(geomean(ps.map((p) => p.total)).toFixed(2)),
    totalLow: Number(geomean(ps.map((p) => p.totalLow)).toFixed(2)),
    totalHigh: Number(geomean(ps.map((p) => p.totalHigh)).toFixed(2)),
    base: Number(geomean(ps.map((p) => p.base)).toFixed(2)),
    baseLow: Number(geomean(ps.map((p) => p.baseLow)).toFixed(2)),
    baseHigh: Number(geomean(ps.map((p) => p.baseHigh)).toFixed(2)),
    coverage: Number((ps.reduce((a, p) => a + p.coverage, 0) / ps.length).toFixed(1)),
    status: ps[ps.length - 1].status,
    quotes: ps.reduce((a, p) => a + p.quotes, 0),
    cellsFilled: ps.reduce((a, p) => a + p.cellsFilled, 0),
    cellsExpected: ps.reduce((a, p) => a + p.cellsExpected, 0),
  }))
}

const weekKey = (iso: string) => {
  const idx = DATES.indexOf(iso)
  const wk = Math.floor(idx / 7)
  return DATES[Math.min(wk * 7 + 6, DAYS - 1)]
}

export const WEEKLY: IndexPoint[] = aggregate(DAILY, weekKey)
export const MONTHLY: IndexPoint[] = aggregate(DAILY, (iso) => `${iso.slice(0, 8)}01`).filter(
  // June is a partial month in the window, so it is not published as a monthly point.
  (p) => p.date >= '2026-07-01',
)

export function seriesFor(freq: Frequency): IndexPoint[] {
  return freq === 'DAILY' ? DAILY : freq === 'WEEKLY' ? WEEKLY : MONTHLY
}

export const LATEST = DAILY[DAILY.length - 1]
export const PREVIOUS = DAILY[DAILY.length - 2]

/* ==========================================================================
   Lead-time fare curves
   ========================================================================== */

/** The DEL-BOM anchors quoted in the problem framing. Every other sector is
 *  this shape, re-levelled and re-steepened. */
const DELBOM_ANCHORS: Record<LeadBucket, number> = {
  45: 4180,
  30: 5340,
  15: 7412,
  7: 11900,
  1: 18650,
}

const SECTOR_SHAPE = new Map<string, { level: number; steep: number }>(
  SECTORS.map((s) => {
    // DEL-BOM is the reference shape, so it reproduces the anchor fares
    // exactly. Every other sector is that curve, re-levelled and re-steepened.
    if (s.id === 'DEL-BOM') return [s.id, { level: 1, steep: 1 }] as const
    const rng = makeRng(seedFrom(s.id))
    // Longer, denser trunk routes sit higher and price up harder at short lead.
    const level = clamp(0.42 + (s.paxK / 520) * 0.72 + rng.gauss(0, 0.07), 0.34, 1.24)
    const steep = clamp(
      (s.isTrunk ? 1.0 : 0.84) + (s.seasonality === 'leisure' ? 0.12 : 0) + rng.gauss(0, 0.07),
      0.66,
      1.18,
    )
    return [s.id, { level, steep }]
  }),
)

export function fareAtLead(sectorId: string, lead: number): number {
  const shape = SECTOR_SHAPE.get(sectorId)!
  const floor = DELBOM_ANCHORS[45]
  const anchors = LEAD_BUCKETS.map((b) => ({ b: b as number, v: DELBOM_ANCHORS[b] }))
  // Log-linear interpolation between the anchor buckets keeps the curve exact
  // where the panel actually observes it.
  let ref: number
  if (lead >= 45) ref = anchors[4].v
  else if (lead <= 1) ref = anchors[0].v
  else {
    let hi = anchors.find((a) => a.b >= lead)!
    let lo = [...anchors].reverse().find((a) => a.b <= lead)!
    if (hi.b === lo.b) ref = hi.v
    else {
      const t = (lead - lo.b) / (hi.b - lo.b)
      ref = Math.exp(Math.log(lo.v) * (1 - t) + Math.log(hi.v) * t)
    }
  }
  const premium = Math.pow(ref / floor, shape.steep)
  return Math.round(floor * shape.level * premium)
}

export interface ElasticityPoint {
  lead: number
  fare: number
  isBucket: boolean
}

export function elasticityCurve(sectorId: string): ElasticityPoint[] {
  const out: ElasticityPoint[] = []
  for (let lead = 1; lead <= 45; lead++) {
    out.push({
      lead,
      fare: fareAtLead(sectorId, lead),
      isBucket: (LEAD_BUCKETS as readonly number[]).includes(lead),
    })
  }
  return out
}

/** Ratio of the T+1 fare to the T+45 fare. The single most legible number on
 *  the elasticity screen. */
export function leadSpread(sectorId: string): number {
  return fareAtLead(sectorId, 1) / fareAtLead(sectorId, 45)
}

/* ==========================================================================
   Elementary cells and the sector heatmap
   ========================================================================== */

export interface Cell {
  key: string
  sectorId: string
  carrier: string
  lead: LeadBucket
  band: DowBand
  quotes: number
  imputed: boolean
  winsorised: number
  relative: number
  level: number
  meanFare: number
  prevMeanFare: number
}

function buildCells(): Cell[] {
  const cells: Cell[] = []
  for (const s of SECTORS) {
    for (const carrier of s.carriers) {
      for (const lead of LEAD_BUCKETS) {
        for (const band of DOW_BANDS) {
          const key = `${s.id}|${carrier}|${lead}|ECONOMY|${band}`
          const rng = makeRng(seedFrom(key))
          const weekendLift = band === 'WEEKEND' ? 1.09 : 1
          const carrierLift = carrier === 'AI' ? 1.13 : carrier === 'QP' ? 0.97 : 1
          const meanFare = Math.round(
            fareAtLead(s.id, lead) * weekendLift * carrierLift * rng.range(0.94, 1.07),
          )
          const relative = clamp(1 + rng.gauss(0.0011, 0.021), 0.83, 1.24)
          cells.push({
            key,
            sectorId: s.id,
            carrier,
            lead,
            band,
            quotes: rng.int(9, 74),
            imputed: rng.chance(0.027),
            winsorised: rng.chance(0.11) ? rng.int(1, 3) : 0,
            relative: Number(relative.toFixed(4)),
            level: Number((100 * rng.range(1.02, 1.31)).toFixed(2)),
            meanFare,
            prevMeanFare: Math.round(meanFare / relative),
          })
        }
      }
    }
  }
  return cells
}

export const CELLS: Cell[] = buildCells()

export const CELL_COUNT = CELLS.length

/** Week-on-week change per (sector, lead), which is what the heatmap paints. */
export interface HeatCell {
  sectorId: string
  lead: LeadBucket
  pctChange: number
  quotes: number
  carriers: string[]
  imputed: boolean
}

function buildHeatmap(): HeatCell[] {
  const out: HeatCell[] = []
  for (const s of SECTORS) {
    for (const lead of LEAD_BUCKETS) {
      const rng = makeRng(seedFrom(`heat|${s.id}|${lead}`))
      const members = CELLS.filter((c) => c.sectorId === s.id && c.lead === lead)
      // Short lead windows are where a demand week actually bites.
      const leadGain = lead === 1 ? 2.5 : lead === 7 ? 1.9 : lead === 15 ? 1.25 : lead === 30 ? 0.8 : 0.55
      const seasonGain =
        s.seasonality === 'leisure' ? 1.5 : s.seasonality === 'regional' ? 1.2 : 1
      let pct = rng.gauss(0.85, 7.1) * leadGain * 0.62 * seasonGain
      // The festival cell the demo script drills into.
      if (s.id === 'DEL-CCU' && lead === 7) pct = 34.0
      out.push({
        sectorId: s.id,
        lead,
        pctChange: Number(clamp(pct, -19, 41).toFixed(1)),
        quotes:
          s.id === 'DEL-CCU' && lead === 7
            ? 62
            : members.reduce((a, c) => a + c.quotes, 0),
        carriers: s.id === 'DEL-CCU' && lead === 7 ? ['6E', 'AI', 'SG', 'IX'] : s.carriers,
        imputed: s.id === 'DEL-CCU' && lead === 7 ? false : members.some((c) => c.imputed),
      })
    }
  }
  return out
}

export const HEATMAP: HeatCell[] = buildHeatmap()

export function heatAt(sectorId: string, lead: LeadBucket): HeatCell {
  return HEATMAP.find((h) => h.sectorId === sectorId && h.lead === lead)!
}

/* ==========================================================================
   Stratum weights
   ========================================================================== */

export interface Stratum {
  sectorId: string
  lead: LeadBucket
  weight: number
  sectorWeight: number
  bookingShare: number
}

const PAX_TOTAL = SECTORS.reduce((a, s) => a + s.paxK, 0)

export const STRATA: Stratum[] = SECTORS.flatMap((s) =>
  LEAD_BUCKETS.map((lead) => {
    const sectorWeight = s.paxK / PAX_TOTAL
    return {
      sectorId: s.id,
      lead,
      sectorWeight,
      bookingShare: BOOKING_SHARE[lead],
      weight: sectorWeight * BOOKING_SHARE[lead],
    }
  }),
)

export const SECTOR_WEIGHT = new Map(SECTORS.map((s) => [s.id, s.paxK / PAX_TOTAL]))

/** Which sectors pushed the latest daily move, in index points. */
export interface Contribution {
  sectorId: string
  points: number
  pctChange: number
}

export const CONTRIBUTIONS: Contribution[] = (() => {
  const move = LATEST.total - PREVIOUS.total
  // Each sector draws its own daily movement, then contributes that movement
  // scaled by its weight. The set is rescaled so the contributions sum exactly
  // to the published change, which is what makes the panel an attribution
  // rather than a decoration.
  const raw = SECTORS.map((s) => {
    const rng = makeRng(seedFrom(`contrib|${s.id}|${LATEST.date}`))
    const w = SECTOR_WEIGHT.get(s.id)!
    const sectorMove = rng.gauss(move / PREVIOUS.total, 0.011)
    return { sectorId: s.id, raw: w * sectorMove * PREVIOUS.total }
  })
  const sum = raw.reduce((a, r) => a + r.raw, 0)
  const scale = sum === 0 ? 0 : move / sum
  return raw
    .map((r) => {
      const points = r.raw * scale
      return {
        sectorId: r.sectorId,
        points: Number(points.toFixed(3)),
        pctChange: Number(((points / PREVIOUS.total) * 100).toFixed(3)),
      }
    })
    .sort((a, b) => b.points - a.points)
})()

/* ==========================================================================
   Fare decomposition
   ========================================================================== */

export interface FareSplit {
  date: string
  baseFare: number
  taxes: number
  udf: number
  convenience: number
  total: number
}

export const DECOMPOSITION: FareSplit[] = DAILY.map((p, i) => {
  const rng = makeRng(seedFrom(`split|${p.date}`))
  const total = 6820 * (p.total / START_TOTAL)
  // The levied components creep up as a share across the window. That drift is
  // the point of publishing base fare as a parallel series.
  const baseShare = 0.726 - (i / DAYS) * 0.014 + rng.gauss(0, 0.004)
  const taxShare = 0.137 + (i / DAYS) * 0.008 + rng.gauss(0, 0.002)
  const udfShare = 0.081 + (i / DAYS) * 0.004 + rng.gauss(0, 0.0015)
  const convShare = clamp(1 - baseShare - taxShare - udfShare, 0.035, 0.09)
  return {
    date: p.date,
    baseFare: Math.round(total * baseShare),
    taxes: Math.round(total * taxShare),
    udf: Math.round(total * udfShare),
    convenience: Math.round(total * convShare),
    total: Math.round(total),
  }
})

export interface SectorSplit {
  sectorId: string
  baseFare: number
  taxes: number
  udf: number
  convenience: number
  total: number
}

export const SECTOR_DECOMPOSITION: SectorSplit[] = SECTORS.map((s) => {
  const rng = makeRng(seedFrom(`ssplit|${s.id}`))
  const total = Math.round(
    (fareAtLead(s.id, 1) + fareAtLead(s.id, 7) + fareAtLead(s.id, 15) + fareAtLead(s.id, 30) + fareAtLead(s.id, 45)) / 5,
  )
  // UDF is a per-departure charge, so it is a bigger share of a cheap ticket.
  const udf = Math.round(clamp(rng.range(430, 690), 400, 720))
  const convenience = Math.round(rng.range(240, 460))
  const taxes = Math.round((total - udf - convenience) * rng.range(0.155, 0.185))
  return {
    sectorId: s.id,
    baseFare: total - udf - convenience - taxes,
    taxes,
    udf,
    convenience,
    total,
  }
}).sort((a, b) => b.total - a.total)

/* ==========================================================================
   Methodology console
   ========================================================================== */

export interface FormulaSeries {
  date: string
  jevons: number
  dutot: number
  carli: number
}

/** Three elementary formulas on the same underlying relatives.
 *  Carli is the arithmetic mean of relatives and sits above the geometric mean
 *  by the AM-GM inequality, which is exactly why it fails time reversal. */
export const FORMULA_SERIES: FormulaSeries[] = (() => {
  let jev = START_TOTAL
  let dut = START_TOTAL
  let car = START_TOTAL
  return DAILY.map((p, i) => {
    if (i > 0) {
      const rel = p.total / DAILY[i - 1].total
      const rng = makeRng(seedFrom(`form|${p.date}`))
      // Dispersion of the day-on-day log relatives inside a cell drives the
      // wedge between the three formulas. Carli exceeds the geometric mean by
      // roughly half that variance each period, which is the AM-GM gap, and it
      // compounds. Dutot's wedge comes from its implicit price-level weighting.
      const disp = clamp(0.036 + rng.gauss(0, 0.008), 0.014, 0.062)
      jev *= rel
      dut *= rel * (1 + rng.gauss(0.00022, 0.0009))
      car *= rel * (1 + (disp * disp) / 2)
    }
    return {
      date: p.date,
      jevons: Number(jev.toFixed(2)),
      dutot: Number(dut.toFixed(2)),
      carli: Number(car.toFixed(2)),
    }
  })
})()

export interface ImputationSeries {
  date: string
  cellMean: number
  carryForward: number
}

export const IMPUTATION_SERIES: ImputationSeries[] = (() => {
  let carry = START_TOTAL
  return DAILY.map((p, i) => {
    if (i > 0) {
      const rel = p.total / DAILY[i - 1].total
      const rng = makeRng(seedFrom(`imp|${p.date}`))
      // Carry-forward freezes the imputed share of the panel at last night's
      // price, so the series both flattens and drifts below the true path.
      const frozenShare = 0.027 + (rng.chance(0.15) ? rng.range(0.02, 0.06) : 0)
      carry *= 1 + (rel - 1) * (1 - frozenShare) - 0.00028
    }
    return { date: p.date, cellMean: p.total, carryForward: Number(carry.toFixed(2)) }
  })
})()

/** Sensitivity of the latest index level to the Tukey fence, k. A loose fence
 *  keeps genuine surges; a tight one edits them away. */
export function indexAtFence(k: number): { level: number; edited: number; keptSurge: boolean } {
  const kk = clamp(k, 1, 5)
  const edited = Math.round(21400 * Math.exp(-1.05 * (kk - 1)) + 260)
  const drag = (edited / 21400) * 3.1
  return {
    level: Number((LATEST.total - drag).toFixed(2)),
    edited,
    keptSurge: kk >= 2.2,
  }
}

/** Matched price pairs from one cell on two consecutive nights. Dutot needs
 *  the levels, not just the relatives, so the pairs are the primitive here. */
export interface PricePair {
  prev: number
  now: number
}

export const SAMPLE_PAIRS: PricePair[] = (() => {
  const rng = makeRng(seedFrom('relatives'))
  return Array.from({ length: 24 }, () => {
    const prev = Math.round(rng.range(3200, 19000))
    const now = Math.round(prev * clamp(Math.exp(rng.gauss(0.004, 0.19)), 0.52, 2.1))
    return { prev, now }
  })
})()

export const SAMPLE_RELATIVES: number[] = SAMPLE_PAIRS.map((p) =>
  Number((p.now / p.prev).toFixed(3)),
)

/** Time reversal: I(t/t-1) x I(t-1/t) should be exactly 1.
 *  Jevons and Dutot satisfy it identically. Carli is >= 1 by the AM-GM
 *  inequality, with equality only when every relative is identical. */
export function timeReversal(pairs: PricePair[]) {
  const n = pairs.length
  const fwd = pairs.map((p) => p.now / p.prev)
  const bwd = pairs.map((p) => p.prev / p.now)

  const jevons = geomean(fwd) * geomean(bwd)

  const sumNow = pairs.reduce((a, p) => a + p.now, 0)
  const sumPrev = pairs.reduce((a, p) => a + p.prev, 0)
  const dutot = (sumNow / sumPrev) * (sumPrev / sumNow)

  const carliF = fwd.reduce((a, r) => a + r, 0) / n
  const carliB = bwd.reduce((a, r) => a + r, 0) / n

  return { jevons, dutot, carli: carliF * carliB }
}

/* ==========================================================================
   Back-test
   ========================================================================== */

export interface BacktestPoint {
  date: string
  apix: number
  dgca: number | null
  cpi: number | null
}

const BACKTEST_DAYS = 30

/** Persistent level gap between an offer-price index and a realised-fare
 *  reference. It is a modelled quantity, not a fitted one: offer prices sit
 *  above what was actually paid, so APIx is expected to read high. */
const OFFER_PRICE_GAP = 0.024

export const BACKTEST: BacktestPoint[] = (() => {
  const window = DAILY.slice(-BACKTEST_DAYS)
  const anchor = window[0].total
  return window.map((p, i) => {
    const rng = makeRng(seedFrom(`bt|${p.date}`))
    const apix = (p.total / anchor) * 100
    // A slow wander stands in for the reference's own compilation differences,
    // and a small daily term for its measurement error. Neither is tuned to
    // flatter the metrics: the gap is what the back-test exists to report.
    const wander = 0.018 * Math.sin((2 * Math.PI * i) / 55 + 0.9)
    const dgca = apix * (1 - OFFER_PRICE_GAP + wander + rng.gauss(0, 0.003))
    const cpiPoint = i % 10 === 4
    return {
      date: p.date,
      apix: Number(apix.toFixed(2)),
      dgca: Number(dgca.toFixed(2)),
      cpi: cpiPoint
        ? Number((apix * (1 - OFFER_PRICE_GAP * 1.2 + rng.gauss(0, 0.0026))).toFixed(2))
        : null,
    }
  })
})()

function pearson(a: number[], b: number[]): number {
  const n = a.length
  const ma = a.reduce((x, y) => x + y, 0) / n
  const mb = b.reduce((x, y) => x + y, 0) / n
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma
    const y = b[i] - mb
    num += x * y
    da += x * x
    db += y * y
  }
  return num / Math.sqrt(da * db)
}

const logDiff = (xs: number[]) => xs.slice(1).map((x, i) => Math.log(x / xs[i]))

export interface BacktestMetrics {
  n: number
  rLevels: number
  rLogDiff: number
  rmse: number
  mape: number
  dirAgree: number
  dirTotal: number
}

export const BACKTEST_METRICS: BacktestMetrics = (() => {
  const apix = BACKTEST.map((p) => p.apix)
  const ref = BACKTEST.map((p) => p.dgca!)
  const n = apix.length
  const rmse = Math.sqrt(apix.reduce((a, x, i) => a + (x - ref[i]) ** 2, 0) / n)
  const mape = (apix.reduce((a, x, i) => a + Math.abs(x - ref[i]) / ref[i], 0) / n) * 100
  const da = logDiff(apix)
  const dr = logDiff(ref)
  const agree = da.reduce((a, x, i) => a + (Math.sign(x) === Math.sign(dr[i]) ? 1 : 0), 0)
  return {
    n,
    rLevels: pearson(apix, ref),
    rLogDiff: pearson(da, dr),
    rmse,
    mape,
    dirAgree: agree,
    dirTotal: da.length,
  }
})()

/** Recovery of a known injected inflation path on the synthetic panel. This is
 *  an estimator-correctness claim, not an "it ran" claim. */
export interface RecoveryPoint {
  day: number
  truth: number
  estimate: number
  low: number
  high: number
}

export const RECOVERY: RecoveryPoint[] = (() => {
  const rng = makeRng(seedFrom('recovery'))
  const out: RecoveryPoint[] = []
  let truth = 100
  for (let d = 0; d <= 60; d++) {
    // Injected path: 0.4% a month, with a 3% step at day 30.
    truth = 100 * Math.exp(0.000131 * d) * (d >= 30 ? 1.03 : 1)
    const est = truth * (1 + rng.gauss(0, 0.0042))
    const half = 1.32 + rng.gauss(0, 0.1)
    out.push({
      day: d,
      truth: Number(truth.toFixed(2)),
      estimate: Number(est.toFixed(2)),
      low: Number((est - half).toFixed(2)),
      high: Number((est + half).toFixed(2)),
    })
  }
  return out
})()

export const RECOVERY_INSIDE_BAND = RECOVERY.filter(
  (r) => r.truth >= r.low && r.truth <= r.high,
).length

/* ==========================================================================
   Cleaning funnel
   ========================================================================== */

export interface FunnelStage {
  id: string
  label: string
  detail: string
  kept: number
  removed: number
}

const RAW_QUOTES = 268400

export const FUNNEL: FunnelStage[] = (() => {
  const dupes = 9142
  const contract = 2963
  const outliers = 4318
  const afterDupes = RAW_QUOTES - dupes
  const afterContract = afterDupes - contract
  const clean = afterContract - outliers
  return [
    { id: 'raw', label: 'Landed raw', detail: 'Bronze payloads written to object storage as evidence', kept: RAW_QUOTES, removed: 0 },
    { id: 'dedupe', label: 'De-duplicated', detail: 'Same offer seen twice in a night, matched on fingerprint', kept: afterDupes, removed: dupes },
    { id: 'contract', label: 'Contract-checked', detail: 'Rows failing the schema contract, or with an unparseable fare split', kept: afterContract, removed: contract },
    { id: 'outlier', label: 'Outlier-edited', detail: 'Tukey fence on log relatives plus Hidiroglou-Berthelot on skewed cells', kept: clean, removed: outliers },
  ]
})()

export const CLEAN_QUOTES = FUNNEL[FUNNEL.length - 1].kept
export const RAW_QUOTE_COUNT = RAW_QUOTES
export const SURVIVAL_RATE = (CLEAN_QUOTES / RAW_QUOTES) * 100
export const IMPUTED_SHARE = 2.7
export const WINSORISED_QUOTES = 1874
export const SUPPRESSED_COUNT = SUPPRESSED_DAYS.size
export const MEAN_BAND_HALFWIDTH =
  DAILY.reduce((a, p) => a + (p.totalHigh - p.totalLow) / 2, 0) / DAILY.length

/* ==========================================================================
   Collection health
   ========================================================================== */

export interface SourceHealth {
  slug: string
  label: string
  kind: string
  quotes: number
  expected: number
  yieldPct: number
  blockRate: number
  p95Latency: number
  requestsToday: number
  cap: number
  lastBlock: string | null
  killSwitch: 'ARMED' | 'TRIPPED'
}

export const SOURCE_HEALTH: SourceHealth[] = PANEL_SOURCES.map((s) => {
  const rng = makeRng(seedFrom(`health|${s.slug}`))
  const expected = s.kind === 'MOU' ? 1200 : s.kind === 'LICENSED_API' ? 1450 : rng.int(680, 980)
  const yieldPct = s.kind === 'MOU' ? 100 : clamp(rng.range(81, 97.5), 60, 100)
  const quotes = Math.round((expected * yieldPct) / 100)
  const blockRate = s.kind === 'AIRLINE' ? rng.range(0.4, 3.2) : rng.range(0, 0.6)
  return {
    slug: s.slug,
    label: s.label,
    kind: s.kind,
    quotes,
    expected,
    yieldPct: Number(yieldPct.toFixed(1)),
    blockRate: Number(blockRate.toFixed(2)),
    p95Latency: Math.round(
      s.kind === 'LICENSED_API' || s.kind === 'MOU' ? rng.range(240, 520) : rng.range(1900, 5200),
    ),
    requestsToday: Math.round(s.nightlyCap * rng.range(0.42, 0.86)),
    cap: s.nightlyCap,
    lastBlock: s.kind === 'AIRLINE' && rng.chance(0.5) ? `${DEMO_DATE}T02:${rng.int(10, 55)}:00+05:30` : null,
    killSwitch: 'ARMED',
  }
})

export interface RunStage {
  id: string
  label: string
  startedAt: string
  durationMin: number
  status: 'OK' | 'WARN' | 'RUNNING'
  detail: string
}

export const NIGHTLY_RUN: RunStage[] = [
  { id: 'gate', label: 'Compliance gate warm-up', startedAt: '01:30', durationMin: 4, status: 'OK', detail: 'robots.txt re-fetched for 13 sources, 2 served from the 24h cache' },
  { id: 'collect', label: 'Collection fan-out', startedAt: '01:34', durationMin: 96, status: 'OK', detail: '600 cell tasks dispatched across 6 workers' },
  { id: 'land', label: 'Bronze landing', startedAt: '03:10', durationMin: 11, status: 'OK', detail: 'Raw payloads written as Parquet, partitioned by capture date' },
  { id: 'clean', label: 'Cleaning pipeline', startedAt: '03:21', durationMin: 18, status: 'WARN', detail: '4,318 quotes edited by the outlier rule, above the 30-day median of 3,780' },
  { id: 'index', label: 'Index compilation', startedAt: '03:39', durationMin: 7, status: 'OK', detail: 'Jevons per cell, weighted aggregation, chain-link, rebase' },
  { id: 'variance', label: 'Block bootstrap', startedAt: '03:46', durationMin: 14, status: 'OK', detail: '1,000 replicates, resampled within cell' },
  { id: 'publish', label: 'Publication gate', startedAt: '04:00', durationMin: 2, status: 'OK', detail: `Coverage ${LATEST.coverage}% cleared the 70% threshold, released as PROVISIONAL` },
]

/* ==========================================================================
   Request audit log
   ========================================================================== */

export interface AuditRow {
  id: string
  at: string
  source: string
  path: string
  status: number
  latencyMs: number
  robotsAllowed: boolean
  throttled: boolean
}

/** Each source is polled on its own paths, so a row in the log reads like a
 *  real request rather than a shuffled label. */
const AUDIT_PATHS: Record<string, string[]> = {
  indigo: ['/api/search/fare', '/booking/availability'],
  airindia: ['/flights/search', '/api/v1/availability'],
  airindiaexpress: ['/api/search/fare', '/flights/lowfare'],
  amadeus: ['/v2/shopping/flight-offers', '/v1/reference-data/locations'],
  duffel: ['/air/offer_requests', '/air/offers'],
  'dgca-feed': ['/tariff/monthly-extract', '/traffic/city-pair-extract'],
}

export const AUDIT: AuditRow[] = (() => {
  const rng = makeRng(seedFrom('audit'))
  const rows: AuditRow[] = []
  for (let i = 0; i < 140; i++) {
    const src = PANEL_SOURCES[i % PANEL_SOURCES.length]
    const min = 30 + Math.floor(i * 1.4)
    const hh = String(1 + Math.floor(min / 60)).padStart(2, '0')
    const mm = String(min % 60).padStart(2, '0')
    const ss = String(rng.int(0, 59)).padStart(2, '0')
    // A licensed API and a statutory feed are not rate-limited or blocked; only
    // the rendered portals produce 429s and throttling.
    const scraped = src.kind === 'AIRLINE' || src.kind === 'OTA'
    const throttled = scraped && rng.chance(0.24)
    const status = scraped && rng.chance(0.06) ? (rng.chance(0.6) ? 429 : 503) : 200
    const paths = AUDIT_PATHS[src.slug] ?? ['/api/v1/quote']
    rows.push({
      id: `req-${i}`,
      at: `${DEMO_DATE}T${hh}:${mm}:${ss}+05:30`,
      source: src.label,
      path: paths[i % paths.length],
      status,
      latencyMs: Math.round(scraped ? rng.range(900, 6400) : rng.range(180, 620)),
      robotsAllowed: true,
      throttled,
    })
  }
  return rows.reverse()
})()

/* ==========================================================================
   Quote explorer
   ========================================================================== */

export interface Quote {
  id: string
  capturedAt: string
  source: string
  sectorId: string
  carrier: string
  flightNo: string
  lead: LeadBucket
  band: DowBand
  baseFare: number
  taxes: number
  udf: number
  convenience: number
  total: number
  imputed: boolean
  winsorised: boolean
  soldOut: boolean
}

/** An airline's own portal only ever quotes its own flights. An OTA, a
 *  licensed API or the statutory feed can carry any carrier on the sector. */
const AIRLINE_PORTAL_CARRIER: Record<string, string> = {
  indigo: '6E',
  airindia: 'AI',
  airindiaexpress: 'IX',
  akasa: 'QP',
  spicejet: 'SG',
}

export const QUOTES: Quote[] = (() => {
  const rng = makeRng(seedFrom('quotes'))
  const rows: Quote[] = []
  for (let i = 0; i < 420; i++) {
    const src = PANEL_SOURCES[rng.int(0, PANEL_SOURCES.length - 1)]
    const forced = AIRLINE_PORTAL_CARRIER[src.slug]
    const eligible = forced ? SECTORS.filter((s) => s.carriers.includes(forced)) : SECTORS
    const sector = eligible[rng.int(0, eligible.length - 1)]
    const carrier = forced ?? sector.carriers[rng.int(0, sector.carriers.length - 1)]
    const lead = LEAD_BUCKETS[rng.int(0, LEAD_BUCKETS.length - 1)]
    const band = DOW_BANDS[rng.int(0, 1)]
    const soldOut = rng.chance(0.035)
    const total = Math.round(fareAtLead(sector.id, lead) * (band === 'WEEKEND' ? 1.09 : 1) * rng.range(0.9, 1.14))
    const udf = Math.round(rng.range(430, 690))
    const convenience = src.kind === 'OTA' ? Math.round(rng.range(240, 460)) : Math.round(rng.range(0, 90))
    const taxes = Math.round((total - udf - convenience) * rng.range(0.15, 0.19))
    const min = rng.int(30, 230)
    const hh = String(1 + Math.floor(min / 60)).padStart(2, '0')
    const mm = String(min % 60).padStart(2, '0')
    rows.push({
      id: `q-${i}`,
      capturedAt: `${DEMO_DATE}T${hh}:${mm}:00+05:30`,
      source: src.label,
      sectorId: sector.id,
      carrier,
      flightNo: `${carrier} ${rng.int(101, 989)}`,
      lead,
      band,
      baseFare: total - udf - convenience - taxes,
      taxes,
      udf,
      convenience,
      total,
      imputed: rng.chance(0.027),
      winsorised: rng.chance(0.008),
      soldOut,
    })
  }
  return rows
})()

/* ==========================================================================
   Carrier mix, for the overview
   ========================================================================== */

export interface CarrierShare {
  code: string
  name: string
  quotes: number
  share: number
  meanFare: number
}

export const CARRIER_MIX: CarrierShare[] = (() => {
  const raw = CARRIERS.map((c) => {
    const rng = makeRng(seedFrom(`mix|${c.code}`))
    const cells = CELLS.filter((x) => x.carrier === c.code)
    // Quote volume tracks seat share: a carrier flying six in ten domestic
    // seats shows up on roughly six in ten search results.
    const quotes = Math.round(CLEAN_QUOTES * c.presence * rng.range(0.94, 1.06))
    const meanFare = cells.length
      ? Math.round(cells.reduce((a, x) => a + x.meanFare, 0) / cells.length)
      : 0
    return { code: c.code, name: c.name, quotes, share: 0, meanFare }
  })
  const total = raw.reduce((a, r) => a + r.quotes, 0)
  return raw
    .map((r) => ({ ...r, share: Number(((r.quotes / total) * 100).toFixed(1)) }))
    .sort((a, b) => b.quotes - a.quotes)
})()
