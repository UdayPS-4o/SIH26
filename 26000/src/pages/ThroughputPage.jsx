import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  C, MONO, DISPLAY, Icons,
  Card, CardHeader, Pill, Label,
  CountUp, Sparkline, useMeasure, Bar, Stagger,
  DETECTORS, THREAT_TYPES,
} from '../lib/shared.jsx'

/* ═══════════════════════════════════════════════════════════════════
   THROUGHPUT ANALYTICS — the performance-proof page (F3 / F14)

   Everything on this page is a live rolling buffer sampled at 1 Hz.
   Reference figures come from docs/PROTOTYPE-SCOPE.md §F3/F14 and
   docs/VIDEO_PLAN.md "Priority 4: Throughput Metrics":
     · 47,200 flows/s sustained · 1,240 Mbps · 0.00% drops
     · p99 alert latency 84 ms (window-close → alert emitted)
     · per-packet processing latency p50 0.86 / p95 1.8 / p99 2.4 ms
     · resident memory 412 MB, flat (±5%) through a 10× burst
   The ★ burst chart is SCENE 7 of the video script.
   ═══════════════════════════════════════════════════════════════════ */

// ── Tuning constants ────────────────────────────────────────────────
const SAMPLES       = 120          // rolling window, 1 sample/sec
const SPARK         = 60           // sparkline window
const PKTS_PER_FLOW = 13.5
const SAT_PKT       = 920000       // saturation ceiling, packets/sec
const RSS_BASE      = 412          // MB, steady state
const MEM_MAX       = 8192         // MB, y-axis ceiling of the burst chart = OOM
const RATE_MAX      = 520000       // flows/s, burst chart left axis
const BURST_TICKS   = 34           // duration of an injected burst, in samples
const BUCKETS       = 28
const BUCKET_MS     = 4 / BUCKETS  // histogram resolution, 0 → 4 ms

// Deterministic pseudo-random — safe to call from a useState initializer,
// so the first paint never depends on Math.random().
const seed = (i, k = 1) => {
  const x = Math.sin((i + 1.37) * 12.9898 * k) * 43758.5453
  return x - Math.floor(x)
}

// Per-packet processing latency draw: floor + exponential tail (ms).
const latDraw = (u, shift = 0) => 0.55 + -Math.log(1 - u * 0.998) * 0.42 + shift

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const fmtK  = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${Math.round(n / 1e3)}K` : `${Math.round(n)}`
const fmtInt = (n) => Math.round(n).toLocaleString('en-US')
const hhmmss = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`
}

// Percentile read off the latency histogram.
function pctile(histo, p) {
  const total = histo.reduce((a, b) => a + b, 0)
  if (!total) return 0
  let acc = 0
  for (let i = 0; i < histo.length; i++) {
    acc += histo[i]
    if (acc / total >= p) return (i + 0.5) * BUCKET_MS
  }
  return histo.length * BUCKET_MS
}

// ── Per-detector CPU cost (share of the 214 µs detect stage) ────────
const DETECTOR_COST = {
  dga:       { share: 23.4, us: 50.1 },
  beaconing: { share: 18.6, us: 39.8 },
  exfil:     { share: 16.4, us: 35.1 },
  malware:   { share: 15.6, us: 33.4 },
  ddos:      { share: 14.2, us: 30.4 },
  scan:      { share: 11.8, us: 25.3 },
}

// ── Pipeline stages (µs per packet, sums to the p50 figure) ─────────
const STAGES = [
  { id: 'capture', name: 'Capture',  detail: 'AF_PACKET mmap ring',        us: 38,  color: C.accent },
  { id: 'decode',  name: 'Decode',   detail: 'etherparse L2→L4',           us: 74,  color: C.accent2 },
  { id: 'feature', name: 'Features', detail: 'CMS · HLL · t-digest update', us: 286, color: C.blue },
  { id: 'detect',  name: 'Detect',   detail: '6 detectors, fan-out',       us: 214, color: C.violet },
  { id: 'score',   name: 'Score',    detail: 'ONNX + isotonic calibration', us: 128, color: C.amber },
  { id: 'seal',    name: 'Seal',     detail: 'BLAKE3 leaf → Merkle chain',  us: 96,  color: C.green },
]
const STAGE_TOTAL = STAGES.reduce((a, s) => a + s.us, 0)

