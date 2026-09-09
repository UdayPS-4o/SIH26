// ANALYSIS SERVICE — cross-factor correlation and pattern detection
// for Gaurogya Setu herd analytics.

import { ANIMALS } from '../data/mockData'
import { animalTimeSeries } from '../data/mockData'

// ── Correlation definitions ────────────────────────────────────────────────
// Pre-defined scientific relationships between health indicators.
const CORRELATION_DEFS = [
  {
    id: 'scc-yield',
    factorA: 'SCC',
    factorB: 'Milk Yield',
    direction: 'negative',
    baseStrength: 82,
    description:
      'Higher somatic cell counts are strongly associated with reduced milk yield in dairy cattle.',
  },
  {
    id: 'activity-rumination',
    factorA: 'Activity',
    factorB: 'Rumination',
    direction: 'positive',
    baseStrength: 58,
    description:
      'Animals with higher activity levels typically show increased rumination times, indicating normal digestive behaviour.',
  },
  {
    id: 'temp-humidity',
    factorA: 'Temperature',
    factorB: 'Humidity',
    direction: 'positive',
    baseStrength: 34,
    description:
      'Ambient temperature and humidity show a mild positive correlation, especially during warmer months.',
  },
  {
    id: 'scc-temp',
    factorA: 'SCC',
    factorB: 'Temperature',
    direction: 'positive',
    baseStrength: 51,
    description:
      'Elevated body temperature is moderately correlated with elevated somatic cell counts, indicating possible inflammation.',
  },
  {
    id: 'prevMastitis-risk',
    factorA: 'Previous Mastitis',
    factorB: 'Risk Score',
    direction: 'positive',
    baseStrength: 79,
    description:
      'Animals with a history of mastitis show significantly elevated risk scores compared to those without prior episodes.',
  },
]

export function analyzeCorrelations(animals = ANIMALS) {
  const herdSize = animals.length
  if (herdSize === 0) return { correlations: [] }

  // Compute actual herd statistics for dynamic strength adjustment
  const avgScc = animals.reduce((s, a) => s + a.scc, 0) / herdSize
  const avgTemp = animals.reduce((s, a) => s + a.temperature, 0) / herdSize
  const prevMastitisCount = animals.filter((a) => a.previousMastitis).length
  const prevMastitisRatio = prevMastitisCount / herdSize

  const correlations = CORRELATION_DEFS.map((def) => {
    let strength = def.baseStrength

    // Adjust strength based on herd characteristics
    if (def.id === 'scc-yield') {
      // Stronger correlation when average SCC is elevated
      if (avgScc > 250) strength = Math.min(95, strength + 8)
      else if (avgScc < 150) strength = Math.max(50, strength - 10)
    } else if (def.id === 'prevMastitis-risk') {
      // Stronger correlation when more animals have history
      if (prevMastitisRatio > 0.3) strength = Math.min(95, strength + 10)
      else if (prevMastitisRatio < 0.1) strength = Math.max(45, strength - 15)
    } else if (def.id === 'scc-temp') {
      if (avgTemp > 39.2) strength = Math.min(75, strength + 12)
      else if (avgTemp < 38.7) strength = Math.max(30, strength - 8)
    }

    return {
      factorA: def.factorA,
      factorB: def.factorB,
      strength: Math.round(strength),
      direction: def.direction,
      description: def.description,
    }
  })

  // Sort by strength descending
  return {
    correlations: correlations.sort((a, b) => b.strength - a.strength),
  }
}

// ── Pattern Detection ──────────────────────────────────────────────────────

const SEVERITY_META = {
  low: { label: 'Low', color: 'forest', borderColor: 'border-forest-400' },
  medium: { label: 'Medium', color: 'honey', borderColor: 'border-honey-400' },
  high: { label: 'High', color: 'red', borderColor: 'border-red-400' },
}

const SCC_SPIKE_THRESHOLD = 15 // % increase over period
const YIELD_DECLINE_THRESHOLD = 5 // % decrease
const ACTIVITY_DECLINE_THRESHOLD = 8 // % decrease
const RUMINATION_DECLINE_THRESHOLD = 6 // % decrease
const TEMP_ELEVATION_THRESHOLD = 39.0

