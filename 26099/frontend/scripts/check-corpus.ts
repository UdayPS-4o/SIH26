/**
 * Corpus sanity check.
 *
 * Run with: npm run check:corpus
 *
 * The corpus is generated, not hand-typed, so it needs measuring rather than
 * reading. This prints the pair and cluster distribution the default weights
 * produce, plus the worst offenders in each direction, so a bad item definition
 * shows up as a number instead of as a strange screen three pages in.
 */

import { SAMPLE_RECORDS, CPSES, TOTAL_RECORDS } from '../src/engine/corpus'
import { normalizeAll, buildPairs, buildClusters, corpusHealth } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW, scoreExpression } from '../src/engine/score'

const normalized = normalizeAll(SAMPLE_RECORDS)
const pairs = buildPairs(SAMPLE_RECORDS, normalized, {
  weights: DEFAULT_WEIGHTS,
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
})
const clusters = buildClusters(SAMPLE_RECORDS, normalized, pairs)
const health = corpusHealth(SAMPLE_RECORDS, clusters)

const same = pairs.filter(p => p.verdict === 'same')
const review = pairs.filter(p => p.verdict === 'review')
const different = pairs.filter(p => p.verdict === 'different')

console.log('CPSEs                ', CPSES.length, '/', TOTAL_RECORDS.toLocaleString('en-IN'), 'records')
console.log('sample records       ', SAMPLE_RECORDS.length)
console.log('candidate pairs      ', pairs.length)
console.log('  same               ', same.length)
console.log('  needs a decision   ', review.length)
console.log('  different          ', different.length)
console.log('clusters             ', health.distinctCodes)
console.log('  with duplicates    ', health.clustersWithDuplicates)
console.log('  cross CPSE         ', health.crossCpseClusters)
console.log('duplicate records    ', health.duplicateRecords)
console.log('largest cluster      ', health.largestCluster)

const oversized = clusters.filter(c => c.members.length > 4)
if (oversized.length) {
  console.log('\nOVERSIZED CLUSTERS (more than one member per CPSE, so something over-matched)')
  for (const c of oversized) {
    console.log(` ${c.code} ${c.members.length} members ${c.standardDescription}`)
    for (const m of c.members) console.log(`   ${m.cpse.padEnd(5)} ${m.rawDescription}`)
  }
}

const splitItems = new Map<string, string[]>()
for (const record of SAMPLE_RECORDS) {
  const item = record.id.split('-')[1]
  const cluster = clusters.find(c => c.members.some(m => m.id === record.id))
  const list = splitItems.get(item) ?? []
  list.push(cluster?.code ?? 'none')
  splitItems.set(item, list)
}
const split = [...splitItems.entries()].filter(([, codes]) => new Set(codes).size > 1)
console.log(`\nITEMS THAT DID NOT FULLY MERGE: ${split.length} of ${splitItems.size}`)
for (const [item, codes] of split.slice(0, 12)) {
  const members = SAMPLE_RECORDS.filter(r => r.id.split('-')[1] === item)
  console.log(` item ${item} -> ${new Set(codes).size} codes`)
  for (const m of members) console.log(`   ${m.cpse.padEnd(5)} ${m.rawDescription}`)
}

console.log('\nNEEDS A DECISION, top 10')
for (const p of review.slice(0, 10)) {
  console.log(` ${p.score.combined.toFixed(3)} ${scoreExpression(p.score, DEFAULT_WEIGHTS)}`)
  console.log(`   ${p.left.cpse.padEnd(5)} ${p.left.rawDescription}`)
  console.log(`   ${p.right.cpse.padEnd(5)} ${p.right.rawDescription}`)
  if (p.conflicts.length) {
    console.log(`   conflicts: ${p.conflicts.map(c => `${c.slot} ${c.left} vs ${c.right}`).join('; ')}`)
  }
}

console.log('\nHIGHEST SCORING REJECTIONS, top 6')
for (const p of different.slice(0, 6)) {
  console.log(` ${p.score.combined.toFixed(3)} ${p.left.rawDescription}  ||  ${p.right.rawDescription}`)
  console.log(`   conflicts: ${p.conflicts.map(c => `${c.slot} ${c.left} vs ${c.right}`).join('; ') || 'none'}`)
}
