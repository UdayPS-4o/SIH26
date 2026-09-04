/**
 * Overview.
 *
 * One argument in numbered beats, because a page of stacked panels with no stated
 * order reads as a set of unrelated widgets rather than as a case.
 *
 * The premise, in two sentences, so somebody arriving cold can say what the
 * product is for before meeting any of the machinery.
 *
 * 01 Add the fourth company. Three masters are already in; the fourth is dragged
 *    onto the page and run through the pipeline in front of the room, and the
 *    panel reports what the registry looked like before it and after it.
 * 02 One part, four names. Four raw ERP strings for one physical part, pulled
 *    from the registry that was just built, and three buttons that take them
 *    apart at the visitor's pace. Every string is editable, so the demo can be
 *    made to fail in public, and when it fails it says which attribute disagreed.
 * 03 What it adds up to. The same process, measured across everything loaded.
 *
 * Nothing on this page is a stored constant: the strings come from the registry,
 * the scores come from the match endpoint, the code comes from the minting
 * function, and the totals come from the dashboard.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowsMerge,
  ArrowUUpLeft,
  Barcode,
  CopySimple,
  PiggyBank,
  Stack,
  TextAa,
} from '@phosphor-icons/react'

import {
  AnimatedNumber,
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  IconTile,
  Label,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Skeleton,
  Stat,
  StatCell,
  StatRow,
  TextInput,
  VerdictChip,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import SourceLoader from '@/components/SourceLoader'
import { cx } from '@/components/ui/tokens'
import { useCopy } from '@/copy'
import { useIsTechnical } from '@/store/viewmode'
import { useService } from '@/store/service'
import {
  normalizeDescription,
  scorePair,
  type NormalizeResponse,
  type ScorePairResponse,
} from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { codeDerivation, mintCode } from '@/engine/cluster'
import { verdictFor } from '@/engine/score'
import { formatCount, formatExact, formatRupees } from '@/engine/savings'
import { CPSES } from '@/engine/corpus'
import {
  FAMILY_LABEL,
  type Cluster,
  type Expansion,
  type MaterialFamily,
  type Verdict,
} from '@/engine/types'

/* ------------------------------------------------------------------- motion */

function useReveal() {
  const reduced = useReducedMotion()
  return reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.12 },
      }
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -4 },
        transition: { duration: 0.2, ease: 'easeOut' as const },
      }
}

/* -------------------------------------------------------------------- page */

export default function OverviewPage() {
  const c = useCopy()
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const loadedCount = useService(s => s.dashboard?.loaded.length ?? 0)
  const empty = loadedCount === 0

  return (
    <>
      <PageHead title={c('overviewTitle')} lead={c('overviewLead')} />

      <div className="flex flex-col gap-10">
        {error ? <ErrorState message={c('errorGeneric')} onRetry={() => void refresh()} /> : null}

        <Premise />

        <Act
          step={1}
          heading={<ByMode simple="Add the fourth company" technical="Add a source master" />}
          body={
            <ByMode
              simple="Three companies are already in. Drag the fourth company's item list onto the panel below and watch what it changes — how many items the registry holds, how many national codes there are, and how many of those codes more than one company is now sharing."
              technical="Three masters are loaded. Drop the fourth extract to run it through the same seven stages: connect, extract, normalize, block, score, cluster, mint. Nothing fetches it for you — the file is read in this browser, and the panel reports the registry before and after."
            />
          }
        >
          <SourceLoader />
        </Act>

        {empty ? null : (
          <>
            <Act
              step={2}
              heading={<ByMode simple="One part, four names" technical="One part, four names" />}
              body={
                <ByMode
                  simple="Here is one item that turned up in more than one list. These are the four companies' own words for it, exactly as loaded. Change any line and run the three steps."
                  technical="Four raw material master lines for one physical part, taken from the registry that was just built. Every field is editable and each step is a separate call, so the demo can be made to fail in public and it says which attribute disagreed when it does."
                />
              }
            >
              <ResolverSection />
            </Act>

            <Act
              step={3}
              heading={<ByMode simple="What it adds up to" technical="What it adds up to" />}
              body={
                <ByMode
                  simple="The same three steps, applied to everything loaded so far."
                  technical="The same pipeline across the loaded corpus. Rates are measured on the records in front of you and applied to the full masters of the sources that have been loaded, and every figure names which of the two it is."
                />
              }
            >
              <ScaleSection />
            </Act>
          </>
        )}
      </div>
    </>
  )
}