export function detectPatterns(animal, timeSeries) {
  if (!animal || !timeSeries) return { patterns: [] }

  const patterns = []
  let negativeFactors = 0

  // ── SCC Spike ─────────────────────────────────────────────────────
  if (timeSeries.scc && timeSeries.scc.length >= 2) {
    const sccData = timeSeries.scc
    const recent = sccData.slice(-3)
    const earlier = sccData.slice(0, Math.max(1, sccData.length - 3))
    const avgRecent = recent.reduce((s, d) => s + d.value, 0) / recent.length
    const avgEarlier = earlier.reduce((s, d) => s + d.value, 0) / earlier.length

    if (avgEarlier > 0 && avgRecent > avgEarlier * (1 + SCC_SPIKE_THRESHOLD / 100)) {
      const pctIncrease = Math.round(((avgRecent - avgEarlier) / avgEarlier) * 100)
      const severity = pctIncrease > 40 ? 'high' : pctIncrease > 20 ? 'medium' : 'low'
      patterns.push({
        type: 'scc_spike',
        severity,
        description: `SCC trending upward sharply — ${pctIncrease}% increase over recent readings (current avg: ${Math.round(avgRecent)}k).`,
        confidence: Math.min(92, 55 + pctIncrease),
      })
      negativeFactors++
    }
  }

  // ── Yield Decline ──────────────────────────────────────────────────
  if (timeSeries.milkYield && timeSeries.milkYield.length >= 2) {
    const yieldData = timeSeries.milkYield
    const recent = yieldData.slice(-4)
    const earlier = yieldData.slice(0, Math.max(1, yieldData.length - 4))
    const avgRecent = recent.reduce((s, d) => s + d.value, 0) / recent.length
    const avgEarlier = earlier.reduce((s, d) => s + d.value, 0) / earlier.length

    if (avgEarlier > 0 && avgRecent < avgEarlier * (1 - YIELD_DECLINE_THRESHOLD / 100)) {
      const pctDecline = Math.round(((avgEarlier - avgRecent) / avgEarlier) * 100)
      const severity = pctDecline > 12 ? 'high' : pctDecline > 6 ? 'medium' : 'low'
      patterns.push({
        type: 'yield_decline',
        severity,
        description: `Milk yield declining — ${pctDecline}% drop from baseline (recent avg: ${avgRecent.toFixed(1)} L vs baseline: ${avgEarlier.toFixed(1)} L).`,
        confidence: Math.min(88, 52 + pctDecline),
      })
      negativeFactors++
    }
  }

  // ── Behavioral Change ──────────────────────────────────────────────
  let behaviorFlagged = false
  if (timeSeries.activity && timeSeries.rumination && timeSeries.activity.length >= 2) {
    const actData = timeSeries.activity
    const rumData = timeSeries.rumination
    const recentAct = actData.slice(-3).reduce((s, d) => s + d.value, 0) / Math.max(1, actData.slice(-3).length)
    const recentRum = rumData.slice(-3).reduce((s, d) => s + d.value, 0) / Math.max(1, rumData.slice(-3).length)
    const earlierAct = actData.slice(0, Math.max(1, actData.length - 3)).reduce((s, d) => s + d.value, 0) / Math.max(1, actData.length - 3)
    const earlierRum = rumData.slice(0, Math.max(1, rumData.length - 3)).reduce((s, d) => s + d.value, 0) / Math.max(1, rumData.length - 3)

    if (recentAct < 100 - ACTIVITY_DECLINE_THRESHOLD && recentRum < 100 - RUMINATION_DECLINE_THRESHOLD) {
      behaviorFlagged = true
      const actDrop = Math.round(earlierAct - recentAct)
      const rumDrop = Math.round(earlierRum - recentRum)
      const severity = (actDrop + rumDrop) > 20 ? 'high' : (actDrop + rumDrop) > 10 ? 'medium' : 'low'
      patterns.push({
        type: 'behavior_change',
        severity,
        description: `Both activity and rumination declining — activity down ${actDrop}%, rumination down ${rumDrop}% from baseline.`,
        confidence: Math.min(85, 48 + (actDrop + rumDrop)),
      })
      negativeFactors++
    }
  }

  // ── Thermal Elevation ──────────────────────────────────────────────
  if (animal.temperature > TEMP_ELEVATION_THRESHOLD) {
    const delta = (animal.temperature - 38.5).toFixed(1)
    const severity = animal.temperature > 39.5 ? 'high' : animal.temperature > 39.2 ? 'medium' : 'low'
    patterns.push({
      type: 'thermal_elevation',
      severity,
      description: `Body temperature elevated at ${animal.temperature.toFixed(1)}°C (${delta}°C above normal baseline). Possible inflammatory response.`,
      confidence: Math.min(91, 55 + parseFloat(delta) * 12),
    })
    negativeFactors++
  }

  // ── Combined Risk ──────────────────────────────────────────────────
  if (negativeFactors >= 3) {
    const combinedSeverity = negativeFactors >= 5 ? 'high' : 'medium'
    patterns.push({
      type: 'combined_risk',
      severity: combinedSeverity,
      description: `${negativeFactors} risk factors are simultaneously negative. Combined multi-factor risk significantly elevates mastitis probability.`,
      confidence: Math.min(94, 60 + negativeFactors * 7),
    })
  }

  return { patterns }
}

