import { SAMPLE_RECORDS, CPSES, TOTAL_RECORDS, TRUTH } from '../src/engine/corpus'
import { normalizeAll, buildPairs, buildClusters } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW } from '../src/engine/score'

const normalized = normalizeAll(SAMPLE_RECORDS)
const pairs = buildPairs(SAMPLE_RECORDS, normalized, {
  weights: DEFAULT_WEIGHTS,
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
})

// Show all auto-approved pairs (verdict === 'same')
const same = pairs.filter(p => p.verdict === 'same')

console.log(`=== ALL AUTO-APPROVED PAIRS (${same.length} total) ===\n`)
for (const p of same) {
  const leftTruth = TRUTH.get(p.left.id) ?? p.left.id
  const rightTruth = TRUTH.get(p.right.id) ?? p.right.id
  const isFalseMerge = leftTruth !== rightTruth
  const marker = isFalseMerge ? '⚠️  FALSE MERGE' : 'OK'
  console.log(`${marker}  [${p.score.combined.toFixed(3)}] ${p.left.cpse} vs ${p.right.cpse}`)
  console.log(`       L: ${p.left.rawDescription}`)
  console.log(`       R: ${p.right.rawDescription}`)
  if (isFalseMerge) {
    console.log(`       TRUTH: ${leftTruth} !== ${rightTruth}`)
  }
  console.log()
}
