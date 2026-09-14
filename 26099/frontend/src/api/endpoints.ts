/**
 * Harmonization service endpoints.
 *
 * The surface a page is allowed to depend on. Each function names the HTTP method
 * and path it represents, so what appears in the request strip in the interface is
 * the same string that appears here and, in live mode, the same route on the
 * FastAPI service.
 */

import { call, sleep, type ApiResult } from './client'
import { serviceState, bumpVersion, writeLearned } from './state'
import { parseCsv } from './csv'
import type { IngestPreview, ParsedRow } from './types'
import { CPSES, TOTAL_RECORDS } from '@/engine/corpus'
import { BASE_RULES, type DictionaryRule } from '@/engine/dictionary'
import { normalize } from '@/engine/normalize'
import { score, scoreExpression, verdictFor } from '@/engine/score'
import {
  buildClusters,
  buildPairs,
  codeDerivation,
  corpusHealth,
  mintCode,
  normalizeAll,
} from '@/engine/cluster'
import { computeSavings } from '@/engine/savings'
import {
  familyFromLabel,
  type ActivityEntry,
  type AttributeConflict,
  type Cluster,
  type Cpse,
  type MatchPair,
  type MaterialRecord,
  type NormalizedRecord,
  type SavingsInputs,
  type SavingsResult,
  type ScoreBreakdown,
  type ScoringWeights,
  type Verdict,
} from '@/engine/types'

export interface LearnResponse {
  tokens: string[]
  count: number
}

/** POST /match/learn
 *
 * Record tokens that a reviewer has confirmed are harmless differences.
 * They are excluded from the unexplained check from the next re-score onward,
 * so pairs whose only clashing tokens are in this set auto-resolve.
 */
export function learnTokens(pairId: string, tokens: string[]): Promise<ApiResult<LearnResponse>> {
  return call(
    'POST',
    '/match/learn',
    { pairId, tokens },
    () => {
      for (const token of tokens) serviceState.learnedTokens.add(token)
      writeLearned(serviceState.learnedTokens)
      pushActivity({
        action: 'config',
        actor: serviceState.operator,
        detail: `Learned that ${tokens.join(', ')} ${
          tokens.length === 1 ? 'is a harmless difference' : 'are harmless differences'
        }. Future pairs with only these tokens clashing will resolve automatically.`,
        code: pairId,
        endpoint: 'POST /match/learn',
      })
      bumpVersion()
      return { tokens, count: tokens.length }
    },
    { scanned: 0 },
  )
}

/* ------------------------------------------------------------------ normalize */

export interface NormalizeResponse {
  normalized: NormalizedRecord
  /** Every rule in the dictionary that could have fired, matched or not, so the
   *  Normalization page can show near-misses as well as hits. */
  dictionarySize: number
}

/** POST /normalize */
export async function normalizeDescription(
  description: string,
  uom = 'NOS',
): Promise<ApiResult<NormalizeResponse>> {
  await sleep(200 + Math.random() * 400)
  return call(
    'POST',
    '/normalize',
    { description, uom },
    () => ({
      normalized: normalize(description, uom, 'adhoc', activeRules()),
      dictionarySize: activeRules().length,
    }),
    { scanned: 1, perRecordUs: 4200 },
  )
}

/* ---------------------------------------------------------------------- match */

export interface ScorePairResponse {
  breakdown: ScoreBreakdown
  expression: string
  conflicts: { slot: string; left: string; right: string }[]
}

/** POST /match/score */
export async function scorePair(
  left: { description: string; uom?: string },
  right: { description: string; uom?: string },
): Promise<ApiResult<ScorePairResponse>> {
  await sleep(200 + Math.random() * 400)
  return call(
    'POST',
    '/match/score',
    { left, right },
    () => {
      const rules = activeRules()
      const a = normalize(left.description, left.uom ?? 'NOS', 'left', rules)
      const b = normalize(right.description, right.uom ?? 'NOS', 'right', rules)
      const result = score(a, b, serviceState.weights, serviceState.learnedTokens)
      return {
        breakdown: result.breakdown,
        expression: scoreExpression(result.breakdown, serviceState.weights),
        conflicts: result.conflicts,
      }
    },
    { scanned: 2, perRecordUs: 5600 },
  )
}

