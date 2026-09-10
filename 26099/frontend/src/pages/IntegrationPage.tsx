/**
 * SAP / ERP Integration status page.
 *
 * Mock data only. Live-looking status, endpoint table, data-flow diagram and
 * sync log. No backend calls.
 */

import { useEffect, useMemo, useState } from 'react'
import { useCopy } from '@/copy'
import { ByMode, TechnicalOnly, SimpleOnly } from '@/components/Gate'
import {
  Building,
  Lightning,
  Factory,
  Mountains,
  ArrowSquareOut,
  ArrowsLeftRight,
  FileCode,
  Funnel,
  CaretDown,
  CaretRight,
  CheckCircle,
  Plugs,
} from '@phosphor-icons/react'
import {
  Chip,
  IconTile,
  Mono,
  Num,
  PageHead,
  Panel,
  Stat,
  StatCell,
  StatRow,
  Table,
  Td,
  Th,
} from '@/components/ui'
import { cx } from '@/components/ui/tokens'
import type { Cpse } from '@/engine/types'
import { CPSES } from '@/engine/corpus'

/* ====================================================================== types */

interface ConnectorStatus {
  erp: string
  connector: string
  status: 'connected' | 'pending'
  lastSync: string
  totalRecords: number
  protocol: 'RFC' | 'OData' | 'REST' | 'JDBC'
}

interface EndpointEntry {
  cpse: string
  method: string
  path: string
  latency: number
  records: number
}

interface SyncEntry {
  id: string
  timestamp: number
  cpse: string
  records: number
  endpoint: string
  status: 'success'
}

/* ====================================================================== mock data */

const CONNECTORS: Record<Cpse['code'], ConnectorStatus> = {
  IOCL: {
    erp: 'SAP ECC 6.0',
    connector: 'RFC BAPI_MATERIAL_GETLIST',
    status: 'connected',
    lastSync: '2 min ago',
    totalRecords: 742_000,
    protocol: 'RFC',
  },
  NTPC: {
    erp: 'SAP S/4HANA',
    connector: 'OData API_PRODUCT_SRV',
    status: 'connected',
    lastSync: '5 min ago',
    totalRecords: 688_000,
    protocol: 'OData',
  },
  SAIL: {
    erp: 'Oracle EBS',
    connector: 'REST API_MATERIAL_GETLIST',
    status: 'connected',
    lastSync: '1 min ago',
    totalRecords: 604_000,
    protocol: 'REST',
  },
  CIL: {
    erp: 'In-house',
    connector: 'Direct DB connection',
    status: 'pending',
    lastSync: 'Never',
    totalRecords: 376_000,
    protocol: 'JDBC',
  },
}

const ENDPOINTS: EndpointEntry[] = [
  { cpse: 'IOCL', method: 'GET', path: '/sap/opu/odata/sap/API_MATERIAL_SRV/A_Material', latency: 142, records: 283 },
  { cpse: 'IOCL', method: 'GET', path: '/sap/opu/odata/sap/API_MATERIAL_SRV/A_MaterialText', latency: 89, records: 1847 },
  { cpse: 'NTPC', method: 'GET', path: '/sap/opu/odata/sap/API_PRODUCT_SRV/Products', latency: 122, records: 283 },
  { cpse: 'NTPC', method: 'GET', path: '/sap/opu/odata/sap/API_PRODUCT_SRV/ProductText', latency: 98, records: 1642 },
  { cpse: 'SAIL', method: 'GET', path: '/fnd/rest/11.1.28.0.0/icx/ilmo/details/', latency: 156, records: 283 },
  { cpse: 'SAIL', method: 'GET', path: '/fnd/rest/11.1.28.0.0/mtl/sysItemsV2/', latency: 134, records: 1523 },
]

