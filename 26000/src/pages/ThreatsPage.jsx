import React, { useState, useEffect, useMemo } from 'react'
import {
  C, MONO, DISPLAY, Icons, Card, CardHeader, Pill, Label, CountUp, Toggle,
  Sparkline, Bar, Stagger, THREAT_TYPES, DETECTORS, degradationData,
  SEVERITY_COLOR, fmtTime, fmtNum,
} from '../lib/shared.jsx'

/* ═══════════════════════════════════════════════════════════════════════════
   THREAT DETECTION MATRIX — the technical centrepiece.
   Full-page expansion of App.jsx's DegradationMatrix: capture-mode control,
   detector × capture-mode matrix, per-detector dossiers, the ACK-Shadow
   reconstruction diagram, live threat-type breakdown, coverage verdict.
   ═══════════════════════════════════════════════════════════════════════════ */

// ── Page-local reference data (algorithms/windows come from DETECTORS) ──────
const DETECTOR_DETAIL = {
  ddos: {
    stage: 'IMPACT',
    structure: 'CMS 4x2^16 + HLL + CUSUM',
    memory: '~2 MB fixed',
    reversePath: 'Nothing required — a flood is unidirectional by nature.',
    why: 'unanswered_syn_ratio and the /32 · /24 · /16 entropy triplet are all computable from the attack direction alone. Only connection-completion corroboration is lost.',
    validity: 'MEASURED',
    verdict: 'FULLY FUNCTIONAL',
  },
  beaconing: {
    stage: 'C2',
    structure: 'IAT ring (N=256) + fixed-bin histogram, LRU',
    memory: 'bounded LRU',
    reversePath: 'C2 replies — used only as corroborating evidence.',
    why: 'Beacons originate from the infected host, so the forward path carries the whole timing series. Bowley skew and MAD ratio are robust statistics — they survive ±50% jitter and the loss of the reply.',
    validity: 'MEASURED',
    verdict: 'MINOR RECALL LOSS',
  },
  dga: {
    stage: 'ENABLEMENT',
    structure: 'char-CNN (~50k params) + per-zone HLL',
    memory: 'bounded LRU',
    reversePath: 'DNS response codes (NXDOMAIN), TTLs, answer records.',
    why: 'NXDOMAIN rate is the strongest per-host aggregate and it lives in the response. We infer it from query-retry patterns — a host that queries, gets nothing usable, and immediately queries a different name. Flagged INFERRED, costed at 0.04 F1.',
    validity: 'INFERRED',
    verdict: 'MINOR LOSS — NXDOMAIN INFERRED',
  },
  scan: {
    stage: 'RECON',
    structure: 'HLL per source (decaying long window), LRU 50k',
    memory: '~75 MB fixed',
    reversePath: 'SYN-ACK, needed only for connection_success_ratio.',
    why: 'Fan-out is a source-side phenomenon. Distinct-destination and distinct-port cardinality, syn_only_ratio and payload_absence_ratio are all forward-observable. We lose which ports were open — not that a scan happened.',
    validity: 'MEASURED',
    verdict: 'FULLY FUNCTIONAL',
  },
  exfil: {
    stage: 'EXFIL',
    structure: 'ACK-Shadow estimator + per-host EWMA baselines',
    memory: 'bounded LRU',
    reversePath: 'Server→client byte volume, for down_up_ratio.',
    why: 'Requirement (f) asks for an inbound:outbound ratio on a link where inbound is invisible. Without ACK-Shadow this detector is dead. With it, Δ(max_ack_seen) reconstructs reverse volume from arithmetic on packets we do see.',
    validity: 'INFERRED',
    verdict: 'BLIND WITHOUT ACK-SHADOW',
  },
  malware: {
    stage: 'C2',
    structure: 'JA4 fingerprint table + 1-D CNN over first 20 packets',
    memory: 'small fixed',
    reversePath: 'JA3S/JA4S server hello, certificate chain, response record sizes.',
    why: 'The server fingerprint is genuinely gone and no arithmetic recovers it. Client JA4, SNI anomalies and the size/timing rhythm of the first 20 packets carry what remains. We declare this as a gap instead of hiding it.',
    validity: 'MISSING',
    verdict: 'DEGRADED — JA3S UNAVAILABLE, NO FIX',
  },
}

const EXFIL_ACK_RECOVERED = 0.83
const CONF_BINS = [
  { label: '≥ 0.90', lo: 0.90, hi: 1.01 },
  { label: '0.75 – 0.90', lo: 0.75, hi: 0.90 },
  { label: '0.60 – 0.75', lo: 0.60, hi: 0.75 },
  { label: '< 0.60', lo: 0, hi: 0.60 },
]

/** Resolve the score a detector achieves in the currently active capture mode. */
function resolveRow(row, diodeMode, ackShadow) {
  const full = row.fullScore
  const isExfil = row.threat === 'exfil'
  const diode = isExfil ? (ackShadow ? EXFIL_ACK_RECOVERED : 0) : row.diodeScore
  const rawDiode = isExfil ? null : row.diodeScore
  const active = diodeMode ? diode : full
  const delta = diodeMode ? diode - full : 0
  const blind = diodeMode && isExfil && !ackShadow
  const status = !diodeMode
    ? 'OPTIMAL'
    : blind ? 'BLIND'
      : isExfil ? 'RECOVERED'
        : Math.abs(delta) <= 0.015 ? 'UNAFFECTED'
          : delta > -0.06 ? 'MINOR LOSS'
            : 'DEGRADED'
  const color = status === 'BLIND' || status === 'DEGRADED' ? C.red
    : status === 'MINOR LOSS' ? C.amber
      : status === 'RECOVERED' ? C.violet
        : C.green
  return { full, diode, rawDiode, active, delta, blind, status, color, isExfil }
}

