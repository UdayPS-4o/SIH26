/**
 * Interface primitives.
 *
 * The whole application is built from these. Every number is set in tabular mono
 * so columns of figures line up on the decimal. Colour always carries the meaning
 * documented in ./tokens.ts — six semantic hues (accent, primary, attention,
 * negative, positive, info), each with one job. Do not introduce a new one here;
 * extend tokens.ts and this file together so the meaning stays documented.
 */

import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { animate, useReducedMotion } from 'framer-motion'
import { cx } from './tokens'

export type Tone = 'neutral' | 'accent' | 'primary' | 'attention' | 'negative' | 'positive' | 'info'

/* ------------------------------------------------------------------ surfaces */

export function Panel({
  children,
  className,
  flush,
  hover,
}: {
  children: ReactNode
  className?: string
  /** Remove interior padding when the panel holds a table or list that draws its own. */
  flush?: boolean
  /** Lift on hover. Use only when the whole panel is a single interactive target. */
  hover?: boolean
}) {
  return (
    <section
      className={cx(
        'overflow-hidden rounded-2xl border border-rule bg-surface shadow-sm',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md',
        flush ? '' : 'px-5 py-4',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function PanelHead({
  title,
  meta,
  action,
  icon,
  className,
}: {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule px-5 py-3.5',
        className,
      )}
    >
      {icon ? <IconTile icon={icon} size="sm" /> : null}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-[13.5px] font-bold tracking-tight text-ink">{title}</h2>
        {meta ? <span className="font-mono text-[11px] text-ink-3">{meta}</span> : null}
      </div>
      {action ? <div className="ml-auto flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

/** Page-level heading. One per page, at the top. */
export function PageHead({
  title,
  lead,
  aside,
  icon,
}: {
  title: string
  lead: string
  aside?: ReactNode
  icon?: ReactNode
}) {
  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-6">
      <div className="flex min-w-0 items-start gap-4">
        {icon ? <IconTile icon={icon} tone="accent" size="lg" /> : null}
        <div className="min-w-0">
          <h1 className="font-display text-[26px] font-bold leading-tight tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-2">{lead}</p>
        </div>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  )
}

/** Small rounded tile carrying a phosphor icon in a tinted, tone-matched background.
 *  The one place decorative colour is attached to an icon, so it stays consistent. */
export function IconTile({
  icon,
  tone = 'accent',
  size = 'md',
}: {
  icon: ReactNode
  tone?: Tone
  size?: 'sm' | 'md' | 'lg'
}) {
  const dims = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-11 w-11' }[size]
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center justify-center rounded-xl',
        dims,
        ICON_TONE_CLASS[tone],
      )}
    >
      {icon}
    </span>
  )
}

const ICON_TONE_CLASS: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  accent: 'bg-accent-bg text-accent',
  // primary itself is a mid-tone button color: on its own light tint it falls
  // short of body-text contrast, so the "primary" flavour borrows accent
  // (same orange/amber family) for the icon/text colour instead.
  primary: 'bg-primary-bg text-accent',
  attention: 'bg-attention-bg text-attention',
  negative: 'bg-negative-bg text-negative',
  positive: 'bg-positive-bg text-positive',
  info: 'bg-info-bg text-info',
}

/* --------------------------------------------------------------------- text */

/** Tabular mono. Use for every code, score, quantity and rupee figure. */
export function Num({
  children,
  className,
  size = 'base',
}: {
  children: ReactNode
  className?: string
  size?: '2xs' | 'xs' | 'sm' | 'base' | 'lg' | 'xl' | 'display'
}) {
  const sizes = {
    '2xs': 'text-[10.5px]',
    xs: 'text-[11px]',
    sm: 'text-[12.5px]',
    base: 'text-[13px]',
    lg: 'text-[17px]',
    xl: 'text-[23px]',
    display: 'text-[36px] leading-[1.05]',
  }
  return <span className={cx('font-mono tabular-nums', sizes[size], className)}>{children}</span>
}

/**
 * A number that counts to its new value when it changes, instead of jumping.
 *
 * The motion is motivated: it exists so a value that recomputed from a slider,
 * an approval, or a loaded source visibly propagates instead of silently
 * changing. Reduced motion snaps straight to the new value.
 */
