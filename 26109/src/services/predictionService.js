// Simulated AI prediction layer for the MastiGuard AI prototype.
// This is a transparent demo formula. It is NOT a clinically validated model.

import { clamp, levelFromScore } from '../utils/riskUtils'

/**
 * predictMastitisRisk(animalData)
 * animalData: {
 *   scc, milkYieldChange, activityChange, ruminationChange,
 *   temperature, humidity, previousMastitis
 * }
 */
export function predictMastitisRisk(a = {}) {
  const scc = num(a.scc, 200)
  const milkYieldChange = num(a.milkYieldChange, 0) // negative = decline
  const activityChange = num(a.activityChange, 0)
  const ruminationChange = num(a.ruminationChange, 0)
  const temperature = num(a.temperature, 38.6)
  const humidity = num(a.humidity, 65)
  const previousMastitis = !!a.previousMastitis

  // Component contributions (each roughly 0..1)
  const sccC = clamp((scc - 100) / 500, 0, 1) // 100k safe -> 600k saturates
  const yieldC = clamp(-milkYieldChange / 30, 0, 1) // -30% decline saturates
  const actC = clamp(-activityChange / 30, 0, 1)
  const rumC = clamp(-ruminationChange / 30, 0, 1)
  const tempC = clamp((temperature - 38.6) / 1.8, 0, 1) // fever above 38.6
  const humC = clamp((humidity - 55) / 40, 0, 1) // environmental load
  const histC = previousMastitis ? 1 : 0

  const weights = { scc: 34, yield: 20, act: 14, rum: 10, temp: 12, hum: 6, hist: 10 }
  const raw =
    sccC * weights.scc +
    yieldC * weights.yield +
    actC * weights.act +
    rumC * weights.rum +
    tempC * weights.temp +
    humC * weights.hum +
    histC * weights.hist

  const riskScore = Math.round(clamp(raw, 0, 99))
  const riskLevel = levelFromScore(riskScore)

  const factors = [
    { key: 'SCC', label: 'Somatic Cell Count', weight: sccC * weights.scc, delta: `${scc}k` },
    { key: 'Milk Yield', label: 'Milk yield change', weight: yieldC * weights.yield, delta: `${fmt(milkYieldChange)}%` },
    { key: 'Activity', label: 'Activity change', weight: actC * weights.act, delta: `${fmt(activityChange)}%` },
    { key: 'Rumination', label: 'Rumination change', weight: rumC * weights.rum, delta: `${fmt(ruminationChange)}%` },
    { key: 'Udder Temperature', label: 'Body / udder temperature', weight: tempC * weights.temp, delta: `${temperature.toFixed(1)}°C` },
    { key: 'Humidity', label: 'Ambient humidity', weight: humC * weights.hum, delta: `${humidity}%` },
    { key: 'History', label: 'Previous mastitis', weight: histC * weights.hist, delta: previousMastitis ? 'Yes' : 'No' },
  ]
    .filter((f) => f.weight > 0.5)
    .sort((x, y) => y.weight - x.weight)

  return {
    riskScore,
    riskLevel,
    predictionWindow: riskScore >= 45 ? '7–14 Days' : '14+ Days',
    contributingFactors: factors,
    recommendations: buildRecommendations(riskLevel),
    disclaimer: 'Prototype AI simulation — field validation required.',
  }
}

function buildRecommendations(level) {
  const base = [
    { title: 'Inspect the udder', priority: 'High', reason: 'Visual and palpation check for heat, swelling or abnormal secretion.' },
    { title: 'Perform a milk quality / SCC test', priority: 'High', reason: 'Confirm subclinical status with a CMT or lab SCC test.' },
    { title: 'Review milking hygiene', priority: 'Medium', reason: 'Teat dipping, cluster hygiene and milking order reduce transmission.' },
    { title: 'Monitor temperature and behaviour', priority: 'Medium', reason: 'Track udder temperature, activity and rumination for 48–72 hours.' },
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
