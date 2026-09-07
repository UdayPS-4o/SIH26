import { useMemo, useState } from 'react'
import {
  ArrowBendDownRight,
  Clock,
  DownloadSimple,
  Fingerprint,
  Gauge,
  Hourglass,
  IdentificationCard,
  Lock,
  Placeholder,
  Power,
  Prohibit,
  Robot,
  ShieldCheck,
  ShieldWarning,
  Timer,
  UserCircleMinus,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  DataTable,
  Formula,
  KeyValue,
  Meter,
  PageHeader,
  Panel,
  StatTile,
  cx,
  type Tone,
} from '@/ds'
import { AUDIT, DEMO_DATE, SOURCE_HEALTH } from '@/data/generate'
import {
  ACCESS_LABEL,
  POSTURE_LABEL,
  SOURCES,
  type Posture,
  type SourceDef,
} from '@/data/reference'
import { fmtClock, fmtInt, fmtPct } from '@/lib/format'
import { downloadCsv } from '@/lib/download'

const POSTURE_TONE: Record<Posture, Tone> = {
  PENDING_REVIEW: 'warn',
  ALLOW: 'good',
  DISALLOW: 'critical',
  PARTIAL: 'serious',
  LICENSED: 'accent',
  STATUTORY: 'accent',
}

const STANDING_RULES = [
  {
    icon: Robot,
    rule: 'robots.txt is respected',
    how: 'Parsed with protego, cached for 24 hours, re-checked per source per day. There is no bypass path in the code.',
  },
  {
    icon: Hourglass,
    rule: 'Crawl-delay is honoured',
    how: 'The declared delay feeds straight into the per-domain token bucket rather than sitting in a config note.',
  },
  {
    icon: Timer,
    rule: 'Conservative rate limit',
    how: 'At most one request every six seconds per domain, plus a nightly per-domain request cap.',
  },
  {
    icon: IdentificationCard,
    rule: 'Requests are identifiable',
    how: 'A descriptive user agent carrying a contact URL. Never a spoofed browser string.',
  },
  {
    icon: Lock,
    rule: 'No content behind a login',
    how: 'Collectors refuse authenticated routes by design, so no session is ever established.',
  },
  {
    icon: UserCircleMinus,
    rule: 'No personal data',
    how: 'Fare, schedule and tax fields only. Nothing about a passenger is read or retained, so the DPDP Act 2023 is not engaged.',
  },
  {
    icon: ArrowBendDownRight,
    rule: 'Exponential backoff',
    how: 'On any 429 or 503, capped at fifteen minutes, with the retry recorded in the audit log.',
  },
  {
    icon: Power,
    rule: 'Kill-switch',
    how: 'Manual, plus automatic on three consecutive 429s from one domain, which trips that source for 24 hours.',
  },
  {
    icon: Fingerprint,
    rule: 'One fetch per cell per night',
    how: 'A source, sector, lead window and date is never re-fetched twice in the same run.',
  },
  {
    icon: Prohibit,
    rule: 'Anti-bot measures are not defeated',
    how: 'A block is a routing decision, not an obstacle. The source is demoted to a licensed API, and in production to a statutory channel.',
  },
]

const ILLUSTRATIVE_ROBOTS = `# portal-f.example/robots.txt
# fetched 04 Sep 01:31 IST
# cached 24h
User-agent: *
Crawl-delay: 10
Disallow: /flights/search
Disallow: /api/fare
Allow: /

# gate verdict: DISALLOW
# route changed to
# the licensed API.
# no request issued.`

const countKind = (kind: SourceDef['kind']) =>
  SOURCES.filter((s) => s.kind === kind && !s.illustrative).length

