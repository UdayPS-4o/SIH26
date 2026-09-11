import { useMemo } from 'react'
import {
  CheckCircle,
  Clock,
  Gauge,
  Info,
  Lightning,
  Robot,
  TrendUp,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  Legend,
  MultiLine,
  PageHeader,
  Panel,
  StatTile,
  cx,
  type Tone,
} from '@/ds'
import { fmtDayFull, fmtInt, fmtPct } from '@/lib/format'

/* ==========================================================================
   Interfaces
   ========================================================================== */

interface AnomalyAlert {
  id: string
  severity: 'CRITICAL' | 'WARN' | 'INFO'
  sector: string
  leadWindow: string
  description: string
  confidence: number
  cause: 'Data error' | 'Demand shock' | 'Fuel surcharge' | 'Festival'
  status: 'Open' | 'Investigating' | 'Resolved'
  detectedAt: string
}

interface ModelPerformance {
  model: string
  precision: number
  recall: number
  f1: number
  latencyMs: number
  status: string
}

interface DetectionRule {
  name: string
  threshold: string
  sensitivity: string
  lastTriggered: string
  autoAction: string
}

const SEVERITY_TONE: Record<AnomalyAlert['severity'], Tone> = {
  CRITICAL: 'critical',
  WARN: 'warn',
  INFO: 'accent',
}

const ALERT_STATUS_TONE: Record<AnomalyAlert['status'], Tone> = {
  Open: 'warn',
  Investigating: 'accent',
  Resolved: 'good',
}

/* ==========================================================================
   Synthetic data — fabricated for demo purposes.
   The model is described as trained on 90-day panel data.
   ========================================================================== */

const ANOMALY_ALERTS: AnomalyAlert[] = [
  {
    id: 'a1',
    severity: 'CRITICAL',
    sector: 'DEL-BOM',
    leadWindow: 'T+7',
    description: 'Single-sector fare jumped 41% in the last 24 hours on the DEL-BOM trunk. The movement is 1.6 standard deviations beyond the expected seasonal band for this lead window.',
    confidence: 0.92,
    cause: 'Demand shock',
    status: 'Open',
    detectedAt: '2026-09-11T08:14:00+05:30',
  },
  {
    id: 'a2',
    severity: 'CRITICAL',
    sector: 'BOM-CCU',
    leadWindow: 'T+15',
    description: 'Five consecutive data points from the BOM-CCU sector are missing after a CAPTCHA interstitial appeared on the aggregator source. Panel yield for this cell dropped to zero.',
    confidence: 0.88,
    cause: 'Data error',
    status: 'Investigating',
    detectedAt: '2026-09-11T06:42:00+05:30',
  },
  {
    id: 'a3',
    severity: 'WARN',
    sector: 'BLR-CJB',
    leadWindow: 'T+30',
    description: 'Cross-sector correlation between BLR-CJB and BLR-HYD broke down. The two sectors typically move together within a 5% band; they diverged by 12% over 48 hours.',
    confidence: 0.74,
    cause: 'Demand shock',
    status: 'Open',
    detectedAt: '2026-09-10T21:30:00+05:30',
  },
  {
    id: 'a4',
    severity: 'WARN',
    sector: 'DEL-HYD',
    leadWindow: 'T+7',
    description: 'Fare reversal detected: price dropped 18% mid-week then spiked back to near-original levels within 36 hours. Pattern is consistent with a temporary promotional flash sale.',
    confidence: 0.67,
    cause: 'Fuel surcharge',
    status: 'Resolved',
    detectedAt: '2026-09-09T14:10:00+05:30',
  },
  {
    id: 'a5',
    severity: 'INFO',
    sector: 'CCU-DEL',
    leadWindow: 'T+22',
    description: 'Lead-time curve distortion on CCU-DEL: the T+22 fare is priced below T+30 for the first time in the 90-day training window. Mild, but worth watching before it stabilises.',
    confidence: 0.53,
    cause: 'Festival',
    status: 'Investigating',
    detectedAt: '2026-09-10T09:55:00+05:30',
  },
]

const MODEL_PERFORMANCE: ModelPerformance[] = [
  {
    model: 'Isolation Forest',
    precision: 0.913,
    recall: 0.886,
    f1: 0.899,
    latencyMs: 42,
    status: 'Active',
  },
  {
    model: 'Statistical Fence',
    precision: 0.847,
    recall: 0.912,
    f1: 0.879,
    latencyMs: 8,
    status: 'Active',
  },
  {
    model: 'Pattern Match',
    precision: 0.781,
    recall: 0.754,
    f1: 0.767,
    latencyMs: 15,
    status: 'Active',
  },
  {
    model: 'Ensemble',
    precision: 0.942,
    recall: 0.918,
    f1: 0.930,
    latencyMs: 65,
    status: 'Active',
  },
]