export function AnimatedNumber({
  value,
  format,
}: {
  value: number
  /** Must be a stable module level function, not an inline closure. */
  format: (value: number) => string
}) {
  const reduced = useReducedMotion()
  const current = useRef(value)
  const [display, setDisplay] = useState(() => format(value))

  useEffect(() => {
    if (reduced || current.current === value) {
      current.current = value
      setDisplay(format(value))
      return
    }
    const controls = animate(current.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: latest => {
        current.current = latest
        setDisplay(format(latest))
      },
      onComplete: () => {
        current.current = value
      },
    })
    return () => controls.stop()
  }, [value, format, reduced])

  return <>{display}</>
}

/** Small caps metadata label. Used sparingly: a panel that needs a label above its
 *  title usually needs a better title. */
export function Label({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cx('font-mono text-2xs uppercase text-ink-3', className)}>{children}</span>
  )
}

/** Inline code fragment, for raw ERP strings and identifiers. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <code
      className={cx(
        'rounded-md border border-rule bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-ink',
        className,
      )}
    >
      {children}
    </code>
  )
}

/* -------------------------------------------------------------------- stats */

export function Stat({
  value,
  label,
  note,
  emphasis,
  icon,
  tone = 'accent',
}: {
  value: ReactNode
  label: string
  note?: ReactNode
  /** One stat per group may be emphasised, so the eye has somewhere to land. */
  emphasis?: boolean
  icon?: ReactNode
  tone?: Tone
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
          {label}
        </div>
        {icon ? <IconTile icon={icon} tone={tone} size="sm" /> : null}
      </div>
      <div
        className={cx(
          'mt-2 break-words font-mono tabular-nums text-ink',
          emphasis ? 'text-[26px] leading-[1.15]' : 'text-[21px] leading-[1.2]',
        )}
      >
        {value}
      </div>
      {note ? <div className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{note}</div> : null}
    </div>
  )
}

/** Stats separated by hairlines within one rounded card, rather than boxed
 *  individually into competing cards. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule shadow-sm sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatCell({ children }: { children: ReactNode }) {
  return <div className="bg-surface px-5 py-5 transition-colors hover:bg-surface-hover">{children}</div>
}

/* ------------------------------------------------------------------- chips */

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'border-rule-strong text-ink-2',
  accent: 'border-accent-edge bg-accent-bg text-accent',
  // Same reasoning as ICON_TONE_CLASS: primary is a mid-tone button color,
  // not a text color, so this flavour borrows accent for legible text.
  primary: 'border-primary-edge bg-primary-bg text-accent',
  attention: 'border-attention-edge bg-attention-bg text-attention',
  negative: 'border-negative-edge bg-negative-bg text-negative',
  positive: 'border-positive-edge bg-positive-bg text-positive',
  info: 'border-info-edge bg-info-bg text-info',
}

export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The one place a verdict is rendered, so the three states cannot drift apart.
 *  "same" reads as positive (a match confirmed), not accent (accent is identity,
 *  never a result) — see tokens.ts. */
export function VerdictChip({ verdict, label }: { verdict: 'same' | 'review' | 'different'; label: string }) {
  const tone: Tone = verdict === 'same' ? 'positive' : verdict === 'review' ? 'attention' : 'negative'
  return <Chip tone={tone}>{label}</Chip>
}

/* ------------------------------------------------------------------ buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-primary text-primary-ink border-primary shadow-sm hover:shadow-md hover:brightness-105',
  secondary: 'bg-surface text-ink border-rule-strong hover:bg-surface-hover',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-hover hover:text-ink',
  danger: 'bg-surface text-negative border-negative hover:bg-negative-bg',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md'
  icon?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cx(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border font-semibold',
        'transition-all duration-150 active:translate-y-px active:shadow-none',
        'disabled:pointer-events-none disabled:opacity-45 disabled:shadow-none',
        size === 'sm' ? 'px-3 py-1 text-[12px]' : 'px-4 py-1.5 text-[13px]',
        VARIANT_CLASS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
})

/** Two or three mutually exclusive options. Always labelled, never an icon alone. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  className,
}: {
  value: T
  options: { value: T; label: string; count?: number }[]
  onChange: (value: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      className={cx('inline-flex gap-0.5 rounded-full border border-rule-strong bg-surface-2 p-0.5', className)}
      role="tablist"
    >
      {options.map(option => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-1.5 rounded-full font-semibold transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]',
              active
                ? 'bg-primary text-primary-ink shadow-sm'
                : 'bg-transparent text-ink-2 hover:bg-surface-hover hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cx(
                  'font-mono tabular-nums text-[11px]',
                  active ? 'text-primary-ink' : 'text-ink-3',
                )}
              >
                {option.count}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/* -------------------------------------------------------------------- forms */

