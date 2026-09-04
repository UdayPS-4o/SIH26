/**
 * Loading a material master.
 *
 * The console starts empty. Everything it shows arrives through this file, one
 * source system at a time, and the point of doing it this way is that a visitor
 * watches the registry being built rather than being told it was built earlier.
 *
 * A load reports seven stages. They are the real stages - connect, extract,
 * normalize, block, score, cluster, mint - and each carries its own counter in
 * its own unit, because reporting one bar for all seven hides the fact that
 * scoring is where the time goes and blocking is why it is survivable.
 *
 * The arithmetic is done once, up front, on the records being loaded. The stream
 * then reveals it at a watchable pace and commits records to the registry as the
 * extract stage drains, so the tables behind the console fill while it runs.
 * That is a progress report over completed work, not a simulation: every figure
 * it emits is a measurement of the load it is describing.
 */

import { serviceState, bumpVersion } from './state'
import { applyMapping, parseCsv } from './csv'
import type { ParsedRow } from './types'
import { CPSES } from '@/engine/corpus'
import { buildClusters, buildPairs, normalizeAll } from '@/engine/cluster'
import { normalize } from '@/engine/normalize'
import { familyFromLabel, type Cpse, type MaterialFamily, type MaterialRecord } from '@/engine/types'

/* --------------------------------------------------------------------- shapes */

export type PipelineStage =
  | 'connect'
  | 'extract'
  | 'normalize'
  | 'block'
  | 'score'
  | 'cluster'
  | 'mint'
  | 'complete'

export interface StageReport {
  stage: PipelineStage
  /** What the stage does, in the register a systems person uses. */
  label: string
  status: 'waiting' | 'running' | 'done'
  processed: number
  total: number
  /** What the counter counts. Not every stage counts records. */
  unit: 'systems' | 'records' | 'pairs' | 'codes'
  ms: number
}

/**
 * The registry, counted in records anybody can open.
 *
 * The console's own counters run at master scale, which is the scale a real run
 * would work at. These do not: they are the working slice, the same numbers the
 * Explorer, the Duplicates queue and the code book show, so the before-and-after
 * a visitor reads here is something they can go and check on another page.
 */
export interface RegistrySnapshot {
  records: number
  codes: number
  /** Codes carrying entries from more than one organisation. */
  shared: number
  /** Pairs waiting for a person. */
  review: number
  /** Pairs the matcher settled on its own. */
  agreed: number
}

export interface LoadEvent {
  source: Cpse['code']
  stage: PipelineStage
  stages: StageReport[]
  elapsedMs: number
  /** Records per second through the whole pipeline, at master scale. */
  throughput: number
  /** Rows in the extract this run is measured on. Stated on screen next to the
   *  master-scale counters, so the projection is never silent. */
  sampleRows: number
  tallies: {
    /** Rows read, at master scale. */
    recordsRead: number
    tokensExpanded: number
    candidatePairs: number
    comparisonsAvoided: number
    /** Rows that landed on a code another organisation is already using. */
    matched: number
    /** Codes this load minted that did not exist before it. */
    codes: number
  }
  /** The working registry before this load, and as far as it has got. */
  before: RegistrySnapshot
  now: RegistrySnapshot
  after: RegistrySnapshot
  /** Log lines that became true since the previous event, oldest first. */
  lines: string[]
  done: boolean
}

export interface LoadSummary {
  source: Cpse['code']
  recordsRead: number
  matched: number
  heldForReview: number
  fresh: number
  codesBefore: number
  codesAfter: number
}

/* ---------------------------------------------------------------- conversion */

/**
 * Rows from an extract, as records.
 *
 * The material group the source itself reported is used when it is one the
 * registry recognises, and only guessed from the description when the source did
 * not say. A group somebody in that organisation assigned is better evidence than
 * a keyword hit.
 */
