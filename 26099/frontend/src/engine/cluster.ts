/**
 * Candidate generation, clustering, and code minting.
 *
 * A national code is a pure function of the item's canonical signature. It is not
 * assigned by row order and it is not stored in a table: give the same signature
 * twice and you get the same code twice, on any machine. The Code Book page shows
 * this derivation so the property is visible rather than claimed.
 */

import { normalize } from './normalize'
import { describeSignature } from './normalize'
import { score, tokenDiff, verdictFor } from './score'
import { STOP_TOKENS } from './dictionary'
import {
  FAMILY_PREFIX,
  type Cluster,
  type Cpse,
  type MatchPair,
  type MaterialFamily,
  type MaterialRecord,
  type NormalizedRecord,
  type ScoringWeights,
} from './types'

/** FNV-1a. Chosen because it is short enough to write out in the UI next to the
 *  code it produced, which is the whole point of showing a derivation. */
export function hashSignature(signature: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < signature.length; i++) {
    hash ^= signature.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193) >>> 0
  }
  return hash.toString(16).toUpperCase().padStart(8, '0').slice(0, 4)
}

export function mintCode(family: MaterialFamily, signature: string): string {
  return `CNMC-${FAMILY_PREFIX[family]}-${hashSignature(signature)}`
}

/** The literal string the Code Book prints to explain where a code came from. */
export function codeDerivation(family: MaterialFamily, signature: string): string {
  return `family(${FAMILY_PREFIX[family]}) + hash("${signature}") -> ${mintCode(family, signature)}`
}

const UNSPSC: Record<MaterialFamily, string> = {
  bearings: '31171501',
  pipes_tubes: '40141700',
  valves_fittings: '40141600',
  fasteners: '31161500',
  electrical: '26121600',
  gaskets_seals: '40151500',
  motors_drives: '26101600',
  instruments: '41111900',
  structural_steel: '30102900',
  safety_ppe: '46181500',
  lubricants: '15121500',
  welding: '23271700',
}

export function normalizeAll(records: MaterialRecord[]): Map<string, NormalizedRecord> {
  const out = new Map<string, NormalizedRecord>()
  for (const record of records) {
    out.set(record.id, normalize(record.rawDescription, record.rawUom, record.id))
  }
  return out
}

/**
 * Blocking key. Comparing all 220 records pairwise is 24,090 comparisons; at the
 * full 24.1 lakh corpus it would be about 2.9 x 10^12, which is why production
 * systems block first. Records only become candidates when they share a family and
 * at least one significant token, which is cheap and loses almost nothing.
 */
function blockKey(record: MaterialRecord, normalized: NormalizedRecord): string[] {
  return normalized.normalizedTokens
    .filter(t => !STOP_TOKENS.has(t) && t.length > 2)
    .map(t => `${record.family}:${t}`)
}

export interface PairOptions {
  weights: ScoringWeights
  accept: number
  review: number
  /** Pairs below this are not surfaced at all. Keeps the queue honest rather than long. */
  floor?: number
  /** Only compare records from different CPSEs. Cross-organisation duplication is
   *  the problem being solved; within-organisation duplication is a separate one. */
  crossCpseOnly?: boolean
}

export function buildPairs(
  records: MaterialRecord[],
  normalized: Map<string, NormalizedRecord>,
  options: PairOptions,
): MatchPair[] {
  const { weights, accept, review, floor = 0.45, crossCpseOnly = true } = options

  const buckets = new Map<string, MaterialRecord[]>()
  for (const record of records) {
    const norm = normalized.get(record.id)
    if (!norm) continue
    for (const key of blockKey(record, norm)) {
      const bucket = buckets.get(key)
      if (bucket) bucket.push(record)
      else buckets.set(key, [record])
    }
  }

  const seen = new Set<string>()
  const pairs: MatchPair[] = []

  // A token shared by more than this many records in one family is not selective
  // enough to block on: it is behaving like a stop word, and expanding it costs
  // quadratic time for candidates the scorer will reject anyway. The cap has to sit
  // above the largest legitimate block, or true matches vanish without a trace.
  const MAX_BLOCK = 150

  for (const bucket of buckets.values()) {
    if (bucket.length < 2 || bucket.length > MAX_BLOCK) continue
    for (let i = 0; i < bucket.length; i++) {
      for (let j = i + 1; j < bucket.length; j++) {
        const left = bucket[i]
        const right = bucket[j]
        if (crossCpseOnly && left.cpse === right.cpse) continue

        const key = left.id < right.id ? `${left.id}:${right.id}` : `${right.id}:${left.id}`
        if (seen.has(key)) continue
        seen.add(key)

        const leftNorm = normalized.get(left.id)
        const rightNorm = normalized.get(right.id)
        if (!leftNorm || !rightNorm) continue

        const result = score(leftNorm, rightNorm, weights)
        if (result.breakdown.combined < floor) continue

        const diff = tokenDiff(leftNorm, rightNorm)
        const family = left.family
        pairs.push({
          id: key.replace(':', '-'),
          left,
          right,
          leftNorm,
          rightNorm,
          score: result.breakdown,
          verdict: verdictFor(
            result.breakdown.combined,
            accept,
            review,
            result.unexplained.length,
            result.conflicts,
          ),
          conflicts: result.conflicts,
          unexplained: result.unexplained,
          leftOnlyTokens: diff.leftOnly,
          rightOnlyTokens: diff.rightOnly,
          proposedCode: mintCode(family, leftNorm.signature),
        })
      }
    }
  }

  return pairs.sort((a, b) => b.score.combined - a.score.combined)
}

