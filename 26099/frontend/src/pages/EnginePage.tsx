/**
 * Engine configuration.
 *
 * Two jobs in one page. It is the operator's console for the weights, thresholds
 * and dictionary the harmonization service runs on, and it is the method statement:
 * the one place the pipeline is described in full, in order, with the arithmetic
 * that produced every number on it.
 *
 * The description below is written against the service implementation, not against
 * an idea of it. Where the two would disagree the description gives way.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowCounterClockwise,
  BookOpen,
  ChartBar,
  Funnel,
  Hash,
  MagnifyingGlass,
  PlugsConnected,
  Plus,
  Scales,
  Sliders,
  Stack,
  Textbox,
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
  Panel,
  PanelHead,
  PageHead,
  Select,
  Skeleton,
  Slider,
  Table,
  Td,
  Th,
  TextInput,
} from '@/components/ui'
import { ByMode } from '@/components/Gate'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { API_BASE, IS_LIVE, subscribeRequestLog, type RequestMeta } from '@/api/client'
import { fetchDictionary, updateWeights } from '@/api/endpoints'
import { BASE_RULES, type DictionaryRule } from '@/engine/dictionary'
import { DEFAULT_ACCEPT, DEFAULT_REVIEW, DEFAULT_WEIGHTS, rebalance } from '@/engine/score'
import { ATTRIBUTE_SLOTS, type AttributeSlot, type ScoringWeights } from '@/engine/types'

/* ------------------------------------------------------------------ helpers */

const inr = (n: number) => n.toLocaleString('en-IN')

/** Pairwise comparison count for n records. */
const pairwise = (n: number) => (n * (n - 1)) / 2

/** Short scientific form, for counts too large to read as digits. */
function sci(n: number): string {
  if (n <= 0) return '0'
  const exponent = Math.floor(Math.log10(n))
  return `${(n / 10 ** exponent).toFixed(1)} x 10^${exponent}`
}

const HIST_FLOOR = 0.45
const HIST_CEIL = 1
const HIST_BUCKETS = 20

const pct = (value: number) =>
  Math.max(0, Math.min(100, ((value - HIST_FLOOR) / (HIST_CEIL - HIST_FLOOR)) * 100))

/* -------------------------------------------------------------- local parts */

/** One step of the pipeline. Numbered, because the order is the method. */
function Step({
  index,
  icon,
  title,
  call,
  cost,
  children,
}: {
  index: number
  icon: ReactNode
  title: string
  call?: ReactNode
  cost: ReactNode
  children: ReactNode
}) {
  return (
    <li className="flex gap-4 border-t border-rule px-5 py-4 first:border-t-0">
      <div className="flex w-5 shrink-0 flex-col items-center gap-2.5 pt-1">
        <Num size="xs" className="text-ink-3">
          {index}
        </Num>
        <span className="text-ink-3">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h3 className="font-display text-[13.5px] font-semibold tracking-tight text-ink">{title}</h3>
          {call}
        </div>
        <div className="mt-2 space-y-2 text-[13px] leading-relaxed text-ink-2">{children}</div>
        <p className="mt-3 border-l border-rule-strong pl-3 text-[12.5px] leading-relaxed text-ink-3">
          Cost: {cost}
        </p>
      </div>
    </li>
  )
}

/** A figure with its meaning under it, for the live band readout. */
function Readout({ value, label, tone }: { value: ReactNode; label: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <Num size="lg" className={tone ?? 'text-ink'}>
        {value}
      </Num>
      <div className="mt-1 text-[12px] leading-snug text-ink-2">{label}</div>
    </div>
  )
}

/* ------------------------------------------------------------------- page */