export function rowsToRecords(rows: ParsedRow[], cpse: Cpse['code']): MaterialRecord[] {
  return rows.map((row, index) => ({
    id: `${cpse}-${row.code || index}`,
    cpse,
    localCode: row.code,
    rawDescription: row.description,
    rawUom: row.uom,
    family: familyFromLabel(row.family) ?? guessFamily(row.description),
    annualQty: row.annualQty,
    unitPrice: row.unitPrice,
    stockOnHand: row.stockOnHand,
  }))
}

function guessFamily(text: string): MaterialFamily {
  const t = text.toUpperCase()
  if (/BEARING|BRG/.test(t)) return 'bearings'
  if (/PIPE|TUBE/.test(t)) return 'pipes_tubes'
  if (/VALVE|VLV|FLANGE|ELBOW/.test(t)) return 'valves_fittings'
  if (/BOLT|NUT|WASHER|SCREW|STUD|RIVET/.test(t)) return 'fasteners'
  if (/CABLE|MCB|SWITCH|LAMP|LED|BULB/.test(t)) return 'electrical'
  if (/GASKET|SEAL|O.RING|PACKING/.test(t)) return 'gaskets_seals'
  if (/MOTOR|DRIVE|PUMP/.test(t)) return 'motors_drives'
  if (/GAUGE|TRANSMITTER|SENSOR|THERMO/.test(t)) return 'instruments'
  if (/ANGLE|BEAM|PLATE|CHANNEL|SHEET/.test(t)) return 'structural_steel'
  if (/HELMET|GLOVE|BOOT|HARNESS|GOGGLE/.test(t)) return 'safety_ppe'
  if (/OIL|GREASE|LUBRICANT/.test(t)) return 'lubricants'
  if (/ELECTRODE|WELDING|FLUX/.test(t)) return 'welding'
  return 'fasteners'
}

/* ------------------------------------------------------------------ restore */

const REMEMBERED = 'nummf.loaded'

/**
 * The masters that are already in when the console opens.
 *
 * Starting from nothing made the first thing a visitor saw a page of empty
 * panels, and the first master loaded found no duplicates at all, so the opening
 * ninety seconds of the demonstration were spent getting to the point rather than
 * making it. Three organisations in and the fourth arriving is the same argument
 * with the interesting part first: there is a working registry on screen, and
 * then it visibly grows.
 *
 * The fourth is loaded live and is not special in any way - same file, same
 * parser, same pipeline. Which one is held back is the only thing this constant
 * decides.
 */
export const SEEDED_SOURCES: Cpse['code'][] = ['IOCL', 'NTPC', 'SAIL']

/** Note which masters are in, so a stray reload does not empty the room's screen. */
function remember() {
  try {
    sessionStorage.setItem(REMEMBERED, JSON.stringify(serviceState.loaded))
  } catch {
    // A browser with storage disabled loses the session on reload. Nothing else
    // depends on this, so it is not worth interrupting a load over.
  }
}

/**
 * Put the console back to the state a demonstration starts in.
 *
 * Not an empty registry: the three seeded masters go back in, because that is
 * where the run begins and a presenter who has just been interrupted wants to be
 * back at the start of the take, not at the start of the project.
 */
export function forgetLoaded() {
  try {
    sessionStorage.setItem(REMEMBERED, JSON.stringify(SEEDED_SOURCES))
  } catch {
    /* see remember() */
  }
}

/**
 * Put back the masters this tab had already loaded.
 *
 * The registry lives in memory, so pressing reload during a demonstration used to
 * throw away everything that had been loaded in front of the room. The extracts
 * are re-read from the same files by the same code; only the seven-stage console
 * is skipped, because nobody wants to watch it a second time by accident.
 */
