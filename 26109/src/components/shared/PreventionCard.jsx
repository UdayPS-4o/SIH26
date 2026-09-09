import { ShieldCheck, AlertTriangle, Users, Clock, CheckCircle2 } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const LEVEL_STYLES = {
  good: {
    bg: 'bg-gradient-to-br from-forest-500 to-forest-600',
    text: 'text-forest-100',
    badge: 'bg-forest-100 text-forest-700 dark:bg-forest-900/40 dark:text-forest-400',
    label: 'prev.level.good',
  },
  moderate: {
    bg: 'bg-gradient-to-br from-honey-500 to-honey-600',
    text: 'text-honey-100',
    badge: 'bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400',
    label: 'prev.level.moderate',
  },
  poor: {
    bg: 'bg-gradient-to-br from-red-500 to-red-600',
    text: 'text-red-100',
    badge: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    label: 'prev.level.poor',
  },
}

const FACTOR_ICONS = {
  alert: AlertTriangle,
  trend: Clock,
  hygiene: ShieldCheck,
}

export function PreventionCard({ score = 0, level = 'moderate', factors = [] }) {
  const { t } = useI18n()
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.moderate
  const FactorIcon = ({ type }) => {
    const Icon = FACTOR_ICONS[type] || ShieldCheck
    return <Icon size={14} />
  }

  return (
    <div className="card overflow-hidden">
      {/* Header band */}
      <div className={`px-5 py-4 ${style.bg}`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{t('prev.score')}</p>
        <div className="mt-1 flex items-end justify-between">
          <span className={`text-4xl font-bold ${style.text}`}>{score}</span>
          <span className="text-sm font-medium text-white/80">/ 100</span>
        </div>
      </div>

      <div className="p-5">
        {/* Level badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>
            {t(style.label)}
          </span>
        </div>

        {/* Top factors */}
        {factors.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-sand-400">Top Factors</p>
            {factors.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-sand-100 bg-sand-50/60 p-3 dark:border-barn-800/40 dark:bg-barn-900/20">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400">
                  <FactorIcon type={f.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-sand-900 dark:text-sand-100">{f.label}</p>
                  <p className="text-xs text-sand-500 dark:text-sand-400">{f.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
