import { useMemo } from 'react'
import { useI18n } from '../../i18n/i18n.jsx'
import { Activity, TrendingUp } from 'lucide-react'

const SEASON_TONE = {
  high: { hex: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-900/40', text: 'text-red-700 dark:text-red-400', bar: '#ef4444' },
  moderate: { hex: '#f59e0b', bg: 'bg-honey-50 dark:bg-honey-950/30', border: 'border-honey-200 dark:border-honey-900/40', text: 'text-honey-700 dark:text-honey-400', bar: '#f59e0b' },
  low: { hex: '#22c55e', bg: 'bg-forest-50 dark:bg-forest-950/30', border: 'border-forest-200 dark:border-forest-900/40', text: 'text-forest-700 dark:text-forest-400', bar: '#22c55e' },
}

export default function SeasonalRisk({ risk, factors }) {
  const { t } = useI18n()
  const tone = SEASON_TONE[risk] || SEASON_TONE.low
  const maxBar = useMemo(() => {
    if (!factors) return 100
    return Math.max(...factors.map((f) => f.impact), 100)
  }, [factors])

  return (
    <div className="rounded-xl border border-sand-200 bg-white p-5 dark:border-barn-800/40 dark:bg-barn-950/40">
      <div className="flex items-center gap-2 mb-4">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone.bg}`}>
          <Activity size={16} className={tone.text} />
        </span>
        <div>
          <p className="text-sm font-semibold text-sand-900 dark:text-sand-100">{t('analytics.seasonal')}</p>
          <p className={`text-xs font-medium ${tone.text}`}>{t(`analytics.seasonal.${risk === 'high' ? 'monsoon' : 'normal'}`)}</p>
        </div>
      </div>

      {/* Risk level indicator */}
      <div className={`mb-4 rounded-lg border ${tone.border} ${tone.bg} p-3`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-sand-500 dark:text-sand-400">Current Risk Level</span>
          <span className={`text-sm font-bold uppercase tracking-wide ${tone.text}`}>{risk}</span>
        </div>
      </div>

      {/* Season bars */}
      {factors && factors.length > 0 && (
        <div className="space-y-2.5 mb-4">
          {factors.map((factor, i) => {
            const impactVal = Math.round((factor.impact.length / maxBar) * 60) + 20
            return (
              <div key={i}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sand-600 dark:text-sand-400">{factor.name}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800/50">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, impactVal)}%`, background: tone.bar }}
                  />
                </div>
                <p className="mt-0.5 text-[11px] text-sand-400">{factor.impact}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Season comparison */}
      {factors?.seasonBars && (
        <div className="space-y-2">
          {factors.seasonBars.map((bar) => {
            const barTone = SEASON_TONE[bar.risk >= 60 ? 'high' : bar.risk >= 40 ? 'moderate' : 'low']
            return (
              <div key={bar.name} className="flex items-center gap-2">
                <span className="w-20 text-xs text-sand-500 dark:text-sand-400">{bar.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800/50">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${bar.risk}%`, background: barTone.bar }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] font-semibold text-sand-600 dark:text-sand-400 tabular-nums">
                  {bar.risk}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
