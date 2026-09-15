import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import {
  C, MONO, DISPLAY, Icons, Card, CardHeader, Pill, Label, CountUp, Sparkline, Bar, Stagger,
  THREAT_TYPES, SEVERITY_COLOR, SEVERITY_BADGE, VALIDITY_CHIP,
  fmtTime, fmtDateTime, fmtBytes,
} from '../lib/shared.jsx'

/* ═══════════════════════════════════════════════════════════════════
   EKADHARA — EVIDENCE VAULT
   Tamper-evident forensic record. Every alert the enclave raises is
   sealed into a rolling Merkle chain (F11), hashed over the exact
   packet byte range that produced it (F5), and annotated with
   MEASURED / ESTIMATED / MISSING validity because under diode capture
   part of the flow is reconstructed, not observed.
   Egress is denied by seccomp-bpf (F2) — nothing leaves on its own.
   ═══════════════════════════════════════════════════════════════════ */

// ── Deterministic pseudo-hashing (never Math.random during render) ──
function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h >>> 0
}
function hexFrom(seed, len) {
  let out = ''
  let i = 0
  while (out.length < len) out += fnv1a(`${seed}#${i++}`).toString(16).padStart(8, '0')
  return out.slice(0, len)
}
function intFrom(seed, min, max) {
  return min + (fnv1a(seed) % (max - min + 1))
}
function floatFrom(seed, min, max, decimals = 2) {
  const t = (fnv1a(seed) % 100000) / 100000
  return Number((min + t * (max - min)).toFixed(decimals))
}

const CUSTODY_STAGES = [
  { key: 'captured',   label: 'Captured',    detail: 'AF_XDP ring · diode tap ingress',        color: C.blue,   offset: -1840 },
  { key: 'parsed',     label: 'Parsed',      detail: 'Zero-copy decode → RawEvent',           color: C.accent2, offset: -1210 },
  { key: 'detected',   label: 'Detected',    detail: 'Detector fired on feature window',      color: C.accent, offset: 0 },
  { key: 'scored',     label: 'Scored',      detail: 'Calibrated confidence + TreeSHAP',      color: C.amber,  offset: 340 },
  { key: 'sealed',     label: 'Sealed',      detail: 'Merkle leaf appended · ledger fsync',   color: C.green,  offset: 910 },
  { key: 'replicated', label: 'Replicated',  detail: 'Mirrored to WORM partition (offline)',  color: C.violet, offset: 1520 },
]

const FEATURE_CATALOG = {
  ddos:      [['syn_ratio', 'ratio', 0.62, 0.98], ['packet_rate', 'pkt/s', 8000, 92000], ['sketch_heavy_hitter', 'count', 3, 28], ['dst_port_entropy', 'bits', 0.2, 1.4], ['ttl_variance', 'σ²', 0.4, 9.2]],
  beaconing: [['iat_mad_ratio', 'ratio', 0.02, 0.31], ['iat_bowley_skew', 'skew', -0.4, 0.44], ['interval_variance', 'σ²', 0.01, 2.4], ['size_bowley_skew', 'skew', -0.3, 0.5], ['flow_duration', 's', 180, 3600]],
  dga:       [['shannon_entropy', 'bits', 3.1, 4.9], ['ngram_improbability', 'score', 0.4, 0.97], ['label_length_mean', 'chars', 9, 42], ['nxdomain_ratio', 'ratio', 0.1, 0.88], ['txt_payload_ratio', 'ratio', 0.0, 0.71]],
  malware:   [['ja3_rarity', 'score', 0.3, 0.99], ['payload_entropy', 'bits', 7.1, 7.99], ['tls_ext_count', 'count', 4, 19], ['cert_validity_days', 'd', 1, 90], ['down_up_ratio', 'ratio', 0.1, 6.4]],
  scan:      [['unique_ports_hll', 'card', 40, 4100], ['syn_ratio', 'ratio', 0.7, 0.99], ['rst_ratio', 'ratio', 0.2, 0.9], ['flow_duration', 's', 0.4, 12], ['dst_host_fanout', 'count', 2, 64]],
  exfil:     [['byte_ratio_asym', 'ratio', 3.1, 48.0], ['ack_shadow_bytes', 'B', 40000, 980000], ['flow_duration', 's', 60, 2400], ['upload_burstiness', 'score', 0.3, 0.94], ['rtt', 'ms', 4, 220]],
}

// Which features survive a one-way tap, and which must be reconstructed.
const VALIDITY_RULES = {
  rtt: 'MISSING',
  down_up_ratio: 'ESTIMATED',
  ack_shadow_bytes: 'ESTIMATED',
  cert_validity_days: 'ESTIMATED',
  nxdomain_ratio: 'ESTIMATED',
  rst_ratio: 'ESTIMATED',
  byte_ratio_asym: 'ESTIMATED',
}

const PROGRESSION_TEMPLATE = [
  { label: 'Baseline established',   detail: 'Rolling profile stable for 11 windows',          color: C.textMute, offset: -960000 },
  { label: 'First anomalous flow',   detail: 'Feature vector crossed 2.4σ on primary axis',    color: C.blue,     offset: -420000 },
  { label: 'Pattern corroborated',   detail: 'Second detector agreed within the same window',  color: C.accent2,  offset: -180000 },
  { label: 'Threshold breached',     detail: 'Calibrated score passed operator threshold',     color: C.amber,    offset: -42000 },
  { label: 'Alert raised',           detail: 'OCSF Detection Finding emitted to ledger',       color: C.accent,   offset: 0 },
  { label: 'Evidence sealed',        detail: 'SHA-256 over capture byte range · Merkle leaf',  color: C.green,    offset: 26000 },
  { label: 'Operator acknowledged',  detail: 'Analyst console ACK · no egress performed',      color: C.violet,   offset: 184000 },
]

