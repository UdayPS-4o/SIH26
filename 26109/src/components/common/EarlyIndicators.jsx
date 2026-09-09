import { Eye } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

/**
 * EarlyIndicators — shows early warning signals as small icon cards.
 * Props: { indicators: string[] }
 */
export function EarlyIndicators({ indicators }) {
  const { t } = useI18n()

  if (!indicators || !indicators.length) return null

  return (
    <div className="w-full">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-sand-500 dark:text-sand-400">
        {t('ai.earlyIndicators')}
      </h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {indicators.map((text, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-ai/20 bg-ai-light/60 px-3 py-2.5 dark:bg-ai/10 dark:border-ai/15"
          >
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ai/15 text-ai-dark dark:bg-ai/25 dark:text-ai">
              <Eye size={13} />
            </span>
            <p className="text-xs leading-relaxed text-ai-dark dark:text-ai">{text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
