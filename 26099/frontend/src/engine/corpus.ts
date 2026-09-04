/**
 * The corpus.
 *
 * Four CPSEs hold about 24 lakh material records between them. Nobody can inspect
 * 24 lakh rows in a demo, so this file holds a readable slice of that corpus: the
 * items are real MRO lines, and each organisation writes the same item the way its
 * own material master actually writes it. Everything the console shows about the
 * full corpus is extrapolated from measurements taken on this slice, and the pages
 * say which is which.
 *
 * Descriptions are not typed out four times. Each item is defined once, in two
 * registers - the abbreviated form a storekeeper types and the spelled out form a
 * planner types - and each organisation renders one of them in its own punctuation
 * with its own unit of measure. That is exactly the divergence the normalizer has
 * to undo, and generating it means the divergence is systematic rather than a set
 * of hand-written coincidences.
 */

import type { Cpse, MaterialFamily, MaterialRecord } from './types'

export const CPSES: Cpse[] = [
  {
    code: 'IOCL',
    name: 'Indian Oil Corporation',
    erp: 'SAP ECC 6.0',
    connector: 'RFC BAPI_MATERIAL_GETLIST',
    totalRecords: 742_000,
    extract: '/masters/iocl-sap-ecc.csv',
  },
  {
    code: 'NTPC',
    name: 'NTPC Limited',
    erp: 'SAP S/4HANA',
    connector: 'OData API_PRODUCT_SRV',
    totalRecords: 688_000,
    extract: '/masters/ntpc-s4hana.csv',
  },
  {
    code: 'SAIL',
    name: 'Steel Authority of India',
    erp: 'Oracle EBS 12.2',
    connector: 'JDBC mtl_system_items_b',
    totalRecords: 604_000,
    extract: '/masters/sail-oracle-ebs.csv',
  },
  {
    code: 'CIL',
    name: 'Coal India Limited',
    erp: 'In-house material master',
    connector: 'SFTP nightly extract',
    totalRecords: 376_000,
    extract: '/masters/cil-inhouse.csv',
  },
]

export const TOTAL_RECORDS = CPSES.reduce((sum, cpse) => sum + cpse.totalRecords, 0)

/** Which register each organisation writes in, and how it punctuates. */
const HOUSE_STYLE: Record<
  Cpse['code'],
  { register: 'short' | 'long'; join: string }
> = {
  IOCL: { register: 'short', join: ' ' },
  CIL: { register: 'short', join: '/' },
  NTPC: { register: 'long', join: ',' },
  SAIL: { register: 'long', join: ' ' },
}

/** The same unit, spelled four different ways. Collapsing these is half the job. */
const UOM_STYLE: Record<string, Record<Cpse['code'], string>> = {
  EACH: { IOCL: 'NOS', NTPC: 'EA', SAIL: 'PCS', CIL: 'NO' },
  METRE: { IOCL: 'MTR', NTPC: 'M', SAIL: 'RMT', CIL: 'MTS' },
  KILOGRAM: { IOCL: 'KG', NTPC: 'KGS', SAIL: 'KG', CIL: 'KGS' },
  LITRE: { IOCL: 'LTR', NTPC: 'L', SAIL: 'LIT', CIL: 'LTR' },
}

/**
 * Months of cover each organisation carries, and how much its stores drift from
 * that target.
 *
 * These differ on purpose. A refinery that cannot afford an unplanned shutdown
 * carries thin, fast-turning stock; an integrated steel plant with its own
 * workshops carries deep stock of the same parts. That spread is the whole point
 * of showing inventory here: it is why one plant is raising a purchase order for
 * a bearing that another plant already has three years of sitting on a shelf.
 */
const COVER_MONTHS: Record<Cpse['code'], number> = {
  IOCL: 2.4,
  NTPC: 3.6,
  SAIL: 7.8,
  CIL: 5.1,
}

/**
 * Deterministic per-row drift, so holdings are not a clean multiple of annual
 * demand. Same input, same output, on any machine.
 */
function coverDrift(seed: number): number {
  const wave = Math.sin(seed * 12.9898) * 43_758.5453
  return 0.62 + (wave - Math.floor(wave)) * 0.86
}

/** Units in store for one row, given its annual offtake and who holds it. */
function stockFor(cpse: Cpse['code'], annualQty: number, seed: number): number {
  const months = COVER_MONTHS[cpse] * coverDrift(seed)
  return Math.max(1, Math.round((annualQty * months) / 12))
}

/** Local code formats, one per source system. */
const LOCAL_CODE: Record<Cpse['code'], (n: number) => string> = {
  IOCL: n => `4${String(1_002_400 + n * 37).padStart(7, '0')}`,
  NTPC: n => `10${String(24_100_500 + n * 61).padStart(8, '0')}`,
  SAIL: n => `SL-MRO-${String(40_500 + n * 23).padStart(5, '0')}`,
  CIL: n => `CIL/MM/${String(11_200 + n * 17).padStart(5, '0')}`,
}

interface Stock {
  cpse: Cpse['code']
  /** Annual quantity purchased by this organisation. */
  qty: number
  /**
   * A token only this organisation appends: a maker, a store note, a project tag.
   * Real masters are full of these, and they are what stops a naive string match
   * from working.
   */
  noise?: string
  /**
   * This organisation's own vocabulary for the item, used instead of the register
   * form. Not a spelling variant and not an abbreviation: a different word for the
   * same thing, of the kind that appears when two industries name a part after two
   * different traditions. A dictionary cannot expand its way out of these, and the
   * token blocker never proposes them as a candidate, because the two descriptions
   * share no significant word. They are the reason there is a model in this system.
   */
  vocabulary?: string
}

interface Item {
  family: MaterialFamily
  /** As a storekeeper abbreviates it. */
  short: string
  /** As a planner spells it out. */
  long: string
  /** Canonical unit before any house spelling is applied. */
  uom: keyof typeof UOM_STYLE
  /** Rupees per unit. */
  price: number
  at: Stock[]
}

/**
 * The item table.
 *
 * Adjacent part numbers are left in deliberately. A 6205 bearing and a 6206
 * bearing read almost identically and a demo that quietly removes them is a demo
 * that has not been tested. They are here so the matcher has to reject something.
 */