/**
 * What this is, before anything has happened.
 *
 * The page used to open on a widget. Somebody arriving cold could work out what
 * each panel did and still not be able to say what the product was for, which is
 * the wrong way round: the sentence comes first and the machinery answers to it.
 */
function Premise() {
  return (
    <section className="border-l-2 border-accent pl-5">
      <p className="max-w-[74ch] font-display text-[19px] font-semibold leading-snug tracking-tight text-ink">
        <ByMode
          simple="Four government companies buy the same bearing. Each one calls it something different, so each one gave it its own code, and none of them can see the other three."
          technical="Four CPSEs hold separate material masters. The same physical part appears in all four under four descriptions, four local codes and four different units of measure, so it is tendered four times."
        />
      </p>
      <p className="mt-2.5 max-w-[74ch] text-[13.5px] leading-relaxed text-ink-2">
        <ByMode
          simple="This system reads all four lists, works out which items are the same thing, and gives each one a single national code. Once an item has one code, the four companies can see each other's stock and buy it together instead of four times over."
          technical="CodeOne normalizes each description against an MRO dictionary, extracts an attribute signature, scores candidate pairs within blocking keys, clusters what the scorer accepts, and mints a deterministic national code from the winning signature. What follows is that pipeline running on data loaded in front of you."
        />
      </p>
    </section>
  )
}

/* -------------------------------------------------------------------- acts */

/**
 * One beat of the argument this page makes.
 *
 * The three panels below were previously stacked with nothing to say why they
 * were in that order, which left the page reading as a set of unrelated widgets.
 * The numbering is the point: problem, cost, proof. A visitor who reads only the
 * three headings has still been told the whole thing.
 */
function Act({
  step,
  heading,
  body,
  children,
}: {
  step: number
  heading: ReactNode
  body: ReactNode
  children: ReactNode
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline gap-3 border-b border-rule pb-2">
        <Num size="sm" className="text-ink-3">
          {String(step).padStart(2, '0')}
        </Num>
        <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink">
          {heading}
        </h2>
      </div>
      <p className="mb-4 max-w-[80ch] text-[13.5px] leading-relaxed text-ink-2">{body}</p>
      {children}
    </section>
  )
}

/* --------------------------------------------------------------- resolver */

interface Row {
  cpse: string
  localCode: string
  description: string
  uom: string
}

interface MatchRow {
  cpse: string
  data: ScorePairResponse
  verdict: Verdict
}

/** Plain words for the attribute slots, so a failure reads as a sentence. */
const SLOT_WORD: Record<string, string> = {
  noun: 'what the item is',
  variant: 'the type',
  material: 'the material',
  grade: 'the grade',
  dimension: 'the size',
  rating: 'the rating',
  standard: 'the standard',
}

/** The slot words above are written to sit mid-sentence. Several of the messages
 *  start a sentence with one, which read as "...one thing. the size does not
 *  agree". */
function slotPhrase(slot: string, capitalise = false): string {
  const word = SLOT_WORD[slot] ?? slot
  return capitalise ? word.charAt(0).toUpperCase() + word.slice(1) : word
}

function familyWord(family: MaterialFamily): string {
  const label = FAMILY_LABEL[family].toLowerCase()
  if (label.includes(' ')) return label
  return label.endsWith('s') ? label.slice(0, -1) : label
}

