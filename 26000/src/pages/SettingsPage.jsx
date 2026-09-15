import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import {
  C, MONO, DISPLAY, Icons, Card, CardHeader, Label, Pill, Toggle, Bar, Stagger,
  DETECTORS, THREAT_TYPES,
} from '../lib/shared.jsx'

/* ═══════════════════════════════════════════════════════════════════
   EKADHARA — System Configuration
   Two columns: sticky section rail + dense settings panels.
   diodeMode / ackShadow / darkMode are lifted to App; everything else
   is local demo state that still has to FEEL wired.
   ═══════════════════════════════════════════════════════════════════ */

// ── Static catalogs ─────────────────────────────────────────────────
const SECTIONS = [
  { id: 'capture',    label: 'Capture',    icon: Icons.network,  hint: 'NIC · mode · ring' },
  { id: 'detectors',  label: 'Detectors',  icon: Icons.layers,   hint: '6 specialists · DEG' },
  { id: 'thresholds', label: 'Thresholds', icon: Icons.activity, hint: 'per-detector limits' },
  { id: 'egress',     label: 'Egress',     icon: Icons.lock,     hint: 'hardware-enforced' },
  { id: 'evidence',   label: 'Evidence',   icon: Icons.shield,   hint: 'Merkle · retention' },
  { id: 'interface',  label: 'Interface',  icon: Icons.eye,      hint: 'theme · motion' },
  { id: 'system',     label: 'System',     icon: Icons.cpu,      hint: 'build · self-test' },
]

const INTERFACES = [
  { value: 'eth0',    label: 'eth0',      detail: '1 GbE onboard · AF_PACKET · CAP_NET_RAW' },
  { value: 'enp0s3',  label: 'enp0s3',    detail: '10 GbE SFP+ · PACKET_IGNORE_OUTGOING' },
  { value: 'mirror0', label: 'mirror port', detail: 'SPAN / passive TAP · receive-only' },
]

const CAPTURE_MODES = [
  { value: 'bi',  label: 'BI',  hint: 'bidirectional twin' },
  { value: 'fwd', label: 'FWD', hint: 'client → server only' },
  { value: 'rev', label: 'REV', hint: 'server → client only' },
]

const RING_MARKS = [64, 128, 256, 512, 1024, 2048]

const THRESHOLDS = [
  { id: 'synPps',   label: 'SYN-flood packets/sec',   det: 'ddos',      def: 12000, min: 500,  max: 200000, step: 100,  unit: 'pkt/s',
    hint: 'CUSUM stage-1 candidate trigger on the 1 s window' },
  { id: 'synRatio', label: 'Unanswered-SYN ratio',    det: 'ddos',      def: 0.85,  min: 0.10, max: 0.99,   step: 0.01, unit: 'ratio',
    hint: 'SYN with no observed completion — one-way safe feature' },
  { id: 'madRatio', label: 'Beaconing jitter (MAD)',  det: 'beaconing', def: 0.22,  min: 0.02, max: 0.80,   step: 0.01, unit: 'MAD/med',
    hint: 'median absolute deviation / median — holds to +/-50% jitter' },
  { id: 'entropy',  label: 'DGA entropy cutoff',      det: 'dga',       def: 3.60,  min: 2.00, max: 5.00,   step: 0.05, unit: 'bits/ch',
    hint: 'Shannon entropy over the query label, n-gram model as tie-break' },
  { id: 'scanPorts', label: 'Port-scan unique ports', det: 'scan',      def: 64,    min: 8,    max: 2048,   step: 1,    unit: 'ports',
    hint: 'HyperLogLog distinct-port cardinality per source, 1% error' },
  { id: 'exfilRatio', label: 'Exfil byte-ratio asymmetry', det: 'exfil', def: 4.50, min: 1.20, max: 50.00, step: 0.10, unit: 'up:down',
    hint: 'up/down ratio vs per-host EWMA baseline; down leg may be INFERRED' },
]

const EGRESS_PATHS = [
  { path: 'DNS resolution',     detail: 'udp/53, tcp/53 · no resolver configured in image' },
  { path: 'HTTP / HTTPS',       detail: 'tcp/80, tcp/443 · no HTTP client crate compiled in' },
  { path: 'NTP time sync',      detail: 'udp/123 · clock is host-supplied, never network-set' },
  { path: 'Telemetry / crash',  detail: 'no reporter binary present in the OCI layer' },
  { path: 'Auto-update',        detail: 'package repos unreachable · image digest pinned' },
]

const BLOCKED_SYSCALLS = ['connect', 'sendto', 'sendmsg', 'sendmmsg']

const SEAL_INTERVALS = [
  { value: '10s', label: '10 s' },
  { value: '30s', label: '30 s' },
  { value: '60s', label: '60 s' },
  { value: '5m',  label: '5 min' },
]

const EXPORT_FORMATS = [
  { id: 'ocsf', label: 'OCSF Detection Finding (JSON)', detail: 'class 2004 · direction_mask + feature_validity', on: true, locked: true },
  { id: 'stix', label: 'STIX 2.1 bundle',               detail: 'indicator + observed-data objects',            on: true,  locked: false },
  { id: 'pcap', label: 'PCAP excerpt',                  detail: 'window slice, capped at 2 MB per alert',       on: true,  locked: false },
  { id: 'parq', label: 'Parquet ledger slice',          detail: 'DuckDB-readable, Merkle leaf preserved',       on: false, locked: false },
]

const SELF_TEST = [
  { label: 'seccomp-bpf profile loaded',        detail: 'deny connect/sendto/sendmsg/sendmmsg' },
  { label: 'AF_PACKET ring bound',              detail: 'CAP_NET_RAW dropped, running as uid 10001' },
  { label: 'detector pack signature verified',  detail: '6 / 6 specialists · pack 2026.03.1' },
  { label: 'ONNX model hashes match manifest',  detail: '4 models · 11.4 MB · ort 2.0' },
  { label: 'egress self-test: connect() killed', detail: 'EPERM raised, attempt written to audit log' },
  { label: 'Merkle ledger head verified',       detail: 'chain intact across 128,904 leaves' },
]

const EXPERTS = [
  { id: 'stat', name: 'Robust statistics', detail: 'Bowley skew · MAD · CUSUM · HLL cardinality', color: C.accent },
  { id: 'gbm',  name: 'Gradient-boosted head', detail: 'LightGBM over the validity-masked vector', color: C.violet },
  { id: 'seq',  name: 'Sequence / entropy model', detail: 'char-CNN on strings, 1-D CNN on packet rhythm', color: C.amber },
]

const BASE_ALERT_RATE = { ddos: 2.4, beaconing: 1.1, dga: 3.8, scan: 5.2, exfil: 0.7, malware: 2.0 }

// ── Small styled primitives (no raw browser defaults) ───────────────

