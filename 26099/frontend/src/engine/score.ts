/**
 * Scoring.
 *
 * Three independent sub-scores, combined by operator-set weights. The critical
 * property, and the one the previous build got wrong, is that the combined score
 * is computed from the same rounded sub-score values that appear on screen. Anyone
 * can check the arithmetic against the card.
 */

import { STOP_TOKENS, VENDOR_TOKENS } from './dictionary'
import {
  ATTRIBUTE_SLOTS,
  VARIANT_SEPARATOR,
  type AttributeConflict,
  type AttributeSlot,
  type NormalizedRecord,
  type ScoreBreakdown,
  type ScoringWeights,
  type Verdict,
} from './types'

export const DEFAULT_WEIGHTS: ScoringWeights = { lexical: 0.3, attribute: 0.45, numeric: 0.25 }

/** Above this a pair is treated as the same item. Between the two it needs a human. */
export const DEFAULT_ACCEPT = 0.88
export const DEFAULT_REVIEW = 0.72

/** Sub-scores are rounded to two decimals before combination so that what is shown
 *  and what is computed are the same numbers. */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function significant(tokens: string[]): Set<string> {
  return new Set(tokens.filter(t => !STOP_TOKENS.has(t) && !VENDOR_TOKENS.has(t) && t.length > 1))
}

/**
 * Words one line states and the other does not.
 *
 * This is the difference between "these two lines agree" and "these two lines do
 * not disagree", which are not the same thing and were being treated as if they
 * were. A gate valve and a rising stem gate valve contradict each other on
 * nothing: every slot they both fill matches, every number matches, and the pair
 * scored 0.95 and was merged. But one of them says RISING STEM and the other says
 * nothing at all, and no storekeeper would sign that off without looking.
 *
 * Stop words and maker names are already gone by this point, so anything left is
 * a word somebody typed on purpose.
 */
export function unexplainedTokens(a: NormalizedRecord, b: NormalizedRecord): string[] {
  const setA = significant(a.normalizedTokens)
  const setB = significant(b.normalizedTokens)
  const out: string[] = []
  for (const token of setA) if (!setB.has(token)) out.push(token)
  for (const token of setB) if (!setA.has(token)) out.push(token)
  return out
}

/** Token overlap over the union. Straightforward, explainable, and it is what the
 *  UI claims it is. */
export function lexicalScore(a: NormalizedRecord, b: NormalizedRecord): number {
  const setA = significant(a.normalizedTokens)
  const setB = significant(b.normalizedTokens)
  if (setA.size === 0 && setB.size === 0) return 0
  let shared = 0
  for (const token of setA) if (setB.has(token)) shared += 1
  const union = setA.size + setB.size - shared
  return union === 0 ? 0 : shared / union
}

/**
 * Agreement across the attribute slots.
 *
 * A slot where both records state a value and the values match scores 1. A slot
 * only one record fills scores 0.5, because silence is weaker evidence of
 * disagreement than a contradiction. Slots neither record fills are ignored.
 *
 * A slot where both state a value and the values differ scores 0 and is recorded
 * as a conflict, and it counts double against the total. That asymmetry is
 * deliberate: a storekeeper reading two lines that agree on everything except the
 * bore does not call it a near match, they call it a different part. Weighting a
 * contradiction the same as a missing field leaves a 100NB valve and a 150NB valve
 * scoring high enough to reach a review queue that should never have seen them.
 */
export function attributeScore(
  a: NormalizedRecord,
  b: NormalizedRecord,
): { score: number; conflicts: AttributeConflict[] } {
  const conflicts: AttributeConflict[] = []
  let total = 0
  let considered = 0

  for (const slot of ATTRIBUTE_SLOTS) {
    const left = a.attributes[slot]
    const right = b.attributes[slot]
    if (!left && !right) continue

    if (left && right) {
      const agreement = slot === 'variant' ? compareSets(left, right) : compareValues(left, right)
      if (agreement === 'match') {
        total += 1
        considered += 1
      } else if (agreement === 'partial') {
        total += 0.5
        considered += 1
      } else {
        conflicts.push({ slot, left, right })
        considered += 2
      }
    } else {
      total += 0.5
      considered += 1
    }
  }

  return { score: considered === 0 ? 0 : total / considered, conflicts }
}

