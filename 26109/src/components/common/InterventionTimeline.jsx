import { useState } from 'react'
import { Clock, CheckCircle2, Circle, AlertTriangle } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const STATUS_META = {
  pending: { labelKey: 'suggest.intervention.pending', icon: Circle, color: 'text-sand-400', bg: 'bg-sand-100 dark:bg-barn-800/40' },
  'in-progress': { labelKey: 'suggest.intervention.pending', icon: Clock, color: 'text-honey-600 dark:text-honey-400', bg: 'bg-honey-50 dark:bg-honey-900/20' },
  completed: { labelKey: 'suggest.intervention.completed', icon: CheckCircle2, color: 'text-forest-600 dark:text-forest-400', bg: 'bg-forest-50 dark:bg-forest-900/20' },
}

const TIME_ORDER = ['now', '24h', '48h', 'week']

export default function InterventionTimeline({ interventions }) {
  const { t } = useI18n()
  const [statuses, setStatuses] = useState(() => {
    const map = {}
    interventions?.forEach((item) => {
      map[item.title] = item.status || 'pending'
    })
    return map
  })

  if (!interventions?.length) {
    return (
      <div className="rounded-card border border-dashed border-sand-300 bg-white/60 p-6 text-center dark:border-barn-700 dark:bg-barn-950/40">
        <p className="text-sm text-sand-400">{t('common.noData')}</p>
      </div>
    )
  }

  const sorted = [...interventions].sort((a, b) => TIME_ORDER.indexOf(a.time) - TIME_ORDER.indexOf(b.time))

  const toggleStatus = (title) => {
    setStatuses((prev) => {
      const current = prev[title] || 'pending'
      const next = current === 'pending' ? 'in-progress' : current === 'in-progress' ? 'completed' : 'completed'
      return { ...prev, [title]: next }
    })
  }

  const timeLabels = {
    now: t('suggest.intervention.now'),
    '24h': t('suggest.intervention.24h'),
    '48h': t('suggest.intervention.48h'),
    week: t('suggest.intervention.week'),
  }

  return (
    <div className="rounded-card border border-sand-200 bg-white p-5 dark:border-barn-800/40 dark:bg-barn-950/40">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-sand-500 dark:text-sand-400">{t('suggest.interventions')}</h3>
      <ol className="space-y-4">
        {sorted.map((item, i) => {
          const currentStatus = statuses[item.title] || 'pending'
          const statusMeta = STATUS_META[currentStatus] || STATUS_META.pending
          const StatusIcon = statusMeta.icon
          const isNow = item.time === 'now'
          const priorityColors = {
            High: 'border-red-300 dark:border-red-800/50',
            Medium: 'border-honey-300 dark:border-honey-800/50',
            Low: 'border-sand-200 dark:border-barn-800/40',
          }

          return (
            <li key={item.title}>
              <div className={`flex gap-3 rounded-lg border-l-4 ${priorityColors[item.priority] || priorityColors.Low} bg-sand-50/60 p-3 dark:bg-barn-900/20`}>
                {/* Time indicator */}
                <div className="flex flex-col items-center">
                  <span className={`mt-0.5 inline-flex h-3 w-3 rounded-full ${isNow ? 'bg-red-500' : 'bg-honey-500'}`} />
                  {i < sorted.length - 1 && <span className="mt-1 h-full w-px bg-sand-200 dark:bg-barn-700" style={{ minHeight: 40 }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-sand-400">{timeLabels[item.time] || item.time}</span>
                      <p className="mt-0.5 text-sm font-medium text-sand-900 dark:text-sand-100">{item.title}</p>
                    </div>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      item.priority === 'High' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : item.priority === 'Medium' ? 'bg-honey-50 text-honey-700 dark:bg-honey-900/20 dark:text-honey-400'
                      : 'bg-sand-100 text-sand-600 dark:bg-barn-800/50 dark:text-sand-300'
                    }`}>
                      {item.priority}
                    </span>
                  </div>

                  {/* Status toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStatus(item.title)}
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-lg ${statusMeta.bg} px-2.5 py-1.5 text-xs font-medium ${statusMeta.color}`}
                  >
                    <StatusIcon size={13} />
                    {t(statusMeta.labelKey)}
                    {currentStatus === 'completed' && <CheckCircle2 size={12} />}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
