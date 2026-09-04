/**
 * Every number the demo script is allowed to say.
 *
 * Run with: npm run demo:numbers
 *
 * A demo script written from memory goes stale the first time the corpus or the
 * engine changes, and the person on stage finds out in front of the room. This
 * prints the current value of everything the script quotes, including the split
 * each sample CSV produces, so the document can be regenerated rather than
 * remembered.
 *
 * If a figure is not in this output, it does not go in the script.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { SAMPLE_RECORDS, CPSES, TOTAL_RECORDS, TRUTH } from '../src/engine/corpus'
import { normalizeAll, buildPairs, buildClusters, corpusHealth, mintCode } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW, score } from '../src/engine/score'
import { normalize } from '../src/engine/normalize'
import { computeSavings, DEFAULT_SAVINGS, formatRupees, formatCount } from '../src/engine/savings'
import { parseCsv, applyMapping } from '../src/api/csv'
import { BASE_RULES } from '../src/engine/dictionary'

const rupees = (n: number) => formatRupees(n)
const inr = (n: number) => Math.round(n).toLocaleString('en-IN')

const normalized = normalizeAll(SAMPLE_RECORDS)
const pairs = buildPairs(SAMPLE_RECORDS, normalized, {
  weights: DEFAULT_WEIGHTS,
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
})
const clusters = buildClusters(SAMPLE_RECORDS, normalized, pairs)
const health = corpusHealth(SAMPLE_RECORDS, clusters)

const same = pairs.filter(p => p.verdict === 'same').length
const review = pairs.filter(p => p.verdict === 'review').length
const different = pairs.filter(p => p.verdict === 'different').length

const duplicateRate = health.duplicateRecords / SAMPLE_RECORDS.length
const corpusDuplicates = Math.round(TOTAL_RECORDS * duplicateRate)
const savings = computeSavings(corpusDuplicates, DEFAULT_SAVINGS)

console.log('=== CORPUS ==========================================================')
console.log(`organisations          ${CPSES.length}`)
for (const cpse of CPSES) {
  const held = SAMPLE_RECORDS.filter(r => r.cpse === cpse.code).length
  console.log(`  ${cpse.code.padEnd(5)} ${cpse.erp.padEnd(28)} ${inr(cpse.totalRecords).padStart(9)} total, ${held} in slice`)
}
console.log(`full corpus            ${inr(TOTAL_RECORDS)}  (${formatCount(TOTAL_RECORDS)})`)
console.log(`inspectable slice      ${SAMPLE_RECORDS.length}`)
console.log(`dictionary rules       ${BASE_RULES.length}`)
console.log()

console.log('=== LOADING THE FOUR MASTERS, IN ORDER ==============================')
console.log('what each source card reads once its load finishes:')
{
  const soFar: typeof SAMPLE_RECORDS = []
  for (const cpse of CPSES) {
    const incoming = SAMPLE_RECORDS.filter(r => r.cpse === cpse.code)
    const before = new Set(soFar.map(r => r.id))
    const arriving = new Set(incoming.map(r => r.id))
    const codesBefore = soFar.length
      ? buildClusters(
          soFar,
          normalizeAll(soFar),
          buildPairs(soFar, normalizeAll(soFar), {
            weights: DEFAULT_WEIGHTS,
            accept: DEFAULT_ACCEPT,
            review: DEFAULT_REVIEW,
          }),
        ).length
      : 0

    soFar.push(...incoming)
    const norm = normalizeAll(soFar)
    const pr = buildPairs(soFar, norm, {
      weights: DEFAULT_WEIGHTS,
      accept: DEFAULT_ACCEPT,
      review: DEFAULT_REVIEW,
    })
    const cl = buildClusters(soFar, norm, pr)

    let matched = 0
    for (const cluster of cl) {
      if (!cluster.members.some(m => before.has(m.id))) continue
      for (const m of cluster.members) if (arriving.has(m.id)) matched += 1
    }
    const held = pr.filter(
      p => p.verdict === 'review' && (arriving.has(p.left.id) || arriving.has(p.right.id)),
    ).length

    console.log(
      `  ${cpse.code.padEnd(5)} ${String(incoming.length).padStart(3)} read · ` +
        `${String(matched).padStart(3)} already known · ` +
        `${String(held).padStart(2)} for a person · ` +
        `registry now ${String(cl.length).padStart(3)} codes (+${cl.length - codesBefore})`,
    )
  }
}
console.log()

console.log('=== MATCHING ========================================================')
console.log(`candidate pairs        ${pairs.length}`)
console.log(`  same                 ${same}`)
console.log(`  needs a decision     ${review}`)
console.log(`  different            ${different}`)
console.log(`accept threshold       ${DEFAULT_ACCEPT}`)
console.log(`review threshold       ${DEFAULT_REVIEW}`)
console.log(`weights                lexical ${DEFAULT_WEIGHTS.lexical} attribute ${DEFAULT_WEIGHTS.attribute} numeric ${DEFAULT_WEIGHTS.numeric}`)
console.log()

console.log('=== REGISTRY ========================================================')
console.log(`national codes         ${health.distinctCodes}`)
console.log(`  shared by 2+ orgs    ${health.crossCpseClusters}`)
console.log(`  single organisation  ${health.distinctCodes - health.crossCpseClusters}`)
console.log(`duplicate records      ${health.duplicateRecords}  (${(duplicateRate * 100).toFixed(1)}% of the slice)`)
console.log(`largest group          ${health.largestCluster}`)
console.log()

console.log('=== CORRECTNESS =====================================================')
const truthOf = (id: string) => TRUTH.get(id) ?? id
const falseMerges = pairs.filter(
  p => p.verdict === 'same' && truthOf(p.left.id) !== truthOf(p.right.id),
).length
const contaminated = clusters.filter(
  c => new Set(c.members.map(m => truthOf(m.id))).size > 1,
).length
const missed = pairs.filter(
  p => p.verdict !== 'same' && truthOf(p.left.id) === truthOf(p.right.id),
)
const missedRejected = missed.filter(p => p.verdict === 'different')
console.log(`false merges           ${falseMerges}`)
console.log(`contaminated codes     ${contaminated}`)
console.log(`missed matches         ${missed.length}  (${missedRejected.length} rejected outright)`)
console.log()
console.log('the pairs no dictionary can reach, which is what the model is for:')
for (const p of missedRejected) {
  console.log(`  ${p.score.combined.toFixed(3)}  ${p.left.rawDescription}  ||  ${p.right.rawDescription}`)
}
console.log()

console.log('=== SAVINGS =========================================================')
console.log(`duplicate rate         ${(duplicateRate * 100).toFixed(1)}% measured on the slice`)
console.log(`corpus duplicates      ${inr(corpusDuplicates)}`)
for (const step of savings.steps) {
  const value = step.unit === 'rupees' ? rupees(step.value) : inr(step.value)
  console.log(`  ${step.label.padEnd(28)} ${value.padStart(18)}   ${step.assumption}`)
}
console.log()

console.log('=== INVENTORY =======================================================')
const stockValue = SAMPLE_RECORDS.reduce((s, r) => s + r.stockOnHand * r.unitPrice, 0)
const sharedIds = new Set<string>()
for (const cluster of clusters) {
  if (cluster.cpses.length > 1) for (const m of cluster.members) sharedIds.add(m.id)
}
const sharedValue = SAMPLE_RECORDS.filter(r => sharedIds.has(r.id)).reduce(
  (s, r) => s + r.stockOnHand * r.unitPrice,
  0,
)
console.log(`stock value in slice   ${rupees(stockValue)}`)
console.log(`held under shared code ${rupees(sharedValue)}  (${((sharedValue / stockValue) * 100).toFixed(0)}%)`)
console.log()

console.log('=== THE RESOLVER, AS IT OPENS =======================================')
const bearings = clusters
  .filter(c => c.family === 'bearings' && c.members.length > 1)
  .sort((a, b) => b.members.length - a.members.length)[0]
if (bearings) {
  console.log(`seed cluster           ${bearings.code}  (${bearings.members.length} entries)`)
  for (const m of bearings.members) console.log(`  ${m.cpse.padEnd(5)} ${m.rawUom.padEnd(4)} ${m.rawDescription}`)
  const anchor = normalized.get(bearings.members[0].id)!
  console.log(`  signature            ${anchor.signature}`)
  console.log(`  mints                ${mintCode(bearings.family, anchor.signature)}`)
  for (let i = 1; i < bearings.members.length; i++) {
    const r = score(anchor, normalized.get(bearings.members[i].id)!, DEFAULT_WEIGHTS)
    console.log(`  vs ${bearings.members[i].cpse.padEnd(5)} combined ${r.breakdown.combined.toFixed(3)}`)
  }
}
console.log()

console.log('=== THE FAILURE TO SHOW ON PURPOSE ==================================')
const failText = 'HYDRAULIC PUMP 10HP 415V'
if (bearings) {
  const anchor = normalized.get(bearings.members[0].id)!
  const bad = normalize(failText, 'NOS', 'typed')
  const r = score(anchor, bad, DEFAULT_WEIGHTS)
  console.log(`type into the first row: ${failText}`)
  console.log(`  combined             ${r.breakdown.combined.toFixed(3)} against accept ${DEFAULT_ACCEPT}`)
  console.log(`  conflict             ${r.conflicts.map(c => `${c.slot} ${c.left} against ${c.right}`).join('; ') || 'none'}`)
}
console.log()

console.log('=== SAMPLE CSVs =====================================================')
const samples = resolve(process.cwd(), 'public/samples')
let files: string[] = []
try {
  files = readdirSync(samples).filter(f => f.endsWith('.csv'))
} catch {
  console.log('  public/samples not found')
}
for (const file of files.sort()) {
  const text = readFileSync(join(samples, file), 'utf-8')
  const preview = parseCsv(text)
  const rows = applyMapping(preview, preview.mapping, 'DEMO')
  // The three groups the Import page actually prints, in its own order. Counting
  // "already exists" as everything above the review threshold merged two of them
  // and put a number in the script that never appears on the screen.
  let coded = 0
  let undecided = 0
  for (const row of rows) {
    const norm = normalize(row.description, row.uom, `up-${row.code}`)
    let best = 0
    for (const candidate of SAMPLE_RECORDS) {
      const cn = normalized.get(candidate.id)
      if (!cn) continue
      const s = score(norm, cn, DEFAULT_WEIGHTS).breakdown.combined
      if (s > best) best = s
    }
    if (best >= DEFAULT_ACCEPT) coded += 1
    else if (best >= DEFAULT_REVIEW) undecided += 1
  }
  console.log(
    `  ${file.padEnd(24)} ${String(rows.length).padStart(3)} usable rows, ` +
      `${String(coded).padStart(3)} already coded, ` +
      `${String(undecided).padStart(2)} need a person, ` +
      `${String(rows.length - coded - undecided).padStart(3)} new` +
      (preview.problems.length ? `, ${preview.problems.length} unreadable line(s)` : ''),
  )
}