/** Section body divider row: label + hint on the left, control on the right. */
function Row({ label, hint, children, last = false, align = 'center', width = 260 }) {
  return (
    <div style={{
      display: 'flex', alignItems: align, justifyContent: 'space-between', gap: 20,
      padding: '11px 0', borderBottom: last ? 'none' : `1px solid ${C.borderSoft}`,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{label}</div>
        {hint && (
          <div style={{ fontSize: 10, color: C.textMute, marginTop: 3, lineHeight: 1.55, maxWidth: 460 }}>
            {hint}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10, flexShrink: 0, width }}>
        {children}
      </div>
    </div>
  )
}

/** Custom dropdown — styled trigger + absolute option list. */
function Dropdown({ value, options, onChange, width = 250 }) {
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)
  const current = options.find(o => o.value === value) || options[0]

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '8px 11px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
          background: open ? 'rgba(0,212,255,0.06)' : C.inset,
          border: `1px solid ${open ? 'rgba(0,212,255,0.4)' : C.border}`,
          color: C.text, fontFamily: MONO, fontSize: 11.5,
          transition: 'all 0.18s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = open ? 'rgba(0,212,255,0.4)' : C.border }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.label}</span>
        <span style={{
          display: 'flex', color: C.textMute, flexShrink: 0,
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease',
        }}>{Icons.chevron({ width: 12, height: 12 })}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: 0, right: 0, zIndex: 20,
          background: '#0d1321', border: `1px solid ${C.border}`, borderRadius: 8,
          boxShadow: '0 16px 40px rgba(0,0,0,0.65)', overflow: 'hidden',
          animation: 'fadeSlideUp 0.18s ease-out both',
        }}>
          {options.map(o => {
            const sel = o.value === value
            return (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                onMouseEnter={() => setHover(o.value)}
                onMouseLeave={() => setHover(null)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                  padding: '8px 11px', border: 'none',
                  background: sel ? 'rgba(0,212,255,0.1)' : hover === o.value ? 'rgba(15,23,42,0.9)' : 'transparent',
                  borderLeft: `2px solid ${sel ? C.accent : 'transparent'}`,
                }}
              >
                <div style={{ fontFamily: MONO, fontSize: 11.5, color: sel ? C.accent : C.text }}>{o.label}</div>
                {o.detail && <div style={{ fontSize: 9.5, color: C.textFaint, marginTop: 2, fontFamily: MONO }}>{o.detail}</div>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

/** Segmented control. */
function Segmented({ value, options, onChange, color = C.accent, size = 'md' }) {
  const pad = size === 'sm' ? '5px 9px' : '6px 12px'
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 9,
      background: C.inset, border: `1px solid ${C.border}`, gap: 3,
    }}>
      {options.map(o => {
        const sel = o.value === value
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            title={o.hint || ''}
            style={{
              padding: pad, borderRadius: 6, cursor: 'pointer',
              background: sel ? `${color}1f` : 'transparent',
              border: `1px solid ${sel ? `${color}59` : 'transparent'}`,
              color: sel ? color : C.textMute,
              fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1,
              textTransform: 'uppercase', whiteSpace: 'nowrap',
              boxShadow: sel ? `0 0 14px ${color}33` : 'none',
              transition: 'all 0.18s ease',
            }}
            onMouseEnter={e => { if (!sel) { e.currentTarget.style.color = C.text; e.currentTarget.style.background = 'rgba(15,23,42,0.8)' } }}
            onMouseLeave={e => { if (!sel) { e.currentTarget.style.color = C.textMute; e.currentTarget.style.background = 'transparent' } }}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Custom slider: styled track + knob over a transparent range input. */
function Slider({ value, min, max, step = 1, onChange, color = C.accent, width = 150 }) {
  const [grab, setGrab] = useState(false)
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div
      style={{ position: 'relative', height: 22, width, flexShrink: 0 }}
      onMouseEnter={() => setGrab(true)}
      onMouseLeave={() => setGrab(false)}
    >
      <div style={{
        position: 'absolute', top: 9, left: 0, right: 0, height: 4, borderRadius: 2,
        background: 'rgba(15,23,42,0.9)', border: `1px solid ${C.borderSoft}`,
      }} />
      <div style={{
        position: 'absolute', top: 9, left: 0, width: `${pct}%`, height: 4, borderRadius: 2,
        background: `linear-gradient(90deg, ${color}55, ${color})`,
        boxShadow: `0 0 10px ${color}66`, transition: 'width 0.12s linear',
      }} />
      <div style={{
        position: 'absolute', top: 3.5, left: `calc(${pct}% - 7px)`, width: 14, height: 15, borderRadius: 4,
        background: 'linear-gradient(180deg, #f8fafc 0%, #cbd5e1 100%)',
        boxShadow: `0 2px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.8)${grab ? `, 0 0 12px ${color}88` : ''}`,
        pointerEvents: 'none', transition: 'left 0.12s linear, box-shadow 0.2s ease',
      }} />
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: 22, margin: 0,
          opacity: 0, cursor: 'pointer', accentColor: color,
        }}
      />
    </div>
  )
}

/** Mono numeric / text field with live validation. */
function Field({ value, onChange, unit, width = 128, invalid = false, mono = true, placeholder, align = 'right' }) {
  const [focus, setFocus] = useState(false)
  const border = invalid ? C.red : focus ? 'rgba(0,212,255,0.5)' : C.border
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, width,
      padding: '7px 9px', borderRadius: 8,
      background: invalid ? 'rgba(239,68,68,0.06)' : C.inset,
      border: `1px solid ${border}`,
      boxShadow: focus ? '0 0 0 3px rgba(0,212,255,0.08)' : 'none',
      transition: 'all 0.18s ease',
    }}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none',
          color: invalid ? '#fca5a5' : C.text,
          fontFamily: mono ? MONO : 'inherit', fontSize: 11.5, fontWeight: 600,
          textAlign: align, padding: 0,
        }}
      />
      {unit && <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, whiteSpace: 'nowrap' }}>{unit}</span>}
    </div>
  )
}

/** Square checkbox. */
function Check({ on, onChange, color = C.accent, disabled = false }) {
  return (
    <button
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: on ? `${color}26` : C.inset,
        border: `1px solid ${on ? `${color}99` : C.border}`,
        color, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: on ? `0 0 10px ${color}33` : 'none',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.18s ease',
      }}
    >
      {on && Icons.check({ width: 12, height: 12 })}
    </button>
  )
}

