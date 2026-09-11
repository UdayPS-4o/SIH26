import { useMemo, useState } from 'react'
import { ShieldCheck, Info } from 'lucide-react'
import { PageHeader, EmptyState, Card, AiThinkingDots } from '../components/common/ui.jsx'
import { AlertCard } from '../components/shared.jsx'
import { ALERTS, ALERT_BUDGET } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'
import { useAlerts } from '../context/AlertContext.jsx'

export default function Alerts() {
  const { t } = useI18n()
  const { isReviewed, markReviewed } = useAlerts()
  const [filter, setFilter] = useState('all')

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
      <PageHeader title={t('alerts.title')} subtitle={
        <span className="inline-flex items-center gap-1.5">
          {t('alerts.sub')} <AiThinkingDots />
        </span>
      } />

      {/* Alert Budget Card — Deck Core Trust Feature */}
      <Card className="mb-6 border-l-4 border-l-brand-600 bg-brand-50/50 p-4 dark:bg-brand-950/20">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
              <ShieldCheck size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {t('alerts.budget.title')}
              </p>
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                {t('alerts.budget.usage')} · Prevents alert fatigue for farm workers. Hysteresis (10% delta) avoids flickering.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-48">
            <div className="flex justify-between text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span>Slot Budget</span>
              <span>{ALERT_BUDGET.used} / {ALERT_BUDGET.dailyMax} slots</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${budgetPct}%` }} />
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
        <div className="grid gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a) => (
            <AlertCard key={a.id} alert={a} onReview={(id) => markReviewed(id)} />
          ))}
        </div>
      )}
    </div>
  )
}

