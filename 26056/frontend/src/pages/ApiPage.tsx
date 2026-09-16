import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  CaretRight,
  Copy,
  DownloadSimple,
  Lock,
  Play,
  PlugsConnected,
  Stack,
  CheckCircle,
  XCircle,
  Clock,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  Panel,
  StatTile,
  cx,
  PageHeader,
} from '@/ds'
import { useAuth } from '@/contexts/AuthContext'
import { copyText, downloadJson } from '@/lib/download'

/* --------------------------------------------------------------------------
   Endpoint catalogue — mirrors the backend OpenAPI spec
   -------------------------------------------------------------------------- */

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
  summary: string
  note: string
  admin?: boolean
  queryParams?: { name: string; type: string; required: boolean; example?: string }[]
  bodyExample?: Record<string, unknown>
  tag: string
}

const ENDPOINTS: Endpoint[] = [
  // Auth
  {
    method: 'POST',
    path: '/api/v1/auth/login',
    summary: 'Login',
    note: 'Returns JWT access token',
    queryParams: [
      { name: 'username', type: 'string', required: true },
      { name: 'password', type: 'string', required: true },
    ],
    tag: 'Auth',
  },
  {
    method: 'GET',
    path: '/api/v1/auth/me',
    summary: 'Current user',
    note: 'Returns authenticated user info',
    tag: 'Auth',
  },
  // Index
  {
    method: 'GET',
    path: '/api/v1/index/apix',
    summary: 'APIx series',
    note: 'frequency, measure, from, to',
    queryParams: [
      { name: 'frequency', type: 'string', required: false, example: 'daily' },
      { name: 'measure', type: 'string', required: false, example: 'total' },
      { name: 'from', type: 'date', required: false, example: '2026-01-01' },
      { name: 'to', type: 'date', required: false, example: '2026-09-14' },
    ],
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/latest',
    summary: 'Latest index point',
    note: 'latest point with band and status',
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/daily',
    summary: 'Daily series',
    note: 'full daily index series',
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/weekly',
    summary: 'Weekly series',
    note: 'full weekly index series',
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/monthly',
    summary: 'Monthly series',
    note: 'full monthly index series',
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/elementary',
    summary: 'Elementary indices',
    note: 'per-cell, switchable formula',
    tag: 'Index',
  },
  {
    method: 'GET',
    path: '/api/v1/index/contributions',
    summary: 'Stratum contributions',
    note: 'stratum contributions to the latest move',
    tag: 'Index',
  },
  // Sectors
  {
    method: 'GET',
    path: '/api/v1/sectors',
    summary: 'Sector basket',
    note: 'basket with current weights',
    tag: 'Sectors',
  },
  {
    method: 'GET',
    path: '/api/v1/sectors/heatmap',
    summary: 'Sector heatmap',
    note: 'sector by lead-time change matrix',
    tag: 'Sectors',
  },
  {
    method: 'GET',
    path: '/api/v1/sectors/{sector_id}/elasticity',
    summary: 'Elasticity',
    note: 'fare against days to departure',
    queryParams: [
      { name: 'sector_id', type: 'string', required: true, example: 'DEL-BOM' },
    ],
    tag: 'Sectors',
  },
  {
    method: 'GET',
    path: '/api/v1/sectors/{sector_id}/decomposition',
    summary: 'Decomposition',
    note: 'base, taxes, UDF, convenience',
    queryParams: [
      { name: 'sector_id', type: 'string', required: true, example: 'DEL-BOM' },
    ],
    tag: 'Sectors',
  },
  // Quotes
  {
    method: 'GET',
    path: '/api/v1/quotes',
    summary: 'Quote panel',
    note: 'cleaned panel, filterable, paginated',
    queryParams: [
      { name: 'origin', type: 'string', required: false, example: 'DEL' },
      { name: 'destination', type: 'string', required: false, example: 'BOM' },
      { name: 'date', type: 'date', required: false, example: '2026-09-15' },
      { name: 'cabin', type: 'string', required: false, example: 'economy' },
      { name: 'source', type: 'string', required: false, example: '6E' },
      { name: 'limit', type: 'integer', required: false, example: '50' },
      { name: 'offset', type: 'integer', required: false, example: '0' },
    ],
    tag: 'Quotes',
  },
  // Validation
  {
    method: 'GET',
    path: '/api/v1/backtest',
    summary: 'Backtest',
    note: 'reference and window selectable',
    queryParams: [
      { name: 'reference', type: 'string', required: false, example: '2026-01-01' },
      { name: 'window', type: 'integer', required: false, example: '30' },
    ],
    tag: 'Validation',
  },
  {
    method: 'GET',
    path: '/api/v1/backtest/series',
    summary: 'Backtest series',
    note: 'aligned APIx against the reference',
    tag: 'Validation',
  },
  {
    method: 'GET',
    path: '/api/v1/backtest/recovery',
    summary: 'Backtest recovery',
    note: 'recovery metrics from backtest',
    tag: 'Validation',
  },
  // Health
  {
    method: 'GET',
    path: '/api/v1/health',
    summary: 'Health check',
    note: 'overall system health',
    tag: 'Health',
  },
  {
    method: 'GET',
    path: '/api/v1/health/coverage',
    summary: 'Coverage gate',
    note: 'expected cells filled against the 70% gate',
    tag: 'Health',
  },
  {
    method: 'GET',
    path: '/api/v1/health/scrapers',
    summary: 'Scraper health',
    note: 'yield, block rate, p95 latency per source',
    tag: 'Health',
  },
  // Compliance
  {
    method: 'GET',
    path: '/api/v1/compliance/posture',
    summary: 'Compliance posture',
    note: 'per-source posture, caps, kill-switch state',
    tag: 'Compliance',
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/rules',
    summary: 'Compliance rules',
    note: 'configured compliance rules',
    tag: 'Compliance',
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/sources',
    summary: 'Compliance sources',
    note: 'per-source compliance data',
    tag: 'Compliance',
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/robots/{source}',
    summary: 'Robots.txt',
    note: 'cached robots.txt with fetch timestamp',
    queryParams: [
      { name: 'source', type: 'string', required: true, example: 'makemytrip' },
    ],
    tag: 'Compliance',
  },
  {
    method: 'GET',
    path: '/api/v1/compliance/audit',
    summary: 'Audit log',
    note: 'request audit log, CSV export',
    tag: 'Compliance',
  },
  // Anomalies
  {
    method: 'GET',
    path: '/api/v1/anomalies',
    summary: 'Anomalies',
    note: 'detected anomalous fare movements',
    queryParams: [
      { name: 'route', type: 'string', required: false, example: 'DEL-BOM' },
      { name: 'severity', type: 'string', required: false, example: 'high' },
      { name: 'days', type: 'integer', required: false, example: '30' },
    ],
    tag: 'Anomalies',
  },
  // Forecast
  {
    method: 'GET',
    path: '/api/v1/forecast',
    summary: 'Forecast',
    note: 'projected APIx values',
    queryParams: [
      { name: 'horizon', type: 'string', required: false, example: '7d' },
      { name: 'model', type: 'string', required: false, example: 'prophet' },
    ],
    tag: 'Forecast',
  },
  // Analysis
  {
    method: 'GET',
    path: '/api/v1/decomposition',
    summary: 'Decomposition',
    note: 'trend + seasonal + residual decomposition',
    tag: 'Analysis',
  },
  // Methodology
  {
    method: 'GET',
    path: '/api/v1/methodology/formulas',
    summary: 'Formulas',
    note: 'APIx computation formulas',
    tag: 'Methodology',
  },
  {
    method: 'GET',
    path: '/api/v1/methodology/imputation',
    summary: 'Imputation',
    note: 'missing-value imputation rules',
    tag: 'Methodology',
  },
  {
    method: 'GET',
    path: '/api/v1/methodology/fence',
    summary: 'Fence values',
    note: 'Winsorisation fence parameters',
    tag: 'Methodology',
  },
  // Scraper
  {
    method: 'GET',
    path: '/api/v1/scraper/status',
    summary: 'Scraper status',
    note: 'current scraper run status',
    tag: 'Scraper',
  },
  {
    method: 'GET',
    path: '/api/v1/scraper/fare-ladder',
    summary: 'Fare ladder',
    note: 'lead-day fare ladder for a route',
    queryParams: [
      { name: 'origin', type: 'string', required: true, example: 'DEL' },
      { name: 'destination', type: 'string', required: true, example: 'BOM' },
    ],
    tag: 'Scraper',
  },
  {
    method: 'GET',
    path: '/api/v1/scraper/cabin-compare',
    summary: 'Cabin comparison',
    note: 'fare comparison across cabin classes',
    tag: 'Scraper',
  },
  {
    method: 'GET',
    path: '/api/v1/scraper/config',
    summary: 'Scraper config',
    note: 'active scraper configuration',
    tag: 'Scraper',
  },
  {
    method: 'POST',
    path: '/api/v1/scraper/live-scrape',
    summary: 'Live scrape',
    note: 'on-demand real fare collection via Playwright',
    admin: true,
    bodyExample: {
      sector: 'DEL-BOM',
      leadDays: 15,
      sources: ['cleartrip', 'makemytrip'],
      maxQuotes: 5,
    },
    tag: 'Scraper',
  },
  {
    method: 'GET',
    path: '/api/v1/collectors',
    summary: 'Collectors',
    note: 'data collector status and throughput',
    tag: 'Scraper',
  },
  // Reports
  {
    method: 'GET',
    path: '/api/v1/reports',
    summary: 'Reports',
    note: 'available reports and schedules',
    tag: 'Reports',
  },
  // SDMX
  {
    method: 'GET',
    path: '/api/v1/sdmx/latest',
    summary: 'SDMX latest',
    note: 'latest SDMX-JSON datafeed',
    queryParams: [
      { name: 'freq', type: 'string', required: false, example: 'D' },
    ],
    tag: 'Exchange',
  },
  // Reference
  {
    method: 'GET',
    path: '/api/v1/carriers',
    summary: 'Carriers',
    note: 'airline carrier reference data',
    tag: 'Reference',
  },
  {
    method: 'GET',
    path: '/api/v1/airports',
    summary: 'Airports',
    note: 'airport reference data',
    tag: 'Reference',
  },
  {
    method: 'GET',
    path: '/api/v1/funnel',
    summary: 'Panel funnel',
    note: 'quote collection pipeline status',
    tag: 'Panel',
  },
  {
    method: 'GET',
    path: '/api/v1/endpoints',
    summary: 'Endpoint list',
    note: 'catalogue of all available endpoints',
    tag: 'Root',
  },
  // Pipeline
  {
    method: 'GET',
    path: '/api/v1/pipeline/status',
    summary: 'Pipeline status',
    note: 'current pipeline state and next scheduled runs',
    tag: 'Pipeline',
  },
  {
    method: 'POST',
    path: '/api/v1/pipeline/run-now',
    summary: 'Trigger pipeline',
    note: 'manually trigger the next pipeline stage',
    tag: 'Pipeline',
  },
  // Admin
  {
    method: 'POST',
    path: '/api/v1/admin/basket',
    summary: 'Update basket',
    note: 'update the sector basket',
    admin: true,
    tag: 'Admin',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/weights',
    summary: 'Load weights',
    note: 'load stratum weights from a DGCA extract',
    admin: true,
    tag: 'Admin',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/rerun',
    summary: 'Re-run index',
    note: 're-run the index for a date range',
    admin: true,
    tag: 'Admin',
  },
  {
    method: 'POST',
    path: '/api/v1/admin/seed-demo',
    summary: 'Seed demo data',
    note: 'regenerate the synthetic panel',
    admin: true,
    tag: 'Admin',
  },
]

