import { useI18n } from '../../i18n/i18n.jsx'
import { riskMeta } from '../../utils/riskUtils'

/**
 * RiskCascade — 5-day risk trajectory visualization.
 * Horizontal timeline on desktop, vertical on mobile.
 * Props: { cascade: Array<{ day: string, risk: number, status: 'stable'|'rising'|'critical' }> }
 */
export function RiskCascade({ cascade }) {
  const { t } = useI18n()

  if (!cascade || !cascade.length) return null

  return (
    <div className="w-full">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sand-500 dark:text-sand-400">
        {t('ai.cascade')}
      </h3>

      {/* Desktop: horizontal layout */}
      <div className="hidden md:flex md:items-start md:gap-0">
        {cascade.map((entry, i) => {
          const m = riskMetaFromRisk(entry.risk, entry.status)
          const isLast = i === cascade.length - 1
          return (
            <div key={entry.day} className="flex flex-1 flex-col items-center">
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-0 right-0 flex justify-center">
                  <div className="h-0.5 w-full bg-sand-200 dark:bg-barn-700/60" />
                </div>
              )}
              {/* Node */}
              <div className="relative z-10 flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
                    m.bg
                  } ${m.text} ${m.border}`}
                  style={{ borderColor: m.hex }}
                >
                  {entry.risk}
                </div>
                <span className="mt-1.5 text-[10px] font-medium uppercase text-sand-400">
                  {entry.day}
                </span>
                <span className={`mt-0.5 text-[10px] font-semibold ${m.text}`}>
                  {t(`ai.cascade.${entry.status}`)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Mobile: vertical layout */}
      <div className="md:hidden relative ml-3 space-y-0 border-l-2 border-sand-200 dark:border-barn-700/60 pl-5">
        {cascade.map((entry) => {
          const m = riskMetaFromRisk(entry.risk, entry.status)
          return (
            <div key={entry.day} className="relative pb-5 last:pb-0">
              <div
                className={`absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${m.bg} ${m.border}`}
                style={{ borderColor: m.hex }}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-sand-400">{entry.day}</span>
                <span className="text-sm font-bold" style={{ color: m.hex }}>{entry.risk}%</span>
                <span className={`text-[10px] font-semibold ${m.text}`}>
                  {t(`ai.cascade.${entry.status}`)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function riskMetaFromRisk(risk, status) {
  if (risk >= 70 || status === 'critical') {
    return {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      border: 'border-red-200',
      dot: 'bg-red-500',
      hex: '#ef4444',
    }
  }
  if (status === 'rising') {
    return {
      bg: 'bg-honey-50 dark:bg-honey-900/20',
      text: 'text-honey-700 dark:text-honey-400',
      border: 'border-honey-200',
      dot: 'bg-honey-500',
      hex: '#f59e0b',
    }
  }
  if (risk >= 20) {
    return {
      bg: 'bg-forest-50 dark:bg-forest-900/20',
      text: 'text-forest-700 dark:text-forest-400',
      border: 'border-forest-200',
      dot: 'bg-forest-500',
      hex: '#4ade80',
    }
  }
  return {
    bg: 'bg-sand-100 dark:bg-barn-800/40',
    text: 'text-sand-600 dark:text-sand-400',
    border: 'border-sand-300',
    dot: 'bg-sand-400',
    hex: '#94a3b8',
  }
}
