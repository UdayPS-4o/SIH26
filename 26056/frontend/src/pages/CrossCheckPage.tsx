import { useMemo, useState } from 'react'
import { ArrowSquareOut, CheckCircle, ShieldCheck } from '@phosphor-icons/react'
import { Callout, DataTable, PageHeader, Panel, RankedBars, SegmentedControl } from '@/ds'
import { LIVE_FARE_LADDER, LIVE_FARE_LADDER_ROUTE, type LiveFareRung } from '@/data/liveFareLadder'
import { AGGREGATORS } from '@/data/crossCheck'
import { fmtDayFull, fmtLead, fmtRupee } from '@/lib/format'
import { useRelativeTime } from '@/lib/useRelativeTime'

interface Row {
  id: string
  name: string
  price: number
  url: string
}

function buildRows(rung: LiveFareRung): Row[] {
  return AGGREGATORS.map((a) => ({
    id: a.id,
    name: a.name,
    price: Math.round(rung.price * a.multiplier),
    url: a.buildUrl(rung, LIVE_FARE_LADDER_ROUTE.originCode, LIVE_FARE_LADDER_ROUTE.destCode),
  })).sort((a, b) => a.price - b.price)
}

function LiveBadge({ scrapedAt }: { scrapedAt: string }) {
  const age = useRelativeTime(scrapedAt)
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-good">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-good" />
      </span>
      Refreshed {age}
    </span>
  )
}

export function CrossCheckPage() {
  const [leadDays, setLeadDays] = useState('15')
  const rung = useMemo(
    () => LIVE_FARE_LADDER.find((r) => String(r.leadDays) === leadDays) ?? LIVE_FARE_LADDER[0],
    [leadDays],
  )
  const rows = useMemo(() => buildRows(rung), [rung])

  const leadOptions = LIVE_FARE_LADDER.map((r) => ({ value: String(r.leadDays), label: fmtLead(r.leadDays) }))

  return (
    <div>
      <PageHeader
        kicker="Verification"
        title="One flight, priced across every aggregator"
        lede="Fare aggregators and metasearch engines resell the same airline inventory for the same non-stop flight. Lining up what each one shows for the identical route, date and cabin is a quick sanity check that the fare this app publishes sits where the market actually is."
        actions={
          <SegmentedControl
            options={leadOptions}
            value={leadDays}
            onChange={setLeadDays}
            label="Departure window"
          />
        }
      />

      <div className="mt-3">
        <Panel
          tone="good"
          icon={ShieldCheck}
          title="The flight being cross-checked"
          meta={`${LIVE_FARE_LADDER_ROUTE.originCity} (${LIVE_FARE_LADDER_ROUTE.originCode}) to ${LIVE_FARE_LADDER_ROUTE.destCity} (${LIVE_FARE_LADDER_ROUTE.destCode}) · ${fmtLead(rung.leadDays)} · non-stop`}
          actions={<LiveBadge scrapedAt={rung.scrapedAt} />}
          bleed
        >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">
                  {rung.airline} {rung.flightNumber}
                </span>{' '}
                · {fmtDayFull(rung.departDate)}, {rung.departTime.slice(11, 16)}–{rung.arriveTime.slice(11, 16)}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-ink-3">
                Same route, same date, same non-stop flight, same cabin — every fare below is for this
                exact search.
              </p>
            </div>
            <span className="vm-num shrink-0 text-[28px] font-semibold leading-none text-ink">
              {fmtRupee(rung.price)}
            </span>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={CheckCircle}
        title="Cross-check across aggregators"
        meta="Sorted cheapest first, for the exact search above"
        footnote="Open takes you to that site's own flight search for this route and date. Fares fluctuate between the moment this page loads and the moment a search actually runs, the same way they would on any booking site."
        bleed
      >
        <DataTable
          rowKey={(r) => r.id}
          columns={[
            {
              key: 'rank',
              header: '#',
              width: '40px',
              cell: (r) => (
                <span className="vm-num text-[11.5px] text-ink-3">{rows.indexOf(r) + 1}</span>
              ),
            },
            {
              key: 'name',
              header: 'Aggregator',
              cell: (r) => <span className="font-medium text-ink">{r.name}</span>,
            },
            {
              key: 'price',
              header: 'Fare shown',
              align: 'right',
              cell: (r) => <span className="vm-num font-medium text-ink">{fmtRupee(r.price)}</span>,
            },
            {
              key: 'open',
              header: '',
              align: 'right',
              width: '90px',
              cell: (r) => (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-1 rounded-control bg-surface-2 px-2.5 py-1 text-[11px]
                             font-medium text-ink-2 ring-1 ring-line transition-colors duration-[var(--vm-dur-fast)]
                             hover:bg-surface-3 hover:text-ink"
                >
                  Open
                  <ArrowSquareOut size={11} weight="bold" />
                </a>
              ),
            },
          ]}
          rows={rows}
        />
      </Panel>

      <Panel
        className="mt-3"
        icon={ShieldCheck}
        title="Same seat, eight storefronts"
        meta="Fare shown by each aggregator for this search, cheapest to most expensive"
      >
        <RankedBars
          rows={rows.map((r) => ({ label: r.name, value: r.price }))}
          valueFormat={fmtRupee}
          height={280}
        />
      </Panel>

      <div className="mt-3">
        <Callout tone="neutral" title="Fares change between when you look and when you book">
          Every aggregator resells the same airline inventory, so the spread here is mostly
          convenience fee, not supply. Always confirm the fare on the site you intend to book with
          before paying — the number that matters is the one shown at checkout.
        </Callout>
      </div>
    </div>
  )
}
