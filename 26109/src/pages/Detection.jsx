import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Radio,
  Thermometer,
  Activity,
  Waves,
  Eye,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader, Card, SectionTitle, Pill, EmptyState } from '../components/common/ui.jsx'
import AnomalyPanel from '../components/common/AnomalyPanel.jsx'
import SensorHealth from '../components/common/SensorHealth.jsx'
import DetectionBadge from '../components/common/DetectionBadge.jsx'
import ThresholdMeter from '../components/common/ThresholdMeter.jsx'
import { detectAnomalies, getSensorHealth, getDetectionStatus } from '../services/detectionService'
import { ANIMALS } from '../data/mockData'
import { useI18n } from '../i18n/i18n.jsx'

const THRESHOLDS = [
  { key: 'scc',         label: 'SCC',            threshold: 200,   unit: 'k',  icon: Waves },
  { key: 'milkYield',   label: 'Milk Yield',     threshold: 7.0,   unit: 'L',  icon: Activity },
  { key: 'temperature', label: 'Temperature',    threshold: 39.0,  unit: '°C', icon: Thermometer },
]

export default function Detection() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('anomalies')

  // Aggregate anomalies from high-risk animals
  const { anomalyFeed, totalAnomalies } = useMemo(() => {
    const feed = []
    for (const animal of ANIMALS) {
      const { anomalies } = detectAnomalies(animal)
      if (anomalies.length) {
        feed.push({ animal, anomalies })
      }
    }
    feed.sort((a, b) => b.anomalies.length - a.anomalies.length)
    return { anomalyFeed: feed, totalAnomalies: feed.reduce((s, f) => s + f.anomalies.length, 0) }
  }, [])

  const sensorData = useMemo(() => getSensorHealth(), [])
  const degradedSensors = sensorData.sensors.filter((s) => s.status !== 'online')

  const tabs = [
    { id: 'anomalies', label: t('detect.anomalies'), icon: AlertTriangle },
    { id: 'sensors', label: t('detect.sensors'), icon: Wifi },
    { id: 'thresholds', label: 'Thresholds', icon: Thermometer },
  ]

  return (
    <div>
      <PageHeader
        title={t('detect.title')}
        subtitle={t('detect.sub')}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <DetectionBadge
              status={totalAnomalies > 0 ? 'alert' : 'normal'}
              detectedAt={new Date().toISOString()}
            />
            <Pill tone={totalAnomalies > 0 ? 'red' : 'green'}>
              {totalAnomalies} active
            </Pill>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
        <Card className="p-4 text-center">
          <span className="text-2xl font-bold text-sand-900 dark:text-sand-100">{totalAnomalies}</span>
          <p className="text-xs text-sand-500">{t('detect.anomalies')}</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-2xl font-bold text-forest-600 dark:text-forest-400">
            {sensorData.sensors.filter((s) => s.status === 'online').length}
          </span>
          <p className="text-xs text-sand-500">Sensors Online</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-2xl font-bold text-honey-600 dark:text-honey-400">{degradedSensors.length}</span>
          <p className="text-xs text-sand-500">Degraded</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-2xl font-bold text-sand-900 dark:text-sand-100">{anomalyFeed.length}</span>
          <p className="text-xs text-sand-500">Animals Affected</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 rounded-xl bg-sand-100 p-1 dark:bg-barn-800/40 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-sand-900 shadow-sm dark:bg-barn-900 dark:text-sand-100'
                  : 'text-sand-500 hover:text-sand-700 dark:text-sand-400 dark:hover:text-sand-200'
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab panels */}
      {activeTab === 'anomalies' && (
        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle
              right={
                <span className="text-xs text-sand-400">
                  Showing {anomalyFeed.length} animals with active anomalies
                </span>
              }
            >
              {t('detect.anomalies')}
            </SectionTitle>
            {anomalyFeed.length === 0 ? (
              <EmptyState title={t('detect.anomalies.none')} />
            ) : (
              <div className="space-y-5">
                {anomalyFeed.map(({ animal, anomalies }) => (
                  <div
                    key={animal.id}
                    className="rounded-xl border border-sand-200 bg-white p-4 dark:border-barn-800/40 dark:bg-barn-950/40"
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        to={`/animals/${animal.id}`}
                        className="text-sm font-semibold text-sand-900 hover:text-honey-700 dark:text-sand-100 dark:hover:text-honey-400"
                      >
                        {animal.id}
                      </Link>
                      <div className="flex items-center gap-2">
                        <DetectionBadge
                          status={getDetectionStatus(animal).status}
                          detectedAt={getDetectionStatus(animal).detectedAt}
                        />
                        <span className="text-xs text-sand-400">{animal.species}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <AnomalyPanel anomalies={anomalies} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'sensors' && (
        <div className="space-y-5">
          <Card className="p-5">
            <SectionTitle>{t('detect.sensors')}</SectionTitle>
            <SensorHealth sensors={sensorData.sensors} />
          </Card>

          {degradedSensors.length > 0 && (
            <Card className="border-honey-300 bg-honey-50/50 p-5 dark:border-honey-800/40 dark:bg-honey-900/10">
              <SectionTitle>
                <span className="flex items-center gap-1.5 text-honey-700 dark:text-honey-400">
                  <AlertTriangle size={14} /> Degraded Sensors
                </span>
              </SectionTitle>
              <ul className="space-y-2">
                {degradedSensors.map((s) => (
                  <li key={s.name} className="flex items-center gap-2 text-sm text-sand-700 dark:text-sand-300">
                    <WifiOff size={14} className="text-honey-500" />
                    {s.name} — uptime {s.uptime}%
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'thresholds' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-5">
            <SectionTitle>Active Threshold Configuration</SectionTitle>
            <div className="space-y-5">
              {THRESHOLDS.map((cfg) => {
                const Icon = cfg.icon
                return (
                  <div key={cfg.key}>
                    <div className="flex items-center gap-2 text-sm font-medium text-sand-700 dark:text-sand-300">
                      <Icon size={15} className="text-honey-600 dark:text-honey-400" />
                      {cfg.label}
                    </div>
                    <div className="mt-2">
                      <ThresholdMeter
                        label={cfg.label}
                        value={cfg.threshold}
                        threshold={cfg.threshold}
                        unit={cfg.unit}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-sand-400">
                      Alert when {cfg.key === 'milkYield' ? 'below' : 'above'} {cfg.threshold}{cfg.unit}
                    </p>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle>Detection Log</SectionTitle>
            <div className="space-y-3">
              {anomalyFeed.slice(0, 8).flatMap(({ animal, anomalies }) =>
                anomalies.map((a, i) => (
                  <div
                    key={`${animal.id}-${i}`}
                    className="flex items-start gap-3 rounded-lg border border-sand-200 bg-white p-3 dark:border-barn-800/40 dark:bg-barn-950/40"
                  >
                    <span className={`mt-1 h-2 w-2 rounded-full ${
                      a.severity === 'critical' ? 'bg-red-500'
                        : a.severity === 'warning' ? 'bg-honey-500'
                        : 'bg-ai'
                    }`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-sand-900 dark:text-sand-100">
                        {animal.id} — {a.sensor}
                      </p>
                      <p className="text-[11px] text-sand-400">
                        {a.value} {a.unit} vs threshold {a.threshold} {a.unit} (+{a.deviation}%)
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-sand-400">
                      {new Date(a.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )),
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
