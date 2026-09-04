/**
 * Normalizer.
 *
 * Takes a raw ERP description written by whoever was at the counter that day and
 * produces a structured record: expanded tokens, filled attribute slots, and a
 * canonical signature. The signature is what gets hashed into a national code, so
 * two records that normalize to the same signature necessarily get the same code.
 *
 * Every expansion carries the dictionary rule that produced it, so the Normalization
 * page can show its working rather than asserting a result.
 */

import { BASE_RULES, STOP_TOKENS, buildIndex, type DictionaryRule } from './dictionary'
import {
  ATTRIBUTE_SLOTS,
  VARIANT_SEPARATOR,
  type AttributeSlot,
  type Expansion,
  type NormalizedRecord,
} from './types'

/** Standards bodies we recognise in a description.
 *
 *  The separator class has to include comma and slash. Material masters are very
 *  often exported comma or slash delimited, which turns "IS 2062" into "IS,2062",
 *  and a class of only whitespace leaves the standard unrecognised for exactly the
 *  organisations that punctuate that way. */
const STANDARD_RE =
  /\b(IS|ASTM|ASME|ISO|IEC|DIN|BS|API|AWS|UNS)[\s:,./\-]?([A-Z]?\d[\w.\-]*)/gi

/** Thread and nominal-size forms: M20X100, 100NB, DN150, 50X50X6, 25MM, 3.5C,
 *  and cable conductor configurations such as 3CX240 or 4CX2.5. */
const DIMENSION_RE =
  /^(M\d+(?:[X*]\d+)?|\d+(?:\.\d+)?(?:NB|MM|CM|MTR|M)|DN\d+|\d+C[X*]\d+(?:\.\d+)?|\d+X\d+(?:X\d+)?|\d+(?:\.\d+)?C|\d{4,5})$/i

/** Pressure, temperature, electrical and power ratings: PN16, SCH40, 1.1KV, 415V,
 *  10HP, 5.5KW, and ranges such as 0-10BAR, 4-20MA, 18-25A.
 *
 *  Ranges have to be here. An instrument is defined by its span, and without the
 *  range form a 0-10 bar gauge and a 0-100 bar gauge fill no rating slot at all,
 *  record no conflict, and score a perfect attribute match against each other. */
const RATING_RE =
  /^(PN\d+|SCH(?:EDULE)?\s?\d+|CL(?:ASS)?\s?\d+|(?:\d+(?:\.\d+)?-)?\d+(?:\.\d+)?(KV|MA|V|HP|KW|A|BAR|RPM|C))$/i

/** Material and strength grades: 8.8, 304, 316, E250, E6013, VG46, EP2. */
const GRADE_RE = /^(\d\.\d|30[46]|31[68]|E\d{3,4}|VG\s?\d+|EP\s?\d|[A-Z]\d{2,3}[A-Z]?)$/

const UOM_CANON: Record<string, string> = {
  NOS: 'EACH', NO: 'EACH', EA: 'EACH', PCS: 'EACH', PC: 'EACH', EACH: 'EACH', UNIT: 'EACH',
  MTR: 'METRE', M: 'METRE', RMT: 'METRE', MT: 'METRE', METRE: 'METRE', MTS: 'METRE',
  KG: 'KILOGRAM', KGS: 'KILOGRAM', KILOGRAM: 'KILOGRAM',
  LTR: 'LITRE', L: 'LITRE', LIT: 'LITRE', LITRE: 'LITRE',
  SQM: 'SQUARE METRE', SHT: 'EACH', SET: 'EACH',
}

export function canonicalUom(raw: string): string {
  return UOM_CANON[raw.trim().toUpperCase()] ?? raw.trim().toUpperCase()
}

/** Split a raw description into comparable tokens.
 *  Punctuation separates, but internal hyphens and dots inside a part number survive
 *  so that 6205-2RS stays one token rather than becoming two useless ones. */
