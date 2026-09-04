import { Link } from 'react-router-dom'
import {
  Beef,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Bell,
  Droplets,
  Lightbulb,
  FlaskConical,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { KpiCard, Card, SectionTitle } from '../components/common/ui.jsx'
import { RiskDistribution } from '../components/common/charts.jsx'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import {
  ShedRiskBar,
  RecentHighRiskTable,
  FarmMap,
  UrgentAlertItem,
  QuickAction,
} from '../components/shared.jsx'
import { HERD_STATS, RISK_DISTRIBUTION, DASH_TREND, ALERTS, SHEDS, ANIMALS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'
import heroCow from '../assets/hero-section.png'

export default function Dashboard() {
  const { t } = useI18n()
  const urgent = ALERTS.filter((a) => a.status === 'open').slice(0, 3)
  const recent = [...ANIMALS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
  const pct = (n) => Math.round((n / HERD_STATS.totalAnimals) * 100)

  return (
    <div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ---------------- MAIN COLUMN ---------------- */}
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6">
            <img src={heroCow} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover object-left [mask-image:linear-gradient(to_right,transparent,black_20%)]" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('dash.greeting')} <span className="align-middle">👋</span>
                </h1>
                <p className="mt-1 text-sm text-gray-500">{t('dash.sub')}</p>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white/90 backdrop-blur p-3.5 shadow-sm sm:max-w-[230px]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-100 text-brand-700">
                  <ShieldCheck size={17} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t('dash.hero.ew.title')}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{t('dash.hero.ew.sub')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              icon={Beef}
              tone="info"
              label={t('dash.kpi.total')}
              value={HERD_STATS.totalAnimals}
              trend={1}
              trendLabel={`↑ ${t('dash.kpi.total.cap')}`}
            />
            <KpiCard
              icon={HeartPulse}
              tone="good"
              label={t('dash.kpi.healthy')}
              value={HERD_STATS.healthy}
              caption={`${pct(HERD_STATS.healthy)}% ${t('dash.kpi.ofTotal')}`}
              progress={pct(HERD_STATS.healthy)}
            />
            <KpiCard
              icon={AlertTriangle}
              tone="warn"
              label={t('dash.kpi.atRisk')}
              value={HERD_STATS.atRisk}
              caption={`${pct(HERD_STATS.atRisk)}% ${t('dash.kpi.ofTotal')}`}
              progress={pct(HERD_STATS.atRisk) * 3}
            />
            <KpiCard
              icon={ShieldAlert}
              tone="bad"
              label={t('dash.kpi.highRisk')}
              value={HERD_STATS.highRisk}
              caption={`${pct(HERD_STATS.highRisk)}% ${t('dash.kpi.ofTotal')}`}
              progress={pct(HERD_STATS.highRisk) * 3}
            />
          </div>

          {/* Distribution + Trend */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <SectionTitle>{t('dash.riskDist')}</SectionTitle>
              <RiskDistribution data={RISK_DISTRIBUTION} centerLabel={`${HERD_STATS.totalAnimals}`} centerSub={t('nav.animals')} />
            </Card>

            <Card className="p-5">
              <SectionTitle>{t('dash.trend')}</SectionTitle>
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={DASH_TREND} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#eef0f2" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#eef0f2' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5e7eb', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="herdRisk" name={t('dash.trend.herdRisk')} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="highRiskAnimals" name={t('dash.trend.highRiskAnimals')} stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Bottom row: shed / recent / map */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="p-5">
              <SectionTitle right={<Link to="/herd" className="text-xs font-medium text-brand-700 hover:underline">{t('dash.viewDetails')} →</Link>}>
                {t('dash.riskByShed')}
              </SectionTitle>
              <div className="space-y-4">
                {SHEDS.map((s) => (
                  <ShedRiskBar key={s.id} shed={s} />
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle right={<Link to="/animals" className="text-xs font-medium text-brand-700 hover:underline">{t('dash.viewAll')} →</Link>}>
                {t('dash.recentHighRisk')}
              </SectionTitle>
              <RecentHighRiskTable animals={recent} />
            </Card>

            <Card className="p-5">
              <SectionTitle>{t('dash.farmMap')}</SectionTitle>
              <FarmMap />
            </Card>
          </div>

          {/* Footer */}
          <div className="flex flex-col justify-between gap-1 border-t border-gray-200 pt-4 text-xs text-gray-400 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-500" />
              {t('dash.systemOnline')} &nbsp;|&nbsp; {t('dash.lastUpdated')}
            </span>
            <span>{t('dash.footer')}</span>
          </div>
        </div>

        {/* ---------------- RIGHT RAIL ---------------- */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-semibold text-red-700">
                <Bell size={16} /> {t('dash.urgentAlerts')}
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {urgent.length}
                </span>
              </span>
              <Link to="/alerts" className="text-xs font-medium text-red-600 hover:underline">{t('dash.viewAll')} →</Link>
            </div>
            <div className="px-4 py-2">
              {urgent.map((a) => (
                <UrgentAlertItem key={a.id} alert={a} />
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>{t('dash.quickActions')}</SectionTitle>
            <div className="space-y-2.5">
              <QuickAction icon={Beef} label={t('dash.qa.animals')} to="/animals" />
              <QuickAction icon={Droplets} label={t('dash.qa.milk')} to="/milk-quality" />
              <QuickAction icon={Lightbulb} label={t('dash.qa.recs')} to="/animals/BUF-042" />
              <QuickAction icon={FlaskConical} label={t('dash.qa.sim')} to="/simulator" />
            </div>
          </Card>

          <div className="rounded-xl border border-brand-200 bg-brand-50 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Sparkles size={16} /> {t('dash.aiInsight')}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-brand-800/90">{t('dash.aiInsight.body')}</p>
            <Link to="/herd" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
              {t('common.viewShed')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
