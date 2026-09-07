import { useMemo, useState } from 'react'
import {
  AirplaneTakeoff,
  Bank,
  Buildings,
  CurrencyInr,
  Receipt,
  StackSimple,
  Storefront,
} from '@phosphor-icons/react'
import {
  Callout,
  Legend,
  PageHeader,
  Panel,
  SegmentedControl,
  StackedArea,
  StatTile,
  useChartTokens,
} from '@/ds'
import { DECOMPOSITION, SECTOR_DECOMPOSITION } from '@/data/generate'
import { sectorOf } from '@/data/reference'
import { fmtDay, fmtDayFull, fmtPct, fmtRupee } from '@/lib/format'

type View = 'rupees' | 'share'

const VIEW_OPTIONS = [
  { value: 'rupees' as View, label: 'Rupees' },
  { value: 'share' as View, label: 'Share of ticket' },
]

const COMPONENT_NOTES = [
  {
    key: 'baseFare',
    label: 'Base fare',
    icon: AirplaneTakeoff,
    who: 'The airline',
    note: 'The only part the carrier actually sets. Published as a parallel index so a fuel or capacity story can be separated from a tax story.',
  },
  {
    key: 'taxes',
    label: 'Taxes and fees',
    icon: Bank,
    who: 'Statutory',
    note: 'GST on the ticket plus statutory levies. Moves on policy dates, not on demand.',
  },
  {
    key: 'udf',
    label: 'User development fee',
    icon: Buildings,
    who: 'The airport operator',
    note: 'A per-departure charge, so it is a larger share of a cheap ticket than of an expensive one.',
  },
  {
    key: 'convenience',
    label: 'Convenience charge',
    icon: Storefront,
    who: 'The booking channel',
    note: 'Levied by the online travel agency, not by the airline. Present on OTA quotes and largely absent on airline-direct ones.',
  },
] as const

