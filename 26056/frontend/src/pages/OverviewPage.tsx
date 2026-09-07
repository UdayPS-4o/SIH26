import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowSquareOut,
  Broadcast,
  CalendarBlank,
  ChartLineUp,
  CurrencyInr,
  Drop,
  Funnel,
  Gauge,
  Receipt,
  ShieldCheck,
  Sparkle,
  Stack,
  Target,
  TrendDown,
  TrendUp,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  Donut,
  DivergingBars,
  IndexBandChart,
  KeyValue,
  Legend,
  Meter,
  PageHeader,
  Panel,
  SegmentedControl,
  StatTile,
  StatusChip,
  Toggle,
  cx,
  useChartTokens,
  useCountUp,
  seriesColor,
} from '@/ds'
import {
  BACKTEST_METRICS,
  CARRIER_MIX,
  CELL_COUNT,
  CLEAN_QUOTES,
  CONTRIBUTIONS,
  DAILY,
  EVENTS,
  LATEST,
  MEAN_BAND_HALFWIDTH,
  PREVIOUS,
  RAW_QUOTE_COUNT,
  SUPPRESSED_COUNT,
  seriesFor,
  type Frequency,
  type Measure,
} from '@/data/generate'
import { sectorOf } from '@/data/reference'
import {
  fmtDay,
  fmtDayFull,
  fmtIndex,
  fmtInt,
  fmtMonth,
  fmtPct,
  fmtSigned,
  fmtSignedPct,
} from '@/lib/format'

const FREQ_OPTIONS = [
  { value: 'DAILY' as Frequency, label: 'Daily' },
  { value: 'WEEKLY' as Frequency, label: 'Weekly' },
  { value: 'MONTHLY' as Frequency, label: 'Monthly' },
]

const MEASURE_OPTIONS = [
  { value: 'TOTAL' as Measure, label: 'Total fare', hint: 'What the household actually pays' },
  { value: 'BASE' as Measure, label: 'Base fare', hint: "The airline's own price signal" },
]

