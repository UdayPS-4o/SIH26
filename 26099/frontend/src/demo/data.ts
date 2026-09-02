export interface MockSource {
  id: string
  name: string
  short: string
  system: string
  color: string
  icon: string
  rowCount: number
  dupRate: number
}

export interface MockBatch {
  id: string
  sourceId: string
  name: string
  totalRows: number
  importedRows: number
  duplicatesFound: number
  status: 'queued' | 'importing' | 'normalizing' | 'matching' | 'mapped' | 'complete'
  startedAt?: number
  completedAt?: number
  progress: number
  logs: string[]
}

export interface MockMatch {
  id: string
  sourceCode: string
  sourceDesc: string
  sourceOrg: string
  targetCode: string
  targetDesc: string
  targetOrg: string
  score: number
  type: 'EXACT' | 'NEAR_DUPLICATE' | 'EQUIVALENT' | 'PARTIAL'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  cnmcCode?: string
}

export const SOURCES: MockSource[] = [
  { id: 'iocl', name: 'Indian Oil Corporation Limited', short: 'IOCL', system: 'SAP ECC 6.0', color: '#3b82f6', icon: '⛽', rowCount: 125000, dupRate: 0.15 },
  { id: 'ntpc', name: 'NTPC Limited', short: 'NTPC', system: 'SAP S/4HANA', color: '#8b5cf6', icon: '⚡', rowCount: 89000, dupRate: 0.12 },
  { id: 'sail', name: 'Steel Authority of India', short: 'SAIL', system: 'Maximo 7.6', color: '#f59e0b', icon: '🔩', rowCount: 67000, dupRate: 0.18 },
  { id: 'cil', name: 'Coal India Limited', short: 'CIL', system: 'Oracle EBS 12.2', color: '#10b981', icon: '⛏️', rowCount: 45000, dupRate: 0.22 },
]

const MATERIAL_DESCS: Record<string, string[]> = {
  iocl: [
    'MS ROUND BAR 25MM DIA EN8', 'CS PIPES SCH40 100NB IS:1239', 'GASKET SPIRAL WOUND 100NB',
    'BOLT HEX FULL HD M20X60 SS304', 'ANGLE EQUAL 50X50X6MM MS IS:2062', 'PIPE FLANGE WN RF 100NB PN40',
    'VALVE GATE FULL BORE 100NB PN40', 'BEARING BALL DEEP GROOVE 6205', 'SEAL O-RING VITON 75X3MM',
    'CABLE POWER 3.5C X 185SQMM XLPE', 'MOTOR INDUCTION 5.5KW 4POLE', 'PUMP CENTRIFUGAL END SUCTION',
    'FITTING ELBOW 90D EG 100NB', 'WELDING ROD MS 3.15MM IS:814', 'PAINT EPOXY PRIMER 20L',
    'INSULATION CALCIUM SILICATE 50MM', 'BOLTING STUD M24X100 ASTM A193 B7', 'GASKET NON-ASBESTOS 150NB',
    'FILTER ELEMENT HYDRAULIC 10MIC', 'HOSE HYDRAULIC SAE 100R2 12MM', 'FITTING TEE REDUCER 100X80NB',
  ],
  ntpc: [
    'MILD STEEL ROUND 25MM DIA', 'CARBON STEEL PIPE 100NB SCH40', 'SPIRAL WOUND GASKET 4INCH CL300',
    'HEX BOLT FULL THREAD M20X60 SS304L', 'MS ANGLE 50X50X6 IS:2062', 'WELD NECK FLANGE 100NB PN40',
    'GATE VALVE FULL PORT 4INCH', 'BALL BEARING 6205 2RS', 'VITON O-RING 75X3MM DIN3771',
    'POWER CABLE 3.5C 185SQMM', 'IE2 MOTOR 5.5KW 4POLE 415V', 'CENTRIFUGAL PUMP END SUCTION',
    '90DEG ELBOW 100NB CLASS40', 'WELDING ELECTRODE 3.15MM IS:814', 'EPOXY PRIMER PAINT 20L',
    'CALSIUM SILICATE INSULATION 50MM', 'STUD BOLT M24X100 ASTM A193 B7', 'NON-ASBESTOS GASKET 150NB',
    'HYDRAULIC FILTER ELEMENT 10MIC', 'HYDRAULIC HOSE SAE 100R2', 'REDUCING TEE 100X80NB',
  ],
  sail: [
    'EN8 STEEL ROUND 25 MM', 'IS:1239 PIPE CS 100 NB', 'SWG 100 NB PN40 IS:7092',
    'HEX FULL THREAD BOLT M20X60 A2-70', 'IS:2062 MS ANGLE 50X50X6', 'WN FLANGE 100NB PN40 IS:4833',
    'GATE VALVE 100NB PN40 IS:3464', 'DEEP GROOVE BALL BEARING 6205', 'VITON O RING 75X3',
    '3.5C X 185 SQ MM XLPE CABLE', '5.5 KW IE3 MOTOR 4 POLE', 'END SUCTION PUMP IS:5420',
    '90 DEG ELBOW EG 100NB', 'MS WELDING ROD 3.15 MM', 'EPOXY RED OXIDE PRIMER 20 LTR',
    'CALCIUM SILICATE PIPE INSULATION', 'ASTM A193 B7 STUD BOLT', 'CNAB GASKET 150 NB',
    'HYD FILTER ELEMENT 10 MICRON', 'HYDRAULIC HOSE PIPE 12 MM',
  ],
  cil: [
    'MILD STEEL ROUND BAR 25MM EN8D', 'CS PIPE SCH40 100NB BS:1387', 'SPIRAL WOUND GASKET 4IN 300LB',
    'HEX BOLT M20X60 SS304 DIN933', 'MS EQUAL ANGLE 50X50X6 IS:2062', 'WELD NECK FLANGE RF 100NB PN40',
    'GATE VALVE BODY CAST IRON 100NB', 'BALL BEARING 6205-2RS SKF', 'FKM O-RING 75X3MM',
    'POWER CABLE 3.5C 185MM2', 'INDUCTION MOTOR 5.5KW 415V', 'CENTRIFUGAL PUMP',
    'ELBOW 90D 100NB ASTM A234 WPB', 'WELDING ELECTRODE E6013 3.15MM', 'EPOXY PRIMER 20 LITRE',
    'PIPE INSULATION CAL-SIL 50MM', 'STUD BOLT 7/8X4 ASTM A193 B7', 'JOINT GASKET 150NB NON ASBESTOS',
    'HYDRAULIC FILTER ELEMENT 10U', 'R2 HYDRAULIC HOSE 12MM ID',
  ],
}

