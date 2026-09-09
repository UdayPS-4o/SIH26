import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const DIRECTION_ICONS = {
  positive: ArrowUpRight,
  negative: ArrowDownRight,
}

const DIRECTION_COLORS = {
  positive: 'text-forest-600 dark:text-forest-400',
  negative: 'text-red-600 dark:text-red-400',
}

export default function CorrelationBadge({ factorA, factorB, strength, direction }) {
  const { t } = useI18n()
  const DirectionIcon = DIRECTION_ICONS[direction] || Minus
  const dirColor = DIRECTION_COLORS[direction] || 'text-sand-400'

  // Bar color based on strength
  const barColor =
    strength >= 70
      ? 'bg-forest-500'
      : strength >= 50
        ? 'bg-honey-500'
        : strength >= 30
          ? 'bg-sand-400'
          : 'bg-sand-200 dark:bg-barn-700'

  return (
    <div className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white px-3.5 py-2.5 dark:border-barn-800/40 dark:bg-barn-950/40">
      <span className="flex items-center gap-1.5 text-sm font-medium text-sand-700 dark:text-sand-300">
        {factorA}
        <DirectionIcon size={14} className={dirColor} />
        {factorB}
      </span>
      <div className="ml-auto flex items-center gap-2">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800/50">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(100, strength)}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-sand-600 dark:text-sand-400 tabular-nums">
          {strength}%
        </span>
      </div>
    </div>
  )
}