export function tokenize(raw: string): string[] {
  return raw
    .toUpperCase()
    .replace(STANDARD_RE, ' ')
    .split(/[\s,;:/\\()[\]"']+/)
    .map(t => t.replace(/^[.\-]+|[.\-]+$/g, ''))
    .filter(t => t.length > 0)
}

function extractStandard(raw: string): string | undefined {
  STANDARD_RE.lastIndex = 0
  const match = STANDARD_RE.exec(raw.toUpperCase())
  if (!match) return undefined
  return `${match[1].toUpperCase()} ${match[2].toUpperCase()}`
}

/**
 * Run one raw description through the dictionary and the slot extractors.
 *
 * @param rules pass a extended rule set to see the effect of a dictionary edit
 *              without mutating the base dictionary.
 */
export function normalize(
  raw: string,
  rawUom: string,
  recordId = 'adhoc',
  rules: DictionaryRule[] = BASE_RULES,
): NormalizedRecord {
  const index = buildIndex(rules)
  const tokens = tokenize(raw)
  const expansions: Expansion[] = []
  const attributes: Partial<Record<AttributeSlot, string>> = {}
  const normalizedTokens: string[] = []
  /**
   * Variant is the one slot that legitimately holds more than one fact.
   *
   * A line reads VALVE, GATE, ..., FLANGED: the body style and the end connection
   * are both variants and both identify the item. First-wins gave the slot to
   * whichever appeared earlier and threw the other away, so a gate valve and a
   * check valve of the same bore, class and material filled identical slots,
   * recorded no conflict at all and reached a queue asking a person whether they
   * were the same part. Collected and sorted, the two lines disagree, which is
   * what they in fact do.
   */
  const variants = new Set<string>()

  const standard = extractStandard(raw)
  if (standard) attributes.standard = standard

  const unmatched: string[] = []

  // Pass one: the dictionary. Explicit rules are knowledge someone wrote down, so
  // they claim their slots before any guessing happens.
  for (const token of tokens) {
    const rule = index.get(token)

    if (!rule) {
      if (STOP_TOKENS.has(token)) continue
      if (!normalizedTokens.includes(token)) normalizedTokens.push(token)
      unmatched.push(token)
      continue
    }

    expansions.push({
      from: token,
      to: rule.expansion,
      rule: `${rule.source}: ${rule.token} -> ${rule.expansion}`,
    })
    // A unit of measure written inside a description carries no descriptive weight
    // and is dropped. Everything else contributes its words even when it claims no
    // slot: OD is a qualifier, not a dimension, and letting it occupy the dimension
    // slot is what made a 25MM tube and a 6MM tube record no conflict at all.
    if (rule.slot === null && rule.source === 'UOM') continue

    for (const word of rule.expansion.split(' ')) {
      if (!normalizedTokens.includes(word)) normalizedTokens.push(word)
    }
    if (rule.slot === 'variant') variants.add(rule.expansion)
    else if (rule.slot !== null && !attributes[rule.slot]) attributes[rule.slot] = rule.expansion
  }

  // Sorted, so two organisations that write the same qualifiers in a different
  // order still land on one value and therefore one national code. The separator
  // has to be one no expansion contains, because the scorer splits on it again to
  // compare the two sets: DEEP GROOVE is one qualifier, not two.
  if (variants.size > 0) attributes.variant = [...variants].sort().join(VARIANT_SEPARATOR)

  // Pass two: shape heuristics fill whatever the dictionary left empty. Running
  // this second is what stops "BALL BEARING" from recording BALL as its noun
  // merely because BALL is the first four-letter token in the string.
  for (const token of unmatched) {
    if (!attributes.dimension && DIMENSION_RE.test(token)) {
      attributes.dimension = token
    } else if (!attributes.rating && RATING_RE.test(token)) {
      attributes.rating = token
    } else if (!attributes.grade && GRADE_RE.test(token)) {
      attributes.grade = token
    } else if (!attributes.noun && /^[A-Z]{4,}$/.test(token)) {
      attributes.noun = token
    }
  }

  return {
    recordId,
    raw,
    tokens,
    normalizedTokens,
    expansions,
    attributes,
    signature: buildSignature(attributes),
    uom: canonicalUom(rawUom),
  }
}

/** Attribute values in slot order, joined by a pipe. Empty slots are skipped, so
 *  a record that omits a rating still lands on the same signature as one that
 *  states the default. */
export function buildSignature(attributes: Partial<Record<AttributeSlot, string>>): string {
  return ATTRIBUTE_SLOTS.map(slot => attributes[slot])
    .filter((value): value is string => Boolean(value))
    .join('|')
}

/** Human-readable canonical description, used as a cluster's standard description. */
export function describeSignature(attributes: Partial<Record<AttributeSlot, string>>): string {
  const ordered: AttributeSlot[] = ['noun', 'variant', 'material', 'grade', 'dimension', 'rating', 'standard']
  return ordered
    .map(slot => attributes[slot])
    .filter((value): value is string => Boolean(value))
    .join(', ')
}