// ── Seasonal Risk ──────────────────────────────────────────────────────────

export function getSeasonalRisk(month) {
  const m = typeof month === 'string' ? parseInt(month, 10) : month
  const isMonsoon = m >= 6 && m <= 9

  if (isMonsoon) {
    return {
      risk: 'high',
      riskLevel: 'HIGH',
      label: 'Monsoon Risk Period',
      factors: [
        { name: 'High Humidity', impact: 'Elevates bacterial growth in bedding and teats' },
        { name: 'Prolonged Wetness', impact: 'Increases teat skin maceration and infection risk' },
        { name: 'Temperature Fluctuation', impact: 'Stress response reduces immune function' },
        { name: 'Poor Ventilation', impact: 'Ammonia buildup worsens air quality in sheds' },
        { name: 'Waterlogging', impact: 'Contaminated water sources near feed troughs' },
      ],
      seasonBars: [
        { name: 'Summer', risk: 38 },
        { name: 'Monsoon', risk: 72 },
        { name: 'Post-Monsoon', risk: 45 },
        { name: 'Winter', risk: 22 },
      ],
    }
  }

  if (m >= 10 && m <= 11) {
    // Post-monsoon
    return {
      risk: 'moderate',
      riskLevel: 'MODERATE',
      label: 'Post-Monsoon Transition',
      factors: [
        { name: 'Residual Humidity', impact: 'Lingering moisture maintains moderate risk' },
        { name: 'Cooling Temperatures', impact: 'Animals adjusting to temperature drop' },
        { name: 'Bedding Drying', impact: 'Inadequate drying keeps some bacterial load' },
      ],
      seasonBars: [
        { name: 'Summer', risk: 38 },
        { name: 'Monsoon', risk: 72 },
        { name: 'Post-Monsoon', risk: 45 },
        { name: 'Winter', risk: 22 },
      ],
    }
  }

  if (m >= 3 && m <= 5) {
    // Summer
    return {
      risk: 'moderate',
      riskLevel: 'MODERATE',
      label: 'Summer Risk Period',
      factors: [
        { name: 'Heat Stress', impact: 'Elevated temperatures suppress immune response' },
        { name: 'Water Scarcity', impact: 'Reduced intake affects metabolic function' },
        { name: 'Feed Degradation', impact: 'Mould growth in stored feed' },
      ],
      seasonBars: [
        { name: 'Summer', risk: 38 },
        { name: 'Monsoon', risk: 72 },
        { name: 'Post-Monsoon', risk: 45 },
        { name: 'Winter', risk: 22 },
      ],
    }
  }

  // Winter (Dec-Feb)
  return {
    risk: 'low',
    riskLevel: 'LOW',
    label: 'Standard Risk Period',
    factors: [
      { name: 'Cool Stable Conditions', impact: 'Lower bacterial growth rates' },
      { name: 'Lower Humidity', impact: 'Reduced airborne pathogen transmission' },
      { name: 'Seasonal Dryness', impact: 'Dry bedding reduces infection vectors' },
    ],
    seasonBars: [
      { name: 'Summer', risk: 38 },
      { name: 'Monsoon', risk: 72 },
      { name: 'Post-Monsoon', risk: 45 },
      { name: 'Winter', risk: 22 },
    ],
  }
}

