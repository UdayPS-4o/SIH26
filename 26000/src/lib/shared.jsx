import React, { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════
   EKADHARA — Shared design tokens, icons, and mock data
   Imported by every page module so the whole app stays consistent.
   ═══════════════════════════════════════════════════════════════════ */

// ── Color tokens ────────────────────────────────────────────────────
export const C = {
  bg:        '#0a0e17',
  bgAlt:     '#0d1321',
  panel:     'rgba(17,24,39,0.6)',
  panelSolid:'#111827',
  inset:     'rgba(15,23,42,0.4)',
  border:    'rgba(30,41,59,0.8)',
  borderSoft:'rgba(30,41,59,0.5)',
  text:      '#f1f5f9',
  textDim:   '#94a3b8',
  textMute:  '#64748b',
  textFaint: '#475569',
  accent:    '#00d4ff',
  accent2:   '#0ea5e9',
  violet:    '#a855f7',
  green:     '#10b981',
  amber:     '#f59e0b',
  red:       '#ef4444',
  blue:      '#3b82f6',
}

export const MONO = "'JetBrains Mono', 'Courier New', monospace"
export const DISPLAY = "'Space Grotesk', system-ui, sans-serif"

// ── Threat catalog ──────────────────────────────────────────────────
export const THREAT_TYPES = {
  ddos:      { name: 'Volumetric DDoS',    icon: '\u{1F30A}', color: '#ef4444', short: 'DDOS' },
  beaconing: { name: 'C2 Beaconing',       icon: '\u{1F4E1}', color: '#f59e0b', short: 'BEACON' },
  dga:       { name: 'DGA/DNS Tunnel',     icon: '\u{1F194}', color: '#a855f7', short: 'DGA' },
  malware:   { name: 'Encrypted Malware',  icon: '\u{1F512}', color: '#00d4ff', short: 'MALWARE' },
  scan:      { name: 'Port Scanning',      icon: '\u{1F50D}', color: '#3b82f6', short: 'SCAN' },
  exfil:     { name: 'Data Exfiltration',  icon: '\u{1F4E9}', color: '#ec4899', short: 'EXFIL' },
}

export const SEVERITY_LEVELS = ['critical', 'high', 'medium', 'low', 'info']

export const SEVERITY_COLOR = {
  critical: '#ef4444',
  high:     '#f59e0b',
  medium:   '#eab308',
  low:      '#3b82f6',
  info:     '#64748b',
}

export const SEVERITY_BADGE = {
  critical: 'ek-badge-critical',
  high:     'ek-badge-high',
  medium:   'ek-badge-medium',
  low:      'ek-badge-low',
  info:     'ek-badge-info',
}

export const VALIDITY_CHIP = {
  MEASURED:  'ek-chip-measured',
  ESTIMATED: 'ek-chip-estimated',
  MISSING:   'ek-chip-missing',
}

// ── Detector catalog (the 5+1 detectors from the docs) ──────────────
export const DETECTORS = [
  { id: 'ddos',      name: 'Volumetric DDoS',   method: 'Count-Min Sketch + SYN ratio',  window: '5 s',  threat: 'ddos' },
  { id: 'beaconing', name: 'C2 Beaconing',      method: 'Interval variance + MAD jitter', window: '60 s', threat: 'beaconing' },
  { id: 'dga',       name: 'DGA / DNS Tunnel',  method: 'Shannon entropy + n-gram model', window: '30 s', threat: 'dga' },
  { id: 'scan',      name: 'Port Scan',         method: 'HyperLogLog unique-port cardinality', window: '20 s', threat: 'scan' },
  { id: 'exfil',     name: 'Data Exfiltration', method: 'Byte-ratio asymmetry + ACK-Shadow', window: '120 s', threat: 'exfil' },
  { id: 'malware',   name: 'Encrypted Malware', method: 'TLS JA3 + payload entropy',     window: '30 s', threat: 'malware' },
]

// ── Degradation data (full-duplex vs diode capture) ─────────────────
export const degradationData = [
  { threat: 'scan',      label: 'Recon / Port Scan',   fullScore: 0.94, diodeScore: 0.94 },
  { threat: 'ddos',      label: 'Volumetric DDoS',     fullScore: 0.93, diodeScore: 0.92 },
  { threat: 'beaconing', label: 'C2 Beaconing',        fullScore: 0.91, diodeScore: 0.87 },
  { threat: 'dga',       label: 'DGA / DNS Tunnel',    fullScore: 0.88, diodeScore: 0.84 },
  { threat: 'malware',   label: 'Encrypted Malware',   fullScore: 0.86, diodeScore: 0.55 },
  { threat: 'exfil',     label: 'Data Exfiltration',   fullScore: 0.89, diodeScore: null },
]

// ── Mock data ───────────────────────────────────────────────────────
const rnd = (n) => Math.floor(Math.random() * n)
export const randHex = (len) => Array.from({ length: len }, () => rnd(16).toString(16)).join('')

/**
 * One alert, fully populated. Every page reads the same shape, so this is the
 * single source of truth — App.jsx's live generator uses it too.
 */
export const makeAlert = ({ id, timestamp } = {}) => {
  const threats = Object.keys(THREAT_TYPES)
  const threat = threats[rnd(threats.length)]
  const severity = SEVERITY_LEVELS[rnd(SEVERITY_LEVELS.length)]
  return {
    id: id ?? `ALT-${Date.now()}-${randHex(4)}`,
    timestamp: timestamp ?? Date.now(),
    threat,
    severity,
    confidence: (0.5 + Math.random() * 0.5).toFixed(2),
    srcIp: `10.${rnd(256)}.${rnd(256)}.${rnd(256)}`,
    dstIp: `192.168.${rnd(256)}.${rnd(256)}`,
    srcPort: 1024 + rnd(64000),
    dstPort: [22, 80, 443, 445, 3389, 53, 8080][rnd(7)],
    protocol: ['TCP', 'UDP', 'TCP', 'TCP'][rnd(4)],
    packets: 20 + rnd(4000),
    bytes: 1200 + rnd(900000),
    evidence: {
      features: ['packet_rate', 'byte_ratio', 'interval_variance'].slice(0, 2 + rnd(2)),
      hash: randHex(12),
    },
    validity: ['MEASURED', 'ESTIMATED', 'MISSING'][rnd(3)],
  }
}

export const generateMockAlerts = (count = 50) => {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) =>
    makeAlert({ id: `ALT-${String(1000 + i)}`, timestamp: now - rnd(3600000) })
  ).sort((a, b) => b.timestamp - a.timestamp)
}

