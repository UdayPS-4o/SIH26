// Deterministic mock data for MastiGuard AI prototype.
// A tiny seeded PRNG keeps values stable across renders/reloads.

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20260904)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (min, max, dp = 0) => {
  const v = min + rand() * (max - min)
  return dp === 0 ? Math.round(v) : Number(v.toFixed(dp))
}

export const FARMS = ['Shree Dairy Farm', 'Gokul Cooperative Unit 3', 'Amrit Pashupalan Kendra']

export const SHEDS = [
  { id: 'A', name: 'Shed A', risk: 12, level: 'LOW', animals: 34 },
  { id: 'B', name: 'Shed B', risk: 48, level: 'MODERATE', animals: 31 },
  { id: 'C', name: 'Shed C', risk: 71, level: 'HIGH', animals: 33 },
  { id: 'D', name: 'Shed D', risk: 16, level: 'LOW', animals: 30 },
]

const BREEDS = ['Murrah', 'Gir', 'Sahiwal', 'Holstein Friesian', 'Jersey', 'Crossbred']
const SPECIES = { Murrah: 'Buffalo', Gir: 'Cow', Sahiwal: 'Cow', 'Holstein Friesian': 'Cow', Jersey: 'Cow', Crossbred: 'Cow' }

function riskLevelFromScore(s) {
  if (s >= 70) return 'HIGH'
  if (s >= 45) return 'MODERATE'
  if (s >= 20) return 'LOW'
  return 'NONE'
}

// Curated leading animals so the demo story matches task.md
const CURATED = [
  { id: 'BUF-042', breed: 'Murrah', age: 6, lactation: 3, milkYield: 6.1, scc: 420, activity: -18, rumination: -15, temperature: 39.9, previousMastitis: true, riskScore: 87, shed: 'C', trend: 'up' },
  { id: 'COW-018', breed: 'Holstein Friesian', age: 5, lactation: 2, milkYield: 14.2, scc: 260, activity: -14, rumination: -7, temperature: 39.2, previousMastitis: false, riskScore: 64, shed: 'B', trend: 'up' },
  { id: 'BUF-076', breed: 'Murrah', age: 7, lactation: 4, milkYield: 5.9, scc: 235, activity: -8, rumination: -6, temperature: 39.6, previousMastitis: true, riskScore: 58, shed: 'C', trend: 'up' },
  { id: 'COW-053', breed: 'Crossbred', age: 5, lactation: 2, milkYield: 10.6, scc: 210, activity: -5, rumination: -3, temperature: 39.0, previousMastitis: false, riskScore: 52, shed: 'B', trend: 'flat' },
  { id: 'BUF-091', breed: 'Murrah', age: 8, lactation: 5, milkYield: 6.4, scc: 190, activity: -3, rumination: -1, temperature: 38.9, previousMastitis: true, riskScore: 46, shed: 'B', trend: 'down' },
  { id: 'COW-055', breed: 'Sahiwal', age: 4, lactation: 1, milkYield: 8.1, scc: 140, activity: -2, rumination: 1, temperature: 38.7, previousMastitis: false, riskScore: 28, shed: 'A', trend: 'flat' },
  { id: 'COW-112', breed: 'Gir', age: 6, lactation: 3, milkYield: 7.8, scc: 95, activity: 3, rumination: 2, temperature: 38.5, previousMastitis: false, riskScore: 9, shed: 'A', trend: 'down' },
]

const NAMES = ['Ganga', 'Kaveri', 'Lakshmi', 'Radha', 'Nandini', 'Champa', 'Gauri', 'Kamdhenu', 'Basanti', 'Shyama', 'Tara', 'Meera', 'Saraswati', 'Rukmini', 'Parvati', 'Sita']