// ── Shed Comparison ────────────────────────────────────────────────────────

export function getShedComparison(shreds) {
  if (!shreds || shreds.length === 0) return { sheds: [], best: null, worst: null }

  const sorted = [...shreds].sort((a, b) => b.risk - a.risk)
  const best = sorted[sorted.length - 1]
  const worst = sorted[0]
  const avgRisk = Math.round(sorted.reduce((s, sh) => s + sh.risk, 0) / sorted.length)

  const sheds = sorted.map((s, idx) => {
    const deltaFromAvg = Math.round(s.risk - avgRisk)
    const vsBest = Math.round(s.risk - best.risk)
    const vsWorst = Math.round(s.risk - worst.risk)
    return {
      ...s,
      rank: idx + 1,
      deltaFromAvg,
      vsBest,
      vsWorst,
      improvementPotential: Math.max(0, s.risk - best.risk),
    }
  })

  return { sheds, best, worst, avgRisk }
}

// ── Herd-wide pattern summary ──────────────────────────────────────────────

export function getHerdPatterns(animals = ANIMALS) {
  const allPatterns = []
  animals.forEach((animal) => {
    const ts = animalTimeSeries(animal)
    const result = detectPatterns(animal, ts)
    result.patterns.forEach((p) => {
      allPatterns.push({
        ...p,
        animalId: animal.id,
        animalName: animal.name,
        shed: animal.shed,
        riskScore: animal.riskScore,
      })
    })
  })

  // Group by type
  const byType = {}
  allPatterns.forEach((p) => {
    if (!byType[p.type]) byType[p.type] = []
    byType[p.type].push(p)
  })

  return {
    totalPatterns: allPatterns.length,
    patternsByType: byType,
    highSeverityCount: allPatterns.filter((p) => p.severity === 'high').length,
    mediumSeverityCount: allPatterns.filter((p) => p.severity === 'medium').length,
    affectedAnimals: new Set(allPatterns.map((p) => p.animalId)).size,
  }
}

// ── Correlation insights for a specific animal ─────────────────────────────

export function getCorrelationInsights(animal) {
  if (!animal) return []
  const insights = []

  const { correlations } = analyzeCorrelations()
  const topCorrelations = correlations.slice(0, 3)

  topCorrelations.forEach((c) => {
    let relevant = false
    let detail = ''

    if (c.factorA === 'SCC' && c.factorB === 'Milk Yield') {
      if (animal.scc > 200) {
        relevant = true
        detail = `Animal's SCC (${animal.scc}k) is above the typical threshold. This correlation suggests elevated mastitis risk with potential yield reduction.`
      }
    } else if (c.factorA === 'Previous Mastitis' && c.factorB === 'Risk Score') {
      if (animal.previousMastitis) {
        relevant = true
        detail = `This animal has a history of mastitis, and ${c.direction === 'positive' ? 'this is the strongest known predictor of recurrence risk' : 'this does not significantly alter the risk profile'}.`
      }
    } else if (c.factorA === 'SCC' && c.factorB === 'Temperature') {
      if (animal.scc > 180 && animal.temperature > 38.8) {
        relevant = true
        detail = `Both elevated SCC (${animal.scc}k) and temperature (${animal.temperature.toFixed(1)}°C) suggest an active inflammatory process.`
      }
    }

    if (relevant) {
      insights.push({
        factorA: c.factorA,
        factorB: c.factorB,
        strength: c.strength,
        direction: c.direction,
        description: c.description,
        detail,
      })
    }
  })

  return insights
}
