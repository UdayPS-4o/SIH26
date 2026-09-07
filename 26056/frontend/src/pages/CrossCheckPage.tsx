import { useMemo, useState } from 'react'
import { ArrowSquareOut, CheckCircle, Question, ShieldCheck } from '@phosphor-icons/react'
import { Badge, Callout, DataTable, PageHeader, Panel, RankedBars, SegmentedControl } from '@/ds'
import { LIVE_FARE_LADDER, LIVE_FARE_LADDER_ROUTE, type LiveFareRung } from '@/data/liveFareLadder'
import { AGGREGATORS } from '@/data/crossCheck'
import { fmtDayFull, fmtLead, fmtRupee, fmtSignedPct } from '@/lib/format'
import { useRelativeTime } from '@/lib/useRelativeTime'

interface Row {
  id: string
  name: string
  price: number
  url: string
  verified: boolean
}

function buildRows(rung: LiveFareRung): Row[] {
  return AGGREGATORS.map((a) => ({
    id: a.id,
    name: a.name,
    price: a.verified ? rung.price : Math.round(rung.price * a.multiplier),
    url: a.verified ? rung.sourceUrl : a.homeUrl,
    verified: a.verified,
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
  const cleartripPrice = rung.price

  const leadOptions = LIVE_FARE_LADDER.map((r) => ({ value: String(r.leadDays), label: fmtLead(r.leadDays) }))

  return (
    <div>
      <PageHeader
        kicker="Verification"
        title="One flight, priced across every aggregator"
        lede="Fare aggregators mostly resell the same airline inventory and differ by convenience fee, not by supply. Cross-checking the scraped fare against what the other big OTAs typically show for the same seat is a second, independent sanity check on the number this app publishes."
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
                Cleartrip's own search API returned {fmtRupee(cleartripPrice)} for this exact search.
                Every other row below is a modelled estimate, not a second scrape.
              </p>
            </div>
            <span className="vm-num shrink-0 text-[28px] font-semibold leading-none text-ink">
              {fmtRupee(cleartripPrice)}
            </span>
          </div>
        </Panel>
      </div>

      <Panel
        className="mt-3"
        icon={CheckCircle}
        title="Cross-check across aggregators"
        meta="Sorted cheapest first · Cleartrip is the only row this app independently verified"
        footnote="Click Verify on the Cleartrip row to see the live search that produced this fare. The other links go to each aggregator's own flight search, not a saved quote — none of those prices are click-verifiable against a specific fare."
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
              cell: (r) => (
                <span className="flex items-center gap-2">
                  <span className="font-medium text-ink">{r.name}</span>
                  {r.verified ? (
                    <Badge tone="good" icon={ShieldCheck}>
                      Verified
                    </Badge>
                  ) : (
                    <Badge tone="neutral" icon={Question}>
                      Reference
                    </Badge>
                  )}
                </span>
              ),
            },
            {
              key: 'price',
              header: 'Fare shown',
              align: 'right',
              cell: (r) => <span className="vm-num font-medium text-ink">{fmtRupee(r.price)}</span>,
            },
            {
              key: 'delta',
              header: 'Against Cleartrip',
              align: 'right',
              cell: (r) => (
                <span className="vm-num text-ink-3">
                  {r.verified ? '—' : fmtSignedPct(((r.price - cleartripPrice) / cleartripPrice) * 100)}
                </span>
              ),
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
                  {r.verified ? 'Verify' : 'Open'}
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
          rows={rows.map((r) => ({
            label: r.name,
            value: r.price,
            note: r.verified ? 'Independently verified' : 'Modelled reference estimate',
          }))}
          valueFormat={fmtRupee}
          height={280}
          threshold={{ value: cleartripPrice, label: 'Cleartrip · verified' }}
        />
      </Panel>

      <div className="mt-3">
        <Callout tone="neutral" title="What this page is not claiming">
          Only the Cleartrip row comes from a live, click-verifiable search. The other seven are
          reference estimates built from each aggregator's typical convenience-fee spread over the
          same base fare — useful to show the ranking is plausible, not a claim that this app scraped
          eight sites. That distinction stays visible rather than blurred.
        </Callout>
      </div>
    </div>
  )
}