const SYNC_ENTRIES: SyncEntry[] = [
  { id: '1', timestamp: Date.now() - 120_000, cpse: 'SAIL', records: 283, endpoint: '/fnd/rest/11.1.28.0.0/icx/ilmo/details/', status: 'success' },
  { id: '2', timestamp: Date.now() - 300_000, cpse: 'NTPC', records: 283, endpoint: '/sap/opu/odata/sap/API_PRODUCT_SRV/Products', status: 'success' },
  { id: '3', timestamp: Date.now() - 480_000, cpse: 'IOCL', records: 283, endpoint: '/sap/opu/odata/sap/API_MATERIAL_SRV/A_Material', status: 'success' },
  { id: '4', timestamp: Date.now() - 660_000, cpse: 'SAIL', records: 1523, endpoint: '/fnd/rest/11.1.28.0.0/mtl/sysItemsV2/', status: 'success' },
  { id: '5', timestamp: Date.now() - 840_000, cpse: 'IOCL', records: 1847, endpoint: '/sap/opu/odata/sap/API_MATERIAL_SRV/A_MaterialText', status: 'success' },
  { id: '6', timestamp: Date.now() - 1020_000, cpse: 'NTPC', records: 1642, endpoint: '/sap/opu/odata/sap/API_PRODUCT_SRV/ProductText', status: 'success' },
  { id: '7', timestamp: Date.now() - 1200_000, cpse: 'SAIL', records: 283, endpoint: '/fnd/rest/11.1.28.0.0/icx/ilmo/details/', status: 'success' },
  { id: '8', timestamp: Date.now() - 1440_000, cpse: 'NTPC', records: 283, endpoint: '/sap/opu/odata/sap/API_PRODUCT_SRV/Products', status: 'success' },
  { id: '9', timestamp: Date.now() - 1680_000, cpse: 'IOCL', records: 283, endpoint: '/sap/opu/odata/sap/API_MATERIAL_SRV/A_Material', status: 'success' },
  { id: '10', timestamp: Date.now() - 1920_000, cpse: 'SAIL', records: 1523, endpoint: '/fnd/rest/11.1.28.0.0/mtl/sysItemsV2/', status: 'success' },
]

/* ====================================================================== icons */

const CPSE_ICONS: Record<Cpse['code'], typeof Building> = {
  IOCL: Building,
  NTPC: Lightning,
  SAIL: Factory,
  CIL: Mountains,
}

const CPSE_COLOR: Record<Cpse['code'], string> = {
  IOCL: 'text-chart-1',
  NTPC: 'text-chart-2',
  SAIL: 'text-chart-3',
  CIL: 'text-chart-4',
}

const CPSE_BG: Record<Cpse['code'], string> = {
  IOCL: 'bg-chart-1/10',
  NTPC: 'bg-chart-2/10',
  SAIL: 'bg-chart-3/10',
  CIL: 'bg-chart-4/10',
}

const PROTOCOL_COLOR: Record<string, string> = {
  RFC: 'border-info-edge text-info bg-info-bg',
  OData: 'border-positive-edge text-positive bg-positive-bg',
  REST: 'border-accent-edge text-accent bg-accent-bg',
  JDBC: 'border-attention-edge text-attention bg-attention-bg',
}

/* ====================================================================== formatting */

function formatLakh(n: number): string {
  return `${(n / 100_000).toFixed(2)} lakh`
}

function formatTimeAgo(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`
  return `${Math.floor(sec / 3600)} hr ago`
}

/* ====================================================================== animated pulsing dot */

function PulseDot({ connected }: { connected: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span
        className={cx(
          'absolute inset-0 rounded-full',
          connected ? 'bg-positive' : 'bg-attention',
        )}
        style={{ animation: 'pulse-ring 2s ease-out infinite' }}
      />
      <span
        className={cx(
          'relative rounded-full',
          connected ? 'bg-positive' : 'bg-attention',
        )}
      />
    </span>
  )
}

/** The keyframes are injected once via a style tag on the body. */
const styleId = 'integration-pulse-styles'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes pulse-ring {
      0%   { transform: scale(1);   opacity: 0.7; }
      100% { transform: scale(2.8); opacity: 0; }
    }
    @keyframes flow-pulse {
      0%   { background-position: 0% 50%; }
      100% { background-position: 200% 50%; }
    }
    @keyframes dash-flow {
      to { stroke-dashoffset: -24; }
    }
    @keyframes fade-in-up {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scan-line {
      0%   { top: 0%; opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .flow-line {
      background: linear-gradient(90deg, var(--primary) 0%, var(--positive) 50%, var(--primary) 100%);
      background-size: 200% 100%;
      animation: flow-pulse 3s linear infinite;
    }
    .sync-row-enter {
      animation: fade-in-up 0.3s ease-out both;
    }
  `
  document.head.appendChild(style)
}