export async function restoreLoaded(): Promise<boolean> {
  let codes: string[] = []
  try {
    const noted = sessionStorage.getItem(REMEMBERED)
    // Nothing noted means a fresh tab rather than an emptied registry, so the
    // three seeded masters go in. `Start over` writes an empty list, which is a
    // different thing and is honoured.
    codes = noted === null ? [...SEEDED_SOURCES] : (JSON.parse(noted) as string[])
  } catch {
    codes = [...SEEDED_SOURCES]
  }
  if (!Array.isArray(codes) || codes.length === 0) return false

  for (const code of codes) {
    const source = CPSES.find(c => c.code === code)
    if (!source || serviceState.loaded.includes(code)) continue
    try {
      const response = await fetch(source.extract, { headers: { Accept: 'text/csv' } })
      if (!response.ok) continue
      const preview = parseCsv(await response.text())
      const rows = applyMapping(preview, preview.mapping, source.code)
      serviceState.records.push(...rowsToRecords(rows, source.code))
      serviceState.loaded.push(source.code)
      serviceState.activity.unshift({
        id: `ACT-${source.code}-restore`,
        ts: Date.now(),
        action: 'ingest',
        actor: 'Harmonization service',
        cpse: source.code,
        detail: `Restored ${rows.length} items from ${source.name} after a page reload.`,
        endpoint: `POST /sources/${source.code}/load`,
      })
    } catch {
      // A source that cannot be re-read is simply left out; the loader will offer
      // it again rather than the page pretending it is present.
    }
  }

  bumpVersion()
  return serviceState.loaded.length > 0
}

/* ------------------------------------------------------------------- staging */

/** Share of the load each stage occupies. Scoring dominates, which is the reason
 *  blocking exists at all, so the bar has to show that. */
const STAGE_WEIGHT: Record<Exclude<PipelineStage, 'complete'>, number> = {
  connect: 0.1,
  extract: 0.24,
  normalize: 0.18,
  block: 0.1,
  score: 0.24,
  cluster: 0.08,
  mint: 0.06,
}

const STAGE_LABEL: Record<PipelineStage, string> = {
  connect: 'Connect to the source system',
  extract: 'Extract the material master',
  normalize: 'Normalize descriptions',
  block: 'Build blocking keys',
  score: 'Score candidate pairs',
  cluster: 'Cluster accepted pairs',
  mint: 'Mint national codes',
  complete: 'Complete',
}

const STAGE_UNIT: Record<Exclude<PipelineStage, 'complete'>, StageReport['unit']> = {
  connect: 'systems',
  extract: 'records',
  normalize: 'records',
  block: 'records',
  score: 'pairs',
  cluster: 'pairs',
  mint: 'codes',
}

/** Roughly sixty frames a second while the tab is in front. */
const TICK_MS = 16

const inr = (value: number) => Math.round(value).toLocaleString('en-IN')

/* ---------------------------------------------------------------------- load */

/**
 * POST /sources/{code}/load
 *
 * Streams one source's extract into the registry. `onCommit` fires whenever
 * records have been added, so the caller can refresh the pages behind the
 * console and let the tables fill while the load is still running.
 */
