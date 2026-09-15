const KEY = 'gaurogya_setu_outcomes'

export function getOutcomes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function recordOutcome(alertId, outcome) {
  const outcomes = getOutcomes()
  outcomes.push({
    alertId,
    outcome,
    timestamp: new Date().toISOString(),
  })
  localStorage.setItem(KEY, JSON.stringify(outcomes))
  return outcomes
}

export function getOutcomeCounts() {
  const outcomes = getOutcomes()
  return {
    total: outcomes.length,
    confirmed: outcomes.filter(o => o.outcome === 'confirmed').length,
    notConfirmed: outcomes.filter(o => o.outcome === 'not-confirmed').length,
    vetCalled: outcomes.filter(o => o.outcome === 'vet-called').length,
  }
}
