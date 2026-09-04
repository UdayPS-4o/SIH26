/**
 * The code book.
 *
 * This page is the deliverable. Everything else in the console argues that
 * harmonization is possible; this is the artefact it produces. Every national code,
 * what it means, which local codes it replaced, and where the code came from.
 *
 * Two things it deliberately does not hide. First, most codes cover exactly one
 * organisation's entry: a real material master is a long tail with a small and
 * expensive head, and a registry that only showed the four-way matches would be
 * lying by selection. Second, the derivation. The code is a function of the item's
 * canonical signature, so it is reproducible rather than allocated, and the working
 * is on the page instead of in a claim.
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Books,
  Buildings,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  Check,
  Coins,
  Copy,
  Hash,
  SealCheck,
  X,
} from '@phosphor-icons/react'
import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Field,
  IconTile,
  Label,
  Mono,
  Num,
  Panel,
  PanelHead,
  PageHead,
  Segmented,
  Select,
  Skeleton,
  Table,
  Td,
  TextInput,
  Th,
} from '@/components/ui'
import { ChartLegend, DonutChart } from '@/components/ui/charts'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useIsTechnical } from '@/store/viewmode'
import { useService } from '@/store/service'
import { codeDerivation } from '@/engine/cluster'
import { formatCount, formatExact, formatRupees } from '@/engine/savings'
import { FAMILY_LABEL, type Cluster, type MaterialFamily } from '@/engine/types'

type Scope = 'all' | 'shared' | 'single'
type SortKey = 'spend' | 'code' | 'description' | 'members'

const PAGE_SIZE = 40
const COLUMNS = 6

export default function RegistryPage() {
  const c = useCopy()
  const technical = useIsTechnical()

  const clusters = useService(s => s.clusters)
  const health = useService(s => s.health)
  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const registryCall = useService(s => s.lastCall.registry)

  const [query, setQuery] = useState('')
  const [family, setFamily] = useState<'all' | MaterialFamily>('all')
  const [scope, setScope] = useState<Scope>('all')
  const [sort, setSort] = useState<SortKey>('spend')
  const [page, setPage] = useState(0)
  const [openCode, setOpenCode] = useState<string | null>(null)

  /* Families that actually occur, so the control never offers an empty result. */
  const families = useMemo(() => {
    const present = new Set<MaterialFamily>(clusters.map(cluster => cluster.family))
    return [...present].sort((a, b) => FAMILY_LABEL[a].localeCompare(FAMILY_LABEL[b]))
  }, [clusters])

  /* Search and family, before scope, so the scope control can count its own options. */
  const base = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return clusters.filter(cluster => {
      if (family !== 'all' && cluster.family !== family) return false
      if (!needle) return true
      if (cluster.code.toLowerCase().includes(needle)) return true
      if (cluster.standardDescription.toLowerCase().includes(needle)) return true
      if (FAMILY_LABEL[cluster.family].toLowerCase().includes(needle)) return true
      if (cluster.unspsc.includes(needle)) return true
      return cluster.members.some(
        member =>
          member.localCode.toLowerCase().includes(needle) ||
          member.rawDescription.toLowerCase().includes(needle),
      )
    })
  }, [clusters, family, query])

  const scopeCounts = useMemo(
    () => ({
      all: base.length,
      shared: base.filter(cluster => cluster.cpses.length > 1).length,
      single: base.filter(cluster => cluster.cpses.length === 1).length,
    }),
    [base],
  )

  const rows = useMemo(() => {
    const filtered =
      scope === 'all'
        ? base
        : base.filter(cluster =>
            scope === 'shared' ? cluster.cpses.length > 1 : cluster.cpses.length === 1,
          )

    const sorted = [...filtered]
    if (sort === 'spend') sorted.sort((a, b) => b.annualSpend - a.annualSpend)
    if (sort === 'code') sorted.sort((a, b) => a.code.localeCompare(b.code))
    if (sort === 'description')
      sorted.sort((a, b) => a.standardDescription.localeCompare(b.standardDescription))
    if (sort === 'members')
      sorted.sort((a, b) => b.members.length - a.members.length || b.annualSpend - a.annualSpend)
    return sorted
  }, [base, scope, sort])

  /* A filter change invalidates the page cursor, not the selection. */
  useEffect(() => {
    setPage(0)
  }, [query, family, scope, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const start = current * PAGE_SIZE
  const visible = rows.slice(start, start + PAGE_SIZE)

  if (error) {
    return (
      <>
        <PageHead title={c('registryTitle')} lead={c('registryLead')} />
        <ErrorState message={error} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <PageHead title={c('registryTitle')} lead={c('registryLead')} />
        <Panel>
          <Skeleton rows={9} />
        </Panel>
      </>
    )
  }

  if (clusters.length === 0) {
    return (
      <>
        <PageHead title={c('registryTitle')} lead={c('registryLead')} />
        <NothingLoaded what="This is the national code book: one entry per distinct item, with every organisation's own code for it listed underneath." />
      </>
    )
  }

  return (
    <>
      <PageHead title={c('registryTitle')} lead={c('registryLead')} />

      <p className="mb-5 max-w-[76ch] text-[13.5px] leading-relaxed text-ink-2">
        <ByMode
          simple={
            <>
              <Num size="sm">{formatCount(clusters.length)}</Num> agreed entries cover{' '}
              <Num size="sm">{formatCount(health?.records ?? 0)}</Num> company records.{' '}
              <Num size="sm">{formatCount(scopeCounts.shared)}</Num> of them bring together entries
              from more than one company. The rest are stocked by a single company, and that is
              normal: most items in a warehouse are bought by one place only.
            </>
          }
          technical={
            <>
              <Num size="sm">{formatCount(clusters.length)}</Num> distinct codes over{' '}
              <Num size="sm">{formatCount(health?.records ?? 0)}</Num> inspectable records.{' '}
              <Num size="sm">{formatCount(scopeCounts.shared)}</Num> clusters span more than one
              CPSE; largest cluster is{' '}
              <Num size="sm">{formatExact(health?.largestCluster ?? 0)}</Num> members. The
              distribution is the expected long tail, and it is not filtered out of this view.
            </>
          }
        />
      </p>

      <Panel flush>
        <PanelHead
          title={technical ? 'Golden records' : 'Every agreed entry'}
          icon={<Books size={18} weight="regular" />}
          meta={`${formatExact(clusters.length)} codes`}
          action={
            <TechnicalOnly>
              {registryCall ? (
                <EndpointTag
                  method={registryCall.method}
                  endpoint={registryCall.endpoint}
                  ms={registryCall.ms}
                  scanned={registryCall.scanned}
                />
              ) : null}
            </TechnicalOnly>
          }
        />

        <div className="border-b border-rule px-5 py-4">
          <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <Field
              label={technical ? 'Search code, description or source record' : 'Search'}
              helper={
                technical
                  ? 'Matches the national code, the standard description and every member local code and raw description.'
                  : 'Try a code, a word like "bearing", or what one company calls it.'
              }
            >
              <TextInput
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={technical ? 'CNMC-BE-  /  6205  /  BRG DGBB' : 'bearing'}
                aria-label="Search the code book"
              />
            </Field>

            <Field label={technical ? 'Family' : 'Kind of item'}>
              <Select
                value={family}
                onChange={event => setFamily(event.target.value as 'all' | MaterialFamily)}
                aria-label="Filter by family"
              >
                <option value="all">All families</option>
                {families.map(key => (
                  <option key={key} value={key}>
                    {FAMILY_LABEL[key]}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Sort by">
              <Select
                value={sort}
                onChange={event => setSort(event.target.value as SortKey)}
                aria-label="Sort the code book"
              >
                <option value="spend">Annual spend, highest first</option>
                <option value="members">Most companies first</option>
                <option value="code">National code, A to Z</option>
                <option value="description">Description, A to Z</option>
              </Select>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Segmented
              size="sm"
              value={scope}
              onChange={setScope}
              options={[
                { value: 'all', label: 'All', count: scopeCounts.all },
                {
                  value: 'shared',
                  label: technical ? 'Cross-CPSE' : 'Shared across companies',
                  count: scopeCounts.shared,
                },
                {
                  value: 'single',
                  label: technical ? 'Single CPSE' : 'Held by one company',
                  count: scopeCounts.single,
                },
              ]}
            />
            <p className="text-[12.5px] text-ink-2">
              Showing{' '}
              <Num size="sm">
                {rows.length === 0 ? 0 : formatExact(start + 1)}
                {rows.length === 0 ? '' : `-${formatExact(Math.min(start + PAGE_SIZE, rows.length))}`}
              </Num>{' '}
              of <Num size="sm">{formatExact(rows.length)}</Num>{' '}
              {rows.length === clusters.length ? (
                'codes'
              ) : (
                <>
                  matching codes, out of <Num size="sm">{formatExact(clusters.length)}</Num> in the
                  book
                </>
              )}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              title={c('emptySearch')}
              detail="Nothing in the code book matches those filters. Clear them to see the whole book again."
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    setQuery('')
                    setFamily('all')
                    setScope('all')
                  }}
                >
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
                  <Th>{c('nationalCode')}</Th>
                  <Th>{technical ? 'Standard description' : 'What it is'}</Th>
                  <Th>{technical ? 'Family' : 'Kind'}</Th>
                  <Th>{technical ? 'UOM' : 'Unit'}</Th>
                  <Th align="right">{technical ? 'Members' : 'Entries'}</Th>
                  <Th align="right">Annual spend</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map(cluster => {
                  const open = openCode === cluster.code
                  return (
                    <RegistryRow
                      key={cluster.code}
                      cluster={cluster}
                      open={open}
                      onToggle={() => setOpenCode(open ? null : cluster.code)}
                    />
                  )
                })}
              </tbody>
            </Table>

            {pageCount > 1 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-3">
                <span className="text-[12.5px] text-ink-2">
                  Page <Num size="sm">{formatExact(current + 1)}</Num> of{' '}
                  <Num size="sm">{formatExact(pageCount)}</Num>
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={current === 0}
                    onClick={() => setPage(current - 1)}
                    icon={<CaretLeft size={16} weight="regular" />}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    disabled={current >= pageCount - 1}
                    onClick={() => setPage(current + 1)}
                    icon={<CaretRight size={16} weight="regular" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </Panel>
    </>
  )
}

/* ------------------------------------------------------------------------ row */

function RegistryRow({
  cluster,
  open,
  onToggle,
}: {
  cluster: Cluster
  open: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onToggle()
          }
        }}
        className={
          open
            ? 'cursor-pointer bg-accent-bg outline-none'
            : 'cursor-pointer outline-none hover:bg-surface-2 focus:bg-surface-2'
        }
      >
        <Td className="whitespace-nowrap">
          <span className="inline-flex items-center gap-2">
            {open ? (
              <CaretUp size={16} weight="regular" className="text-accent" />
            ) : (
              <CaretDown size={16} weight="regular" className="text-ink-3" />
            )}
            <Num size="sm" className={open ? 'text-accent' : 'text-ink'}>
              {cluster.code}
            </Num>
          </span>
        </Td>
        <Td className="min-w-[22ch] text-ink">{cluster.standardDescription}</Td>
        <Td className="whitespace-nowrap text-ink-2">{FAMILY_LABEL[cluster.family]}</Td>
        <Td className="whitespace-nowrap">
          <Num size="sm" className="text-ink-2">
            {cluster.uom}
          </Num>
        </Td>
        <Td align="right" className="whitespace-nowrap">
          <Num size="sm" className={cluster.cpses.length > 1 ? 'text-ink' : 'text-ink-3'}>
            {formatExact(cluster.members.length)}
          </Num>
        </Td>
        <Td align="right" className="whitespace-nowrap">
          <Num size="sm">{formatRupees(cluster.annualSpend)}</Num>
        </Td>
      </tr>

      {open ? (
        <tr>
          <td colSpan={COLUMNS} className="border-b border-rule-strong bg-surface p-0">
            <GoldenRecord cluster={cluster} onClose={onToggle} />
          </td>
        </tr>
      ) : null}
    </>
  )
}

