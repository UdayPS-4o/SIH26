import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle,
  Copy,
  DownloadSimple,
  Lock,
  PlugsConnected,
  Snowflake,
  Stack,
  Timer,
  TreeStructure,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  Formula,
  PageHeader,
  Panel,
  SegmentedControl,
  StatTile,
  cx,
} from '@/ds'
import { DAILY, DEMO_DATE, LATEST, MONTHLY, WEEKLY } from '@/data/generate'
import { copyText, downloadJson } from '@/lib/download'
import { fmtDayFull, fmtIndex, fmtInt } from '@/lib/format'

interface Endpoint {
  method: string
  path: string
  note: string
  admin?: boolean
}

interface EndpointGroup {
  id: string
  label: string
  icon: typeof Stack
  endpoints: Endpoint[]
}

const ENDPOINT_GROUPS: EndpointGroup[] = [
  {
    id: 'index',
    label: 'Index',
    icon: Stack,
    endpoints: [
      { method: 'GET', path: '/index/apix', note: 'frequency, measure, from, to' },
      { method: 'GET', path: '/index/apix/latest', note: 'latest point with band and status' },
      { method: 'GET', path: '/index/elementary', note: 'per-cell, switchable formula' },
      { method: 'GET', path: '/index/contributions', note: 'stratum contributions to the latest move' },
    ],
  },
  {
    id: 'panel',
    label: 'Quotes and sectors',
    icon: TreeStructure,
    endpoints: [
      { method: 'GET', path: '/quotes', note: 'cleaned panel, filterable, paginated' },
      { method: 'GET', path: '/quotes/raw', note: 'raw quotes with the bronze evidence URI', admin: true },
      { method: 'GET', path: '/sectors', note: 'basket with current weights' },
      { method: 'GET', path: '/sectors/heatmap', note: 'sector by lead-time change matrix' },
      { method: 'GET', path: '/sectors/{id}/elasticity', note: 'fare against days to departure' },
      { method: 'GET', path: '/sectors/{id}/decomposition', note: 'base, taxes, UDF, convenience' },
    ],
  },
  {
    id: 'validate',
    label: 'Validation and health',
    icon: CheckCircle,
    endpoints: [
      { method: 'GET', path: '/backtest', note: 'reference and window selectable' },
      { method: 'GET', path: '/backtest/series', note: 'aligned APIx against the reference' },
      { method: 'GET', path: '/health/coverage', note: 'expected cells filled against the 70% gate' },
      { method: 'GET', path: '/health/scrapers', note: 'yield, block rate, p95 latency per source' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon: Lock,
    endpoints: [
      { method: 'GET', path: '/compliance', note: 'per-source posture, caps, kill-switch state' },
      { method: 'GET', path: '/compliance/robots/{source}', note: 'cached robots.txt with its fetch timestamp' },
      { method: 'GET', path: '/compliance/audit', note: 'request audit log, CSV export' },
    ],
  },
  {
    id: 'exchange',
    label: 'Statistical exchange',
    icon: PlugsConnected,
    endpoints: [
      { method: 'GET', path: '/sdmx/v1/data/APIX/{key}', note: 'SDMX-JSON 1.0 dataset' },
      { method: 'GET', path: '/sdmx/v1/dataflow/APIX', note: 'dataflow definition' },
      { method: 'GET', path: '/openapi.json', note: 'OpenAPI 3.1 spec for NSO and RBI consumers' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: Lock,
    endpoints: [
      { method: 'POST', path: '/admin/basket', note: 'update the sector basket', admin: true },
      { method: 'POST', path: '/admin/weights', note: 'load stratum weights from a DGCA extract', admin: true },
      { method: 'POST', path: '/admin/rerun', note: 're-run the index for a date range', admin: true },
      { method: 'POST', path: '/admin/seed-demo', note: 'regenerate the synthetic panel', admin: true },
    ],
  },
]

const LIFECYCLE = [
  {
    status: 'PROVISIONAL',
    icon: Timer,
    when: 'On the morning after collection',
    note: 'Published from the panel as collected, once coverage clears the 70% gate.',
    tone: 'accent' as const,
  },
  {
    status: 'REVISED',
    icon: ArrowRight,
    when: 'At T+7',
    note: 'Re-compiled with late-arriving quotes and any back-filled cells. Suppressed days get their first value here.',
    tone: 'good' as const,
  },
  {
    status: 'FROZEN',
    icon: Snowflake,
    when: 'At T+30',
    note: 'Sealed. A frozen point never changes again, which is what makes the series citable.',
    tone: 'neutral' as const,
  },
]

type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY'

const FREQ_OPTIONS = [
  { value: 'DAILY' as Freq, label: 'Daily' },
  { value: 'WEEKLY' as Freq, label: 'Weekly' },
  { value: 'MONTHLY' as Freq, label: 'Monthly' },
]

const FREQ_CODE: Record<Freq, string> = { DAILY: 'D', WEEKLY: 'W', MONTHLY: 'M' }

function buildSdmx(freq: Freq) {
  const rows = freq === 'DAILY' ? DAILY : freq === 'WEEKLY' ? WEEKLY : MONTHLY
  const slice = rows.slice(-6)
  return {
    meta: {
      schema: 'https://sdmx.org/schema/2.1/data/sdmx-json.json',
      id: `APIX-${freq}-${DEMO_DATE}`,
      prepared: `${DEMO_DATE}T04:02:00+05:30`,
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
            { id: 'FREQ', name: 'Frequency', values: [{ id: FREQ_CODE[freq], name: freq.toLowerCase() }] },
          ],
          observation: [
            {
              id: 'TIME_PERIOD',
              name: 'Time period',
              values: slice.map((p) => ({ id: p.date, name: p.date })),
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
                { id: 'M', name: 'Missing, suppressed for low coverage' },
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
              observations: Object.fromEntries(
                slice.map((p, i) => [
                  String(i),
                  [
                    p.total,
                    p.status === 'SUPPRESSED' ? 2 : p.status === 'PROVISIONAL' ? 1 : 0,
                    p.totalLow,
                    p.totalHigh,
                  ],
                ]),
              ),
            },
          },
        },
      ],
    },
  }
}

export function ApiPage() {
  const [freq, setFreq] = useState<Freq>('DAILY')
  const [copied, setCopied] = useState(false)
  const payload = useMemo(() => buildSdmx(freq), [freq])
  const pretty = useMemo(() => JSON.stringify(payload, null, 2), [payload])

  return (
    <div>
      <PageHeader
        kicker="Publication surface"
        title="NSO and RBI do not want a dashboard, they want a feed"
        lede="The index is published as OpenAPI 3.1 for general consumers and as SDMX-JSON, the format statistical agencies actually exchange, so it can be pulled into an existing pipeline without a bespoke adapter."
        actions={
          <Badge tone="accent" icon={PlugsConnected}>
            OpenAPI 3.1 · SDMX-JSON 1.0
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Endpoints published"
          value={ENDPOINT_GROUPS.reduce((a, g) => a + g.endpoints.length, 0)}
          icon={PlugsConnected}
          tone="accent"
          note="Every screen in this product is a client of the same API"
        />
        <StatTile
          label="Series points available"
          value={fmtInt(DAILY.length + WEEKLY.length + MONTHLY.length)}
          icon={Stack}
          tone="neutral"
          note={`${DAILY.length} daily, ${WEEKLY.length} weekly, ${MONTHLY.length} monthly`}
        />
        <StatTile
          label="Latest published value"
          value={fmtIndex(LATEST.total)}
          icon={CheckCircle}
          tone="good"
          note={`${LATEST.status} for ${fmtDayFull(LATEST.date)}`}
        />
        <StatTile
          label="Revision horizon"
          value="T+30"
          icon={Snowflake}
          tone="neutral"
          note="Provisional, revised at T+7, frozen at T+30"
        />
      </div>

      <Panel
        className="mt-3"
        icon={TreeStructure}
        title="Endpoint catalogue"
        meta="All paths prefixed /api/v1 except the SDMX surface"
        bleed
      >
        <div className="grid grid-cols-1 gap-px bg-[var(--vm-line)] lg:grid-cols-2 xl:grid-cols-3">
          {ENDPOINT_GROUPS.map((g) => (
            <div key={g.id} className="bg-surface p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-control bg-accent-soft text-accent ring-1 ring-accent-line">
                  <g.icon size={15} weight="duotone" />
                </span>
                <p className="font-display text-[13px] font-semibold text-ink">{g.label}</p>
              </div>
              <ul className="space-y-1.5">
                {g.endpoints.map((e) => (
                  <li key={e.path} className="rounded-control bg-surface-inset px-2.5 py-1.5 ring-1 ring-line">
                    <div className="flex items-center gap-2">
                      <span
                        className={cx(
                          'vm-num rounded-chip px-1.5 py-0.5 text-[9.5px] font-semibold',
                          e.method === 'GET' ? 'bg-good-soft text-good' : 'bg-warn-soft text-warn',
                        )}
                      >
                        {e.method}
                      </span>
                      <span className="vm-num min-w-0 flex-1 truncate text-[11.5px] text-ink">
                        {e.path}
                      </span>
                      {e.admin && (
                        <Badge tone="warn" icon={Lock}>
                          admin
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[10.5px] leading-snug text-ink-3">{e.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        className="mt-3"
        icon={PlugsConnected}
        title="SDMX-JSON, generated from the live series"
        meta={`GET /sdmx/v1/data/APIX/IN.TOTAL_FARE.${FREQ_CODE[freq]} · last six observations`}
        actions={
          <>
            <SegmentedControl options={FREQ_OPTIONS} value={freq} onChange={setFreq} />
            <Button
              icon={Copy}
              onClick={async () => {
                const ok = await copyText(pretty)
                setCopied(ok)
                setTimeout(() => setCopied(false), 1800)
              }}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="primary"
              icon={DownloadSimple}
              onClick={() => downloadJson(`apix-sdmx-${freq.toLowerCase()}.json`, payload)}
            >
              Download
            </Button>
          </>
        }
        footnote="Observation attributes carry the publication status, so a consumer can tell a provisional value from a frozen one, and a suppressed day from a missing one, without reading a release note."
      >
        <pre className="vm-num max-h-[380px] overflow-auto rounded-control bg-surface-inset p-3.5 text-[11.5px] leading-relaxed text-ink-2 ring-1 ring-line">
          {pretty}
        </pre>
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={Timer}
          title="Publication lifecycle"
          meta="A number that can change silently is not a statistic. Every point states where it is in its life."
          bleed
        >
          <ol className="grid grid-cols-1 gap-px bg-[var(--vm-line)] sm:grid-cols-3">
            {LIFECYCLE.map((s) => (
              <li key={s.status} className="bg-surface p-4">
                <Badge tone={s.tone} icon={s.icon}>
                  {s.status}
                </Badge>
                <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  {s.when}
                </p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-2">{s.note}</p>
              </li>
            ))}
          </ol>
          <div className="border-t border-line p-4">
            {/* One column per night, so the strip stays a single row at any width. */}
            <div className="grid auto-cols-fr grid-flow-col gap-1">
              {DAILY.slice(-28).map((p) => (
                <span
                  key={p.date}
                  title={`${fmtDayFull(p.date)}: ${p.status}`}
                  className={cx(
                    'h-5 rounded-[3px]',
                    p.status === 'PROVISIONAL' && 'bg-accent',
                    p.status === 'REVISED' && 'bg-good',
                    p.status === 'FROZEN' && 'bg-surface-3',
                    p.status === 'SUPPRESSED' && 'bg-critical',
                  )}
                />
              ))}
            </div>
            <p className="mt-2 text-[11px] text-ink-3">
              Last 28 days by publication status. The red square is a night that failed the coverage
              gate.
            </p>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-5"
          icon={Stack}
          title="Consuming the feed"
          meta="What an NSO or RBI analyst would actually run"
        >
          <Formula caption="The dataflow definition and the OpenAPI document are both served by the same FastAPI application, so the contract cannot drift from the implementation.">
            {`# the daily series, with its band
curl -s "$API/index/apix\\
?frequency=daily&measure=total" \\
  | jq '.series[-1]'

# or the exchange format
curl -s "$SDMX/data/APIX\\
/IN.TOTAL_FARE.D"`}
          </Formula>

          <div className="mt-3">
            <Callout tone="accent" title="Alignment with MoSPI's own direction">
              MoSPI launched the eSankhyiki portal with a documented API and an official Python
              client, and published a beta MCP server for machine-readable access. Publishing APIx
              in SDMX-JSON puts it in the same lane rather than beside it.
            </Callout>
          </div>
        </Panel>
      </div>
    </div>
  )
}