export function generateBatch(source: MockSource, count: number): MockBatch {
  const descriptions = MATERIAL_DESCS[source.id] || MATERIAL_DESCS.iocl
  const rows: string[] = []
  const now = Date.now()

  for (let i = 0; i < count; i++) {
    const desc = descriptions[i % descriptions.length]
    const suffix = count > descriptions.length ? ` VAR-${String(Math.floor(i / descriptions.length) + 1).padStart(3, '0')}` : ''
    rows.push(`${desc}${suffix}`)
  }

  return {
    id: `BATCH-${source.short}-${Date.now().toString(36).toUpperCase()}`,
    sourceId: source.id,
    name: `${source.name} Material Master`,
    totalRows: count,
    importedRows: 0,
    duplicatesFound: 0,
    status: 'queued',
    progress: 0,
    logs: [`[${new Date(now).toISOString()}] Queued import from ${source.system}`],
  }
}

export function generateMatches(sourceA: MockSource, sourceB: MockSource, count: number): MockMatch[] {
  const matches: MockMatch[] = []
  const types: MockMatch['type'][] = ['EXACT', 'NEAR_DUPLICATE', 'EQUIVALENT', 'PARTIAL']
  const baseDescs = MATERIAL_DESCS[sourceA.id] || MATERIAL_DESCS.iocl
  const targetDescs = MATERIAL_DESCS[sourceB.id] || MATERIAL_DESCS.iocl

  for (let i = 0; i < count; i++) {
    const base = baseDescs[i % baseDescs.length]
    const target = targetDescs[i % targetDescs.length]
    const score = 0.55 + Math.random() * 0.45
    const confidence: MockMatch['confidence'] = score > 0.9 ? 'HIGH' : score > 0.75 ? 'MEDIUM' : 'LOW'
    const typeIndex = confidence === 'HIGH' ? Math.floor(Math.random() * 2) : confidence === 'MEDIUM' ? 2 : 3
    const cnmc = confidence !== 'LOW' ? `CNMC-${String(i % 14 + 1).padStart(2, '0')}-${Math.abs(hashCode(`${base}${target}`)).toString(36).substring(2, 6).toUpperCase()}` : undefined

    matches.push({
      id: `MATCH-${i + 1}`,
      sourceCode: `${sourceA.short}-MAT-${String(1000 + i).padStart(5, '0')}`,
      sourceDesc: base,
      sourceOrg: sourceA.short,
      targetCode: `${sourceB.short}-MAT-${String(2000 + i).padStart(5, '0')}`,
      targetDesc: target,
      targetOrg: sourceB.short,
      score: Math.round(score * 1000) / 1000,
      type: types[typeIndex],
      confidence,
      cnmcCode: cnmc,
    })
  }
  return matches
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}