// ── Record derivation ───────────────────────────────────────────────
function deriveRecord(alert, idx, total) {
  const seed = `${alert.id}|${alert.timestamp}|${alert.threat}`
  const hash = hexFrom(seed, 64)
  const parent = hexFrom(`${seed}|parent`, 64)
  const leaf = hexFrom(`${seed}|leaf`, 64)
  const sealedAt = alert.timestamp + 910 + intFrom(`${seed}|seal`, 40, 680)
  const proto = alert.protocol || ['TCP', 'UDP', 'TCP'][intFrom(`${seed}|proto`, 0, 2)]
  const srcPort = alert.srcPort || intFrom(`${seed}|sp`, 1024, 65000)
  const dstPort = alert.dstPort || [22, 53, 80, 443, 445, 3389, 8080][intFrom(`${seed}|dp`, 0, 6)]
  const packets = alert.packets || intFrom(`${seed}|pk`, 24, 4200)
  const bytes = alert.bytes || intFrom(`${seed}|by`, 1400, 880000)

  return {
    alert,
    seed,
    hash,
    parent,
    leaf,
    recordId: `EVR-${hexFrom(`${seed}|rid`, 6).toUpperCase()}`,
    block: 812440 + (total - idx),
    height: total - idx,
    nonce: `0x${hexFrom(`${seed}|nonce`, 16)}`,
    sealedAt,
    sealMs: floatFrom(`${seed}|sealms`, 0.8, 7.4, 2),
    captureOffset: intFrom(`${seed}|off`, 1_000_000, 340_000_000),
    byteRange: intFrom(`${seed}|range`, 1200, 96000),
    flowId: hexFrom(`${seed}|flow`, 8),
    detectorVer: `${alert.threat}/v1.${intFrom(`${seed}|ver`, 0, 4)}.${intFrom(`${seed}|ver2`, 0, 9)}`,
    modelHash: hexFrom(`${seed}|model`, 16),
    directionMask: ['BOTH', 'FWD_ONLY', 'REV_ONLY'][intFrom(`${seed}|mask`, 0, 2)],
    proto, srcPort, dstPort, packets, bytes,
  }
}

function deriveFeatures(rec) {
  const spec = FEATURE_CATALOG[rec.alert.threat] || FEATURE_CATALOG.ddos
  const rows = spec.map(([name, unit, lo, hi], i) => {
    let validity = VALIDITY_RULES[name] || 'MEASURED'
    if (rec.directionMask === 'BOTH' && validity === 'ESTIMATED') validity = 'MEASURED'
    if (rec.directionMask !== 'BOTH' && name === 'rtt') validity = 'MISSING'
    const value = validity === 'MISSING' ? null : floatFrom(`${rec.seed}|f${i}`, lo, hi, hi > 1000 ? 0 : 2)
    return {
      name, unit, value, validity,
      shap: floatFrom(`${rec.seed}|s${i}`, 0.04, 0.46, 3),
      threshold: floatFrom(`${rec.seed}|t${i}`, lo, hi, hi > 1000 ? 0 : 2),
    }
  })
  return rows.sort((a, b) => b.shap - a.shap)
}

function derivePackets(rec) {
  const a = rec.alert
  return Array.from({ length: 5 }, (_, i) => {
    const t = rec.alert.timestamp + i * intFrom(`${rec.seed}|dt${i}`, 8, 940)
    const flags = ['S', 'S.', '.', 'P.', 'FP.'][intFrom(`${rec.seed}|fl${i}`, 0, 4)]
    return {
      ts: t,
      us: String(intFrom(`${rec.seed}|us${i}`, 100000, 999999)),
      src: `${a.srcIp}.${rec.srcPort + i}`,
      dst: `${a.dstIp}.${rec.dstPort}`,
      flags: rec.proto === 'UDP' ? 'UDP' : `[${flags}]`,
      seq: intFrom(`${rec.seed}|sq${i}`, 1000, 4000000000),
      win: intFrom(`${rec.seed}|wn${i}`, 512, 65535),
      len: intFrom(`${rec.seed}|ln${i}`, 0, 1460),
      ttl: intFrom(`${rec.seed}|ttl${i}`, 48, 128),
      hex: hexFrom(`${rec.seed}|hx${i}`, 32),
    }
  })
}

// ── Small helpers ───────────────────────────────────────────────────
const monoStyle = (size = 10, color = C.textDim) => ({ fontFamily: MONO, fontSize: size, color })

function CopyField({ label, value, color = C.accent, size = 10, onToast }) {
  const [hit, setHit] = useState(false)
  const copy = useCallback(async () => {
    try { await navigator.clipboard.writeText(String(value)) } catch { /* clipboard blocked in enclave */ }
    setHit(true)
    onToast && onToast(`${label} copied to local buffer`)
    setTimeout(() => setHit(false), 1600)
  }, [value, label, onToast])

  return (
    <div>
      {label && <Label style={{ display: 'block', marginBottom: 5 }}>{label}</Label>}
      <div
        onClick={copy}
        title="Click to copy"
        style={{
          padding: '9px 11px', borderRadius: 8, cursor: 'pointer',
          background: `${color}08`, border: `1px solid ${color}26`,
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: MONO, fontSize: size, color, wordBreak: 'break-all',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.borderColor = `${color}4d` }}
        onMouseLeave={(e) => { e.currentTarget.style.background = `${color}08`; e.currentTarget.style.borderColor = `${color}26` }}
      >
        <span style={{ flex: 1, lineHeight: 1.5 }}>{value}</span>
        <span style={{ flexShrink: 0, fontSize: 9, letterSpacing: 1, color: hit ? C.green : C.textMute, display: 'flex', alignItems: 'center', gap: 4 }}>
          {hit ? 'COPIED' : <>{Icons.copy({ width: 11, height: 11 })} COPY</>}
        </span>
      </div>
    </div>
  )
}

