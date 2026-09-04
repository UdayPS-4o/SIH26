import { Download, Printer } from 'lucide-react'
import { PageHeader, Card, SectionTitle } from '../components/common/ui.jsx'
import { TrendChart } from '../components/common/charts.jsx'
import { RiskBadge } from '../components/common/ui.jsx'
import { HERD_STATS, HERD_RISK_TREND, ANIMALS, MILK_STATS, ENV_NOW } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

export default function Reports() {
  const { t } = useI18n()
  const highRisk = ANIMALS.filter((a) => a.riskLevel === 'HIGH' || a.riskScore >= 60).sort((a, b) => b.riskScore - a.riskScore)

  const summary = {
    generated: new Date().toISOString(),
    farm: 'Shree Dairy Farm',
    herd: HERD_STATS,
    milk: MILK_STATS,
    environment: ENV_NOW,
    highRiskAnimals: highRisk.map((a) => ({ id: a.id, breed: a.breed, riskScore: a.riskScore, shed: a.shed })),
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: 'application/json' })
    triggerDownload(blob, 'gaurogya-setu-weekly-report.json')
  }

  const exportCsv = () => {
    const rows = [
      ['Animal', 'Breed', 'Shed', 'Risk Score', 'Risk Level'],
      ...highRisk.map((a) => [a.id, a.breed, a.shed, a.riskScore, a.riskLevel]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    triggerDownload(new Blob([csv], { type: 'text/csv' }), 'gaurogya-setu-high-risk-animals.csv')
  }

  return (
    <div>
      <PageHeader
        title={t('reports.title')}
        subtitle={t('reports.sub')}
        actions={
          <>
            <button className="btn-ghost" onClick={exportCsv}><Download size={14} /> CSV</button>
            <button className="btn-primary" onClick={exportJson}><Download size={14} /> {t('reports.export')}</button>
            <button className="btn-ghost" onClick={() => window.print()}><Printer size={14} /> {t('reports.print')}</button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>{t('reports.weekly')}</SectionTitle>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fig label={t('dash.kpi.total')} value={HERD_STATS.totalAnimals} />
            <Fig label={t('dash.kpi.healthy')} value={HERD_STATS.healthy} />
            <Fig label={t('dash.kpi.atRisk')} value={HERD_STATS.atRisk} />
            <Fig label={t('dash.kpi.highRisk')} value={HERD_STATS.highRisk} />
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Herd mastitis risk rose to {HERD_STATS.herdRisk}% this week (+14% over 7 days), driven by Shed C.
            {' '}{highRisk.length} animals require intervention within 48 hours.
          </p>
        </Card>

        <Card className="p-5">
          <SectionTitle>{t('reports.env')}</SectionTitle>
          <dl className="space-y-2 text-sm">
            <Row k={t('env.temp')} v={`${ENV_NOW.temperature}°C`} />
            <Row k={t('env.humidity')} v={`${ENV_NOW.humidity}%`} />
            <Row k={t('env.bedding')} v={ENV_NOW.bedding} />
            <Row k={t('env.milkingHyg')} v={ENV_NOW.milkingHygiene} />
            <Row k={t('env.water')} v={ENV_NOW.water} />
          </dl>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle>{t('reports.riskTrend')}</SectionTitle>
        <TrendChart
          data={HERD_RISK_TREND}
          threshold={45}
          series={[{ key: 'herdRisk', name: 'Herd Risk %', color: '#16a34a' }]}
          height={220}
        />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>{t('reports.highRisk')}</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  <th className="py-2 pr-4 font-medium">{t('animals.col.animal')}</th>
                  <th className="py-2 pr-4 font-medium">{t('animals.col.breed')}</th>
                  <th className="py-2 pr-4 font-medium">Shed</th>
                  <th className="py-2 font-medium">{t('animals.col.risk')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {highRisk.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-gray-100">{a.id}</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{a.breed}</td>
                    <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{a.shed}</td>
                    <td className="py-2"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle>{t('reports.milk')}</SectionTitle>
            <dl className="space-y-2 text-sm">
              <Row k={t('milk.kpi.yield')} v={`${MILK_STATS.avgYield} L`} />
              <Row k={t('milk.kpi.scc')} v={`${MILK_STATS.avgScc}k`} />
              <Row k={t('milk.kpi.cond')} v={`${MILK_STATS.conductivity} mS`} />
              <Row k={t('milk.kpi.ph')} v={MILK_STATS.ph} />
            </dl>
          </Card>
          <Card className="p-5">
            <SectionTitle>{t('reports.intervention')}</SectionTitle>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li>• 4 udder inspections completed</li>
              <li>• 6 SCC / CMT tests performed</li>
              <li>• 2 animals segregated at milking</li>
              <li>• Bedding replaced in Shed C</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

function Fig({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}
function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500 dark:text-gray-400">{k}</dt>
      <dd className="font-medium text-gray-900 dark:text-gray-100">{v}</dd>
    </div>
  )
}
function triggerDownload(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
