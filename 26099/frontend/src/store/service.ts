/**
 * The store every page reads from.
 *
 * Pages do not call the API directly for shared data: they read from here and call
 * actions, which keeps one set of proposals, clusters and counts in play across the
 * whole application. A page that needs something no other page needs (a one-off
 * normalize, a derivation lookup) may call `@/api/endpoints` itself.
 */

import { create } from 'zustand'
import * as api from '@/api/endpoints'
import type { RequestMeta } from '@/api/client'
import { resetService, serviceState } from '@/api/state'
import { rebalance } from '@/engine/score'
import { computeSavings } from '@/engine/savings'
import type { DictionaryRule } from '@/engine/dictionary'
import type {
  ActivityEntry,
  Cluster,
  MatchPair,
  MaterialRecord,
  SavingsInputs,
  SavingsResult,
  ScoringWeights,
} from '@/engine/types'

interface ServiceStore {
  ready: boolean
  loading: boolean
  error: string | null

  weights: ScoringWeights
  accept: number
  review: number
  savingsInputs: SavingsInputs

  records: MaterialRecord[]
  pairs: MatchPair[]
  clusters: Cluster[]
  activity: ActivityEntry[]
  dashboard: api.DashboardResponse | null
  savings: SavingsResult | null
  counts: { same: number; review: number; different: number }
  health: { records: number; distinctCodes: number; duplicateRecords: number; largestCluster: number; crossCpseClusters: number; clustersWithDuplicates: number } | null

  /** Latency and endpoint of the most recent call, keyed by a short label so a
   *  panel can print the call that produced what it is showing. */
  lastCall: Record<string, RequestMeta>

  /** Human decisions by pair id. */
  decisions: Record<string, 'approved' | 'rejected'>

  bootstrap: () => Promise<void>
  refresh: () => Promise<void>
  setWeight: (key: keyof ScoringWeights, value: number) => Promise<void>
  setThresholds: (accept: number, review: number) => Promise<void>
  decide: (pair: MatchPair, action: 'approved' | 'rejected') => Promise<void>
  decideMany: (pairs: MatchPair[], action: 'approved' | 'rejected') => Promise<void>
  setSavings: (inputs: SavingsInputs) => Promise<void>
  addRule: (rule: DictionaryRule) => Promise<void>
  importRows: (rows: api.ParsedRow[], org: string) => Promise<api.IngestRunResponse>
  reset: () => Promise<void>
}

/**
 * Which refresh is the newest one asked for.
 *
 * A load commits records eight times as its extract drains and refreshes after
 * each, so several refreshes are in flight at once and they do not come back in
 * the order they were sent. Without this, a slow early response lands after the
 * final one and puts the console back to a state that is no longer true - the
 * visible symptom was a source finishing its load and still showing as unloaded.
 */
let refreshSeq = 0

export const useService = create<ServiceStore>((set, get) => ({
  ready: false,
  loading: false,
  error: null,

  weights: { ...serviceState.weights },
  accept: serviceState.accept,
  review: serviceState.review,
  savingsInputs: { ...serviceState.savings },

  records: [],
  pairs: [],
  clusters: [],
  activity: [],
  dashboard: null,
  savings: null,
  counts: { same: 0, review: 0, different: 0 },
  health: null,
  lastCall: {},
  decisions: {},

  bootstrap: async () => {
    if (get().ready || get().loading) return
    set({ loading: true })
    // A reload during a demonstration used to empty the screen. Masters this tab
    // had already read are put back from the same files before anything renders.
    await api.restoreLoaded()
    await get().refresh()
    set({ ready: true, loading: false })
  },

  refresh: async () => {
    refreshSeq += 1
    const mine = refreshSeq
    try {
      const [materials, proposals, registry, dashboard, activity] = await Promise.all([
        api.fetchMaterials(),
        api.fetchProposals(),
        api.fetchRegistry(),
        api.fetchDashboard(),
        api.fetchActivity(),
      ])

      if (mine !== refreshSeq) return

      const inputs = get().savingsInputs
      const savings = computeSavings(dashboard.data.duplicateRecords, inputs)

      set({
        records: materials.data.records,
        pairs: proposals.data.pairs,
        counts: proposals.data.counts,
        clusters: registry.data.clusters,
        health: registry.data.health,
        dashboard: dashboard.data,
        activity: activity.data.entries,
        savings,
        weights: proposals.data.weights,
        accept: proposals.data.accept,
        review: proposals.data.review,
        decisions: Object.fromEntries(serviceState.approvals),
        error: null,
        lastCall: {
          ...get().lastCall,
          materials: materials.meta,
          proposals: proposals.meta,
          registry: registry.meta,
          dashboard: dashboard.meta,
          activity: activity.meta,
        },
      })
    } catch (error) {
      if (mine !== refreshSeq) return
      set({ error: error instanceof Error ? error.message : 'The harmonization service did not respond.' })
    }
  },

  setWeight: async (key, value) => {
    const next = rebalance(get().weights, key, value)
    set({ weights: next })
    await api.updateWeights(next)
    await get().refresh()
  },

  setThresholds: async (accept, review) => {
    set({ accept, review })
    await api.updateThresholds(accept, review)
    await get().refresh()
  },

  decide: async (pair, action) => {
    const summary =
      action === 'approved'
        ? `Confirmed that ${pair.left.cpse}'s "${pair.left.rawDescription}" and ${pair.right.cpse}'s "${pair.right.rawDescription}" are the same item.`
        : `Marked ${pair.left.cpse}'s "${pair.left.rawDescription}" and ${pair.right.cpse}'s "${pair.right.rawDescription}" as different items.`

    set(state => ({ decisions: { ...state.decisions, [pair.id]: action } }))
    await api.reviewPair(pair.id, action, summary, pair.proposedCode)
    await get().refresh()
  },

  decideMany: async (pairs, action) => {
    set(state => ({
      decisions: {
        ...state.decisions,
        ...Object.fromEntries(pairs.map(p => [p.id, action])),
      },
    }))
    for (const pair of pairs) {
      const summary =
        action === 'approved'
          ? `Confirmed ${pair.left.cpse} and ${pair.right.cpse} are buying the same item.`
          : `Marked ${pair.left.cpse} and ${pair.right.cpse} entries as different items.`
      await api.reviewPair(pair.id, action, summary, pair.proposedCode)
    }
    await get().refresh()
  },

  setSavings: async inputs => {
    set({ savingsInputs: inputs })
    const duplicates = get().dashboard?.duplicateRecords ?? 0
    const result = await api.computeSavingsFor(duplicates, inputs)
    set({ savings: result.data, lastCall: { ...get().lastCall, savings: result.meta } })
  },

  addRule: async rule => {
    await api.addDictionaryRule(rule)
    await get().refresh()
  },

  importRows: async (rows, org) => {
    const result = await api.runIngest(rows, org)
    set({ lastCall: { ...get().lastCall, ingest: result.meta } })
    await get().refresh()
    return result.data
  },

  reset: async () => {
    api.forgetLoaded()
    resetService()
    // Back to the three seeded masters, not to nothing. This is the button a
    // presenter presses between takes.
    await api.restoreLoaded()
    set({
      weights: { ...serviceState.weights },
      accept: serviceState.accept,
      review: serviceState.review,
      savingsInputs: { ...serviceState.savings },
      decisions: {},
    })
    await get().refresh()
  },
}))
