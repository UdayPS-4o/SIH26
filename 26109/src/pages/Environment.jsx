import { Thermometer, Droplets, Bed, SprayCan, GlassWater, Home } from 'lucide-react'
import { PageHeader, Card, SectionTitle, AiDisclaimer, Pill } from '../components/common/ui.jsx'
import { TrendChart } from '../components/common/charts.jsx'
import { ENV_NOW, ENV_TREND } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

const toneFor = (v) => {
  const s = String(v).toLowerCase()
  if (s.includes('poor') || s.includes('bad')) return 'red'
  if (s.includes('moderate')) return 'amber'
  if (s.includes('good') || s.includes('excellent')) return 'green'
  return 'gray'
}

export default function Environment() {
  const { t } = useI18n()

  const cards = [
    { icon: Thermometer, label: t('env.temp'), value: `${ENV_NOW.temperature}°C`, tone: 'amber' },
    { icon: Droplets, label: t('env.humidity'), value: `${ENV_NOW.humidity}%`, tone: 'red' },
    { icon: Bed, label: t('env.bedding'), value: ENV_NOW.bedding, tone: toneFor(ENV_NOW.bedding) },
    { icon: SprayCan, label: t('env.milkingHyg'), value: ENV_NOW.milkingHygiene, tone: toneFor(ENV_NOW.milkingHygiene) },
    { icon: GlassWater, label: t('env.water'), value: ENV_NOW.water, tone: toneFor(ENV_NOW.water) },
    { icon: Home, label: t('env.housing'), value: ENV_NOW.housing, tone: toneFor(ENV_NOW.housing) },
  ]

  const recs = [
    'Replace wet bedding daily and keep stalls dry to reduce environmental pathogen load.',
    'Improve shed ventilation to bring humidity below 70%.',
    'Reinforce pre- and post-milking teat disinfection routine.',
    'Monitor Shed C micro-climate twice daily during the humid spell.',
  ]

  return (
    <div>
      <PageHeader title={t('env.title')} subtitle={t('env.sub')} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="card-p">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-500">
                  <Icon size={16} />
                </span>
                <Pill tone={c.tone}>{c.value}</Pill>
              </div>
              <p className="mt-3 text-sm text-gray-500">{c.label}</p>
            </div>
          )
        })}
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle>{t('env.trend')}</SectionTitle>
        <TrendChart
          data={ENV_TREND}
          series={[
            { key: 'temperature', name: `${t('env.temp')} (°C)`, color: '#f59e0b' },
            { key: 'humidity', name: `${t('env.humidity')} (%)`, color: '#3b82f6' },
          ]}
        />
      </Card>

      <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        {t('env.insight')}
      </div>

      <div className="mt-6">
        <SectionTitle>Recommendations</SectionTitle>
        <ul className="space-y-2">
          {recs.map((r, i) => (
            <li key={i} className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                {i + 1}
              </span>
              {r}
            </li>
          ))}
        </ul>
        <AiDisclaimer className="mt-3" />
      </div>
    </div>
  )
}
