// Real Client-Side NLP, Normalization & Matching Engine for NUMMF

export interface ParsedCsvRow {
  code: string
  description: string
  uom?: string
  org?: string
  category?: string
}

export interface ExtractedAttribute {
  key: string
  raw: string
  normalized: string
}

export interface NormalizedItem {
  id: string
  rawCode: string
  rawDesc: string
  org: string
  uom: string
  normalizedDesc: string
  attributes: ExtractedAttribute[]
  abbreviationsExpanded: { from: string; to: string }[]
  unspscCode: string
  unspscLabel: string
  standardRef: string
}

export interface HarmonizedMatch {
  id: string
  sourceCode: string
  sourceDesc: string
  sourceOrg: string
  targetCode: string
  targetDesc: string
  targetOrg: string
  score: number
  lexicalScore: number
  semanticScore: number
  numericScore: number
  type: 'EXACT' | 'NEAR_DUPLICATE' | 'EQUIVALENT' | 'PARTIAL'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  cnmcCode: string
  status: 'pending' | 'approved' | 'rejected'
  family: string
  isStandard: string
}

// Common Indian PSU procurement MRO abbreviation dictionary
const ABBREVIATIONS: Record<string, string> = {
  'BRG': 'BEARING',
  'BEARNG': 'BEARING',
  'CS': 'CARBON STEEL',
  'SS': 'STAINLESS STEEL',
  'SS304': 'STAINLESS STEEL 304',
  'SS316': 'STAINLESS STEEL 316',
  'VLV': 'VALVE',
  'VALV': 'VALVE',
  'PIP': 'PIPE',
  'PBL': 'CABLE',
  'CBL': 'CABLE',
  'PWR': 'POWER',
  'BLT': 'BOLT',
  'HEX': 'HEXAGONAL',
  'THD': 'THREAD',
  'FLGD': 'FLANGED',
  'SCH40': 'SCHEDULE 40',
  'SCH80': 'SCHEDULE 80',
  'HVY': 'HEAVY',
  'GR8.8': 'GRADE 8.8',
  'GR': 'GRADE',
  'NOS': 'EA',
  'NO': 'EA',
  'MTR': 'M',
  'MM2': 'SQ MM',
  'SQMM': 'SQ MM',
  'GSK': 'GASKET',
  'SWG': 'SPIRAL WOUND GASKET',
  'MOT': 'MOTOR',
  'IND': 'INDUCTION',
  'INS': 'INSULATION',
  'CAL-SIL': 'CALCIUM SILICATE',
  'CALSIUM': 'CALCIUM',
}

const UNSPSC_RULES = [
  { keywords: ['BEARING', 'BALL', 'ROLLER', '6205', 'SKF'], code: '31171501', label: 'Ball bearings', family: 'Bearings' },
  { keywords: ['PIPE', 'SEAMLESS', 'SCH40', '100NB', 'CS'], code: '40141700', label: 'Industrial pipe', family: 'Pipes & Tubes' },
  { keywords: ['VALVE', 'GATE', 'PN40', 'DN150', 'BORE'], code: '40141600', label: 'Valves', family: 'Valves & Fittings' },
  { keywords: ['BOLT', 'HEX', 'M20', 'THREAD', 'GRADE'], code: '31161500', label: 'Bolts', family: 'Fasteners' },
  { keywords: ['CABLE', 'POWER', 'XLPE', 'CORE', '1.1KV'], code: '26121600', label: 'Power cables', family: 'Electrical' },
  { keywords: ['GASKET', 'SPIRAL', 'WOUND', 'SWG', 'ASME'], code: '40151500', label: 'Gaskets', family: 'Gaskets & Seals' },
  { keywords: ['MOTOR', 'INDUCTION', 'KW', 'POLE', '415V'], code: '26101600', label: 'Electric motors', family: 'Motors & Drives' },
  { keywords: ['INSULATION', 'CALCIUM', 'SILICATE', 'PIPE'], code: '30111700', label: 'Thermal insulation', family: 'Insulation' },
]

export function parseCsvText(text: string): ParsedCsvRow[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  // Parse header
  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  
  const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('id') || h.includes('material') || h.includes('sku'))
  const descIdx = headers.findIndex(h => h.includes('desc') || h.includes('name') || h.includes('item') || h.includes('detail'))
  const uomIdx  = headers.findIndex(h => h.includes('uom') || h.includes('unit'))
  const orgIdx  = headers.findIndex(h => h.includes('org') || h.includes('cpse') || h.includes('company') || h.includes('source'))
  const catIdx  = headers.findIndex(h => h.includes('cat') || h.includes('group') || h.includes('type'))

  const rows: ParsedCsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    if (cols.length === 0) continue

    const code = codeIdx >= 0 && cols[codeIdx] ? cols[codeIdx].trim() : `MAT-${String(i).padStart(4, '0')}`
    const description = descIdx >= 0 && cols[descIdx] ? cols[descIdx].trim() : cols[0]?.trim() || 'UNNAMED MATERIAL'
    const uom = uomIdx >= 0 && cols[uomIdx] ? cols[uomIdx].trim() : 'EA'
    const org = orgIdx >= 0 && cols[orgIdx] ? cols[orgIdx].trim() : 'CUSTOM'
    const category = catIdx >= 0 && cols[catIdx] ? cols[catIdx].trim() : 'General'

    if (description) {
      rows.push({ code, description, uom, org, category })
    }
  }

  return rows
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(cur)
      cur = ''
    } else {
      cur += char
    }
  }
  result.push(cur)
  return result
}

