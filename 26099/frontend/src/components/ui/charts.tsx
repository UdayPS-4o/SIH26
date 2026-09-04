/**
 * Themed chart primitives, built on recharts.
 *
 * One place that knows how a chart is coloured, gridded and labelled, so every
 * chart in the application looks like the same system rather than each page
 * styling recharts from scratch. Colours are read from the CSS custom
 * properties in index.css (via useChartColors), so a chart re-themes the
 * instant the light/dark class toggles, with no separate dark variant to
 * maintain.
 *
 * Two kinds of colour are used here:
 *   - semantic tones (accent/primary/attention/negative/positive/info) when a
 *     series has a fixed meaning (e.g. "same" is always positive)
 *   - the chart-1..6 categorical palette when series carry no meaning beyond
 *     "this bar is a different CPSE" (see tokens.ts)
 */

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from 'recharts'
import { CHART_PALETTE } from './tokens'
import type { Tone } from './index'

/* ------------------------------------------------------------------ colour */

interface ChartColors {
  ink: string
  ink2: string
  ink3: string
  rule: string
  surface: string
  accent: string
  primary: string
  attention: string
  negative: string
  positive: string
  info: string
  chart: string[]
}

function readChartColors(): ChartColors {
  const style = getComputedStyle(document.documentElement)
  const v = (name: string) => style.getPropertyValue(name).trim() || '#888888'
  return {
    ink: v('--ink'),
    ink2: v('--ink-2'),
    ink3: v('--ink-3'),
    rule: v('--rule'),
    surface: v('--surface'),
    accent: v('--accent'),
    primary: v('--primary'),
    attention: v('--attention'),
    negative: v('--negative'),
    positive: v('--positive'),
    info: v('--info'),
    chart: CHART_PALETTE.map(token => v(`--${token}`)),
  }
}

/** Keeps a single category tick to one line, since recharts wraps a long tick
 *  label into stacked tspans that collide with the row above and below. */
function truncateLabel(value: string, max = 26): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

/** Re-reads the CSS custom properties whenever <html> gains or loses .dark, so
 *  a chart already on screen re-colours on theme toggle without a remount. */
