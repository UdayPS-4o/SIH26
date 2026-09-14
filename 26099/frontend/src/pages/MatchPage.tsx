/**
 * AI material matching and recommendation.
 *
 * Every other surface in this application works on records that are already in the
 * registry. This one takes a line that may never have been seen before, written the
 * way the person in front of you writes it, and answers the only question a buyer
 * actually has: does anybody already buy this, and under what code.
 *
 * It is deliberately the same engine as the duplicates queue, not a second one
 * tuned to look good on a demo. The call runs the identical normalizer, the
 * identical weights and the identical thresholds, so an answer given here and a
 * verdict reached in the batch queue cannot contradict each other. If a reviewer
 * moves a weight on the engine page, the answers on this page move with it.
 *
 * The ranked list is the "recommendation" half. A pair verdict says yes or no about
 * two lines; a buyer standing at a counter needs to see the four closest things in
 * the country with their scores, because the second-best answer is often the one
 * they actually wanted.
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ArrowRight,
  Barcode,
  CaretDown,
  MagnifyingGlass,
  Plus,
  Question,
  Sparkle,
} from '@phosphor-icons/react'
import {
  Button,
  Chip,
  EmptyState,
  EndpointTag,
  Field,
  Label,
  Meter,
  Mono,
  Num,
  PageHead,
  Panel,
  PanelHead,
  Select,
  Skeleton,
  TextInput,
  VerdictChip,
} from '@/components/ui'
import { ByMode, TechnicalOnly } from '@/components/Gate'
import NothingLoaded from '@/components/NothingLoaded'
import { useCopy } from '@/copy'
import { useService } from '@/store/service'
import { recommendMatches, type RecommendResponse, type Recommendation } from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { toastSuccess, toastInfo } from '@/components/ui/Toasts'
import { ATTRIBUTE_SLOTS, FAMILY_LABEL, type AttributeSlot } from '@/engine/types'

/* ------------------------------------------------------------------- labels */

const SLOT_LABEL: Record<AttributeSlot, string> = {
  noun: 'Item type',
  variant: 'Variant',
  material: 'Material',
  grade: 'Grade',
  dimension: 'Size',
  rating: 'Rating',
  standard: 'Standard',
}

const SHORT_VERDICT: Record<Recommendation['verdict'], string> = {
  same: 'Same item',
  review: 'Needs a check',
  different: 'Not the same',
}

/**
 * The units a material master actually stores, each spelled the way one of the
 * four sources spells it. The normalizer collapses them, which is the point: a
 * visitor can pick EA here against a corpus that wrote NOS and still match.
 */
const UOMS = ['NOS', 'EA', 'PCS', 'NO', 'MTR', 'M', 'RMT', 'KG', 'KGS', 'LTR', 'SET']

/**
 * Four questions worth asking, and why each one is here.
 *
 * The first is an abbreviated line against a corpus that also holds it spelled out.
 * The second is the reverse. The third differs from a stocked item by one number,
 * which is the case a word matcher gets wrong. The fourth is not in any master, so
 * the honest answer is a new code rather than a forced match.
 */
const EXAMPLES: { label: string; description: string; uom: string }[] = [
  { label: 'Abbreviated', description: 'BRG BALL DG 6205 2RS SKF', uom: 'NOS' },
  { label: 'Spelled out', description: 'PIPE SEAMLESS CARBON STEEL 100NB SCH40 IS 1239', uom: 'M' },
  { label: 'One size apart', description: 'VLV GATE WCB 150NB CL150 FLGD', uom: 'NOS' },
  { label: 'Nothing like it', description: 'DRONE BATTERY LIPO 6S 5000MAH', uom: 'NOS' },
]

/* --------------------------------------------------------------------- page */

