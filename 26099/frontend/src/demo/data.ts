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