function ResolverSection() {
  const c = useCopy()
  const clusters = useService(s => s.clusters)
  const ready = useService(s => s.ready)
  const accept = useService(s => s.accept)
  const review = useService(s => s.review)
  const reveal = useReveal()

  /** Largest bearings cluster, else the largest cluster in the registry. */
  const seed = useMemo(() => {
    if (clusters.length === 0) return null
    const largest = (list: Cluster[]) =>
      list.reduce<Cluster | null>(
        (best, cluster) => (!best || cluster.members.length > best.members.length ? cluster : best),
        null,
      )
    const bearings = clusters.filter(cl => cl.family === 'bearings' && cl.members.length > 1)
    const chosen = largest(bearings.length > 0 ? bearings : clusters)
    if (!chosen) return null
    return {
      cluster: chosen,
      rows: chosen.members.slice(0, 4).map<Row>(member => ({
        cpse: member.cpse,
        localCode: member.localCode,
        description: member.rawDescription,
        uom: member.rawUom,
      })),
    }
  }, [clusters])

  const [rows, setRows] = useState<Row[]>([])
  const [norms, setNorms] = useState<NormalizeResponse[] | null>(null)
  const [normMeta, setNormMeta] = useState<RequestMeta | null>(null)
  const [matches, setMatches] = useState<MatchRow[] | null>(null)
  const [matchMeta, setMatchMeta] = useState<RequestMeta | null>(null)
  const [minted, setMinted] = useState<{ signature: string; code: string; derivation: string } | null>(
    null,
  )
  const [busy, setBusy] = useState<'normalize' | 'match' | 'mint' | null>(null)
  const [stepError, setStepError] = useState<string | null>(null)

  // Reseed only when the registry hands over a different cluster, so a refresh
  // elsewhere in the application does not wipe what the visitor typed.
  const seededRef = useRef<string | null>(null)
  useEffect(() => {
    if (!seed) return
    if (seededRef.current === seed.cluster.code) return
    seededRef.current = seed.cluster.code
    setRows(seed.rows)
    setNorms(null)
    setMatches(null)
    setMinted(null)
    setStepError(null)
  }, [seed])

  const clearSteps = useCallback(() => {
    setNorms(null)
    setMatches(null)
    setMinted(null)
    setStepError(null)
  }, [])

  const editRow = useCallback(
    (index: number, patch: Partial<Row>) => {
      setRows(current => current.map((row, i) => (i === index ? { ...row, ...patch } : row)))
      clearSteps()
    },
    [clearSteps],
  )

  const runNormalize = useCallback(async () => {
    setBusy('normalize')
    setStepError(null)
    try {
      const results = await Promise.all(
        rows.map(row => normalizeDescription(row.description, row.uom)),
      )
      setNorms(results.map(result => result.data))
      setNormMeta(results[0]?.meta ?? null)
      setMatches(null)
      setMinted(null)
    } catch {
      setStepError(c('errorGeneric'))
    } finally {
      setBusy(null)
    }
  }, [rows, c])

  const runMatch = useCallback(async () => {
    setBusy('match')
    setStepError(null)
    try {
      const anchor = rows[0]
      const results = await Promise.all(
        rows
          .slice(1)
          .map(row =>
            scorePair(
              { description: anchor.description, uom: anchor.uom },
              { description: row.description, uom: row.uom },
            ),
          ),
      )
      setMatches(
        results.map((result, index) => ({
          cpse: rows[index + 1].cpse,
          data: result.data,
          verdict: verdictFor(result.data.breakdown.combined, accept, review),
        })),
      )
      setMatchMeta(results[0]?.meta ?? null)
      setMinted(null)
    } catch {
      setStepError(c('errorGeneric'))
    } finally {
      setBusy(null)
    }
  }, [rows, accept, review, c])

  const runMint = useCallback(async () => {
    if (!seed) return
    setBusy('mint')
    setStepError(null)
    try {
      const anchor = norms?.[0]?.normalized
        ? norms[0].normalized
        : (await normalizeDescription(rows[0].description, rows[0].uom)).data.normalized
      const family = seed.cluster.family
      setMinted({
        signature: anchor.signature,
        code: mintCode(family, anchor.signature),
        derivation: codeDerivation(family, anchor.signature),
      })
    } catch {
      setStepError(c('errorGeneric'))
    } finally {
      setBusy(null)
    }
  }, [seed, norms, rows, c])

  const reset = useCallback(() => {
    if (seed) setRows(seed.rows)
    clearSteps()
  }, [seed, clearSteps])

  if (!ready && clusters.length === 0) {
    return (
      <Panel>
        <Skeleton rows={6} />
      </Panel>
    )
  }

  if (!seed || rows.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="No grouped items to show yet"
          detail="The registry returned no groups, so there is nothing for the resolver to take apart."
        />
      </Panel>
    )
  }

  const canonicalUoms = norms ? [...new Set(norms.map(n => n.normalized.uom))] : []
  const firstConflict = matches?.find(m => m.data.conflicts.length > 0)?.data.conflicts[0] ?? null
  const worst: Verdict | null = matches
    ? matches.some(m => m.verdict === 'different')
      ? 'different'
      : matches.some(m => m.verdict === 'review')
        ? 'review'
        : 'same'
    : null

  return (
    <Panel flush>
      <PanelHead
        title={
          <ByMode simple="One part, four names" technical="Resolver: normalize, match, mint" />
        }
        meta={`${FAMILY_LABEL[seed.cluster.family]} / ${seed.cluster.members.length} entries`}
      />

      <div className="border-b border-rule px-5 py-4">
        <p className="max-w-[74ch] text-[13.5px] leading-relaxed text-ink-2">
          <ByMode
            simple="These four lines are how four different government companies wrote down the same physical part. Change any of them and run the three steps to see what happens."
            technical="Four raw material master lines for one part, as stored by four source systems. Every field is editable and each step is a separate call, so a bad input is visible rather than hidden."
          />
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="primary"
            icon={<TextAa size={16} weight="regular" />}
            onClick={() => void runNormalize()}
            disabled={busy !== null}
          >
            <ByMode simple="1. Clean up the names" technical="1. Normalize" />
          </Button>
          <Button
            icon={<ArrowsMerge size={16} weight="regular" />}
            onClick={() => void runMatch()}
            disabled={busy !== null || norms === null}
          >
            <ByMode simple="2. Compare them" technical="2. Match" />
          </Button>
          <Button
            icon={<Barcode size={16} weight="regular" />}
            onClick={() => void runMint()}
            disabled={busy !== null || matches === null}
          >
            <ByMode simple="3. Give it one code" technical="3. Mint" />
          </Button>
          <Button
            variant="ghost"
            icon={<ArrowUUpLeft size={16} weight="regular" />}
            onClick={reset}
            disabled={busy !== null}
          >
            Reset
          </Button>

          <ResolveFlow
            normalized={norms !== null}
            matched={matches !== null}
            minted={minted !== null}
          />
        </div>

        <TechnicalOnly>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
            {normMeta && norms ? (
              <EndpointTag
                method={normMeta.method}
                endpoint={normMeta.endpoint}
                ms={normMeta.ms}
                scanned={rows.length}
              />
            ) : null}
            {matchMeta && matches ? (
              <EndpointTag
                method={matchMeta.method}
                endpoint={matchMeta.endpoint}
                ms={matchMeta.ms}
                scanned={matches.length * 2}
              />
            ) : null}
          </div>
        </TechnicalOnly>

        {stepError ? (
          <div className="mt-3">
            <ErrorState message={stepError} />
          </div>
        ) : null}
      </div>

      <div className="divide-y divide-rule">
        {rows.map((row, index) => {
          const norm = norms?.[index]?.normalized ?? null
          const dictionarySize = norms?.[index]?.dictionarySize ?? 0
          const match = index === 0 ? null : (matches?.[index - 1] ?? null)

          return (
            <div key={`${row.cpse}-${index}`} className="px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex w-[92px] shrink-0 flex-col gap-0.5">
                  <Label>{row.cpse}</Label>
                  <TechnicalOnly>
                    <Num size="2xs" className="text-ink-3">
                      {row.localCode}
                    </Num>
                  </TechnicalOnly>
                </div>

                <TextInput
                  value={row.description}
                  onChange={event => editRow(index, { description: event.target.value })}
                  className="min-w-[220px] flex-1 font-mono text-[12.5px]"
                  aria-label={`Description as stored by ${row.cpse}`}
                  spellCheck={false}
                />
                <TextInput
                  value={row.uom}
                  onChange={event => editRow(index, { uom: event.target.value })}
                  className="w-[78px] shrink-0 font-mono text-[12.5px] uppercase"
                  aria-label={`Unit as stored by ${row.cpse}`}
                  spellCheck={false}
                />
              </div>

              <AnimatePresence initial={false}>
                {norm ? (
                  <motion.div key="norm" {...reveal} className="mt-3 border-l border-rule pl-3">
                    <MarkedDescription raw={norm.raw} expansions={norm.expansions} />

                    {norm.expansions.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-1">
                        {norm.expansions.map((expansion, i) => (
                          <li key={`${expansion.from}-${i}`} className="flex flex-wrap items-center gap-2">
                            <Num size="xs" className="text-attention">
                              {expansion.from}
                            </Num>
                            <ArrowRight size={16} weight="regular" className="shrink-0 text-ink-3" />
                            <Num size="xs" className="text-ink">
                              {expansion.to}
                            </Num>
                            <TechnicalOnly>
                              <span className="font-mono text-[10.5px] text-ink-3">
                                {expansion.rule}
                              </span>
                            </TechnicalOnly>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[12.5px] text-ink-2">
                        <ByMode
                          simple="No short forms in this line. It was already spelled out."
                          technical="No dictionary rule fired on this line."
                        />
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Label>unit</Label>
                      <Num size="xs" className="text-ink-2">
                        {row.uom.toUpperCase()}
                      </Num>
                      <ArrowRight size={16} weight="regular" className="shrink-0 text-ink-3" />
                      <Num size="xs" className="text-accent">
                        {norm.uom}
                      </Num>
                    </div>

                    <TechnicalOnly>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Label>signature</Label>
                        <Mono>{norm.signature || 'empty'}</Mono>
                        <span className="font-mono text-[10.5px] text-ink-3">
                          {formatExact(dictionarySize)} rules checked
                        </span>
                      </div>
                    </TechnicalOnly>
                  </motion.div>
                ) : null}

                {match ? (
                  <motion.div key="match" {...reveal} className="mt-3 border-l border-rule pl-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[12px] text-ink-2">
                        <ByMode
                          simple={`Compared with ${rows[0].cpse}`}
                          technical={`Scored against ${rows[0].cpse}`}
                        />
                      </span>
                      <VerdictChip
                        verdict={match.verdict}
                        label={
                          match.verdict === 'same'
                            ? c('verdictSame')
                            : match.verdict === 'review'
                              ? c('verdictReview')
                              : c('verdictDifferent')
                        }
                      />
                    </div>

                    <div className="mt-2 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-4">
                      <ScoreLine label={c('scoreLexical')} value={match.data.breakdown.lexical} />
                      <ScoreLine label={c('scoreAttribute')} value={match.data.breakdown.attribute} />
                      <ScoreLine label={c('scoreNumeric')} value={match.data.breakdown.numeric} />
                      <ScoreLine
                        label={c('scoreCombined')}
                        value={match.data.breakdown.combined}
                        tone={
                          match.verdict === 'same'
                            ? 'positive'
                            : match.verdict === 'review'
                              ? 'attention'
                              : 'negative'
                        }
                        strong
                      />
                    </div>

                    <TechnicalOnly>
                      <p className="mt-2 font-mono text-[11px] text-ink-3">{match.data.expression}</p>
                    </TechnicalOnly>

                    {match.verdict !== 'same' ? (
                      <FailureNote
                        match={match}
                        anchorCpse={rows[0].cpse}
                        accept={accept}
                        review={review}
                      />
                    ) : null}
                  </motion.div>
                ) : null}

                {index === 0 && minted ? (
                  <motion.div key="mint" {...reveal} className="mt-3 border-l border-accent-edge pl-3">
                    <TechnicalOnly>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Label>canonical signature</Label>
                        <Mono>{minted.signature || 'empty'}</Mono>
                      </div>
                    </TechnicalOnly>
                    <Num size="xl" className="text-accent">
                      {minted.code}
                    </Num>
                    <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-ink-2">
                      <ByMode
                        simple={`Same ${familyWord(seed.cluster.family)}. One code: ${minted.code}`}
                        technical={`One national code for the canonical signature. The same signature produces the same code on any machine, so the code is derived rather than assigned.`}
                      />
                    </p>
                    <TechnicalOnly>
                      <p className="mt-2 break-all font-mono text-[11px] text-ink-3">
                        {minted.derivation}
                      </p>
                    </TechnicalOnly>

                    {matches ? (
                      <ul className="mt-3 flex flex-col gap-1">
                        {matches.map((entry, i) => (
                          <li key={`${entry.cpse}-${i}`} className="flex flex-wrap items-center gap-2">
                            <Label>{entry.cpse}</Label>
                            <span className="text-[12.5px] text-ink-2">
                              {entry.verdict === 'same' ? (
                                <ByMode
                                  simple="joins this code"
                                  technical="folds into this code"
                                />
                              ) : entry.verdict === 'review' ? (
                                <ByMode
                                  simple="waiting for a person to decide"
                                  technical="held for review, below the accept threshold"
                                />
                              ) : (
                                <ByMode
                                  simple="stays separate, it is a different item"
                                  technical="excluded, scored below the review threshold"
                                />
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      <AnimatePresence initial={false}>
        {norms ? (
          <motion.div key="uom" {...reveal} className="border-t border-rule px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              {rows.map((row, index) => (
                <Num key={`${row.cpse}-uom-${index}`} size="sm" className="text-ink-2">
                  {row.uom.toUpperCase()}
                </Num>
              ))}
              <ArrowRight size={16} weight="regular" className="shrink-0 text-ink-3" />
              <Num
                size="sm"
                className={canonicalUoms.length === 1 ? 'text-accent' : 'text-attention'}
              >
                {canonicalUoms.join(' / ')}
              </Num>
            </div>
            <p className="mt-2 max-w-[74ch] text-[12.5px] leading-relaxed text-ink-2">
              {canonicalUoms.length === 1 ? (
                <ByMode
                  simple="Four ways of writing the same unit, collapsed into one. Half the problem is that nobody agreed on how to write a piece."
                  technical="Four raw unit strings map to one canonical unit of measure. Unit disagreement is resolved before scoring, so it cannot depress the attribute score."
                />
              ) : (
                <ByMode
                  simple="These units do not agree, so at least one of these lines is measuring something else."
                  technical="Raw units resolve to more than one canonical unit. The rows are not comparable on quantity."
                />
              )}
            </p>
          </motion.div>
        ) : null}

        {matches && worst ? (
          <motion.div
            key="summary"
            {...reveal}
            className={
              worst === 'same'
                ? 'border-t border-rule bg-positive-bg px-5 py-3'
                : worst === 'review'
                  ? 'border-t border-rule bg-attention-bg px-5 py-3'
                  : 'border-t border-rule bg-negative-bg px-5 py-3'
            }
          >
            <p
              className={
                worst === 'same'
                  ? 'text-[13px] text-positive'
                  : worst === 'review'
                    ? 'text-[13px] text-attention'
                    : 'text-[13px] text-negative'
              }
            >
              {worst === 'same' ? (
                <ByMode
                  simple={`All ${rows.length} lines are the same item.`}
                  technical={`All ${matches.length} pairs scored at or above the accept threshold of ${accept.toFixed(2)}.`}
                />
              ) : worst === 'review' ? (
                <ByMode
                  simple="Close, but not close enough to decide without a person looking at it."
                  technical={`At least one pair landed between the review threshold ${review.toFixed(2)} and the accept threshold ${accept.toFixed(2)}.`}
                />
              ) : firstConflict ? (
                <ByMode
                  simple={`These are not all the same item. ${slotPhrase(firstConflict.slot, true)} does not agree: ${firstConflict.left} against ${firstConflict.right}.`}
                  technical={`Rejected on attribute slot ${firstConflict.slot}: "${firstConflict.left}" against "${firstConflict.right}". No code is minted across a hard attribute conflict.`}
                />
              ) : (
                <ByMode
                  simple="These are not all the same item. The lines share too little to be treated as one thing."
                  technical={`At least one pair scored below the review threshold of ${review.toFixed(2)} with no overlapping attribute slot to conflict on.`}
                />
              )}
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  )
}

/**
 * Compact progress strip for the three real resolver stages.
 *
 * Each node is honest about the component's own state — it lights up once
 * `norms`/`matches`/`minted` is actually populated, and never before, so this
 * cannot drift into a fabricated "processing" animation.
 */
function ResolveFlow({
  normalized,
  matched,
  minted,
}: {
  normalized: boolean
  matched: boolean
  minted: boolean
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <ResolveFlowNode icon={<TextAa size={15} weight="regular" />} active={normalized} />
      <ResolveFlowLine active={normalized} />
      <ResolveFlowNode icon={<ArrowsMerge size={15} weight="regular" />} active={matched} />
      <ResolveFlowLine active={matched} />
      <ResolveFlowNode icon={<Barcode size={15} weight="regular" />} active={minted} />
    </div>
  )
}

function ResolveFlowNode({ icon, active }: { icon: ReactNode; active: boolean }) {
  return <IconTile icon={icon} tone={active ? 'primary' : 'neutral'} size="sm" />
}

function ResolveFlowLine({ active }: { active: boolean }) {
  return <span className={cx('h-px w-5 shrink-0', active ? 'bg-primary' : 'bg-rule')} />
}

/** Raw string with every token the dictionary expanded marked in place. */
function MarkedDescription({ raw, expansions }: { raw: string; expansions: Expansion[] }) {
  const expanded = new Set(expansions.map(expansion => expansion.from))
  const parts = raw.split(/([\s,;:/\\()[\]"']+)/)

  return (
    <p className="font-mono text-[12.5px] leading-relaxed text-ink">
      {parts.map((part, index) => {
        const key = part.replace(/^[.\-]+|[.\-]+$/g, '').toUpperCase()
        return expanded.has(key) ? (
          <mark key={index} className="bg-attention-bg px-0.5 text-attention">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      })}
    </p>
  )
}

function ScoreLine({
  label,
  value,
  tone = 'accent',
  strong,
}: {
  label: string
  value: number
  tone?: 'accent' | 'positive' | 'attention' | 'negative'
  strong?: boolean
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className={strong ? 'text-[12px] text-ink' : 'text-[12px] text-ink-2'}>{label}</span>
        <Num size="sm" className={strong ? 'text-ink' : 'text-ink-2'}>
          {value.toFixed(2)}
        </Num>
      </div>
      <div className="mt-1.5">
        <Meter value={value} tone={tone} />
      </div>
    </div>
  )
}

function FailureNote({
  match,
  anchorCpse,
  accept,
  review,
}: {
  match: MatchRow
  anchorCpse: string
  accept: number
  review: number
}) {
  const conflict = match.data.conflicts[0] ?? null
  const rejected = match.verdict === 'different'
  const wrapper = rejected
    ? 'mt-3 border border-negative bg-negative-bg px-3 py-2'
    : 'mt-3 border border-attention-edge bg-attention-bg px-3 py-2'
  const text = rejected ? 'text-[12.5px] leading-relaxed text-negative' : 'text-[12.5px] leading-relaxed text-attention'

  return (
    <div className={wrapper}>
      <p className={text}>
        {rejected ? (
          conflict ? (
            <ByMode
              simple={`Not the same item as the ${anchorCpse} line. ${slotPhrase(conflict.slot, true)} does not agree: ${conflict.left} against ${conflict.right}.`}
              technical={`Below the review threshold of ${review.toFixed(2)}. Conflict on slot ${conflict.slot}: "${conflict.left}" against "${conflict.right}".`}
            />
          ) : (
            <ByMode
              simple={`Not the same item as the ${anchorCpse} line. The two lines have almost nothing in common.`}
              technical={`Below the review threshold of ${review.toFixed(2)}. No shared attribute slot and low token overlap.`}
            />
          )
        ) : conflict ? (
          <ByMode
            simple={`Probably the same as the ${anchorCpse} line, but ${slotPhrase(conflict.slot)} does not agree: ${conflict.left} against ${conflict.right}. A person has to decide.`}
            technical={`Between the review threshold ${review.toFixed(2)} and the accept threshold ${accept.toFixed(2)}. Conflict on slot ${conflict.slot}: "${conflict.left}" against "${conflict.right}".`}
          />
        ) : (
          <ByMode
            simple={`Probably the same as the ${anchorCpse} line, but not certain enough. A person has to decide.`}
            technical={`Between the review threshold ${review.toFixed(2)} and the accept threshold ${accept.toFixed(2)}. No hard attribute conflict, the shortfall is in token overlap.`}
          />
        )}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Label>combined</Label>
        <Num size="xs" className={rejected ? 'text-negative' : 'text-attention'}>
          {match.data.breakdown.combined.toFixed(3)}
        </Num>
        <Chip tone="neutral">
          <ByMode
            simple={`needs ${accept.toFixed(2)}`}
            technical={`accept ${accept.toFixed(2)}`}
          />
        </Chip>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ scale */

function ScaleSection() {
  const dashboard = useService(s => s.dashboard)
  const savings = useService(s => s.savings)
  const lastCall = useService(s => s.lastCall)
  const technical = useIsTechnical()

  if (!dashboard || !savings) {
    return (
      <Panel>
        <Skeleton rows={3} />
      </Panel>
    )
  }

  const oneIn = dashboard.duplicateRecords > 0
    ? Math.round(dashboard.totalRecords / dashboard.duplicateRecords)
    : 0
  const duplicateShare =
    dashboard.totalRecords > 0 ? (dashboard.duplicateRecords / dashboard.totalRecords) * 100 : 0
  // Only the organisations whose master is in, so the note under the headline
  // never names a source the number does not include.
  const companies = dashboard.loaded.length > 0 ? dashboard.loaded : CPSES.map(c => c.code)
  const companyList =
    companies.length > 1
      ? `${companies.slice(0, -1).join(', ')} and ${companies[companies.length - 1]}`
      : companies[0]
  const meta = lastCall.dashboard

  return (
    <section>
      <StatRow>
        <StatCell>
          <Stat
            value={<AnimatedNumber value={dashboard.totalRecords} format={formatCount} />}
            label={technical ? 'Records ingested' : 'Items read'}
            icon={<Stack size={16} weight="regular" />}
            note={
              <ByMode
                simple={`Item lists from ${companyList}.`}
                technical={`${companies.length} material master${companies.length === 1 ? '' : 's'}: ${companyList}.`}
              />
            }
          />
        </StatCell>

        <StatCell>
          <Stat
            value={<AnimatedNumber value={dashboard.duplicateRecords} format={formatCount} />}
            label={technical ? 'Duplicate records' : 'Repeats found'}
            icon={<CopySimple size={16} weight="regular" />}
            tone="attention"
            note={
              <ByMode
                simple={`About 1 in ${oneIn} items already exists somewhere else.`}
                technical={`${duplicateShare.toFixed(1)}% of the corpus, from the rate measured on the inspectable slice.`}
              />
            }
          />
        </StatCell>

        <StatCell>
          <Stat
            value={<AnimatedNumber value={dashboard.distinctCodes} format={formatExact} />}
            label={technical ? 'Distinct national codes' : 'National codes issued'}
            icon={<Barcode size={16} weight="regular" />}
            note={
              <ByMode
                simple={`One code for each distinct item in the ${formatExact(dashboard.sampleSize)} record slice anyone can open and check.`}
                technical={`Connected components over accepted pairs across ${formatExact(dashboard.sampleSize)} inspectable records.`}
              />
            }
          />
        </StatCell>

        <StatCell>
          <Stat
            value={<AnimatedNumber value={savings.annualSaving} format={formatRupees} />}
            label={technical ? 'Annual saving' : 'Saving each year'}
            icon={<PiggyBank size={16} weight="regular" />}
            tone="positive"
            emphasis
            note={
              <ByMode
                simple="If the repeats are bought together instead of four times over."
                technical="If the repeats are bought together. Every assumption behind this figure is editable on the analytics page."
              />
            }
          />
        </StatCell>
      </StatRow>

      <TechnicalOnly>
        {meta ? (
          <div className="mt-2">
            <EndpointTag
              method={meta.method}
              endpoint={meta.endpoint}
              ms={meta.ms}
              scanned={meta.scanned}
            />
          </div>
        ) : null}
      </TechnicalOnly>
    </section>
  )
}

