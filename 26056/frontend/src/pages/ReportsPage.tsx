import { useMemo } from 'react'
import {
  CheckCircle,
  Clock,
  DownloadSimple,
  Document,
  Envelope,
  Globe,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  DataTable,
  KeyValue,
  PageHeader,
  Panel,
  StatTile,
  cx,
} from '@/ds'
import { fmtDayFull, fmtIndex, fmtInt } from '@/lib/format'
import { downloadCsv, downloadJson } from '@/lib/download'
import { DEMO_DATE } from '@/data/generate'

/* ------------------------------------------------------------------ */
/*  Synthetic data                                                    */
/* ------------------------------------------------------------------ */

const TODAY = DEMO_DATE

const REPORT_TEMPLATES = [
  {
    id: 'daily-brief',
    name: 'Daily Brief',
    desc: 'Index value + top movers + quality gate',
    pages: 1,
    formats: ['PDF', 'HTML'],
    audience: 'MoSPI eSankhyiki, RBI desk',
    genTime: '2.1s',
    tone: 'good' as const,
  },
  {
    id: 'weekly-summary',
    name: 'Weekly Summary',
    desc: 'Trend analysis + sector review',
    pages: 4,
    formats: ['PDF'],
    audience: 'Internal analysts',
    genTime: '4.8s',
    tone: 'accent' as const,
  },
  {
    id: 'monthly-release',
    name: 'Monthly Release',
    desc: 'Full methodology + tables + charts',
    pages: 8,
    formats: ['PDF', 'HTML'],
    audience: 'Public, MoSPI, RBI',
    genTime: '12.3s',
    tone: 'accent' as const,
  },
  {
    id: 'sector-deep-dive',
    name: 'Sector Deep-dive',
    desc: 'Per-sector analysis',
    pages: 2,
    formats: ['PDF', 'CSV'],
    audience: 'Sector-specific subscribers',
    genTime: '3.7s',
    tone: 'neutral' as const,
  },
  {
    id: 'anomaly-alert',
    name: 'Anomaly Alert',
    desc: 'Triggered by AI detection',
    pages: 1,
    formats: ['PDF', 'JSON', 'HTML'],
    audience: 'Operations team',
    genTime: '0.8s',
    tone: 'warn' as const,
  },
  {
    id: 'compliance-report',
    name: 'Compliance Report',
    desc: 'Audit trail + source health',
    pages: 3,
    formats: ['PDF', 'CSV', 'JSON'],
    audience: 'Legal, MoSPI compliance',
    genTime: '5.4s',
    tone: 'good' as const,
  },
]

interface QueueRow {
  id: string
  reportType: string
  generatedAt: string
  format: string
  size: string
  status: 'completed' | 'generating' | 'queued'
}

const QUEUE_ROWS: QueueRow[] = [
  { id: 'q1', reportType: 'Daily Brief', generatedAt: `${TODAY}T04:02:00+05:30`, format: 'PDF', size: '142', status: 'completed' },
  { id: 'q2', reportType: 'Weekly Summary', generatedAt: `${TODAY}T03:15:00+05:30`, format: 'PDF', size: '891', status: 'completed' },
  { id: 'q3', reportType: 'Anomaly Alert', generatedAt: `${TODAY}T02:48:00+05:30`, format: 'JSON', size: '23', status: 'completed' },
  { id: 'q4', reportType: 'Compliance Report', generatedAt: `${TODAY}T06:00:00+05:30`, format: 'PDF', size: '456', status: 'completed' },
  { id: 'q5', reportType: 'Daily Brief', generatedAt: `${TODAY}T04:15:00+05:30`, format: 'HTML', size: '118', status: 'generating' },
  { id: 'q6', reportType: 'Sector Deep-dive', generatedAt: `${TODAY}T05:30:00+05:30`, format: 'PDF', size: '312', status: 'queued' },
  { id: 'q7', reportType: 'Monthly Release', generatedAt: `${TODAY}T07:00:00+05:30`, format: 'PDF', size: '2.4 MB', status: 'queued' },
  { id: 'q8', reportType: 'Daily Brief', generatedAt: `${TODAY}T05:45:00+05:30`, format: 'JSON', size: '48', status: 'generating' },
]

