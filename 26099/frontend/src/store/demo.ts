import { create } from 'zustand'
import { SOURCES, MockSource } from '../demo/data'
import { normalizeRow, computeSimilarity, generateCnmcCode, ParsedCsvRow } from '@/utils/harmonizer'

export type LogLevel = 'info' | 'success' | 'warn' | 'error'

export interface LogEntry {
  ts: string
  msg: string
  level?: LogLevel
}

export interface SourceProgress extends MockSource {
  status: 'pending' | 'connecting' | 'connected' | 'importing' | 'error'
  rows: number
  duplicates: number
  progress: number
}

export interface MatchResult {
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
  isStandard?: string
}

export interface DemoSummary {
  totalRows: number
  uniqueMaterials: number
  duplicatesFound: number
  cnmcAssigned: number
  crossCpeMatches: number
  timeElapsed: string
  estSavingsCr: number
}

export type Phase = 'idle' | 'importing' | 'normalizing' | 'matching' | 'generating' | 'complete'

export type AuditAction = 'IMPORT' | 'NORMALIZE' | 'MATCH' | 'APPROVE' | 'REJECT' | 'BATCH_APPROVE' | 'BATCH_REJECT' | 'SYSTEM'

export interface AuditEntry {
  id: string
  ts: string
  action: AuditAction
  user: string
  org: string
  detail: string
  matchId?: string
  cnmcCode?: string
  materialCode?: string
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function timeStr(): string {
  return new Date().toLocaleTimeString('en-IN', { hour12: false })
}

function log(msg: string, level: LogLevel = 'info'): LogEntry {
  return { ts: timeStr(), msg, level }
}

const INITIAL_SOURCES: SourceProgress[] = SOURCES.map(s => ({
  ...s,
  status: 'pending',
  rows: 0,
  duplicates: 0,
  progress: 0,
}))

// Preloaded matches
function generateInitialMatches(): MatchResult[] {
  return [
    {
      id: 'M001',
      sourceCode: 'IOCL-BLT-1001',
      sourceDesc: 'Hex Bolt M20x100 Grade 8.8 SS304 IS:1364',
      sourceOrg: 'IOCL',
      targetCode: 'NTPC-BLT-2001',
      targetDesc: 'Hexagonal Bolt M20x100 8.8 SS IS-1364',
      targetOrg: 'NTPC',
      score: 0.98,
      lexicalScore: 0.96,
      semanticScore: 0.99,
      numericScore: 1.0,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-FA-4A2B',
      status: 'approved',
      family: 'Fasteners',
      isStandard: 'IS 1364',
    },
    {
      id: 'M002',
      sourceCode: 'IOCL-PIP-1002',
      sourceDesc: 'CS Pipe SCH40 100NB Seamless IS:1239',
      sourceOrg: 'IOCL',
      targetCode: 'SAIL-PIP-2002',
      targetDesc: 'Carbon Steel Pipe 100NB SCH40 IS 1239 Heavy',
      targetOrg: 'SAIL',
      score: 0.96,
      lexicalScore: 0.94,
      semanticScore: 0.98,
      numericScore: 0.96,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-PT-9D1E',
      status: 'approved',
      family: 'Pipes & Tubes',
      isStandard: 'IS 1239',
    },
    {
      id: 'M003',
      sourceCode: 'IOCL-VLV-1003',
      sourceDesc: 'Gate Valve DN150 PN16 Flanged SS304 Body',
      sourceOrg: 'IOCL',
      targetCode: 'CIL-VLV-2003',
      targetDesc: 'Gate Valve DN150 PN16 Flanged Cast Steel WCB',
      targetOrg: 'CIL',
      score: 0.82,
      lexicalScore: 0.88,
      semanticScore: 0.84,
      numericScore: 0.74,
      type: 'NEAR_DUPLICATE',
      confidence: 'MEDIUM',
      cnmcCode: 'CNMC-VF-7C3F',
      status: 'pending',
      family: 'Valves & Fittings',
      isStandard: 'IS 5428',
    },
    {
      id: 'M004',
      sourceCode: 'NTPC-CBL-1004',
      sourceDesc: 'XLPE Power Cable 3.5C x 185 Sqmm 1.1kV Al IS:1554',
      sourceOrg: 'NTPC',
      targetCode: 'SAIL-CBL-2004',
      targetDesc: 'Power Cable 3.5 Core 185sqmm XLPE 1.1kV IS:7098',
      targetOrg: 'SAIL',
      score: 0.94,
      lexicalScore: 0.91,
      semanticScore: 0.96,
      numericScore: 0.95,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-EL-2B8A',
      status: 'approved',
      family: 'Electrical',
      isStandard: 'IS 1554',
    },
    {
      id: 'M005',
      sourceCode: 'IOCL-BRG-1005',
      sourceDesc: 'Deep Groove Ball Bearing 6205-2RS C3 SKF',
      sourceOrg: 'IOCL',
      targetCode: 'NTPC-BRG-2005',
      targetDesc: 'Ball Bearing 6205 2RS ISO 281',
      targetOrg: 'NTPC',
      score: 0.95,
      lexicalScore: 0.92,
      semanticScore: 0.97,
      numericScore: 0.96,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-BE-5E91',
      status: 'approved',
      family: 'Bearings',
      isStandard: 'ISO 281',
    },
    {
      id: 'M006',
      sourceCode: 'IOCL-GSK-1006',
      sourceDesc: 'Spiral Wound Gasket 100NB PN40 SS304 ASME B16.20',
      sourceOrg: 'IOCL',
      targetCode: 'SAIL-GSK-2006',
      targetDesc: 'SWG Gasket 4 Inch CL300 SS304 Graphite Filler',
      targetOrg: 'SAIL',
      score: 0.91,
      lexicalScore: 0.86,
      semanticScore: 0.94,
      numericScore: 0.93,
      type: 'EQUIVALENT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-VF-1D4C',
      status: 'pending',
      family: 'Valves & Fittings',
      isStandard: 'ASME B16.20',
    },
    {
      id: 'M007',
      sourceCode: 'NTPC-PMP-1007',
      sourceDesc: 'Centrifugal Pump End Suction 10HP SS316 IS:15224',
      sourceOrg: 'NTPC',
      targetCode: 'IOCL-PMP-2007',
      targetDesc: 'Centrifugal Pump 10 HP SS316 Body 100NB',
      targetOrg: 'IOCL',
      score: 0.94,
      lexicalScore: 0.92,
      semanticScore: 0.95,
      numericScore: 0.95,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-PC-8F2A',
      status: 'approved',
      family: 'Pumps & Compressors',
      isStandard: 'IS 15224',
    },
    {
      id: 'M008',
      sourceCode: 'SAIL-ELC-1008',
      sourceDesc: 'Welding Electrode E6013 3.15mm IS:814 5kg pack',
      sourceOrg: 'SAIL',
      targetCode: 'CIL-ELC-2008',
      targetDesc: 'MS Welding Rod 3.15mm AWS E6013 Heavy Coated',
      targetOrg: 'CIL',
      score: 0.93,
      lexicalScore: 0.89,
      semanticScore: 0.95,
      numericScore: 0.95,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-WE-3B7D',
      status: 'pending',
      family: 'Welding',
      isStandard: 'IS 814',
    },
    {
      id: 'M009',
      sourceCode: 'IOCL-HLM-1009',
      sourceDesc: 'Safety Helmet HDPE Industrial White ISI IS:2925',
      sourceOrg: 'IOCL',
      targetCode: 'NTPC-HLM-2009',
      targetDesc: 'Safety Helmet Yellow ISI Marked IS:2925 Ratchet',
      targetOrg: 'NTPC',
      score: 0.81,
      lexicalScore: 0.85,
      semanticScore: 0.88,
      numericScore: 0.70,
      type: 'EQUIVALENT',
      confidence: 'MEDIUM',
      cnmcCode: 'CNMC-SP-6A1B',
      status: 'pending',
      family: 'Safety & PPE',
      isStandard: 'IS 2925',
    },
    {
      id: 'M010',
      sourceCode: 'SAIL-ANG-1010',
      sourceDesc: 'MS Angle Equal 50x50x6mm 6M Length IS:2062 E250',
      sourceOrg: 'SAIL',
      targetCode: 'IOCL-ANG-2010',
      targetDesc: 'Angle Equal 50X50X6MM Mild Steel IS:2062',
      targetOrg: 'IOCL',
      score: 0.97,
      lexicalScore: 0.96,
      semanticScore: 0.98,
      numericScore: 0.97,
      type: 'EXACT',
      confidence: 'HIGH',
      cnmcCode: 'CNMC-SS-9C4E',
      status: 'approved',
      family: 'Structural Steel',
      isStandard: 'IS 2062',
    },
  ]
}

interface DemoEngineStore {
  isRunning: boolean
  phase: Phase
  sources: SourceProgress[]
  matches: MatchResult[]
  summary: DemoSummary | null
  logs: LogEntry[]
  isLoggedIn: boolean
  auditLog: AuditEntry[]

