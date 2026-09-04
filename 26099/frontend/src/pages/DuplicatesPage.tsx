/**
 * Duplicates.
 *
 * The human decision surface. Everything else in this application proposes; this
 * page is where a person disposes. The layout follows from that: two raw ERP
 * descriptions stacked so the eye can run down them, the tokens that differ marked
 * in rust, and two buttons that mean yes and no.
 *
 * The dials are not a settings screen. Moving one re-scores the whole queue at the
 * service and the rows re-order in place, which is the only honest way to show that
 * the verdicts are computed rather than authored. Slider input is held locally and
 * committed on release (with a trailing debounce for a slow drag), because the
 * refresh behind each commit rebuilds every pair and firing it on every pointer
 * move would turn the drag into a slideshow.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUUpLeft, CaretDown, Check, Checks, X } from '@phosphor-icons/react'
import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  ErrorState,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Segmented,
  Skeleton,
  Slider,
  VerdictChip,
} from '@/components/ui'
import { ByMode, SimpleOnly, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { rebalance, scoreExpression } from '@/engine/score'
import { formatExact } from '@/engine/savings'
import type { AttributeSlot, MatchPair, NormalizedRecord, ScoringWeights } from '@/engine/types'
import { call } from '@/api/client'
import { pushActivity } from '@/api/endpoints'
import { bumpVersion, serviceState } from '@/api/state'

/* ------------------------------------------------------------------ endpoint */

/**
 * POST /match/review/withdraw
 *
 * Taking a decision back is its own call rather than a third verdict value: the
 * pair returns to the queue, and the audit trail records that a person changed
 * their mind rather than quietly losing the earlier entry. Declared here because
 * this is the only page that can reopen a decision.
 */
function withdrawReview(pair: MatchPair) {
  return call(
    'POST',
    '/match/review/withdraw',
    { pairId: pair.id },
    () => {
      serviceState.approvals.delete(pair.id)
      pushActivity({
        action: 'config',
        actor: serviceState.operator,
        detail:
          `Withdrew the earlier decision on ${pair.left.cpse} "${pair.left.rawDescription}" ` +
          `against ${pair.right.cpse} "${pair.right.rawDescription}". The pair is back in the queue.`,
        code: pair.proposedCode,
        endpoint: 'POST /match/review/withdraw',
      })
      bumpVersion()
      return { pairId: pair.id, status: 'pending' }
    },
    { scanned: 1 },
  )
}

/* -------------------------------------------------------------------- shared */

type Bucket = 'all' | 'needs' | 'agreed' | 'rejected'
type Decision = 'approved' | 'rejected' | undefined

const PAGE = 60

/** Where a pair sits once the human decision, if any, has overridden the score. */
function bucketOf(pair: MatchPair, decision: Decision): Exclude<Bucket, 'all'> {
  if (decision === 'approved') return 'agreed'
  if (decision === 'rejected') return 'rejected'
  if (pair.verdict === 'same') return 'agreed'
  if (pair.verdict === 'review') return 'needs'
  return 'rejected'
}

const SHORT_VERDICT: Record<MatchPair['verdict'], string> = {
  same: 'Same',
  review: 'Needs a check',
  different: 'Different',
}

const SLOT_LABEL: Record<AttributeSlot, string> = {
  noun: 'Item type',
  variant: 'Variant',
  material: 'Material',
  grade: 'Grade',
  dimension: 'Size',
  rating: 'Rating',
  standard: 'Standard',
}

/* --------------------------------------------------------------------- page */

