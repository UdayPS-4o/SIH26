/**
 * Every user-facing string, in both registers, in one file.
 *
 * This exists so that at two in the morning, when the wording feels wrong, it gets
 * fixed in one place instead of hunted through nine page components.
 *
 * Simple register rules: no acronym without expansion, no model names, no version
 * numbers, lakh and crore rather than K and M, and every figure carries its own
 * meaning. Technical register may assume the reader builds systems for a living.
 *
 * Do not use em-dash characters in any string here.
 */

import { useViewMode } from '@/store/viewmode'

type Entry = { simple: string; technical: string }

export const COPY = {
  /* ---------------------------------------------------------------- product */
  productName: { simple: 'CodeOne', technical: 'CodeOne' },
  productFull: {
    simple: 'National Unified Material Master',
    technical: 'National Unified Material Master Framework',
  },
  tagline: {
    simple: 'Four government companies buy the same items under different names.',
    technical: 'Cross-CPSE material master harmonization, 24.1 lakh records.',
  },

  /* ------------------------------------------------------------ terminology */
  cpse: { simple: 'government company', technical: 'CPSE' },
  cpsePlural: { simple: 'government companies', technical: 'CPSEs' },
  material: { simple: 'item', technical: 'material record' },
  materialPlural: { simple: 'items', technical: 'material records' },
  masterList: { simple: 'item list', technical: 'material master' },
  nationalCode: { simple: 'national code', technical: 'CNMC code' },
  goldenRecord: { simple: 'the agreed entry', technical: 'golden record' },
  cluster: { simple: 'group of matching items', technical: 'cluster' },
  normalization: { simple: 'cleaning up names', technical: 'normalization' },
  matching: { simple: 'matching up', technical: 'harmonization' },
  dedup: { simple: 'removing repeats', technical: 'deduplication' },
  engine: { simple: 'the matching engine', technical: 'scoring pipeline' },
  standards: { simple: 'official standards', technical: 'IS / ASTM / ISO' },
  uom: { simple: 'unit (piece, metre, kg)', technical: 'UOM' },
  erp: { simple: "the company's computer system", technical: 'ERP' },
  ingest: { simple: 'read the data', technical: 'ingest' },
  mint: { simple: 'create a new code', technical: 'mint' },

  /* -------------------------------------------------------------- nav items */
  navOverview: { simple: 'Overview', technical: 'Dashboard' },
  navExplorer: { simple: 'Search items', technical: 'Material explorer' },
  // Kept short on purpose: this row carries a pending-count badge, and the longer
  // wording truncated against it at the sidebar's fixed width.
  navDuplicates: { simple: 'Duplicates', technical: 'Matching and review' },
  navSavings: { simple: 'Savings', technical: 'Analytics' },
  navRegistry: { simple: 'National code book', technical: 'CNMC registry' },
  navImport: { simple: 'Add new data', technical: 'Ingestion' },
  navNormalize: { simple: 'Name cleaner', technical: 'Normalization' },
  navActivity: { simple: 'Activity history', technical: 'Audit trail' },
  navEngine: { simple: 'Settings', technical: 'Engine configuration' },

  /* ----------------------------------------------------------- page titles */
  overviewTitle: { simple: 'Overview', technical: 'Harmonization dashboard' },
  // The page opens on the premise in full, so the lead says what to do rather
  // than repeating it in smaller type directly above itself.
  overviewLead: {
    simple: 'Three companies are in. Add the fourth and watch the registry change.',
    technical:
      'Three CPSE masters loaded. Drop the fourth extract, then trace one part through normalize, match and mint.',
  },

  explorerTitle: { simple: 'Search items', technical: 'Material explorer' },
  explorerLead: {
    simple: 'Every item, grouped so that the same thing from different companies sits together.',
    technical: 'Indexed catalogue with cluster grouping, blocking keys and per-record normalization.',
  },

  duplicatesTitle: { simple: 'Duplicates found', technical: 'Matching and review' },
  duplicatesLead: {
    simple: 'Pairs the system thinks are the same item. Some need a person to decide.',
    technical: 'Candidate pairs with score breakdown, weight tuning and reviewer decisions.',
  },

  savingsTitle: { simple: 'Savings', technical: 'Analytics and savings' },
  savingsLead: {
    simple: 'What the country saves by buying the repeats together instead of separately.',
    technical: 'Consolidation model with editable assumptions and a per-step waterfall.',
  },

  registryTitle: { simple: 'The national code book', technical: 'CNMC registry' },
  registryLead: {
    simple: 'One agreed entry for every item, and what each company calls it.',
    technical: 'Golden records with derivation, legacy mappings and classification references.',
  },

  importTitle: { simple: 'Add a company item list', technical: 'Ingestion' },
  importLead: {
    simple: 'Bring in a new list and see straight away which items already exist elsewhere.',
    technical: 'Upload, map columns, score against the corpus, mint codes for unmatched rows.',
  },

  normalizeTitle: { simple: 'Name cleaner', technical: 'Normalization' },
  normalizeLead: {
    simple: 'Engineers write in short forms. Every company uses different ones. Type anything and watch it get sorted out.',
    technical: 'Dictionary expansion, attribute slot extraction and canonical signature generation.',
  },

  activityTitle: { simple: 'Activity history', technical: 'Audit trail' },
  activityLead: {
    simple: 'Every decision, who made it and when. Nothing here can be edited after the fact.',
    technical: 'Append-only action log with actor, endpoint and affected code.',
  },

  engineTitle: { simple: 'Settings', technical: 'Engine configuration' },
  engineLead: {
    simple: 'Change how strict the matching is, and teach it new short forms.',
    technical: 'Scoring weights, decision thresholds, dictionary rules and connector registry.',
  },

  /* ------------------------------------------------------------- verdicts */
  verdictSame: { simple: 'Same item', technical: 'Above accept threshold' },
  verdictReview: { simple: 'Probably the same, needs a check', technical: 'Between thresholds' },
  verdictDifferent: { simple: 'Different items', technical: 'Below review threshold' },

  /* --------------------------------------------------------------- actions */
  approve: { simple: 'Yes, same item', technical: 'Approve' },
  reject: { simple: 'No, different', technical: 'Reject' },
  runMatching: { simple: 'Find duplicates', technical: 'Run matching' },
  showWorking: { simple: 'Show how this was worked out', technical: 'Show derivation' },
  download: { simple: 'Download this record', technical: 'Export CSV' },

  /* ----------------------------------------------------------- score labels */
  scoreLexical: { simple: 'Words in common', technical: 'Lexical' },
  scoreAttribute: { simple: 'Specifications agree', technical: 'Attribute' },
  scoreNumeric: { simple: 'Sizes and numbers agree', technical: 'Numeric' },
  scoreCombined: { simple: 'Overall', technical: 'Combined' },

  /* -------------------------------------------------------------- empty ui */
  emptyProposals: {
    simple: 'Nothing to check right now. Every pair has been decided.',
    technical: 'No candidate pairs above the review threshold at the current weights.',
  },
  emptySearch: {
    simple: 'No items match that search. Try a shorter word, like "bolt" or "cable".',
    technical: 'No records matched the query across description, code or standard.',
  },
  loading: { simple: 'Working on it', technical: 'Awaiting service response' },
  errorGeneric: {
    simple: 'Something went wrong reading the data. Try again.',
    technical: 'The harmonization service returned an error.',
  },
} satisfies Record<string, Entry>

export type CopyKey = keyof typeof COPY

/** `const c = useCopy()` then `c('overviewTitle')`. */
export function useCopy() {
  const mode = useViewMode(s => s.mode)
  return (key: CopyKey): string => COPY[key][mode]
}

/** For use outside React. */
export function copyFor(key: CopyKey, mode: 'simple' | 'technical'): string {
  return COPY[key][mode]
}