/* --------------------------------------------------------------- golden record */

function GoldenRecord({ cluster, onClose }: { cluster: Cluster; onClose: () => void }) {
  const reduce = useReducedMotion()
  const c = useCopy()
  const technical = useIsTechnical()
  const [showDerivation, setShowDerivation] = useState(false)
  const [copied, setCopied] = useState(false)

  const single = cluster.members.length === 1
  const soleOwner = cluster.members[0]

  /* Spend split by contributing CPSE, aggregated across members from the same
   * company. Only worth a chart once there is more than one company to split. */
  const cpseSpend = useMemo(() => {
    const totals = new Map<string, number>()
    for (const member of cluster.members) {
      totals.set(member.cpse, (totals.get(member.cpse) ?? 0) + member.annualQty * member.unitPrice)
    }
    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [cluster.members])

  const copyCode = () => {
    void navigator.clipboard?.writeText(cluster.code).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
      },
      () => setCopied(false),
    )
  }

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="border-l-2 border-accent px-5 py-5"
    >
      {/* ---------------------------------------------------------- identity */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <IconTile icon={<SealCheck size={20} weight="fill" />} tone="positive" size="md" />
          <div className="min-w-0">
            <Label>{c('goldenRecord')}</Label>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Mono className="px-2 py-1 text-[19px] tracking-tight">{cluster.code}</Mono>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyCode}
                icon={
                  copied ? (
                    <Check size={16} weight="regular" />
                  ) : (
                    <Copy size={16} weight="regular" />
                  )
                }
              >
                {copied ? 'Copied' : 'Copy code'}
              </Button>
            </div>
            <p className="mt-3 max-w-[70ch] font-display text-[16px] font-semibold leading-snug text-ink">
              {cluster.standardDescription}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <Chip tone={cluster.cpses.length > 1 ? 'accent' : 'neutral'}>
            {cluster.cpses.length > 1
              ? `${cluster.cpses.length} ${technical ? 'CPSEs' : 'companies'}`
              : technical
                ? '1 CPSE'
                : '1 company'}
          </Chip>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            icon={<X size={16} weight="regular" />}
            aria-label="Close this entry"
          >
            Close
          </Button>
        </div>
      </div>

      {/* -------------------------------------------------------------- meta */}
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-rule pt-4 sm:grid-cols-3 lg:grid-cols-5">
        <MetaItem label={technical ? 'Canonical UOM' : 'Unit it is counted in'}>
          <Num size="sm">{cluster.uom}</Num>
        </MetaItem>
        <MetaItem label="UNSPSC class">
          <Num size="sm">{cluster.unspsc}</Num>
        </MetaItem>
        <MetaItem label={technical ? 'Standard cited' : 'Official standard'}>
          {cluster.standard === 'not stated' ? (
            <span className="text-[13px] text-ink-3">not stated</span>
          ) : (
            <Num size="sm">{cluster.standard}</Num>
          )}
        </MetaItem>
        <MetaItem label={technical ? 'Family' : 'Kind of item'}>
          <span className="text-[13px] text-ink">{FAMILY_LABEL[cluster.family]}</span>
        </MetaItem>
        <MetaItem label={technical ? 'Contributing records' : 'Entries it replaces'}>
          <Num size="sm">{formatExact(cluster.members.length)}</Num>
        </MetaItem>
      </dl>

      {cluster.standard === 'not stated' ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
          <ByMode
            simple="None of the companies wrote an official standard number against this item. That is common, and the entry does not invent one."
            technical="No IS / ASTM / ISO reference appeared in any member description, so the field stays empty rather than being inferred."
          />
        </p>
      ) : null}

      {/* ----------------------------------------------------------- members */}
      <section className="mt-6 border-t border-rule pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <IconTile icon={<Buildings size={14} weight="regular" />} tone="neutral" size="sm" />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="font-display text-[13px] font-semibold tracking-tight text-ink">
              {technical ? 'Contributing records' : 'What each company calls it'}
            </h3>
            <span className="font-mono text-[11px] text-ink-3">
              {formatExact(cluster.members.length)}
            </span>
          </div>
        </div>

        {single && soleOwner ? (
          <div className="mt-3">
            <p className="max-w-[74ch] text-[13.5px] leading-relaxed text-ink-2">
              <ByMode
                simple={
                  <>
                    Only <span className="text-ink">{soleOwner.cpse}</span> stocks this item. Nothing
                    in the other three lists matched it, so this code stands for a single entry
                    rather than a merge. Most of the code book looks like this.
                  </>
                }
                technical={
                  <>
                    Single-member cluster. No record from another CPSE cleared the accept threshold
                    against <span className="text-ink">{soleOwner.cpse}</span>, so the code covers
                    one source record. There is nothing to reconcile here and no merge was made.
                  </>
                }
              />
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
              <MetaItem label={technical ? 'CPSE' : 'Company'}>
                <Num size="sm">{soleOwner.cpse}</Num>
              </MetaItem>
              <MetaItem label={technical ? 'Local code' : 'Their own code'}>
                <Num size="sm">{soleOwner.localCode}</Num>
              </MetaItem>
              <MetaItem label={technical ? 'Raw UOM' : 'Unit as written'}>
                <Num size="sm">{soleOwner.rawUom}</Num>
              </MetaItem>
              <MetaItem label="Annual quantity">
                <Num size="sm">{formatExact(soleOwner.annualQty)}</Num>
              </MetaItem>
              <MetaItem label="Unit price">
                <Num size="sm">{formatRupees(soleOwner.unitPrice)}</Num>
              </MetaItem>
            </dl>
            <div className="mt-4">
              <Label>{technical ? 'Description as stored' : 'How they wrote it'}</Label>
              <p className="mt-1.5 font-mono text-[12.5px] leading-relaxed text-ink">
                {soleOwner.rawDescription}
              </p>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-2 max-w-[76ch] text-[13px] leading-relaxed text-ink-2">
              <ByMode
                simple="Each line below is one company's own entry, copied exactly as it sits in their system. Different codes, different spellings, different units, one item."
                technical="One row per member record, values verbatim from the source master. Local code, description and UOM all diverge; the canonical row above is what they resolve to."
              />
            </p>
            <div className="mt-3 border border-rule">
              <Table>
                <thead>
                  <tr>
                    <Th>{technical ? 'CPSE' : 'Company'}</Th>
                    <Th>{technical ? 'Local code' : 'Their code'}</Th>
                    <Th>{technical ? 'Raw description' : 'How they wrote it'}</Th>
                    <Th>{technical ? 'Raw UOM' : 'Their unit'}</Th>
                    <Th align="right">Annual qty</Th>
                    <Th align="right">Unit price</Th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.members.map(member => (
                    <tr key={member.id}>
                      <Td className="whitespace-nowrap">
                        <Num size="sm">{member.cpse}</Num>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Num size="sm" className="text-ink-2">
                          {member.localCode}
                        </Num>
                      </Td>
                      <Td className="min-w-[26ch] font-mono text-[12.5px] text-ink">
                        {member.rawDescription}
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Num size="sm" className="text-ink-2">
                          {member.rawUom}
                        </Num>
                      </Td>
                      <Td align="right" className="whitespace-nowrap">
                        <Num size="sm">{formatExact(member.annualQty)}</Num>
                      </Td>
                      <Td align="right" className="whitespace-nowrap">
                        <Num size="sm">{formatRupees(member.unitPrice)}</Num>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------------------- spend */}
      <section className="mt-6 border-t border-rule pt-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <div className="flex items-center gap-2">
              <IconTile icon={<Coins size={14} weight="regular" />} tone="accent" size="sm" />
              <Label>
                {technical ? 'Annual spend across members' : 'Spent on this every year, in total'}
              </Label>
            </div>
            <div className="mt-1.5">
              <Num size="lg">{formatRupees(cluster.annualSpend)}</Num>
            </div>
          </div>
          <p className="max-w-[46ch] text-[12.5px] leading-relaxed text-ink-2">
            <ByMode
              simple={
                single
                  ? 'One company buying this item for a year.'
                  : 'What all these companies spend on the same item in a year, added together.'
              }
              technical="Sum over members of annual quantity multiplied by unit price. Prices are as recorded in each source master and are not normalised."
            />
          </p>
        </div>

        {!single && cluster.cpses.length > 1 ? (
          <div className="mt-4 flex flex-wrap items-center gap-6 border-t border-rule pt-4">
            <DonutChart data={cpseSpend} size={116} thickness={18} />
            <div className="min-w-[160px] flex-1">
              <Label>{technical ? 'Spend by CPSE' : 'Spend by company'}</Label>
              <div className="mt-2">
                <ChartLegend data={cpseSpend} />
              </div>
            </div>
          </div>
        ) : null}

        <TechnicalOnly>
          <div className="mt-3 border border-rule bg-surface-2 px-4 py-3">
            <Label>Arithmetic</Label>
            <ul className="mt-2 space-y-1">
              {cluster.members.map(member => (
                <li key={member.id} className="font-mono text-[11.5px] tabular-nums text-ink-2">
                  {member.cpse} {formatExact(member.annualQty)} x Rs{' '}
                  {formatExact(member.unitPrice)} = Rs{' '}
                  {formatExact(member.annualQty * member.unitPrice)}
                </li>
              ))}
            </ul>
            <p className="mt-2 border-t border-rule pt-2 font-mono text-[11.5px] tabular-nums text-ink">
              total = Rs {formatExact(cluster.annualSpend)}
            </p>
          </div>
        </TechnicalOnly>
      </section>

      {/* -------------------------------------------------------- derivation */}
      <section className="mt-6 border-t border-rule pt-4">
        <div className="mb-3 flex items-center gap-3">
          <IconTile icon={<Hash size={14} weight="regular" />} tone="neutral" size="sm" />
          <h3 className="font-display text-[13px] font-semibold tracking-tight text-ink">
            {technical ? 'Derivation' : 'How this code was worked out'}
          </h3>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setShowDerivation(value => !value)}
          aria-expanded={showDerivation}
          icon={
            showDerivation ? (
              <CaretUp size={16} weight="regular" />
            ) : (
              <CaretDown size={16} weight="regular" />
            )
          }
        >
          {c('showWorking')}
        </Button>

        {showDerivation ? (
          <div className="mt-3">
            <Mono className="block break-all px-3 py-2.5 text-[12px] leading-relaxed">
              {codeDerivation(cluster.family, cluster.signature)}
            </Mono>
            <p className="mt-3 max-w-[78ch] text-[13px] leading-relaxed text-ink-2">
              <ByMode
                simple="The code is worked out from the item's own cleaned-up description, not from where the row happened to sit in the file. Put the same item in again next year, on a different computer, and the same code comes back."
                technical="The code is a pure function of the canonical signature: the family prefix followed by an FNV-1a hash of the signature string. It is not allocated by row order and it is not read from a lookup table, so the same signature yields the same code on any machine and across reruns."
              />
            </p>
            <TechnicalOnly>
              <p className="mt-2 font-mono text-[11px] text-ink-3">
                the service exposes this at GET /registry/{cluster.code}/derivation
              </p>
            </TechnicalOnly>
          </div>
        ) : null}
      </section>
    </motion.div>
  )
}

function MetaItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt>
        <Label>{label}</Label>
      </dt>
      <dd className="mt-1.5">{children}</dd>
    </div>
  )
}