/* ====================================================================== connection card */

function ConnectorCard({ cpse, data }: { cpse: Cpse; data: ConnectorStatus }) {
  const Icon = CPSE_ICONS[cpse.code]
  const color = CPSE_COLOR[cpse.code]
  const bg = CPSE_BG[cpse.code]

  return (
    <Panel hover className="relative overflow-hidden">
      {/* accent strip */}
      <div className={cx('absolute left-0 top-0 h-full w-1', bg, color)} />

      <div className="flex items-start justify-between gap-3 pl-3">
        <div className="flex items-center gap-3">
          <IconTile
            icon={<Icon size={22} weight="fill" />}
            tone={data.status === 'connected' ? 'positive' : 'attention'}
            size="md"
          />
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">{cpse.code}</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">{cpse.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-positive-edge bg-positive-bg px-2 py-0.5">
          <PulseDot connected={data.status === 'connected'} />
          <span className={cx('font-mono text-[10.5px] font-semibold uppercase tracking-wider', data.status === 'connected' ? 'text-positive' : 'text-attention')}>
            {data.status === 'connected' ? 'Connected' : 'Pending'}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 pl-3">
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">ERP System</span>
          <span className="font-mono text-[12.5px] font-medium text-ink">{data.erp}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">Connector</span>
          <TechnicalOnly>
            <Mono className="text-[11px]">{data.connector}</Mono>
          </TechnicalOnly>
          <SimpleOnly>
            <span className="font-mono text-[12px] text-ink">{data.protocol}</span>
          </SimpleOnly>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">Protocol</span>
          <span className={cx('rounded-full border px-2 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider', PROTOCOL_COLOR[data.protocol])}>
            {data.protocol}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">Last sync</span>
          <span className="font-mono text-[12.5px] tabular-nums text-ink">{data.lastSync}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">Records synced</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">{formatLakh(data.totalRecords)}</span>
        </div>
      </div>
    </Panel>
  )
}

/* ====================================================================== data flow diagram */

function DataFlowDiagram() {
  const erpNodes = CPSES.map(cpse => {
    const Icon = CPSE_ICONS[cpse.code]
    const color = CPSE_COLOR[cpse.code]
    const bg = CPSE_BG[cpse.code]
    const protocol = CONNECTORS[cpse.code].protocol
    return { cpse, Icon, color, bg, protocol }
  })

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <ArrowsLeftRight size={16} className="text-accent" weight="regular" />
        <h3 className="font-display text-[13px] font-bold text-ink">Data flow topology</h3>
      </div>

      {/* Diagram container */}
      <div className="relative overflow-hidden rounded-xl border border-rule bg-surface p-4">
        {/* Three columns */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-0">
          {/* LEFT: ERP Systems */}
          <div className="flex flex-col gap-3">
            {erpNodes.map(({ cpse, Icon, color, protocol }) => (
              <div
                key={cpse.code}
                className="flex items-center gap-2 rounded-lg border border-rule bg-surface-2 px-2.5 py-2"
              >
                <Icon size={16} weight="fill" className={cx('shrink-0', color)} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11.5px] font-semibold text-ink">{cpse.code}</div>
                  <div className="text-[10px] text-ink-3">{cpse.erp}</div>
                </div>
                <Chip tone="neutral" className="text-[9.5px]">
                  {protocol}
                </Chip>
              </div>
            ))}
          </div>

          {/* Arrow: ERP → Middleware */}
          <div className="flex flex-col items-center px-2">
            <div className="h-0.5 w-8 flow-line rounded-full" />
            <ArrowSquareOut size={14} className="text-ink-3 -mt-1" />
          </div>

          {/* CENTER: Middleware */}
          <div className="flex flex-col items-center gap-2 mx-2">
            <div className="rounded-xl border-2 border-accent-edge bg-accent-bg px-4 py-3">
              <div className="flex items-center gap-2">
                <Funnel size={16} className="text-accent" weight="fill" />
                <div>
                  <div className="font-display text-[11px] font-bold text-accent uppercase tracking-wider">Middleware</div>
                  <div className="font-mono text-[9.5px] text-ink-3">CNMC Normalizer</div>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-ink-3 text-center leading-tight">
              Parse &bull; Normalize &bull; Match
            </div>
          </div>

          {/* Arrow: Middleware → Registry */}
          <div className="flex flex-col items-center px-2">
            <div className="h-0.5 w-8 flow-line rounded-full" />
            <ArrowSquareOut size={14} className="text-ink-3 -mt-1" />
          </div>

          {/* RIGHT: CNMC Registry */}
          <div className="flex flex-col items-center gap-2 ml-2">
            <div className="rounded-xl border-2 border-primary-edge bg-primary-bg px-4 py-3">
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-accent" weight="fill" />
                <div>
                  <div className="font-display text-[11px] font-bold text-accent uppercase tracking-wider">Registry</div>
                  <div className="font-mono text-[9.5px] text-ink-3">CNMC Master</div>
                </div>
              </div>
            </div>
            <div className="text-[9px] text-ink-3 text-center leading-tight">
              24.10 lakh records &bull; 22,419 codes
            </div>
          </div>
        </div>

        {/* Flow labels */}
        <div className="mt-3 flex items-center justify-between border-t border-rule pt-2.5">
          <span className="font-mono text-[9.5px] text-ink-3 uppercase tracking-wider">4 ERP Sources</span>
          <span className="font-mono text-[9.5px] text-ink-3 uppercase tracking-wider">Normalization Pipeline</span>
          <span className="font-mono text-[9.5px] text-ink-3 uppercase tracking-wider">Unified Registry</span>
        </div>
      </div>
    </div>
  )
}