export default function EnginePage() {
  const c = useCopy()
  const reduceMotion = useReducedMotion()

  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const refresh = useService(s => s.refresh)
  const records = useService(s => s.records)
  const pairs = useService(s => s.pairs)
  const clusters = useService(s => s.clusters)
  const health = useService(s => s.health)
  const dashboard = useService(s => s.dashboard)
  const lastCall = useService(s => s.lastCall)
  const storeWeights = useService(s => s.weights)
  const storeAccept = useService(s => s.accept)
  const storeReview = useService(s => s.review)
  const setWeight = useService(s => s.setWeight)
  const setThresholds = useService(s => s.setThresholds)
  const addRule = useService(s => s.addRule)
  const resetSession = useService(s => s.reset)

  /* ------------------------------------------------------------- the dials */

  // Drafts so a drag reads back instantly. The service is told at the end of the
  // gesture, and its answer overwrites the draft, so the two cannot diverge.
  const [draftWeights, setDraftWeights] = useState<ScoringWeights>(storeWeights)
  const [draftAccept, setDraftAccept] = useState(storeAccept)
  const [draftReview, setDraftReview] = useState(storeReview)

  const dragging = useRef(false)
  const commitTimer = useRef<number | null>(null)

  useEffect(() => {
    if (dragging.current) return
    setDraftWeights(storeWeights)
    setDraftAccept(storeAccept)
    setDraftReview(storeReview)
  }, [storeWeights, storeAccept, storeReview])

  useEffect(
    () => () => {
      if (commitTimer.current !== null) window.clearTimeout(commitTimer.current)
    },
    [],
  )

  const commit = useCallback((send: () => void) => {
    dragging.current = true
    if (commitTimer.current !== null) window.clearTimeout(commitTimer.current)
    commitTimer.current = window.setTimeout(() => {
      dragging.current = false
      send()
    }, 160)
  }, [])

  const onWeight = useCallback(
    (key: keyof ScoringWeights, value: number) => {
      setDraftWeights(current => rebalance(current, key, value))
      commit(() => void setWeight(key, value))
    },
    [commit, setWeight],
  )

  const onAccept = useCallback(
    (value: number) => {
      const nextReview = Math.min(draftReview, Math.round((value - 0.01) * 100) / 100)
      setDraftAccept(value)
      setDraftReview(nextReview)
      commit(() => void setThresholds(value, nextReview))
    },
    [commit, draftReview, setThresholds],
  )

  const onReview = useCallback(
    (value: number) => {
      const nextReview = Math.min(value, Math.round((draftAccept - 0.01) * 100) / 100)
      setDraftReview(nextReview)
      commit(() => void setThresholds(draftAccept, nextReview))
    },
    [commit, draftAccept, setThresholds],
  )

  const restoreDefaults = useCallback(async () => {
    dragging.current = false
    if (commitTimer.current !== null) window.clearTimeout(commitTimer.current)
    await updateWeights(DEFAULT_WEIGHTS)
    // setThresholds refreshes, which pulls the restored weights back into the store.
    await setThresholds(DEFAULT_ACCEPT, DEFAULT_REVIEW)
  }, [setThresholds])

  const weightSum = draftWeights.lexical + draftWeights.attribute + draftWeights.numeric
  const atDefaults =
    draftWeights.lexical === DEFAULT_WEIGHTS.lexical &&
    draftWeights.attribute === DEFAULT_WEIGHTS.attribute &&
    draftWeights.numeric === DEFAULT_WEIGHTS.numeric &&
    draftAccept === DEFAULT_ACCEPT &&
    draftReview === DEFAULT_REVIEW

  /* --------------------------------------------------------------- bands */

  const bands = useMemo(() => {
    let accepted = 0
    let review = 0
    let below = 0
    for (const pair of pairs) {
      if (pair.score.combined >= draftAccept) accepted += 1
      else if (pair.score.combined >= draftReview) review += 1
      else below += 1
    }
    return { accepted, review, below }
  }, [pairs, draftAccept, draftReview])

  const histogram = useMemo(() => {
    const width = (HIST_CEIL - HIST_FLOOR) / HIST_BUCKETS
    const buckets = Array.from({ length: HIST_BUCKETS }, (_, i) => ({
      from: HIST_FLOOR + i * width,
      to: HIST_FLOOR + (i + 1) * width,
      count: 0,
    }))
    for (const pair of pairs) {
      const value = pair.score.combined
      if (value < HIST_FLOOR) continue
      const slot = Math.min(HIST_BUCKETS - 1, Math.floor((value - HIST_FLOOR) / width))
      buckets[slot].count += 1
    }
    return buckets
  }, [pairs])

  const peak = Math.max(1, ...histogram.map(b => b.count))

  const multiMember = clusters.filter(cluster => cluster.members.length > 1).length

  /* ---------------------------------------------------------- dictionary */

  const [rules, setRules] = useState<DictionaryRule[] | null>(null)
  const [dictMeta, setDictMeta] = useState<RequestMeta | null>(null)
  const [dictError, setDictError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  // useCopy returns a fresh closure every render. Holding it in a ref keeps the
  // loader identity stable, so the mount effect fires once instead of on every
  // render, which would put the dictionary call into the request log sixty times.
  const copyRef = useRef(c)
  copyRef.current = c

  const loadDictionary = useCallback(async () => {
    try {
      setDictError(null)
      const result = await fetchDictionary()
      setRules(result.data.rules)
      setDictMeta(result.meta)
    } catch (err) {
      setDictError(err instanceof Error ? err.message : copyRef.current('errorGeneric'))
    }
  }, [])

  useEffect(() => {
    void loadDictionary()
  }, [loadDictionary])

  const [token, setToken] = useState('')
  const [expansion, setExpansion] = useState('')
  const [slot, setSlot] = useState<AttributeSlot | 'none'>('noun')
  const [source, setSource] = useState<DictionaryRule['source']>('MRO')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const cleanToken = token.trim().toUpperCase()
  const shadows = Boolean(cleanToken) && (rules ?? []).some(rule => rule.token === cleanToken)

  const submitRule = useCallback(async () => {
    const value = token.trim().toUpperCase()
    const target = expansion.trim().toUpperCase()
    if (!value) {
      setFormError('A rule needs a token.')
      return
    }
    if (/\s/.test(value)) {
      setFormError('A token is one word. Add one rule per token.')
      return
    }
    if (!target) {
      setFormError('A rule needs an expansion.')
      return
    }
    setFormError(null)
    setSaving(true)
    try {
      await addRule({ token: value, expansion: target, slot: slot === 'none' ? null : slot, source })
      await loadDictionary()
      setToken('')
      setExpansion('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : copyRef.current('errorGeneric'))
    } finally {
      setSaving(false)
    }
  }, [addRule, expansion, loadDictionary, slot, source, token])

  const filteredRules = useMemo(() => {
    const list = (rules ?? []).map((rule, index) => ({ rule, runtime: index >= BASE_RULES.length }))
    const needle = query.trim().toUpperCase()
    if (!needle) return list
    return list.filter(
      entry =>
        entry.rule.token.includes(needle) ||
        entry.rule.expansion.includes(needle) ||
        (entry.rule.slot ?? '').toUpperCase().includes(needle),
    )
  }, [rules, query])

  const runtimeCount = rules ? Math.max(0, rules.length - BASE_RULES.length) : 0

  /* --------------------------------------------------------- request log */

  const [log, setLog] = useState<RequestMeta[]>([])
  useEffect(() => subscribeRequestLog(setLog), [])

  /* --------------------------------------------------------------- reset */

  const [confirmingReset, setConfirmingReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const doReset = useCallback(async () => {
    setResetting(true)
    try {
      await resetSession()
      await loadDictionary()
      setConfirmingReset(false)
    } finally {
      setResetting(false)
    }
  }, [loadDictionary, resetSession])

  /* --------------------------------------------------------------- gates */

  if (error) {
    return (
      <>
        <PageHead title={c('engineTitle')} lead={c('engineLead')} />
        <ErrorState message={error} onRetry={() => void refresh()} />
      </>
    )
  }

  if (!ready) {
    return (
      <>
        <PageHead title={c('engineTitle')} lead={c('engineLead')} />
        <div className="space-y-6">
          <Panel>
            <Skeleton rows={6} />
          </Panel>
          <Panel>
            <Skeleton rows={4} />
          </Panel>
        </div>
      </>
    )
  }

  const sliceComparisons = pairwise(records.length)
  const corpusComparisons = dashboard ? pairwise(dashboard.totalRecords) : null

  return (
    <>
      <PageHead
        title={c('engineTitle')}
        lead={c('engineLead')}
        aside={
          <div className="text-right">
            <Label>Resolver</Label>
            <div className="mt-1.5">
              <Chip tone={IS_LIVE ? 'accent' : 'neutral'}>{IS_LIVE ? 'network' : 'in-process'}</Chip>
            </div>
            <p className="mt-2 max-w-[24ch] text-[11.5px] leading-snug text-ink-3">
              {IS_LIVE
                ? `Calls go over HTTP to ${API_BASE}.`
                : `Calls resolve against the embedded service core. Same request and response shapes as ${API_BASE}.`}
            </p>
          </div>
        }
      />

      <div className="space-y-6">
        {/* ---------------------------------------------------------- method */}
        <Panel flush>
          <PanelHead
            title="Method"
            meta="normalize, block, score, cluster, mint"
            action={
              <span className="text-[11.5px] text-ink-3">
                <ByMode
                  simple="This is what the system does, step by step."
                  technical="Stated once. Every other page renders a result of this pipeline."
                />
              </span>
            }
          />

          <ol className="list-none">
            <Step
              index={1}
              icon={<Textbox size={16} weight="regular" />}
              title="Normalize"
              call={<EndpointTag method="POST" endpoint="/normalize" ms={dictMeta?.ms ?? 0} />}
              cost={
                <>
                  One pass per record, linear in token count. The dictionary is rebuilt as a hash
                  index on every call, so a runtime rule takes effect on the next request rather
                  than the next restart.
                </>
              }
            >
              <p>
                The raw description is uppercased and split on whitespace and punctuation, keeping
                internal hyphens and dots so a part number such as <Mono>6205-2RS</Mono> survives as
                one token. Each token is looked up in the dictionary, currently{' '}
                <Num size="sm">{rules ? inr(rules.length) : inr(BASE_RULES.length)}</Num> rules
                (<Num size="sm">{inr(BASE_RULES.length)}</Num> base
                {runtimeCount > 0 ? (
                  <>
                    {' '}
                    and <Num size="sm">{inr(runtimeCount)}</Num> added in this session
                  </>
                ) : null}
                ). A matched rule contributes its expanded words to the token stream and claims its
                attribute slot if that slot is still empty. Rules sourced from the unit-of-measure
                list are dropped from the stream instead, because a unit written inside a
                description carries no descriptive weight.
              </p>
              <p>
                Shape heuristics then run over the tokens the dictionary did not match, filling
                whichever of dimension, rating, grade and noun are still empty. Running them second
                is what stops <Mono>BALL BEARING</Mono> from recording BALL as its noun merely
                because BALL came first.
              </p>
              <p>
                The seven attribute slots, in the order they are concatenated into the canonical
                signature:{' '}
                {ATTRIBUTE_SLOTS.map((name, index) => (
                  <span key={name}>
                    {index > 0 ? ', ' : ''}
                    <Mono>{name}</Mono>
                  </span>
                ))}
                . Empty slots are skipped, so a record that omits a rating lands on the same
                signature as one that states nothing in its place.
              </p>
            </Step>

            <Step
              index={2}
              icon={<Funnel size={16} weight="regular" />}
              title="Block"
              call={
                lastCall.proposals ? (
                  <EndpointTag
                    method={lastCall.proposals.method}
                    endpoint={lastCall.proposals.endpoint}
                    ms={lastCall.proposals.ms}
                    scanned={lastCall.proposals.scanned}
                  />
                ) : undefined
              }
              cost={
                <>
                  Linear to build the buckets, then pairwise inside each bucket. A token shared by
                  more than 150 records in one family is treated as behaving like a stop word and
                  its bucket is skipped, because expanding it costs quadratic time for candidates
                  the scorer rejects anyway.
                </>
              }
            >
              <p>
                Two records only become a candidate pair when they share a family and at least one
                significant token of more than two characters. The reason is arithmetic:{' '}
                <Num size="sm">{inr(records.length)}</Num> records compared pairwise is{' '}
                <Num size="sm">{inr(sliceComparisons)}</Num> comparisons, which is tractable.
                {corpusComparisons ? (
                  <>
                    {' '}
                    At the full <Num size="sm">{inr(dashboard!.totalRecords)}</Num> records it would
                    be about <Num size="sm">{sci(corpusComparisons)}</Num> comparisons, which is
                    not. Blocking is the difference between the two.
                  </>
                ) : null}
              </p>
              <p>
                Two further filters apply. Only records from different{' '}
                <ByMode simple="government companies" technical="CPSEs" /> are compared, because
                cross-organisation duplication is the problem being solved and within-organisation
                duplication is a separate one. And a pair scoring below{' '}
                <Num size="sm">{HIST_FLOOR.toFixed(2)}</Num> is discarded rather than surfaced, so
                the queue stays honest rather than long. Everything charted below sits above that
                floor.
              </p>
            </Step>

            <Step
              index={3}
              icon={<Scales size={16} weight="regular" />}
              title="Score"
              call={<EndpointTag method="POST" endpoint="/match/score" ms={lastCall.proposals?.ms ?? 0} />}
              cost={
                <>
                  Three set operations per candidate pair, plus one slot walk over seven slots.{' '}
                  <Num size="sm">{inr(pairs.length)}</Num> candidates survive blocking at the
                  current settings.
                </>
              }
            >
              <p>
                <strong className="font-semibold text-ink">Lexical</strong> is token overlap over the
                union, that is Jaccard, computed on the expanded tokens with stop words and
                single-character tokens removed.
              </p>
              <p>
                <strong className="font-semibold text-ink">Attribute</strong> is agreement across
                the filled slots. A slot both records fill and agree on scores 1 and counts 1
                against the total. A slot only one record fills scores 0.5 and counts 1, because
                silence is weaker evidence of disagreement than a contradiction. A slot both records
                fill and disagree on scores 0 and counts 2, so a contradiction costs double. A slot
                neither record fills is ignored entirely. That asymmetry is deliberate: a 100 NB
                valve and a 150 NB valve should not reach a review queue.
              </p>
              <p>
                <strong className="font-semibold text-ink">Numeric</strong> is Jaccard over every
                number found in the dimension, rating, grade and standard slots and in the
                normalized tokens. It has two fallbacks: when neither record states any number it
                returns 0.50, and when exactly one does it returns 0.35, rather than a zero that
                would read as a contradiction the records never made.
              </p>
              <p>
                Each sub-score is rounded to two decimals <em className="not-italic underline decoration-rule-strong underline-offset-2">before</em>{' '}
                the weighted sum is taken, so the arithmetic printed on a pair card is the
                arithmetic the service performed. The combination is{' '}
                <Mono>
                  {draftWeights.lexical.toFixed(2)} x lexical + {draftWeights.attribute.toFixed(2)} x
                  attribute + {draftWeights.numeric.toFixed(2)} x numeric
                </Mono>
                , and the weights always sum to <Num size="sm">1.00</Num>.
              </p>
            </Step>

            <Step
              index={4}
              icon={<Stack size={16} weight="regular" />}
              title="Cluster"
              call={
                lastCall.registry ? (
                  <EndpointTag
                    method={lastCall.registry.method}
                    endpoint={lastCall.registry.endpoint}
                    ms={lastCall.registry.ms}
                    scanned={lastCall.registry.scanned}
                  />
                ) : undefined
              }
              cost={
                <>
                  Union-find with path compression over the accepted pairs, near-linear in the
                  number of records. <Num size="sm">{inr(clusters.length)}</Num> connected
                  components at the current thresholds.
                </>
              }
            >
              <p>
                Every pair at or above the accept threshold unions its two records. A cluster is a
                connected component of that graph, and its representative is the member with the
                longest signature, since the most completely described record is the best basis for
                a standard description.
              </p>
              <p>
                A human decision overrides the score in both directions. An approved pair unions
                even when it scores below accept. A rejected pair is skipped even when it scores
                above accept, and that rejection holds through every later run: the operator has
                overruled the arithmetic, and the arithmetic does not get to argue back.
              </p>
            </Step>

            <Step
              index={5}
              icon={<Hash size={16} weight="regular" />}
              title="Mint"
              cost={
                <>
                  One 32-bit hash per cluster over a signature string of a few dozen characters.
                  Negligible next to the four steps above.
                </>
              }
            >
              <p>
                The national code is <Mono>CNMC</Mono>, a two-letter family prefix, and the first
                four hex characters of an FNV-1a hash of the canonical signature. It is a pure
                function of the signature: the same signature yields the same code on any machine,
                in any order, in any run. Codes are not allocated from a counter and they do not
                depend on which record happened to be read first.
              </p>
            </Step>
          </ol>
        </Panel>

        {/* ----------------------------------------------------------- dials */}
        <Panel flush>
          <PanelHead
            title="Weights and thresholds"
            meta="PUT /match/weights, PUT /match/thresholds"
            action={
              <Button
                size="sm"
                onClick={() => void restoreDefaults()}
                disabled={atDefaults}
                icon={<ArrowCounterClockwise size={16} weight="regular" />}
              >
                Reset to defaults
              </Button>
            }
          />

          <div className="grid gap-px bg-rule lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
            <div className="bg-surface px-5 py-4">
              <div className="flex items-center gap-2">
                <Sliders size={16} weight="regular" className="text-ink-3" />
                <Label>Sub-score weights</Label>
              </div>

              <div className="mt-4 space-y-4">
                <Slider
                  label={c('scoreLexical')}
                  value={draftWeights.lexical}
                  onChange={value => onWeight('lexical', value)}
                  hint="Shared expanded tokens over the union of both token sets."
                />
                <Slider
                  label={c('scoreAttribute')}
                  value={draftWeights.attribute}
                  onChange={value => onWeight('attribute', value)}
                  hint="Slot agreement, with contradictions counting double against the total."
                />
                <Slider
                  label={c('scoreNumeric')}
                  value={draftWeights.numeric}
                  onChange={value => onWeight('numeric', value)}
                  hint="Shared numbers over the union of both number sets."
                />
              </div>

              <div className="mt-4 flex items-baseline justify-between border-t border-rule pt-3">
                <span className="text-[12.5px] text-ink-2">
                  Sum, held at one by redistributing across the other two
                </span>
                <Num size="sm" className="text-ink">
                  {weightSum.toFixed(2)}
                </Num>
              </div>

              <div className="mt-5 flex items-center gap-2 border-t border-rule pt-4">
                <Funnel size={16} weight="regular" className="text-ink-3" />
                <Label>Decision thresholds</Label>
              </div>

              <div className="mt-4 space-y-4">
                <Slider
                  label="Accept"
                  value={draftAccept}
                  onChange={onAccept}
                  min={0.5}
                  max={1}
                  hint="At or above this a pair is treated as the same item without a human."
                />
                <Slider
                  label="Review"
                  value={draftReview}
                  onChange={onReview}
                  min={HIST_FLOOR}
                  max={0.99}
                  hint="Between the two a pair waits for a decision. Held below accept."
                />
              </div>
            </div>

            <div className="bg-surface px-5 py-4">
              <Label>Result at these settings</Label>

              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-5">
                <Readout
                  value={inr(bands.accepted)}
                  label="pairs at or above accept, resolved without a person"
                  tone="text-accent"
                />
                <Readout
                  value={inr(bands.review)}
                  label="pairs between the thresholds, waiting for a decision"
                  tone="text-attention"
                />
                <Readout
                  value={inr(bands.below)}
                  label="pairs below review, surfaced but not proposed"
                  tone="text-ink-3"
                />
                <Readout value={inr(pairs.length)} label="candidate pairs after blocking" />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-rule pt-4">
                <Readout
                  value={inr(health?.distinctCodes ?? clusters.length)}
                  label="clusters, and therefore national codes: one cluster mints exactly one code, so the two counts are the same number"
                />
                <Readout
                  value={inr(multiMember)}
                  label="clusters holding more than one record, the ones that represent a duplicate"
                />
              </div>

              <p className="mt-5 border-t border-rule pt-3 text-[12px] leading-relaxed text-ink-3">
                Every figure here is recomputed by the service over{' '}
                <Num size="xs">{inr(records.length)}</Num> records each time a dial moves. The band
                counts follow the thresholds immediately; the pair scores themselves change only
                after the service answers the weight change.
              </p>
            </div>
          </div>
        </Panel>

        {/* ------------------------------------------------------- histogram */}
        <Panel flush>
          <PanelHead
            title="Score distribution"
            meta={`${HIST_BUCKETS} buckets, ${HIST_FLOOR.toFixed(2)} to ${HIST_CEIL.toFixed(2)}`}
            action={
              <span className="flex items-center gap-2 text-ink-3">
                <ChartBar size={16} weight="regular" />
              </span>
            }
          />

          <div className="px-5 py-5">
            {pairs.length === 0 ? (
              <EmptyState
                title="No candidate pairs to chart"
                detail={c('emptyProposals')}
                action={
                  <Button size="sm" onClick={() => void restoreDefaults()}>
                    Reset to defaults
                  </Button>
                }
              />
            ) : (
              <>
                <div className="relative">
                  <div className="flex h-[170px] items-end gap-[3px]">
                    {histogram.map(bucket => {
                      const mid = (bucket.from + bucket.to) / 2
                      const fill =
                        mid >= draftAccept
                          ? 'bg-accent'
                          : mid >= draftReview
                            ? 'bg-attention'
                            : 'bg-ink-3'
                      return (
                        <div
                          key={bucket.from}
                          className="flex h-full flex-1 items-end"
                          title={`${bucket.from.toFixed(2)} to ${bucket.to.toFixed(2)}: ${inr(bucket.count)} pairs`}
                        >
                          <div
                            className={`w-full transition-[height] duration-300 motion-reduce:transition-none ${fill}`}
                            style={{
                              height: bucket.count === 0 ? '1px' : `${(bucket.count / peak) * 100}%`,
                            }}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div
                    className="pointer-events-none absolute inset-y-0 w-px bg-attention"
                    style={{ left: `${pct(draftReview)}%` }}
                    aria-hidden
                  />
                  <div
                    className="pointer-events-none absolute inset-y-0 w-px bg-accent"
                    style={{ left: `${pct(draftAccept)}%` }}
                    aria-hidden
                  />
                </div>

                <div className="relative mt-2 h-5 border-t border-rule">
                  {[HIST_FLOOR, 0.6, 0.75, 0.9, HIST_CEIL].map(tick => (
                    <span
                      key={tick}
                      className="absolute top-1 -translate-x-1/2 font-mono text-[10.5px] tabular-nums text-ink-3"
                      style={{ left: `${pct(tick)}%` }}
                    >
                      {tick.toFixed(2)}
                    </span>
                  ))}
                  <span
                    className="absolute top-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10.5px] tabular-nums text-attention"
                    style={{ left: `${pct(draftReview)}%` }}
                  >
                    review {draftReview.toFixed(2)}
                  </span>
                  <span
                    className="absolute top-1 -translate-x-1/2 whitespace-nowrap font-mono text-[10.5px] tabular-nums text-accent"
                    style={{ left: `${pct(draftAccept)}%` }}
                  >
                    accept {draftAccept.toFixed(2)}
                  </span>
                </div>

                <div className="mt-7 flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-rule pt-3 text-[12.5px]">
                  <span className="text-ink-3">
                    below review <Num size="sm">{inr(bands.below)}</Num>
                  </span>
                  <span className="text-attention">
                    review band <Num size="sm">{inr(bands.review)}</Num>
                  </span>
                  <span className="text-accent">
                    at or above accept <Num size="sm">{inr(bands.accepted)}</Num>
                  </span>
                  <span className="ml-auto text-ink-3">
                    tallest bucket holds <Num size="sm">{inr(peak)}</Num> pairs
                  </span>
                </div>

                <p className="mt-3 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-2">
                  Nothing below <Num size="sm">{HIST_FLOOR.toFixed(2)}</Num> is charted because
                  nothing below it is generated. Drag either threshold and its rule moves: the shape
                  of the distribution is what makes a threshold arguable, in a way a single number
                  never is.
                </p>
              </>
            )}
          </div>
        </Panel>

        {/* ------------------------------------------------------ dictionary */}
        <Panel flush>
          <PanelHead
            title="Dictionary"
            meta={
              dictMeta
                ? `${inr(rules?.length ?? 0)} rules, ${inr(BASE_RULES.length)} base and ${inr(runtimeCount)} added this session`
                : 'loading'
            }
            action={
              dictMeta ? (
                <EndpointTag
                  method={dictMeta.method}
                  endpoint={dictMeta.endpoint}
                  ms={dictMeta.ms}
                  scanned={dictMeta.scanned}
                />
              ) : (
                <span className="text-ink-3">
                  <BookOpen size={16} weight="regular" />
                </span>
              )
            }
          />

          {dictError ? (
            <div className="px-5 py-4">
              <ErrorState message={dictError} onRetry={() => void loadDictionary()} />
            </div>
          ) : rules === null ? (
            <div className="px-5 py-4">
              <Skeleton rows={5} />
            </div>
          ) : (
            <div className="grid gap-px bg-rule lg:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
              <div className="min-w-0 bg-surface">
                <div className="flex items-center gap-2 border-b border-rule px-5 py-3">
                  <MagnifyingGlass size={16} weight="regular" className="shrink-0 text-ink-3" />
                  <TextInput
                    value={query}
                    onChange={event => setQuery(event.target.value)}
                    placeholder="Search token, expansion or slot"
                    aria-label="Search dictionary rules"
                    className="border-0 px-0 py-0 focus:border-0"
                  />
                  <Num size="xs" className="shrink-0 text-ink-3">
                    {inr(filteredRules.length)}
                  </Num>
                </div>

                {filteredRules.length === 0 ? (
                  <div className="px-5 py-4">
                    <EmptyState
                      title="No rule matches that search"
                      detail="Search runs over the token, its expansion and the slot it claims. Try a shorter fragment, such as SS or BRG."
                      action={
                        <Button size="sm" onClick={() => setQuery('')}>
                          Clear search
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto">
                    <Table>
                      <thead className="sticky top-0">
                        <tr>
                          <Th>Token</Th>
                          <Th>Expands to</Th>
                          <Th>Slot</Th>
                          <Th>Source</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRules.map(({ rule, runtime }) => (
                          <tr key={`${rule.token}-${runtime ? 'r' : 'b'}`}>
                            <Td>
                              <span className="flex items-center gap-2">
                                <Num size="sm" className={runtime ? 'text-accent' : 'text-ink'}>
                                  {rule.token}
                                </Num>
                                {runtime ? <Chip tone="accent">added</Chip> : null}
                              </span>
                            </Td>
                            <Td className="text-[12.5px] text-ink-2">{rule.expansion}</Td>
                            <Td>
                              {rule.slot ? (
                                <Num size="xs" className="text-ink-2">
                                  {rule.slot}
                                </Num>
                              ) : (
                                <span className="text-[12px] text-ink-3">no slot</span>
                              )}
                            </Td>
                            <Td>
                              <Num size="xs" className="text-ink-3">
                                {rule.source}
                              </Num>
                            </Td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                )}
              </div>

              <div className="bg-surface px-5 py-4">
                <Label>Add a rule</Label>
                <p className="mt-2 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-2">
                  A rule added here is appended after the base dictionary, and the index is built so
                  that a later rule wins. It applies from the next request onward and is listed
                  above marked as added.
                </p>

                <div className="mt-4 space-y-3">
                  <Field
                    label="Token as written in a master"
                    helper={shadows ? undefined : 'One word, no spaces. Stored uppercase.'}
                    error={shadows ? `${cleanToken} already has a rule. Adding this overrides it.` : undefined}
                  >
                    <TextInput
                      value={token}
                      onChange={event => setToken(event.target.value)}
                      placeholder="SPHR"
                      spellCheck={false}
                      className="font-mono uppercase"
                    />
                  </Field>

                  <Field label="Expands to" helper="The words it contributes to the token stream.">
                    <TextInput
                      value={expansion}
                      onChange={event => setExpansion(event.target.value)}
                      placeholder="SPHERICAL ROLLER"
                      spellCheck={false}
                      className="font-mono uppercase"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Attribute slot">
                      <Select
                        value={slot}
                        onChange={event => setSlot(event.target.value as AttributeSlot | 'none')}
                      >
                        {ATTRIBUTE_SLOTS.map(name => (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        ))}
                        <option value="none">no slot</option>
                      </Select>
                    </Field>

                    <Field label="Provenance">
                      <Select
                        value={source}
                        onChange={event =>
                          setSource(event.target.value as DictionaryRule['source'])
                        }
                      >
                        <option value="MRO">MRO</option>
                        <option value="SAP">SAP</option>
                        <option value="IS">IS</option>
                        <option value="UOM">UOM</option>
                      </Select>
                    </Field>
                  </div>

                  {formError ? <p className="text-[12px] text-negative">{formError}</p> : null}

                  <Button
                    variant="primary"
                    onClick={() => void submitRule()}
                    disabled={saving}
                    icon={<Plus size={16} weight="regular" />}
                  >
                    {saving ? 'Sending' : 'Add rule'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Panel>

        {/* ------------------------------------------------------ request log */}
        <Panel flush>
          <PanelHead
            title="Request log"
            meta={`${inr(log.length)} of the last 60 calls`}
            action={
              <span className="inline-flex items-center gap-2 font-mono text-[10.5px] text-ink-3">
                <PlugsConnected size={16} weight="regular" />
                {IS_LIVE ? `network, ${API_BASE}` : `in-process, shape of ${API_BASE}`}
              </span>
            }
          />

          <div className="px-5 py-3">
            <p className="max-w-[80ch] text-[12.5px] leading-relaxed text-ink-2">
              Every panel in this application is drawn from a response, never from a value computed
              in the page. This is the bounded ring of those calls, newest first, each with the
              request id it carried and the records the service read to answer it.{' '}
              {IS_LIVE
                ? `Requests go over HTTP to ${API_BASE}.`
                : `Requests resolve against the service core running in this process, using the same request and response shapes as ${API_BASE}. Latency is reported as measured, not asserted.`}
            </p>
          </div>

          {log.length === 0 ? (
            <div className="px-5 pb-4">
              <EmptyState
                title="No calls recorded yet"
                detail="The log fills as the page asks the service for something. Move a weight or add a dictionary rule and the request appears here."
              />
            </div>
          ) : (
            <div className="max-h-[380px] overflow-y-auto border-t border-rule">
              <Table>
                <thead className="sticky top-0">
                  <tr>
                    <Th>Time</Th>
                    <Th>Method</Th>
                    <Th>Endpoint</Th>
                    <Th>Request id</Th>
                    <Th align="right">ms</Th>
                    <Th align="right">Records read</Th>
                    <Th align="right">Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {log.map(entry => (
                    <motion.tr
                      key={entry.requestId}
                      initial={reduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Td>
                        <Num size="xs" className="text-ink-3">
                          {new Date(entry.at).toLocaleTimeString('en-IN', { hour12: false })}
                        </Num>
                      </Td>
                      <Td>
                        <Num size="xs" className="text-accent">
                          {entry.method}
                        </Num>
                      </Td>
                      <Td>
                        <Num size="sm" className="text-ink">
                          {entry.endpoint}
                        </Num>
                      </Td>
                      <Td>
                        <Num size="xs" className="text-ink-3">
                          {entry.requestId}
                        </Num>
                      </Td>
                      <Td align="right">
                        <Num size="sm">{inr(entry.ms)}</Num>
                      </Td>
                      <Td align="right">
                        {entry.scanned ? (
                          <Num size="sm" className="text-ink-2">
                            {inr(entry.scanned)}
                          </Num>
                        ) : (
                          <span className="text-[12px] text-ink-3">none</span>
                        )}
                      </Td>
                      <Td align="right">
                        <Num size="sm" className={entry.status >= 400 ? 'text-negative' : 'text-ink-2'}>
                          {entry.status}
                        </Num>
                      </Td>
                    </motion.tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Panel>

        {/* ------------------------------------------------------------ reset */}
        <Panel flush>
          <PanelHead title="Reset the session" meta="local to this browser" />

          <div className="px-5 py-4">
            <p className="max-w-[72ch] text-[13px] leading-relaxed text-ink-2">
              This returns the service to the state it started in. Exactly four things go back:
            </p>
            <ul className="mt-3 max-w-[72ch] space-y-2 text-[13px] leading-relaxed text-ink-2">
              <li className="border-t border-rule pt-2">
                Scoring weights return to lexical <Num size="sm">{DEFAULT_WEIGHTS.lexical.toFixed(2)}</Num>,
                attribute <Num size="sm">{DEFAULT_WEIGHTS.attribute.toFixed(2)}</Num>, numeric{' '}
                <Num size="sm">{DEFAULT_WEIGHTS.numeric.toFixed(2)}</Num>.
              </li>
              <li className="border-t border-rule pt-2">
                Thresholds return to accept <Num size="sm">{DEFAULT_ACCEPT.toFixed(2)}</Num> and
                review <Num size="sm">{DEFAULT_REVIEW.toFixed(2)}</Num>, and the savings assumptions
                return to their starting values.
              </li>
              <li className="border-t border-rule pt-2">
                Every approve and reject decision made in this session is discarded, so pairs a
                person has ruled on go back to being scored.
              </li>
              <li className="border-t border-rule pt-2">
                Rows imported in this session are dropped, along with the{' '}
                <Num size="sm">{inr(runtimeCount)}</Num> dictionary{' '}
                {runtimeCount === 1 ? 'rule' : 'rules'} added here. The audit trail is reseeded to
                its four opening entries.
              </li>
            </ul>

            <p className="mt-4 max-w-[72ch] text-[12.5px] leading-relaxed text-ink-3">
              The four source material masters are not affected. Nothing outside this browser
              session changes.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {confirmingReset ? (
                <>
                  <Button
                    variant="danger"
                    onClick={() => void doReset()}
                    disabled={resetting}
                    icon={<ArrowCounterClockwise size={16} weight="regular" />}
                  >
                    {resetting ? 'Resetting' : 'Yes, reset the session'}
                  </Button>
                  <Button variant="ghost" onClick={() => setConfirmingReset(false)} disabled={resetting}>
                    Keep what I have
                  </Button>
                </>
              ) : (
                <Button
                  variant="danger"
                  onClick={() => setConfirmingReset(true)}
                  icon={<ArrowCounterClockwise size={16} weight="regular" />}
                >
                  Reset the session
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
