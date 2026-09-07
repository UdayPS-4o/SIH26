import { useMemo, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartTokens, type ChartTokens } from './theme'
import { cx } from './primitives'

/* ==========================================================================
   Shared chrome
   ========================================================================== */

const axisFont = { fontFamily: 'var(--vm-font-mono)', fontSize: 10.5 }

function axisProps(t: ChartTokens) {
  return {
    stroke: t.axis,
    tick: { fill: t['ink-3'], ...axisFont },
    tickLine: false,
    axisLine: { stroke: t.axis },
  } as const
}

export function ChartTip({
  title,
  rows,
  note,
}: {
  title: ReactNode
  rows: Array<{ label: string; value: ReactNode; color?: string; dashed?: boolean }>
  note?: ReactNode
}) {
  return (
    <div className="min-w-[168px] rounded-control bg-surface-2 px-3 py-2 shadow-lift ring-1 ring-line-strong">
      <p className="mb-1.5 border-b border-line pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
        {title}
      </p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex items-center gap-1.5 text-ink-2">
              {r.color && (
                <span
                  aria-hidden
                  className="inline-block h-0.5 w-3 rounded-chip"
                  style={
                    r.dashed
                      ? { backgroundImage: `repeating-linear-gradient(90deg, ${r.color} 0 3px, transparent 3px 6px)` }
                      : { background: r.color }
                  }
                />
              )}
              {r.label}
            </span>
            <span className="vm-num font-medium text-ink">{r.value}</span>
          </li>
        ))}
      </ul>
      {note && <p className="mt-1.5 border-t border-line pt-1.5 text-[10.5px] leading-snug text-ink-3">{note}</p>}
    </div>
  )
}

/* ==========================================================================
   Index line with a bootstrap band
   ========================================================================== */

export interface BandDatum {
  date: string
  value: number
  low: number
  high: number
  [k: string]: unknown
}