const ITEMS: Item[] = [
  // Bearings
  {
    family: 'bearings',
    short: 'BRG BALL DG 6205 2RS',
    long: 'BALL BEARING DEEP GROOVE 6205 2RS',
    uom: 'EACH',
    price: 420,
    at: [
      { cpse: 'IOCL', qty: 1840, noise: 'SKF' },
      { cpse: 'NTPC', qty: 2260 },
      { cpse: 'SAIL', qty: 3110, noise: 'FAG' },
      { cpse: 'CIL', qty: 1470 },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG BALL DG 6206 2RS',
    long: 'BALL BEARING DEEP GROOVE 6206 2RS',
    uom: 'EACH',
    price: 510,
    at: [
      { cpse: 'IOCL', qty: 960 },
      { cpse: 'SAIL', qty: 1240, noise: 'FAG' },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG BALL DG 6308 ZZ',
    long: 'BALL BEARING DEEP GROOVE 6308 ZZ',
    uom: 'EACH',
    price: 980,
    at: [
      { cpse: 'NTPC', qty: 640 },
      { cpse: 'SAIL', qty: 880 },
      { cpse: 'CIL', qty: 410, noise: 'NBC' },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG SPHERICAL ROLLER 22220 CC W33',
    long: 'SPHERICAL ROLLER BEARING 22220 CC W33',
    uom: 'EACH',
    price: 12_400,
    at: [
      { cpse: 'IOCL', qty: 180 },
      { cpse: 'NTPC', qty: 240, noise: 'SKF' },
      { cpse: 'SAIL', qty: 520 },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG TAPER ROLLER 30206',
    long: 'TAPER ROLLER BEARING 30206',
    uom: 'EACH',
    price: 690,
    at: [
      { cpse: 'IOCL', qty: 720 },
      { cpse: 'CIL', qty: 560, noise: 'TIMKEN' },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG PLUMMER BLOCK SN 517',
    long: 'PLUMMER BLOCK BEARING SN 517',
    uom: 'EACH',
    price: 4300,
    at: [
      { cpse: 'NTPC', qty: 210 },
      { cpse: 'SAIL', qty: 340 },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG THRUST BALL 51110',
    long: 'THRUST BALL BEARING 51110',
    uom: 'EACH',
    price: 1150,
    at: [
      { cpse: 'IOCL', qty: 290 },
      { cpse: 'NTPC', qty: 175 },
      { cpse: 'CIL', qty: 320 },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG CYLINDRICAL ROLLER NU 220',
    long: 'CYLINDRICAL ROLLER BEARING NU 220',
    uom: 'EACH',
    price: 8600,
    at: [
      { cpse: 'SAIL', qty: 260 },
      { cpse: 'CIL', qty: 140 },
    ],
  },

  // Pipes and tubes
  {
    family: 'pipes_tubes',
    short: 'PIP SMLS CS 100NB SCH40 IS 1239',
    long: 'PIPE SEAMLESS CARBON STEEL 100NB SCH40 IS 1239',
    uom: 'METRE',
    price: 1250,
    at: [
      { cpse: 'IOCL', qty: 14_200 },
      { cpse: 'NTPC', qty: 9800 },
      { cpse: 'SAIL', qty: 22_400 },
      { cpse: 'CIL', qty: 6100 },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'PIP SMLS CS 150NB SCH40 IS 1239',
    long: 'PIPE SEAMLESS CARBON STEEL 150NB SCH40 IS 1239',
    uom: 'METRE',
    price: 2180,
    at: [
      { cpse: 'IOCL', qty: 8400 },
      { cpse: 'SAIL', qty: 12_600 },
      { cpse: 'CIL', qty: 3200 },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'PIP SMLS CS 200NB SCH80 IS 1239',
    long: 'PIPE SEAMLESS CARBON STEEL 200NB SCH80 IS 1239',
    uom: 'METRE',
    price: 4650,
    at: [
      { cpse: 'IOCL', qty: 3100 },
      { cpse: 'NTPC', qty: 2400 },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'PIP ERW GI 50NB IS 1239',
    long: 'PIPE ERW GALVANISED IRON 50NB IS 1239',
    uom: 'METRE',
    price: 480,
    at: [
      { cpse: 'NTPC', qty: 18_700 },
      { cpse: 'SAIL', qty: 15_300 },
      { cpse: 'CIL', qty: 11_900, noise: 'JINDAL' },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'TUBE SMLS SS304 25MM OD',
    long: 'TUBE SEAMLESS SS304 25MM OD',
    uom: 'METRE',
    price: 890,
    at: [
      { cpse: 'IOCL', qty: 4200 },
      { cpse: 'NTPC', qty: 3600 },
      { cpse: 'SAIL', qty: 2900 },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'PIP HDPE 63MM PN10 IS 4984',
    long: 'PIPE HDPE 63MM PN10 IS 4984',
    uom: 'METRE',
    price: 210,
    at: [
      { cpse: 'NTPC', qty: 26_000 },
      { cpse: 'CIL', qty: 31_400 },
    ],
  },
  {
    family: 'pipes_tubes',
    short: 'TUBE CU 12MM OD',
    long: 'TUBE COPPER 12MM OD',
    uom: 'METRE',
    price: 640,
    at: [
      { cpse: 'IOCL', qty: 1800 },
      { cpse: 'SAIL', qty: 2200 },
    ],
  },

  // Valves and fittings
  {
    family: 'valves_fittings',
    short: 'VLV GATE WCB 100NB CL150 FLGD IS 14846',
    long: 'VALVE GATE WCB 100NB CL150 FLANGED IS 14846',
    uom: 'EACH',
    price: 18_400,
    at: [
      { cpse: 'IOCL', qty: 620 },
      { cpse: 'NTPC', qty: 480 },
      { cpse: 'SAIL', qty: 910, noise: 'KIRLOSKAR' },
      { cpse: 'CIL', qty: 260 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'VLV GLOBE WCB 80NB CL150 FLGD IS 14846',
    long: 'VALVE GLOBE WCB 80NB CL150 FLANGED IS 14846',
    uom: 'EACH',
    price: 14_200,
    at: [
      { cpse: 'IOCL', qty: 340 },
      { cpse: 'SAIL', qty: 520 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'VLV BALL SS316 50NB CL300 THD',
    long: 'VALVE BALL SS316 50NB CL300 THREADED',
    uom: 'EACH',
    price: 9600,
    at: [
      { cpse: 'IOCL', qty: 880 },
      { cpse: 'NTPC', qty: 640 },
      { cpse: 'CIL', qty: 310 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'VLV CHECK WCB 150NB CL150 FLGD',
    long: 'VALVE CHECK WCB 150NB CL150 FLANGED',
    uom: 'EACH',
    price: 21_800,
    at: [
      { cpse: 'NTPC', qty: 260 },
      { cpse: 'SAIL', qty: 410 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'VLV BUTTERFLY CI 200NB PN16',
    long: 'VALVE BUTTERFLY CAST IRON 200NB PN16',
    uom: 'EACH',
    price: 12_900,
    at: [
      { cpse: 'NTPC', qty: 380 },
      { cpse: 'SAIL', qty: 290 },
      { cpse: 'CIL', qty: 210 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'VLV SAFETY RELIEF SS316 25NB CL300',
    long: 'VALVE SAFETY RELIEF SS316 25NB CL300',
    uom: 'EACH',
    price: 34_500,
    at: [
      { cpse: 'IOCL', qty: 190 },
      { cpse: 'NTPC', qty: 120 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'ELBOW SMLS CS 90 100NB SCH40',
    long: 'ELBOW SEAMLESS CARBON STEEL 90 100NB SCH40',
    uom: 'EACH',
    price: 1420,
    at: [
      { cpse: 'IOCL', qty: 2400 },
      { cpse: 'SAIL', qty: 3100 },
      { cpse: 'CIL', qty: 980 },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'FLANGE CS 100NB CL150 WNRF IS 6392',
    long: 'FLANGE CARBON STEEL 100NB CL150 WNRF IS 6392',
    uom: 'EACH',
    price: 2260,
    at: [
      { cpse: 'IOCL', qty: 3600 },
      { cpse: 'NTPC', qty: 2800 },
      { cpse: 'SAIL', qty: 4400 },
    ],
  },

  // Fasteners
  {
    family: 'fasteners',
    short: 'BLT HEX MS M20X100 8.8 IS 1367',
    long: 'BOLT HEXAGONAL MILD STEEL M20X100 8.8 IS 1367',
    uom: 'EACH',
    price: 46,
    at: [
      { cpse: 'IOCL', qty: 84_000 },
      { cpse: 'NTPC', qty: 61_000 },
      { cpse: 'SAIL', qty: 128_000 },
      { cpse: 'CIL', qty: 39_000 },
    ],
  },
  {
    family: 'fasteners',
    short: 'BLT HEX MS M16X75 8.8 IS 1367',
    long: 'BOLT HEXAGONAL MILD STEEL M16X75 8.8 IS 1367',
    uom: 'EACH',
    price: 31,
    at: [
      { cpse: 'IOCL', qty: 96_000 },
      { cpse: 'SAIL', qty: 142_000 },
      { cpse: 'CIL', qty: 44_000 },
    ],
  },
  {
    family: 'fasteners',
    short: 'NUT HEX MS M20 8.8 IS 1363',
    long: 'NUT HEXAGONAL MILD STEEL M20 8.8 IS 1363',
    uom: 'EACH',
    price: 14,
    at: [
      { cpse: 'IOCL', qty: 88_000 },
      { cpse: 'NTPC', qty: 64_000 },
      { cpse: 'SAIL', qty: 131_000 },
    ],
  },
  {
    family: 'fasteners',
    short: 'WSHR SPRING MS M20 IS 3063',
    long: 'WASHER SPRING MILD STEEL M20 IS 3063',
    uom: 'EACH',
    price: 6,
    at: [
      { cpse: 'NTPC', qty: 72_000 },
      { cpse: 'SAIL', qty: 118_000 },
      { cpse: 'CIL', qty: 41_000 },
    ],
  },
  {
    family: 'fasteners',
    short: 'SCREW CSK MS M8X25',
    long: 'SCREW COUNTERSUNK MILD STEEL M8X25',
    uom: 'EACH',
    price: 9,
    at: [
      { cpse: 'IOCL', qty: 52_000 },
      { cpse: 'NTPC', qty: 38_000 },
    ],
  },
  {
    family: 'fasteners',
    short: 'BLT FOUNDATION MS M24X600',
    long: 'BOLT FOUNDATION MILD STEEL M24X600',
    uom: 'EACH',
    price: 385,
    at: [
      { cpse: 'NTPC', qty: 6400 },
      { cpse: 'SAIL', qty: 9200 },
      { cpse: 'CIL', qty: 3100 },
    ],
  },
  {
    family: 'fasteners',
    short: 'STUD BLT SS304 M16X90',
    long: 'STUD BOLT SS304 M16X90',
    uom: 'EACH',
    price: 128,
    at: [
      { cpse: 'IOCL', qty: 14_000 },
      { cpse: 'SAIL', qty: 21_000 },
    ],
  },

  // Electrical
  {
    family: 'electrical',
    short: 'CBL XLPE ARMD AL 3CX240 SQMM 1.1KV IS 7098',
    long: 'CABLE XLPE ARMOURED ALUMINIUM 3CX240 SQMM 1.1KV IS 7098',
    uom: 'METRE',
    price: 1180,
    at: [
      { cpse: 'IOCL', qty: 12_400 },
      { cpse: 'NTPC', qty: 34_600, noise: 'POLYCAB' },
      { cpse: 'SAIL', qty: 18_200 },
      { cpse: 'CIL', qty: 9800 },
    ],
  },
  {
    family: 'electrical',
    short: 'CBL XLPE ARMD AL 3CX120 SQMM 1.1KV IS 7098',
    long: 'CABLE XLPE ARMOURED ALUMINIUM 3CX120 SQMM 1.1KV IS 7098',
    uom: 'METRE',
    price: 640,
    at: [
      { cpse: 'NTPC', qty: 28_000 },
      { cpse: 'SAIL', qty: 16_500 },
      { cpse: 'CIL', qty: 12_100 },
    ],
  },
  {
    family: 'electrical',
    short: 'CBL XLPE UNARMD CU 4CX25 SQMM 1.1KV',
    long: 'CABLE XLPE UNARMOURED COPPER 4CX25 SQMM 1.1KV',
    uom: 'METRE',
    price: 920,
    at: [
      { cpse: 'IOCL', qty: 7600 },
      { cpse: 'NTPC', qty: 5400 },
    ],
  },
  {
    family: 'electrical',
    short: 'CBL CU FLEXIBLE 2CX2.5 SQMM 1.1KV',
    long: 'CABLE COPPER FLEXIBLE 2CX2.5 SQMM 1.1KV',
    uom: 'METRE',
    price: 86,
    at: [
      { cpse: 'IOCL', qty: 42_000 },
      { cpse: 'SAIL', qty: 38_000 },
      { cpse: 'CIL', qty: 24_000 },
    ],
  },
  {
    family: 'electrical',
    short: 'CONTACTOR 3P 32A 415V',
    long: 'CONTACTOR 3P 32A 415V',
    uom: 'EACH',
    price: 2840,
    at: [
      { cpse: 'IOCL', qty: 1200 },
      { cpse: 'NTPC', qty: 1650, noise: 'SIEMENS' },
      { cpse: 'SAIL', qty: 2100 },
    ],
  },
  {
    family: 'electrical',
    short: 'RELAY THERMAL OVERLOAD 18-25A',
    long: 'RELAY THERMAL OVERLOAD 18-25A',
    uom: 'EACH',
    price: 1960,
    at: [
      { cpse: 'NTPC', qty: 840 },
      { cpse: 'SAIL', qty: 1120 },
      { cpse: 'CIL', qty: 460 },
    ],
  },
  {
    family: 'electrical',
    short: 'SWITCH ISOLATOR 4P 63A 415V',
    long: 'SWITCH ISOLATOR 4P 63A 415V',
    uom: 'EACH',
    price: 4200,
    at: [
      { cpse: 'IOCL', qty: 520 },
      { cpse: 'CIL', qty: 380 },
    ],
  },

  // Gaskets and seals
  {
    family: 'gaskets_seals',
    short: 'GSKT SWG SS316 GRAPHITE 100NB CL150',
    long: 'GASKET SPIRAL WOUND SS316 GRAPHITE 100NB CL150',
    uom: 'EACH',
    price: 640,
    at: [
      { cpse: 'IOCL', qty: 4800 },
      { cpse: 'NTPC', qty: 2600 },
      { cpse: 'SAIL', qty: 3400 },
      { cpse: 'CIL', qty: 1200 },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'GSKT SWG SS316 GRAPHITE 150NB CL150',
    long: 'GASKET SPIRAL WOUND SS316 GRAPHITE 150NB CL150',
    uom: 'EACH',
    price: 980,
    at: [
      { cpse: 'IOCL', qty: 2200 },
      { cpse: 'SAIL', qty: 1800 },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'GSKT CAF 3MM 100NB CL150',
    long: 'GASKET CAF 3MM 100NB CL150',
    uom: 'EACH',
    price: 180,
    at: [
      { cpse: 'NTPC', qty: 6400 },
      { cpse: 'CIL', qty: 3100 },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'SEAL OIL 45X65X10 NBR',
    long: 'SEAL OIL 45X65X10 NBR',
    uom: 'EACH',
    price: 240,
    at: [
      { cpse: 'IOCL', qty: 3200 },
      { cpse: 'NTPC', qty: 2100 },
      { cpse: 'SAIL', qty: 4600 },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'ORING NBR 50X3',
    long: 'ORING NBR 50X3',
    uom: 'EACH',
    price: 42,
    at: [
      { cpse: 'IOCL', qty: 12_000 },
      { cpse: 'CIL', qty: 6800 },
    ],
  },

  // Motors and drives
  {
    family: 'motors_drives',
    short: 'MOT IND 3PH 10HP 415V B3',
    long: 'MOTOR INDUCTION 3PH 10HP 415V B3',
    uom: 'EACH',
    price: 42_000,
    at: [
      { cpse: 'IOCL', qty: 180 },
      { cpse: 'NTPC', qty: 240 },
      { cpse: 'SAIL', qty: 420, noise: 'CROMPTON' },
      { cpse: 'CIL', qty: 160 },
    ],
  },
  {
    family: 'motors_drives',
    short: 'MOT IND 3PH 25HP 415V B3',
    long: 'MOTOR INDUCTION 3PH 25HP 415V B3',
    uom: 'EACH',
    price: 86_000,
    at: [
      { cpse: 'NTPC', qty: 120 },
      { cpse: 'SAIL', qty: 210 },
    ],
  },
  {
    family: 'motors_drives',
    short: 'MOT IND 3PH 5.5KW 415V B5',
    long: 'MOTOR INDUCTION 3PH 5.5KW 415V B5',
    uom: 'EACH',
    price: 31_000,
    at: [
      { cpse: 'IOCL', qty: 260 },
      { cpse: 'CIL', qty: 140 },
    ],
  },
  {
    family: 'motors_drives',
    short: 'PMP CENTRIF 50X32 15KW',
    long: 'PUMP CENTRIFUGAL 50X32 15KW',
    uom: 'EACH',
    price: 124_000,
    at: [
      { cpse: 'IOCL', qty: 64 },
      { cpse: 'NTPC', qty: 48 },
      { cpse: 'SAIL', qty: 92 },
    ],
  },
  {
    family: 'motors_drives',
    short: 'GEARBOX HELICAL RATIO 20',
    long: 'GEARBOX HELICAL RATIO 20',
    uom: 'EACH',
    price: 68_000,
    at: [
      { cpse: 'SAIL', qty: 74 },
      { cpse: 'CIL', qty: 52 },
    ],
  },

  // Instruments
  {
    family: 'instruments',
    short: 'GAUGE PRESSURE DIAL 100MM 0-10BAR SS316',
    long: 'PRESSURE GAUGE DIAL 100MM 0-10BAR SS316',
    uom: 'EACH',
    price: 2400,
    at: [
      { cpse: 'IOCL', qty: 1400 },
      { cpse: 'NTPC', qty: 980 },
      { cpse: 'SAIL', qty: 1260 },
      { cpse: 'CIL', qty: 540 },
    ],
  },
  {
    family: 'instruments',
    short: 'TRANSMITTER PRESSURE 4-20MA HART SS316',
    long: 'TRANSMITTER PRESSURE 4-20MA HART SS316',
    uom: 'EACH',
    price: 46_000,
    at: [
      { cpse: 'IOCL', qty: 320 },
      { cpse: 'NTPC', qty: 260 },
    ],
  },
  {
    family: 'instruments',
    short: 'THERMOCOUPLE K 6MM 500MM SS316',
    long: 'THERMOCOUPLE K 6MM 500MM SS316',
    uom: 'EACH',
    price: 3800,
    at: [
      { cpse: 'NTPC', qty: 640 },
      { cpse: 'SAIL', qty: 880 },
      { cpse: 'CIL', qty: 290 },
    ],
  },
  {
    family: 'instruments',
    short: 'SWITCH LEVEL FLOAT SS316',
    long: 'SWITCH LEVEL FLOAT SS316',
    uom: 'EACH',
    price: 6200,
    at: [
      { cpse: 'IOCL', qty: 240 },
      { cpse: 'SAIL', qty: 380 },
    ],
  },
  {
    family: 'instruments',
    short: 'GAUGE TEMPERATURE DIAL 100MM 0-100C SS304',
    long: 'TEMPERATURE GAUGE DIAL 100MM 0-100C SS304',
    uom: 'EACH',
    price: 2100,
    at: [
      { cpse: 'NTPC', qty: 720 },
      { cpse: 'CIL', qty: 340 },
    ],
  },

  // Structural steel
  {
    family: 'structural_steel',
    short: 'ANG MS 50X50X6 IS 2062',
    long: 'ANGLE MILD STEEL 50X50X6 IS 2062',
    uom: 'KILOGRAM',
    price: 68,
    at: [
      { cpse: 'NTPC', qty: 184_000 },
      { cpse: 'SAIL', qty: 420_000 },
      { cpse: 'CIL', qty: 96_000 },
    ],
  },
  {
    family: 'structural_steel',
    short: 'PLT MS 10MM IS 2062',
    long: 'PLATE MILD STEEL 10MM IS 2062',
    uom: 'KILOGRAM',
    price: 72,
    at: [
      { cpse: 'IOCL', qty: 128_000 },
      { cpse: 'NTPC', qty: 96_000 },
      { cpse: 'SAIL', qty: 380_000 },
    ],
  },
  {
    family: 'structural_steel',
    short: 'CHANNEL MS 100X50 IS 2062',
    long: 'CHANNEL MILD STEEL 100X50 IS 2062',
    uom: 'KILOGRAM',
    price: 66,
    at: [
      { cpse: 'NTPC', qty: 74_000 },
      { cpse: 'CIL', qty: 58_000 },
    ],
  },
  {
    family: 'structural_steel',
    short: 'BEAM MS ISMB 200 IS 2062',
    long: 'BEAM MILD STEEL ISMB 200 IS 2062',
    uom: 'KILOGRAM',
    price: 71,
    at: [
      { cpse: 'SAIL', qty: 260_000 },
      { cpse: 'CIL', qty: 42_000 },
    ],
  },

  // Safety and PPE
  {
    family: 'safety_ppe',
    short: 'HLMT SAFETY IS 2925',
    long: 'HELMET SAFETY IS 2925',
    uom: 'EACH',
    price: 340,
    at: [
      { cpse: 'IOCL', qty: 18_000 },
      { cpse: 'NTPC', qty: 22_000 },
      { cpse: 'SAIL', qty: 46_000 },
      { cpse: 'CIL', qty: 68_000 },
    ],
  },
  {
    family: 'safety_ppe',
    short: 'GLOVES LEATHER HAND IS 6994',
    long: 'GLOVES LEATHER HAND IS 6994',
    uom: 'EACH',
    price: 120,
    at: [
      { cpse: 'SAIL', qty: 94_000 },
      { cpse: 'CIL', qty: 126_000 },
    ],
  },
  {
    family: 'safety_ppe',
    short: 'GOGGLES SAFETY CLEAR IS 5983',
    long: 'GOGGLES SAFETY CLEAR IS 5983',
    uom: 'EACH',
    price: 180,
    at: [
      { cpse: 'IOCL', qty: 12_000 },
      { cpse: 'NTPC', qty: 14_000 },
      { cpse: 'CIL', qty: 31_000 },
    ],
  },
  {
    family: 'safety_ppe',
    short: 'SHOES SAFETY LEATHER IS 15298',
    long: 'SHOES SAFETY LEATHER IS 15298',
    uom: 'EACH',
    price: 1240,
    at: [
      { cpse: 'IOCL', qty: 9600 },
      { cpse: 'SAIL', qty: 28_000 },
      { cpse: 'CIL', qty: 34_000 },
    ],
  },

  // Lubricants
  {
    family: 'lubricants',
    short: 'OIL LUBE VG46 210',
    long: 'OIL LUBRICATING VG46 210',
    uom: 'LITRE',
    price: 218,
    at: [
      { cpse: 'IOCL', qty: 48_000 },
      { cpse: 'NTPC', qty: 32_000 },
      { cpse: 'SAIL', qty: 26_000 },
      { cpse: 'CIL', qty: 19_000 },
    ],
  },
  {
    family: 'lubricants',
    short: 'OIL GEAR VG320 210',
    long: 'OIL GEAR VG320 210',
    uom: 'LITRE',
    price: 264,
    at: [
      { cpse: 'NTPC', qty: 14_000 },
      { cpse: 'SAIL', qty: 21_000 },
    ],
  },
  {
    family: 'lubricants',
    short: 'GREASE EP2 LITHIUM 18',
    long: 'GREASE EP2 LITHIUM 18',
    uom: 'KILOGRAM',
    price: 310,
    at: [
      { cpse: 'IOCL', qty: 8600 },
      { cpse: 'SAIL', qty: 12_400 },
      { cpse: 'CIL', qty: 7200 },
    ],
  },
  {
    family: 'lubricants',
    short: 'OIL TRANSFORMER IS 335',
    long: 'OIL TRANSFORMER IS 335',
    uom: 'LITRE',
    price: 186,
    at: [
      { cpse: 'NTPC', qty: 64_000 },
      { cpse: 'CIL', qty: 11_000 },
    ],
  },

  // Welding
  {
    family: 'welding',
    short: 'ELCT WELD E6013 3.15MM',
    long: 'ELECTRODE WELDING E6013 3.15MM',
    uom: 'KILOGRAM',
    price: 96,
    at: [
      { cpse: 'IOCL', qty: 24_000 },
      { cpse: 'NTPC', qty: 18_000 },
      { cpse: 'SAIL', qty: 62_000 },
      { cpse: 'CIL', qty: 21_000 },
    ],
  },
  {
    family: 'welding',
    short: 'ELCT WELD E7018 4MM',
    long: 'ELECTRODE WELDING E7018 4MM',
    uom: 'KILOGRAM',
    price: 128,
    at: [
      { cpse: 'IOCL', qty: 16_000 },
      { cpse: 'SAIL', qty: 44_000 },
    ],
  },
  {
    family: 'welding',
    short: 'ELCT WELD E308L 3.15MM',
    long: 'ELECTRODE WELDING E308L 3.15MM',
    uom: 'KILOGRAM',
    price: 420,
    at: [
      { cpse: 'IOCL', qty: 4200 },
      { cpse: 'NTPC', qty: 3100 },
    ],
  },
  {
    family: 'welding',
    short: 'WIRE MIG ER70S-6 1.2MM',
    long: 'WIRE MIG ER70S-6 1.2MM',
    uom: 'KILOGRAM',
    price: 112,
    at: [
      { cpse: 'SAIL', qty: 38_000 },
      { cpse: 'CIL', qty: 9400 },
    ],
  },

  // Judgement calls.
  //
  // These contradict nothing. Every attribute the two records both state agrees;
  // they simply describe the item with different words, or one of them states a
  // detail the other leaves out. The scorer cannot settle them, and it should not
  // pretend to: a shielded bearing and a sealed bearing of the same number are the
  // same part in one store and two parts in another, and only a person who knows
  // the plant can say which. They are here so the review queue has real work in it
  // rather than a list of obvious rejections.
  {
    family: 'bearings',
    short: 'BRG BALL DG 6205 ZZ',
    long: 'BALL BEARING DEEP GROOVE 6205 ZZ',
    uom: 'EACH',
    price: 405,
    at: [
      { cpse: 'NTPC', qty: 880, noise: 'NBC' },
      { cpse: 'CIL', qty: 640 },
    ],
  },
  {
    family: 'bearings',
    short: 'BRG BALL DG 6308 2RS',
    long: 'BALL BEARING DEEP GROOVE 6308 2RS',
    uom: 'EACH',
    price: 1010,
    at: [{ cpse: 'IOCL', qty: 340, noise: 'SKF' }],
  },
  {
    family: 'gaskets_seals',
    short: 'GSKT NON ASBESTOS 3MM 100NB CL150',
    long: 'GASKET NON ASBESTOS 3MM 100NB CL150',
    uom: 'EACH',
    price: 194,
    at: [{ cpse: 'SAIL', qty: 2800 }],
  },
  {
    family: 'safety_ppe',
    short: 'HLMT SAFETY WHITE RATCHET IS 2925',
    long: 'HELMET SAFETY WHITE RATCHET IS 2925',
    uom: 'EACH',
    price: 365,
    at: [{ cpse: 'SAIL', qty: 21_000 }],
  },
  {
    family: 'safety_ppe',
    short: 'SHOES SAFETY LEATHER STEEL TOE IS 15298',
    long: 'SHOES SAFETY LEATHER STEEL TOE IS 15298',
    uom: 'EACH',
    price: 1310,
    at: [{ cpse: 'NTPC', qty: 16_000 }],
  },
  {
    family: 'motors_drives',
    short: 'MOT IND 3PH 10HP 415V B5 FLGD',
    long: 'MOTOR INDUCTION 3PH 10HP 415V B5 FLANGED',
    uom: 'EACH',
    price: 44_000,
    at: [{ cpse: 'CIL', qty: 95 }],
  },
  {
    family: 'instruments',
    short: 'GAUGE PRESSURE DIAL 100MM 0-10BAR SS316 GLYCERINE FILLED',
    long: 'PRESSURE GAUGE DIAL 100MM 0-10BAR SS316 GLYCERINE FILLED',
    uom: 'EACH',
    price: 2760,
    at: [{ cpse: 'SAIL', qty: 620 }],
  },
  {
    family: 'valves_fittings',
    short: 'VLV GATE WCB 100NB CL150 FLGD RISING STEM IS 14846',
    long: 'VALVE GATE WCB 100NB CL150 FLANGED RISING STEM IS 14846',
    uom: 'EACH',
    price: 19_100,
    at: [{ cpse: 'NTPC', qty: 310 }],
  },
  {
    family: 'fasteners',
    short: 'BLT HEX SS304 M20X100 IS 1367',
    long: 'BOLT HEXAGONAL SS304 M20X100 IS 1367',
    uom: 'EACH',
    price: 168,
    at: [{ cpse: 'IOCL', qty: 12_000 }],
  },
  {
    family: 'electrical',
    short: 'CBL XLPE ARMD AL 3CX240 SQMM 1.1KV FRLS IS 7098',
    long: 'CABLE XLPE ARMOURED ALUMINIUM 3CX240 SQMM 1.1KV FRLS IS 7098',
    uom: 'METRE',
    price: 1290,
    at: [{ cpse: 'NTPC', qty: 8200 }],
  },
  /* ------------------------------------------------------------- vocabulary
   *
   * Items where two organisations do not merely abbreviate differently, they use
   * a different word. A power utility writes HOOTER and a refinery writes SIREN;
   * a steel plant writes DURBAR PLATE and everyone else writes CHEQUERED PLATE;
   * an electrical department earths a strip and a civil one grounds it.
   *
   * These cannot be fixed with a dictionary, because a dictionary is a list
   * somebody has to have written down first, and the whole difficulty is that
   * nobody has. The attribute extractor makes it worse rather than better: it
   * reads the two different words as the item noun, finds them in conflict, and
   * rejects a pair that is in fact the same part.
   *
   * This block is the case the model has to earn its place on. If a sentence
   * embedding cannot recognise these as the same thing, there is no argument for
   * having one, and the honest thing is to say so.
   */
  {
    family: 'electrical',
    short: 'HOOTER ELECTRONIC 230V IP65',
    long: 'HOOTER ELECTRONIC 230V IP65',
    uom: 'EACH',
    price: 2400,
    at: [
      { cpse: 'NTPC', qty: 180 },
      { cpse: 'IOCL', qty: 140, vocabulary: 'SIREN ELECTRONIC 230V IP65' },
      { cpse: 'SAIL', qty: 210, vocabulary: 'ALARM SOUNDER ELECTRONIC 230V IP65' },
    ],
  },
  {
    family: 'electrical',
    short: 'STRIP EARTHING COPPER 25X3',
    long: 'STRIP EARTHING COPPER 25X3',
    uom: 'METRE',
    price: 640,
    at: [
      { cpse: 'IOCL', qty: 2400 },
      { cpse: 'SAIL', qty: 1800, vocabulary: 'STRIP GROUNDING COPPER 25X3' },
    ],
  },
  {
    family: 'electrical',
    short: 'BULB LED 12W B22 6500K',
    long: 'BULB LED 12W B22 6500K',
    uom: 'EACH',
    price: 145,
    at: [
      { cpse: 'CIL', qty: 14_000 },
      { cpse: 'NTPC', qty: 21_000, vocabulary: 'LAMP LED 12W B22 6500K' },
      { cpse: 'IOCL', qty: 9800, vocabulary: 'LUMINAIRE LED 12W B22 6500K' },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'PENSTOCK CAST IRON 300NB MANUAL',
    long: 'PENSTOCK CAST IRON 300NB MANUAL',
    uom: 'EACH',
    price: 38_000,
    at: [
      { cpse: 'CIL', qty: 24 },
      { cpse: 'NTPC', qty: 31, vocabulary: 'SLUICE GATE CAST IRON 300NB MANUAL' },
    ],
  },
  {
    family: 'valves_fittings',
    short: 'STRAINER Y TYPE CARBON STEEL 50NB CL150',
    long: 'STRAINER Y TYPE CARBON STEEL 50NB CL150',
    uom: 'EACH',
    price: 4600,
    at: [
      { cpse: 'IOCL', qty: 140 },
      { cpse: 'SAIL', qty: 96, vocabulary: 'FILTER Y TYPE CARBON STEEL 50NB CL150' },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'BUSH GUNMETAL 50MM',
    long: 'BUSH GUNMETAL 50MM',
    uom: 'EACH',
    price: 890,
    at: [
      { cpse: 'SAIL', qty: 460 },
      { cpse: 'CIL', qty: 380, vocabulary: 'SLEEVE GUNMETAL 50MM' },
    ],
  },
  {
    family: 'gaskets_seals',
    short: 'PACKING GLAND GRAPHITE 10MM',
    long: 'PACKING GLAND GRAPHITE 10MM',
    uom: 'KILOGRAM',
    price: 2100,
    at: [
      { cpse: 'IOCL', qty: 340 },
      { cpse: 'NTPC', qty: 280, vocabulary: 'PACKING STUFFING BOX GRAPHITE 10MM' },
      { cpse: 'CIL', qty: 190, vocabulary: 'ROPE ASBESTOS FREE GRAPHITE 10MM' },
    ],
  },
  {
    family: 'structural_steel',
    short: 'PLATE CHEQUERED MILD STEEL 5MM IS 3502',
    long: 'PLATE CHEQUERED MILD STEEL 5MM IS 3502',
    uom: 'KILOGRAM',
    price: 74,
    at: [
      { cpse: 'IOCL', qty: 18_000 },
      { cpse: 'SAIL', qty: 46_000, vocabulary: 'PLATE DURBAR MILD STEEL 5MM IS 3502' },
    ],
  },
  {
    family: 'safety_ppe',
    short: 'GUMBOOT SAFETY PVC STEEL TOE IS 5852',
    long: 'GUMBOOT SAFETY PVC STEEL TOE IS 5852',
    uom: 'EACH',
    price: 720,
    at: [
      { cpse: 'CIL', qty: 6400 },
      { cpse: 'NTPC', qty: 3100, vocabulary: 'WELLINGTON SAFETY PVC STEEL TOE IS 5852' },
    ],
  },
  {
    family: 'safety_ppe',
    short: 'WASTE COTTON WHITE BALE 50KG',
    long: 'WASTE COTTON WHITE BALE 50KG',
    uom: 'KILOGRAM',
    price: 68,
    at: [
      { cpse: 'SAIL', qty: 24_000 },
      { cpse: 'IOCL', qty: 16_000, vocabulary: 'RAGS CLEANING WHITE BALE 50KG' },
    ],
  },
  {
    family: 'lubricants',
    short: 'OIL TRANSFORMER INHIBITED IS 12463',
    long: 'OIL TRANSFORMER INHIBITED IS 12463',
    uom: 'LITRE',
    price: 118,
    at: [
      { cpse: 'NTPC', qty: 42_000 },
      { cpse: 'SAIL', qty: 11_000, vocabulary: 'OIL INSULATING INHIBITED IS 12463' },
    ],
  },
  {
    family: 'instruments',
    short: 'SWITCH LEVEL FLOAT 230V 1NO 1NC',
    long: 'SWITCH LEVEL FLOAT 230V 1NO 1NC',
    uom: 'EACH',
    price: 3400,
    at: [
      { cpse: 'IOCL', qty: 120 },
      { cpse: 'CIL', qty: 88, vocabulary: 'SENSOR LEVEL FLOAT 230V 1NO 1NC' },
    ],
  },
]

/**
 * Size sweeps.
 *
 * A real material master is mostly long tails: every bolt from M6 to M30, every
 * pipe from 15NB to 300NB, most of them stocked by exactly one organisation. If
 * the slice held only the duplicated items it would suggest that everything in the
 * corpus is a duplicate, which is both false and the kind of flattery that gets
 * noticed. Each size below belongs to one CPSE, so these are genuine singletons.
 * They are also what the matcher has to say no to: a 6207 bearing and a 6209
 * bearing differ by one character and mean different money.
 */
interface Sweep {
  family: MaterialFamily
  short: (size: string) => string
  long: (size: string) => string
  uom: keyof typeof UOM_STYLE
  /** Rupees per unit, as a function of position in the sweep. */
  price: (index: number) => number
  qty: (index: number) => number
  sizes: string[]
}

const SWEEPS: Sweep[] = [
  {
    family: 'bearings',
    short: s => `BRG BALL DG ${s} 2RS`,
    long: s => `BALL BEARING DEEP GROOVE ${s} 2RS`,
    uom: 'EACH',
    price: i => 260 + i * 85,
    qty: i => 180 + i * 70,
    sizes: ['6200', '6201', '6202', '6203', '6204', '6207', '6209', '6210', '6212', '6304', '6305', '6306', '6310'],
  },
  {
    family: 'pipes_tubes',
    short: s => `PIP SMLS CS ${s} SCH40 IS 1239`,
    long: s => `PIPE SEAMLESS CARBON STEEL ${s} SCH40 IS 1239`,
    uom: 'METRE',
    price: i => 180 + i * 340,
    qty: i => 1200 + i * 640,
    sizes: ['15NB', '20NB', '25NB', '32NB', '40NB', '65NB', '80NB', '125NB', '250NB', '300NB'],
  },
  {
    family: 'pipes_tubes',
    short: s => `TUBE SMLS SS304 ${s} OD`,
    long: s => `TUBE SEAMLESS SS304 ${s} OD`,
    uom: 'METRE',
    price: i => 320 + i * 145,
    qty: i => 400 + i * 220,
    sizes: ['6MM', '8MM', '10MM', '16MM', '20MM', '32MM', '38MM', '50MM'],
  },
  {
    family: 'valves_fittings',
    short: s => `VLV GATE WCB ${s} CL150 FLGD IS 14846`,
    long: s => `VALVE GATE WCB ${s} CL150 FLANGED IS 14846`,
    uom: 'EACH',
    price: i => 3400 + i * 4800,
    qty: i => 90 + i * 55,
    sizes: ['25NB', '40NB', '50NB', '65NB', '150NB', '200NB', '250NB'],
  },
  {
    family: 'valves_fittings',
    short: s => `VLV BALL SS316 ${s} CL300 THD`,
    long: s => `VALVE BALL SS316 ${s} CL300 THREADED`,
    uom: 'EACH',
    price: i => 2600 + i * 1450,
    qty: i => 140 + i * 80,
    sizes: ['15NB', '20NB', '25NB', '32NB', '40NB', '65NB', '80NB'],
  },
  {
    family: 'valves_fittings',
    short: s => `ELBOW SMLS CS 90 ${s} SCH40`,
    long: s => `ELBOW SEAMLESS CARBON STEEL 90 ${s} SCH40`,
    uom: 'EACH',
    price: i => 240 + i * 460,
    qty: i => 320 + i * 190,
    sizes: ['25NB', '40NB', '50NB', '80NB', '150NB', '200NB'],
  },
  {
    family: 'valves_fittings',
    short: s => `FLANGE CS ${s} CL150 WNRF IS 6392`,
    long: s => `FLANGE CARBON STEEL ${s} CL150 WNRF IS 6392`,
    uom: 'EACH',
    price: i => 420 + i * 610,
    qty: i => 460 + i * 240,
    sizes: ['25NB', '40NB', '50NB', '80NB', '150NB', '200NB', '250NB'],
  },
  {
    family: 'fasteners',
    short: s => `BLT HEX MS ${s} 8.8 IS 1367`,
    long: s => `BOLT HEXAGONAL MILD STEEL ${s} 8.8 IS 1367`,
    uom: 'EACH',
    price: i => 8 + i * 11,
    qty: i => 9000 + i * 4200,
    sizes: ['M6X25', 'M8X30', 'M10X40', 'M12X50', 'M14X60', 'M18X80', 'M22X110', 'M24X120', 'M27X130', 'M30X150'],
  },
  {
    family: 'fasteners',
    short: s => `NUT HEX MS ${s} 8.8 IS 1363`,
    long: s => `NUT HEXAGONAL MILD STEEL ${s} 8.8 IS 1363`,
    uom: 'EACH',
    price: i => 3 + i * 4,
    qty: i => 11_000 + i * 3800,
    sizes: ['M6', 'M8', 'M10', 'M12', 'M14', 'M18', 'M22', 'M24', 'M27', 'M30'],
  },
  {
    family: 'electrical',
    short: s => `CBL XLPE ARMD AL ${s} SQMM 1.1KV IS 7098`,
    long: s => `CABLE XLPE ARMOURED ALUMINIUM ${s} SQMM 1.1KV IS 7098`,
    uom: 'METRE',
    price: i => 110 + i * 145,
    qty: i => 2400 + i * 1300,
    sizes: ['3CX16', '3CX35', '3CX50', '3CX70', '3CX95', '3CX150', '3CX185', '3CX300', '4CX10', '4CX16'],
  },
  {
    family: 'electrical',
    short: s => `CONTACTOR 3P ${s} 415V`,
    long: s => `CONTACTOR 3P ${s} 415V`,
    uom: 'EACH',
    price: i => 980 + i * 420,
    qty: i => 240 + i * 160,
    sizes: ['9A', '12A', '18A', '25A', '40A', '50A', '65A', '80A'],
  },
  {
    family: 'gaskets_seals',
    short: s => `GSKT SWG SS316 GRAPHITE ${s} CL150`,
    long: s => `GASKET SPIRAL WOUND SS316 GRAPHITE ${s} CL150`,
    uom: 'EACH',
    price: i => 120 + i * 145,
    qty: i => 640 + i * 380,
    sizes: ['25NB', '40NB', '50NB', '65NB', '80NB', '125NB', '200NB', '250NB'],
  },
  {
    family: 'gaskets_seals',
    short: s => `SEAL OIL ${s} NBR`,
    long: s => `SEAL OIL ${s} NBR`,
    uom: 'EACH',
    price: i => 110 + i * 34,
    qty: i => 460 + i * 210,
    sizes: ['25X40X7', '30X47X7', '35X52X7', '40X55X8', '50X72X8', '55X80X10', '60X85X10'],
  },
  {
    family: 'motors_drives',
    short: s => `MOT IND 3PH ${s} 415V B3`,
    long: s => `MOTOR INDUCTION 3PH ${s} 415V B3`,
    uom: 'EACH',
    price: i => 9800 + i * 14_500,
    qty: i => 40 + i * 26,
    sizes: ['1HP', '2HP', '3HP', '5HP', '7.5HP', '15HP', '20HP', '30HP', '40HP', '50HP'],
  },
  {
    family: 'instruments',
    short: s => `GAUGE PRESSURE DIAL 100MM ${s} SS316`,
    long: s => `PRESSURE GAUGE DIAL 100MM ${s} SS316`,
    uom: 'EACH',
    price: i => 1600 + i * 190,
    qty: i => 180 + i * 90,
    sizes: ['0-4BAR', '0-6BAR', '0-16BAR', '0-25BAR', '0-40BAR', '0-60BAR', '0-100BAR'],
  },
  {
    family: 'structural_steel',
    short: s => `ANG MS ${s} IS 2062`,
    long: s => `ANGLE MILD STEEL ${s} IS 2062`,
    uom: 'KILOGRAM',
    price: () => 68,
    qty: i => 22_000 + i * 14_000,
    sizes: ['25X25X3', '40X40X5', '65X65X6', '75X75X6', '90X90X8', '100X100X10', '130X130X10'],
  },
  {
    family: 'lubricants',
    short: s => `OIL LUBE ${s} 210`,
    long: s => `OIL LUBRICATING ${s} 210`,
    uom: 'LITRE',
    price: i => 196 + i * 22,
    qty: i => 3400 + i * 1900,
    sizes: ['VG32', 'VG68', 'VG100', 'VG150', 'VG220', 'VG460'],
  },
  {
    family: 'welding',
    short: s => `ELCT WELD E6013 ${s}`,
    long: s => `ELECTRODE WELDING E6013 ${s}`,
    uom: 'KILOGRAM',
    price: i => 88 + i * 9,
    qty: i => 2600 + i * 1400,
    sizes: ['2.5MM', '5MM', '6MM'],
  },
  {
    family: 'welding',
    short: s => `WIRE MIG ER70S-6 ${s}`,
    long: s => `WIRE MIG ER70S-6 ${s}`,
    uom: 'KILOGRAM',
    price: i => 104 + i * 7,
    qty: i => 1800 + i * 900,
    sizes: ['0.8MM', '1.0MM', '1.6MM'],
  },
  {
    family: 'safety_ppe',
    short: s => `GLOVES ${s} IS 6994`,
    long: s => `GLOVES ${s} IS 6994`,
    uom: 'EACH',
    price: i => 90 + i * 46,
    qty: i => 8400 + i * 5200,
    sizes: ['COTTON KNITTED', 'NITRILE COATED', 'CHROME LEATHER', 'ELECTRICAL 11KV'],
  },
]

function render(item: Item, cpse: Cpse['code'], stock: Stock): string {
  const style = HOUSE_STYLE[cpse]
  const base = stock.vocabulary ?? (style.register === 'short' ? item.short : item.long)
  const words = base.split(' ')
  if (stock.noise) words.push(stock.noise)
  return words.join(style.join)
}

/**
 * Ground truth, kept deliberately out of MaterialRecord.
 *
 * Two records share a truth key when they were generated from the same physical
 * item. This is what the matcher is trying to recover and must never see: it is
 * exported only for fitting and scoring the model offline, and no page imports it.
 * Keeping it in a side map rather than a field is what stops it leaking into the
 * interface by accident.
 */
export const TRUTH = new Map<string, string>()

function build(): MaterialRecord[] {
  const records: MaterialRecord[] = []
  let n = 0

  ITEMS.forEach((item, itemIndex) => {
    for (const stock of item.at) {
      const id = `${stock.cpse}-${String(itemIndex).padStart(3, '0')}`
      TRUTH.set(id, `item:${itemIndex}`)
      records.push({
        id,
        cpse: stock.cpse,
        localCode: LOCAL_CODE[stock.cpse](n),
        rawDescription: render(item, stock.cpse, stock),
        rawUom: UOM_STYLE[item.uom][stock.cpse],
        family: item.family,
        annualQty: stock.qty,
        unitPrice: item.price,
        stockOnHand: stockFor(stock.cpse, stock.qty, n),
      })
      n += 1
    }
  })

  // Each sweep size belongs to exactly one organisation. Rotating the starting
  // point per sweep keeps the long tail spread across all four rather than piling
  // every odd size onto whoever happens to be first in the list.
  let rotation = 0
  SWEEPS.forEach((sweep, sweepIndex) => {
    sweep.sizes.forEach((size, sizeIndex) => {
      const cpse = CPSES[(rotation + sweepIndex) % CPSES.length].code
      rotation += 1
      const style = HOUSE_STYLE[cpse]
      const text = style.register === 'short' ? sweep.short(size) : sweep.long(size)
      const id = `${cpse}-S${String(n).padStart(3, '0')}`
      // Each sweep size is its own item, and each is held by exactly one
      // organisation, so every one of these is a singleton in the truth.
      TRUTH.set(id, `sweep:${sweepIndex}:${size}`)
      records.push({
        id,
        cpse,
        localCode: LOCAL_CODE[cpse](n),
        rawDescription: text.split(' ').join(style.join),
        rawUom: UOM_STYLE[sweep.uom][cpse],
        family: sweep.family,
        annualQty: sweep.qty(sizeIndex),
        unitPrice: sweep.price(sizeIndex),
        stockOnHand: stockFor(cpse, sweep.qty(sizeIndex), n),
      })
      n += 1
    })
  })

  return records
}

/**
 * The inspectable slice. Every pair, cluster and code the console shows is computed
 * from these records at runtime, so the arithmetic on screen can be checked against
 * the rows on the Explorer.
 */
export const SAMPLE_RECORDS: MaterialRecord[] = build()

/** How many of the full corpus one sample record stands for. */
export const SAMPLE_SCALE = TOTAL_RECORDS / SAMPLE_RECORDS.length
