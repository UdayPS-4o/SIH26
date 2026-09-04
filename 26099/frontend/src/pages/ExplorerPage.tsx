/**
 * Material explorer.
 *
 * The raw material, before anything was done to it. Every other page in this
 * console makes a claim about these rows, so the rows have to be inspectable:
 * searchable, filterable, sortable, and honest about how many of them there are.
 *
 * The page states its own sample size at the top rather than implying it is
 * showing all 24.1 lakh records. A demo that admits what it measured is easier
 * to check than one that does not.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowDown,
  ArrowSquareOut,
  ArrowUp,
  ArrowsDownUp,
  Barcode,
  Buildings,
  CaretDown,
  CaretLeft,
  CaretRight,
  Copy,
  Package,
  Stack,
  Warehouse,
} from '@phosphor-icons/react'

import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Field,
  Label,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Segmented,
  Select,
  Skeleton,
  Stat,
  StatCell,
  StatRow,
  Table,
  Td,
  TextInput,
  Th,
} from '@/components/ui'
import { CategoryBarChart, ChartLegend, DonutChart } from '@/components/ui/charts'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { normalizeDescription, type NormalizeResponse } from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { CPSES, TOTAL_RECORDS } from '@/engine/corpus'
import { formatExact, formatRupees } from '@/engine/savings'
import {
  ATTRIBUTE_SLOTS,
  FAMILY_LABEL,
  type AttributeSlot,
  type Cluster,
  type Cpse,
  type MaterialFamily,
  type MaterialRecord,
} from '@/engine/types'

const PAGE_SIZE = 40

const SLOT_LABEL: Record<AttributeSlot, string> = {
  noun: 'Noun',
  variant: 'Variant',
  material: 'Material',
  grade: 'Grade',
  dimension: 'Dimension',
  rating: 'Rating',
  standard: 'Standard',
}

type CpseFilter = 'ALL' | Cpse['code']
type FamilyFilter = 'ALL' | MaterialFamily
type LinkFilter = 'all' | 'shared' | 'unique'
type SortKey = 'qty' | 'spend' | 'stock' | null

const spendOf = (record: MaterialRecord) => record.annualQty * record.unitPrice

/** What is on the shelf, valued at the price the organisation last paid. */
const stockValueOf = (record: MaterialRecord) => record.stockOnHand * record.unitPrice

/**
 * Months of cover: how long the stock on hand lasts at the current rate of use.
 * A number a stores officer reads without translating, and the one that shows an
 * organisation is holding far more than it can consume.
 */
const coverOf = (record: MaterialRecord) =>
  record.annualQty > 0 ? (record.stockOnHand / record.annualQty) * 12 : 0

/** Above this, the holding is worth flagging rather than merely reporting. */
const HEAVY_COVER = 12

