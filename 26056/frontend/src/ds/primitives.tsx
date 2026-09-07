import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import {
  CheckCircle,
  Info,
  Prohibit,
  Warning,
  WarningOctagon,
} from '@phosphor-icons/react'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

/* ==========================================================================
   Tone
   Every coloured surface in the product comes from this map, so a status
   colour can never drift into being decoration.
   ========================================================================== */

export type Tone = 'neutral' | 'accent' | 'good' | 'warn' | 'serious' | 'critical' | 'gate'

const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-ink-2',
  accent: 'text-accent',
  good: 'text-good',
  warn: 'text-warn',
  serious: 'text-serious',
  critical: 'text-critical',
  gate: 'text-gate',
}

const TONE_SOFT: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-ink-2 ring-line',
  accent: 'bg-accent-soft text-accent ring-accent-line',
  good: 'bg-good-soft text-good ring-good/40',
  warn: 'bg-warn-soft text-warn ring-warn/40',
  serious: 'bg-serious-soft text-serious ring-serious/40',
  critical: 'bg-critical-soft text-critical ring-critical/40',
  gate: 'bg-gate-soft text-gate ring-gate-line',
}

/** Status never travels on colour alone: each tone ships a paired glyph. */
export const TONE_ICON: Record<Tone, Icon> = {
  neutral: Info,
  accent: Info,
  good: CheckCircle,
  warn: Warning,
  serious: WarningOctagon,
  critical: Prohibit,
  gate: Warning,
}

/* ==========================================================================
   Panel
   ========================================================================== */

interface PanelProps {
  title?: ReactNode
  meta?: ReactNode
  icon?: Icon
  tone?: Tone
  actions?: ReactNode
  footnote?: ReactNode
  bleed?: boolean
  className?: string
  bodyClassName?: string
  children: ReactNode
}

