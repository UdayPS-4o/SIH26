import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, PhoneCall } from 'lucide-react'
import { PageHeader, Card, SectionTitle, RiskGauge, EmptyState, AiDisclaimer, RiskBadge } from '../components/common/ui.jsx'
import { AreaTrend } from '../components/common/charts.jsx'
import { RiskFactors, HealthTimeline, RecommendationCard } from '../components/shared.jsx'
import { getAnimal, animalTimeSeries, TIMELINE } from '../data/mockData'
import { predictMastitisRisk } from '../services/predictionService'
import { useI18n } from '../i18n/i18n.jsx'

function buildTimeline(animal) {
  if (animal.id === 'BUF-042') return TIMELINE
  const t = [{ date: 'Aug 22', label: 'Baseline recorded', tone: 'ok' }]
  if (animal.scc > 150) t.push({ date: 'Aug 28', label: 'SCC trend increased', tone: 'warn' })
  if (animal.milkYield && animal.activity < -4) t.push({ date: 'Sep 01', label: 'Activity decreased', tone: 'warn' })
  if (animal.riskScore >= 45) t.push({ date: 'Sep 03', label: 'Early warning generated', tone: 'alert' })
  t.push({
    date: 'Sep 04',
    label: `Current risk — ${animal.riskScore}%`,
    tone: animal.riskScore >= 70 ? 'alert' : animal.riskScore >= 45 ? 'warn' : 'ok',
  })
  return t
}

export default function AnimalDetails() {
  const { id } = useParams()
  const { t } = useI18n()
  const [reviewed, setReviewed] = useState(false)
  const animal = getAnimal(id)

  const prediction = useMemo(() => {
    if (!animal) return null
    return predictMastitisRisk({
      scc: animal.scc,
      milkYieldChange: -Math.abs(Math.round((1 - animal.milkYield / (animal.milkYield * 1.12)) * 100)),
      activityChange: animal.activity,
      ruminationChange: animal.rumination,
      temperature: animal.temperature,
      humidity: 78,
      previousMastitis: animal.previousMastitis,
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

  const factorRows = [
    { key: 'SCC', label: 'SCC', delta: `+${Math.round((animal.scc / 180 - 1) * 100)}%`, value: Math.max(1, animal.scc) },
    { key: 'Milk Yield', label: 'Milk Yield', delta: '-12%', value: 60 },
    { key: 'Activity', label: 'Activity', delta: `${animal.activity}%`, value: Math.abs(animal.activity) * 5 },
    { key: 'Rumination', label: 'Rumination', delta: `${animal.rumination}%`, value: Math.abs(animal.rumination) * 5 },
    { key: 'Udder Temperature', label: 'Udder Temperature', delta: `+${(animal.temperature - 38.5).toFixed(1)}°C`, value: (animal.temperature - 38.5) * 60 },
  ]

  const charts = [
    { title: t('animals.col.yield'), key: 'milkYield', color: '#16a34a', data: ts.milkYield },
    { title: 'SCC', key: 'scc', color: '#f59e0b', data: ts.scc },
    { title: t('animals.col.activity'), key: 'activity', color: '#3b82f6', data: ts.activity },
    { title: 'Rumination', key: 'rumination', color: '#8b5cf6', data: ts.rumination },
    { title: t('env.temp'), key: 'temperature', color: '#ef4444', data: ts.temperature },
  ]

  return (
    <div>
      <Link to="/animals" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800">
        <ArrowLeft size={15} /> {t('detail.back')}
      </Link>

      {/* Hero */}
      <Card className="mb-6 overflow-hidden">
        <div className="grid gap-6 p-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{animal.id}</h1>
              <RiskBadge level={animal.riskLevel} score={animal.riskScore} />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {animal.name} · {animal.breed} {animal.species} · {animal.age} years · Lactation {animal.lactation} · Shed {animal.shed}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <MiniStat label={t('animals.col.yield')} value={`${animal.milkYield} L`} />
              <MiniStat label="SCC" value={`${animal.scc}k`} />
              <MiniStat label={t('animals.col.activity')} value={`${animal.activity}%`} />
              <MiniStat label={t('common.riskWindow')} value={prediction.predictionWindow} />
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => setReviewed(true)} disabled={reviewed}>
                <CheckCircle2 size={15} /> {reviewed ? t('detail.reviewed') : t('detail.markReviewed')}
              </button>
              <button className="btn-ghost">
                <PhoneCall size={15} /> {t('detail.contactVet')}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 p-5">
            <span className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">{t('detail.risk')}</span>
            <RiskGauge score={animal.riskScore} />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Why at risk */}
        <Card className="p-5 lg:col-span-2">
          <SectionTitle>{t('detail.why')}</SectionTitle>
          <RiskFactors factors={factorRows} />
          <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2.5 text-xs leading-relaxed text-brand-900">
            The current risk score is primarily influenced by the rising SCC trend, reduced milk production, and
            behavioural changes compared with this animal's historical baseline.
          </p>
          <AiDisclaimer className="mt-3" />
        </Card>

        {/* Timeline */}
        <Card className="p-5">
          <SectionTitle>{t('detail.timeline')}</SectionTitle>
          <HealthTimeline items={buildTimeline(animal)} />
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-6">
        <SectionTitle>{t('detail.charts')}</SectionTitle>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {charts.map((c) => (
            <Card key={c.key} className="p-5">
              <p className="mb-2 text-sm font-medium text-gray-700">{c.title}</p>
              <AreaTrend data={c.data} dataKey="value" color={c.color} name={c.title} height={170} />
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6">
        <SectionTitle>{t('detail.recs')}</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {prediction.recommendations.map((r, i) => (
            <RecommendationCard key={r.title} rec={r} index={i} />
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Recommendations are preventive guidance only. This prototype does not prescribe medicines or dosages.
        </p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-gray-900">{value}</p>
    </div>
  )
}