export interface ProposalsResponse {
  pairs: MatchPair[]
  counts: { same: number; review: number; different: number }
  weights: ScoringWeights
  accept: number
  review: number
}

/** GET /match/proposals */
export async function fetchProposals(): Promise<ApiResult<ProposalsResponse>> {
  const records = allRecords()
  await sleep(200 + Math.random() * 400)
  return call(
    'GET',
    '/match/proposals',
    null,
    () => {
      const normalized = normalizeAll(records)
      const pairs = buildPairs(records, normalized, {
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
        learnedTokens: serviceState.learnedTokens,
      })
      return {
        pairs,
        counts: {
          same: pairs.filter(p => p.verdict === 'same').length,
          review: pairs.filter(p => p.verdict === 'review').length,
          different: pairs.filter(p => p.verdict === 'different').length,
        },
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
      }
    },
    { scanned: records.length, perRecordUs: 380 },
  )
}

/** PUT /match/weights */
export async function updateWeights(weights: ScoringWeights): Promise<ApiResult<{ weights: ScoringWeights }>> {
  await sleep(200 + Math.random() * 400)
  return call(
    'PUT',
    '/match/weights',
    weights,
    () => {
      serviceState.weights = weights
      bumpVersion()
      return { weights }
    },
    { scanned: 0 },
  )
}

/** PUT /match/thresholds */
export async function updateThresholds(accept: number, review: number) {
  await sleep(200 + Math.random() * 400)
  return call(
    'PUT',
    '/match/thresholds',
    { accept, review },
    () => {
      serviceState.accept = accept
      serviceState.review = review
      bumpVersion()
      return { accept, review }
    },
    { scanned: 0 },
  )
}

/** POST /match/review */
export function reviewPair(
  pairId: string,
  action: 'approved' | 'rejected',
  summary: string,
  code?: string,
): Promise<ApiResult<{ pairId: string; status: string }>> {
  return call(
    'POST',
    '/match/review',
    { pairId, action },
    () => {
      serviceState.approvals.set(pairId, action)
      pushActivity({
        action: action === 'approved' ? 'approve' : 'reject',
        actor: serviceState.operator,
        detail: summary,
        code,
        endpoint: 'POST /match/review',
      })
      bumpVersion()
      return { pairId, status: action }
    },
    { scanned: 1 },
  )
}

/* ------------------------------------------------------------------ recommend */

/** One candidate the corpus offers back for a description somebody asked about. */
export interface Recommendation {
  record: MaterialRecord
  breakdown: ScoreBreakdown
  expression: string
  verdict: Verdict
  conflicts: AttributeConflict[]
  unexplained: string[]
  /** The national code this candidate already sits under. */
  code: string
  /** Other organisations holding that same code, so the answer names who else buys it. */
  alsoHeldBy: Cpse['code'][]
}

export interface RecommendResponse {
  normalized: NormalizedRecord
  /** Ranked, best first, capped at the requested limit. */
  recommendations: Recommendation[]
  best: Recommendation | null
  /**
   * What the registry would do with this line if it arrived now. `match` is the
   * matcher settling it on its own, `review` is it asking for a person, `new` is
   * nothing in the corpus being close enough to claim it.
   */
  outcome: 'match' | 'review' | 'new'
  /** The code this line receives if no candidate claims it. */
  mintedCode: string
  /** The family that code's prefix comes from, and whether it was read or defaulted. */
  family: MaterialRecord['family']
  familyConfident: boolean
  scanned: number
}

/**
 * Nothing below this is worth printing. A candidate at 0.2 shares a stop word and
 * a family and tells the person asking nothing they did not already know.
 */
const RECOMMEND_FLOOR = 0.3

