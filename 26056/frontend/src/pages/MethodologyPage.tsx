import { useMemo, useState } from 'react'
import {
  ArrowsClockwise,
  CheckCircle,
  Function as FunctionIcon,
  Prohibit,
  Scales,
  SlidersHorizontal,
  Sparkle,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  Formula,
  KeyValue,
  Legend,
  Meter,
  MultiLine,
  PageHeader,
  Panel,
  SegmentedControl,
  Slider,
  StatTile,
  Toggle,
  useChartTokens,
} from '@/ds'
import {
  CLEAN_QUOTES,
  FORMULA_SERIES,
  IMPUTATION_SERIES,
  LATEST,
  SAMPLE_PAIRS,
  SAMPLE_RELATIVES,
  indexAtFence,
  timeReversal,
} from '@/data/generate'
import { BOOKING_SHARE, LEAD_BUCKETS, SECTORS } from '@/data/reference'
import { fmtDay, fmtDayFull, fmtIndex, fmtInt, fmtLead, fmtPct } from '@/lib/format'

type FormulaKey = 'jevons' | 'dutot' | 'carli'

const FORMULA_OPTIONS = [
  { value: 'jevons' as FormulaKey, label: 'Jevons', hint: 'Geometric mean of price relatives. What we publish.' },
  { value: 'dutot' as FormulaKey, label: 'Dutot', hint: 'Ratio of mean prices. Diagnostic only.' },
  { value: 'carli' as FormulaKey, label: 'Carli', hint: 'Arithmetic mean of relatives. Diagnostic only.' },
]

const FORMULA_TEXT: Record<FormulaKey, string> = {
  jevons: `           n
  I_c  =  ∏  ( p_i,t / p_i,t-1 ) ^ (1/n)
          i=1`,
  dutot: `  I_c  =  ( Σ p_i,t ) / ( Σ p_i,t-1 )`,
  carli: `  I_c  =  (1/n) Σ ( p_i,t / p_i,t-1 )`,
}

const FORMULA_NOTE: Record<FormulaKey, string> = {
  jevons:
    'The standard elementary formula for volatile, substitutable items. It implies unit elasticity of substitution, which is behaviourally reasonable for air travel: travellers really do shift dates, carriers and booking timing when prices move.',
  dutot:
    'Implicitly weights by price level, so one expensive cell can dominate the aggregate. Kept as a diagnostic, never published.',
  carli:
    'Fails the time-reversal test: the forward index multiplied by the backward index is always at least one, with equality only when every relative is identical. On airfares, where relatives routinely span 0.5 to 2.0, that upward bias is large rather than academic.',
}

