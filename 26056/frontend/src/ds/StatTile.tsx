import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { ArrowDownRight, ArrowRight, ArrowUpRight } from '@phosphor-icons/react'
import { cx, type Tone } from './primitives'
import { Sparkline } from './charts'

/** Counts a number up on mount. Motion here communicates "this value was just
 *  computed", which is the one thing a stat tile has to say. It collapses to
 *  the final value instantly under a reduced-motion request. */
export function useCountUp(target: number, duration = 700): number {
  const [value, setValue] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? target
      : 0,
  )
  const frame = useRef(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target)
      return
    }
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration])

  return value
}

const TONE_ICON_BOX: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-ink-2 ring-line',
  accent: 'bg-accent-soft text-accent ring-accent-line',
  good: 'bg-good-soft text-good ring-good/40',
  warn: 'bg-warn-soft text-warn ring-warn/40',
  serious: 'bg-serious-soft text-serious ring-serious/40',
  critical: 'bg-critical-soft text-critical ring-critical/40',
  gate: 'bg-gate-soft text-gate ring-gate-line',
}

export interface StatTileProps {
  label: string
  value: ReactNode
  unit?: string
  icon?: Icon
  tone?: Tone
  /** Signed change. Direction is carried by an arrow glyph as well as colour. */
  delta?: { value: string; direction: 'up' | 'down' | 'flat'; good?: boolean }
  note?: ReactNode
  spark?: number[]
  sparkColor?: string
  className?: string
}

export function StatTile({
  label,
  value,
  unit,
  icon: IconCmp,
  tone = 'neutral',
  delta,
  note,
  spark,
  sparkColor,
  className,
}: StatTileProps) {
  const deltaTone =
    delta == null
      ? 'text-ink-3'
      : delta.direction === 'flat'
        ? 'text-ink-3'
        : delta.good === false
          ? 'text-critical'
          : delta.good === true
            ? 'text-good'
            : 'text-ink-2'

  const DeltaIcon =
    delta?.direction === 'up' ? ArrowUpRight : delta?.direction === 'down' ? ArrowDownRight : ArrowRight

  return (
    <div
      className={cx(
        'group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-panel bg-surface p-3.5 shadow-panel ring-1 ring-line',
        'transition-transform duration-[var(--vm-dur)] ease-vm hover:-translate-y-0.5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11.5px] font-medium leading-tight text-ink-3">{label}</p>
        {IconCmp && (
          <span className={cx('grid h-7 w-7 shrink-0 place-items-center rounded-control ring-1', TONE_ICON_BOX[tone])}>
            <IconCmp size={15} weight="duotone" />
          </span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="vm-num text-[26px] font-semibold leading-none tracking-tight text-ink">
          {value}
        </span>
        {unit && <span className="text-[12px] font-medium text-ink-3">{unit}</span>}
      </div>

      {(delta || note) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta && (
            <span className={cx('inline-flex items-center gap-0.5 text-[11.5px] font-medium', deltaTone)}>
              <DeltaIcon size={12} weight="bold" />
              <span className="vm-num">{delta.value}</span>
            </span>
          )}
          {note && <span className="text-[11px] leading-snug text-ink-3">{note}</span>}
        </div>
      )}

      {spark && spark.length > 1 && (
        <div className="mt-2.5 -mx-1 opacity-80">
          <Sparkline values={spark} color={sparkColor} height={28} />
        </div>
      )}
    </div>
  )
}
