import React, { useState, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   METRICS PANEL — Animated stat cards with sparklines
   ═══════════════════════════════════════════════════════════════ */

const METRICS = [
  { id: 'alerts', label: 'Active Alerts', value: 1247, unit: '', format: v => v.toLocaleString(), icon: 'alert', color: 'red' },
  { id: 'throughput', label: 'Throughput', value: 47.2, unit: 'K flows/s', format: v => v.toFixed(1), icon: 'activity', color: 'cyan' },
  { id: 'detection', label: 'Detection Rate', value: 96.8, unit: '%', format: v => v.toFixed(1), icon: 'shield', color: 'green' },
  { id: 'memory', label: 'Memory Usage', value: 34, unit: '%', format: v => Math.round(v), icon: 'cpu', color: 'purple' },
  { id: 'cpu', label: 'CPU Load', value: 42, unit: '%', format: v => Math.round(v), icon: 'cpu', color: 'amber' },
  { id: 'network', label: 'Network I/O', value: 1.24, unit: 'Gbps', format: v => v.toFixed(2), icon: 'globe', color: 'blue' },
]

const ICONS = {
  alert: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  activity: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  cpu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  globe: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
}

const COLOR_MAP = {
  red: { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
  cyan: { text: '#00d4ff', bg: 'rgba(0, 212, 255, 0.1)', border: 'rgba(0, 212, 255, 0.2)' },
  green: { text: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' },
  purple: { text: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', border: 'rgba(168, 85, 247, 0.2)' },
  amber: { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
  blue: { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' },
}

function Sparkline({ data, color }) {
  const canvasRef = React.useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length < 2) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const max = Math.max(...data) * 1.1
    const min = Math.min(...data) * 0.9
    const range = max - min || 1
    const step = w / (data.length - 1)

    ctx.clearRect(0, 0, w, h)

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color + '40')
    grad.addColorStop(1, color + '00')

    ctx.beginPath()
    ctx.moveTo(0, h)
    data.forEach((v, i) => {
      ctx.lineTo(i * step, h - ((v - min) / range) * h * 0.9)
    })
    ctx.lineTo(w, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    ctx.beginPath()
    data.forEach((v, i) => {
      const y = h - ((v - min) / range) * h * 0.9
      if (i === 0) ctx.moveTo(0, y)
      else ctx.lineTo(i * step, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.stroke()
  }, [data, color])

  return <canvas ref={canvasRef} className="w-full h-10 mt-2" />
}

export default function MetricsPanel() {
  const [values, setValues] = useState(() =>
    Object.fromEntries(METRICS.map(m => [m.id, m.value]))
  )
  const [history, setHistory] = useState(() =>
    Object.fromEntries(METRICS.map(m => [m.id, Array(20).fill(m.value)]))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setValues(prev => {
        const next = {}
        const nextHistory = {}
        METRICS.forEach(m => {
          const noise = (Math.random() - 0.5) * m.value * 0.05
          next[m.id] = Math.max(0, prev[m.id] + noise)
          nextHistory[m.id] = [...(history[m.id] || []).slice(1), next[m.id]]
        })
        setHistory(nextHistory)
        return next
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [history])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {METRICS.map(metric => {
        const colors = COLOR_MAP[metric.color]
        const current = values[metric.id] || metric.value
        const hist = history[metric.id] || []
        const prev = hist.length > 1 ? hist[hist.length - 2] : current
        const trend = ((current - prev) / (prev || 1)) * 100

        return (
          <div
            key={metric.id}
            className="ek-card group hover:shadow-glow-accent transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-ek-text-muted font-semibold">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span
                    className="text-2xl font-display font-bold font-mono tabular-nums"
                    style={{ color: colors.text }}
                    key={current.toFixed(2)}
                  >
                    {metric.format(current)}
                  </span>
                  {metric.unit && (
                    <span className="text-xs text-ek-text-muted">{metric.unit}</span>
                  )}
                </div>
              </div>
              <div
                className="p-2 rounded-lg border"
                style={{
                  color: colors.text,
                  background: colors.bg,
                  borderColor: colors.border,
                }}
              >
                <div className="w-4 h-4">
                  {ICONS[metric.icon]?.({ className: 'w-4 h-4' })}
                </div>
              </div>
            </div>

            <Sparkline data={hist} color={colors.text} />

            <div className="flex items-center justify-between mt-2">
              <span className={`text-[11px] font-mono ${trend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {trend > 0 ? '↑' : '↓'} {Math.abs(trend).toFixed(1)}%
              </span>
              <span className="text-[10px] text-ek-text-muted">vs last reading</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
