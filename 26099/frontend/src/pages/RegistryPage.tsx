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
  Download,
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
import { normalize } from '@/engine/normalize'
import { formatCount, formatExact, formatRupees } from '@/engine/savings'
import {
  ATTRIBUTE_SLOTS,
  FAMILY_LABEL,
  type Cluster,
  type MaterialFamily,
  type MaterialRecord,
} from '@/engine/types'

type Scope = 'all' | 'shared' | 'single'
type SortKey = 'spend' | 'code' | 'description' | 'members'
type MigrationAction = 'MAP' | 'MERGE' | 'HOLD'

const PAGE_SIZE = 40
const COLUMNS = 6

const SLOT_LABELS: Record<string, string> = {
  noun: 'Noun',
  variant: 'Variant',
  material: 'Material',
  grade: 'Grade',
  dimension: 'Dimension',
  rating: 'Rating',
  standard: 'Standard',
}

/**
 * Deduplicate clusters by code, merging members where a code appears more than once.
 * The representative with the richest signature wins the merged cluster.
 */
function deduplicateClusters(clusters: Cluster[]): Cluster[] {
  const byCode = new Map<string, Cluster[]>()
  for (const cluster of clusters) {
    const group = byCode.get(cluster.code)
    if (group) group.push(cluster)
    else byCode.set(cluster.code, [cluster])
  }

  const result: Cluster[] = []
  for (const [, group] of byCode) {
    if (group.length === 1) {
      result.push(group[0])
    } else {
      const mergedMembers = group.flatMap(c => c.members)
      const mergedCpses = [...new Set(mergedMembers.map(m => m.cpse))]
      const totalSpend = mergedMembers.reduce((s, m) => s + m.annualQty * m.unitPrice, 0)

      // Pick representative with richest signature
      const best = group
        .slice()
        .sort((a, b) => b.signature.length - a.signature.length)[0]

      result.push({
        ...best,
        members: mergedMembers,
        cpses: mergedCpses,
        annualSpend: totalSpend,
      })
    }
  }
  return result.sort((a, b) => b.annualSpend - a.annualSpend)
}

/**
 * Build the slot-by-slot attribute description for a raw ERP description.
 */
function describeBuild(rawDescription: string, rawUom: string): {
  slots: { label: string; value: string }[]
  tokens: string[]
} {
  const norm = normalize(rawDescription, rawUom)
  const slots = ATTRIBUTE_SLOTS.map(slot => ({
    label: SLOT_LABELS[slot] ?? slot,
    value: norm.attributes[slot] ?? '',
  }))
  return { slots, tokens: norm.normalizedTokens }
}

/**
 * Generate a migration CSV from the deduplicated clusters.
 *
 * Columns: cpse, local_code, local_description, local_uom,
 *          national_code, standard_description, canonical_uom,
 *          family, unspsc, action
 *
 * action values:
 *   MAP   - the record maps 1-to-1 onto a national code (only member in its cluster)
 *   MERGE - the record shares a code with other records and needs consolidation
 *   HOLD  - reserved for records under human review
 */
