// Deterministic mock data for the Worker Hygiene module.
// Uses its own seeded PRNG (same mulberry32 algorithm as mockData.js, different
// seed) so this file has no coupling to mockData.js's `rand` instance — only a
// read-only import of SHEDS for shed metadata / risk linkage.

import { SHEDS } from './mockData'

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(74091133)
const between = (min, max, dp = 0) => {
  const v = min + rand() * (max - min)
  return dp === 0 ? Math.round(v) : Number(v.toFixed(dp))
}

export const HYGIENE_THRESHOLD = 70

export const CHECKLIST_ITEMS = [
  { key: 'handwash', label: 'Handwashing before milking' },
  { key: 'gloves', label: 'Glove usage during milking' },
  { key: 'preDip', label: 'Teat / udder pre-dip cleaning' },
  { key: 'postDip', label: 'Teat post-dip disinfection' },
  { key: 'uniform', label: 'Clean uniform / apron' },
  { key: 'milkingOrder', label: 'Milking-order discipline (affected animals last)' },
]

const DAY_LABELS = (() => {
  const base = new Date('2026-09-04T08:00:00')
  const arr = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    arr.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }))
  }
  return arr
})()

function historyFor(score) {
  // 7-day daily score wobbling toward the current (latest) score
  const start = score - between(6, 16)
  return DAY_LABELS.map((date, i) => {
    const p = i / (DAY_LABELS.length - 1)
    const v = start + (score - start) * p + (rand() - 0.5) * 6
    return { date, compliance: Math.max(10, Math.min(100, Math.round(v))) }
  })
}

function checklistFor(complianceScore) {
  // Roughly (complianceScore / 100) of items compliant, biased deterministically.
  const targetCompliant = Math.round((complianceScore / 100) * CHECKLIST_ITEMS.length)
  return CHECKLIST_ITEMS.map((item, i) => ({
    ...item,
    compliant: i < targetCompliant ? rand() > 0.08 : rand() > 0.72,
  }))
}

// Curated so the story lines up with shed risk levels in mockData.js:
// Shed C (HIGH risk) gets the weakest hygiene compliance, Shed A (LOW risk)
// gets the strongest — illustrating the worker-hygiene -> mastitis-risk link.
const CURATED = [
  { id: 'WKR-101', name: 'Ramesh Yadav', role: 'Milker', shed: 'C', complianceScore: 42 },
  { id: 'WKR-102', name: 'Suresh Prajapati', role: 'Herd Attendant', shed: 'C', complianceScore: 57 },
  { id: 'WKR-103', name: 'Anita Devi', role: 'Milker', shed: 'B', complianceScore: 66 },
  { id: 'WKR-104', name: 'Vikram Singh', role: 'Milker', shed: 'B', complianceScore: 81 },
  { id: 'WKR-105', name: 'Meena Kumari', role: 'Shed Supervisor', shed: 'A', complianceScore: 94 },
  { id: 'WKR-106', name: 'Ajay Verma', role: 'Milker', shed: 'A', complianceScore: 88 },
  { id: 'WKR-107', name: 'Sunita Sharma', role: 'Herd Attendant', shed: 'D', complianceScore: 90 },
  { id: 'WKR-108', name: 'Deepak Rathore', role: 'Milker', shed: 'D', complianceScore: 63 },
]

export const WORKERS = CURATED.map((w) => ({
  ...w,
  checklist: checklistFor(w.complianceScore),
  history: historyFor(w.complianceScore),
}))

export function getWorker(id) {
  return WORKERS.find((w) => w.id === id)
}

// ---- Aggregates -------------------------------------------------------------

export const WORKER_STATS = (() => {
  const avgCompliance = Math.round(WORKERS.reduce((s, w) => s + w.complianceScore, 0) / WORKERS.length)
  const belowThreshold = WORKERS.filter((w) => w.complianceScore < HYGIENE_THRESHOLD).length
  const shedIds = [...new Set(WORKERS.map((w) => w.shed))]
  const shedsAtRisk = shedIds.filter((id) => {
    const ws = WORKERS.filter((w) => w.shed === id)
    const avg = ws.reduce((s, w) => s + w.complianceScore, 0) / ws.length
    return avg < HYGIENE_THRESHOLD
  })
  return { avgCompliance, belowThreshold, shedsAtRiskCount: shedsAtRisk.length, shedsAtRisk }
})()

export const SHED_HYGIENE = SHEDS.map((s) => {
  const ws = WORKERS.filter((w) => w.shed === s.id)
  const avg = ws.length ? Math.round(ws.reduce((sum, w) => sum + w.complianceScore, 0) / ws.length) : null
  return { ...s, hygieneAvg: avg, workerCount: ws.length }
})

// Herd-wide average daily hygiene compliance trend (last 7 days)
export const HYGIENE_TREND = DAY_LABELS.map((date, i) => {
  const avg = Math.round(WORKERS.reduce((s, w) => s + w.history[i].compliance, 0) / WORKERS.length)
  return { date, compliance: avg }
})