export default function ThreatsPage({ alerts = [], diodeMode = false, setDiodeMode, ackShadow = true, setAckShadow }) {
  const [diodeFlash, setDiodeFlash] = useState(false)
  const [amberFlash, setAmberFlash] = useState(false)
  const [shadowPulse, setShadowPulse] = useState(false)
  const [hoverRow, setHoverRow] = useState(null)
  const [hoverCard, setHoverCard] = useState(null)
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 350)
    return () => clearTimeout(t)
  }, [])

  // ── Dramatic capture-mode transition ─────────────────────────────────────
  const engageDiode = (next) => {
    if (next) {
      setDiodeFlash(true)
      setAmberFlash(true)
      setTimeout(() => setAmberFlash(false), 500)
      setTimeout(() => setDiodeFlash(false), 850)
    }
    setDiodeMode?.(next)
  }

  const engageShadow = (next) => {
    setShadowPulse(true)
    setTimeout(() => setShadowPulse(false), 700)
    setAckShadow?.(next)
  }

  const rows = useMemo(
    () => degradationData.map(r => ({ row: r, ...resolveRow(r, diodeMode, ackShadow) })),
    [diodeMode, ackShadow],
  )

  const meanActive = rows.reduce((s, r) => s + r.active, 0) / rows.length
  const meanFull = rows.reduce((s, r) => s + r.full, 0) / rows.length
  const blindSpots = rows.filter(r => r.active < 0.05).length
  const degraded = rows.filter(r => r.status === 'DEGRADED').length
  const recovered = rows.filter(r => r.status === 'RECOVERED').length
  const modeKey = `${diodeMode ? 'fwd' : 'both'}-${ackShadow ? 'ack' : 'raw'}`

  // ── Live threat-type breakdown from the alert stream ─────────────────────
  const breakdown = useMemo(() => {
    const now = Date.now()
    return Object.entries(THREAT_TYPES).map(([key, info]) => {
      const mine = alerts.filter(a => a.threat === key)
      const buckets = new Array(20).fill(0)
      mine.forEach(a => {
        const idx = 19 - Math.floor((now - a.timestamp) / 60000)
        if (idx >= 0 && idx < 20) buckets[idx] += 1
      })
      const confs = mine.map(a => Number(a.confidence) || 0)
      const meanConf = confs.length ? confs.reduce((s, v) => s + v, 0) / confs.length : 0
      const dist = CONF_BINS.map(b => ({
        ...b,
        n: confs.filter(v => v >= b.lo && v < b.hi).length,
      }))
      const worst = ['critical', 'high', 'medium', 'low', 'info']
        .find(s => mine.some(a => a.severity === s)) || 'info'
      const last = mine.reduce((m, a) => Math.max(m, a.timestamp), 0)
      return { key, info, count: mine.length, buckets, meanConf, dist, worst, last }
    }).sort((a, b) => b.count - a.count)
  }, [alerts])

  const maxBin = Math.max(1, ...breakdown.flatMap(b => b.dist.map(d => d.n)))

  const th = (text, align = 'left') => (
    <div style={{ padding: '0 10px 8px', textAlign: align }}><Label>{text}</Label></div>
  )

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Page-scoped keyframes. diodeFlash / amberFlashAnim mirror the names in
          App.jsx's global style block so the transition matches the dashboard. */}
      <style>{`
        @keyframes diodeFlash { 0% { opacity: 0; } 10% { opacity: 0.3; } 100% { opacity: 0; } }
        @keyframes amberFlashAnim { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes ekReconGlow {
          0%, 100% { filter: drop-shadow(0 0 3px rgba(168,85,247,0.4)); }
          50% { filter: drop-shadow(0 0 11px rgba(168,85,247,0.85)); }
        }
        @keyframes ekGhostDrift { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.42; } }
      `}</style>

      {/* Full-viewport dramatic flashes on diode engage */}
      {diodeFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(239,68,68,0.30), transparent 70%)',
          animation: 'diodeFlash 0.85s ease-out forwards',
        }} />
      )}
      {amberFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 59, pointerEvents: 'none',
          background: 'radial-gradient(circle at center, rgba(245,158,11,0.18), transparent 65%)',
          animation: 'amberFlashAnim 0.5s ease-out forwards',
        }} />
      )}

      {/* ══ 1 · CAPTURE-MODE CONTROL HEADER ══════════════════════════════ */}
      <Stagger delay={0}>
        <Card style={{
          padding: 22, overflow: 'hidden',
          background: diodeMode
            ? 'linear-gradient(135deg, rgba(239,68,68,0.07), rgba(17,24,39,0.75) 55%)'
            : 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(17,24,39,0.7) 55%)',
          borderColor: diodeMode ? 'rgba(239,68,68,0.35)' : C.border,
          transition: 'background 0.6s ease, border-color 0.6s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'stretch', gap: 22, flexWrap: 'wrap' }}>
            {/* Status readout */}
            <div style={{ flex: '1 1 340px', minWidth: 300 }}>
              <Label style={{ letterSpacing: 3 }}>Capture Mode</Label>
              <div key={modeKey} style={{
                fontFamily: DISPLAY, fontSize: 30, fontWeight: 800, letterSpacing: -0.8,
                color: diodeMode ? C.red : C.accent, margin: '8px 0 2px',
                textShadow: diodeMode ? '0 0 26px rgba(239,68,68,0.35)' : '0 0 26px rgba(0,212,255,0.3)',
                animation: 'fadeSlideUp 0.45s ease-out both',
              }}>
                {diodeMode ? 'DATA DIODE' : 'FULL DUPLEX'}
              </div>
              <p style={{
                fontFamily: MONO, fontSize: 12, color: diodeMode ? '#f87171' : C.textDim,
                margin: '0 0 14px', letterSpacing: 0.4,
              }}>
                {diodeMode ? 'forward path only — client → server' : 'bidirectional capture — both halves visible'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill color={diodeMode ? C.red : C.accent}>{diodeMode ? 'FWD ONLY' : 'BOTH DIRECTIONS'}</Pill>
                <Pill color={ackShadow ? C.violet : C.textMute}>ACK-SHADOW {ackShadow ? 'ON' : 'OFF'}</Pill>
                <Pill color={C.green}>EGRESS LOCKDOWN ACTIVE</Pill>
                <Pill color={C.textDim}>PAIRED CAPTURE EVAL</Pill>
              </div>
            </div>

            {/* The two hero toggles */}
            <div style={{
              flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 26,
              padding: '16px 24px', borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(10,14,23,0.92))',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Toggle on={diodeMode} onChange={engageDiode} color={C.red} width={96} height={40} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.4, fontFamily: MONO,
                  color: diodeMode ? C.red : C.textMute,
                  textShadow: diodeMode ? '0 0 12px rgba(239,68,68,0.4)' : 'none',
                }}>DIODE MODE</span>
              </div>
              <div style={{ width: 1, height: 58, background: C.border }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Toggle on={ackShadow} onChange={engageShadow} color={C.violet} width={96} height={40} />
                <span style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: 1.4, fontFamily: MONO,
                  color: ackShadow ? C.violet : C.textMute,
                  textShadow: ackShadow ? '0 0 12px rgba(168,85,247,0.4)' : 'none',
                }}>ACK-SHADOW</span>
              </div>
            </div>

            {/* Live mean-F1 readout */}
            <div style={{
              flex: '0 0 auto', minWidth: 180, padding: '16px 20px', borderRadius: 12,
              background: C.inset, border: `1px solid ${C.borderSoft}`,
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
            }}>
              <Label>Mean F1 · active mode</Label>
              <div key={modeKey} style={{
                fontFamily: MONO, fontSize: 34, fontWeight: 700, lineHeight: 1.1,
                color: blindSpots ? C.red : diodeMode ? C.amber : C.green, marginTop: 6,
              }}>
                <CountUp target={meanActive} decimals={3} duration={900} />
              </div>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textMute, marginTop: 4 }}>
                baseline {meanFull.toFixed(3)} · {blindSpots} blind
              </span>
            </div>
          </div>

          {/* Degradation warning strip */}
          {diodeMode && (
            <div style={{
              marginTop: 18, padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', gap: 12,
              animation: 'fadeSlideUp 0.45s ease-out both',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flexShrink: 0, color: C.red,
                background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{Icons.warning({ width: 15, height: 15 })}</div>
              <div style={{ minWidth: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, color: C.red }}>
                  PERFORMANCE DEGRADATION MEASURED — NOT ESTIMATED
                </span>
                <p style={{ fontSize: 11, color: '#f87171', margin: '3px 0 0', lineHeight: 1.5 }}>
                  Encrypted malware loses the JA3S server hello: {(0.86).toFixed(2)} → {(0.55).toFixed(2)} F1
                  ({((0.86 - 0.55) / 0.86 * 100).toFixed(0)}% relative loss), and no arithmetic recovers it.
                  {ackShadow
                    ? ` Exfiltration is rescued to ${EXFIL_ACK_RECOVERED.toFixed(2)} F1 by ACK-Shadow reconstruction.`
                    : ' Exfiltration is currently BLIND — enable ACK-Shadow to recover it.'}
                </p>
              </div>
            </div>
          )}
        </Card>
      </Stagger>

      {/* ══ 2 · DETECTOR × CAPTURE-MODE MATRIX ═══════════════════════════ */}
      <Stagger delay={0.08}>
        <Card style={{ padding: 20, overflow: 'hidden' }} scan>
          <CardHeader
            icon={Icons.layers}
            title="Detector × Capture-Mode Matrix"
            subtitle="F1 on paired captures — same traffic, same models, one half removed"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill color={!diodeMode ? C.accent : C.textFaint}>BOTH</Pill>
                <Pill color={diodeMode ? C.red : C.textFaint}>FWD</Pill>
                <Pill color={ackShadow ? C.violet : C.textFaint}>+ACK</Pill>
              </div>
            }
          />

          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.7fr 1fr 1fr 0.85fr 1.15fr 1.2fr',
            borderBottom: `1px solid ${C.border}`, marginBottom: 6,
          }}>
            {th('Detector')}
            {th('Full Duplex F1', 'right')}
            {th('Data Diode F1', 'right')}
            {th('Δ', 'right')}
            {th('Recovered w/ ACK-Shadow', 'right')}
            {th('Status', 'right')}
          </div>

          {/* Matrix rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {rows.map(({ row, full, rawDiode, active, delta, blind, status, color, isExfil }, idx) => {
              const hot = hoverRow === row.threat
              const info = THREAT_TYPES[row.threat]
              return (
                <div
                  key={row.threat}
                  onMouseEnter={() => setHoverRow(row.threat)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.7fr 1fr 1fr 0.85fr 1.15fr 1.2fr',
                    alignItems: 'center', borderRadius: 9, padding: '10px 0',
                    background: hot ? 'rgba(15,23,42,0.85)'
                      : status === 'BLIND' ? 'rgba(239,68,68,0.06)'
                        : status === 'DEGRADED' ? 'rgba(239,68,68,0.04)'
                          : status === 'MINOR LOSS' ? 'rgba(245,158,11,0.04)'
                            : status === 'RECOVERED' ? 'rgba(168,85,247,0.05)'
                              : 'rgba(15,23,42,0.4)',
                    border: `1px solid ${hot ? 'rgba(0,212,255,0.22)' : status === 'OPTIMAL' || status === 'UNAFFECTED' ? C.borderSoft : `${color}33`}`,
                    transition: 'background 0.25s ease, border-color 0.25s ease',
                    animation: `fadeSlideUp 0.4s ease-out ${0.05 * idx}s both`,
                  }}
                >
                  {/* Detector name + method */}
                  <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                    <span style={{ fontSize: 15 }}>{info?.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 650, color: C.text, whiteSpace: 'nowrap' }}>{row.label}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textFaint, marginTop: 2 }}>
                        {DETECTORS.find(d => d.id === row.threat)?.window} window
                      </div>
                    </div>
                  </div>

                  {/* Full duplex */}
                  <div style={{ padding: '0 10px' }}>
                    <div style={{ fontFamily: MONO, fontSize: 14, color: !diodeMode ? C.accent : C.textDim, textAlign: 'right' }}>
                      {full.toFixed(2)}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <Bar value={armed ? full : 0} color={!diodeMode ? C.accent : C.textFaint} height={4} delay={idx * 40} />
                    </div>
                  </div>

                  {/* Data diode (raw, pre-ACK-Shadow) */}
                  <div style={{ padding: '0 10px' }}>
                    <div style={{
                      fontFamily: MONO, fontSize: 14, textAlign: 'right',
                      color: isExfil ? C.red : rawDiode < 0.6 ? C.red : rawDiode < full ? C.amber : C.green,
                    }}>
                      {isExfil ? 'BLIND' : rawDiode.toFixed(2)}
                    </div>
                    <div style={{ marginTop: 5 }}>
                      <Bar
                        value={armed ? (isExfil ? 0 : rawDiode) : 0}
                        color={isExfil ? C.red : rawDiode < 0.6 ? C.red : rawDiode < full ? C.amber : C.green}
                        height={4} delay={idx * 40}
                      />
                    </div>
                  </div>

                  {/* Delta */}
                  <div style={{ padding: '0 10px', textAlign: 'right' }}>
                    <span style={{
                      fontFamily: MONO, fontSize: 12,
                      color: !diodeMode ? C.textFaint : Math.abs(delta) < 0.005 ? C.green : delta > -0.06 ? C.amber : C.red,
                    }}>
                      {!diodeMode ? '—' : blind ? '−0.89' : `${delta >= 0 ? '+' : '−'}${Math.abs(delta).toFixed(2)}`}
                    </span>
                  </div>

                  {/* Recovered with ACK-Shadow */}
                  <div style={{ padding: '0 10px', textAlign: 'right' }}>
                    {isExfil ? (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '4px 9px', borderRadius: 6,
                        background: ackShadow ? 'rgba(168,85,247,0.12)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${ackShadow ? 'rgba(168,85,247,0.4)' : 'rgba(239,68,68,0.35)'}`,
                        animation: shadowPulse ? 'ekReconGlow 0.7s ease-out' : undefined,
                      }}>
                        <span style={{ fontFamily: MONO, fontSize: 13, color: ackShadow ? C.violet : C.red }}>
                          {ackShadow
                            ? <CountUp key={modeKey} target={EXFIL_ACK_RECOVERED} decimals={2} duration={800} />
                            : '0.00'}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 8.5, color: ackShadow ? C.violet : C.red, letterSpacing: 1 }}>
                          {ackShadow ? 'INFERRED' : 'MISSING'}
                        </span>
                      </div>
                    ) : (
                      <span style={{ fontFamily: MONO, fontSize: 12, color: C.textFaint }}>n/a</span>
                    )}
                  </div>

                  {/* Status + active score */}
                  <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                    <span key={modeKey} style={{
                      fontFamily: MONO, fontSize: 13, fontWeight: 700, color,
                      animation: 'fadeSlideUp 0.4s ease-out both',
                    }}>
                      {active > 0 ? active.toFixed(2) : '—'}
                    </span>
                    <span style={{
                      padding: '3px 8px', borderRadius: 5, background: `${color}1a`,
                      border: `1px solid ${color}44`, color,
                      fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: 0.9, whiteSpace: 'nowrap',
                    }}>{status}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{ fontSize: 10.5, color: C.textMute, margin: '14px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>
            Encrypted-malware detection degrades under diode capture because JA3S (the server hello) becomes
            unavailable — declared as a gap, not patched over. ACK-Shadow recovers exfiltration volume from TCP
            acknowledgement arithmetic. All scores measured on paired captures of the same traffic.
          </p>
        </Card>
      </Stagger>

      {/* ══ 3 · PER-DETECTOR DOSSIERS ════════════════════════════════════ */}
      <Stagger delay={0.16}>
        <Card style={{ padding: 20 }}>
          <CardHeader
            icon={Icons.cpu}
            title="Detector Dossiers"
            subtitle="Six streaming specialists — algorithm, window, reverse-path dependency, degradation cause"
            right={<Pill color={C.accent}>NO MONOLITHIC CLASSIFIER</Pill>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 14 }}>
            {DETECTORS.map((det, idx) => {
              const r = rows.find(x => x.row.threat === det.threat)
              const d = DETECTOR_DETAIL[det.id]
              const info = THREAT_TYPES[det.threat]
              const hot = hoverCard === det.id
              const vColor = d.validity === 'MEASURED' ? C.green : d.validity === 'INFERRED' ? C.violet : C.red
              return (
                <div
                  key={det.id}
                  onMouseEnter={() => setHoverCard(det.id)}
                  onMouseLeave={() => setHoverCard(null)}
                  style={{
                    padding: 15, borderRadius: 12,
                    background: hot ? 'rgba(15,23,42,0.9)' : C.inset,
                    border: `1px solid ${hot ? 'rgba(0,212,255,0.28)' : C.borderSoft}`,
                    transform: hot ? 'translateY(-2px)' : 'translateY(0)',
                    boxShadow: hot ? '0 10px 28px rgba(0,0,0,0.45)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                    animation: `fadeSlideUp 0.4s ease-out ${0.04 * idx}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                      <span style={{ fontSize: 17 }}>{info?.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{det.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: info?.color, letterSpacing: 1, marginTop: 2 }}>
                          {info?.short} · {d.stage}
                        </div>
                      </div>
                    </div>
                    <span key={modeKey} style={{
                      fontFamily: MONO, fontSize: 17, fontWeight: 700, color: r.color,
                      animation: 'fadeSlideUp 0.4s ease-out both',
                    }}>{r.active > 0 ? r.active.toFixed(2) : 'BLIND'}</span>
                  </div>

                  <div style={{ margin: '12px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Bar value={armed ? r.active : 0} color={r.color} height={5} delay={idx * 50} />
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, width: 62, textAlign: 'right' }}>
                      of {r.full.toFixed(2)}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 10px',
                    padding: '10px 0', borderTop: `1px solid ${C.borderSoft}`, borderBottom: `1px solid ${C.borderSoft}`,
                  }}>
                    <Label>Method</Label>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>{det.method}</span>
                    <Label>Window</Label>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.accent }}>{det.window}</span>
                    <Label>State</Label>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, lineHeight: 1.4 }}>
                      {d.structure} <span style={{ color: C.textFaint }}>({d.memory})</span>
                    </span>
                    <Label>Rev. path</Label>
                    <span style={{ fontSize: 10.5, color: C.textDim, lineHeight: 1.45 }}>{d.reversePath}</span>
                  </div>

                  <p style={{ fontSize: 10.5, color: C.textMute, lineHeight: 1.6, margin: '10px 0 12px' }}>
                    {d.why}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Pill color={r.color} style={{ fontSize: 8.5 }}>{d.verdict}</Pill>
                    <Pill color={vColor} style={{ fontSize: 8.5 }}>
                      {diodeMode ? d.validity : 'MEASURED'}
                    </Pill>
                    {det.id === 'exfil' && <Pill color={C.violet} style={{ fontSize: 8.5 }}>ACK-SHADOW</Pill>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </Stagger>

      {/* ══ 4 · ACK-SHADOW RECONSTRUCTION DIAGRAM ════════════════════════ */}
      <Stagger delay={0.24}>
        <Card style={{ padding: 20, overflow: 'hidden' }}>
          <CardHeader
            icon={Icons.link}
            title="ACK-Shadow Reconstruction"
            subtitle="Recovering receiver-side byte counts from acknowledgement arithmetic on the visible half"
            right={
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill color={C.violet}>FLAGSHIP</Pill>
                <Pill color={ackShadow ? C.violet : C.red}>{ackShadow ? 'ENGAGED' : 'DISABLED'}</Pill>
              </div>
            }
          />

          <div style={{
            borderRadius: 12, padding: '8px 4px',
            background: 'linear-gradient(180deg, rgba(10,14,23,0.85), rgba(15,23,42,0.6))',
            border: `1px solid ${C.borderSoft}`,
          }}>
            <svg viewBox="0 0 940 352" width="100%" style={{ display: 'block', overflow: 'visible' }}>
              <defs>
                <linearGradient id="ek-fwd-rail" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
                  <stop offset="100%" stopColor={C.accent} stopOpacity="0.9" />
                </linearGradient>
                <marker id="ek-arrow-cy" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={C.accent} />
                </marker>
                <marker id="ek-arrow-rd" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={C.red} />
                </marker>
                <marker id="ek-arrow-vi" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M0,0 L10,5 L0,10 z" fill={C.violet} />
                </marker>
              </defs>

              {/* Endpoints */}
              <g fontFamily={MONO}>
                <rect x="8" y="96" width="74" height="52" rx="8" fill="rgba(0,212,255,0.08)" stroke="rgba(0,212,255,0.35)" />
                <text x="45" y="118" fill={C.accent} fontSize="10" textAnchor="middle">CLIENT</text>
                <text x="45" y="133" fill={C.textMute} fontSize="8.5" textAnchor="middle">10.2.4.9</text>
                <rect x="858" y="96" width="74" height="52" rx="8" fill="rgba(239,68,68,0.07)" stroke="rgba(239,68,68,0.3)" />
                <text x="895" y="118" fill={C.red} fontSize="10" textAnchor="middle">SERVER</text>
                <text x="895" y="133" fill={C.textMute} fontSize="8.5" textAnchor="middle">203.0.113.9</text>
              </g>

              {/* Diode boundary */}
              <line x1="470" y1="14" x2="470" y2="338" stroke={C.red} strokeWidth="1" strokeDasharray="3 6" opacity="0.35" />
              <text x="476" y="24" fill={C.red} fontSize="8.5" fontFamily={MONO} opacity="0.7">DIODE BOUNDARY</text>

              {/* ── Forward (observed) lane ─────────────────────────────── */}
              <text x="8" y="44" fill={C.accent} fontSize="9" fontFamily={MONO} letterSpacing="1.6">
                OBSERVED · CLIENT → SERVER · COPIED ACROSS THE DIODE
              </text>
              <line x1="90" y1="70" x2="850" y2="70" stroke="url(#ek-fwd-rail)" strokeWidth="2" markerEnd="url(#ek-arrow-cy)" />
              <circle r="4.5" fill={C.accent} opacity="0.95">
                <animateMotion dur="3.1s" repeatCount="indefinite" path="M90,70 H846" />
              </circle>
              <circle r="3" fill="#fff" opacity="0.5">
                <animateMotion dur="3.1s" begin="1.1s" repeatCount="indefinite" path="M90,70 H846" />
              </circle>

              {/* Forward packet chips carrying the ACK receipts */}
              {[
                { x: 104, seq: 'seq=1000', ack: 'ack=1', len: 'len=80' },
                { x: 324, seq: 'seq=1080', ack: 'ack=1461', len: 'len=0' },
                { x: 544, seq: 'seq=1080', ack: 'ack=5001000', len: 'len=0' },
                { x: 764, seq: 'seq=1080', ack: 'ack=5001000', len: 'FIN' },
              ].map((p, i) => (
                <g key={p.x} fontFamily={MONO}>
                  <rect x={p.x} y="86" width="152" height="52" rx="7"
                    fill="rgba(0,212,255,0.06)" stroke="rgba(0,212,255,0.28)" />
                  <text x={p.x + 10} y="102" fill={C.textDim} fontSize="9">{p.seq}</text>
                  <text x={p.x + 10} y="116" fill={C.accent} fontSize="10" fontWeight="700">
                    {p.ack}
                    <animate attributeName="opacity" values="0.55;1;0.55" dur="2.4s" begin={`${i * 0.35}s`} repeatCount="indefinite" />
                  </text>
                  <text x={p.x + 10} y="130" fill={C.textFaint} fontSize="8.5">{p.len}</text>
                  {i < 3 && (
                    <line x1={p.x + 76} y1="138" x2={p.x + 76} y2="196" stroke={C.textFaint} strokeWidth="1" strokeDasharray="2 4" opacity="0.5" />
                  )}
                </g>
              ))}

              {/* ── Δack arithmetic band ────────────────────────────────── */}
              <g fontFamily={MONO}>
                <rect x="104" y="196" width="592" height="44" rx="8"
                  fill={ackShadow ? 'rgba(168,85,247,0.08)' : 'rgba(100,116,139,0.06)'}
                  stroke={ackShadow ? 'rgba(168,85,247,0.45)' : 'rgba(71,85,105,0.5)'}
                  style={ackShadow ? { animation: 'ekReconGlow 3s ease-in-out infinite' } : undefined} />
                <text x="118" y="214" fill={ackShadow ? C.violet : C.textMute} fontSize="9" letterSpacing="1.2">
                  Δack = max_ack_seen − initial_ack
                </text>
                <text x="118" y="231" fill={ackShadow ? C.text : C.textFaint} fontSize="11">
                  5,001,000 − 1 = 5,000,999 B ≈ 4.77 MB reverse volume · wrap-counter + dup-ACK corrected
                </text>
                {ackShadow && (
                  <circle r="4" fill={C.violet}>
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M696,218 H790" />
                  </circle>
                )}
                <line x1="696" y1="218" x2="786" y2="218" stroke={ackShadow ? C.violet : C.textFaint}
                  strokeWidth="1.5" strokeDasharray={ackShadow ? '0' : '4 4'} markerEnd={`url(#${ackShadow ? 'ek-arrow-vi' : 'ek-arrow-rd'})`} />
              </g>

              {/* ── Unseen reverse lane ─────────────────────────────────── */}
              <text x="8" y="276" fill={C.red} fontSize="9" fontFamily={MONO} letterSpacing="1.6" opacity="0.85">
                UNSEEN · SERVER → CLIENT · NEVER CROSSES THE DIODE
              </text>
              <line x1="850" y1="296" x2="90" y2="296" stroke={C.red} strokeWidth="1.5"
                strokeDasharray="6 6" opacity="0.45" markerEnd="url(#ek-arrow-rd)" />
              <circle r="4" fill={C.red} opacity="0.35">
                <animateMotion dur="3.6s" repeatCount="indefinite" path="M846,296 H94" />
              </circle>
              {[
                { x: 180, t: '1,460 B we never saw' },
                { x: 400, t: '≈ 5 MB we never saw' },
                { x: 620, t: 'record sizes — lost' },
              ].map(g => (
                <g key={g.x} fontFamily={MONO} style={{ animation: 'ekGhostDrift 3.4s ease-in-out infinite' }}>
                  <rect x={g.x} y="310" width="178" height="26" rx="6"
                    fill="rgba(239,68,68,0.05)" stroke="rgba(239,68,68,0.25)" strokeDasharray="4 4" />
                  <text x={g.x + 89} y="327" fill="#f87171" fontSize="9" textAnchor="middle" opacity="0.85">{g.t}</text>
                </g>
              ))}

              {/* ── Reconstruction output ───────────────────────────────── */}
              <g fontFamily={MONO}>
                <rect x="790" y="180" width="146" height="120" rx="10"
                  fill={ackShadow ? 'rgba(168,85,247,0.1)' : 'rgba(239,68,68,0.08)'}
                  stroke={ackShadow ? 'rgba(168,85,247,0.5)' : 'rgba(239,68,68,0.4)'} />
                <text x="863" y="200" fill={ackShadow ? C.violet : C.red} fontSize="8.5" textAnchor="middle" letterSpacing="1.2">
                  {ackShadow ? 'RECONSTRUCTED' : 'UNRECOVERABLE'}
                </text>
                <text x="863" y="228" fill={ackShadow ? C.text : C.red} fontSize="17" textAnchor="middle" fontWeight="700">
                  {ackShadow ? '4.77 MB' : '—'}
                </text>
                <text x="863" y="244" fill={C.textMute} fontSize="8" textAnchor="middle">
                  {ackShadow ? 'download_bytes · INFERRED' : 'down_up_ratio · MISSING'}
                </text>
                <line x1="806" y1="256" x2="920" y2="256" stroke={C.borderSoft} strokeWidth="1" />
                <text x="863" y="273" fill={C.textMute} fontSize="8" textAnchor="middle" letterSpacing="1">EXFIL F1</text>
                <text x="863" y="292" fill={ackShadow ? C.violet : C.red} fontSize="18" textAnchor="middle" fontWeight="700">
                  {ackShadow ? EXFIL_ACK_RECOVERED.toFixed(2) : '0.00'}
                </text>
              </g>
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 14 }}>
            {[
              { k: 'Mechanism', v: 'TCP is a delivery-confirmation protocol. Every client packet carries "I have received everything up to byte N" — and that receipt travels in the direction we can see.' },
              { k: 'Corrections', v: '32-bit sequence wraparound via wrap counter; duplicate ACKs never double-counted; SACK blocks give finer granularity; zero-window probes excluded.' },
              { k: 'Bonus signals', v: 'reverse_pkts_est ≈ Δack / observed_MSS, plus an RTT proxy from ACK arrival timing relative to our own data packets.' },
              { k: 'Stated limit', v: 'TCP only. QUIC/UDP exfiltration under diode capture stays partially observable — reported in the matrix rather than hidden.' },
            ].map(b => (
              <div key={b.k} style={{
                padding: 12, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}`,
              }}>
                <Label style={{ color: C.violet }}>{b.k}</Label>
                <p style={{ fontSize: 10.5, color: C.textDim, lineHeight: 1.6, margin: '6px 0 0' }}>{b.v}</p>
              </div>
            ))}
          </div>
        </Card>
      </Stagger>

      {/* ══ 5 · LIVE THREAT-TYPE BREAKDOWN ═══════════════════════════════ */}
      <Stagger delay={0.32}>
        <Card style={{ padding: 20 }}>
          <CardHeader
            icon={Icons.activity}
            title="Live Threat-Type Breakdown"
            subtitle={`${fmtNum(alerts.length)} alerts in buffer · 20 × 60 s buckets · confidence distribution per class`}
            right={<Pill color={C.green}>STREAMING</Pill>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {breakdown.map((b, idx) => {
              const r = rows.find(x => x.row.threat === b.key)
              const suppressed = diodeMode && b.key === 'exfil' && !ackShadow
              const hot = hoverCard === `bd-${b.key}`
              return (
                <div
                  key={b.key}
                  onMouseEnter={() => setHoverCard(`bd-${b.key}`)}
                  onMouseLeave={() => setHoverCard(null)}
                  style={{
                    padding: 14, borderRadius: 12,
                    background: hot ? 'rgba(15,23,42,0.9)' : C.inset,
                    border: `1px solid ${suppressed ? 'rgba(239,68,68,0.35)' : hot ? 'rgba(0,212,255,0.25)' : C.borderSoft}`,
                    opacity: suppressed ? 0.72 : 1,
                    transition: 'all 0.25s ease',
                    animation: `fadeSlideUp 0.4s ease-out ${0.04 * idx}s both`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ fontSize: 15 }}>{b.info.icon}</span>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 650, color: C.text }}>{b.info.name}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: b.info.color, letterSpacing: 1.2, marginTop: 2 }}>
                          {b.info.short}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: suppressed ? C.red : b.info.color, lineHeight: 1 }}>
                        {suppressed ? '0' : <CountUp target={b.count} duration={900} />}
                      </div>
                      <span style={{ fontFamily: MONO, fontSize: 8.5, color: C.textFaint, letterSpacing: 1 }}>ALERTS</span>
                    </div>
                  </div>

                  <div style={{ margin: '12px 0 6px', height: 38 }}>
                    <Sparkline
                      data={suppressed ? b.buckets.map(() => 0.001) : b.buckets}
                      width={280} height={38}
                      color={suppressed ? C.red : b.info.color}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, color: C.textFaint }}>−20 min</span>
                    <span style={{ fontFamily: MONO, fontSize: 8.5, color: C.textFaint }}>now</span>
                  </div>

                  {/* Confidence distribution */}
                  <Label>Confidence distribution</Label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, margin: '8px 0 10px' }}>
                    {b.dist.map(d => (
                      <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textMute, width: 58 }}>{d.label}</span>
                        <Bar value={armed && !suppressed ? d.n : 0} max={maxBin} color={b.info.color} height={4} />
                        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textDim, width: 20, textAlign: 'right' }}>
                          {suppressed ? 0 : d.n}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    paddingTop: 10, borderTop: `1px solid ${C.borderSoft}`,
                  }}>
                    <Pill color={SEVERITY_COLOR[b.worst]} style={{ fontSize: 8.5 }}>PEAK {b.worst}</Pill>
                    <Pill color={r?.color || C.textDim} style={{ fontSize: 8.5 }}>
                      F1 {r ? (r.active > 0 ? r.active.toFixed(2) : '0.00') : '—'}
                    </Pill>
                    <span style={{ fontFamily: MONO, fontSize: 9, color: C.textMute, marginLeft: 'auto' }}>
                      {b.count ? `μ conf ${b.meanConf.toFixed(2)} · last ${fmtTime(b.last)}` : 'no activity'}
                    </span>
                  </div>
                  {suppressed && (
                    <p style={{ fontFamily: MONO, fontSize: 9.5, color: C.red, margin: '10px 0 0', lineHeight: 1.5 }}>
                      ⚠ stream suppressed — reverse volume unobservable without ACK-Shadow
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      </Stagger>

      {/* ══ 6 · COVERAGE SUMMARY FOOTER ══════════════════════════════════ */}
      <Stagger delay={0.4}>
        <Card style={{
          padding: 20,
          background: diodeMode
            ? 'linear-gradient(135deg, rgba(239,68,68,0.05), rgba(17,24,39,0.7))'
            : 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(17,24,39,0.7))',
          borderColor: diodeMode ? 'rgba(239,68,68,0.28)' : 'rgba(16,185,129,0.25)',
        }}>
          <CardHeader
            icon={Icons.shield}
            title="Coverage Summary"
            subtitle="Aggregate detection posture in the active capture mode"
            right={<Pill color={blindSpots ? C.red : C.green}>{blindSpots ? 'BLIND SPOT PRESENT' : 'ZERO SILENT FAILURES'}</Pill>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            {[
              { l: 'Mean F1 (active)', v: <CountUp key={modeKey} target={meanActive} decimals={3} duration={900} />, c: blindSpots ? C.red : diodeMode ? C.amber : C.green },
              { l: 'Mean F1 (baseline)', v: meanFull.toFixed(3), c: C.accent },
              { l: 'Blind spots', v: <CountUp key={modeKey} target={blindSpots} duration={600} />, c: blindSpots ? C.red : C.green },
              { l: 'Degraded detectors', v: <CountUp key={modeKey} target={degraded} duration={600} />, c: degraded ? C.amber : C.green },
              { l: 'ACK-Shadow rescues', v: <CountUp key={modeKey} target={recovered} duration={600} />, c: recovered ? C.violet : C.textMute },
              { l: 'Detectors online', v: `${rows.filter(r => r.active > 0).length}/6`, c: C.text },
            ].map(m => (
              <div key={m.l} style={{ padding: 14, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
                <Label>{m.l}</Label>
                <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: m.c, marginTop: 6, lineHeight: 1.1 }}>
                  {m.v}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 14, padding: '14px 16px', borderRadius: 10,
            background: 'rgba(15,23,42,0.6)', border: `1px solid ${C.borderSoft}`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: blindSpots ? C.red : diodeMode ? C.violet : C.green,
              background: blindSpots ? 'rgba(239,68,68,0.12)' : diodeMode ? 'rgba(168,85,247,0.12)' : 'rgba(16,185,129,0.12)',
            }}>{(blindSpots ? Icons.warning : Icons.check)({ width: 15, height: 15 })}</div>
            <div>
              <Label style={{ color: blindSpots ? C.red : diodeMode ? C.violet : C.green }}>Verdict</Label>
              <p style={{ fontSize: 12, color: C.textDim, lineHeight: 1.65, margin: '5px 0 0' }}>
                {!diodeMode && (
                  <>Bidirectional capture: all six detectors at full strength, mean F1 {meanFull.toFixed(3)}.
                  Flip <span style={{ color: C.red, fontFamily: MONO }}>DIODE MODE</span> to see what a real
                  one-way link costs us — measured on paired captures, not estimated.</>
                )}
                {diodeMode && !ackShadow && (
                  <>Diode capture with ACK-Shadow disabled: exfiltration detection is
                  <span style={{ color: C.red, fontFamily: MONO }}> BLIND</span> and encrypted malware has fallen to 0.55.
                  Mean F1 {meanActive.toFixed(3)}. This is what every bidirectional-by-default pipeline looks like on
                  NTRO's link — it does not error and it does not warn; it quietly stops finding anything.</>
                )}
                {diodeMode && ackShadow && (
                  <>Diode capture with ACK-Shadow engaged: mean F1 {meanActive.toFixed(3)} against a
                  {' '}{meanFull.toFixed(3)} bidirectional baseline. Four detectors unaffected or near-unaffected,
                  exfiltration recovered to {EXFIL_ACK_RECOVERED.toFixed(2)} from acknowledgement arithmetic, and encrypted
                  malware honestly declared at 0.55 because JA3S is gone and no trick brings it back.
                  <span style={{ color: C.green }}> Zero silent failures.</span></>
                )}
              </p>
            </div>
          </div>
        </Card>
      </Stagger>
    </div>
  )
}
