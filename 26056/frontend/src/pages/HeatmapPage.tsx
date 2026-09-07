import { useMemo, useState } from 'react'
import {
  ArrowsDownUp,
  Circle,
  GridFour,
  Info,
  MagnifyingGlassPlus,
  Path,
  Thermometer,
  Warning,
} from '@phosphor-icons/react'
import {
  Badge,
  Callout,
  EmptyState,
  Heatmap,
  KeyValue,
  Legend,
  PageHeader,
  Panel,
  RankedBars,
  SegmentedControl,
  StatTile,
  useChartTokens,
  type HeatDatum,
} from '@/ds'
import { CELLS, HEATMAP, SECTOR_WEIGHT, fareAtLead, heatAt } from '@/data/generate'
import { LEAD_BUCKETS, SECTORS, carrierOf, sectorOf, type LeadBucket } from '@/data/reference'
import { fmtInt, fmtLead, fmtPct, fmtRupee, fmtSignedPct } from '@/lib/format'

type SortKey = 'weight' | 'move' | 'name'

const SORT_OPTIONS = [
  { value: 'weight' as SortKey, label: 'By weight', icon: ArrowsDownUp },
  { value: 'move' as SortKey, label: 'By move', icon: Thermometer },
  { value: 'name' as SortKey, label: 'A to Z', icon: Path },
]

