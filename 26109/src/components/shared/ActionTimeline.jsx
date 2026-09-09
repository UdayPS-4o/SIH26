import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { Pill } from '../../components/common/ui.jsx'
import { useI18n } from '../../i18n/i18n.jsx'

const PRIORITY_TONE = {
  High: 'red',
  Medium: 'amber',
  Low: 'gray',
}

export function ActionTimeline({ actions = [] }) {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const tone = PRIORITY_TONE[action.priority] || 'gray'
        return (
          <div
            key={action.id}
            className={`flex gap-3 rounded-lg border p-4 transition-colors ${
              action.completed
                ? 'border-forest-200 bg-forest-50/50 dark:border-forest-800/40 dark:bg-forest-900/10'
                : 'border-sand-200 bg-white dark:border-barn-800/40 dark:bg-barn-950/40'
            }`}
          >
            {/* Timeline icon */}
            <div className="flex flex-col items-center pt-0.5">
              {action.completed ? (
                <CheckCircle2 size={20} className="text-forest-500" />
              ) : (
                <Circle size={20} className="text-sand-300 dark:text-barn-600" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-sm font-medium ${action.completed ? 'text-forest-800 dark:text-forest-300 line-through' : 'text-sand-900 dark:text-sand-100'}`}>
                  {action.title}
                </p>
                <Pill tone={tone}>{action.priority}</Pill>
              </div>

              <p className="mt-1.5 text-xs text-sand-500 dark:text-sand-400">{action.description}</p>

              <div className="mt-2 flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-sand-400">
                  <Clock size={12} />
                  {action.deadline}
                </span>
                {action.completed && (
                  <span className="text-xs font-medium text-forest-600 dark:text-forest-400">
                    {t('prev.actions.completed')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
