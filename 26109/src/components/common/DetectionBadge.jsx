import { useI18n } from '../../i18n/i18n.jsx'
import { Radio } from 'lucide-react'

const DOT = { normal: 'bg-forest-500', watch: 'bg-honey-500', alert: 'bg-red-500 animate-pulse-soft' }

function timeSince(iso) {
  if (!iso) return ''
  const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 5) return 'Just checked'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function DetectionBadge({ status = 'normal', detectedAt }) {
  const { t } = useI18n()
  const label = status === 'alert' ? t('detect.status.alert')
    : status === 'watch' ? t('detect.status.watch')
    : t('detect.status.normal')

  return (
    <div className="inline-flex items-center gap-2.5 rounded-xl border border-sand-200 bg-white px-4 py-2.5 dark:border-barn-800/40 dark:bg-barn-950/40">
      <span className={`grid h-2.5 w-2.5 place-items-center rounded-full ${DOT[status] || DOT.normal}`}>
        {status === 'alert' && <Radio size={8} className="text-white" />}
      </span>
      <span className="text-sm font-semibold text-sand-900 dark:text-sand-100">{label}</span>
      {detectedAt && (
        <span className="text-[11px] text-sand-400">{timeSince(detectedAt)}</span>
      )}
    </div>
  )
}