/** Union-find over accepted pairs. A cluster is a connected component. */
export function buildClusters(
  records: MaterialRecord[],
  normalized: Map<string, NormalizedRecord>,
  pairs: MatchPair[],
  approvals: Map<string, 'approved' | 'rejected'> = new Map(),
): Cluster[] {
  const parent = new Map<string, string>()
  const find = (id: string): string => {
    let root = parent.get(id) ?? id
    if (root !== id) {
      root = find(root)
      parent.set(id, root)
    }
    return root
  }
  const union = (a: string, b: string) => {
    const rootA = find(a)
    const rootB = find(b)
    if (rootA !== rootB) parent.set(rootA, rootB)
  }

  for (const record of records) parent.set(record.id, record.id)

  for (const pair of pairs) {
    const decision = approvals.get(pair.id)
    // A rejection is a human overruling the score, and it holds.
    if (decision === 'rejected') continue
    // Merge on the verdict, not on the raw score. A pair where one line states
    // something the other does not is held at review however high it scored, and
    // reading the score directly here walked straight past that: the pair showed
    // as pending in the queue while the clusterer had already merged it, so the
    // code book carried a merge nobody had agreed to.
    if (decision === 'approved' || pair.verdict === 'same') {
      union(pair.left.id, pair.right.id)
    }
  }

  const groups = new Map<string, MaterialRecord[]>()
  for (const record of records) {
    const root = find(record.id)
    const group = groups.get(root)
    if (group) group.push(record)
    else groups.set(root, [record])
  }

  const clusters: Cluster[] = []
  for (const members of groups.values()) {
    // The representative is the record with the richest signature, since the most
    // completely described member is the best basis for a standard description.
    const representative = members
      .map(m => ({ record: m, norm: normalized.get(m.id)! }))
      .filter(entry => entry.norm)
      .sort((a, b) => b.norm.signature.length - a.norm.signature.length)[0]
    if (!representative) continue

    const family = representative.record.family
    const signature = representative.norm.signature
    const cpses = [...new Set(members.map(m => m.cpse))] as Cpse['code'][]

    clusters.push({
      code: mintCode(family, signature),
      family,
      signature,
      members,
      cpses,
      standardDescription: describeSignature(representative.norm.attributes),
      uom: representative.norm.uom,
      annualSpend: members.reduce((sum, m) => sum + m.annualQty * m.unitPrice, 0),
      unspsc: UNSPSC[family],
      standard: representative.norm.attributes.standard ?? 'not stated',
    })
  }

  return clusters.sort((a, b) => b.annualSpend - a.annualSpend)
}

/** Headline corpus health. Printed on the Explorer so a bad clustering run is
 *  visible rather than hidden behind an average. */
export function corpusHealth(records: MaterialRecord[], clusters: Cluster[]) {
  const multi = clusters.filter(c => c.members.length > 1)
  return {
    records: records.length,
    distinctCodes: clusters.length,
    clustersWithDuplicates: multi.length,
    duplicateRecords: multi.reduce((sum, c) => sum + c.members.length - 1, 0),
    largestCluster: clusters.reduce((max, c) => Math.max(max, c.members.length), 0),
    crossCpseClusters: multi.filter(c => c.cpses.length > 1).length,
  }
}