function makeGenerated(n) {
  const out = []
  for (let i = 0; i < n; i++) {
    const breed = pick(BREEDS)
    const prefix = SPECIES[breed] === 'Buffalo' ? 'BUF' : 'COW'
    const num = String(120 + i * 7 + between(1, 6)).padStart(3, '0')
    const score = between(2, 66)
    const shed = pick(SHEDS).id
    out.push({
      id: `${prefix}-${num}`,
      breed,
      age: between(3, 10),
      lactation: between(1, 6),
      milkYield: SPECIES[breed] === 'Buffalo' ? between(4.5, 8, 1) : between(7, 16, 1),
      scc: between(60, 320),
      activity: between(-14, 6),
      rumination: between(-12, 5),
      temperature: between(38.3, 39.6, 1),
      previousMastitis: rand() > 0.7,
      riskScore: score,
      shed,
    })
  }
  return out
}

const rawAnimals = [...CURATED, ...makeGenerated(12)]

function sparkFor(score, dir) {
  const end = score
  const start = dir === 'up' ? score - 22 : dir === 'down' ? score + 16 : score - 3
  return Array.from({ length: 12 }, (_, i) => {
    const p = i / 11
    return { i, v: Math.max(2, Math.round(start + (end - start) * p + (rand() - 0.5) * 6)) }
  })
}

export const ANIMALS = rawAnimals.map((a, idx) => {
  const trend = a.trend || (a.riskScore > 45 ? 'up' : a.riskScore < 20 ? 'down' : 'flat')
  return {
    ...a,
    trend,
    name: NAMES[idx % NAMES.length],
    species: SPECIES[a.breed],
    riskLevel: riskLevelFromScore(a.riskScore),
    spark: sparkFor(a.riskScore, trend),
    lastUpdated: ['5 min ago', '18 min ago', '42 min ago', '1 hr ago', '2 hr ago', '3 hr ago'][idx % 6],
  }
})

export function getAnimal(id) {
  return ANIMALS.find((a) => a.id === id)
}

// ---- Time series -----------------------------------------------------------

const DAY_LABELS = (days) => {
  const base = new Date('2026-09-04T08:00:00')
  const arr = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base)
    d.setDate(base.getDate() - i)
    arr.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }))
  }
  return arr
}

function series(days, start, end, wobble, dp = 0) {
  const labels = DAY_LABELS(days)
  return labels.map((label, i) => {
    const p = i / (days - 1)
    const v = start + (end - start) * p + (rand() - 0.5) * wobble
    return { date: label, value: dp === 0 ? Math.round(v) : Number(v.toFixed(dp)) }
  })
}

export function animalTimeSeries(animal) {
  const bad = animal.riskScore >= 55
  return {
    milkYield: series(14, animal.milkYield * (bad ? 1.14 : 1.03), animal.milkYield, 0.5, 1),
    scc: series(14, animal.scc * (bad ? 0.6 : 0.9), animal.scc, 25),
    activity: series(14, 100, 100 + animal.activity, 6),
    rumination: series(14, 100, 100 + animal.rumination, 6),
    temperature: series(14, 38.5, animal.temperature, 0.25, 1),
  }
}

export const HERD_RISK_TREND = (() => {
  const labels = DAY_LABELS(14)
  return labels.map((date, i) => {
    const p = i / 13
    return {
      date,
      herdRisk: Math.round(22 + p * 16 + (rand() - 0.5) * 3),
      avgScc: Math.round(180 + p * 90 + (rand() - 0.5) * 20),
      threshold: 45,
    }
  })
})()

export const RISK_DISTRIBUTION = [
  { name: 'NONE', value: 87 },
  { name: 'LOW', value: 22 },
  { name: 'MODERATE', value: 12 },
  { name: 'HIGH', value: 7 },
]

export const HERD_STATS = {
  totalAnimals: 128,
  healthy: 87,
  atRisk: 12,
  highRisk: 7,
  protected: 12,
  herdRisk: 38,
  highestRiskShed: 'Shed C',
}