export function OverviewPage() {
  const t = useChartTokens()
  const [freq, setFreq] = useState<Frequency>('DAILY')
  const [measure, setMeasure] = useState<Measure>('TOTAL')
  const [showBand, setShowBand] = useState(true)
  const [showEvents, setShowEvents] = useState(true)

  const series = seriesFor(freq)
  const chartData = useMemo(
    () =>
      series.map((p) => ({
        date: p.date,
        value: measure === 'TOTAL' ? p.total : p.base,
        low: measure === 'TOTAL' ? p.totalLow : p.baseLow,
        high: measure === 'TOTAL' ? p.totalHigh : p.baseHigh,
      })),
    [series, measure],
  )

  const dayDelta = LATEST.total - PREVIOUS.total
  const monthAgo = DAILY[DAILY.length - 31]
  const monthDelta = ((LATEST.total - monthAgo.total) / monthAgo.total) * 100
  const baseDelta = ((LATEST.base - monthAgo.base) / monthAgo.base) * 100
  const spark = DAILY.slice(-30).map((p) => p.total)
  const animated = useCountUp(LATEST.total)

  const contributionRows = useMemo(
    () =>
      [...CONTRIBUTIONS.slice(0, 6), ...CONTRIBUTIONS.slice(-4)].map((c) => ({
        label: c.sectorId,
        value: c.points,
        note: `${sectorOf(c.sectorId).origin} to ${sectorOf(c.sectorId).destination} · weighted contribution to today's move`,
      })),
    [],
  )

  const carrierRows = CARRIER_MIX.map((c, i) => ({
    label: c.name,
    value: c.quotes,
    color: seriesColor(t, i),
  }))

  const markers = showEvents
    ? EVENTS.filter((e) => series.some((p) => p.date >= e.from)).map((e) => ({
        date:
          series.find((p) => p.date >= e.from)?.date ?? e.from,
        label: e.label,
        tone: e.kind,
      }))
    : []

  return (
    <div>
      <PageHeader
        kicker="Published index"
        title={`APIx stands at ${fmtIndex(LATEST.total)} on ${fmtDayFull(LATEST.date)}`}
        lede={
          <>
            One number a day for Indian domestic air travel, rebased to 2024 = 100, with a 95%
            block-bootstrap band on every point. The 90-day window holds {fmtInt(CLEAN_QUOTES)}{' '}
            cleaned offer prices across {CELL_COUNT} elementary cells.
          </>
        }
        actions={
          <>
            <Badge tone="accent" icon={CalendarBlank}>
              90-day window
            </Badge>
            <StatusChip status={LATEST.status} />
          </>
        }
      />

      {/* Hero: the headline number, then the panel that produced it */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-4"
          tone="accent"
          icon={ChartLineUp}
          title="APIx, total fare"
          meta="All-India, all sectors, all lead windows"
        >
          <div className="flex items-end gap-2">
            <span className="vm-num text-[52px] font-semibold leading-none tracking-tight text-ink">
              {fmtIndex(animated)}
            </span>
            <span className="pb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
              2024 = 100
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone={dayDelta >= 0 ? 'critical' : 'good'} icon={dayDelta >= 0 ? TrendUp : TrendDown}>
              {fmtSigned(dayDelta)} on the day
            </Badge>
            <Badge tone="neutral" icon={Drop}>
              95% band {fmtIndex(LATEST.totalLow)} to {fmtIndex(LATEST.totalHigh)}
            </Badge>
          </div>

          <div className="mt-4">
            <KeyValue
              dense
              rows={[
                { k: '30-day movement', v: fmtSignedPct(monthDelta), tone: monthDelta >= 0 ? 'critical' : 'good' },
                { k: 'Base-fare index', v: fmtIndex(LATEST.base) },
                { k: 'Wedge, total over base', v: fmtIndex(LATEST.total - LATEST.base) },
                { k: 'Mean band half-width', v: `±${MEAN_BAND_HALFWIDTH.toFixed(2)} pts` },
              ]}
            />
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Publication status, last 30 nights
            </p>
            <div className="flex flex-wrap gap-1">
              {DAILY.slice(-30).map((p) => (
                <span
                  key={p.date}
                  title={`${fmtDayFull(p.date)}: ${p.status}`}
                  className={cx(
                    'h-3.5 w-3.5 rounded-[3px]',
                    p.status === 'PROVISIONAL' && 'bg-accent',
                    p.status === 'REVISED' && 'bg-good',
                    p.status === 'FROZEN' && 'bg-surface-3',
                    p.status === 'SUPPRESSED' && 'bg-critical',
                  )}
                />
              ))}
            </div>
            <div className="mt-2">
              <Legend
                items={[
                  { label: 'Provisional', color: t.accent },
                  { label: 'Revised', color: t.good },
                  { label: 'Suppressed', color: t.critical },
                ]}
              />
            </div>
          </div>

          <Link
            to="/methodology"
            className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-accent hover:underline"
          >
            How this number is compiled
            <ArrowSquareOut size={13} weight="bold" />
          </Link>
        </Panel>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:col-span-8">
          <StatTile
            label="Quotes in the cleaned panel"
            value={fmtInt(CLEAN_QUOTES)}
            icon={Funnel}
            tone="accent"
            delta={{
              value: `${fmtPct((CLEAN_QUOTES / RAW_QUOTE_COUNT) * 100)} of raw`,
              direction: 'flat',
            }}
            note={`${fmtInt(RAW_QUOTE_COUNT - CLEAN_QUOTES)} rejected across 90 nights`}
          />
          <StatTile
            label="Panel coverage"
            value={fmtPct(LATEST.coverage)}
            icon={Gauge}
            tone={LATEST.coverage >= 70 ? 'good' : 'critical'}
            note={`${LATEST.cellsFilled} of ${LATEST.cellsExpected} cells · gate at 70%`}
          />
          <StatTile
            label="Elementary cells"
            value={fmtInt(CELL_COUNT)}
            icon={Stack}
            tone="neutral"
            note="Sector, carrier, lead window, cabin, weekday band"
          />
          <StatTile
            label="Base-fare index"
            value={fmtIndex(LATEST.base)}
            icon={CurrencyInr}
            tone="neutral"
            delta={{ value: fmtSignedPct(baseDelta), direction: baseDelta >= 0 ? 'up' : 'down' }}
            note="30-day movement"
            spark={DAILY.slice(-30).map((p) => p.base)}
            sparkColor={t.s3}
          />
          <StatTile
            label="Back-test correlation"
            value={BACKTEST_METRICS.rLevels.toFixed(2)}
            unit="ρ"
            icon={Target}
            tone="good"
            note={`${BACKTEST_METRICS.dirAgree} of ${BACKTEST_METRICS.dirTotal} days moved the same way`}
          />
          <StatTile
            label="Days suppressed"
            value={SUPPRESSED_COUNT}
            unit="of 90"
            icon={ShieldCheck}
            tone="warn"
            note="Coverage below the 70% gate, revised at T+7"
          />
          <StatTile
            className="col-span-2 sm:col-span-3"
            label="APIx, last 30 days"
            value={fmtIndex(LATEST.total)}
            icon={Sparkle}
            tone="accent"
            delta={{
              value: fmtSignedPct(monthDelta),
              direction: monthDelta >= 0 ? 'up' : 'down',
              good: monthDelta < 0,
            }}
            note="Dearer air travel is a cost to households, so a rise is read as the adverse direction"
            spark={spark}
            sparkColor={t['line-index']}
          />
        </div>
      </div>

      {/* The published series */}
      <Panel
        className="mt-3"
        icon={ChartLineUp}
        title="Published series"
        meta={`${series.length} points · ${measure === 'TOTAL' ? 'total fare' : 'base fare only'} · shaded band is the 95% block bootstrap`}
        actions={
          <>
            <SegmentedControl options={MEASURE_OPTIONS} value={measure} onChange={setMeasure} />
            <SegmentedControl options={FREQ_OPTIONS} value={freq} onChange={setFreq} />
          </>
        }
        footnote="Suppressed days are excluded from the weekly and monthly aggregates rather than carried forward. Aggregation across days is a geometric mean, matching the elementary formula."
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Legend
            items={[
              { label: measure === 'TOTAL' ? 'APIx total fare' : 'APIx base fare', color: t['line-index'] },
              { label: '95% bootstrap band', color: t.band },
            ]}
          />
          <div className="flex flex-wrap items-center gap-4">
            <Toggle checked={showBand} onChange={setShowBand} label="Confidence band" />
            <Toggle checked={showEvents} onChange={setShowEvents} label="Event markers" />
          </div>
        </div>

        <IndexBandChart
          data={chartData}
          height={300}
          showBand={showBand}
          markers={markers}
          xFormat={freq === 'MONTHLY' ? fmtMonth : fmtDay}
          yLabel="Index, 2024 = 100"
          tipTitle={freq === 'MONTHLY' ? fmtMonth : fmtDayFull}
          valueFormat={fmtIndex}
        />
      </Panel>

      {/* What moved it, and where the quotes came from */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel
          className="lg:col-span-7"
          icon={Receipt}
          title="What moved the index today"
          meta="Weighted stratum contributions, in index points, to the change from yesterday"
          footnote="Weights are the DGCA city-pair traffic share crossed with the lead-time booking profile. The booking profile is an estimate and is editable on the methodology console."
        >
          <DivergingBars
            rows={contributionRows}
            height={320}
            valueFormat={(n) => fmtSigned(n, 3)}
          />
        </Panel>

        <div className="grid grid-cols-1 gap-3 lg:col-span-5">
          <Panel icon={Broadcast} title="Who the quotes are for" meta="Share of the cleaned panel by marketing carrier">
            <div className="flex items-center gap-4">
              <div className="w-[168px] shrink-0">
                <Donut
                  rows={carrierRows}
                  valueFormat={fmtInt}
                  centreValue={String(CARRIER_MIX.length)}
                  centreLabel="carriers"
                />
              </div>
              <ul className="min-w-0 flex-1 space-y-1.5">
                {CARRIER_MIX.map((c, i) => (
                  <li key={c.code} className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-chip"
                      style={{ background: seriesColor(t, i) }}
                    />
                    <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">{c.name}</span>
                    <span className="vm-num text-[12px] font-medium text-ink">{c.share}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>

          <Panel icon={Gauge} title="Publication gate" meta="A day that does not fill enough of the panel is not published">
            <div className="space-y-3">
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[12px] text-ink-2">Coverage tonight</span>
                  <span className="vm-num text-[13px] font-semibold text-ink">
                    {fmtPct(LATEST.coverage)}
                  </span>
                </div>
                <Meter
                  value={LATEST.coverage}
                  threshold={70}
                  thresholdLabel="70% publication threshold"
                  tone={LATEST.coverage >= 70 ? 'good' : 'critical'}
                  height={10}
                />
                <p className="mt-1.5 text-[11px] text-ink-3">
                  Marker at 70%. Below it, the day is written as SUPPRESSED and revised at T+7.
                </p>
              </div>
              <Callout tone="gate" title="An honest gap beats a fabricated number">
                Two of the 90 days in this window failed the gate. They are visible in the series as
                breaks, not smoothed over.
              </Callout>
            </div>
          </Panel>
        </div>
      </div>

      {/* Calendar */}
      <Panel
        className="mt-3"
        icon={CalendarBlank}
        title="Annotated events in the window"
        meta="What the series is reacting to, and what it should not be blamed for"
        bleed
      >
        <ul className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {EVENTS.map((e) => (
            <li
              key={e.id}
              className="flex flex-col gap-2 p-4 sm:border-r sm:border-line sm:last:border-r-0"
            >
              <Badge
                tone={e.kind === 'cost' ? 'gate' : e.kind === 'capacity' ? 'warn' : 'critical'}
                icon={e.kind === 'cost' ? CurrencyInr : e.kind === 'capacity' ? Stack : Warning}
              >
                {e.kind}
              </Badge>
              <p className="font-display text-[13.5px] font-semibold leading-tight text-ink">
                {e.label}
              </p>
              <p className="vm-num text-[11px] text-ink-3">
                {fmtDay(e.from)}
                {e.from !== e.to ? ` to ${fmtDay(e.to)}` : ''} · lift {fmtSignedPct(e.lift * 100)}
              </p>
              <p className="text-[11.5px] leading-relaxed text-ink-2">{e.note}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="mt-3">
        <Callout tone="neutral" title="What this screen is not claiming">
          <p>
            These are <strong className="text-ink">offer</strong> prices, not transaction prices. We
            observe what a traveller would be quoted, not what was paid, nor the mix of fare buckets
            actually sold. The back-test measures the residual gap rather than hiding it, and the
            figures on this page come from the live 90-day collection panel.
          </p>
        </Callout>
      </div>
    </div>
  )
}
