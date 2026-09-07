import { useMemo, useState } from 'react'
import {
  ArrowSquareOut,
  ArrowsHorizontal,
  Binoculars,
  CurrencyInr,
  Eye,
  ShieldCheck,
  TrendDown,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  DataTable,
  Legend,
  MultiLine,
  PageHeader,
  Panel,
  RankedBars,
  SegmentedControl,
  Select,
  StatTile,
  Toggle,
  useChartTokens,
} from '@/ds'
import { elasticityCurve, fareAtLead, leadSpread } from '@/data/generate'
import { LEAD_BUCKETS, SECTORS, sectorOf, type LeadBucket } from '@/data/reference'
import { LIVE_FARE_LADDER, LIVE_FARE_LADDER_ROUTE, type LiveFareRung } from '@/data/liveFareLadder'
import { LIVE_CABIN_COMPARE, LIVE_CABIN_COMPARE_ROUTE } from '@/data/liveCabinCompare'
import { fmtDayFull, fmtInt, fmtLead, fmtRupee } from '@/lib/format'

const SECTOR_OPTIONS = SECTORS.map((s) => ({
  value: s.id,
  label: `${s.id} · ${s.paxK}k pax/month`,
}))

type Scale = 'log' | 'linear'

const SCALE_OPTIONS = [
  { value: 'log' as Scale, label: 'Log', hint: 'Equal vertical distance means equal percentage change' },
  { value: 'linear' as Scale, label: 'Linear', hint: 'Equal vertical distance means equal rupees' },
]

