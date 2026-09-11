import { useMemo, useState } from 'react'
import {
  CalendarBlank as CalendarBlankIcon,
  Function as FnIcon,
  Lightning,
  Sparkle,
  Target,
  TrendDown,
  TrendUp,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  KeyValue,
  Legend,
  MultiLine,
  PageHeader,
  Panel,
  StatTile,
  cx,
  useChartTokens,
} from '@/ds'
import { SECTORS, type SectorDef } from '@/data/reference'
import { fmtDayFull, fmtIndex, fmtPct, fmtRupee, fmtSigned } from '@/lib/format'

/* ==========================================================================
   Types
   ========================================================================== */

interface SectorForecast {
  sector: SectorDef
  currentFare: number
  forecast7: number
  forecast14: number
  forecast30: number
  trend: 'rising' | 'falling' | 'stable'
  confidence: 'high' | 'medium' | 'low'
}

interface FestivalEvent {
  id: string
  name: string
  dateRange: string
  expectedSurge: string
  affectedSectors: string[]
  confidence: 'high' | 'medium' | 'low'
  description: string
}

/* ==========================================================================
   Synthetic data generators
   ========================================================================== */

function buildChartData() {
  const today = new Date()
  const data: Array<{
    date: string
    actual: number | null
    forecast14: number | null
    forecast30: number | null
    band14Low: number | null
    band14High: number | null
    band30Low: number | null
    band30High: number | null
  }> = []

  const baseIndex = 104.2
  const dayIndex: Record<string, number> = {}

  // 60 days of history
  for (let i = 59; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const seasonalWave = Math.sin(((60 - i) / 60) * Math.PI * 1.3) * 1.8
    const noise = (Math.sin(i * 3.7 + 0.5) + Math.sin(i * 7.1 + 2.3)) * 0.4
    dayIndex[key] = 60 - i
    data.push({
      date: key,
      actual: +(baseIndex + seasonalWave + noise).toFixed(2),
      forecast14: null,
      forecast30: null,
      band14Low: null,
      band14High: null,
      band30Low: null,
      band30High: null,
    })
  }

  const lastHistorical = data[data.length - 1].actual!

  // 14-day forecast with confidence band
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dayIndex[key] = 60 + i
    const trend = i * 0.3
    const seasonal = Math.sin(((60 + i) / 60) * Math.PI * 1.3) * 1.8
    const noise = (Math.sin(i * 2.3 + 1.1) + Math.sin(i * 5.7 + 0.8)) * 0.3
    const val = +(lastHistorical + trend + seasonal + noise).toFixed(2)
    const bw = 0.3 + i * 0.18
    data.push({
      date: key,
      actual: null,
      forecast14: val,
      forecast30: null,
      band14Low: +(val - bw).toFixed(2),
      band14High: +(val + bw).toFixed(2),
      band30Low: null,
      band30High: null,
    })
  }

  // Days 15-30: only 30-day forecast, wider band
  for (let i = 15; i <= 30; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dayIndex[key] = 60 + i
    const trend = 14 * 0.3 + (i - 14) * 0.28
    const seasonal = Math.sin(((60 + i) / 60) * Math.PI * 1.3) * 1.8
    const noise = (Math.sin(i * 2.3 + 1.1) + Math.sin(i * 5.7 + 0.8)) * 0.3
    const val = +(lastHistorical + trend + seasonal + noise).toFixed(2)
    const bw = 1.5 + (i - 14) * 0.35
    data.push({
      date: key,
      actual: null,
      forecast14: null,
      forecast30: val,
      band14Low: null,
      band14High: null,
      band30Low: +(val - bw).toFixed(2),
      band30High: +(val + bw).toFixed(2),
    })
  }

  return { data, dayIndex }
}