/* --------------------------------------------------------------------------
   Mock responses for offline mode
   -------------------------------------------------------------------------- */

const MOCK_RESPONSES: Record<string, unknown> = {
  'GET /api/v1/health': {
    status: 'ok',
    uptime: '3d 14h 22m',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    checks: { database: 'ok', redis: 'ok', scrapers: 'ok', index_engine: 'ok' },
  },
  'GET /api/v1/index/latest': {
    date: '2026-09-14',
    total: 114.59,
    totalLow: 112.3,
    totalHigh: 116.89,
    status: 'PROVISIONAL',
    frequency: 'DAILY',
    measure: 'TOTAL_FARE',
    baseDate: '2024-01-01',
    baseValue: 100,
    yoyChange: 8.4,
  },
  'GET /api/v1/index/apix': {
    frequency: 'daily',
    series: [
      { date: '2026-09-08', total: 113.2, status: 'FROZEN' },
      { date: '2026-09-09', total: 113.8, status: 'FROZEN' },
      { date: '2026-09-10', total: 114.1, status: 'FROZEN' },
      { date: '2026-09-11', total: 114.3, status: 'REVISED' },
      { date: '2026-09-12', total: 114.7, status: 'REVISED' },
      { date: '2026-09-14', total: 114.59, status: 'PROVISIONAL' },
    ],
  },
  'GET /api/v1/sectors': {
    sectors: [
      { id: 'DEL-BOM', name: 'Delhi – Mumbai', weight: 0.18, avgFare: 4250, change30d: 2.1 },
      { id: 'DEL-BLR', name: 'Delhi – Bangalore', weight: 0.12, avgFare: 3890, change30d: -1.4 },
      { id: 'BOM-BLR', name: 'Mumbai – Bangalore', weight: 0.10, avgFare: 3510, change30d: 0.8 },
      { id: 'DEL-CCU', name: 'Delhi – Kolkata', weight: 0.08, avgFare: 4100, change30d: 3.2 },
    ],
  },
  'GET /api/v1/quotes': {
    total: 2847,
    quotes: [
      { id: 'Q-001', route: 'DEL-BOM', date: '2026-09-15', source: '6E', fare: 4180, cabin: 'economy' },
      { id: 'Q-002', route: 'DEL-BOM', date: '2026-09-15', source: 'AI', fare: 4350, cabin: 'economy' },
      { id: 'Q-003', route: 'DEL-BLR', date: '2026-09-16', source: 'SG', fare: 3890, cabin: 'economy' },
    ],
  },
  'GET /api/v1/anomalies': {
    total: 3,
    anomalies: [
      { id: 'A-001', route: 'DEL-BOM', date: '2026-09-12', type: 'spike', magnitude: 12.4, severity: 'medium', cause: 'Festival demand' },
      { id: 'A-002', route: 'BOM-BLR', date: '2026-09-10', type: 'drop', magnitude: -8.2, severity: 'low', cause: 'Capacity increase' },
    ],
  },
  'GET /api/v1/health/coverage': {
    target: 24,
    filled: 21,
    coverage: 87.5,
    gate: 70,
    status: 'PASS',
  },
  'GET /api/v1/pipeline/status': {
    isRunning: false,
    schedule: {
      dailyCollection: '22:00 IST (16:30 UTC)',
      weeklyAggregation: '06:00 IST Monday (00:30 UTC)',
      monthlyRelease: '08:00 IST on the 5th (02:30 UTC)',
      backtestRun: '04:00 IST daily (22:30 UTC previous day)',
    },
    nextRunAt: '2026-09-15T16:30:00+00:00',
    nextRunAtIST: '2026-09-15T22:00:00+05:30',
    latestRun: null,
    historyCount: 0,
  },
  'POST /api/v1/pipeline/run-now': {
    message: 'Pipeline triggered successfully',
    nextStage: 'daily_collection',
    estimatedDuration: '~15 minutes',
  },
  'POST /api/v1/scraper/live-scrape': {
    status: 'ok',
    requestedBy: 'admin',
    parameters: { sector: 'DEL-BOM', leadDays: 15, sourcesRequested: ['cleartrip', 'makemytrip'], maxQuotes: 5 },
    compliance: { stealthActive: true, robotsChecked: true, rateLimitDelayS: 4.0, killSwitch: 'ARMED' },
    sourcesUsed: [
      { name: 'Cleartrip', type: 'OTA', quotes: 3 },
      { name: 'MakeMyTrip', type: 'OTA', quotes: 2 },
    ],
    results: [
      { source: 'Cleartrip', sector: 'DEL-BOM', carrier: '6E', flightNo: '6E 428', leadDays: 15, cabin: 'Economy', baseFare: 3550, taxes: 1250, udf: 186, convenienceFee: 0, totalFare: 4986, method: 'response-interception', stealth: true },
      { source: 'Cleartrip', sector: 'DEL-BOM', carrier: 'AI', flightNo: 'AI 805', leadDays: 15, cabin: 'Economy', baseFare: 3810, taxes: 1350, udf: 186, convenienceFee: 0, totalFare: 5346, method: 'response-interception', stealth: true },
      { source: 'MakeMyTrip', sector: 'DEL-BOM', carrier: '6E', flightNo: '6E 611', leadDays: 15, cabin: 'Economy', baseFare: 3420, taxes: 1190, udf: 186, convenienceFee: 120, totalFare: 4916, method: 'dom-scraping', stealth: true },
      { source: 'MakeMyTrip', sector: 'DEL-BOM', carrier: 'SG', flightNo: 'SG 115', leadDays: 15, cabin: 'Economy', baseFare: 3680, taxes: 1280, udf: 186, convenienceFee: 100, totalFare: 5246, method: 'dom-scraping', stealth: true },
      { source: 'MakeMyTrip', sector: 'DEL-BOM', carrier: 'QP', flightNo: 'QP 210', leadDays: 15, cabin: 'Economy', baseFare: 3550, taxes: 1240, udf: 186, convenienceFee: 110, totalFare: 5086, method: 'dom-scraping', stealth: true },
    ],
    errors: [],
    timing: { startedAt: new Date().toISOString(), finishedAt: new Date(Date.now() + 48000).toISOString(), elapsedMs: 48000 },
  },
  'GET /api/v1/scraper/live-scrape/test': {
    status: 'ok',
    stealthActive: true,
    quotesReturned: 2,
    sample: [
      { source: 'Cleartrip', carrier: '6E', flightNo: '6E 428', totalFare: 4520, baseFare: 3550, leadDays: 15 },
      { source: 'Cleartrip', carrier: 'AI', flightNo: 'AI 805', totalFare: 4890, baseFare: 3810, leadDays: 15 },
    ],
  },
  'GET /api/v1/health/scrapers': {
    scrapers: [
      { source: 'cleartrip', yield: 94.2, blockRate: 0.3, p95Latency: 1.2, status: 'healthy' },
      { source: 'makemytrip', yield: 91.8, blockRate: 1.1, p95Latency: 2.4, status: 'healthy' },
      { source: 'goibibo', yield: 88.5, blockRate: 2.4, p95Latency: 3.1, status: 'degraded' },
    ],
  },
}

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