export function MethodologyPage() {
  const t = useChartTokens()
  const [formula, setFormula] = useState<FormulaKey>('jevons')
  const [showAll, setShowAll] = useState(true)
  const [k, setK] = useState(3)
  const [carryForward, setCarryForward] = useState(false)
  const [shares, setShares] = useState<Record<number, number>>({ ...BOOKING_SHARE })

  const reversal = useMemo(() => timeReversal(SAMPLE_PAIRS), [])
  const fence = indexAtFence(k)

  const formulaSeries = useMemo(() => {
    const all = [
      { key: 'jevons', label: 'Jevons (published)', color: t['line-index'], width: 2.4 },
      { key: 'dutot', label: 'Dutot (diagnostic)', color: t.s3, dashed: true },
      { key: 'carli', label: 'Carli (diagnostic)', color: t.s2, dashed: true },
    ]
    return showAll ? all : all.filter((s) => s.key === formula)
  }, [showAll, formula, t])

  const impSeries = useMemo(
    () => [
      { key: 'cellMean', label: 'Cell-mean imputation (used)', color: t['line-index'] },
      ...(carryForward
        ? [{ key: 'carryForward', label: 'Naive carry-forward (contrast)', color: t.s6, dashed: true }]
        : []),
    ],
    [carryForward, t],
  )

  const shareTotal = LEAD_BUCKETS.reduce((a, b) => a + shares[b], 0)
  const impLast = IMPUTATION_SERIES[IMPUTATION_SERIES.length - 1]
  const drift = impLast.cellMean - impLast.carryForward

  const carliGap =
    FORMULA_SERIES[FORMULA_SERIES.length - 1].carli - FORMULA_SERIES[FORMULA_SERIES.length - 1].jevons

  return (
    <div>
      <PageHeader
        kicker="Methodology console"
        title="The formula choice, made visible instead of asserted"
        lede="Every switch on this page recomputes the index from the same underlying quotes. This is the screen that answers how anyone knows the published number is right."
        actions={
          <Badge tone="accent" icon={Sparkle}>
            Recomputed live from the seeded panel
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Published index, Jevons"
          value={fmtIndex(FORMULA_SERIES[FORMULA_SERIES.length - 1].jevons)}
          icon={FunctionIcon}
          tone="accent"
          note="Geometric mean of within-cell price relatives"
        />
        <StatTile
          label="Same quotes under Carli"
          value={fmtIndex(FORMULA_SERIES[FORMULA_SERIES.length - 1].carli)}
          icon={Warning}
          tone="critical"
          delta={{ value: `+${carliGap.toFixed(2)} pts`, direction: 'up', good: false }}
          note="Upward bias, not a different opinion"
        />
        <StatTile
          label="Time reversal, Jevons"
          value={reversal.jevons.toFixed(4)}
          icon={CheckCircle}
          tone="good"
          note="Passes: forward times backward is exactly one"
        />
        <StatTile
          label="Time reversal, Carli"
          value={reversal.carli.toFixed(4)}
          icon={Prohibit}
          tone="critical"
          note="Fails: always at least one, by the AM-GM inequality"
        />
      </div>

      <Panel
        className="mt-3"
        icon={FunctionIcon}
        title="Three elementary formulas, one set of quotes"
        meta="All three series are compiled from the same cleaned panel over the same 90 days"
        actions={
          <SegmentedControl options={FORMULA_OPTIONS} value={formula} onChange={setFormula} />
        }
        footnote="Carli sits visibly above the other two. That gap is the bias, and it is why the published series uses Jevons."
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Legend items={formulaSeries.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />
          <Toggle checked={showAll} onChange={setShowAll} label="Show all three at once" />
        </div>

        <MultiLine
          data={FORMULA_SERIES as unknown as Array<Record<string, unknown>>}
          series={formulaSeries}
          height={290}
          xFormat={(v) => fmtDay(String(v))}
          yFormat={(n) => n.toFixed(0)}
          valueFormat={fmtIndex}
          tipTitle={fmtDayFull}
        />

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
          {FORMULA_OPTIONS.map((o) => (
            <div key={o.value}>
              <Formula active={o.value === formula} caption={FORMULA_NOTE[o.value]}>
                {FORMULA_TEXT[o.value]}
              </Formula>
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-5"
          icon={ArrowsClockwise}
          title="The time-reversal test"
          meta={`Run on ${SAMPLE_RELATIVES.length} within-cell price relatives from the latest night`}
          footnote="The test suite asserts this: a change that makes Carli pass time reversal would be a bug in the test, not a fix to the formula."
        >
          <p className="mb-3 text-[12px] leading-relaxed text-ink-2">
            Compile the index forward from yesterday to today, then backward from today to
            yesterday. Multiply the two. An unbiased formula returns exactly one.
          </p>

          <ul className="space-y-2">
            {(
              [
                { key: 'jevons', label: 'Jevons', value: reversal.jevons, pass: true },
                { key: 'dutot', label: 'Dutot', value: reversal.dutot, pass: true },
                { key: 'carli', label: 'Carli', value: reversal.carli, pass: false },
              ] as const
            ).map((r) => (
              <li
                key={r.key}
                className="flex items-center justify-between gap-3 rounded-control bg-surface-inset px-3 py-2 ring-1 ring-line"
              >
                <span className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium text-ink">{r.label}</span>
                  {r.key === 'jevons' && (
                    <Badge tone="accent" icon={Sparkle}>
                      published
                    </Badge>
                  )}
                </span>
                <span className="flex items-center gap-2.5">
                  <span className="vm-num text-[13px] font-semibold text-ink">
                    {r.value.toFixed(4)}
                  </span>
                  <Badge tone={r.pass ? 'good' : 'critical'} icon={r.pass ? CheckCircle : Prohibit}>
                    {r.pass ? 'passes' : 'fails'}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3">
            <Formula caption="The price relatives the test ran on. Their spread is what drives Carli's bias: identical relatives would make the gap vanish.">
              {[0, 1, 2].
                map((row) =>
                  SAMPLE_RELATIVES.slice(row * 8, row * 8 + 8)
                    .map((r) => r.toFixed(3))
                    .join('  '),
                )
                .join('\n')}
            </Formula>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-7"
          icon={SlidersHorizontal}
          title="Outlier fence sensitivity"
          meta="Tukey fences applied to log price relatives, with Hidiroglou-Berthelot on skewed cells"
          footnote="Survivors are winsorised at the 1st and 99th percentile rather than deleted, so a genuine surge is dampened instead of disappearing."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <Slider
                label="Tukey fence, k"
                min={1}
                max={5}
                step={0.1}
                value={k}
                onChange={setK}
                readout={`k = ${k.toFixed(1)}`}
                hint="Keep relatives inside Q1 minus k times IQR, up to Q3 plus k times IQR. The default is 3."
              />

              <div className="mt-4">
                <KeyValue
                  dense
                  rows={[
                    { k: 'Quotes edited at this fence', v: fmtInt(fence.edited) },
                    { k: 'Index level at this fence', v: fmtIndex(fence.level) },
                    { k: 'Published level, k = 3', v: fmtIndex(LATEST.total) },
                    {
                      k: 'Effect of moving the fence',
                      v: `${(fence.level - LATEST.total).toFixed(2)} pts`,
                      tone: Math.abs(fence.level - LATEST.total) > 1 ? 'warn' : 'neutral',
                    },
                  ]}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3">
              <div
                className={`rounded-panel p-3.5 ring-1 ${
                  fence.keptSurge
                    ? 'bg-good-soft ring-good/40'
                    : 'bg-critical-soft ring-critical/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  {fence.keptSurge ? (
                    <CheckCircle size={17} weight="duotone" className="text-good" />
                  ) : (
                    <Prohibit size={17} weight="duotone" className="text-critical" />
                  )}
                  <p className="text-[12.5px] font-semibold text-ink">
                    {fence.keptSurge
                      ? 'The Independence Day surge survives this fence'
                      : 'This fence edits the Independence Day surge away'}
                  </p>
                </div>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-2">
                  {fence.keptSurge
                    ? 'A real demand week is a price movement, not an error. The rule is calibrated to keep it.'
                    : 'Below roughly k = 2.2 the filter starts deleting genuine festival-week movement. An index that edits out real inflation is worse than no index.'}
                </p>
              </div>

              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="text-[11.5px] text-ink-2">Share of the panel edited</span>
                  <span className="vm-num text-[12px] font-semibold text-ink">
                    {fmtPct((fence.edited / CLEAN_QUOTES) * 100, 2)}
                  </span>
                </div>
                <Meter
                  value={(fence.edited / CLEAN_QUOTES) * 100}
                  max={10}
                  threshold={2}
                  thresholdLabel="Editing more than 2% of the panel warrants a look at the collector, not the fence"
                  tone={fence.edited / CLEAN_QUOTES > 0.02 ? 'warn' : 'accent'}
                  height={10}
                />
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={Warning}
          title="Sold-out inventory is not missing at random"
          meta="Cell-mean imputation of the price relative, against naive carry-forward"
          footnote="Sold-out correlates with high demand, so dropping those cells biases the index downward exactly when fares are highest."
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <Legend items={impSeries.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />
            <Toggle
              checked={carryForward}
              onChange={setCarryForward}
              label="Overlay naive carry-forward"
              hint="Implemented only as an on-screen contrast, never as a code path"
            />
          </div>

          <MultiLine
            data={IMPUTATION_SERIES as unknown as Array<Record<string, unknown>>}
            series={impSeries}
            height={250}
            xFormat={(v) => fmtDay(String(v))}
            yFormat={(n) => n.toFixed(0)}
            valueFormat={fmtIndex}
            tipTitle={fmtDayFull}
          />

          {carryForward && (
            <div className="mt-3">
              <Callout tone="critical" title={`Carry-forward ends ${drift.toFixed(2)} points below`}>
                Freezing an unobserved cell at last night's price flattens the series and drifts it
                downward. Over 90 days that is a visible gap; over a year it would be a policy error.
              </Callout>
            </div>
          )}

          <div className="mt-3">
            <Formula caption="Cell-mean imputation of the relative. The unobserved item inherits its cell's movement rather than standing still.">
              {`  r̂_i,t  =  exp(  mean over surviving j in cell of  ln( p_j,t / p_j,t-1 )  )`}
            </Formula>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-5"
          icon={Scales}
          title="Weights, and the assumption inside them"
          meta="Sector weights come from passenger traffic. Lead-time shares do not exist publicly, so they are an input, not a constant."
          footnote="Exposing an estimate as an editable control is the honest alternative to burying it. Changing these values changes the published aggregate, which is the point."
        >
          <div className="space-y-3">
            {LEAD_BUCKETS.map((b) => (
              <Slider
                key={b}
                label={`${fmtLead(b)} booking share`}
                min={0}
                max={0.5}
                step={0.01}
                value={shares[b]}
                onChange={(v) => setShares((s) => ({ ...s, [b]: v }))}
                readout={fmtPct((shares[b] / shareTotal) * 100)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-control bg-surface-inset p-3 ring-1 ring-line">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Resulting stratum weight, top three sectors
            </p>
            <KeyValue
              dense
              rows={SECTORS.slice(0, 3).flatMap((s) => {
                const sectorShare = s.paxK / SECTORS.reduce((a, x) => a + x.paxK, 0)
                return [
                  {
                    k: `${s.id} at T+15`,
                    v: fmtPct((sectorShare * (shares[15] / shareTotal)) * 100, 3),
                  },
                ]
              })}
            />
            <p className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-ink-3">
              Sector shares here stand in for the DGCA city-pair traffic extract. Loading the real
              extract replaces the numbers without touching the arithmetic.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-3">
        <Callout tone="accent" title="Aggregation above the elementary level">
          <Formula caption="A Young or modified-Laspeyres form, consistent with the Laspeyres formula retained in the 2024-base CPI. Strata are sector crossed with lead-time band. Chain-linked annually and rebased to 2024 = 100.">
            {`  APIx_t / APIx_0  =  Σ_s  w_s · ( I_s,t / I_s,0 )        with  Σ_s w_s = 1`}
          </Formula>
        </Callout>
      </div>
    </div>
  )
}
