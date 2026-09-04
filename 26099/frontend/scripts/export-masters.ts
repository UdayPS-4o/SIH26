/**
 * Write the four material master extracts the console is loaded from.
 *
 * Run with: npm run export:masters
 *
 * The application no longer ships with data inside it. It starts empty and is
 * filled by loading these four files, which is the same path a fifth organisation
 * would take, and means nothing on any page can have been prepared in advance.
 *
 * Each file is headed the way its source system actually heads an extract - a SAP
 * ECC material list, an S/4HANA product extract, an Oracle EBS item query, a
 * spreadsheet somebody keeps by hand - so the column mapping the loader performs
 * is real work rather than four identical files with the same header row.
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { CPSES, SAMPLE_RECORDS } from '../src/engine/corpus'
import { FAMILY_LABEL, type Cpse, type MaterialRecord } from '../src/engine/types'

/** Header row per source system, in the order the columns are written below. */
const HEADERS: Record<Cpse['code'], string[]> = {
  IOCL: [
    'Material',
    'Material Description',
    'Base Unit of Measure',
    'Material Group',
    'Annual Qty',
    'Moving Avg Price',
    'Unrestricted Stock',
  ],
  NTPC: [
    'Product No.',
    'Product Description',
    'Base UOM',
    'Product Group',
    'Annual Consumption',
    'Valuation Price',
    'Stock On Hand',
  ],
  SAIL: [
    'ITEM_NUMBER',
    'ITEM_DESCRIPTION',
    'PRIMARY_UOM',
    'CATEGORY',
    'ANNUAL_QTY',
    'ITEM_COST',
    'ONHAND_QTY',
  ],
  CIL: ['Item Code', 'Item Name', 'Unit', 'Group', 'Annual Requirement', 'Rate', 'Balance Stock'],
}

/** Quote only when the value would otherwise break the row. NTPC's own house style
 *  separates words with commas, so this is load-bearing rather than defensive. */
function cell(value: string | number): string {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function row(record: MaterialRecord): string {
  return [
    record.localCode,
    record.rawDescription,
    record.rawUom,
    FAMILY_LABEL[record.family],
    record.annualQty,
    record.unitPrice,
    record.stockOnHand,
  ]
    .map(cell)
    .join(',')
}

const out = resolve(process.cwd(), 'public/masters')
mkdirSync(out, { recursive: true })

for (const cpse of CPSES) {
  const held = SAMPLE_RECORDS.filter(record => record.cpse === cpse.code)
  const text = [HEADERS[cpse.code].join(','), ...held.map(row)].join('\n') + '\n'
  const file = join(out, cpse.extract.replace('/masters/', ''))
  writeFileSync(file, text, 'utf-8')
  console.log(
    `${cpse.code.padEnd(5)} ${String(held.length).padStart(3)} rows  ${String(text.length).padStart(6)} bytes  ${file}`,
  )
}

console.log(`\n${SAMPLE_RECORDS.length} records written across ${CPSES.length} files.`)