export function useChartColors(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(() =>
    typeof window === 'undefined'
      ? ({} as ChartColors)
      : readChartColors(),
  )

  useEffect(() => {
    setColors(readChartColors())
    const observer = new MutationObserver(() => setColors(readChartColors()))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  return colors
}

function toneColor(colors: ChartColors, tone: Tone): string {
  return {
    neutral: colors.ink3,
    accent: colors.accent,
    primary: colors.primary,
    attention: colors.attention,
    negative: colors.negative,
    positive: colors.positive,
    info: colors.info,
  }[tone]
}

/* ---------------------------------------------------------------- tooltip */

function ChartTooltip({
  active,
  payload,
  label,
  format,
}: TooltipProps<number, string> & { format?: (value: number) => string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-lg border border-rule bg-surface px-3 py-2 text-[12px] shadow-md">
      {label !== undefined ? (
        <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
          {label}
        </div>
      ) : null}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-ink">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: (entry.color as string) ?? entry.payload?.fill }}
          />
          <span className="text-ink-2">{entry.name}</span>
          <span className="ml-auto font-mono tabular-nums">
            {format ? format(entry.value as number) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

/* --------------------------------------------------------------- bar chart */

export interface CategoryDatum {
  name: string
  value: number
}

/**
 * Horizontal bar chart. One bar per category, sorted by the caller. Colour is
 * either one tone repeated (a single meaningful series) or the categorical
 * palette cycled per bar (series with no inherent meaning).
 */
export function CategoryBarChart({
  data,
  tone,
  format = value => value.toLocaleString('en-IN'),
  height,
  barSize = 16,
}: {
  data: CategoryDatum[]
  /** A fixed tone colours every bar the same. Omit to cycle the chart palette. */
  tone?: Tone
  format?: (value: number) => string
  height?: number
  barSize?: number
}) {
  const colors = useChartColors()
  if (!colors.ink) return null
  const resolvedHeight = height ?? Math.max(120, data.length * (barSize + 18))

  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={128}
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.ink2, fontSize: 12 }}
          // A category name (a full material description) can run to 60+
          // chars; recharts wraps a long tick into multiple tspans that then
          // collide with the next row's label. Truncating keeps every label
          // on one line - the full name is still in the tooltip.
          tickFormatter={value => truncateLabel(value)}
        />
        <Tooltip
          cursor={{ fill: colors.rule, opacity: 0.4 }}
          content={<ChartTooltip format={format} />}
        />
        {/* isAnimationActive is off deliberately: recharts 2.x does not mount a
            shape for animated horizontal (layout="vertical") bars with Cell
            children in this version - the growth tween never paints. */}
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={barSize} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={tone ? toneColor(colors, tone) : colors.chart[index % colors.chart.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------- donut */

/** Small donut for a share-of-total breakdown (e.g. records per CPSE). Always
 *  paired with a legend list outside the chart, since a donut alone cannot
 *  carry the numbers accessibly. */
export function DonutChart({
  data,
  size = 148,
  thickness = 22,
}: {
  data: CategoryDatum[]
  size?: number
  thickness?: number
}) {
  const colors = useChartColors()
  if (!colors.ink) return null
  const radius = size / 2

  return (
    <ResponsiveContainer width={size} height={size}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={radius - thickness}
          outerRadius={radius}
          paddingAngle={data.length > 1 ? 2 : 0}
          stroke={colors.surface}
          strokeWidth={2}
          isAnimationActive
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors.chart[index % colors.chart.length]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Legend rows to pair with DonutChart: colour swatch, name, value, matched by
 *  index against the same data and palette. */
export function ChartLegend({ data }: { data: CategoryDatum[] }) {
  const colors = useChartColors()
  return (
    <ul className="flex flex-col gap-1.5">
      {data.map((entry, index) => (
        <li key={entry.name} className="flex items-center gap-2 text-[12.5px]">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: colors.chart?.[index % (colors.chart?.length || 1)] }}
          />
          <span className="min-w-0 truncate text-ink-2">{entry.name}</span>
          <span className="ml-auto shrink-0 font-mono tabular-nums text-ink">
            {entry.value.toLocaleString('en-IN')}
          </span>
        </li>
      ))}
    </ul>
  )
}

/* --------------------------------------------------------------- histogram */

export interface HistogramBucket {
  /** Left edge of the bucket, used as the x tick. */
  x: number
  count: number
}

export interface HistogramThreshold {
  value: number
  label: string
  /** Colour of the band that starts at this value (i.e. values >= value, up
   *  to the next threshold). Bands below the lowest threshold use belowTone. */
  tone: Tone
}

/**
 * Score-distribution histogram with threshold marker lines. Replaces a
 * hand-built flex/inline-style bar row with a real, axed, tooltipped chart
 * over the same bucket data.
 */
export function ThresholdHistogram({
  buckets,
  thresholds,
  belowTone = 'negative',
  height = 170,
  formatX = value => value.toFixed(2),
}: {
  buckets: HistogramBucket[]
  thresholds: HistogramThreshold[]
  /** Colour for buckets below every threshold (e.g. "different", below the
   *  review line). */
  belowTone?: Tone
  height?: number
  formatX?: (value: number) => string
}) {
  const colors = useChartColors()
  if (!colors.ink) return null

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 4, left: 8 }} barCategoryGap={2}>
        <XAxis
          dataKey="x"
          tickFormatter={formatX}
          axisLine={{ stroke: colors.rule }}
          tickLine={false}
          tick={{ fill: colors.ink3, fontSize: 10.5 }}
          interval={Math.max(0, Math.floor(buckets.length / 8) - 1)}
        />
        <YAxis hide />
        <Tooltip
          cursor={{ fill: colors.rule, opacity: 0.35 }}
          content={<ChartTooltip format={value => `${value} pairs`} />}
        />
        {/* isAnimationActive off: see the note in CategoryBarChart - this
            recharts version does not reliably mount an animated Bar shape. */}
        <Bar dataKey="count" radius={[3, 3, 0, 0]} isAnimationActive={false}>
          {buckets.map(bucket => {
            // The band a bucket falls in is set by the highest threshold it
            // has reached or passed; below every threshold falls back to
            // belowTone (e.g. "different", below the review line).
            const crossed = thresholds
              .filter(t => bucket.x >= t.value)
              .sort((a, b) => b.value - a.value)[0]
            return (
              <Cell
                key={bucket.x}
                fill={toneColor(colors, crossed ? crossed.tone : belowTone)}
              />
            )
          })}
        </Bar>
        {thresholds.map(t => (
          <ReferenceLine
            key={t.label}
            x={t.value}
            stroke={toneColor(colors, t.tone)}
            strokeDasharray="3 3"
            strokeWidth={1.5}
            label={{ value: t.label, position: 'top', fill: toneColor(colors, t.tone), fontSize: 10.5 }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ------------------------------------------------------------------ funnel */

export interface FunnelStep {
  label: string
  /** 0..1, already normalized against this step's own scale by the caller.
   *  Steps that narrow through more than one unit (e.g. an item count, then a
   *  rupee figure derived from it) cannot share one axis, so this component
   *  never computes a running total across steps — each bar's length only
   *  means something relative to its own maximum. */
  fraction: number
  /** Pre-formatted real value (e.g. "5,24,671" or "Rs 67.0 crore"), shown in
   *  place of the raw 0..1 fraction in the tooltip and bar label. */
  display: string
  tone?: Tone
}

function FunnelTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0]?.payload as { name: string; display: string } | undefined
  if (!row) return null
  return (
    <div className="rounded-lg border border-rule bg-surface px-3 py-2 text-[12px] shadow-md">
      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
        {row.name}
      </div>
      <div className="font-mono tabular-nums text-ink">{row.display}</div>
    </div>
  )
}

/**
 * A sequence of steps that narrow toward a final figure, each scaled within
 * its own unit rather than stacked into a shared running total. Use this
 * instead of a literal waterfall whenever the steps are not additive deltas
 * in one consistent unit (e.g. a count of items narrowing down, then
 * converting to a rupee figure).
 */
export function FunnelChart({
  steps,
  height,
  barSize = 22,
}: {
  steps: FunnelStep[]
  height?: number
  barSize?: number
}) {
  const colors = useChartColors()
  if (!colors.ink) return null
  const resolvedHeight = height ?? Math.max(120, steps.length * (barSize + 20))
  const data = steps.map(step => ({
    name: step.label,
    // A floor keeps a genuinely-zero step visible as a sliver rather than
    // invisible, so the bar is still there to read the tooltip/label off.
    value: Math.max(0.02, Math.min(1, step.fraction)),
    display: step.display,
    tone: step.tone ?? 'primary',
  }))

  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 88, bottom: 4, left: 4 }}>
        <XAxis type="number" domain={[0, 1]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={168}
          axisLine={false}
          tickLine={false}
          tick={{ fill: colors.ink2, fontSize: 12 }}
          tickFormatter={value => truncateLabel(value, 34)}
        />
        <Tooltip cursor={{ fill: colors.rule, opacity: 0.35 }} content={<FunnelTooltip />} />
        {/* isAnimationActive off: see the note in CategoryBarChart. */}
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={barSize} isAnimationActive={false}>
          {data.map(row => (
            <Cell key={row.name} fill={toneColor(colors, row.tone)} />
          ))}
          <LabelList
            dataKey="display"
            position="right"
            fill={colors.ink}
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
