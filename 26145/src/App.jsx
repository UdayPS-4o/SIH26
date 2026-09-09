import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import MetricsPanel from './components/MetricsPanel'
import ThreatMap from './components/ThreatMap'
import DeviceGrid from './components/DeviceGrid'
import TrafficVisualizer from './components/TrafficVisualizer'
import AlertDetail from './components/AlertDetail'

/* ═══════════════════════════════════════════════════════════════════
   EKADHARA — Explosive Demo Edition
   "See everything. Touch nothing."
   ═══════════════════════════════════════════════════════════════════ */

// ── Threat catalog ──────────────────────────────────────────────────
const THREAT_TYPES = {
  ddos:    { name: 'Volumetric DDoS',    icon: '\u{1F30A}', color: 'threat-critical' },
  beaconing:{ name: 'C2 Beaconing',     icon: '\u{1F4E1}', color: 'threat-high' },
  dga:     { name: 'DGA/DNS Tunnel',    icon: '\u{1F194}', color: 'threat-medium' },
  malware: { name: 'Encrypted Malware', icon: '\u{1F512}', color: 'threat-info' },
  scan:    { name: 'Port Scanning',     icon: '\u{1F50D}', color: 'threat-low' },
  exfil:   { name: 'Data Exfiltration', icon: '\u{1F4E9}', color: 'threat-critical' },
}
const SEVERITY_LEVELS = ['critical','high','medium','low','info']

// ── Mock data generators ─────────────────────────────────────────────
const generateMockAlerts = (count = 50) => {
  const alerts = []
  const threats = Object.keys(THREAT_TYPES)
  const now = Date.now()
  for (let i = 0; i < count; i++) {
    const threat = threats[Math.floor(Math.random() * threats.length)]
    const severity = SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)]
    alerts.push({
      id: `ALT-${String(1000 + i)}`,
      timestamp: now - Math.floor(Math.random() * 3600000),
      threat, severity,
      confidence: (0.5 + Math.random() * 0.5).toFixed(2),
      srcIp: `10.${~~(Math.random()*256)}.${~~(Math.random()*256)}.${~~(Math.random()*256)}`,
      dstIp: `192.168.${~~(Math.random()*256)}.${~~(Math.random()*256)}`,
      evidence: {
        features: ['packet_rate','byte_ratio','interval_variance'].slice(0, 2 + ~~(Math.random()*2)),
        hash: Array.from({length:12}, () => ~~(Math.random()*16).toString(16)).join(''),
      },
      validity: ['MEASURED','ESTIMATED','MISSING'][~~(Math.random()*3)],
    })
  }
  return alerts.sort((a, b) => b.timestamp - a.timestamp)
}

const degradationData = [
  { threat:'scan',    label:'Recon / Port Scan',     fullScore:0.94, diodeScore:0.94 },
  { threat:'ddos',    label:'Volumetric DDoS',       fullScore:0.93, diodeScore:0.92 },
  { threat:'beaconing',label:'C2 Beaconing',         fullScore:0.91, diodeScore:0.87 },
  { threat:'dga',     label:'DGA / DNS Tunnel',      fullScore:0.88, diodeScore:0.84 },
  { threat:'malware', label:'Encrypted Malware',     fullScore:0.86, diodeScore:0.55 },
  { threat:'exfil',   label:'Data Exfiltration',     fullScore:0.89, diodeScore:null },
]

// ── Icons (inline SVG) ───────────────────────────────────────────────
const Icons = {
  dashboard: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  alert:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  activity:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  shield:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  settings:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  sun:       (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  play:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  zap:       (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  globe:     (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  cpu:       (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  database:  (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  network:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>,
  lock:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  search:    (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  menu:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  copy:      (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  warning:   (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  activity2: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
}

// ═══════════════════════════════════════════════════════════════════
// SPLASH / INIT SCREEN
// ═══════════════════════════════════════════════════════════════════
function SplashScreen({ onComplete }) {
  const [step, setStep] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [ready, setReady] = useState(false)
  const lines = [
    '> INITIALIZING DETECTION ENGINE...',
    '> LOADING SIGNATURE DATABASE...',
    '> CALIBRATING ML MODELS...',
    '> ESTABLISHING SECURE ENCLAVE...',
    '> SYSTEM READY.',
  ]

  useEffect(() => {
    if (step >= lines.length) {
      setTimeout(() => { setReady(true) }, 300)
      setTimeout(() => { onComplete() }, 1200)
      return
    }
    const line = lines[step]
    let charIdx = 0
    const typeInterval = setInterval(() => {
      if (charIdx <= line.length) {
        setDisplayed(prev => {
          // remove previous line, add new chars
          const prevLines = prev.split('\n')
          prevLines[prevLines.length - 1] = line.slice(0, charIdx)
          return prevLines.join('\n')
        })
        charIdx++
      } else {
        clearInterval(typeInterval)
        setDisplayed(prev => prev + '\n')
        setTimeout(() => setStep(s => s + 1), 200)
      }
    }, 18)
    return () => clearInterval(typeInterval)
  }, [step, onComplete])

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'JetBrains Mono', 'Courier New', monospace",
      opacity: ready ? 0 : 1,
      transition: ready ? 'opacity 0.5s ease' : 'none',
      pointerEvents: ready ? 'none' : 'auto',
    }}>
      {/* Logo pulse */}
      <div style={{
        width:100, height:100, borderRadius:24,
        background:'linear-gradient(135deg, #00d4ff, #0ea5e9, #8b5cf7)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:42, fontWeight:900, color:'#fff', marginBottom:32,
        animation:'logoPulse 1.5s ease-in-out infinite',
        boxShadow:'0 0 60px rgba(0,212,255,0.4), 0 0 120px rgba(0,212,255,0.15)',
      }}>
        E
      </div>

      <h1 style={{
        fontSize:36, fontWeight:800, letterSpacing:8, color:'#fff',
        marginBottom:4, fontFamily:"'Space Grotesk', system-ui, sans-serif",
      }}>EKADHARA</h1>
      <p style={{ fontSize:11, letterSpacing:3, color:'#64748b', marginBottom:40, textTransform:'uppercase' }}>
        See everything. Touch nothing.
      </p>

      {/* Scanning line */}
      <div style={{
        position:'absolute', left:0, right:0, height:2,
        background:'linear-gradient(90deg, transparent 0%, #00d4ff 20%, rgba(0,212,255,0.8) 50%, #00d4ff 80%, transparent 100%)',
        boxShadow:'0 0 20px rgba(0,212,255,0.6), 0 0 60px rgba(0,212,255,0.2)',
        animation:'scanDown 2.5s ease-in-out infinite',
        opacity:0.7,
      }} />

      {/* Terminal */}
      <div style={{
        width:520, maxWidth:'90vw',
        background:'rgba(0,212,255,0.03)',
        border:'1px solid rgba(0,212,255,0.15)',
        borderRadius:12, padding:'16px 20px',
        fontSize:13, lineHeight:1.8, color:'#00d4ff',
        textAlign:'left', minHeight:140,
        boxShadow:'0 0 40px rgba(0,212,255,0.05), inset 0 0 40px rgba(0,212,255,0.02)',
      }}>
        {displayed.split('\n').map((line, i, arr) => (
          <div key={i} style={{ opacity: i === arr.length - 1 ? 1 : 0.7 }}>
            {line}
            {i === arr.length - 1 && <span style={{ animation:'blink 0.7s step-end infinite' }}>|</span>}
          </div>
        ))}
      </div>

      {/* Ready flash */}
      {ready && (
        <div style={{
          position:'fixed', inset:0,
          background:'radial-gradient(circle at center, rgba(0,212,255,0.08), transparent 70%)',
          animation:'readyFlash 1s ease-out forwards',
          pointerEvents:'none',
        }} />
      )}

      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(0,212,255,0.4), 0 0 120px rgba(0,212,255,0.15); }
          50% { transform: scale(1.08); box-shadow: 0 0 80px rgba(0,212,255,0.6), 0 0 160px rgba(0,212,255,0.25); }
        }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes readyFlash {
          0% { opacity: 1; } 100% { opacity: 0; }
        }
        @keyframes glitchIn {
          0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
          20% { clip-path: inset(92% 0 1% 0); transform: translate(1px, -1px); }
          40% { clip-path: inset(43% 0 1% 0); transform: translate(-1px, 2px); }
          60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 1px); }
          80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, -1px); }
          100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
        }
        @keyframes glitchText {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 1px); }
          40% { transform: translate(3px, -1px); }
          60% { transform: translate(-1px, -2px); }
          80% { transform: translate(2px, 2px); }
          100% { transform: translate(0); }
        }
        @keyframes criticalPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(239,68,68,0.3); }
          50% { box-shadow: 0 0 15px rgba(239,68,68,0.7), 0 0 30px rgba(239,68,68,0.3); }
        }
        @keyframes recBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes scanDown {
          0% { top: -2px; opacity: 0; }
          10% { opacity: 0.7; }
          90% { opacity: 0.7; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes livePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.4); }
        }
        @keyframes bannerPulse {
          0%, 100% { box-shadow: 0 0 15px rgba(245,158,11,0.1), inset 0 0 15px rgba(245,158,11,0.05); }
          50% { box-shadow: 0 0 30px rgba(245,158,11,0.2), inset 0 0 30px rgba(245,158,11,0.1); }
        }
        @keyframes bannerPulseGreen {
          0%, 100% { box-shadow: 0 0 20px rgba(16,185,129,0.1), inset 0 0 20px rgba(16,185,129,0.03); }
          50% { box-shadow: 0 0 40px rgba(16,185,129,0.2), inset 0 0 40px rgba(16,185,129,0.08); }
        }
        @keyframes amberFlashAnim {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes alertGlow {
          0% { box-shadow: inset 0 0 20px rgba(0,212,255,0.3), 0 0 15px rgba(0,212,255,0.2); background: rgba(0,212,255,0.08); }
          100% { box-shadow: none; background: transparent; }
        }
        @keyframes barFill {
          from { width: 0%; }
        }
        @keyframes countGlow {
          0%, 100% { text-shadow: 0 0 10px currentColor; }
          50% { text-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
        }
        @keyframes matrixColumn {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes diodeFlash {
          0% { opacity: 0; }
          10% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .ek-glitch-once {
          animation: glitchIn 0.3s ease-out;
        }
        .ek-critical-pulse {
          animation: criticalPulse 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MATRIX RAIN CANVAS
// ═══════════════════════════════════════════════════════════════════
function MatrixRain({ width, height }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン'
    const fontSize = 10
    const cols = Math.floor(width / fontSize)
    const drops = Array(cols).fill(0).map(() => Math.random() * -100)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
      ctx.fillRect(0, 0, width, height)
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < cols; i++) {
        const char = chars[~~(Math.random() * chars.length)]
        const y = drops[i] * fontSize
        const opacity = 0.15 + Math.random() * 0.1
        ctx.fillStyle = `rgba(0, 212, 255, ${opacity})`
        ctx.fillText(char, i * fontSize, y)
        if (y > height && Math.random() > 0.98) {
          drops[i] = 0
        }
        drops[i] += 0.4 + Math.random() * 0.3
      }
    }
    const interval = setInterval(draw, 60)
    return () => clearInterval(interval)
  }, [width, height])

  return (
    <canvas ref={canvasRef} style={{
      position:'absolute', top:0, left:0, width, height,
      pointerEvents:'none', opacity:0.5, zIndex:0,
    }} />
  )
}

// ═══════════════════════════════════════════════════════════════════
// ANIMATED COUNTER
// ═══════════════════════════════════════════════════════════════════
function AnimatedCounter({ target, duration = 1500, suffix = '', prefix = '', decimals = 0, delay = 0 }) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(t)
  }, [delay])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════
