import { TrendingUp, TrendingDown, Minus, Inbox, Loader2 } from 'lucide-react'
import { riskMeta, levelFromScore } from '../../utils/riskUtils'
import { useI18n } from '../../i18n/i18n.jsx'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">{children}</h2>
      {right}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>
}

const KPI_TONE = {
  neutral: { chip: 'bg-slate-100 text-slate-600', bar: 'bg-slate-400' },
  info: { chip: 'bg-sky-100 text-sky-600', bar: 'bg-sky-500' },
  good: { chip: 'bg-brand-100 text-brand-700', bar: 'bg-brand-500' },
  warn: { chip: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500' },
  bad: { chip: 'bg-red-100 text-red-600', bar: 'bg-red-500' },
}

export function KpiCard({ icon: Icon, label, value, caption, progress, tone = 'neutral', trend, trendLabel }) {
  const m = KPI_TONE[tone] || KPI_TONE.neutral
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-brand-600' : trend < 0 ? 'text-red-600' : 'text-gray-400'
  return (
    <div className="card-p">
      <div className="flex items-start justify-between">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${m.chip}`}>
          {Icon && <Icon size={19} />}
        </span>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <TrendIcon size={13} />
            {trendLabel || `${Math.abs(trend)}%`}
          </span>
        )}
      </div>
      <div className="mt-3 text-sm font-medium text-gray-500">{label}</div>
      <div className="mt-0.5 text-[26px] font-bold leading-tight text-gray-900">{value}</div>
      {caption && <div className="mt-1 text-xs text-gray-400">{caption}</div>}
      {progress !== undefined && (
        <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full rounded-full ${m.bar}`} style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  )
}

export function RiskBadge({ level, score }) {
  const { t } = useI18n()
  const lvl = level || levelFromScore(score || 0)
  const m = riskMeta(lvl)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${m.bg} ${m.text} ${m.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {t(`risk.${lvl}`)}
      {score !== undefined && <span className="opacity-70">· {score}%</span>}
    </span>
  )
}

export function RiskGauge({ score, size = 160, label }) {
  const lvl = levelFromScore(score)
  const m = riskMeta(lvl)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth="12" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={m.hex}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
            style={{ transition: 'stroke-dasharray .5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-900">{score}%</span>
          <span className={`mt-0.5 text-xs font-semibold uppercase ${m.text}`}>{m.label} risk</span>
        </div>
      </div>
      {label && <p className="mt-2 text-xs text-gray-500">{label}</p>}
    </div>
  )
}

export function StatRow({ label, value, hint }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">
        {value}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </span>
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2.5 text-left"
    >
      <span className="text-sm text-gray-700">{label}</span>
      <span
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-brand-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white/60 px-6 py-12 text-center">
      <Inbox className="mb-3 text-gray-300" size={32} />
      <p className="text-sm font-medium text-gray-700">{title}</p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

export function LoadingState({ label }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-400">
      <Loader2 className="animate-spin" size={16} />
      {label || t('common.loading')}
    </div>
  )
}

export function Pill({ tone = 'gray', children }) {
  const map = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-brand-50 text-brand-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
  }
  return <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>
}

export function AiDisclaimer({ className = '' }) {
  const { t } = useI18n()
  return <p className={`text-xs italic text-gray-400 ${className}`}>{t('disclaimer.ai')}</p>
}
