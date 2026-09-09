import { TrendingUp, TrendingDown, Minus, Inbox, Loader2 } from 'lucide-react'
import { riskMeta, levelFromScore } from '../../utils/riskUtils'
import { useI18n } from '../../i18n/i18n.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between md:gap-3">
      <div>
        <h1 className="text-xl font-bold text-sand-900 dark:text-sand-100 sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-sand-500 dark:text-sand-400 sm:text-sm">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">{actions}</div>}
    </div>
  )
}

export function SectionTitle({ children, right }) {
  return (
    <div className="mb-2 flex items-center justify-between sm:mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-sand-500 dark:text-sand-400">{children}</h2>
      {right}
    </div>
  )
}

export function Card({ children, className = '' }) {
  return <div className={`rounded-card border border-sand-200 bg-white shadow-card dark:border-barn-800 dark:bg-barn-950/60 ${className}`}>{children}</div>
}

const KPI_TONE = {
  neutral: { chip: 'bg-sand-100 text-sand-600 dark:bg-sand-800 dark:text-sand-300', bar: 'bg-sand-400' },
  info: { chip: 'bg-ai-light text-ai-dark dark:bg-ai-dark/40 dark:text-ai', bar: 'bg-ai' },
  good: { chip: 'bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-400', bar: 'bg-forest-500' },
  warn: { chip: 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-400', bar: 'bg-honey-500' },
  bad: { chip: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400', bar: 'bg-red-500' },
}

export function KpiCard({ icon: Icon, label, value, caption, progress, tone = 'neutral', trend, trendLabel }) {
  const m = KPI_TONE[tone] || KPI_TONE.neutral
  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus
  const trendColor = trend > 0 ? 'text-forest-600 dark:text-forest-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-sand-400'
  return (
    <div className="rounded-card border border-sand-200 bg-white p-2.5 shadow-card transition-shadow hover:shadow-warm dark:border-barn-800 dark:bg-barn-950/60 sm:p-4 md:p-5">
      <div className="flex items-start justify-between">
        <span className={`grid h-8 w-8 place-items-center rounded-lg sm:h-10 sm:w-10 ${m.chip}`}>
          {Icon && <Icon size={15} className="sm:hidden" />}
          {Icon && <Icon size={18} className="hidden sm:block" />}
        </span>
        {trend !== undefined && (
          <span className={`inline-flex items-center gap-0.5 whitespace-nowrap text-[10px] font-semibold sm:gap-1 sm:text-xs ${trendColor}`}>
            <TrendIcon size={11} className="shrink-0" />
            {trendLabel || `${Math.abs(trend)}%`}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] font-medium text-sand-500 dark:text-sand-400 sm:mt-2 sm:text-sm">{label}</div>
      <div className="mt-0.5 text-lg font-bold leading-tight text-sand-900 dark:text-sand-100 sm:text-xl md:text-[26px]">{value}</div>
      {caption && <div className="mt-0.5 text-[11px] text-sand-400 sm:text-xs">{caption}</div>}
      {progress !== undefined && (
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800 sm:mt-2.5">
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:py-1 sm:text-xs ${m.bg} ${m.text} ${m.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {t(`risk.${lvl}`)}
      {score !== undefined && <span className="opacity-70">· {score}%</span>}
    </span>
  )
}

export function RiskGauge({ score, size = 160, label }) {
  const { theme } = useTheme()
  const lvl = levelFromScore(score)
  const m = riskMeta(lvl)
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  const dash = (score / 100) * c
  const trackColor = theme === 'dark' ? '#453018' : '#e8dfd0'
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth="12" />
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
          <span className="text-2xl font-bold text-sand-900 dark:text-sand-100 sm:text-3xl">{score}%</span>
          <span className={`mt-0.5 text-[10px] font-semibold uppercase sm:text-xs ${m.text}`}>{m.label} risk</span>
        </div>
      </div>
      {label && <p className="mt-1.5 text-[11px] text-sand-400 sm:mt-2 sm:text-xs">{label}</p>}
    </div>
  )
}

export function StatRow({ label, value, hint }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-xs text-sand-500 dark:text-sand-400">{label}</span>
      <span className="text-xs font-medium text-sand-900 dark:text-sand-100">
        {value}
        {hint && <span className="ml-1.5 text-[11px] font-normal text-sand-400">{hint}</span>}
      </span>
    </div>
  )
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between py-2 text-left"
    >
      <span className="text-xs text-sand-700 dark:text-sand-300 sm:text-sm">{label}</span>
      <span
        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-honey-600' : 'bg-sand-300 dark:bg-barn-700'}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  )
}

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-sand-300 bg-sand-50/60 px-4 py-10 text-center dark:border-barn-800 dark:bg-barn-900/60 sm:py-12">
      <Inbox className="mb-2 text-sand-300 dark:text-barn-700" size={28} />
      <p className="text-sm font-medium text-sand-700 dark:text-sand-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-sand-400">{hint}</p>}
    </div>
  )
}

export function LoadingState({ label }) {
  const { t } = useI18n()
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs text-sand-400 sm:gap-2.5 sm:py-12 sm:text-sm">
      <Loader2 className="animate-spin" size={16} />
      {label || t('common.loading')}
    </div>
  )
}

export function Pill({ tone = 'gray', children }) {
  const map = {
    gray: 'bg-sand-100 text-sand-600 dark:bg-barn-800 dark:text-sand-300',
    green: 'bg-forest-50 text-forest-700 dark:bg-forest-900/40 dark:text-forest-400',
    amber: 'bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-400',
    red: 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  }
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium sm:px-2 sm:py-0.5 sm:text-xs ${map[tone]}`}>{children}</span>
}

export function AiDisclaimer({ className = '' }) {
  const { t } = useI18n()
  return <p className={`text-[11px] italic text-sand-400 dark:text-barn-500 ${className}`}>{t('disclaimer.ai')}</p>
}