// ── Formatters ──────────────────────────────────────────────────────
export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const fmtDateTime = (ts) =>
  new Date(ts).toLocaleString('en-US', { month: 'short', day: '2-digit', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const fmtBytes = (b) => {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
  return `${(b / 1073741824).toFixed(2)} GB`
}

export const fmtNum = (n) => n.toLocaleString('en-US')

// ── Icons (inline SVG, stroke = currentColor) ───────────────────────
const svg = (paths) => (p = {}) => (
  <svg width="16" height="16" {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
)

export const Icons = {
  dashboard: svg(<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></>),
  alert:     svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  activity:  svg(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),
  shield:    svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),
  settings:  svg(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  sun:       svg(<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>),
  moon:      svg(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>),
  play:      svg(<polygon points="5 3 19 12 5 21 5 3"/>),
  pause:     svg(<><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></>),
  zap:       svg(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>),
  globe:     svg(<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>),
  cpu:       svg(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>),
  database:  svg(<><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></>),
  network:   svg(<><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></>),
  lock:      svg(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  search:    svg(<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>),
  copy:      svg(<><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  warning:   svg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
  check:     svg(<polyline points="20 6 9 17 4 12"/>),
  x:         svg(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>),
  download:  svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  filter:    svg(<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>),
  clock:     svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  chevron:   svg(<polyline points="9 18 15 12 9 6"/>),
  link:      svg(<><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></>),
  file:      svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>),
  server:    svg(<><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></>),
  refresh:   svg(<><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></>),
  trending:  svg(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>),
  layers:    svg(<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>),
  eye:       svg(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>),
  hash:      svg(<><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></>),
}

// ── Reusable primitives ─────────────────────────────────────────────

/** Standard panel/card used everywhere. */
export function Card({ children, style, className = '', scan = false, ...rest }) {
  return (
    <div
      className={`ek-card ${scan ? 'ek-scan-line' : ''} ${className}`}
      style={{
        background: C.panel,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        position: 'relative',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  )
}

/** Card heading with title + subtitle + optional right-side slot. */
export function CardHeader({ title, subtitle, right, icon }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        {icon && (
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent,
          }}>{icon({ width: 15, height: 15 })}</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 11, color: C.textMute, margin: '4px 0 0' }}>{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

/** Small uppercase mono label. */
export function Label({ children, style }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: 2, color: C.textMute,
      textTransform: 'uppercase', fontFamily: MONO, ...style,
    }}>{children}</span>
  )
}

/** Pill badge. */
export function Pill({ children, color = C.accent, style }) {
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 5,
      background: `${color}1a`, border: `1px solid ${color}40`,
      fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
      color, fontFamily: MONO, whiteSpace: 'nowrap', ...style,
    }}>{children}</span>
  )
}

