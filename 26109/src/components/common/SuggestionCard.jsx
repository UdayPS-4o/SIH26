import { useState } from 'react'
import { ChevronDown, CheckCircle2, Circle, ShieldAlert } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const PRIORITY_STYLES = {
  High: { chip: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-red-200 dark:border-red-800/40' },
  Medium: { chip: 'bg-honey-50 text-honey-700 dark:bg-honey-900/20 dark:text-honey-400', border: 'border-honey-200 dark:border-honey-800/40' },
  Low: { chip: 'bg-sand-100 text-sand-600 dark:bg-sand-800/60 dark:text-sand-300', border: 'border-sand-200 dark:border-barn-800/40' },
}

export default function SuggestionCard({ rec, index }) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [completedSteps, setCompletedSteps] = useState({})
  const style = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.Low

  const toggleStep = (i) => {
    setCompletedSteps((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  const doneCount = rec.steps?.filter((_, i) => completedSteps[i]).length || 0
  const totalSteps = rec.steps?.length || 0
  const progress = totalSteps > 0 ? Math.round((doneCount / totalSteps) * 100) : 0

  return (
    <div className={`rounded-card border bg-white p-4 dark:bg-barn-950/40 ${style.border} shadow-card`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey-100 text-sm font-bold text-honey-700 dark:bg-honey-900/30 dark:text-honey-400">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-sm font-medium text-sand-900 dark:text-sand-100">{rec.title}</p>
            <div className="flex items-center gap-2">
              <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${style.chip}`}>{rec.priority}</span>
            </div>
          </div>
          <p className="mt-1 text-xs text-sand-500 dark:text-sand-400">{rec.reason}</p>
        </div>
      </div>

      {/* Expandable Steps */}
      {rec.steps && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-sand-700 transition-colors hover:bg-sand-100 dark:text-sand-300 dark:hover:bg-barn-800/40"
          >
            <span className="flex items-center gap-2">
              {expanded ? <ChevronDown size={15} className="rotate-180 transition-transform" /> : <ChevronDown size={15} className="transition-transform" />}
              {t('suggest.steps')}
              {totalSteps > 0 && <span className="text-xs text-sand-400">({doneCount}/{totalSteps})</span>}
            </span>
            {totalSteps > 0 && <span className="text-xs text-sand-400">{progress}%</span>}
          </button>

          {expanded && (
            <div className="mt-2 space-y-2 rounded-lg border border-sand-200 bg-sand-50/60 p-3 dark:border-barn-800/40 dark:bg-barn-900/20">
              {progress > 0 && (
                <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-sand-200 dark:bg-barn-700">
                  <div className="h-full rounded-full bg-honey-500 transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
              {rec.steps.map((step, i) => {
                const done = !!completedSteps[i]
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleStep(i)}
                    className={`flex w-full items-start gap-2.5 text-left text-sm transition-colors ${
                      done ? 'text-sand-400 dark:text-barn-500' : 'text-sand-700 dark:text-sand-300'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {done ? <CheckCircle2 size={16} className="text-forest-500" /> : <Circle size={16} className="text-sand-300 dark:text-barn-600" />}
                    </span>
                    <span className={done ? 'line-through' : ''}>{step}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer: Expected outcome, timeframe, vet escalation */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-100 pt-3 dark:border-barn-800/40">
        {rec.expectedOutcome && (
          <div className="flex-1 min-w-[200px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sand-400">{t('suggest.expected')}: </span>
            <span className="text-xs text-sand-600 dark:text-sand-400">{rec.expectedOutcome}</span>
          </div>
        )}
        {rec.timeframe && (
          <span className="inline-flex items-center rounded-md border border-sand-200 bg-sand-50 px-2 py-0.5 text-xs font-medium text-sand-600 dark:border-barn-700 dark:bg-barn-800/40 dark:text-sand-300">
            {rec.timeframe}
          </span>
        )}
        {rec.requiresVet && (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <ShieldAlert size={12} />
            {t('suggest.vetRequired')}
          </span>
        )}
      </div>
    </div>
  )
}
