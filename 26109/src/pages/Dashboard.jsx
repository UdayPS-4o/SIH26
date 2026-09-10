import { useMemo, useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Beef,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Hand,
  Radio,
  Thermometer,
  Activity,
  Waves,
  ArrowRight,
} from 'lucide-react'
import { KpiCard, Card, SectionTitle, AiThinkingDots } from '../components/common/ui.jsx'
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
} from '../components/shared.jsx'
import { HERD_STATS, RISK_DISTRIBUTION, DASH_TREND, ALERTS, SHEDS, ANIMALS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import heroCow from '../assets/hero-section.png'

import { useAlerts } from '../context/AlertContext.jsx'

export default function Dashboard() {
  const { t } = useI18n()
  const { theme } = useTheme()
  const { isReviewed } = useAlerts()
  const dark = theme === 'dark'
  const axisStyle = { fontSize: 10, fill: dark ? '#9099a8' : '#9ca3af' }
  const gridColor = dark ? '#3a3028' : '#e8dfd0'
  const tooltipStyle = {
    borderRadius: 8,
    border: dark ? '1px solid #453018' : '1px solid #e8dfd0',
    fontSize: 11,
    backgroundColor: dark ? '#2d241b' : '#fffdf5',
    color: dark ? '#f5efe0' : '#2d241b',
  }
  const urgent = ALERTS.filter((a) => a.status === 'open' && !isReviewed(a.id) && !isReviewed(a.animalId)).slice(0, 3)
  const recent = [...ANIMALS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
  const pct = (n) => Math.round((n / HERD_STATS.totalAnimals) * 100)

  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  if (loading) return <DashboardShimmer />

  return (
    <div className="space-y-3 md:space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-xl border border-honey-300/40 bg-gradient-to-r from-white via-honey-50/30 to-sand-50 p-4 dark:border-barn-800 dark:from-barn-900 dark:via-barn-900 dark:to-barn-950 md:p-6 hero-gradient-border">
        <img src={heroCow} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover object-left opacity-40 md:opacity-50" />
        <div
          className="absolute inset-0 bg-white dark:bg-barn-900"
          style={{
            maskImage: 'linear-gradient(to right, black 0%, black 30%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.5) 52%, rgba(0,0,0,0.15) 64%, transparent 75%)',
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 30%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.5) 52%, rgba(0,0,0,0.15) 64%, transparent 75%)',
          }}
        />
        <div className="relative z-10 flex flex-col gap-2.5 sm:flex-row sm:items-center md:gap-4">
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-xl font-bold text-sand-900 dark:text-sand-100 md:text-2xl">
              {t('dash.greeting')} <Hand size={20} className="text-honey-500 md:hidden" />
            </h1>
            <p className="mt-0.5 text-xs text-sand-500 dark:text-sand-400 md:text-sm">{t('dash.sub')}</p>
          </div>
          <div className="flex items-start gap-2.5 rounded-xl border border-honey-200 bg-white/90 backdrop-blur p-2.5 shadow-sm sm:max-w-[200px] md:max-w-[230px] dark:border-barn-800 dark:bg-barn-950/90">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-400">
              <ShieldCheck size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold text-sand-900 dark:text-sand-100 md:text-sm">{t('dash.hero.ew.title')}</p>
              <p className="mt-0.5 text-[11px] text-sand-500 dark:text-sand-400 md:text-xs">{t('dash.hero.ew.sub')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Predictive Alert Banner */}
      <Link to="/animals" className="block">
        <div className="animate-pulse-soft-slow group relative overflow-hidden rounded-xl border border-honey-300/60 bg-gradient-to-r from-honey-50 via-white to-sand-50 p-3 dark:border-honey-700/40 dark:from-barn-900 dark:via-barn-900 dark:to-barn-950 md:p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-honey-100 text-honey-700 dark:bg-honey-900/40 dark:text-honey-300">
              <Activity size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-sand-900 dark:text-sand-100">
                AI predicts <span className="text-honey-700 dark:text-honey-400">3 animals at risk</span> in the next 48 hours
              </p>
              <p className="mt-0.5 text-[11px] text-sand-500 dark:text-sand-400">
                BUF-042 (87%), BUF-015 (72%), BUF-033 (65%) — early indicators detected · <span className="inline-flex items-center gap-1 font-medium text-forest-700 dark:text-forest-400 group-hover:underline">View Details <ArrowRight size={11} /></span>
              </p>
            </div>
            <span className="hidden shrink-0 rounded-full bg-honey-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-honey-700 dark:bg-honey-900/30 dark:text-honey-400 sm:block">
              AI PREDICTION
            </span>
          </div>
        </div>
      </Link>

      {/* KPI cards with Feature 6 animated counters */}
      <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={Beef}
          tone="info"
          label={t('dash.kpi.total')}
          value={<AnimatedCounter target={HERD_STATS.totalAnimals} />}
          trend={1}
          trendLabel={`↑ ${t('dash.kpi.total.cap')}`}
        />
        <KpiCard
          icon={HeartPulse}
          tone="good"
          label={t('dash.kpi.healthy')}
          value={<AnimatedCounter target={HERD_STATS.healthy} />}
          caption={`${pct(HERD_STATS.healthy)}% ${t('dash.kpi.ofTotal')}`}
          progress={pct(HERD_STATS.healthy)}
        />
        <KpiCard
          icon={AlertTriangle}
          tone="warn"
          label={t('dash.kpi.atRisk')}
          value={<AnimatedCounter target={HERD_STATS.atRisk} />}
          caption={`${pct(HERD_STATS.atRisk)}% ${t('dash.kpi.ofTotal')}`}
          progress={pct(HERD_STATS.atRisk) * 3}
        />
        <KpiCard
          icon={ShieldAlert}
          tone="bad"
          label={t('dash.kpi.highRisk')}
          value={<AnimatedCounter target={HERD_STATS.highRisk} />}
          caption={`${pct(HERD_STATS.highRisk)}% ${t('dash.kpi.ofTotal')}`}
          progress={pct(HERD_STATS.highRisk) * 3}
        />
      </div>

      {/* Distribution + Trend + Live Sensor Feed (Feature 1) */}
      <div className="grid gap-3 md:gap-6 lg:grid-cols-3">
        <Card className="p-3 md:p-5">
          <SectionTitle>{t('dash.riskDist')}</SectionTitle>
          <RiskDistribution data={RISK_DISTRIBUTION} centerLabel={`${HERD_STATS.totalAnimals}`} centerSub={t('nav.animals')} />
        </Card>

        <Card className="p-3 md:p-5">
          <SectionTitle>{t('dash.trend')}</SectionTitle>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={DASH_TREND} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid stroke={gridColor} vertical={false} />
              <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={{ stroke: gridColor }} />
              <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="herdRisk" name={t('dash.trend.herdRisk')} stroke="#3B9EFF" strokeWidth={2} dot={{ r: 2.5 }} />
              <Line type="monotone" dataKey="highRiskAnimals" name={t('dash.trend.highRiskAnimals')} stroke="#ef4444" strokeWidth={2} dot={{ r: 2.5 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Feature 1: Live Sensor Feed */}
        <Card className="p-3 md:p-5">
          <SectionTitle
            right={
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-forest-600 dark:text-forest-400">
                <Radio size={10} className="animate-pulse" /> Live
              </span>
            }
          >
            <span className="flex items-center gap-1.5">
              <Waves size={12} className="text-ai" />
              Live Sensor Feed
            </span>
          </SectionTitle>
          <LiveSensorFeed />
        </Card>
      </div>

      {/* Bottom row: shed / recent / map */}
      <div className="grid gap-3 md:gap-6 lg:grid-cols-3">
        <Card className="p-3 md:p-5">
          <SectionTitle right={<Link to="/herd" className="text-xs font-medium text-honey-600 hover:underline">{t('dash.viewDetails')} →</Link>}>
            {t('dash.riskByShed')}
          </SectionTitle>
          <div className="space-y-2.5">
            {SHEDS.map((s) => (
              <ShedRiskBar key={s.id} shed={s} />
            ))}
          </div>
        </Card>

        <Card className="p-3 md:p-5">
          <SectionTitle right={<Link to="/animals" className="text-xs font-medium text-honey-600 hover:underline">{t('dash.viewAll')} →</Link>}>
            {t('dash.recentHighRisk')}
          </SectionTitle>
          <RecentHighRiskTable animals={recent} />
        </Card>

        <Card className="p-3 md:p-5">
          <SectionTitle>{t('dash.farmMap')}</SectionTitle>
          <FarmMap />
        </Card>
      </div>

      {/* Footer */}
      <div className="flex flex-col justify-between gap-0.5 border-t border-sand-200 pt-2.5 text-[11px] text-sand-400 dark:border-barn-800 sm:flex-row">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-forest-500 animate-pulse-soft" />
          {t('dash.systemOnline')} &nbsp;|&nbsp; {t('dash.lastUpdated')}
        </span>
        <span>{t('dash.footer')}</span>
      </div>
    </div>
  )
}
