import { useI18n } from '../../i18n/i18n.jsx'

export default function ShapChart({ factors }) {
  const { t, lang } = useI18n()
  if (!factors || !factors.length) return null

  const max = Math.max(...factors.map(f => Math.abs(f.value || 0)))
  const sorted = [...factors].sort((a, b) => Math.abs(b.value || 0) - Math.abs(a.value || 0))
  const top3 = sorted.slice(0, 3)

  return (
    <div className="space-y-3">
      {sorted.map((f, i) => {
        const val = Math.abs(f.value || 0)
        const pct = max > 0 ? (val / max) * 100 : 0
        const isTop = i < 3
        const direction = (f.value || 0) >= 0 ? '↑' : '↓'
        const directionColor = (f.value || 0) >= 0 ? 'text-red-600' : 'text-emerald-600'

        return (
          <div key={f.key || f.label || i}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`font-medium ${isTop ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                {f.label || f.key}
                {isTop && <span className="ml-1 text-[10px] text-amber-600">TOP</span>}
              </span>
              <span className={`font-bold ${directionColor}`}>
                {direction} {pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className={`h-full rounded-full transition-all ${isTop ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
