import { useMemo, useState } from 'react'
import { divergingScale, useChartTokens } from './theme'
import { cx } from './primitives'

export interface HeatDatum {
  row: string
  col: string
  value: number
  meta?: string
}

/** Nine-step diverging scale, symmetric around zero, with a neutral midpoint.
 *  The break points are exposed so the legend and the cells cannot drift apart. */
export function heatBreaks(maxAbs: number): number[] {
  const m = Math.max(1, maxAbs)
  // The innermost pair is the "no material change" band. It is deliberately
  // wide enough that ordinary week-to-week noise reads as neutral, so the
  // colour on the grid means something moved rather than something existed.
  return [-m * 0.7, -m * 0.42, -m * 0.2, -m * 0.08, m * 0.08, m * 0.2, m * 0.42, m * 0.7]
}

function stepFor(value: number, breaks: number[]): number {
  let i = 0
  while (i < breaks.length && value > breaks[i]) i++
  return i
}

/**
 * A DOM grid rather than an SVG heatmap: every cell is a real button, so it is
 * keyboard reachable, screen-reader readable, and carries its own number.
 * Colour is a second channel here, not the only one.
 */
export function Heatmap({
  data,
  rows,
  cols,
  rowLabel,
  colLabel,
  valueFormat,
  onSelect,
  selected,
  showValues = true,
}: {
  data: HeatDatum[]
  rows: string[]
  cols: string[]
  rowLabel?: (r: string) => string
  colLabel?: (c: string) => string
  valueFormat: (n: number) => string
  onSelect?: (d: HeatDatum) => void
  selected?: { row: string; col: string } | null
  showValues?: boolean
}) {
  const t = useChartTokens()
  const scale = divergingScale(t)
  const [hover, setHover] = useState<HeatDatum | null>(null)

  const { lookup, breaks } = useMemo(() => {
    const lookup = new Map(data.map((d) => [`${d.row}|${d.col}`, d]))
    const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)))
    return { lookup, breaks: heatBreaks(maxAbs) }
  }, [data])

  return (
    <div className="min-w-0">
      <div
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: `minmax(84px, 108px) repeat(${cols.length}, minmax(56px, 1fr))` }}
      >
        <div />
        {cols.map((c) => (
          <div
            key={c}
            className="pb-1 text-center font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3"
          >
            {colLabel ? colLabel(c) : c}
          </div>
        ))}

        {rows.map((r) => (
          <div key={r} className="contents">
            <div className="flex items-center pr-2 font-mono text-[11px] text-ink-2">
              {rowLabel ? rowLabel(r) : r}
            </div>
            {cols.map((c) => {
              const d = lookup.get(`${r}|${c}`)
              if (!d) return <div key={c} className="rounded-[6px] bg-surface-inset" />
              const step = stepFor(d.value, breaks)
              const isExtreme = step <= 1 || step >= 7
              const isActive = selected?.row === r && selected?.col === c
              return (
                <button
                  key={c}
                  onClick={() => onSelect?.(d)}
                  onMouseEnter={() => setHover(d)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(d)}
                  onBlur={() => setHover(null)}
                  title={`${r} at ${c}: ${valueFormat(d.value)}`}
                  className={cx(
                    'relative grid h-9 place-items-center rounded-[6px] transition-transform duration-[var(--vm-dur-fast)] ease-vm',
                    'hover:z-10 hover:scale-[1.06]',
                    isActive && 'ring-2 ring-[var(--vm-ink)] ring-offset-1 ring-offset-[var(--vm-surface)]',
                  )}
                  style={{ background: scale[step] }}
                >
                  {showValues && (
                    <span
                      className="vm-num text-[10.5px] font-semibold"
                      style={{ color: isExtreme ? t['div-ink-strong'] : t['div-ink-quiet'] }}
                    >
                      {valueFormat(d.value)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Cheaper</span>
          <div className="flex overflow-hidden rounded-chip">
            {scale.map((c, i) => (
              <span key={i} className="h-2.5 w-5" style={{ background: c }} />
            ))}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Dearer</span>
        </div>
        <p className="text-[11px] text-ink-3">
          {hover ? (
            <span className="text-ink-2">
              <span className="vm-num font-medium text-ink">{hover.row}</span> at{' '}
              <span className="vm-num font-medium text-ink">{hover.col}</span>:{' '}
              <span className="vm-num font-medium text-ink">{valueFormat(hover.value)}</span>
              {hover.meta ? ` · ${hover.meta}` : ''}
            </span>
          ) : (
            'Hover a cell for detail, click to drill into the elementary aggregate'
          )}
        </p>
      </div>
    </div>
  )
}