export default function ExplorerPage() {
  const c = useCopy()

  const records = useService(s => s.records)
  const clusters = useService(s => s.clusters)
  const health = useService(s => s.health)
  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const materialsCall = useService(s => s.lastCall.materials)
  const registryCall = useService(s => s.lastCall.registry)

  const [query, setQuery] = useState('')
  const [cpse, setCpse] = useState<CpseFilter>('ALL')
  const [family, setFamily] = useState<FamilyFilter>('ALL')
  const [link, setLink] = useState<LinkFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(0)
  const [openId, setOpenId] = useState<string | null>(null)

  /** Which national code each record resolved to. */
  const clusterOf = useMemo(() => {
    const map = new Map<string, Cluster>()
    for (const cluster of clusters) {
      for (const member of cluster.members) map.set(member.id, cluster)
    }
    return map
  }, [clusters])

  const base = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return records.filter(record => {
      if (needle) {
        const hit =
          record.rawDescription.toLowerCase().includes(needle) ||
          record.localCode.toLowerCase().includes(needle)
        if (!hit) return false
      }
      if (family !== 'ALL' && record.family !== family) return false
      if (link !== 'all') {
        const shared = (clusterOf.get(record.id)?.cpses.length ?? 1) > 1
        if (link === 'shared' && !shared) return false
        if (link === 'unique' && shared) return false
      }
      return true
    })
  }, [records, query, family, link, clusterOf])

  const cpseCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const record of base) counts[record.cpse] = (counts[record.cpse] ?? 0) + 1
    return counts
  }, [base])

  const filtered = useMemo(
    () => (cpse === 'ALL' ? base : base.filter(record => record.cpse === cpse)),
    [base, cpse],
  )

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const read =
      sortKey === 'qty'
        ? (r: MaterialRecord) => r.annualQty
        : sortKey === 'stock'
          ? stockValueOf
          : spendOf
    const factor = sortDir === 'desc' ? -1 : 1
    return [...filtered].sort((a, b) => (read(a) - read(b)) * factor)
  }, [filtered, sortKey, sortDir])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const rows = useMemo(
    () => sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [sorted, safePage],
  )

  useEffect(() => {
    setPage(0)
    setOpenId(null)
  }, [query, cpse, family, link, sortKey, sortDir])

  const filtersActive = query.trim() !== '' || cpse !== 'ALL' || family !== 'ALL' || link !== 'all'

  const clearFilters = () => {
    setQuery('')
    setCpse('ALL')
    setFamily('ALL')
    setLink('all')
  }

  const toggleSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      if (sortDir === 'desc') setSortDir('asc')
      else {
        setSortKey(null)
        setSortDir('desc')
      }
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  const familiesPresent = useMemo(() => {
    const set = new Set<MaterialFamily>()
    for (const record of records) set.add(record.family)
    return [...set]
  }, [records])

  if (error) {
    return (
      <>
        <PageHead title={c('explorerTitle')} lead={c('explorerLead')} />
        <ErrorState message={error} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <PageHead title={c('explorerTitle')} lead={c('explorerLead')} />
        <Skeleton rows={3} className="mb-6" />
        <Skeleton rows={8} />
      </>
    )
  }

  if (records.length === 0) {
    return (
      <>
        <PageHead title={c('explorerTitle')} lead={c('explorerLead')} />
        <NothingLoaded what="This page lists every item record the four organisations hold, with the national code each one resolved to." />
      </>
    )
  }

  return (
    <>
      <PageHead title={c('explorerTitle')} lead={c('explorerLead')} />

      <SampleNote sliceSize={records.length} />

      <Panel flush className="mt-6">
        <PanelHead
          title="Records"
          meta={
            filtersActive
              ? `${formatExact(sorted.length)} of ${formatExact(records.length)} rows`
              : `${formatExact(records.length)} rows`
          }
          action={
            <TechnicalOnly>
              {materialsCall ? (
                <EndpointTag
                  method={materialsCall.method}
                  endpoint={materialsCall.endpoint}
                  ms={materialsCall.ms}
                  scanned={materialsCall.scanned}
                />
              ) : null}
            </TechnicalOnly>
          }
        />

        <div className="border-b border-rule px-5 py-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Field
              label="Search"
              helper="Matches the raw description and the company's own code. Case does not matter."
            >
              <TextInput
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder="bearing, 6205, SL-MRO"
                aria-label="Search descriptions and codes"
              />
            </Field>
            <Field label="Family">
              <Select
                value={family}
                onChange={event => setFamily(event.target.value as FamilyFilter)}
                aria-label="Filter by family"
              >
                <option value="ALL">All families</option>
                {familiesPresent.map(value => (
                  <option key={value} value={value}>
                    {FAMILY_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-x-6 gap-y-3">
            <div className="flex flex-col gap-1.5">
              <Label>Organisation</Label>
              <Segmented
                size="sm"
                value={cpse}
                onChange={setCpse}
                options={[
                  { value: 'ALL' as CpseFilter, label: 'All', count: base.length },
                  ...CPSES.map(entry => ({
                    value: entry.code as CpseFilter,
                    label: entry.code,
                    count: cpseCounts[entry.code] ?? 0,
                  })),
                ]}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Overlap</Label>
              <Segmented
                size="sm"
                value={link}
                onChange={setLink}
                options={[
                  { value: 'all', label: 'All rows' },
                  { value: 'shared', label: 'Shares a code with another company' },
                  { value: 'unique', label: 'Unique to one company' },
                ]}
              />
            </div>

            {filtersActive ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              title="No rows match these filters."
              detail={c('emptySearch')}
              action={
                <Button size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Company</Th>
                  <Th>Local code</Th>
                  <Th>Raw description</Th>
                  <Th>Family</Th>
                  <SortableTh
                    label="Annual qty"
                    active={sortKey === 'qty'}
                    dir={sortDir}
                    onClick={() => toggleSort('qty')}
                  />
                  <SortableTh
                    label="Annual spend"
                    active={sortKey === 'spend'}
                    dir={sortDir}
                    onClick={() => toggleSort('spend')}
                  />
                  <SortableTh
                    label="In store"
                    active={sortKey === 'stock'}
                    dir={sortDir}
                    onClick={() => toggleSort('stock')}
                  />
                  <Th>National code</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map(record => {
                  const cluster = clusterOf.get(record.id)
                  const siblings = cluster ? cluster.members.filter(m => m.id !== record.id) : []
                  const open = openId === record.id
                  return (
                    <RecordRow
                      key={record.id}
                      record={record}
                      cluster={cluster}
                      siblings={siblings}
                      open={open}
                      onToggle={() => setOpenId(open ? null : record.id)}
                    />
                  )
                })}
              </tbody>
            </Table>

            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <p className="text-[12.5px] text-ink-2">
                Showing <Num size="sm">{formatExact(safePage * PAGE_SIZE + 1)}</Num> to{' '}
                <Num size="sm">{formatExact(safePage * PAGE_SIZE + rows.length)}</Num> of{' '}
                <Num size="sm">{formatExact(sorted.length)}</Num> rows
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                  icon={<CaretLeft size={16} weight="regular" />}
                >
                  Previous
                </Button>
                <span className="font-mono text-[11px] text-ink-3">
                  {safePage + 1} / {pageCount}
                </span>
                <Button
                  size="sm"
                  onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                  disabled={safePage >= pageCount - 1}
                  icon={<CaretRight size={16} weight="regular" />}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Panel>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Corpus health
          </h2>
          <p className="text-[12.5px] text-ink-2">
            Measured on the slice above, after clustering.
          </p>
          <TechnicalOnly>
            {registryCall ? (
              <span className="ml-auto">
                <EndpointTag
                  method={registryCall.method}
                  endpoint={registryCall.endpoint}
                  ms={registryCall.ms}
                  scanned={registryCall.scanned}
                />
              </span>
            ) : null}
          </TechnicalOnly>
        </div>

        {health ? (
          <StatRow className="lg:!grid-cols-3">
            <StatCell>
              <Stat
                value={formatExact(health.records)}
                label="Records read"
                icon={<Stack size={16} weight="regular" />}
                tone="neutral"
              />
            </StatCell>
            <StatCell>
              <Stat
                value={formatExact(health.distinctCodes)}
                label="Distinct national codes"
                icon={<Barcode size={16} weight="regular" />}
                note="One code per group of records that resolved together."
              />
            </StatCell>
            <StatCell>
              <Stat
                value={formatExact(health.clustersWithDuplicates)}
                label="Codes held by more than one record"
                icon={<Copy size={16} weight="regular" />}
                tone="attention"
              />
            </StatCell>
            <StatCell>
              <Stat
                value={formatExact(health.duplicateRecords)}
                label="Duplicate records"
                icon={<Copy size={16} weight="regular" />}
                tone="attention"
                emphasis
                note="Rows that repeat an item already held under the same code."
              />
            </StatCell>
            <StatCell>
              <Stat
                value={formatExact(health.crossCpseClusters)}
                label="Groups spanning companies"
                icon={<Buildings size={16} weight="regular" />}
                tone="info"
              />
            </StatCell>
            <StatCell>
              <Stat
                value={formatExact(health.largestCluster)}
                label="Largest group"
                icon={<Warehouse size={16} weight="regular" />}
                tone="neutral"
                note="The most companies found holding one item."
              />
            </StatCell>
          </StatRow>
        ) : (
          <Skeleton rows={4} />
        )}
      </section>

      <InventoryBand records={records} clusters={clusters} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <CpseBreakdown records={records} />
        <FamilyDistribution records={records} clusters={clusters} />
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ the note */

/** The sample size, stated before anything is claimed on top of it. */
function SampleNote({ sliceSize }: { sliceSize: number }) {
  return (
    <div className="border border-rule bg-surface px-5 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <Chip tone="accent">Readable slice</Chip>
        <p className="text-[13.5px] leading-relaxed text-ink">
          This table holds <Num size="sm">{formatExact(sliceSize)}</Num> records, drawn from a
          corpus of <Num size="sm">{formatExact(TOTAL_RECORDS)}</Num> held across the four
          organisations.
        </p>
      </div>
      <p className="mt-2 max-w-[76ch] text-[13px] leading-relaxed text-ink-2">
        <ByMode
          simple="Every figure in the rest of this console, including the duplicate counts and the savings, is worked out from these rows. Numbers quoted for the whole corpus are scaled up from what was measured here, and they say so where they appear."
          technical="Every figure elsewhere in the console is computed from these rows at runtime: pairs, clusters, codes and the savings model all read this slice. Corpus-wide figures are extrapolated from the duplicate rate measured here and are labelled as estimates at the point of use."
        />
      </p>
    </div>
  )
}

/* ------------------------------------------------------------------- the row */

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  return (
    <Th align="right">
      <button
        type="button"
        onClick={onClick}
        aria-label={`Sort by ${label}`}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-2 transition-colors hover:text-ink"
      >
        {label}
        {active ? (
          dir === 'desc' ? (
            <ArrowDown size={16} weight="regular" className="text-accent" />
          ) : (
            <ArrowUp size={16} weight="regular" className="text-accent" />
          )
        ) : (
          <ArrowsDownUp size={16} weight="regular" className="text-ink-3" />
        )}
      </button>
    </Th>
  )
}

function RecordRow({
  record,
  cluster,
  siblings,
  open,
  onToggle,
}: {
  record: MaterialRecord
  cluster: Cluster | undefined
  siblings: MaterialRecord[]
  open: boolean
  onToggle: () => void
}) {
  const cover = coverOf(record)

  return (
    <>
      <tr
        onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        tabIndex={0}
        aria-expanded={open}
        className={
          open
            ? 'cursor-pointer bg-accent-bg focus:outline-none'
            : 'cursor-pointer transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none'
        }
      >
        <Td>
          <span className="inline-flex items-center gap-1.5">
            {open ? (
              <CaretDown size={16} weight="regular" className="text-accent" />
            ) : (
              <CaretRight size={16} weight="regular" className="text-ink-3" />
            )}
            <span className="font-mono text-[12px] text-ink">{record.cpse}</span>
          </span>
        </Td>
        <Td>
          <span className="font-mono text-[12px] text-ink-2">{record.localCode}</span>
        </Td>
        <Td className="max-w-[26rem]">
          <span className="font-mono text-[12px] text-ink">{record.rawDescription}</span>
        </Td>
        <Td>
          <span className="whitespace-nowrap text-[12.5px] text-ink-2">
            {FAMILY_LABEL[record.family]}
          </span>
        </Td>
        <Td align="right">
          <Num size="sm">{formatExact(record.annualQty)}</Num>
          <span className="mt-0.5 block font-mono text-[11px] text-ink-3">{record.rawUom}</span>
        </Td>
        <Td align="right">
          <Num size="sm">{formatRupees(spendOf(record))}</Num>
          <span className="mt-0.5 block font-mono text-[11px] text-ink-3">
            {formatRupees(record.unitPrice)} each
          </span>
        </Td>
        <Td align="right">
          <Num size="sm">{formatExact(record.stockOnHand)}</Num>
          <span
            className={
              cover >= HEAVY_COVER
                ? 'mt-0.5 block font-mono text-[11px] text-attention'
                : 'mt-0.5 block font-mono text-[11px] text-ink-3'
            }
          >
            {cover.toFixed(1)} mo cover
          </span>
        </Td>
        <Td>
          {cluster ? (
            <>
              <span className="font-mono text-[12px] text-ink">{cluster.code}</span>
              <span className="mt-0.5 block text-[11.5px] text-ink-3">
                {siblings.length === 0
                  ? 'only this company'
                  : `${siblings.length} other record${siblings.length === 1 ? '' : 's'}`}
              </span>
            </>
          ) : (
            <span className="text-[12px] text-ink-3">not resolved</span>
          )}
        </Td>
      </tr>

      {open ? (
        <tr>
          <td colSpan={8} className="border-b border-rule bg-surface-2 p-0">
            <RecordDetail record={record} cluster={cluster} siblings={siblings} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

/* ---------------------------------------------------------------- the detail */

function RecordDetail({
  record,
  cluster,
  siblings,
}: {
  record: MaterialRecord
  cluster: Cluster | undefined
  siblings: MaterialRecord[]
}) {
  const reduce = useReducedMotion()
  /** The normalized form arrives after the row has already opened, so the height
   *  the open animation measured is stale by the time the content lands. Release
   *  the measured height once the animation is done, or the detail gets clipped. */
  const [settled, setSettled] = useState(Boolean(reduce))
  const [state, setState] = useState<{
    status: 'loading' | 'ready' | 'error'
    data?: NormalizeResponse
    meta?: RequestMeta
    message?: string
  }>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ status: 'loading' })
    normalizeDescription(record.rawDescription, record.rawUom)
      .then(result => {
        if (cancelled) return
        setState({ status: 'ready', data: result.data, meta: result.meta })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setState({
          status: 'error',
          message:
            error instanceof Error ? error.message : 'The service did not return a normalized form.',
        })
      })
    return () => {
      cancelled = true
    }
  }, [record.id, record.rawDescription, record.rawUom])

  const normalized = state.data?.normalized

  return (
    <motion.div
      initial={reduce ? false : { height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.18, ease: 'easeOut' }}
      onAnimationComplete={() => setSettled(true)}
      style={settled ? { height: 'auto' } : undefined}
      className={settled ? undefined : 'overflow-hidden'}
    >
      <div className="grid gap-6 px-5 py-5 lg:grid-cols-2">
        {/* left: what the normalizer made of this row */}
        <div className="min-w-0">
          <Label>Normalized form</Label>

          {state.status === 'loading' ? (
            <div className="mt-3">
              <Skeleton rows={4} />
            </div>
          ) : state.status === 'error' ? (
            <div className="mt-3">
              <ErrorState message={state.message ?? 'The service did not respond.'} />
            </div>
          ) : normalized ? (
            <>
              <div className="mt-3">
                <p className="text-[12px] text-ink-3">Expanded tokens</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {normalized.normalizedTokens.map(token => (
                    <Mono key={token}>{token}</Mono>
                  ))}
                </div>
              </div>

              <div className="mt-4 border-t border-rule">
                {ATTRIBUTE_SLOTS.map(slot => {
                  const value = normalized.attributes[slot]
                  return (
                    <div
                      key={slot}
                      className="flex items-baseline justify-between gap-4 border-b border-rule py-1.5"
                    >
                      <span className="text-[12px] text-ink-2">{SLOT_LABEL[slot]}</span>
                      {value ? (
                        <span className="font-mono text-[12px] text-ink">{value}</span>
                      ) : (
                        <span className="text-[12px] text-ink-3">not stated</span>
                      )}
                    </div>
                  )
                })}
              </div>

              <TechnicalOnly>
                <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-[12px] text-ink-2">Signature</span>
                  <span className="break-all font-mono text-[11.5px] text-ink">
                    {normalized.signature || 'empty'}
                  </span>
                </div>
                {normalized.expansions.length > 0 ? (
                  <div className="mt-2">
                    <p className="text-[12px] text-ink-2">
                      {normalized.expansions.length} dictionary rule
                      {normalized.expansions.length === 1 ? '' : 's'} fired
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {normalized.expansions.map(expansion => (
                        <li
                          key={`${expansion.from}-${expansion.to}`}
                          className="font-mono text-[11.5px] text-ink-3"
                        >
                          {expansion.from} to {expansion.to}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {state.meta ? (
                  <div className="mt-3">
                    <EndpointTag
                      method={state.meta.method}
                      endpoint={state.meta.endpoint}
                      ms={state.meta.ms}
                    />
                  </div>
                ) : null}
              </TechnicalOnly>
            </>
          ) : null}
        </div>

        {/* right: the code, and the other companies sitting under it */}
        <div className="min-w-0">
          <Label>Resolved to</Label>
          {cluster ? (
            <div className="mt-2">
              <Link
                to="/registry"
                className="inline-flex items-center gap-1.5 font-mono text-[13px] text-accent hover:underline"
              >
                {cluster.code}
                <ArrowSquareOut size={16} weight="regular" />
              </Link>
              <p className="mt-1 text-[12.5px] text-ink-2">{cluster.standardDescription}</p>
            </div>
          ) : (
            <p className="mt-2 text-[12.5px] text-ink-2">
              This row did not resolve to a national code.
            </p>
          )}

          <div className="mt-5">
            <Label>Same item, elsewhere</Label>
            {siblings.length === 0 ? (
              <p className="mt-2 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-2">
                <ByMode
                  simple={`Only ${nameOf(record.cpse)} stocks this item. No other company has a record that resolved to the same code, so there is nothing here to consolidate.`}
                  technical={`Singleton cluster. No record from another CPSE resolved to ${
                    cluster ? cluster.code : 'this signature'
                  }, so this row contributes no duplicate.`}
                />
              </p>
            ) : (
              <div className="mt-2 border-t border-rule">
                {siblings.map(sibling => (
                  <div key={sibling.id} className="border-b border-rule py-2">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-[12px] text-ink">{sibling.cpse}</span>
                      <span className="font-mono text-[11.5px] text-ink-3">
                        {sibling.localCode}
                      </span>
                      <span className="ml-auto">
                        <Num size="xs" className="text-ink-2">
                          {formatRupees(spendOf(sibling))}
                        </Num>
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-[12px] text-ink-2">
                      {sibling.rawDescription}
                    </p>
                  </div>
                ))}
                <p className="mt-2 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-2">
                  <ByMode
                    simple="The same item, written differently by each company, bought separately by each of them."
                    technical="These rows share a canonical signature. The descriptions diverge on house style and vendor tokens, not on specification."
                  />
                </p>
              </div>
            )}
          </div>

          <StockPosition record={record} siblings={siblings} cluster={cluster} />
        </div>
      </div>
    </motion.div>
  )
}

function nameOf(code: Cpse['code']): string {
  return CPSES.find(entry => entry.code === code)?.name ?? code
}

/* ------------------------------------------------------------ the stock view */

/**
 * What is actually on the shelves, under one code.
 *
 * This is the section that turns a data-quality exercise into a procurement one.
 * The four organisations each hold this item under a code only they can read, so
 * each one plans cover against its own consumption and none of them can see the
 * other three holdings. Adding them up is only possible once the rows share a
 * national code, which is the whole argument for having one.
 *
 * Every figure here is a sum over the rows in the group. Nothing is asserted.
 */
function StockPosition({
  record,
  siblings,
  cluster,
}: {
  record: MaterialRecord
  siblings: MaterialRecord[]
  cluster: Cluster | undefined
}) {
  const holders = [record, ...siblings]
  const totalStock = holders.reduce((sum, entry) => sum + entry.stockOnHand, 0)
  const totalValue = holders.reduce((sum, entry) => sum + stockValueOf(entry), 0)
  const totalDemand = holders.reduce((sum, entry) => sum + entry.annualQty, 0)
  const groupCover = totalDemand > 0 ? (totalStock / totalDemand) * 12 : 0

  // The organisation sitting on the deepest cover, and the one running thinnest.
  const ranked = [...holders].sort((a, b) => coverOf(b) - coverOf(a))
  const deepest = ranked[0]
  const thinnest = ranked[ranked.length - 1]
  const worthMoving =
    holders.length > 1 && coverOf(deepest) >= HEAVY_COVER && coverOf(thinnest) < HEAVY_COVER

  return (
    <div className="mt-5">
      <Label>Stock held against this code</Label>

      <div className="mt-2 border-t border-rule">
        {holders.map(entry => {
          const cover = coverOf(entry)
          const heavy = cover >= HEAVY_COVER
          return (
            <div
              key={entry.id}
              className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-rule py-1.5"
            >
              <span
                className={
                  entry.id === record.id
                    ? 'w-[46px] shrink-0 font-mono text-[12px] text-accent'
                    : 'w-[46px] shrink-0 font-mono text-[12px] text-ink'
                }
              >
                {entry.cpse}
              </span>
              <span className="text-[11.5px] text-ink-3">
                uses <Num size="xs" className="text-ink-2">{formatExact(entry.annualQty)}</Num> a year
              </span>
              <span className="ml-auto flex items-baseline gap-3">
                <Num size="sm" className="text-ink">
                  {formatExact(entry.stockOnHand)}
                </Num>
                <Num size="xs" className={heavy ? 'w-[74px] text-right text-attention' : 'w-[74px] text-right text-ink-3'}>
                  {cover.toFixed(1)} mo
                </Num>
              </span>
            </div>
          )
        })}

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-ink py-1.5">
          <span className="w-[46px] shrink-0 text-[12px] font-semibold text-ink">All</span>
          <span className="text-[11.5px] text-ink-3">
            worth <Num size="xs" className="text-ink-2">{formatRupees(totalValue)}</Num> at the
            price last paid
          </span>
          <span className="ml-auto flex items-baseline gap-3">
            <Num size="sm" className="text-ink">
              {formatExact(totalStock)}
            </Num>
            <Num size="xs" className="w-[74px] text-right text-ink-2">
              {groupCover.toFixed(1)} mo
            </Num>
          </span>
        </div>
      </div>

      <p className="mt-2 max-w-[52ch] text-[12.5px] leading-relaxed text-ink-2">
        {holders.length === 1 ? (
          <ByMode
            simple={`${nameOf(record.cpse)} holds ${formatExact(record.stockOnHand)} of these, about ${coverOf(record).toFixed(1)} months of its own use. No other company holds this item, so this number is already the national one.`}
            technical={`Singleton cluster. Stock position under ${cluster ? cluster.code : 'this signature'} is a single holding, so the national and local figures coincide.`}
          />
        ) : worthMoving ? (
          <ByMode
            simple={`${deepest.cpse} is holding ${coverOf(deepest).toFixed(1)} months of cover while ${thinnest.cpse} is down to ${coverOf(thinnest).toFixed(1)}. Under four separate codes neither of them can see the other. Under ${cluster ? cluster.code : 'one code'} the transfer is an obvious first call before either raises an order.`}
            technical={`Cover spread across the cluster runs ${coverOf(thinnest).toFixed(1)} to ${coverOf(deepest).toFixed(1)} months against a group position of ${groupCover.toFixed(1)}. Redeployment from ${deepest.cpse} to ${thinnest.cpse} is only visible once the rows share a code.`}
          />
        ) : (
          <ByMode
            simple={`${formatExact(totalStock)} of these sit across ${holders.length} companies, worth ${formatRupees(totalValue)}. While the item carries ${holders.length} different codes, none of them can see the other holdings, so each one orders against its own cover.`}
            technical={`Aggregate position ${formatExact(totalStock)} units, ${formatRupees(totalValue)} at last paid price, ${groupCover.toFixed(1)} months against combined offtake. Not computable before the rows resolved to ${cluster ? cluster.code : 'a shared code'}.`}
          />
        )}
      </p>
    </div>
  )
}

/* -------------------------------------------------------------- inventory */

/**
 * The inventory position, which is the reason the problem statement asks for this
 * at all rather than treating it as a filing exercise.
 *
 * Stock held under a code that only one organisation uses is invisible to the
 * other three. Once the same item resolves to one national code, the holdings
 * add up and the aggregate can be planned against. This band separates the two.
 */
function InventoryBand({ records, clusters }: { records: MaterialRecord[]; clusters: Cluster[] }) {
  const figures = useMemo(() => {
    const shared = new Set<string>()
    for (const cluster of clusters) {
      if (cluster.cpses.length > 1) for (const member of cluster.members) shared.add(member.id)
    }

    let totalValue = 0
    let sharedValue = 0
    let heavyValue = 0
    let heavyRows = 0

    for (const record of records) {
      const value = stockValueOf(record)
      totalValue += value
      if (shared.has(record.id)) sharedValue += value
      if (coverOf(record) >= HEAVY_COVER) {
        heavyValue += value
        heavyRows += 1
      }
    }

    return { totalValue, sharedValue, heavyValue, heavyRows, sharedRows: shared.size }
  }, [records, clusters])

  const sharedShare = figures.totalValue > 0 ? (figures.sharedValue / figures.totalValue) * 100 : 0

  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">
          Stock under one code
        </h2>
        <p className="text-[12.5px] text-ink-2">
          Valued at the price each organisation last paid, summed over the slice above.
        </p>
      </div>

      <StatRow className="lg:!grid-cols-3">
        <StatCell>
          <Stat
            value={formatRupees(figures.totalValue)}
            label="Stock value in the slice"
            note={`${formatExact(records.length)} rows, each valued at its own unit price.`}
          />
        </StatCell>
        <StatCell>
          <Stat
            value={formatRupees(figures.sharedValue)}
            label="Held under a shared code"
            emphasis
            note={
              <ByMode
                simple={`${sharedShare.toFixed(0)}% of the stock above sits under a code more than one company now shares. Before harmonization each of them could see only its own share of it.`}
                technical={`${sharedShare.toFixed(1)}% of stock value, across ${formatExact(figures.sharedRows)} records in cross-CPSE clusters. Aggregation is only possible after the codes resolved.`}
              />
            }
          />
        </StatCell>
        <StatCell>
          <Stat
            value={formatRupees(figures.heavyValue)}
            label={`Sitting on over ${HEAVY_COVER} months of cover`}
            note={
              <ByMode
                simple={`${formatExact(figures.heavyRows)} rows hold more than a year of their own use. Some of that is deliberate. The rest is what nobody could see.`}
                technical={`${formatExact(figures.heavyRows)} rows exceed ${HEAVY_COVER} months of cover against their own annual offtake.`}
              />
            }
          />
        </StatCell>
      </StatRow>
    </section>
  )
}

/* ----------------------------------------------------------- the breakdowns */

function CpseBreakdown({ records }: { records: MaterialRecord[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const record of records) map[record.cpse] = (map[record.cpse] ?? 0) + 1
    return map
  }, [records])

  const data = useMemo(
    () => CPSES.map(entry => ({ name: entry.code, value: counts[entry.code] ?? 0 })),
    [counts],
  )

  return (
    <Panel flush>
      <PanelHead
        title="By company"
        meta={`${CPSES.length} organisations`}
        icon={<Buildings size={18} weight="regular" />}
      />
      <div className="flex flex-wrap items-center gap-6 px-5 py-5">
        <DonutChart data={data} />
        <div className="min-w-[160px] flex-1">
          <ChartLegend data={data} />
        </div>
      </div>
    </Panel>
  )
}

function FamilyDistribution({
  records,
  clusters,
}: {
  records: MaterialRecord[]
  clusters: Cluster[]
}) {
  const distribution = useMemo(() => {
    const recordCounts = new Map<MaterialFamily, number>()
    for (const record of records) {
      recordCounts.set(record.family, (recordCounts.get(record.family) ?? 0) + 1)
    }
    const codeCounts = new Map<MaterialFamily, number>()
    for (const cluster of clusters) {
      codeCounts.set(cluster.family, (codeCounts.get(cluster.family) ?? 0) + 1)
    }
    return [...recordCounts.entries()]
      .map(([family, count]) => ({ family, count, codes: codeCounts.get(family) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [records, clusters])

  const chartData = useMemo(
    () => distribution.map(entry => ({ name: FAMILY_LABEL[entry.family], value: entry.count })),
    [distribution],
  )

  return (
    <Panel flush>
      <PanelHead
        title="By family"
        meta={`${distribution.length} families`}
        icon={<Package size={18} weight="regular" />}
      />
      {distribution.length === 0 ? (
        <div className="px-5 py-6">
          <EmptyState title="No records to group yet." />
        </div>
      ) : (
        <div className="px-5 py-5">
          <CategoryBarChart data={chartData} />
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-rule pt-3">
            {distribution.map(entry => (
              <li key={entry.family} className="flex items-baseline gap-1.5 text-[11.5px] text-ink-3">
                <span className="text-ink-2">{FAMILY_LABEL[entry.family]}</span>
                <Num size="2xs" className="text-ink-2">
                  {formatExact(entry.codes)}
                </Num>
                <span>{entry.codes === 1 ? 'code' : 'codes'}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  )
}
