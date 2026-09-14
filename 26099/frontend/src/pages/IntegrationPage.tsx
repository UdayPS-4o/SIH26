/**
 * SAP / ERP integration.
 *
 * What this page is, precisely: the connector design for the four source systems,
 * plus an illustration of the traffic that design would produce. It is not a live
 * link and it does not pretend to be one. Nothing in this prototype polls an ERP.
 *
 * That distinction is stated on the page itself, in a banner nobody can scroll
 * past, for the same reason the sidebar refuses to show a green connection dot per
 * source: a console that invents one connection is a console whose other numbers
 * have to be re-checked. The parts that are real are labelled real - the ERP name,
 * the connector string and the master size come from the same corpus definition the
 * loader reads, and whether an extract is actually in hand is this session's own
 * state. The latencies and the sync log are marked as illustration.
 */

import { useEffect, useMemo, useState } from 'react'
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
  Info,
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
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import type { Cpse } from '@/engine/types'
import { CPSES } from '@/engine/corpus'

/* ====================================================================== types */

interface ConnectorStatus {
  erp: string
  connector: string
  totalRecords: number
  protocol: 'RFC' | 'OData' | 'REST' | 'JDBC' | 'SFTP'
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

/* ============================================================ connector design */

/** The protocol a connector string implies, rather than a second place to state it. */
function protocolOf(connector: string): ConnectorStatus['protocol'] {
  if (connector.startsWith('RFC')) return 'RFC'
  if (connector.startsWith('OData')) return 'OData'
  if (connector.startsWith('JDBC')) return 'JDBC'
  if (connector.startsWith('SFTP')) return 'SFTP'
  return 'REST'
}

/**
 * Read from the corpus definition rather than restated here.
 *
 * This page used to carry its own copy of the four ERPs and disagreed with the
 * rest of the console about two of them: it had SAIL on a REST material API and
 * CIL on a direct database connection, where every other surface says Oracle EBS
 * over JDBC and a nightly SFTP drop. One source of truth removes the argument.
 */
const CONNECTORS: Record<Cpse['code'], ConnectorStatus> = Object.fromEntries(
  CPSES.map(cpse => [
    cpse.code,
    {
      erp: cpse.erp,
      connector: cpse.connector,
      totalRecords: cpse.totalRecords,
      protocol: protocolOf(cpse.connector),
    },
  ]),
) as Record<Cpse['code'], ConnectorStatus>

/**
 * The objects each connector reads, and a latency budget for each.
 *
 * Illustration, and labelled as such on the page. The paths are the real object
 * names in each system, which is the part worth showing: an integration team
 * reading this knows exactly which material objects the adapter has to cover.
 */
const ENDPOINTS: EndpointEntry[] = [
  { cpse: 'IOCL', method: 'RFC', path: 'BAPI_MATERIAL_GETLIST', latency: 142, records: 742_000 },
  { cpse: 'IOCL', method: 'RFC', path: 'BAPI_MATERIAL_GET_DETAIL', latency: 89, records: 742_000 },
  { cpse: 'NTPC', method: 'GET', path: '/sap/opu/odata/sap/API_PRODUCT_SRV/A_Product', latency: 122, records: 688_000 },
  { cpse: 'NTPC', method: 'GET', path: '/sap/opu/odata/sap/API_PRODUCT_SRV/A_ProductDescription', latency: 98, records: 688_000 },
  { cpse: 'SAIL', method: 'SQL', path: 'apps.mtl_system_items_b', latency: 156, records: 604_000 },
  { cpse: 'SAIL', method: 'SQL', path: 'apps.mtl_descriptive_elements', latency: 134, records: 604_000 },
  { cpse: 'CIL', method: 'FILE', path: '/outbound/material_master_nightly.csv', latency: 0, records: 376_000 },
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
  SFTP: 'border-rule-strong text-ink-2',
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

/**
 * One source.
 *
 * The only state this card asserts is whether this session has actually read that
 * organisation's extract, which is something the browser knows for certain because
 * it did the reading. Everything else on the card is design: the ERP it would pull
 * from, the call it would make, and how big that master is.
 */
function ConnectorCard({
  cpse,
  data,
  loaded,
}: {
  cpse: Cpse
  data: ConnectorStatus
  loaded: boolean
}) {
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
            tone={loaded ? 'positive' : 'neutral'}
            size="md"
          />
          <div>
            <h3 className="font-display text-[15px] font-bold text-ink">{cpse.code}</h3>
            <p className="text-[11.5px] text-ink-3 mt-0.5">{cpse.name}</p>
          </div>
        </div>
        {/* Not a connection light. It says whether this browser has read that
            organisation's extract, which is the only thing here that is checkable. */}
        <div
          className={cx(
            'flex items-center gap-1.5 rounded-full border px-2 py-0.5',
            loaded ? 'border-positive-edge bg-positive-bg' : 'border-rule-strong',
          )}
        >
          {loaded ? <PulseDot connected /> : null}
          <span
            className={cx(
              'font-mono text-[10.5px] font-semibold uppercase tracking-wider',
              loaded ? 'text-positive' : 'text-ink-3',
            )}
          >
            {loaded ? 'Extract in hand' : 'Not loaded'}
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
          <span className="text-[11.5px] text-ink-3">Extract</span>
          <span className="font-mono text-[12.5px] tabular-nums text-ink">
            {loaded ? 'Read this session' : 'Not read yet'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11.5px] text-ink-3">Master size</span>
          <span className="font-mono text-[12.5px] font-semibold text-ink">{formatLakh(data.totalRecords)}</span>
        </div>
      </div>
    </Panel>
  )
}

/* ====================================================================== data flow diagram */

function DataFlowDiagram({ records, codes }: { records: number; codes: number }) {
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
          <div className="flex flex-col items-center justify-self-stretch px-1">
            <div className="flex-1 w-px bg-gradient-to-b from-chart-1 via-chart-2 to-chart-3 opacity-40" />
            <CaretRight size={14} className="text-ink-3 shrink-0 my-1" weight="regular" />
            <div className="flex-1 w-px bg-gradient-to-b from-chart-1 via-chart-2 to-chart-3 opacity-40" />
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
          <div className="flex flex-col items-center justify-self-stretch px-1">
            <div className="flex-1 w-px bg-gradient-to-b from-accent to-primary opacity-40" />
            <CaretRight size={14} className="text-ink-3 shrink-0 my-1" weight="regular" />
            <div className="flex-1 w-px bg-gradient-to-b from-accent to-primary opacity-40" />
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
              {records.toLocaleString('en-IN')} records read &bull; {codes.toLocaleString('en-IN')} codes so far
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

  const loaded = useService(s => s.dashboard?.loaded ?? [])
  // The inspectable slice, not the full-scale figure above: pairing a projected
  // lakh-scale record count with a slice-scale code count would put two numbers on
  // different bases side by side, which is exactly what the rest of this console
  // is careful never to do.
  const sliceRecords = useService(s => s.dashboard?.sampleSize ?? 0)
  const codeCount = useService(s => s.clusters.length)

  const totalRecords = CPSES.reduce((sum, cpse) => sum + CONNECTORS[cpse.code].totalRecords, 0)
  const inHand = CPSES.filter(cpse => loaded.includes(cpse.code)).reduce(
    (sum, cpse) => sum + cpse.totalRecords,
    0,
  )
  const protocols = new Set(CPSES.map(cpse => CONNECTORS[cpse.code].protocol)).size

  return (
    <>
      <PageHead
        title={c('integrationTitle')}
        lead={c('integrationLead')}
        icon={<Plugs size={24} weight="fill" />}
      />

      {/* The one thing a visitor has to read before anything else on this page. */}
      <section className="mb-6 rounded-2xl border border-info-edge bg-info-bg px-5 py-4">
        <div className="flex items-start gap-3">
          <Info size={18} weight="fill" className="mt-0.5 shrink-0 text-info" />
          <div>
            <p className="font-display text-[13.5px] font-bold text-ink">
              This is the connector design, not a live link
            </p>
            <p className="mt-1.5 max-w-[80ch] text-[13px] leading-relaxed text-ink-2">
              <ByMode
                simple="Nothing here is talking to a company's computer system right now. This page shows how each of the four would hand its item list over once the link is built, and which lists have actually been read into this session. The response times and the sync log below are an illustration of what that traffic would look like."
                technical="No ERP is polled by this prototype. The ERP, connector string and master size are read from the corpus definition; extract state is this session's own. Latency figures and the sync log are illustrative of the target integration, not measurements."
              />
            </p>
          </div>
        </div>
      </section>

      {/* Stats row */}
      <section className="mb-6">
        <StatRow>
          <StatCell>
            <Stat
              icon={<Plugs size={16} weight="regular" />}
              tone="info"
              value={`${loaded.length}/${CPSES.length}`}
              label="Extracts in hand"
              note={
                <ByMode
                  simple="Item lists this session has actually read."
                  technical="Masters loaded into the working registry. Not a connection count."
                />
              }
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<Building size={16} weight="regular" />}
              tone="accent"
              value={formatLakh(inHand)}
              label="Records covered"
              note={`Of ${formatLakh(totalRecords)} held across all four masters.`}
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<ArrowSquareOut size={16} weight="regular" />}
              tone="info"
              value={`${protocols}`}
              label="Protocols to support"
              note="RFC, OData, JDBC and a nightly file drop. One adapter each."
            />
          </StatCell>
          <StatCell>
            <Stat
              icon={<CheckCircle size={16} weight="regular" />}
              tone="positive"
              value={`${ENDPOINTS.length}`}
              label="Objects to read"
              note="Material objects an adapter has to cover across the four systems."
            />
          </StatCell>
        </StatRow>
      </section>

