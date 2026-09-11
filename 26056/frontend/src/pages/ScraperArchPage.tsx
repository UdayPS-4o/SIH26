import { useMemo } from 'react'
import {
  ArrowRight,
  Clock,
  Gear,
  Globe,
  Lightning,
  Power,
  Prohibit,
  Robot,
  ShieldCheck,
  Timer,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  KeyValue,
  Legend,
  PageHeader,
  Panel,
  StatTile,
  cx,
} from '@/ds'
import { fmtClock, fmtInt, fmtPct } from '@/lib/format'

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const STATUS_TONE = {
  Active: 'good' as const,
  Standby: 'warn' as const,
  Disabled: 'critical' as const,
}

const COLLECTOR_TYPE_TONE: Record<string, string> = {
  Playwright: 'bg-accent-soft text-accent ring-accent-line',
  Scrapy: 'bg-good-soft text-good ring-good/40',
  API: 'bg-surface-3 text-ink-2 ring-line',
  Feed: 'bg-warn-soft text-warn ring-warn/40',
}

interface CollectorRow {
  name: string
  type: 'Playwright' | 'Scrapy' | 'API' | 'Feed'
  status: 'Active' | 'Standby' | 'Disabled'
  lastRun: string
  quotes: number
  successRate: number
  avgLatency: number
  notes: string
}

const COLLECTORS: CollectorRow[] = [
  { name: 'IndiGo', type: 'Playwright', status: 'Active', lastRun: '2026-09-11T01:42:00+05:30', quotes: 312, successRate: 0.94, avgLatency: 4200, notes: 'JS-rendered fare matrix, dual-axis search' },
  { name: 'Air India', type: 'Playwright', status: 'Active', lastRun: '2026-09-11T01:38:00+05:30', quotes: 288, successRate: 0.91, avgLatency: 5100, notes: 'Booking widget with session tokens' },
  { name: 'SpiceJet', type: 'Playwright', status: 'Standby', lastRun: '2026-09-10T01:45:00+05:30', quotes: 0, successRate: 0, avgLatency: 0, notes: 'Awaiting robots.txt review' },
  { name: 'Cleartrip', type: 'Scrapy', status: 'Active', lastRun: '2026-09-11T01:40:00+05:30', quotes: 256, successRate: 0.97, avgLatency: 1800, notes: 'Structured HTML, fast through Scrapy' },
  { name: 'MakeMyTrip', type: 'Scrapy', status: 'Active', lastRun: '2026-09-11T01:44:00+05:30', quotes: 248, successRate: 0.89, avgLatency: 2400, notes: 'Dynamic URL scheme, rotating params' },
  { name: 'Yatra', type: 'Scrapy', status: 'Disabled', lastRun: '2026-09-05T01:50:00+05:30', quotes: 0, successRate: 0, avgLatency: 0, notes: 'Kill-switch: 4 consecutive 429s' },
  { name: 'Amadeus', type: 'API', status: 'Active', lastRun: '2026-09-11T01:30:00+05:30', quotes: 180, successRate: 0.99, avgLatency: 800, notes: 'Self-Service API, licensed agreement' },
  { name: 'Duffel', type: 'API', status: 'Active', lastRun: '2026-09-11T01:31:00+05:30', quotes: 156, successRate: 0.98, avgLatency: 950, notes: 'Live pricing endpoint, 120 carriers' },
  { name: 'DGCA Feed', type: 'Feed', status: 'Active', lastRun: '2026-09-11T00:15:00+05:30', quotes: 120, successRate: 1.0, avgLatency: 300, notes: 'SFTP drop, twice-daily, scheduled under MoU' },
]

const PIPELINE_STEPS = [
  { time: '22:00', label: 'Pre-flight checks', detail: 'Gate status verified for all 14 sources. Source health dashboard green. Kill-switches armed.', duration: 5 },
  { time: '22:05', label: 'Playwright collectors launch', detail: 'Browser pool of 3 Chromium instances spun up. IndiGo, Air India, SpiceJet (standby) routes initialised.', duration: 5 },
  { time: '22:10', label: 'Scrapy spiders start', detail: 'Concurrent per-domain: 2 per domain. Cleartrip and MakeMyTrip crawl queues populated. Yatra held at kill-switch.', duration: 5 },
  { time: '22:15', label: 'API connectors pull from Amadeus / Duffel', detail: 'OAuth tokens refreshed. Queries batched by sector and lead window. 336 requests per connector.', duration: 15 },
  { time: '22:30', label: 'Raw data lands in staging', detail: '2,847 raw payloads committed to the staging schema. Schema validation on every payload. Rejected: 12.', duration: 5 },
  { time: '22:35', label: 'Compliance audit', detail: 'Every outbound request logged: timestamp, source, path, status, latency, robots flag. 1,440 entries in the audit log.', duration: 5 },
  { time: '22:40', label: 'Cleaning pipeline', detail: 'Dedup by (source, sector, lead, date). Outlier removal at p5/p95 fence. Fare split into base + taxes + UDF.', duration: 10 },
  { time: '22:45', label: 'Index computation', detail: 'Jevons geometric mean across 360 elementary cells. Block bootstrap, 10,000 resamples, 95% band.', duration: 15 },
  { time: '22:50', label: 'Publication gate check', detail: 'Coverage = 1,440 / 1,440 = 100%. All cells filled. Gate cleared.', duration: 5 },
  { time: '23:00', label: 'Publish', detail: 'APIx written to PostgreSQL. SDMX feed updated. Webhook fired to MoSPI eSankhyiki connector.', duration: 2 },
]