export function HeatmapPage() {
  const t = useChartTokens()
  const [sort, setSort] = useState<SortKey>('weight')
  const [selected, setSelected] = useState<{ row: string; col: string }>({
    row: 'DEL-CCU',
    col: 'T+7',
  })

  const rows = useMemo(() => {
    const ids = SECTORS.map((s) => s.id)
    if (sort === 'name') return [...ids].sort()
    if (sort === 'weight') return [...ids].sort((a, b) => SECTOR_WEIGHT.get(b)! - SECTOR_WEIGHT.get(a)!)
    const worst = (id: string) => Math.max(...HEATMAP.filter((h) => h.sectorId === id).map((h) => h.pctChange))
    return [...ids].sort((a, b) => worst(b) - worst(a))
  }, [sort])

  const cols = LEAD_BUCKETS.map(fmtLead)

  const data: HeatDatum[] = useMemo(
    () =>
      HEATMAP.map((h) => ({
        row: h.sectorId,
        col: fmtLead(h.lead),
        value: h.pctChange,
        meta: `${fmtInt(h.quotes)} quotes`,
      })),
    [],
  )

  const selectedLead = Number(selected.col.replace('T+', '')) as LeadBucket
  const cell = heatAt(selected.row, selectedLead)
  const sector = sectorOf(selected.row)
  const contributingCells = CELLS.filter(
    (c) => c.sectorId === selected.row && c.lead === selectedLead,
  )
  const meanFare = fareAtLead(selected.row, selectedLead)
  const priorFare = Math.round(meanFare / (1 + cell.pctChange / 100))

  const hottest = [...HEATMAP].sort((a, b) => b.pctChange - a.pctChange).slice(0, 8)
  const coldest = [...HEATMAP].sort((a, b) => a.pctChange - b.pctChange).slice(0, 4)

  const leadSummary = LEAD_BUCKETS.map((lead) => {
    const cells = HEATMAP.filter((h) => h.lead === lead)
    return {
      label: fmtLead(lead),
      value: Number((cells.reduce((a, c) => a + c.pctChange, 0) / cells.length).toFixed(2)),
      note: `Mean week-on-week change across all 20 sectors at ${fmtLead(lead)}`,
    }
  })

  return (
    <div>
      <PageHeader
        kicker="Sector heatmap"
        title="What got expensive this week, and at which booking window"
        lede="Each cell is one elementary aggregate: a sector at a fixed lead time. Colour is the change against the same cell seven days ago, so the comparison holds product quality constant."
        actions={<SegmentedControl options={SORT_OPTIONS} value={sort} onChange={setSort} label="Order" />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          label="Hottest cell"
          value={fmtSignedPct(hottest[0].pctChange)}
          icon={Thermometer}
          tone="critical"
          note={`${hottest[0].sectorId} at ${fmtLead(hottest[0].lead)}`}
        />
        <StatTile
          label="Coolest cell"
          value={fmtSignedPct(coldest[0].pctChange)}
          icon={Circle}
          tone="good"
          note={`${coldest[0].sectorId} at ${fmtLead(coldest[0].lead)}`}
        />
        <StatTile
          label="Cells painted"
          value={HEATMAP.length}
          icon={GridFour}
          tone="accent"
          note="20 sectors by 5 lead windows"
        />
        <StatTile
          label="Cells needing imputation"
          value={HEATMAP.filter((h) => h.imputed).length}
          icon={Warning}
          tone="warn"
          note="Sold-out inventory imputed at the cell-mean relative"
        />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
        <Panel
          className="xl:col-span-8"
          icon={GridFour}
          title="Sector by lead window"
          meta="Percentage change against the same cell seven days ago"
          footnote="A festival surge must survive the outlier filter. If the edit rule deletes a real demand week, the index is useless, so the fence is calibrated to keep it and the sensitivity is on the methodology console."
        >
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <Heatmap
                data={data}
                rows={rows}
                cols={cols}
                valueFormat={(n) => (n > 0 ? `+${n.toFixed(0)}` : n.toFixed(0))}
                selected={selected}
                onSelect={(d) => setSelected({ row: d.row, col: d.col })}
              />
            </div>
          </div>
        </Panel>

        <Panel
          className="xl:col-span-4"
          tone="accent"
          icon={MagnifyingGlassPlus}
          title={`${selected.row} at ${selected.col}`}
          meta={`${sector.origin} to ${sector.destination} · ${sector.isTrunk ? 'trunk sector' : 'non-trunk sector'}`}
        >
          {contributingCells.length === 0 ? (
            <EmptyState title="No cell selected" hint="Click any cell in the grid to drill in." />
          ) : (
            <>
              <div className="flex items-baseline gap-2">
                <span className="vm-num text-[38px] font-semibold leading-none tracking-tight text-ink">
                  {fmtSignedPct(cell.pctChange)}
                </span>
                <span className="text-[11.5px] text-ink-3">week on week</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={cell.imputed ? 'warn' : 'good'} icon={cell.imputed ? Warning : Circle}>
                  {cell.imputed ? 'Contains imputed quotes' : 'No imputation needed'}
                </Badge>
                <Badge tone="neutral" icon={Info}>
                  {fmtInt(cell.quotes)} quotes
                </Badge>
              </div>

              <div className="mt-4">
                <KeyValue
                  dense
                  rows={[
                    { k: 'Mean fare now', v: fmtRupee(meanFare) },
                    { k: 'Mean fare 7 days ago', v: fmtRupee(priorFare) },
                    { k: 'Jevons price relative', v: (1 + cell.pctChange / 100).toFixed(4) },
                    { k: 'Sector weight', v: fmtPct(SECTOR_WEIGHT.get(selected.row)! * 100, 2) },
                    { k: 'Carriers in cell', v: cell.carriers.length },
                    { k: 'Sub-cells rolled up', v: contributingCells.length },
                  ]}
                />
              </div>

              <p className="mt-4 mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Contributing carriers
              </p>
              <ul className="space-y-1.5">
                {cell.carriers.map((code) => {
                  const c = carrierOf(code)
                  const sub = contributingCells.filter((x) => x.carrier === code)
                  const q = sub.reduce((a, x) => a + x.quotes, 0)
                  return (
                    <li
                      key={code}
                      className="flex items-center justify-between gap-3 rounded-control bg-surface-inset px-2.5 py-1.5 ring-1 ring-line"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="vm-num rounded-chip bg-surface-3 px-1.5 py-0.5 text-[10.5px] font-semibold text-ink">
                          {code}
                        </span>
                        <span className="truncate text-[12px] text-ink-2">{c.name}</span>
                      </span>
                      <span className="vm-num shrink-0 text-[11.5px] text-ink-3">
                        {q > 0 ? `${fmtInt(q)} quotes` : 'no quotes tonight'}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel
          icon={Thermometer}
          title="Where the week's pressure sits"
          meta="Mean week-on-week change by booking window, across every sector"
          footnote="Short lead windows carry the demand signal. This is why a monthly manual collection, which sees roughly one point on the booking curve, cannot pick up a festival week."
        >
          <RankedBars
            rows={leadSummary}
            height={190}
            color={t.s2}
            valueFormat={(n) => `${n > 0 ? '+' : ''}${n.toFixed(1)}%`}
          />
        </Panel>

        <Panel icon={ArrowsDownUp} title="Biggest movers" meta="Top eight cells by week-on-week change" bleed>
          <ul className="divide-y divide-line">
            {hottest.map((h) => (
              <li key={`${h.sectorId}-${h.lead}`}>
                <button
                  onClick={() => setSelected({ row: h.sectorId, col: fmtLead(h.lead) })}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-2"
                >
                  <span className="vm-num w-[74px] shrink-0 text-[12px] font-medium text-ink">
                    {h.sectorId}
                  </span>
                  <span className="vm-num w-[38px] shrink-0 rounded-chip bg-surface-3 px-1.5 py-0.5 text-center text-[10.5px] text-ink-2">
                    {fmtLead(h.lead)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] text-ink-3">
                    {fmtInt(h.quotes)} quotes · {h.carriers.length} carriers
                  </span>
                  <span
                    className="vm-num shrink-0 rounded-chip px-2 py-0.5 text-[11.5px] font-semibold"
                    style={{
                      background: t['div-p1'],
                      color: t['div-ink-quiet'],
                    }}
                  >
                    {fmtSignedPct(h.pctChange)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-3">
        <Legend
          items={[
            { label: 'Cool arm: fares fell against last week', color: t['div-n3'] },
            { label: 'Neutral: inside 8% of the largest move on the grid', color: t['div-mid'] },
            { label: 'Warm arm: fares rose against last week', color: t['div-p3'] },
          ]}
        />
      </div>

      <div className="mt-3">
        <Callout tone="accent" title="Why the comparison is cell against cell, never sector against sector">
          Tomorrow's DEL to BOM is a different product from today's: a different departure date,
          different remaining inventory, a different fare bucket. Holding the lead time constant
          holds quality constant, which is what makes two nights comparable at all.
        </Callout>
      </div>
    </div>
  )
}