/* ====================================================================== sync log */

function SyncLog() {
  const [entries, setEntries] = useState<SyncEntry[]>(SYNC_ENTRIES)
  const [expanded, setExpanded] = useState(false)
  const [liveEntries, setLiveEntries] = useState<SyncEntry[]>([])

  /* Simulate live syncs arriving every 15-30s */
  useEffect(() => {
    const tick = () => {
      const cpseCodes = ['IOCL', 'NTPC', 'SAIL'] as const
      const cpse = cpseCodes[Math.floor(Math.random() * cpseCodes.length)]
      const paths: Record<string, string[]> = {
        IOCL: ['/sap/opu/odata/sap/API_MATERIAL_SRV/A_Material', '/sap/opu/odata/sap/API_MATERIAL_SRV/A_MaterialText'],
        NTPC: ['/sap/opu/odata/sap/API_PRODUCT_SRV/Products', '/sap/opu/odata/sap/API_PRODUCT_SRV/ProductText'],
        SAIL: ['/fnd/rest/11.1.28.0.0/icx/ilmo/details/', '/fnd/rest/11.1.28.0.0/mtl/sysItemsV2/'],
      }
      const path = paths[cpse][Math.floor(Math.random() * paths[cpse].length)]
      const recs = Math.floor(Math.random() * 2000) + 100

      setLiveEntries(prev => {
        const next = [{ id: `live-${Date.now()}`, timestamp: Date.now(), cpse, records: recs, endpoint: path, status: 'success' as const }, ...prev]
        return next.slice(0, 5)
      })

      setEntries(prev => {
        const next = [{ id: `live-${Date.now()}`, timestamp: Date.now(), cpse, records: recs, endpoint: path, status: 'success' as const }, ...prev]
        return next.slice(0, 10)
      })
    }

    const interval = setInterval(tick, 15000 + Math.random() * 15000)
    return () => clearInterval(interval)
  }, [])

  const allEntries = useMemo(() => [...entries, ...liveEntries].slice(0, 10), [entries, liveEntries])
  const displayEntries = expanded ? allEntries : allEntries.slice(0, 5)

  return (
    <div>
      <ul className="space-y-0">
        {displayEntries.map((entry, i) => {
          const cpseData = CONNECTORS[entry.cpse as Cpse['code']]
          const Icon = CPSE_ICONS[entry.cpse as Cpse['code']]
          const color = CPSE_COLOR[entry.cpse as Cpse['code']]
          return (
            <li
              key={entry.id}
              className={cx(
                'flex items-start gap-3 border-b border-rule last:border-b-0 px-4 py-3',
                i === 0 && liveEntries.length > 0 && entry.id.startsWith('live-') ? 'sync-row-enter' : '',
              )}
            >
              <Icon size={14} weight="fill" className={cx('mt-0.5 shrink-0', color)} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[12px] font-semibold text-ink">{entry.cpse}</span>
                  <Chip tone="positive" className="text-[9.5px]">OK</Chip>
                  <span className="ml-auto font-mono text-[10.5px] text-ink-3 tabular-nums">
                    {formatTimeAgo(entry.timestamp)}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[11px] text-ink-3 truncate">
                  {entry.endpoint}
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <Num size="2xs" className="text-ink-2">
                    {entry.records.toLocaleString('en-IN')} records
                  </Num>
                  <span className="text-[10px] text-ink-3">
                    {cpseData?.protocol} &middot; {cpseData?.connector}
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {allEntries.length > 5 && (
        <div className="border-t border-rule px-4 py-2.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11.5px] text-accent hover:underline"
          >
            {expanded ? <CaretDown size={12} /> : <CaretRight size={12} />}
            {expanded ? 'Show fewer entries' : `Show all ${allEntries.length} entries`}
          </button>
        </div>
      )}
    </div>
  )
}

/* ====================================================================== page */

export default function IntegrationPage() {
  const c = useCopy()
  const [showEndpoints, setShowEndpoints] = useState(true)
  const [showFlow, setShowFlow] = useState(true)

  const totalConnected = CPSES.filter(cpse => CONNECTORS[cpse.code].status === 'connected').length
  const totalRecords = CPSES.reduce((sum, cpse) => sum + CONNECTORS[cpse.code].totalRecords, 0)
  const avgLatency = Math.round(ENDPOINTS.reduce((s, e) => s + e.latency, 0) / ENDPOINTS.length)

  return (
    <>
      <PageHead
        title="SAP / ERP Integration"
        lead="Live connector status for all four participating organisations"
        icon={<Plugs size={24} weight="fill" />}
        eyebrow={c('erp')}
      />

      {/* Stats row */}
      <section className="mb-6">
        <StatRow>
          <StatCell>
            <Stat
              icon={<Plugs size={16} weight="regular" />}
              tone="info"
              value={`${totalConnected}/${CPSES.length}`}
              label="Connectors live"
              note={
                <ByMode
                  simple="Of the four company systems, three are live and one is being set up."
                  technical="Active RFC, OData and REST connectors. JDBC adapter for CIL in provisioning."
                />
              }
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<Building size={16} weight="regular" />}
              tone="accent"
              value={formatLakh(totalRecords)}
              label="Total records"
              note="Across all four material masters"
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<ArrowSquareOut size={16} weight="regular" />}
              tone="info"
              value={`${avgLatency} ms`}
              label="Avg response"
              note="Mean across 6 active endpoints"
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<CheckCircle size={16} weight="regular" />}
              tone="positive"
              value="99.7%"
              label="Uptime"
              note="Last 30 days"
            />
          </StatCell>
        </StatRow>
      </section>

      {/* Connection Status Cards */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-ink-2">
            Connection status
          </h2>
          <span className="font-mono text-[10.5px] text-ink-3">
            Auto-refresh every 30s
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CPSES.map(cpse => (
            <ConnectorCard key={cpse.code} cpse={cpse} data={CONNECTORS[cpse.code]} />
          ))}
        </div>
      </section>

      {/* Data Flow Diagram */}
      <section className="mb-6">
        <Panel>
          <div
            className="flex items-center justify-between border-b border-rule px-5 py-3.5 cursor-pointer"
            onClick={() => setShowFlow(!showFlow)}
          >
            <div className="flex items-center gap-2">
              <ArrowsLeftRight size={16} className="text-accent" weight="regular" />
              <h2 className="font-display text-[13px] font-bold tracking-tight text-ink">Data flow topology</h2>
            </div>
            {showFlow ? <CaretDown size={14} className="text-ink-3" /> : <CaretRight size={14} className="text-ink-3" />}
          </div>
          {showFlow && (
            <div className="px-5 py-5">
              <DataFlowDiagram />
            </div>
          )}
        </Panel>
      </section>

      {/* OData Endpoints Table */}
      <section className="mb-6">
        <Panel>
          <div
            className="flex items-center justify-between border-b border-rule px-5 py-3.5 cursor-pointer"
            onClick={() => setShowEndpoints(!showEndpoints)}
          >
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-accent" weight="regular" />
              <h2 className="font-display text-[13px] font-bold tracking-tight text-ink">
                <ByMode simple="Active endpoints" technical="OData / REST endpoints" />
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10.5px] text-ink-3">
                {ENDPOINTS.length} endpoints
              </span>
              {showEndpoints ? <CaretDown size={14} className="text-ink-3" /> : <CaretRight size={14} className="text-ink-3" />}
            </div>
          </div>
          {showEndpoints && (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>CPSE</Th>
                    <Th>Method</Th>
                    <Th>Endpoint</Th>
                    <Th align="right">Latency</Th>
                    <Th align="right">Records</Th>
                  </tr>
                </thead>
                <tbody>
                  {ENDPOINTS.map((ep, i) => {
                    const cpseData = CONNECTORS[ep.cpse as Cpse['code']]
                    const Icon = CPSE_ICONS[ep.cpse as Cpse['code']]
                    const color = CPSE_COLOR[ep.cpse as Cpse['code']]
                    const bg = CPSE_BG[ep.cpse as Cpse['code']]
                    const latencyTone = ep.latency < 100 ? 'positive' : ep.latency < 150 ? 'accent' : 'attention'
                    return (
                      <tr key={i} className="hover:bg-surface-hover transition-colors">
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className={cx('inline-flex items-center justify-center rounded-md px-1.5 py-0.5', bg, color)}>
                              <Icon size={13} weight="fill" />
                            </span>
                            <span className="font-mono text-[12px] font-semibold text-ink">{ep.cpse}</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-mono text-[11px] font-semibold text-positive">{ep.method}</span>
                        </Td>
                        <Td>
                          <Mono className="text-[11.5px]">{ep.path}</Mono>
                          <div className="mt-0.5 text-[10px] text-ink-3">{cpseData?.connector}</div>
                        </Td>
                        <Td align="right">
                          <Num size="sm" className={cx(latencyTone === 'positive' ? 'text-positive' : latencyTone === 'accent' ? 'text-accent' : 'text-attention')}>
                            {ep.latency}
                          </Num>
                          <span className="text-[10.5px] text-ink-3">ms</span>
                        </Td>
                        <Td align="right">
                          <Num size="sm" className="text-ink">{ep.records.toLocaleString('en-IN')}</Num>
                          <span className="text-[10.5px] text-ink-3"> read</span>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Panel>
      </section>

      {/* Sync Log */}
      <section>
        <Panel>
          <div className="border-b border-rule px-5 py-3.5 flex items-center gap-2">
            <Funnel size={16} className="text-accent" weight="regular" />
            <h2 className="font-display text-[13px] font-bold tracking-tight text-ink">
              Sync log
            </h2>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 rounded-full bg-positive" style={{ animation: 'pulse-ring 2s ease-out infinite' }} />
                <span className="relative rounded-full bg-positive h-2 w-2" />
              </span>
              <span className="font-mono text-[10.5px] text-ink-3">Live</span>
            </span>
          </div>
          <SyncLog />
        </Panel>
      </section>
    </>
  )
}
