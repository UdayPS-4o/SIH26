import { useMemo } from 'react'
import {
  Broadcast,
  CheckCircle,
  Funnel,
  Gauge,
  Lightning,
  Path,
  Timer,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  KeyValue,
  Legend,
  Meter,
  MultiLine,
  PageHeader,
  Panel,
  StatTile,
  useChartTokens,
} from '@/ds'
import {
  CLEAN_QUOTES,
  DAILY,
  FUNNEL,
  IMPUTED_SHARE,
  LATEST,
  NIGHTLY_RUN,
  RAW_QUOTE_COUNT,
  SOURCE_HEALTH,
  SUPPRESSED_COUNT,
  WINSORISED_QUOTES,
} from '@/data/generate'
import { fmtDay, fmtDayFull, fmtInt, fmtPct } from '@/lib/format'

const RUN_TONE = { OK: 'good', WARN: 'warn', RUNNING: 'accent' } as const

export function HealthPage() {
  const t = useChartTokens()

  const coverageData = useMemo(
    () => DAILY.map((p) => ({ date: p.date, coverage: p.coverage })),
    [],
  )

  const meanYield = SOURCE_HEALTH.reduce((a, h) => a + h.yieldPct, 0) / SOURCE_HEALTH.length
  const totalQuotes = SOURCE_HEALTH.reduce((a, h) => a + h.quotes, 0)
  const worstLatency = Math.max(...SOURCE_HEALTH.map((h) => h.p95Latency))
  const meanBlock = SOURCE_HEALTH.reduce((a, h) => a + h.blockRate, 0) / SOURCE_HEALTH.length
  const runTotal = NIGHTLY_RUN.reduce((a, s) => a + s.durationMin, 0)
  const maxStage = Math.max(...NIGHTLY_RUN.map((s) => s.durationMin))

  return (
    <div>
      <PageHeader
        kicker="Collection health"
        title="Whether tonight's panel was good enough to publish"
        lede="Coverage is the operational number that gates publication. Yield, block rate and latency are how you find out why coverage moved before it costs a day of the series."
        actions={
          <Badge tone={LATEST.coverage >= 70 ? 'good' : 'critical'} icon={CheckCircle}>
            Tonight cleared the gate at {fmtPct(LATEST.coverage)}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatTile
          label="Coverage tonight"
          value={fmtPct(LATEST.coverage)}
          icon={Gauge}
          tone={LATEST.coverage >= 70 ? 'good' : 'critical'}
          note={`${LATEST.cellsFilled} of ${LATEST.cellsExpected} cells filled`}
          spark={DAILY.slice(-30).map((p) => p.coverage)}
          sparkColor={t.s3}
        />
        <StatTile
          label="Quotes collected"
          value={fmtInt(totalQuotes)}
          icon={Broadcast}
          tone="accent"
          note={`Across ${SOURCE_HEALTH.length} sources carrying the panel`}
        />
        <StatTile
          label="Mean yield"
          value={fmtPct(meanYield)}
          icon={Funnel}
          tone={meanYield > 85 ? 'good' : 'warn'}
          note="Quotes returned against quotes expected"
        />
        <StatTile
          label="Worst p95 latency"
          value={fmtInt(worstLatency)}
          unit="ms"
          icon={Timer}
          tone={worstLatency > 5000 ? 'warn' : 'neutral'}
          note="A rendered airline portal is slow by nature"
        />
        <StatTile
          label="Mean block rate"
          value={fmtPct(meanBlock, 2)}
          icon={Warning}
          tone={meanBlock > 2 ? 'warn' : 'good'}
          note="429 and 503 responses as a share of requests"
        />
      </div>

      <Panel
        className="mt-3"
        icon={Gauge}
        title="Coverage across the window"
        meta="Share of the 600 expected cells that filled, night by night"
        footnote={`${SUPPRESSED_COUNT} nights fell below the threshold and were written as SUPPRESSED rather than published. They are revised at T+7 once the missing cells are back-filled.`}
      >
        <div className="mb-3">
          <Legend
            items={[
              { label: 'Nightly coverage', color: t.s3 },
              { label: '70% publication gate', color: t.gate, dashed: true },
            ]}
          />
        </div>
        <MultiLine
          data={coverageData}
          series={[{ key: 'coverage', label: 'Coverage', color: t.s3, width: 2.2 }]}
          height={230}
          xFormat={(v) => fmtDay(String(v))}
          yFormat={(n) => `${n.toFixed(0)}%`}
          valueFormat={(n) => fmtPct(n)}
          tipTitle={fmtDayFull}
          yDomain={[50, 100]}
          hLines={[{ y: 70, label: 'Publication gate, 70%' }]}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={Broadcast}
          title="Per-source health"
          meta="Yield, block rate and latency for the six sources that carry the live panel"
          bleed
          footnote="Licensed API and statutory feed routes are fast and near-lossless. The rendered portals are where the operational risk actually lives."
        >
          <DataTable
            rowKey={(h) => h.slug}
            columns={[
              {
                key: 'label',
                header: 'Source',
                cell: (h) => (
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink">{h.label}</span>
                    <span className="vm-num text-[10.5px] text-ink-3">
                      {h.kind.replace('_', ' ').toLowerCase()}
                    </span>
                  </span>
                ),
              },
              {
                key: 'yield',
                header: 'Yield',
                width: '150px',
                cell: (h) => (
                  <span className="block">
                    <span className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="vm-num text-[11.5px] text-ink">{fmtPct(h.yieldPct)}</span>
                      <span className="vm-num text-[10.5px] text-ink-3">
                        {fmtInt(h.quotes)}/{fmtInt(h.expected)}
                      </span>
                    </span>
                    <Meter
                      value={h.yieldPct}
                      tone={h.yieldPct > 90 ? 'good' : h.yieldPct > 80 ? 'accent' : 'warn'}
                      height={6}
                    />
                  </span>
                ),
              },
              {
                key: 'block',
                header: 'Block rate',
                align: 'right',
                cell: (h) => (
                  <Badge tone={h.blockRate > 2 ? 'warn' : 'good'}>{fmtPct(h.blockRate, 2)}</Badge>
                ),
              },
              {
                key: 'lat',
                header: 'p95 latency',
                align: 'right',
                cell: (h) => <span className="vm-num text-ink-2">{fmtInt(h.p95Latency)} ms</span>,
              },
              {
                key: 'kill',
                header: 'Kill-switch',
                align: 'right',
                cell: (h) => (
                  <Badge tone={h.killSwitch === 'ARMED' ? 'good' : 'critical'}>{h.killSwitch}</Badge>
                ),
              },
            ]}
            rows={SOURCE_HEALTH}
          />
        </Panel>

        <Panel
          className="xl:col-span-5"
          icon={Path}
          title="Last night's run"
          meta={`Seven stages, ${runTotal} minutes end to end`}
          bleed
          footnote="Prefect flows in production. The stage that warns is the one worth watching: an unusual outlier count usually means a collector changed, not that fares did."
        >
          <ol className="divide-y divide-line">
            {NIGHTLY_RUN.map((s) => (
              <li key={s.id} className="px-4 py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="vm-num shrink-0 text-[11px] text-ink-3">{s.startedAt}</span>
                    <span className="truncate text-[12.5px] font-medium text-ink">{s.label}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="vm-num text-[11.5px] text-ink-2">{s.durationMin}m</span>
                    <Badge tone={RUN_TONE[s.status]}>{s.status}</Badge>
                  </span>
                </div>
                <div className="mt-1.5">
                  <Meter
                    value={s.durationMin}
                    max={maxStage}
                    tone={s.status === 'WARN' ? 'warn' : 'accent'}
                    height={4}
                  />
                </div>
                <p className="mt-1.5 text-[11px] leading-snug text-ink-3">{s.detail}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={Funnel}
          title="Cleaning funnel"
          meta="From landed raw payloads to the quotes the index is actually compiled from"
          footnote={`${fmtPct((CLEAN_QUOTES / RAW_QUOTE_COUNT) * 100)} of raw quotes survive to the index. The rejections are itemised rather than summarised as a single loss figure.`}
        >
          <ul className="space-y-3">
            {FUNNEL.map((stage, i) => {
              const pct = (stage.kept / RAW_QUOTE_COUNT) * 100
              return (
                <li key={stage.id}>
                  <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="vm-num grid h-5 w-5 place-items-center rounded-chip bg-surface-3 text-[10px] font-semibold text-ink-2">
                        {i + 1}
                      </span>
                      <span className="text-[12.5px] font-medium text-ink">{stage.label}</span>
                    </span>
                    <span className="flex items-baseline gap-2">
                      <span className="vm-num text-[13px] font-semibold text-ink">
                        {fmtInt(stage.kept)}
                      </span>
                      {stage.removed > 0 && (
                        <Badge tone="critical">-{fmtInt(stage.removed)}</Badge>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-chip bg-surface-inset">
                    <div
                      className="h-full rounded-chip transition-[width] duration-[var(--vm-dur-slow)] ease-vm"
                      style={{
                        width: `${pct}%`,
                        background: i === FUNNEL.length - 1 ? t.s3 : t.s1,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-ink-3">{stage.detail}</p>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          className="xl:col-span-5"
          icon={Lightning}
          title="Panel quality at a glance"
          meta="What the contracts and edits did to the panel this window"
        >
          <KeyValue
            rows={[
              { k: 'Raw quotes landed', v: fmtInt(RAW_QUOTE_COUNT) },
              { k: 'Quotes reaching the index', v: fmtInt(CLEAN_QUOTES) },
              { k: 'Survival rate', v: fmtPct((CLEAN_QUOTES / RAW_QUOTE_COUNT) * 100) },
              { k: 'Cell-days imputed', v: `${IMPUTED_SHARE}%`, tone: 'warn' },
              { k: 'Quotes winsorised', v: fmtInt(WINSORISED_QUOTES) },
              { k: 'Nights suppressed', v: `${SUPPRESSED_COUNT} of 90`, tone: 'warn' },
            ]}
          />
          <div className="mt-3">
            <Callout tone="accent" title="Winsorised, not deleted">
              Survivors of the fence are pulled back to the 1st and 99th percentile rather than
              dropped. A genuine surge is dampened, which is conservative, instead of vanishing,
              which would be wrong.
            </Callout>
          </div>
        </Panel>
      </div>
    </div>
  )
}
