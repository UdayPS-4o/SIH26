/**
 * CodeOne semantic colour contract.
 *
 * One meaning each. If a state does not fit one of these, it is neutral ink
 * and rules. Do not introduce a new semantic hue casually; extend this table
 * instead so the meaning is documented once.
 */
export const SEMANTIC = Object.freeze({
  accent: Object.freeze({
    token: 'accent',
    classes: Object.freeze(['accent', 'accent-bg', 'accent-edge']),
    meaning: 'Brand identity. Headings, links, active nav, focus rings.',
    notFor: 'Buttons (use primary), success, or decoration.',
  }),
  primary: Object.freeze({
    token: 'primary',
    classes: Object.freeze(['primary', 'primary-bg', 'primary-edge', 'primary-ink']),
    meaning: 'Interaction. Primary buttons, calls to action, selected controls.',
    notFor: 'Headings or static identity marks. Use accent for those.',
  }),
  attention: Object.freeze({
    token: 'attention',
    classes: Object.freeze(['attention', 'attention-bg', 'attention-edge']),
    meaning:
      'Needs a human decision. Review queue items, low-confidence matches, unresolved duplicates.',
    notFor: 'Generic warnings, errors, or anything already resolved.',
  }),
  negative: Object.freeze({
    token: 'negative',
    classes: Object.freeze(['negative', 'negative-bg', 'negative-edge']),
    meaning:
      'Rejected or conflicting. Failed validation, rejected proposals, hard schema conflicts.',
    notFor: 'Items merely awaiting review. Use attention for those.',
  }),
  positive: Object.freeze({
    token: 'positive',
    classes: Object.freeze(['positive', 'positive-bg', 'positive-edge']),
    meaning: 'Matched, accepted, or succeeded. A pair confirmed as the same item.',
    notFor: 'Anything still pending a decision. Use attention for those.',
  }),
  info: Object.freeze({
    token: 'info',
    classes: Object.freeze(['info', 'info-bg', 'info-edge']),
    meaning:
      'Secondary counterpoint, used sparingly: a second data series, a technical-mode accent.',
    notFor: 'Anything load-bearing on its own. It never carries a decision by itself.',
  }),
} as const)

export type SemanticName = keyof typeof SEMANTIC

/**
 * Categorical palette for chart series that carry no inherent meaning (e.g.
 * "this bar is IOCL, that one is NTPC"). Deliberately kept separate from
 * SEMANTIC: a chart may assign chart-3 to a CPSE that has nothing to do with
 * "positive". Do not reuse these tokens for anything with a fixed meaning.
 */
export const CHART_PALETTE = Object.freeze([
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
  'chart-6',
] as const)

export type ChartColorToken = (typeof CHART_PALETTE)[number]

type ClassValue = string | false | null | undefined

/** Join class names, dropping falsy values. */
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