// ─── Normalization Examples ────────────────────────────────────────────────
export interface NormExample {
  id: string
  org: string
  rawCode: string
  rawDesc: string
  normalizedDesc: string
  attributes: { key: string; raw: string; normalized: string }[]
  abbreviationsExpanded: { from: string; to: string }[]
  unspscCode: string
  unspscLabel: string
  standardRef: string
  uom: string
}

export const NORMALIZATION_EXAMPLES: NormExample[] = [
  {
    id: 'N001', org: 'IOCL', rawCode: 'IOCL-BRG-1005',
    rawDesc: 'BRG,BALL,SKF 6205-2RS,25MM ID,GREASE SEAL,IS:6305',
    normalizedDesc: 'BEARING, BALL, DEEP GROOVE, 6205-2RS, BORE 25MM, GREASE SEALED, SKF, IS 6305',
    attributes: [
      { key: 'Noun',       raw: 'BRG',      normalized: 'BEARING' },
      { key: 'Type',       raw: 'BALL',     normalized: 'BALL, DEEP GROOVE' },
      { key: 'Model',      raw: '6205-2RS', normalized: '6205-2RS' },
      { key: 'Bore',       raw: '25MM ID',  normalized: '25 MM' },
      { key: 'Seal',       raw: 'GREASE SEAL', normalized: 'GREASE SEALED (2RS)' },
      { key: 'Brand',      raw: 'SKF',      normalized: 'SKF' },
      { key: 'Standard',   raw: 'IS:6305',  normalized: 'IS 6305' },
      { key: 'UOM',        raw: 'NOS',      normalized: 'EA' },
    ],
    abbreviationsExpanded: [
      { from: 'BRG', to: 'BEARING' },
      { from: 'NOS', to: 'EA' },
      { from: 'ID', to: 'BORE (INNER DIAMETER)' },
    ],
    unspscCode: '31171501', unspscLabel: 'Ball bearings',
    standardRef: 'IS 6305', uom: 'EA',
  },
  {
    id: 'N002', org: 'SAIL', rawCode: 'SAIL-PIP-2002',
    rawDesc: 'CS PIPE SCH40 100NB IS:1239 HVY',
    normalizedDesc: 'PIPE, CARBON STEEL, SEAMLESS, 100NB, SCHEDULE 40, HEAVY, IS 1239',
    attributes: [
      { key: 'Noun',     raw: 'PIPE',     normalized: 'PIPE' },
      { key: 'Material', raw: 'CS',       normalized: 'CARBON STEEL' },
      { key: 'Schedule', raw: 'SCH40',    normalized: 'SCHEDULE 40' },
      { key: 'Size',     raw: '100NB',    normalized: '100 NB (DN 100)' },
      { key: 'Weight',   raw: 'HVY',      normalized: 'HEAVY' },
      { key: 'Standard', raw: 'IS:1239',  normalized: 'IS 1239' },
      { key: 'UOM',      raw: 'MTR',      normalized: 'M' },
    ],
    abbreviationsExpanded: [
      { from: 'CS', to: 'CARBON STEEL' },
      { from: 'SCH40', to: 'SCHEDULE 40' },
      { from: 'NB', to: 'NOMINAL BORE' },
      { from: 'HVY', to: 'HEAVY' },
      { from: 'MTR', to: 'M (METRE)' },
    ],
    unspscCode: '40141700', unspscLabel: 'Industrial pipe',
    standardRef: 'IS 1239', uom: 'M',
  },
  {
    id: 'N003', org: 'NTPC', rawCode: 'NTPC-VLV-3003',
    rawDesc: 'GATE VLV FULL BORE 100NB PN40 SS304 FLGD END',
    normalizedDesc: 'VALVE, GATE, FULL BORE, 100NB, PN40, SS 304 BODY, FLANGED END',
    attributes: [
      { key: 'Noun',     raw: 'GATE VLV',  normalized: 'VALVE, GATE' },
      { key: 'Bore',     raw: 'FULL BORE', normalized: 'FULL BORE' },
      { key: 'Size',     raw: '100NB',     normalized: '100 NB (DN 100)' },
      { key: 'Pressure', raw: 'PN40',      normalized: 'PN 40 (40 Bar)' },
      { key: 'Material', raw: 'SS304',     normalized: 'STAINLESS STEEL 304' },
      { key: 'Ends',     raw: 'FLGD END',  normalized: 'FLANGED ENDS (RF)' },
      { key: 'UOM',      raw: 'NO',        normalized: 'EA' },
    ],
    abbreviationsExpanded: [
      { from: 'VLV', to: 'VALVE' },
      { from: 'SS304', to: 'STAINLESS STEEL AISI 304' },
      { from: 'PN40', to: 'PRESSURE NOMINAL 40 BAR' },
      { from: 'FLGD', to: 'FLANGED' },
      { from: 'NO', to: 'EA (EACH)' },
    ],
    unspscCode: '40141600', unspscLabel: 'Valves',
    standardRef: 'IS 5428', uom: 'EA',
  },
  {
    id: 'N004', org: 'CIL', rawCode: 'CIL-CBL-4004',
    rawDesc: 'PWR CBL 3.5C X 185MM2 XLPE 1.1KV AL IS:7098',
    normalizedDesc: 'CABLE, POWER, 3.5 CORE, 185 SQ MM, XLPE INSULATED, 1.1 KV, ALUMINIUM CONDUCTOR, IS 7098',
    attributes: [
      { key: 'Noun',        raw: 'PWR CBL',    normalized: 'CABLE, POWER' },
      { key: 'Cores',       raw: '3.5C',        normalized: '3.5 CORE' },
      { key: 'Cross-sec',   raw: '185MM2',      normalized: '185 SQ MM' },
      { key: 'Insulation',  raw: 'XLPE',        normalized: 'CROSS-LINKED POLYETHYLENE' },
      { key: 'Voltage',     raw: '1.1KV',       normalized: '1.1 KV (1100 V)' },
      { key: 'Conductor',   raw: 'AL',          normalized: 'ALUMINIUM' },
      { key: 'Standard',    raw: 'IS:7098',     normalized: 'IS 7098 (PART 2)' },
      { key: 'UOM',         raw: 'MTR',         normalized: 'M' },
    ],
    abbreviationsExpanded: [
      { from: 'PWR CBL', to: 'POWER CABLE' },
      { from: '3.5C', to: '3.5 CORE' },
      { from: 'MM2', to: 'SQ MM (mm²)' },
      { from: 'XLPE', to: 'CROSS-LINKED POLYETHYLENE' },
      { from: 'AL', to: 'ALUMINIUM' },
    ],
    unspscCode: '26121600', unspscLabel: 'Power cables',
    standardRef: 'IS 7098', uom: 'M',
  },
  {
    id: 'N005', org: 'IOCL', rawCode: 'IOCL-BLT-1001',
    rawDesc: 'HEX BOLT FULL THD M20X100 GR8.8 SS304 IS:1364',
    normalizedDesc: 'BOLT, HEXAGONAL HEAD, FULL THREAD, M20 x 100MM, GRADE 8.8, SS 304, IS 1364',
    attributes: [
      { key: 'Noun',     raw: 'HEX BOLT',    normalized: 'BOLT, HEXAGONAL HEAD' },
      { key: 'Thread',   raw: 'FULL THD',    normalized: 'FULL THREAD' },
      { key: 'Size',     raw: 'M20X100',     normalized: 'M20 x 100 MM' },
      { key: 'Grade',    raw: 'GR8.8',       normalized: 'GRADE 8.8' },
      { key: 'Material', raw: 'SS304',       normalized: 'STAINLESS STEEL 304' },
      { key: 'Standard', raw: 'IS:1364',     normalized: 'IS 1364' },
      { key: 'UOM',      raw: 'NOS',         normalized: 'EA' },
    ],
    abbreviationsExpanded: [
      { from: 'HEX', to: 'HEXAGONAL' },
      { from: 'THD', to: 'THREAD' },
      { from: 'GR8.8', to: 'GRADE 8.8 (MEDIUM CARBON STEEL)' },
      { from: 'SS304', to: 'STAINLESS STEEL AISI 304' },
      { from: 'NOS', to: 'EA (EACH)' },
    ],
    unspscCode: '31161500', unspscLabel: 'Bolts',
    standardRef: 'IS 1364', uom: 'EA',
  },
]

