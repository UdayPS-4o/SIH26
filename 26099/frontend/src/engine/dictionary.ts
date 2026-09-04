/**
 * MRO abbreviation dictionary.
 *
 * Every entry here is inspectable from the Normalization page and extendable at
 * runtime from the Engine page, which is the point: the normalizer is a set of
 * rules a procurement officer can read and argue with, not a black box.
 */

import type { AttributeSlot } from './types'

export interface DictionaryRule {
  /** Token as written in a CPSE material master. */
  token: string
  /** What it expands to. */
  expansion: string
  /** Attribute slot this token contributes to once expanded. */
  slot: AttributeSlot | null
  /** Where the abbreviation is commonly used, shown as provenance. */
  source: 'MRO' | 'SAP' | 'IS' | 'UOM'
}

/**
 * Gaps found by the unexplained-token check rather than by reading the list.
 *
 * Each of these was an abbreviation whose spelled-out form had no rule, so the
 * two forms survived normalization as different words and blocked a merge that
 * was otherwise correct. They were invisible while a mismatch on one word could
 * be outvoted by the attribute and numeric scores.
 */
export const GAP_RULES: DictionaryRule[] = [
  { token: 'WELD', expansion: 'WELDING', slot: null, source: 'MRO' },
  { token: 'LUBE', expansion: 'LUBRICATING', slot: null, source: 'MRO' },
  { token: 'CSK', expansion: 'COUNTERSUNK', slot: 'variant', source: 'MRO' },
]