export function IndexBandChart({
  data,
  height = 260,
  xFormat,
  yLabel,
  markers = [],
  compare,
  compareLabel,
  tipTitle,
  valueFormat,
  showBand = true,
}: {
  data: BandDatum[]
  height?: number
  xFormat: (v: string) => string
  yLabel?: string
  markers?: Array<{ date: string; label: string; tone?: 'demand' | 'cost' | 'capacity' | 'ops' }>
  compare?: { key: string; label: string }
  compareLabel?: string
  tipTitle: (d: string) => string
  valueFormat: (n: number) => string
  showBand?: boolean
}) {
  const t = useChartTokens()
  const rows = useMemo(
    () => data.map((d) => ({ ...d, span: Math.max(0, d.high - d.low) })),
    [data],
  )
  const ax = axisProps(t)

  // The band is drawn as two stacked areas, so Recharts would otherwise fold
  // the band-height series into the axis domain and drag the scale to zero.
  // The domain is therefore computed from the values actually on screen.
  const yDomain = useMemo<[number, number]>(() => {
    const vals: number[] = []
    for (const d of data) {
      vals.push(d.value)
      if (showBand) vals.push(d.low, d.high)
      if (compare) vals.push(Number(d[compare.key]))
    }
    const lo = Math.min(...vals)
    const hi = Math.max(...vals)
    const pad = Math.max(0.8, (hi - lo) * 0.12)
    return [lo - pad, hi + pad]
  }, [data, showBand, compare])

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 14, right: 14, bottom: 4, left: -6 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={xFormat} minTickGap={38} {...ax} />
          <YAxis
            width={46}
            domain={yDomain}
            allowDataOverflow
            tickFormatter={(v: number) => v.toFixed(0)}
            label={
              yLabel
                ? { value: yLabel, angle: -90, position: 'insideLeft', offset: 14, style: { fill: t['ink-3'], ...axisFont } }
                : undefined
            }
            {...ax}
          />

          {showBand && (
            <>
              <Area dataKey="low" stackId="band" stroke="none" fill="none" isAnimationActive={false} />
              <Area
                dataKey="span"
                stackId="band"
                stroke="none"
                fill={t.band}
                isAnimationActive={false}
                name="95% band"
              />
            </>
          )}

          {markers.map((m, i) => (
            <ReferenceLine
              key={m.date + m.label}
              x={m.date}
              stroke={m.tone === 'cost' ? t.gate : t['ink-3']}
              strokeDasharray="3 3"
              strokeOpacity={0.75}
              label={{
                value: m.label,
                // Labels alternate between the top and the bottom of the plot so
                // two nearby events do not print over each other.
                position: i % 2 === 0 ? 'insideTopLeft' : 'insideBottomLeft',
                fill: m.tone === 'cost' ? t.gate : t['ink-3'],
                fontSize: 10,
                fontFamily: 'var(--vm-font-mono)',
                offset: 8,
              }}
            />
          ))}

          {compare && (
            <Line
              type="monotone"
              dataKey={compare.key}
              stroke={t.reference}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              name={compare.label}
              isAnimationActive={false}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={t['line-index']}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: t['mark-ring'] }}
            isAnimationActive={false}
            name="APIx"
          />

          <Tooltip
            cursor={{ stroke: t.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload as BandDatum & { span: number }
              const rowsOut = [
                { label: 'APIx', value: valueFormat(d.value), color: t['line-index'] },
                { label: '95% band', value: `${valueFormat(d.low)} to ${valueFormat(d.high)}` },
              ]
              if (compare) {
                rowsOut.push({
                  label: compareLabel ?? compare.label,
                  value: valueFormat(Number(d[compare.key])),
                  color: t.reference,
                  dashed: true,
                } as never)
              }
              return <ChartTip title={tipTitle(String(label))} rows={rowsOut} />
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Multi-series line
   ========================================================================== */

export interface SeriesSpec {
  key: string
  label: string
  color: string
  dashed?: boolean
  width?: number
}

export function MultiLine({
  data,
  series,
  xKey = 'date',
  xFormat,
  height = 240,
  logY = false,
  yFormat,
  valueFormat,
  tipTitle,
  yDomain,
  bands = [],
  dots = [],
  hLines = [],
}: {
  data: Array<Record<string, unknown>>
  series: SeriesSpec[]
  xKey?: string
  xFormat: (v: string | number) => string
  height?: number
  logY?: boolean
  yFormat: (n: number) => string
  valueFormat: (n: number) => string
  tipTitle: (v: string) => string
  yDomain?: [number | string, number | string]
  bands?: Array<{ from: string | number; to: string | number; label?: string }>
  dots?: Array<{ x: string | number; y: number; label: string; color?: string }>
  hLines?: Array<{ y: number; label: string; color?: string }>
}) {
  const t = useChartTokens()
  const ax = axisProps(t)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 18, bottom: 4, left: -4 }}>
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={xFormat} minTickGap={30} {...ax} />
          <YAxis
            width={52}
            scale={logY ? 'log' : 'auto'}
            domain={yDomain ?? (logY ? ['auto', 'auto'] : ['auto', 'auto'])}
            tickFormatter={yFormat}
            allowDataOverflow={false}
            {...ax}
          />
          {bands.map((b, i) => (
            <ReferenceArea
              key={i}
              x1={b.from}
              x2={b.to}
              fill={t.accent}
              fillOpacity={0.07}
              label={
                b.label
                  ? { value: b.label, position: 'insideTop', fill: t['ink-3'], fontSize: 10, fontFamily: 'var(--vm-font-mono)' }
                  : undefined
              }
            />
          ))}
          {hLines.map((h, i) => (
            <ReferenceLine
              key={`h${i}`}
              y={h.y}
              stroke={h.color ?? t.gate}
              strokeDasharray="4 3"
              label={{
                value: h.label,
                position: 'insideTopRight',
                fill: h.color ?? t.gate,
                fontSize: 10,
                fontFamily: 'var(--vm-font-mono)',
              }}
            />
          ))}
          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? '5 4' : undefined}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: t['mark-ring'] }}
              isAnimationActive={false}
            />
          ))}
          {dots.map((d, i) => (
            <ReferenceDot
              key={i}
              x={d.x}
              y={d.y}
              r={4.5}
              fill={d.color ?? t.accent}
              stroke={t['mark-ring']}
              strokeWidth={2}
              label={{
                value: d.label,
                position: 'top',
                fill: t['ink-2'],
                fontSize: 10.5,
                fontFamily: 'var(--vm-font-mono)',
              }}
            />
          ))}
          <Tooltip
            cursor={{ stroke: t.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <ChartTip
                  title={tipTitle(String(label))}
                  rows={payload.map((p) => {
                    const spec = series.find((s) => s.key === p.dataKey)
                    return {
                      label: spec?.label ?? String(p.name),
                      value: valueFormat(Number(p.value)),
                      color: spec?.color,
                      dashed: spec?.dashed,
                    }
                  })}
                />
              )
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Stacked area
   ========================================================================== */

export function StackedArea({
  data,
  series,
  xFormat,
  height = 260,
  yFormat,
  valueFormat,
  tipTitle,
  percent = false,
}: {
  data: Array<Record<string, unknown>>
  series: SeriesSpec[]
  xFormat: (v: string | number) => string
  height?: number
  yFormat: (n: number) => string
  valueFormat: (n: number) => string
  tipTitle: (v: string) => string
  percent?: boolean
}) {
  const t = useChartTokens()
  const ax = axisProps(t)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 14, bottom: 4, left: -4 }}
          stackOffset={percent ? 'expand' : undefined}
        >
          <CartesianGrid stroke={t.grid} vertical={false} />
          <XAxis dataKey="date" tickFormatter={xFormat} minTickGap={34} {...ax} />
          {/* Anchored at zero, because a stacked composition read against a
              floating baseline is a misread waiting to happen. */}
          <YAxis
            width={54}
            domain={percent ? [0, 1] : [0, 'dataMax']}
            tickFormatter={yFormat}
            {...ax}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stackId="fare"
              stroke={t['mark-ring']}
              strokeWidth={2}
              fill={s.color}
              fillOpacity={0.92}
              isAnimationActive={false}
            />
          ))}
          <Tooltip
            cursor={{ stroke: t.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const total = payload.reduce((a, p) => a + Number(p.value), 0)
              return (
                <ChartTip
                  title={tipTitle(String(label))}
                  rows={[...payload]
                    .reverse()
                    .map((p) => {
                      const spec = series.find((s) => s.key === p.dataKey)
                      return {
                        label: spec?.label ?? String(p.name),
                        value: `${valueFormat(Number(p.value))} · ${((Number(p.value) / total) * 100).toFixed(1)}%`,
                        color: spec?.color,
                      }
                    })}
                  note={`Total ${valueFormat(total)}`}
                />
              )
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Scatter with a fitted line
   ========================================================================== */

export function ScatterFit({
  points,
  height = 260,
  xLabel,
  yLabel,
  format,
}: {
  points: Array<{ x: number; y: number; label: string }>
  height?: number
  xLabel: string
  yLabel: string
  format: (n: number) => string
}) {
  const t = useChartTokens()
  const ax = axisProps(t)
  const fit = useMemo(() => {
    const n = points.length
    const mx = points.reduce((a, p) => a + p.x, 0) / n
    const my = points.reduce((a, p) => a + p.y, 0) / n
    let num = 0
    let den = 0
    for (const p of points) {
      num += (p.x - mx) * (p.y - my)
      den += (p.x - mx) ** 2
    }
    const slope = num / den
    const intercept = my - slope * mx
    const xs = points.map((p) => p.x)
    const lo = Math.min(...xs)
    const hi = Math.max(...xs)
    return [
      { x: lo, y: slope * lo + intercept },
      { x: hi, y: slope * hi + intercept },
    ]
  }, [points])

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 16, bottom: 18, left: -2 }}>
          <CartesianGrid stroke={t.grid} />
          <XAxis
            type="number"
            dataKey="x"
            domain={['dataMin - 1', 'dataMax + 1']}
            tickFormatter={(v: number) => v.toFixed(0)}
            label={{ value: xLabel, position: 'insideBottom', offset: -10, fill: t['ink-3'], ...axisFont }}
            {...ax}
          />
          <YAxis
            type="number"
            dataKey="y"
            width={48}
            domain={['dataMin - 1', 'dataMax + 1']}
            tickFormatter={(v: number) => v.toFixed(0)}
            label={{ value: yLabel, angle: -90, position: 'insideLeft', offset: 12, fill: t['ink-3'], ...axisFont }}
            {...ax}
          />
          <Scatter
            data={fit}
            line={{ stroke: t.reference, strokeWidth: 2, strokeDasharray: '5 4' }}
            shape={() => <g />}
            isAnimationActive={false}
          />
          <Scatter data={points} isAnimationActive={false}>
            {points.map((_, i) => (
              <Cell key={i} fill={t.s1} stroke={t['mark-ring']} strokeWidth={2} />
            ))}
          </Scatter>
          <Tooltip
            cursor={{ stroke: t.axis, strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as { x: number; y: number; label?: string }
              if (p.label == null) return null
              return (
                <ChartTip
                  title={p.label}
                  rows={[
                    { label: xLabel, value: format(p.x), color: t.s1 },
                    { label: yLabel, value: format(p.y), color: t['line-index'] },
                  ]}
                />
              )
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Diverging horizontal bars
   ========================================================================== */

export function DivergingBars({
  rows,
  height = 300,
  valueFormat,
  labelFormat,
}: {
  rows: Array<{ label: string; value: number; note?: string }>
  height?: number
  valueFormat: (n: number) => string
  labelFormat?: (s: string) => string
}) {
  const t = useChartTokens()
  const ax = axisProps(t)
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" tickFormatter={valueFormat} {...ax} />
          <YAxis
            type="category"
            dataKey="label"
            width={78}
            tickFormatter={labelFormat}
            {...ax}
            tick={{ fill: t['ink-2'], ...axisFont }}
          />
          <ReferenceLine x={0} stroke={t.axis} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} barSize={11}>
            {rows.map((r, i) => (
              <Cell key={i} fill={r.value >= 0 ? t['div-p3'] : t['div-n3']} />
            ))}
          </Bar>
          <Tooltip
            cursor={{ fill: t['surface-2'], fillOpacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const r = payload[0].payload as { label: string; value: number; note?: string }
              return (
                <ChartTip
                  title={r.label}
                  rows={[
                    {
                      label: 'Contribution',
                      value: valueFormat(r.value),
                      color: r.value >= 0 ? t['div-p3'] : t['div-n3'],
                    },
                  ]}
                  note={r.note}
                />
              )
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Ranked bars (single hue, magnitude)
   ========================================================================== */

export function RankedBars({
  rows,
  height = 280,
  valueFormat,
  color,
  threshold,
}: {
  rows: Array<{ label: string; value: number; note?: string }>
  height?: number
  valueFormat: (n: number) => string
  color?: string
  threshold?: { value: number; label: string }
}) {
  const t = useChartTokens()
  const ax = axisProps(t)
  const fill = color ?? t.s1
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={t.grid} horizontal={false} />
          <XAxis type="number" tickFormatter={valueFormat} {...ax} />
          <YAxis type="category" dataKey="label" width={118} {...ax} tick={{ fill: t['ink-2'], ...axisFont }} />
          {threshold && (
            <ReferenceLine
              x={threshold.value}
              stroke={t.gate}
              strokeDasharray="4 3"
              label={{ value: threshold.label, fill: t.gate, fontSize: 10, fontFamily: 'var(--vm-font-mono)', position: 'top' }}
            />
          )}
          <Bar dataKey="value" fill={fill} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} />
          <Tooltip
            cursor={{ fill: t['surface-2'], fillOpacity: 0.6 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const r = payload[0].payload as { label: string; value: number; note?: string }
              return <ChartTip title={r.label} rows={[{ label: 'Value', value: valueFormat(r.value), color: fill }]} note={r.note} />
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ==========================================================================
   Donut
   ========================================================================== */

export function Donut({
  rows,
  size = 168,
  valueFormat,
  centreLabel,
  centreValue,
}: {
  rows: Array<{ label: string; value: number; color: string }>
  size?: number
  valueFormat: (n: number) => string
  centreLabel?: string
  centreValue?: string
}) {
  const t = useChartTokens()
  return (
    <div className="relative" style={{ height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="label"
            innerRadius="62%"
            outerRadius="94%"
            paddingAngle={2}
            stroke={t['mark-ring']}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {rows.map((r, i) => (
              <Cell key={i} fill={r.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const r = payload[0].payload as { label: string; value: number; color: string }
              return <ChartTip title={r.label} rows={[{ label: 'Quotes', value: valueFormat(r.value), color: r.color }]} />
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {centreValue && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="vm-num text-xl font-semibold leading-none text-ink">{centreValue}</p>
            {centreLabel && <p className="mt-1 text-[10.5px] text-ink-3">{centreLabel}</p>}
          </div>
        </div>
      )}
    </div>
  )
}

/* ==========================================================================
   Sparkline
   ========================================================================== */

export function Sparkline({
  values,
  color,
  height = 34,
  className,
}: {
  values: number[]
  color?: string
  height?: number
  className?: string
}) {
  const t = useChartTokens()
  const stroke = color ?? t.accent
  const { d, w, h } = useMemo(() => {
    const w = 100
    const h = 30
    const min = Math.min(...values)
    const max = Math.max(...values)
    const span = max - min || 1
    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * w
      const y = h - ((v - min) / span) * h
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    return { d: `M ${pts.join(' L ')}`, w, h }
  }, [values])

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      height={height}
      className={cx('w-full', className)}
      aria-hidden
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  )
}
