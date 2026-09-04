/**
 * CSV reading and column mapping.
 *
 * Pure functions over text. They live apart from the endpoint module because they
 * depend on nothing - no service state, no client, no Vite environment - which is
 * what lets a check script import them and measure a sample file without standing
 * up the whole application.
 */

import type { ColumnMapping, IngestPreview, ParsedRow } from './types'

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      out.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  out.push(current.trim())
  return out
}

/**
 * Header matchers, ordered so the first hit wins. Confidence is reported so the
 * interface can flag a weak guess and invite the operator to correct it.
 *
 * The exact lists carry the header names the four source systems actually emit -
 * SAP's MATNR/MAKTX line, an S/4HANA product extract, an Oracle EBS item query,
 * a hand-kept spreadsheet - because a mapper that only recognises the word
 * "Description" is a mapper that never sees a real export.
 */
const COLUMN_HINTS: Record<keyof ColumnMapping, { exact: string[]; fuzzy: string[] }> = {
  code: {
    exact: [
      'material code', 'material', 'material number', 'matnr', 'code', 'sku',
      'item code', 'item number', 'product no.', 'product number', 'part number',
    ],
    fuzzy: ['mat', 'code', 'item', 'part', 'sku', 'id'],
  },
  description: {
    exact: [
      'description', 'item description', 'material description', 'maktx',
      'short text', 'item name', 'text',
    ],
    fuzzy: ['desc', 'name', 'detail', 'text'],
  },
  uom: {
    exact: ['uom', 'unit', 'unit of measure', 'base uom', 'base unit', 'base unit of measure', 'meins'],
    fuzzy: ['uom', 'unit', 'measure'],
  },
  family: {
    exact: [
      'material group', 'product group', 'commodity group', 'item group', 'group',
      'category', 'family', 'matkl',
    ],
    fuzzy: ['group', 'categ', 'famil', 'class'],
  },
  org: {
    exact: ['organization', 'organisation', 'org', 'company', 'company code', 'plant'],
    fuzzy: ['cpse', 'plant', 'source', 'org'],
  },
  annualQty: {
    exact: ['annual qty', 'annual quantity', 'annual consumption', 'annual requirement', 'qty', 'quantity'],
    fuzzy: ['annual', 'yearly', 'qty', 'quantity', 'volume', 'consum'],
  },
  unitPrice: {
    exact: ['unit price', 'price', 'rate', 'moving avg price', 'valuation price', 'standard price'],
    fuzzy: ['price', 'rate', 'cost', 'value'],
  },
  stockOnHand: {
    exact: [
      'stock', 'stock on hand', 'on hand', 'closing stock', 'inventory',
      'unrestricted stock', 'balance stock',
    ],
    fuzzy: ['stock', 'hand', 'balance', 'inventory'],
  },
}

const NO_MAPPING: ColumnMapping = {
  code: -1,
  description: -1,
  uom: -1,
  org: -1,
  annualQty: -1,
  unitPrice: -1,
  stockOnHand: -1,
  family: -1,
}

export function parseCsv(text: string): IngestPreview {
  const rawLines = text.split(/\r?\n/)
  const problems: { line: number; reason: string }[] = []
  const lines: { index: number; cells: string[] }[] = []

  rawLines.forEach((line, index) => {
    if (line.trim().length === 0) {
      if (index > 0 && index < rawLines.length - 1) {
        problems.push({ line: index + 1, reason: 'blank line, skipped' })
      }
      return
    }
    lines.push({ index: index + 1, cells: splitCsvLine(line) })
  })

  if (lines.length === 0) {
    return {
      headers: [],
      mapping: { ...NO_MAPPING },
      rows: [],
      problems: [{ line: 1, reason: 'file is empty' }],
      confidence: Object.fromEntries(
        (Object.keys(NO_MAPPING) as (keyof ColumnMapping)[]).map(key => [key, 0]),
      ) as Record<keyof ColumnMapping, number>,
    }
  }

  const headers = lines[0].cells
  const lower = headers.map(h => h.toLowerCase().trim())
  const mapping = {} as ColumnMapping
  const confidence = {} as Record<keyof ColumnMapping, number>

  // Two passes, and a column can only be claimed once.
  //
  // One pass in field order let a fuzzy guess take a column that a later field
  // named outright: an Oracle export headed ITEM_NUMBER, ITEM_DESCRIPTION,
  // PRIMARY_UOM_CODE had its code column resolved to PRIMARY_UOM_CODE, because
  // "code" appears in it and the code field is considered first. Settling every
  // exact name before any guess is made removes the whole class of that error.
  const fields = Object.keys(COLUMN_HINTS) as (keyof ColumnMapping)[]
  const claimed = new Set<number>()

  for (const field of fields) {
    const index = lower.findIndex((h, i) => !claimed.has(i) && COLUMN_HINTS[field].exact.includes(h))
    mapping[field] = index
    confidence[field] = index === -1 ? 0 : 1
    if (index >= 0) claimed.add(index)
  }

  for (const field of fields) {
    if (mapping[field] >= 0) continue
    const hints = COLUMN_HINTS[field].fuzzy
    const index = lower.findIndex((h, i) => !claimed.has(i) && hints.some(f => h.includes(f)))
    mapping[field] = index
    confidence[field] = index === -1 ? 0 : 0.55
    if (index >= 0) claimed.add(index)
  }

  const rows = lines.slice(1).map(l => l.cells)
  lines.slice(1).forEach(line => {
    if (line.cells.length !== headers.length) {
      problems.push({
        line: line.index,
        reason: `${line.cells.length} values against ${headers.length} columns`,
      })
    }
  })

  return { headers, mapping, rows, problems, confidence }
}

/** Turn preview rows into typed rows using a mapping the operator may have edited. */
export function applyMapping(preview: IngestPreview, mapping: ColumnMapping, fallbackOrg: string): ParsedRow[] {
  const pick = (cells: string[], index: number) => (index >= 0 ? (cells[index] ?? '').trim() : '')
  const rows: ParsedRow[] = []

  for (const cells of preview.rows) {
    const description = pick(cells, mapping.description)
    if (!description) continue
    const qty = Number(pick(cells, mapping.annualQty).replace(/[^\d.]/g, ''))
    const price = Number(pick(cells, mapping.unitPrice).replace(/[^\d.]/g, ''))
    const stock = Number(pick(cells, mapping.stockOnHand).replace(/[^\d.]/g, ''))
    rows.push({
      code: pick(cells, mapping.code) || `ROW-${rows.length + 1}`,
      description,
      uom: pick(cells, mapping.uom) || 'NOS',
      org: pick(cells, mapping.org) || fallbackOrg,
      annualQty: Number.isFinite(qty) && qty > 0 ? qty : 100,
      unitPrice: Number.isFinite(price) && price > 0 ? price : 1000,
      // Most ERP extracts do not carry a stock column. Zero is recorded as "the
      // source did not say" rather than "the shelf is empty", and the interface
      // says so where it matters.
      stockOnHand: Number.isFinite(stock) && stock > 0 ? stock : 0,
      family: pick(cells, mapping.family),
    })
  }
  return rows
}
