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

      <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="p-4 md:p-5 lg:col-span-2">
          <SectionTitle>{t('reports.weekly')}</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fig label={t('dash.kpi.total')} value={HERD_STATS.totalAnimals} />
            <Fig label={t('dash.kpi.healthy')} value={HERD_STATS.healthy} />
            <Fig label={t('dash.kpi.atRisk')} value={HERD_STATS.atRisk} />
            <Fig label={t('dash.kpi.highRisk')} value={HERD_STATS.highRisk} />
          </div>
          <p className="mt-3 md:mt-4 text-sm text-sand-600 dark:text-sand-400">
            Herd mastitis risk rose to {HERD_STATS.herdRisk}% this week (+14% over 7 days), driven by Shed C.
            {' '}{highRisk.length} animals require intervention within 48 hours.
          </p>
        </Card>

        <Card className="p-4 md:p-5">
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

      <Card className="mt-4 md:mt-6 p-4 md:p-5">
        <SectionTitle>{t('reports.riskTrend')}</SectionTitle>
        <TrendChart
          data={HERD_RISK_TREND}
          threshold={45}
          series={[{ key: 'herdRisk', name: 'Herd Risk %', color: '#16a34a' }]}
          height={220}
        />
      </Card>

      <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 lg:grid-cols-3">
        <Card className="p-4 md:p-5 lg:col-span-2">
          <SectionTitle>{t('reports.highRisk')}</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase text-sand-500 dark:border-barn-800 dark:text-sand-400">
                  <th className="py-2 pr-3 md:py-2 md:pr-4 font-medium">{t('animals.col.animal')}</th>
                  <th className="py-2 pr-3 md:py-2 md:pr-4 font-medium">{t('animals.col.breed')}</th>
                  <th className="py-2 pr-3 md:py-2 md:pr-4 font-medium">Shed</th>
                  <th className="py-2 font-medium">{t('animals.col.risk')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100 dark:divide-barn-800">
                {highRisk.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3 md:py-2 md:pr-4 font-medium text-sand-900 dark:text-sand-100">{a.id}</td>
                    <td className="py-2 pr-3 md:py-2 md:pr-4 text-sand-600 dark:text-sand-400">{a.breed}</td>
                    <td className="py-2 pr-3 md:py-2 md:pr-4 text-sand-600 dark:text-sand-400">{a.shed}</td>
                    <td className="py-2"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4 md:space-y-6">
          <Card className="p-4 md:p-5">
            <SectionTitle>{t('reports.milk')}</SectionTitle>
            <dl className="space-y-2 text-sm">
              <Row k={t('milk.kpi.yield')} v={`${MILK_STATS.avgYield} L`} />
              <Row k={t('milk.kpi.scc')} v={`${MILK_STATS.avgScc}k`} />
              <Row k={t('milk.kpi.cond')} v={`${MILK_STATS.conductivity} mS`} />
              <Row k={t('milk.kpi.ph')} v={MILK_STATS.ph} />
            </dl>
          </Card>

          {/* Fabricated: Cost Savings Calculator */}
          <Card className="p-4 md:p-5">
            <SectionTitle>Estimated Cost Savings</SectionTitle>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-sand-600 dark:text-sand-400">Avg. daily yield loss per high-risk animal</span>
                <span className="font-semibold text-sand-900 dark:text-sand-100">~2.1 L/day</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sand-600 dark:text-sand-400">Milk price (avg.)</span>
                <span className="font-semibold text-sand-900 dark:text-sand-100">₹32/L</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sand-600 dark:text-sand-400">Early detection window</span>
                <span className="font-semibold text-forest-600 dark:text-forest-400">7–14 days</span>
              </div>
              {(() => {
                const savings = highRisk.length * 2.1 * 32 * 10
                return (
                <div className="mt-3 rounded-lg border border-forest-200 bg-forest-50 p-3 dark:border-forest-900/40 dark:bg-forest-950/20">
                  <p className="text-xs text-forest-700 dark:text-forest-400">By flagging {highRisk.length} animals early, estimated savings this cycle:</p>
                  <p className="mt-1 text-lg font-bold text-forest-700 dark:text-forest-400">₹{savings.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-forest-600 dark:text-forest-500">Based on 10-day early intervention vs. clinical onset</p>
                </div>
                )
              })()}
            </div>
          </Card>

          <Card className="p-4 md:p-5">
            <SectionTitle>{t('reports.intervention')}</SectionTitle>
            <ul className="space-y-1.5 text-sm text-sand-600 dark:text-sand-400">
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
    <div className="rounded-card border border-sand-200 p-3 dark:border-barn-700">
      <p className="text-lg md:text-xl font-semibold text-sand-900 dark:text-sand-100">{value}</p>
      <p className="text-xs text-sand-400">{label}</p>
    </div>
  )
}
function Row({ k, v }) {
  return (
    <div className="flex justify-between">
      <dt className="text-sand-500 dark:text-sand-400">{k}</dt>
      <dd className="font-medium text-sand-900 dark:text-sand-100">{v}</dd>
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
