import { useMemo, useState } from 'react'
import { ShieldCheck, Info } from 'lucide-react'
import { PageHeader, EmptyState, Card } from '../components/common/ui.jsx'
import { AlertCard } from '../components/shared.jsx'
import { ALERTS, ALERT_BUDGET } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'
import { useAlerts } from '../context/AlertContext.jsx'
import DataFooter from '../components/common/DataFooter.jsx'

export default function Alerts() {
  const { t } = useI18n()
  const { isReviewed, markReviewed } = useAlerts()
  const [filter, setFilter] = useState('all')
  const [budgetPercent, setBudgetPercent] = useState(5)

  const tabs = [
    { key: 'all', label: t('alerts.filter.all') },
    { key: 'HIGH', label: t('alerts.filter.high') },
    { key: 'MODERATE', label: t('alerts.filter.moderate') },
    { key: 'resolved', label: t('alerts.filter.resolved') },
  ]

  const list = useMemo(() => {
    return ALERTS.map((a) => (isReviewed(a.id) || isReviewed(a.animalId) ? { ...a, status: 'resolved' } : a)).filter((a) => {
      if (filter === 'all') return a.status === 'open'
      if (filter === 'resolved') return a.status === 'resolved'
      return a.status === 'open' && a.level === filter
    })
  }, [filter, isReviewed])

  const counts = {
    all: ALERTS.filter((a) => a.status === 'open' && !isReviewed(a.id) && !isReviewed(a.animalId)).length,
  }

  const budgetPct = Math.round((ALERT_BUDGET.used / ALERT_BUDGET.dailyMax) * 100)

  return (
    <div>
      <PageHeader title={t('alerts.title')} subtitle={t('alerts.sub')} />

      {/* Alert Budget Card — Deck Core Trust Feature */}
      <Card className="mb-6 border-l-4 border-l-amber-600 bg-amber-50/50 p-4 dark:bg-amber-950/20">
        <div className="flex flex-col gap-4">
          {/* Budget counter */}
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              <ShieldCheck size={18} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('alerts.budget.title')}
              </p>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                {t('alerts.budget.usage')} · Prevents alert fatigue for farm workers. Hysteresis (10% delta) avoids flickering.
              </p>
            </div>
          </div>

          {/* Budget progress bar */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Slot Budget</span>
              <span>{ALERT_BUDGET.used} / {ALERT_BUDGET.dailyMax} slots used</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-amber-600 transition-all" style={{ width: `${budgetPct}%` }} />
            </div>
            <p className="mt-1 text-[10px] text-gray-400">{ALERT_BUDGET.limitPercentage}% of herd/day — WHO recommended threshold for diagnostic alerts</p>
          </div>

          {/* Interactive budget slider */}
          <div>
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Adjust daily alert budget: <span className="font-bold text-gray-900 dark:text-gray-100">{budgetPercent}%</span>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              value={budgetPercent}
              onChange={(e) => setBudgetPercent(Number(e.target.value))}
              className="w-full mt-1 h-2 rounded-lg appearance-none cursor-pointer bg-gray-200 dark:bg-gray-700 accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-1">
              <span>1% — Conservative (~50% catch rate)</span>
              <span>5% — Optimal (recommended)</span>
              <span>15% — Aggressive (~90% catch rate)</span>
            </div>
          </div>

          {/* Silent Watchlist */}
          <div className="rounded-lg bg-white/60 p-3 dark:bg-stone-900/60">
            <p className="text-xs font-medium text-stone-600 dark:text-stone-400">
              Silent Watchlist: 3 animals monitored but not alerted
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Below budget threshold but showing elevated trends. Re-scored at next milking session.
            </p>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-xs dark:bg-stone-800/80">
                <span className="font-medium text-gray-900 dark:text-gray-100">BUF-038</span>
                <span className="text-amber-600">risk 32%</span>
                <span className="text-gray-400">budget full</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-xs dark:bg-stone-800/80">
                <span className="font-medium text-gray-900 dark:text-gray-100">BUF-051</span>
                <span className="text-amber-600">risk 28%</span>
                <span className="text-gray-400">trending up</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-xs dark:bg-stone-800/80">
                <span className="font-medium text-gray-900 dark:text-gray-100">BUF-073</span>
                <span className="text-amber-600">risk 25%</span>
                <span className="text-gray-400">5-milking window</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setFilter(tb.key)}
            className={`btn ${filter === tb.key ? 'btn-primary' : 'btn-ghost'}`}
          >
            {tb.label}
            {tb.key === 'all' && <span className="ml-1 rounded-full bg-white/20 px-1.5 text-xs">{counts.all}</span>}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No alerts in this view" hint="You're all caught up." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <AlertCard key={a.id} alert={a} onReview={(id) => markReviewed(id)} />
          ))}
        </div>
      )}
      <DataFooter />
    </div>
  )
}

