export const RISK_META = {
  NONE: { key: 'NONE', label: 'No Risk', text: 'text-brand-700 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800/40', dot: 'bg-brand-500', hex: '#16a34a' },
  LOW: { key: 'LOW', label: 'Low', text: 'text-brand-700 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-900/20', border: 'border-brand-200 dark:border-brand-800/40', dot: 'bg-brand-500', hex: '#22c55e' },
  MODERATE: { key: 'MODERATE', label: 'Moderate', text: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/40', dot: 'bg-amber-500', hex: '#f59e0b' },
  HIGH: { key: 'HIGH', label: 'High', text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/40', dot: 'bg-red-500', hex: '#ef4444' },
}

export function levelFromScore(score) {
  if (score >= 70) return 'HIGH'
  if (score >= 45) return 'MODERATE'
  if (score >= 20) return 'LOW'
  return 'NONE'
}

export function riskMeta(level) {
  return RISK_META[level] || RISK_META.NONE
}

export function scoreColor(score) {
  return riskMeta(levelFromScore(score)).hex
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

export function formatPct(n, withSign = false) {
  const s = withSign && n > 0 ? '+' : ''
  return `${s}${n}%`
}