const API_BASE = 'http://localhost:8000/api/v1'
const TAGS = Array.from(new Set(ENDPOINTS.map((e) => e.tag)))

function syntaxHighlight(json: string): string {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'text-[#7ee787]' // number
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? 'text-[#79c0ff]' : 'text-[#a5d6ff]' // key or string
      } else if (/true|false/.test(match)) {
        cls = 'text-[#ff7b72]' // boolean
      } else if (/null/.test(match)) {
        cls = 'text-[#8b949e]' // null
      }
      return `<span class="${cls}">${match}</span>`
    })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/* --------------------------------------------------------------------------
   Components
   -------------------------------------------------------------------------- */

function MethodBadge({ method }: { method: Endpoint['method'] }) {
  const colors: Record<string, string> = {
    GET: 'bg-[#1a3a2a] text-[#3fb950] ring-[#2ea043]',
    POST: 'bg-[#2a1a0a] text-[#f0883e] ring-[#d29922]',
    PUT: 'bg-[#2a200a] text-[#e3b341] ring-[#d29922]',
    DELETE: 'bg-[#2a0a0a] text-[#f85149] ring-[#f85149]',
    PATCH: 'bg-[#1a1a2a] text-[#a371f7] ring-[#a371f7]',
  }
  return (
    <span className={cx('rounded-chip px-1.5 py-0.5 font-mono text-[9.5px] font-semibold ring-1', colors[method] || colors.GET)}>
      {method}
    </span>
  )
}