const DETECTION_RULES: DetectionRule[] = [
  {
    name: 'Single-sector jump',
    threshold: '>30% in 24h',
    sensitivity: 'High',
    lastTriggered: 'Today, 08:14',
    autoAction: 'Flag for review, suppress index cell',
  },
  {
    name: 'Cross-sector correlation break',
    threshold: 'Divergence >10% over 48h',
    sensitivity: 'Medium',
    lastTriggered: 'Yesterday, 21:30',
    autoAction: 'Alert analyst, tag both sectors',
  },
  {
    name: 'Fare reversal',
    threshold: 'Drop then spike within 72h',
    sensitivity: 'Medium',
    lastTriggered: '2 days ago',
    autoAction: 'Mark transient, exclude from daily average',
  },
  {
    name: 'CAPTCHA / block pattern',
    threshold: 'Zero yield for a sector for >4h',
    sensitivity: 'High',
    lastTriggered: 'Today, 06:42',
    autoAction: 'Demote source, reroute to licensed API',
  },
  {
    name: 'Lead-time curve distortion',
    threshold: 'Fare at T+n below T+(n+8)',
    sensitivity: 'Low',
    lastTriggered: 'Yesterday, 09:55',
    autoAction: 'Watch for 48h before escalation',
  },
]

function buildTimelineData() {
  const data: Array<{ date: string; score: number }> = []
  const today = new Date('2026-09-11T00:00:00+05:30')
  // Synthetic anomaly scores: mostly low (0.1-0.3), with occasional spikes
  const scores: number[] = [
    0.18, 0.22, 0.15, 0.25, 0.31, 0.72, 0.45, 0.28, 0.19, 0.24, // d-29 to d-20
    0.33, 0.55, 0.21, 0.17, 0.29, 0.38, 0.81, 0.52, 0.27, 0.14, // d-19 to d-10
    0.22, 0.35, 0.19, 0.41, 0.63, 0.28, 0.16, 0.24, 0.88, 0.47, // d-9 to d-1
  ]
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const iso = d.toISOString().split('T')[0]
    const score = scores[29 - i]
    data.push({ date: iso, score })
  }
  return data
}

const TIMELINE_DATA = buildTimelineData()

const TIMELINE_SERIES = [
  { key: 'score', label: 'Anomaly score', color: 'var(--vm-accent)', width: 2.4 },
]

/* ==========================================================================
   Helpers
   ========================================================================== */

