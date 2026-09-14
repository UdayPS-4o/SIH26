/**
 * CPSE code mapping and migration support.
 *
 * The registry is only worth anything if the codes in it can get back into the
 * systems the work actually happens in. This page is that handover: one row per
 * record an organisation holds today, the national code it resolves to, and what
 * has to happen to it. Somebody downloads the file and an ERP team loads it.
 *
 * Every row is derived from the same clusters the code book shows. Nothing here is
 * authored: if a pair is approved on the duplicates page, a row moves from HOLD to
 * MAP here, and if a weight moves on the engine page the whole table recomputes.
 * That is the difference between a migration plan and a picture of one.
 *
 * Three actions, and the reason each exists:
 *
 * MAP   - this local code becomes that national code, one for one. Nothing else
 *         in the organisation claims the same code, so the ERP team can rename and
 *         move on.
 * MERGE - this organisation holds more than one code for the item. Migration is
 *         not a rename: two of its own material numbers collapse into one, and
 *         stock, open POs and reservations have to be moved before that can
 *         happen. Naming it separately is the honest thing to do, because it is
 *         the row that costs somebody a week.
 * HOLD  - the record sits in a pair nobody has ruled on yet. It is not ready to
 *         leave the building, and the package says so rather than quietly
 *         shipping an unconfirmed merge into a production master.
 */

