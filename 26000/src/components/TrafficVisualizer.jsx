import React, { useState, useRef, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   TRAFFIC VISUALIZER — Animated packet flow
   ═══════════════════════════════════════════════════════════════ */

const PROTOCOLS = [
  { name: 'TCP', color: '#3b82f6', pct: 70 },
  { name: 'UDP', color: '#10b981', pct: 15 },
  { name: 'DNS', color: '#a855f7', pct: 10 },
  { name: 'ICMP', color: '#ef4444', pct: 5 },
]

export default function TrafficVisualizer({ throughput = 47200 }) {
  const canvasRef = useRef(null)
  const [packets, setPackets] = useState([])
  const [stats, setStats] = useState({ tcp: 0, udp: 0, dns: 0, icmp: 0, total: 0 })
  const [attackActive, setAttackActive] = useState(false)

  // Spawn packets
  useEffect(() => {
    const interval = setInterval(() => {
      const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)]
      const isAttack = attackActive && Math.random() > 0.7

      setPackets(prev => {
        const next = [...prev, {
          id: Math.random(),
          x: 0,
          y: 20 + Math.random() * 60, // lane
          speed: isAttack ? 3 + Math.random() * 4 : 1 + Math.random() * 2,
          color: isAttack ? '#ef4444' : proto.color,
          width: isAttack ? 3 : 2,
          protocol: isAttack ? 'ATTACK' : proto.name,
        }]
        // Keep max 100 packets
        if (next.length > 100) next.shift()
        return next
      })

      // Update stats
      setStats(prev => {
        const key = attackActive && Math.random() > 0.7 ? 'attack' : proto.name.toLowerCase()
        return {
          ...prev,
          [key]: prev[key] + 1,
          total: prev.total + 1,
        }
      })
    }, 50)

    return () => clearInterval(interval)
  }, [attackActive])

  // Animate packets
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const w = rect.width
    const h = rect.height

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Background grid
    const isDark = document.documentElement.classList.contains('dark')
    ctx.strokeStyle = isDark ? '#1e293b' : '#e2e8f0'
    ctx.lineWidth = 0.5
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Draw packets
    setPackets(prev => {
      const next = prev.map(p => ({ ...p, x: p.x + p.speed }))
      const remaining = next.filter(p => p.x < w + 10)

      remaining.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.width, 0, Math.PI * 2)
        ctx.fillStyle = p.color + 'cc'
        ctx.fill()

        // Trail
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - 15, p.y)
        ctx.strokeStyle = p.color + '40'
        ctx.lineWidth = p.width * 0.5
        ctx.stroke()
      })

      if (remaining.length !== prev.length) {
        setPackets(remaining)
      }
      return remaining
    })
  }, [packets])

  // Reset stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats({ tcp: 0, udp: 0, dns: 0, icmp: 0, total: 0, attack: 0 })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="ek-card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ek-text-primary">Traffic Flow</h3>
          <p className="text-xs text-ek-text-muted mt-0.5">Real-time packet visualization</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAttackActive(!attackActive)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              attackActive
                ? 'bg-red-500/20 border-red-500/40 text-red-400'
                : 'bg-ek-bg-elevated border-ek-border text-ek-text-muted hover:text-ek-text-primary'
            }`}
          >
            {attackActive ? '⚡ Attack Active' : 'Simulate Attack'}
          </button>
        </div>
      </div>

      <div className="relative h-64 rounded-lg overflow-hidden border border-ek-border bg-ek-bg-base/50">
        <canvas ref={canvasRef} className="w-full h-full" />

        {/* Zone labels */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-ek-bg-card/80 backdrop-blur rounded border border-ek-border">
          <span className="text-[10px] font-mono text-ek-text-muted">INTERNAL</span>
          <div className="text-[10px] font-mono text-cyan-400">10.0.0.0/8</div>
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-ek-bg-card/80 backdrop-blur rounded border border-ek-border">
          <span className="text-[10px] font-mono text-ek-text-muted">EXTERNAL</span>
          <div className="text-[10px] font-mono text-purple-400">203.0.113.0/24</div>
        </div>

        {/* Protocol legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-3">
          {PROTOCOLS.map(proto => (
            <div key={proto.name} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: proto.color }} />
              <span className="text-[10px] font-mono text-ek-text-muted">{proto.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Protocol breakdown */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        {PROTOCOLS.map(proto => (
          <div key={proto.name} className="p-2 bg-ek-bg-elevated rounded-lg border border-ek-border">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: proto.color }} />
              <span className="text-[11px] font-semibold text-ek-text-primary">{proto.name}</span>
            </div>
            <div className="text-sm font-mono font-bold" style={{ color: proto.color }}>
              {Math.round((stats[proto.name.toLowerCase()] || 0) / Math.max(stats.total, 1) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
