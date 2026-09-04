import { Link } from 'react-router-dom'
import { Network, AlertTriangle, ShieldAlert, MapPin, Flame } from 'lucide-react'
import { PageHeader, KpiCard, Card, SectionTitle, AiDisclaimer } from '../components/common/ui.jsx'
import { TrendChart } from '../components/common/charts.jsx'
import { ShedRiskBar, ShedRiskCard } from '../components/shared.jsx'
import { SHEDS, HERD_RISK_TREND, HERD_STATS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

export default function HerdIntelligence() {
  const { t } = useI18n()

  return (
    <div>
      <PageHeader title={t('herd.title')} subtitle={t('herd.sub')} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={Network} label={t('herd.kpi.risk')} value={`${HERD_STATS.herdRisk}%`} trend={14} tone="warn" trendLabel="7-day change" />
        <KpiCard icon={AlertTriangle} label={t('herd.kpi.atRisk')} value={HERD_STATS.atRisk} trend={9} tone="warn" />
        <KpiCard icon={ShieldAlert} label={t('herd.kpi.high')} value={HERD_STATS.highRisk} trend={16} tone="bad" />
        <KpiCard icon={MapPin} label={t('herd.kpi.shed')} value="Shed C" trend={22} tone="bad" trendLabel="71% risk" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <SectionTitle>{t('herd.byShed')}</SectionTitle>
          <div className="space-y-4">
            {SHEDS.map((s) => (
              <ShedRiskBar key={s.id} shed={s} />
            ))}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <SectionTitle>{t('herd.trend')}</SectionTitle>
          <TrendChart
            data={HERD_RISK_TREND}
            threshold={45}
            series={[
              { key: 'herdRisk', name: 'Herd Risk %', color: '#16a34a' },
              { key: 'avgScc', name: 'Avg SCC', color: '#f59e0b', axis: 'right' },
            ]}
          />
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle>{t('herd.cluster')}</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHEDS.map((s) => (
            <ShedRiskCard key={s.id} shed={s} />
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
            <Flame size={17} />
          </span>
          <div>
            <p className="text-sm font-semibold text-red-800 dark:text-red-400">{t('herd.hotspot')}</p>
            <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">
              3 animals in Shed C exceed the risk threshold. Combined with rising humidity and poor bedding hygiene,
              this cluster is the top intervention priority.
            </p>
            <Link to="/animals?shed=C" className="mt-2 inline-block text-xs font-medium text-red-800 underline dark:text-red-400">
              Review Shed C animals
            </Link>
          </div>
        </div>
        <AiDisclaimer className="mt-3" />
      </div>
    </div>
  )
}