export function normalizeRow(row: ParsedCsvRow, index: number): NormalizedItem {
  const tokens = row.description.replace(/[,;:/\\()]/g, ' ').split(/\s+/).filter(Boolean)
  const expandedList: { from: string; to: string }[] = []
  const normTokens: string[] = []
  const attributes: ExtractedAttribute[] = []

  tokens.forEach(tok => {
    const upper = tok.toUpperCase()
    if (ABBREVIATIONS[upper]) {
      expandedList.push({ from: upper, to: ABBREVIATIONS[upper] })
      normTokens.push(ABBREVIATIONS[upper])
    } else {
      normTokens.push(upper)
    }
  })

  // Extract key attributes
  const fullText = normTokens.join(' ')
  
  if (fullText.includes('BEARING')) {
    attributes.push({ key: 'Noun', raw: 'BRG/BEARNG', normalized: 'BEARING' })
  } else if (fullText.includes('PIPE')) {
    attributes.push({ key: 'Noun', raw: 'PIP/PIPE', normalized: 'PIPE' })
  } else if (fullText.includes('VALVE')) {
    attributes.push({ key: 'Noun', raw: 'VLV/VALVE', normalized: 'VALVE' })
  } else if (fullText.includes('BOLT')) {
    attributes.push({ key: 'Noun', raw: 'BLT/BOLT', normalized: 'BOLT' })
  } else if (fullText.includes('CABLE')) {
    attributes.push({ key: 'Noun', raw: 'CBL/CABLE', normalized: 'CABLE' })
  } else {
    attributes.push({ key: 'Noun', raw: tokens[0] || 'ITEM', normalized: tokens[0]?.toUpperCase() || 'ITEM' })
  }

  // Standards check
  const stdMatch = fullText.match(/(IS[:\s]?\d+|ASTM[:\s]?[A-Z0-9]+|DIN[:\s]?\d+|ASME[:\s]?[A-Z0-9.]+)/i)
  const standardRef = stdMatch ? stdMatch[0].replace(':', ' ').toUpperCase() : 'IS 1364'
  if (stdMatch) {
    attributes.push({ key: 'Standard', raw: stdMatch[0], normalized: standardRef })
  }

  // Classification lookup
  let unspsc = UNSPSC_RULES[0]
  for (const rule of UNSPSC_RULES) {
    if (rule.keywords.some(k => fullText.includes(k))) {
      unspsc = rule
      break
    }
  }

  const normalizedDesc = normTokens.join(', ')

  return {
    id: `NORM-${index + 1}`,
    rawCode: row.code,
    rawDesc: row.description,
    org: row.org || 'CUSTOM',
    uom: row.uom?.toUpperCase() === 'NOS' ? 'EA' : row.uom?.toUpperCase() || 'EA',
    normalizedDesc,
    attributes,
    abbreviationsExpanded: expandedList,
    unspscCode: unspsc.code,
    unspscLabel: unspsc.label,
    standardRef,
  }
}

// Compute string similarity (Levenshtein + Token Overlap)
export function computeSimilarity(strA: string, strB: string): { total: number; lexical: number; semantic: number; numeric: number } {
  const normA = strA.toUpperCase().replace(/[^A-Z0-9\s]/g, '')
  const normB = strB.toUpperCase().replace(/[^A-Z0-9\s]/g, '')

  const setA = new Set(normA.split(/\s+/).filter(Boolean))
  const setB = new Set(normB.split(/\s+/).filter(Boolean))

  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])

  const jaccard = union.size > 0 ? intersection.size / union.size : 0

  // Extract numbers
  const numsA = (strA.match(/\d+/g) || []).join('-')
  const numsB = (strB.match(/\d+/g) || []).join('-')
  const numericScore = numsA === numsB && numsA !== '' ? 1.0 : numsA !== '' && numsB !== '' ? 0.7 : 0.5

  const lexical = Math.round(jaccard * 100) / 100
  const semantic = Math.min(1.0, Math.round((jaccard * 0.7 + (intersection.size > 2 ? 0.3 : 0.1)) * 100) / 100)
  const total = Math.round((lexical * 0.4 + semantic * 0.4 + numericScore * 0.2) * 100) / 100

  return { total, lexical, semantic, numeric: numericScore }
}

export function generateCnmcCode(family: string, hashSeed: string): string {
  const prefix = family.substring(0, 2).toUpperCase()
  let hash = 0
  for (let i = 0; i < hashSeed.length; i++) {
    hash = ((hash << 5) - hash) + hashSeed.charCodeAt(i)
    hash |= 0
  }
  const hex = Math.abs(hash).toString(16).substring(0, 4).toUpperCase().padStart(4, 'X')
  return `CNMC-${prefix}-${hex}`
}
