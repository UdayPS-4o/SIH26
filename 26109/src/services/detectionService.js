/**
 * DETECTION — Real-time anomaly detection service.
 *
 * Threshold logic (per animal signal):
 *   SCC            > 200k cells/mL  → anomaly
 *   Milk Yield     < 7.0 L          → anomaly
 *   Activity       < -10 % change   → anomaly
 *   Rumination     < -8 % change    → anomaly
 *   Temperature    > 39.0 °C        → anomaly
 *
 * Severity bands (distance beyond / below threshold):
 *   > 20 %  → critical
 *   > 10 %  → warning
 *   else    → notice
 */

/* ---------- Threshold config ---------- */
const THRESHOLDS = {
  scc:         { key: 'scc',         threshold: 200,   unit: 'k',  direction: 'gt' },
  milkYield:   { key: 'milkYield',   threshold: 7.0,  unit: 'L',  direction: 'lt' },
  activity:    { key: 'activity',    threshold: -10,  unit: '%',  direction: 'lt' },
  rumination:  { key: 'rumination',  threshold: -8,   unit: '%',  direction: 'lt' },
  temperature: { key: 'temperature', threshold: 39.0, unit: '°C', direction: 'gt' },
}

function pctDeviation(value, threshold, direction) {
  const diff = direction === 'gt' ? value - threshold : threshold - value
  return diff / threshold
}

function severityFor(pct) {
  if (pct > 0.20) return 'critical'
  if (pct > 0.10) return 'warning'
  return 'notice'
}

function severityLabel(s) {
  return s === 'critical' ? 'Critical' : s === 'warning' ? 'Warning' : 'Notice'
}

function severityColor(s) {
  if (s === 'critical') return 'red'
  if (s === 'warning') return 'honey'
  return 'ai'
}

/* ---------- Public API ---------- */

/**
 * Detect anomalies for a single animal.
 * @param {{ scc, milkYield, activity, rumination, temperature }} animal
 * @returns {{ anomalies: Array }}
 */
export function detectAnomalies(animal) {
  if (!animal) return { anomalies: [] }
  const anomalies = []
  for (const cfg of Object.values(THRESHOLDS)) {
    const value = animal[cfg.key]
    if (value === undefined || value === null || value === '') continue
    const num = Number(value)
    if (Number.isNaN(num)) continue
    const breached = cfg.direction === 'gt' ? num > cfg.threshold : num < cfg.threshold
    if (!breached) continue
    const dev = pctDeviation(num, cfg.threshold, cfg.direction)
    anomalies.push({
      sensor: cfg.key,
      type: cfg.key === 'scc' ? 'Threshold Breach'
        : cfg.key === 'milkYield' ? 'Low Yield'
        : cfg.key === 'activity' ? 'Activity Drop'
        : cfg.key === 'rumination' ? 'Rumination Drop'
        : 'Temperature Spike',
      severity: severityFor(dev),
      value: num,
      threshold: cfg.threshold,
      unit: cfg.unit,
      deviation: Math.round(dev * 100),
      detectedAt: new Date().toISOString(),
    })
  }
  return { anomalies }
}

/**
 * Compute a 0-100 anomaly score for an animal.
 * Weighted: critical = 35, warning = 20, notice = 8 (max ~175, scaled to 0-100).
 */
export function getAnomalyScore(animal) {
  const { anomalies } = detectAnomalies(animal)
  if (!anomalies.length) return 0
  const weights = { critical: 35, warning: 20, notice: 8 }
  const raw = anomalies.reduce((s, a) => s + (weights[a.severity] || 0), 0)
  return Math.min(100, Math.round((raw / 100) * 100))
}

/**
 * Determine current detection status for an animal.
 */
export function getDetectionStatus(animal) {
  const score = getAnomalyScore(animal)
  const { anomalies } = detectAnomalies(animal)
  let status = 'normal'
  if (score >= 50 || anomalies.some((a) => a.severity === 'critical')) status = 'alert'
  else if (score > 0 || anomalies.some((a) => a.severity === 'warning')) status = 'watch'
  return { status, detectedAt: new Date().toISOString(), signals: anomalies.map((a) => a.sensor) }
}

/**
 * Simulated sensor health array.
 */
const SENSORS = [
  { name: 'SCC Sensor (milk)',     status: 'online',   lastReading: '210 k cells/mL', uptime: 99.8 },
  { name: 'Temperature Probe',     status: 'online',   lastReading: '38.7 °C',       uptime: 99.5 },
  { name: 'Activity Collar',       status: 'degraded', lastReading: '−3 % (est.)',   uptime: 87.2 },
  { name: 'Rumination Monitor',    status: 'online',   lastReading: '+2 %',          uptime: 99.1 },
  { name: 'Environment Hub',       status: 'online',   lastReading: '28 °C / 72 %',  uptime: 98.7 },
  { name: 'Milking Meter',         status: 'online',   lastReading: '8.3 L',         uptime: 99.3 },
]

export function getSensorHealth() {
  return {
    sensors: SENSORS.map((s) => ({ ...s })),
    lastChecked: new Date().toISOString(),
  }
}
