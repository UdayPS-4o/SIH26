import { useMemo, useState } from 'react'
import {
  CalendarBlank,
  CheckCircle,
  Gear,
  Lightning,
  Play,
  Pause,
  Prohibit,
  Timer,
  Trash,
  Warning,
  Power,
  DownloadSimple,
  ShieldWarning,
  ArrowBendDownRight,
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
  Toggle,
  Slider,
  cx,
  type Tone,
} from '@/ds'
import { SOURCES, type SourceDef } from '@/data/reference'
import { downloadCsv } from '@/lib/download'
import { fmtInt, fmtPct } from '@/lib/format'

/* --------------------------------------------------------------------------
   Global settings state
   -------------------------------------------------------------------------- */

interface GlobalSettings {
  collectionEnabled: boolean
  rateLimit: number
  maxConcurrent: number
  timeout: number
  retries: number
  backoffBase: number
  windowStart: string
  windowEnd: string
  publicationGate: number
}

const INITIAL_SETTINGS: GlobalSettings = {
  collectionEnabled: true,
  rateLimit: 6,
  maxConcurrent: 3,
  timeout: 45,
  retries: 3,
  backoffBase: 6,
  windowStart: '22:00',
  windowEnd: '06:00',
  publicationGate: 70,
}

/* --------------------------------------------------------------------------
   Per-source overrides state
   -------------------------------------------------------------------------- */

interface SourceOverride {
  enabled: boolean
  rateLimit: number
  nightlyCap: number
  crawlDelay: number
  timeout: number
  retries: number
  killSwitch: 'ARMED' | 'DISARMED' | 'TRIGGERED'
}

function buildOverrides(): Record<string, SourceOverride> {
  const map: Record<string, SourceOverride> = {}
  for (const s of SOURCES) {
    map[s.slug] = {
      enabled: s.inPanel || s.access !== 'NOT_ROUTED',
      rateLimit: s.ratePerMin,
      nightlyCap: s.nightlyCap,
      crawlDelay: s.access === 'PLAYWRIGHT' ? 6 : s.access === 'SCRAPY' ? 10 : 0,
      timeout: s.access === 'PLAYWRIGHT' ? 45 : s.access === 'API' ? 15 : 30,
      retries: 3,
      killSwitch: 'ARMED',
    }
  }
  return map
}

/* --------------------------------------------------------------------------
   Audit log entries
   -------------------------------------------------------------------------- */

interface AuditEntry {
  at: string
  by: string
  parameter: string
  oldValue: string
  newValue: string
  reason: string
}

const AUDIT_LOG: AuditEntry[] = [
  {
    at: '2026-09-10T22:05:14+05:30',
    by: 'R. Krishnan',
    parameter: 'global.rateLimit',
    oldValue: '8 req/min',
    newValue: '6 req/min',
    reason: 'Reduced after two consecutive 429 blocks from goindigo.in at peak hours',
  },
  {
    at: '2026-09-09T06:02:41+05:30',
    by: 'A. Mehta',
    parameter: 'source.akasa.crawlDelay',
    oldValue: '4 s',
    newValue: '6 s',
    reason: 'robots.txt updated; new Crawl-delay observed on akasaair.com/fare-search',
  },
  {
    at: '2026-09-08T23:30:00+05:30',
    by: 'System',
    parameter: 'publicationGate',
    oldValue: '65%',
    newValue: '70%',
    reason: 'Raised after backtest showed stabilised yield at 88% across panel sources',
  },
  {
    at: '2026-09-07T04:15:22+05:30',
    by: 'P. Sharma',
    parameter: 'source.ixigo.killSwitch',
    oldValue: 'ARMED',
    newValue: 'TRIGGERED',
    reason: 'Three consecutive 503 responses during the nightly run; source quarantined for 24 h',
  },
  {
    at: '2026-09-05T06:10:03+05:30',
    by: 'R. Krishnan',
    parameter: 'global.backoffBase',
    oldValue: '4 s',
    newValue: '6 s',
    reason: 'Exponential backoff was insufficient for easemytrip.com during sale windows',
  },
  {
    at: '2026-09-03T01:45:00+05:30',
    by: 'System',
    parameter: 'global.timeout',
    oldValue: '30 s',
    newValue: '45 s',
    reason: 'Puppeteer wait timeout increased to accommodate Akasa Air slow-render pages',
  },
]

