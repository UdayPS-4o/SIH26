import { useI18n } from '../../i18n/i18n.jsx'

const STATUS_DOT = { online: 'bg-forest-500', degraded: 'bg-honey-500', offline: 'bg-red-500' }

export default function SensorHealth({ sensors = [] }) {
  const { t } = useI18n()
  const statusLabel = (s) => t(`detect.sensor.${s.status}`)

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sensors.map((s) => (
        <div
          key={s.name}
          className="flex items-start gap-3 rounded-xl border border-sand-200 bg-white p-3.5 dark:border-barn-800/40 dark:bg-barn-950/40"
        >
          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[s.status] || 'bg-sand-400'}`} />

          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-sand-900 dark:text-sand-100">{s.name}</p>
            <p className={`mt-0.5 text-xs font-medium capitalize ${
              s.status === 'online' ? 'text-forest-600 dark:text-forest-400'
              : s.status === 'degraded' ? 'text-honey-700 dark:text-honey-400'
              : 'text-red-600 dark:text-red-400'
            }`}>
              {statusLabel(s.status)}
            </p>
            <p className="mt-0.5 text-[11px] text-sand-400">
              Last reading: <span className="font-medium text-sand-600 dark:text-sand-300">{s.lastReading}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-sand-400">
              Uptime: <span className="font-medium text-sand-600 dark:text-sand-300">{s.uptime}%</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
