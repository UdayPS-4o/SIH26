// Compute robust per-animal baseline from trailing N readings
// Uses median and MAD (Median Absolute Deviation) — robust to outliers

export function computeBaseline(readings) {
  if (!readings || readings.length < 3) return null

  const sorted = [...readings].sort((a, b) => a - b)
  const n = sorted.length

  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)]

  // MAD = median of absolute deviations from median
  const deviations = sorted.map((v) => Math.abs(v - median))
  const madSorted = deviations.sort((a, b) => a - b)
  const mad = n % 2 === 0
    ? (madSorted[n / 2 - 1] + madSorted[n / 2]) / 2
    : madSorted[Math.floor(n / 2)]

  // z-score for the latest reading
  const latest = readings[readings.length - 1]
  const zScore = mad > 0 ? (0.6745 * (latest - median)) / mad : 0

  return {
    median: Math.round(median * 100) / 100,
    mad: Math.round(mad * 100) / 100,
    latest,
    zScore: Math.round(zScore * 100) / 100,
    interpretation: zScore > 3 ? 'HIGH deviation — investigate' :
                     zScore > 2 ? 'Moderate deviation — monitor' :
                     'Within normal range',
  }
}

export function pctAboveBaseline(current, baseline) {
  if (!baseline || baseline === 0) return 0
  return Math.round(((current - baseline) / baseline) * 100)
}