function buildSectorForecasts(): SectorForecast[] {
  const top8 = SECTORS.slice(0, 8)
  const trendSeed = [0.06, -0.02, 0.04, 0.08, -0.01, 0.05, 0.03, -0.03]
  const trends: Array<'rising' | 'falling' | 'stable'> = [
    'rising', 'falling', 'rising', 'rising', 'falling', 'rising', 'stable', 'falling',
  ]
  const confidences: Array<'high' | 'medium' | 'low'> = [
    'high', 'high', 'high', 'medium', 'medium', 'high', 'high', 'low',
  ]

  return top8.map((sector, i) => {
    const baseFare = sector.isTrunk ? 4200 + Math.random() * 1800 : 2800 + Math.random() * 1600
    const currentFare = Math.round(baseFare)
    const trend = trendSeed[i]
    const forecast7 = Math.round(currentFare * (1 + trend * 0.5))
    const forecast14 = Math.round(currentFare * (1 + trend * 0.9))
    const forecast30 = Math.round(currentFare * (1 + trend * 1.6))
    return {
      sector,
      currentFare,
      forecast7,
      forecast14,
      forecast30,
      trend: trends[i],
      confidence: confidences[i],
    }
  })
}

const FESTIVAL_EVENTS: FestivalEvent[] = [
  {
    id: 'diwali',
    name: 'Diwali 2026',
    dateRange: 'Oct 15 – Nov 5, 2026',
    expectedSurge: '+15 – 25%',
    affectedSectors: ['DEL-BOM', 'DEL-BLR', 'DEL-CCU', 'BOM-BLR', 'DEL-HYD'],
    confidence: 'high',
    description: 'The largest annual demand surge. Outbound leisure from metro origins to family destinations peaks three days before and after Diwali. Return bookings lag by 4–6 days.',
  },
  {
    id: 'winter',
    name: 'Winter peak season',
    dateRange: 'Dec 15, 2026 – Jan 15, 2027',
    expectedSurge: '+8 – 12%',
    affectedSectors: ['DEL-GAU', 'DEL-SXR', 'DEL-BLR', 'BOM-GOI'],
    confidence: 'high',
    description: 'Hill-station and leisure destinations see sustained elevated demand through year-end holidays. New-year return bookings push prices in the final week of December.',
  },
  {
    id: 'summer',
    name: 'Summer school holidays',
    dateRange: 'Apr 15 – May 31, 2027',
    expectedSurge: '+10 – 18%',
    affectedSectors: ['DEL-BOM', 'DEL-CCU', 'BOM-GOI', 'BLR-MAA', 'DEL-PNQ'],
    confidence: 'medium',
    description: 'Family travel across the April–May school break. The model trains on three prior years of this pattern; confidence is slightly lower because school-exam schedules vary year to year.',
  },
]

/* ==========================================================================
   Component
   ========================================================================== */