/**
 * POST /match/recommend
 *
 * One description in, ranked candidates out. This is the same normalizer, the same
 * scorer and the same thresholds the batch queue runs on, pointed at a single line
 * instead of the whole corpus, so an answer here and a verdict there cannot
 * disagree. The candidate's code is read off the cluster it actually belongs to
 * rather than minted fresh from its own signature, because what the asker needs is
 * the code the registry already holds it under.
 */
export function recommendMatches(
  description: string,
  uom = 'NOS',
  limit = 6,
): Promise<ApiResult<RecommendResponse>> {
  const records = allRecords()
  return call(
    'POST',
    '/match/recommend',
    { description, uom, limit },
    () => {
      const rules = activeRules()
      const query = normalize(description, uom, 'query', rules)
      const corpusNorm = normalizeAll(records)

      const pairs = buildPairs(records, corpusNorm, {
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
        learnedTokens: serviceState.learnedTokens,
      })
      const clusters = buildClusters(records, corpusNorm, pairs, serviceState.approvals)
      const clusterOf = new Map<string, Cluster>()
      for (const cluster of clusters) {
        for (const member of cluster.members) clusterOf.set(member.id, cluster)
      }

      const scored: Recommendation[] = []
      for (const candidate of records) {
        const candidateNorm = corpusNorm.get(candidate.id)
        if (!candidateNorm) continue

        const result = score(query, candidateNorm, serviceState.weights, serviceState.learnedTokens)
        if (result.breakdown.combined < RECOMMEND_FLOOR) continue

        const cluster = clusterOf.get(candidate.id)
        const decision = verdictFor(
          result.breakdown.combined,
          serviceState.accept,
          serviceState.review,
          result.unexplained.length,
          result.conflicts,
        )
        scored.push({
          record: candidate,
          breakdown: result.breakdown,
          expression: scoreExpression(result.breakdown, serviceState.weights),
          verdict: decision,
          conflicts: result.conflicts,
          unexplained: result.unexplained,
          code: cluster?.code ?? mintCode(candidate.family, candidateNorm.signature),
          alsoHeldBy: (cluster?.cpses ?? []).filter(code => code !== candidate.cpse),
        })
      }

      scored.sort((a, b) => b.breakdown.combined - a.breakdown.combined)
      const top = scored.slice(0, limit)
      const best = top[0] ?? null
      const classification = classifyFamily(query)

      return {
        normalized: query,
        recommendations: top,
        best,
        outcome:
          best?.verdict === 'same' ? 'match' : best?.verdict === 'review' ? 'review' : 'new',
        mintedCode: mintCode(classification.family, query.signature),
        family: classification.family,
        familyConfident: classification.confident,
        scanned: records.length,
      }
    },
    { scanned: records.length, perRecordUs: 220 },
  )
}

/* ------------------------------------------------------------------- registry */

export interface RegistryResponse {
  clusters: Cluster[]
  health: ReturnType<typeof corpusHealth>
}

/** GET /registry */
export function fetchRegistry(): Promise<ApiResult<RegistryResponse>> {
  const records = allRecords()
  return call(
    'GET',
    '/registry',
    null,
    () => {
      const normalized = normalizeAll(records)
      const pairs = buildPairs(records, normalized, {
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
        learnedTokens: serviceState.learnedTokens,
      })
      const clusters = buildClusters(records, normalized, pairs, serviceState.approvals)
      return { clusters, health: corpusHealth(records, clusters) }
    },
    { scanned: records.length, perRecordUs: 420 },
  )
}

/** GET /registry/{code}/derivation */
export function fetchDerivation(cluster: Cluster) {
  return call(
    'GET',
    `/registry/${cluster.code}/derivation`,
    null,
    () => ({
      derivation: codeDerivation(cluster.family, cluster.signature),
      signature: cluster.signature,
      code: cluster.code,
    }),
    { scanned: 1 },
  )
}

/* ------------------------------------------------------------------ materials */

/** GET /materials */
export function fetchMaterials(): Promise<ApiResult<{ records: MaterialRecord[]; total: number }>> {
  const records = allRecords()
  return call('GET', '/materials', null, () => ({ records, total: TOTAL_RECORDS }), {
    scanned: records.length,
    perRecordUs: 90,
  })
}

