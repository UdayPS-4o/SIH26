import { useMemo, useState } from 'react'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { PageHeader } from '../components/common/ui.jsx'
import { AnimalTable } from '../components/shared.jsx'
import { EmptyState } from '../components/common/ui.jsx'
import { ANIMALS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

const PAGE_SIZE = 8
const RISK_ORDER = { HIGH: 3, MODERATE: 2, LOW: 1, NONE: 0 }

export default function Animals() {
  const { t } = useI18n()
  const [q, setQ] = useState('')
  const [risk, setRisk] = useState('')
  const [breed, setBreed] = useState('')
  const [lactation, setLactation] = useState('')
  const [sortRisk, setSortRisk] = useState(true)
  const [page, setPage] = useState(1)

  const breeds = useMemo(() => [...new Set(ANIMALS.map((a) => a.breed))], [])
  const lactations = useMemo(() => [...new Set(ANIMALS.map((a) => a.lactation))].sort((a, b) => a - b), [])

  const filtered = useMemo(() => {
    let list = ANIMALS.filter((a) => {
      if (q && !a.id.toLowerCase().includes(q.toLowerCase()) && !a.name.toLowerCase().includes(q.toLowerCase())) return false
      if (risk && a.riskLevel !== risk) return false
      if (breed && a.breed !== breed) return false
      if (lactation && String(a.lactation) !== lactation) return false
      return true
    })
    list = [...list].sort((a, b) =>
      sortRisk ? b.riskScore - a.riskScore || RISK_ORDER[b.riskLevel] - RISK_ORDER[a.riskLevel] : a.id.localeCompare(b.id),
    )
    return list
  }, [q, risk, breed, lactation, sortRisk])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const reset = () => setPage(1)

  return (
    <div>
      <PageHeader title={t('animals.title')} subtitle={`${ANIMALS.length} animals across 4 sheds`} />

      <div className="card-p mb-5">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              className="input pl-9"
              placeholder={t('animals.searchId')}
              value={q}
              onChange={(e) => { setQ(e.target.value); reset() }}
            />
          </div>
          <select className="input" value={risk} onChange={(e) => { setRisk(e.target.value); reset() }}>
            <option value="">{t('animals.filter.risk')}</option>
            {['HIGH', 'MODERATE', 'LOW', 'NONE'].map((r) => (
              <option key={r} value={r}>{t(`risk.${r}`)}</option>
            ))}
          </select>
          <select className="input" value={breed} onChange={(e) => { setBreed(e.target.value); reset() }}>
            <option value="">{t('animals.filter.breed')}</option>
            {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="input" value={lactation} onChange={(e) => { setLactation(e.target.value); reset() }}>
            <option value="">{t('animals.filter.lactation')}</option>
            {lactations.map((l) => <option key={l} value={l}>Lactation {l}</option>)}
          </select>
          <button
            className={`btn ${sortRisk ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setSortRisk((s) => !s)}
          >
            {sortRisk ? t('animals.sort.risk') : 'Sort by ID'}
          </button>
        </div>
      </div>

      {pageItems.length === 0 ? (
        <EmptyState title={t('common.noData')} hint="Try adjusting your filters." />
      ) : (
        <>
          <AnimalTable animals={pageItems} />
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              {t('animals.showing')} {(current - 1) * PAGE_SIZE + 1}–{Math.min(current * PAGE_SIZE, filtered.length)} {t('animals.of')} {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="btn-ghost !px-2 disabled:opacity-40"
                disabled={current === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`h-8 w-8 rounded-lg text-sm font-medium ${
                    current === i + 1 ? 'bg-brand-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="btn-ghost !px-2 disabled:opacity-40"
                disabled={current === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
