// Simulated AI prediction layer for the Gaurogya Setu prototype.
// Unified scoring module used by both Animal Details and AI Simulator.

import { clamp, levelFromScore } from '../utils/riskUtils'

/**
 * predictMastitisRisk(animalData)
 * animalData: {
 *   scc, milkYieldChange, activityChange, ruminationChange,
 *   temperature, humidity, previousMastitis, conductivity, ph,
 *   feedingQuality, housingQuality, baselineScc
 * }
 */
export function predictMastitisRisk(a = {}) {
  const scc = num(a.scc, 200)
  const baselineScc = num(a.baselineScc, 150)
  const milkYieldChange = num(a.milkYieldChange, 0) // negative = decline
  const activityChange = num(a.activityChange, 0)
  const ruminationChange = num(a.ruminationChange, 0)
  const temperature = num(a.temperature, 38.6)
  const humidity = num(a.humidity, 65)
  const conductivity = num(a.conductivity, 5.4) // mS/cm, normal ~4.5 - 5.2, >5.5 elevated
  const ph = num(a.ph, 6.7) // normal 6.5-6.8, elevated/low in mastitis
  const previousMastitis = !!a.previousMastitis
  const feedingQuality = num(a.feedingQuality, 75)
  const housingQuality = num(a.housingQuality, 75)

  // 1. SCC Baseline Deviation (Robust Z-Score approach relative to animal baseline)
  // Replaces arbitrary global cutoff so high-baseline cows are judged relative to their normal level
  const sccRatio = scc / Math.max(80, baselineScc)
  const sccC = clamp((sccRatio - 1.0) / 2.0, 0, 1) + clamp((scc - 150) / 600, 0, 0.4)
  const normSccC = clamp(sccC, 0, 1)

  // 2. Electrical Conductivity (Deck's Primary Signal)
  const condC = clamp((conductivity - 5.2) / 1.5, 0, 1)

  // 3. pH Deviation
  const phDev = Math.abs(ph - 6.6)
  const phC = clamp(phDev / 0.6, 0, 1)

  // 4. Behaviour & Production changes
  const yieldC = clamp(-milkYieldChange / 30, 0, 1)
  const actC = clamp(-activityChange / 30, 0, 1)
  const rumC = clamp(-ruminationChange / 30, 0, 1)
  const tempC = clamp((temperature - 38.6) / 1.8, 0, 1)
  const humC = clamp((humidity - 55) / 40, 0, 1)
  const histC = previousMastitis ? 1 : 0
  const nutritionC = clamp((75 - feedingQuality) / 40, 0, 1)
  const housingC = clamp((75 - housingQuality) / 40, 0, 1)

  // Weights reflecting deck specs: Conductivity & SCC baseline deviation are headline signals
  const weights = {
    scc: 28,
    conductivity: 20,
    yield: 13,
    temp: 11,
    act: 9,
    rum: 6,
    ph: 4,
    hist: 7,
    nutrition: 4,
    housing: 4,
  }

  const raw =
    (normSccC * weights.scc +
    condC * weights.conductivity +
    yieldC * weights.yield +
    tempC * weights.temp +
    actC * weights.act +
    rumC * weights.rum +
    phC * weights.ph +
    histC * weights.hist +
    nutritionC * weights.nutrition +
    housingC * weights.housing) * 1.121

  const riskScore = Math.round(clamp(raw, 0, 99))
  const riskLevel = levelFromScore(riskScore)

  const factors = [
    { key: 'SCC', label: 'SCC Baseline Ratio', weight: normSccC * weights.scc, delta: `${scc}k (${Math.round(sccRatio * 100)}% of baseline)` },
    { key: 'Conductivity', label: 'Electrical Conductivity', weight: condC * weights.conductivity, delta: `${conductivity.toFixed(1)} mS/cm` },
    { key: 'Milk Yield', label: 'Milk yield change', weight: yieldC * weights.yield, delta: `${fmt(milkYieldChange)}%` },
    { key: 'Udder Temp', label: 'Body / udder temperature', weight: tempC * weights.temp, delta: `${temperature.toFixed(1)}°C` },
    { key: 'Activity', label: 'Activity change', weight: actC * weights.act, delta: `${fmt(activityChange)}%` },
    { key: 'Rumination', label: 'Rumination change', weight: rumC * weights.rum, delta: `${fmt(ruminationChange)}%` },
    { key: 'pH', label: 'Milk pH level', weight: phC * weights.ph, delta: `${ph.toFixed(1)} pH` },
    { key: 'History', label: 'Previous mastitis', weight: histC * weights.hist, delta: previousMastitis ? 'Yes' : 'No' },
    { key: 'Nutrition', label: 'Feeding / nutrition quality', weight: nutritionC * weights.nutrition, delta: `${Math.round(feedingQuality)}/100` },
    { key: 'Housing', label: 'Housing / bedding hygiene', weight: housingC * weights.housing, delta: `${Math.round(housingQuality)}/100` },
  ]
    .filter((f) => f.weight > 0.5)
    .sort((x, y) => y.weight - x.weight)

  return {
    riskScore,
    riskLevel,
    predictionWindow: riskScore >= 45 ? '7–14 Days' : '14+ Days',
    contributingFactors: factors,
    recommendations: buildRecommendations(riskLevel),
    disclaimer: 'Prototype AI simulation — per-animal baseline robust z-scoring applied.',
  }
}

function buildRecommendations(level) {
  const base = [
    { title: 'Inspect the udder', priority: 'High', reason: 'Visual and palpation check for heat, swelling or abnormal secretion.' },
    { title: 'Perform a milk quality / CMT test', priority: 'High', reason: 'Confirm subclinical status with a CMT gel reader or lab SCC test.' },
    { title: 'Review milking hygiene', priority: 'Medium', reason: 'Teat dipping, cluster hygiene and milking order reduce transmission.' },
    { title: 'Monitor temperature and conductivity', priority: 'Medium', reason: 'Track electrical conductivity, udder temperature, activity and rumination for 48–72 hours.' },
    { title: 'Incorporate Ayurvedic herbs / diet', priority: 'Medium', reason: 'Add natural anti-inflammatory supplements (e.g., Aloe Vera, Turmeric, Neem) to the diet to boost immunity.' },
    { title: 'Consult a veterinarian if indicators persist', priority: 'Low', reason: 'Escalate for clinical assessment if abnormal signs continue.' },
  ]
  if (level === 'NONE' || level === 'LOW') {
    return [
      { title: 'Continue routine monitoring', priority: 'Low', reason: 'No action needed beyond standard herd monitoring.' },
      base[2],
      base[3],
    ]
  }
  return base
}

const num = (v, d) => (v === undefined || v === null || Number.isNaN(Number(v)) ? d : Number(v))
const fmt = (n) => (n > 0 ? `+${n}` : `${n}`)