/* ------------------------------------------------------------------ analytics */

export interface DashboardResponse {
  /** Full master size of the sources that have actually been loaded. Zero until
   *  one is, because an empty registry does not get to claim 24 lakh records. */
  totalRecords: number
  /** Every source's master size, loaded or not. What the country holds. */
  totalAvailable: number
  cpses: typeof CPSES
  loaded: string[]
  duplicateRecords: number
  distinctCodes: number
  crossCpseClusters: number
  sampleSize: number
  approvedPairs: number
  pendingPairs: number
}

/** GET /analytics/dashboard */
export function fetchDashboard(): Promise<ApiResult<DashboardResponse>> {
  const records = allRecords()
  return call(
    'GET',
    '/analytics/dashboard',
    null,
    () => {
      const normalized = normalizeAll(records)
      const pairs = buildPairs(records, normalized, {
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
      })
      const clusters = buildClusters(records, normalized, pairs, serviceState.approvals)
      const health = corpusHealth(records, clusters)

      // The inspectable sample is a stratified draw from the full corpus, so its
      // duplicate rate is the basis for the corpus-wide estimate.
      const sampleDuplicateRate = health.duplicateRecords / Math.max(1, records.length)

      // Only the masters actually loaded count towards the corpus figure. Before
      // anything is loaded this is zero, and every headline that depends on it
      // reads zero too rather than quoting a number nobody has yet supplied.
      const loadedTotal = CPSES.filter(c => serviceState.loaded.includes(c.code)).reduce(
        (sum, c) => sum + c.totalRecords,
        0,
      )

      return {
        totalRecords: loadedTotal,
        totalAvailable: TOTAL_RECORDS,
        cpses: CPSES,
        loaded: [...serviceState.loaded],
        duplicateRecords: Math.round(loadedTotal * sampleDuplicateRate),
        distinctCodes: health.distinctCodes,
        crossCpseClusters: health.crossCpseClusters,
        sampleSize: records.length,
        approvedPairs: [...serviceState.approvals.values()].filter(v => v === 'approved').length,
        pendingPairs: pairs.filter(
          p => p.verdict === 'review' && !serviceState.approvals.has(p.id),
        ).length,
      }
    },
    { scanned: records.length, perRecordUs: 400 },
  )
}

/** POST /analytics/savings */
export function computeSavingsFor(
  duplicateLineItems: number,
  inputs: SavingsInputs,
): Promise<ApiResult<SavingsResult>> {
  return call(
    'POST',
    '/analytics/savings',
    inputs,
    () => {
      serviceState.savings = inputs
      return computeSavings(duplicateLineItems, inputs)
    },
    { scanned: 0 },
  )
}

/* --------------------------------------------------------------------- ingest */




/** POST /ingest/preview */
export function previewUpload(csvText: string): Promise<ApiResult<IngestPreview>> {
  return call('POST', '/ingest/preview', { bytes: csvText.length }, () => parseCsv(csvText), {
    scanned: csvText.split('\n').length,
    perRecordUs: 900,
  })
}

export interface IngestRowResult {
  row: ParsedRow
  normalized: NormalizedRecord
  /** Best match found in the existing corpus, if any cleared the review threshold. */
  match: {
    record: MaterialRecord
    breakdown: ScoreBreakdown
    expression: string
    code: string
  } | null
  /** Set when nothing matched and a new code was minted. */
  mintedCode: string | null
}

export interface IngestRunResponse {
  results: IngestRowResult[]
  matched: number
  minted: number
  scannedRecords: number
}

/**
 * POST /ingest/run
 *
 * Each uploaded row is scored against the existing corpus, not against the rest of
 * the upload. A row that matches nothing mints a new code rather than being forced
 * onto its neighbour.
 */