type Agreement = 'match' | 'partial' | 'conflict'

function compareValues(left: string, right: string): Agreement {
  return normalizeValue(left) === normalizeValue(right) ? 'match' : 'conflict'
}

/**
 * Variant holds a set of qualifiers, so it has to be compared as one.
 *
 * A line reading VALVE, GATE, 150NB and a line reading VALVE, GATE, 150NB,
 * FLANGED do not disagree: the second says more. Comparing the joined strings
 * called that a contradiction, which would have thrown away real matches for the
 * sake of catching the false ones. A subset is silence and scores as a half; only
 * two sets that each hold something the other does not are a contradiction, and
 * that is a check valve against a gate valve.
 */
function compareSets(left: string, right: string): Agreement {
  const a = new Set(left.split(VARIANT_SEPARATOR).filter(Boolean))
  const b = new Set(right.split(VARIANT_SEPARATOR).filter(Boolean))
  const aExtra = [...a].some(value => !b.has(value))
  const bExtra = [...b].some(value => !a.has(value))
  if (!aExtra && !bExtra) return 'match'
  if (!aExtra || !bExtra) return 'partial'
  return 'conflict'
}

function normalizeValue(value: string): string {
  return value.replace(/[\s\-.]/g, '').toUpperCase()
}

/** Numbers carry most of the discriminating power in industrial descriptions:
 *  a 6205 bearing and a 6206 bearing read almost identically to a token matcher. */
export function numericScore(a: NormalizedRecord, b: NormalizedRecord): number {
  const numsA = extractNumbers(a)
  const numsB = extractNumbers(b)
  if (numsA.size === 0 && numsB.size === 0) return 0.5
  if (numsA.size === 0 || numsB.size === 0) return 0.35
  let shared = 0
  for (const value of numsA) if (numsB.has(value)) shared += 1
  const union = numsA.size + numsB.size - shared
  return union === 0 ? 0 : shared / union
}

function extractNumbers(record: NormalizedRecord): Set<string> {
  const found = new Set<string>()
  const sources = [
    record.attributes.dimension,
    record.attributes.rating,
    record.attributes.grade,
    record.attributes.standard,
    ...record.normalizedTokens,
  ]
  for (const source of sources) {
    if (!source) continue
    for (const match of source.matchAll(/\d+(?:\.\d+)?/g)) found.add(match[0])
  }
  return found
}

export function score(
  a: NormalizedRecord,
  b: NormalizedRecord,
  weights: ScoringWeights,
): { breakdown: ScoreBreakdown; conflicts: AttributeConflict[]; unexplained: string[] } {
  const lexical = round2(lexicalScore(a, b))
  const attribute = attributeScore(a, b)
  const attr = round2(attribute.score)
  const numeric = round2(numericScore(a, b))

  const combined =
    Math.round((weights.lexical * lexical + weights.attribute * attr + weights.numeric * numeric) * 10000) / 10000

  return {
    breakdown: { lexical, attribute: attr, numeric, combined },
    conflicts: attribute.conflicts,
    unexplained: unexplainedTokens(a, b),
  }
}

/** The arithmetic, formatted exactly as the card prints it, so the two cannot drift. */
export function scoreExpression(breakdown: ScoreBreakdown, weights: ScoringWeights): string {
  const f = (n: number) => n.toFixed(2)
  return (
    `${f(weights.lexical)} x ${f(breakdown.lexical)} + ` +
    `${f(weights.attribute)} x ${f(breakdown.attribute)} + ` +
    `${f(weights.numeric)} x ${f(breakdown.numeric)} = ${breakdown.combined.toFixed(3)}`
  )
}