// COUNT-UP COMPONENT (for stat cards)
// ═══════════════════════════════════════════════════════════════════
function CountUp({ target, duration = 1500, suffix = '', prefix = '', decimals = 0 }) {
  const [value, setValue] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!started) return
    const start = performance.now()
    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(eased * target)
      if (progress < 1) requestAnimationFrame(step)
    }
    const raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [started, target, duration])

  const formatted = decimals > 0 ? value.toFixed(decimals) : Math.floor(value).toLocaleString()
  return <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{prefix}{formatted}{suffix}</span>
}

// ═══════════════════════════════════════════════════════════════════
// THREATS BLOCKED COUNTER
// ═══════════════════════════════════════════════════════════════════
function ThreatsBlockedCounter() {
  return (
    <div style={{
      background:'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))',
      border:'1px solid rgba(16,185,129,0.25)',
      borderRadius:12, padding:'20px 24px',
      display:'flex', alignItems:'center', gap:20,
      boxShadow:'0 0 30px rgba(16,185,129,0.1), inset 0 0 30px rgba(16,185,129,0.03)',
      animation:'bannerPulseGreen 3s ease-in-out infinite',
    }}>
      <div style={{
        width:48, height:48, borderRadius:12,
        background:'rgba(16,185,129,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center',
        fontSize:22, color:'#10b981',
        boxShadow:'0 0 20px rgba(16,185,129,0.2)',
      }}>
        {Icons.shield({ className:'w-6 h-6' })}
      </div>
      <div>
        <p style={{
          fontSize:10, fontWeight:700, letterSpacing:2, color:'#6ee7b7',
          textTransform:'uppercase', margin:'0 0 4px',
          fontFamily:"'JetBrains Mono', monospace",
        }}>Threats Blocked</p>
        <div style={{
          fontSize:28, fontWeight:800, color:'#10b981',
          fontFamily:"'JetBrains Mono', monospace",
          textShadow:'0 0 20px rgba(16,185,129,0.4), 0 0 40px rgba(16,185,129,0.2)',
          letterSpacing:2,
        }}>
          <CountUp target={847} />
        </div>
      </div>
      <div style={{
        marginLeft:'auto',
        fontSize:11, fontWeight:700, letterSpacing:1, color:'#10b981',
        fontFamily:"'JetBrains Mono', monospace",
        padding:'6px 14px', borderRadius:6,
        background:'rgba(16,185,129,0.1)',
        border:'1px solid rgba(16,185,129,0.3)',
        textShadow:'0 0 8px rgba(16,185,129,0.3)',
      }}>
        ALL CLEAR
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════════
function Sidebar({ currentPage, setPage, darkMode, toggleDarkMode, uptime }) {
  const navItems = [
    { id:'dashboard', label:'Dashboard', icon: Icons.dashboard },
    { id:'alerts',    label:'Alert Feed', icon: Icons.alert },
    { id:'threats',   label:'Threat Matrix', icon: Icons.activity },
    { id:'evidence',  label:'Evidence Vault', icon: Icons.shield },
    { id:'throughput',label:'Throughput', icon: Icons.cpu },
    { id:'settings',  label:'Settings', icon: Icons.settings },
  ]

  return (
    <aside className="ek-sidebar" style={{
      background:'linear-gradient(180deg, #0d1321 0%, #0a0e17 100%)',
      borderRight:'1px solid rgba(30,41,59,0.8)',
      width:260, height:'100vh', position:'fixed', left:0, top:0, zIndex:40, overflowY:'auto',
    }}>
      {/* Logo */}
      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(30,41,59,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:42, height:42, borderRadius:12,
            background:'linear-gradient(135deg, #00d4ff, #0ea5e9, #8b5cf7)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:20, fontWeight:900, color:'#fff',
            boxShadow:'0 0 25px rgba(0,212,255,0.3)',
          }}>E</div>
          <div>
            <h1 style={{
              fontFamily:"'Space Grotesk', system-ui, sans-serif",
              fontSize:18, fontWeight:800, letterSpacing:2, color:'#f1f5f9',
              lineHeight:1.1,
            }}>EKADHARA</h1>
            <p style={{ fontSize:9, letterSpacing:2, color:'#64748b', textTransform:'uppercase', fontFamily:"'JetBrains Mono', monospace" }}>
              See everything. Touch nothing.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding:'16px 0' }}>
        <div style={{ padding:'0 24px', marginBottom:8 }}>
          <p style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#64748b', textTransform:'uppercase' }}>Navigation</p>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              display:'flex', alignItems:'center', gap:12,
              padding:'10px 24px', margin:'2px 12px', borderRadius:8,
              color: currentPage === item.id ? '#00d4ff' : '#94a3b8',
              background: currentPage === item.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: currentPage === item.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              fontSize:13, fontWeight:500, cursor:'pointer',
              transition:'all 0.2s ease', width:'calc(100% - 24px)', textAlign:'left',
            }}
            onMouseEnter={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'rgba(15,23,42,0.6)'; e.currentTarget.style.color = '#f1f5f9'; } }}
            onMouseLeave={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; } }}
          >
            <div style={{ width:20, height:20, display:'flex' }}>{item.icon({ className:'w-5 h-5' })}</div>
            {item.label}
          </button>
        ))}
      </nav>

      {/* System Status */}
      <div style={{ padding:16, borderTop:'1px solid rgba(30,41,59,0.6)' }}>
        <p style={{ fontSize:9, fontWeight:700, letterSpacing:2, color:'#64748b', textTransform:'uppercase', marginBottom:12, padding:'0 8px' }}>System Status</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10, padding:'0 8px' }}>
          {[
            { label:'Capture', status:'ACTIVE', color:'#10b981' },
            { label:'Analysis', status:'STREAMING', color:'#10b981' },
            { label:'Egress', status:'LOCKED', color:'#00d4ff' },
          ].map(s => (
            <div key={s.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12 }}>
              <span style={{ color:'#94a3b8' }}>{s.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11, fontFamily:"'JetBrains Mono', monospace", fontWeight:600, color:s.color }}>{s.status}</span>
                <div style={{
                  width:6, height:6, borderRadius:'50%', background:s.color,
                  boxShadow:`0 0 8px ${s.color}`,
                  animation:'blink 1.5s ease-in-out infinite',
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Uptime */}
      <div style={{ padding:'0 16px 16px' }}>
        <div style={{
          padding:12, borderRadius:8,
          background:'rgba(0,212,255,0.03)', border:'1px solid rgba(30,41,59,0.6)',
          textAlign:'center',
        }}>
          <p style={{ fontSize:9, color:'#64748b', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Uptime</p>
          <p style={{
            fontSize:14, fontFamily:"'JetBrains Mono', monospace", fontWeight:700,
            color:'#00d4ff', letterSpacing:1,
            textShadow:'0 0 10px rgba(0,212,255,0.3)',
          }}>{uptime}</p>
        </div>
      </div>

      {/* Dark mode toggle */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, padding:16,
        borderTop:'1px solid rgba(30,41,59,0.6)',
      }}>
        <button
          onClick={toggleDarkMode}
          style={{
            width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            padding:'10px 16px', borderRadius:8,
            background:'rgba(15,23,42,0.6)', border:'1px solid rgba(30,41,59,0.8)',
            color:'#94a3b8', fontSize:13, cursor:'pointer',
            transition:'all 0.2s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#f1f5f9'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(30,41,59,0.8)'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          {darkMode ? <>{Icons.sun({ className:'w-4 h-4' })} <span>Light Mode</span></> : <>{Icons.moon({ className:'w-4 h-4' })} <span>Dark Mode</span></>}
        </button>
      </div>
    </aside>
  )
}

// ═══════════════════════════════════════════════════════════════════
// TOPBAR
// ═══════════════════════════════════════════════════════════════════
function Topbar({ stats, hasCritical }) {
  return (
    <header style={{
      background:'rgba(10,14,23,0.92)',
      backdropFilter:'blur(12px)',
      borderBottom:'1px solid rgba(30,41,59,0.6)',
      height:60, position:'sticky', top:0, zIndex:30,
      overflow:'hidden',
    }}>
      {/* Matrix rain in header */}
      <div style={{ position:'absolute', inset:0, opacity:0.35, pointerEvents:'none' }}>
        {Array.from({length:40}, (_, i) => (
          <span key={i} style={{
            position:'absolute', top:0,
            left: `${(i / 40) * 100}%`,
            fontSize:9, fontFamily:"'JetBrains Mono', monospace",
            color:'#00d4ff',
            animation: `matrixColumn ${3 + Math.random() * 4}s linear infinite`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: 0.3 + Math.random() * 0.4,
          }}>{'01アイウエ'[~~(Math.random()*8)]}</span>
        ))}
      </div>

      <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', height:'100%' }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <h2 style={{
            fontFamily:"'Space Grotesk', system-ui, sans-serif",
            fontSize:17, fontWeight:700, color:'#f1f5f9',
          }}>Dashboard</h2>
          <div style={{
            display:'flex', alignItems:'center', gap:8, fontSize:11, color:'#64748b',
            fontFamily:"'JetBrains Mono', monospace",
          }}>
            <span style={{
              padding:'2px 8px', borderRadius:4,
              background:'rgba(15,23,42,0.8)', border:'1px solid rgba(30,41,59,0.8)',
            }}>{stats.source}</span>
            <span>·</span>
            <span>{stats.interface}</span>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:20 }}>
          {/* LIVE indicator */}
          <div style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'4px 12px', borderRadius:6,
            background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
            boxShadow:'0 0 15px rgba(239,68,68,0.1)',
          }}>
            <div style={{
              width:7, height:7, borderRadius:'50%', background:'#ef4444',
              boxShadow:'0 0 8px #ef4444',
              animation:'livePulse 1s ease-in-out infinite',
            }} />
            <span style={{
              fontSize:10, fontWeight:800, letterSpacing:2, color:'#ef4444',
              fontFamily:"'JetBrains Mono', monospace",
              animation:'livePulse 1s ease-in-out infinite',
            }}>LIVE</span>
            <span style={{
              fontSize:9, fontWeight:700, letterSpacing:1.5, color:'#ef4444',
              fontFamily:"'JetBrains Mono', monospace",
              border:'1px solid rgba(239,68,68,0.5)',
              padding:'1px 5px', borderRadius:3,
              animation:'recBlink 1s step-end infinite',
            }}>REC</span>
          </div>

          <div style={{
            display:'flex', alignItems:'center', gap:16,
            fontFamily:"'JetBrains Mono', monospace", fontSize:12,
          }}>
            {[
              { label:'FLOWS/S', value: stats.flowsPerSec.toLocaleString(), color:'#00d4ff' },
              { label:'DROP', value:`${stats.dropRate}%`, color:'#10b981' },
              { label:'P99', value:`${stats.p99Latency}ms`, color:'#f1f5f9' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div style={{ width:1, height:28, background:'rgba(30,41,59,0.8)' }} />}
                <div>
                  <div style={{ fontSize:9, letterSpacing:1, color:'#64748b', marginBottom:1 }}>{s.label}</div>
                  <div style={{ fontWeight:700, color:s.color, fontSize:14 }}>{s.value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ALERT FEED
// ═══════════════════════════════════════════════════════════════════
function AlertFeed({ alerts, onSelectAlert, selectedAlert }) {
  const [isPaused, setIsPaused] = useState(false)
  const [glitchId, setGlitchId] = useState(null)
  const [newAlertIds, setNewAlertIds] = useState(new Set())
  const feedRef = useRef(null)
  const formatTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' })
  const getSeverityBadge = (s) => ({ critical:'ek-badge-critical', high:'ek-badge-high', medium:'ek-badge-medium', low:'ek-badge-low', info:'ek-badge-info' }[s] || 'ek-badge-low')
  const getValidityChip = (v) => ({ MEASURED:'ek-chip-measured', ESTIMATED:'ek-chip-estimated', MISSING:'ek-chip-missing' }[v] || 'ek-chip-estimated')

  // Auto-scroll feed
  useEffect(() => {
    if (isPaused || !feedRef.current) return
    const el = feedRef.current
    const interval = setInterval(() => {
      if (el.scrollTop < el.scrollHeight - el.clientHeight - 50) {
        el.scrollTop += 1
      }
    }, 30)
    return () => clearInterval(interval)
  }, [isPaused, alerts.length])

  // Track new alert IDs for dramatic entrance
  useEffect(() => {
    if (alerts.length > 0) {
      const firstId = alerts[0].id
      setGlitchId(firstId)
      setNewAlertIds(prev => new Set(prev).add(firstId))
      setTimeout(() => setGlitchId(null), 400)
      // Clean up glow after animation
      setTimeout(() => {
        setNewAlertIds(prev => {
          const next = new Set(prev)
          next.delete(firstId)
          return next
        })
      }, 1200)
    }
  }, [alerts.length, alerts[0]?.id])

  return (
    <div className="ek-card ek-scan-line" style={{
      background:'rgba(17,24,39,0.6)',
      border:'1px solid rgba(30,41,59,0.8)',
      borderRadius:12, display:'flex', flexDirection:'column', height:'100%',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', margin:0 }}>Alert Feed</h3>
          <p style={{ fontSize:11, color:'#64748b', margin:'4px 0 0' }}>
            {alerts.length} alerts · <span style={{ color: isPaused ? '#f59e0b' : '#00d4ff' }}>{isPaused ? 'PAUSED' : 'LIVE'}</span>
          </p>
        </div>
        <button onClick={() => setIsPaused(!isPaused)} style={{
          padding:6, borderRadius:8,
          background:'rgba(15,23,42,0.6)', border:'1px solid rgba(30,41,59,0.8)',
          cursor:'pointer', color: isPaused ? '#00d4ff' : '#64748b',
          display:'flex', alignItems:'center',
        }}>
          {isPaused ? Icons.play({ className:'w-4 h-4' }) : Icons.pause({ className:'w-4 h-4' })}
        </button>
      </div>

      <div ref={feedRef} style={{ flex:1, overflowY:'auto', paddingRight:4, maxHeight:560 }}>
        {alerts.slice(0, 30).map((alert, idx) => {
          const threatInfo = THREAT_TYPES[alert.threat]
          const isGlitching = glitchId === alert.id && idx === 0
          return (
            <div
              key={alert.id}
              className={isGlitching ? 'ek-glitch-once' : ''}
              onClick={() => onSelectAlert(alert)}
              style={{
                padding:'10px 14px', borderRadius:8, marginBottom:4,
                borderBottom:'1px solid rgba(15,23,42,0.6)',
                cursor:'pointer',
                background: selectedAlert?.id === alert.id ? 'rgba(0,212,255,0.05)' : 'transparent',
                border: selectedAlert?.id === alert.id ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
                transition:'all 0.2s ease',
                animation: idx === 0 && !isGlitching && newAlertIds.has(alert.id)
                  ? 'alertGlow 1.2s ease-out'
                  : idx === 0 && !isGlitching
                    ? 'fadeSlideUp 0.4s ease-out'
                    : undefined,
                ...(alert.severity === 'critical' && !newAlertIds.has(alert.id) ? { animation:'criticalPulse 1.5s ease-in-out infinite' } : {}),
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.8)'; }}
              onMouseLeave={e => { if (selectedAlert?.id !== alert.id) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display:'flex', gap:10 }}>
                <span style={{ fontSize:16, lineHeight:1.5 }}>{threatInfo?.icon || '⚠️'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:'#f1f5f9' }}>{threatInfo?.name || alert.threat}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityBadge(alert.severity)}`}
                      style={isGlitching ? { animation:'glitchText 0.3s ease-in-out' } : {}}>
                      {alert.severity}
                    </span>
                    <span style={{ fontSize:10, fontFamily:"'JetBrains Mono', monospace", color:'#64748b', marginLeft:'auto' }}>
                      {formatTime(alert.timestamp)}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#94a3b8' }}>
                    <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{alert.srcIp}</span>
                    <span style={{ color:'#475569' }}>→</span>
                    <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{alert.dstIp}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                    <span style={{ fontSize:10, color:'#64748b' }}>conf: <span style={{ fontFamily:"'JetBrains Mono', monospace", color:'#94a3b8' }}>{~~(alert.confidence * 100)}%</span></span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getValidityChip(alert.validity)}`}>{alert.validity}</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// DEGRADATION MATRIX
// ═══════════════════════════════════════════════════════════════════
function DegradationMatrix({ diodeMode, setDiodeMode, ackShadow, setAckShadow, diodeFlash }) {
  const [animatedBars, setAnimatedBars] = useState(false)
  const [diodeTransitioning, setDiodeTransitioning] = useState(false)
  const [amberFlash, setAmberFlash] = useState(false)
  const [prevDiode, setPrevDiode] = useState(false)

  // Animate bars on mount
  useEffect(() => {
    const t = setTimeout(() => setAnimatedBars(true), 500)
    return () => clearTimeout(t)
  }, [])

  const handleDiodeToggle = () => {
    if (prevDiode !== diodeMode) return
    if (!diodeMode) {
      // Activating diode mode - dramatic transition
      setAmberFlash(true)
      setDiodeTransitioning(true)
      setTimeout(() => setDiodeTransitioning(false), 800)
      setTimeout(() => setAmberFlash(false), 400)
    }
    setPrevDiode(!diodeMode)
    setDiodeMode(!diodeMode)
  }

  const handleAckShadow = () => {
    setAckShadow(!ackShadow)
  }

  return (
    <div className="ek-card" style={{
      background:'rgba(17,24,39,0.6)',
      border:'1px solid rgba(30,41,59,0.8)',
      borderRadius:12, position:'relative', overflow:'hidden',
    }}>
      {/* Dramatic diode mode flash */}
      {diodeTransitioning && (
        <div style={{
          position:'absolute', inset:0,
          background:'radial-gradient(circle at center, rgba(239,68,68,0.2), transparent 70%)',
          animation:'diodeFlash 0.8s ease-out forwards',
          pointerEvents:'none', zIndex:10,
        }} />
      )}
      {/* Amber flash on toggle */}
      {amberFlash && (
        <div style={{
          position:'absolute', inset:0,
          background:'radial-gradient(circle at center, rgba(245,158,11,0.15), transparent 70%)',
          animation:'amberFlashAnim 0.5s ease-out forwards',
          pointerEvents:'none', zIndex:9,
        }} />
      )}

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
        <div>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#f1f5f9', margin:0 }}>Degradation Matrix</h3>
          <p style={{ fontSize:11, color:'#64748b', margin:'4px 0 0' }}>Detection performance across capture modes</p>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <div style={{
            padding:'4px 10px', borderRadius:6,
            background: !diodeMode ? 'rgba(0,212,255,0.1)' : 'rgba(15,23,42,0.6)',
            border:`1px solid ${!diodeMode ? 'rgba(0,212,255,0.3)' : 'rgba(30,41,59,0.6)'}`,
          }}>
            <span style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color: !diodeMode ? '#00d4ff' : '#64748b' }}>BOTH</span>
          </div>
          <div style={{
            padding:'4px 10px', borderRadius:6,
            background: diodeMode ? 'rgba(239,68,68,0.1)' : 'rgba(15,23,42,0.6)',
            border:`1px solid ${diodeMode ? 'rgba(239,68,68,0.3)' : 'rgba(30,41,59,0.6)'}`,
          }}>
            <span style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color: diodeMode ? '#ef4444' : '#64748b' }}>FWD</span>
          </div>
        </div>
      </div>

      {/* Performance degradation warning */}
      {diodeMode && (
        <div style={{
          padding:'12px 16px', borderRadius:8, marginBottom:16,
          background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)',
          display:'flex', alignItems:'center', gap:10,
          animation:'fadeSlideUp 0.5s ease-out',
        }}>
          <div style={{
            padding:6, borderRadius:6,
            background:'rgba(239,68,68,0.15)',
            color:'#ef4444', fontSize:16, display:'flex',
          }}>{Icons.warning({ className:'w-4 h-4' })}</div>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:'#ef4444', letterSpacing:0.5 }}>
              PERFORMANCE DEGRADATION DETECTED
            </span>
            <p style={{ fontSize:10, color:'#f87171', margin:'2px 0 0' }}>
              Encrypted malware detection degraded {((0.86 - 0.55) / 0.86 * 100).toFixed(0)}% under diode capture. ACK-Shadow available for exfiltration recovery.
            </p>
          </div>
        </div>
      )}

      {/* Matrix rows */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {degradationData.map((row, idx) => {
          const diodeScore = diodeMode && row.threat === 'exfil'
            ? (ackShadow ? 0.83 : 0.00)
            : diodeMode ? row.diodeScore : row.fullScore
          const isDegraded = diodeMode && diodeScore < row.fullScore
          const isCritical = diodeMode && diodeScore < 0.6
          const targetWidth = animatedBars ? `${diodeScore * 100}%` : '0%'
          const fullWidth = animatedBars ? `${row.fullScore * 100}%` : '0%'

          return (
            <div key={row.threat} style={{
              padding:12, borderRadius:10,
              background: isCritical ? 'rgba(239,68,68,0.05)' : isDegraded ? 'rgba(245,158,11,0.05)' : 'rgba(15,23,42,0.4)',
              border:`1px solid ${isCritical ? 'rgba(239,68,68,0.2)' : isDegraded ? 'rgba(245,158,11,0.2)' : 'rgba(30,41,59,0.5)'}`,
              animation:`fadeSlideUp 0.4s ease-out ${0.1 * idx}s both`,
              ...(row.threat === 'malware' && isCritical ? {
                animation: `criticalPulse 1.2s ease-in-out infinite`,
              } : {}),
            }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:14 }}>{THREAT_TYPES[row.threat]?.icon}</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#f1f5f9' }}>{row.label}</span>
                </div>
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  {isDegraded && <span className={isCritical ? 'ek-badge-critical' : 'ek-badge-high'} style={{
                    padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase',
                  }}>{isCritical ? '⚠ Degraded' : 'Minor loss'}</span>}
                  {!diodeMode && <span className="ek-badge-low" style={{
                    padding:'2px 8px', borderRadius:4, fontSize:9, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase',
                  }}>Optimal</span>}
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {/* Full duplex bar */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:'#64748b', width:36 }}>BOTH</span>
                  <div style={{ flex:1, height:6, background:'rgba(30,41,59,0.6)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:3,
                      background:'linear-gradient(90deg, #00d4ff, #0ea5e9)',
                      width: fullWidth,
                      animation:'barFill 1s ease-out',
                    }} />
                  </div>
                  <span style={{ fontSize:11, fontFamily:"'JetBrains Mono', monospace", color:'#94a3b8', width:36, textAlign:'right' }}>
                    {(row.fullScore * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Diode bar */}
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:'#64748b', width:36 }}>FWD</span>
                  <div style={{ flex:1, height:6, background:'rgba(30,41,59,0.6)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:3,
                      background: isCritical ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                        : isDegraded ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #00d4ff, #0ea5e9)',
                      width: targetWidth,
                      animation:'barFill 1s ease-out',
                      transition: diodeMode ? 'all 0.7s cubic-bezier(0.4,0,0.2,1)' : 'none',
                    }} />
                  </div>
                  <span style={{
                    fontSize:11, fontFamily:"'JetBrains Mono', monospace", width:36, textAlign:'right',
                    color: isCritical ? '#ef4444' : isDegraded ? '#f59e0b' : '#94a3b8',
                    transition:'color 0.5s ease',
                  }}>
                    {diodeScore !== null ? `${(diodeScore * 100).toFixed(0)}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Huge diode toggle button */}
      <div style={{
        marginTop:20, padding:20,
        background:'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(10,14,23,0.9))',
        border:'1px solid rgba(30,41,59,0.8)',
        borderRadius:12, textAlign:'center',
      }}>
        <p style={{ fontSize:10, color:'#64748b', letterSpacing:2, textTransform:'uppercase', margin:'0 0 12px', fontFamily:"'JetBrains Mono', monospace" }}>
          Network Capture Mode
        </p>

        {/* Toggle buttons side by side */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24 }}>
          {/* Diode Mode Toggle */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <button onClick={handleDiodeToggle} style={{
              width:100, height:44, borderRadius:10,
              background: diodeMode
                ? 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)'
                : 'linear-gradient(180deg, #334155 0%, #1e293b 100%)',
              border: diodeMode ? '2px solid #ef4444' : '2px solid #475569',
              cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow: diodeMode
                ? '0 0 35px rgba(239,68,68,0.5), 0 6px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                : '0 4px 12px rgba(0,0,0,0.4), inset 0 2px 6px rgba(0,0,0,0.4)',
              transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
              transform: diodeMode ? 'translateY(-1px)' : 'translateY(0)',
            }}>
              {/* 3D toggle knob */}
              <div style={{
                position:'absolute', top:3, left:3,
                width:32, height:36, borderRadius:7,
                background: diodeMode
                  ? 'linear-gradient(180deg, #fef2f2 0%, #fecaca 100%)'
                  : 'linear-gradient(180deg, #f1f5f9 0%, #cbd5e1 100%)',
                boxShadow: diodeMode
                  ? '0 3px 10px rgba(0,0,0,0.4), 0 0 15px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.8)'
                  : '0 3px 10px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.6)',
                transform: diodeMode ? 'translateX(56px)' : 'translateX(0)',
                transition:'transform 0.4s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s ease',
              }}>
                {/* Knob grip lines */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, padding:'8px 0', alignItems:'center', justifyContent:'center', height:'100%' }}>
                  <div style={{ width:14, height:1, background:'rgba(0,0,0,0.15)', borderRadius:1 }} />
                  <div style={{ width:14, height:1, background:'rgba(0,0,0,0.15)', borderRadius:1 }} />
                  <div style={{ width:14, height:1, background:'rgba(0,0,0,0.15)', borderRadius:1 }} />
                </div>
              </div>
              <span style={{
                position:'absolute', top:'50%', left:10, transform:'translateY(-50%)',
                fontSize:9, fontWeight:800, letterSpacing:1, textTransform:'uppercase',
                color: diodeMode ? 'transparent' : '#94a3b8',
                transition:'color 0.3s ease',
              }}>OFF</span>
              <span style={{
                position:'absolute', top:'50%', right:10, transform:'translateY(-50%)',
                fontSize:9, fontWeight:800, letterSpacing:1, textTransform:'uppercase',
                color: diodeMode ? '#fff' : 'transparent',
                transition:'color 0.3s ease',
                textShadow: diodeMode ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
              }}>ON</span>
            </button>
            <span style={{ fontSize:10, fontWeight:600, color: diodeMode ? '#ef4444' : '#64748b', letterSpacing:0.5,
              textShadow: diodeMode ? '0 0 10px rgba(239,68,68,0.3)' : 'none',
            }}>
              DIODE MODE
            </span>
          </div>

          {/* Divider */}
          <div style={{ width:1, height:50, background:'rgba(30,41,59,0.8)' }} />

          {/* ACK-Shadow Toggle */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
            <button onClick={handleAckShadow} style={{
              width:100, height:44, borderRadius:10,
              background: ackShadow
                ? 'linear-gradient(135deg, #a855f7, #7c3aed)'
                : 'linear-gradient(135deg, #1e293b, #0f172a)',
              border: ackShadow ? '2px solid rgba(168,85,247,0.5)' : '2px solid #334155',
              cursor:'pointer', position:'relative', overflow:'hidden',
              boxShadow: ackShadow
                ? '0 0 30px rgba(168,85,247,0.3), inset 0 2px 4px rgba(0,0,0,0.3)'
                : 'inset 0 2px 4px rgba(0,0,0,0.3)',
              transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{
                position:'absolute', top:4, left:4,
                width:32, height:32, borderRadius:6,
                background:'linear-gradient(135deg, #f8fafc, #e2e8f0)',
                boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
                transform: ackShadow ? 'translateX(56px)' : 'translateX(0)',
                transition:'transform 0.4s cubic-bezier(0.4,0,0.2,1)',
              }} />
              <span style={{
                position:'absolute', top:'50%', left:10, transform:'translateY(-50%)',
                fontSize:9, fontWeight:800, letterSpacing:1, textTransform:'uppercase',
                color: ackShadow ? 'transparent' : '#94a3b8',
                transition:'color 0.3s ease',
              }}>OFF</span>
              <span style={{
                position:'absolute', top:'50%', right:10, transform:'translateY(-50%)',
                fontSize:9, fontWeight:800, letterSpacing:1, textTransform:'uppercase',
                color: ackShadow ? '#fff' : 'transparent',
                transition:'color 0.3s ease',
              }}>ON</span>
            </button>
            <span style={{ fontSize:10, fontWeight:600, color: ackShadow ? '#a855f7' : '#64748b', letterSpacing:0.5 }}>
              ACK-SHADOW
            </span>
          </div>
        </div>

        {/* Diode mode info */}
        {diodeMode && (
          <div style={{
            marginTop:14, padding:'10px 14px', borderRadius:8,
            background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.15)',
            fontSize:10, color:'#f87171', textAlign:'left',
            fontFamily:"'JetBrains Mono', monospace",
            animation:'fadeSlideUp 0.3s ease-out',
          }}>
            {ackShadow
              ? '\u{1F30A} Exfiltration detection: 83% (via TCP ACK reconstruction)'
              : '\u{1F6A8} Exfiltration detection: BLIND (enable ACK-Shadow to recover)'}
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// EVIDENCE PANEL
// ═══════════════════════════════════════════════════════════════════
function EvidencePanel({ alert }) {
  const [copied, setCopied] = useState(false)

  if (!alert) return (
    <div className="ek-card" style={{
      background:'rgba(17,24,39,0.6)', border:'1px solid rgba(30,41,59,0.8)',
      borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:400, color:'#64748b',
    }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:36, marginBottom:8, opacity:0.3 }}>{Icons.shield({})}</div>
        <p style={{ fontSize:13 }}>Select an alert to view evidence</p>
      </div>
    </div>
  )

  const threatInfo = THREAT_TYPES[alert.threat]
  const getSeverityClass = (s) => ({ critical:'ek-badge-critical', high:'ek-badge-high', medium:'ek-badge-medium', low:'ek-badge-low', info:'ek-badge-info' }[s] || 'ek-badge-low')

  // Generate mini timeline
  const timelineSteps = useMemo(() => {
    const ts = alert.timestamp
    return [
      { t: ts - 120000, label:'Initial Beacon', color:'#3b82f6' },
      { t: ts - 60000,  label:'Anomaly Detected', color:'#f59e0b' },
      { t: ts,         label:'Alert Triggered', color:'#00d4ff' },
      { t: ts + 30000, label:'Response Sent', color:'#10b981' },
    ]
  }, [alert])

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(alert.evidence.hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="ek-card ek-scan-line" style={{
      background:'rgba(17,24,39,0.6)',
      border:'1px solid rgba(30,41,59,0.8)',
      borderRadius:12,
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h3 style={{ fontSize:13, fontWeight:700, color:'#f1f5f9', margin:0 }}>Evidence Details</h3>
          <p style={{ fontSize:11, color:'#64748b', margin:'4px 0 0' }}>Supporting evidence for selected alert</p>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {/* Merkle Chain Verified Badge */}
        <div style={{
          padding:'10px 14px', borderRadius:8,
          background:'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.03))',
          border:'1px solid rgba(16,185,129,0.25)',
          display:'flex', alignItems:'center', gap:10,
          boxShadow:'0 0 20px rgba(16,185,129,0.08)',
        }}>
          <div style={{
            width:28, height:28, borderRadius:6,
            background:'rgba(16,185,129,0.15)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#10b981', fontSize:14,
          }}>✓</div>
          <div>
            <span style={{ fontSize:11, fontWeight:700, color:'#10b981', letterSpacing:0.5 }}>MERKLE CHAIN VERIFIED</span>
            <p style={{ fontSize:9, color:'#6ee7b7', margin:'2px 0 0', fontFamily:"'JetBrains Mono', monospace" }}>
              Block #{Math.floor(Math.random() * 900000 + 100000)} · Nonce: 0x{Array.from({length:8}, () => ~~(Math.random()*16).toString(16)).join('')}
            </p>
          </div>
        </div>

        {/* Threat info */}
        <div style={{
          padding:12, borderRadius:8,
          background:'rgba(15,23,42,0.4)', border:'1px solid rgba(30,41,59,0.6)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:18 }}>{threatInfo?.icon}</span>
            <span style={{ fontSize:13, fontWeight:600, color:'#f1f5f9' }}>{threatInfo?.name}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getSeverityClass(alert.severity)}`}>{alert.severity}</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#94a3b8' }}>
            <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{alert.srcIp}</span>
            <span style={{ color:'#475569' }}>→</span>
            <span style={{ fontFamily:"'JetBrains Mono', monospace" }}>{alert.dstIp}</span>
          </div>
        </div>

        {/* Confidence */}
        <div>
          <div style={{ fontSize:10, color:'#64748b', marginBottom:6, letterSpacing:0.5 }}>Confidence Score</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ flex:1, height:8, background:'rgba(30,41,59,0.6)', borderRadius:4, overflow:'hidden' }}>
              <div style={{
                height:'100%', borderRadius:4,
                background:'linear-gradient(90deg, #00d4ff, #a855f7)',
                width:`${alert.confidence * 100}%`,
                transition:'width 0.7s ease',
                boxShadow:`0 0 10px rgba(0,212,255,0.3)`,
              }} />
            </div>
            <span style={{ fontSize:14, fontFamily:"'JetBrains Mono', monospace", fontWeight:700, color:'#f1f5f9' }}>
              {~~(alert.confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Attack Timeline Mini */}
        <div>
          <div style={{ fontSize:10, color:'#64748b', marginBottom:8, letterSpacing:0.5 }}>Attack Progression</div>
          <div style={{ display:'flex', flexDirection:'column', gap:0, position:'relative', paddingLeft:16 }}>
            {/* Vertical line */}
            <div style={{
              position:'absolute', left:5, top:8, bottom:8,
              width:1, background:'linear-gradient(180deg, rgba(0,212,255,0.3), rgba(168,85,247,0.3))',
            }} />
            {timelineSteps.map((step, idx) => (
              <div key={idx} style={{
                display:'flex', alignItems:'center', gap:10, padding:'6px 0',
                position:'relative',
              }}>
                <div style={{
                  width:10, height:10, borderRadius:'50%',
                  background:step.color,
                  boxShadow:`0 0 8px ${step.color}`,
                  flexShrink:0,
                  position:'relative', zIndex:1,
                }} />
                <div>
                  <span style={{ fontSize:11, fontWeight:600, color:'#f1f5f9' }}>{step.label}</span>
                  <span style={{ fontSize:9, fontFamily:"'JetBrains Mono', monospace", color:'#64748b', marginLeft:8 }}>
                    {new Date(step.t).toLocaleTimeString('en-US', { hour12:false, minute:'2-digit', second:'2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Hash with copy */}
        <div>
          <div style={{ fontSize:10, color:'#64748b', marginBottom:6, letterSpacing:0.5 }}>Evidence Hash (SHA-256)</div>
          <div
            onClick={copyHash}
            style={{
              padding:'10px 12px', borderRadius:8,
              background:'rgba(0,212,255,0.03)',
              border:'1px solid rgba(0,212,255,0.15)',
              fontFamily:"'JetBrains Mono', monospace",
              fontSize:10, color:'#00d4ff', wordBreak:'break-all',
              cursor:'pointer', display:'flex', alignItems:'center', gap:8,
              transition:'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.background = 'rgba(0,212,255,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.15)'; e.currentTarget.style.background = 'rgba(0,212,255,0.03)'; }}
          >
            <span style={{ flex:1 }}>{alert.evidence.hash}</span>
            <span style={{
              fontSize:9, color: copied ? '#10b981' : '#64748b',
              transition:'color 0.2s ease',
              display:'flex', alignItems:'center', gap:4,
            }}>
              {copied ? 'COPIED!' : <>{Icons.copy({ className:'w-3 h-3' })} COPY</>}
            </span>
          </div>
        </div>

        {/* Data Validity */}
        <div>
          <div style={{ fontSize:10, color:'#64748b', marginBottom:6, letterSpacing:0.5 }}>Data Validity</div>
          <span className={alert.validity === 'MEASURED' ? 'ek-chip-measured' : alert.validity === 'ESTIMATED' ? 'ek-chip-estimated' : 'ek-chip-missing'} style={{
            padding:'4px 10px', borderRadius:4,
            fontSize:10, fontWeight:700, letterSpacing:0.5, textTransform:'uppercase',
          }}>{alert.validity}</span>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// THREAT LEVEL BANNER
// ═══════════════════════════════════════════════════════════════════
function ThreatLevelBanner({ level }) {
  const colors = {
    elevated: { bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)', text:'#f59e0b', glow:'rgba(245,158,11,0.15)' },
    high:     { bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.3)',   text:'#ef4444', glow:'rgba(239,68,68,0.15)' },
    moderate: { bg:'rgba(59,130,246,0.1)',  border:'rgba(59,130,246,0.3)',  text:'#3b82f6', glow:'rgba(59,130,246,0.15)' },
  }
  const c = colors[level] || colors.elevated

  return (
    <div style={{
      position:'relative', overflow:'hidden',
      background:`linear-gradient(90deg, ${c.bg}, ${c.bg}88)`,
      borderBottom:`1px solid ${c.border}`,
      padding:'8px 24px',
      boxShadow:`0 0 20px ${c.glow}, inset 0 0 20px ${c.glow}`,
      animation:'bannerPulse 3s ease-in-out infinite',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, position:'relative', zIndex:1 }}>
        <div style={{
          width:8, height:8, borderRadius:'50%', background:c.text,
          boxShadow:`0 0 10px ${c.text}`,
          animation:'blink 1s ease-in-out infinite',
        }} />
        <span style={{
          fontSize:11, fontWeight:700, letterSpacing:3, color:c.text,
          fontFamily:"'JetBrains Mono', monospace", textTransform:'uppercase',
          textShadow:`0 0 10px ${c.glow}`,
        }}>Threat Level: {level.toUpperCase()}</span>
        <span style={{ fontSize:10, color:`${c.text}99` }}>— Nation-state monitoring active</span>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [booted, setBooted] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [alerts, setAlerts] = useState(() => generateMockAlerts(50))
  const [diodeMode, setDiodeMode] = useState(false)
  const [ackShadow, setAckShadow] = useState(true)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [showAlertDetail, setShowAlertDetail] = useState(false)
  const [uptime, setUptime] = useState({ d:2, h:14, m:33, s:0 })
  const [borderFlash, setBorderFlash] = useState(false)
  const [glitchActive, setGlitchActive] = useState(false)
  const headerRef = useRef(null)
  const [headerDims, setHeaderDims] = useState({ w: 0, h: 0 })

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(d => !d)
    document.documentElement.classList.toggle('dark')
  }, [])

  // Uptime counter
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(u => {
        let s = u.s + 1
        let m = u.m, h = u.h, d = u.d
        if (s >= 60) { s = 0; m++ }
        if (m >= 60) { m = 0; h++ }
        if (h >= 24) { h = 0; d++ }
        return { d, h, m, s }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Format uptime
  const uptimeStr = `${uptime.d}d ${String(uptime.h).padStart(2,'0')}h ${String(uptime.m).padStart(2,'0')}m`
  const uptimeStrFull = `${uptimeStr} ${String(uptime.s).padStart(2,'0')}s`

  // Live alert generation
  useEffect(() => {
    if (!booted) return
    const interval = setInterval(() => {
      if (Math.random() > 0.65) {
        const threats = Object.keys(THREAT_TYPES)
        const threat = threats[Math.floor(Math.random() * threats.length)]
        const severity = SEVERITY_LEVELS[Math.floor(Math.random() * SEVERITY_LEVELS.length)]
        const newAlert = {
          id: `ALT-${String(1000 + Date.now())}`,
          timestamp: Date.now(),
          threat, severity,
          confidence: (0.5 + Math.random() * 0.5).toFixed(2),
          srcIp: `10.${~~(Math.random()*256)}.${~~(Math.random()*256)}.${~~(Math.random()*256)}`,
          dstIp: `192.168.${~~(Math.random()*256)}.${~~(Math.random()*256)}`,
          evidence: { features: ['packet_rate','byte_ratio','interval_variance'].slice(0, 2 + ~~(Math.random()*2)), hash: Array.from({length:12}, () => ~~(Math.random()*16).toString(16)).join('') },
          validity: ['MEASURED','ESTIMATED','MISSING'][~~(Math.random()*3)],
        }
        setAlerts(prev => [newAlert, ...prev].slice(0, 100))

        // Trigger glitch on critical
        if (severity === 'critical') {
          setGlitchActive(true)
          setTimeout(() => setGlitchActive(false), 300)

          // Screen border flash
          setBorderFlash(true)
          setTimeout(() => setBorderFlash(false), 500)
        }
      }
    }, 2000 + Math.random() * 1000)
    return () => clearInterval(interval)
  }, [booted])

  // Select first alert
  useEffect(() => {
    if (!selectedAlert && alerts.length > 0) setSelectedAlert(alerts[0])
  }, [alerts, selectedAlert])

  // Stats
  const stats = {
    source: 'eth0',
    interface: 'enp0s3',
    flowsPerSec: Math.round(47200 + Math.random() * 800),
    dropRate: '0.00',
    p99Latency: Math.round(84 + Math.random() * 10),
  }

  const headerDimsObserved = { w: headerDims.w, h: headerDims.h }

  if (!booted) {
    return <SplashScreen onComplete={() => setBooted(true)} />
  }

  return (
    <div style={{
      display:'flex', height:'100vh', overflow:'hidden',
      fontFamily:"'Inter', ui-sans-serif, system-ui, sans-serif",
      position:'relative',
      // Screen border flash
      ...(borderFlash ? {
        boxShadow:'inset 0 0 0 3px rgba(239,68,68,0.6), inset 0 0 60px rgba(239,68,68,0.15)',
        transition:'box-shadow 0.1s ease',
      } : {}),
      // Glitch effect
      ...(glitchActive ? {
        animation:'glitchText 0.3s ease-in-out',
      } : {}),
    }}>
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        setPage={setCurrentPage}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        uptime={uptimeStr}
      />

      {/* Main content area */}
      <div style={{
        flex:1, marginLeft:260, display:'flex', flexDirection:'column',
        height:'100vh', overflow:'hidden',
        background:'linear-gradient(180deg, #0a0e17 0%, #0f172a 50%, #0a0e17 100%)',
      }}>

        {/* Threat Level Banner */}
        <ThreatLevelBanner level="elevated" />

        {/* Topbar */}
        <div ref={headerRef}>
          <Topbar stats={stats} hasCritical={alerts.some(a => a.severity === 'critical')} />
        </div>

        {/* Main */}
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>
          {/* Page title */}
          <div style={{ marginBottom:24, animation:'fadeSlideUp 0.5s ease-out' }}>
            <h2 style={{
              fontFamily:"'Space Grotesk', system-ui, sans-serif",
              fontSize:26, fontWeight:800, color:'#f1f5f9',
              margin:'0 0 4px', letterSpacing:-0.5,
            }}>
              {currentPage === 'dashboard' && 'Operations Dashboard'}
              {currentPage === 'alerts' && 'Alert Feed'}
              {currentPage === 'threats' && 'Threat Detection Matrix'}
              {currentPage === 'evidence' && 'Evidence Vault'}
              {currentPage === 'throughput' && 'Throughput Analytics'}
              {currentPage === 'settings' && 'System Configuration'}
            </h2>
            <p style={{ fontSize:13, color:'#64748b', margin:0 }}>
              Real-time threat intelligence from air-gapped monitoring enclave
            </p>
          </div>

          {currentPage === 'dashboard' && (
            <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
              {/* Threats Blocked Counter */}
              <div style={{ animation:'fadeSlideUp 0.5s ease-out both' }}>
                <ThreatsBlockedCounter />
              </div>

              {/* Metrics with dramatic counters */}
              <div style={{ animation:'fadeSlideUp 0.5s ease-out 0.1s both' }}>
                <MetricsPanel />
              </div>

              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(3, 1fr)',
                gap:24,
              }}>
                {/* Left: Threat Map + Traffic */}
                <div style={{ gridColumn:'span 2', display:'flex', flexDirection:'column', gap:24 }}>
                  <div style={{ animation:'fadeSlideUp 0.5s ease-out 0.2s both' }}>
                    <TrafficVisualizer />
                  </div>
                  <div style={{ animation:'fadeSlideUp 0.5s ease-out 0.3s both' }}>
                    <ThreatMap />
                  </div>
                </div>

                {/* Right: Alert Feed */}
                <div style={{ animation:'fadeSlideUp 0.5s ease-out 0.2s both', minHeight:400 }}>
                  <AlertFeed
                    alerts={alerts}
                    onSelectAlert={(a) => { setSelectedAlert(a); setShowAlertDetail(true); }}
                    selectedAlert={selectedAlert}
                  />
                </div>
              </div>

              <div style={{
                display:'grid',
                gridTemplateColumns:'repeat(3, 1fr)',
                gap:24,
              }}>
                {/* Left: Degradation Matrix */}
                <div style={{ gridColumn:'span 2', animation:'fadeSlideUp 0.5s ease-out 0.4s both' }}>
                  <DegradationMatrix
                    diodeMode={diodeMode}
                    setDiodeMode={setDiodeMode}
                    ackShadow={ackShadow}
                    setAckShadow={setAckShadow}
                  />
                </div>

                {/* Right: Evidence Panel */}
                <div style={{ animation:'fadeSlideUp 0.5s ease-out 0.5s both' }}>
                  <EvidencePanel alert={selectedAlert} />
                </div>
              </div>
            </div>
          )}

          {currentPage !== 'dashboard' && (
            <div className="ek-card" style={{
              background:'rgba(17,24,39,0.6)', border:'1px solid rgba(30,41,59,0.8)',
              borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
              minHeight:400, color:'#64748b',
            }}>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🚧</div>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#f1f5f9', margin:'0 0 8px' }}>
                  {currentPage.charAt(0).toUpperCase() + currentPage.slice(1)}
                </h3>
                <p style={{ fontSize:13 }}>This module is available in the full prototype.</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Alert Detail Modal */}
      {showAlertDetail && selectedAlert && (
        <AlertDetail
          alert={selectedAlert}
          allAlerts={alerts}
          onClose={() => setShowAlertDetail(false)}
        />
      )}

      {/* Global styles */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 60px rgba(0,212,255,0.4), 0 0 120px rgba(0,212,255,0.15); }
          50% { transform: scale(1.08); box-shadow: 0 0 80px rgba(0,212,255,0.6), 0 0 160px rgba(0,212,255,0.25); }
        }
        @keyframes matrixColumn {
          0% { transform: translateY(-100%); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes barFill {
          from { width: 0%; }
        }
        @keyframes glitchIn {
          0% { clip-path: inset(40% 0 61% 0); transform: translate(-2px, 2px); }
          20% { clip-path: inset(92% 0 1% 0); transform: translate(1px, -1px); }
          40% { clip-path: inset(43% 0 1% 0); transform: translate(-1px, 2px); }
          60% { clip-path: inset(25% 0 58% 0); transform: translate(2px, 1px); }
          80% { clip-path: inset(54% 0 7% 0); transform: translate(-2px, -1px); }
          100% { clip-path: inset(0 0 0 0); transform: translate(0, 0); }
        }
        @keyframes glitchText {
          0% { transform: translate(0); }
          20% { transform: translate(-3px, 1px); }
          40% { transform: translate(3px, -1px); }
          60% { transform: translate(-1px, -2px); }
          80% { transform: translate(2px, 2px); }
          100% { transform: translate(0); }
        }
        @keyframes criticalPulse {
          0%, 100% { box-shadow: 0 0 5px rgba(239,68,68,0.2); }
          50% { box-shadow: 0 0 15px rgba(239,68,68,0.5), 0 0 30px rgba(239,68,68,0.2); }
        }
        @keyframes scanLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200vw); }
        }
        @keyframes diodeFlash {
          0% { opacity: 0; }
          10% { opacity: 0.3; }
          100% { opacity: 0; }
        }
        .ek-scan-line::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00d4ff, transparent);
          animation: scanLine 3s ease-in-out infinite;
          opacity: 0.5;
          z-index: 2;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}
