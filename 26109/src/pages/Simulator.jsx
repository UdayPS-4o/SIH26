import { useMemo, useState } from 'react'
import { RotateCcw, Sparkles } from 'lucide-react'
import { PageHeader, Card, SectionTitle, RiskGauge, Toggle } from '../components/common/ui.jsx'
import { RiskFactors } from '../components/shared.jsx'
import { predictMastitisRisk } from '../services/predictionService'
import { useI18n } from '../i18n/i18n.jsx'

const DEFAULTS = {
  scc: 420,
  milkYieldChange: -12,
  activityChange: -18,
  ruminationChange: -15,
  temperature: 39.6,
  humidity: 78,
  previousMastitis: true,
}

function SimSlider({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        className="mt-2 w-full"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="mt-1 flex justify-between text-[10px] text-gray-400">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  )
}

export default function Simulator() {
  const { t } = useI18n()
  const [s, setS] = useState(DEFAULTS)
  const set = (k, v) => setS((prev) => ({ ...prev, [k]: v }))

  const result = useMemo(() => predictMastitisRisk(s), [s])

  return (
    <div>
      <PageHeader
        title={t('sim.title')}
        subtitle={t('sim.sub')}
        actions={
          <button className="btn-ghost" onClick={() => setS(DEFAULTS)}>
            <RotateCcw size={14} /> {t('sim.reset')}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Controls */}
        <Card className="p-5 lg:col-span-3">
          <SectionTitle>Parameters</SectionTitle>
          <div className="grid gap-6 sm:grid-cols-2">
            <SimSlider label={t('sim.scc')} value={s.scc} min={50} max={900} step={10} onChange={(v) => set('scc', v)} />
            <SimSlider label={t('sim.yield')} value={s.milkYieldChange} min={-40} max={10} unit="%" onChange={(v) => set('milkYieldChange', v)} />
            <SimSlider label={t('sim.activity')} value={s.activityChange} min={-40} max={10} unit="%" onChange={(v) => set('activityChange', v)} />
            <SimSlider label={t('sim.rumination')} value={s.ruminationChange} min={-40} max={10} unit="%" onChange={(v) => set('ruminationChange', v)} />
            <SimSlider label={t('sim.temp')} value={s.temperature} min={37.5} max={41} step={0.1} unit="°C" onChange={(v) => set('temperature', v)} />
            <SimSlider label={t('sim.humidity')} value={s.humidity} min={30} max={100} unit="%" onChange={(v) => set('humidity', v)} />
          </div>
          <div className="mt-5 rounded-lg border border-gray-200 px-3">
            <Toggle checked={s.previousMastitis} onChange={(v) => set('previousMastitis', v)} label={t('sim.prevMastitis')} />
          </div>
        </Card>

        {/* Result */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <SectionTitle>{t('sim.result')}</SectionTitle>
            <div className="flex flex-col items-center">
              <RiskGauge score={result.riskScore} size={180} />
              <div className="mt-4 w-full rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-400">{t('common.riskWindow')}</p>
                <p className="text-sm font-semibold text-gray-900">{result.predictionWindow}</p>
              </div>
            </div>
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800">
              {t('sim.disclaimer')}
            </p>
          </Card>

          <Card className="p-5">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles size={15} className="text-brand-600" />
              <span className="text-sm font-semibold text-gray-900">Top contributing factors</span>
            </div>
            {result.contributingFactors.length ? (
              <RiskFactors factors={result.contributingFactors} />
            ) : (
              <p className="text-sm text-gray-400">No dominant risk factors at these settings.</p>
            )}
          </Card>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <SectionTitle>How this demo formula works</SectionTitle>
        <ul className="grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
          <li>• Higher SCC → higher risk (largest weight)</li>
          <li>• Larger milk-yield decline → higher risk</li>
          <li>• Lower activity and rumination → higher risk</li>
          <li>• Higher body temperature → higher risk</li>
          <li>• Higher humidity → higher environmental risk</li>
          <li>• Previous mastitis history → higher risk</li>
        </ul>
        <p className="mt-3 text-xs text-gray-400">
          The production system would replace this transparent formula with a validated ML model trained on real
          sensor, laboratory and farm-record data. Result is clamped between 0 and 99.
        </p>
      </Card>
    </div>
  )
}
