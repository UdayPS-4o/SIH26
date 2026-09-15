import { Link } from 'react-router-dom'
import {
  HeartPulse,
  AlertTriangle,
  ShieldCheck,
  Bell,
  Droplets,
  Lightbulb,
  FlaskConical,
  Search,
  BarChart3,
  Radio,
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
import { useTheme } from '../context/ThemeContext.jsx'

import { useAlerts } from '../context/AlertContext.jsx'
import DataFooter from '../components/common/DataFooter.jsx'
import AMRBanner from '../components/shared/AMRBanner'

export default function Dashboard() {
  const { t } = useI18n()
  const { theme } = useTheme()
  const { isReviewed } = useAlerts()
  const dark = theme === 'dark'
  const axisStyle = { fontSize: 11, fill: dark ? '#9099a8' : '#9ca3af' }
  const gridColor = dark ? '#2a2f3a' : '#eef0f2'
  const tooltipStyle = {
    borderRadius: 10,
    border: dark ? '1px solid #374151' : '1px solid #e5e7eb',
    fontSize: 12,
    backgroundColor: dark ? '#111827' : '#fff',
    color: dark ? '#e5e7eb' : '#111827',
  }
  const urgent = ALERTS.filter((a) => a.status === 'open' && !isReviewed(a.id) && !isReviewed(a.animalId)).slice(0, 3)
  const recent = [...ANIMALS].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
  const pct = (n) => Math.round((n / HERD_STATS.totalAnimals) * 100)

  return (
    <div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        {/* ---------------- MAIN COLUMN ---------------- */}
        <div className="space-y-6">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/40 dark:bg-stone-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 font-devanagari">
                  सुप्रभात / Good Morning
                </h1>
                <p className="mt-1 text-lg font-semibold text-stone-700 dark:text-stone-300 font-devanagari">
                  श्री डेरी फार्म, मथुरा
                </p>

                {/* 3 KPI pills */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/40">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-medium text-red-600 dark:text-red-400">आज के अलर्ट / Today's Alerts</p>
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">3 urgent</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/40">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400">समीक्षित नहीं / Not Reviewed</p>
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">2 pending</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 dark:border-red-800 dark:bg-red-950/40">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-medium text-red-600 dark:text-red-400">उच्च जोखिम / High Risk</p>
                      <p className="text-sm font-bold text-red-800 dark:text-red-300">7 animals · ₹1,390/day</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side — Tier Ladder mini-card */}
              <div className="sm:max-w-[280px] rounded-xl border border-amber-200 bg-white p-4 dark:border-amber-800 dark:bg-stone-950">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">🪜 Deployment Tier Ladder</p>
                <div className="mt-2 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="flex-1">Tier 0</span>
                    <span className="font-mono text-[10px] text-gray-500">₹0</span>
                    <span className="text-[10px] text-gray-400">No hardware</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="flex-1">Tier 1</span>
                    <span className="font-mono text-[10px] text-amber-600">₹0</span>
                    <span className="text-[10px] text-amber-500">AMCU data feed ✓</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-70">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="flex-1">Tier 2</span>
                    <span className="font-mono text-[10px] text-gray-500">₹5–27</span>
                    <span className="text-[10px] text-gray-400">Primary hardware</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-70">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="flex-1">Tier 3</span>
                    <span className="font-mono text-[10px] text-gray-500">₹419</span>
                    <span className="text-[10px] text-gray-400">Collar (organised)</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-stone-500">Full village: ₹24/animal · 2,28,374 DCS deployed</p>
              </div>
            </div>
          </div>

          {/* Economic KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-amber-600" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">आज का दुग्ध उत्पादन / Today's Milk Yield</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">1,088 L</p>
              <p className="text-xs text-gray-500">~₹32,640/day @ ₹30/L market rate</p>
            </Card>

            <Card className="border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                <span className="text-xs font-medium text-red-700 dark:text-red-400">जोखिम वाले प्राणी / At-Risk Animals</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">12</p>
              <p className="text-xs text-gray-500">~₹5,472/day at risk if untreated</p>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-950/20">
              <div className="flex items-center gap-2">
                <Droplets size={18} className="text-orange-600" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">बचा हुआ दुग्ध / Milk at Risk This Week</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">~380 L</p>
              <p className="text-xs text-gray-500">~₹11,400/week if uncaught</p>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/20">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">खर्च बचाया / Savings This Week</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">~₹8,200</p>
              <p className="text-xs text-gray-500">5 cases prevented by early alerts</p>
            </Card>
          </div>

          {/* Feature Strip — What Gaurogya Setu Does */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="border-amber-200 bg-white p-3.5 dark:border-amber-900/40 dark:bg-stone-900">
              <Search size={20} className="text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 font-devanagari">पूर्वानुमान</p>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Predict</p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">7-14 दिन पहले चेतावनी</p>
            </Card>
            <Card className="border-amber-200 bg-white p-3.5 dark:border-amber-900/40 dark:bg-stone-900">
              <BarChart3 size={20} className="text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 font-devanagari">व्याख्या</p>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Explain</p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">SHAP top-3 drivers</p>
            </Card>
            <Card className="border-amber-200 bg-white p-3.5 dark:border-amber-900/40 dark:bg-stone-900">
              <HeartPulse size={20} className="text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 font-devanagari">कार्रवाई</p>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Act</p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Intervention templates</p>
            </Card>
            <Card className="border-amber-200 bg-white p-3.5 dark:border-amber-900/40 dark:bg-stone-900">
              <Radio size={20} className="text-amber-700 dark:text-amber-400" />
              <p className="mt-2 text-sm font-semibold text-stone-900 dark:text-stone-100 font-devanagari">निगरानी</p>
              <p className="text-xs font-medium text-stone-600 dark:text-stone-400">Monitor</p>
              <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">Continuous monitoring</p>
            </Card>
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
                  <CartesianGrid stroke={gridColor} vertical={false} />
                  <XAxis dataKey="day" tick={axisStyle} tickLine={false} axisLine={{ stroke: gridColor }} />
                  <YAxis tick={axisStyle} tickLine={false} axisLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip contentStyle={tooltipStyle} />
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
              <SectionTitle right={<Link to="/herd" className="text-xs font-medium text-amber-700 hover:underline">{t('dash.viewDetails')} →</Link>}>
                {t('dash.riskByShed')}
              </SectionTitle>
              <div className="space-y-4">
                {SHEDS.map((s) => (
                  <ShedRiskBar key={s.id} shed={s} />
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <SectionTitle right={<Link to="/animals" className="text-xs font-medium text-amber-700 hover:underline">{t('dash.viewAll')} →</Link>}>
                {t('dash.recentHighRisk')}
              </SectionTitle>
              <RecentHighRiskTable animals={recent} />
            </Card>

            <Card className="p-5">
              <SectionTitle>{t('dash.farmMap')}</SectionTitle>
              <FarmMap />
            </Card>
          </div>

          {/* AMR Stewardship Banner */}
          <AMRBanner />

          {/* Footer */}
          <div className="flex flex-col justify-between gap-1 border-t border-gray-200 pt-4 text-xs text-gray-400 dark:border-gray-800 sm:flex-row">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              {t('dash.systemOnline')} &nbsp;|&nbsp; {t('dash.lastUpdated')}
            </span>
            <span>{t('dash.footer')}</span>
          </div>
        </div>

        {/* ---------------- RIGHT RAIL ---------------- */}
        <div className="flex flex-col gap-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-100 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/30">
              <span className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                <Bell size={16} /> {t('dash.urgentAlerts')}
                <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                  {urgent.length}
                </span>
              </span>
              <Link to="/alerts" className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">{t('dash.viewAll')} →</Link>
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
              <QuickAction icon={HeartPulse} label={t('dash.qa.animals')} to="/animals" />
              <QuickAction icon={Droplets} label={t('dash.qa.milk')} to="/milk-quality" />
              <QuickAction icon={Lightbulb} label={t('dash.qa.recs')} to="/animals/BUF-042" />
              <QuickAction icon={FlaskConical} label={t('dash.qa.sim')} to="/simulator" />
            </div>
          </Card>

          {/* DCS Deployment Count */}
          <div className="flex flex-col justify-between rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/40 dark:bg-stone-900">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Village AMCU Deployment</p>
              <p className="mt-2 text-3xl font-bold text-stone-900 dark:text-stone-100">2,28,374</p>
              <p className="text-xs text-gray-500 mt-1">DCS AMCUs already deployed across India</p>
              <p className="text-[10px] text-gray-400 mt-1">Gaurogya Setu works with existing infrastructure · Tier 0/1 requires zero new hardware</p>
            </div>
          </div>
        </div>
      </div>
      <DataFooter />
    </div>
  )
}