/**
 * Slots where a contradiction settles the question on its own.
 *
 * These hold stated facts rather than choices of word. A 65NB valve is not a
 * 150NB valve, CL150 is not CL300, SS304 is not SS316, and IS 1239 is not IS
 * 3589 - there is no reading of those two lines under which they are the same
 * part, so there is nothing for a person to decide and asking them is a waste of
 * their afternoon.
 *
 * `noun` and `variant` are deliberately not here. Those hold words, and two
 * organisations genuinely do call one item a STRAINER and a FILTER, a HOOTER and
 * a SIREN, a chequered plate and a durbar plate. A contradiction there is a real
 * question and belongs in front of a reviewer.
 */
const DECISIVE_SLOTS = new Set<AttributeSlot>([
  'variant',
  'dimension',
  'rating',
  'grade',
  'material',
  'standard',
])

export function decisiveConflicts(conflicts: AttributeConflict[]): AttributeConflict[] {
  return conflicts.filter(conflict => DECISIVE_SLOTS.has(conflict.slot))
}

/**
 * The verdict.
 *
 * Three rules, in order of how much they settle.
 *
 * A contradiction on a measured or specified attribute is decisive and returns
 * different whatever the score says. Weighting such a conflict heavily inside the
 * attribute sub-score was not enough on its own: a gate valve in 65NB and the
 * same gate valve in 150NB agree on the noun, the body material, the class, the
 * end connection and the standard, so the pair still combined to 0.727 and landed
 * in a queue asking a human whether two different bores are the same item.
 *
 * Then `unexplained`: the count of words that appear on one line and not the
 * other after stop words and maker names have been removed. While there are any,
 * the most this can return is review. That is the difference between a console
 * that quietly merged a plain gate valve into a rising stem one at 0.95, and a
 * console that puts the pair in front of a person with the word RISING
 * highlighted. Silence is not agreement.
 *
 * Only then does the score decide.
 */
export function verdictFor(
  combined: number,
  accept: number,
  review: number,
  unexplained = 0,
  conflicts: AttributeConflict[] = [],
): Verdict {
  if (decisiveConflicts(conflicts).length > 0) return 'different'
  if (combined >= accept) return unexplained > 0 ? 'review' : 'same'
  if (combined >= review) return 'review'
  return 'different'
}

/** Weights always sum to 1. Moving one redistributes the remainder across the other
 *  two in their existing proportion, so the operator cannot create an invalid state. */
export function rebalance(
  weights: ScoringWeights,
  key: keyof ScoringWeights,
  value: number,
): ScoringWeights {
  const clamped = Math.min(1, Math.max(0, value))
  const others = (Object.keys(weights) as (keyof ScoringWeights)[]).filter(k => k !== key)
  const remaining = 1 - clamped
  const currentOthers = others.reduce((sum, k) => sum + weights[k], 0)

  const next = { ...weights, [key]: clamped } as ScoringWeights
  if (currentOthers === 0) {
    for (const k of others) next[k] = remaining / others.length
  } else {
    for (const k of others) next[k] = (weights[k] / currentOthers) * remaining
  }
  for (const k of Object.keys(next) as (keyof ScoringWeights)[]) {
    next[k] = Math.round(next[k] * 100) / 100
  }
  // Absorb rounding drift into the largest of the other two.
  const drift = Math.round((1 - (next.lexical + next.attribute + next.numeric)) * 100) / 100
  if (drift !== 0) {
    const target = others.sort((x, y) => next[y] - next[x])[0]
    next[target] = Math.round((next[target] + drift) * 100) / 100
  }
  return next
}

/** Tokens present in one description and absent from the other. The UI marks these
 *  so the eye can see immediately what the two organisations wrote differently. */
export function tokenDiff(a: NormalizedRecord, b: NormalizedRecord) {
  const setA = significant(a.normalizedTokens)
  const setB = significant(b.normalizedTokens)
  return {
    leftOnly: [...setA].filter(t => !setB.has(t)),
    rightOnly: [...setB].filter(t => !setA.has(t)),
  }
}
