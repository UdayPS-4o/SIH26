/**
 * Interface primitives.
 *
 * The whole application is built from these. Two rules hold the system together:
 * grouping is done with 1px rules and space rather than stacked cards, and every
 * number is set in tabular mono so columns of figures line up on the decimal.
 *
 * Do not introduce a fourth hue. See ./tokens.ts for what the three mean.
 */

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { cx } from './tokens'

/* ------------------------------------------------------------------ surfaces */

export function Panel({
  children,
  className,
  flush,
}: {
  children: ReactNode
  className?: string
  /** Remove interior padding when the panel holds a table or list that draws its own. */
  flush?: boolean
}) {
  return (
    <section
      className={cx(
        'border border-rule bg-surface',
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
  className,
}: {
  title: ReactNode
  meta?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cx(
        'flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule px-5 py-3',
        className,
      )}
    >
      <h2 className="font-display text-[13px] font-semibold tracking-tight text-ink">{title}</h2>
      {meta ? <span className="font-mono text-[11px] text-ink-3">{meta}</span> : null}
      {action ? <div className="ml-auto flex items-center gap-2">{action}</div> : null}
    </div>
  )
}

/** Page-level heading. One per page, at the top. */
export function PageHead({
  title,
  lead,
  aside,
}: {
  title: string
  lead: string
  aside?: ReactNode
}) {
  return (
    <header className="mb-6 border-b border-ink pb-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-2">{lead}</p>
        </div>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
    </header>
  )
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
    xl: 'text-[22px]',
    display: 'text-[34px] leading-[1.05]',
  }
  return <span className={cx('font-mono tabular-nums', sizes[size], className)}>{children}</span>
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
        'border border-rule bg-surface-2 px-1.5 py-0.5 font-mono text-[12px] text-ink',
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
}: {
  value: ReactNode
  label: string
  note?: ReactNode
  /** One stat per group may be emphasised, so the eye has somewhere to land. */
  emphasis?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">{label}</div>
      <div
        className={cx(
          'mt-1.5 font-mono tabular-nums text-ink',
          emphasis ? 'text-[30px] leading-[1.05]' : 'text-[21px] leading-[1.1]',
        )}
      >
        {value}
      </div>
      {note ? <div className="mt-1 text-[12.5px] leading-snug text-ink-2">{note}</div> : null}
    </div>
  )
}

/** Stats separated by rules rather than boxed into cards. */
export function StatRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function StatCell({ children }: { children: ReactNode }) {
  return <div className="bg-surface px-5 py-4">{children}</div>
}

/* ------------------------------------------------------------------- chips */

type Tone = 'neutral' | 'accent' | 'attention' | 'negative'

const TONE_CLASS: Record<Tone, string> = {
  neutral: 'border-rule-strong text-ink-2',
  accent: 'border-accent-edge bg-accent-bg text-accent',
  attention: 'border-attention-edge bg-attention-bg text-attention',
  negative: 'border-negative bg-negative-bg text-negative',
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
        'inline-flex items-center border px-1.5 py-0.5 font-mono text-[10.5px] uppercase tracking-[0.08em]',
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/** The one place a verdict is rendered, so the three states cannot drift apart. */
export function VerdictChip({ verdict, label }: { verdict: 'same' | 'review' | 'different'; label: string }) {
  const tone: Tone = verdict === 'same' ? 'accent' : verdict === 'review' ? 'attention' : 'negative'
  return <Chip tone={tone}>{label}</Chip>
}

/* ------------------------------------------------------------------ buttons */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bg-accent text-white border-accent hover:opacity-90',
  secondary: 'bg-surface text-ink border-rule-strong hover:bg-surface-2',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-surface-2 hover:text-ink',
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
        'inline-flex items-center justify-center gap-2 whitespace-nowrap border font-medium',
        'transition-colors active:translate-y-px disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
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
    <div className={cx('inline-flex border border-rule-strong', className)} role="tablist">
      {options.map((option, index) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cx(
              'inline-flex items-center gap-1.5 font-medium transition-colors',
              size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[12.5px]',
              index > 0 && 'border-l border-rule-strong',
              active ? 'bg-accent text-white' : 'bg-surface text-ink-2 hover:bg-surface-2 hover:text-ink',
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className={cx('font-mono tabular-nums text-[11px]', active ? 'text-white' : 'text-ink-3')}>
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
      <label className="text-[12px] font-medium text-ink">{label}</label>
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
  'w-full border border-rule-strong bg-surface px-2.5 py-1.5 text-[13px] text-ink placeholder:text-ink-3 ' +
  'focus:border-accent focus:outline-none'

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
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-rule accent-accent"
        aria-label={label}
      />
      {hint ? <p className="text-[11.5px] text-ink-3">{hint}</p> : null}
    </div>
  )
}

/* -------------------------------------------------------------------- meter */

/** Thin score bar. Deliberately small: the number is the information, the bar only
 *  makes a column of numbers scannable. */
export function Meter({ value, tone = 'accent' }: { value: number; tone?: Tone }) {
  const fill = {
    neutral: 'bg-ink-3',
    accent: 'bg-accent',
    attention: 'bg-attention',
    negative: 'bg-negative',
  }[tone]
  return (
    <span className="block h-[3px] w-full bg-rule" role="presentation">
      <span
        className={cx('block h-full transition-[width] duration-300', fill)}
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
          className="h-4 animate-pulse bg-surface-2"
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
}: {
  title: string
  detail?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-start gap-3 border border-dashed border-rule-strong px-6 py-10">
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      {detail ? <p className="max-w-[52ch] text-[13px] text-ink-2">{detail}</p> : null}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 border border-negative bg-negative-bg px-5 py-4">
      <p className="text-[13px] text-negative">{message}</p>
      {onRetry ? (
        <Button size="sm" onClick={onRetry}>
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
    <div className={cx('w-full overflow-x-auto', className)}>
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
        'whitespace-nowrap border-b border-rule-strong bg-surface-2 px-3 py-2',
        'text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2',
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
        'border-b border-rule px-3 py-2 align-top',
        align === 'right' ? 'text-right' : 'text-left',
        className,
      )}
    >
      {children}
    </td>
  )
}