export default function MatchPage() {
  const c = useCopy()

  const ready = useService(s => s.ready)
  const records = useService(s => s.records)
  const weights = useService(s => s.weights)
  const accept = useService(s => s.accept)
  const review = useService(s => s.review)

  const [description, setDescription] = useState('')
  const [uom, setUom] = useState('NOS')
  const [result, setResult] = useState<RecommendResponse | null>(null)
  const [meta, setMeta] = useState<RequestMeta | null>(null)
  const [busy, setBusy] = useState(false)
  const [asked, setAsked] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const runMemo = useCallback(async (text: string, unit: string) => {
    const trimmed = text.trim()
    if (!trimmed || busy) return
    if (trimmed === asked) return
    setBusy(true)
    setAsked(trimmed)
    try {
      const response = await recommendMatches(trimmed, unit)
      setResult(response.data)
      setMeta(response.meta)

      const { outcome, best, mintedCode } = response.data
      if (outcome === 'match' && best) {
        toastSuccess(
          `Match found — ${best.record.cpse}`,
          `${best.record.rawDescription.slice(0, 50)} → ${best.code}`,
        )
      } else if (outcome === 'new') {
        toastInfo('New item', `Would mint code ${mintedCode}`)
      }
    } finally {
      setBusy(false)
    }
  }, [busy, asked])

  async function run(text: string, unit: string) {
    void runMemo(text, unit)
  }

  function useExample(example: (typeof EXAMPLES)[number]) {
    setDescription(example.description)
    setUom(example.uom)
    void runMemo(example.description, example.uom)
  }

  useEffect(() => {
    if (!description.trim() || records.length === 0) return
    const timer = setTimeout(() => {
      void runMemo(description, uom)
    }, 400)
    return () => { clearTimeout(timer) }
  }, [description, uom, records.length, runMemo])

  if (ready && records.length === 0) {
    return (
      <>
        <PageHead title={c('matchTitle')} lead={c('matchLead')} />
        <NothingLoaded what="This page answers whether an item already exists anywhere in the country, and under which national code." />
      </>
    )
  }

  return (
    <>
      <PageHead
        title={c('matchTitle')}
        lead={c('matchLead')}
        icon={<Sparkle size={22} weight="fill" />}
      />

      <div className="flex flex-col gap-6">
        <Panel>
          <div className="flex flex-wrap items-end gap-3">
            <Field
              label="Item description"
              className="min-w-[280px] flex-1"
              helper={
                records.length > 0
                  ? `Scored against ${records.length.toLocaleString('en-IN')} records currently loaded.`
                  : undefined
              }
            >
              <TextInput
                ref={inputRef}
                value={description}
                placeholder="BRG BALL DG 6205 2RS SKF"
                onChange={event => setDescription(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') void run(description, uom)
                }}
              />
            </Field>

            <Field label="Unit" className="w-[120px]">
              <Select value={uom} onChange={event => setUom(event.target.value)}>
                {UOMS.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>

            <Button
              variant="primary"
              icon={<MagnifyingGlass size={16} weight="regular" />}
              disabled={busy || description.trim().length === 0}
              onClick={() => void run(description, uom)}
              className="mb-[2px]"
            >
              {busy ? 'Matching' : <ByMode simple="Find this item" technical="Match" />}
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
            <Label>Try one</Label>
            {EXAMPLES.map(example => (
              <button
                key={example.description}
                onClick={() => useExample(example)}
                disabled={busy}
                className="group flex items-baseline gap-2 rounded-full border border-rule-strong bg-surface px-3 py-1 text-left transition-colors hover:border-accent disabled:opacity-45"
              >
                <span className="text-[11px] uppercase tracking-[0.08em] text-ink-3 group-hover:text-accent">
                  {example.label}
                </span>
                <span className="font-mono text-[11.5px] text-ink-2">{example.description}</span>
              </button>
            ))}
          </div>
        </Panel>

        {busy && !result ? (
          <Panel>
            <Skeleton rows={6} />
          </Panel>
        ) : null}

        {result ? (
          <>
            <Outcome result={result} accept={accept} review={review} />

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
              <Panel flush>
                <PanelHead
                  title={<ByMode simple="Closest items found" technical="Ranked candidates" />}
                  meta={
                    <TechnicalOnly>
                      {meta ? (
                        <EndpointTag
                          method={meta.method}
                          endpoint={meta.endpoint}
                          ms={meta.ms}
                          scanned={meta.scanned}
                        />
                      ) : null}
                    </TechnicalOnly>
                  }
                  action={
                    <span className="font-mono text-[11px] text-ink-3">
                      {result.recommendations.length} shown
                    </span>
                  }
                />

                {result.recommendations.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      title="Nothing in the registry comes close"
                      detail={`No loaded record scored above ${(0.3).toFixed(2)} against this line. That is an answer, not a failure: the item is new to the registry and takes a fresh national code.`}
                      icon={<Question size={18} weight="regular" />}
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-rule">
                    {result.recommendations.map((recommendation, index) => (
                      <CandidateRow
                        key={recommendation.record.id}
                        rank={index + 1}
                        recommendation={recommendation}
                        weights={weights}
                      />
                    ))}
                  </ul>
                )}
              </Panel>

              <WhatWasRead result={result} asked={asked} />
            </div>
          </>
        ) : busy ? null : (
          <Panel>
            <EmptyState
              title="Ask about an item"
              detail="Type a description in whatever short forms your organisation uses, or pick one of the four above. The engine normalizes it, scores it against every loaded master and shows what it found, with the arithmetic."
              icon={<MagnifyingGlass size={18} weight="regular" />}
            />
          </Panel>
        )}
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ outcome */

/**
 * The answer, before the evidence.
 *
 * Three outcomes, and the recommendation each one carries. The code is printed at
 * a size somebody can read across a room, because it is the one thing the person
 * asking came for.
 */
function Outcome({
  result,
  accept,
  review,
}: {
  result: RecommendResponse
  accept: number
  review: number
}) {
  const { outcome, best } = result

  const tone = outcome === 'match' ? 'positive' : outcome === 'review' ? 'attention' : 'info'
  const border =
    outcome === 'match'
      ? 'border-positive-edge bg-positive-bg'
      : outcome === 'review'
        ? 'border-attention-edge bg-attention-bg'
        : 'border-info-edge bg-info-bg'

  const code = outcome === 'new' ? result.mintedCode : (best?.code ?? result.mintedCode)

  return (
    <section className={`rounded-2xl border px-5 py-4 ${border}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone={tone}>
              {outcome === 'match'
                ? 'Already exists'
                : outcome === 'review'
                  ? 'Needs a person'
                  : 'New to the registry'}
            </Chip>
            {best ? (
              <Num size="sm" className="text-ink-2">
                best {best.breakdown.combined.toFixed(3)}
              </Num>
            ) : null}
          </div>

          <p className="mt-2 max-w-[68ch] text-[13.5px] leading-relaxed text-ink">
            {outcome === 'match' && best ? (
              <ByMode
                simple={`${best.record.cpse} already buys this item. It sits under the national code below, so this line does not need a new one.`}
                technical={`Top candidate cleared the accept threshold of ${accept.toFixed(2)} with no unexplained token and no contradicted slot. The line resolves onto the existing code.`}
              />
            ) : outcome === 'review' && best ? (
              <ByMode
                simple={`This looks like an item ${best.record.cpse} already buys, but not closely enough to decide on its own. A storekeeper should confirm before the two are treated as one.`}
                technical={`Top candidate scored between the review threshold of ${review.toFixed(2)} and accept, or carries a token the other line does not state. Routed to a person rather than merged.`}
              />
            ) : (
              <ByMode
                simple="No company in the registry buys anything close enough to call the same item. This line would receive a national code of its own."
                technical={`No candidate cleared the review threshold of ${review.toFixed(2)}. The line mints rather than merges.`}
              />
            )}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
            <ByMode
              simple={outcome === 'new' ? 'It would become' : 'National code'}
              technical={outcome === 'new' ? 'Would mint' : 'Resolves to'}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-end gap-2">
            <Barcode size={18} weight="regular" className="text-ink-3" />
            <Num size="lg" className="text-ink">
              {code}
            </Num>
          </div>
          {outcome !== 'new' && best && best.alsoHeldBy.length > 0 ? (
            <p className="mt-1.5 text-[12px] text-ink-2">
              Also held by {best.alsoHeldBy.join(', ')}
            </p>
          ) : null}

          {/* The prefix in that code is a family, and the family was sometimes a
              default rather than a reading. Saying which is the difference between
              a classification and a guess wearing its clothes. */}
          {outcome === 'new' ? (
            <p className="mt-1.5 max-w-[34ch] text-[12px] leading-snug text-ink-2">
              {result.familyConfident ? (
                <>
                  Filed under{' '}
                  <span className="text-ink">{FAMILY_LABEL[result.family]}</span>
                </>
              ) : (
                <span className="text-attention">
                  No family matched this description. The code carries the default prefix and a
                  steward should set the class before it is issued.
                </span>
              )}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

/* --------------------------------------------------------------- what was read */

/**
 * The normalizer's working, kept beside the answer rather than behind a click.
 *
 * A ranked list with no visible reasoning is a black box, and a black box is what
 * a reviewer is entitled to distrust. The slots below are the whole basis of the
 * attribute score, and the signature underneath them is literally what gets hashed
 * into the code printed above.
 */
function WhatWasRead({ result, asked }: { result: RecommendResponse; asked: string }) {
  const { normalized } = result
  const filled = ATTRIBUTE_SLOTS.filter(slot => normalized.attributes[slot])

  return (
    <Panel flush className="h-fit">
      <PanelHead title={<ByMode simple="What it understood" technical="Normalized query" />} />

      <div className="px-5 py-4">
        <Label>As typed</Label>
        <p className="mt-1.5 break-words font-mono text-[12px] text-ink-2">{asked}</p>

        <div className="mt-4 border-t border-rule pt-4">
          <Label>
            <ByMode simple="Details it picked out" technical="Attribute slots" />
          </Label>
          {filled.length === 0 ? (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">
              No slot was filled. Nothing in this line looked like a size, a grade, a rating or a
              standard, which is why the score leans almost entirely on the words.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-rule">
              {filled.map(slot => (
                <li key={slot} className="flex items-baseline justify-between gap-3 py-1.5">
                  <ByMode
                    simple={<span className="text-[12px] text-ink-2">{SLOT_LABEL[slot]}</span>}
                    technical={<Mono>{slot}</Mono>}
                  />
                  <Num size="sm" className="text-right text-ink">
                    {normalized.attributes[slot]}
                  </Num>
                </li>
              ))}
            </ul>
          )}
        </div>

        {normalized.expansions.length > 0 ? (
          <div className="mt-4 border-t border-rule pt-4">
            <Label>
              <ByMode simple="Short forms it expanded" technical="Dictionary expansions" />
            </Label>
            <ul className="mt-2 flex flex-col gap-1.5">
              {normalized.expansions.slice(0, 8).map((expansion, index) => (
                <li
                  key={`${expansion.from}-${index}`}
                  className="flex items-center gap-2 text-[12px]"
                >
                  <span className="font-mono text-ink-3">{expansion.from}</span>
                  <ArrowRight size={12} weight="regular" className="shrink-0 text-ink-3" />
                  <span className="font-mono text-ink">{expansion.to}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <TechnicalOnly>
          <div className="mt-4 border-t border-rule pt-4">
            <Label>Canonical signature</Label>
            <p className="mt-1.5 break-words font-mono text-[11.5px] text-ink-2">
              {normalized.signature || 'empty'}
            </p>
            <p className="mt-2 text-[11.5px] leading-snug text-ink-3">
              This string, and only this string, is what the code above is derived from. Two lines
              that normalize to it receive the same code on any machine.
            </p>
          </div>
        </TechnicalOnly>

        <div className="mt-4 border-t border-rule pt-4">
          <Label>Unit</Label>
          <p className="mt-1.5 text-[12.5px] text-ink-2">
            {normalized.uom}
            <span className="text-ink-3"> after collapsing the four spellings</span>
          </p>
        </div>
      </div>
    </Panel>
  )
}

/* ------------------------------------------------------------------- ranked */

function CandidateRow({
  rank,
  recommendation,
  weights,
}: {
  rank: number
  recommendation: Recommendation
  weights: { lexical: number; attribute: number; numeric: number }
}) {
  const c = useCopy()
  const [open, setOpen] = useState(rank === 1)
  const { record, breakdown, verdict, conflicts, unexplained } = recommendation

  return (
    <li className="bg-surface">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-start gap-4 px-5 py-3.5 text-left transition-colors hover:bg-surface-2"
      >
        <Num size="sm" className="w-5 shrink-0 pt-0.5 text-ink-3">
          {rank}
        </Num>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <Mono className="shrink-0">{record.cpse}</Mono>
            <Num size="xs" className="text-ink-3">
              {record.localCode}
            </Num>
            <span className="text-[11px] text-ink-3">{FAMILY_LABEL[record.family]}</span>
          </div>
          <p className="mt-1 truncate text-[13px] leading-snug text-ink">{record.rawDescription}</p>
          <div className="mt-1.5 max-w-[420px]">
            <Meter value={breakdown.combined} tone={verdict === 'same' ? 'positive' : 'neutral'} />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <VerdictChip verdict={verdict} label={SHORT_VERDICT[verdict]} />
          <Num size="sm" className="w-[46px] text-right text-ink">
            {breakdown.combined.toFixed(3)}
          </Num>
          <CaretDown
            size={16}
            weight="regular"
            className={open ? 'text-ink-2' : '-rotate-90 text-ink-3'}
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-rule bg-surface-2 px-5 py-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <ByMode simple="How the score was reached" technical="Score breakdown" />
              </div>
              <div className="mt-3 space-y-3">
                <ScoreLine
                  label={c('scoreLexical')}
                  value={breakdown.lexical}
                  weight={weights.lexical}
                />
                <ScoreLine
                  label={c('scoreAttribute')}
                  value={breakdown.attribute}
                  weight={weights.attribute}
                />
                <ScoreLine
                  label={c('scoreNumeric')}
                  value={breakdown.numeric}
                  weight={weights.numeric}
                />
              </div>
              <TechnicalOnly>
                <div className="mt-3">
                  <Mono>{recommendation.expression}</Mono>
                </div>
              </TechnicalOnly>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                <ByMode simple="What does not line up" technical="Conflicts and unexplained words" />
              </div>

              {conflicts.length === 0 && unexplained.length === 0 ? (
                <p className="mt-3 max-w-[46ch] text-[12.5px] leading-relaxed text-ink-2">
                  <ByMode
                    simple="Nothing disagrees, and neither line says anything the other leaves out."
                    technical="No contradicted slot and no unexplained significant token."
                  />
                </p>
              ) : (
                <>
                  {conflicts.length > 0 ? (
                    <ul className="mt-3 divide-y divide-rule border-t border-rule">
                      {conflicts.map(conflict => (
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
                  ) : null}

                  {unexplained.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[12px] text-ink-2">
                        <ByMode
                          simple="One line says these and the other does not:"
                          technical="Stated on one side only:"
                        />
                      </p>
                      <p className="mt-1.5 flex flex-wrap gap-1">
                        {unexplained.slice(0, 10).map(token => (
                          <span
                            key={token}
                            className="bg-attention-bg px-1 font-mono text-[11px] text-attention"
                          >
                            {token}
                          </span>
                        ))}
                      </p>
                    </div>
                  ) : null}
                </>
              )}

              <div className="mt-4 border-t border-rule pt-3">
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-3">
                  <ByMode simple="This record sits under" technical="National code held" />
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Mono>{recommendation.code}</Mono>
                  {recommendation.alsoHeldBy.length > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[12px] text-ink-2">
                      <Plus size={11} weight="bold" className="text-ink-3" />
                      {recommendation.alsoHeldBy.join(', ')}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </li>
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
