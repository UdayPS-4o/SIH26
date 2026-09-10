import { useState } from 'react'
import { Radio, Wifi, Eye, RefreshCw, CheckCircle, Zap, Sparkles } from 'lucide-react'
import { PageHeader, Card, SectionTitle } from '../components/common/ui.jsx'
import { useI18n } from '../i18n/i18n.jsx'
import { ANIMALS, feedingProfile } from '../data/mockData'
import { predictMastitisRisk } from '../services/predictionService'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const DEVICES = [
  {
    id: 'MS-01',
    name: 'In-Line Milk Flow Sensor',
    type: 'Milk Sensor',
    icon: Radio,
    status: 'Online',
    lastPacket: 'Just now (10 Sep, 12:35)',
    battery: '87%',
    rssi: '-62 dBm (Good)',
    firmware: 'v2.1.4-prod',
    readings: { conductivity: '6.2 mS/cm', milkTemp: '39.9°C', flowRate: '2.4 L/min', ph: '7.1' },
    lastCalibrated: '01 Sep 2026',
  },
  {
    id: 'GW-A',
    name: 'Smart Collar Gateway A',
    type: 'Collar Gateway',
    icon: Wifi,
    status: 'Online',
    lastPacket: '2 min ago',
    battery: 'Solar (94% cap)',
    rssi: '-48 dBm (Strong)',
    firmware: 'v1.8.2',
    readings: { activeNodeCount: '19 Collars connected', packetSuccess: '99.4%', frequency: '868 MHz LoRa' },
    lastCalibrated: '15 Aug 2026',
  },
  {
    id: 'CR-01',
    name: 'Handheld CMT Colour Reader',
    type: 'Colour Reader',
    icon: Eye,
    status: 'Online',
    lastPacket: '12 min ago',
    battery: '72%',
    rssi: 'Bluetooth Low Energy',
    firmware: 'v3.0.1',
    readings: { lastRGB: 'R:182 G:74 B:68', hsvHue: '3.3°', gelScore: '2+ (Moderate Positive)' },
    lastCalibrated: '05 Sep 2026',
  },
]

// Calibration Scatter Data: Lab SCC vs Sensor Estimated SCC
const CALIBRATION_DATA = [
  { labScc: 120, sensorScc: 125 },
  { labScc: 180, sensorScc: 175 },
  { labScc: 250, sensorScc: 260 },
  { labScc: 340, sensorScc: 330 },
  { labScc: 420, sensorScc: 435 },
  { labScc: 580, sensorScc: 560 },
  { labScc: 750, sensorScc: 780 },
  { labScc: 920, sensorScc: 905 },
]

