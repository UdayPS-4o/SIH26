/**
 * Round-trip check on the four extracts.
 *
 * Run with: npm run check:masters
 *
 * The console is loaded from public/masters, not from the corpus module, so every
 * number a visitor sees comes back out of those four files. That makes the files
 * the thing that has to be right, and it makes a silent divergence possible: edit
 * the corpus, forget to re-export, and the demo quietly runs on yesterday's data
 * while every check script passes.
 *
 * This reads the files exactly as the loader does - same parser, same column
 * mapping, same conversion - and asserts that what comes out is the corpus the
 * other checks were run against, field by field. It also asserts that the header
 * mapping resolved without a human correcting it, because a demo that opens on a
 * column-mapping dialog is a demo that has already lost the room.
 */

import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { CPSES, SAMPLE_RECORDS } from '../src/engine/corpus'
import { parseCsv, applyMapping } from '../src/api/csv'
import { familyFromLabel, type ColumnMapping, type MaterialRecord } from '../src/engine/types'
import { normalizeAll, buildPairs, buildClusters, corpusHealth } from '../src/engine/cluster'
import { DEFAULT_WEIGHTS, DEFAULT_ACCEPT, DEFAULT_REVIEW } from '../src/engine/score'

/** Fields the loader must recover from the file for the demo to be the demo. */
const REQUIRED: (keyof ColumnMapping)[] = [
  'code',
  'description',
  'uom',
  'family',
  'annualQty',
  'unitPrice',
  'stockOnHand',
]

const root = resolve(process.cwd(), 'public')
const problems: string[] = []
const loaded: MaterialRecord[] = []

for (const source of CPSES) {
  const file = join(root, source.extract.replace(/^\//, ''))
  const preview = parseCsv(readFileSync(file, 'utf-8'))

  const missing = REQUIRED.filter(field => preview.mapping[field] < 0)
  const guessed = REQUIRED.filter(field => preview.confidence[field] > 0 && preview.confidence[field] < 1)

  console.log(`${source.code.padEnd(5)} ${source.extract.replace('/masters/', '').padEnd(22)} ${preview.rows.length} rows`)
  console.log(`      headers  ${preview.headers.join(' | ')}`)
  console.log(
    `      mapped   ${REQUIRED.map(f => `${f}=${preview.headers[preview.mapping[f]] ?? 'NONE'}`).join('  ')}`,
  )
  if (guessed.length) console.log(`      guessed  ${guessed.join(', ')}`)
  if (missing.length) problems.push(`${source.code}: no column found for ${missing.join(', ')}`)
  if (preview.problems.length) {
    problems.push(`${source.code}: ${preview.problems.length} malformed line(s)`)
  }

  const rows = applyMapping(preview, preview.mapping, source.code)
  for (const row of rows) {
    if (familyFromLabel(row.family) === null) {
      problems.push(`${source.code}: material group "${row.family}" is not a family the registry knows`)
    }
    loaded.push({
      id: `${source.code}-${row.code}`,
      cpse: source.code,
      localCode: row.code,
      rawDescription: row.description,
      rawUom: row.uom,
      family: familyFromLabel(row.family)!,
      annualQty: row.annualQty,
      unitPrice: row.unitPrice,
      stockOnHand: row.stockOnHand,
    })
  }
  console.log()
}

/* ------------------------------------------------------ field-by-field compare */

const byKey = new Map(loaded.map(record => [`${record.cpse}|${record.localCode}`, record]))

if (loaded.length !== SAMPLE_RECORDS.length) {
  problems.push(`${loaded.length} records read back against ${SAMPLE_RECORDS.length} in the corpus`)
}

for (const want of SAMPLE_RECORDS) {
  const got = byKey.get(`${want.cpse}|${want.localCode}`)
  if (!got) {
    problems.push(`missing after round trip: ${want.cpse} ${want.localCode} ${want.rawDescription}`)
    continue
  }
  for (const field of [
    'rawDescription',
    'rawUom',
    'family',
    'annualQty',
    'unitPrice',
    'stockOnHand',
  ] as const) {
    if (got[field] !== want[field]) {
      problems.push(
        `${want.cpse} ${want.localCode} ${field}: read "${got[field]}" but the corpus says "${want[field]}"`,
      )
    }
  }
}

/* -------------------------------------------- and the same answers come out ---- */

function summarise(records: MaterialRecord[]) {
  const normalized = normalizeAll(records)
  const pairs = buildPairs(records, normalized, {
    weights: DEFAULT_WEIGHTS,
    accept: DEFAULT_ACCEPT,
    review: DEFAULT_REVIEW,
  })
  const clusters = buildClusters(records, normalized, pairs)
  const health = corpusHealth(records, clusters)
  return {
    records: records.length,
    pairs: pairs.length,
    same: pairs.filter(p => p.verdict === 'same').length,
    review: pairs.filter(p => p.verdict === 'review').length,
    different: pairs.filter(p => p.verdict === 'different').length,
    codes: health.distinctCodes,
    shared: health.crossCpseClusters,
    duplicates: health.duplicateRecords,
    largest: health.largestCluster,
  }
}

const fromFiles = summarise(loaded)
const fromCorpus = summarise(SAMPLE_RECORDS)

console.log('                    from the files   from the corpus')
for (const key of Object.keys(fromCorpus) as (keyof typeof fromCorpus)[]) {
  const a = fromFiles[key]
  const b = fromCorpus[key]
  console.log(`  ${key.padEnd(16)} ${String(a).padStart(12)} ${String(b).padStart(17)}${a === b ? '' : '   <-- differs'}`)
  if (a !== b) problems.push(`${key}: files give ${a}, corpus gives ${b}`)
}
console.log()

if (problems.length > 0) {
  console.log(`FAIL: ${problems.length} problem(s).`)
  for (const problem of problems.slice(0, 40)) console.log(`  ${problem}`)
  if (problems.length > 40) console.log(`  and ${problems.length - 40} more`)
  console.log('\nRun `npm run export:masters` if the corpus changed.')
  process.exit(1)
}

console.log('PASS: the four extracts read back as the corpus, with no column corrected by hand.')
