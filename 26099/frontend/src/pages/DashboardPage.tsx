/**
 * Harmonization dashboard.
 *
 * The one page that answers "where does this stand" without asking anybody to
 * run anything. Everything else in the console is a working surface; this is
 * the read of those surfaces, laid out so the four figures that matter are
 * legible from across a room.
 *
 * The discipline that applies to the rest of the console applies here twice
 * over, because a dashboard is the easiest place in a product to lie:
 *
 *   - Every number is computed from records that were actually loaded. There
 *     is no seeded corpus behind this page, so before a master is read the
 *     page says so rather than showing a grid of zeroes or a placeholder.
 *   - Corpus-wide figures (records read, repeats found) are extrapolated from
 *     the inspectable slice, and each one names the rate it was scaled by.
 *   - No status light, no uptime pill, no live clock, no sparkline without a
 *     series behind it. What replaces a green "ONLINE" dot is the request that
 *     produced the panel, printed with its latency, in Technical view.
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  Barcode,
  Buildings,
  CheckCircle,
  CopySimple,
  Database,
  PiggyBank,
  Question,
  Stack,
  XCircle,
} from '@phosphor-icons/react'

import {
  AnimatedNumber,
  Chip,
  EndpointTag,
  ErrorState,
  IconTile,
  Label,
  Meter,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Skeleton,
  type Tone,
} from '@/components/ui'
import { ColumnChart, DonutChart } from '@/components/ui/charts'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { CPSES } from '@/engine/corpus'
import { formatCount, formatExact, formatRupees } from '@/engine/savings'
import { FAMILY_LABEL } from '@/engine/types'
import type { MaterialFamily } from '@/engine/types'

/* AnimatedNumber wants a stable module-level formatter, not an inline closure. */
const asCount = (value: number) => formatCount(value)
const asExact = (value: number) => formatExact(value)
const asRupees = (value: number) => formatRupees(value)

