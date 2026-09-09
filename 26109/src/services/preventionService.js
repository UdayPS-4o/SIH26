/**
 * Prevention service — proactive mastitis prevention logic.
 * All functions are pure and deterministic for the prototype.
 */

/**
 * getHerdPreventionScore(sheds)
 * Returns a 0-100 prevention posture score for the herd.
 * Higher = better prevention posture (lower risk).
 */
export function getHerdPreventionScore(sheds = []) {
  if (!sheds.length) return { score: 100, level: 'good', factors: [] }

  const avgShedRisk = sheds.reduce((sum, s) => sum + s.risk, 0) / sheds.length
  const totalAnimals = sheds.reduce((sum, s) => sum + (s.animals || 0), 0)
  const highRiskSheds = sheds.filter((s) => s.risk >= 45).length

  // Hygiene correlation: we estimate from shed risk (higher shed risk → lower hygiene correlation)
  // Map shed risk to hygiene quality: risk 0 → hygiene 100, risk 100 → hygiene 0
  const avgHygieneQuality = sheds.reduce((sum, s) => sum + Math.max(0, 100 - s.risk), 0) / sheds.length

  // High-risk animals: estimate from shed risk distribution
  const highRiskAnimals = Math.round(sheds.reduce((sum, s) => {
    if (s.risk >= 70) return sum + (s.animals || 0) * 0.4
    if (s.risk >= 45) return sum + (s.animals || 0) * 0.2
    return sum + (s.animals || 0) * 0.05
  }, 0))

  // Score formula (0-100, inverted so lower risk = higher prevention score)
  // Base 100, penalized by average risk, high-risk shed count, and hygiene
  const riskPenalty = avgShedRisk * 0.4
  const shedPenalty = highRiskSheds * 8
  const hygieneBonus = avgHygieneQuality * 0.3
  const score = Math.round(Math.max(0, Math.min(100, 100 - riskPenalty - shedPenalty + hygieneBonus)))

  let level
  if (score >= 70) level = 'good'
  else if (score >= 40) level = 'moderate'
  else level = 'poor'

  const factors = [
    { label: 'High-risk animals', value: highRiskAnimals, icon: 'alert', detail: `${highRiskAnimals} of ${totalAnimals} animals flagged` },
    { label: 'Average herd risk', value: Math.round(avgShedRisk), icon: 'trend', detail: `${highRiskSheds} shed${highRiskSheds !== 1 ? 's' : ''} above threshold` },
    { label: 'Hygiene correlation', value: Math.round(avgHygieneQuality), icon: 'hygiene', detail: 'Based on shed hygiene profiles' },
  ]

  return { score, level, factors }
}

/**
 * getQuarantineList(animals)
 * Returns animals flagged for milking group segregation.
 * Criteria: riskScore >= 60 AND (scc > 200 OR temperature > 39.0)
 */
export function getQuarantineList(animals = []) {
  return animals
    .filter((a) => a.riskScore >= 60 && (a.scc > 200 || a.temperature > 39.0))
    .map((a) => {
      const reasons = []
      if (a.scc > 200) reasons.push(`SCC ${a.scc}k > 200k`)
      if (a.temperature > 39.0) reasons.push(`Temp ${a.temperature}°C > 39.0°C`)

      return {
        ...a,
        quarantineReason: reasons.join('; '),
      }
    })
}

/**
 * getPreventionActions(animal)
 * Returns preventive actions for an animal based on its prediction result.
 */
export function getPreventionActions(animal) {
  if (!animal) return []

  const risk = animal.riskScore || 0
  const hasHighRisk = risk >= 60
  const hasPrevMastitis = !!animal.previousMastitis

  const actions = [
    {
      id: 'p1',
      title: 'Increase pre-milking teat disinfection frequency',
      priority: 'High',
      deadline: 'Immediate',
      description: hasHighRisk
        ? 'Elevated SCC or temperature detected — intensify pre-milking teat disinfection to every animal in this group.'
        : 'Proactive measure: ensure consistent pre-milking teat disinfection protocol compliance.',
      completed: false,
    },
    {
      id: 'p2',
      title: 'Separate from main milking group',
      priority: hasHighRisk ? 'High' : 'Medium',
      deadline: hasHighRisk ? 'Immediate' : 'Within 24 hours',
      description: hasHighRisk
        ? 'Risk score ≥ 60 with clinical indicators — segregate at milking to prevent pathogen transmission.'
        : 'Consider temporary separation for observation and targeted monitoring.',
      completed: false,
    },
    {
      id: 'p3',
      title: 'Review and replace bedding',
      priority: 'Medium',
      deadline: 'Within 48 hours',
      description: hasHighRisk
        ? 'Poor bedding is a known mastitis risk factor — replace bedding immediately in the affected animal\'s resting area.'
        : 'Inspect bedding quality and plan replacement if showing signs of moisture or contamination.',
      completed: false,
    },
    {
      id: 'p4',
      title: 'Check milking equipment calibration',
      priority: 'Medium',
      deadline: 'Within 48 hours',
      description: 'Verify vacuum pressure, pulsation rate and liner condition. Faulty equipment can cause teat damage that increases infection risk.',
      completed: false,
    },
    {
      id: 'p5',
      title: 'Schedule environmental humidity monitoring',
      priority: 'Low',
      deadline: 'Within 3 days',
      description: 'High humidity promotes pathogen survival. Install or check humidity sensors and set up alerts for levels above 75%.',
      completed: false,
    },
    {
      id: 'p6',
      title: 'Review feeding schedule and quality',
      priority: 'Low',
      deadline: 'Within 5 days',
      description: hasPrevMastitis
        ? 'Previous mastitis history — review mineral and vitamin supplementation to support immune function.'
        : 'Audit feed quality, delivery timing and bunk management to ensure consistent nutrition.',
      completed: false,
    },
  ]

  return actions
}

/**
 * getEscalationLevel(riskScore, previousMastitis)
 * Returns escalation level based on risk thresholds and mastitis history.
 */
export function getEscalationLevel(riskScore, previousMastitis = false) {
  if (riskScore >= 70 || (previousMastitis && riskScore >= 55)) {
    return 'escalate'
  }
  if (riskScore >= 45 || previousMastitis) {
    return 'watch'
  }
  return 'monitor'
}
