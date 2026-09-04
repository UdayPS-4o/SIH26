/**
 * Wrong-match check.
 *
 * Run with: npm run check:truth
 *
 * check:corpus reports the shape of the output. This one reports whether the
 * output is right, which is a different question and the one that matters when
 * somebody is standing at the screen.
 *
 * The generator knows which records came from the same physical item, so every
 * merge the engine makes can be graded rather than eyeballed. Three failures are
 * possible and all three are printed in full, no sampling:
 *
 *   FALSE MERGE      two different items were given the same national code
 *   CONTAMINATED     a code covers records of more than one item
 *   MISSED           two records of one item did not resolve together
 *
 * A false merge is the one that loses a demo, so it exits non-zero. A missed
 * match is a smaller sin - it leaves money on the table rather than putting a
 * wrong answer on a screen - so it is reported and tolerated.
 *
 * Rows are reported with the page they land on in the Explorer, the Duplicates
 * queue and the Code Book, at those pages' own page sizes, because "wrong on
 * page one" and "wrong on page nine" are not the same problem.
 */

import { SAMPLE_RECORDS, TRUTH } from '../src/engine/corpus'
import { normalizeAll, buildPairs, buildClusters } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW, decisiveConflicts } from '../src/engine/score'

/** Page sizes the interface actually uses, so "page 1" here means page 1 there. */
const EXPLORER_PAGE = 40
const REGISTRY_PAGE = 25

const truthOf = (id: string) => TRUTH.get(id) ?? id

const normalized = normalizeAll(SAMPLE_RECORDS)
const pairs = buildPairs(SAMPLE_RECORDS, normalized, {
  weights: DEFAULT_WEIGHTS,
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
})
const clusters = buildClusters(SAMPLE_RECORDS, normalized, pairs)

/** Where each record sits in the Explorer's default (unsorted, unfiltered) order. */
const explorerRow = new Map(SAMPLE_RECORDS.map((record, index) => [record.id, index]))
const explorerPage = (id: string) => Math.floor((explorerRow.get(id) ?? 0) / EXPLORER_PAGE) + 1

/* ------------------------------------------------------------- false merges */

const accepted = pairs.filter(pair => pair.verdict === 'same')
const falseMerges = accepted.filter(pair => truthOf(pair.left.id) !== truthOf(pair.right.id))

/* ------------------------------------------------------------ contamination */

const contaminated = clusters
  .map((cluster, index) => ({
    cluster,
    page: Math.floor(index / REGISTRY_PAGE) + 1,
    truths: [...new Set(cluster.members.map(m => truthOf(m.id)))],
  }))
  .filter(entry => entry.truths.length > 1)

/* ------------------------------------------------------- pointless questions */

/**
 * Pairs sent to a person that a person cannot usefully answer.
 *
 * A review queue is only worth a reviewer's time while everything in it is a real
 * question. A 65NB gate valve against a 150NB gate valve is not: the two lines
 * state different bores, and asking somebody to adjudicate that teaches them to
 * click through the queue without reading it. Anything with a decisive
 * contradiction belongs in the rejected pile, so finding one here is a bug.
 */
const pointless = pairs.filter(
  pair => pair.verdict === 'review' && decisiveConflicts(pair.conflicts).length > 0,
)

/* ------------------------------------------------------------------ missed */

const missed = pairs.filter(
  pair => pair.verdict !== 'same' && truthOf(pair.left.id) === truthOf(pair.right.id),
)

/* ---------------------------------------------------------------- reporting */

console.log(`records          ${SAMPLE_RECORDS.length}`)
console.log(`candidate pairs  ${pairs.length}`)
console.log(`accepted         ${accepted.length}`)
console.log(`codes            ${clusters.length}`)
console.log()

console.log(`FALSE MERGES          ${falseMerges.length}`)
if (falseMerges.length > 0) {
  for (const pair of falseMerges) {
    console.log(
      `  ${pair.score.combined.toFixed(3)}  explorer p${explorerPage(pair.left.id)}/p${explorerPage(pair.right.id)}  ${pair.proposedCode}`,
    )
    console.log(`     ${pair.left.cpse.padEnd(5)} ${pair.left.rawDescription}`)
    console.log(`     ${pair.right.cpse.padEnd(5)} ${pair.right.rawDescription}`)
  }
}
console.log()

console.log(`CONTAMINATED CODES    ${contaminated.length}`)
for (const entry of contaminated) {
  console.log(
    `  ${entry.cluster.code}  code book p${entry.page}  ${entry.truths.length} different items in one code`,
  )
  for (const member of entry.cluster.members) {
    console.log(`     ${member.cpse.padEnd(5)} ${member.rawDescription}`)
  }
}
console.log()

console.log(`POINTLESS QUESTIONS   ${pointless.length}`)
for (const pair of pointless) {
  console.log(
    `  ${pair.score.combined.toFixed(3)}  ${pair.conflicts.map(c => `${c.slot} ${c.left}/${c.right}`).join('; ')}`,
  )
  console.log(`     ${pair.left.cpse.padEnd(5)} ${pair.left.rawDescription}`)
  console.log(`     ${pair.right.cpse.padEnd(5)} ${pair.right.rawDescription}`)
}
console.log()

console.log(`MISSED MATCHES        ${missed.length}`)
const byVerdict = {
  review: missed.filter(p => p.verdict === 'review').length,
  different: missed.filter(p => p.verdict === 'different').length,
}
console.log(`  held for review     ${byVerdict.review}`)
console.log(`  rejected outright   ${byVerdict.different}`)
for (const pair of [...missed].sort((a, b) => a.score.combined - b.score.combined)) {
  console.log(
    `  ${pair.score.combined.toFixed(3)}  ${pair.verdict.padEnd(9)}  ${pair.left.rawDescription}  ||  ${pair.right.rawDescription}`,
  )
}
console.log()

if (falseMerges.length > 0 || contaminated.length > 0) {
  console.log('FAIL: the engine put two different items under one code.')
  process.exit(1)
}
if (pointless.length > 0) {
  console.log('FAIL: the review queue contains pairs that contradict on a stated fact.')
  process.exit(1)
}
console.log('PASS: no two different items share a national code, and every pair')
console.log('      in the review queue is a question worth asking.')