export default function DuplicatesPage() {
  const c = useCopy()

  const ready = useService(s => s.ready)
  const error = useService(s => s.error)
  const pairs = useService(s => s.pairs)
  const decisions = useService(s => s.decisions)
  const weights = useService(s => s.weights)
  const decide = useService(s => s.decide)
  const decideMany = useService(s => s.decideMany)
  const refresh = useService(s => s.refresh)
  const proposalsCall = useService(s => s.lastCall.proposals)

  const [bucket, setBucket] = useState<Bucket>('needs')
  const [limit, setLimit] = useState(PAGE)
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const ordered = useMemo(
    () => [...pairs].sort((a, b) => b.score.combined - a.score.combined),
    [pairs],
  )

  const bucketCounts = useMemo(() => {
    const tally = { all: ordered.length, needs: 0, agreed: 0, rejected: 0 }
    for (const pair of ordered) tally[bucketOf(pair, decisions[pair.id])] += 1
    return tally
  }, [ordered, decisions])

  const filtered = useMemo(
    () => (bucket === 'all' ? ordered : ordered.filter(p => bucketOf(p, decisions[p.id]) === bucket)),
    [ordered, decisions, bucket],
  )

  /** Everything the score already put above the accept line and nobody has ruled on. */
  const bulkTargets = useMemo(
    () => ordered.filter(p => p.verdict === 'same' && !decisions[p.id]),
    [ordered, decisions],
  )

  useEffect(() => {
    setLimit(PAGE)
  }, [bucket])

  const visible = filtered.slice(0, limit)

  async function runBulk() {
    setBusy(true)
    await decideMany(bulkTargets, 'approved')
    setBusy(false)
    setConfirming(false)
  }

  async function handleUndo(pair: MatchPair) {
    await withdrawReview(pair)
    await refresh()
  }

  return (
    <>
      <PageHead title={c('duplicatesTitle')} lead={c('duplicatesLead')} />

      {error ? (
        <ErrorState message={error} onRetry={() => void refresh()} />
      ) : ready && pairs.length === 0 ? (
        <NothingLoaded what="This page holds every pair of records the matcher thinks might be the same item, and lets a person settle the ones it is not sure about." />
      ) : !ready ? (
        <div className="flex flex-col gap-6">
          <Panel>
            <Skeleton rows={4} />
          </Panel>
          <Panel>
            <Skeleton rows={7} />
          </Panel>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <Tuner />

          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={bucket}
              onChange={setBucket}
              size="sm"
              options={[
                { value: 'all', label: 'All', count: bucketCounts.all },
                { value: 'needs', label: 'Needs a decision', count: bucketCounts.needs },
                { value: 'agreed', label: 'Agreed', count: bucketCounts.agreed },
                { value: 'rejected', label: 'Rejected', count: bucketCounts.rejected },
              ]}
            />

            <div className="ml-auto">
              {confirming ? (
                <div className="flex flex-wrap items-center gap-2 border border-attention-edge bg-attention-bg px-3 py-1.5">
                  <span className="text-[12.5px] text-ink">
                    Record <Num size="sm">{formatExact(bulkTargets.length)}</Num> agreements in one
                    action, each attributed to you.
                  </span>
                  <Button size="sm" variant="primary" disabled={busy} onClick={() => void runBulk()}>
                    {busy ? 'Recording' : 'Confirm'}
                  </Button>
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirming(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  icon={<Checks size={16} weight="regular" />}
                  disabled={bulkTargets.length === 0}
                  onClick={() => setConfirming(true)}
                >
                  <ByMode
                    simple="Agree with all"
                    technical="Approve everything above the accept line:"
                  />
                  <Num size="sm">{formatExact(bulkTargets.length)}</Num>
                  <SimpleOnly>above the accept line</SimpleOnly>
                </Button>
              )}
            </div>
          </div>

          <Panel flush>
            <PanelHead
              title={
                <ByMode simple="Pairs the system found" technical="Candidate pairs" />
              }
              meta={
                <TechnicalOnly>
                  {proposalsCall ? (
                    <EndpointTag
                      method={proposalsCall.method}
                      endpoint={proposalsCall.endpoint}
                      ms={proposalsCall.ms}
                      scanned={proposalsCall.scanned}
                    />
                  ) : null}
                </TechnicalOnly>
              }
              action={
                <span className="font-mono text-[11px] text-ink-3">
                  {formatExact(filtered.length)} shown
                </span>
              }
            />

            {ordered.length === 0 ? (
              <div className="p-5">
                <EmptyState title={c('emptyProposals')} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Nothing in this list"
                  detail={
                    bucket === 'needs'
                      ? 'Every pair the system was unsure about has been decided. Switch to another list to review what was recorded.'
                      : 'No pairs fall into this list at the current settings. Move the dials above and they will.'
                  }
                />
              </div>
            ) : (
              <>
                <ul key={bucket} className="divide-y divide-rule">
                  {visible.map(pair => (
                    <PairRow
                      key={pair.id}
                      pair={pair}
                      weights={weights}
                      decision={decisions[pair.id]}
                      open={openId === pair.id}
                      onToggle={() => setOpenId(openId === pair.id ? null : pair.id)}
                      onDecide={(target, action) => void decide(target, action)}
                      onUndo={target => void handleUndo(target)}
                    />
                  ))}
                </ul>

                {filtered.length > visible.length ? (
                  <div className="flex items-center gap-3 border-t border-rule px-5 py-3">
                    <Button size="sm" onClick={() => setLimit(limit + PAGE)}>
                      Show more
                    </Button>
                    <span className="text-[12px] text-ink-2">
                      <Num size="sm">{formatExact(visible.length)}</Num> of{' '}
                      <Num size="sm">{formatExact(filtered.length)}</Num> rendered. The rest are held
                      back so the list stays quick.
                    </span>
                  </div>
                ) : null}
              </>
            )}
          </Panel>
        </div>
      )}
    </>
  )
}

/* -------------------------------------------------------------------- dials */

/**
 * Weights and thresholds.
 *
 * Draft values live inside this component so that dragging a slider re-renders the
 * dials and nothing else. The commit that re-scores the queue is fired on pointer
 * release, with a trailing timer so a slow drag still updates before the operator
 * lets go.
 */
function Tuner() {
  const weights = useService(s => s.weights)
  const accept = useService(s => s.accept)
  const review = useService(s => s.review)
  const counts = useService(s => s.counts)
  const setWeight = useService(s => s.setWeight)
  const setThresholds = useService(s => s.setThresholds)

  const [draftWeights, setDraftWeights] = useState<ScoringWeights | null>(null)
  const [draftBands, setDraftBands] = useState<{ accept: number; review: number } | null>(null)
  const [open, setOpen] = useState(false)

  const pendingWeight = useRef<{ key: keyof ScoringWeights; value: number } | null>(null)
  const pendingBands = useRef<{ accept: number; review: number } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const shownWeights = draftWeights ?? weights
  const shownBands = draftBands ?? { accept, review }
  const sum = shownWeights.lexical + shownWeights.attribute + shownWeights.numeric

  function flush() {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    const weight = pendingWeight.current
    const bands = pendingBands.current
    pendingWeight.current = null
    pendingBands.current = null
    if (weight) {
      void setWeight(weight.key, weight.value)
      setDraftWeights(null)
    }
    if (bands) {
      void setThresholds(bands.accept, bands.review)
      setDraftBands(null)
    }
  }

  function schedule() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 260)
  }

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  function onWeight(key: keyof ScoringWeights, value: number) {
    // The service rebalances the other two so the three always sum to 1. Previewing
    // with the same function means the numbers on screen are the numbers it will store.
    setDraftWeights(rebalance(weights, key, value))
    pendingWeight.current = { key, value }
    schedule()
  }

  function onAccept(value: number) {
    const next = { accept: value, review: Math.min(shownBands.review, round2(value - 0.02)) }
    setDraftBands(next)
    pendingBands.current = next
    schedule()
  }

  function onReview(value: number) {
    const next = { review: value, accept: Math.max(shownBands.accept, round2(value + 0.02)) }
    setDraftBands(next)
    pendingBands.current = next
    schedule()
  }

  const dials = (labels: {
    lexical: string
    attribute: string
    numeric: string
    accept: string
    review: string
  }) => (
    <div onPointerUp={flush} onKeyUp={flush}>
      <div className="grid gap-5 sm:grid-cols-3">
        <Slider
          label={labels.lexical}
          value={shownWeights.lexical}
          onChange={value => onWeight('lexical', value)}
        />
        <Slider
          label={labels.attribute}
          value={shownWeights.attribute}
          onChange={value => onWeight('attribute', value)}
        />
        <Slider
          label={labels.numeric}
          value={shownWeights.numeric}
          onChange={value => onWeight('numeric', value)}
        />
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-2 text-[12px] text-ink-2">
        <ByMode
          simple="The three always add up to one, so raising one lowers the others:"
          technical="Weights are rebalanced on write:"
        />
        <Mono>
          {shownWeights.lexical.toFixed(2)} + {shownWeights.attribute.toFixed(2)} +{' '}
          {shownWeights.numeric.toFixed(2)} = {sum.toFixed(2)}
        </Mono>
      </p>

      <div className="mt-5 grid gap-5 border-t border-rule pt-5 sm:grid-cols-2">
        <Slider
          label={labels.accept}
          value={shownBands.accept}
          min={0.5}
          max={0.99}
          onChange={onAccept}
        />
        <Slider
          label={labels.review}
          value={shownBands.review}
          min={0.4}
          max={0.97}
          onChange={onReview}
        />
      </div>
      <p className="mt-2 text-[11.5px] text-ink-3">
        <ByMode
          simple="The second number always stays below the first, so there is always a middle band for a person to look at."
          technical="The review threshold is clamped below the accept threshold, so the review band cannot be inverted or emptied by ordering."
        />
      </p>
    </div>
  )

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-display text-[13px] font-semibold tracking-tight text-ink">
          <ByMode simple="How strict the matching is" technical="Scoring weights and thresholds" />
        </h2>
        <TechnicalOnly>
          <Mono>
            accept {shownBands.accept.toFixed(2)} / review {shownBands.review.toFixed(2)}
          </Mono>
        </TechnicalOnly>
      </div>

      <TechnicalOnly>
        {dials({
          lexical: 'Lexical',
          attribute: 'Attribute',
          numeric: 'Numeric',
          accept: 'Accept threshold',
          review: 'Review threshold',
        })}
      </TechnicalOnly>

      <SimpleOnly>
        <button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 border border-rule-strong bg-surface px-3 py-2 text-left text-[13px] text-ink transition-colors hover:bg-surface-2"
        >
          <CaretDown
            size={16}
            weight="regular"
            className={open ? 'text-ink-2' : '-rotate-90 text-ink-2'}
          />
          Adjust how strict this is
        </button>
        {open ? (
          <div className="mt-5">
            {dials({
              lexical: 'How similar the words are',
              attribute: 'How well the specs line up',
              numeric: 'How close the sizes are',
              accept: 'How sure before it counts as the same item',
              review: 'How sure before a person should look',
            })}
          </div>
        ) : null}
      </SimpleOnly>

      <div className="mt-5 grid divide-y divide-rule border-t border-rule sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <Band label="Same item" value={counts.same} tone="accent" total={counts.same + counts.review + counts.different} />
        <Band
          label="Needs a person"
          value={counts.review}
          tone="attention"
          total={counts.same + counts.review + counts.different}
        />
        <Band
          label="Different items"
          value={counts.different}
          tone="negative"
          total={counts.same + counts.review + counts.different}
        />
      </div>
    </Panel>
  )
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function Band({
  label,
  value,
  tone,
  total,
}: {
  label: string
  value: number
  tone: 'accent' | 'attention' | 'negative'
  total: number
}) {
  return (
    <div className="px-4 py-3 first:pl-0">
      <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">{label}</div>
      <div className="mt-1.5">
        <Num size="lg" className="text-ink">
          {formatExact(value)}
        </Num>
      </div>
      <div className="mt-2">
        <Meter value={total === 0 ? 0 : value / total} tone={tone} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------------- rows */

function PairRow({
  pair,
  weights,
  decision,
  open,
  onToggle,
  onDecide,
  onUndo,
}: {
  pair: MatchPair
  weights: ScoringWeights
  decision: Decision
  open: boolean
  onToggle: () => void
  onDecide: (pair: MatchPair, action: 'approved' | 'rejected') => void
  onUndo: (pair: MatchPair) => void
}) {
  const c = useCopy()
  const reduce = useReducedMotion()

  const verdictCopy =
    pair.verdict === 'same'
      ? c('verdictSame')
      : pair.verdict === 'review'
        ? c('verdictReview')
        : c('verdictDifferent')

  const tone = pair.verdict === 'same' ? 'accent' : pair.verdict === 'review' ? 'attention' : 'negative'

  return (
    <motion.li
      {...(reduce ? {} : { layout: 'position' as const })}
      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
      className="bg-surface"
    >
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Side record={pair.left} norm={pair.leftNorm} only={pair.leftOnlyTokens} />
          <Side record={pair.right} norm={pair.rightNorm} only={pair.rightOnlyTokens} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {decision ? (
            <Chip tone={decision === 'approved' ? 'accent' : 'negative'}>
              {decision === 'approved' ? 'You agreed' : 'You rejected'}
            </Chip>
          ) : null}
          <VerdictChip verdict={pair.verdict} label={SHORT_VERDICT[pair.verdict]} />
          <Num size="sm" className="w-[46px] text-right text-ink">
            {pair.score.combined.toFixed(3)}
          </Num>
          <CaretDown
            size={16}
            weight="regular"
            className={open ? 'text-ink-2' : '-rotate-90 text-ink-3'}
          />
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="detail"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={reduce ? { height: 'auto', opacity: 1 } : { height: 'auto', opacity: 1 }}
            exit={reduce ? { height: 0, opacity: 0 } : { height: 0, opacity: 0 }}
            transition={reduce ? { duration: 0 } : { duration: 0.2, ease: [0.2, 0, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-rule bg-surface-2 px-5 py-4">
              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    <ByMode simple="How the score was reached" technical="Score breakdown" />
                  </div>

                  <div className="mt-3 space-y-3">
                    <ScoreLine
                      label={c('scoreLexical')}
                      value={pair.score.lexical}
                      weight={weights.lexical}
                    />
                    <ScoreLine
                      label={c('scoreAttribute')}
                      value={pair.score.attribute}
                      weight={weights.attribute}
                    />
                    <ScoreLine
                      label={c('scoreNumeric')}
                      value={pair.score.numeric}
                      weight={weights.numeric}
                    />
                  </div>

                  <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-rule pt-3">
                    <span className="text-[12.5px] text-ink">{c('scoreCombined')}</span>
                    <span className="flex items-baseline gap-2">
                      <Chip tone={tone}>{verdictCopy}</Chip>
                      <Num size="sm" className="text-ink">
                        {pair.score.combined.toFixed(3)}
                      </Num>
                    </span>
                  </div>

                  <TechnicalOnly>
                    <div className="mt-3">
                      <Mono>{scoreExpression(pair.score, weights)}</Mono>
                    </div>
                  </TechnicalOnly>
                </div>

                <div>
                  <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    <ByMode simple="What disagrees" technical="Attribute conflicts" />
                  </div>

                  {pair.conflicts.length === 0 ? (
                    <p className="mt-3 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-2">
                      <ByMode
                        simple="Nothing in the recorded details disagrees. Where both lines state a value, the values are the same."
                        technical="No attribute slot is contradicted. Every filled slot either agrees or is filled on one side only."
                      />
                    </p>
                  ) : (
                    <>
                      <ul className="mt-3 divide-y divide-rule border-t border-rule">
                        {pair.conflicts.map(conflict => (
                          <li
                            key={conflict.slot}
                            className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2"
                          >
                            <ByMode
                              simple={
                                <span className="text-[12px] text-ink-2">
                                  {SLOT_LABEL[conflict.slot]}
                                </span>
                              }
                              technical={<Mono>{conflict.slot}</Mono>}
                            />
                            <Num size="sm" className="text-negative">
                              {conflict.left}
                            </Num>
                            <span className="text-[12px] text-ink-3">vs</span>
                            <Num size="sm" className="text-negative">
                              {conflict.right}
                            </Num>
                          </li>
                        ))}
                      </ul>
                      <TechnicalOnly>
                        <p className="mt-2 max-w-[46ch] text-[11.5px] leading-snug text-ink-3">
                          A contradicted slot counts twice in the attribute denominator, so one
                          disagreement costs the pair more than one missing value.
                        </p>
                      </TechnicalOnly>
                    </>
                  )}

                  <div className="mt-4 border-t border-rule pt-3">
                    <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                      <ByMode
                        simple="If these are the same, both become"
                        technical="Proposed national code"
                      />
                    </div>
                    <div className="mt-2">
                      <Mono>{pair.proposedCode}</Mono>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
                {decision ? (
                  <>
                    <span className="text-[12.5px] text-ink-2">
                      {decision === 'approved'
                        ? 'You recorded these as the same item.'
                        : 'You recorded these as different items.'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<ArrowUUpLeft size={16} weight="regular" />}
                      onClick={() => onUndo(pair)}
                    >
                      Undo
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check size={16} weight="regular" />}
                      onClick={() => onDecide(pair, 'approved')}
                    >
                      {c('approve')}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<X size={16} weight="regular" />}
                      onClick={() => onDecide(pair, 'rejected')}
                    >
                      {c('reject')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.li>
  )
}

function ScoreLine({ label, value, weight }: { label: string; value: number; weight: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12.5px] text-ink-2">{label}</span>
        <span className="flex items-baseline gap-2">
          <TechnicalOnly>
            <Num size="xs" className="text-ink-3">
              x {weight.toFixed(2)}
            </Num>
          </TechnicalOnly>
          <Num size="sm" className="text-ink">
            {value.toFixed(2)}
          </Num>
        </span>
      </div>
      <div className="mt-1.5">
        <Meter value={value} tone="neutral" />
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- one side */

function Side({
  record,
  norm,
  only,
}: {
  record: MatchPair['left']
  norm: NormalizedRecord
  only: string[]
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-2">
      <Mono className="shrink-0">{record.cpse}</Mono>
      <div className="min-w-0">
        <p className="text-[13px] leading-snug text-ink">
          <Marked text={record.rawDescription} only={only} />
        </p>
        <TechnicalOnly>
          <p className="mt-1 flex flex-wrap gap-x-1 gap-y-0.5 font-mono text-[10.5px] text-ink-3">
            {norm.normalizedTokens.map((token, index) => (
              <span
                key={`${token}-${index}`}
                className={
                  only.includes(token) ? 'bg-negative-bg px-1 text-negative' : 'px-1'
                }
              >
                {token}
              </span>
            ))}
          </p>
        </TechnicalOnly>
      </div>
    </div>
  )
}

/**
 * Mark the words this side has and the other does not.
 *
 * The raw string is abbreviated and the token list is expanded, so a mark only
 * lands where the abbreviation and the expansion happen to be the same word. That
 * is honest: the expanded chain underneath is where every difference shows.
 */
function Marked({ text, only }: { text: string; only: string[] }) {
  const set = useMemo(() => new Set(only.map(token => token.toUpperCase())), [only])
  const parts = useMemo(() => text.split(/([A-Za-z0-9.]+)/), [text])

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 && set.has(part.toUpperCase()) ? (
          <mark key={index} className="bg-negative-bg px-0.5 text-negative">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}