export function DecompositionPage() {
  const t = useChartTokens()
  const [view, setView] = useState<View>('rupees')

  const series = useMemo(
    () => [
      { key: 'baseFare', label: 'Base fare', color: t.s1 },
      { key: 'taxes', label: 'Taxes and fees', color: t.s2 },
      { key: 'udf', label: 'UDF', color: t.s3 },
      { key: 'convenience', label: 'Convenience charge', color: t.s4 },
    ],
    [t],
  )

  const latest = DECOMPOSITION[DECOMPOSITION.length - 1]
  const first = DECOMPOSITION[0]
  const leviedNow = latest.taxes + latest.udf + latest.convenience
  const leviedThen = first.taxes + first.udf + first.convenience
  const leviedShareNow = (leviedNow / latest.total) * 100
  const leviedShareThen = (leviedThen / first.total) * 100

  const topSectors = SECTOR_DECOMPOSITION.slice(0, 12)
  const maxTotal = Math.max(...topSectors.map((s) => s.total))

  return (
    <div>
      <PageHeader
        kicker="Fare decomposition"
        title="Every quote split four ways before it reaches the index"
        lede="A fare is not one number. The published index tracks the total, because that is what a household pays, and the base-fare series runs alongside it so the airline's own price signal stays visible."
        actions={<SegmentedControl options={VIEW_OPTIONS} value={view} onChange={setView} label="View" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Mean ticket, all-India"
          value={fmtRupee(latest.total)}
          icon={CurrencyInr}
          tone="accent"
          note="Weighted across the 20-sector basket and five booking windows"
          spark={DECOMPOSITION.slice(-30).map((d) => d.total)}
          sparkColor={t['line-index']}
        />
        <StatTile
          label="Base fare share"
          value={fmtPct((latest.baseFare / latest.total) * 100)}
          icon={AirplaneTakeoff}
          tone="neutral"
          note={`Was ${fmtPct((first.baseFare / first.total) * 100)} at the start of the window`}
        />
        <StatTile
          label="Levied on top"
          value={fmtRupee(leviedNow)}
          icon={Receipt}
          tone="warn"
          delta={{
            value: `${(leviedShareNow - leviedShareThen).toFixed(1)} pts`,
            direction: leviedShareNow >= leviedShareThen ? 'up' : 'down',
          }}
          note={`${fmtPct(leviedShareNow)} of the ticket`}
        />
        <StatTile
          label="UDF per departure"
          value={fmtRupee(latest.udf)}
          icon={Buildings}
          tone="neutral"
          note="A flat charge, so it weighs heaviest on the cheapest fares"
        />
      </div>

      <Panel
        className="mt-3"
        icon={StackSimple}
        title="What the ticket is made of, across the window"
        meta={
          view === 'rupees'
            ? 'Rupees per mean ticket, stacked'
            : 'Share of the mean ticket, stacked to 100%'
        }
        footnote="The levied components drift up as a share across this window. That drift is precisely why the index publishes total and base fare as parallel series rather than one headline."
      >
        <div className="mb-3">
          <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
        </div>
        <StackedArea
          data={DECOMPOSITION as unknown as Array<Record<string, unknown>>}
          series={series}
          height={310}
          percent={view === 'share'}
          xFormat={(v) => fmtDay(String(v))}
          yFormat={(n) => (view === 'share' ? `${Math.round(n * 100)}%` : `₹${Math.round(n / 1000)}k`)}
          valueFormat={fmtRupee}
          tipTitle={(v) => fmtDayFull(v)}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-7"
          icon={Receipt}
          title="Composition by sector"
          meta="Mean quoted fare across the five booking windows, split into its four parts"
          bleed
        >
          <ul className="divide-y divide-line">
            {topSectors.map((s) => {
              const sector = sectorOf(s.sectorId)
              const parts = [
                { v: s.baseFare, c: t.s1 },
                { v: s.taxes, c: t.s2 },
                { v: s.udf, c: t.s3 },
                { v: s.convenience, c: t.s4 },
              ]
              return (
                <li key={s.sectorId} className="px-4 py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="vm-num text-[12px] font-medium text-ink">{s.sectorId}</span>
                    <span className="min-w-0 flex-1 truncate text-[11px] text-ink-3">
                      {sector.origin} to {sector.destination}
                    </span>
                    <span className="vm-num shrink-0 text-[12px] font-semibold text-ink">
                      {fmtRupee(s.total)}
                    </span>
                  </div>
                  <div
                    className="mt-1.5 flex h-2.5 overflow-hidden rounded-chip"
                    style={{ width: `${(s.total / maxTotal) * 100}%`, minWidth: '40%' }}
                  >
                    {parts.map((p, i) => (
                      <span
                        key={i}
                        title={`${series[i].label}: ${fmtRupee(p.v)}`}
                        className="h-full"
                        style={{
                          width: `${(p.v / s.total) * 100}%`,
                          background: p.c,
                          borderRight: i < parts.length - 1 ? `2px solid ${t.surface}` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>

        <Panel
          className="xl:col-span-5"
          icon={Bank}
          title="Who charges what"
          meta="Four components, four different setters, four different reasons to move"
          bleed
          footnote="Separating these is a problem-statement requirement, and it is also what lets the index answer whether a rise came from the airline, the airport, the exchequer or the booking channel."
        >
          <div className="border-b border-line p-4">
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Share of the mean ticket
              </span>
              <span className="vm-num text-[12.5px] font-semibold text-ink">
                {fmtRupee(latest.total)}
              </span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-chip">
              {series.map((s, i) => {
                const amount = latest[COMPONENT_NOTES[i].key]
                return (
                  <span
                    key={s.key}
                    title={`${s.label}: ${fmtRupee(amount)}`}
                    className="h-full"
                    style={{
                      width: `${(amount / latest.total) * 100}%`,
                      background: s.color,
                      borderRight: i < series.length - 1 ? `2px solid ${t.surface}` : undefined,
                    }}
                  />
                )
              })}
            </div>
            <div className="mt-2">
              <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} />
            </div>
          </div>

          <ul className="divide-y divide-line">
            {COMPONENT_NOTES.map((c, i) => {
              const amount = latest[c.key]
              return (
                <li key={c.key} className="flex gap-3 p-4">
                  <span
                    className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-control"
                    style={{ background: `${series[i].color}22`, color: series[i].color }}
                  >
                    <c.icon size={17} weight="duotone" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-[12.5px] font-semibold text-ink">{c.label}</p>
                      <p className="vm-num shrink-0 text-[12.5px] font-medium text-ink">
                        {fmtRupee(amount)}
                      </p>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3">
                      Set by {c.who} · {fmtPct((amount / latest.total) * 100)} of the ticket
                    </p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-ink-2">{c.note}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <div className="mt-3">
        <Callout tone="accent" title="Why the headline tracks total fare">
          CPI measures what households spend. A traveller pays the total, including the airport's
          fee and the booking channel's charge, so the published index tracks the total. The base
          series exists so that a movement can be attributed rather than merely reported.
        </Callout>
      </div>
    </div>
  )
}