// ─── CNMC Registry ─────────────────────────────────────────────────────────
export interface CnmcEntry {
  cnmcCode: string
  standardDesc: string
  family: string
  unspscCode: string
  unspscLabel: string
  standardRef: string
  uom: string
  approvedAt: string
  approvedBy: string
  legacyMappings: { org: string; code: string; desc: string }[]
  crossCpeCount: number
  estSavingsLakh: number
}

export const CNMC_REGISTRY: CnmcEntry[] = [
  {
    cnmcCode: 'CNMC-BE-5E91', standardDesc: 'BEARING, BALL, DEEP GROOVE, 6205-2RS, BORE 25MM, GREASE SEALED, IS 6305',
    family: 'Bearings', unspscCode: '31171501', unspscLabel: 'Ball bearings',
    standardRef: 'IS 6305', uom: 'EA', approvedAt: '2026-08-15 09:32', approvedBy: 'Rajesh Kumar (IOCL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-BRG-1005', desc: 'BRG,BALL,SKF 6205-2RS,25MM ID' },
      { org: 'NTPC', code: 'NTPC-BRG-2005', desc: 'Ball Bearing 6205 2RS ISO 281' },
      { org: 'SAIL', code: 'SAIL-BRG-3005', desc: 'DEEP GROOVE BALL BEARING 6205' },
      { org: 'CIL',  code: 'CIL-BRG-4005',  desc: 'BALL BEARING 6205-2RS SKF' },
    ],
    crossCpeCount: 4, estSavingsLakh: 18.4,
  },
  {
    cnmcCode: 'CNMC-PT-9D1E', standardDesc: 'PIPE, CARBON STEEL, SEAMLESS, 100NB, SCHEDULE 40, IS 1239',
    family: 'Pipes & Tubes', unspscCode: '40141700', unspscLabel: 'Industrial pipe',
    standardRef: 'IS 1239', uom: 'M', approvedAt: '2026-08-15 10:05', approvedBy: 'Anita Sharma (SAIL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-PIP-1002', desc: 'CS PIPE SCH40 100NB IS:1239' },
      { org: 'SAIL', code: 'SAIL-PIP-2002', desc: 'IS:1239 PIPE CS 100NB SCH40 HVY' },
      { org: 'NTPC', code: 'NTPC-PIP-3002', desc: 'CARBON STEEL PIPE 100NB SCH40' },
    ],
    crossCpeCount: 3, estSavingsLakh: 32.1,
  },
  {
    cnmcCode: 'CNMC-FA-4A2B', standardDesc: 'BOLT, HEXAGONAL HEAD, FULL THREAD, M20x100, GRADE 8.8, SS 304, IS 1364',
    family: 'Fasteners', unspscCode: '31161500', unspscLabel: 'Bolts',
    standardRef: 'IS 1364', uom: 'EA', approvedAt: '2026-08-16 11:20', approvedBy: 'Rajesh Kumar (IOCL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-BLT-1001', desc: 'HEX BOLT FULL THD M20X100 GR8.8 SS304' },
      { org: 'NTPC', code: 'NTPC-BLT-2001', desc: 'Hexagonal Bolt M20x100 8.8 SS IS-1364' },
    ],
    crossCpeCount: 2, estSavingsLakh: 5.8,
  },
  {
    cnmcCode: 'CNMC-EL-2B8A', standardDesc: 'CABLE, POWER, 3.5 CORE, 185 SQ MM, XLPE, 1.1KV, AL CONDUCTOR, IS 7098',
    family: 'Electrical', unspscCode: '26121600', unspscLabel: 'Power cables',
    standardRef: 'IS 7098', uom: 'M', approvedAt: '2026-08-16 14:45', approvedBy: 'Suresh Nair (NTPC)',
    legacyMappings: [
      { org: 'NTPC', code: 'NTPC-CBL-1004', desc: 'XLPE Power Cable 3.5C x 185 Sqmm 1.1kV' },
      { org: 'SAIL', code: 'SAIL-CBL-2004', desc: 'Power Cable 3.5 Core 185sqmm XLPE' },
      { org: 'CIL',  code: 'CIL-CBL-4004',  desc: 'PWR CBL 3.5C X 185MM2 XLPE 1.1KV' },
    ],
    crossCpeCount: 3, estSavingsLakh: 22.7,
  },
  {
    cnmcCode: 'CNMC-VF-7C3F', standardDesc: 'VALVE, GATE, FULL BORE, 100NB, PN40, CARBON STEEL WCB, FLANGED RF',
    family: 'Valves & Fittings', unspscCode: '40141600', unspscLabel: 'Valves',
    standardRef: 'IS 5428', uom: 'EA', approvedAt: '2026-08-17 09:10', approvedBy: 'Priya Menon (CPCL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-VLV-1003', desc: 'Gate Valve DN150 PN16 Flanged SS304 Body' },
      { org: 'NTPC', code: 'NTPC-VLV-3003', desc: 'GATE VLV FULL BORE 100NB PN40 FLGD' },
      { org: 'CIL',  code: 'CIL-VLV-4003',  desc: 'GATE VALVE BODY CAST IRON 100NB' },
    ],
    crossCpeCount: 3, estSavingsLakh: 15.3,
  },
  {
    cnmcCode: 'CNMC-GK-1A4D', standardDesc: 'GASKET, SPIRAL WOUND, 100NB, PN40, SS 304 / GRAPHITE FILLER, ASME B16.20',
    family: 'Gaskets & Seals', unspscCode: '40151500', unspscLabel: 'Gaskets',
    standardRef: 'ASME B16.20', uom: 'EA', approvedAt: '2026-08-17 11:55', approvedBy: 'Rajesh Kumar (IOCL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-GSK-1006', desc: 'Spiral Wound Gasket 100NB PN40 SS304 ASME B16.20' },
      { org: 'SAIL', code: 'SAIL-GSK-2006', desc: 'SWG Gasket 4 Inch CL300 SS304 Graphite Filler' },
    ],
    crossCpeCount: 2, estSavingsLakh: 3.2,
  },
  {
    cnmcCode: 'CNMC-MT-3C6B', standardDesc: 'MOTOR, INDUCTION, 5.5 KW, 4 POLE, 415V, IE2, TEFC, IS 12615',
    family: 'Motors & Drives', unspscCode: '26101600', unspscLabel: 'Electric motors',
    standardRef: 'IS 12615', uom: 'EA', approvedAt: '2026-08-18 08:30', approvedBy: 'Suresh Nair (NTPC)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-MOT-1007', desc: 'MOTOR INDUCTION 5.5KW 4POLE' },
      { org: 'NTPC', code: 'NTPC-MOT-2007', desc: 'IE2 MOTOR 5.5KW 4POLE 415V' },
      { org: 'SAIL', code: 'SAIL-MOT-3007', desc: '5.5 KW IE3 MOTOR 4 POLE' },
      { org: 'CIL',  code: 'CIL-MOT-4007',  desc: 'INDUCTION MOTOR 5.5KW 415V' },
    ],
    crossCpeCount: 4, estSavingsLakh: 41.2,
  },
  {
    cnmcCode: 'CNMC-IN-8F2C', standardDesc: 'INSULATION, CALCIUM SILICATE, PIPE, 100NB, 50MM THICKNESS, IS 14989',
    family: 'Insulation', unspscCode: '30111700', unspscLabel: 'Thermal insulation',
    standardRef: 'IS 14989', uom: 'M', approvedAt: '2026-08-18 15:10', approvedBy: 'Anita Sharma (SAIL)',
    legacyMappings: [
      { org: 'IOCL', code: 'IOCL-INS-1008', desc: 'INSULATION CALCIUM SILICATE 50MM' },
      { org: 'NTPC', code: 'NTPC-INS-2008', desc: 'CALSIUM SILICATE INSULATION 50MM' },
      { org: 'SAIL', code: 'SAIL-INS-3008', desc: 'CALCIUM SILICATE PIPE INSULATION' },
      { org: 'CIL',  code: 'CIL-INS-4008',  desc: 'PIPE INSULATION CAL-SIL 50MM' },
    ],
    crossCpeCount: 4, estSavingsLakh: 8.9,
  },
]