export function CompliancePage() {
  const [selectedSlug, setSelectedSlug] = useState('portal-f')
  const selected: SourceDef = useMemo(
    () => SOURCES.find((s) => s.slug === selectedSlug) ?? SOURCES[0],
    [selectedSlug],
  )
  const health = SOURCE_HEALTH.find((h) => h.slug === selected.slug)

  const pending = SOURCES.filter((s) => s.robots === 'PENDING_REVIEW').length
  const blocked = AUDIT.filter((a) => a.status === 429 || a.status === 503).length
  const throttled = AUDIT.filter((a) => a.throttled).length

  return (
    <div>
      <PageHeader
        kicker="Compliance gate"
        title="Every outbound request passes through here, or it does not go out"
        lede="The gate is stage one of the pipeline rather than a paragraph in a README, and its live state is a screen in the product. Where a source declines automated access, it is re-routed, not defeated."
        actions={
          <Badge tone="critical" icon={Power}>
            COLLECTION_ENABLED = false
          </Badge>
        }
      />

      <Callout
        tone="gate"
        title="Read the posture column carefully"
        icon={ShieldWarning}
      >
        This build ships with collection switched off, and no robots.txt or terms have been read for
        any real portal. Every named source below therefore reads{' '}
        <strong className="text-ink">Pending review</strong>, which is its true state. The one row
        marked <strong className="text-ink">illustrative</strong> is a synthetic source that exists
        to demonstrate the demote path end to end. Nothing on this page asserts a verdict about a
        real company's terms.
      </Callout>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Sources in the registry"
          value={SOURCES.length}
          icon={ShieldCheck}
          tone="accent"
          note={`${countKind('AIRLINE')} airline portals, ${countKind('OTA')} OTAs, ${countKind('LICENSED_API')} licensed APIs, ${countKind('MOU')} statutory feed, plus 1 illustrative row`}
        />
        <StatTile
          label="Postures still to review"
          value={pending}
          icon={Warning}
          tone="warn"
          note="Each needs its robots.txt and terms read and recorded before it can be routed"
        />
        <StatTile
          label="Requests throttled in the run"
          value={fmtInt(throttled)}
          icon={Timer}
          tone="neutral"
          note={`Of ${fmtInt(AUDIT.length)} logged requests in the simulated night`}
        />
        <StatTile
          label="Kill-switches tripped"
          value={0}
          icon={Power}
          tone="good"
          note={`${blocked} responses were 429 or 503, none reached three in a row`}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={ShieldCheck}
          title="Source registry and routing table"
          meta="The posture columns are the routing decision. They are not decoration."
          bleed
          footnote="Where a source's terms decline automated access it is demoted to a licensed API, and in production to a statutory data-sharing channel. MoSPI can obtain price data from airlines under the Collection of Statistics Act, 2008."
        >
          <DataTable
            rowKey={(s) => s.slug}
            activeKey={selected.slug}
            onRowClick={(s) => setSelectedSlug(s.slug)}
            maxHeight={430}
            columns={[
              {
                key: 'label',
                header: 'Source',
                cell: (s) => (
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-medium text-ink">{s.label}</span>
                    {s.illustrative && (
                      <Badge tone="warn" icon={Placeholder}>
                        illustrative
                      </Badge>
                    )}
                  </span>
                ),
              },
              {
                key: 'kind',
                header: 'Kind',
                cell: (s) => (
                  <span className="vm-num text-[11px] text-ink-3">{s.kind.replace('_', ' ')}</span>
                ),
              },
              {
                key: 'robots',
                header: 'robots.txt',
                cell: (s) => <Badge tone={POSTURE_TONE[s.robots]}>{POSTURE_LABEL[s.robots]}</Badge>,
              },
              {
                key: 'tos',
                header: 'Terms',
                cell: (s) => <Badge tone={POSTURE_TONE[s.tos]}>{POSTURE_LABEL[s.tos]}</Badge>,
              },
              {
                key: 'access',
                header: 'Route',
                cell: (s) => (
                  <span
                    className={cx(
                      'vm-num text-[11px]',
                      s.access === 'NOT_ROUTED' ? 'text-critical' : 'text-ink-2',
                    )}
                  >
                    {ACCESS_LABEL[s.access]}
                  </span>
                ),
              },
              {
                key: 'cap',
                header: 'Nightly cap',
                align: 'right',
                cell: (s) => (
                  <span className="vm-num text-ink-2">{s.nightlyCap ? fmtInt(s.nightlyCap) : 'n/a'}</span>
                ),
              },
            ]}
            rows={SOURCES}
          />
        </Panel>

        <Panel
          className="xl:col-span-5"
          tone={selected.illustrative ? 'gate' : 'neutral'}
          icon={selected.illustrative ? ShieldWarning : ShieldCheck}
          title={selected.label}
          meta={`${selected.domain} · ${selected.kind.replace('_', ' ').toLowerCase()}`}
        >
          {selected.illustrative ? (
            <>
              <Callout tone="critical" title="This source said no, so we did not scrape it">
                robots.txt disallows the fare-search path, and the terms decline automated
                retrieval. The gate flipped the route to the licensed API and recorded why. No
                request was issued to this domain.
              </Callout>

              <div className="mt-3">
                <KeyValue
                  dense
                  rows={[
                    { k: 'Route before', v: 'Scrapy', tone: 'critical' },
                    { k: 'Route after', v: 'Amadeus Self-Service', tone: 'good' },
                    { k: 'Requests issued', v: '0' },
                    { k: 'Recorded reason', v: 'robots.txt Disallow' },
                  ]}
                />
              </div>

              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                robots.txt as fetched, from the 24-hour cache
              </p>
              <Formula caption={selected.demotedReason}>{ILLUSTRATIVE_ROBOTS}</Formula>
            </>
          ) : (
            <>
              <Callout tone="warn" title="Posture not yet recorded">
                No robots.txt or terms have been read for this source. Until a reviewer records a
                verdict, the gate holds the route closed. The values below are the planned
                configuration, not an active collection.
              </Callout>

              <div className="mt-3">
                <KeyValue
                  dense
                  rows={[
                    { k: 'Planned route', v: ACCESS_LABEL[selected.access] },
                    { k: 'Rate limit', v: `${selected.ratePerMin}/min` },
                    { k: 'Nightly cap', v: selected.nightlyCap ? fmtInt(selected.nightlyCap) : 'n/a' },
                    { k: 'robots.txt cache', v: 'not fetched' },
                    { k: 'Kill-switch', v: health?.killSwitch ?? 'ARMED', tone: 'good' },
                  ]}
                />
              </div>

              {health && (
                <div className="mt-4">
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[11.5px] text-ink-2">
                      Requests against cap, simulated run
                    </span>
                    <span className="vm-num text-[12px] font-semibold text-ink">
                      {fmtInt(health.requestsToday)} / {fmtInt(health.cap)}
                    </span>
                  </div>
                  <Meter
                    value={health.requestsToday}
                    max={health.cap || 1}
                    threshold={health.cap * 0.9}
                    thresholdLabel="90% of the nightly cap"
                    tone="accent"
                    height={10}
                  />
                  <p className="mt-1.5 text-[11px] leading-snug text-ink-3">
                    Figures come from a rehearsal run against the local fixture panel, not from this
                    domain.
                  </p>
                </div>
              )}
            </>
          )}
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={Lock}
        title="Standing rules, enforced in code"
        meta="Ten rules the gate applies to every request, whichever source it is bound for"
        bleed
      >
        {/* Ten rules, laid out two per row so the grid has exactly as many
            cells as there are rules. */}
        <ul className="grid grid-cols-1 gap-px bg-[var(--vm-line)] sm:grid-cols-2">
          {STANDING_RULES.map((r) => (
            <li key={r.rule} className="flex gap-3 bg-surface p-4">
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control bg-gate-soft text-gate ring-1 ring-gate-line">
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

      <Panel
        className="mt-3"
        icon={Clock}
        title="Request audit log"
        meta={`${fmtInt(AUDIT.length)} requests from the simulated run of ${DEMO_DATE}, every one of them logged`}
        actions={
          <Button
            icon={DownloadSimple}
            onClick={() =>
              downloadCsv(
                `vimaan-request-audit-${DEMO_DATE}.csv`,
                [
                  { key: 'at', header: 'timestamp' },
                  { key: 'source', header: 'source' },
                  { key: 'path', header: 'url_path' },
                  { key: 'status', header: 'http_status' },
                  { key: 'latencyMs', header: 'latency_ms' },
                  { key: 'robotsAllowed', header: 'robots_allowed' },
                  { key: 'throttled', header: 'was_throttled' },
                ],
                AUDIT,
              )
            }
          >
            Export CSV
          </Button>
        }
        bleed
        footnote="Auditability is the point. A statistics office has to be able to show, request by request, that a published number was collected within the rules."
      >
        <DataTable
          rowKey={(r) => r.id}
          maxHeight={360}
          columns={[
            {
              key: 'at',
              header: 'Time',
              width: '84px',
              cell: (r) => <span className="vm-num text-ink-2">{fmtClock(r.at)}</span>,
            },
            {
              key: 'source',
              header: 'Source',
              cell: (r) => <span className="text-ink">{r.source}</span>,
            },
            {
              key: 'path',
              header: 'Path',
              cell: (r) => <span className="vm-num text-[11px] text-ink-3">{r.path}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              align: 'right',
              cell: (r) => (
                <Badge tone={r.status === 200 ? 'good' : r.status === 429 ? 'warn' : 'critical'}>
                  {r.status}
                </Badge>
              ),
            },
            {
              key: 'latency',
              header: 'Latency',
              align: 'right',
              cell: (r) => <span className="vm-num text-ink-2">{fmtInt(r.latencyMs)} ms</span>,
            },
            {
              key: 'robots',
              header: 'robots',
              align: 'right',
              cell: (r) => (
                <Badge tone={r.robotsAllowed ? 'good' : 'critical'}>
                  {r.robotsAllowed ? 'allowed' : 'refused'}
                </Badge>
              ),
            },
            {
              key: 'throttled',
              header: 'Throttled',
              align: 'right',
              cell: (r) =>
                r.throttled ? (
                  <Badge tone="warn" icon={Hourglass}>
                    yes
                  </Badge>
                ) : (
                  <span className="text-ink-3">no</span>
                ),
            },
          ]}
          rows={AUDIT}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel icon={Gauge} title="Legal position, stated without overclaiming">
          <ul className="space-y-2.5 text-[12px] leading-relaxed text-ink-2">
            <li>
              <strong className="text-ink">The DPDP Act 2023 is not engaged.</strong> No personal
              data is collected at any point. Fares, schedules and tax fields carry nothing about a
              passenger.
            </li>
            <li>
              <strong className="text-ink">Scraping publicly displayed prices is unsettled in
              Indian law.</strong> Enforceability of browsewrap terms under the Indian Contract Act
              has not been decided. That uncertainty is exactly why the posture is conservative by
              default.
            </li>
            <li>
              <strong className="text-ink">The production design assumes a statutory feed.</strong>{' '}
              Official statistics is supposed to source data this way, and saying so is a stronger
              answer than defending a scraper.
            </li>
          </ul>
        </Panel>

        <Panel icon={Prohibit} title="What this system does not do">
          <ul className="space-y-2.5 text-[12px] leading-relaxed text-ink-2">
            <li>
              It does not solve CAPTCHAs, rotate residential proxies, or spoof a browser
              fingerprint. A block is treated as a routing decision.
            </li>
            <li>
              It does not read anything behind a login, so no account is created and no session is
              maintained on any portal.
            </li>
            <li>
              It does not run at all on a fresh clone. Collection ships disabled, and the registry
              above has to be reviewed before it can be turned on.
            </li>
          </ul>
          <div className="mt-3">
            <Callout tone="good" title="Coverage still holds when a source declines">
              A demoted source's quota moves to the licensed API. Coverage is currently{' '}
              {fmtPct(SOURCE_HEALTH.reduce((a, h) => a + h.yieldPct, 0) / SOURCE_HEALTH.length)}{' '}
              mean yield across the six sources carrying the panel.
            </Callout>
          </div>
        </Panel>
      </div>
    </div>
  )
}
