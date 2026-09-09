import { Droplets, Activity, Zap, Thermometer, FlaskConical } from 'lucide-react'
import { PageHeader, KpiCard, Card, SectionTitle, AiDisclaimer, AiThinkingDots } from '../components/common/ui.jsx'
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

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        <KpiCard icon={Droplets} label={t('milk.kpi.yield')} value={`${MILK_STATS.avgYield} L`} trend={-6} tone="warn" />
        <KpiCard icon={Activity} label={t('milk.kpi.scc')} value={`${MILK_STATS.avgScc}k`} trend={12} tone="bad" />
        <KpiCard icon={Zap} label={t('milk.kpi.cond')} value={`${MILK_STATS.conductivity} mS`} trend={5} tone="warn" />
        <KpiCard icon={Thermometer} label={t('milk.kpi.temp')} value={`${MILK_STATS.milkTemp}°C`} trend={1} tone="neutral" />
        <KpiCard icon={FlaskConical} label={t('milk.kpi.ph')} value={MILK_STATS.ph} trend={0} tone="neutral" />
      </div>

      <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 md:grid-cols-2">
        {[
          { title: t('milk.kpi.yield'), key: 'yield', color: '#16a34a' },
          { title: t('milk.kpi.scc'), key: 'scc', color: '#f59e0b' },
          { title: t('milk.kpi.cond'), key: 'conductivity', color: '#3b82f6' },
          { title: t('milk.kpi.temp'), key: 'milkTemp', color: '#ef4444' },
        ].map((c) => (
          <Card key={c.key} className="p-4 md:p-5">
            <p className="mb-2 text-sm font-medium text-sand-700 dark:text-sand-300">{c.title}</p>
            <AreaTrend data={MILK_TRENDS[c.key]} dataKey="value" color={c.color} name={c.title} height={190} />
          </Card>
        ))}
      </div>

      <div className="mt-4 md:mt-6 rounded-card border border-amber-200 bg-amber-50 p-3 md:p-4 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
        {t('milk.insight')}
      </div>

      <div className="mt-4 md:mt-6">
        <SectionTitle>{t('milk.abnormal')} <AiThinkingDots /></SectionTitle>
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 bg-sand-50 text-left text-xs uppercase text-sand-500 dark:border-barn-800 dark:bg-barn-800/50 dark:text-sand-400">
                <th className="px-3 py-2 md:px-4 md:py-3 font-medium">{t('animals.col.animal')}</th>
                <th className="px-3 py-2 md:px-4 md:py-3 font-medium">SCC</th>
                <th className="px-3 py-2 md:px-4 md:py-3 font-medium">{t('animals.col.yield')}</th>
                <th className="px-3 py-2 md:px-4 md:py-3 font-medium">{t('env.temp')}</th>
                <th className="px-3 py-2 md:px-4 md:py-3 font-medium">{t('animals.col.risk')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100 dark:divide-barn-800">
              {abnormal.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2.5 md:px-4 md:py-3 font-medium text-sand-900 dark:text-sand-100">{a.id}</td>
                  <td className={`px-3 py-2.5 md:px-4 md:py-3 ${a.scc > 200 ? 'text-red-600 dark:text-red-400' : 'text-sand-600 dark:text-sand-400'}`}>{a.scc}k</td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3 text-sand-600 dark:text-sand-400">{a.milkYield} L</td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3 text-sand-600 dark:text-sand-400">{a.temperature}°C</td>
                  <td className="px-3 py-2.5 md:px-4 md:py-3"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <AiDisclaimer className="mt-2 md:mt-3" />
      </div>
    </div>
  )
}
