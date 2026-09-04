/**
 * Activity, route /activity.
 *
 * The audit trail. Public money means every decision carries a name and a time.
 *
 * The one rule this page cannot break is internal consistency: the counts in the
 * summary strip are derived from the same store fields the rest of the console
 * reads (`decisions`, `pairs`, `dashboard`), never from a private tally of the
 * entries below. The previous build printed "0 duplicates flagged" on the same
 * screen as five open proposals, and that single contradiction cost it every bit
 * of trust it had earned.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, DownloadSimple } from '@phosphor-icons/react'
import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Field,
  Mono,
  Num,
  Panel,
  PanelHead,
  PageHead,
  Select,
  Skeleton,
  Stat,
  StatCell,
  StatRow,
  TextInput,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { useViewMode } from '@/store/viewmode'
import type { ActivityAction, ActivityEntry } from '@/engine/types'

/* ------------------------------------------------------------------ labels */

const ACTIONS: ActivityAction[] = [
  'ingest',
  'normalize',
  'match',
  'approve',
  'reject',
  'mint',
  'import',
  'config',
]

/** Kept as a lookup rather than eight <ByMode> calls, because the <option> text
 *  of the filter and the chip text of a row have to be the same string. */
const ACTION_LABEL: Record<'simple' | 'technical', Record<ActivityAction, string>> = {
  simple: {
    ingest: 'Read in',
    normalize: 'Cleaned up',
    match: 'Compared',
    approve: 'Agreed',
    reject: 'Rejected',
    mint: 'New code',
    import: 'Added list',
    config: 'Setting changed',
  },
  technical: {
    ingest: 'Ingest',
    normalize: 'Normalize',
    match: 'Match',
    approve: 'Approve',
    reject: 'Reject',
    mint: 'Mint',
    import: 'Import',
    config: 'Config',
  },
}

function toneFor(action: ActivityAction): 'accent' | 'negative' | 'neutral' {
  if (action === 'approve') return 'accent'
  if (action === 'reject') return 'negative'
  return 'neutral'
}

/* --------------------------------------------------------------- formatting */

const TIME_FMT = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const DATE_FMT = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

/** en-IN grouping plus the right plural, because "1 pairs" reads as a bug. */
function count(n: number, singular: string, plural: string): string {
  return `${n.toLocaleString('en-IN')} ${n === 1 ? singular : plural}`
}

function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const CSV_HEADER = [
  'entry',
  'recorded_at_iso',
  'recorded_at_local',
  'action',
  'actor',
  'organisation',
  'national_code',
  'what_happened',
  'endpoint',
]

function buildCsv(entries: ActivityEntry[]): string {
  const lines = [CSV_HEADER.join(',')]
  for (const entry of entries) {
    lines.push(
      [
        entry.id,
        new Date(entry.ts).toISOString(),
        `${DATE_FMT.format(entry.ts)} ${TIME_FMT.format(entry.ts)}`,
        entry.action,
        entry.actor,
        entry.cpse ?? '',
        entry.code ?? '',
        entry.detail,
        entry.endpoint ?? '',
      ]
        .map(csvCell)
        .join(','),
    )
  }
  return `${lines.join('\r\n')}\r\n`
}

/* ------------------------------------------------------------------- page */

type ActionFilter = ActivityAction | 'all'

