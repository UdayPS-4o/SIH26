import { useMemo } from 'react'
import { useI18n } from '../../i18n/i18n.jsx'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const RANK_COLORS = ['text-sand-900 dark:text-sand-100', 'text-sand-700 dark:text-sand-300', 'text-sand-600 dark:text-sand-400', 'text-sand-500 dark:text-sand-500']

export default function ShedComparison({ sheds }) {
  const { t } = useI18n()

  if (!sheds || sheds.length === 0) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white p-5 dark:border-barn-800/40 dark:bg-barn-950/40">
        <p className="text-sm text-sand-400">No shed data available.</p>
      </div>
    )
  }

  const bestRisk = Math.min(...sheds.map((s) => s.risk))
  const worstRisk = Math.max(...sheds.map((s) => s.risk))

  return (
    <div className="rounded-xl border border-sand-200 bg-white p-5 dark:border-barn-800/40 dark:bg-barn-950/40">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <TrendingUp size={16} className="text-honey-600 dark:text-honey-400" />
        <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">{t('analytics.shedCompare')}</h3>
      </div>

      {/* Ranking */}
      <div className="space-y-3">
        {sheds.map((shed, idx) => {
          const isBest = shed.risk === bestRisk
          const isWorst = shed.risk === worstRisk
          const rankColor = RANK_COLORS[idx] || 'text-sand-400'
          const m = {
            HIGH: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
            MODERATE: { color: 'text-honey-600 dark:text-honey-400', bg: 'bg-honey-50 dark:bg-honey-950/30' },
            LOW: { color: 'text-forest-600 dark:text-forest-400', bg: 'bg-forest-50 dark:bg-forest-950/30' },
          }[shed.level] || { color: 'text-sand-600 dark:text-sand-400', bg: 'bg-sand-50 dark:bg-barn-900/30' }

          return (
            <div
              key={shed.id}
              className={`flex items-center gap-3 rounded-lg border border-sand-100 p-3 dark:border-barn-800/30 ${m.bg}`}
            >
              {/* Rank */}
              <span className={`text-lg font-bold ${rankColor} w-6 text-center`}>#{idx + 1}</span>

              {/* Shed info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-sand-900 dark:text-sand-100">{shed.name}</span>
                  {isBest && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-forest-600 dark:text-forest-400">
                      <ArrowDownRight size={11} /> Best
                    </span>
                  )}
                  {isWorst && (
                    <span className="flex items-center gap-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                      <ArrowUpRight size={11} /> Highest
                    </span>
                  )}
                </div>
                <span className="text-xs text-sand-400">{shed.animals} animals</span>
              </div>

              {/* Risk score */}
              <div className="text-right">
                <span className={`text-lg font-bold ${m.color}`}>{shed.risk}%</span>
                <div className="flex items-center justify-end gap-1 text-[10px] text-sand-400">
                  {shed.deltaFromAvg > 0 ? (
                    <TrendingUp size={10} className="text-red-500" />
                  ) : shed.deltaFromAvg < 0 ? (
                    <TrendingDown size={10} className="text-forest-500" />
                  ) : null}
                  <span className="tabular-nums">
                    {shed.deltaFromAvg > 0 ? '+' : ''}{shed.deltaFromAvg}% vs avg
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
