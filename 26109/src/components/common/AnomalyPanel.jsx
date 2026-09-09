import { useI18n } from '../../i18n/i18n.jsx'

const DOT = {
  critical: 'bg-red-500',
  warning:  'bg-honey-500',
  notice:   'bg-ai',
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 5) return 'Just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function AnomalyPanel({ anomalies = [] }) {
  const { t } = useI18n()

  if (!anomalies.length) {
    return (
      <div className="rounded-card border border-sand-200 bg-white p-8 text-center dark:border-barn-800/40 dark:bg-barn-950/40">
        <span className="text-3xl">✅</span>
        <p className="mt-2 text-sm text-sand-500 dark:text-sand-400">{t('detect.anomalies.none')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {anomalies.map((a, i) => (
        <div
          key={`${a.sensor}-${i}`}
          className="flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40"
        >
          {/* severity dot */}
          <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[a.severity] || 'bg-sand-400'}`} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-sand-900 dark:text-sand-100">
                {a.sensor === 'scc' ? 'SCC'
                  : a.sensor === 'milkYield' ? 'Milk Yield'
                  : a.sensor === 'activity' ? 'Activity'
                  : a.sensor === 'rumination' ? 'Rumination'
                  : a.sensor === 'temperature' ? 'Temperature'
                  : a.sensor}
              </span>
              <span className={`text-[11px] font-semibold uppercase tracking-wide ${
                a.severity === 'critical' ? 'text-red-600 dark:text-red-400'
                : a.severity === 'warning' ? 'text-honey-700 dark:text-honey-400'
                : 'text-ai'
              }`}>
                {t(`detect.severity.${a.severity}`)}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-sand-500 dark:text-sand-400">
              <span>
                Value: <span className="font-semibold text-sand-700 dark:text-sand-300">{a.value}{a.unit ? ` ${a.unit}` : ''}</span>
              </span>
              <span className="hidden sm:inline text-sand-300 dark:text-barn-600">|</span>
              <span>
                {t('detect.threshold')}: <span className="font-medium">{a.threshold}{a.unit ? ` ${a.unit}` : ''}</span>
              </span>
              <span className="hidden sm:inline text-sand-300 dark:text-barn-600">|</span>
              <span>
                {t('detect.deviation')}: <span className="font-semibold text-red-600 dark:text-red-400">+{a.deviation}%</span>
              </span>
            </div>
          </div>

          <span className="shrink-0 text-[11px] text-sand-400">{timeAgo(a.detectedAt)}</span>
        </div>
      ))}
    </div>
  )
}