/** Ghost button. */
function GhostButton({ children, onClick, color = C.accent, icon, disabled = false, dim = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 12px', borderRadius: 8,
        background: dim ? 'transparent' : `${color}12`,
        border: `1px solid ${dim ? C.border : `${color}3d`}`,
        color: dim ? C.textMute : color,
        fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1, whiteSpace: 'nowrap',
        transition: 'all 0.18s ease',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}24`; e.currentTarget.style.borderColor = `${color}80`; e.currentTarget.style.color = color } }}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = dim ? 'transparent' : `${color}12`; e.currentTarget.style.borderColor = dim ? C.border : `${color}3d`; e.currentTarget.style.color = dim ? C.textMute : color } }}
    >
      {icon && icon({ width: 12, height: 12 })}
      {children}
    </button>
  )
}

/** Section shell: a Card with an anchor ref + header. */
function Section({ id, anchorRef, title, subtitle, icon, right, tone, children }) {
  const accent = tone === 'danger' ? 'rgba(239,68,68,0.35)' : C.border
  return (
    <div ref={anchorRef} data-section={id} style={{ scrollMarginTop: 12 }}>
      <Card style={{
        padding: 20,
        borderColor: accent,
        boxShadow: tone === 'danger' ? '0 0 40px rgba(239,68,68,0.07), inset 0 0 40px rgba(239,68,68,0.03)' : 'none',
      }}>
        <CardHeader title={title} subtitle={subtitle} icon={icon} right={right} />
        {children}
      </Card>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function SettingsPage({ diodeMode, setDiodeMode, ackShadow, setAckShadow, darkMode, toggleDarkMode, stats }) {
  const st = stats || {}

  // ── Capture state ─────────────────────────────────────────────────
  const [iface, setIface] = useState(st.interface || 'enp0s3')
  const [captureMode, setCaptureMode] = useState('bi')
  const [ring, setRing] = useState(512)
  const [snapLen, setSnapLen] = useState('1600')
  const [bpf, setBpf] = useState('not (host 127.0.0.1 and port 9443)')
  const [promisc, setPromisc] = useState(true)

  // ── Detector state ────────────────────────────────────────────────
  const [detState, setDetState] = useState(() =>
    DETECTORS.reduce((acc, d) => ({ ...acc, [d.id]: { on: true, sens: 50 } }), {}))
  const [quorum, setQuorum] = useState(2)
  const [expertsOn, setExpertsOn] = useState({ stat: true, gbm: true, seq: true })

  // ── Threshold state ───────────────────────────────────────────────
  const [thr, setThr] = useState(() =>
    THRESHOLDS.reduce((acc, t) => ({ ...acc, [t.id]: String(t.def) }), {}))

  // ── Evidence state ────────────────────────────────────────────────
  const [sealInterval, setSealInterval] = useState('30s')
  const [retention, setRetention] = useState(90)
  const [formats, setFormats] = useState(() =>
    EXPORT_FORMATS.reduce((acc, f) => ({ ...acc, [f.id]: f.on }), {}))
  const [fixedSeed, setFixedSeed] = useState(true)
  const [seed, setSeed] = useState('1337')
  const [detEviction, setDetEviction] = useState(true)

  // ── Interface state ───────────────────────────────────────────────
  const [motion, setMotion] = useState('full')
  const [sound, setSound] = useState(false)
  const [density, setDensity] = useState('comfortable')
  const [presentation, setPresentation] = useState(false)

  // ── Egress (immovable) ────────────────────────────────────────────
  const [egressTip, setEgressTip] = useState(false)
  const [nudge, setNudge] = useState(false)

  // ── Self-test ─────────────────────────────────────────────────────
  const [testStep, setTestStep] = useState(-1)
  const [testDone, setTestDone] = useState(false)
  const testTimer = useRef(null)

  // ── Uptime ticker (local, cosmetic) ───────────────────────────────
  const [secs, setSecs] = useState(2 * 86400 + 14 * 3600 + 33 * 60)
  useEffect(() => {
    const t = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const uptimeStr = useMemo(() => {
    const d = Math.floor(secs / 86400)
    const h = Math.floor((secs % 86400) / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`
  }, [secs])

  // ── Scroll-spy rail ───────────────────────────────────────────────
  const anchors = useRef({})
  const [active, setActive] = useState('capture')
  useEffect(() => {
    const els = SECTIONS.map(s => anchors.current[s.id]).filter(Boolean)
    if (!els.length) return
    const io = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible.length) setActive(visible[0].target.dataset.section)
    }, { rootMargin: '-70px 0px -55% 0px', threshold: 0 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const goTo = useCallback((id) => {
    const el = anchors.current[id]
    if (el) {
      setActive(id)
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  useEffect(() => () => { if (testTimer.current) clearTimeout(testTimer.current) }, [])

  // ── Derived values ────────────────────────────────────────────────
  const thrInvalid = (t) => {
    const v = parseFloat(thr[t.id])
    return !Number.isFinite(v) || v < t.min || v > t.max
  }
  const invalidCount = THRESHOLDS.filter(thrInvalid).length
  const driftCount = THRESHOLDS.filter(t => parseFloat(thr[t.id]) !== t.def).length

  const estAlerts = (id, sens) => {
    const base = BASE_ALERT_RATE[id] || 1.5
    return (base * (0.22 + Math.pow(sens / 50, 2.15))).toFixed(1)
  }
  const enabledDetectors = DETECTORS.filter(d => detState[d.id].on).length
  const totalAlerts = DETECTORS
    .filter(d => detState[d.id].on)
    .reduce((sum, d) => sum + parseFloat(estAlerts(d.id, detState[d.id].sens)), 0)
    .toFixed(1)
  const activeExperts = EXPERTS.filter(e => expertsOn[e.id]).length

  const runSelfTest = () => {
    if (testStep >= 0 && !testDone) return
    if (testTimer.current) clearTimeout(testTimer.current)
    setTestDone(false)
    setTestStep(0)
    let i = 0
    const tick = () => {
      i += 1
      if (i < SELF_TEST.length) {
        setTestStep(i)
        testTimer.current = setTimeout(tick, 430)
      } else {
        setTestStep(SELF_TEST.length)
        setTestDone(true)
      }
    }
    testTimer.current = setTimeout(tick, 430)
  }

  const resetAll = () => {
    setThr(THRESHOLDS.reduce((acc, t) => ({ ...acc, [t.id]: String(t.def) }), {}))
    setDetState(DETECTORS.reduce((acc, d) => ({ ...acc, [d.id]: { on: true, sens: 50 } }), {}))
    setRing(512); setSnapLen('1600'); setPromisc(true); setCaptureMode('bi')
    setQuorum(2); setExpertsOn({ stat: true, gbm: true, seq: true })
    setSealInterval('30s'); setRetention(90); setFixedSeed(true); setSeed('1337'); setDetEviction(true)
    setMotion('full'); setSound(false); setDensity('comfortable'); setPresentation(false)
  }

  const numeric = (v) => ({ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: C.text, ...(v || {}) })

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '212px minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

      {/* ══════════════════ STICKY SECTION RAIL ══════════════════ */}
      <Stagger delay={0} style={{ position: 'sticky', top: 0 }}>
        <Card style={{ padding: 12 }}>
          <div style={{ padding: '2px 6px 10px' }}>
            <Label>Configuration</Label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map((s, i) => {
              const on = active === s.id
              return (
                <button
                  key={s.id}
                  onClick={() => goTo(s.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left',
                    padding: '8px 9px', borderRadius: 8, cursor: 'pointer',
                    background: on ? 'rgba(0,212,255,0.08)' : 'transparent',
                    border: `1px solid ${on ? 'rgba(0,212,255,0.22)' : 'transparent'}`,
                    color: on ? C.accent : C.textDim,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => { if (!on) { e.currentTarget.style.background = 'rgba(15,23,42,0.7)'; e.currentTarget.style.color = C.text } }}
                  onMouseLeave={e => { if (!on) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.textDim } }}
                >
                  <div style={{
                    width: 3, height: 22, borderRadius: 2, flexShrink: 0,
                    background: on ? C.accent : 'transparent',
                    boxShadow: on ? `0 0 8px ${C.accent}` : 'none',
                    transition: 'all 0.2s ease',
                  }} />
                  <div style={{ display: 'flex', flexShrink: 0 }}>{s.icon({ width: 14, height: 14 })}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2 }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: on ? 'rgba(0,212,255,0.55)' : C.textFaint, fontFamily: MONO, marginTop: 2 }}>
                      {s.hint}
                    </div>
                  </div>
                  <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 9, color: C.textFaint }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.borderSoft}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: MONO, color: C.textMute, marginBottom: 5 }}>
              <span>PROFILE</span><span style={{ color: C.text }}>enclave-default</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: MONO, color: C.textMute, marginBottom: 5 }}>
              <span>DRIFT</span>
              <span style={{ color: driftCount ? C.amber : C.green }}>{driftCount} field{driftCount === 1 ? '' : 's'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: MONO, color: C.textMute, marginBottom: 10 }}>
              <span>INVALID</span>
              <span style={{ color: invalidCount ? C.red : C.green }}>{invalidCount}</span>
            </div>
            <GhostButton onClick={resetAll} icon={Icons.refresh} dim>Revert all</GhostButton>
          </div>
        </Card>
      </Stagger>

      {/* ══════════════════ SETTINGS COLUMN ══════════════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

        {/* ─────────────── 1 · CAPTURE ─────────────── */}
        <Stagger delay={0.05}>
          <Section
            id="capture"
            anchorRef={el => { anchors.current.capture = el }}
            title="Capture"
            subtitle="Ingest path, directionality and ring-buffer budget. Applied without restart."
            icon={Icons.network}
            right={<Pill color={C.green}>ACTIVE</Pill>}
          >
            <Row label="Capture interface" hint="AF_PACKET socket, PACKET_IGNORE_OUTGOING set. CAP_NET_RAW is dropped after bind.">
              <Dropdown value={iface} options={INTERFACES} onChange={setIface} width={250} />
            </Row>
            <div style={{ padding: '4px 0 12px' }}>
              <div style={{
                padding: '8px 11px', borderRadius: 8, background: C.inset, border: `1px solid ${C.borderSoft}`,
                fontFamily: MONO, fontSize: 10, color: C.textDim,
              }}>
                {(INTERFACES.find(i => i.value === iface) || INTERFACES[0]).detail}
              </div>
            </div>

            <Row label="Direction mask" hint="Which twin feeds the detectors. FWD is what a real data diode gives you.">
              <Segmented value={captureMode} options={CAPTURE_MODES} onChange={setCaptureMode} />
            </Row>

            {/* Hardware toggles — shared app state */}
            <div style={{
              margin: '16px 0', padding: 18, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(10,14,23,0.9))',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Label>Network capture mode</Label>
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint }}>SHARED · APP-WIDE STATE</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1px 1fr', gap: 18, alignItems: 'center' }}>
                {/* DIODE MODE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Toggle on={diodeMode} onChange={setDiodeMode} color={C.red} width={84} height={36} />
                  <div>
                    <div style={{
                      fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, letterSpacing: 1,
                      color: diodeMode ? C.red : C.textMute,
                      textShadow: diodeMode ? '0 0 12px rgba(239,68,68,0.35)' : 'none',
                    }}>DIODE MODE</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint, marginTop: 3 }}>
                      {diodeMode ? 'FWD-only · reverse leg discarded' : 'BI · both legs visible'}
                    </div>
                  </div>
                </div>

                <div style={{ width: 1, height: 46, background: C.border }} />

                {/* ACK-SHADOW */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Toggle on={ackShadow} onChange={setAckShadow} color={C.violet} width={84} height={36} />
                  <div>
                    <div style={{
                      fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, letterSpacing: 1,
                      color: ackShadow ? C.violet : C.textMute,
                      textShadow: ackShadow ? '0 0 12px rgba(168,85,247,0.35)' : 'none',
                    }}>ACK-SHADOW</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint, marginTop: 3 }}>
                      {ackShadow ? 'reverse volume INFERRED from ACKs' : 'estimator off'}
                    </div>
                  </div>
                </div>
              </div>

              {diodeMode && (
                <div style={{
                  marginTop: 14, padding: '10px 13px', borderRadius: 8,
                  background: ackShadow ? 'rgba(168,85,247,0.06)' : 'rgba(239,68,68,0.06)',
                  border: `1px solid ${ackShadow ? 'rgba(168,85,247,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  fontFamily: MONO, fontSize: 10, lineHeight: 1.6,
                  color: ackShadow ? '#d8b4fe' : '#fca5a5',
                  animation: 'fadeSlideUp 0.3s ease-out both',
                }}>
                  {ackShadow
                    ? 'Exfiltration detection 83% recovered — reverse_bytes_est within +/-10% median error on flows > 100 KB. Features marked INFERRED.'
                    : 'Exfiltration detection BLIND under FWD-only capture. Enable ACK-Shadow to reconstruct reverse volume from the ACK sequence.'}
                </div>
              )}
            </div>

            <Row label="Ring-buffer size" hint={`${RING_MARKS[0]} MB – ${RING_MARKS[RING_MARKS.length - 1]} MB of locked pages. Sized so a 10x burst never touches the kernel drop counter.`}>
              <Slider value={ring} min={64} max={2048} step={64} onChange={setRing} width={150} />
              <span style={numeric({ width: 62, textAlign: 'right' })}>{ring} MB</span>
            </Row>

            <Row label="Snap length" hint="Bytes captured per packet. 1600 keeps full headers plus the TLS ClientHello; payload is never stored.">
              <Field value={snapLen} onChange={setSnapLen} unit="bytes"
                invalid={!(parseInt(snapLen, 10) >= 64 && parseInt(snapLen, 10) <= 65535)} />
            </Row>

            <Row label="BPF pre-filter" hint="Kernel-side filter, applied before the ring. Keep it narrow — every dropped packet here is one you never see." align="flex-start" width={330}>
              <Field value={bpf} onChange={setBpf} width={330} align="left" placeholder="tcp or udp" />
            </Row>

            <Row label="Promiscuous mode" hint="Required on a SPAN/mirror port. Receive-only; no frame is ever emitted by this host." last>
              <span style={{ fontFamily: MONO, fontSize: 10, color: promisc ? C.green : C.textMute, marginRight: 4 }}>
                {promisc ? 'ENABLED' : 'OFF'}
              </span>
              <Toggle on={promisc} onChange={setPromisc} color={C.green} width={64} height={28} />
            </Row>
          </Section>
        </Stagger>

        {/* ─────────────── 2 · DETECTORS ─────────────── */}
        <Stagger delay={0.1}>
          <Section
            id="detectors"
            anchorRef={el => { anchors.current.detectors = el }}
            title="Detectors"
            subtitle="Six streaming specialists. No monolithic classifier — different time scales, different feature spaces."
            icon={Icons.layers}
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Pill color={C.accent}>{enabledDetectors} / {DETECTORS.length} ON</Pill>
                <Pill color={C.amber}>~{totalAlerts} ALERTS/HR</Pill>
              </div>
            }
          >
            {/* Column header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '52px minmax(0,1.5fr) 62px 200px 84px',
              gap: 12, padding: '0 0 8px', borderBottom: `1px solid ${C.border}`, alignItems: 'center',
            }}>
              <Label>Enable</Label>
              <Label>Detector · method</Label>
              <Label>Window</Label>
              <Label style={{ textAlign: 'center' }}>Sensitivity</Label>
              <Label style={{ textAlign: 'right' }}>Est/hr</Label>
            </div>

            {DETECTORS.map((d, i) => {
              const s = detState[d.id]
              const tt = THREAT_TYPES[d.threat] || {}
              const color = tt.color || C.accent
              const est = estAlerts(d.id, s.sens)
              const mood = s.sens < 34 ? 'CONSERVATIVE' : s.sens > 66 ? 'AGGRESSIVE' : 'BALANCED'
              const moodColor = s.sens < 34 ? C.blue : s.sens > 66 ? C.red : C.green
              return (
                <div
                  key={d.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '52px minmax(0,1.5fr) 62px 200px 84px',
                    gap: 12, alignItems: 'center', padding: '11px 6px', marginLeft: -6, marginRight: -6,
                    borderRadius: 8,
                    borderBottom: i === DETECTORS.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                    opacity: s.on ? 1 : 0.45,
                    transition: 'opacity 0.25s ease, background 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(15,23,42,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <Toggle
                    on={s.on}
                    onChange={v => setDetState(p => ({ ...p, [d.id]: { ...p[d.id], on: v } }))}
                    color={color} width={46} height={22}
                  />

                  <div style={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: color,
                      boxShadow: s.on ? `0 0 9px ${color}` : 'none',
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{d.name}</div>
                      <div style={{ fontSize: 9.5, color: C.textMute, fontFamily: MONO, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.method}
                      </div>
                    </div>
                  </div>

                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.textDim }}>{d.window}</span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
                    <Slider
                      value={s.sens} min={0} max={100} step={1} color={color} width={190}
                      onChange={v => setDetState(p => ({ ...p, [d.id]: { ...p[d.id], sens: v } }))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: 190, fontFamily: MONO, fontSize: 8.5, color: C.textFaint }}>
                      <span>CONSERVATIVE</span>
                      <span style={{ color: moodColor, fontWeight: 700 }}>{mood}</span>
                      <span>AGGRESSIVE</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: s.on ? color : C.textMute }}>{est}</div>
                    <div style={{ fontFamily: MONO, fontSize: 8.5, color: C.textFaint }}>alerts/hr</div>
                  </div>
                </div>
              )
            })}

            {/* DEG */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: 'rgba(168,85,247,0.04)', border: '1px solid rgba(168,85,247,0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, color: C.violet, letterSpacing: 0.5 }}>
                    DEG · Differential Expert Group
                  </div>
                  <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 5, lineHeight: 1.65, maxWidth: 560 }}>
                    Every window is scored independently by three experts in three different feature spaces. An alert is
                    raised only when the quorum agrees. <strong style={{ color: C.text }}>This is what suppresses
                    single-rule false positives</strong> — one detector firing alone is a hypothesis, not a finding.
                    Agreement across independent families is genuine Bayesian evidence.
                  </div>
                </div>
                <Segmented
                  value={quorum}
                  options={[{ value: 2, label: '2-of-3' }, { value: 3, label: '3-of-3' }]}
                  onChange={setQuorum}
                  color={C.violet}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {EXPERTS.map(e => {
                  const on = expertsOn[e.id]
                  return (
                    <div key={e.id} style={{
                      padding: 11, borderRadius: 9,
                      background: C.inset, border: `1px solid ${on ? `${e.color}40` : C.borderSoft}`,
                      opacity: on ? 1 : 0.5, transition: 'all 0.22s ease',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Check on={on} onChange={v => setExpertsOn(p => ({ ...p, [e.id]: v }))} color={e.color} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: on ? C.text : C.textMute }}>{e.name}</span>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, lineHeight: 1.55 }}>{e.detail}</div>
                    </div>
                  )
                })}
              </div>

              <div style={{
                marginTop: 12, padding: '9px 12px', borderRadius: 8,
                background: activeExperts < quorum ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.06)',
                border: `1px solid ${activeExperts < quorum ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.2)'}`,
                fontFamily: MONO, fontSize: 10, color: activeExperts < quorum ? '#fca5a5' : '#6ee7b7',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {activeExperts < quorum ? Icons.warning({ width: 13, height: 13 }) : Icons.check({ width: 13, height: 13 })}
                {activeExperts < quorum
                  ? `QUORUM UNREACHABLE — ${activeExperts} expert(s) enabled, ${quorum} required. No alert can be raised.`
                  : `QUORUM ${quorum}-of-${activeExperts} · expected FP suppression ${quorum === 3 ? '91' : '74'}% vs single-rule baseline`}
              </div>
            </div>
          </Section>
        </Stagger>

        {/* ─────────────── 3 · THRESHOLDS ─────────────── */}
        <Stagger delay={0.15}>
          <Section
            id="thresholds"
            anchorRef={el => { anchors.current.thresholds = el }}
            title="Thresholds"
            subtitle="Live-validated detector parameters. Out-of-range values are rejected at the edit, not at runtime."
            icon={Icons.activity}
            right={
              invalidCount
                ? <Pill color={C.red}>{invalidCount} OUT OF RANGE</Pill>
                : <Pill color={C.green}>ALL VALID</Pill>
            }
          >
            <div style={{
              display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 138px 96px 78px',
              gap: 12, padding: '0 0 8px', borderBottom: `1px solid ${C.border}`, alignItems: 'center',
            }}>
              <Label>Parameter</Label>
              <Label style={{ textAlign: 'right' }}>Current</Label>
              <Label style={{ textAlign: 'right' }}>Range</Label>
              <Label style={{ textAlign: 'right' }}>Default</Label>
            </div>

            {THRESHOLDS.map((t, i) => {
              const bad = thrInvalid(t)
              const drifted = parseFloat(thr[t.id]) !== t.def
              const tt = THREAT_TYPES[t.det] || {}
              return (
                <div key={t.id} style={{
                  display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 138px 96px 78px',
                  gap: 12, alignItems: 'center', padding: '12px 0',
                  borderBottom: i === THRESHOLDS.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: tt.color || C.accent,
                        boxShadow: `0 0 8px ${tt.color || C.accent}`, flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t.label}</span>
                      <span style={{ fontFamily: MONO, fontSize: 8.5, color: C.textFaint, letterSpacing: 1 }}>
                        {(tt.short || t.det).toUpperCase()}
                      </span>
                      {drifted && !bad && <Pill color={C.amber} style={{ padding: '1px 6px', fontSize: 8 }}>MODIFIED</Pill>}
                    </div>
                    <div style={{ fontSize: 10, color: C.textMute, marginTop: 4, lineHeight: 1.5 }}>{t.hint}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Field
                      value={thr[t.id]}
                      onChange={v => setThr(p => ({ ...p, [t.id]: v }))}
                      unit={t.unit}
                      invalid={bad}
                      width={138}
                    />
                  </div>

                  <div style={{ textAlign: 'right', fontFamily: MONO, fontSize: 9.5, color: bad ? '#fca5a5' : C.textFaint }}>
                    {t.min} – {t.max}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.textMute }}>{t.def}</span>
                    <button
                      onClick={() => setThr(p => ({ ...p, [t.id]: String(t.def) }))}
                      title="Reset to default"
                      disabled={!drifted}
                      style={{
                        width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: drifted ? 'rgba(0,212,255,0.08)' : 'transparent',
                        border: `1px solid ${drifted ? 'rgba(0,212,255,0.3)' : C.borderSoft}`,
                        color: drifted ? C.accent : C.textFaint,
                        cursor: drifted ? 'pointer' : 'not-allowed',
                        transition: 'all 0.18s ease',
                      }}
                    >
                      {Icons.refresh({ width: 11, height: 11 })}
                    </button>
                  </div>
                </div>
              )
            })}

            <div style={{
              marginTop: 14, padding: '10px 13px', borderRadius: 8,
              background: C.inset, border: `1px solid ${C.borderSoft}`,
              fontSize: 10.5, color: C.textMute, lineHeight: 1.6,
            }}>
              Thresholds are <strong style={{ color: C.textDim }}>baseline-relative wherever the phenomenon allows it</strong> —
              exfiltration scores deviation from a per-host EWMA, not an absolute byte count, because a backup server
              legitimately uploads terabytes. Absolute limits above act as floors on the candidate stage only.
            </div>
          </Section>
        </Stagger>

        {/* ─────────────── 4 · EGRESS LOCKDOWN ─────────────── */}
        <Stagger delay={0.2}>
          <Section
            id="egress"
            anchorRef={el => { anchors.current.egress = el }}
            title="Egress lockdown"
            subtitle="F2 · kernel-enforced. The sensor can observe the network and cannot speak on it."
            icon={Icons.lock}
            tone="danger"
            right={<Pill color={C.red}>LOCKED</Pill>}
          >
            {/* Master banner */}
            <div style={{
              padding: 20, borderRadius: 12, marginBottom: 16,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.09), rgba(239,68,68,0.03))',
              border: '1px solid rgba(239,68,68,0.28)',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 12, flexShrink: 0,
                background: 'rgba(239,68,68,0.13)', border: '1px solid rgba(239,68,68,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.red,
                boxShadow: '0 0 24px rgba(239,68,68,0.18)',
              }}>{Icons.lock({ width: 24, height: 24 })}</div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: 2, color: '#fca5a5', marginBottom: 6 }}>
                  OUTBOUND NETWORK
                </div>
                <div style={{
                  fontFamily: DISPLAY, fontSize: 26, fontWeight: 800, color: C.red, letterSpacing: 1, lineHeight: 1,
                  textShadow: '0 0 22px rgba(239,68,68,0.35)',
                }}>DISABLED</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, marginTop: 8 }}>
                  docker run --network none · seccomp-bpf denies {BLOCKED_SYSCALLS.join(' / ')}
                </div>
              </div>

              {/* Immovable master switch */}
              <div
                style={{ position: 'relative', textAlign: 'center' }}
                onMouseEnter={() => setEgressTip(true)}
                onMouseLeave={() => setEgressTip(false)}
              >
                <div style={{ marginBottom: 7 }}><Label style={{ color: '#fca5a5' }}>Allow egress</Label></div>
                <button
                  onClick={() => { setNudge(true); setTimeout(() => setNudge(false), 420) }}
                  aria-disabled="true"
                  title="Hardware-enforced. Cannot be changed from software."
                  style={{
                    width: 84, height: 36, borderRadius: 12, position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
                    border: '2px solid rgba(239,68,68,0.45)',
                    cursor: 'not-allowed',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.6)',
                    animation: nudge ? 'glitchText 0.4s ease-in-out' : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: 3, width: 28, height: 26, borderRadius: 8,
                    background: 'linear-gradient(180deg, #64748b 0%, #334155 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                  }} />
                  <span style={{
                    position: 'absolute', top: '50%', right: 11, transform: 'translateY(-50%)',
                    fontFamily: MONO, fontSize: 8.5, fontWeight: 800, letterSpacing: 1, color: '#fca5a5',
                  }}>OFF</span>
                  {/* Hatched lock overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'repeating-linear-gradient(45deg, rgba(239,68,68,0.16) 0 4px, transparent 4px 8px)',
                    pointerEvents: 'none',
                  }} />
                </button>
                <div style={{ marginTop: 7, fontFamily: MONO, fontSize: 8.5, color: C.textFaint, letterSpacing: 1 }}>
                  IMMOVABLE
                </div>

                {egressTip && (
                  <div style={{
                    position: 'absolute', bottom: 'calc(100% + 10px)', right: 0, width: 250, zIndex: 30,
                    padding: '9px 12px', borderRadius: 8,
                    background: '#0d1321', border: '1px solid rgba(239,68,68,0.4)',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
                    fontFamily: MONO, fontSize: 10, color: '#fca5a5', lineHeight: 1.55, textAlign: 'left',
                    animation: 'fadeSlideUp 0.16s ease-out both',
                  }}>
                    Hardware-enforced. Cannot be changed from software.
                  </div>
                )}
              </div>
            </div>

            {/* Blocked paths */}
            <div style={{ padding: '0 0 8px' }}><Label>Blocked egress paths</Label></div>
            {EGRESS_PATHS.map((p, i) => (
              <div key={p.path} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                padding: '10px 0', borderBottom: i === EGRESS_PATHS.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span style={{ display: 'flex', color: C.textFaint, flexShrink: 0 }}>{Icons.x({ width: 13, height: 13 })}</span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{p.path}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textMute, marginTop: 2 }}>{p.detail}</div>
                  </div>
                </div>
                <span className="ek-badge-critical" style={{ fontFamily: MONO, whiteSpace: 'nowrap' }}>LOCKED</span>
              </div>
            ))}

            {/* Self-test evidence */}
            <div style={{
              marginTop: 16, padding: 13, borderRadius: 9,
              background: '#07090f', border: `1px solid ${C.border}`,
              fontFamily: MONO, fontSize: 10, lineHeight: 1.8,
            }}>
              <div style={{ color: C.textFaint }}>$ ekadhara --self-test-egress</div>
              <div style={{ color: C.textDim }}>[egress-test] attempting connect() to 1.1.1.1:443 ...</div>
              <div style={{ color: C.red }}>[seccomp] SIGSYS: connect() denied by policy (errno EPERM)</div>
              <div style={{ color: C.textDim }}>[audit] attempt recorded · leaf 0x7f3c9a1e · merkle root updated</div>
              <div style={{ color: C.green }}>[egress-test] PASS — 0 bytes left this host</div>
            </div>

            <div style={{
              marginTop: 16, padding: '14px 16px', borderRadius: 10, textAlign: 'center',
              background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.18)',
            }}>
              <div style={{
                fontFamily: DISPLAY, fontSize: 16, fontWeight: 800, letterSpacing: 2, color: C.accent,
                textShadow: '0 0 18px rgba(0,212,255,0.3)',
              }}>See everything. Touch nothing.</div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textMute, marginTop: 6, letterSpacing: 1 }}>
                NO HTTP CLIENT CRATE IS COMPILED INTO THIS BINARY · CAP_NET_RAW ONLY, DROPPED AFTER BIND
              </div>
            </div>
          </Section>
        </Stagger>

        {/* ─────────────── 5 · EVIDENCE & RETENTION ─────────────── */}
        <Stagger delay={0.25}>
          <Section
            id="evidence"
            anchorRef={el => { anchors.current.evidence = el }}
            title="Evidence & retention"
            subtitle="F11 · hash-linked custody chain. F15 · byte-identical re-runs."
            icon={Icons.shield}
            right={<Pill color={C.green}>CHAIN INTACT</Pill>}
          >
            <Row label="Merkle sealing interval" hint="A root is sealed on this cadence; every alert is a leaf under it. Shorter interval = tighter custody window, more roots to verify.">
              <Segmented value={sealInterval} options={SEAL_INTERVALS} onChange={setSealInterval} />
            </Row>

            <Row label="Retention window" hint="Parquet ledger age-out. Sealed roots are retained beyond this so old chains stay verifiable.">
              <Slider value={retention} min={7} max={365} step={1} onChange={setRetention} width={150} />
              <span style={numeric({ width: 62, textAlign: 'right' })}>{retention} d</span>
            </Row>

            <Row label="Hash algorithm" hint="SHA-256 over the canonicalised OCSF record. BLAKE3 exists behind a build flag; the shipped image pins SHA-256 so external verification needs no exotic tooling.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: C.green }}>SHA-256</span>
                <span className="ek-badge-info" style={{ fontFamily: MONO }}>PINNED</span>
              </div>
            </Row>

            <div style={{ padding: '12px 0', borderBottom: `1px solid ${C.borderSoft}` }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Permitted export formats</div>
                <div style={{ fontSize: 10, color: C.textMute, marginTop: 3 }}>
                  Written to the mounted evidence volume. Export is a file write — never a network call.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9 }}>
                {EXPORT_FORMATS.map(f => {
                  const on = formats[f.id]
                  return (
                    <div key={f.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 9, padding: 11, borderRadius: 9,
                      background: C.inset,
                      border: `1px solid ${on ? 'rgba(0,212,255,0.28)' : C.borderSoft}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <Check on={on} disabled={f.locked} onChange={v => setFormats(p => ({ ...p, [f.id]: v }))} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: on ? C.text : C.textMute, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {f.label}
                          {f.locked && <span style={{ fontFamily: MONO, fontSize: 8, color: C.textFaint, letterSpacing: 1 }}>REQUIRED</span>}
                        </div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, marginTop: 3, lineHeight: 1.5 }}>{f.detail}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Determinism */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: 'rgba(0,212,255,0.035)', border: '1px solid rgba(0,212,255,0.18)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, color: C.accent, letterSpacing: 0.5 }}>
                    Determinism · reproducible replay
                  </div>
                  <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 5, lineHeight: 1.6, maxWidth: 520 }}>
                    Fixed seeds plus deterministic flow-eviction order mean the same PCAP produces a
                    byte-identical alert ledger. That is what lets us say <em>re-run our harness, get our numbers</em>.
                  </div>
                </div>
                <Toggle on={fixedSeed} onChange={setFixedSeed} color={C.accent} width={70} height={30} />
              </div>

              <Row label="Master seed" hint="Feeds sketch hash salts, HLL registers, IsolationForest sampling and the replay scheduler." >
                <Field value={seed} onChange={setSeed} unit="u32" width={128}
                  invalid={!(Number.isInteger(parseInt(seed, 10)) && parseInt(seed, 10) >= 0)} />
              </Row>
              <Row label="Deterministic eviction order" hint="LRU ties broken by flow-key hash, never by wall clock. Without this, two runs diverge on cold-tuple eviction." last>
                <Toggle on={detEviction} onChange={setDetEviction} color={C.accent} width={64} height={28} />
              </Row>

              <div style={{
                marginTop: 12, padding: '9px 12px', borderRadius: 8,
                background: fixedSeed && detEviction ? 'rgba(16,185,129,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${fixedSeed && detEviction ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.22)'}`,
                fontFamily: MONO, fontSize: 10, lineHeight: 1.6,
                color: fixedSeed && detEviction ? '#6ee7b7' : '#fcd34d',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                {fixedSeed && detEviction ? Icons.check({ width: 13, height: 13 }) : Icons.warning({ width: 13, height: 13 })}
                {fixedSeed && detEviction
                  ? `REPRODUCIBLE — replay seeded ${seed}, ledger digest stable across runs`
                  : 'NON-REPRODUCIBLE — ledger digests will differ between runs of the same PCAP'}
              </div>
            </div>
          </Section>
        </Stagger>

        {/* ─────────────── 6 · INTERFACE ─────────────── */}
        <Stagger delay={0.3}>
          <Section
            id="interface"
            anchorRef={el => { anchors.current.interface = el }}
            title="Interface"
            subtitle="Operator-console preferences. Local to this browser; nothing is transmitted."
            icon={Icons.eye}
            right={<Pill color={C.violet}>{presentation ? 'PRESENTATION' : 'OPERATOR'}</Pill>}
          >
            <Row label="Theme" hint="The console is designed dark for a NOC wall. Light mode exists for printed hand-offs.">
              <span style={{ display: 'flex', color: darkMode ? C.violet : C.amber, marginRight: 2 }}>
                {darkMode ? Icons.moon({ width: 14, height: 14 }) : Icons.sun({ width: 14, height: 14 })}
              </span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, marginRight: 4 }}>
                {darkMode ? 'DARK' : 'LIGHT'}
              </span>
              <Toggle on={darkMode} onChange={() => toggleDarkMode()} color={C.violet} width={64} height={28} />
            </Row>

            <Row label="Animation intensity" hint="Reduced drops scan lines and matrix rain; off disables all non-essential motion for screen capture or accessibility.">
              <Segmented
                value={motion}
                onChange={setMotion}
                options={[
                  { value: 'full',    label: 'Full' },
                  { value: 'reduced', label: 'Reduced' },
                  { value: 'off',     label: 'Off' },
                ]}
              />
            </Row>

            <Row label="Alert sound" hint="Short tone on critical severity only. Muted by default — a console that beeps constantly gets muted permanently.">
              <span style={{ fontFamily: MONO, fontSize: 10, color: sound ? C.amber : C.textMute, marginRight: 4 }}>
                {sound ? 'CRITICAL ONLY' : 'MUTED'}
              </span>
              <Toggle on={sound} onChange={setSound} color={C.amber} width={64} height={28} />
            </Row>

            <Row label="Density" hint="Compact tightens row height and hides secondary hints — more alerts per screen on a wall display.">
              <Segmented
                value={density}
                onChange={setDensity}
                options={[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact',     label: 'Compact' },
                ]}
              />
            </Row>

            <Row label="Presentation mode" hint="Enlarges numerics, freezes the alert feed on selection and suppresses transient toasts. Built for demos and for briefings." last>
              <span style={{ fontFamily: MONO, fontSize: 10, color: presentation ? C.green : C.textMute, marginRight: 4 }}>
                {presentation ? 'ON' : 'OFF'}
              </span>
              <Toggle on={presentation} onChange={setPresentation} color={C.green} width={64} height={28} />
            </Row>

            <div style={{
              marginTop: 14, padding: '10px 13px', borderRadius: 8,
              background: C.inset, border: `1px solid ${C.borderSoft}`,
              fontFamily: MONO, fontSize: 9.5, color: C.textMute, letterSpacing: 0.5,
            }}>
              MOTION={motion.toUpperCase()} · DENSITY={density.toUpperCase()} · SOUND={sound ? 'ON' : 'OFF'} ·
              PRESENT={presentation ? 'ON' : 'OFF'} · THEME={darkMode ? 'DARK' : 'LIGHT'}
            </div>
          </Section>
        </Stagger>

        {/* ─────────────── 7 · SYSTEM ─────────────── */}
        <Stagger delay={0.35}>
          <Section
            id="system"
            anchorRef={el => { anchors.current.system = el }}
            title="System"
            subtitle="Read-only build provenance. Everything here is baked into the image digest."
            icon={Icons.cpu}
            right={<Pill color={C.green}>HEALTHY</Pill>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 10 }}>
              {[
                { k: 'Version',        v: 'v0.9.4-rc2',            icon: Icons.file },
                { k: 'Build hash',     v: '7f3c9a1e4b02d8c6',      icon: Icons.hash },
                { k: 'Detector pack',  v: '2026.03.1 (6 specialists)', icon: Icons.layers },
                { k: 'Model versions', v: 'lgbm 4.5 · onnx 2.0 · char-cnn r7', icon: Icons.database },
                { k: 'Image digest',   v: 'sha256:c41e...9ab0',    icon: Icons.lock },
                { k: 'Uptime',         v: uptimeStr,               icon: Icons.clock },
                { k: 'Host',           v: 'ekadhara-sensor-01 (enclave-A)', icon: Icons.server },
                { k: 'CPU',            v: '8 x x86_64 @ 3.4 GHz · AVX2', icon: Icons.cpu },
                { k: 'Capture NIC',    v: `${iface} · ${promisc ? 'promisc' : 'non-promisc'}`, icon: Icons.network },
                { k: 'SBOM',           v: 'CycloneDX 1.5 · shipped in image', icon: Icons.shield },
              ].map(row => (
                <div key={row.k} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9,
                  background: C.inset, border: `1px solid ${C.borderSoft}`,
                }}>
                  <span style={{ display: 'flex', color: C.textFaint, flexShrink: 0 }}>{row.icon({ width: 13, height: 13 })}</span>
                  <div style={{ minWidth: 0 }}>
                    <Label>{row.k}</Label>
                    <div style={{
                      fontFamily: MONO, fontSize: 11, fontWeight: 600, color: C.text, marginTop: 3,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{row.v}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Zero dependencies */}
            <div style={{
              marginTop: 14, padding: 16, borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))',
              border: '1px solid rgba(16,185,129,0.25)',
              display: 'flex', alignItems: 'center', gap: 18,
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 42, fontWeight: 800, color: C.green, lineHeight: 1,
                textShadow: '0 0 24px rgba(16,185,129,0.35)',
              }}>0</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 13, fontWeight: 800, color: '#6ee7b7', letterSpacing: 0.5 }}>
                  Runtime network dependencies
                </div>
                <div style={{ fontSize: 10.5, color: C.textDim, marginTop: 4, lineHeight: 1.6, maxWidth: 520 }}>
                  No resolver, no telemetry endpoint, no update channel, no HTTP client crate compiled into the
                  binary at all. <span style={{ fontFamily: MONO, color: C.textMute }}>cargo-deny</span> gates this in CI —
                  the dependency count is a build-time invariant, not a promise.
                </div>
              </div>
              <span className="ek-badge-low" style={{ fontFamily: MONO, whiteSpace: 'nowrap' }}>CI-ENFORCED</span>
            </div>

            {/* Live resource bars */}
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 14 }}>
              {[
                { label: 'CPU LOAD',   value: 0.37, text: '37%',  color: C.accent },
                { label: 'RSS',        value: 0.41, text: '1.31 / 3.2 GB', color: C.violet },
                { label: 'FLOWS/S',    value: 0.62, text: (st.flowsPerSec || 47200).toLocaleString(), color: C.green },
                { label: 'P99 LATENCY', value: 0.28, text: `${st.p99Latency || 86} ms`, color: C.amber },
              ].map((m, i) => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Label>{m.label}</Label>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: m.color }}>{m.text}</span>
                  </div>
                  <Bar value={m.value} color={m.color} delay={i * 90} />
                </div>
              ))}
            </div>

            {/* Self-test */}
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: C.inset, border: `1px solid ${testDone ? 'rgba(16,185,129,0.3)' : C.border}`,
              transition: 'border-color 0.4s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: testStep >= 0 ? 14 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Self-test</div>
                  <div style={{ fontSize: 10, color: C.textMute, marginTop: 3 }}>
                    Six-step diagnostic: sandbox, capture, signatures, models, egress, ledger.
                  </div>
                </div>
                <GhostButton
                  onClick={runSelfTest}
                  icon={testStep >= 0 && !testDone ? Icons.refresh : Icons.play}
                  color={testDone ? C.green : C.accent}
                  disabled={testStep >= 0 && !testDone}
                >
                  {testStep >= 0 && !testDone ? 'Running' : testDone ? 'Re-run self-test' : 'Run self-test'}
                </GhostButton>
              </div>

              {testStep >= 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {SELF_TEST.map((s, i) => {
                    const done = i < testStep
                    const running = i === testStep && !testDone
                    const pending = i > testStep
                    const color = done ? C.green : running ? C.accent : C.textFaint
                    return (
                      <div key={s.label} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 11px', borderRadius: 8,
                        background: running ? 'rgba(0,212,255,0.06)' : done ? 'rgba(16,185,129,0.04)' : 'transparent',
                        border: `1px solid ${running ? 'rgba(0,212,255,0.25)' : done ? 'rgba(16,185,129,0.16)' : C.borderSoft}`,
                        opacity: pending ? 0.4 : 1,
                        transition: 'all 0.3s ease',
                      }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, width: 18, flexShrink: 0 }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span style={{
                          width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: done ? 'rgba(16,185,129,0.15)' : running ? 'rgba(0,212,255,0.15)' : 'rgba(30,41,59,0.6)',
                          color,
                          animation: running ? 'blink 1s ease-in-out infinite' : 'none',
                        }}>
                          {done ? Icons.check({ width: 10, height: 10 }) : running ? Icons.activity({ width: 10, height: 10 }) : null}
                        </span>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontFamily: MONO, fontSize: 10.5, color: done || running ? C.text : C.textMute }}>{s.label}</div>
                          {(done || running) && (
                            <div style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, marginTop: 2 }}>{s.detail}</div>
                          )}
                        </div>
                        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1, color }}>
                          {done ? 'PASS' : running ? 'RUN' : '—'}
                        </span>
                      </div>
                    )
                  })}

                  {testDone && (
                    <div style={{
                      marginTop: 6, padding: '13px 16px', borderRadius: 10, textAlign: 'center',
                      background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))',
                      border: '1px solid rgba(16,185,129,0.35)',
                      animation: 'scaleIn 0.35s ease-out both',
                    }}>
                      <div style={{
                        fontFamily: DISPLAY, fontSize: 17, fontWeight: 800, letterSpacing: 2.5, color: C.green,
                        textShadow: '0 0 20px rgba(16,185,129,0.4)',
                      }}>ALL CHECKS PASSED</div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, color: '#6ee7b7', marginTop: 6, letterSpacing: 1 }}>
                        6 / 6 · 2.58 s · 0 bytes egressed · audit leaf written
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{
              marginTop: 14, fontFamily: MONO, fontSize: 9.5, color: C.textFaint, lineHeight: 1.7,
            }}>
              Demo console — control state is local to this session and is not persisted to the sensor.
              DIODE MODE, ACK-SHADOW and theme are shared with the rest of the dashboard.
            </div>
          </Section>
        </Stagger>
      </div>
    </div>
  )
}
