/**
 * Service-side state.
 *
 * Held here rather than in a React store so that pages cannot reach past the API
 * and read it directly. A page asks an endpoint; the endpoint reads this. That
 * separation is what makes the live-mode swap a configuration change instead of a
 * rewrite.
 */

import { DEFAULT_ACCEPT, DEFAULT_REVIEW, DEFAULT_WEIGHTS } from '@/engine/score'
import { DEFAULT_SAVINGS } from '@/engine/savings'
import type { DictionaryRule } from '@/engine/dictionary'
import type { ActivityEntry, MaterialRecord, ReviewStatus, SavingsInputs, ScoringWeights } from '@/engine/types'

export interface ServiceState {
  weights: ScoringWeights
  accept: number
  review: number
  savings: SavingsInputs
  /** Human decisions, keyed by pair id. These override the score. */
  approvals: Map<string, Exclude<ReviewStatus, 'pending'>>
  /** Rules added at runtime from the Engine page. */
  extraRules: DictionaryRule[]
  /**
   * Every record the registry holds.
   *
   * Empty until somebody loads a material master. The application ships with no
   * data inside it: there is no seeded corpus behind these records that a page
   * could quietly fall back to, so a number on screen is either something that
   * was loaded in front of the room or it is nothing.
   */
  records: MaterialRecord[]
  /** Sources whose extract has been read, in the order they were read. */
  loaded: string[]
  activity: ActivityEntry[]
  operator: string
}

export const serviceState: ServiceState = {
  weights: { ...DEFAULT_WEIGHTS },
  accept: DEFAULT_ACCEPT,
  review: DEFAULT_REVIEW,
  savings: { ...DEFAULT_SAVINGS },
  approvals: new Map(),
  extraRules: [],
  records: [],
  loaded: [],
  activity: [],
  operator: 'A. Deshmukh',
}

/** Bumped on every mutation. The React store watches this to know when its cached
 *  responses are stale. */
let version = 0
const watchers = new Set<(v: number) => void>()

export function bumpVersion() {
  version += 1
  for (const watcher of watchers) watcher(version)
}

export function getVersion() {
  return version
}

export function watchVersion(fn: (v: number) => void): () => void {
  watchers.add(fn)
  return () => {
    watchers.delete(fn)
  }
}

export function resetService() {
  serviceState.weights = { ...DEFAULT_WEIGHTS }
  serviceState.accept = DEFAULT_ACCEPT
  serviceState.review = DEFAULT_REVIEW
  serviceState.savings = { ...DEFAULT_SAVINGS }
  serviceState.approvals = new Map()
  serviceState.extraRules = []
  serviceState.records = []
  serviceState.loaded = []
  serviceState.activity = []
  bumpVersion()
}