export default function Devices() {
  const { t } = useI18n()
  const [calibrating, setCalibrating] = useState(null)
  
  // CMT Flow state
  const [selectedAnimal, setSelectedAnimal] = useState('BUF-042')
  const [swatch, setSwatch] = useState({ label: 'Gel Score 2+ (Moderate)', rgb: '#b91c1c', hsvHue: 3.3, gelScore: '2+', estimatedScc: 420 })
  const [testResult, setTestResult] = useState(null)

  const swatches = [
    { label: 'Gel Score 0 (Negative)', rgb: '#15803d', hsvHue: 125, gelScore: '0', estimatedScc: 110 },
    { label: 'Gel Score Trace (Minor)', rgb: '#ca8a04', hsvHue: 48, gelScore: 'Trace', estimatedScc: 210 },
    { label: 'Gel Score 1+ (Mild Positive)', rgb: '#ea580c', hsvHue: 22, gelScore: '1+', estimatedScc: 310 },
    { label: 'Gel Score 2+ (Moderate Positive)', rgb: '#b91c1c', hsvHue: 3.3, gelScore: '2+', estimatedScc: 420 },
    { label: 'Gel Score 3+ (Severe Positive)', rgb: '#7f1d1d', hsvHue: 0, gelScore: '3+', estimatedScc: 850 },
  ]

  const triggerCalibration = (id) => {
    setCalibrating(id)
    setTimeout(() => setCalibrating(null), 1800)
  }

  const runCmtTest = () => {
    const animalObj = ANIMALS.find((a) => a.id === selectedAnimal) || ANIMALS[0]
    const feeding = feedingProfile(animalObj)
    const updatedRisk = predictMastitisRisk({
      scc: swatch.estimatedScc,
      baselineScc: animalObj.baselineScc || 150,
      milkYieldChange: -Math.abs(Math.round((1 - animalObj.milkYield / (animalObj.milkYield * 1.12)) * 100)),
      activityChange: animalObj.activity,
      ruminationChange: animalObj.rumination,
      temperature: animalObj.temperature,
      conductivity: animalObj.conductivity || 5.4,
      ph: animalObj.ph || 6.7,
      humidity: 78,
      previousMastitis: animalObj.previousMastitis,
      feedingQuality: feeding.feedingScore,
      housingQuality: feeding.housingScore,
    })
    setTestResult({
      animalId: selectedAnimal,
      newScc: swatch.estimatedScc,
      gelScore: swatch.gelScore,
      riskScore: updatedRisk.riskScore,
      riskLevel: updatedRisk.riskLevel,
    })
  }

  return (
    <div>
      <PageHeader
        title={t('nav.devices')}
        subtitle="Live IoT hardware status, CMT colour reader workflow, and sensor calibration."
      />

      {/* Device Overview Cards (Item #2) */}
      <div className="grid gap-6 md:grid-cols-3">
        {DEVICES.map((d) => {
          const Icon = d.icon
          return (
            <Card key={d.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{d.name}</h3>
                    <p className="text-xs text-gray-400">{d.id} · {d.type}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {d.status}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3 dark:border-gray-800">
                <div><span className="text-gray-400">Last Packet:</span> <p className="font-medium text-gray-800 dark:text-gray-200">{d.lastPacket}</p></div>
                <div><span className="text-gray-400">Battery/Power:</span> <p className="font-medium text-gray-800 dark:text-gray-200">{d.battery}</p></div>
                <div><span className="text-gray-400">Signal RSSI:</span> <p className="font-medium text-gray-800 dark:text-gray-200">{d.rssi}</p></div>
                <div><span className="text-gray-400">Firmware:</span> <p className="font-medium text-gray-800 dark:text-gray-200">{d.firmware}</p></div>
              </div>

              <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Live Readings</p>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  {Object.entries(d.readings).map(([k, v]) => (
                    <p key={k} className="text-gray-600 dark:text-gray-400"><span className="capitalize">{k}:</span> <strong className="text-gray-900 dark:text-gray-100">{v}</strong></p>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">Calibrated: {d.lastCalibrated}</span>
                <button className="btn-ghost text-xs" onClick={() => triggerCalibration(d.id)} disabled={calibrating === d.id}>
                  <RefreshCw size={13} className={calibrating === d.id ? 'animate-spin' : ''} />
                  {calibrating === d.id ? 'Calibrating…' : 'Recalibrate'}
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Item #3: Colour-Sensor CMT Flow Wizard */}
      <Card className="mt-6 p-6">
        <SectionTitle right={<span className="text-xs font-semibold text-brand-600">CMT Optical Workflow</span>}>
          Color-Sensor CMT Test Flow (Capture → RGB/HSV → Gel Score → Estimated SCC)
        </SectionTitle>

        <div className="grid gap-6 lg:grid-cols-2 mt-4">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="label">1. Select Target Animal</label>
              <select className="input mt-1" value={selectedAnimal} onChange={(e) => setSelectedAnimal(e.target.value)}>
                {ANIMALS.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} - {a.name} (Current SCC: {a.scc}k)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">2. Simulate Optical Reader Capture (Gel Reaction Color)</label>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {swatches.map((s) => (
                  <button
                    key={s.gelScore}
                    onClick={() => setSwatch(s)}
                    className={`flex flex-col items-center justify-center rounded-xl p-2 border-2 transition-all ${
                      swatch.gelScore === s.gelScore ? 'border-brand-600 ring-2 ring-brand-300' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: s.rgb }}
                  >
                    <span className="text-xs font-bold text-white shadow-sm">{s.gelScore}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                Selected: <strong className="text-gray-900 dark:text-gray-100">{swatch.label}</strong>
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
              <p className="text-xs font-semibold uppercase text-gray-400">Optical Formula Extraction</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">RGB Target:</span> <p className="font-mono font-bold text-gray-800 dark:text-gray-200">{swatch.rgb}</p></div>
                <div><span className="text-gray-400">HSV Hue:</span> <p className="font-mono font-bold text-gray-800 dark:text-gray-200">{swatch.hsvHue}°</p></div>
                <div><span className="text-gray-400">Inferred CMT Gel Score:</span> <p className="font-bold text-brand-600">{swatch.gelScore}</p></div>
                <div><span className="text-gray-400">Derived SCC:</span> <p className="font-bold text-amber-600">{swatch.estimatedScc}k cells/mL</p></div>
              </div>
            </div>

            <button className="btn-primary w-full justify-center" onClick={runCmtTest}>
              <Zap size={16} /> Write SCC into Record & Recompute Risk
            </button>
          </div>

          {/* Test Result Display */}
          <div>
            {testResult ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-5 dark:border-brand-900/40 dark:bg-brand-950/20">
                <div className="flex items-center gap-2 text-brand-800 dark:text-brand-300 font-semibold">
                  <CheckCircle size={18} /> Test Successfully Processed
                </div>
                <div className="mt-3 space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <p><strong>Animal Record Updated:</strong> {testResult.animalId}</p>
                  <p><strong>Gel Reaction Score:</strong> {testResult.gelScore}</p>
                  <p><strong>Updated SCC Value:</strong> {testResult.newScc}k cells/mL</p>
                  <div className="mt-3 rounded-lg bg-white p-3 shadow-sm dark:bg-gray-900">
                    <p className="text-xs text-gray-400">Recomputed Mastitis Risk Score</p>
                    <p className="text-2xl font-bold text-red-600">{testResult.riskScore}% ({testResult.riskLevel})</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-6 text-center dark:border-gray-800">
                <Sparkles size={32} className="text-gray-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Run a CMT Test Scan</p>
                <p className="text-xs text-gray-400 max-w-xs mt-1">
                  Select gel reaction color above and click process to view live risk recomputation.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Item #3 Calibration Scatter vs Lab SCC */}
      <Card className="mt-6 p-5">
        <SectionTitle>Sensor Calibration Scatter vs Lab Reference SCC</SectionTitle>
        <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
          R² = 0.984 calibration curve comparing handheld optical reader estimated SCC vs. gold-standard laboratory cell counts.
        </p>
        <ResponsiveContainer width="100%" height={250}>
          <ScatterChart margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="labScc" name="Lab Reference SCC (k)" unit="k" tick={{ fontSize: 11 }} />
            <YAxis type="number" dataKey="sensorScc" name="Sensor Optical SCC (k)" unit="k" tick={{ fontSize: 11 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Calibration Points" data={CALIBRATION_DATA} fill="#2563eb" />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