export function runIngest(rows: ParsedRow[], org: string): Promise<ApiResult<IngestRunResponse>> {
  const corpus = allRecords()
  return call(
    'POST',
    '/ingest/run',
    { rows: rows.length, org },
    () => {
      const rules = activeRules()
      const corpusNorm = normalizeAll(corpus)
      const results: IngestRowResult[] = []

      for (const row of rows) {
        const normalized = normalize(row.description, row.uom, `up-${row.code}`, rules)

        let best: IngestRowResult['match'] = null
        for (const candidate of corpus) {
          const candidateNorm = corpusNorm.get(candidate.id)
          if (!candidateNorm) continue
          const result = score(normalized, candidateNorm, serviceState.weights)
          if (result.breakdown.combined < serviceState.review) continue
          if (!best || result.breakdown.combined > best.breakdown.combined) {
            best = {
              record: candidate,
              breakdown: result.breakdown,
              expression: scoreExpression(result.breakdown, serviceState.weights),
              code: mintCode(candidate.family, candidateNorm.signature),
            }
          }
        }

        results.push({
          row,
          normalized,
          match: best,
          mintedCode: best ? null : mintCode(guessFamily(normalized), normalized.signature),
        })
      }

      const matched = results.filter(r => r.match).length
      const minted = results.length - matched

      for (const result of results) {
        serviceState.records.push({
          id: `UP-${result.row.code}`,
          cpse: (result.row.org ?? result.match?.record.cpse ?? org) as MaterialRecord['cpse'],
          localCode: result.row.code,
          rawDescription: result.row.description,
          rawUom: result.row.uom,
          family:
            familyFromLabel(result.row.family) ??
            result.match?.record.family ??
            guessFamily(result.normalized),
          annualQty: result.row.annualQty,
          unitPrice: result.row.unitPrice,
          stockOnHand: result.row.stockOnHand,
        })
      }

      pushActivity({
        action: 'import',
        actor: serviceState.operator,
        cpse: org,
        detail: `Read ${rows.length} items from ${org}. ${matched} already exist in another organisation. ${minted} are new and received a fresh code.`,
        endpoint: 'POST /ingest/run',
      })
      bumpVersion()

      return { results, matched, minted, scannedRecords: corpus.length * rows.length }
    },
    { scanned: corpus.length * Math.max(1, rows.length), perRecordUs: 22 },
  )
}

/* ---------------------------------------------------------------- migration */

/**
 * POST /migration/export
 *
 * The crosswalk file leaving the building is an event worth recording. An ERP team
 * loads that file into a production material master; six months later, when a code
 * is queried, the audit trail has to be able to say which package it came from, who
 * pulled it and when. The file itself is built in the browser from the same
 * clusters the registry shows, so this call carries the record rather than the CSV.
 */
export function logMigrationExport(scope: string, rows: number) {
  return call(
    'POST',
    '/migration/export',
    { scope, rows },
    () => {
      pushActivity({
        action: 'export',
        actor: serviceState.operator,
        cpse: scope === 'all' ? undefined : scope,
        detail:
          `Downloaded the migration package for ${scope === 'all' ? 'all organisations' : scope}. ` +
          `${rows} existing codes, each paired with the national code it becomes.`,
        endpoint: 'POST /migration/export',
      })
      bumpVersion()
      return { scope, rows }
    },
    { scanned: rows, perRecordUs: 8 },
  )
}

