import { useI18n } from '../../i18n/i18n.jsx'

/**
 * Horizontal threshold meter.
 * - value / threshold ratio drives the bar fill.
 * - Color: forest (< 70%) → honey (70–100%) → red (> 100%).
 */
export default function ThresholdMeter({ value, threshold, unit, label }) {
  const { t } = useI18n()
  const numVal = Number(value)
  const numThr = Number(threshold)
  if (Number.isNaN(numVal) || Number.isNaN(numThr) || numThr === 0) return null

  const pct = Math.min(100, Math.max(0, (numVal / numThr) * 100))
  const breached = numVal > numThr

  const barColor =
    pct < 70 ? 'bg-forest-500'
    : pct < 100 ? 'bg-honey-500'
    : 'bg-red-500'

  const textColor =
    breached ? 'text-red-600 dark:text-red-400'
    : pct >= 70 ? 'text-honey-700 dark:text-honey-400'
    : 'text-forest-700 dark:text-forest-400'

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-sand-600 dark:text-sand-400">{label}</span>
        <span className={`text-xs font-semibold ${textColor}`}>
          {numVal}{unit ? ` ${unit}` : ''}
          {breached && <span className="ml-1">⚠</span>}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800/50">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[11px] text-sand-400">
        <span>0</span>
        <span className="font-medium text-sand-500">
          {t('detect.threshold')}: {numThr}{unit ? ` ${unit}` : ''}
        </span>
      </div>
    </div>
  )
}