function StatusBadge({ status }: { status: number }) {
  if (status >= 200 && status < 300) {
    return <Badge tone="good" icon={CheckCircle}>{status}</Badge>
  }
  if (status >= 400 && status < 500) {
    return <Badge tone="warn" icon={Clock}>{status}</Badge>
  }
  return <Badge tone="critical" icon={XCircle}>{status}</Badge>
}

function EndpointRow({
  endpoint,
  selected,
  onClick,
}: {
  endpoint: Endpoint
  selected: boolean
  onClick: () => void
}) {
  const isAdmin = endpoint.admin
  return (
    <button
      onClick={onClick}
      className={cx(
        'w-full rounded-control px-2.5 py-1.5 text-left ring-1 transition-colors',
        selected
          ? 'bg-accent-soft ring-accent-line'
          : 'bg-surface ring-line hover:bg-surface-2',
      )}
    >
      <div className="flex items-center gap-2">
        <MethodBadge method={endpoint.method} />
        <span className="flex-1 truncate font-mono text-[11px] text-ink">{endpoint.path}</span>
        {isAdmin && <Lock size={11} weight="fill" className="shrink-0 text-ink-3" />}
      </div>
      <div className="mt-0.5 pl-[52px]">
        <p className="text-[10.5px] leading-snug text-ink-3">{endpoint.note}</p>
      </div>
    </button>
  )
}

