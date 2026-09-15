import { useMemo, useState } from 'react'
import {
  Airplane,
  AirplaneTilt,
  ArrowSquareOut,
  Funnel,
  PencilSimple,
  Plus,
  Trash,
  Users,
  X,
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
  useChartTokens,
} from '@/ds'
import { CARRIERS, SECTORS, type SectorDef } from '@/data/reference'
import { fmtInt, fmtPct } from '@/lib/format'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/* -------------------------------------------------------------------------- */

type FormState = {
  origin: string
  destination: string
  paxK: string
  isTrunk: boolean
  carriers: string
}

const emptyForm: FormState = {
  origin: '',
  destination: '',
  paxK: '',
  isTrunk: false,
  carriers: '',
}

/* -------------------------------------------------------------------------- */

const CHART_KEYS = [
  's1', 's2', 's3', 's4', 's5', 's6',
] as const

function cellColor(t: ReturnType<typeof useChartTokens>, i: number): string {
  const scale = CHART_KEYS.map((k) => t[k])
  return scale[i % scale.length]
}

/* ========================================================================== */

export function SectorsPage() {
  const t = useChartTokens()

  /* ---- local basket -------------------------------------------------- */
  const [sectors, setSectors] = useState<SectorDef[]>(() => SECTORS.map((s) => ({ ...s })))

  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({ ...emptyForm })

  /* ---- derived stats -------------------------------------------------- */
  const totalPaxK = useMemo(() => sectors.reduce((a, s) => a + s.paxK, 0), [sectors])
  const trunkCount = useMemo(() => sectors.filter((s) => s.isTrunk).length, [sectors])
  const nonTrunkCount = sectors.length - trunkCount

  const allCarriersSet = useMemo(
    () => new Set(sectors.flatMap((s) => s.carriers)),
    [sectors],
  )
  const totalCarriers = allCarriersSet.size

  /* ---- carrier coverage --------------------------------------------- */
  const carrierCoverage = useMemo(() => {
    const map = new Map<string, { code: string; name: string; sectors: string[] }>()
    for (const s of sectors) {
      for (const code of s.carriers) {
        const entry = map.get(code) ?? { code, name: '', sectors: [] }
        entry.sectors.push(s.id)
        if (!entry.name) entry.name = CARRIERS.find((c) => c.code === code)?.name ?? code
        map.set(code, entry)
      }
    }
    return [...map.values()].sort((a, b) => b.sectors.length - a.sectors.length)
  }, [sectors])

  /* ---- weight chart data --------------------------------------------- */
  const weightData = useMemo(
    () =>
      sectors
        .map((s) => ({
          id: s.id,
          weight: totalPaxK > 0 ? (s.paxK / totalPaxK) * 100 : 0,
          paxK: s.paxK,
        }))
        .sort((a, b) => b.weight - a.weight),
    [sectors, totalPaxK],
  )

  /* ---- actions ------------------------------------------------------- */
  const resetForm = () => {
    setForm({ ...emptyForm })
    setShowForm(false)
    setEditId(null)
  }

  const handleAdd = () => {
    if (!form.origin.trim() || !form.destination.trim() || !form.paxK) return
    const paxK = parseFloat(form.paxK)
    if (isNaN(paxK) || paxK <= 0) return

    const id = `${form.origin.toUpperCase()}-${form.destination.toUpperCase()}`
    const carrierCodes = form.carriers
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)

    if (editId) {
      setSectors((prev) =>
        prev.map((s) =>
          s.id === editId
            ? { ...s, origin: form.origin.toUpperCase(), destination: form.destination.toUpperCase(), id, paxK, isTrunk: form.isTrunk, carriers: carrierCodes }
            : s,
        ),
      )
    } else {
      setSectors((prev) => [
        ...prev,
        {
          id,
          origin: form.origin.toUpperCase(),
          destination: form.destination.toUpperCase(),
          paxK,
          isTrunk: form.isTrunk,
          seasonality: 'metro',
          carriers: carrierCodes,
        },
      ])
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    setSectors((prev) => prev.filter((s) => s.id !== id))
    if (editId === id) resetForm()
  }

  const handleEdit = (s: SectorDef) => {
    setForm({
      origin: s.origin,
      destination: s.destination,
      paxK: String(s.paxK),
      isTrunk: s.isTrunk,
      carriers: s.carriers.join(', '),
    })
    setEditId(s.id)
    setShowForm(true)
  }

  /* ---- table columns ------------------------------------------------ */
  const columns = useMemo(
    () => [
      {
        key: 'sector',
        header: 'Sector',
        cell: (r: SectorDef) => (
          <span className="font-mono text-[12px] font-semibold text-ink">{r.id}</span>
        ),
      },
      {
        key: 'route',
        header: 'Route',
        cell: (r: SectorDef) => (
          <span className="text-ink-2">
            {r.origin} <span className="text-ink-3">&rarr;</span> {r.destination}
          </span>
        ),
      },
      {
        key: 'paxK',
        header: 'Monthly pax',
        align: 'right' as const,
        cell: (r: SectorDef) => (
          <span className="vm-num text-ink-2">
            {fmtInt(r.paxK)}k{' '}
            <span className="text-[10.5px] normal-case text-ink-3">pax / mo</span>
          </span>
        ),
      },
      {
        key: 'trunk',
        header: 'Trunk',
        cell: (r: SectorDef) =>
          r.isTrunk ? (
            <Badge tone="good">Trunk</Badge>
          ) : (
            <Badge tone="neutral">Non-trunk</Badge>
          ),
      },
      {
        key: 'carriers',
        header: 'Carriers',
        cell: (r: SectorDef) => (
          <div className="flex flex-wrap gap-1">
            {r.carriers.map((c) => (
              <Badge key={c} tone="accent" className="font-mono">
                {c}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'weight',
        header: 'Weight',
        align: 'right' as const,
        cell: (r: SectorDef) => (
          <span className="vm-num text-ink-2">
            {totalPaxK > 0 ? fmtPct((r.paxK / totalPaxK) * 100) : '—'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: '80px',
        cell: (r: SectorDef) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              icon={PencilSimple}
              onClick={(e) => {
                e.stopPropagation()
                handleEdit(r)
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              icon={Trash}
              onClick={(e) => {
                e.stopPropagation()
                handleDelete(r.id)
              }}
            />
          </div>
        ),
      },
    ],
    [totalPaxK],
  )

  /* ====================================================================== */
  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}
      <PageHeader
        kicker="Basket configuration"
        title="Sector basket management"
        lede="The 20 city-pair sectors that feed the index, their DGCA-derived traffic weights, and the carriers that serve each route."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => { resetForm(); setShowForm(true) }}>
            Add sector
          </Button>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Stat tiles                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Sectors in basket"
          value={fmtInt(sectors.length)}
          icon={Funnel}
          tone="accent"
        />
        <StatTile
          label="Carriers covered"
          value={fmtInt(totalCarriers)}
          icon={Users}
          tone="neutral"
        />
        <StatTile
          label="Monthly passengers"
          value={fmtInt(totalPaxK * 1000)}
          unit="pax / mo"
          icon={Airplane}
          tone="neutral"
        />
        <StatTile
          label="Trunk / non-trunk"
          value={`${fmtInt(trunkCount)} / ${fmtInt(nonTrunkCount)}`}
          icon={AirplaneTilt}
          tone={trunkCount >= sectors.length / 2 ? 'good' : 'warn'}
          note={`${fmtPct((trunkCount / sectors.length) * 100)} trunk share`}
        />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Add / Edit form (expandable panel)                                 */}
      {/* ------------------------------------------------------------------ */}
      {showForm && (
        <Panel
          className="mt-4"
          title={editId ? `Edit sector — ${editId}` : 'Add sector to basket'}
          actions={
            <Button variant="ghost" icon={X} onClick={resetForm}>
              Cancel
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Origin (IATA)
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value.toUpperCase() }))}
                placeholder="DEL"
                className="h-8 w-full rounded-control bg-surface-2 px-2.5 font-mono text-[13px] text-ink
                           ring-1 ring-line placeholder:text-ink-3
                           transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3 focus:outline-none focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Destination (IATA)
              </label>
              <input
                type="text"
                maxLength={3}
                value={form.destination}
                onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value.toUpperCase() }))}
                placeholder="BOM"
                className="h-8 w-full rounded-control bg-surface-2 px-2.5 font-mono text-[13px] text-ink
                           ring-1 ring-line placeholder:text-ink-3
                           transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3 focus:outline-none focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Monthly passengers (thousands)
              </label>
              <input
                type="number"
                min={1}
                value={form.paxK}
                onChange={(e) => setForm((f) => ({ ...f, paxK: e.target.value }))}
                placeholder="520"
                className="h-8 w-full rounded-control bg-surface-2 px-2.5 font-mono text-[13px] text-ink
                           ring-1 ring-line placeholder:text-ink-3
                           transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3 focus:outline-none focus:ring-accent"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                Carriers (comma-separated codes)
              </label>
              <input
                type="text"
                value={form.carriers}
                onChange={(e) => setForm((f) => ({ ...f, carriers: e.target.value }))}
                placeholder="6E, AI, QP"
                className="h-8 w-full rounded-control bg-surface-2 px-2.5 font-mono text-[13px] text-ink
                           ring-1 ring-line placeholder:text-ink-3
                           transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3 focus:outline-none focus:ring-accent"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Toggle
              checked={form.isTrunk}
              onChange={(v) => setForm((f) => ({ ...f, isTrunk: v }))}
              label="Trunk sector"
              hint="High-volume metro-to-metro routes with multiple daily frequencies"
            />
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
              <Button variant="primary" icon={editId ? PencilSimple : Plus} onClick={handleAdd}>
                {editId ? 'Save changes' : 'Add sector'}
              </Button>
            </div>
          </div>
        </Panel>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sector table                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Panel className="mt-4" bleed>
        <DataTable
          rowKey={(r) => (r as SectorDef).id}
          columns={columns}
          rows={sectors}
          maxHeight={520}
          empty={
            <span className="text-ink-3">
              No sectors in the basket. Use the form above to add one.
            </span>
          }
        />
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Weight distribution                                                */}
      {/* ------------------------------------------------------------------ */}
      <Panel
        className="mt-4"
        title="Weight distribution"
        meta="DGCA-traffic proportional share of each sector in the basket"
        footnote="Weights sum to 100% and are recalculated whenever a sector is added, edited, or removed."
      >
        <div style={{ height: Math.max(260, weightData.length * 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weightData} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
              <CartesianGrid stroke={t.grid} horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v: number) => `${v.toFixed(1)}%`}
                {...{
                  stroke: t.axis,
                  tick: { fill: t['ink-3'], fontFamily: 'var(--vm-font-mono)', fontSize: 10.5 },
                  tickLine: false,
                  axisLine: { stroke: t.axis },
                }}
              />
              <YAxis
                type="category"
                dataKey="id"
                width={74}
                {...{
                  stroke: t.axis,
                  tick: { fill: t['ink-2'], fontFamily: 'var(--vm-font-mono)', fontSize: 10.5 },
                  tickLine: false,
                  axisLine: { stroke: t.axis },
                }}
              />
              <Bar dataKey="weight" barSize={14} isAnimationActive={false}>
                {weightData.map((_, i) => (
                  <Cell key={i} fill={cellColor(t, i)} radius={3} />
                ))}
              </Bar>
              <Tooltip
                cursor={{ fill: t['surface-2'], fillOpacity: 0.6 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const row = payload[0].payload as typeof weightData[number]
                  const sector = sectors.find((s) => s.id === row.id)
                  return (
                    <div className="min-w-[180px] rounded-control bg-surface-2 px-3 py-2 shadow-lift ring-1 ring-line-strong">
                      <p className="mb-1 border-b border-line pb-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-ink-3">
                        {row.id}
                      </p>
                      <ul className="space-y-1 text-[12px]">
                        <li className="flex items-center justify-between gap-4 text-ink-2">
                          <span>Weight</span>
                          <span className="vm-num font-medium text-ink">{fmtPct(row.weight)}</span>
                        </li>
                        {sector && (
                          <li className="flex items-center justify-between gap-4 text-ink-2">
                            <span>Monthly pax</span>
                            <span className="vm-num text-ink">{fmtInt(sector.paxK)}k</span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* percentage labels on the right */}
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {weightData.slice(0, 4).map((w, i) => (
            <div
              key={w.id}
              className="flex items-center gap-2 rounded-control bg-surface-inset px-2.5 py-1.5 ring-1 ring-line"
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-chip"
                style={{ background: cellColor(t, i) }}
              />
              <span className="min-w-0 truncate font-mono text-[11px] text-ink-2">{w.id}</span>
              <span className="vm-num ml-auto text-[11px] font-semibold text-ink">{fmtPct(w.weight)}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Carrier coverage                                                   */}
      {/* ------------------------------------------------------------------ */}
      <Panel
        className="mt-4"
        icon={Users}
        title="Carrier coverage"
        meta="Which carriers serve which sectors, and how many"
      >
        {carrierCoverage.length === 0 ? (
          <p className="text-[12.5px] text-ink-3">Add sectors to see carrier coverage.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {carrierCoverage.map((c, i) => (
              <div
                key={c.code}
                className="flex items-center gap-3 rounded-control bg-surface-inset px-3 py-2.5 ring-1 ring-line"
              >
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-chip"
                  style={{ background: cellColor(t, i) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="vm-num block text-[12.5px] font-semibold text-ink">{c.code}</span>
                  <span className="block truncate text-[11px] text-ink-3">{c.name}</span>
                </span>
                <span className="vm-num shrink-0 text-[12px] font-medium text-ink-2">
                  {c.sectors.length} sector{c.sectors.length !== 1 ? 's' : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <KeyValue
            dense
            rows={[
              { k: 'Total distinct carriers', v: fmtInt(totalCarriers) },
              { k: 'Sectors per carrier (avg)', v: totalCarriers > 0 ? (sectors.length * 2 / totalCarriers).toFixed(1) : '—' },
              { k: 'Carriers serving 5+ sectors', v: fmtInt(carrierCoverage.filter((c) => c.sectors.length >= 5).length) },
            ]}
          />
        </div>
      </Panel>

      {/* ------------------------------------------------------------------ */}
      {/* Callout                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-4">
        <Callout tone="accent" title="Sector weights and data freshness">
          Sector weights are derived from DGCA city-pair domestic traffic extracts. The figures on
          this screen are order-of-magnitude placeholders standing in for the real extract until it
          is loaded. Weights can be updated at any time by importing a new DGCA extract — the
          basket size and composition stay the same, only the paxK values change.
          <a
            href="https://dgca.gov.in"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 inline-flex items-center gap-0.5 text-[12px] font-medium text-accent hover:underline"
          >
            DGCA <ArrowSquareOut size={12} weight="bold" />
          </a>
        </Callout>
      </div>
    </div>
  )
}