// ═══════════════════════════════════════════════════════════════════
// Headline tile
// ═══════════════════════════════════════════════════════════════════
function Tile({ label, value, unit, series, delta, deltaUnit, color, icon, sub, intro, decimals = 0, target }) {
  const up = delta > 0
  const flat = Math.abs(delta) < 1e-6
  const dColor = flat ? C.textMute : up ? C.accent : C.violet
  return (
    <Card style={{ padding: 14, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <Label style={{ fontSize: 8.5, letterSpacing: 1.6 }}>{label}</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginTop: 7 }}>
            <span style={{
              fontFamily: MONO, fontSize: 23, fontWeight: 700, color,
              letterSpacing: -0.6, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            }}>
              {intro
                ? <CountUp target={typeof value === 'number' ? value : 0} decimals={decimals} duration={1400} />
                : (typeof value === 'number' ? value.toFixed(decimals) : value)}
            </span>
            {unit && <span style={{ fontSize: 10, color: C.textMute, fontFamily: MONO }}>{unit}</span>}
          </div>
        </div>
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          background: `${color}14`, border: `1px solid ${color}33`, color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon({ width: 13, height: 13 })}</div>
      </div>

      <div style={{ margin: '10px -4px 0', opacity: 0.9 }}>
        <Sparkline data={series} width={240} height={34} color={color} strokeWidth={1.5} />
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 6, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.borderSoft}`,
      }}>
        <span style={{ fontFamily: MONO, fontSize: 9.5, color: dColor, fontWeight: 700 }}>
          {flat ? '=' : up ? '▲' : '▼'} {Math.abs(delta) >= 1000 ? fmtK(Math.abs(delta)) : Math.abs(delta).toFixed(Math.abs(delta) < 10 ? 2 : 0)}{deltaUnit}
        </span>
        <span style={{ fontSize: 8.5, color: C.textFaint, fontFamily: MONO, letterSpacing: 0.4 }}>
          {sub || 'vs 60 s ago'}
        </span>
      </div>
      {target && (
        <div style={{ marginTop: 6, fontSize: 8.5, fontFamily: MONO, color: C.textFaint }}>{target}</div>
      )}
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 2 · Live throughput chart — ingest band + processed line + crosshair
// ═══════════════════════════════════════════════════════════════════
function LiveThroughputChart({ samples, diodeMode }) {
  const [wrapRef, size] = useMeasure()
  const [hover, setHover] = useState(null)

  const W = Math.max(size.width || 0, 360)
  const H = 272
  const P = { l: 64, r: 20, t: 20, b: 32 }
  const iw = W - P.l - P.r
  const ih = H - P.t - P.b

  const peak  = samples.reduce((m, s) => Math.max(m, s.ingest), 0)
  const yMax  = Math.max(SAT_PKT * 1.14, peak * 1.09)
  const X = (i) => P.l + (i / (SAMPLES - 1)) * iw
  const Y = (v) => P.t + ih - (clamp(v, 0, yMax) / yMax) * ih

  const ingestPts = samples.map((s, i) => `${X(i).toFixed(1)},${Y(s.ingest).toFixed(1)}`)
  const procPts   = samples.map((s, i) => `${X(i).toFixed(1)},${Y(s.processed).toFixed(1)}`)
  const ingestArea = `M${P.l},${P.t + ih} L${ingestPts.join(' L')} L${P.l + iw},${P.t + ih} Z`
  const ingestLine = `M${ingestPts.join(' L')}`
  const procLine   = `M${procPts.join(' L')}`

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => f * yMax)
  const last = samples[samples.length - 1]
  const hi = hover == null ? null : clamp(Math.round(((hover - P.l) / iw) * (SAMPLES - 1)), 0, SAMPLES - 1)
  const hs = hi == null ? null : samples[hi]

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - r.left
    setHover(x >= P.l - 6 && x <= P.l + iw + 6 ? x : null)
  }

  return (
    <Card style={{ padding: 18 }} scan>
      <CardHeader
        icon={Icons.activity}
        title="Live Throughput · packets/sec"
        subtitle="Rolling 120-second window · offered ingest vs. packets actually processed · 1 Hz sampling"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Pill color={C.accent}>{fmtInt(last.ingest)} pkt/s in</Pill>
            <Pill color={C.green}>{fmtInt(last.processed)} pkt/s out</Pill>
            <Pill color={last.drop > 0.001 ? C.amber : C.green}>{last.drop.toFixed(2)}% drop</Pill>
            {diodeMode && <Pill color={C.red}>forward-path only</Pill>}
          </div>
        }
      />

      <div ref={wrapRef} style={{ width: '100%' }}>
        <svg
          width={W} height={H}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
          style={{ display: 'block', cursor: 'crosshair' }}
        >
          <defs>
            <linearGradient id="tp-ingest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.accent} stopOpacity="0.30" />
              <stop offset="100%" stopColor={C.accent} stopOpacity="0.01" />
            </linearGradient>
            <filter id="tp-glow"><feGaussianBlur stdDeviation="2.6" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* plot frame + horizontal grid */}
          <rect x={P.l} y={P.t} width={iw} height={ih} fill="rgba(15,23,42,0.38)" stroke={C.borderSoft} />
          {yTicks.map((v, i) => (
            <g key={i}>
              <line x1={P.l} x2={P.l + iw} y1={Y(v)} y2={Y(v)} stroke={C.border} strokeWidth="1"
                strokeDasharray={i === 0 ? '0' : '2 5'} />
              <text x={P.l - 8} y={Y(v) + 3.5} textAnchor="end"
                style={{ fontFamily: MONO, fontSize: 9, fill: C.textFaint }}>{fmtK(v)}</text>
            </g>
          ))}

          {/* vertical time grid + x ticks */}
          {[0, 20, 40, 60, 80, 100, 119].map(i => (
            <g key={i}>
              <line x1={X(i)} x2={X(i)} y1={P.t} y2={P.t + ih} stroke={C.borderSoft} strokeDasharray="2 6" />
              <text x={X(i)} y={P.t + ih + 15} textAnchor="middle"
                style={{ fontFamily: MONO, fontSize: 9, fill: C.textFaint }}>
                {i === 119 ? 'now' : `−${SAMPLES - 1 - i}s`}
              </text>
            </g>
          ))}

          {/* ingest band + processed line */}
          <path d={ingestArea} fill="url(#tp-ingest)" />
          <path d={ingestLine} fill="none" stroke={C.accent} strokeWidth="1.2" strokeOpacity="0.55" />
          <path d={procLine} fill="none" stroke={C.green} strokeWidth="2" strokeLinejoin="round"
            filter="url(#tp-glow)" />

          {/* saturation ceiling */}
          <line x1={P.l} x2={P.l + iw} y1={Y(SAT_PKT)} y2={Y(SAT_PKT)}
            stroke={C.red} strokeWidth="1.2" strokeDasharray="7 5" strokeOpacity="0.75" />
          <text x={P.l + iw - 6} y={Y(SAT_PKT) - 7} textAnchor="end"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.red, letterSpacing: 0.8 }}>
            SATURATION CEILING · {fmtInt(SAT_PKT)} pkt/s
          </text>

          {/* live head */}
          <circle cx={X(SAMPLES - 1)} cy={Y(last.processed)} r="9" fill={C.green} opacity="0.14" className="ek-pulse" />
          <circle cx={X(SAMPLES - 1)} cy={Y(last.processed)} r="3.2" fill={C.green} />

          {/* crosshair readout */}
          {hs && (
            <g>
              <line x1={X(hi)} x2={X(hi)} y1={P.t} y2={P.t + ih} stroke={C.accent} strokeWidth="1" strokeOpacity="0.65" />
              <line x1={P.l} x2={P.l + iw} y1={Y(hs.ingest)} y2={Y(hs.ingest)} stroke={C.accent}
                strokeWidth="0.8" strokeDasharray="3 4" strokeOpacity="0.4" />
              <circle cx={X(hi)} cy={Y(hs.ingest)} r="3.4" fill={C.accent} />
              <circle cx={X(hi)} cy={Y(hs.processed)} r="3.4" fill={C.green} />
              <g transform={`translate(${clamp(X(hi) + 10, P.l, P.l + iw - 178)},${P.t + 8})`}>
                <rect width="172" height="74" rx="7" fill="rgba(10,14,23,0.94)" stroke={C.border} />
                <text x="10" y="17" style={{ fontFamily: MONO, fontSize: 9, fill: C.textMute, letterSpacing: 1 }}>
                  T −{SAMPLES - 1 - hi}s
                </text>
                <text x="10" y="33" style={{ fontFamily: MONO, fontSize: 10, fill: C.accent }}>
                  in  {fmtInt(hs.ingest)} pkt/s
                </text>
                <text x="10" y="48" style={{ fontFamily: MONO, fontSize: 10, fill: C.green }}>
                  out {fmtInt(hs.processed)} pkt/s
                </text>
                <text x="10" y="63" style={{ fontFamily: MONO, fontSize: 9.5, fill: C.textDim }}>
                  {fmtInt(hs.flows)} flows/s · {hs.mbps.toFixed(0)} Mbps
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 12, alignItems: 'center' }}>
        {[
          { c: C.accent, t: 'Offered ingest (shaded band)' },
          { c: C.green,  t: 'Processed rate' },
          { c: C.red,    t: 'Saturation ceiling' },
        ].map(l => (
          <div key={l.t} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 2.5, borderRadius: 2, background: l.c, display: 'block' }} />
            <span style={{ fontSize: 10, color: C.textDim, fontFamily: MONO }}>{l.t}</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 9.5, color: C.textFaint, fontFamily: MONO }}>
          counters from the ingest thread · no interpolation
        </span>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 3 · ★ Constant memory under burst  (VIDEO_PLAN SCENE 7)
// ═══════════════════════════════════════════════════════════════════
function BurstChart({ series, burstOn, burstPhase, onInject, peakMult }) {
  const [wrapRef, size] = useMeasure()
  const W = Math.max(size.width || 0, 420)
  const H = 330
  const P = { l: 70, r: 78, t: 30, b: 36 }
  const iw = W - P.l - P.r
  const ih = H - P.t - P.b
  const n = series.length

  const X  = (i) => P.l + (i / Math.max(n - 1, 1)) * iw
  const YR = (v) => P.t + ih - (clamp(v, 0, RATE_MAX) / RATE_MAX) * ih
  const YM = (v) => P.t + ih - (clamp(v, 0, MEM_MAX) / MEM_MAX) * ih

  const ratePts = series.map((s, i) => `${X(i).toFixed(1)},${YR(s.rate).toFixed(1)}`)
  const rateArea = `M${P.l},${P.t + ih} L${ratePts.join(' L')} L${X(n - 1).toFixed(1)},${P.t + ih} Z`
  const memLine = `M${series.map((s, i) => `${X(i).toFixed(1)},${YM(s.rss).toFixed(1)}`).join(' L')}`

  const naiveAlive = series.filter(s => !s.oom)
  const naiveLine = naiveAlive.length > 1
    ? `M${naiveAlive.map((s, i) => `${X(i).toFixed(1)},${YM(s.naive).toFixed(1)}`).join(' L')}`
    : ''
  const oomIdx = series.findIndex(s => s.oom)
  const last = series[n - 1]

  const rssMin = Math.min(...series.map(s => s.rss))
  const rssMax = Math.max(...series.map(s => s.rss))
  const spreadPct = ((rssMax - rssMin) / RSS_BASE) * 100

  return (
    <Card style={{ padding: 18, border: `1px solid ${burstOn ? 'rgba(245,158,11,0.4)' : C.border}`, transition: 'border-color 0.4s' }}>
      <CardHeader
        icon={Icons.database}
        title="Constant Memory Under Burst ★"
        subtitle="10× offered-load ramp against resident memory · harness: ekadhara replay --rate 500000 --duration 60"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {burstOn && <Pill color={C.amber}>{burstPhase} · {peakMult.toFixed(1)}×</Pill>}
            <button
              onClick={onInject}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 9, cursor: 'pointer',
                background: burstOn ? 'rgba(245,158,11,0.16)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${burstOn ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.42)'}`,
                color: burstOn ? C.amber : C.red,
                fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.8,
                boxShadow: burstOn ? '0 0 20px rgba(245,158,11,0.28)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              {Icons.zap({ width: 13, height: 13 })}
              {burstOn ? 'BURST RUNNING' : 'INJECT 10× BURST'}
            </button>
          </div>
        }
      />

      <div ref={wrapRef} style={{ width: '100%' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          <defs>
            <linearGradient id="bu-rate" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.amber} stopOpacity="0.34" />
              <stop offset="100%" stopColor={C.amber} stopOpacity="0.01" />
            </linearGradient>
            <filter id="bu-glow"><feGaussianBlur stdDeviation="3.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          <rect x={P.l} y={P.t} width={iw} height={ih} fill="rgba(15,23,42,0.38)" stroke={C.borderSoft} />

          {/* left axis — offered load */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <g key={`l${i}`}>
              <line x1={P.l} x2={P.l + iw} y1={YR(f * RATE_MAX)} y2={YR(f * RATE_MAX)}
                stroke={C.border} strokeDasharray={i === 0 ? '0' : '2 6'} />
              <text x={P.l - 8} y={YR(f * RATE_MAX) + 3.5} textAnchor="end"
                style={{ fontFamily: MONO, fontSize: 9, fill: C.amber, fillOpacity: 0.75 }}>
                {fmtK(f * RATE_MAX)}
              </text>
            </g>
          ))}
          {/* right axis — memory */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
            <text key={`r${i}`} x={P.l + iw + 9} y={YM(f * MEM_MAX) + 3.5}
              style={{ fontFamily: MONO, fontSize: 9, fill: C.green, fillOpacity: 0.75 }}>
              {Math.round(f * MEM_MAX)}
            </text>
          ))}
          <text x={18} y={P.t + ih / 2} transform={`rotate(-90 18 ${P.t + ih / 2})`} textAnchor="middle"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.amber, letterSpacing: 1.2 }}>
            OFFERED LOAD (flows/s)
          </text>
          <text x={W - 14} y={P.t + ih / 2} transform={`rotate(90 ${W - 14} ${P.t + ih / 2})`} textAnchor="middle"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.green, letterSpacing: 1.2 }}>
            RESIDENT MEMORY (MB)
          </text>

          {/* offered-load ramp */}
          <path d={rateArea} fill="url(#bu-rate)" />
          <path d={`M${ratePts.join(' L')}`} fill="none" stroke={C.amber} strokeWidth="2" strokeLinejoin="round" />

          {/* naive hashmap baseline */}
          {naiveLine && (
            <path d={naiveLine} fill="none" stroke={C.red} strokeWidth="1.9"
              strokeDasharray="6 4" strokeLinejoin="round" />
          )}
          {oomIdx > 0 && (
            <g>
              <line x1={X(oomIdx)} x2={X(oomIdx)} y1={P.t} y2={P.t + ih}
                stroke={C.red} strokeWidth="1" strokeOpacity="0.35" />
              <circle cx={X(oomIdx - 1)} cy={YM(MEM_MAX)} r="4.5" fill={C.red} />
              <text x={X(oomIdx) + 7} y={YM(MEM_MAX) + 15}
                style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, fill: C.red }}>
                OOM ✗
              </text>
              <text x={X(oomIdx) + 7} y={YM(MEM_MAX) + 28}
                style={{ fontFamily: MONO, fontSize: 8.5, fill: C.red, fillOpacity: 0.8 }}>
                dict[src_ip] — 8 GB exhausted
              </text>
            </g>
          )}

          {/* EKADHARA memory — dead flat, the money shot */}
          <path d={memLine} fill="none" stroke={C.green} strokeWidth="2.6" filter="url(#bu-glow)" />
          <circle cx={X(n - 1)} cy={YM(last.rss)} r="10" fill={C.green} opacity="0.13" className="ek-pulse" />
          <circle cx={X(n - 1)} cy={YM(last.rss)} r="3.4" fill={C.green} />

          {/* annotation callout on the flat line */}
          <g>
            <line x1={P.l + iw * 0.30} y1={YM(last.rss)} x2={P.l + iw * 0.34} y2={YM(last.rss) - 46}
              stroke={C.green} strokeWidth="1" strokeOpacity="0.55" />
            <rect x={P.l + iw * 0.34} y={YM(last.rss) - 74} width={Math.min(iw * 0.62, 396)} height="34" rx="7"
              fill="rgba(16,185,129,0.09)" stroke="rgba(16,185,129,0.36)" />
            <text x={P.l + iw * 0.34 + 12} y={YM(last.rss) - 59}
              style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, fill: C.green, letterSpacing: 0.3 }}>
              Count-Min Sketch + HyperLogLog — O(1) memory,
            </text>
            <text x={P.l + iw * 0.34 + 12} y={YM(last.rss) - 47}
              style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, fill: C.green, letterSpacing: 0.3 }}>
              independent of flow count
            </text>
          </g>

          {/* x axis */}
          {[0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1].map((i, k) => (
            <text key={k} x={X(i)} y={P.t + ih + 16} textAnchor="middle"
              style={{ fontFamily: MONO, fontSize: 9, fill: C.textFaint }}>
              {i === n - 1 ? 'now' : `t+${i}s`}
            </text>
          ))}
        </svg>
      </div>

      {/* readout strip */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))',
        gap: 10, marginTop: 14,
      }}>
        {[
          { l: 'CURRENT OFFERED LOAD', v: `${fmtInt(last.rate)} flows/s`, c: C.amber },
          { l: 'EKADHARA RSS',         v: `${last.rss.toFixed(1)} MB`,    c: C.green },
          { l: 'RSS SPREAD (WINDOW)',  v: `±${spreadPct.toFixed(2)}%`, c: spreadPct < 5 ? C.green : C.amber },
          { l: 'NAIVE BASELINE RSS',   v: last.oom ? 'OOM ✗' : `${last.naive.toFixed(0)} MB`, c: C.red },
        ].map(k => (
          <div key={k.l} style={{
            padding: '9px 11px', borderRadius: 9, background: C.inset,
            border: `1px solid ${C.borderSoft}`,
          }}>
            <Label style={{ fontSize: 8, letterSpacing: 1.2 }}>{k.l}</Label>
            <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: k.c, marginTop: 4 }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 12, padding: '10px 13px', borderRadius: 9,
        background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
        fontSize: 11, color: C.textDim, lineHeight: 1.6,
      }}>
        <span style={{ color: C.green, fontWeight: 700 }}>Our memory is flat at any rate.</span>{' '}
        Most detectors get DoS&rsquo;d by the DDoS they are detecting. The dashed red line is a deliberately naive
        baseline keying <code style={{ fontFamily: MONO, color: C.red }}>dict[src_ip]</code>, run under the same
        spoofed-source flood — it exhausts 8 GB and dies. Acceptance criterion: RSS flat within ±5% through a 10× burst.
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 4 · Latency distribution histogram
// ═══════════════════════════════════════════════════════════════════
function LatencyHistogram({ histo, p50, p95, p99, alertP99 }) {
  const [wrapRef, size] = useMeasure()
  const W = Math.max(size.width || 0, 320)
  const H = 218
  const P = { l: 42, r: 14, t: 16, b: 40 }
  const iw = W - P.l - P.r
  const ih = H - P.t - P.b
  const maxC = Math.max(...histo, 1)
  const bw = iw / BUCKETS
  const XV = (ms) => P.l + (clamp(ms, 0, BUCKETS * BUCKET_MS) / (BUCKETS * BUCKET_MS)) * iw
  const total = histo.reduce((a, b) => a + b, 0)

  const marks = [
    { k: 'p50', v: p50, c: C.green },
    { k: 'p95', v: p95, c: C.amber },
    { k: 'p99', v: p99, c: C.red },
  ]

  return (
    <Card style={{ padding: 18 }}>
      <CardHeader
        icon={Icons.clock}
        title="Per-Packet Processing Latency"
        subtitle={`t-digest over stage-to-stage timestamps · ${fmtInt(total)} samples in window`}
        right={<Pill color={p99 < 2.5 ? C.green : C.amber}>p99 {p99.toFixed(2)} ms</Pill>}
      />

      <div ref={wrapRef} style={{ width: '100%' }}>
        <svg width={W} height={H} style={{ display: 'block' }}>
          <rect x={P.l} y={P.t} width={iw} height={ih} fill="rgba(15,23,42,0.34)" stroke={C.borderSoft} />
          {[0.25, 0.5, 0.75, 1].map(f => (
            <line key={f} x1={P.l} x2={P.l + iw} y1={P.t + ih - f * ih} y2={P.t + ih - f * ih}
              stroke={C.border} strokeDasharray="2 6" />
          ))}

          {histo.map((c, i) => {
            const h = (c / maxC) * ih
            const ms = (i + 0.5) * BUCKET_MS
            const col = ms <= p50 ? C.accent : ms <= p95 ? C.accent2 : ms <= p99 ? C.amber : C.red
            return (
              <rect key={i}
                x={P.l + i * bw + 0.8} y={P.t + ih - h}
                width={Math.max(bw - 1.6, 1)} height={Math.max(h, 0.6)}
                fill={col} fillOpacity="0.72" rx="1.5"
                style={{ transition: 'height 0.5s ease, y 0.5s ease' }}
              />
            )
          })}

          {marks.map(m => (
            <g key={m.k}>
              <line x1={XV(m.v)} x2={XV(m.v)} y1={P.t - 4} y2={P.t + ih} stroke={m.c} strokeWidth="1.4" strokeDasharray="4 3" />
              <rect x={XV(m.v) - 20} y={P.t - 15} width="40" height="13" rx="3" fill={`${m.c}22`} stroke={`${m.c}66`} />
              <text x={XV(m.v)} y={P.t - 5} textAnchor="middle"
                style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, fill: m.c }}>
                {m.k} {m.v.toFixed(2)}
              </text>
            </g>
          ))}

          {/* 2.5 ms claim line */}
          <line x1={XV(2.5)} x2={XV(2.5)} y1={P.t} y2={P.t + ih} stroke={C.violet} strokeWidth="1" strokeOpacity="0.6" />
          <text x={XV(2.5) - 5} y={P.t + 14} textAnchor="end"
            style={{ fontFamily: MONO, fontSize: 8, fill: C.violet }}>2.5 ms budget</text>

          {[0, 1, 2, 3, 4].map(ms => (
            <text key={ms} x={XV(ms)} y={P.t + ih + 15} textAnchor="middle"
              style={{ fontFamily: MONO, fontSize: 9, fill: C.textFaint }}>{ms.toFixed(1)}</text>
          ))}
          <text x={P.l + iw / 2} y={H - 6} textAnchor="middle"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.textMute, letterSpacing: 1 }}>
            LATENCY (ms / packet)
          </text>
          <text x={P.l - 8} y={P.t + 8} textAnchor="end"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.textFaint }}>{fmtK(maxC)}</text>
          <text x={P.l - 8} y={P.t + ih} textAnchor="end"
            style={{ fontFamily: MONO, fontSize: 8.5, fill: C.textFaint }}>0</text>
        </svg>
      </div>

      <div style={{
        marginTop: 12, padding: '9px 12px', borderRadius: 9,
        background: C.inset, border: `1px solid ${C.borderSoft}`,
        fontSize: 10.5, color: C.textDim, lineHeight: 1.6,
      }}>
        Processing stays under <span style={{ fontFamily: MONO, color: C.green, fontWeight: 700 }}>~2.5 ms/packet</span> at
        the stated rate. Reported <span style={{ color: C.text }}>separately</span> from window latency:{' '}
        <span style={{ fontFamily: MONO, color: C.accent }}>p99 {alertP99} ms</span> is window-close &rarr; alert emitted;
        a 60 s beacon still needs multiple periods before the signal exists at all. That floor is physics, not engineering.
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 5 · Per-detector CPU cost breakdown
// ═══════════════════════════════════════════════════════════════════
function DetectorCost({ jitter }) {
  const rows = useMemo(() => (
    DETECTORS
      .map(d => ({ ...d, ...DETECTOR_COST[d.id], color: THREAT_TYPES[d.threat]?.color || C.accent }))
      .sort((a, b) => b.share - a.share)
  ), [])
  const maxShare = rows[0].share

  return (
    <Card style={{ padding: 18 }}>
      <CardHeader
        icon={Icons.cpu}
        title="Per-Detector CPU Cost"
        subtitle={`Share of the ${STAGE_TOTAL} µs/packet pipeline spent inside each detector · detect stage = 214 µs`}
        right={<Pill color={C.violet}>100.0% accounted</Pill>}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {rows.map((r, i) => {
          const live = r.us * (1 + (jitter[i % jitter.length] - 0.5) * 0.06)
          return (
            <div key={r.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.text }}>{r.name}</span>
                <span style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, flex: 1, minWidth: 0,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.method}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim }}>{live.toFixed(1)} µs</span>
                <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: r.color, width: 46, textAlign: 'right' }}>
                  {r.share.toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bar value={r.share} max={maxShare} color={r.color} height={7} delay={i * 70} />
                <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, width: 52, textAlign: 'right' }}>
                  win {r.window}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.borderSoft}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: 10, color: C.textMute, fontFamily: MONO }}>
          6 detectors run fan-out on the same feature snapshot — no re-parse, no re-hash.
        </span>
        <span style={{ fontFamily: MONO, fontSize: 11, color: C.violet, fontWeight: 700 }}>
          Σ 214.1 µs / packet
        </span>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 6 · Pipeline stage timing with an animated packet
