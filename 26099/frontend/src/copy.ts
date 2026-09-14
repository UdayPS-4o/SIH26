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
  /**
   * The eight rows that carry a stated capability are named after that capability
   * in both registers, rather than being translated into plain language in Simple
   * view. Somebody arriving with the requirement list in their hand has to be able
   * to find each item without first working out that "Name cleaner" is
   * standardization. The plain language moved into the lead under each title,
   * which is where it explains rather than hides.
   *
   * Rows that are not one of the eight keep whatever name fits them best.
   */
  navDashboard: { simple: 'Dashboard and analytics', technical: 'Dashboard and analytics' },
  // Overview is the guided run, not the numbers page: the two used to share the
  // word "dashboard" and the nav read as two of the same thing.
  navOverview: { simple: 'How this works', technical: 'Guided walkthrough' },
  navExplorer: { simple: 'Search items', technical: 'Material explorer' },
  navMatching: { simple: 'AI material matching', technical: 'AI material matching' },
  navDuplicates: { simple: 'Duplicate detection', technical: 'Duplicate detection' },
  navSavings: { simple: 'Savings', technical: 'Savings' },
  navRegistry: { simple: 'National code generation', technical: 'National code generation' },
  // "Code mapping and migration" is two characters too wide for the sidebar at
  // this weight and truncates; the slash buys the room and matches the SAP / ERP
  // row above it.
  navMigration: { simple: 'Code mapping / migration', technical: 'Code mapping / migration' },
  navIntegration: { simple: 'SAP / ERP integration', technical: 'SAP / ERP integration' },
  navImport: { simple: 'Add new data', technical: 'Ingestion' },
  navNormalize: { simple: 'Material standardization', technical: 'Material standardization' },
  navActivity: { simple: 'Audit trail and governance', technical: 'Audit trail and governance' },
  navEngine: { simple: 'Settings', technical: 'Engine configuration' },

  /* ----------------------------------------------------------- page titles */
  dashboardTitle: {
    simple: 'Where things stand',
    technical: 'Material master dashboard and analytics',
  },
  dashboardLead: {
    simple:
      'Everything the system has worked out so far, on one page. Every figure here is counted from the lists that have been loaded.',
    technical:
      'Corpus, matching and consolidation measures over the loaded masters. Headline figures are extrapolated from the inspectable slice and say so.',
  },

  overviewTitle: { simple: 'How this works', technical: 'Guided walkthrough' },
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

  duplicatesTitle: {
    simple: 'Duplicates found',
    technical: 'Duplicate and near-duplicate detection',
  },
  duplicatesLead: {
    simple: 'Pairs the system thinks are the same item. Some need a person to decide.',
    technical: 'Candidate pairs with score breakdown, weight tuning and reviewer decisions.',
  },

  matchTitle: {
    simple: 'Find an item',
    technical: 'AI material matching and recommendation',
  },
  matchLead: {
    simple:
      'Type an item the way your own storekeeper would write it. The answer says whether any company already buys it, and under which national code.',
    technical:
      'One description scored against every loaded master, using the same normalizer, weights and thresholds the batch queue runs on. Ranked candidates with the code each already sits under.',
  },

  migrationTitle: {
    simple: 'Code mapping and migration',
    technical: 'CPSE code mapping and migration support',
  },
  migrationLead: {
    simple:
      'Every code a company uses today, next to the national code it becomes. Take the list away and load it into your own system.',
    technical:
      'Legacy to national crosswalk per organisation, the action each row needs, and a package the receiving ERP can load.',
  },

  integrationTitle: {
    simple: 'SAP / ERP integration',
    technical: 'SAP / ERP integration',
  },
  integrationLead: {
    simple:
      'How each company would hand its item list over from the system it already runs, without anybody retyping anything.',
    technical:
      'Connector design per source system: protocol, endpoint and extract shape for SAP ECC, S/4HANA, Oracle EBS and an in-house master.',
  },

  savingsTitle: { simple: 'Savings', technical: 'Analytics and savings' },
  savingsLead: {
    simple: 'What the country saves by buying the repeats together instead of separately.',
    technical: 'Consolidation model with editable assumptions and a per-step waterfall.',
  },

  registryTitle: {
    simple: 'The national code book',
    technical: 'Common national material code generation',
  },
  registryLead: {
    simple: 'One agreed entry for every item, and what each company calls it.',
    technical: 'Golden records with derivation, legacy mappings and classification references.',
  },

  importTitle: { simple: 'Add a company item list', technical: 'Ingestion' },
  importLead: {
    simple: 'Bring in a new list and see straight away which items already exist elsewhere.',
    technical: 'Upload, map columns, score against the corpus, mint codes for unmatched rows.',
  },

  normalizeTitle: {
    simple: 'Name cleaner',
    technical: 'Material standardization and classification',
  },
  normalizeLead: {
    simple: 'Engineers write in short forms. Every company uses different ones. Type anything and watch it get sorted out.',
    technical: 'Dictionary expansion, attribute slot extraction and canonical signature generation.',
  },

  activityTitle: { simple: 'Activity history', technical: 'Audit trail and governance' },
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
  verdictSame: { simple: 'Exact match', technical: 'Above accept threshold (≥0.85)' },
  verdictReview: { simple: 'Near match', technical: 'Between review and accept (0.65–0.85)' },
  verdictDifferent: { simple: 'Below threshold', technical: 'Below review threshold (<0.65)' },

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