function buildMigrationCsv(
  clusters: Cluster[],
  records: MaterialRecord[],
): string {
  const memberCluster = new Map<string, Cluster>()
  for (const cluster of clusters) {
    for (const member of cluster.members) {
      memberCluster.set(member.id, cluster)
    }
  }

  const sorted = [...records].sort((a, b) => {
    if (a.cpse !== b.cpse) return a.cpse.localeCompare(b.cpse)
    return a.localCode.localeCompare(b.localCode)
  })

  const lines: string[] = []
  lines.push(
    'cpse,local_code,local_description,local_uom,national_code,standard_description,canonical_uom,family,unspsc,action',
  )

  for (const record of sorted) {
    const cluster = memberCluster.get(record.id)
    if (!cluster) continue

    const action: MigrationAction =
      cluster.members.length === 1 ? 'MAP' : 'MERGE'

    const esc = (s: string) =>
      s.includes(',') || s.includes('"')
        ? `"${s.replace(/"/g, '""')}"`
        : s

    lines.push([
      record.cpse,
      esc(record.localCode),
      esc(record.rawDescription),
      record.rawUom,
      cluster.code,
      esc(cluster.standardDescription),
      cluster.uom,
      cluster.family,
      cluster.unspsc,
      action,
    ].join(','))
  }

  return lines.join('\n')
}

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

  /* Deduplicated clusters: one row per distinct national code. */
  const distinctClusters = useMemo(() => deduplicateClusters(clusters), [clusters])

  /* How many extra rows existed before dedup (codes appearing in multiple groups). */
  const duplicateCodeCount = useMemo(() => {
    const seen = new Set<string>()
    let dupeRows = 0
    for (const cluster of clusters) {
      if (seen.has(cluster.code)) dupeRows += 1
      else seen.add(cluster.code)
    }
    return dupeRows
  }, [clusters])

  /* Families that actually occur among distinct codes. */
  const families = useMemo(() => {
    const present = new Set<MaterialFamily>(distinctClusters.map(cluster => cluster.family))
    return [...present].sort((a, b) => FAMILY_LABEL[a].localeCompare(FAMILY_LABEL[b]))
  }, [distinctClusters])

  /* Search and family, before scope, so the scope control can count its own options. */
  const base = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return distinctClusters.filter(cluster => {
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
  }, [distinctClusters, family, query])

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

  const handleDownload = useMemo(() => {
    return () => {
      const allMembers = distinctClusters.flatMap(c => c.members)
      const csv = buildMigrationCsv(distinctClusters, allMembers)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `migration-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }, [distinctClusters])

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
            <span>
              <Num size="sm">{formatCount(distinctClusters.length)}</Num> agreed entries cover{' '}
              <Num size="sm">{formatCount(health?.records ?? 0)}</Num> company records.{' '}
              {duplicateCodeCount > 0
                ? <>
                    <Num size="sm">{formatCount(duplicateCodeCount)}</Num> codes appeared in more
                    than one group and have been merged into one row.
                  </>
                : 'Every code is unique.'}{' '}
              <Num size="sm">{formatCount(scopeCounts.shared)}</Num> of them bring together entries
              from more than one company. The rest are stocked by a single company, and that is
              normal: most items in a warehouse are bought by one place only.
            </span>
          }
          technical={
            <span>
              <Num size="sm">{formatCount(distinctClusters.length)}</Num> distinct codes over{' '}
              <Num size="sm">{formatCount(health?.records ?? 0)}</Num> inspectable records.{' '}
              {duplicateCodeCount > 0
                ? <>
                    <Num size="sm">{formatCount(duplicateCodeCount)}</Num> duplicate codes were
                    deduplicated.
                  </>
                : null}{' '}
              <Num size="sm">{formatCount(scopeCounts.shared)}</Num> clusters span more than one
              CPSE; largest cluster is{' '}
              <Num size="sm">{formatExact(health?.largestCluster ?? 0)}</Num> members. The
              distribution is the expected long tail, and it is not filtered out of this view.
            </span>
          }
        />
      </p>

      <Panel flush>
        <PanelHead
          title={technical ? 'Golden records' : 'Every agreed entry'}
          icon={<Books size={18} weight="regular" />}
          meta={`${formatExact(distinctClusters.length)} codes`}
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleDownload}
                icon={<Download size={14} weight="regular" />}
              >
                {technical ? 'Download migration file' : 'Download the migration file'}
              </Button>
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
            </div>
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
              {rows.length === distinctClusters.length ? (
                'codes'
              ) : (
                <>
                  matching codes, out of <Num size="sm">{formatExact(distinctClusters.length)}</Num>{' '}
                  in the book
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
  const agreementLine = useMemo(() => {
    if (cluster.members.length <= 1) return null
    if (cluster.cpses.length > 1) {
      return `${formatExact(cluster.cpses.length)} companies agreed · ${formatExact(cluster.members.length)} records merged`
    }
    return `${formatExact(cluster.members.length)} records under one code`
  }, [cluster])

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
          <div className="flex flex-col items-end gap-0.5">
            <Num size="sm" className={cluster.cpses.length > 1 ? 'text-ink' : 'text-ink-3'}>
              {formatExact(cluster.members.length)}
            </Num>
            {agreementLine ? (
              <span className="text-[11px] text-ink-3">{agreementLine}</span>
            ) : null}
          </div>
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

  /* Build the slot-by-slot description from the longest raw description. */
  const buildDescription = useMemo(() => {
    const representative = cluster.members
      .slice()
      .sort((a, b) => b.rawDescription.length - a.rawDescription.length)[0]
    return describeBuild(representative.rawDescription, representative.rawUom)
  }, [cluster.members])

  /* Spend split by contributing CPSE, aggregated across members from the same company. */
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
      <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-rule pt-3">
        <MetaItem label={technical ? 'Canonical UOM' : 'Unit'}>
          <Num size="2xs">{cluster.uom}</Num>
        </MetaItem>
        <MetaItem label="UNSPSC">
          <Num size="2xs">{cluster.unspsc}</Num>
        </MetaItem>
        <MetaItem label={technical ? 'Standard' : 'Official standard'}>
          {cluster.standard === 'not stated' ? (
            <span className="text-2xs text-ink-3">not stated</span>
          ) : (
            <Num size="2xs">{cluster.standard}</Num>
          )}
        </MetaItem>
        <MetaItem label={technical ? 'Family' : 'Kind'}>
          <span className="text-2xs text-ink">{FAMILY_LABEL[cluster.family]}</span>
        </MetaItem>
        <MetaItem label={technical ? 'Records' : 'Entries'}>
          <Num size="2xs">{formatExact(cluster.members.length)}</Num>
        </MetaItem>
      </dl>

      {cluster.standard === 'not stated' ? (
        <p className="mt-2 text-2xs text-ink-3">
          <ByMode
            simple="None of the companies wrote an official standard number."
            technical="No IS / ASTM / ISO reference appeared in any member description."
          />
        </p>
      ) : null}

      {/* ----------------------------------------------------- description build */}
      <section className="mt-4 border-t border-rule pt-3">
        <div className="flex items-center gap-2">
          <IconTile icon={<Hash size={13} weight="regular" />} tone="neutral" size="sm" />
          <h3 className="font-display text-[12.5px] font-semibold tracking-tight text-ink">
            {technical ? 'How this description was proposed' : 'How this description was built'}
          </h3>
        </div>
        <div className="mt-2 flex gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1">
              {buildDescription.tokens.map(token => (
                <span key={token} className="rounded-md border border-rule bg-surface-2 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-2">{token}</span>
              ))}
            </div>
            <div className="mt-2 border border-rule">
              {buildDescription.slots.map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 border-b border-rule last:border-b-0 py-1 px-2.5">
                  <span className="text-[11px] text-ink-2">{label}</span>
                  {value ? (
                    <span className="font-mono text-[11px] text-ink">{value}</span>
                  ) : (
                    <span className="text-[11px] text-ink-3">not stated</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden sm:block w-[140px] shrink-0">
            <p className="text-[11px] text-ink-2 leading-relaxed">
              <ByMode
                simple="Slots filled from the cleaned description. The standard above is these values joined."
                technical="Attribute slots in canonical order. Code is a hash of the pipe-joined signature."
              />
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- members */}
      <section className="mt-4 border-t border-rule pt-3">
        <div className="flex items-center gap-2">
          <IconTile icon={<Buildings size={13} weight="regular" />} tone="neutral" size="sm" />
          <div className="flex items-baseline gap-x-2">
            <h3 className="font-display text-[12.5px] font-semibold tracking-tight text-ink">
              {technical ? 'Contributing records' : 'What each company calls it'}
            </h3>
            <span className="font-mono text-[10.5px] text-ink-3">{formatExact(cluster.members.length)}</span>
          </div>
        </div>

        {single && soleOwner ? (
          <div className="mt-2">
            <p className="max-w-[74ch] text-[13px] leading-relaxed text-ink-2">
              <ByMode
                simple={
                  <>
                    Only <span className="text-ink">{soleOwner.cpse}</span> stocks this item.
                    Nothing in the other three lists matched it. Most codes look like this.
                  </>
                }
                technical={
                  <>
                    Single-member cluster. No record from another CPSE cleared the accept threshold
                    against <span className="text-ink">{soleOwner.cpse}</span>.
                  </>
                }
              />
            </p>
            <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <MetaItem label={technical ? 'CPSE' : 'Company'}><Num size="2xs">{soleOwner.cpse}</Num></MetaItem>
              <MetaItem label={technical ? 'Local code' : 'Their code'}><Num size="2xs">{soleOwner.localCode}</Num></MetaItem>
              <MetaItem label={technical ? 'Raw UOM' : 'Unit'}><Num size="2xs">{soleOwner.rawUom}</Num></MetaItem>
              <MetaItem label="Qty"><Num size="2xs">{formatExact(soleOwner.annualQty)}</Num></MetaItem>
              <MetaItem label="Price"><Num size="2xs">{formatRupees(soleOwner.unitPrice)}</Num></MetaItem>
            </dl>
          </div>
        ) : (
          <>
            <p className="mt-2 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-2">
              <ByMode
                simple="Each line is one company's own entry. Different codes, different spellings, different units, one item."
                technical="One row per member. Local code, description and UOM all diverge; the canonical row above is what they resolve to."
              />
            </p>
            <div className="mt-2 border border-rule">
              <Table>
                <thead>
                  <tr>
                    <Th className="!py-1.5 !px-2.5">{technical ? 'CPSE' : 'Co.'}</Th>
                    <Th className="!py-1.5 !px-2.5">{technical ? 'Local code' : 'Their code'}</Th>
                    <Th className="!py-1.5 !px-2.5">Description</Th>
                    <Th className="!py-1.5 !px-2.5">{technical ? 'UOM' : 'Unit'}</Th>
                    <Th align="right" className="!py-1.5 !px-2.5">Qty</Th>
                    <Th align="right" className="!py-1.5 !px-2.5">Price</Th>
                  </tr>
                </thead>
                <tbody>
                  {cluster.members.map(member => (
                    <tr key={member.id}>
                      <Td className="!py-1.5 !px-2.5"><Num size="2xs">{member.cpse}</Num></Td>
                      <Td className="!py-1.5 !px-2.5"><Num size="2xs" className="text-ink-2">{member.localCode}</Num></Td>
                      <Td className="!py-1.5 !px-2.5 min-w-[24ch] font-mono text-[11.5px]">{member.rawDescription}</Td>
                      <Td className="!py-1.5 !px-2.5 whitespace-nowrap"><Num size="2xs" className="text-ink-2">{member.rawUom}</Num></Td>
                      <Td align="right" className="!py-1.5 !px-2.5 whitespace-nowrap"><Num size="2xs">{formatExact(member.annualQty)}</Num></Td>
                      <Td align="right" className="!py-1.5 !px-2.5 whitespace-nowrap"><Num size="2xs">{formatRupees(member.unitPrice)}</Num></Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </section>

      {/* ------------------------------------------------------------- spend */}
      <section className="mt-4 border-t border-rule pt-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <IconTile icon={<Coins size={13} weight="regular" />} tone="accent" size="sm" />
            <Num size="lg">{formatRupees(cluster.annualSpend)}</Num>
          </div>
          <Num size="2xs" className="text-ink-3">
            {technical ? 'annual spend across members' : 'spent on this every year, in total'}
          </Num>
          {!single && cluster.cpses.length > 1 ? (
            <div className="ml-auto shrink-0">
              <DonutChart data={cpseSpend} size={96} thickness={16} />
            </div>
          ) : null}
        </div>
        {!single && cluster.cpses.length > 1 ? (
          <div className="mt-2 ml-7">
            <ChartLegend data={cpseSpend} />
          </div>
        ) : null}
        <TechnicalOnly>
          <div className="mt-2 border border-rule bg-surface-2 px-3 py-2">
            <Label className="text-[10px]">Arithmetic</Label>
            <ul className="mt-1 space-y-0.5">
              {cluster.members.map(member => (
                <li key={member.id} className="font-mono text-[10.5px] tabular-nums text-ink-2">
                  {member.cpse} {formatExact(member.annualQty)} x Rs {formatExact(member.unitPrice)} = Rs {formatExact(member.annualQty * member.unitPrice)}
                </li>
              ))}
            </ul>
            <p className="mt-1 border-t border-rule pt-1 font-mono text-[10.5px] tabular-nums text-ink">
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