function fmtConfidence(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

function statusIcon(severity: AnomalyAlert['severity']): 'Warning' | 'Info' | 'CheckCircle' {
  if (severity === 'CRITICAL') return 'Warning'
  if (severity === 'WARN') return 'Warning'
  return 'Info'
}

/* ==========================================================================
   Page
   ========================================================================== */

export function AnomalyPage() {
  const t = useChartTokens()

  const series = useMemo(
    () =>
      TIMELINE_SERIES.map((s) => ({
        ...s,
        color: t['line-index'],
      })),
    [t],
  )

  return (
    <div>
      <PageHeader
        kicker="AI Anomaly Detection"
        title="Fare movements that warrant a human look"
        lede="The system uses an ensemble of Isolation Forest, statistical fences and pattern matching to flag unusual fare movements that could indicate data errors, demand shocks, or policy changes. The model is trained on 90 days of historical panel data. Results shown here are simulated for demonstration."
        actions={
          <Badge tone="accent" icon={Robot}>
            Trained on 90-day panel
          </Badge>
        }
      />

      {/* Stats Row */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Anomalies detected today"
          value={3}
          icon={Warning}
          tone="warn"
          note="Across all sectors and lead windows"
        />
        <StatTile
          label="Model accuracy (backtested)"
          value={fmtPct(94.2, 1)}
          icon={Gauge}
          tone="good"
          note="Ensemble F1 on held-out 30-day window"
        />
        <StatTile
          label="False positive rate"
          value={fmtPct(5.8, 1)}
          icon={TrendUp}
          tone="accent"
          note="Share of alerts that resolved as benign"
        />
        <StatTile
          label="Average detection lag"
          value="2.4h"
          unit=""
          icon={Clock}
          tone="neutral"
          note="From first anomaly signal to analyst notification"
        />
      </div>

      {/* Active Alerts Panel */}
      <Panel
        className="mt-3"
        icon={Warning}
        title="Active alerts"
        meta={`${ANOMALY_ALERTS.length} alerts · ${ANOMALY_ALERTS.filter((a) => a.severity === 'CRITICAL').length} critical`}
        bleed
      >
        <div className="space-y-3">
          {ANOMALY_ALERTS.map((alert) => {
            const tone = SEVERITY_TONE[alert.severity]
            const statusTone = ALERT_STATUS_TONE[alert.status]
            const IconCmp = alert.severity === 'CRITICAL' ? Warning : alert.severity === 'WARN' ? Warning : Info

            return (
              <div
                key={alert.id}
                className={cx(
                  'rounded-control p-4 ring-1',
                  alert.severity === 'CRITICAL' ? 'bg-critical-soft ring-critical/40' : 'bg-surface-2 ring-line',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={tone} icon={IconCmp}>
                    {alert.severity}
                  </Badge>
                  <span className="vm-num font-semibold text-ink">{alert.sector}</span>
                  <span className="vm-num text-[11px] text-ink-3">{alert.leadWindow}</span>
                  <span className="ml-auto vm-num text-[11px] text-ink-3">
                    {fmtDayFull(alert.detectedAt)}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{alert.description}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-3 text-[11.5px]">
                  <span className="text-ink-3">
                    Confidence: <span className="font-medium text-ink">{fmtConfidence(alert.confidence)}</span>
                  </span>
                  <span className="text-ink-3">
                    Cause:{' '}
                    <span className="font-medium text-ink">{alert.cause}</span>
                  </span>
                  <Badge tone={statusTone}>{alert.status}</Badge>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t border-line px-4 py-2.5 text-[11.5px] leading-relaxed text-ink-3">
          Alerts are generated by the ensemble model every 15 minutes. Critical alerts page an analyst immediately; warn-level alerts are batched for the morning review.
        </div>
      </Panel>

      {/* Model Performance Panel */}
      <Panel
        className="mt-3"
        icon={Gauge}
        title="Model performance"
        meta="Backtested on a held-out 30-day window from the 90-day training panel"
        footnote="Precision and recall are computed against analyst-labelled ground truth. Latency is the p99 end-to-end time per cell in the panel."
      >
        <DataTable
          rowKey={(r) => r.model}
          maxHeight={320}
          columns={[
            {
              key: 'model',
              header: 'Model',
              cell: (r) => <span className="font-medium text-ink">{r.model}</span>,
            },
            {
              key: 'precision',
              header: 'Precision',
              align: 'right',
              cell: (r) => <span className="vm-num font-medium text-ink">{fmtPct(r.precision)}</span>,
            },
            {
              key: 'recall',
              header: 'Recall',
              align: 'right',
              cell: (r) => <span className="vm-num font-medium text-ink">{fmtPct(r.recall)}</span>,
            },
            {
              key: 'f1',
              header: 'F1',
              align: 'right',
              cell: (r) => (
                <span className="vm-num font-semibold" style={{ color: t['line-index'] }}>
                  {fmtPct(r.f1)}
                </span>
              ),
            },
            {
              key: 'latency',
              header: 'Latency',
              align: 'right',
              cell: (r) => (
                <span className="vm-num text-ink-2">
                  {fmtInt(r.latencyMs)} ms
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              cell: (r) => (
                <Badge tone="good" icon={CheckCircle}>
                  {r.status}
                </Badge>
              ),
            },
          ]}
          rows={MODEL_PERFORMANCE}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* Detection Rules Engine Panel */}
        <Panel
          className="xl:col-span-5"
          icon={Lightning}
          title="Detection rules engine"
          meta="Five rules, tuned on the 90-day panel"
          footnote="Thresholds are set conservatively. A rule that fires too aggressively adds analyst load without improving recall."
        >
          <div className="divide-y divide-line">
            {DETECTION_RULES.map((rule) => (
              <div key={rule.name} className="px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-semibold text-ink">{rule.name}</span>
                  <span className="vm-num text-[11px] text-ink-3">{rule.lastTriggered}</span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-2">
                  <span>
                    Threshold: <span className="font-medium text-ink">{rule.threshold}</span>
                  </span>
                  <span>
                    Sensitivity: <span className="font-medium text-ink">{rule.sensitivity}</span>
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-ink-3">{rule.autoAction}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Anomaly Timeline Panel */}
        <Panel
          className="xl:col-span-7"
          icon={TrendUp}
          title="Anomaly score over the last 30 days"
          meta="Ensemble output, higher is more anomalous · threshold lines shown"
          footnote="Scores are the ensemble probability output scaled to 0–1. Values above 0.70 are classified CRITICAL, above 0.45 are WARN. The model retrains nightly on the rolling 90-day panel."
        >
          <div className="mb-3">
            <Legend
              items={[
                { label: 'Anomaly score', color: t['line-index'] },
                { label: 'WARN threshold (0.45)', color: t.warn, dashed: true },
                { label: 'CRITICAL threshold (0.70)', color: t.gate, dashed: true },
              ]}
            />
          </div>
          <MultiLine
            data={TIMELINE_DATA as unknown as Array<Record<string, unknown>>}
            series={[
              { key: 'score', label: 'Anomaly score', color: t['line-index'], width: 2.4 },
            ]}
            height={260}
            xFormat={(v) => fmtDay(String(v))}
            yFormat={(n) => n.toFixed(2)}
            valueFormat={(n) => n.toFixed(2)}
            tipTitle={fmtDayFull}
            yDomain={[0, 1]}
            hLines={[
              { y: 0.45, label: 'WARN 0.45', color: t.warn },
              { y: 0.7, label: 'CRITICAL 0.70', color: t.gate },
            ]}
          />
        </Panel>
      </div>

      <div className="mt-3">
        <Callout tone="neutral" title="How to interpret these results">
          Every figure on this page is simulated for demonstration. The ensemble model, thresholds and rule logic described here reflect the intended production design. Backtesting on a held-out 30-day window from the 90-day training panel yields the precision and recall figures shown above. Critical alerts require analyst acknowledgement before the index cell is suppressed.
        </Callout>
      </div>
    </div>
  )
}
