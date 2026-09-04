import { Droplets, Activity, Zap, Thermometer, FlaskConical } from 'lucide-react'
import { PageHeader, KpiCard, Card, SectionTitle, AiDisclaimer } from '../components/common/ui.jsx'
import { AreaTrend } from '../components/common/charts.jsx'
import { RiskBadge } from '../components/common/ui.jsx'
import { MILK_STATS, MILK_TRENDS, ANIMALS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

export default function MilkQuality() {
  const { t } = useI18n()
  const abnormal = ANIMALS.filter((a) => a.scc > 200 || a.milkYield < 6).slice(0, 6)

  return (
    <div>
      <PageHeader title={t('milk.title')} subtitle={t('milk.sub')} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard icon={Droplets} label={t('milk.kpi.yield')} value={`${MILK_STATS.avgYield} L`} trend={-6} tone="warn" />
        <KpiCard icon={Activity} label={t('milk.kpi.scc')} value={`${MILK_STATS.avgScc}k`} trend={12} tone="bad" />
        <KpiCard icon={Zap} label={t('milk.kpi.cond')} value={`${MILK_STATS.conductivity} mS`} trend={5} tone="warn" />
        <KpiCard icon={Thermometer} label={t('milk.kpi.temp')} value={`${MILK_STATS.milkTemp}°C`} trend={1} tone="neutral" />
        <KpiCard icon={FlaskConical} label={t('milk.kpi.ph')} value={MILK_STATS.ph} trend={0} tone="neutral" />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {[
          { title: t('milk.kpi.yield'), key: 'yield', color: '#16a34a' },
          { title: t('milk.kpi.scc'), key: 'scc', color: '#f59e0b' },
          { title: t('milk.kpi.cond'), key: 'conductivity', color: '#3b82f6' },
          { title: t('milk.kpi.temp'), key: 'milkTemp', color: '#ef4444' },
        ].map((c) => (
          <Card key={c.key} className="p-5">
            <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">{c.title}</p>
            <AreaTrend data={MILK_TRENDS[c.key]} dataKey="value" color={c.color} name={c.title} height={190} />
          </Card>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
        {t('milk.insight')}
      </div>

      <div className="mt-6">
        <SectionTitle>{t('milk.abnormal')}</SectionTitle>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase text-gray-500 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-400">
                <th className="px-4 py-3 font-medium">{t('animals.col.animal')}</th>
                <th className="px-4 py-3 font-medium">SCC</th>
                <th className="px-4 py-3 font-medium">{t('animals.col.yield')}</th>
                <th className="px-4 py-3 font-medium">{t('env.temp')}</th>
                <th className="px-4 py-3 font-medium">{t('animals.col.risk')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {abnormal.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{a.id}</td>
                  <td className={`px-4 py-3 ${a.scc > 200 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{a.scc}k</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.milkYield} L</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.temperature}°C</td>
                  <td className="px-4 py-3"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <AiDisclaimer className="mt-3" />
      </div>
    </div>
  )
}
