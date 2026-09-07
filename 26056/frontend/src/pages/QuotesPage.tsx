import { useMemo, useState } from 'react'
import {
  ArrowCounterClockwise,
  DownloadSimple,
  FunnelSimple,
  MagnifyingGlass,
  Table as TableIcon,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Button,
  Callout,
  DataTable,
  PageHeader,
  Panel,
  Select,
  StatTile,
  Toggle,
} from '@/ds'
import { CLEAN_QUOTES, QUOTES } from '@/data/generate'
import { CARRIERS, LEAD_BUCKETS, PANEL_SOURCES, SECTORS } from '@/data/reference'
import { fmtClock, fmtInt, fmtLead, fmtRupee } from '@/lib/format'
import { downloadCsv } from '@/lib/download'

const ANY = 'ANY'

export function QuotesPage() {
  const [sector, setSector] = useState(ANY)
  const [carrier, setCarrier] = useState(ANY)
  const [lead, setLead] = useState(ANY)
  const [source, setSource] = useState(ANY)
  const [search, setSearch] = useState('')
  const [imputedOnly, setImputedOnly] = useState(false)
  const [soldOutOnly, setSoldOutOnly] = useState(false)

  const rows = useMemo(() => {
    const q = search.trim().toUpperCase()
    return QUOTES.filter(
      (r) =>
        (sector === ANY || r.sectorId === sector) &&
        (carrier === ANY || r.carrier === carrier) &&
        (lead === ANY || String(r.lead) === lead) &&
        (source === ANY || r.source === source) &&
        (!imputedOnly || r.imputed) &&
        (!soldOutOnly || r.soldOut) &&
        (q === '' || r.flightNo.toUpperCase().includes(q) || r.sectorId.includes(q)),
    )
  }, [sector, carrier, lead, source, search, imputedOnly, soldOutOnly])

  const meanFare = rows.length
    ? Math.round(rows.reduce((a, r) => a + r.total, 0) / rows.length)
    : 0
  const imputedCount = rows.filter((r) => r.imputed).length
  const soldOutCount = rows.filter((r) => r.soldOut).length
  const filtersActive =
    sector !== ANY || carrier !== ANY || lead !== ANY || source !== ANY || search !== '' || imputedOnly || soldOutOnly

  const reset = () => {
    setSector(ANY)
    setCarrier(ANY)
    setLead(ANY)
    setSource(ANY)
    setSearch('')
    setImputedOnly(false)
    setSoldOutOnly(false)
  }

  return (
    <div>
      <PageHeader
        kicker="Quote explorer"
        title="The cleaned panel, row by row"
        lede="Every quote carries its cell assignment and its four-way fare split, plus a flag for whether it was imputed or winsorised. Nothing in the index comes from a row that is not visible here."
        actions={
          <Button
            variant="primary"
            icon={DownloadSimple}
            onClick={() =>
              downloadCsv(
                'vimaan-quotes.csv',
                [
                  { key: 'capturedAt', header: 'captured_at' },
                  { key: 'source', header: 'source' },
                  { key: 'sectorId', header: 'sector' },
                  { key: 'carrier', header: 'carrier' },
                  { key: 'flightNo', header: 'flight_no' },
                  { key: 'lead', header: 'lead_bucket' },
                  { key: 'band', header: 'dep_dow_band' },
                  { key: 'baseFare', header: 'base_fare' },
                  { key: 'taxes', header: 'taxes_fees' },
                  { key: 'udf', header: 'udf' },
                  { key: 'convenience', header: 'convenience_fee' },
                  { key: 'total', header: 'total_fare' },
                  { key: 'imputed', header: 'is_imputed' },
                  { key: 'soldOut', header: 'is_sold_out' },
                ],
                rows,
              )
            }
          >
            Export {fmtInt(rows.length)} rows
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Rows matching"
          value={fmtInt(rows.length)}
          unit={`of ${fmtInt(QUOTES.length)}`}
          icon={TableIcon}
          tone="accent"
          note={filtersActive ? 'Filters applied' : 'No filters applied'}
        />
        <StatTile
          label="Mean total fare"
          value={rows.length ? fmtRupee(meanFare) : '0'}
          icon={FunnelSimple}
          tone="neutral"
          note="Across the rows currently in view"
        />
        <StatTile
          label="Imputed rows"
          value={fmtInt(imputedCount)}
          icon={Warning}
          tone={imputedCount > 0 ? 'warn' : 'good'}
          note="Cell-mean imputation, never carry-forward"
        />
        <StatTile
          label="Sold-out observations"
          value={fmtInt(soldOutCount)}
          icon={Warning}
          tone={soldOutCount > 0 ? 'serious' : 'good'}
          note="Recorded rather than dropped, because sold-out is not missing at random"
        />
      </div>

      <Panel
        className="mt-3"
        icon={FunnelSimple}
        title="Filters"
        meta="The same dimensions the cell key is built from"
        actions={
          filtersActive ? (
            <Button icon={ArrowCounterClockwise} onClick={reset}>
              Clear filters
            </Button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          <Select
            label="Sector"
            value={sector}
            onChange={setSector}
            options={[{ value: ANY, label: 'All sectors' }, ...SECTORS.map((s) => ({ value: s.id, label: s.id }))]}
          />
          <Select
            label="Carrier"
            value={carrier}
            onChange={setCarrier}
            options={[
              { value: ANY, label: 'All carriers' },
              ...CARRIERS.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` })),
            ]}
          />
          <Select
            label="Lead window"
            value={lead}
            onChange={setLead}
            options={[
              { value: ANY, label: 'All windows' },
              ...LEAD_BUCKETS.map((b) => ({ value: String(b), label: fmtLead(b) })),
            ]}
          />
          <Select
            label="Source"
            value={source}
            onChange={setSource}
            options={[
              { value: ANY, label: 'All sources' },
              ...PANEL_SOURCES.map((s) => ({ value: s.label, label: s.label })),
            ]}
          />
          <label className="block min-w-0 lg:col-span-2">
            <span className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Flight or sector
            </span>
            <span className="relative block">
              <MagnifyingGlass
                size={14}
                weight="bold"
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search by flight number or sector"
                className="h-8 w-full rounded-control bg-surface-2 pl-8 pr-2.5 text-[12.5px] text-ink
                           ring-1 ring-line placeholder:text-ink-3
                           focus:ring-accent-line"
                placeholder="6E 428"
              />
            </span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-6 border-t border-line pt-3">
          <Toggle
            checked={imputedOnly}
            onChange={setImputedOnly}
            label="Imputed rows only"
            hint="Cells where inventory was sold out or the quote was missing"
          />
          <Toggle
            checked={soldOutOnly}
            onChange={setSoldOutOnly}
            label="Sold-out observations only"
            hint="Recorded as sold out rather than silently dropped"
          />
        </div>
      </Panel>

      <Panel
        className="mt-3"
        icon={TableIcon}
        title="Cleaned quotes"
        meta={`${fmtInt(rows.length)} rows · fare split into base, taxes, UDF and convenience charge`}
        bleed
        footnote="Each row's cell key is sector, carrier, lead window, cabin and weekday band. That key, not the sector, is the unit the index compares across nights."
      >
        <DataTable
          rowKey={(r) => r.id}
          maxHeight={520}
          empty="Loosen a filter, or clear them all."
          columns={[
            {
              key: 'time',
              header: 'Captured',
              width: '78px',
              cell: (r) => <span className="vm-num text-ink-3">{fmtClock(r.capturedAt)}</span>,
            },
            {
              key: 'sector',
              header: 'Sector',
              cell: (r) => <span className="vm-num font-medium text-ink">{r.sectorId}</span>,
            },
            {
              key: 'flight',
              header: 'Flight',
              cell: (r) => <span className="vm-num text-ink-2">{r.flightNo}</span>,
            },
            {
              key: 'lead',
              header: 'Window',
              cell: (r) => (
                <span className="vm-num rounded-chip bg-surface-3 px-1.5 py-0.5 text-[10.5px] text-ink-2">
                  {fmtLead(r.lead)}
                </span>
              ),
            },
            {
              key: 'band',
              header: 'Band',
              cell: (r) => <span className="vm-num text-[11px] text-ink-3">{r.band}</span>,
            },
            {
              key: 'source',
              header: 'Source',
              cell: (r) => <span className="truncate text-ink-2">{r.source}</span>,
            },
            {
              key: 'base',
              header: 'Base',
              align: 'right',
              cell: (r) => <span className="vm-num text-ink-2">{fmtRupee(r.baseFare)}</span>,
            },
            {
              key: 'taxes',
              header: 'Taxes',
              align: 'right',
              cell: (r) => <span className="vm-num text-ink-3">{fmtRupee(r.taxes)}</span>,
            },
            {
              key: 'udf',
              header: 'UDF',
              align: 'right',
              cell: (r) => <span className="vm-num text-ink-3">{fmtRupee(r.udf)}</span>,
            },
            {
              key: 'conv',
              header: 'Convenience',
              align: 'right',
              cell: (r) => <span className="vm-num text-ink-3">{fmtRupee(r.convenience)}</span>,
            },
            {
              key: 'total',
              header: 'Total',
              align: 'right',
              cell: (r) => <span className="vm-num font-semibold text-ink">{fmtRupee(r.total)}</span>,
            },
            {
              key: 'flags',
              header: 'Flags',
              align: 'right',
              cell: (r) => (
                <span className="inline-flex gap-1">
                  {r.imputed && <Badge tone="warn">imputed</Badge>}
                  {r.winsorised && <Badge tone="serious">winsorised</Badge>}
                  {r.soldOut && <Badge tone="critical">sold out</Badge>}
                  {!r.imputed && !r.winsorised && !r.soldOut && (
                    <span className="text-ink-3">clean</span>
                  )}
                </span>
              ),
            },
          ]}
          rows={rows}
        />
      </Panel>

      <div className="mt-3">
        <Callout tone="neutral" title="This is a sample of the panel, not all of it">
          The full seeded window holds {fmtInt(CLEAN_QUOTES)} cleaned quotes across 90 nights. The
          explorer loads a {fmtInt(QUOTES.length)}-row slice from the latest night so the table stays
          responsive without a backend behind it.
        </Callout>
      </div>
    </div>
  )
}