export const BASE_RULES: DictionaryRule[] = [
  ...GAP_RULES,
  // Canonical nouns. A master that already spells the word out has to land on the
  // same slot as one that abbreviates it. These also stop the shape heuristics in
  // the normalizer from guessing, which matters for a string like "BALL BEARING":
  // without an entry for BEARING the heuristic takes BALL as the noun purely
  // because it came first.
  { token: 'BEARING', expansion: 'BEARING', slot: 'noun', source: 'MRO' },
  { token: 'VALVE', expansion: 'VALVE', slot: 'noun', source: 'MRO' },
  { token: 'PIPE', expansion: 'PIPE', slot: 'noun', source: 'MRO' },
  { token: 'TUBE', expansion: 'TUBE', slot: 'noun', source: 'MRO' },
  { token: 'CABLE', expansion: 'CABLE', slot: 'noun', source: 'MRO' },
  { token: 'BOLT', expansion: 'BOLT', slot: 'noun', source: 'MRO' },
  { token: 'SCREW', expansion: 'SCREW', slot: 'noun', source: 'MRO' },
  { token: 'WASHER', expansion: 'WASHER', slot: 'noun', source: 'MRO' },
  { token: 'GASKET', expansion: 'GASKET', slot: 'noun', source: 'MRO' },
  { token: 'MOTOR', expansion: 'MOTOR', slot: 'noun', source: 'MRO' },
  { token: 'PUMP', expansion: 'PUMP', slot: 'noun', source: 'MRO' },
  { token: 'GAUGE', expansion: 'GAUGE', slot: 'noun', source: 'MRO' },
  { token: 'ELECTRODE', expansion: 'ELECTRODE', slot: 'noun', source: 'MRO' },
  { token: 'HELMET', expansion: 'HELMET', slot: 'noun', source: 'MRO' },
  { token: 'ANGLE', expansion: 'ANGLE', slot: 'noun', source: 'MRO' },
  { token: 'PLATE', expansion: 'PLATE', slot: 'noun', source: 'MRO' },
  { token: 'CHANNEL', expansion: 'CHANNEL', slot: 'noun', source: 'MRO' },
  { token: 'BEAM', expansion: 'BEAM', slot: 'noun', source: 'MRO' },
  { token: 'CONTACTOR', expansion: 'CONTACTOR', slot: 'noun', source: 'MRO' },
  { token: 'RELAY', expansion: 'RELAY', slot: 'noun', source: 'MRO' },
  { token: 'TRANSMITTER', expansion: 'TRANSMITTER', slot: 'noun', source: 'MRO' },
  { token: 'THERMOCOUPLE', expansion: 'THERMOCOUPLE', slot: 'noun', source: 'MRO' },
  { token: 'GREASE', expansion: 'GREASE', slot: 'noun', source: 'MRO' },
  { token: 'OIL', expansion: 'OIL', slot: 'noun', source: 'MRO' },
  { token: 'GLOVES', expansion: 'GLOVES', slot: 'noun', source: 'MRO' },
  { token: 'GOGGLES', expansion: 'GOGGLES', slot: 'noun', source: 'MRO' },
  { token: 'SEAL', expansion: 'SEAL', slot: 'noun', source: 'MRO' },
  { token: 'COUPLING', expansion: 'COUPLING', slot: 'noun', source: 'MRO' },
  { token: 'SWITCH', expansion: 'SWITCH', slot: 'noun', source: 'MRO' },
  { token: 'FILTER', expansion: 'FILTER', slot: 'noun', source: 'MRO' },
  { token: 'ROPE', expansion: 'ROPE', slot: 'noun', source: 'MRO' },
  { token: 'BELT', expansion: 'BELT', slot: 'noun', source: 'MRO' },

  // Nouns
  { token: 'BRG', expansion: 'BEARING', slot: 'noun', source: 'MRO' },
  { token: 'BERG', expansion: 'BEARING', slot: 'noun', source: 'MRO' },
  { token: 'BEARNG', expansion: 'BEARING', slot: 'noun', source: 'SAP' },
  { token: 'VLV', expansion: 'VALVE', slot: 'noun', source: 'MRO' },
  { token: 'VALV', expansion: 'VALVE', slot: 'noun', source: 'SAP' },
  { token: 'PIP', expansion: 'PIPE', slot: 'noun', source: 'MRO' },
  { token: 'PPE', expansion: 'PIPE', slot: 'noun', source: 'SAP' },
  { token: 'CBL', expansion: 'CABLE', slot: 'noun', source: 'MRO' },
  { token: 'CAB', expansion: 'CABLE', slot: 'noun', source: 'SAP' },
  { token: 'BLT', expansion: 'BOLT', slot: 'noun', source: 'MRO' },
  { token: 'GSKT', expansion: 'GASKET', slot: 'noun', source: 'MRO' },
  { token: 'GSK', expansion: 'GASKET', slot: 'noun', source: 'MRO' },
  { token: 'SWG', expansion: 'SPIRAL WOUND GASKET', slot: 'noun', source: 'MRO' },
  { token: 'MOT', expansion: 'MOTOR', slot: 'noun', source: 'MRO' },
  // MTR is deliberately absent here. It is claimed by both MOTOR and METRE in real
  // masters, and METRE is far the commoner reading, so it lives with the units of
  // measure below. Two rules for one token would silently resolve by list order.
  { token: 'PMP', expansion: 'PUMP', slot: 'noun', source: 'MRO' },
  { token: 'GAUG', expansion: 'GAUGE', slot: 'noun', source: 'SAP' },
  { token: 'PG', expansion: 'PRESSURE GAUGE', slot: 'noun', source: 'MRO' },
  { token: 'ELCT', expansion: 'ELECTRODE', slot: 'noun', source: 'MRO' },
  { token: 'ELEC', expansion: 'ELECTRODE', slot: 'noun', source: 'MRO' },
  { token: 'HLMT', expansion: 'HELMET', slot: 'noun', source: 'MRO' },
  { token: 'ANG', expansion: 'ANGLE', slot: 'noun', source: 'MRO' },
  { token: 'PLT', expansion: 'PLATE', slot: 'noun', source: 'MRO' },
  { token: 'NUT', expansion: 'NUT', slot: 'noun', source: 'MRO' },
  { token: 'WSHR', expansion: 'WASHER', slot: 'noun', source: 'MRO' },

  // Variants
  { token: 'HEX', expansion: 'HEXAGONAL', slot: 'variant', source: 'MRO' },
  { token: 'HEXA', expansion: 'HEXAGONAL', slot: 'variant', source: 'SAP' },
  { token: 'HEXAGON', expansion: 'HEXAGONAL', slot: 'variant', source: 'MRO' },
  { token: 'DG', expansion: 'DEEP GROOVE', slot: 'variant', source: 'MRO' },
  { token: 'DEEP', expansion: 'DEEP GROOVE', slot: 'variant', source: 'MRO' },
  { token: 'FLGD', expansion: 'FLANGED', slot: 'variant', source: 'MRO' },
  { token: 'FLG', expansion: 'FLANGED', slot: 'variant', source: 'SAP' },
  { token: 'SMLS', expansion: 'SEAMLESS', slot: 'variant', source: 'MRO' },
  { token: 'ERW', expansion: 'ELECTRIC RESISTANCE WELDED', slot: 'variant', source: 'IS' },
  { token: 'THD', expansion: 'THREADED', slot: 'variant', source: 'MRO' },
  { token: 'CENTRIF', expansion: 'CENTRIFUGAL', slot: 'variant', source: 'SAP' },
  { token: 'IND', expansion: 'INDUCTION', slot: 'variant', source: 'MRO' },
  { token: 'ARMD', expansion: 'ARMOURED', slot: 'variant', source: 'MRO' },
  { token: 'UNARMD', expansion: 'UNARMOURED', slot: 'variant', source: 'MRO' },
  { token: 'SEAMLESS', expansion: 'SEAMLESS', slot: 'variant', source: 'MRO' },
  { token: 'FLANGED', expansion: 'FLANGED', slot: 'variant', source: 'MRO' },
  { token: 'THREADED', expansion: 'THREADED', slot: 'variant', source: 'MRO' },
  { token: 'ARMOURED', expansion: 'ARMOURED', slot: 'variant', source: 'MRO' },
  { token: 'UNARMOURED', expansion: 'UNARMOURED', slot: 'variant', source: 'MRO' },
  { token: 'CENTRIFUGAL', expansion: 'CENTRIFUGAL', slot: 'variant', source: 'MRO' },
  { token: 'INDUCTION', expansion: 'INDUCTION', slot: 'variant', source: 'MRO' },
  { token: 'HEXAGONAL', expansion: 'HEXAGONAL', slot: 'variant', source: 'MRO' },

  // Body styles.
  //
  // A valve's type is not a decoration on the word VALVE, it is what the valve is.
  // Without these the noun slot took VALVE for all of them, the body style reached
  // no slot at all, and a check valve and a gate valve of the same bore, class,
  // material and end connection recorded a perfect attribute match. They are not
  // interchangeable and no storekeeper needs to be asked.
  { token: 'GATE', expansion: 'GATE', slot: 'variant', source: 'MRO' },
  { token: 'GLOBE', expansion: 'GLOBE', slot: 'variant', source: 'MRO' },
  { token: 'CHECK', expansion: 'CHECK', slot: 'variant', source: 'MRO' },
  { token: 'NRV', expansion: 'CHECK', slot: 'variant', source: 'MRO' },
  { token: 'BALL', expansion: 'BALL', slot: 'variant', source: 'MRO' },
  { token: 'BUTTERFLY', expansion: 'BUTTERFLY', slot: 'variant', source: 'MRO' },
  { token: 'PLUG', expansion: 'PLUG', slot: 'variant', source: 'MRO' },
  { token: 'NEEDLE', expansion: 'NEEDLE', slot: 'variant', source: 'MRO' },
  { token: 'DIAPHRAGM', expansion: 'DIAPHRAGM', slot: 'variant', source: 'MRO' },
  { token: 'RELIEF', expansion: 'PRESSURE RELIEF', slot: 'variant', source: 'MRO' },
  { token: 'ROLLER', expansion: 'ROLLER', slot: 'variant', source: 'MRO' },
  { token: 'SPHERICAL', expansion: 'SPHERICAL', slot: 'variant', source: 'MRO' },
  { token: 'TAPER', expansion: 'TAPER', slot: 'variant', source: 'MRO' },
  { token: 'THRUST', expansion: 'THRUST', slot: 'variant', source: 'MRO' },

  // Mounting designations. IEC 60034-7: B3 is foot mounted, B5 flange mounted.
  // Two motors of the same rating that bolt down differently are two motors.
  { token: 'B3', expansion: 'FOOT MOUNTED', slot: 'variant', source: 'IS' },
  { token: 'B5', expansion: 'FLANGE MOUNTED', slot: 'variant', source: 'IS' },
  { token: 'B35', expansion: 'FOOT AND FLANGE MOUNTED', slot: 'variant', source: 'IS' },

  // Materials
  { token: 'SS', expansion: 'STAINLESS STEEL', slot: 'material', source: 'MRO' },
  { token: 'SS304', expansion: 'STAINLESS STEEL 304', slot: 'material', source: 'MRO' },
  { token: 'SS316', expansion: 'STAINLESS STEEL 316', slot: 'material', source: 'MRO' },
  { token: 'CS', expansion: 'CARBON STEEL', slot: 'material', source: 'MRO' },
  { token: 'MS', expansion: 'MILD STEEL', slot: 'material', source: 'MRO' },
  { token: 'GI', expansion: 'GALVANISED IRON', slot: 'material', source: 'MRO' },
  { token: 'WCB', expansion: 'CAST STEEL WCB', slot: 'material', source: 'IS' },
  { token: 'CU', expansion: 'COPPER', slot: 'material', source: 'MRO' },
  { token: 'AL', expansion: 'ALUMINIUM', slot: 'material', source: 'MRO' },
  { token: 'XLPE', expansion: 'CROSS LINKED POLYETHYLENE', slot: 'material', source: 'IS' },
  { token: 'HDPE', expansion: 'HIGH DENSITY POLYETHYLENE', slot: 'material', source: 'IS' },
  { token: 'PTFE', expansion: 'POLYTETRAFLUOROETHYLENE', slot: 'material', source: 'IS' },
  { token: 'CI', expansion: 'CAST IRON', slot: 'material', source: 'MRO' },
  { token: 'CARBON', expansion: 'CARBON STEEL', slot: 'material', source: 'MRO' },
  { token: 'STAINLESS', expansion: 'STAINLESS STEEL', slot: 'material', source: 'MRO' },
  { token: 'MILD', expansion: 'MILD STEEL', slot: 'material', source: 'MRO' },
  { token: 'GALVANISED', expansion: 'GALVANISED IRON', slot: 'material', source: 'MRO' },
  { token: 'COPPER', expansion: 'COPPER', slot: 'material', source: 'MRO' },
  { token: 'ALUMINIUM', expansion: 'ALUMINIUM', slot: 'material', source: 'MRO' },
  // Protective-clothing materials. A cotton glove, a nitrile-coated glove and a
  // chrome leather glove are three items with three prices and three uses; with
  // none of them reaching the material slot all three read as the same glove.
  { token: 'LEATHER', expansion: 'LEATHER', slot: 'material', source: 'MRO' },
  { token: 'CHROME', expansion: 'CHROME LEATHER', slot: 'material', source: 'MRO' },
  { token: 'NITRILE', expansion: 'NITRILE', slot: 'material', source: 'MRO' },
  { token: 'COTTON', expansion: 'COTTON', slot: 'material', source: 'MRO' },
  { token: 'GRAPHITE', expansion: 'GRAPHITE', slot: 'material', source: 'MRO' },
  { token: 'GUNMETAL', expansion: 'GUNMETAL', slot: 'material', source: 'MRO' },
  { token: 'PVC', expansion: 'POLYVINYL CHLORIDE', slot: 'material', source: 'IS' },

  // Dimensional and rating shorthands
  // Qualifiers, not dimensions. "OD" says which diameter is meant; the dimension is
  // the number beside it. These take no slot but still contribute their words.
  { token: 'ID', expansion: 'BORE', slot: null, source: 'MRO' },
  { token: 'OD', expansion: 'OUTER DIAMETER', slot: null, source: 'MRO' },
  { token: 'NB', expansion: 'NOMINAL BORE', slot: null, source: 'IS' },
  { token: 'DN', expansion: 'NOMINAL BORE', slot: null, source: 'IS' },
  { token: 'SCH40', expansion: 'SCHEDULE 40', slot: 'rating', source: 'IS' },
  { token: 'SCH80', expansion: 'SCHEDULE 80', slot: 'rating', source: 'IS' },
  { token: 'SCH', expansion: 'SCHEDULE', slot: 'rating', source: 'IS' },
  { token: 'CL150', expansion: 'CLASS 150', slot: 'rating', source: 'IS' },
  { token: 'CL300', expansion: 'CLASS 300', slot: 'rating', source: 'IS' },
  { token: 'HVY', expansion: 'HEAVY', slot: 'rating', source: 'MRO' },
  { token: 'GR', expansion: 'GRADE', slot: 'grade', source: 'MRO' },
  { token: 'GRD', expansion: 'GRADE', slot: 'grade', source: 'SAP' },
  // Designation suffixes. These are filed under grade rather than variant on
  // purpose: variant is already spoken for by the bearing type or the body style,
  // and a suffix that cannot reach a slot cannot record a conflict. With 2RS and ZZ
  // both landing in variant behind DEEP GROOVE, a sealed 6205 and a shielded 6205
  // scored a perfect attribute match and merged under one national code, which is
  // wrong in most stores and obviously wrong to anyone who buys bearings.
  { token: '2RS', expansion: 'DOUBLE RUBBER SEALED', slot: 'grade', source: 'MRO' },
  { token: 'ZZ', expansion: 'DOUBLE METAL SHIELDED', slot: 'grade', source: 'MRO' },
  { token: '2Z', expansion: 'DOUBLE METAL SHIELDED', slot: 'grade', source: 'MRO' },
  { token: 'FRLS', expansion: 'FLAME RETARDANT LOW SMOKE', slot: 'grade', source: 'IS' },

  // Units of measure. These collapse to a single normalized unit.
  { token: 'NOS', expansion: 'EACH', slot: null, source: 'UOM' },
  { token: 'NO', expansion: 'EACH', slot: null, source: 'UOM' },
  { token: 'EA', expansion: 'EACH', slot: null, source: 'UOM' },
  { token: 'PCS', expansion: 'EACH', slot: null, source: 'UOM' },
  { token: 'PC', expansion: 'EACH', slot: null, source: 'UOM' },
  { token: 'MTR', expansion: 'METRE', slot: null, source: 'UOM' },
  { token: 'MT', expansion: 'METRE', slot: null, source: 'UOM' },
  { token: 'M', expansion: 'METRE', slot: null, source: 'UOM' },
  { token: 'RMT', expansion: 'METRE', slot: null, source: 'UOM' },
  { token: 'KGS', expansion: 'KILOGRAM', slot: null, source: 'UOM' },
  { token: 'KG', expansion: 'KILOGRAM', slot: null, source: 'UOM' },
  { token: 'LTR', expansion: 'LITRE', slot: null, source: 'UOM' },
  { token: 'L', expansion: 'LITRE', slot: null, source: 'UOM' },
  // SQMM is a unit, not a dimension. Filing it under dimension let it occupy the
  // slot that the conductor configuration needs, so every armoured cable in the
  // corpus recorded the same dimension regardless of its cross section.
  { token: 'SQMM', expansion: 'SQUARE MILLIMETRE', slot: null, source: 'UOM' },
  { token: 'MM2', expansion: 'SQUARE MILLIMETRE', slot: null, source: 'UOM' },
]