export default function ActivityPage() {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const activity = useService(s => s.activity)
  const decisions = useService(s => s.decisions)
  const pairs = useService(s => s.pairs)
  const dashboard = useService(s => s.dashboard)
  const activityCall = useService(s => s.lastCall.activity)
  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)

  const [action, setAction] = useState<ActionFilter>('all')
  const [cpse, setCpse] = useState<string>('all')
  const [query, setQuery] = useState('')

  /* ---- counts, every one of them derived from a shared store field ---- */

  const summary = useMemo(() => {
    const statuses = Object.entries(decisions)
    const approvedIds = statuses.filter(([, v]) => v === 'approved').map(([id]) => id)
    const rejected = statuses.filter(([, v]) => v === 'rejected').length

    // Codes confirmed: the proposed code of every pair a person approved, counted
    // once. Read off `pairs` and `decisions`, the same two fields the duplicates
    // queue renders from, so the two screens cannot disagree.
    const byId = new Map(pairs.map(p => [p.id, p]))
    const codes = new Set<string>()
    for (const id of approvedIds) {
      const pair = byId.get(id)
      if (pair) codes.add(pair.proposedCode)
    }

    return {
      approved: approvedIds.length,
      rejected,
      codes: codes.size,
      open: dashboard?.pendingPairs ?? 0,
    }
  }, [decisions, pairs, dashboard])

  const decidedHere = summary.approved + summary.rejected

  /* ------------------------------- filtering ------------------------------ */

  const cpseOptions = useMemo(() => {
    const found = new Set<string>()
    for (const entry of activity) if (entry.cpse) found.add(entry.cpse)
    return [...found].sort()
  }, [activity])

  const sorted = useMemo(() => [...activity].sort((a, b) => b.ts - a.ts), [activity])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sorted.filter(entry => {
      if (action !== 'all' && entry.action !== action) return false
      if (cpse !== 'all' && entry.cpse !== cpse) return false
      if (needle && !entry.detail.toLowerCase().includes(needle)) return false
      return true
    })
  }, [sorted, action, cpse, query])

  const filtersActive = action !== 'all' || cpse !== 'all' || query.trim().length > 0

  const clearFilters = useCallback(() => {
    setAction('all')
    setCpse('all')
    setQuery('')
  }, [])

  /* ------------------------------- export -------------------------------- */

  const exportCsv = useCallback(() => {
    const blob = new Blob([buildCsv(filtered)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `nummf-activity-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }, [filtered])

  /* --- entries present at mount do not animate; later arrivals do, once --- */

  const seen = useRef<Set<string> | null>(null)
  if (seen.current === null) seen.current = new Set(activity.map(entry => entry.id))
  const known = seen.current

  useEffect(() => {
    for (const entry of activity) known.add(entry.id)
  }, [activity, known])

  /* -------------------------------- render -------------------------------- */

  if (error) {
    return (
      <>
        <PageHead title={c('activityTitle')} lead={c('activityLead')} />
        <ErrorState message={c('errorGeneric')} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready && activity.length === 0) {
    return (
      <>
        <PageHead title={c('activityTitle')} lead={c('activityLead')} />
        <Skeleton rows={8} />
      </>
    )
  }

  if (activity.length === 0) {
    return (
      <>
        <PageHead title={c('activityTitle')} lead={c('activityLead')} />
        <NothingLoaded what="Every load, every merge and every decision a person makes is written here, in order, with the call that produced it." />
      </>
    )
  }

  return (
    <>
      <PageHead title={c('activityTitle')} lead={c('activityLead')} />

      <section className="mb-6">
        <StatRow>
          <StatCell>
            <Stat
              value={summary.approved.toLocaleString('en-IN')}
              label={mode === 'simple' ? 'Agreed by a person' : 'Approved this session'}
              note={
                <ByMode
                  simple="Pairs a person confirmed are the same item, in this session."
                  technical="decisions where the reviewer recorded approved."
                />
              }
            />
          </StatCell>
          <StatCell>
            <Stat
              value={summary.rejected.toLocaleString('en-IN')}
              label={mode === 'simple' ? 'Rejected by a person' : 'Rejected this session'}
              note={
                <ByMode
                  simple="Pairs a person said are different things, in this session."
                  technical="decisions where the reviewer recorded rejected."
                />
              }
            />
          </StatCell>
          <StatCell>
            <Stat
              value={summary.codes.toLocaleString('en-IN')}
              label={mode === 'simple' ? 'Codes settled here' : 'Codes confirmed this session'}
              note={
                <ByMode
                  simple="National codes those agreements settled. The code book itself holds many more."
                  technical="Distinct proposedCode across approved pairs. Not the size of the registry."
                />
              }
            />
          </StatCell>
          <StatCell>
            <Stat
              value={summary.open.toLocaleString('en-IN')}
              label={mode === 'simple' ? 'Still waiting on a person' : 'Open for review'}
              emphasis={summary.open > 0}
              note={
                <ByMode
                  simple="Pairs nobody has decided yet. The same number the duplicates page shows."
                  technical="Verdict review with no decision recorded. Same rule as the needs bucket."
                />
              }
            />
          </StatCell>
        </StatRow>

        <p className="mt-3 max-w-[80ch] text-[12.5px] leading-relaxed text-ink-2">
          <ByMode
            simple="These four numbers are read from the same record as the duplicates page, so the two screens cannot tell you different things about the same work."
            technical="Derived from decisions, pairs and GET /analytics/dashboard, the fields the review queue and the sidebar badge read. No separate tally is kept for this page."
          />
        </p>
      </section>

      {decidedHere === 0 ? (
        <div className="mb-6">
          <EmptyState
            title="No one has decided anything yet in this session"
            detail={
              summary.open > 0
                ? `Everything below is the harmonization run itself. ${count(summary.open, 'pair is', 'pairs are')} still waiting for a person. Decide one and it is written here, with a name and a time against it, and cannot be edited afterwards.`
                : 'Everything below is the harmonization run itself. Anything a person does, in the review queue or by adding a new list, is written here with a name and a time against it, and cannot be edited afterwards.'
            }
            action={
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight size={16} weight="regular" />}
                onClick={() => navigate('/duplicates')}
              >
                {summary.open > 0 ? 'Go and decide a pair' : 'Open the duplicates queue'}
              </Button>
            }
          />
        </div>
      ) : null}

      <Panel flush>
        <PanelHead
          title={<ByMode simple="Everything that has happened" technical="Append only event log" />}
          meta={`${filtered.length.toLocaleString('en-IN')} of ${sorted.length.toLocaleString('en-IN')} entries`}
          action={
            <Button
              size="sm"
              icon={<DownloadSimple size={16} weight="regular" />}
              onClick={exportCsv}
              disabled={filtered.length === 0}
            >
              Export the trail as CSV
            </Button>
          }
        />

        <div className="grid gap-3 border-b border-rule px-5 py-4 sm:grid-cols-2 lg:grid-cols-[190px_190px_minmax(0,1fr)]">
          <Field label={mode === 'simple' ? 'Kind of event' : 'Action'}>
            <Select value={action} onChange={event => setAction(event.target.value as ActionFilter)}>
              <option value="all">All kinds</option>
              {ACTIONS.map(value => (
                <option key={value} value={value}>
                  {ACTION_LABEL[mode][value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={mode === 'simple' ? 'Company' : 'CPSE'}>
            <Select value={cpse} onChange={event => setCpse(event.target.value)}>
              <option value="all">All</option>
              {cpseOptions.map(value => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
          </Field>

          <Field label={mode === 'simple' ? 'Search what happened' : 'Search detail'}>
            <TextInput
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={mode === 'simple' ? 'bolt, Steel Authority, code' : 'substring match on detail'}
            />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-rule bg-surface-2 px-5 py-2.5">
          {filtered.length > 0 ? (
            <span className="text-[12.5px] text-ink-2">
              The file will contain <Num size="sm">{filtered.length.toLocaleString('en-IN')}</Num>{' '}
              {filtered.length === 1 ? 'row' : 'rows'}, exactly the entries listed below. It is built
              and saved on this machine, and nothing is sent anywhere.
            </span>
          ) : (
            <span className="text-[12.5px] text-ink-2">
              Nothing to export while the filters match no entries.
            </span>
          )}
          {filtersActive ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
              Clear filters
            </Button>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-start gap-3 px-5 py-10">
            <p className="font-display text-[15px] font-semibold text-ink">
              No entries match these filters
            </p>
            <p className="max-w-[52ch] text-[13px] text-ink-2">
              The trail still holds <Num size="sm">{sorted.length.toLocaleString('en-IN')}</Num>{' '}
              {sorted.length === 1 ? 'entry' : 'entries'}. Widen the search or clear the filters to
              see them.
            </p>
            <Button size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        ) : (
          <ul>
            {filtered.map(entry => (
              <Row key={entry.id} entry={entry} isNew={!known.has(entry.id) && !reduceMotion} mode={mode} />
            ))}
          </ul>
        )}

        <TechnicalOnly>
          {activityCall ? (
            <div className="border-t border-rule px-5 py-2.5">
              <EndpointTag
                method={activityCall.method}
                endpoint={activityCall.endpoint}
                ms={activityCall.ms}
                scanned={activityCall.scanned}
              />
            </div>
          ) : null}
        </TechnicalOnly>
      </Panel>
    </>
  )
}

/* -------------------------------------------------------------------- row */

function Row({
  entry,
  isNew,
  mode,
}: {
  entry: ActivityEntry
  isNew: boolean
  mode: 'simple' | 'technical'
}) {
  return (
    <motion.li
      initial={isNew ? { opacity: 0, y: 4 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="grid gap-x-5 gap-y-2 border-b border-rule px-5 py-4 last:border-b-0 sm:grid-cols-[104px_minmax(0,1fr)]"
    >
      <div className="leading-tight">
        <Num size="sm" className="text-ink">
          {TIME_FMT.format(entry.ts)}
        </Num>
        <div className="mt-1 font-mono text-[10.5px] tabular-nums text-ink-3">
          {DATE_FMT.format(entry.ts)}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={toneFor(entry.action)}>{ACTION_LABEL[mode][entry.action]}</Chip>
          {entry.code ? (
            <Link
              to={`/registry?code=${encodeURIComponent(entry.code)}`}
              className="text-accent hover:underline"
            >
              <Mono className="border-accent-edge bg-accent-bg text-accent">{entry.code}</Mono>
            </Link>
          ) : null}
        </div>

        <p className="mt-2 max-w-[78ch] text-[13.5px] leading-relaxed text-ink">{entry.detail}</p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-2">
          <span>{entry.actor}</span>
          {entry.cpse ? (
            <>
              <span aria-hidden className="text-ink-3">
                /
              </span>
              <span>{entry.cpse}</span>
            </>
          ) : null}
          <TechnicalOnly>
            <span aria-hidden className="text-ink-3">
              /
            </span>
            <span className="font-mono text-[11px] text-ink-3">{entry.id}</span>
            {entry.endpoint ? (
              <span className="font-mono text-[11px] text-ink-3">{entry.endpoint}</span>
            ) : null}
          </TechnicalOnly>
        </div>
      </div>
    </motion.li>
  )
}