const SEEDED_ENTRIES: Omit<ActivityEntry, 'id' | 'ts'>[] = [
  { action: 'ingest', actor: 'System', cpse: 'IOCL', detail: 'Loaded IOCL SAP ECC extract — 8,432 records read from material master.', endpoint: 'POST /ingest/iocl' },
  { action: 'ingest', actor: 'System', cpse: 'NTPC', detail: 'Loaded NTPC SAP S/4HANA extract — 6,219 records read from material master.', endpoint: 'POST /ingest/ntpc' },
  { action: 'ingest', actor: 'System', cpse: 'SAIL', detail: 'Loaded SAIL Oracle EBS extract — 5,789 records read from material master.', endpoint: 'POST /ingest/sail' },
  { action: 'normalize', actor: 'System', cpse: 'IOCL', detail: 'Normalized IOCL extract: expanded 847 short forms, resolved 1,203 unit variants.', endpoint: 'POST /normalize' },
  { action: 'match', actor: 'System', cpse: undefined, detail: 'Cross-CPSE matching complete: 2,14,520 pairs scored across 3 loaded sources.', endpoint: 'POST /match/score' },
  { action: 'approve', actor: 'Dr. Sharma', cpse: 'IOCL', detail: 'Confirmed that IOCL\'s "BRG BALL DG 6205" and NTPC\'s "BALL BEARING 6205 DDU" are the same item.', endpoint: 'POST /review/PAIR-2847' },
  { action: 'approve', actor: 'Rajesh Kumar', cpse: 'NTPC', detail: 'Confirmed that NTPC\'s "PIPE CS 50NB SCH40" and SAIL\'s "CS PIPE 50MM SCH40" are the same item.', endpoint: 'POST /review/PAIR-3102' },
  { action: 'mint', actor: 'System', cpse: undefined, detail: 'Issued CNMC-BE-6235-2RS for BRG BALL DG 6205 across IOCL, NTPC, SAIL.', endpoint: 'POST /registry/mint' },
  { action: 'reject', actor: 'Priya Menon', cpse: 'SAIL', detail: 'Marked SAIL\'s "GASKET GRAPH 50MM" and IOCL\'s "GASKET SPIRAL 50MM" as different items — different construction.', endpoint: 'POST /review/PAIR-1105' },
  { action: 'config', actor: 'Dr. Sharma', cpse: undefined, detail: 'Updated scoring weights: lexical +0.05, attribute +0.05. Threshold unchanged.', endpoint: 'POST /config/weights' },
  { action: 'import', actor: 'Rajesh Kumar', cpse: 'CIL', detail: 'Added CIL in-house extract — 3,120 new records ingested.', endpoint: 'POST /ingest/cil' },
  { action: 'ingest', actor: 'System', cpse: 'CIL', detail: 'Loaded CIL in-house extract — 3,120 records read from material master.', endpoint: 'POST /ingest/cil' },
  { action: 'normalize', actor: 'System', cpse: 'CIL', detail: 'Normalized CIL extract: expanded 312 short forms, resolved 489 unit variants.', endpoint: 'POST /normalize' },
  { action: 'approve', actor: 'Priya Menon', cpse: 'SAIL', detail: 'Confirmed that SAIL\'s "FLG WN CS 150" and IOCL\'s "FLANGE WN 150 CS" are the same item.', endpoint: 'POST /review/PAIR-4561' },
  { action: 'mint', actor: 'System', cpse: undefined, detail: 'Issued CNMC-VF-8821-1WN for FLG WN CS 150 across SAIL, IOCL.', endpoint: 'POST /registry/mint' },
  { action: 'approve', actor: 'Amit Verma', cpse: 'NTPC', detail: 'Confirmed that NTPC\'s "ELEC CABLE 3Cx4SQMM" and IOCL\'s "CABLE 3Cx4.0 SQMM" are the same item.', endpoint: 'POST /review/PAIR-5193' },
  { action: 'reject', actor: 'Dr. Sharma', cpse: 'SAIL', detail: 'Marked SAIL\'s "PLATE MS 10MM" and IOCL\'s "PLATE MS 12MM" as different items — thickness mismatch.', endpoint: 'POST /review/PAIR-6782' },
  { action: 'approve', actor: 'Suresh Iyer', cpse: 'IOCL', detail: 'Confirmed that IOCL\'s "GRS NBR 70 SH A" and NTPC\'s "GASKET NBR 70A" are the same item.', endpoint: 'POST /review/PAIR-2234' },
  { action: 'mint', actor: 'System', cpse: undefined, detail: 'Issued CNMC-GS-4103-70A for GRS NBR 70 SH A across IOCL, NTPC.', endpoint: 'POST /registry/mint' },
  { action: 'export', actor: 'Kavita Rao', cpse: undefined, detail: 'Exported migration mapping package: 201 national codes, 283 records, 5 CPSEs. CSV downloaded.', endpoint: 'GET /migration/download' },
  { action: 'config', actor: 'System', cpse: undefined, detail: 'Auto-rebalanced weights: lexical 0.35 → 0.40, numeric 0.25 → 0.30 after threshold tuning.', endpoint: 'POST /config/rebalance' },
  { action: 'approve', actor: 'Priya Menon', cpse: 'NTPC', detail: 'Confirmed that NTPC\'s "BOLT M24x100 8.8" and SAIL\'s "BOLT HEX M24x100 Gr8.8" are the same item.', endpoint: 'POST /review/PAIR-3401' },
  { action: 'approve', actor: 'Dr. Sharma', cpse: 'CIL', detail: 'Confirmed that CIL\'s "CONV BELT EP800/4" and SAIL\'s "BELT CONVEYOR EP800 4PLY" are the same item.', endpoint: 'POST /review/PAIR-7812' },
  { action: 'ingest', actor: 'System', cpse: 'IOCL', detail: 'Refreshed IOCL master: +124 new records, -3 retired codes removed.', endpoint: 'POST /ingest/iocl/refresh' },
  { action: 'match', actor: 'System', cpse: undefined, detail: 'Incremental re-match after CIL import: 87,600 new pairs scored.', endpoint: 'POST /match/score' },
  { action: 'mint', actor: 'System', cpse: undefined, detail: 'Issued CNMC-CB-7251-4EP for CONV BELT EP800/4 across CIL, SAIL.', endpoint: 'POST /registry/mint' },
  { action: 'import', actor: 'Amit Verma', cpse: 'BHEL', detail: 'Added BHEL Tiruchirappalli extract — 4,210 new records for review.', endpoint: 'POST /ingest/bhel' },
  { action: 'normalize', actor: 'System', cpse: 'BHEL', detail: 'Normalized BHEL extract: expanded 523 short forms, resolved 712 unit variants.', endpoint: 'POST /normalize' },
  { action: 'approve', actor: 'Rajesh Kumar', cpse: 'IOCL', detail: 'Confirmed that IOCL\'s "VALV GATE CS DN200 PN16" and NTPC\'s "GATE VALVE 200MM CS PN16" are the same item.', endpoint: 'POST /review/PAIR-8910' },
  { action: 'reject', actor: 'Kavita Rao', cpse: 'SAIL', detail: 'Marked SAIL\'s "ROD MS 20MM" and CIL\'s "ROD MS 25MM" as different items — diameter mismatch.', endpoint: 'POST /review/PAIR-4455' },
]

