/**
 * Export the corpus, its candidate pairs and the ground truth, for the model.
 *
 * Run with: npm run export:model
 *
 * The deterministic engine lives in TypeScript and is verified by check:corpus.
 * The model lives in Python. Rather than porting one into the other and letting
 * them drift, this writes the exact inputs the model has to work with:
 *
 *   - every record, with the normalized form the engine produced for it
 *   - every candidate pair the blocker generated, with its three deterministic
 *     sub-scores
 *   - the label for each pair, taken from which generator item produced the two
 *     records, which is the thing the matcher is trying to recover
 *
 * The labels are the only reason a fitted classifier can be honest about its own
 * precision and recall. They are exported here and nowhere else, and no page in
 * the interface imports them.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { SAMPLE_RECORDS, CPSES, TOTAL_RECORDS, TRUTH } from '../src/engine/corpus'
import { normalizeAll, buildPairs } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW } from '../src/engine/score'

const normalized = normalizeAll(SAMPLE_RECORDS)
const pairs = buildPairs(SAMPLE_RECORDS, normalized, {
  weights: DEFAULT_WEIGHTS,
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
})

const records = SAMPLE_RECORDS.map(record => {
  const norm = normalized.get(record.id)!
  return {
    id: record.id,
    cpse: record.cpse,
    family: record.family,
    localCode: record.localCode,
    raw: record.rawDescription,
    uom: record.rawUom,
    normalized: norm.normalizedTokens.join(' '),
    signature: norm.signature,
    truth: TRUTH.get(record.id) ?? record.id,
  }
})

const rows = pairs.map(pair => ({
  id: pair.id,
  leftId: pair.left.id,
  rightId: pair.right.id,
  left: pair.left.rawDescription,
  right: pair.right.rawDescription,
  leftNormalized: pair.leftNorm.normalizedTokens.join(' '),
  rightNormalized: pair.rightNorm.normalizedTokens.join(' '),
  sameFamily: pair.left.family === pair.right.family,
  sameUom: pair.leftNorm.uom === pair.rightNorm.uom,
  conflicts: pair.conflicts.length,
  lexical: pair.score.lexical,
  attribute: pair.score.attribute,
  numeric: pair.score.numeric,
  /** What the hand-set weights currently produce, kept for comparison only. */
  handCombined: pair.score.combined,
  label: (TRUTH.get(pair.left.id) ?? 'l') === (TRUTH.get(pair.right.id) ?? 'r') ? 1 : 0,
}))

const positives = rows.filter(row => row.label === 1).length

const payload = {
  generatedBy: 'frontend/scripts/export-model-data.ts',
  cpses: CPSES,
  totalRecords: TOTAL_RECORDS,
  handWeights: DEFAULT_WEIGHTS,
  handAccept: DEFAULT_ACCEPT,
  handReview: DEFAULT_REVIEW,
  records,
  pairs: rows,
}

const out = resolve(process.cwd(), '../backend/app/data/model-data.json')
mkdirSync(dirname(out), { recursive: true })
writeFileSync(out, JSON.stringify(payload, null, 2), 'utf-8')

console.log(`records        ${records.length}`)
console.log(`candidate pairs ${rows.length}`)
console.log(`  same item     ${positives}`)
console.log(`  different     ${rows.length - positives}`)
console.log(`distinct items  ${new Set(records.map(r => r.truth)).size}`)
console.log(`written to      ${out}`)