const DISTRIBUTION_CHANNELS = [
  { name: 'eSankhyiki portal (MoSPI)', frequency: 'Daily', status: 'active', tone: 'good' as const },
  { name: 'RBI Data Warehouse', frequency: 'Daily', status: 'active', tone: 'good' as const },
  { name: 'DGCA monthly bulletin', frequency: 'Monthly', status: 'active', tone: 'good' as const },
  { name: 'Public data portal (data.gov.in)', frequency: 'Daily', status: 'active', tone: 'good' as const },
  { name: 'Email digest (subscribers)', frequency: 'Weekly', status: 'active', tone: 'good' as const },
  { name: 'SDMX endpoint', frequency: 'Real-time', status: 'active', tone: 'good' as const },
]

/* ------------------------------------------------------------------ */
/*  Download helpers                                                  */
/* ------------------------------------------------------------------ */

function buildSampleCsv() {
  const rows = [
    { date: TODAY, route: 'DEL-BOM', lead: 7, apix: 112.4, change: '+4.2%' },
    { date: TODAY, route: 'BOM-CCU', lead: 15, apix: 108.7, change: '+3.8%' },
    { date: TODAY, route: 'DEL-HYD', lead: 1, apix: 109.3, change: '+3.1%' },
    { date: TODAY, route: 'BLR-MAA', lead: 30, apix: 94.2, change: '-2.1%' },
    { date: TODAY, route: 'DEL-AMD', lead: 45, apix: 96.8, change: '-1.8%' },
    { date: TODAY, route: 'BOM-GOI', lead: 7, apix: 102.1, change: '-1.5%' },
  ]
  return rows
}

