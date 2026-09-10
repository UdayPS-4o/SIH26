import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, PhoneCall, TrendingUp } from 'lucide-react'
import { PageHeader, Card, SectionTitle, RiskGauge, EmptyState, AiDisclaimer, RiskBadge } from '../components/common/ui.jsx'
import { AreaTrend } from '../components/common/charts.jsx'
import { RiskFactors, HealthTimeline, RecommendationCard } from '../components/shared.jsx'
import { getAnimal, animalTimeSeries, TIMELINE, feedingProfile } from '../data/mockData'
import { predictMastitisRisk } from '../services/predictionService'
import { useI18n } from '../i18n/i18n.jsx'
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
} from 'recharts'
import { useTheme } from '../context/ThemeContext.jsx'

function buildTimeline(animal, liveScore) {
  if (animal.id === 'BUF-042') return TIMELINE
  const t = [{ date: 'Aug 25', label: 'Baseline recorded', tone: 'ok' }]
  if (animal.scc > 150) t.push({ date: 'Aug 29', label: 'SCC trend increased', tone: 'warn' })
  if (animal.milkYield && animal.activity < -4) t.push({ date: 'Sep 02', label: 'Activity decreased', tone: 'warn' })
  if (liveScore >= 45) t.push({ date: 'Sep 08', label: 'Early warning generated', tone: 'alert' })
  t.push({
    date: 'Sep 10',
    label: `Current risk — ${liveScore}%`,
    tone: liveScore >= 70 ? 'alert' : liveScore >= 45 ? 'warn' : 'ok',
  })
  return t
}

/* ---------------- Real Forecast Chart (Item #4) ---------------- */
function ForecastChart({ animal, currentScore }) {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const axisStyle = { fontSize: 11, fill: dark ? '#9099a8' : '#9ca3af' }
  const gridColor = dark ? '#2a2f3a' : '#eef0f2'

  const data = useMemo(() => {
    const list = []
    const dates = [
      '27 Aug', '29 Aug', '31 Aug', '02 Sep', '04 Sep', '06 Sep', '08 Sep', '10 Sep (Today)',
      '+2d', '+4d', '+6d', '+8d (Onset)', '+10d', '+12d', '+14d'
    ]

    // Past 8 points (Observed solid)
    const baseRisk = Math.max(10, currentScore - 30)
    for (let i = 0; i < 8; i++) {
      const p = i / 7
      const val = Math.round(baseRisk + (currentScore - baseRisk) * p)
      list.push({
        date: dates[i],
        observed: val,
        forecast: null,
        ciUpper: null,
        ciLower: null,
      })
    }

    // Connect past to future at Today point
    list[7].forecast = currentScore;
    list[7].ciUpper = currentScore;
    list[7].ciLower = currentScore;

    // Next 7 points (Projected dashed + widening CI)
    const projectedFinal = Math.min(99, Math.round(currentScore * 1.25))
    for (let i = 1; i <= 7; i++) {
      const p = i / 7
      const proj = Math.round(currentScore + (projectedFinal - currentScore) * p)
      const spread = Math.round(i * 3.5) // widening confidence interval band
      list.push({
        date: dates[7 + i],
        observed: null,
        forecast: proj,
        ciUpper: Math.min(99, proj + spread),
        ciLower: Math.max(0, proj - spread),
        ciBand: [Math.max(0, proj - spread), Math.min(99, proj + spread)],
      })
    }

    return list
  }, [currentScore])

  return (
    <Card className="p-5">
      <SectionTitle right={
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <TrendingUp size={14} /> 14-Day Trajectory Forecast
        </span>
      }>
        Mastitis Risk Trajectory & Confidence Band
      </SectionTitle>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke={gridColor} vertical={false} />
          <XAxis dataKey="date" tick={axisStyle} tickLine={false} />
          <YAxis domain={[0, 100]} tick={axisStyle} tickLine={false} unit="%" />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              backgroundColor: dark ? '#111827' : '#fff',
              border: dark ? '1px solid #374151' : '1px solid #e5e7eb',
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />

          {/* Shaded Onset Window (Days 7–14 Projection) */}
          <ReferenceArea x1="10 Sep (Today)" x2="+14d" fill="#f59e0b" fillOpacity={0.08} label={{ value: 'Predicted Risk Window (7-14 Days)', fill: '#d97706', fontSize: 11, position: 'top' }} />

          {/* Widening Confidence Band */}
          <Area type="monotone" dataKey="ciBand" name="95% Confidence Band" fill="#3b82f6" fillOpacity={0.15} stroke="none" />

          {/* Solid Observed Line */}
          <Line type="monotone" dataKey="observed" name="Observed Risk %" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />

          {/* Dashed 14-day Projection Line */}
          <Line type="monotone" dataKey="forecast" name="Projected 14d Forecast" stroke="#ef4444" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  )
}

