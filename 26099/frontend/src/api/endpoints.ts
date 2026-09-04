/**
 * Harmonization service endpoints.
 *
 * The surface a page is allowed to depend on. Each function names the HTTP method
 * and path it represents, so what appears in the request strip in the interface is
 * the same string that appears here and, in live mode, the same route on the
 * FastAPI service.
 */

import { call, type ApiResult } from './client'
import { serviceState, bumpVersion } from './state'
import { parseCsv } from './csv'
import type { IngestPreview, ParsedRow } from './types'
import { CPSES, TOTAL_RECORDS } from '@/engine/corpus'
import { BASE_RULES, type DictionaryRule } from '@/engine/dictionary'
import { normalize } from '@/engine/normalize'
import { score, scoreExpression } from '@/engine/score'
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
  type Cluster,
  type MatchPair,
  type MaterialRecord,
  type NormalizedRecord,
  type SavingsInputs,
  type SavingsResult,
  type ScoreBreakdown,
  type ScoringWeights,
} from '@/engine/types'

/* ------------------------------------------------------------------ normalize */

export interface NormalizeResponse {
  normalized: NormalizedRecord
  /** Every rule in the dictionary that could have fired, matched or not, so the
   *  Normalization page can show near-misses as well as hits. */
  dictionarySize: number
}

/** POST /normalize */
export function normalizeDescription(
  description: string,
  uom = 'NOS',
): Promise<ApiResult<NormalizeResponse>> {
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
export function scorePair(
  left: { description: string; uom?: string },
  right: { description: string; uom?: string },
): Promise<ApiResult<ScorePairResponse>> {
  return call(
    'POST',
    '/match/score',
    { left, right },
    () => {
      const rules = activeRules()
      const a = normalize(left.description, left.uom ?? 'NOS', 'left', rules)
      const b = normalize(right.description, right.uom ?? 'NOS', 'right', rules)
      const result = score(a, b, serviceState.weights)
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
export function fetchProposals(): Promise<ApiResult<ProposalsResponse>> {
  const records = allRecords()
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
export function updateWeights(weights: ScoringWeights): Promise<ApiResult<{ weights: ScoringWeights }>> {
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
export function updateThresholds(accept: number, review: number) {
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
          cpse: (result.match?.record.cpse ?? 'IOCL') as MaterialRecord['cpse'],
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

/* -------------------------------------------------------------------- audit */

/** GET /audit */
export function fetchActivity(): Promise<ApiResult<{ entries: ActivityEntry[] }>> {
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
export function pushActivity(entry: Omit<ActivityEntry, 'id' | 'ts'>) {
  activitySeq += 1
  serviceState.activity.unshift({
    ...entry,
    id: `ACT-${(activitySeq + 100).toString()}`,
    ts: Date.now(),
  })
}

function guessFamily(normalized: NormalizedRecord): MaterialRecord['family'] {
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
  return 'fasteners'
}

export { applyMapping } from './csv'
export { parseCsv }
export type { ParsedRow, ColumnMapping, IngestPreview } from './types'
export { streamMasterLoad, rowsToRecords, restoreLoaded, forgetLoaded } from './loader'
export type { LoadEvent, LoadSummary, PipelineStage, RegistrySnapshot, StageReport } from './loader'
