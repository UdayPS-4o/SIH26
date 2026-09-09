import { useI18n } from '../../i18n/i18n.jsx'

/**
 * PredictionBadge — shows AI confidence as a horizontal progress bar.
 * Props: { confidence: number (0-100) }
 */
export function PredictionBadge({ confidence }) {
  const { t } = useI18n()
  const pct = Math.max(0, Math.min(100, confidence))
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-sand-600 dark:text-sand-400">
          {t('ai.confidence')}
        </span>
        <span className="text-xs font-bold text-honey-700 dark:text-honey-400">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-sand-200 dark:bg-barn-800/50">
        <div
          className="h-full rounded-full bg-honey-500 transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