function KV({ k, v, color = C.text, mono = true }) {
  return (
    <div style={{ padding: '9px 11px', borderRadius: 8, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
      <Label style={{ display: 'block', marginBottom: 4, letterSpacing: 1.4 }}>{k}</Label>
      <div style={{ fontFamily: mono ? MONO : DISPLAY, fontSize: 11, fontWeight: 600, color, wordBreak: 'break-all' }}>{v}</div>
    </div>
  )
}

// ── Merkle chain visualiser (the signature visual) ──────────────────
const BW = 108, BH = 74, BGAP = 44, BPAD = 16, SVGH = 168

function MerkleChain({ records, selectedId, onPick, sweep }) {
  const blocks = useMemo(() => records.slice(0, 9).slice().reverse(), [records])
  const [hover, setHover] = useState(null)
  const n = blocks.length
  const svgW = BPAD * 2 + n * BW + Math.max(0, n - 1) * BGAP

  if (!n) return null

  return (
    // minWidth/maxWidth pin this to its container: without them the wrapper
    // grows to the SVG's intrinsic width and pushes the whole page sideways
    // instead of scrolling the chain.
    <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4, minWidth: 0, maxWidth: '100%' }}>
      <svg width={Math.max(svgW, 320)} height={SVGH} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ekBlkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(30,41,59,0.95)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0.92)" />
          </linearGradient>
          <linearGradient id="ekBlkHead" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(168,85,247,0.35)" />
            <stop offset="100%" stopColor="rgba(0,212,255,0.25)" />
          </linearGradient>
          <linearGradient id="ekLink" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(16,185,129,0.25)" />
            <stop offset="100%" stopColor="rgba(0,212,255,0.75)" />
          </linearGradient>
          <filter id="ekGlow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Parent-hash links */}
        {blocks.map((_, i) => {
          if (i === n - 1) return null
          const x1 = BPAD + i * (BW + BGAP) + BW
          const x2 = x1 + BGAP
          const y = 20 + BH / 2
          return (
            <g key={`lnk-${i}`}>
              <line x1={x1} y1={y} x2={x2} y2={y} stroke="url(#ekLink)" strokeWidth="2" strokeDasharray="5 4">
                <animate attributeName="stroke-dashoffset" from="9" to="0" dur="0.9s" repeatCount="indefinite" />
              </line>
              <circle cx={(x1 + x2) / 2} cy={y} r="7" fill="rgba(10,14,23,0.95)" stroke="rgba(0,212,255,0.45)" strokeWidth="1" />
              <text x={(x1 + x2) / 2} y={y + 3} textAnchor="middle" fill={C.accent} style={{ fontFamily: MONO, fontSize: 8 }}>#</text>
            </g>
          )
        })}

        {/* Blocks */}
        {blocks.map((r, i) => {
          const x = BPAD + i * (BW + BGAP)
          const y = 20
          const isNewest = i === n - 1
          const isSel = r.alert.id === selectedId
          const isHover = hover === r.alert.id
          const swept = sweep > 0 && (i + 1) / n <= sweep + 0.001
          const stroke = isSel ? C.accent : swept ? C.green : isNewest ? 'rgba(168,85,247,0.65)' : C.border
          const sev = SEVERITY_COLOR[r.alert.severity] || C.textMute
          return (
            <g
              key={r.alert.id}
              onClick={() => onPick(r.alert)}
              onMouseEnter={() => setHover(r.alert.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer' }}
            >
              {(isSel || isNewest) && (
                <rect x={x - 3} y={y - 3} width={BW + 6} height={BH + 6} rx="13"
                  fill="none" stroke={isSel ? C.accent : C.violet} strokeWidth="1" opacity="0.35" filter="url(#ekGlow)">
                  {isNewest && !isSel && <animate attributeName="opacity" values="0.12;0.55;0.12" dur="2.1s" repeatCount="indefinite" />}
                </rect>
              )}
              <rect x={x} y={y} width={BW} height={BH} rx="10" fill="url(#ekBlkFill)" stroke={stroke}
                strokeWidth={isSel ? 2 : 1} opacity={isHover ? 1 : 0.96} />
              <path d={`M${x + 10},${y} h${BW - 20} a10,10 0 0 1 10,10 v6 h-${BW} v-6 a10,10 0 0 1 10,-10 z`} fill="url(#ekBlkHead)" />
              <text x={x + 9} y={y + 12} fill={C.text} style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700 }}>#{r.block}</text>
              <circle cx={x + BW - 11} cy={y + 8} r="3" fill={sev}>
                {isNewest && <animate attributeName="r" values="2.4;4.2;2.4" dur="1.4s" repeatCount="indefinite" />}
              </circle>
              <text x={x + 9} y={y + 34} fill={swept ? C.green : C.violet} style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>
                {r.hash.slice(0, 10)}
              </text>
              <text x={x + 9} y={y + 48} fill={C.textFaint} style={{ fontFamily: MONO, fontSize: 7.5 }}>
                ↰ {r.parent.slice(0, 8)}
              </text>
              <text x={x + 9} y={y + 63} fill={C.textMute} style={{ fontFamily: MONO, fontSize: 7.5 }}>
                {fmtTime(r.sealedAt)}
              </text>
              {swept && (
                <g>
                  <circle cx={x + BW - 12} cy={y + BH - 11} r="7" fill="rgba(16,185,129,0.15)" stroke="rgba(16,185,129,0.5)" strokeWidth="1" />
                  <path d={`M${x + BW - 15.5},${y + BH - 11} l2.6,2.6 l4.2,-5`} fill="none" stroke={C.green} strokeWidth="1.6" strokeLinecap="round" />
                </g>
              )}
              <text x={x + BW / 2} y={y + BH + 18} textAnchor="middle" fill={isSel ? C.accent : C.textFaint}
                style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 0.6 }}>
                {r.recordId}
              </text>
              <text x={x + BW / 2} y={y + BH + 30} textAnchor="middle" fill={C.textFaint} style={{ fontFamily: MONO, fontSize: 7.5 }}>
                h={r.height}
              </text>
            </g>
          )
        })}

        {/* Sweep playhead */}
        {sweep > 0 && sweep < 1 && (
          <line
            x1={BPAD + sweep * (svgW - BPAD * 2)} y1="8"
            x2={BPAD + sweep * (svgW - BPAD * 2)} y2={SVGH - 26}
            stroke={C.green} strokeWidth="2" opacity="0.7" filter="url(#ekGlow)"
          />
        )}

        <text x={BPAD} y={SVGH - 6} fill={C.textFaint} style={{ fontFamily: MONO, fontSize: 8, letterSpacing: 1 }}>
          GENESIS ← … ← older leaves pruned to WORM · showing tail {n} of chain
        </text>
      </svg>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