export function Field({
  label,
  helper,
  error,
  children,
  className,
}: {
  label: string
  helper?: string
  error?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex flex-col gap-1.5', className)}>
      <label className="text-[12px] font-semibold text-ink">{label}</label>
      {children}
      {error ? (
        <p className="text-[12px] text-negative">{error}</p>
      ) : helper ? (
        <p className="text-[12px] text-ink-2">{helper}</p>
      ) : null}
    </div>
  )
}

const CONTROL =
  'w-full rounded-lg border border-rule-strong bg-surface px-3 py-1.5 text-[13px] text-ink placeholder:text-ink-3 ' +
  'transition-colors focus:border-accent focus:outline-none'

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...rest }, ref) {
    return <input ref={ref} className={cx(CONTROL, className)} {...rest} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cx(CONTROL, 'font-mono text-[12.5px]', className)} {...rest} />
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={cx(CONTROL, className)} {...rest}>
        {children}
      </select>
    )
  },
)

/** Weight and threshold control. Shows its value in mono so the number can be read
 *  off while dragging. */
export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  format,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  format?: (value: number) => string
  hint?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[12.5px] text-ink">{label}</label>
        <Num size="sm" className="text-ink">
          {format ? format(value) : value.toFixed(2)}
        </Num>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-rule accent-primary"
        aria-label={label}
      />
      {hint ? <p className="text-[11.5px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------------- meter */

const METER_FILL: Record<Tone, string> = {
  neutral: 'bg-ink-3',
  accent: 'bg-accent',
  primary: 'bg-primary',
  attention: 'bg-attention',
  negative: 'bg-negative',
  positive: 'bg-positive',
  info: 'bg-info',
}

/** Thin score bar. Deliberately small: the number is the information, the bar only
 *  makes a column of numbers scannable. For a real chart, use ./charts.tsx. */
export function Meter({ value, tone = 'accent' }: { value: number; tone?: Tone }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-rule" role="presentation">
      <span
        className={cx('block h-full rounded-full transition-[width] duration-300', METER_FILL[tone])}
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }}
      />
    </span>
  )
}

/* ------------------------------------------------------------------- states */

export function Skeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cx('flex flex-col gap-2', className)} aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="h-4 animate-pulse rounded-md bg-surface-2"
          style={{ width: `${92 - index * 11}%` }}
        />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  detail,
  action,
  icon,
}: {
  title: string
  detail?: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-dashed border-rule-strong bg-surface-2 px-6 py-10">
      {icon ? <IconTile icon={icon} tone="neutral" /> : null}
      <p className="font-display text-[15px] font-bold text-ink">{title}</p>
      {detail ? <p className="max-w-[52ch] text-[13px] text-ink-2">{detail}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-negative-edge bg-negative-bg px-5 py-4">
      <p className="text-[13px] text-negative">{message}</p>
      {onRetry ? (
        <Button size="sm" variant="danger" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  )
}

/* ----------------------------------------------------------------- service */

/**
 * The call that produced the panel it sits in.
 *
 * Shown in technical view only. It is the honest version of a status light: rather
 * than asserting the service is online, it names the request and how long it took.
 */
export function EndpointTag({
  method,
  endpoint,
  ms,
  scanned,
}: {
  method: string
  endpoint: string
  ms: number
  scanned?: number
}) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-ink-3">
      <span className="text-accent">{method}</span>
      <span>{endpoint}</span>
      <span className="tabular-nums">{ms} ms</span>
      {scanned ? <span className="tabular-nums">{scanned.toLocaleString('en-IN')} read</span> : null}
    </span>
  )
}

/* ------------------------------------------------------------------ tables */

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('w-full overflow-x-auto rounded-xl border border-rule', className)}>
      <table className="w-full border-collapse text-[13px]">{children}</table>
    </div>
  )
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={cx(
        'whitespace-nowrap border-b border-rule-strong bg-surface-2 px-3 py-2.5',
        'text-[11px] font-bold uppercase tracking-[0.08em] text-ink-2',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children: ReactNode
  className?: string
  align?: 'left' | 'right'
}) {
  return (
    <td
      className={cx(
        'border-b border-rule px-3 py-2.5 align-top',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </td>
  )
}
