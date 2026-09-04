/**
 * Shared types for the harmonization engine.
 *
 * Everything the UI renders derives from these. There are no display-only
 * constants: if a number appears on screen it was computed from a MaterialRecord
 * or from ScoringWeights, so the arithmetic can be checked against what is shown.
 */

/** A Central Public Sector Enterprise contributing a material master. */
export interface Cpse {
  code: 'IOCL' | 'NTPC' | 'SAIL' | 'CIL'
  name: string
  /** Source system, shown in technical view only. */
  erp: string
  /** How that system is actually reached. Named because a reviewer will ask. */
  connector: string
  /** Full material master size in the source system. */
  totalRecords: number
  /** The extract this organisation hands over, served from /masters. */
  extract: string
}

/** The attribute slots the normalizer extracts. Order is significant: it is the
 *  order they are concatenated in to form the canonical signature. */
export const ATTRIBUTE_SLOTS = [
  'noun',
  'variant',
  'material',
  'grade',
  'dimension',
  'rating',
  'standard',
] as const

export type AttributeSlot = (typeof ATTRIBUTE_SLOTS)[number]

/**
 * Separator between the several qualifiers a variant slot can hold.
 *
 * The normalizer joins with it and the scorer splits on it again, so it has to be
 * a string no expansion contains. A plain space would not do: DEEP GROOVE and
 * PRESSURE RELIEF are single qualifiers written as two words.
 */
export const VARIANT_SEPARATOR = ', '

/** One raw record as it exists inside a CPSE's ERP. */
export interface MaterialRecord {
  id: string
  cpse: Cpse['code']
  /** The CPSE's own internal code. */
  localCode: string
  /** The raw description string, abbreviated and inconsistent, as stored. */
  rawDescription: string
  /** Unit of measure as stored, deliberately inconsistent across CPSEs. */
  rawUom: string
  family: MaterialFamily
  /** Annual quantity purchased, used by the savings model. */
  annualQty: number
  /** Rupees per unit. */
  unitPrice: number
  /**
   * Units sitting in this organisation's stores right now.
   *
   * This is the field that makes duplicate codes expensive rather than merely
   * untidy. While the same item carries four codes, no organisation can see the
   * other three holdings, so all four order against their own cover. Under one
   * national code the four holdings add up and become visible.
   */
  stockOnHand: number
}

export type MaterialFamily =
  | 'bearings'
  | 'pipes_tubes'
  | 'valves_fittings'
  | 'fasteners'
  | 'electrical'
  | 'gaskets_seals'
  | 'motors_drives'
  | 'instruments'
  | 'structural_steel'
  | 'safety_ppe'
  | 'lubricants'
  | 'welding'

/** Two-letter prefix used when minting a national code for a family. */
export const FAMILY_PREFIX: Record<MaterialFamily, string> = {
  bearings: 'BE',
  pipes_tubes: 'PT',
  valves_fittings: 'VF',
  fasteners: 'FA',
  electrical: 'EL',
  gaskets_seals: 'GK',
  motors_drives: 'MT',
  instruments: 'IN',
  structural_steel: 'SS',
  safety_ppe: 'SP',
  lubricants: 'LB',
  welding: 'WE',
}

/**
 * The material group a source system reports, back to the family it means.
 *
 * An extract carries its own group name in its own column. Reading it is better
 * evidence than inferring the family from keywords in the description, so the
 * loader looks here first and only guesses when the source stayed silent.
 */
export function familyFromLabel(label: string): MaterialFamily | null {
  const key = label.trim().toLowerCase()
  if (!key) return null
  for (const [family, text] of Object.entries(FAMILY_LABEL)) {
    if (text.toLowerCase() === key) return family as MaterialFamily
  }
  return (Object.keys(FAMILY_LABEL) as MaterialFamily[]).find(f => f === key) ?? null
}

