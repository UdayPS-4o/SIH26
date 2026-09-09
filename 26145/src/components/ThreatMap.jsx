import React, { useState, useRef, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   THREAT MAP — Network topology visualization
   ═══════════════════════════════════════════════════════════════ */

const NODES = [
  { id: 'fw', label: 'Firewall', ip: '10.0.0.1', type: 'firewall', x: 50, y: 15 },
  { id: 'sw1', label: 'Core Switch', ip: '10.0.0.2', type: 'switch', x: 50, y: 35 },
  { id: 'srv1', label: 'App Server', ip: '10.0.1.10', type: 'server', x: 20, y: 55 },
  { id: 'srv2', label: 'DB Server', ip: '10.0.1.20', type: 'database', x: 80, y: 55 },
  { id: 'gw', label: 'IoT Gateway', ip: '10.0.2.1', type: 'gateway', x: 20, y: 75 },
  { id: 'ws1', label: 'Workstation', ip: '10.0.3.5', type: 'workstation', x: 50, y: 75 },
  { id: 'sensor', label: 'Sensor Net', ip: '10.0.4.0/24', type: 'sensor', x: 80, y: 75 },
  { id: 'ext', label: 'Internet', ip: '203.0.113.0/24', type: 'cloud', x: 50, y: 92 },
]

const CONNECTIONS = [
  ['fw', 'sw1'],
  ['sw1', 'srv1'],
  ['sw1', 'srv2'],
  ['sw1', 'gw'],
  ['sw1', 'ws1'],
  ['gw', 'sensor'],
  ['srv1', 'ext'],
  ['srv2', 'ext'],
  ['ws1', 'ext'],
  ['sensor', 'ext'],
]

const DEVICE_ICONS = {
  firewall: '🔒',
  switch: '🔀',
  server: '🖥️',
  database: '🗄️',
  gateway: '🌐',
  workstation: '💻',
  sensor: '📡',
  cloud: '☁️',
}

const NODE_STATUSES = {
  fw: 'safe',
  sw1: 'safe',
  srv1: 'safe',
  srv2: 'safe',
  gw: 'warning',
  ws1: 'critical',
  sensor: 'safe',
  ext: 'safe',
}

const STATUS_COLORS = {
  safe: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)', text: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
  warning: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)', text: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
  critical: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)', text: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)' },
}

export default function ThreatMap() {
  const [hoveredNode, setHoveredNode] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const isDark = document.documentElement.classList.contains('dark')
    const nodeMap = Object.fromEntries(NODES.map(n => [n.id, { ...n, px: (n.x / 100) * w, py: (n.y / 100) * h }]))

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Draw connections
    CONNECTIONS.forEach(([from, to]) => {
      const a = nodeMap[from]
      const b = nodeMap[to]
      const status = NODE_STATUSES[from] === 'critical' || NODE_STATUSES[to] === 'critical' ? 'critical'
        : NODE_STATUSES[from] === 'warning' || NODE_STATUSES[to] === 'warning' ? 'warning'
        : 'safe'

      ctx.beginPath()
      ctx.moveTo(a.px, a.py)
      ctx.lineTo(b.px, b.py)
      ctx.strokeStyle = STATUS_COLORS[status].text + '40'
      ctx.lineWidth = 1.5
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.setLineDash([])

      // Animated flow dot
      const t = (Date.now() / 3000) % 1
      const dx = a.px + (b.px - a.px) * t
      const dy = a.py + (b.py - a.py) * t
      ctx.beginPath()
      ctx.arc(dx, dy, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = STATUS_COLORS[status].text + '80'
      ctx.fill()
    })

    // Draw nodes
    NODES.forEach(node => {
      const { px, py } = nodeMap[node.id]
      const status = NODE_STATUSES[node.id]
      const colors = STATUS_COLORS[status]
      const isHovered = hoveredNode === node.id
      const radius = isHovered ? 22 : 18

      // Glow
      ctx.beginPath()
      ctx.arc(px, py, radius + 6, 0, Math.PI * 2)
      ctx.fillStyle = colors.glow
      ctx.fill()

      // Node circle
      ctx.beginPath()
      ctx.arc(px, py, radius, 0, Math.PI * 2)
      ctx.fillStyle = isDark ? '#111827' : '#ffffff'
      ctx.fill()
      ctx.strokeStyle = colors.border
      ctx.lineWidth = 2
      ctx.stroke()

      // Inner colored ring
      ctx.beginPath()
      ctx.arc(px, py, radius - 4, 0, Math.PI * 2)
      ctx.strokeStyle = colors.text + '60'
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Icon (emoji as text)
      ctx.font = `${isHovered ? 16 : 14}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(DEVICE_ICONS[node.type] || '📦', px, py)
    })

    const animFrame = requestAnimationFrame(() => {
      // Re-draw for animation
    })

    return () => cancelAnimationFrame(animFrame)
  }, [hoveredNode])

  return (
    <div className="ek-card ek-scan-line">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-ek-text-primary">Network Topology</h3>
          <p className="text-xs text-ek-text-muted mt-0.5">Live device status across monitoring enclave</p>
        </div>
        <div className="flex items-center gap-3">
          {['safe', 'warning', 'critical'].map(status => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status].text }} />
              <span className="text-[11px] text-ek-text-muted capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative h-80 rounded-lg overflow-hidden border border-ek-border bg-ek-bg-base/50">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseMove={(e) => {
            const rect = e.target.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            const w = rect.width
            const h = rect.height
            const hit = NODES.find(n => {
              const nx = (n.x / 100) * w
              const ny = (n.y / 100) * h
              return Math.hypot(x - nx, y - ny) < 22
            })
            setHoveredNode(hit?.id || null)
          }}
          onMouseLeave={() => setHoveredNode(null)}
        />
        {hoveredNode && (() => {
          const node = NODES.find(n => n.id === hoveredNode)
          if (!node) return null
          const status = NODE_STATUSES[node.id]
          return (
            <div className="absolute top-3 right-3 p-3 bg-ek-bg-card/95 backdrop-blur border border-ek-border rounded-lg shadow-xl z-10 min-w-[180px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{DEVICE_ICONS[node.type]}</span>
                <div>
                  <div className="text-sm font-semibold text-ek-text-primary">{node.label}</div>
                  <div className="text-[11px] font-mono text-ek-text-muted">{node.ip}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[status].text }} />
                <span className="text-xs capitalize" style={{ color: STATUS_COLORS[status].text }}>{status}</span>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}