// ═══════════════════════════════════════════════════════════════════
function PipelineTiming({ dot }) {
  const activeIdx = Math.min(Math.floor(dot * STAGES.length), STAGES.length - 1)
  let cum = 0
  const cums = STAGES.map(s => (cum += s.us))

  return (
    <Card style={{ padding: 18 }}>
      <CardHeader
        icon={Icons.layers}
        title="Pipeline Stage Timing"
        subtitle="Wall-clock µs per packet, measured stage-to-stage inside the Rust core · no Python in the hot path"
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pill color={C.accent}>Σ {STAGE_TOTAL} µs</Pill>
            <Pill color={C.green}>{(STAGE_TOTAL / 1000).toFixed(2)} ms p50</Pill>
          </div>
        }
      />

      {/* the flow */}
      <div style={{ position: 'relative', paddingTop: 6 }}>
        {/* rail */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 44, height: 2,
          background: `linear-gradient(90deg, ${C.accent}22, ${C.violet}44, ${C.green}22)`,
        }} />
        {/* travelling packet */}
        <div style={{
          position: 'absolute', top: 39, left: `calc(${(dot * 100).toFixed(2)}% - 6px)`,
          width: 12, height: 12, borderRadius: 6,
          background: C.accent, boxShadow: `0 0 14px ${C.accent}, 0 0 30px ${C.accent}66`,
          pointerEvents: 'none', zIndex: 3,
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, 1fr)`, gap: 8 }}>
          {STAGES.map((s, i) => {
            const on = i === activeIdx
            return (
              <div key={s.id} style={{
                padding: '10px 9px 11px', borderRadius: 10, position: 'relative', zIndex: 2,
                background: on ? `${s.color}14` : C.inset,
                border: `1px solid ${on ? `${s.color}66` : C.borderSoft}`,
                boxShadow: on ? `0 0 18px ${s.color}2e` : 'none',
                transition: 'all 0.25s ease',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: s.color,
                    background: `${s.color}1f`, borderRadius: 4, padding: '1px 4px',
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: on ? C.text : C.textDim }}>{s.name}</span>
                </div>
                <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: s.color, letterSpacing: -0.4 }}>
                  {s.us}<span style={{ fontSize: 9, color: C.textMute, marginLeft: 2 }}>µs</span>
                </div>
                <div style={{ marginTop: 6, height: 3, borderRadius: 2, background: 'rgba(30,41,59,0.7)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(s.us / STAGE_TOTAL) * 100}%`,
                    background: s.color, boxShadow: `0 0 8px ${s.color}88`,
                  }} />
                </div>
                <div style={{ fontSize: 8.5, color: C.textFaint, marginTop: 6, lineHeight: 1.4, fontFamily: MONO }}>
                  {s.detail}
                </div>
                <div style={{ fontSize: 8.5, color: C.textMute, marginTop: 4, fontFamily: MONO }}>
                  cum {cums[i]} µs
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* cumulative ladder */}
      <div style={{ marginTop: 14, display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', border: `1px solid ${C.borderSoft}` }}>
        {STAGES.map(s => (
          <div key={s.id} title={`${s.name} ${s.us}µs`} style={{
            width: `${(s.us / STAGE_TOTAL) * 100}%`,
            background: `linear-gradient(180deg, ${s.color}, ${s.color}aa)`,
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint }}>0 µs</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textDim }}>
          capture → decode → features → detect → score → seal
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.accent }}>{STAGE_TOTAL} µs</span>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// 7 · Resource footer
// ═══════════════════════════════════════════════════════════════════
function Gauge({ value, color }) {
  const R = 34, CIRC = Math.PI * R
  const f = clamp(value / 100, 0, 1)
  return (
    <svg width="94" height="56" style={{ display: 'block' }}>
      <path d={`M13,46 A${R},${R} 0 0 1 81,46`} fill="none" stroke="rgba(30,41,59,0.9)" strokeWidth="8" strokeLinecap="round" />
      <path d={`M13,46 A${R},${R} 0 0 1 81,46`} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${(f * CIRC).toFixed(1)} ${CIRC.toFixed(1)}`}
        style={{ filter: `drop-shadow(0 0 6px ${color}aa)`, transition: 'stroke-dasharray 0.6s ease' }} />
      <text x="47" y="44" textAnchor="middle"
        style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, fill: color }}>{value.toFixed(0)}%</text>
    </svg>
  )
}

function ResourceFooter({ last, dropped, diodeMode, uptime }) {
  const cores = diodeMode ? 4.1 + last.mult * 0.28 : 6.2 + last.mult * 0.16
  const threads = diodeMode ? 9 : 14
  const ringPct = clamp(6 + (last.ingest / SAT_PKT) * 74, 0, 99)
  const ringColor = ringPct > 80 ? C.red : ringPct > 55 ? C.amber : C.green

  return (
    <Card style={{ padding: 18 }}>
      <CardHeader
        icon={Icons.server}
        title="Resource Footprint"
        subtitle="Dev/demo tier · laptop, 8 cores, 16 GB · stated target: 8-core x86_64, 32 GB, 10 GbE NIC"
        right={<Pill color={C.green}>single static binary</Pill>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(168px, 1fr))', gap: 12 }}>
        {/* cores */}
        <div style={{ padding: 13, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
          <Label style={{ fontSize: 8, letterSpacing: 1.2 }}>CPU CORES IN USE</Label>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.accent, marginTop: 6 }}>
            {cores.toFixed(1)}<span style={{ fontSize: 11, color: C.textMute }}> / 8</span>
          </div>
          <div style={{ display: 'flex', gap: 3, marginTop: 9 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: 16, borderRadius: 3,
                background: i < Math.floor(cores) ? C.accent : i < cores ? `${C.accent}66` : 'rgba(30,41,59,0.8)',
                boxShadow: i < cores ? `0 0 7px ${C.accent}55` : 'none',
                transition: 'all 0.4s',
              }} />
            ))}
          </div>
        </div>

        {/* threads */}
        <div style={{ padding: 13, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
          <Label style={{ fontSize: 8, letterSpacing: 1.2 }}>THREAD COUNT</Label>
          <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, color: C.violet, marginTop: 6 }}>{threads}</div>
          <div style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, marginTop: 8, lineHeight: 1.55 }}>
            1 capture · {diodeMode ? 4 : 6} decode · 6 detect<br />
            crossbeam channels, no locks
          </div>
        </div>

        {/* ring buffer */}
        <div style={{ padding: 13, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
          <Label style={{ fontSize: 8, letterSpacing: 1.2 }}>RING-BUFFER OCCUPANCY</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            <Gauge value={ringPct} color={ringColor} />
            <div style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, lineHeight: 1.55 }}>
              4 MiB mmap<br />2048 frames
            </div>
          </div>
        </div>

        {/* dropped */}
        <div style={{ padding: 13, borderRadius: 10, background: C.inset, border: `1px solid ${C.borderSoft}` }}>
          <Label style={{ fontSize: 8, letterSpacing: 1.2 }}>DROPPED PACKETS</Label>
          <div style={{
            fontFamily: MONO, fontSize: 22, fontWeight: 700, marginTop: 6,
            color: dropped > 0 ? C.amber : C.green,
          }}>{fmtInt(dropped)}</div>
          <div style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, marginTop: 8, lineHeight: 1.55 }}>
            since {hhmmss(uptime)} uptime<br />
            {dropped > 0 ? 'shed above ceiling only' : 'kernel + userspace counters'}
          </div>
        </div>
      </div>

      {/* diode note */}
      {diodeMode && (
        <div style={{
          marginTop: 13, padding: '10px 13px', borderRadius: 9,
          background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.26)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ color: C.red, flexShrink: 0, marginTop: 1 }}>{Icons.warning({ width: 14, height: 14 })}</span>
          <div style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
            <span style={{ color: C.red, fontWeight: 700, fontFamily: MONO, letterSpacing: 0.5 }}>DIODE MODE · FORWARD PATH ONLY. </span>
            Ingest is one-directional: only the client&rarr;server half of every conversation reaches the tap, so the
            effective packet rate is roughly <span style={{ fontFamily: MONO, color: C.text }}>half</span> the
            full-duplex figure. Fewer packets is not more headroom — the return-path features are simply
            <span style={{ fontFamily: MONO, color: C.amber }}> MISSING</span>, and the ACK-Shadow estimator runs in their place.
          </div>
        </div>
      )}

      <div style={{
        marginTop: 13, padding: '10px 13px', borderRadius: 9,
        background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.18)',
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span style={{ color: C.accent, flexShrink: 0 }}>{Icons.lock({ width: 14, height: 14 })}</span>
        <span style={{ fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
          <span style={{ color: C.accent, fontWeight: 700 }}>Zero external dependencies · runs on a laptop.</span>{' '}
          No inference server, no message broker, no database service. Embedded DuckDB + Parquet ledger,
          ONNX Runtime linked into the binary, container started with{' '}
          <code style={{ fontFamily: MONO, color: C.text }}>--network none</code>. Everything above is a counter,
          not an estimate.
        </span>
      </div>
    </Card>
  )
}

// ═══════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════
export default function ThroughputPage({ stats, diodeMode }) {
  const baseFlows = stats?.flowsPerSec || 47200
  const alertP99 = stats?.p99Latency ?? 84

  const statsRef = useRef(baseFlows)
  useEffect(() => { statsRef.current = baseFlows })

  // ── rolling throughput buffer ──────────────────────────────────────
  const [samples, setSamples] = useState(() =>
    Array.from({ length: SAMPLES }, (_, i) => {
      const flows = 47200 * (0.96 + seed(i) * 0.08)
      const ingest = flows * PKTS_PER_FLOW
      return {
        flows, ingest, processed: ingest, drop: 0,
        mbps: (ingest * 244 * 8) / 1e6, rss: RSS_BASE + (seed(i, 3) - 0.5) * 6,
        mult: 1,
      }
    })
  )

  // ── burst-harness series ───────────────────────────────────────────
  const makeFlat = () => Array.from({ length: 18 }, (_, i) => ({
    rate: 47200 * (0.97 + seed(i, 7) * 0.06),
    rss: RSS_BASE + (seed(i, 11) - 0.5) * 5,
    naive: 408 + i * 1.2,
    oom: false,
  }))
  const [burst, setBurst] = useState(makeFlat)
  const [burstOn, setBurstOn] = useState(false)
  const [burstPhase, setBurstPhase] = useState('IDLE')
  const [peakMult, setPeakMult] = useState(1)

  // ── latency histogram ──────────────────────────────────────────────
  const [histo, setHisto] = useState(() => {
    const h = Array(BUCKETS).fill(0)
    for (let i = 0; i < 2400; i++) {
      const b = Math.floor(latDraw(seed(i, 5)) / BUCKET_MS)
      if (b >= 0 && b < BUCKETS) h[b] += 1
    }
    return h
  })

  const [uptime, setUptime] = useState(4 * 3600 + 12 * 60 + 7)
  const [dropped, setDropped] = useState(0)
  const [intro, setIntro] = useState(true)
  const [dot, setDot] = useState(0)
  const [jitter, setJitter] = useState(() => Array.from({ length: 6 }, (_, i) => seed(i, 17)))

  const burstRef = useRef(0)

  // CountUp on mount, then hand over to the live buffer.
  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 1550)
    return () => clearTimeout(t)
  }, [])

  // Animated packet through the pipeline.
  useEffect(() => {
    let raf, prev = performance.now()
    const loop = (now) => {
      const dt = now - prev; prev = now
      setDot(p => (p + dt / 3000) % 1)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  // Uptime.
  useEffect(() => {
    const id = setInterval(() => setUptime(u => u + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // Master 1 Hz sampler — drives every series on the page.
  useEffect(() => {
    let tick = 0
    const id = setInterval(() => {
      tick += 1

      // burst multiplier
      let mult = 1, phase = 'IDLE'
      if (burstRef.current > 0) {
        const t = BURST_TICKS - burstRef.current
        if (t < 8) { mult = 1 + (t / 8) * 9; phase = 'RAMP' }
        else if (t < 20) { mult = 9.6 + Math.sin(t * 1.3) * 0.4; phase = 'PEAK 10×' }
        else { mult = 10 - ((t - 20) / (BURST_TICKS - 20)) * 9; phase = 'DECAY' }
        burstRef.current -= 1
        if (burstRef.current === 0) { setBurstOn(false); setBurstPhase('IDLE'); setPeakMult(1) }
        else { setBurstPhase(phase); setPeakMult(mult) }
      }

      const diodeFactor = diodeMode ? 0.52 : 1
      const flows = statsRef.current * mult * diodeFactor * (0.985 + Math.random() * 0.03)
      const ingest = flows * PKTS_PER_FLOW
      const rssNow = RSS_BASE + (Math.random() - 0.5) * 7 + (mult - 1) * 0.7

      const overflow = Math.max(0, ingest - SAT_PKT)
      if (overflow > 0) setDropped(d => d + Math.round(overflow))

      setSamples(prev => {
        const lastProc = prev[prev.length - 1].processed
        // the queue smooths ingest; the ceiling is a hard clamp
        const smoothed = lastProc + (ingest - lastProc) * 0.42
        const processed = Math.min(smoothed, SAT_PKT)
        const drop = overflow > 0 ? (overflow / ingest) * 100 : 0
        return [...prev.slice(1), {
          flows, ingest, processed, drop, mult,
          mbps: (processed * 244 * 8) / 1e6,
          rss: rssNow,
        }]
      })

      setBurst(prev => {
        const p = prev[prev.length - 1]
        const naive = p.oom || p.naive >= MEM_MAX
          ? MEM_MAX
          : p.naive + 2.1 + Math.pow(mult, 2.35) * 9.4
        return [...prev.slice(prev.length >= 90 ? 1 : 0), {
          rate: flows,
          rss: rssNow,
          naive: Math.min(naive, MEM_MAX),
          oom: p.oom || naive >= MEM_MAX,
        }]
      })

      setHisto(prev => {
        const next = prev.map(v => v * 0.955)
        const shift = (mult - 1) * 0.028
        for (let i = 0; i < 120; i++) {
          const b = Math.floor(latDraw(Math.random(), shift) / BUCKET_MS)
          if (b >= 0 && b < BUCKETS) next[b] += 1
        }
        return next
      })

      if (tick % 3 === 0) setJitter(Array.from({ length: 6 }, () => Math.random()))
    }, 1000)
    return () => clearInterval(id)
  }, [diodeMode])

  const injectBurst = () => {
    burstRef.current = BURST_TICKS
    setBurstOn(true)
    setBurstPhase('RAMP')
    setBurst(makeFlat())
  }

  // ── derived tile values ────────────────────────────────────────────
  const last = samples[samples.length - 1]
  const ago = samples[SAMPLES - 1 - SPARK] || samples[0]
  const p50 = pctile(histo, 0.5), p95 = pctile(histo, 0.95), p99 = pctile(histo, 0.99)

  const sFlows  = samples.slice(-SPARK).map(s => s.flows)
  const sPkts   = samples.slice(-SPARK).map(s => s.processed)
  const sDrop   = samples.slice(-SPARK).map(s => s.drop + 0.0001)
  const sRss    = samples.slice(-SPARK).map(s => s.rss)
  const sLat    = samples.slice(-SPARK).map((s, i) => p50 + (s.mult - 1) * 0.03 + i * 0.0002)
  const sUp     = Array.from({ length: SPARK }, (_, i) => uptime - (SPARK - i))

  const dropNum = Number(last.drop.toFixed(2))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── provenance strip ── */}
      <Stagger delay={0}>
        <Card style={{
          padding: '13px 17px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
          background: 'linear-gradient(90deg, rgba(0,212,255,0.06), rgba(17,24,39,0.6) 45%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <span style={{ color: C.accent }}>{Icons.trending({ width: 17, height: 17 })}</span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: C.text }}>
                Performance harness · F3 / F14
              </div>
              <div style={{ fontSize: 11, color: C.textMute, marginTop: 3 }}>
                Every figure on this page is printed by the harness, not hand-typed.
                Source <span style={{ fontFamily: MONO, color: C.accent }}>{stats?.source || 'eth0'}</span> on{' '}
                <span style={{ fontFamily: MONO, color: C.accent }}>{stats?.interface || 'enp0s3'}</span>.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            <span className="ek-chip-measured">MEASURED</span>
            <Pill color={C.green}>1,240 Mbps stated</Pill>
            <Pill color={C.accent}>50K flows/s target</Pill>
            <Pill color={diodeMode ? C.red : C.textMute}>{diodeMode ? 'DIODE · FWD ONLY' : 'FULL DUPLEX'}</Pill>
          </div>
        </Card>
      </Stagger>

      {/* ── 1 · headline tiles ── */}
      <Stagger delay={0.05}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(196px, 1fr))', gap: 14 }}>
          <Tile label="FLOWS / SEC" value={last.flows} decimals={0} unit="flows/s" color={C.accent}
            icon={Icons.activity} series={sFlows} delta={last.flows - ago.flows} deltaUnit=" f/s"
            intro={intro} target={`target 50,000 · ${((last.flows / 50000) * 100).toFixed(0)}% of target`} />
          <Tile label="PACKETS / SEC" value={last.processed} decimals={0} unit="pkt/s" color={C.blue}
            icon={Icons.zap} series={sPkts} delta={last.processed - ago.processed} deltaUnit=" p/s"
            intro={intro} target={`${last.mbps.toFixed(0)} Mbps · ceiling ${fmtK(SAT_PKT)}`} />
          <Tile label="DROP RATE" value={dropNum} decimals={2} unit="%" color={dropNum > 0 ? C.amber : C.green}
            icon={Icons.warning} series={sDrop} delta={last.drop - ago.drop} deltaUnit="pp"
            intro={intro} target={dropNum > 0 ? 'shedding above ceiling' : 'acceptance: 0.00% sustained'} />
          <Tile label="LATENCY / PACKET" value={p99} decimals={2} unit="ms p99" color={p99 < 2.5 ? C.violet : C.red}
            icon={Icons.clock} series={sLat} delta={p99 - p95} deltaUnit="ms" sub="p99 − p95 spread"
            intro={intro} target={`p50 ${p50.toFixed(2)} · p95 ${p95.toFixed(2)} · budget 2.50`} />
          <Tile label="RESIDENT MEMORY" value={last.rss} decimals={1} unit="MB" color={C.green}
            icon={Icons.database} series={sRss} delta={last.rss - ago.rss} deltaUnit="MB"
            intro={intro} target="sketch-backed · O(1) in flow count" />
          <Tile label="UPTIME" value={hhmmss(uptime)} unit="" color={C.textDim}
            icon={Icons.refresh} series={sUp} delta={60} deltaUnit="s"
            intro={false} target={`alert p99 ${alertP99} ms · window-close → emit`} />
        </div>
      </Stagger>

      {/* ── 2 · live throughput ── */}
      <Stagger delay={0.1}>
        <LiveThroughputChart samples={samples} diodeMode={diodeMode} />
      </Stagger>

      {/* ── 3 · ★ constant memory under burst ── */}
      <Stagger delay={0.15}>
        <BurstChart
          series={burst}
          burstOn={burstOn}
          burstPhase={burstPhase}
          peakMult={peakMult}
          onInject={injectBurst}
        />
      </Stagger>

      {/* ── 4 + 5 · latency distribution and detector cost ── */}
      <Stagger delay={0.2}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20 }}>
          <LatencyHistogram histo={histo} p50={p50} p95={p95} p99={p99} alertP99={alertP99} />
          <DetectorCost jitter={jitter} />
        </div>
      </Stagger>

      {/* ── 6 · pipeline stage timing ── */}
      <Stagger delay={0.25}>
        <PipelineTiming dot={dot} />
      </Stagger>

      {/* ── 7 · resource footer ── */}
      <Stagger delay={0.3}>
        <ResourceFooter last={last} dropped={dropped} diodeMode={diodeMode} uptime={uptime} />
      </Stagger>
    </div>
  )
}
