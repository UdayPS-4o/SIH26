import { useMemo, useState } from 'react'
import {
  ArrowsCounterClockwise,
  Brain,
  CalendarBlank,
  ChartLineUp,
  CheckCircle,
  GitBranch,
  Robot,
  Target,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  KeyValue,
  MultiLine,
  PageHeader,
  Panel,
  Slider,
  StatTile,
  Toggle,
  useChartTokens,
} from '@/ds'
import { fmtDay, fmtDayFull, fmtInt, fmtPct } from '@/lib/format'

/* ==========================================================================
   Types
   ========================================================================== */

interface TrainingHistoryEntry {
  date: string
  datasetSize: number
  mape: number
  rmse: number
  status: 'completed' | 'running'
}

interface SubModelMetric {
  model: string
  precision: number
  recall: number
  f1: number
  fpr: number
  latencyMs: number
}

interface VersionEntry {
  version: string
  date: string
  mapescore: number
  status: 'current' | 'rollback' | 'ab-test'
}

interface DeploymentStatus {
  model: string
  version: string
  status: 'In production' | 'Staged' | 'Previous'
  lastDeployed: string
}

/* ==========================================================================
   Synthetic data
   ========================================================================== */

const buildForecastHistory = (): TrainingHistoryEntry[] => {
  const today = new Date('2026-09-14T00:00:00+05:30')
  const entries: TrainingHistoryEntry[] = []
  const baseMape = 3.7

  for (let i = 9; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i * 7)
    const mape = +(baseMape - i * 0.04 + (Math.random() - 0.5) * 0.12).toFixed(2)
    const rmse = +(8.1 + i * 0.03 + (Math.random() - 0.5) * 0.4).toFixed(2)
    entries.push({
      date: d.toISOString().split('T')[0],
      datasetSize: 68000 + Math.floor(Math.random() * 6000),
      mape: Math.max(2.4, mape),
      rmse: Math.max(6.5, rmse),
      status: i === 0 ? 'running' : 'completed',
    })
  }
  return entries
}

const FORECAST_HISTORY: TrainingHistoryEntry[] = buildForecastHistory()

const FORECAST_FEATURES = [
  'Lead time',
  'Sector',
  'Day of week',
  'Festival proximity',
  'Booking curve',
  'Historical fares',
]

const SUB_MODEL_METRICS: SubModelMetric[] = [
  { model: 'Isolation Forest', precision: 0.913, recall: 0.886, f1: 0.899, fpr: 0.087, latencyMs: 42 },
  { model: 'Statistical Fence', precision: 0.847, recall: 0.912, f1: 0.879, fpr: 0.093, latencyMs: 8 },
  { model: 'Pattern Match', precision: 0.781, recall: 0.754, f1: 0.767, fpr: 0.146, latencyMs: 15 },
  { model: 'Ensemble', precision: 0.942, recall: 0.918, f1: 0.930, fpr: 0.058, latencyMs: 65 },
]

const DEPLOYMENTS: DeploymentStatus[] = [
  { model: 'APIx Fare Forecaster', version: 'v2.4.1', status: 'In production', lastDeployed: '2026-09-14' },
  { model: 'Fare Anomaly Detector', version: 'v1.8.0', status: 'In production', lastDeployed: '2026-09-13' },
  { model: 'APIx Fare Forecaster (previous)', version: 'v2.3.9', status: 'Previous', lastDeployed: '2026-09-07' },
]

const VERSION_HISTORY: VersionEntry[] = [
  { version: 'v2.4.1', date: '2026-09-14', mapescore: 3.2, status: 'current' },
  { version: 'v2.4.0', date: '2026-09-07', mapescore: 3.4, status: 'ab-test' },
  { version: 'v2.3.9', date: '2026-08-31', mapescore: 3.6, status: 'rollback' },
  { version: 'v2.3.8', date: '2026-08-24', mapescore: 3.9, status: 'rollback' },
]

const DEPLOY_STATUS_TONE: Record<string, 'good' | 'neutral' | 'warn'> = {
  'In production': 'good',
  Staged: 'neutral',
  Previous: 'neutral',
}