export function ElasticityPage() {
  const t = useChartTokens()
  const [primary, setPrimary] = useState('DEL-BOM')
  const [secondary, setSecondary] = useState('BLR-HYD')
  const [scale, setScale] = useState<Scale>('log')
  const [overlay, setOverlay] = useState(true)

  const data = useMemo(() => {
    const a = elasticityCurve(primary)
    const b = elasticityCurve(secondary)
    return a.map((p, i) => ({
      lead: p.lead,
      primary: p.fare,
      secondary: b[i].fare,
      isBucket: p.isBucket,
    }))
  }, [primary, secondary])

  const series = useMemo(
    () => [
      { key: 'primary', label: primary, color: t.s1 },
      ...(overlay ? [{ key: 'secondary', label: secondary, color: t.s2, dashed: true }] : []),
    ],
    [primary, secondary, overlay, t],
  )

  const spread = leadSpread(primary)
  const t1 = fareAtLead(primary, 1)
  const t45 = fareAtLead(primary, 45)
  const t15 = fareAtLead(primary, 15)

  const bucketDots = LEAD_BUCKETS.map((b) => ({
    x: b as number,
    y: fareAtLead(primary, b),
    label: fmtLead(b),
    color: t.s1,
  }))

  const tableRows = LEAD_BUCKETS.map((b) => ({
    lead: b,
    primary: fareAtLead(primary, b),
    secondary: fareAtLead(secondary, b),
  }))

  return (
    <div>
      <PageHeader
        kicker="Lead-time elasticity"
        title="The same seat, priced five ways, on the same night"
        lede="Mean quoted fare against days to departure. Manual monthly collection sees roughly one point on this curve, from a channel almost nobody books through any more."
        actions={
          <SegmentedControl options={SCALE_OPTIONS} value={scale} onChange={setScale} label="Y scale" />
        }
      />

      <div className="mt-3">
        <Panel
          tone="good"
          icon={ShieldCheck}
          title="Live fare ladder"
          meta={`${LIVE_FARE_LADDER_ROUTE.originCity} (${LIVE_FARE_LADDER_ROUTE.originCode}) to ${LIVE_FARE_LADDER_ROUTE.destCity} (${LIVE_FARE_LADDER_ROUTE.destCode}) · one real fare scraped from Cleartrip at each collection window`}
          bleed
          footnote="Each price is the cheapest Cleartrip fare for that exact departure date at scrape time. Click Verify to open the same search and compare."
        >
          <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-5 sm:divide-y-0 sm:divide-x">
            {LIVE_FARE_LADDER.map((rung: LiveFareRung) => (
              <div key={rung.leadDays} className="flex flex-col gap-1.5 p-4">
                <span className="vm-num text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {fmtLead(rung.leadDays)}
                </span>
                <span className="text-[11px] text-ink-3">{fmtDayFull(rung.departDate)}</span>
                <span className="vm-num text-[22px] font-semibold leading-none text-ink">
                  {fmtRupee(rung.price)}
                </span>
                <span className="text-[11px] leading-snug text-ink-2">
                  {rung.airline} {rung.flightNumber}
                  {rung.stops > 0 ? ` · ${rung.stops} stop${rung.stops > 1 ? 's' : ''}` : ' · non-stop'}
                </span>
                <a
                  href={rung.sourceUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 inline-flex w-fit items-center gap-1 rounded-control bg-surface-2 px-2 py-1 text-[10.5px]
                             font-medium text-ink-2 ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)]
                             hover:bg-surface-3 hover:text-ink"
                >
                  Verify
                  <ArrowSquareOut size={11} weight="bold" />
                </a>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={`${primary} booked 45 days out`}
          value={fmtRupee(t45)}
          icon={CurrencyInr}
          tone="good"
          note="The cheapest point on the curve"
        />
        <StatTile
          label={`${primary} booked tomorrow`}
          value={fmtRupee(t1)}
          icon={Warning}
          tone="critical"
          note="Same seat, same aircraft, same night"
        />
        <StatTile
          label="Spread across the curve"
          value={`${spread.toFixed(1)}x`}
          icon={ArrowsHorizontal}
          tone="accent"
          note="Ratio of the T+1 fare to the T+45 fare"
        />
        <StatTile
          label="Points a monthly collector sees"
          value="1"
          unit="of 5"
          icon={Eye}
          tone="warn"
          note="VIMAAN captures all five windows, every night"
        />
      </div>

      <div className="mt-3">
        <Panel
          tone="good"
          icon={ShieldCheck}
          title="Live cabin comparison"
          meta={`${LIVE_CABIN_COMPARE_ROUTE.originCity} (${LIVE_CABIN_COMPARE_ROUTE.originCode}) to ${LIVE_CABIN_COMPARE_ROUTE.destCity} (${LIVE_CABIN_COMPARE_ROUTE.destCode}), ${fmtDayFull(LIVE_CABIN_COMPARE_ROUTE.departDate)} (T+${LIVE_CABIN_COMPARE_ROUTE.leadDays}) · cheapest real Cleartrip fare in each cabin, same night`}
          bleed
          footnote="Each bar is the cheapest fare Cleartrip returned for that cabin on the same departure date. Click Verify to open the same search."
        >
          <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <RankedBars
                rows={LIVE_CABIN_COMPARE.map((c) => ({
                  label: c.cabin,
                  value: c.price,
                  note: `${c.airline} ${c.flightNumber} · ${c.stops > 0 ? `${c.stops} stop${c.stops > 1 ? 's' : ''}` : 'non-stop'}`,
                }))}
                valueFormat={fmtRupee}
                height={200}
              />
            </div>
            <div className="flex flex-col justify-center gap-2 lg:col-span-5">
              {LIVE_CABIN_COMPARE.map((c) => (
                <div
                  key={c.cabin}
                  className="flex items-center justify-between gap-3 rounded-control bg-surface-2 px-3 py-2 ring-1 ring-line"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold leading-tight text-ink">{c.cabin}</p>
                    <p className="vm-num mt-0.5 text-[15px] font-semibold leading-none text-ink">
                      {fmtRupee(c.price)}
                    </p>
                  </div>
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center gap-1 rounded-control bg-surface-3 px-2 py-1 text-[10.5px]
                               font-medium text-ink-2 ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)]
                               hover:bg-surface hover:text-ink"
                  >
                    Verify
                    <ArrowSquareOut size={11} weight="bold" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={TrendDown}
        title="Fare against days to departure"
        meta={`${primary}${overlay ? ` overlaid with ${secondary}` : ''} · marked points are the five collection windows`}
        actions={
          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Primary sector"
              swatch={t.s1}
              value={primary}
              onChange={setPrimary}
              options={SECTOR_OPTIONS}
              className="w-[190px]"
            />
            <Select
              label="Overlay"
              swatch={t.s2}
              value={secondary}
              onChange={setSecondary}
              options={SECTOR_OPTIONS}
              className="w-[190px]"
            />
          </div>
        }
        footnote="A log vertical scale is the honest default here: on a linear scale the T+1 spike flattens everything to its left, and the whole point is that the percentage step between windows is large at every stage."
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Legend items={series.map((s) => ({ label: s.label, color: s.color, dashed: s.dashed }))} />
          <Toggle
            checked={overlay}
            onChange={setOverlay}
            label="Compare a second sector"
            hint="A trunk route against a short-haul one"
          />
        </div>

        <MultiLine
          data={data}
          series={series}
          xKey="lead"
          height={330}
          logY={scale === 'log'}
          xFormat={(v) => `T+${v}`}
          yFormat={(n) => `₹${Math.round(n / 1000)}k`}
          valueFormat={fmtRupee}
          tipTitle={(v) => `Booked ${v} ${Number(v) === 1 ? 'day' : 'days'} before departure`}
          dots={bucketDots}
        />
      </Panel>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-12">
        <Panel
          className="lg:col-span-5"
          icon={Binoculars}
          title="What each collection method sees"
          meta="The same night, the same sector, two collection designs"
          bleed
        >
          <div className="divide-y divide-line">
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Badge tone="critical" icon={Eye}>
                  Manual monthly
                </Badge>
                <span className="text-[11.5px] text-ink-3">one outlet, one price, once a month</span>
              </div>
              <p className="vm-num mt-2 text-[26px] font-semibold leading-none text-ink">
                {fmtRupee(t15)}
              </p>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink-2">
                A single observation somewhere on the curve, with no record of which booking window
                it came from, so it cannot be compared to next month's.
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2">
                <Badge tone="good" icon={TrendDown}>
                  VIMAAN nightly
                </Badge>
                <span className="text-[11.5px] text-ink-3">five windows, every night</span>
              </div>
              <ul className="mt-2 space-y-1.5">
                {LEAD_BUCKETS.map((b) => {
                  const fare = fareAtLead(primary, b)
                  const pct = (fare / t1) * 100
                  return (
                    <li key={b} className="flex items-center gap-2.5">
                      <span className="vm-num w-9 shrink-0 text-[11px] text-ink-3">{fmtLead(b)}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-chip bg-surface-inset">
                        <span
                          className="block h-full rounded-chip"
                          style={{ width: `${pct}%`, background: t.s1 }}
                        />
                      </span>
                      <span className="vm-num w-[68px] shrink-0 text-right text-[11.5px] font-medium text-ink">
                        {fmtRupee(fare)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-7"
          icon={ArrowsHorizontal}
          title="Bucket comparison"
          meta={`${primary} against ${secondary} at each collection window`}
          bleed
          footnote="Fares here are the mean of the cleaned panel for that cell, not a single observed quote."
        >
          <DataTable
            rowKey={(r) => String(r.lead)}
            columns={[
              {
                key: 'lead',
                header: 'Window',
                cell: (r) => (
                  <span className="vm-num font-medium text-ink">{fmtLead(r.lead as LeadBucket)}</span>
                ),
              },
              {
                key: 'p',
                header: primary,
                align: 'right',
                cell: (r) => <span className="vm-num text-ink">{fmtRupee(r.primary)}</span>,
              },
              {
                key: 's',
                header: secondary,
                align: 'right',
                cell: (r) => <span className="vm-num text-ink-2">{fmtRupee(r.secondary)}</span>,
              },
              {
                key: 'gap',
                header: 'Gap',
                align: 'right',
                cell: (r) => (
                  <span className="vm-num text-ink-3">
                    {fmtRupee(Math.abs(r.primary - r.secondary))}
                  </span>
                ),
              },
              {
                key: 'ratio',
                header: 'Against T+45',
                align: 'right',
                cell: (r) => (
                  <span className="vm-num font-medium text-ink">
                    {(r.primary / tableRows[tableRows.length - 1].primary).toFixed(2)}x
                  </span>
                ),
              },
            ]}
            rows={tableRows}
          />
          <div className="border-t border-line px-4 py-2.5 text-[11.5px] text-ink-3">
            {primary} carries {fmtInt(sectorOf(primary).paxK)}k passengers a month against{' '}
            {fmtInt(sectorOf(secondary).paxK)}k on {secondary}, which is why it takes the larger
            share of the index weight.
          </div>
        </Panel>
      </div>

      <div className="mt-3">
        <Callout tone="accent" title="This curve is the reason the index is built on cells">
          Because the fare depends so heavily on when you look, an average of everything scraped
          moves whenever the mix of booking windows in the sample changes. Fixing the lead window
          removes that, and leaves only the price movement.
        </Callout>
      </div>
    </div>
  )
}