import { useMemo, useState } from 'react'
import { DownloadSimple, Warning } from '@phosphor-icons/react'
import {
  Button,
  Chip,
  EndpointTag,
  Label,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Segmented,
  Skeleton,
  Stat,
  StatCell,
  StatRow,
  Table,
  Td,
  Th,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { logMigrationExport } from '@/api/endpoints'
import { formatExact } from '@/engine/savings'
import { FAMILY_LABEL, type Cluster, type Cpse, type MaterialRecord } from '@/engine/types'

/* --------------------------------------------------------------------- model */

type Action = 'MAP' | 'MERGE' | 'HOLD'

interface MappingRow {
  record: MaterialRecord
  nationalCode: string
  standardDescription: string
  action: Action
  /** Codes from the same organisation collapsing into this one national code. */
  siblings: string[]
  /** Other organisations that will sit on this same national code afterwards. */
  sharedWith: Cpse['code'][]
}

const ACTION_TONE: Record<Action, 'positive' | 'attention' | 'negative'> = {
  MAP: 'positive',
  MERGE: 'attention',
  HOLD: 'negative',
}

const ACTION_LABEL: Record<'simple' | 'technical', Record<Action, string>> = {
  simple: { MAP: 'Rename', MERGE: 'Combine first', HOLD: 'Not settled' },
  technical: { MAP: 'MAP', MERGE: 'MERGE', HOLD: 'HOLD' },
}

const PAGE = 60

/* --------------------------------------------------------------------- page */

export default function MigrationPage() {
  const c = useCopy()

  const ready = useService(s => s.ready)
  const records = useService(s => s.records)
  const clusters = useService(s => s.clusters)
  const pairs = useService(s => s.pairs)
  const decisions = useService(s => s.decisions)
  const registryCall = useService(s => s.lastCall.registry)
  const refresh = useService(s => s.refresh)

  const [filter, setFilter] = useState<'all' | Cpse['code']>('all')
  const [limit, setLimit] = useState(PAGE)
  const [exporting, setExporting] = useState(false)

  /**
   * Records whose cluster membership is still an open question.
   *
   * A pair sitting at review with nobody's decision on it means the two records may
   * or may not be the same item. Either record could move to a different national
   * code the moment somebody rules, so neither is safe to migrate.
   */
  const unsettled = useMemo(() => {
    const held = new Set<string>()
    for (const pair of pairs) {
      if (pair.verdict !== 'review') continue
      if (decisions[pair.id]) continue
      held.add(pair.left.id)
      held.add(pair.right.id)
    }
    return held
  }, [pairs, decisions])

  const rows = useMemo(() => {
    const clusterOf = new Map<string, Cluster>()
    for (const cluster of clusters) {
      for (const member of cluster.members) clusterOf.set(member.id, cluster)
    }

    const built: MappingRow[] = []
    for (const record of records) {
      const cluster = clusterOf.get(record.id)
      if (!cluster) continue

      const siblings = cluster.members
        .filter(member => member.cpse === record.cpse && member.id !== record.id)
        .map(member => member.localCode)

      built.push({
        record,
        nationalCode: cluster.code,
        standardDescription: cluster.standardDescription || record.rawDescription,
        action: unsettled.has(record.id) ? 'HOLD' : siblings.length > 0 ? 'MERGE' : 'MAP',
        siblings,
        sharedWith: cluster.cpses.filter(code => code !== record.cpse),
      })
    }

    return built.sort(
      (a, b) =>
        a.record.cpse.localeCompare(b.record.cpse) ||
        a.record.localCode.localeCompare(b.record.localCode),
    )
  }, [records, clusters, unsettled])

  /** Organisations that actually have rows, so the filter cannot offer an empty one. */
  const sources = useMemo(() => {
    const seen: Cpse['code'][] = []
    for (const row of rows) if (!seen.includes(row.record.cpse)) seen.push(row.record.cpse)
    return seen.sort()
  }, [rows])

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter(row => row.record.cpse === filter)),
    [rows, filter],
  )

  const counts = useMemo(() => {
    const tally: Record<Action, number> = { MAP: 0, MERGE: 0, HOLD: 0 }
    for (const row of filtered) tally[row.action] += 1
    return tally
  }, [filtered])

  /**
   * Rows that stop being a code of their own.
   *
   * This is the number the exercise is actually for. A rename on its own saves
   * nobody anything: the gain is the row whose national code another organisation
   * is also sitting on, because that is the line two CPSEs can tender together
   * once both have migrated.
   */
  const shared = useMemo(() => filtered.filter(row => row.sharedWith.length > 0).length, [filtered])

  /** Per organisation, how much of its master is ready to leave. */
  const perSource = useMemo(
    () =>
      sources.map(code => {
        const own = rows.filter(row => row.record.cpse === code)
        const held = own.filter(row => row.action === 'HOLD').length
        return {
          code,
          total: own.length,
          held,
          shared: own.filter(row => row.sharedWith.length > 0).length,
          ready: own.length === 0 ? 0 : (own.length - held) / own.length,
        }
      }),
    [rows, sources],
  )

  async function download() {
    setExporting(true)
    try {
      const header =
        'cpse,local_code,local_description,local_uom,national_code,standard_description,family,action,merges_with\n'
      const body = filtered
        .map(row =>
          [
            row.record.cpse,
            row.record.localCode,
            quote(row.record.rawDescription),
            row.record.rawUom,
            row.nationalCode,
            quote(row.standardDescription),
            FAMILY_LABEL[row.record.family],
            row.action,
            quote(row.siblings.join(' ')),
          ].join(','),
        )
        .join('\n')

      const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `codeone-migration-${filter === 'all' ? 'all-cpses' : filter.toLowerCase()}.csv`
      anchor.click()
      URL.revokeObjectURL(url)

      // The file leaving is the auditable event, not the click that produced it.
      // logMigrationExport writes straight into service state, same as every other
      // endpoint; a page reads that state through the store, not the module
      // directly, so the store has to be told to go and re-read it.
      await logMigrationExport(filter, filtered.length)
      await refresh()
    } finally {
      setExporting(false)
    }
  }

  if (ready && records.length === 0) {
    return (
      <>
        <PageHead title={c('migrationTitle')} lead={c('migrationLead')} />
        <NothingLoaded what="This page pairs every code an organisation uses today with the national code it becomes, and hands the list back as a file." />
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <PageHead title={c('migrationTitle')} lead={c('migrationLead')} />
        <Panel>
          <Skeleton rows={7} />
        </Panel>
      </>
    )
  }

  const visible = filtered.slice(0, limit)

  return (
    <>
      <PageHead title={c('migrationTitle')} lead={c('migrationLead')} />

      <StatRow>
        <StatCell>
          <Stat
            label="Codes to move"
            value={formatExact(filtered.length)}
            note="One row per record the organisation holds today."
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Straight rename"
            value={formatExact(counts.MAP)}
            tone="positive"
            note="Local code becomes the national code, one for one."
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Shared after migration"
            value={formatExact(shared)}
            tone="info"
            note="Codes another organisation will be sitting on too. These are the lines that can be tendered jointly."
          />
        </StatCell>
        <StatCell>
          <Stat
            label="Held back"
            value={formatExact(counts.HOLD)}
            tone="negative"
            emphasis={counts.HOLD > 0}
            note="Sitting in a pair nobody has ruled on. Not safe to load into a live master yet."
          />
        </StatCell>
      </StatRow>

      {perSource.length > 0 ? (
        <Panel className="mt-6">
          <Label>
            <ByMode simple="How far each company has got" technical="Readiness by organisation" />
          </Label>
          <div className="mt-3 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
            {perSource.map(source => (
              <div key={source.code}>
                <div className="flex items-baseline justify-between gap-2">
                  <Mono>{source.code}</Mono>
                  <Num size="sm" className="text-ink-2">
                    {(source.ready * 100).toFixed(0)}%
                  </Num>
                </div>
                <div className="mt-1.5">
                  <Meter value={source.ready} tone={source.held === 0 ? 'positive' : 'attention'} />
                </div>
                <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">
                  {formatExact(source.total)} codes, {formatExact(source.shared)} shared,{' '}
                  {formatExact(source.held)} held
                </p>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel flush className="mt-6">
        <PanelHead
          title={<ByMode simple="Old code to new code" technical="Legacy to national crosswalk" />}
          meta={
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
          action={
            <Segmented
              size="sm"
              value={filter}
              onChange={value => {
                setFilter(value)
                setLimit(PAGE)
              }}
              options={[
                { value: 'all' as const, label: 'All', count: rows.length },
                ...sources.map(code => ({
                  value: code,
                  label: code,
                  count: rows.filter(row => row.record.cpse === code).length,
                })),
              ]}
            />
          }
        />

        <Table className="rounded-none border-0">
          <thead>
            <tr>
              <Th>Company</Th>
              <Th>
                <ByMode simple="Their code today" technical="Local code" />
              </Th>
              <Th>
                <ByMode simple="How they describe it" technical="Local description" />
              </Th>
              <Th>Unit</Th>
              <Th>
                <ByMode simple="National code" technical="CNMC code" />
              </Th>
              <Th>
                <ByMode simple="Agreed description" technical="Standard description" />
              </Th>
              <Th align="right">Action</Th>
            </tr>
          </thead>
          <tbody>
            {visible.map(row => (
              <tr key={row.record.id} className="transition-colors hover:bg-surface-2">
                <Td>
                  <Mono>{row.record.cpse}</Mono>
                </Td>
                <Td>
                  <Num size="sm" className="text-ink-2">
                    {row.record.localCode}
                  </Num>
                </Td>
                <Td className="max-w-[280px]">
                  <span className="text-ink">{row.record.rawDescription}</span>
                  {row.siblings.length > 0 ? (
                    <span className="mt-0.5 block text-[11.5px] text-attention">
                      also {row.siblings.join(', ')} in the same organisation
                    </span>
                  ) : null}
                </Td>
                <Td>
                  <span className="text-ink-2">{row.record.rawUom}</span>
                </Td>
                <Td>
                  <Mono>{row.nationalCode}</Mono>
                  {row.sharedWith.length > 0 ? (
                    <span className="mt-0.5 block text-[11px] text-info">
                      shared with {row.sharedWith.join(', ')}
                    </span>
                  ) : null}
                </Td>
                <Td className="max-w-[280px]">
                  <span className="text-ink-2">{row.standardDescription}</span>
                </Td>
                <Td align="right">
                  <Chip tone={ACTION_TONE[row.action]}>
                    <ByMode
                      simple={ACTION_LABEL.simple[row.action]}
                      technical={ACTION_LABEL.technical[row.action]}
                    />
                  </Chip>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>

        {filtered.length > visible.length ? (
          <div className="flex items-center gap-3 border-t border-rule px-5 py-3">
            <Button size="sm" onClick={() => setLimit(limit + PAGE)}>
              Show {Math.min(PAGE, filtered.length - visible.length)} more
            </Button>
            <span className="font-mono text-[11px] text-ink-3">
              {formatExact(visible.length)} of {formatExact(filtered.length)}
            </span>
          </div>
        ) : null}
      </Panel>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-[70ch] text-[13px] leading-relaxed text-ink-2">
          {counts.HOLD > 0 ? (
            <span className="inline-flex items-baseline gap-1.5">
              <Warning size={14} weight="fill" className="translate-y-0.5 text-attention" />
              <ByMode
                simple={`${formatExact(counts.HOLD)} rows are still waiting on a person. They are in the file, marked HOLD, so whoever loads it can leave them out.`}
                technical={`${formatExact(counts.HOLD)} rows carry action HOLD. They are included so the receiving system can exclude them explicitly rather than silently miss them.`}
              />
            </span>
          ) : (
            <ByMode
              simple="Every row here has been settled. The file is safe to hand over."
              technical="No row is waiting on a review decision. The crosswalk is stable at the current weights."
            />
          )}
        </p>

        <Button
          variant="primary"
          icon={<DownloadSimple size={16} weight="regular" />}
          disabled={exporting || filtered.length === 0}
          onClick={() => void download()}
        >
          {exporting ? 'Preparing' : <ByMode simple="Download the list" technical="Download migration package" />}
        </Button>
      </div>
    </>
  )
}

/** CSV quoting. Descriptions carry commas in two of the four house styles. */
function quote(value: string): string {
  return `"${value.replace(/"/g, '""')}"`
}
