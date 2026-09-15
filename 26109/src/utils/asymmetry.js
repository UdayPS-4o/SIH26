export function quarterAsymmetry(quarterEc) {
  if (!quarterEc) return null
  const values = [quarterEc.lf, quarterEc.rf, quarterEc.lr, quarterEc.rr]
  const max = Math.max(...values)
  const sorted = [...values].sort((a, b) => a - b)
  const median = (sorted[1] + sorted[2]) / 2
  const ratio = max / median
  const maxQuarter = values.indexOf(max)
  const quarterLabels = ['Left Front', 'Right Front', 'Left Rear', 'Right Rear']
  const quarterShort = ['LF', 'RF', 'LR', 'RR']

  return {
    max,
    median,
    ratio: Math.round(ratio * 100) / 100,
    maxQuarter,
    maxQuarterLabel: quarterLabels[maxQuarter],
    maxQuarterShort: quarterShort[maxQuarter],
    values: values.map((v, i) => ({
      label: quarterLabels[i],
      short: quarterShort[i],
      value: v,
    })),
    interpretation: ratio > 1.3 ? 'HIGH asymmetry — likely single-quarter mastitis' :
                     ratio > 1.15 ? 'Moderate asymmetry — monitor closely' :
                     'Normal — all quarters consistent',
  }
}