/* ==========================================================================
   Helpers
   ========================================================================== */

function fmtMape(n: number): string {
  return `${n.toFixed(2)}%`
}

function fmtRmse(n: number): string {
  return `${n.toFixed(2)} pts`
}

function fmtFpr(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

/* ==========================================================================
   Component
   ========================================================================== */

export function ModelManagementPage() {
  const t = useChartTokens()

  // -- retraining state --
  const [forecastRetraining, setForecastRetraining] = useState(false)
  const [forecastProgress, setForecastProgress] = useState(0)
  const [anomalyRetraining, setAnomalyRetraining] = useState(false)
  const [anomalyProgress, setAnomalyProgress] = useState(0)

  // -- thresholds --
  const [warnThreshold, setWarnThreshold] = useState(0.45)
  const [criticalThreshold, setCriticalThreshold] = useState(0.70)

  // -- AB test toggle --
  const [abTestEnabled, setAbTestEnabled] = useState(false)

  // -- forecast metrics (mutable after retrain) --
  const [forecastMape, setForecastMape] = useState(3.2)
  const [forecastRmse, setForecastRmse] = useState(7.8)
  const [forecastMae, setForecastMae] = useState(5.9)

  const [anomalyPrecision, setAnomalyPrecision] = useState(0.942)
  const [anomalyRecall, setAnomalyRecall] = useState(0.918)
  const [anomalyF1, setAnomalyF1] = useState(0.930)
  const [anomalyFpr, setAnomalyFpr] = useState(0.058)
  const [anomalyLatency, setAnomalyLatency] = useState(65)

  const [forecastLastTrained, setForecastLastTrained] = useState('2026-09-14')
  const [anomalyLastTrained, setAnomalyLastTrained] = useState('2026-09-13')

  const [forecastVersion, setForecastVersion] = useState('v2.4.1')
  const [anomalyVersion, setAnomalyVersion] = useState('v1.8.0')

  // -- chart data: MAPE over training runs --
  const mapeChartData = useMemo(
    () =>
      FORECAST_HISTORY.map((e) => ({
        date: e.date,
        mape: e.mape,
      })),
    [],
  )

  // -- simulate retrain --
  const runForecastRetrain = () => {
    if (forecastRetraining) return
    setForecastRetraining(true)
    setForecastProgress(0)
    const interval = setInterval(() => {
      setForecastProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setForecastRetraining(false)
          const now = new Date().toISOString().split('T')[0]
          setForecastLastTrained(now)
          setForecastMape((prev) => +(prev - 0.08).toFixed(2))
          setForecastRmse((prev) => +(prev - 0.1).toFixed(2))
          setForecastMae((prev) => +(prev - 0.08).toFixed(2))
          // bump patch version
          const patch = Number(forecastVersion.split('.')[2]) + 1
          const [major, minor] = forecastVersion.split('.').slice(0, 2)
          setForecastVersion(`${major}.${minor}.${patch}`)
          return 100
        }
        return p + 2
      })
    }, 60)
  }

  const runAnomalyRetrain = () => {
    if (anomalyRetraining) return
    setAnomalyRetraining(true)
    setAnomalyProgress(0)
    const interval = setInterval(() => {
      setAnomalyProgress((p) => {
        if (p >= 100) {
          clearInterval(interval)
          setAnomalyRetraining(false)
          const now = new Date().toISOString().split('T')[0]
          setAnomalyLastTrained(now)
          setAnomalyPrecision((prev) => +(prev + 0.002).toFixed(3))
          setAnomalyRecall((prev) => +(prev + 0.001).toFixed(3))
          setAnomalyF1((prev) => +(prev + 0.001).toFixed(3))
          setAnomalyFpr((prev) => +(prev - 0.003).toFixed(3))
          setAnomalyLatency((prev) => Math.max(40, prev - 2))
          const patch = Number(anomalyVersion.split('.')[2]) + 1
          const [major, minor] = anomalyVersion.split('.').slice(0, 2)
          setAnomalyVersion(`${major}.${minor}.${patch}`)
          return 100
        }
        return p + 2
      })
    }, 60)
  }

  const chartSeries = useMemo(
    () => [
      { key: 'mape', label: 'MAPE', color: t['line-index'], width: 2.4 },
    ],
    [t],
  )

  // -- effect of threshold changes on simulated precision/recall --
  // Simple sigmoidal toy: as warn threshold goes up, recall drops and precision rises.
  const effectAt = (warnVal: number): { precision: number; recall: number } => {
    const mid = 0.45
    const steepness = 10
    const recall = +(0.75 + 0.2 * (1 / (1 + Math.exp(-steepness * (warnVal - mid))))).toFixed(3)
    const precision = +(0.85 + 0.08 * (1 / (1 + Math.exp(steepness * (warnVal - mid))))).toFixed(3)
    return { precision: Math.min(0.98, precision), recall: Math.max(0.55, recall) }
  }

  const effectPrecision = effectAt(warnThreshold).precision
  const effectRecall = effectAt(warnThreshold).recall

  return (
    <div>
      <PageHeader
        kicker="ML Operations"
        title="Model management"
        lede="Tracking, versioning, and retraining the forecasting and anomaly detection models used across the VIMAAN pipeline."
        actions={
          <Badge tone="accent" icon={Robot}>
            Nightly retrain on 90-day panel
          </Badge>
        }
      />

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Models registered"
          value={2}
          icon={Brain}
          tone="accent"
          note="Forecasting LSTM, Anomaly Ensemble"
        />
        <StatTile
          label="Last retrain"
          value={fmtDay(forecastLastTrained)}
          icon={CalendarBlank}
          tone="neutral"
          note={`Forecaster · ${forecastVersion}`}
        />
        <StatTile
          label="Best model accuracy"
          value={fmtPct(anomalyF1 * 100, 1)}
          icon={Target}
          tone="good"
          note="Anomaly ensemble F1 (backtested)"
        />
        <StatTile
          label="Requiring retrain"
          value={0}
          icon={CheckCircle}
          tone="good"
          note="All models within threshold"
        />
      </div>

      {/* Forecasting Model */}
      <Panel
        className="mt-3"
        tone="accent"
        icon={ChartLineUp}
        title="APIx Fare Forecaster"
        meta={`${forecastVersion} · LSTM + Seasonal ARIMA Ensemble`}
        footnote="Retraining runs nightly over the rolling 90-day panel. A 14-day hold-out validates the new weights before they go live. MAPE target is below 4%."
        actions={
          <div className="flex items-center gap-2">
            {forecastRetraining && (
              <span className="vm-num text-[11.5px] text-ink-3">Training… {forecastProgress}%</span>
            )}
            <button
              type="button"
              disabled={forecastRetraining}
              onClick={runForecastRetrain}
              className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 h-8 text-[12.5px] font-medium text-accent-ink transition-colors duration-[var(--vm-dur-fast)] hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-45"
            >
              {forecastRetraining ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent-ink/30 border-t-accent-ink" />
                  Training
                </>
              ) : (
                <>
                  <ArrowsCounterClockwise size={14} weight="bold" />
                  Retrain model
                </>
              )}
            </button>
          </div>
        }
      >
        {/* Progress bar */}
        {forecastRetraining && (
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-chip bg-surface-inset">
            <div
              className="h-full rounded-chip bg-accent transition-[width] duration-100"
              style={{ width: `${forecastProgress}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* Metrics + features */}
          <div className="xl:col-span-4">
            <KeyValue
              dense
              rows={[
                { k: 'Type', v: 'LSTM + Seasonal ARIMA Ensemble' },
                { k: 'Version', v: forecastVersion },
                { k: 'Last trained', v: fmtDayFull(forecastLastTrained) },
                { k: 'Training window', v: '90-day rolling panel' },
              ]}
            />
            <div className="mt-3">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Features
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FORECAST_FEATURES.map((f) => (
                  <span
                    key={f}
                    className="rounded-chip bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2 ring-1 ring-line"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Current metrics
              </p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-control bg-surface-inset p-2.5 text-center ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">MAPE</p>
                  <p className="vm-num mt-1 text-[18px] font-semibold text-ink">{fmtMape(forecastMape)}</p>
                </div>
                <div className="rounded-control bg-surface-inset p-2.5 text-center ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">RMSE</p>
                  <p className="vm-num mt-1 text-[18px] font-semibold text-ink">{fmtRmse(forecastRmse)}</p>
                </div>
                <div className="rounded-control bg-surface-inset p-2.5 text-center ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">MAE</p>
                  <p className="vm-num mt-1 text-[18px] font-semibold text-ink">{fmtRmse(forecastMae)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast accuracy chart */}
          <div className="xl:col-span-8">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              MAPE over training runs
            </p>
            <div className="rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <MultiLine
                data={mapeChartData as unknown as Array<Record<string, unknown>>}
                series={chartSeries}
                xKey="date"
                height={220}
                xFormat={(v) => fmtDay(String(v))}
                yFormat={(n) => `${n.toFixed(1)}%`}
                valueFormat={(n) => `${n.toFixed(2)}%`}
                tipTitle={fmtDayFull}
                yDomain={[2, 4.5]}
                hLines={[
                  { y: 4.0, label: 'Target 4%', color: t.warn },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Training history table */}
        <div className="mt-4">
          <DataTable
            rowKey={(r) => (r as TrainingHistoryEntry).date}
            maxHeight={220}
            columns={[
              {
                key: 'date',
                header: 'Date',
                cell: (r) => <span className="vm-num text-ink">{fmtDayFull((r as TrainingHistoryEntry).date)}</span>,
              },
              {
                key: 'datasetSize',
                header: 'Dataset size',
                align: 'right',
                cell: (r) => <span className="vm-num text-ink-2">{fmtInt((r as TrainingHistoryEntry).datasetSize)}</span>,
              },
              {
                key: 'mape',
                header: 'MAPE',
                align: 'right',
                cell: (r) => (
                  <span className="vm-num font-medium text-ink">{fmtMape((r as TrainingHistoryEntry).mape)}</span>
                ),
              },
              {
                key: 'rmse',
                header: 'RMSE',
                align: 'right',
                cell: (r) => (
                  <span className="vm-num text-ink-2">{fmtRmse((r as TrainingHistoryEntry).rmse)}</span>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                align: 'right',
                cell: (r) => {
                  const s = (r as TrainingHistoryEntry).status
                  return s === 'running' ? (
                    <Badge tone="accent">
                      <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                      {' Training'}
                    </Badge>
                  ) : (
                    <Badge tone="good" icon={CheckCircle}>Completed</Badge>
                  )
                },
              },
            ]}
            rows={FORECAST_HISTORY}
          />
        </div>
      </Panel>

      {/* Anomaly Detection Model */}
      <Panel
        className="mt-3"
        tone="gate"
        icon={Warning}
        title="Fare Anomaly Detector"
        meta={`${anomalyVersion} · Ensemble (Isolation Forest + Statistical Fence + Pattern Match)`}
        footnote="The ensemble aggregates three independent signals. Thresholds below tune the WARN/CRITICAL gate. Analyst-validated anomalies feed back into the training set nightly."
        actions={
          <div className="flex items-center gap-2">
            {anomalyRetraining && (
              <span className="vm-num text-[11.5px] text-ink-3">Training… {anomalyProgress}%</span>
            )}
            <button
              type="button"
              disabled={anomalyRetraining}
              onClick={runAnomalyRetrain}
              className="inline-flex items-center gap-1.5 rounded-control bg-accent px-3 h-8 text-[12.5px] font-medium text-accent-ink transition-colors duration-[var(--vm-dur-fast)] hover:bg-accent-hover disabled:pointer-events-none disabled:opacity-45"
            >
              {anomalyRetraining ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-accent-ink/30 border-t-accent-ink" />
                  Training
                </>
              ) : (
                <>
                  <ArrowsCounterClockwise size={14} weight="bold" />
                  Retrain model
                </>
              )}
            </button>
          </div>
        }
      >
        {/* Progress bar */}
        {anomalyRetraining && (
          <div className="mb-4 h-1.5 w-full overflow-hidden rounded-chip bg-surface-inset">
            <div
              className="h-full rounded-chip bg-accent transition-[width] duration-100"
              style={{ width: `${anomalyProgress}%` }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* Metrics */}
          <div className="xl:col-span-4">
            <KeyValue
              dense
              rows={[
                { k: 'Type', v: 'Ensemble (IF + StatFence + Pattern)' },
                { k: 'Version', v: anomalyVersion },
                { k: 'Last trained', v: fmtDayFull(anomalyLastTrained) },
                { k: 'Detection latency', v: `${anomalyLatency} ms` },
              ]}
            />

            <div className="mt-3">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Metrics
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-control bg-surface-inset p-2 ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Precision</p>
                  <p className="vm-num mt-0.5 text-[16px] font-semibold text-good">{fmtPct(anomalyPrecision * 100, 1)}</p>
                </div>
                <div className="rounded-control bg-surface-inset p-2 ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">Recall</p>
                  <p className="vm-num mt-0.5 text-[16px] font-semibold text-good">{fmtPct(anomalyRecall * 100, 1)}</p>
                </div>
                <div className="rounded-control bg-surface-inset p-2 ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">F1</p>
                  <p className="vm-num mt-0.5 text-[16px] font-semibold text-accent">{fmtPct(anomalyF1 * 100, 1)}</p>
                </div>
                <div className="rounded-control bg-surface-inset p-2 ring-1 ring-line">
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">False positive rate</p>
                  <p className="vm-num mt-0.5 text-[16px] font-semibold text-warn">{fmtFpr(anomalyFpr)}</p>
                </div>
              </div>
            </div>

            {/* Threshold sliders */}
            <div className="mt-4 rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Threshold configuration
              </p>
              <Slider
                label="WARN threshold"
                min={0.2}
                max={0.75}
                step={0.01}
                value={warnThreshold}
                onChange={setWarnThreshold}
                readout={warnThreshold.toFixed(2)}
                hint="Scores above this trigger a WARN-level alert"
              />
              <div className="mt-3">
                <Slider
                  label="CRITICAL threshold"
                  min={warnThreshold + 0.05}
                  max={0.95}
                  step={0.01}
                  value={criticalThreshold}
                  onChange={setCriticalThreshold}
                  readout={criticalThreshold.toFixed(2)}
                  hint="Must sit above WARN; scores above this trigger CRITICAL"
                />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-2.5">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
                    Est. precision
                  </p>
                  <p className="vm-num mt-0.5 text-[14px] font-semibold text-good">
                    {fmtPct(effectPrecision * 100, 1)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-3">
                    Est. recall
                  </p>
                  <p className="vm-num mt-0.5 text-[14px] font-semibold text-accent">
                    {fmtPct(effectRecall * 100, 1)}
                  </p>
                </div>
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-ink-3">
                Estimates are a sigmoid fit to the hold-out window, not live inference.
              </p>
            </div>
          </div>

          {/* Model comparison table */}
          <div className="xl:col-span-8">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Sub-model comparison
            </p>
            <DataTable
              rowKey={(r) => (r as SubModelMetric).model}
              maxHeight={240}
              columns={[
                {
                  key: 'model',
                  header: 'Model',
                  cell: (r) => <span className="font-medium text-ink">{((r as SubModelMetric).model)}</span>,
                },
                {
                  key: 'precision',
                  header: 'Precision',
                  align: 'right',
                  cell: (r) => <span className="vm-num font-medium text-ink">{fmtPct((r as SubModelMetric).precision * 100, 1)}</span>,
                },
                {
                  key: 'recall',
                  header: 'Recall',
                  align: 'right',
                  cell: (r) => <span className="vm-num font-medium text-ink">{fmtPct((r as SubModelMetric).recall * 100, 1)}</span>,
                },
                {
                  key: 'f1',
                  header: 'F1',
                  align: 'right',
                  cell: (r) => (
                    <span className="vm-num font-semibold" style={{ color: t['line-index'] }}>
                      {fmtPct((r as SubModelMetric).f1 * 100, 1)}
                    </span>
                  ),
                },
                {
                  key: 'fpr',
                  header: 'False positive rate',
                  align: 'right',
                  cell: (r) => <span className="vm-num text-warn">{fmtFpr((r as SubModelMetric).fpr)}</span>,
                },
                {
                  key: 'latency',
                  header: 'Latency',
                  align: 'right',
                  cell: (r) => <span className="vm-num text-ink-2">{fmtInt((r as SubModelMetric).latencyMs)} ms</span>,
                },
              ]}
              rows={SUB_MODEL_METRICS}
            />
          </div>
        </div>
      </Panel>

      {/* Model Deployment */}
      <Panel
        className="mt-3"
        tone="neutral"
        icon={GitBranch}
        title="Model deployment"
        meta="Production status, version history, and release controls"
      >
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
          {/* Deployment status */}
          <div className="xl:col-span-5">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Current deployment status
            </p>
            <div className="divide-y divide-line">
              {DEPLOYMENTS.map((d) => (
                <div key={`${d.model}-${d.version}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-medium text-ink">{d.model}</p>
                    <p className="text-[11px] text-ink-3">{d.version} · deployed {fmtDayFull(d.lastDeployed)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={DEPLOY_STATUS_TONE[d.status] ?? 'neutral'}>{d.status}</Badge>
                    {d.status === 'Previous' && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-control bg-surface-2 px-2 h-7 text-[11px] font-medium text-ink-2 ring-1 ring-line transition-colors hover:bg-surface-3"
                      >
                        <ArrowsCounterClockwise size={12} weight="bold" />
                        Rollback
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* A/B test */}
            <div className="mt-3 rounded-control bg-surface-inset p-3 ring-1 ring-line">
              <Toggle
                checked={abTestEnabled}
                onChange={setAbTestEnabled}
                label="A/B test: compare current vs. previous model"
                hint={`Currently serving ${forecastVersion} (primary) vs v2.3.9 (shadow). Traffic split: 90 / 10.`}
              />
              {abTestEnabled && (
                <div className="mt-2.5 border-t border-line pt-2.5">
                  <p className="text-[11px] leading-relaxed text-ink-3">
                    Shadow traffic is flowing to the previous version. Results will be available after a
                    14-day evaluation window. The model with the lower MAPE on the hold-out set will be
                    promoted.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Version history */}
          <div className="xl:col-span-7">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Version history
            </p>
            <DataTable
              rowKey={(r) => (r as VersionEntry).version}
              columns={[
                {
                  key: 'version',
                  header: 'Version',
                  cell: (r) => (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink vm-num">{(r as VersionEntry).version}</span>
                      {(r as VersionEntry).status === 'current' && <Badge tone="good">Live</Badge>}
                      {(r as VersionEntry).status === 'ab-test' && <Badge tone="accent">A/B</Badge>}
                      {(r as VersionEntry).status === 'rollback' && <Badge tone="neutral">Archived</Badge>}
                    </div>
                  ),
                },
                {
                  key: 'date',
                  header: 'Released',
                  cell: (r) => <span className="vm-num text-ink-2">{fmtDayFull((r as VersionEntry).date)}</span>,
                },
                {
                  key: 'mapescore',
                  header: 'MAPE',
                  align: 'right',
                  cell: (r) => (
                    <span className="vm-num text-ink">{fmtMape((r as VersionEntry).mapescore)}</span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Role',
                  align: 'right',
                  cell: (r) => {
                    const s = (r as VersionEntry).status
                    const labels: Record<string, string> = { current: 'Current', 'ab-test': 'A/B test', rollback: 'Rollback target' }
                    return <span className="text-[11.5px] text-ink-3">{labels[s]}</span>
                  },
                },
              ]}
              rows={VERSION_HISTORY}
            />
          </div>
        </div>
      </Panel>

      <div className="mt-3">
        <Callout tone="neutral" title="How retraining works">
          Both models retrain nightly on the rolling 90-day in-browser panel. No backend is
          involved; all training data lives in the browser's seeded state. Analyst-validated
          anomalies feed back into the training set, so the model improves as the review queue is
          resolved. The simulation here reflects the intended production behaviour.
        </Callout>
      </div>
    </div>
  )
}
