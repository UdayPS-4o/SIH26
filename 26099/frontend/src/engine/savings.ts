/**
 * Savings model.
 *
 * Four steps, three of them driven by an assumption the visitor can edit. The point
 * of this file is that the rupee figure on the Savings page is arithmetic anyone can
 * follow and disagree with, rather than a constant chosen because it sounded large.
 */

import type { SavingsInputs, SavingsResult } from './types'

export const DEFAULT_SAVINGS: SavingsInputs = {
  // Not every duplicate can be consolidated. Contracts run to term, plants have
  // qualified vendors, and some duplication is deliberate redundancy.
  consolidatableShare: 0.22,
  avgAnnualSpendPerItem: 66000,
  // Volume discount achievable when four organisations tender one line instead of four.
  bulkDiscount: 0.088,
}

export const CRORE = 10_000_000
export const LAKH = 100_000
/** One lakh crore. Needed once the run starts reporting pairwise comparisons,
 *  which run to twelve digits and are unreadable in any other unit. */
export const LAKH_CRORE = LAKH * CRORE

export function computeSavings(duplicateLineItems: number, inputs: SavingsInputs): SavingsResult {
  const consolidatableItems = Math.round(duplicateLineItems * inputs.consolidatableShare)
  const addressableSpend = consolidatableItems * inputs.avgAnnualSpendPerItem
  const annualSaving = addressableSpend * inputs.bulkDiscount

  return {
    duplicateLineItems,
    consolidatableItems,
    addressableSpend,
    annualSaving,
    steps: [
      {
        label: 'Duplicate line items found',
        assumption: 'Records that resolved into a group with at least one other record',
        value: duplicateLineItems,
        unit: 'count',
      },
      {
        label: 'Realistically consolidatable',
        assumption: `${pct(inputs.consolidatableShare)} of duplicates, allowing for running contracts and qualified vendors`,
        value: consolidatableItems,
        unit: 'count',
      },
      {
        label: 'Addressable annual spend',
        assumption: `${formatRupees(inputs.avgAnnualSpendPerItem)} average annual spend per item`,
        value: addressableSpend,
        unit: 'rupees',
      },
      {
        label: 'Saving from joint tendering',
        assumption: `${pct(inputs.bulkDiscount)} discount on the consolidated volume`,
        value: annualSaving,
        unit: 'rupees',
      },
    ],
  }
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

/** Indian numbering. The audience reads lakh and crore, not K and M. */
export function formatRupees(value: number): string {
  // Past a lakh crore, "Rs 528557.1 crore" is a number nobody can read. Keep going
  // up the scale rather than printing six figures of crores.
  if (value >= LAKH_CRORE) return `Rs ${(value / LAKH_CRORE).toFixed(2)} lakh crore`
  if (value >= CRORE) return `Rs ${(value / CRORE).toFixed(1)} crore`
  if (value >= LAKH) return `Rs ${(value / LAKH).toFixed(1)} lakh`
  return `Rs ${Math.round(value).toLocaleString('en-IN')}`
}

/** Like formatCount, but it keeps going past crore instead of printing six-figure
 *  crores. */
export function formatScale(value: number): string {
  if (value >= LAKH_CRORE) return `${(value / LAKH_CRORE).toFixed(2)} lakh crore`
  if (value >= CRORE) return `${(value / CRORE).toFixed(2)} crore`
  if (value >= LAKH) return `${(value / LAKH).toFixed(2)} lakh`
  return Math.round(value).toLocaleString('en-IN')
}

export function formatCount(value: number): string {
  if (value >= CRORE) return `${(value / CRORE).toFixed(2)} crore`
  if (value >= LAKH) return `${(value / LAKH).toFixed(2)} lakh`
  return value.toLocaleString('en-IN')
}

/** Grouped Indian digits, for places where the exact figure matters more than scale. */
export function formatExact(value: number): string {
  return Math.round(value).toLocaleString('en-IN')
}