function seedActivity(): void {
  const existing = readStoredActivity()
  if (existing.length > 0) return

  const now = Date.now()
  const DAY = 86_400_000
  const entries: ActivityEntry[] = SEEDED_ENTRIES.map((entry, i) => {
    const daysAgo = Math.floor(i / 5)
    const hourOffset = (i % 5) * 3
    return {
      ...entry,
      id: `ACT-${(1000 + i).toString()}`,
      ts: now - daysAgo * DAY - hourOffset * 3_600_000,
    }
  })

  entries.sort((a, b) => b.ts - a.ts)
  serviceState.activity = entries
  try {
    sessionStorage.setItem(ACTIVITY_KEY, JSON.stringify(entries))
  } catch {
    /* storage unavailable */
  }
}

function readStoredActivity(): ActivityEntry[] {
  try {
    const raw = sessionStorage.getItem(ACTIVITY_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* storage unavailable */
  }
  return []
}

/* -------------------------------------------------------------------- audit */

/** GET /audit */
export function fetchActivity(): Promise<ApiResult<{ entries: ActivityEntry[] }>> {
  seedActivity()
  return call('GET', '/audit', null, () => ({ entries: [...serviceState.activity] }), {
    scanned: serviceState.activity.length,
    perRecordUs: 40,
  })
}

/* ------------------------------------------------------------------- engine */

/** POST /engine/dictionary */
export function addDictionaryRule(rule: DictionaryRule) {
  return call(
    'POST',
    '/engine/dictionary',
    rule,
    () => {
      serviceState.extraRules.push(rule)
      pushActivity({
        action: 'config',
        actor: serviceState.operator,
        detail: `Added dictionary rule: ${rule.token} now expands to ${rule.expansion}.`,
        endpoint: 'POST /engine/dictionary',
      })
      bumpVersion()
      return { rules: activeRules().length }
    },
    { scanned: 0 },
  )
}

/** GET /engine/dictionary */
export function fetchDictionary() {
  return call('GET', '/engine/dictionary', null, () => ({ rules: activeRules() }), {
    scanned: activeRules().length,
    perRecordUs: 12,
  })
}

/* ------------------------------------------------------------------ internal */

export function activeRules(): DictionaryRule[] {
  return [...BASE_RULES, ...serviceState.extraRules]
}

export function allRecords(): MaterialRecord[] {
  return serviceState.records
}

let activitySeq = 0
const ACTIVITY_KEY = 'codeone.activity'

export function pushActivity(entry: Omit<ActivityEntry, 'id' | 'ts'>) {
  activitySeq += 1
  serviceState.activity.unshift({
    ...entry,
    id: `ACT-${(activitySeq + 100).toString()}`,
    ts: Date.now(),
  })
  // Persist to sessionStorage so the audit trail survives a page reload.
  try {
    sessionStorage.setItem(ACTIVITY_KEY, JSON.stringify(serviceState.activity))
  } catch {
    /* storage unavailable */
  }
}

function guessFamily(normalized: NormalizedRecord): MaterialRecord['family'] {
  return classifyFamily(normalized).family
}

/**
 * The family a description falls into, and whether that was read or guessed.
 *
 * The fallback has to be some family because a code needs a prefix, but a caller
 * that is about to print the resulting code to a person needs to know the
 * difference between "this is a bearing" and "nothing here looked like anything,
 * so it went in the default bucket". A drone battery filed under fasteners is not
 * a bug in the matcher, but a screen that states it without qualification is a bug
 * in the screen.
 */
export function classifyFamily(normalized: NormalizedRecord): {
  family: MaterialRecord['family']
  confident: boolean
} {
  const matched = matchFamily(normalized)
  return matched ? { family: matched, confident: true } : { family: 'fasteners', confident: false }
}

function matchFamily(normalized: NormalizedRecord): MaterialRecord['family'] | null {
  const text = normalized.normalizedTokens.join(' ')
  if (/BEARING/.test(text)) return 'bearings'
  if (/PIPE|TUBE/.test(text)) return 'pipes_tubes'
  if (/VALVE|FLANGE|ELBOW/.test(text)) return 'valves_fittings'
  if (/BOLT|NUT|WASHER|SCREW|STUD|RIVET/.test(text)) return 'fasteners'
  if (/CABLE|MCB|SWITCH|LAMP|LED/.test(text)) return 'electrical'
  if (/GASKET|SEAL|O.RING/.test(text)) return 'gaskets_seals'
  if (/MOTOR|DRIVE|PUMP/.test(text)) return 'motors_drives'
  if (/GAUGE|TRANSMITTER|SENSOR|THERMO/.test(text)) return 'instruments'
  if (/ANGLE|BEAM|PLATE|CHANNEL|SHEET/.test(text)) return 'structural_steel'
  if (/HELMET|GLOVE|BOOT|HARNESS|GOGGLE/.test(text)) return 'safety_ppe'
  if (/OIL|GREASE|LUBRICANT/.test(text)) return 'lubricants'
  if (/ELECTRODE|WELDING|FLUX/.test(text)) return 'welding'
  return null
}

export { applyMapping } from './csv'
export { parseCsv }
export type { ParsedRow, ColumnMapping, IngestPreview } from './types'
export { streamMasterLoad, rowsToRecords, restoreLoaded, forgetLoaded } from './loader'
export type { LoadEvent, LoadSummary, PipelineStage, RegistrySnapshot, StageReport } from './loader'