export default function DashboardPage() {
  const c = useCopy()
  const reduced = useReducedMotion()

  const dashboard = useService(s => s.dashboard)
  const health = useService(s => s.health)
  const counts = useService(s => s.counts)
  const savings = useService(s => s.savings)
  const records = useService(s => s.records)
  const clusters = useService(s => s.clusters)
  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const lastCall = useService(s => s.lastCall.dashboard)

  /* Records per family, biggest first. The slice is what was measured, so this
     counts the slice rather than scaling it. */
  const familyData = useMemo(() => {
    const tally = new Map<MaterialFamily, number>()
    for (const record of records) {
      tally.set(record.family, (tally.get(record.family) ?? 0) + 1)
    }
    return [...tally.entries()]
      .map(([family, value]) => ({ name: FAMILY_LABEL[family], value }))
      .sort((a, b) => b.value - a.value)
  }, [records])

  /* The three verdicts, in the order a reviewer meets them. Tones are the
     semantic ones, not the categorical palette: "same" always reads positive
     and "different" always reads negative, here and everywhere else. */
  const verdictData = useMemo(
    () => [
      { name: 'Same item', value: counts.same },
      { name: 'Needs a person', value: counts.review },
      { name: 'Different items', value: counts.different },
    ],
    [counts],
  )
  const verdictTones: Tone[] = ['positive', 'attention', 'negative']
  const totalPairs = counts.same + counts.review + counts.different

  /* Per-source rows. Master size comes from the source; everything else is
     counted off the rows that source actually contributed to the slice, so an
     unloaded source shows its size and nothing else.
   *
   * "Shared" here means: this row sits in a group that holds more than one
   * record, so somebody else is buying the same thing. It deliberately is not
   * the corpus-wide duplicate count (members - 1 per group), because that
   * measure has to pick one member of each group as the original, and which
   * one it picks is an artifact of iteration order rather than of the data -
   * scoring it per source handed IOCL a flat 0% purely for being first in the
   * list. Counting every member of a shared group is symmetric, so the four
   * rates can honestly be read against each other. */
  const sources = useMemo(() => {
    const sharedByCpse = new Map<string, number>()
    const sliceByCpse = new Map<string, number>()
    for (const record of records) {
      sliceByCpse.set(record.cpse, (sliceByCpse.get(record.cpse) ?? 0) + 1)
    }
    for (const cluster of clusters) {
      if (cluster.members.length < 2) continue
      for (const member of cluster.members) {
        sharedByCpse.set(member.cpse, (sharedByCpse.get(member.cpse) ?? 0) + 1)
      }
    }
    const loaded = dashboard?.loaded ?? []
    return CPSES.map(cpse => {
      const slice = sliceByCpse.get(cpse.code) ?? 0
      const shared = sharedByCpse.get(cpse.code) ?? 0
      return {
        ...cpse,
        isLoaded: loaded.includes(cpse.code),
        slice,
        shared,
        rate: slice > 0 ? shared / slice : 0,
      }
    })
  }, [records, clusters, dashboard])

  /* The groups the saving actually comes from, biggest spend first. */
  const topClusters = useMemo(
    () =>
      [...clusters]
        .filter(cluster => cluster.members.length > 1)
        .sort((a, b) => b.annualSpend - a.annualSpend)
        .slice(0, 6),
    [clusters],
  )
  const topSpend = topClusters[0]?.annualSpend ?? 0

  if (error) {
    return (
      <>
        <PageHead title={c('dashboardTitle')} lead={c('dashboardLead')} icon={<Stack size={22} weight="fill" />} />
        <ErrorState message={c('errorGeneric')} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready && records.length === 0) {
    return (
      <>
        <PageHead title={c('dashboardTitle')} lead={c('dashboardLead')} icon={<Stack size={22} weight="fill" />} />
        <Skeleton rows={8} />
      </>
    )
  }

  if (records.length === 0) {
    return (
      <>
        <PageHead title={c('dashboardTitle')} lead={c('dashboardLead')} icon={<Stack size={22} weight="fill" />} />
        <NothingLoaded what="This page reads the whole registry back to you in one screen." />
      </>
    )
  }

  const loadedCount = dashboard?.loaded.length ?? 0
  const duplicateRate = dashboard && dashboard.sampleSize > 0
    ? (health?.duplicateRecords ?? 0) / dashboard.sampleSize
    : 0
  const codeCompression = dashboard && dashboard.sampleSize > 0
    ? (health?.distinctCodes ?? 0) / dashboard.sampleSize
    : 0

  return (
    <>
      <PageHead
        title={c('dashboardTitle')}
        lead={c('dashboardLead')}
        icon={<Stack size={22} weight="fill" />}
        aside={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap justify-end gap-2">
              <Chip tone={loadedCount === CPSES.length ? 'positive' : 'attention'}>
                {loadedCount} of {CPSES.length} loaded
              </Chip>
              <Chip tone="neutral">{formatExact(dashboard?.sampleSize ?? 0)} in the slice</Chip>
            </div>
            <TechnicalOnly>
              {lastCall ? (
                <EndpointTag
                  method={lastCall.method}
                  endpoint={lastCall.endpoint}
                  ms={lastCall.ms}
                  scanned={lastCall.scanned}
                />
              ) : null}
            </TechnicalOnly>
          </div>
        }
      />

      {/* --------------------------------------------------------- headline */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          index={0}
          reduced={!!reduced}
          tone="accent"
          icon={<Database size={18} weight="duotone" />}
          label={<ByMode simple="Items read" technical="Records ingested" />}
          value={<AnimatedNumber value={dashboard?.totalRecords ?? 0} format={asCount} />}
          fraction={
            dashboard && dashboard.totalAvailable > 0
              ? dashboard.totalRecords / dashboard.totalAvailable
              : 0
          }
          note={
            <ByMode
              simple={`Out of ${formatCount(dashboard?.totalAvailable ?? 0)} held by all ${CPSES.length} companies.`}
              technical={`${formatCount(dashboard?.totalAvailable ?? 0)} across all ${CPSES.length} masters.`}
            />
          }
        />
        <Kpi
          index={1}
          reduced={!!reduced}
          tone="attention"
          icon={<CopySimple size={18} weight="duotone" />}
          label={<ByMode simple="Repeats found" technical="Duplicate records" />}
          value={<AnimatedNumber value={dashboard?.duplicateRecords ?? 0} format={asCount} />}
          fraction={duplicateRate}
          note={
            <ByMode
              simple={`About ${Math.round(duplicateRate * 100)} in every 100 items already exist somewhere else.`}
              technical={`${(duplicateRate * 100).toFixed(1)}% duplicate rate, measured on the slice and applied to the loaded masters.`}
            />
          }
        />
        <Kpi
          index={2}
          reduced={!!reduced}
          tone="info"
          icon={<Barcode size={18} weight="duotone" />}
          label={<ByMode simple="National codes issued" technical="CNMC codes minted" />}
          value={<AnimatedNumber value={health?.distinctCodes ?? 0} format={asExact} />}
          fraction={1 - codeCompression}
          note={
            <ByMode
              simple={`${formatExact(dashboard?.sampleSize ?? 0)} records collapsed into ${formatExact(health?.distinctCodes ?? 0)} codes.`}
              technical={`${formatExact(dashboard?.sampleSize ?? 0)} records to ${formatExact(health?.distinctCodes ?? 0)} golden records, ${((1 - codeCompression) * 100).toFixed(1)}% compression.`}
            />
          }
        />
        <Kpi
          index={3}
          reduced={!!reduced}
          tone="positive"
          icon={<PiggyBank size={18} weight="duotone" />}
          label={<ByMode simple="Saving each year" technical="Modelled annual saving" />}
          value={<AnimatedNumber value={savings?.annualSaving ?? 0} format={asRupees} />}
          fraction={
            savings && savings.addressableSpend > 0
              ? savings.annualSaving / savings.addressableSpend
              : 0
          }
          note={
            <>
              <ByMode
                simple="If the repeats are bought together instead of four times over. "
                technical="Consolidation model over the addressable spend. "
              />
              <Link to="/savings" className="text-accent underline underline-offset-2">
                See the working
              </Link>
            </>
          }
        />
      </div>

      {/* ----------------------------------------------- families and verdicts */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel flush>
          <PanelHead
            icon={<Stack size={16} weight="duotone" />}
            title={<ByMode simple="What kind of things these are" technical="Records by material family" />}
            meta={`${familyData.length} families`}
          />
          <div className="px-4 py-4">
            <p className="mb-3 max-w-[70ch] text-[12.5px] leading-relaxed text-ink-2">
              <ByMode
                simple="Counted from the readable slice, not estimated. This is the mix the matcher had to work with."
                technical="Counted on the inspectable slice. Family assignment drives the blocking key, so the mix here is also the shape of the candidate search."
              />
            </p>
            <ColumnChart data={familyData} height={296} angledLabels format={asExact} />
          </div>
        </Panel>

        <Panel flush>
          <PanelHead
            icon={<CheckCircle size={16} weight="duotone" />}
            title={<ByMode simple="What the matcher decided" technical="Verdict distribution" />}
            meta={`${formatExact(totalPairs)} pairs`}
          />
          <div className="flex flex-col items-center gap-5 px-5 py-6">
            <DonutChart
              data={verdictData}
              tones={verdictTones}
              size={168}
              thickness={26}
              center={
                <>
                  <Num size="xl" className="text-ink">
                    {formatExact(totalPairs)}
                  </Num>
                  <Label className="mt-0.5">pairs</Label>
                </>
              }
            />
            <ul className="w-full">
              {verdictData.map((entry, index) => (
                <VerdictRow
                  key={entry.name}
                  tone={verdictTones[index]}
                  name={entry.name}
                  value={entry.value}
                  fraction={totalPairs > 0 ? entry.value / totalPairs : 0}
                />
              ))}
            </ul>
            {counts.review > 0 ? (
              <Link
                to="/duplicates"
                className="flex w-full items-center justify-center gap-1.5 rounded-full border border-attention-edge bg-attention-bg px-3 py-1.5 text-[12.5px] font-medium text-attention transition-colors hover:brightness-95"
              >
                <ByMode
                  simple={`${counts.review} still need a person`}
                  technical={`${counts.review} pairs awaiting review`}
                />
                <ArrowRight size={13} weight="bold" />
              </Link>
            ) : null}
          </div>
        </Panel>
      </div>

      {/* -------------------------------------------- sources and where it pays */}
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Panel flush>
          <PanelHead
            icon={<Buildings size={16} weight="duotone" />}
            title={<ByMode simple="Each company's list" technical="Source ingestion and duplicate rate" />}
            meta={`${loadedCount} of ${CPSES.length} loaded`}
          />
          <div className="grid gap-px bg-rule sm:grid-cols-2">
            {sources.map((source, index) => (
              <SourceCard key={source.code} source={source} index={index} reduced={!!reduced} />
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule px-5 py-3">
            <span className="max-w-[52ch] text-[12.5px] leading-snug text-ink-2">
              <ByMode
                simple="A share this high on every list is the point: the same items are being bought four times over under four different names."
                technical="Comparable rates across sources indicate the overlap is systematic, not one organisation's cataloguing habit."
              />
            </span>
            <Num size="sm" className="shrink-0 text-ink">
              {formatCount(sources.reduce((sum, source) => sum + source.totalRecords, 0))}
            </Num>
          </div>
        </Panel>

        <Panel flush>
          <PanelHead
            icon={<PiggyBank size={16} weight="duotone" />}
            title={<ByMode simple="Where the money actually is" technical="Highest-spend shared groups" />}
            meta={`top ${topClusters.length}`}
          />
          <ul className="divide-y divide-rule">
            {topClusters.map(cluster => (
              <li key={cluster.code} className="px-5 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 truncate text-[12.5px] text-ink">
                    {cluster.standardDescription}
                  </span>
                  <Num size="sm" className="shrink-0 text-ink">
                    {formatRupees(cluster.annualSpend)}
                  </Num>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <Meter value={topSpend > 0 ? cluster.annualSpend / topSpend : 0} tone="primary" />
                  </span>
                  <span className="shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em] text-ink-3">
                    {cluster.cpses.join(' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-rule px-5 py-3">
            <span className="text-[12.5px] text-ink-2">
              <ByMode
                simple="These groups alone account for"
                technical="Combined annual spend across these groups"
              />
            </span>
            <Num size="sm" className="text-ink">
              {formatRupees(topClusters.reduce((sum, cluster) => sum + cluster.annualSpend, 0))}
            </Num>
          </div>
        </Panel>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------- pieces */

/**
 * One headline figure.
 *
 * The bar underneath is not decoration: each one carries the denominator named
 * in the note, so the number is always readable as a proportion of something
 * stated rather than as a bare figure.
 */
function Kpi({
  index,
  reduced,
  tone,
  icon,
  label,
  value,
  note,
  fraction,
}: {
  index: number
  reduced: boolean
  tone: Tone
  icon: React.ReactNode
  label: React.ReactNode
  value: React.ReactNode
  note: React.ReactNode
  fraction: number
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduced ? 0 : index * 0.06, ease: 'easeOut' }}
    >
      <Panel className="h-full" hover>
        <div className="flex items-start justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            {label}
          </div>
          <IconTile icon={icon} tone={tone} size="sm" />
        </div>
        <div className="mt-2.5 break-words font-mono text-[27px] leading-[1.15] tabular-nums text-ink">
          {value}
        </div>
        <div className="mt-3">
          <Meter value={fraction} tone={tone} />
        </div>
        <p className="mt-2.5 text-[12.5px] leading-snug text-ink-2">{note}</p>
      </Panel>
    </motion.div>
  )
}

const VERDICT_ICON: Record<string, React.ReactNode> = {
  positive: <CheckCircle size={14} weight="fill" />,
  attention: <Question size={14} weight="fill" />,
  negative: <XCircle size={14} weight="fill" />,
}

const VERDICT_TEXT: Record<string, string> = {
  positive: 'text-positive',
  attention: 'text-attention',
  negative: 'text-negative',
}

function VerdictRow({
  tone,
  name,
  value,
  fraction,
}: {
  tone: Tone
  name: string
  value: number
  fraction: number
}) {
  return (
    <li className="flex items-center gap-2.5 py-1.5">
      <span className={VERDICT_TEXT[tone]}>{VERDICT_ICON[tone]}</span>
      <span className="min-w-0 truncate text-[12.5px] text-ink-2">{name}</span>
      <span className="ml-auto shrink-0 font-mono text-[10.5px] tabular-nums text-ink-3">
        {(fraction * 100).toFixed(0)}%
      </span>
      <Num size="sm" className="w-12 shrink-0 text-right text-ink">
        {formatExact(value)}
      </Num>
    </li>
  )
}

interface SourceRow {
  code: string
  name: string
  erp: string
  totalRecords: number
  isLoaded: boolean
  slice: number
  /** Rows of this source's slice that sit in a group with somebody else's row. */
  shared: number
  rate: number
}

/** Cycled so four sources read as four organisations. Decorative only, matches
 *  the non-semantic chart palette (tokens.ts CHART_PALETTE) used elsewhere. */
const SOURCE_DOT = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4']

function SourceCard({
  source,
  index,
  reduced,
}: {
  source: SourceRow
  index: number
  reduced: boolean
}) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: reduced ? 0 : index * 0.05 }}
      className="bg-surface px-5 py-4 transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-center gap-2.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${SOURCE_DOT[index % SOURCE_DOT.length]}`} />
        <span className="font-mono text-[12.5px] font-medium tracking-[0.06em] text-ink">
          {source.code}
        </span>
        <Chip tone={source.isLoaded ? 'positive' : 'neutral'} className="ml-auto">
          {source.isLoaded ? 'loaded' : 'not sent yet'}
        </Chip>
      </div>
      <div className="mt-1 truncate text-[12.5px] text-ink-2">{source.name}</div>
      <TechnicalOnly>
        <div className="mt-0.5 truncate font-mono text-[10.5px] text-ink-3">{source.erp}</div>
      </TechnicalOnly>

      <dl className="mt-3 grid grid-cols-3 gap-3">
        <Cell label={<ByMode simple="Items" technical="Master" />} value={formatCount(source.totalRecords)} />
        <Cell label="In the slice" value={source.isLoaded ? formatExact(source.slice) : '-'} />
        <Cell
          label={<ByMode simple="Shared" technical="In shared groups" />}
          value={source.isLoaded ? formatExact(source.shared) : '-'}
          tone={source.shared > 0 ? 'attention' : 'neutral'}
        />
      </dl>

      {source.isLoaded ? (
        <div className="mt-3 flex items-center gap-3">
          <span className="min-w-0 flex-1">
            <Meter value={source.rate} tone="attention" />
          </span>
          <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-3">
            {(source.rate * 100).toFixed(1)}%{' '}
            <ByMode simple="also bought elsewhere" technical="shared" />
          </span>
        </div>
      ) : (
        <div className="mt-3 text-[12px] text-ink-3">
          <ByMode
            simple="Nothing measured until this list is loaded."
            technical="No slice contribution until this extract is read."
          />
        </div>
      )}
    </motion.div>
  )
}

function Cell({
  label,
  value,
  tone = 'neutral',
}: {
  label: React.ReactNode
  value: string
  tone?: Tone
}) {
  return (
    <div className="min-w-0">
      <dt className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-ink-3">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-mono text-[13px] tabular-nums ${
          tone === 'attention' ? 'text-attention' : 'text-ink'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
