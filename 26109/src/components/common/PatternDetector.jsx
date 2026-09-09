import { useI18n } from '../../i18n/i18n.jsx'
import { Eye } from 'lucide-react'

const SEVERITY_CONFIG = {
  low: {
    border: 'border-l-forest-400',
    bg: 'bg-forest-50/50 dark:bg-forest-900/10',
    iconBg: 'bg-forest-100 text-forest-700 dark:bg-forest-900/30 dark:text-forest-400',
    labelColor: 'text-forest-700 dark:text-forest-400',
  },
  medium: {
    border: 'border-l-honey-400',
    bg: 'bg-honey-50/50 dark:bg-honey-900/10',
    iconBg: 'bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-400',
    labelColor: 'text-honey-800 dark:text-honey-300',
  },
  high: {
    border: 'border-l-red-400',
    bg: 'bg-red-50/50 dark:bg-red-900/10',
    iconBg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    labelColor: 'text-red-700 dark:text-red-400',
  },
}

const PATTERN_LABELS = {
  scc_spike: 'SCC Spike Detected',
  yield_decline: 'Yield Decline Pattern',
  behavior_change: 'Behavioral Change',
  thermal_elevation: 'Temperature Anomaly',
  combined_risk: 'Combined Risk Pattern',
}

export default function PatternDetector({ patterns }) {
  const { t } = useI18n()

  if (!patterns || patterns.length === 0) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white p-5 dark:border-barn-800/40 dark:bg-barn-950/40">
        <p className="text-sm text-sand-400">No patterns detected for this animal at this time.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {patterns.map((pattern, i) => {
        const config = SEVERITY_CONFIG[pattern.severity] || SEVERITY_CONFIG.low
        const confidence = Math.min(100, Math.max(0, pattern.confidence || 0))
        const confidenceColor =
          confidence >= 75 ? 'bg-forest-500' : confidence >= 50 ? 'bg-honey-500' : 'bg-sand-400'
        const label = PATTERN_LABELS[pattern.type] || pattern.type

        return (
          <div
            key={i}
            className={`rounded-xl border border-sand-200 bg-white p-4 dark:border-barn-800/40 dark:bg-barn-950/40 ${config.border}`}
          >
            <div className="flex items-start gap-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${config.iconBg}`}>
                <Eye size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-semibold ${config.labelColor}`}>{label}</span>
                  <span className="text-xs font-medium text-sand-400 capitalize">
                    {pattern.severity} severity
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-sand-600 dark:text-sand-400">
                  {pattern.description}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[11px] text-sand-400">Confidence</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800/50">
                    <div
                      className={`h-full rounded-full ${confidenceColor}`}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-sand-600 dark:text-sand-400 tabular-nums">
                    {confidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