/* --------------------------------------------------------------------------
   Scheduled jobs
   -------------------------------------------------------------------------- */

interface ScheduledJob {
  name: string
  schedule: string
  description: string
  icon: typeof Timer
  tone: Tone
}

const SCHEDULED_JOBS: ScheduledJob[] = [
  { name: 'Daily collection', schedule: '22:00 IST', description: 'Fare scrape across all active sources for T+1 departure windows', icon: Timer, tone: 'accent' },
  { name: 'Weekly aggregation', schedule: '06:00 IST Monday', description: 'Roll up daily quotes into weekly strata; run cross-source validation', icon: CalendarBlank, tone: 'good' },
  { name: 'Monthly release', schedule: '08:00 IST on the 5th', description: 'Publish the official index series, confidence band and decomposition', icon: Play, tone: 'serious' },
  { name: 'Backtest run', schedule: '04:00 IST daily', description: 'Replay the last 30 days against the reference series; flag divergence > 2 sigma', icon: Lightning, tone: 'warn' },
  { name: 'Report generation', schedule: '23:30 IST daily', description: 'Generate daily briefs, health summaries and anomaly flags', icon: DownloadSimple, tone: 'neutral' },
  { name: 'Data purge', schedule: '02:00 IST Sunday', description: 'Archive raw payloads older than 2 years; keep cleaned panel indefinitely', icon: Trash, tone: 'critical' },
]

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */

export function ScraperConfigPage() {
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS)
  const [overrides, setOverrides] = useState<Record<string, SourceOverride>>(buildOverrides)
  const [purgeConfirm, setPurgeConfirm] = useState(false)
  const [running, setRunning] = useState(false)

  const handleSettingChange = <K extends keyof GlobalSettings>(key: K, value: GlobalSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleOverrideChange = (slug: string, patch: Partial<SourceOverride>) => {
    setOverrides((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], ...patch },
    }))
  }

  const tableColumns = [
    {
      key: 'label',
      header: 'Source',
      cell: (s: SourceDef) => (
        <span className="min-w-0">
          <span className="block truncate font-medium text-ink">{s.label}</span>
          <span className="vm-num text-[10.5px] text-ink-3">
            {s.kind.replace('_', ' ').toLowerCase()} · {s.access.replace('_', ' ').toLowerCase()}
          </span>
        </span>
      ),
    },
    {
      key: 'enabled',
      header: 'Enabled',
      align: 'center' as const,
      width: '80px',
      cell: (s: SourceDef) => (
        <Toggle
          checked={overrides[s.slug]?.enabled ?? false}
          onChange={(v) => handleOverrideChange(s.slug, { enabled: v })}
          label=""
        />
      ),
    },
    {
      key: 'rateLimit',
      header: 'Rate /min',
      align: 'right' as const,
      width: '80px',
      cell: (s: SourceDef) => (
        <span className="vm-num text-ink-2">{overrides[s.slug]?.rateLimit ?? s.ratePerMin}</span>
      ),
    },
    {
      key: 'nightlyCap',
      header: 'Nightly cap',
      align: 'right' as const,
      width: '90px',
      cell: (s: SourceDef) => (
        <span className="vm-num text-ink-2">{fmtInt(overrides[s.slug]?.nightlyCap ?? s.nightlyCap)}</span>
      ),
    },
    {
      key: 'crawlDelay',
      header: 'Crawl (s)',
      align: 'right' as const,
      width: '80px',
      cell: (s: SourceDef) => (
        <span className="vm-num text-ink-2">{overrides[s.slug]?.crawlDelay ?? 0}</span>
      ),
    },
    {
      key: 'timeout',
      header: 'Timeout (s)',
      align: 'right' as const,
      width: '90px',
      cell: (s: SourceDef) => (
        <span className="vm-num text-ink-2">{overrides[s.slug]?.timeout ?? 30}</span>
      ),
    },
    {
      key: 'retries',
      header: 'Retries',
      align: 'right' as const,
      width: '65px',
      cell: (s: SourceDef) => (
        <span className="vm-num text-ink-2">{overrides[s.slug]?.retries ?? 3}</span>
      ),
    },
    {
      key: 'killSwitch',
      header: 'Kill switch',
      align: 'center' as const,
      width: '110px',
      cell: (s: SourceDef) => {
        const ks = overrides[s.slug]?.killSwitch ?? 'ARMED'
        const tone: Tone = ks === 'ARMED' ? 'good' : ks === 'DISARMED' ? 'neutral' : 'critical'
        return <Badge tone={tone}>{ks}</Badge>
      },
    },
  ]

  const handlePurge = () => {
    if (purgeConfirm) {
      alert('Purge initiated. Raw payloads older than 2 years will be archived.')
      setPurgeConfirm(false)
    } else {
      setPurgeConfirm(true)
      setTimeout(() => setPurgeConfirm(false), 4000)
    }
  }

  const handleManualRun = () => {
    setRunning(true)
    setTimeout(() => setRunning(false), 2000)
  }

  const nonIllustrativeCount = SOURCES.filter((s) => !s.illustrative).length
  const activeCount = SOURCES.filter((s) => overrides[s.slug]?.enabled).length

  return (
    <div>
      <PageHeader
        kicker="Scraper configuration"
        title="Tune the collection pipeline without touching code"
        lede="Every collector parameter — rate limit, nightly cap, crawl delay, retry policy, backoff strategy — is configurable from this console. Changes are versioned and auditable. Nothing ships until it passes the compliance gate."
        actions={
          <Badge tone={settings.collectionEnabled ? 'good' : 'critical'} icon={settings.collectionEnabled ? CheckCircle : Power}>
            {settings.collectionEnabled ? 'Collection ON' : 'Collection OFF'}
          </Badge>
        }
      />

      <Callout tone="accent" title="Demo mode is active">
        The controls below are wired to local state for the live demo. In production, every change
        requires a reviewer approval and is written to the configuration audit log before it takes
        effect.
      </Callout>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Active sources"
          value={`${activeCount} / ${nonIllustrativeCount}`}
          icon={Lightning}
          tone="accent"
          note={`${SOURCES.filter((s) => s.illustrative).length} illustrative rows excluded`}
        />
        <StatTile
          label="Rate limit"
          value={`${settings.rateLimit}/min`}
          icon={Gear}
          tone="neutral"
          note="Global per-domain throttle"
        />
        <StatTile
          label="Browsers"
          value={fmtInt(settings.maxConcurrent)}
          icon={Play}
          tone="accent"
          note="Max concurrent Playwright instances"
        />
        <StatTile
          label="Timeout"
          value={`${settings.timeout}s`}
          icon={Timer}
          tone="neutral"
          note="Per-request ceiling"
        />
        <StatTile
          label="Publication gate"
          value={fmtPct(settings.publicationGate)}
          icon={CheckCircle}
          tone={settings.publicationGate >= 70 ? 'good' : 'warn'}
          note="Min coverage to publish"
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Global settings                                                    */}
      {/* ------------------------------------------------------------------ */}

      <Panel
        className="mt-3"
        icon={Gear}
        title="Global settings"
        meta="Applied to every source unless overridden below"
        actions={
          <Button icon={DownloadSimple} variant="secondary">
            Export config
          </Button>
        }
      >
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <div className="space-y-5">
            <Toggle
              checked={settings.collectionEnabled}
              onChange={(v) => handleSettingChange('collectionEnabled', v)}
              label="Collection enabled"
              hint="When off, collectors start but do not issue any outbound requests"
            />

            <Slider
              label="Global rate limit"
              min={1}
              max={60}
              value={settings.rateLimit}
              onChange={(v) => handleSettingChange('rateLimit', v)}
              readout={`${settings.rateLimit} req/min`}
              hint="Maximum requests per minute per domain. Individual sources can be capped lower."
            />

            <Slider
              label="Max concurrent browsers"
              min={1}
              max={10}
              value={settings.maxConcurrent}
              onChange={(v) => handleSettingChange('maxConcurrent', v)}
              readout={fmtInt(settings.maxConcurrent)}
              hint="Playwright browser instances running in parallel. Memory scales linearly."
            />

            <Slider
              label="Request timeout"
              min={10}
              max={120}
              step={5}
              value={settings.timeout}
              onChange={(v) => handleSettingChange('timeout', v)}
              readout={`${settings.timeout}s`}
              hint="Hard ceiling on any single request. Requests exceeding this are aborted and retried."
            />
          </div>

          <div className="space-y-5">
            <Slider
              label="Retry attempts"
              min={0}
              max={5}
              value={settings.retries}
              onChange={(v) => handleSettingChange('retries', v)}
              readout={fmtInt(settings.retries)}
              hint="How many times to retry on 429, 503 or network timeout before marking the cell MISSING."
            />

            <Slider
              label="Backoff base"
              min={1}
              max={60}
              value={settings.backoffBase}
              onChange={(v) => handleSettingChange('backoffBase', v)}
              readout={`${settings.backoffBase}s`}
              hint="Exponential backoff starts at this value. Actual delay = base * 2^attempt seconds, capped at 15 min."
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  <CalendarBlank size={13} weight="duotone" />
                  Collection window start
                </label>
                <input
                  type="time"
                  value={settings.windowStart}
                  onChange={(e) => handleSettingChange('windowStart', e.target.value)}
                  className="h-8 w-full cursor-pointer rounded-control bg-surface-2 px-2 text-[12.5px] text-ink ring-1 ring-line"
                />
              </div>
              <div>
                <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                  <CalendarBlank size={13} weight="duotone" />
                  Collection window end
                </label>
                <input
                  type="time"
                  value={settings.windowEnd}
                  onChange={(e) => handleSettingChange('windowEnd', e.target.value)}
                  className="h-8 w-full cursor-pointer rounded-control bg-surface-2 px-2 text-[12.5px] text-ink ring-1 ring-line"
                />
              </div>
            </div>
            <p className="text-[11px] text-ink-3">IST time window during which collection is permitted to run.</p>

            <Slider
              label="Coverage publication gate"
              min={50}
              max={90}
              step={1}
              value={settings.publicationGate}
              onChange={(v) => handleSettingChange('publicationGate', v)}
              readout={`${settings.publicationGate}%`}
              hint="Nights below this threshold are written as SUPPRESSED and revised at T+7 once cells are back-filled."
            />
          </div>
        </div>
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Per-source configuration                                           */}
      {/* ------------------------------------------------------------------ */}

      <Panel
        className="mt-3"
        icon={Lightning}
        title="Per-source configuration"
        meta={`${SOURCES.length} sources in the registry — toggle, throttle, and timebox each one`}
        actions={
          <span className="vm-num text-[11px] text-ink-3">
            {activeCount} of {nonIllustrativeCount} active
          </span>
        }
        bleed
      >
        <DataTable
          rowKey={(s) => s.slug}
          columns={tableColumns}
          rows={SOURCES}
          maxHeight={520}
        />
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Scheduling                                                         */}
      {/* ------------------------------------------------------------------ */}

      <Panel
        className="mt-3"
        icon={CalendarBlank}
        title="Scheduled jobs"
        meta="Six cron entries governing the collection lifecycle"
        bleed
      >
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {SCHEDULED_JOBS.map((job) => (
            <div
              key={job.name}
              className={cx(
                'flex items-start gap-3 rounded-control border border-line bg-surface-2 p-3',
              )}
            >
              <span
                className={cx(
                  'mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-control ring-1',
                  job.tone === 'accent' && 'bg-accent-soft text-accent ring-accent-line',
                  job.tone === 'good' && 'bg-good-soft text-good ring-good/40',
                  job.tone === 'warn' && 'bg-warn-soft text-warn ring-warn/40',
                  job.tone === 'serious' && 'bg-serious-soft text-serious ring-serious/40',
                  job.tone === 'critical' && 'bg-critical-soft text-critical ring-critical/40',
                  job.tone === 'neutral' && 'bg-surface-3 text-ink-2 ring-line',
                )}
              >
                <job.icon size={15} weight="duotone" />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-semibold text-ink">{job.name}</p>
                <p className="vm-num mt-0.5 text-[11px] text-accent">{job.schedule}</p>
                <p className="mt-1 text-[11px] leading-snug text-ink-3">{job.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Audit log                                                          */}
      {/* ------------------------------------------------------------------ */}

      <Panel
        className="mt-3"
        icon={ArrowBendDownRight}
        title="Recent configuration changes"
        meta={`${AUDIT_LOG.length} entries — the last ${AUDIT_LOG.length} configuration mutations`}
        actions={
          <Button
            icon={DownloadSimple}
            variant="secondary"
            onClick={() =>
              downloadCsv(
                'vimaan-config-audit.csv',
                [
                  { key: 'at', header: 'timestamp' },
                  { key: 'by', header: 'changed_by' },
                  { key: 'parameter', header: 'parameter' },
                  { key: 'oldValue', header: 'old_value' },
                  { key: 'newValue', header: 'new_value' },
                  { key: 'reason', header: 'reason' },
                ],
                AUDIT_LOG,
              )
            }
          >
            Export CSV
          </Button>
        }
        bleed
        footnote="Every change is immutable once recorded. Modifications create a new entry rather than editing an existing one."
      >
        <DataTable
          rowKey={(r) => r.at + r.parameter}
          maxHeight={360}
          columns={[
            {
              key: 'at',
              header: 'Timestamp',
              width: '150px',
              cell: (r) => (
                <span className="vm-num text-ink-2">{r.at.replace('+05:30', ' IST')}</span>
              ),
            },
            {
              key: 'by',
              header: 'Changed by',
              width: '120px',
              cell: (r) => <span className="text-ink">{r.by}</span>,
            },
            {
              key: 'parameter',
              header: 'Parameter',
              cell: (r) => (
                <span className="vm-num text-[11px] text-accent">{r.parameter}</span>
              ),
            },
            {
              key: 'old',
              header: 'Old value',
              align: 'right',
              width: '100px',
              cell: (r) => <span className="vm-num text-ink-2">{r.oldValue}</span>,
            },
            {
              key: 'arrow',
              header: '',
              width: '30px',
              align: 'center',
              cell: () => (
                <span className="text-ink-3">&#8594;</span>
              ),
            },
            {
              key: 'new',
              header: 'New value',
              align: 'right',
              width: '100px',
              cell: (r) => <span className="vm-num font-semibold text-ink">{r.newValue}</span>,
            },
            {
              key: 'reason',
              header: 'Reason',
              cell: (r) => <span className="text-[11.5px] text-ink-2">{r.reason}</span>,
            },
          ]}
          rows={AUDIT_LOG}
        />
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Emergency controls                                                 */}
      {/* ------------------------------------------------------------------ */}

      <Panel
        className="mt-3"
        icon={ShieldWarning}
        title="Emergency controls"
        meta="Override the scheduler and take immediate action on the collection pipeline"
      >
        <Callout tone="warn" title="These actions take effect immediately">
          Pause, resume and manual-run bypass the scheduler. Purge-and-reseed requires a second
          confirmation click. All three are logged to the audit trail with your session identity.
        </Callout>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button
            variant="secondary"
            size="md"
            icon={Pause}
            onClick={() => handleSettingChange('collectionEnabled', false)}
            className="!border-critical/40 !text-critical hover:!bg-critical-soft"
          >
            Pause all collection
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Play}
            onClick={() => handleSettingChange('collectionEnabled', true)}
            className="!border-good/40 !text-good hover:!bg-good-soft"
          >
            Resume all collection
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={running ? CheckCircle : Lightning}
            onClick={handleManualRun}
            disabled={running}
          >
            {running ? 'Running...' : 'Trigger manual run'}
          </Button>

          <Button
            variant="secondary"
            size="md"
            icon={Trash}
            onClick={handlePurge}
            className={
              purgeConfirm
                ? '!bg-critical !text-white ring-2 ring-critical'
                : '!border-critical/40 !text-critical hover:!bg-critical-soft'
            }
          >
            {purgeConfirm ? 'Confirm purge?' : 'Purge and reseed'}
          </Button>
        </div>

        {purgeConfirm && (
          <Callout tone="critical" title="Confirm purge and reseed" className="mt-3">
            This will archive all raw payloads older than 2 years and reset the cleaned panel to
            its seeded state. This action cannot be undone. Click the button again within 4 seconds
            to confirm.
          </Callout>
        )}
      </Panel>
    </div>
  )
}