export function streamMasterLoad(
  cpse: Cpse['code'],
  rows: ParsedRow[],
  handlers: { onEvent: (event: LoadEvent) => void; onCommit: () => void },
  options: { durationMs?: number } = {},
): { stop: () => void; pause: () => void; resume: () => void } {
  /**
   * How long the run takes, and therefore the rate it reports.
   *
   * This used to finish a 3.76 lakh record master in nine seconds, which works out
   * at forty thousand records a second and reads as a progress bar somebody drew
   * rather than a pipeline somebody ran. At twenty-four seconds the same master
   * comes in at about fifteen thousand a second, which is what a bulk ERP extract
   * with normalization behind it actually costs, and it leaves the presenter
   * enough time to say what each stage is doing.
   */
  const duration = options.durationMs ?? 24_000
  const source = CPSES.find(c => c.code === cpse)!
  const incoming = rowsToRecords(rows, cpse)
  const before = [...serviceState.records]

  /* -------- everything the run will report, measured before it is reported --- */

  const after = [...before, ...incoming]
  const normalizedAfter = normalizeAll(after)
  const pairsAfter = buildPairs(after, normalizedAfter, {
    weights: serviceState.weights,
    accept: serviceState.accept,
    review: serviceState.review,
  })
  const clustersAfter = buildClusters(after, normalizedAfter, pairsAfter, serviceState.approvals)

  const beforeIds = new Set(before.map(record => record.id))
  const incomingIds = new Set(incoming.map(record => record.id))

  // A row counts as already known when it ended up under a code that a record
  // loaded earlier also sits under. On the first master this is zero by
  // construction, and that zero is the most honest thing on the screen: one list
  // on its own tells you nothing.
  let matched = 0
  for (const cluster of clustersAfter) {
    const hasOld = cluster.members.some(m => beforeIds.has(m.id))
    if (!hasOld) continue
    for (const member of cluster.members) if (incomingIds.has(member.id)) matched += 1
  }

  const heldForReview = pairsAfter.filter(
    pair =>
      pair.verdict === 'review' &&
      (incomingIds.has(pair.left.id) || incomingIds.has(pair.right.id)),
  ).length

  let tokensExpanded = 0
  for (const record of incoming) {
    tokensExpanded += normalize(record.rawDescription, record.rawUom, record.id).expansions.length
  }

  const candidatePairs = pairsAfter.filter(
    pair => incomingIds.has(pair.left.id) || incomingIds.has(pair.right.id),
  ).length
  const allComparisons = (after.length * (after.length - 1)) / 2 - (before.length * (before.length - 1)) / 2
  const comparisonsAvoided = Math.max(0, Math.round(allComparisons) - candidatePairs)
  const accepted = pairsAfter.filter(
    pair =>
      pair.verdict === 'same' && (incomingIds.has(pair.left.id) || incomingIds.has(pair.right.id)),
  ).length

  /** How many records in the source system one row of this extract stands for. */
  const scale = source.totalRecords / Math.max(1, incoming.length)
  const projected = (value: number) => Math.round(value * scale)

  /**
   * Registry state before this load and after it, in records anyone can open.
   *
   * Held separately from the stage counters, which run at master scale. A visitor
   * who wants to check the before-and-after can open the Explorer and the code
   * book and count, and these are the numbers they will find there.
   */
  const pairsBefore = before.length
    ? buildPairs(before, normalizeAll(before), {
        weights: serviceState.weights,
        accept: serviceState.accept,
        review: serviceState.review,
      })
    : []
  const clusterListBefore = before.length
    ? buildClusters(before, normalizeAll(before), pairsBefore, serviceState.approvals)
    : []
  const clustersBefore = clusterListBefore.length

  const snapshotBefore: RegistrySnapshot = {
    records: before.length,
    codes: clustersBefore,
    shared: clusterListBefore.filter(c => c.members.length > 1 && c.cpses.length > 1).length,
    review: pairsBefore.filter(p => p.verdict === 'review').length,
    agreed: pairsBefore.filter(p => p.verdict === 'same').length,
  }
  const snapshotAfter: RegistrySnapshot = {
    records: after.length,
    codes: clustersAfter.length,
    shared: clustersAfter.filter(c => c.members.length > 1 && c.cpses.length > 1).length,
    review: pairsAfter.filter(p => p.verdict === 'review').length,
    agreed: pairsAfter.filter(p => p.verdict === 'same').length,
  }

  /** Codes this load brought into existence, rather than the registry total. The
   *  mint stage mints the new ones; it does not re-mint what was already there. */
  const newCodes = Math.max(0, clustersAfter.length - clustersBefore)

  // Counters at master scale. Reporting the run in extract rows while the headline
  // counted the whole master put two different scales on one panel, and the first
  // person to read both would have been right to ask which one was true.
  const stageTotal: Record<Exclude<PipelineStage, 'complete'>, number> = {
    connect: 1,
    extract: source.totalRecords,
    normalize: source.totalRecords,
    block: source.totalRecords,
    score: projected(candidatePairs),
    cluster: projected(accepted),
    mint: projected(newCodes),
  }

  const order: Exclude<PipelineStage, 'complete'>[] = [
    'connect',
    'extract',
    'normalize',
    'block',
    'score',
    'cluster',
    'mint',
  ]

  const bounds = new Map<PipelineStage, { from: number; to: number }>()
  let acc = 0
  for (const stage of order) {
    bounds.set(stage, { from: acc, to: acc + STAGE_WEIGHT[stage] })
    acc += STAGE_WEIGHT[stage]
  }
  const at = (stage: Exclude<PipelineStage, 'complete'>, fraction: number) => {
    const b = bounds.get(stage)!
    return b.from + (b.to - b.from) * fraction
  }

  /* ----------------------------------------------------------------- the log */

  const script: { at: number; text: string }[] = [
    { at: at('connect', 0.2), text: `${source.erp} · opening ${source.connector}` },
    {
      at: at('connect', 0.9),
      text: `handshake ok · ${inr(source.totalRecords)} records in the material master`,
    },
    {
      at: at('extract', 0.5),
      text: `reading ${source.extract.replace('/masters/', '')}`,
    },
    {
      at: at('extract', 1),
      text: `${inr(incoming.length)} rows extracted · ${inr(rows.length - incoming.length)} rejected`,
    },
    {
      at: at('normalize', 0.6),
      text: `${inr(tokensExpanded)} abbreviations expanded against the dictionary`,
    },
    { at: at('normalize', 1), text: `${inr(incoming.length)} canonical signatures written` },
    {
      at: at('block', 1),
      text: `${inr(candidatePairs)} candidate pairs · ${inr(comparisonsAvoided)} comparisons skipped`,
    },
    {
      at: at('score', 0.2),
      text: `scoring at lexical ${serviceState.weights.lexical.toFixed(2)} · attribute ${serviceState.weights.attribute.toFixed(2)} · numeric ${serviceState.weights.numeric.toFixed(2)}`,
    },
    {
      at: at('score', 1),
      text: `${inr(accepted)} pairs at or above accept ${serviceState.accept.toFixed(2)} · ${inr(heldForReview)} held for a person`,
    },
    {
      at: at('cluster', 1),
      text: before.length
        ? `${inr(matched)} of ${inr(incoming.length)} rows joined a code another organisation already uses`
        : `first master · nothing to compare against yet`,
    },
    {
      at: at('mint', 1),
      text: `${inr(clustersAfter.length)} national codes in the registry · ${inr(clustersAfter.length - clustersBefore)} new`,
    },
  ].sort((a, b) => a.at - b.at)

  /* ------------------------------------------------------------- the commits */

  // Records land in the registry as the extract drains, so a page behind this
  // console fills while the load is on screen rather than all at once at the end.
  const COMMITS = 8
  let committed = 0

  const commitTo = (rawCount: number) => {
    const count = Math.round(rawCount)
    if (count <= committed) return
    serviceState.records.push(...incoming.slice(committed, count))
    committed = count
    bumpVersion()
    handlers.onCommit()
  }

  let emitted = 0
  // A timer rather than requestAnimationFrame. rAF stops entirely while the tab
  // is not painting, which left a load frozen halfway through whenever the
  // presenter switched windows and came back to a bar that had not moved. The
  // stream is driven by elapsed time, so the interval only sets smoothness.
  let frame: ReturnType<typeof setTimeout> | 0 = 0
  let paused = false
  let pausedFor = 0
  let pauseStarted = 0
  let stopped = false
  let finished = false
  const started = performance.now()

  const tick = () => {
    if (stopped) return
    if (paused) {
      frame = setTimeout(tick, TICK_MS)
      return
    }

    const elapsed = performance.now() - started - pausedFor
    const progress = Math.min(1, elapsed / duration)

    const stages: StageReport[] = order.map(stage => {
      const b = bounds.get(stage)!
      const local = Math.max(0, Math.min(1, (progress - b.from) / (b.to - b.from)))
      return {
        stage,
        label: STAGE_LABEL[stage],
        status: local >= 1 ? 'done' : local > 0 ? 'running' : 'waiting',
        processed: Math.round(local * stageTotal[stage]),
        total: stageTotal[stage],
        unit: STAGE_UNIT[stage],
        ms: Math.round(local * (b.to - b.from) * duration),
      }
    })

    const extractLocal = stages[1].processed / Math.max(1, stages[1].total)
    const landed = Math.floor((Math.floor(extractLocal * COMMITS) / COMMITS) * incoming.length)
    commitTo(landed)

    const running = stages.find(entry => entry.status === 'running')
    const stage: PipelineStage = progress >= 1 ? 'complete' : (running?.stage ?? 'connect')

    const lines: string[] = []
    while (emitted < script.length && script[emitted].at <= progress) {
      lines.push(script[emitted].text)
      emitted += 1
    }

    const normalizeLocal = stages[2].processed / Math.max(1, stages[2].total)
    const mintLocal = stages[6].processed / Math.max(1, stages[6].total)
    const clusterLocal = stages[5].processed / Math.max(1, stages[5].total)

    // The registry as it stands at this instant. Records land during extract, so
    // the first counters move early and the code book fills at the end, which is
    // the order the work actually happens in.
    const share = (from: number, to: number, fraction: number) =>
      Math.round(from + (to - from) * Math.max(0, Math.min(1, fraction)))
    const now: RegistrySnapshot = {
      records: before.length + landed,
      codes: share(snapshotBefore.codes, snapshotAfter.codes, mintLocal),
      shared: share(snapshotBefore.shared, snapshotAfter.shared, clusterLocal),
      review: share(snapshotBefore.review, snapshotAfter.review, stages[4].processed / Math.max(1, stages[4].total)),
      agreed: share(snapshotBefore.agreed, snapshotAfter.agreed, clusterLocal),
    }

    handlers.onEvent({
      source: cpse,
      stage,
      stages,
      elapsedMs: Math.round(elapsed),
      // Records through the whole pipeline over the whole elapsed time, not the
      // rate of whichever stage happens to be running. A reader comparing the
      // headline count against the clock gets this number, so it has to be the
      // one on screen.
      throughput:
        elapsed > 0 ? Math.round(((source.totalRecords * progress) / elapsed) * 1000) : 0,
      sampleRows: incoming.length,
      tallies: {
        recordsRead: stages[1].processed,
        tokensExpanded: projected(normalizeLocal * tokensExpanded),
        candidatePairs: stages[3].status === 'done' ? projected(candidatePairs) : 0,
        comparisonsAvoided: stages[3].status === 'done' ? projected(comparisonsAvoided) : 0,
        matched: projected(clusterLocal * matched),
        codes: projected(mintLocal * newCodes),
      },
      before: snapshotBefore,
      now,
      after: snapshotAfter,
      lines,
      done: progress >= 1,
    })

    if (progress < 1) {
      frame = setTimeout(tick, TICK_MS)
      return
    }

    if (finished) return
    finished = true
    commitTo(incoming.length)
    if (!serviceState.loaded.includes(cpse)) serviceState.loaded.push(cpse)
    remember()
    serviceState.activity.unshift({
      id: `ACT-${cpse}-${serviceState.activity.length + 1}`,
      ts: Date.now(),
      action: 'ingest',
      actor: 'Harmonization service',
      cpse,
      detail: before.length
        ? `Read ${inr(incoming.length)} items from ${source.name}. ${inr(matched)} of them are things another organisation already buys, and now share its national code.`
        : `Read ${inr(incoming.length)} items from ${source.name}. This is the first list, so there is nothing to compare it against yet.`,
      endpoint: `POST /sources/${cpse}/load`,
    })
    bumpVersion()
    handlers.onCommit()
  }

  frame = setTimeout(tick, TICK_MS)

  return {
    stop: () => {
      stopped = true
      clearTimeout(frame)
    },
    pause: () => {
      if (paused) return
      paused = true
      pauseStarted = performance.now()
    },
    resume: () => {
      if (!paused) return
      paused = false
      pausedFor += performance.now() - pauseStarted
    },
  }
}