export const FAMILY_LABEL: Record<MaterialFamily, string> = {
  bearings: 'Bearings',
  pipes_tubes: 'Pipes and tubes',
  valves_fittings: 'Valves and fittings',
  fasteners: 'Fasteners',
  electrical: 'Electrical',
  gaskets_seals: 'Gaskets and seals',
  motors_drives: 'Motors and drives',
  instruments: 'Instruments',
  structural_steel: 'Structural steel',
  safety_ppe: 'Safety and PPE',
  lubricants: 'Lubricants',
  welding: 'Welding',
}

/** One abbreviation expansion that fired during normalization. */
export interface Expansion {
  /** Token as it appeared in the raw description. */
  from: string
  /** What the dictionary expanded it to. */
  to: string
  /** Which dictionary rule was responsible, so the rule is inspectable. */
  rule: string
}

/** Result of running a raw description through the normalizer. */
export interface NormalizedRecord {
  recordId: string
  raw: string
  /** Uppercased, punctuation-split tokens before expansion. */
  tokens: string[]
  /** Tokens after dictionary expansion, deduplicated, in order. */
  normalizedTokens: string[]
  expansions: Expansion[]
  attributes: Partial<Record<AttributeSlot, string>>
  /** Attribute values joined by a pipe. This is what gets hashed into a code. */
  signature: string
  /** UOM after normalization, so NOS / NO / EA all collapse to one value. */
  uom: string
}

/** The three components of a match score, plus the weighted combination. */
export interface ScoreBreakdown {
  lexical: number
  attribute: number
  numeric: number
  /** weights.lexical * lexical + weights.attribute * attribute + weights.numeric * numeric */
  combined: number
}

export interface ScoringWeights {
  lexical: number
  attribute: number
  numeric: number
}

/** An attribute that disagrees between two records. When a pair scores below
 *  threshold, the highest-impact conflict is what the UI names as the reason. */
export interface AttributeConflict {
  slot: AttributeSlot
  left: string
  right: string
}

export type Verdict = 'same' | 'review' | 'different'

/** A candidate pair produced by the matcher. */
export interface MatchPair {
  id: string
  left: MaterialRecord
  right: MaterialRecord
  leftNorm: NormalizedRecord
  rightNorm: NormalizedRecord
  score: ScoreBreakdown
  verdict: Verdict
  conflicts: AttributeConflict[]
  /**
   * Words one line states and the other does not, after stop words and maker
   * names are removed. While this is non-empty the pair cannot be accepted
   * automatically, however high it scores: the two lines do not disagree, but
   * neither do they agree.
   */
  unexplained: string[]
  /** Tokens present in one description and absent from the other. */
  leftOnlyTokens: string[]
  rightOnlyTokens: string[]
  /** National code the pair would resolve to. */
  proposedCode: string
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected'

/** A group of records that resolved to one national code. */
export interface Cluster {
  code: string
  family: MaterialFamily
  signature: string
  members: MaterialRecord[]
  /** Distinct CPSE codes represented in members. */
  cpses: Cpse['code'][]
  /** Canonical description built from the winning attribute set. */
  standardDescription: string
  uom: string
  /** Sum of annualQty * unitPrice across members. */
  annualSpend: number
  unspsc: string
  standard: string
}

export interface SavingsInputs {
  /** Share of duplicate line items that can realistically be consolidated. */
  consolidatableShare: number
  /** Average annual procurement spend attributable to one duplicate item. */
  avgAnnualSpendPerItem: number
  /** Discount achieved by tendering the consolidated volume as one line. */
  bulkDiscount: number
}

export interface SavingsResult {
  duplicateLineItems: number
  consolidatableItems: number
  addressableSpend: number
  annualSaving: number
  /** Ordered steps for the waterfall, each with the assumption that produced it. */
  steps: { label: string; assumption: string; value: number; unit: 'count' | 'rupees' }[]
}

export type ActivityAction =
  | 'ingest'
  | 'normalize'
  | 'match'
  | 'approve'
  | 'reject'
  | 'mint'
  | 'import'
  | 'config'

export interface ActivityEntry {
  id: string
  ts: number
  action: ActivityAction
  actor: string
  cpse?: string
  /** Plain language, written for someone who does not work in procurement. */
  detail: string
  code?: string
  /** Endpoint that produced this entry, shown in technical view. */
  endpoint?: string
}
