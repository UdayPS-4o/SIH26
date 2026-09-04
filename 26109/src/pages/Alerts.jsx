import { useMemo, useState } from 'react'
import { PageHeader, EmptyState } from '../components/common/ui.jsx'
import { AlertCard } from '../components/shared.jsx'
import { ALERTS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

export default function Alerts() {
  const { t } = useI18n()
  const [filter, setFilter] = useState('all')
  const [reviewed, setReviewed] = useState([])

  const tabs = [
    { key: 'all', label: t('alerts.filter.all') },
    { key: 'HIGH', label: t('alerts.filter.high') },
    { key: 'MODERATE', label: t('alerts.filter.moderate') },
    { key: 'resolved', label: t('alerts.filter.resolved') },
  ]

  const list = useMemo(() => {
    return ALERTS.map((a) => (reviewed.includes(a.id) ? { ...a, status: 'resolved' } : a)).filter((a) => {
      if (filter === 'all') return a.status === 'open'
      if (filter === 'resolved') return a.status === 'resolved'
      return a.status === 'open' && a.level === filter
    })
  }, [filter, reviewed])

  const counts = {
    all: ALERTS.filter((a) => a.status === 'open' && !reviewed.includes(a.id)).length,
  }

  return (
    <div>
      <PageHeader title={t('alerts.title')} subtitle={t('alerts.sub')} />

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
            <AlertCard key={a.id} alert={a} onReview={(id) => setReviewed((r) => [...r, id])} />
          ))}
        </div>
      )}
    </div>
  )
}