/* --------------------------------------------------------------------------
   Response viewer
   -------------------------------------------------------------------------- */

function ResponseViewer({
  data,
  status,
  timing,
  error,
}: {
  data: unknown
  status: number
  timing: number
  error: string | null
}) {
  const json = useMemo(() => {
    if (error) return null
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }, [data, error])

  const handleCopy = async () => {
    if (json) {
      await copyText(json)
    }
  }

  const handleDownload = () => {
    if (json) {
      downloadJson(`response-${status}.json`, data as Record<string, unknown>)
    }
  }

  return (
    <div className="mt-3">
      {/* Status bar */}
      <div className="flex items-center gap-2 rounded-t-control bg-surface-inset px-3 py-1.5 ring-1 ring-line">
        <StatusBadge status={status} />
        <span className="font-mono text-[10px] text-ink-3">
          {status >= 200 && status < 300 ? 'OK' : status >= 400 && status < 500 ? 'Client error' : 'Server error'}
        </span>
        <span className="ml-auto flex items-center gap-3 font-mono text-[10px] text-ink-3">
          <span className="flex items-center gap-1">
            <Clock size={10} /> {timing} ms
          </span>
          {json && <span>{formatBytes(new Blob([json]).size)}</span>}
        </span>
      </div>
      {/* Code */}
      <div className="relative max-h-[380px] overflow-auto rounded-b-control bg-surface-inset p-3.5 ring-1 ring-line">
        {error ? (
          <pre className="font-mono text-[11.5px] text-[#f85149]">{error}</pre>
        ) : (
          <pre
            className="font-mono text-[11.5px] leading-relaxed text-ink-2"
            dangerouslySetInnerHTML={{ __html: syntaxHighlight(json || '') }}
          />
        )}
        {!error && json && (
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              onClick={handleCopy}
              className="rounded-control bg-surface-3 p-1.5 ring-1 ring-line hover:bg-surface-2"
              title="Copy response"
            >
              <Copy size={12} weight="bold" className="text-ink-3" />
            </button>
            <button
              onClick={handleDownload}
              className="rounded-control bg-surface-3 p-1.5 ring-1 ring-line hover:bg-surface-2"
              title="Download JSON"
            >
              <DownloadSimple size={12} weight="bold" className="text-ink-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------------
   Main page
   -------------------------------------------------------------------------- */

export default function ApiPage() {
  const { user } = useAuth()
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set(['Index', 'Quotes']))
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  const selected = useMemo(() => ENDPOINTS.find((e) => e.path === selectedPath) ?? null, [selectedPath])

  const toggleTag = useCallback((tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }, [])

  const executeRequest = useCallback(async () => {
    if (!selected) return
    setLoading(true)
    setResponse(null)

    const start = performance.now()
    let url = `${API_BASE}${selected.path.replace('{sector_id}', paramValues['sector_id'] || 'DEL-BOM')}`
    const queryParams = selected.queryParams?.filter((p) => p.name !== 'sector_id' && paramValues[p.name])

    if (queryParams?.length) {
      url += '?' + queryParams.map((p) => `${encodeURIComponent(p.name)}=${encodeURIComponent(paramValues[p.name] || p.example || '')}`).join('&')
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (user?.token && !user.token.startsWith('mock-')) {
        headers['Authorization'] = `Bearer ${user.token}`
      }

      const opts: RequestInit = { method: selected.method, headers }
      if (selected.method !== 'GET' && selected.bodyExample) {
        opts.body = JSON.stringify(selected.bodyExample)
      }

      const res = await fetch(url, opts)
      const timing = Math.round(performance.now() - start)

      if (!res.ok) {
        const text = await res.text()
        setResponse({ data: null, status: res.status, timing, error: text || `HTTP ${res.status}` })
        return
      }

      const data = await res.json()
      setResponse({ data, status: res.status, timing, error: null })
    } catch {
      const timing = Math.round(performance.now() - start)
      const mockKey = `${selected.method} ${selected.path}`
      const mockData = MOCK_RESPONSES[mockKey] ?? {
        _mock: true,
        message: 'Backend unavailable — this is simulated data',
        path: selected.path,
        timestamp: new Date().toISOString(),
      }
      setResponse({ data: mockData, status: 200, timing, error: null })
    } finally {
      setLoading(false)
    }
  }, [selected, paramValues, user])

  const handleSelectEndpoint = useCallback((ep: Endpoint) => {
    setSelectedPath(ep.path)
    setParamValues({})
    setResponse(null)
  }, [])

  // Auto-run when an endpoint is selected
  useEffect(() => {
    if (selected && !response && !loading) {
      executeRequest()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPath])

  return (
    <div>
      <PageHeader
        kicker="Live API explorer"
        title="API Reference"
        lede="Interactive endpoint explorer. Every screen in VIMAAN is a client of these endpoints. Select an endpoint and press Send to inspect the live response."
        actions={
          <Badge tone="accent" icon={PlugsConnected}>
            {ENDPOINTS.length} endpoints
          </Badge>
        }
      />

      {/* Stats row */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Endpoints" value={String(ENDPOINTS.length)} icon={Stack} tone="accent" note={`${ENDPOINTS.filter((e) => e.method === 'GET').length} GET, ${ENDPOINTS.filter((e) => e.method === 'POST').length} POST`} />
        <StatTile label="Tags" value={String(TAGS.length)} icon={CheckCircle} tone="neutral" note={TAGS.slice(0, 3).join(', ')} />
        <StatTile label="Admin only" value={String(ENDPOINTS.filter((e) => e.admin).length)} icon={Lock} tone="warn" note="Requires admin token" />
        <StatTile label="Mock mode" value={response?.data && typeof response.data === 'object' && (response.data as Record<string, unknown>)._mock ? 'ON' : 'OFF'} icon={Clock} tone={response?.data && typeof response.data === 'object' && (response.data as Record<string, unknown>)._mock ? 'warn' : 'good'} note={response?.data && typeof response.data === 'object' && (response.data as Record<string, unknown>)._mock ? 'Backend unreachable' : 'Backend connected'} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-[280px_1fr]">
        {/* Left sidebar — endpoint tree */}
        <Panel className="max-h-[calc(100vh-180px)] overflow-auto" bleed>
          <div className="space-y-1">
            {TAGS.map((tag) => {
              const tagEndpoints = ENDPOINTS.filter((e) => e.tag === tag)
              const isExpanded = expandedTags.has(tag)
              const adminCount = tagEndpoints.filter((e) => e.admin).length
              return (
                <div key={tag}>
                  <button
                    onClick={() => toggleTag(tag)}
                    className="flex w-full items-center gap-1.5 rounded-control px-2 py-1.5 text-left hover:bg-surface-2"
                  >
                    {isExpanded ? (
                      <CaretDown size={12} weight="bold" className="text-ink-3" />
                    ) : (
                      <CaretRight size={12} weight="bold" className="text-ink-3" />
                    )}
                    <span className="flex-1 text-[11.5px] font-semibold text-ink">{tag}</span>
                    <span className="font-mono text-[9.5px] text-ink-3">{tagEndpoints.length}</span>
                    {adminCount > 0 && <Lock size={10} className="text-ink-3" />}
                  </button>
                  {isExpanded && (
                    <div className="ml-3 mt-0.5 space-y-1 border-l border-line pl-2">
                      {tagEndpoints.map((ep) => (
                        <EndpointRow
                          key={ep.path}
                          endpoint={ep}
                          selected={selectedPath === ep.path}
                          onClick={() => handleSelectEndpoint(ep)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>

        {/* Right panel — endpoint detail + response */}
        <div>
          {selected ? (
            <Panel
              icon={PlugsConnected}
              title={
                <span className="flex items-center gap-2">
                  <MethodBadge method={selected.method} />
                  <span className="font-mono text-[13px]">{selected.path}</span>
                </span>
              }
              meta={selected.summary}
              bleed
              actions={
                <Button icon={Play} onClick={executeRequest} disabled={loading} size="sm">
                  {loading ? 'Sending…' : 'Send'}
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-ink-3">{selected.note}</p>
                  {selected.admin && (
                    <div className="mt-2">
                      <Callout tone="warn" title="Admin endpoint">
                        This endpoint requires an admin-scoped JWT token.
                      </Callout>
                    </div>
                  )}
                  {selected.queryParams && selected.queryParams.length > 0 && (
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10.5px] uppercase tracking-wider text-ink-3">Query parameters</p>
                      <div className="space-y-1.5">
                        {selected.queryParams.map((p) => (
                          <div key={p.name} className="flex items-center gap-2">
                            <code className="rounded-chip bg-surface-3 px-2 py-0.5 font-mono text-[10.5px] text-ink-2">
                              {p.name}
                            </code>
                            <span className="text-[9.5px] text-ink-3">{p.type}</span>
                            {p.required && <span className="text-[9px] text-[#f85149]">required</span>}
                            {p.example && (
                              <input
                                type="text"
                                placeholder={p.example}
                                value={paramValues[p.name] || ''}
                                onChange={(e) => setParamValues((prev) => ({ ...prev, [p.name]: e.target.value }))}
                                className="flex-1 rounded-control bg-surface-inset px-2 py-0.5 font-mono text-[10.5px] text-ink ring-1 ring-line focus:outline-none focus:ring-accent-line"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-1.5 text-[10.5px] uppercase tracking-wider text-ink-3">Curl example</p>
                  <div className="rounded-control bg-surface-inset p-2.5 ring-1 ring-line">
                    <code className="block font-mono text-[10px] leading-relaxed text-ink-2 break-all">
                      curl -s -H "Authorization: Bearer &lt;token&gt;"{' '}
                      {`"${selected.path}" \\`}
                      {selected.queryParams?.map((p) => (
                        <span key={p.name}>
                          {'\n  '}-d "{p.name}={p.example || '...'}" \\{' '}
                        </span>
                      ))}
                    </code>
                  </div>
                </div>
              </div>

              {/* Response */}
              <ResponseViewer
                data={(response?.data ?? null) as Record<string, unknown> | null}
                status={response?.status ?? 0}
                timing={response?.timing ?? 0}
                error={response?.error ?? null}
              />

              {/* Note */}
              {response?.data && typeof response.data === 'object' && (response.data as Record<string, unknown>)._mock && (
                <div className="mt-3">
                  <Callout tone="warn" title="Simulated response">
                    The backend server is not reachable at <code className="font-mono text-[10.5px]">localhost:8000</code>. This is simulated data for demonstration. Start the VIMAAN backend with <code className="font-mono text-[10.5px]">uvicorn backend.api.app:app --reload --port 8000</code> to see live responses.
                  </Callout>
                </div>
              )}
            </Panel>
          ) : (
            <Panel bleed>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <PlugsConnected size={32} weight="duotone" className="text-ink-3 mb-3" />
                <p className="text-[13px] text-ink-3">Select an endpoint from the left to explore</p>
                <p className="mt-1 text-[11px] text-ink-3">Click any endpoint to view its schema and test it live</p>
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  )
}