export function Panel({
  title,
  meta,
  icon: IconCmp,
  tone = 'neutral',
  actions,
  footnote,
  bleed = false,
  className,
  bodyClassName,
  children,
}: PanelProps) {
  return (
    <section
      className={cx(
        'relative flex min-w-0 flex-col rounded-panel bg-surface shadow-panel ring-1 ring-line',
        tone === 'gate' && 'ring-gate-line',
        tone === 'accent' && 'ring-accent-line',
        className,
      )}
    >
      {(title || actions) && (
        <header className="flex items-start gap-3 border-b border-line px-4 py-3">
          {IconCmp && (
            <span
              className={cx(
                'mt-px grid h-7 w-7 shrink-0 place-items-center rounded-control ring-1',
                TONE_SOFT[tone],
              )}
            >
              <IconCmp size={16} weight="duotone" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && (
              <h2 className="truncate font-display text-[15px] font-semibold text-ink">{title}</h2>
            )}
            {meta && <p className="mt-0.5 text-xs leading-snug text-ink-3">{meta}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx('min-w-0 flex-1', bleed ? '' : 'p-4', bodyClassName)}>{children}</div>
      {footnote && (
        <footer className="border-t border-line px-4 py-2 text-[11px] leading-snug text-ink-3">
          {footnote}
        </footer>
      )}
    </section>
  )
}

/* ==========================================================================
   Page header
   ========================================================================== */

export function PageHeader({
  kicker,
  title,
  lede,
  actions,
}: {
  kicker?: string
  title: string
  lede?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {kicker && (
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            {kicker}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold leading-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        {lede && <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{lede}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ==========================================================================
   Badge and status chip
   ========================================================================== */

export function Badge({
  tone = 'neutral',
  icon: IconCmp,
  children,
  className,
}: {
  tone?: Tone
  icon?: Icon
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-chip px-2 py-0.5 text-[11px] font-medium ring-1',
        TONE_SOFT[tone],
        className,
      )}
    >
      {IconCmp && <IconCmp size={12} weight="bold" />}
      {children}
    </span>
  )
}

export type PublicationStatus = 'PROVISIONAL' | 'REVISED' | 'FROZEN' | 'SUPPRESSED'

const STATUS_TONE: Record<PublicationStatus, Tone> = {
  PROVISIONAL: 'accent',
  REVISED: 'good',
  FROZEN: 'neutral',
  SUPPRESSED: 'critical',
}

export function StatusChip({ status }: { status: PublicationStatus }) {
  const tone = STATUS_TONE[status]
  return (
    <Badge tone={tone} icon={TONE_ICON[tone]}>
      {status}
    </Badge>
  )
}

/* ==========================================================================
   Button
   ========================================================================== */

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  // accent-ink is authored per mode against the filled accent, so the label
  // always clears WCAG AA on the button it sits on.
  primary: 'bg-accent text-accent-ink hover:bg-accent-hover ring-0',
  secondary: 'bg-surface-2 text-ink ring-1 ring-line hover:bg-surface-3',
  ghost: 'bg-transparent text-ink-2 ring-1 ring-transparent hover:bg-surface-2 hover:text-ink',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  icon?: Icon
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', icon: IconCmp, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-control font-medium',
        'transition-[background-color,color,transform] duration-[var(--vm-dur-fast)] ease-vm',
        'active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'h-8 px-3 text-[12.5px]' : 'h-9 px-4 text-[13px]',
        BUTTON_VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {IconCmp && <IconCmp size={15} weight="bold" />}
      {children}
    </button>
  )
})

/* ==========================================================================
   Segmented control
   ========================================================================== */

export interface SegmentOption<T extends string> {
  value: T
  label: string
  icon?: Icon
  hint?: string
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (v: T) => void
  label?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
      )}
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex items-center gap-0.5 rounded-control bg-surface-inset p-0.5 ring-1 ring-line"
      >
        {options.map((opt) => {
          const active = opt.value === value
          return (
            <button
              key={opt.value}
              role="tab"
              aria-selected={active}
              title={opt.hint}
              onClick={() => onChange(opt.value)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-[7px] font-medium transition-colors duration-[var(--vm-dur-fast)]',
                size === 'sm' ? 'h-7 px-2.5 text-[12px]' : 'h-8 px-3 text-[13px]',
                active
                  ? 'bg-accent text-accent-ink'
                  : 'text-ink-3 hover:bg-surface-2 hover:text-ink',
              )}
            >
              {opt.icon && <opt.icon size={14} weight={active ? 'fill' : 'regular'} />}
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ==========================================================================
   Select
   Label sits above the control, never inside it as a placeholder.
   ========================================================================== */

export function Select<T extends string>({
  value,
  onChange,
  options,
  label,
  swatch,
  className,
}: {
  value: T
  onChange: (v: T) => void
  options: Array<{ value: T; label: string }>
  label?: string
  swatch?: string
  className?: string
}) {
  return (
    <label className={cx('block min-w-0', className)}>
      {label && (
        <span className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {swatch && (
            <span aria-hidden className="h-0.5 w-3 rounded-chip" style={{ background: swatch }} />
          )}
          {label}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-8 w-full cursor-pointer rounded-control bg-surface-2 px-2 text-[12.5px] text-ink
                   ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/* ==========================================================================
   Toggle
   ========================================================================== */

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 select-none">
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cx(
          'mt-0.5 h-[18px] w-8 shrink-0 rounded-chip p-0.5 ring-1 transition-colors duration-[var(--vm-dur-fast)]',
          checked ? 'bg-accent ring-accent' : 'bg-surface-3 ring-line',
        )}
      >
        <span
          className={cx(
            'block h-[14px] w-[14px] rounded-chip bg-surface transition-transform duration-[var(--vm-dur-fast)] ease-vm',
            checked ? 'translate-x-[14px]' : 'translate-x-0',
          )}
        />
      </button>
      <span className="min-w-0">
        <span className="block text-[12.5px] font-medium leading-tight text-ink">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] leading-snug text-ink-3">{hint}</span>}
      </span>
    </label>
  )
}

/* ==========================================================================
   Slider
   ========================================================================== */

export function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  readout,
  hint,
}: {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  label: string
  readout: string
  hint?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[12.5px] font-medium text-ink" htmlFor={`sl-${label}`}>
          {label}
        </label>
        <span className="vm-num text-[12.5px] font-semibold text-accent">{readout}</span>
      </div>
      <input
        id={`sl-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-chip outline-none
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-chip
                   [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:ring-2
                   [&::-webkit-slider-thumb]:ring-[var(--vm-surface)]
                   [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5
                   [&::-moz-range-thumb]:rounded-chip [&::-moz-range-thumb]:border-0
                   [&::-moz-range-thumb]:bg-accent"
        style={{
          background: `linear-gradient(to right, var(--vm-accent) ${pct}%, var(--vm-surface-3) ${pct}%)`,
        }}
      />
      {hint && <p className="mt-1.5 text-[11px] leading-snug text-ink-3">{hint}</p>}
    </div>
  )
}

/* ==========================================================================
   Meter
   A magnitude bar with an optional threshold marker. Used for coverage
   against the 70% publication gate and for per-source nightly caps.
   ========================================================================== */

export function Meter({
  value,
  max = 100,
  threshold,
  tone = 'accent',
  height = 8,
  thresholdLabel,
}: {
  value: number
  max?: number
  threshold?: number
  tone?: Tone
  height?: number
  thresholdLabel?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const tPct = threshold != null ? Math.max(0, Math.min(100, (threshold / max) * 100)) : null
  const fill: Record<Tone, string> = {
    neutral: 'bg-ink-3',
    accent: 'bg-accent',
    good: 'bg-good',
    warn: 'bg-warn',
    serious: 'bg-serious',
    critical: 'bg-critical',
    gate: 'bg-gate',
  }
  return (
    <div className="relative w-full overflow-hidden rounded-chip bg-surface-inset" style={{ height }}>
      <div
        className={cx('h-full rounded-chip transition-[width] duration-[var(--vm-dur-slow)] ease-vm', fill[tone])}
        style={{ width: `${pct}%` }}
      />
      {tPct != null && (
        <span
          title={thresholdLabel}
          className="absolute top-0 h-full w-0.5 bg-[var(--vm-ink)] opacity-70"
          style={{ left: `${tPct}%` }}
        />
      )}
    </div>
  )
}

/* ==========================================================================
   Callout
   ========================================================================== */

export function Callout({
  tone = 'accent',
  title,
  icon,
  children,
}: {
  tone?: Tone
  title?: string
  icon?: Icon
  children: ReactNode
}) {
  const IconCmp = icon ?? TONE_ICON[tone]
  return (
    <div className={cx('flex gap-3 rounded-panel p-3 ring-1', TONE_SOFT[tone])}>
      <IconCmp size={17} weight="duotone" className="mt-px shrink-0" />
      <div className="min-w-0">
        {title && <p className="text-[12.5px] font-semibold leading-tight">{title}</p>}
        <div className={cx('text-[12px] leading-relaxed text-ink-2', title && 'mt-1')}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ==========================================================================
   Formula
   ========================================================================== */

export function Formula({
  children,
  caption,
  active,
}: {
  children: ReactNode
  caption?: ReactNode
  active?: boolean
}) {
  return (
    <figure
      className={cx(
        'rounded-control bg-surface-inset px-3.5 py-3 ring-1 transition-colors duration-[var(--vm-dur)]',
        active ? 'ring-accent-line' : 'ring-line',
      )}
    >
      <pre className="vm-num overflow-x-auto whitespace-pre text-[12.5px] leading-relaxed text-ink">
        {children}
      </pre>
      {caption && (
        <figcaption className="mt-2 border-t border-line pt-2 text-[11px] leading-snug text-ink-3">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/* ==========================================================================
   Key/value list
   ========================================================================== */

export function KeyValue({
  rows,
  dense = false,
}: {
  rows: Array<{ k: ReactNode; v: ReactNode; tone?: Tone }>
  dense?: boolean
}) {
  return (
    <dl className="divide-y divide-line">
      {rows.map((r, i) => (
        <div
          key={i}
          className={cx(
            'flex items-baseline justify-between gap-4',
            dense ? 'py-1.5' : 'py-2.5',
          )}
        >
          <dt className="text-[12px] text-ink-3">{r.k}</dt>
          <dd
            className={cx(
              'vm-num text-right text-[12.5px] font-medium',
              r.tone ? TONE_TEXT[r.tone] : 'text-ink',
            )}
          >
            {r.v}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/* ==========================================================================
   Legend
   Present whenever two or more series share a plot, so identity is never
   carried by colour alone.
   ========================================================================== */

export interface LegendItem {
  label: string
  color: string
  dashed?: boolean
  value?: string
}

export function Legend({
  items,
  onToggle,
  hidden,
}: {
  items: LegendItem[]
  onToggle?: (label: string) => void
  hidden?: Set<string>
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => {
        const off = hidden?.has(it.label)
        const Row = onToggle ? 'button' : 'span'
        return (
          <li key={it.label}>
            <Row
              {...(onToggle ? { onClick: () => onToggle(it.label), type: 'button' as const } : {})}
              className={cx(
                'flex items-center gap-1.5 text-[11.5px] leading-none',
                onToggle && 'cursor-pointer hover:text-ink',
                off ? 'text-ink-3 line-through opacity-60' : 'text-ink-2',
              )}
            >
              <span
                aria-hidden
                className="inline-block h-0.5 w-3.5 rounded-chip"
                style={
                  it.dashed
                    ? {
                        backgroundImage: `repeating-linear-gradient(90deg, ${it.color} 0 4px, transparent 4px 7px)`,
                      }
                    : { background: it.color }
                }
              />
              {it.label}
              {it.value && <span className="vm-num text-ink-3">{it.value}</span>}
            </Row>
          </li>
        )
      })}
    </ul>
  )
}

/* ==========================================================================
   Data table
   ========================================================================== */

export interface Column<R> {
  key: string
  header: ReactNode
  align?: 'left' | 'right'
  width?: string
  cell: (row: R) => ReactNode
}

export function DataTable<R>({
  columns,
  rows,
  rowKey,
  onRowClick,
  activeKey,
  maxHeight,
  empty,
}: {
  columns: Column<R>[]
  rows: R[]
  rowKey: (r: R) => string
  onRowClick?: (r: R) => void
  activeKey?: string
  maxHeight?: number
  empty?: ReactNode
}) {
  if (rows.length === 0) {
    return <EmptyState title="Nothing matches these filters" hint={empty} />
  }
  return (
    <div className="overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="sticky top-0 z-10 bg-surface-2">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cx(
                  'whitespace-nowrap border-b border-line px-3 py-2 font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3',
                  c.align === 'right' ? 'text-right' : 'text-left',
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const k = rowKey(r)
            return (
              <tr
                key={k}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cx(
                  'border-b border-line/60 transition-colors duration-[var(--vm-dur-fast)]',
                  onRowClick && 'cursor-pointer hover:bg-surface-2',
                  activeKey === k && 'bg-accent-soft',
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx(
                      'px-3 py-2 align-middle text-ink-2',
                      c.align === 'right' && 'text-right',
                    )}
                  >
                    {c.cell(r)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ==========================================================================
   Loading and empty states
   ========================================================================== */

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cx('relative overflow-hidden rounded-control bg-surface-2', className)}>
      <span className="absolute inset-y-0 -left-1/3 w-1/3 animate-sweep bg-gradient-to-r from-transparent via-[var(--vm-surface-3)] to-transparent" />
    </div>
  )
}

export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div className="flex flex-col justify-end gap-2" style={{ height }} aria-busy="true">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="flex-1" />
      <div className="flex gap-2">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2.5 w-16" />
      </div>
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  icon: IconCmp = Info,
  action,
}: {
  title: string
  hint?: ReactNode
  icon?: Icon
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-control border border-dashed border-line px-6 py-10 text-center">
      <IconCmp size={22} weight="duotone" className="text-ink-3" />
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {hint && <p className="max-w-sm text-[12px] leading-relaxed text-ink-3">{hint}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