/** Words that carry no discriminating information and are dropped before scoring. */
export const STOP_TOKENS = new Set([
  'AND', 'OR', 'THE', 'FOR', 'WITH', 'TYPE', 'MAKE', 'ITEM', 'MATERIAL', 'SPARE',
  'ASSY', 'ASSEMBLY', 'PART', 'QTY', 'SET',
])

/**
 * Manufacturer names.
 *
 * A storekeeper writes the maker into the description because that is who they
 * last bought from, not because it is part of the specification. SKF and FAG make
 * the same 6205 to the same standard, so the token has to be recognised as saying
 * nothing about what the item is.
 *
 * This matters more than it looks. Once every remaining word that appears on one
 * line and not the other counts as a real difference, a stray maker name would be
 * enough to push a correct merge into the review queue. A real deployment keeps
 * this list against the approved vendor master; here it is a set, and the Engine
 * page shows it.
 */
export const VENDOR_TOKENS = new Set([
  'SKF', 'FAG', 'NBC', 'TIMKEN', 'NTN', 'KOYO', 'SNR', 'ZKL',
  'KIRLOSKAR', 'CROMPTON', 'ABB', 'SIEMENS', 'SCHNEIDER', 'LT', 'HAVELLS',
  'JINDAL', 'POLYCAB', 'FINOLEX', 'TATA', 'APOLLO', 'SURYA',
  'BHEL', 'THERMAX', 'FORBES', 'GRUNDFOS', 'KSB', 'AUDCO', 'LEADER',
])

/** UOM values normalize to one of these. */
export const CANONICAL_UOM = ['EACH', 'METRE', 'KILOGRAM', 'LITRE', 'SQUARE METRE'] as const

/** Build a lookup keyed by raw token. Later rules win, so runtime additions
 *  from the Engine page override the base dictionary. */
export function buildIndex(rules: DictionaryRule[]): Map<string, DictionaryRule> {
  const index = new Map<string, DictionaryRule>()
  for (const rule of rules) index.set(rule.token.toUpperCase(), rule)
  return index
}