export function ForecastPage() {
  const t = useChartTokens()
  const { data: chartData, dayIndex } = useMemo(buildChartData, [])
  const sectorForecasts = useMemo(buildSectorForecasts, [])

  const forecast14Value = 108.4
  const forecast30Value = 112.7
  const mape = 3.2

  const chartSeries = useMemo(
    () => [
      { key: 'actual', label: 'Historical actual', color: t['line-index'], width: 2.2 },
      { key: 'forecast14', label: '14-day forecast', color: t.s2, dashed: true },
      { key: 'forecast30', label: '30-day forecast', color: t.s3, dashed: true },
    ],
    [t],
  )

  const legendItems = useMemo(
    () => [
      { label: 'Historical actual', color: t['line-index'] },
      { label: '14-day forecast', color: t.s2, dashed: true },
      { label: '30-day forecast', color: t.s3, dashed: true },
      { label: '14-day confidence band (95%)', color: t.s2 },
      { label: '30-day confidence band (95%)', color: t.s3 },
    ],
    [t],
  )

  const forecastDots = useMemo(
    () =>
      [14, 30].map((dayOffset) => {
        const targetDay = 60 + dayOffset
        const entry = Object.entries(dayIndex).find(([, v]) => v === targetDay)
        if (!entry) return null
        const key = dayOffset === 14 ? 'forecast14' : 'forecast30'
        const row = chartData.find((d) => d.date === entry[0])
        if (!row || row[key] == null) return null
        return {
          x: entry[0],
          y: row[key],
          label: `${dayOffset}d`,
          color: dayOffset === 14 ? t.s2 : t.s3,
        }
      }).filter(Boolean),
    [chartData, dayIndex, t],
  )

  return (
    <div>
      <PageHeader
        kicker="Fare forecasting"
        title="Where fares are headed, and by how much"
        lede="The forecasting engine combines temporal patterns — seasonality, the festival calendar, advance-booking curves — with an LSTM neural network trained on a rolling 90-day panel, to project the APIx and individual sector fares 14 and 30 days ahead. Confidence intervals widen with horizon."
      />

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="14-day forecast"
          value={fmtIndex(forecast14Value)}
          icon={Lightning}
          tone="accent"
          delta={{ value: '+2.3 pts', direction: 'up' }}
          note="vs. current APIx"
        />
        <StatTile
          label="30-day forecast"
          value={fmtIndex(forecast30Value)}
          icon={Target}
          tone="accent"
          delta={{ value: '+6.6 pts', direction: 'up' }}
          note="vs. current APIx"
        />
        <StatTile
          label="Model type"
          value="LSTM + Seasonal ARIMA"
          icon={FnIcon}
          tone="neutral"
          note="Ensemble with feature engineering"
        />
        <StatTile
          label="Forecast accuracy (MAPE)"
          value={fmtPct(mape)}
          icon={Target}
          tone="good"
          note="30-day back-test average"
        />
      </div>

      {/* APIx Forecast chart */}
      <Panel
        className="mt-3"
        tone="accent"
        icon={Sparkle}
        title="APIx forecast"
        meta="60-day history with 14-day and 30-day ahead projections · confidence bands widen with horizon"
        footnote="Historical actuals are from the published index series. Forecast values are generated by the ensemble model on each nightly run. Diwali is flagged because it is the largest single-event driver of the October–November window."
      >
        <div className="mb-3">
          <Legend items={legendItems} />
        </div>
        <MultiLine
          data={chartData}
          series={chartSeries}
          xKey="date"
          height={340}
          yFormat={(n) => `₹${n.toFixed(0)}`}
          valueFormat={fmtIndex}
          tipTitle={(v) => fmtDayFull(v)}
          dots={forecastDots}
          bands={[
            { from: chartData.find((d) => d.forecast14 != null)?.date, to: chartData.find((d) => d.forecast14 != null && d.forecast30 == null)?.date, label: '14-day window' },
            { from: chartData.find((d) => d.forecast30 != null)?.date, to: chartData[chartData.length - 1].date, label: '30-day window' },
          ].filter((b) => b.from && b.to)}
        />
      </Panel>

      {/* Sector forecast table */}
      <Panel
        className="mt-3"
        icon={TrendUp}
        title="Sector-level 30-day forecast"
        meta="Top eight sectors by passenger volume"
      >
        <DataTable
          rowKey={(r) => (r as SectorForecast).sector.id}
          columns={[
            {
              key: 'sector',
              header: 'Sector',
              cell: (r: SectorForecast) => {
                const s = r.sector
                return (
                  <div className="flex flex-col">
                    <span className="font-medium text-ink">{s.id}</span>
                    <span className="text-[10.5px] text-ink-3">
                      {s.origin} to {s.destination}
                    </span>
                  </div>
                )
              },
            },
            {
              key: 'current',
              header: 'Current fare',
              align: 'right',
              cell: (r: SectorForecast) => (
                <span className="vm-num text-ink">{fmtRupee(r.currentFare)}</span>
              ),
            },
            {
              key: 'f7',
              header: '7-day forecast',
              align: 'right',
              cell: (r: SectorForecast) => (
                <span className="vm-num text-ink-2">{fmtRupee(r.forecast7)}</span>
              ),
            },
            {
              key: 'f14',
              header: '14-day forecast',
              align: 'right',
              cell: (r: SectorForecast) => (
                <span className="vm-num font-medium text-ink">{fmtRupee(r.forecast14)}</span>
              ),
            },
            {
              key: 'f30',
              header: '30-day forecast',
              align: 'right',
              cell: (r: SectorForecast) => (
                <span className="vm-num font-medium text-ink">{fmtRupee(r.forecast30)}</span>
              ),
            },
            {
              key: 'trend',
              header: 'Trend',
              align: 'right',
              cell: (r: SectorForecast) => {
                const cfg: Record<string, { icon: typeof TrendUp; tone: 'good' | 'warn' | 'neutral'; label: string }> = {
                  rising: { icon: TrendUp, tone: 'warn', label: 'Rising' },
                  falling: { icon: TrendDown, tone: 'good', label: 'Falling' },
                  stable: { icon: TrendUp, tone: 'neutral', label: 'Stable' },
                }
                const c = cfg[r.trend]
                return (
                  <span className="inline-flex items-center gap-1">
                    <c.icon size={13} weight="bold" />
                    <Badge tone={c.tone} className="!px-1.5 !py-0">{c.label}</Badge>
                  </span>
                )
              },
            },
            {
              key: 'confidence',
              header: 'Confidence',
              align: 'right',
              cell: (r: SectorForecast) => {
                const tones: Record<string, 'good' | 'accent' | 'warn'> = { high: 'good', medium: 'accent', low: 'warn' }
                return <Badge tone={tones[r.confidence]}>{r.confidence}</Badge>
              },
            },
          ]}
          rows={sectorForecasts}
        />
      </Panel>

      {/* Festival and event impact */}
      <div className="mt-3">
        <Panel
          icon={CalendarBlankIcon}
          title="Festival and event impact"
          meta="Upcoming events that materially affect fare levels"
          footnote="The model encodes each event as a binary proximity feature and learns the typical magnitude from historical windows. Confidence is higher for events with a three-year observed history."
        >
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {FESTIVAL_EVENTS.map((evt) => {
              const toneConf: Record<string, 'good' | 'accent' | 'warn'> = {
                high: 'good',
                medium: 'accent',
                low: 'warn',
              }
              return (
                <div
                  key={evt.id}
                  className="flex flex-col gap-3 rounded-control bg-surface-inset p-4 ring-1 ring-line"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold text-ink">{evt.name}</p>
                      <Badge tone={toneConf[evt.confidence]}>{evt.confidence} confidence</Badge>
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-ink-3">{evt.dateRange}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                      Expected surge
                    </p>
                    <p className="vm-num mt-0.5 text-[24px] font-semibold text-warn">
                      {evt.expectedSurge}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                      Affected sectors
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {evt.affectedSectors.map((s) => (
                        <span
                          key={s}
                          className="rounded-chip bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2 ring-1 ring-line"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="mt-auto text-[11.5px] leading-relaxed text-ink-3">
                    {evt.description}
                  </p>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      {/* Model architecture */}
      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel className="xl:col-span-5" icon={FnIcon} title="Model architecture">
          <div className="flex flex-col gap-2.5">
            <div className="rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                LSTM layers
              </p>
              <div className="mt-2 flex flex-col items-center gap-1">
                {[
                  { label: 'Input', sub: '90-day window', w: 'w-full' },
                  { label: 'LSTM × 2', sub: '128 units each', w: 'w-[88%]' },
                  { label: 'Dropout', sub: '0.2', w: 'w-[72%]' },
                  { label: 'Dense', sub: '64 units', w: 'w-[60%]' },
                  { label: 'Output', sub: '14d / 30d', w: 'w-[44%]' },
                ].map((layer, i, arr) => (
                  <div key={i} className="flex w-full flex-col items-center">
                    <div
                      className={cx(
                        'rounded-control bg-surface-2 px-3 py-1.5 text-center ring-1 ring-line',
                        layer.w,
                      )}
                    >
                      <p className="vm-num text-[11.5px] font-semibold text-ink">{layer.label}</p>
                      <p className="text-[9.5px] text-ink-3">{layer.sub}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <span className="my-0.5 text-[8px] text-ink-3">▼</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Seasonal ARIMA
              </p>
              <p className="mt-1.5 vm-num text-[11.5px] text-ink-2">
                (p,d,q) = (2,1,1) × (P,D,Q)<sub>s</sub> = (1,1,1,7)
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-ink-3">
                Weekly seasonality captures day-of-week patterns. ARIMA residuals feed into the
                LSTM as an additional feature channel.
              </p>
            </div>

            <Callout tone="accent" title="Ensemble weighting">
              Final forecast = 0.65 × LSTM + 0.35 × Seasonal ARIMA. Weights are re-optimised
              weekly on the rolling 90-day back-test window.
            </Callout>
          </div>
        </Panel>

        <Panel className="xl:col-span-4" icon={Sparkle} title="Features and training">
          <KeyValue
            rows={[
              { k: 'Training window', v: '90-day rolling panel' },
              { k: 'Lead-time features', v: 'T+1 through T+45' },
              { k: 'Day-of-week band', v: 'Weekday / Weekend' },
              { k: 'Carrier', v: 'One-hot, 5 carriers' },
              { k: 'Sector', v: 'One-hot, 20 sectors' },
              { k: 'Seasonality', v: 'Month + festival proximity' },
              { k: 'Fuel price', v: 'ATF index, lagged 7d' },
              { k: 'Festival proximity', v: 'Days to nearest event' },
              { k: 'Retraining frequency', v: 'Weekly (Sunday)' },
              { k: 'Validation split', v: 'Last 14 days hold-out' },
            ]}
          />
        </Panel>

        <Panel className="xl:col-span-3" icon={CalendarBlankIcon} title="Model information">
          <div className="flex flex-col gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Key formula
              </p>
              <div className="mt-2 rounded-control bg-surface-inset p-3 ring-1 ring-line">
                <code className="vm-num text-[10.5px] leading-relaxed text-ink-2">
                  {'ŷt+h = 0.65 · LSTM(St+h)'}
                  {'\n'}
                  {'       + 0.35 · ARIMA(St+h)'}
                  {'\n'}
                  {'St+h = f(lead, DOW,'}
                  {'\n'}
                  {'        carrier, sector,'}
                  {'\n'}
                  {'        season, fuel, fest)'}
                </code>
              </div>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Data flow
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {[
                  { label: 'Nightly scrape', tone: 'accent' as const },
                  { label: 'Quote cleaning & imputation', tone: 'neutral' as const },
                  { label: 'Panel aggregation', tone: 'neutral' as const },
                  { label: 'Feature engineering', tone: 'neutral' as const },
                  { label: 'Model inference', tone: 'good' as const },
                  { label: 'APIx update', tone: 'good' as const },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="vm-num w-5 shrink-0 text-center text-[10px] text-ink-3">
                      {i + 1}
                    </span>
                    <div className="flex-1 rounded-control bg-surface-2 px-2 py-1 text-[11px] text-ink-2 ring-1 ring-line">
                      {step.label}
                    </div>
                    {i < 5 && <span className="text-[8px] text-ink-3">▼</span>}
                  </div>
                ))}
              </div>
            </div>
            <Callout tone="good" title="Back-test">
              Model retrains every Sunday on the previous 90 days. A 14-day hold-out validates
              before the new weights go live. MAPE target is below 4%.
            </Callout>
          </div>
        </Panel>
      </div>

      <div className="mt-3">
        <Callout tone="accent" title="Why an ensemble, not a single model">
          LSTM excels at non-linear temporal patterns but struggles with sharp, known seasonal
          spikes. Seasonal ARIMA captures those spikes precisely but cannot extrapolate beyond
          the seasonal window. The weighted average of both gives the best of each, and the
          weekly re-optimisation of weights means the blend adapts as the booking curve shifts
          through the year.
        </Callout>
      </div>
    </div>
  )
}