const ANTI_BOT_RULES = [
  { rule: 'robots.txt compliance', how: 'Parsed with protego, cached 24 h, re-checked per source per day. No bypass path.', icon: ShieldCheck },
  { rule: 'Crawl-delay enforcement', how: 'Declared delay feeds directly into the per-domain token bucket. Not advisory — enforced.', icon: Timer },
  { rule: 'Rate limiting', how: 'One request every 6 seconds per domain. Plus a nightly per-domain request cap.', icon: Clock },
  { rule: 'User-Agent identification', how: 'Descriptive UA carrying a contact URL. Never a spoofed browser string.', icon: Globe },
  { rule: 'No CAPTCHA solving', how: 'A block is a routing decision. The source is demoted, not defeated.', icon: Prohibit },
  { rule: 'Exponential backoff', how: 'On 429 / 503: capped at 15 min, retry recorded in the audit log.', icon: Warning },
  { rule: 'Kill-switch (auto + manual)', how: 'Manual toggle, plus automatic trip after 3 consecutive 429s from one domain (24 h hold).', icon: Power },
  { rule: 'IP rotation via residential proxy pool', how: 'Planned for Q4. Current runs from a fixed egress. Proxy pool on the roadmap only.', icon: Globe },
  { rule: 'Session management', how: 'No login. No personal data read or retained. The DPDP Act 2023 is not engaged.', icon: Gear },
  { rule: 'DPDP Act 2023 compliance', how: 'Fare, schedule and tax fields only. Nothing about a passenger is collected at any point.', icon: ShieldCheck },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const toneForStatus = (s: string) => STATUS_TONE[s as keyof typeof STATUS_TONE] ?? 'neutral'

const fmtLatency = (ms: number) =>
  ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${fmtInt(ms)} ms`

const totalDuration = PIPELINE_STEPS.reduce((a, s) => a + s.duration, 0)
const maxDuration = Math.max(...PIPELINE_STEPS.map((s) => s.duration))

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export function ScraperArchPage() {
  return (
    <div>
      <PageHeader
        kicker="Collection engine"
        title="How 1,440 quotes land in the panel every night"
        lede={
          <>
            Four source families, three collector technologies, one compliance gate. Playwright-driven
            browsers render airline portals, Scrapy spiders pull OTA pages faster, licensed API
            connectors (Amadeus, Duffel) deliver structured fares, and the DGCA statutory feed
            closes the gap. Every request passes through a gate that checks robots.txt, enforces
            rate limits, and holds a kill-switch.
          </>
        }
        actions={
          <Badge tone="accent" icon={Robot}>
            14 sources configured
          </Badge>
        }
      />

      {/* ── Stats row ─────────────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Sources configured"
          value={14}
          icon={Globe}
          tone="accent"
          note="5 airlines + 6 OTAs + 2 licensed APIs + 1 statutory"
        />
        <StatTile
          label="Active collectors"
          value={6}
          icon={Robot}
          tone="good"
          note="3 Playwright + 2 Scrapy + 1 feed"
        />
        <StatTile
          label="Nightly quote target"
          value="1,440"
          icon={Lightning}
          tone="accent"
          note="360 elementary cells x 4 quotes per cell"
        />
        <StatTile
          label="Average collection time"
          value="47 min"
          icon={Timer}
          tone="neutral"
          note={`${totalDuration} min end to end for the full pipeline`}
        />
      </div>

      {/* ── Architecture diagram ─────────────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={Gear}
        title="Data flow architecture"
        meta="Seven layers from source to published index"
        bleed
      >
        <div className="flex flex-col gap-1.5">
          {/* Layer 1: Sources */}
          <ArchLayer
            label="Sources"
            color="bg-accent-soft text-accent ring-accent-line"
            nodes={['Airline portals (5)', 'OTA sites (6)', 'Licensed APIs (2)', 'DGCA statutory feed (1)']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 2: Collectors */}
          <ArchLayer
            label="Collectors"
            color="bg-good-soft text-good ring-good/40"
            nodes={['Playwright browsers (3)', 'Scrapy spiders (2)', 'API connectors (2)']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 3: Compliance Gate */}
          <ArchLayer
            label="Compliance gate"
            color="bg-gate-soft text-gate ring-gate-line"
            nodes={['robots.txt check', 'Rate limiter (token bucket)', 'Kill-switch (auto + manual)']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 4: Processing Pipeline */}
          <ArchLayer
            label="Processing pipeline"
            color="bg-warn-soft text-warn ring-warn/40"
            nodes={['HTML/JSON parsing', 'Field normalisation', 'Deduplication']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 5: Cleaning */}
          <ArchLayer
            label="Cleaning"
            color="bg-serious-soft text-serious ring-serious/40"
            nodes={['Outlier removal (p5/p95 fence)', 'Imputation (missing cells)', 'Fare split (base + taxes + UDF)']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 6: Storage */}
          <ArchLayer
            label="Storage"
            color="bg-surface-3 text-ink-2 ring-line"
            nodes={['PostgreSQL (quote storage)', 'Redis (rate limiting, sessions)']}
          >
            <ArrowLabel />
          </ArchLayer>

          {/* Layer 7: Index Engine */}
          <ArchLayer
            label="Index engine"
            color="bg-accent-soft text-accent ring-accent-line"
            nodes={['Jevons computation', 'Block bootstrap bands', 'Publication gate (70% coverage)']}
            noArrow
          />
        </div>
      </Panel>

      {/* ── Collector status table ────────────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={Robot}
        title="Collector status"
        meta="Active, standby and disabled collectors across all source families"
        bleed
        footnote="Standby collectors await robots.txt review. Disabled collectors are held by the kill-switch until the underlying cause is resolved."
      >
        <DataTable
          rowKey={(c) => c.name}
          maxHeight={420}
          columns={[
            {
              key: 'name',
              header: 'Collector',
              cell: (c) => <span className="font-medium text-ink">{c.name}</span>,
            },
            {
              key: 'type',
              header: 'Type',
              width: '110px',
              cell: (c) => (
                <span className={cx(
                  'vm-num inline-block rounded-chip px-1.5 py-0.5 text-[10.5px] font-medium ring-1',
                  COLLECTOR_TYPE_TONE[c.type] ?? 'bg-surface-3 text-ink-2 ring-line',
                )}>
                  {c.type}
                </span>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              width: '100px',
              align: 'right',
              cell: (c) => (
                <Badge tone={toneForStatus(c.status)}>{c.status}</Badge>
              ),
            },
            {
              key: 'lastRun',
              header: 'Last run',
              width: '90px',
              align: 'right',
              cell: (c) => (
                <span className="vm-num text-[11px] text-ink-2">{fmtClock(c.lastRun)}</span>
              ),
            },
            {
              key: 'quotes',
              header: 'Quotes',
              width: '90px',
              align: 'right',
              cell: (c) => (
                <span className="vm-num text-ink-2">
                  {c.quotes > 0 ? fmtInt(c.quotes) : '—'}
                </span>
              ),
            },
            {
              key: 'successRate',
              header: 'Success rate',
              width: '110px',
              align: 'right',
              cell: (c) =>
                c.successRate > 0 ? (
                  <span className="vm-num text-ink-2">{fmtPct(c.successRate * 100)}</span>
                ) : (
                  <span className="text-ink-3">—</span>
                ),
            },
            {
              key: 'latency',
              header: 'Avg latency',
              width: '110px',
              align: 'right',
              cell: (c) => (
                <span className="vm-num text-ink-2">
                  {c.avgLatency > 0 ? fmtLatency(c.avgLatency) : '—'}
                </span>
              ),
            },
            {
              key: 'notes',
              header: 'Notes',
              cell: (c) => (
                <span className="text-[11.5px] text-ink-3">{c.notes}</span>
              ),
            },
          ]}
          rows={COLLECTORS}
        />
      </Panel>

      {/* ── Technology stack ──────────────────────────────────────────────── */}
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel icon={Lightning} title="Scraping technologies" meta="Three collector runtimes, each matched to its source family">
          <StackList
            items={[
              { name: 'Playwright 1.40+', detail: 'Airline portals with heavy JavaScript rendering. Browser pool of 3 Chromium instances. Stealth mode, realistic viewport and user agent.', accent: true },
              { name: 'Scrapy 2.11+', detail: 'OTA sites with structured HTML. Higher throughput: concurrent requests per domain, auto-throttle on response time.', accent: false },
              { name: 'Puppeteer', detail: 'Backup and fallback collector. Used when Playwright fails on a specific domain. Same browser pool, swapped in automatically.', accent: false },
              { name: 'Requests + BeautifulSoup', detail: 'Statutory feeds and simple HTML endpoints. No JS rendering needed. Lightest weight, fastest for static content.', accent: false },
            ]}
          />
        </Panel>

        <Panel icon={Gear} title="Infrastructure" meta="Deployment, scheduling, and observability">
          <StackList
            items={[
              { name: 'PostgreSQL', detail: 'Quote storage. Every cleaned fare lands here with its source attribution, timestamp, and raw payload hash.', accent: false },
              { name: 'Redis', detail: 'Rate limiting (token buckets per domain), session management for Playwright, and cache for robots.txt (24 h TTL).', accent: false },
              { name: 'Celery + Redis', detail: 'Task queue for nightly scheduling. Collector jobs, cleaning stages, and index computation are all Celery tasks.', accent: true },
              { name: 'Prometheus + Grafana', detail: 'Scrape metrics from collectors and the compliance gate. Dashboards for yield, latency, block rate, and kill-switch state.', accent: false },
              { name: 'Docker Compose', detail: 'Single-command deployment. All services defined in docker-compose.yml. Playwright browsers run in their own container.', accent: false },
            ]}
          />
        </Panel>
      </div>

      {/* ── Nightly run pipeline ──────────────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={Clock}
        title="Nightly run pipeline"
        meta={`${PIPELINE_STEPS.length} stages, ${totalDuration} min end to end`}
        bleed
        footnote="Prefect orchestrates in production. Each stage emits a metric. An unusual outlier count at a stage usually means a collector changed, not that fares did."
      >
        <ol className="relative">
          {/* Timeline spine */}
          <div className="absolute inset-y-2 left-[44px] w-px bg-[var(--vm-line)]" aria-hidden />

          {PIPELINE_STEPS.map((step, i) => (
            <li
              key={step.label}
              className="relative flex gap-4 pb-4 last:pb-0"
            >
              {/* Time badge */}
              <span className="z-10 mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface-2 text-[10px] font-semibold text-ink-2 ring-1 ring-line">
                {step.time}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1 rounded-control bg-surface-2 p-3 ring-1 ring-line">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[12.5px] font-semibold text-ink">{step.label}</span>
                  <span className="vm-num text-[11px] text-ink-3">{step.duration} min</span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{step.detail}</p>

                {/* Duration bar */}
                <div className="mt-2">
                  <div className="h-1.5 overflow-hidden rounded-chip bg-surface-inset">
                    <div
                      className="h-full rounded-chip bg-accent transition-[width] duration-[var(--vm-dur-slow)] ease-vm"
                      style={{ width: `${(step.duration / maxDuration) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      {/* ── Anti-bot & ethical measures ───────────────────────────────────── */}
      <Panel
        className="mt-3"
        icon={ShieldCheck}
        title="Anti-bot and ethical measures"
        meta="Ten rules the compliance gate applies to every request, whichever source it is bound for"
        bleed
      >
        <ul className="grid grid-cols-1 gap-px bg-[var(--vm-line)] sm:grid-cols-2">
          {ANTI_BOT_RULES.map((r) => (
            <li key={r.rule} className="flex gap-3 bg-surface p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control bg-good-soft text-good ring-1 ring-good/40">
                <r.icon size={16} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold leading-tight text-ink">{r.rule}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{r.how}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

interface ArchLayerProps {
  label: string
  color: string
  nodes: string[]
  noArrow?: boolean
  children?: React.ReactNode
}

function ArchLayer({ label, color, nodes, noArrow, children }: ArchLayerProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex min-w-0 flex-1 items-center gap-3 rounded-control bg-surface-2 p-3 ring-1 ring-line">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {nodes.map((n) => (
            <span
              key={n}
              className={cx(
                'rounded-chip px-2 py-1 text-[11px] font-medium ring-1',
                color,
              )}
            >
              {n}
            </span>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}

function ArrowLabel() {
  return (
    <span className="shrink-0 text-ink-3" aria-hidden>
      <ArrowRight size={20} weight="bold" />
    </span>
  )
}

interface StackItem {
  name: string
  detail: string
  accent: boolean
}

function StackList({ items }: { items: StackItem[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.name}
          className={cx(
            'rounded-control p-3 ring-1',
            item.accent ? 'bg-accent-soft ring-accent-line' : 'bg-surface-2 ring-line',
          )}
        >
          <p className="text-[12.5px] font-semibold text-ink">{item.name}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{item.detail}</p>
        </li>
      ))}
    </ul>
  )
}
