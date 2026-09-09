import { Activity, Eye, AlertTriangle } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const ESCALATION_CONFIG = {
  monitor: {
    icon: Eye,
    bg: 'bg-forest-50 dark:bg-forest-900/20',
    text: 'text-forest-700 dark:text-forest-400',
    border: 'border-forest-200 dark:border-forest-800/40',
    dot: 'bg-forest-500',
    key: 'prev.escalation.monitor',
  },
  watch: {
    icon: Activity,
    bg: 'bg-honey-50 dark:bg-honey-900/20',
    text: 'text-honey-700 dark:text-honey-400',
    border: 'border-honey-200 dark:border-honey-800/40',
    dot: 'bg-honey-500',
    key: 'prev.escalation.watch',
  },
  escalate: {
    icon: AlertTriangle,
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800/40',
    dot: 'bg-red-500',
    key: 'prev.escalation.escalate',
  },
}

export function EscalationBadge({ level = 'monitor' }) {
  const { t } = useI18n()
  const config = ESCALATION_CONFIG[level] || ESCALATION_CONFIG.monitor
  const Icon = config.icon

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      <Icon size={13} />
      {t(config.key)}
    </span>
  )
}