import { useAlerts } from '../context/AlertContext.jsx'

export default function AnimalDetails() {
  const { id } = useParams()
  const { t } = useI18n()
  const { markReviewed, isReviewed } = useAlerts()
  const reviewed = isReviewed(id)
  const animal = getAnimal(id)

  const prediction = useMemo(() => {
    if (!animal) return null
    const feeding = feedingProfile(animal)
    return predictMastitisRisk({
      scc: animal.scc,
      baselineScc: animal.baselineScc || 150,
      milkYieldChange: -Math.abs(Math.round((1 - animal.milkYield / (animal.milkYield * 1.12)) * 100)),
      activityChange: animal.activity,
      ruminationChange: animal.rumination,
      temperature: animal.temperature,
      conductivity: animal.conductivity || 5.4,
      ph: animal.ph || 6.7,
      humidity: 78,
      previousMastitis: animal.previousMastitis,
      feedingQuality: feeding.feedingScore,
      housingQuality: feeding.housingScore,
    })
  }, [animal])

  const ts = useMemo(() => (animal ? animalTimeSeries(animal) : null), [animal])

  if (!animal) {
    return (
      <div>
        <PageHeader title="Animal not found" />
        <EmptyState title={`No animal with ID "${id}"`} hint="Return to the animals list." />
        <Link to="/animals" className="btn-ghost mt-4">{t('detail.back')}</Link>
      </div>
    )
  }

  const liveScore = prediction.riskScore
  const liveLevel = prediction.riskLevel
  const feeding = feedingProfile(animal)
  const factorRows = [
    { key: 'SCC', label: 'SCC Baseline Ratio', delta: `${animal.scc}k (${Math.round((animal.scc / (animal.baselineScc || 150)) * 100)}% of base)`, value: Math.max(1, animal.scc) },
    { key: 'Conductivity', label: 'Electrical Conductivity', delta: `${(animal.conductivity || 5.4).toFixed(1)} mS/cm`, value: (animal.conductivity || 5.4) * 15 },
    { key: 'Milk Yield', label: 'Milk Yield Decline', delta: '-12%', value: 60 },
    { key: 'Activity', label: 'Activity Change', delta: `${animal.activity}%`, value: Math.abs(animal.activity) * 5 },
    { key: 'Rumination', label: 'Rumination Change', delta: `${animal.rumination}%`, value: Math.abs(animal.rumination) * 5 },
    { key: 'Udder Temp', label: 'Udder Temperature', delta: `${animal.temperature.toFixed(1)}°C`, value: (animal.temperature - 38.5) * 60 },
    { key: 'Nutrition', label: t('factor.nutrition'), delta: `${feeding.feedingScore}/100`, value: Math.max(1, 100 - feeding.feedingScore) },
    { key: 'Housing', label: t('factor.housing'), delta: `${feeding.housingScore}/100`, value: Math.max(1, 100 - feeding.housingScore) },
  ]

  const charts = [
    { title: t('animals.col.yield'), key: 'milkYield', color: '#16a34a', data: ts.milkYield },
    { title: 'SCC (cells/mL)', key: 'scc', color: '#f59e0b', data: ts.scc },
    { title: t('animals.col.activity'), key: 'activity', color: '#3b82f6', data: ts.activity },
    { title: 'Rumination', key: 'rumination', color: '#8b5cf6', data: ts.rumination },
    { title: t('env.temp'), key: 'temperature', color: '#ef4444', data: ts.temperature },
  ]

  return (
    <div>
      <Link to="/animals" className="mb-3 md:mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-sand-500 hover:text-sand-800">
        <ArrowLeft size={15} /> {t('detail.back')}
      </Link>

      {/* Hero */}
      <Card className="mb-4 md:mb-6 overflow-hidden">
        <div className="grid gap-4 md:gap-6 p-4 md:p-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{animal.id}</h1>
              <RiskBadge level={liveLevel} score={liveScore} />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {animal.name} · {animal.breed} {t(`species.${animal.species.toLowerCase()}`)} · {animal.age} years · Lactation {animal.lactation} · {t(`shed.${animal.shed}`)}
            </p>

            <div className="mt-4 md:mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat label={t('animals.col.yield')} value={`${animal.milkYield} L`} />
              <MiniStat label="SCC / Baseline" value={`${animal.scc}k / ${animal.baselineScc || 150}k`} />
              <MiniStat label="Conductivity" value={`${(animal.conductivity || 5.4).toFixed(1)} mS/cm`} />
              <MiniStat label={t('common.riskWindow')} value={prediction.predictionWindow} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => markReviewed(id)} disabled={reviewed}>
                <CheckCircle2 size={15} /> {reviewed ? t('detail.reviewed') : t('detail.markReviewed')}
              </button>
              <button className="btn-ghost">
                <PhoneCall size={15} /> {t('detail.contactVet')}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-5 dark:bg-gray-800/60">
            <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t('detail.risk')}</span>
            <RiskGauge score={liveScore} />
          </div>
        </div>
      </Card>

      {/* Real Forecast Chart (Item #4) */}
      <div className="mb-6">
        <ForecastChart animal={animal} currentScore={liveScore} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Why at risk */}
        <Card className="p-4 md:p-5 lg:col-span-2">
          <SectionTitle>{t('detail.why')}</SectionTitle>
          <RiskFactors factors={factorRows} />
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900 dark:bg-brand-900/20 dark:text-brand-200">
            The current risk score is primarily driven by per-animal baseline deviation in SCC, electrical conductivity spikes, and
            behavioural changes.
          </p>
          <AiDisclaimer className="mt-2 md:mt-3" />
        </Card>

        {/* Timeline */}
        <Card className="p-4 md:p-5">
          <SectionTitle>{t('detail.timeline')}</SectionTitle>
          <HealthTimeline items={buildTimeline(animal, liveScore)} />
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-4 md:mt-6">
        <SectionTitle>{t('detail.charts')}</SectionTitle>
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((c) => (
            <Card key={c.key} className="p-4 md:p-5">
              <p className="mb-2 text-sm font-medium text-sand-700 dark:text-sand-300">{c.title}</p>
              <AreaTrend data={c.data} dataKey="value" color={c.color} name={c.title} height={170} />
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4 md:mt-6">
        <SectionTitle>{t('detail.recs')}</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {prediction.recommendations.map((r, i) => (
            <RecommendationCard key={r.title} rec={r} index={i} />
          ))}
        </div>
        <p className="mt-2 md:mt-3 text-xs text-sand-400 dark:text-sand-500">
          Recommendations are preventive guidance only. This prototype does not prescribe medicines or dosages.
        </p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-card border border-sand-200 p-3 dark:border-barn-800">
      <p className="text-xs text-sand-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-sand-900 dark:text-sand-100">{value}</p>
    </div>
  )
}