/** Animated count-up number. */
export function CountUp({ target, duration = 1200, decimals = 0, prefix = '', suffix = '', style }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1)
      setValue((1 - Math.pow(1 - p, 3)) * target)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  const out = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()
  return <span style={{ fontFamily: MONO, ...style }}>{prefix}{out}{suffix}</span>
}

/** Hardware-style slide toggle matching the dashboard's diode switch. */
export function Toggle({ on, onChange, color = C.accent, width = 76, height = 34 }) {
  const knob = height - 8
  return (
    <button
      onClick={() => onChange(!on)}
      style={{
        width, height, borderRadius: height / 3, flexShrink: 0,
        background: on ? `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)` : 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
        border: `2px solid ${on ? color : '#475569'}`,
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
        boxShadow: on ? `0 0 22px ${color}66, inset 0 1px 0 rgba(255,255,255,0.2)` : 'inset 0 2px 6px rgba(0,0,0,0.4)',
        transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{
        position: 'absolute', top: 3, left: 3, width: knob, height: knob, borderRadius: knob / 3,
        background: 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.7)',
        transform: on ? `translateX(${width - knob - 10}px)` : 'translateX(0)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </button>
  )
}

/** Sparkline / area chart from an array of numbers. Pure SVG, no deps. */
export function Sparkline({ data, width = 300, height = 60, color = C.accent, fill = true, strokeWidth = 2 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data), min = Math.min(...data)
  const span = max - min || 1
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * width,
    height - ((v - min) / span) * (height - 4) - 2,
  ])
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const gid = `spark-${color.replace('#', '')}-${width}-${height}`
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}

/** Fills its parent's width, re-measuring on resize. Use with Sparkline. */
export function useMeasure() {
  const ref = useRef(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    if (!ref.current) return
    const el = ref.current
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}

/** Horizontal progress/score bar. */
export function Bar({ value, max = 1, color = C.accent, height = 6, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(1, value / max)) * 100), 60 + delay)
    return () => clearTimeout(t)
  }, [value, max, delay])
  return (
    <div style={{ flex: 1, height, background: 'rgba(30,41,59,0.6)', borderRadius: height / 2, overflow: 'hidden' }}>
      <div style={{
        height: '100%', borderRadius: height / 2, width: `${w}%`,
        background: `linear-gradient(90deg, ${color}, ${color}99)`,
        boxShadow: `0 0 10px ${color}55`,
        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

/** Page-level stagger wrapper: children fade+slide in sequence. */
export function Stagger({ children, delay = 0, style }) {
  return (
    <div style={{ animation: `fadeSlideUp 0.5s ease-out ${delay}s both`, ...style }}>
      {children}
    </div>
  )
}