      {/* Connection Status Cards */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-[13px] font-bold uppercase tracking-[0.08em] text-ink-2">
            <ByMode simple="The four company systems" technical="Source systems" />
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CPSES.map(cpse => (
            <ConnectorCard
              key={cpse.code}
              cpse={cpse}
              data={CONNECTORS[cpse.code]}
              loaded={loaded.includes(cpse.code)}
            />
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
              <DataFlowDiagram records={sliceRecords} codes={codeCount} />
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
                <ByMode simple="What each system would be asked for" technical="Objects and latency budget" />
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10.5px] text-ink-3">
                {ENDPOINTS.length} objects &middot; illustrative
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
                    <Th>Call</Th>
                    <Th>Object</Th>
                    <Th align="right">Budget</Th>
                    <Th align="right">Rows</Th>
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
                          {ep.latency === 0 ? (
                            <span className="text-[11.5px] text-ink-3">nightly drop</span>
                          ) : (
                            <>
                              <Num size="sm" className={cx(latencyTone === 'positive' ? 'text-positive' : latencyTone === 'accent' ? 'text-accent' : 'text-attention')}>
                                {ep.latency}
                              </Num>
                              <span className="text-[10.5px] text-ink-3">ms</span>
                            </>
                          )}
                        </Td>
                        <Td align="right">
                          <Num size="sm" className="text-ink">{ep.records.toLocaleString('en-IN')}</Num>
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
              <ByMode simple="What a day of syncing would look like" technical="Sync log, illustrative" />
            </h2>
            <span className="ml-auto font-mono text-[10.5px] text-ink-3">
              Illustration, not a feed
            </span>
          </div>
          <SyncLog />
        </Panel>
      </section>
    </>
  )
}