// 7-day dashboard trend: Mon → Sun
export const DASH_TREND = (() => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const dates = ['21 Apr', '22 Apr', '23 Apr', '24 Apr', '25 Apr', '26 Apr', '27 Apr']
  return days.map((day, i) => {
    const p = i / 6
    return {
      day,
      date: dates[i],
      herdRisk: Math.round(34 + p * 26 + (rand() - 0.5) * 5),
      highRiskAnimals: Math.round(18 + p * 30 + (rand() - 0.5) * 6),
    }
  })
})()

export const ENV_NOW = {
  temperature: 31,
  humidity: 78,
  bedding: 'Poor',
  milkingHygiene: 'Moderate',
  water: 'Good',
  housing: 'Moderate',
}

export const ENV_TREND = (() => {
  const labels = DAY_LABELS(7)
  return labels.map((date, i) => ({
    date,
    temperature: Math.round(28 + rand() * 5),
    humidity: Math.round(68 + i * 1.6 + rand() * 6),
  }))
})()

export const MILK_STATS = {
  avgYield: 9.6,
  avgScc: 232,
  conductivity: 5.4,
  milkTemp: 33.8,
  ph: 6.7,
}

export const MILK_TRENDS = {
  yield: series(14, 10.6, 9.2, 0.4, 1),
  scc: series(14, 170, 265, 22),
  conductivity: series(14, 4.9, 5.7, 0.2, 1),
  milkTemp: series(14, 33.1, 34.2, 0.3, 1),
}

export const TIMELINE = [
  { date: 'Aug 20', label: 'Normal', tone: 'ok' },
  { date: 'Aug 24', label: 'SCC trend increased', tone: 'warn' },
  { date: 'Aug 27', label: 'Milk production decreased', tone: 'warn' },
  { date: 'Aug 29', label: 'Activity decreased', tone: 'warn' },
  { date: 'Sep 02', label: 'Early warning generated', tone: 'alert' },
  { date: 'Sep 04', label: 'High risk — 87%', tone: 'alert' },
]

export const ALERTS = [
  {
    id: 'AL-1001', animalId: 'BUF-042', risk: 87, level: 'HIGH', status: 'open',
    time: 'Today, 07:12', shed: 'C',
    factors: ['SCC rising rapidly', 'Milk yield down 12%', 'Activity down 18%'],
    action: 'Inspect udder and perform an SCC / milk quality test today.',
  },
  {
    id: 'AL-1002', animalId: 'COW-018', risk: 64, level: 'MODERATE', status: 'open',
    time: 'Today, 06:40', shed: 'B',
    factors: ['SCC increasing', 'Activity decreasing', 'Milk yield down 7%'],
    action: 'Monitor closely for 48 hours and review milking hygiene.',
  },
  {
    id: 'AL-1003', animalId: 'BUF-076', risk: 58, level: 'MODERATE', status: 'open',
    time: 'Yesterday, 18:05', shed: 'C',
    factors: ['Udder temperature elevated', 'SCC above baseline'],
    action: 'Check udder for heat and swelling; recheck temperature tomorrow.',
  },
  {
    id: 'AL-1004', animalId: 'COW-053', risk: 52, level: 'MODERATE', status: 'open',
    time: 'Yesterday, 09:20', shed: 'B',
    factors: ['Activity slightly reduced', 'Bedding hygiene poor in shed'],
    action: 'Improve bedding hygiene and recheck tomorrow.',
  },
  {
    id: 'AL-0990', animalId: 'COW-055', risk: 44, level: 'MODERATE', status: 'resolved',
    time: '02 Sep, 11:00', shed: 'A',
    factors: ['SCC spike resolved after hygiene correction'],
    action: 'Resolved — SCC returned to baseline.',
  },
  {
    id: 'AL-0984', animalId: 'COW-112', risk: 38, level: 'MODERATE', status: 'resolved',
    time: '31 Aug, 15:30', shed: 'A',
    factors: ['Transient activity dip'],
    action: 'Resolved — behaviour normalised.',
  },
]