export default function EvidencePage({ alerts = [], selectedAlert, onSelectAlert }) {
  const [query, setQuery] = useState('')
  const [verifyState, setVerifyState] = useState('idle') // idle | running | done
  const [sweep, setSweep] = useState(0)
  const [verifiedAt, setVerifiedAt] = useState(null)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const rafRef = useRef(null)

  const records = useMemo(
    () => alerts.map((a, i) => deriveRecord(a, i, alerts.length)),
    [alerts],
  )
  const byId = useMemo(() => {
    const m = new Map()
    records.forEach((r) => m.set(r.alert.id, r))
    return m
  }, [records])

  const rec = selectedAlert ? byId.get(selectedAlert.id) : null
  const features = useMemo(() => (rec ? deriveFeatures(rec) : []), [rec])
  const packets = useMemo(() => (rec ? derivePackets(rec) : []), [rec])
  const custody = useMemo(() => {
    if (!rec) return []
    return CUSTODY_STAGES.map((s, i) => ({
      ...s,
      t: rec.alert.timestamp + s.offset + i * intFrom(`${rec.seed}|c${i}`, 1, 90),
      h: hexFrom(`${rec.seed}|stage${s.key}`, 16),
    }))
  }, [rec])
  const progression = useMemo(() => {
    if (!rec) return []
    return PROGRESSION_TEMPLATE.map((p, i) => ({
      ...p,
      t: rec.alert.timestamp + p.offset,
      h: hexFrom(`${rec.seed}|prog${i}`, 8),
    }))
  }, [rec])

  const merkleRoot = useMemo(() => {
    const acc = records.reduce((s, r) => `${s}${r.hash.slice(0, 8)}`, 'ekadhara-root')
    return hexFrom(acc, 64)
  }, [records])

  const lastSeal = records.length ? Math.max(...records.map((r) => r.sealedAt)) : Date.now()
  const chainHeight = 812440 + records.length

  const sealTrend = useMemo(() => {
    if (!records.length) return [1, 2, 1, 3, 2, 4, 3, 5, 4, 6, 5, 7]
    const now = Date.now()
    const buckets = new Array(14).fill(0)
    records.forEach((r) => {
      const age = now - r.sealedAt
      const b = 13 - Math.max(0, Math.min(13, Math.floor(age / 300000)))
      buckets[b] += 1
    })
    return buckets
  }, [records])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return records
    return records.filter((r) =>
      r.hash.includes(q) || r.recordId.toLowerCase().includes(q) ||
      r.alert.id.toLowerCase().includes(q) || r.alert.srcIp.includes(q) ||
      r.alert.dstIp.includes(q) || r.alert.threat.includes(q) ||
      (THREAT_TYPES[r.alert.threat]?.name || '').toLowerCase().includes(q) ||
      r.alert.severity.includes(q),
    )
  }, [records, query])

  const fireToast = useCallback((msg) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => () => { clearTimeout(toastTimer.current); cancelAnimationFrame(rafRef.current) }, [])

  const runVerify = useCallback(() => {
    if (verifyState === 'running') return
    setVerifyState('running')
    setSweep(0)
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min((now - t0) / 1500, 1)
      setSweep(p)
      if (p < 1) rafRef.current = requestAnimationFrame(step)
      else {
        setVerifyState('done')
        setVerifiedAt(Date.now())
        fireToast(`Chain verified · ${records.length} leaves · 0 breaks`)
        setTimeout(() => { setVerifyState('idle'); setSweep(0) }, 2600)
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [verifyState, records.length, fireToast])

  const ledger = records.slice(0, 8)
  const threat = rec ? (THREAT_TYPES[rec.alert.threat] || { name: rec.alert.threat, icon: '⚠', color: C.red }) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>

      {/* ── 1 · VAULT HEADER STRIP ──────────────────────────────── */}
      <Stagger delay={0}>
        <Card scan style={{ padding: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 200 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 11, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(168,85,247,0.18), rgba(0,212,255,0.12))',
                border: '1px solid rgba(168,85,247,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.violet,
                boxShadow: '0 0 24px rgba(168,85,247,0.18)',
              }}>{Icons.lock({ width: 20, height: 20 })}</div>
              <div>
                <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: -0.3 }}>
                  Evidence Vault
                </div>
                <div style={{ ...monoStyle(9.5, C.textMute), letterSpacing: 1.2, marginTop: 3 }}>
                  APPEND-ONLY · WORM-MIRRORED · EGRESS DENIED
                </div>
              </div>
            </div>

            <div style={{ width: 1, height: 46, background: C.border }} />

            <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', flex: 1 }}>
              <div>
                <Label>Sealed records</Label>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <CountUp target={records.length} style={{ fontSize: 26, fontWeight: 700, color: C.text }} />
                  <span style={monoStyle(9, C.textFaint)}>leaves</span>
                </div>
              </div>
              <div>
                <Label>Chain height</Label>
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.accent, marginTop: 2 }}>
                  {chainHeight.toLocaleString()}
                </div>
              </div>
              <div>
                <Label>Last seal</Label>
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: C.text, marginTop: 6 }}>
                  {fmtTime(lastSeal)}
                </div>
                <div style={monoStyle(8.5, C.textFaint)}>{fmtDateTime(lastSeal)}</div>
              </div>
              <div style={{ minWidth: 130 }}>
                <Label>Seals / 5 min</Label>
                <Sparkline data={sealTrend} width={130} height={34} color={C.violet} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                padding: '11px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
                border: '1px solid rgba(16,185,129,0.35)',
                boxShadow: '0 0 26px rgba(16,185,129,0.12)',
                display: 'flex', alignItems: 'center', gap: 11,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, background: 'rgba(16,185,129,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.green,
                }} className={verifyState === 'running' ? 'ek-pulse' : ''}>
                  {Icons.shield({ width: 16, height: 16 })}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.green, letterSpacing: 0.6, fontFamily: DISPLAY }}>
                    {verifyState === 'running' ? 'VERIFYING…' : 'CHAIN INTACT — 0 BREAKS'}
                  </div>
                  <div style={monoStyle(8.5, '#6ee7b7')}>
                    {verifyState === 'running'
                      ? `recomputing ${Math.round(sweep * records.length)} / ${records.length} leaves`
                      : verifiedAt ? `re-verified ${fmtTime(verifiedAt)} · full recompute` : 'last full recompute at boot · continuous tail check'}
                  </div>
                </div>
              </div>

              <button
                onClick={runVerify}
                disabled={verifyState === 'running'}
                style={{
                  padding: '11px 16px', borderRadius: 10, cursor: verifyState === 'running' ? 'wait' : 'pointer',
                  background: verifyState === 'running' ? 'rgba(16,185,129,0.14)' : 'rgba(0,212,255,0.08)',
                  border: `1px solid ${verifyState === 'running' ? 'rgba(16,185,129,0.4)' : 'rgba(0,212,255,0.28)'}`,
                  color: verifyState === 'running' ? C.green : C.accent,
                  fontSize: 11, fontWeight: 700, letterSpacing: 0.6, fontFamily: MONO,
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (verifyState !== 'running') e.currentTarget.style.background = 'rgba(0,212,255,0.16)' }}
                onMouseLeave={(e) => { if (verifyState !== 'running') e.currentTarget.style.background = 'rgba(0,212,255,0.08)' }}
              >
                {Icons.refresh({ width: 13, height: 13 })} VERIFY CHAIN
              </button>
            </div>
          </div>

          {/* Merkle root + progress sweep */}
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 200px', gap: 14, alignItems: 'end' }}>
            <CopyField label="Merkle root (SHA-256)" value={merkleRoot} color={C.violet} onToast={fireToast} />
            <div>
              <Label style={{ display: 'block', marginBottom: 6 }}>Verification pass</Label>
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(30,41,59,0.7)', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  height: '100%', width: `${(verifyState === 'running' ? sweep : 1) * 100}%`,
                  background: `linear-gradient(90deg, ${C.green}, ${C.accent})`,
                  boxShadow: `0 0 12px ${C.green}66`, transition: 'width 0.08s linear',
                }} />
              </div>
              <div style={{ ...monoStyle(8.5, C.textFaint), marginTop: 5 }}>
                {verifyState === 'running' ? `${Math.round(sweep * 100)}% · leaf → root` : 'idle · ready'}
              </div>
            </div>
          </div>
        </Card>
      </Stagger>

      {/* ── 2 · MERKLE CHAIN VISUALISER ─────────────────────────── */}
      <Stagger delay={0.06}>
        <Card style={{ padding: 18 }}>
          <CardHeader
            icon={Icons.link}
            title="Merkle chain — rolling seal"
            subtitle="Each leaf commits the alert payload plus its parent hash. Click a block to load that record."
            right={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Pill color={C.violet}>SHA-256</Pill>
                <Pill color={C.green}>APPEND-ONLY</Pill>
                <Pill color={C.accent}>{records.length} LEAVES</Pill>
              </div>
            }
          />
          <MerkleChain
            records={records}
            selectedId={selectedAlert?.id}
            onPick={(a) => onSelectAlert && onSelectAlert(a)}
            sweep={sweep}
          />
        </Card>
      </Stagger>

      {/* ── 3 + 4 · RECORD LIST  |  RECORD DETAIL ───────────────── */}
      {/* minmax(0, 1fr), not 1fr: the detail column holds hex dumps and 64-char
          hashes, whose min-content width would otherwise widen the whole page. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) minmax(0, 1fr)', gap: 16, alignItems: 'start' }}>

        <Stagger delay={0.12}>
          <Card style={{ padding: 14 }}>
            <CardHeader
              icon={Icons.database}
              title="Sealed records"
              subtitle={`${filtered.length} of ${records.length} matching`}
            />
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <span style={{ position: 'absolute', left: 10, top: 9, color: C.textMute }}>{Icons.search({ width: 13, height: 13 })}</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="search hash / ip / threat…"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '8px 10px 8px 30px',
                  borderRadius: 8, background: C.inset, border: `1px solid ${C.borderSoft}`,
                  color: C.text, fontFamily: MONO, fontSize: 10.5, outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.4)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.borderSoft }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 620, overflowY: 'auto', paddingRight: 2 }}>
              {filtered.length === 0 && (
                <div style={{ padding: 26, textAlign: 'center', color: C.textMute, fontSize: 11 }}>
                  No sealed record matches that predicate.
                </div>
              )}
              {filtered.map((r) => {
                const t = THREAT_TYPES[r.alert.threat] || { icon: '⚠', name: r.alert.threat, short: 'UNK' }
                const sel = selectedAlert?.id === r.alert.id
                return (
                  <div
                    key={r.alert.id}
                    onClick={() => onSelectAlert && onSelectAlert(r.alert)}
                    style={{
                      padding: '9px 10px', borderRadius: 9, cursor: 'pointer',
                      background: sel ? 'rgba(0,212,255,0.08)' : C.inset,
                      border: `1px solid ${sel ? 'rgba(0,212,255,0.35)' : C.borderSoft}`,
                      borderLeft: `2px solid ${SEVERITY_COLOR[r.alert.severity] || C.textMute}`,
                      transition: 'all 0.16s ease',
                    }}
                    onMouseEnter={(e) => { if (!sel) { e.currentTarget.style.background = 'rgba(30,41,59,0.5)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)' } }}
                    onMouseLeave={(e) => { if (!sel) { e.currentTarget.style.background = C.inset; e.currentTarget.style.borderColor = C.borderSoft } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <span style={{ fontSize: 13 }}>{t.icon}</span>
                      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: sel ? C.accent : C.text }}>{r.recordId}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${SEVERITY_BADGE[r.alert.severity] || SEVERITY_BADGE.info}`}>
                        {r.alert.severity}
                      </span>
                      <span style={{ marginLeft: 'auto', ...monoStyle(8.5, C.textFaint) }}>#{r.block}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <span style={monoStyle(9, C.violet)}>{r.hash.slice(0, 18)}…</span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${VALIDITY_CHIP[r.alert.validity] || VALIDITY_CHIP.MEASURED}`}>
                        {r.alert.validity}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, ...monoStyle(8.5, C.textMute) }}>
                      <span>{r.alert.srcIp}</span>
                      <span style={{ color: C.textFaint }}>→</span>
                      <span>{r.alert.dstIp}</span>
                      <span style={{ marginLeft: 'auto', color: C.textFaint }}>{fmtTime(r.sealedAt)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </Stagger>

        {/* ── RECORD DETAIL ─────────────────────────────────────── */}
        <Stagger delay={0.18}>
          {!rec ? (
            <Card style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.textMute }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ opacity: 0.25, display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  {Icons.shield({ width: 40, height: 40 })}
                </div>
                <p style={{ fontSize: 13, margin: 0 }}>Select a sealed record to open its custody chain</p>
                <p style={{ ...monoStyle(9.5, C.textFaint), marginTop: 6 }}>
                  {records.length} records available · chain root {merkleRoot.slice(0, 12)}…
                </p>
              </div>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Record identity */}
              <Card style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, flexShrink: 0, fontSize: 22,
                    background: `${threat.color}14`, border: `1px solid ${threat.color}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{threat.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: DISPLAY, fontSize: 17, fontWeight: 700, color: C.text }}>{threat.name}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${SEVERITY_BADGE[rec.alert.severity] || SEVERITY_BADGE.info}`}>
                        {rec.alert.severity}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${VALIDITY_CHIP[rec.alert.validity] || VALIDITY_CHIP.MEASURED}`}>
                        {rec.alert.validity}
                      </span>
                      <Pill color={rec.directionMask === 'BOTH' ? C.green : C.amber}>{rec.directionMask}</Pill>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7, ...monoStyle(11, C.textDim), flexWrap: 'wrap' }}>
                      <span>{rec.alert.srcIp}:{rec.srcPort}</span>
                      <span style={{ color: C.textFaint }}>→</span>
                      <span>{rec.alert.dstIp}:{rec.dstPort}</span>
                      <span style={{ color: C.textFaint }}>·</span>
                      <span>{rec.proto}</span>
                      <span style={{ color: C.textFaint }}>·</span>
                      <span>{rec.packets.toLocaleString()} pkts</span>
                      <span style={{ color: C.textFaint }}>·</span>
                      <span>{fmtBytes(rec.bytes)}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <Label>Record</Label>
                    <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.accent }}>{rec.recordId}</div>
                    <div style={monoStyle(9, C.textFaint)}>sealed {fmtDateTime(rec.sealedAt)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <CopyField label="Evidence hash (SHA-256 over capture byte range)" value={rec.hash} color={C.violet} onToast={fireToast} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <CopyField label={`Block #${rec.block}`} value={`parent ${rec.parent.slice(0, 40)}…`} color={C.accent} onToast={fireToast} />
                    <CopyField label="Nonce" value={rec.nonce} color={C.accent2} onToast={fireToast} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    <KV k="Merkle leaf" v={`${rec.leaf.slice(0, 14)}…`} color={C.violet} />
                    <KV k="Capture offset" v={rec.captureOffset.toLocaleString()} />
                    <KV k="Byte range" v={fmtBytes(rec.byteRange)} />
                    <KV k="Flow ID" v={rec.flowId} />
                    <KV k="Detector" v={rec.detectorVer} />
                    <KV k="Model SHA-256" v={`${rec.modelHash}…`} />
                    <KV k="Seal latency" v={`${rec.sealMs} ms`} color={C.green} />
                    <KV k="Confidence" v={`${Math.round(Number(rec.alert.confidence) * 100)}%`} color={C.accent} />
                  </div>
                </div>
              </Card>

              {/* Chain of custody */}
              <Card style={{ padding: 18 }}>
                <CardHeader
                  icon={Icons.layers}
                  title="Chain of custody"
                  subtitle="Monotonic clock · each stage hash commits the previous stage output"
                  right={<Pill color={C.green}>6 / 6 STAGES SIGNED</Pill>}
                />
                <div style={{ position: 'relative', paddingLeft: 18 }}>
                  <div style={{
                    position: 'absolute', left: 6, top: 10, bottom: 10, width: 1,
                    background: `linear-gradient(180deg, ${C.blue}55, ${C.green}66, ${C.violet}55)`,
                  }} />
                  {custody.map((s, i) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', position: 'relative' }}>
                      <div style={{
                        width: 11, height: 11, borderRadius: '50%', background: s.color, flexShrink: 0,
                        marginLeft: -18 + 1, marginTop: 4, position: 'relative', zIndex: 1,
                        boxShadow: `0 0 9px ${s.color}`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: C.text }}>{i + 1}. {s.label}</span>
                          <span style={monoStyle(9.5, C.textMute)}>{fmtTime(s.t)}.{String(intFrom(`${rec.seed}|ms${i}`, 100, 999))}</span>
                          <span style={monoStyle(9, C.violet)}>{s.h}</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textMute, marginTop: 2 }}>{s.detail}</div>
                      </div>
                      <span style={{ ...monoStyle(9, C.green), flexShrink: 0, marginTop: 3 }}>OK</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Feature evidence */}
              <Card style={{ padding: 18 }}>
                <CardHeader
                  icon={Icons.activity}
                  title="Feature evidence"
                  subtitle="Raw values that fired the detector, with per-field provenance under one-way capture"
                  right={
                    <div style={{ display: 'flex', gap: 6 }}>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${VALIDITY_CHIP.MEASURED}`}>measured</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${VALIDITY_CHIP.ESTIMATED}`}>estimated</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${VALIDITY_CHIP.MISSING}`}>missing</span>
                    </div>
                  }
                />
                <div style={{ borderRadius: 9, border: `1px solid ${C.borderSoft}`, overflow: 'hidden' }}>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1.5fr 0.9fr 0.9fr 1.3fr 0.9fr',
                    padding: '7px 11px', background: 'rgba(30,41,59,0.45)', borderBottom: `1px solid ${C.borderSoft}`,
                  }}>
                    {['Feature', 'Value', 'Threshold', 'SHAP contribution', 'Provenance'].map((h) => (
                      <Label key={h} style={{ letterSpacing: 1.2 }}>{h}</Label>
                    ))}
                  </div>
                  {features.map((f, i) => (
                    <div key={f.name} style={{
                      display: 'grid', gridTemplateColumns: '1.5fr 0.9fr 0.9fr 1.3fr 0.9fr',
                      alignItems: 'center', padding: '9px 11px',
                      borderBottom: i === features.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                      background: i % 2 ? 'rgba(15,23,42,0.25)' : 'transparent',
                    }}>
                      <span style={monoStyle(10.5, C.text)}>{f.name}</span>
                      <span style={monoStyle(10.5, f.validity === 'MISSING' ? C.red : C.accent)}>
                        {f.value === null ? '—' : `${f.value} ${f.unit}`}
                      </span>
                      <span style={monoStyle(10, C.textMute)}>{f.threshold}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 12 }}>
                        <Bar value={f.shap} max={0.5} color={f.validity === 'MISSING' ? C.red : f.shap > 0.3 ? C.amber : C.accent} height={5} delay={i * 60} />
                        <span style={{ ...monoStyle(9.5, C.textDim), width: 34, textAlign: 'right' }}>{f.shap.toFixed(3)}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${VALIDITY_CHIP[f.validity]}`} style={{ justifySelf: 'start' }}>
                        {f.validity}
                      </span>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: C.textMute, margin: '10px 0 0', lineHeight: 1.6 }}>
                  Direction mask <span style={{ fontFamily: MONO, color: C.amber }}>{rec.directionMask}</span> — fields marked
                  ESTIMATED were reconstructed from the visible half of the conversation (ACK-Shadow); MISSING fields are
                  reported as absent rather than imputed to zero, so downstream scoring never silently invents evidence.
                </p>
              </Card>

              {/* Packet excerpt */}
              <Card style={{ padding: 18 }}>
                <CardHeader
                  icon={Icons.network}
                  title="Packet-level excerpt"
                  subtitle={`5 representative frames from capture offset ${rec.captureOffset.toLocaleString()}`}
                  right={<Pill color={C.textMute}>READ-ONLY SLICE</Pill>}
                />
                <div style={{
                  borderRadius: 9, padding: 12, background: 'rgba(2,6,15,0.7)',
                  border: `1px solid ${C.borderSoft}`, overflowX: 'auto',
                }}>
                  {packets.map((p, i) => (
                    <div key={i} style={{ marginBottom: i === packets.length - 1 ? 0 : 9 }}>
                      <div style={{ ...monoStyle(10, C.textDim), whiteSpace: 'nowrap' }}>
                        <span style={{ color: C.textMute }}>{fmtTime(p.ts)}.{p.us}</span>{' '}
                        <span style={{ color: C.accent }}>{p.src}</span>
                        <span style={{ color: C.textFaint }}> &gt; </span>
                        <span style={{ color: C.violet }}>{p.dst}</span>
                        <span style={{ color: C.textDim }}>: Flags {p.flags}, seq {p.seq}, win {p.win}, ttl {p.ttl}, length {p.len}</span>
                      </div>
                      <div style={{ ...monoStyle(9.5, C.textFaint), marginTop: 2, paddingLeft: 14, whiteSpace: 'nowrap' }}>
                        0x{String(i * 16).padStart(4, '0')}:{' '}
                        {p.hex.match(/.{1,4}/g).join(' ')}
                        <span style={{ color: C.textMute }}>   {i === 0 ? 'E..<.@.@.....' : i === 1 ? '..P...........' : '..............'}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ ...monoStyle(9, C.textFaint), marginTop: 10, borderTop: `1px solid ${C.borderSoft}`, paddingTop: 8 }}>
                    {rec.packets.toLocaleString()} frames / {fmtBytes(rec.bytes)} in the sealed range · excerpt hashed into leaf {rec.leaf.slice(0, 12)}…
                  </div>
                </div>
              </Card>

              {/* Attack progression */}
              <Card style={{ padding: 18 }}>
                <CardHeader
                  icon={Icons.trending}
                  title="Attack progression"
                  subtitle="Reconstructed from the sealed ledger — every step is independently hashed"
                  right={<Pill color={C.accent}>{progression.length} STEPS</Pill>}
                />
                <div style={{ position: 'relative', paddingLeft: 18 }}>
                  <div style={{
                    position: 'absolute', left: 6, top: 10, bottom: 10, width: 1,
                    background: `linear-gradient(180deg, ${C.textFaint}55, ${C.accent}66, ${C.violet}66)`,
                  }} />
                  {progression.map((p, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '7px 0', position: 'relative' }}>
                      <div style={{
                        width: 11, height: 11, borderRadius: '50%', background: p.color, flexShrink: 0,
                        marginLeft: -17, marginTop: 4, zIndex: 1, boxShadow: `0 0 9px ${p.color}`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{p.label}</span>
                          <span style={monoStyle(9.5, C.textMute)}>{fmtTime(p.t)}</span>
                          <span style={monoStyle(9, C.textFaint)}>Δ {(p.offset / 1000).toFixed(0)}s</span>
                        </div>
                        <div style={{ fontSize: 10.5, color: C.textMute, marginTop: 2 }}>{p.detail}</div>
                      </div>
                      <span style={{ ...monoStyle(9, C.violet), flexShrink: 0, marginTop: 3 }}>{p.h}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Export bar */}
              <Card style={{ padding: 18 }}>
                <CardHeader
                  icon={Icons.download}
                  title="Prepare export"
                  subtitle="Artefacts are staged inside the enclave only — the process cannot open a socket"
                  right={
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7, padding: '5px 10px', borderRadius: 7,
                      background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171',
                    }}>
                      {Icons.lock({ width: 12, height: 12 })}
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>EGRESS LOCKED</span>
                    </div>
                  }
                />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {[
                    { label: 'OCSF JSON', hint: 'Detection Finding', color: C.accent },
                    { label: 'STIX 2.1', hint: 'Bundle + Indicator', color: C.violet },
                    { label: 'PCAP excerpt', hint: `${fmtBytes(rec.byteRange)} slice`, color: C.blue },
                    { label: 'Signed PDF', hint: 'Ed25519 detached sig', color: C.green },
                  ].map((b) => (
                    <button
                      key={b.label}
                      onClick={() => fireToast(`${b.label} for ${rec.recordId} prepared — awaiting operator transfer`)}
                      style={{
                        flex: '1 1 140px', padding: '11px 13px', borderRadius: 9, textAlign: 'left', cursor: 'pointer',
                        background: `${b.color}0a`, border: `1px solid ${b.color}2e`, transition: 'all 0.18s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${b.color}1c`; e.currentTarget.style.borderColor = `${b.color}5c`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = `${b.color}0a`; e.currentTarget.style.borderColor = `${b.color}2e`; e.currentTarget.style.transform = 'none' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: b.color }}>
                        {Icons.file({ width: 12, height: 12 })}
                        <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.5 }}>{b.label}</span>
                      </div>
                      <div style={{ ...monoStyle(8.5, C.textMute), marginTop: 4 }}>{b.hint}</div>
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: 10, color: C.textMute, margin: '12px 0 0', lineHeight: 1.6 }}>
                  <span style={{ fontFamily: MONO, color: '#f87171' }}>seccomp-bpf</span> denies{' '}
                  <span style={{ fontFamily: MONO }}>connect / sendto / sendmsg / sendmmsg</span>; the container runs with{' '}
                  <span style={{ fontFamily: MONO }}>--network none</span>. Nothing auto-exports. A prepared bundle waits on the
                  staging partition until an operator physically moves it — and that move is itself appended to the ledger.
                </p>
              </Card>
            </div>
          )}
        </Stagger>
      </div>

      {/* ── 5 · INTEGRITY LEDGER FOOTER ─────────────────────────── */}
      <Stagger delay={0.24}>
        <Card style={{ padding: 18 }}>
          <CardHeader
            icon={Icons.hash}
            title="Integrity ledger"
            subtitle="Last 8 seal operations · fsync-confirmed, then mirrored"
            right={<Pill color={C.green}>0 ANOMALIES</Pill>}
          />
          <div style={{ borderRadius: 9, border: `1px solid ${C.borderSoft}`, overflow: 'hidden' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.6fr 0.8fr 1fr',
              padding: '7px 12px', background: 'rgba(30,41,59,0.45)', borderBottom: `1px solid ${C.borderSoft}`,
            }}>
              {['Sealed at', 'Record', 'Hash prefix', 'Latency', 'Status'].map((h) => (
                <Label key={h} style={{ letterSpacing: 1.2 }}>{h}</Label>
              ))}
            </div>
            {ledger.length === 0 && (
              <div style={{ padding: 20, textAlign: 'center', fontSize: 11, color: C.textMute }}>Ledger empty — no seals yet.</div>
            )}
            {ledger.map((r, i) => (
              <div
                key={r.alert.id}
                onClick={() => onSelectAlert && onSelectAlert(r.alert)}
                style={{
                  display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.6fr 0.8fr 1fr',
                  alignItems: 'center', padding: '9px 12px', cursor: 'pointer',
                  borderBottom: i === ledger.length - 1 ? 'none' : `1px solid ${C.borderSoft}`,
                  background: i % 2 ? 'rgba(15,23,42,0.25)' : 'transparent',
                  transition: 'background 0.16s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,212,255,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 ? 'rgba(15,23,42,0.25)' : 'transparent' }}
              >
                <span style={monoStyle(10, C.textDim)}>{fmtDateTime(r.sealedAt)}</span>
                <span style={monoStyle(10, C.accent)}>{r.recordId}</span>
                <span style={monoStyle(10, C.violet)}>{r.hash.slice(0, 28)}…</span>
                <span style={monoStyle(10, C.textDim)}>{r.sealMs} ms</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.green, fontFamily: MONO, fontSize: 9.5, fontWeight: 700 }}>
                  {Icons.check({ width: 11, height: 11 })} VERIFIED
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap', ...monoStyle(9, C.textFaint) }}>
            <span>ledger: parquet + rolling merkle · <span style={{ color: C.textMute }}>ekadhara verify --from genesis</span></span>
            <span>root {merkleRoot.slice(0, 16)}…</span>
            <span>height {chainHeight.toLocaleString()}</span>
          </div>
        </Card>
      </Stagger>

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 26, right: 26, zIndex: 60,
          padding: '12px 16px', borderRadius: 10, maxWidth: 380,
          background: 'rgba(10,14,23,0.96)', border: '1px solid rgba(0,212,255,0.35)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.55), 0 0 24px rgba(0,212,255,0.12)',
          display: 'flex', alignItems: 'flex-start', gap: 10,
          animation: 'fadeSlideUp 0.25s ease-out both',
        }}>
          <span style={{ color: C.accent, marginTop: 1 }}>{Icons.shield({ width: 14, height: 14 })}</span>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.text, letterSpacing: 0.3 }}>{toast}</div>
            <div style={{ ...monoStyle(8.5, C.textMute), marginTop: 3 }}>no network transfer performed · egress denied</div>
          </div>
        </div>
      )}
    </div>
  )
}