function buildSampleSdmx() {
  return {
    meta: {
      schema: 'https://sdmx.org/schema/2.1/data/sdmx-json.json',
      id: 'APIX-DAILY',
      prepared: `${TODAY}T04:02:00+05:30`,
      contentLanguages: ['en'],
      sender: { id: 'MOSPI-DIID', name: 'Ministry of Statistics and Programme Implementation' },
    },
    data: {
      structure: {
        name: 'Airfare Price Index for India (APIx)',
        dimensions: {
          series: [
            { id: 'REF_AREA', name: 'Reference area', values: [{ id: 'IN', name: 'India' }] },
            { id: 'MEASURE', name: 'Measure', values: [{ id: 'TOTAL_FARE', name: 'Total fare' }] },
            { id: 'FREQ', name: 'Frequency', values: [{ id: 'D', name: 'Daily' }] },
          ],
          observation: [
            {
              id: 'TIME_PERIOD',
              name: 'Time period',
              values: [{ id: TODAY, name: TODAY }],
            },
          ],
        },
        attributes: {
          observation: [
            {
              id: 'OBS_STATUS',
              name: 'Observation status',
              values: [
                { id: 'A', name: 'Normal' },
                { id: 'P', name: 'Provisional' },
              ],
            },
          ],
        },
      },
      dataSets: [
        {
          action: 'Replace',
          series: {
            '0:0:0': {
              attributes: [],
              observations: { 0: [107.83, 1, 107.21, 108.45] },
            },
          },
        },
      ],
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function ReportsPage() {
  const queue = QUEUE_ROWS
  const statusTone = (s: QueueRow['status']) =>
    s === 'completed' ? 'good' : s === 'generating' ? 'accent' : 'neutral'

  const queueColumns = [
    {
      key: 'reportType',
      header: 'Report type',
      cell: (r: QueueRow) => <span className="text-ink">{r.reportType}</span>,
    },
    {
      key: 'generatedAt',
      header: 'Generated at',
      align: 'right' as const,
      cell: (r: QueueRow) => (
        <span className="vm-num text-ink-2">{r.generatedAt.replace('+05:30', ' IST')}</span>
      ),
    },
    {
      key: 'format',
      header: 'Format',
      align: 'right' as const,
      cell: (r: QueueRow) => (
        <span className="vm-num text-ink-2">{r.format}</span>
      ),
    },
    {
      key: 'size',
      header: 'Size',
      align: 'right' as const,
      cell: (r: QueueRow) => (
        <span className="vm-num text-ink-2">{r.size} KB</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'right' as const,
      cell: (r: QueueRow) => (
        <Badge tone={statusTone(r.status)} icon={r.status === 'completed' ? CheckCircle : r.status === 'generating' ? Clock : undefined}>
          {r.status === 'completed' ? 'Completed' : r.status === 'generating' ? 'Generating' : 'Queued'}
        </Badge>
      ),
    },
    {
      key: 'download',
      header: '',
      align: 'right' as const,
      cell: (r: QueueRow) =>
        r.status === 'completed' ? (
          <Button
            size="sm"
            variant="ghost"
            icon={DownloadSimple}
            onClick={() => {
              const blob = new Blob(
                [`VIMAAN — ${r.reportType}\nDate: ${TODAY}\nFormat: ${r.format}\n\nAPIx: 107.83 (+1.17%)\n\nThis is a synthetic preview report.`],
                { type: 'text/plain' },
              )
              downloadCsv(`vimaan-${r.reportType.toLowerCase().replace(/\s+/g, '-')}-${TODAY}.${r.format.toLowerCase()}`, [], [])
            }}
          >
            Download
          </Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageHeader
        kicker="Automated reporting"
        title="Publication-ready reports, generated nightly"
        lede={
          <>
            The system auto-generates daily briefs, weekly summaries, and monthly statistical
            releases in formats suitable for direct submission to MoSPI's eSankhyiki portal and for
            RBI's inflation monitoring desk. Reports include the index value, confidence intervals,
            sector breakdown, methodology notes, and quality indicators.
          </>
        }
      />

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Reports generated (90 days)"
          value={270}
          icon={Document}
          tone="accent"
          note="3 per day, every night"
        />
        <StatTile
          label="Report templates"
          value={6}
          icon={Clock}
          tone="neutral"
          note="Daily through monthly"
        />
        <StatTile
          label="Auto-distribution list"
          value={12}
          icon={Envelope}
          tone="accent"
          note="6 active channels"
        />
        <StatTile
          label="Average generation time"
          value="3.2s"
          icon={Clock}
          tone="neutral"
          note="End-to-end, PDF render"
        />
      </div>

      {/* Report Templates */}
      <Panel
        className="mt-3"
        icon={Document}
        title="Report templates"
        meta="Six report types, each with a fixed schema for downstream automation"
        bleed
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-control bg-surface-inset p-4 ring-1 ring-line"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-[13px] font-semibold text-ink">{tpl.name}</p>
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-3">{tpl.desc}</p>
                </div>
                <Badge tone={tpl.tone}>{tpl.pages}pg</Badge>
              </div>
              <div className="mt-3 space-y-1.5">
                <div className="flex flex-wrap gap-1">
                  {tpl.formats.map((f) => (
                    <span
                      key={f}
                      className="rounded-chip px-1.5 py-0.5 font-mono text-[10px] font-medium bg-surface-2 text-ink-3"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] text-ink-3">{tpl.audience}</span>
                  <span className="vm-num text-[10.5px] text-ink-3">~{tpl.genTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Daily Brief Preview */}
      <Panel
        className="mt-3"
        icon={Document}
        title="Latest daily brief"
        meta="Auto-generated — 11 Sep 2026, 04:02 IST"
        actions={
          <div className="flex items-center gap-2">
            <Badge tone="accent" icon={Clock}>
              PROVISIONAL
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              icon={DownloadSimple}
              onClick={() => {
                const pdfContent = `VIMAAN — Daily Airfare Price Index\nDate: ${fmtDayFull(TODAY)}\n\nAPIx (Total Fare): 107.83 (2024 = 100)\nChange: +1.24 (+1.17%)\n95% CI: [107.21, 108.45]\nCoverage: 82.3%\n\nTop 3 Gainers:\n  DEL-BOM T+7: +4.2%\n  BOM-CCU T+15: +3.8%\n  DEL-HYD T+1: +3.1%\n\nTop 3 Losers:\n  BLR-MAA T+30: -2.1%\n  DEL-AMD T+45: -1.8%\n  BOM-GOI T+7: -1.5%\n\nPublication status: PROVISIONAL\nMethodology: Jevons formula, block bootstrap 95% CI\n\n---\nThis is a synthetic preview report generated by VIMAAN.`
                const blob = new Blob([pdfContent], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `vimaan-daily-brief-${TODAY}.txt`
                document.body.appendChild(a)
                a.click()
                a.remove()
                setTimeout(() => URL.revokeObjectURL(url), 1000)
              }}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        <div className="rounded-control bg-surface-inset ring-1 ring-line">
          {/* Fake PDF header */}
          <div className="border-b border-line px-6 py-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-[15px] font-bold tracking-tight text-ink">
                  VIMAAN — Daily Airfare Price Index
                </p>
                <p className="mt-0.5 vm-num text-[11.5px] text-ink-3">
                  {fmtDayFull(TODAY)} · Provisional · Ref: VIMAAN/DB/{TODAY.replace(/-/g, '')}
                </p>
              </div>
              <span className="rounded-chip bg-accent-soft px-2 py-1 font-mono text-[10px] font-semibold text-accent ring-1 ring-accent-line">
                PROVISIONAL
              </span>
            </div>
          </div>

          {/* Index value block */}
          <div className="border-b border-line px-6 py-5">
            <div className="flex items-end gap-4">
              <span className="vm-num text-[48px] font-semibold leading-none tracking-tight text-ink">
                {fmtIndex(107.83)}
              </span>
              <div className="pb-1.5">
                <span className="font-mono text-[11px] text-good">+1.24</span>
                <span className="ml-1 font-mono text-[11px] text-good">(+1.17%)</span>
              </div>
            </div>
            <p className="mt-1 font-mono text-[10.5px] text-ink-3">2024 = 100 base</p>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">95% CI</p>
                <p className="mt-0.5 vm-num text-[13px] font-medium text-ink">
                  [{fmtIndex(107.21)}, {fmtIndex(108.45)}]
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Coverage</p>
                <p className="mt-0.5 vm-num text-[13px] font-medium text-ink">82.3%</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Band width</p>
                <p className="mt-0.5 vm-num text-[13px] font-medium text-ink">{fmtIndex(0.62)} pts</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">Previous</p>
                <p className="mt-0.5 vm-num text-[13px] font-medium text-ink">{fmtIndex(106.59)}</p>
              </div>
            </div>
          </div>

          {/* Top movers */}
          <div className="border-b border-line px-6 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                  Top 3 gainers
                </p>
                <ul className="space-y-1.5">
                  {[
                    { route: 'DEL-BOM', lead: 7, change: +4.2 },
                    { route: 'BOM-CCU', lead: 15, change: +3.8 },
                    { route: 'DEL-HYD', lead: 1, change: +3.1 },
                  ].map((g) => (
                    <li key={g.route} className="flex items-center justify-between">
                      <span className="text-[12px] text-ink-2">
                        {g.route} T+{g.lead}
                      </span>
                      <span className="vm-num text-[12px] font-medium text-good">
                        +{g.change.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                  Top 3 losers
                </p>
                <ul className="space-y-1.5">
                  {[
                    { route: 'BLR-MAA', lead: 30, change: -2.1 },
                    { route: 'DEL-AMD', lead: 45, change: -1.8 },
                    { route: 'BOM-GOI', lead: 7, change: -1.5 },
                  ].map((g) => (
                    <li key={g.route} className="flex items-center justify-between">
                      <span className="text-[12px] text-ink-2">
                        {g.route} T+{g.lead}
                      </span>
                      <span className="vm-num text-[12px] font-medium text-critical">
                        {g.change.toFixed(1)}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Methodology note */}
          <div className="px-6 py-4">
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
              Methodology note
            </p>
            <p className="text-[11.5px] leading-relaxed text-ink-2">
              The index is compiled using the Jevons formula across {fmtInt(82)} elementary cells
              (sector, carrier, lead window, cabin, weekday band). The 95% confidence interval is
              derived from a block bootstrap with 1,000 replications. Coverage of
              82.3% exceeds the 70% publication gate. This value is provisional and will be revised
              at T+7.
            </p>
            <div className="mt-3">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                Data quality indicators
              </p>
              <KeyValue
                dense
                rows={[
                  { k: 'Coverage', v: '82.3%', tone: 'good' },
                  { k: 'Sources active', v: '8 of 12' },
                  { k: 'Block rate', v: '0.2%' },
                  { k: 'p95 latency', v: '1.8s' },
                  { k: 'Cells suppressed', v: '14 of 82' },
                  { k: 'Published', v: 'Yes — gate cleared' },
                ]}
              />
            </div>
          </div>
        </div>
      </Panel>

      {/* Generation Queue */}
      <Panel
        className="mt-3"
        icon={Clock}
        title="Report generation queue"
        meta="Recent and upcoming report generations"
      >
        <DataTable
          rowKey={(r) => r.id}
          maxHeight={380}
          columns={queueColumns}
          rows={queue}
        />
      </Panel>

      {/* Distribution */}
      <Panel
        className="mt-3"
        icon={Globe}
        title="Auto-distribution channels"
        meta="Reports flow to six destinations on their respective schedules"
        bleed
      >
        <div className="grid grid-cols-1 gap-px bg-[var(--vm-line)] sm:grid-cols-2 lg:grid-cols-3">
          {DISTRIBUTION_CHANNELS.map((ch) => (
            <div key={ch.name} className="flex items-start gap-3 bg-surface p-4">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-control bg-good-soft text-good ring-1 ring-good-line">
                {ch.name.includes('eSankhyiki') || ch.name.includes('RBI') ? (
                  <CheckCircle size={15} weight="duotone" />
                ) : ch.name.includes('email') ? (
                  <Envelope size={15} weight="duotone" />
                ) : ch.name.includes('data.gov') ? (
                  <Globe size={15} weight="duotone" />
                ) : (
                  <Document size={15} weight="duotone" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold leading-tight text-ink">{ch.name}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge tone={ch.tone} className="text-[10px]">
                    {ch.frequency}
                  </Badge>
                  <span className="vm-num text-[10.5px] text-ink-3">Active</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Download Samples */}
      <Panel
        className="mt-3"
        icon={DownloadSimple}
        title="Sample report downloads"
        meta="Export data in the formats consumers actually use"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() => {
              const pdfContent = `VIMAAN — Daily Brief\nDate: ${fmtDayFull(TODAY)}\n\nAPIx: 107.83 (+1.17%)\n95% CI: [107.21, 108.45]\nStatus: PROVISIONAL\nCoverage: 82.3%\n\nTop Gainers:\n  DEL-BOM T+7: +4.2%\n  BOM-CCU T+15: +3.8%\n  DEL-HYD T+1: +3.1%\n\nTop Losers:\n  BLR-MAA T+30: -2.1%\n  DEL-AMD T+45: -1.8%\n  BOM-GOI T+7: -1.5%\n\n---\nGenerated by VIMAAN | MoSPI/RBI publication system\nThis is a synthetic sample.`
              const blob = new Blob([pdfContent], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `vimaan-daily-brief-${TODAY}.txt`
              document.body.appendChild(a)
              a.click()
              a.remove()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Download Daily Brief (PDF)
          </Button>

          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() => {
              const content = `VIMAAN — Weekly Summary\nWeek ending: ${fmtDayFull(TODAY)}\n\nTrend: Upward (+1.17%)\nSector review: Aviation services positive\nAll 6 sectors contributing positively\n\nMethodology: Jevons formula, block bootstrap\nCoverage: 82.3% (gate: 70%)\n`
              const blob = new Blob([content], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `vimaan-weekly-summary-${TODAY}.txt`
              document.body.appendChild(a)
              a.click()
              a.remove()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Download Weekly Summary (PDF)
          </Button>

          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() => {
              const content = `VIMAAN — Monthly Release\nMonth: September 2026\n\nAPIx Monthly Average: 106.45 (2024 = 100)\nMonthly Change: +2.34 (+2.25%)\n\nMethodology Section:\nThe APIx uses the Jevons geometric-mean formula at the elementary cell level\nand aggregates across strata using DGCA traffic-share weights.\n\nTables: per-sector index values, per-lead-window contributions\nCharts: 12-month series, sector heatmap\n`
              const blob = new Blob([content], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `vimaan-monthly-release-sep-2026.txt`
              document.body.appendChild(a)
              a.click()
              a.remove()
              setTimeout(() => URL.revokeObjectURL(url), 1000)
            }}
          >
            Download Monthly Release (PDF)
          </Button>

          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() =>
              downloadCsv(`vimaan-report-data-${TODAY}.csv`, [
                { key: 'date', header: 'date' },
                { key: 'route', header: 'route' },
                { key: 'lead', header: 'lead_days' },
                { key: 'apix', header: 'apix_value' },
                { key: 'change', header: 'change_pct' },
              ], buildSampleCsv())
            }
          >
            Download Data as CSV
          </Button>

          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() =>
              downloadJson(`apix-sdmx-daily-${TODAY}.json`, buildSampleSdmx())
            }
          >
            Download SDMX-JSON
          </Button>

          <Button
            variant="ghost"
            icon={DownloadSimple}
            className="justify-start"
            onClick={() => {
              const spec = {
                openapi: '3.1.0',
                info: {
                  title: 'VIMAAN Reports API',
                  version: '1.0.0',
                  description: 'Automated report generation and distribution for the VIMAAN airfare price index. Covers daily briefs, weekly summaries, monthly releases, sector deep-dives, anomaly alerts, and compliance reports.',
                },
                paths: {
                  '/reports/daily': { get: { summary: 'Generate daily brief', responses: { 200: { description: 'PDF brief' } } } },
                  '/reports/weekly': { get: { summary: 'Generate weekly summary', responses: { 200: { description: 'PDF summary' } } } },
                  '/reports/monthly': { get: { summary: 'Generate monthly release', responses: { 200: { description: 'PDF release' } } } },
                  '/reports/sector/{id}': { get: { summary: 'Sector deep-dive', responses: { 200: { description: 'PDF report' } } } },
                  '/reports/anomaly': { get: { summary: 'Latest anomaly alert', responses: { 200: { description: 'JSON/PDF alert' } } } },
                  '/reports/compliance': { get: { summary: 'Monthly compliance report', responses: { 200: { description: 'PDF/CSV report' } } } },
                },
              }
              downloadJson('vimaan-reports-openapi.json', spec)
            }}
          >
            Download OpenAPI Spec
          </Button>
        </div>

        <div className="mt-4">
          <Callout tone="neutral" title="Formats and compatibility">
            PDF reports are generated using a headless renderer and conform to PDF/A-2b for long-term
            archiving. SDMX-JSON follows the SDMX 2.1 information model. CSV exports use UTF-8 with
            BOM for compatibility with Excel. All downloads include a digital signature timestamp
            and a content-hash footer for verification.
          </Callout>
        </div>
      </Panel>
    </div>
  )
}
