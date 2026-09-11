import { useState, Fragment } from 'react'
import { Users, ShieldCheck, AlertTriangle, ChevronDown, ChevronRight, Check, X } from 'lucide-react'
import { PageHeader, KpiCard, Card, SectionTitle, Pill, AiDisclaimer } from '../components/common/ui.jsx'
import { TrendChart } from '../components/common/charts.jsx'
import { WORKERS, WORKER_STATS, SHED_HYGIENE, HYGIENE_TREND, HYGIENE_THRESHOLD, CHECKLIST_ITEMS } from '../data/workerData'
import { useI18n } from '../i18n/i18n.jsx'

function complianceTone(score) {
  if (score >= 80) return { pill: 'green', text: 'text-brand-700', bar: 'bg-brand-500', hex: '#16a34a' }
  if (score >= HYGIENE_THRESHOLD) return { pill: 'amber', text: 'text-amber-700', bar: 'bg-amber-500', hex: '#f59e0b' }
  return { pill: 'red', text: 'text-red-700', bar: 'bg-red-500', hex: '#ef4444' }
}

function ChecklistRow({ item, compliant, t }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800/50">
      <span className="text-gray-600 dark:text-gray-400">{t(`hygiene.item.${item.key}`)}</span>
      {compliant ? (
        <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
          <Check size={12} /> {t('hygiene.compliant')}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
          <X size={12} /> {t('hygiene.nonCompliant')}
        </span>
      )}
    </div>
  )
}

export default function WorkerHygiene() {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(null)
  const toggle = (id) => setExpanded((cur) => (cur === id ? null : id))

  const shedsAtRisk = SHED_HYGIENE.filter((s) => s.hygieneAvg !== null && s.hygieneAvg < HYGIENE_THRESHOLD)

  return (
    <div>
      <PageHeader title={t('hygiene.title')} subtitle={t('hygiene.sub')} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          icon={ShieldCheck}
          label={t('hygiene.kpi.avgCompliance')}
          value={`${WORKER_STATS.avgCompliance}%`}
          progress={WORKER_STATS.avgCompliance}
          tone={WORKER_STATS.avgCompliance >= 80 ? 'good' : WORKER_STATS.avgCompliance >= HYGIENE_THRESHOLD ? 'warn' : 'bad'}
        />
        <KpiCard
          icon={Users}
          label={t('hygiene.kpi.totalWorkers')}
          value={WORKERS.length}
          caption={t('hygiene.kpi.totalWorkers.cap')}
          tone="neutral"
        />
        <KpiCard
          icon={AlertTriangle}
          label={t('hygiene.kpi.belowThreshold')}
          value={WORKER_STATS.belowThreshold}
          caption={`< ${HYGIENE_THRESHOLD}%`}
          tone={WORKER_STATS.belowThreshold > 0 ? 'bad' : 'good'}
        />
        <KpiCard
          icon={AlertTriangle}
          label={t('hygiene.kpi.shedsAtRisk')}
          value={WORKER_STATS.shedsAtRiskCount}
          caption={t('hygiene.kpi.shedsAtRisk.cap')}
          tone={WORKER_STATS.shedsAtRiskCount > 0 ? 'warn' : 'good'}
        />
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle>{t('hygiene.trend')}</SectionTitle>
        <TrendChart
          data={HYGIENE_TREND}
          series={[{ key: 'compliance', name: t('hygiene.kpi.avgCompliance'), color: '#16a34a' }]}
          threshold={HYGIENE_THRESHOLD}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        {t('hygiene.insight')}
        {shedsAtRisk.length > 0 && (
          <span className="ml-1 font-medium">
            {t('hygiene.insight.sheds')}: {shedsAtRisk.map((s) => s.name).join(', ')}.
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHED_HYGIENE.map((s) => {
          const tone = complianceTone(s.hygieneAvg ?? 0)
          return (
            <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{s.name}</span>
                <Pill tone={tone.pill}>{s.hygieneAvg ?? '—'}%</Pill>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${s.hygieneAvg ?? 0}%` }} />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{s.workerCount} {t('hygiene.workersInShed')}</p>
            </div>
          )
        })}
      </div>

      <div className="mt-6">
        <SectionTitle>{t('hygiene.workerList')}</SectionTitle>
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
                  <th className="px-4 py-3 font-medium">{t('hygiene.col.worker')}</th>
                  <th className="px-4 py-3 font-medium">{t('hygiene.col.role')}</th>
                  <th className="px-4 py-3 font-medium">{t('hygiene.col.shed')}</th>
                  <th className="px-4 py-3 font-medium">{t('hygiene.col.compliance')}</th>
                  <th className="px-4 py-3 font-medium">{t('hygiene.col.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {WORKERS.map((w) => {
                  const tone = complianceTone(w.complianceScore)
                  const isOpen = expanded === w.id
                  return (
                    <Fragment key={w.id}>
                      <tr className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900 dark:text-gray-100">{w.name}</span>
                          <div className="text-xs text-gray-400">{w.id}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{w.role}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t('hygiene.shedLabel')} {w.shed}</td>
                        <td className="px-4 py-3">
                          <Pill tone={tone.pill}>{w.complianceScore}%</Pill>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggle(w.id)}
                            className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline dark:text-brand-400"
                          >
                            {isOpen ? t('hygiene.hideChecklist') : t('hygiene.viewChecklist')}
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-gray-50/60 dark:bg-gray-800/30">
                          <td colSpan={5} className="px-4 pb-4 pt-1">
                            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                              {w.checklist.map((item) => (
                                <ChecklistRow key={item.key} item={item} compliant={item.compliant} t={t} />
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
            {WORKERS.map((w) => {
              const tone = complianceTone(w.complianceScore)
              const isOpen = expanded === w.id
              return (
                <div key={w.id}>
                  <button
                    onClick={() => toggle(w.id)}
                    className="flex w-full items-center gap-3 p-4 text-left active:bg-gray-50 dark:active:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{w.name}</span>
                        <Pill tone={tone.pill}>{w.complianceScore}%</Pill>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {w.role} · {t('hygiene.shedLabel')} {w.shed} · {w.id}
                      </p>
                    </div>
                    {isOpen ? <ChevronDown size={16} className="text-gray-300 dark:text-gray-600" /> : <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />}
                  </button>
                  {isOpen && (
                    <div className="grid gap-2 px-4 pb-4">
                      {w.checklist.map((item) => (
                        <ChecklistRow key={item.key} item={item} compliant={item.compliant} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
        <AiDisclaimer className="mt-3" />
      </div>
    </div>
  )
}
