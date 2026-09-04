/**
 * NUMMF semantic colour contract.
 *
 * Three hues, one meaning each. If a state does not fit one of these, it is
 * neutral ink and rules. Do not introduce a fourth hue.
 */
export const SEMANTIC = Object.freeze({
  accent: Object.freeze({
    token: 'accent',
    classes: Object.freeze(['accent', 'accent-bg', 'accent-edge']),
    meaning:
      'Interaction and identity. Links, active nav, selected rows, primary actions, focus rings.',
    notFor: 'Success, positive results, or decoration.',
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
    classes: Object.freeze(['negative', 'negative-bg']),
    meaning:
      'Rejected or conflicting. Failed validation, rejected proposals, hard schema conflicts.',
    notFor: 'Items merely awaiting review. Use attention for those.',
  }),
} as const)

export type SemanticName = keyof typeof SEMANTIC

type ClassValue = string | false | null | undefined

/** Join class names, dropping falsy values. */
export function cx(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ')
}