  // Actions
  login: () => void
  logout: () => void
  runDemo: () => Promise<void>
  resetDemo: () => void
  approveMatch: (id: string) => void
  rejectMatch: (id: string) => void
  batchApprove: (ids: string[]) => void
  batchReject: (ids: string[]) => void
  processCustomCsv: (rows: ParsedCsvRow[], orgName: string) => Promise<void>
}

const initialSummary: DemoSummary = {
  totalRows: 326000,
  uniqueMaterials: 274200,
  duplicatesFound: 51800,
  cnmcAssigned: 1840,
  crossCpeMatches: 2450,
  timeElapsed: '0.84s',
  estSavingsCr: 48.6,
}

let auditSeq = 100
function makeAuditId() { return `AUD-${++auditSeq}` }
function auditTs() { return new Date().toLocaleString('en-IN', { hour12: false, day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) }

const INITIAL_AUDIT: AuditEntry[] = [
  { id: 'AUD-001', ts: '31 Aug 2026, 08:00:01', action: 'SYSTEM', user: 'System', org: 'NUMMF', detail: 'NUMMF Engine v1.0.0 started. 4 CPSE adapters registered.' },
  { id: 'AUD-002', ts: '31 Aug 2026, 08:00:45', action: 'IMPORT', user: 'System', org: 'IOCL', detail: 'Material master imported: 1,25,000 records from IOCL SAP ECC 6.0.', materialCode: 'BATCH-IOCL-001' },
  { id: 'AUD-003', ts: '31 Aug 2026, 08:01:12', action: 'IMPORT', user: 'System', org: 'NTPC', detail: 'Material master imported: 89,000 records from NTPC SAP S/4HANA.', materialCode: 'BATCH-NTPC-001' },
  { id: 'AUD-004', ts: '31 Aug 2026, 08:01:38', action: 'IMPORT', user: 'System', org: 'SAIL', detail: 'Material master imported: 67,000 records from SAIL Maximo 7.6.', materialCode: 'BATCH-SAIL-001' },
  { id: 'AUD-005', ts: '31 Aug 2026, 08:02:05', action: 'IMPORT', user: 'System', org: 'CIL', detail: 'Material master imported: 45,000 records from CIL Oracle EBS 12.2.', materialCode: 'BATCH-CIL-001' },
  { id: 'AUD-006', ts: '31 Aug 2026, 08:03:10', action: 'NORMALIZE', user: 'System', org: 'NUMMF', detail: 'Normalization complete: 3,26,000 records processed. 51,800 duplicates flagged. 14,200 abbreviations expanded.' },
  { id: 'AUD-007', ts: '31 Aug 2026, 08:04:22', action: 'MATCH', user: 'System', org: 'NUMMF', detail: 'AI Matching complete: 2,450 cross-CPSE match pairs found. Bi-Encoder + Cross-Encoder pipeline used.' },
  { id: 'AUD-008', ts: '31 Aug 2026, 09:15:33', action: 'APPROVE', user: 'Rajesh Kumar', org: 'IOCL', detail: 'Match M001 approved: IOCL-BLT-1001 ↔ NTPC-BLT-2001 → CNMC-FA-4A2B', matchId: 'M001', cnmcCode: 'CNMC-FA-4A2B', materialCode: 'IOCL-BLT-1001' },
  { id: 'AUD-009', ts: '31 Aug 2026, 09:17:44', action: 'APPROVE', user: 'Anita Sharma', org: 'SAIL', detail: 'Match M002 approved: IOCL-PIP-1002 ↔ SAIL-PIP-2002 → CNMC-PT-9D1E', matchId: 'M002', cnmcCode: 'CNMC-PT-9D1E', materialCode: 'IOCL-PIP-1002' },
  { id: 'AUD-010', ts: '31 Aug 2026, 09:32:11', action: 'APPROVE', user: 'Rajesh Kumar', org: 'IOCL', detail: 'Match M005 approved: IOCL-BRG-1005 ↔ NTPC-BRG-2005 → CNMC-BE-5E91', matchId: 'M005', cnmcCode: 'CNMC-BE-5E91', materialCode: 'IOCL-BRG-1005' },
]

export const useDemoEngine = create<DemoEngineStore>((set, get) => ({
  isRunning: false,
  phase: 'idle',
  sources: INITIAL_SOURCES.map(s => ({
    ...s,
    status: 'connected',
    rows: s.rowCount,
    duplicates: Math.round(s.rowCount * s.dupRate),
    progress: 100,
  })),
  matches: generateInitialMatches(),
  summary: initialSummary,
  logs: [
    log('SYS: NUMMF Engine initialized. 4 CPSE adapters online.', 'info'),
    log('CONN: Connected to IOCL (SAP ECC), NTPC (SAP S/4HANA), SAIL (Maximo), CIL (Oracle EBS)', 'success'),
    log('AI: Sentence-BERT Bi-Encoder & Cross-Encoder pipelines calibrated.', 'info'),
    log('READY: System ready for harmonized material master search and clustering.', 'success'),
  ],
  auditLog: INITIAL_AUDIT,
  isLoggedIn: true,

  login: () => set({ isLoggedIn: true }),
  logout: () => set({ isLoggedIn: false }),

  resetDemo: () => {
    set({
      isRunning: false,
      phase: 'idle',
      sources: INITIAL_SOURCES.map(s => ({
        ...s,
        status: 'connected',
        rows: s.rowCount,
        duplicates: Math.round(s.rowCount * s.dupRate),
        progress: 100,
      })),
      matches: generateInitialMatches(),
      summary: initialSummary,
      logs: [
        log('SYS: Demo state reset. Ready for new ingestion cycle.', 'info'),
      ],
    })
  },

  approveMatch: (id: string) => {
    const m = get().matches.find(x => x.id === id)
    const entry: AuditEntry = {
      id: makeAuditId(), ts: auditTs(), action: 'APPROVE',
      user: 'Govt. Officer', org: 'NUMMF',
      detail: m ? `Match ${id} approved: ${m.sourceCode} ↔ ${m.targetCode} → ${m.cnmcCode}` : `Match ${id} approved.`,
      matchId: id, cnmcCode: m?.cnmcCode, materialCode: m?.sourceCode,
    }
    set(state => ({
      matches: state.matches.map(x => x.id === id ? { ...x, status: 'approved' } : x),
      logs: [log(`REVIEW: Match ${id} approved by officer. CNMC validated.`, 'success'), ...state.logs].slice(0, 100),
      auditLog: [entry, ...state.auditLog],
    }))
  },

  rejectMatch: (id: string) => {
    const m = get().matches.find(x => x.id === id)
    const entry: AuditEntry = {
      id: makeAuditId(), ts: auditTs(), action: 'REJECT',
      user: 'Govt. Officer', org: 'NUMMF',
      detail: m ? `Match ${id} rejected: ${m.sourceCode} ↔ ${m.targetCode} marked as distinct items.` : `Match ${id} rejected.`,
      matchId: id, materialCode: m?.sourceCode,
    }
    set(state => ({
      matches: state.matches.map(x => x.id === id ? { ...x, status: 'rejected' } : x),
      logs: [log(`REVIEW: Match ${id} marked as distinct item.`, 'warn'), ...state.logs].slice(0, 100),
      auditLog: [entry, ...state.auditLog],
    }))
  },

  batchApprove: (ids: string[]) => {
    const idSet = new Set(ids)
    const entry: AuditEntry = {
      id: makeAuditId(), ts: auditTs(), action: 'BATCH_APPROVE',
      user: 'Govt. Officer', org: 'NUMMF',
      detail: `Batch approved ${ids.length} material match pairs to CNMC master catalogue.`,
    }
    set(state => ({
      matches: state.matches.map(m => idSet.has(m.id) ? { ...m, status: 'approved' } : m),
      logs: [log(`REVIEW: Batch approved ${ids.length} material pairs to CNMC master catalogue.`, 'success'), ...state.logs].slice(0, 100),
      auditLog: [entry, ...state.auditLog],
    }))
  },

  batchReject: (ids: string[]) => {
    const idSet = new Set(ids)
    const entry: AuditEntry = {
      id: makeAuditId(), ts: auditTs(), action: 'BATCH_REJECT',
      user: 'Govt. Officer', org: 'NUMMF',
      detail: `Batch rejected ${ids.length} material match proposals.`,
    }
    set(state => ({
      matches: state.matches.map(m => idSet.has(m.id) ? { ...m, status: 'rejected' } : m),
      logs: [log(`REVIEW: Batch rejected ${ids.length} proposals.`, 'warn'), ...state.logs].slice(0, 100),
      auditLog: [entry, ...state.auditLog],
    }))
  },

  processCustomCsv: async (rows: ParsedCsvRow[], orgName: string) => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    
    set({
      isRunning: true,
      phase: 'importing',
      logs: [
        log(`CSV-INGEST: Received ${rows.length} records from uploaded file for ${orgName}.`, 'info'),
        ...get().logs
      ].slice(0, 100),
    })

    await sleep(400)

    // Phase 1: Ingest
    set(state => ({
      phase: 'normalizing',
      logs: [
        log(`NORMALIZE: Processing ${rows.length} rows through spaCy EntityRuler & PSU abbreviation dictionary...`, 'info'),
        ...state.logs
      ].slice(0, 100),
    }))

    await sleep(600)

    // Normalize rows
    const normalizedList = rows.map((r, i) => normalizeRow(r, i))

    set(state => ({
      phase: 'matching',
      logs: [
        log(`AI-MATCH: Running pairwise Bi-Encoder embeddings & fuzzy matching on uploaded dataset...`, 'info'),
        ...state.logs
      ].slice(0, 100),
    }))

    await sleep(700)

    // Phase 2: Compute AI Matches
    const newMatches: MatchResult[] = []
    const existingMatches = get().matches

    for (let i = 0; i < normalizedList.length; i++) {
      const item = normalizedList[i]
      // Compare against preceding item or sample targets
      const targetItem = normalizedList[(i + 1) % normalizedList.length]
      const sim = computeSimilarity(item.rawDesc, targetItem.rawDesc)

      const type = sim.total >= 0.92 ? 'EXACT' : sim.total >= 0.82 ? 'NEAR_DUPLICATE' : sim.total >= 0.70 ? 'EQUIVALENT' : 'PARTIAL'
      const confidence = sim.total >= 0.85 ? 'HIGH' : sim.total >= 0.70 ? 'MEDIUM' : 'LOW'
      const cnmcCode = generateCnmcCode(item.unspscLabel, item.rawDesc)

      newMatches.push({
        id: `CSV-M${String(i + 1).padStart(3, '0')}`,
        sourceCode: item.rawCode,
        sourceDesc: item.rawDesc,
        sourceOrg: orgName,
        targetCode: targetItem.rawCode,
        targetDesc: targetItem.rawDesc,
        targetOrg: `${orgName}-NODE2`,
        score: sim.total,
        lexicalScore: sim.lexical,
        semanticScore: sim.semantic,
        numericScore: sim.numeric,
        type,
        confidence,
        cnmcCode,
        status: 'pending',
        family: item.unspscLabel,
        isStandard: item.standardRef,
      })
    }

    set(state => ({
      phase: 'generating',
      logs: [
        log(`CNMC-GEN: Minted ${newMatches.length} CNMC Codes. Updating Master Catalogue...`, 'info'),
        ...state.logs
      ].slice(0, 100),
    }))

    await sleep(500)

    const updatedMatches = [...newMatches, ...existingMatches]
    const dupCount = newMatches.filter(m => m.type === 'EXACT' || m.type === 'NEAR_DUPLICATE').length

    const auditEntry: AuditEntry = {
      id: makeAuditId(),
      ts: auditTs(),
      action: 'IMPORT',
      user: 'CPSE Officer',
      org: orgName,
      detail: `CSV Upload: Imported & harmonized ${rows.length} custom records. ${dupCount} duplicates flagged. ${newMatches.length} CNMC candidates generated.`,
      materialCode: `CSV-BATCH-${Date.now().toString(36).toUpperCase()}`
    }

    const currentSummary = get().summary
    const updatedSummary: DemoSummary = {
      totalRows: (currentSummary?.totalRows || 0) + rows.length,
      uniqueMaterials: (currentSummary?.uniqueMaterials || 0) + (rows.length - dupCount),
      duplicatesFound: (currentSummary?.duplicatesFound || 0) + dupCount,
      cnmcAssigned: (currentSummary?.cnmcAssigned || 0) + newMatches.length,
      crossCpeMatches: (currentSummary?.crossCpeMatches || 0) + newMatches.length,
      timeElapsed: '1.42s',
      estSavingsCr: Math.round(((currentSummary?.estSavingsCr || 48.6) + (rows.length * 0.08)) * 10) / 10,
    }

    set(state => ({
      isRunning: false,
      phase: 'complete',
      matches: updatedMatches,
      summary: updatedSummary,
      auditLog: [auditEntry, ...state.auditLog],
      logs: [
        log(`SUCCESS: Custom CSV successfully harmonized! ${rows.length} rows processed in 1.42s.`, 'success'),
        ...state.logs
      ].slice(0, 100),
    }))
  },

  runDemo: async () => {
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
    
    // Start Ingest
    set({
      isRunning: true,
      phase: 'importing',
      sources: INITIAL_SOURCES.map(s => ({ ...s, status: 'connecting', rows: 0, duplicates: 0, progress: 0 })),
      matches: [],
      summary: null,
      logs: [log('SYS: Starting automated material harmonization pipeline...', 'info')],
    })

    // Step 1: Connect to CPSEs
    for (const src of SOURCES) {
      await sleep(350)
      set(state => ({
        sources: state.sources.map(s => s.id === src.id ? { ...s, status: 'importing', progress: 10 } : s),
        logs: [log(`INGEST: Connected to ${src.short} (${src.system}) adapter. Extracting material master...`, 'info'), ...state.logs].slice(0, 100),
      }))
    }

    // Step 2: Stream ingestion
    for (let p = 25; p <= 100; p += 25) {
      await sleep(300)
      set(state => ({
        sources: state.sources.map(s => ({
          ...s,
          progress: p,
          rows: Math.round((s.rowCount * p) / 100),
          duplicates: Math.round((s.rowCount * s.dupRate * p) / 100),
          status: p === 100 ? 'connected' : 'importing',
        })),
        logs: [log(`INGEST: Bulk import progress ${p}% across all 4 CPSE endpoints.`, 'info'), ...state.logs].slice(0, 100),
      }))
    }

    // Step 3: Normalization
    set(state => ({
      phase: 'normalizing',
      logs: [log('NORMALIZE: Extracting technical attributes, IS/ASTM standards, dimensions, materials...', 'info'), ...state.logs].slice(0, 100),
    }))
    await sleep(700)

    // Step 4: AI Matching
    set(state => ({
      phase: 'matching',
      logs: [log('AI-MATCH: Running Bi-Encoder vector embedding & Cross-Encoder cross-CPSE scoring...', 'info'), ...state.logs].slice(0, 100),
    }))
    await sleep(800)

    // Step 5: CNMC Code Generation
    set(state => ({
      phase: 'generating',
      logs: [log('CNMC-GEN: Computing deterministic semantic hashes for unified CNMC catalog...', 'info'), ...state.logs].slice(0, 100),
    }))
    await sleep(700)

    // Complete
    const finalMatches = generateInitialMatches()
    const totalRows = SOURCES.reduce((sum, s) => sum + s.rowCount, 0)
    const totalDups = SOURCES.reduce((sum, s) => sum + Math.round(s.rowCount * s.dupRate), 0)

    set({
      isRunning: false,
      phase: 'complete',
      sources: SOURCES.map(s => ({
        ...s,
        status: 'connected',
        rows: s.rowCount,
        duplicates: Math.round(s.rowCount * s.dupRate),
        progress: 100,
      })),
      matches: finalMatches,
      summary: {
        totalRows,
        uniqueMaterials: totalRows - totalDups,
        duplicatesFound: totalDups,
        cnmcAssigned: 1840,
        crossCpeMatches: 2450,
        timeElapsed: '3.12s',
        estSavingsCr: 48.6,
      },
      logs: [
        log('SUCCESS: Harmonization complete! 1,840 unified CNMC codes generated.', 'success'),
        log('METRIC: Resolved 51.8K duplicate SKUs. Estimated ₹48.6 Cr procurement savings.', 'success'),
        ...get().logs,
      ].slice(0, 100),
    })
  },
}))
