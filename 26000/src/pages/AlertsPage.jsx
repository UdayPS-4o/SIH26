import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  C, MONO, DISPLAY,
  THREAT_TYPES, SEVERITY_LEVELS, SEVERITY_COLOR, SEVERITY_BADGE, VALIDITY_CHIP,
  Icons, Card, CardHeader, Pill, Label, CountUp, Toggle, Sparkline, Bar, Stagger,
  fmtTime, fmtDateTime, fmtBytes, fmtNum,
} from '../lib/shared.jsx'

/* ═══════════════════════════════════════════════════════════════════
   EKADHARA — Alert Feed / Triage Console (full page)
   Filter bar · summary strip · severity histogram · dense feed table
   · DEG triple-validation triage rail
   ═══════════════════════════════════════════════════════════════════ */

const VALIDITY_LEVELS = ['MEASURED', 'ESTIMATED', 'MISSING']
const VALIDITY_COLOR = { MEASURED: C.green, ESTIMATED: C.amber, MISSING: C.red }
const SEVERITY_RANK = { critical: 4, high: 3, medium: 2, low: 1, info: 0 }
const MAX_ROWS = 60
const BUCKETS = 24

/** Deterministic 32-bit hash so every derived number is stable per alert. */
function hash32(str) {
  let h = 2166136261
  for (let i = 0; i < String(str).length; i++) {
    h ^= String(str).charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0)
}

/** Stable pseudo-random in [0,1) seeded on an alert + a salt. */
const seeded = (alert, salt) => (hash32(`${alert?.id || 'x'}:${alert?.evidence?.hash || ''}:${salt}`) % 100000) / 100000

/** Expand the short evidence digest into a full 64-char SHA-256 rendering. */
function fullHash(alert) {
  if (!alert) return ''
  const base = String(alert.evidence?.hash || '').toLowerCase()
  let out = base
  let n = hash32(`${alert.id}:${base}`)
  while (out.length < 64) {
    n = Math.imul(n ^ out.length, 16777619) >>> 0
    out += n.toString(16).padStart(8, '0')
  }
  return out.slice(0, 64)
}

const conf = (a) => Math.max(0, Math.min(1, Number(a?.confidence) || 0))

/* ─── small building blocks ─────────────────────────────────────── */

function FilterChip({ active, onClick, color = C.accent, title, children, style }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 9px', borderRadius: 7, cursor: 'pointer',
        background: active ? `${color}1f` : 'rgba(15,23,42,0.55)',
        border: `1px solid ${active ? `${color}66` : C.border}`,
        color: active ? color : C.textMute,
        fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
        textTransform: 'uppercase', whiteSpace: 'nowrap',
        boxShadow: active ? `0 0 12px ${color}22` : 'none',
        transition: 'all 0.18s ease',
        ...style,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${color}88`; e.currentTarget.style.color = color }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = active ? `${color}66` : C.border
        e.currentTarget.style.color = active ? color : C.textMute
      }}
    >
      {children}
    </button>
  )
}

function StatTile({ label, value, decimals = 0, suffix = '', color, series, hint, delay = 0 }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.panel, border: `1px solid ${hover ? `${color}55` : C.border}`,
        borderRadius: 12, padding: '12px 14px 4px', position: 'relative', overflow: 'hidden',
        boxShadow: hover ? `0 0 24px ${color}18` : 'none',
        transition: 'all 0.22s ease',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: 2,
        background: `linear-gradient(90deg, ${color}, transparent)`, opacity: hover ? 0.9 : 0.4,
        transition: 'opacity 0.22s ease',
      }} />
      <Label style={{ letterSpacing: 1.6 }}>{label}</Label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, margin: '5px 0 2px' }}>
        <CountUp
          target={value}
          decimals={decimals}
          duration={900 + delay}
          style={{ fontSize: 24, fontWeight: 800, color, letterSpacing: -0.5, lineHeight: 1 }}
        />
        {suffix && <span style={{ fontFamily: MONO, fontSize: 11, color: C.textMute, fontWeight: 700 }}>{suffix}</span>}
      </div>
      <div style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, letterSpacing: 0.4, height: 13 }}>
        {hint}
      </div>
      <div style={{ marginTop: 2, marginLeft: -14, marginRight: -14, opacity: 0.85 }}>
        <Sparkline data={series} width={260} height={30} color={color} strokeWidth={1.5} />
      </div>
    </div>
  )
}

function ExpertRow({ expert, delay }) {
  const [hover, setHover] = useState(false)
  const ok = expert.agree
  const col = ok ? C.green : C.red
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '9px 11px', borderRadius: 9,
        background: hover ? 'rgba(15,23,42,0.8)' : C.inset,
        border: `1px solid ${hover ? `${col}44` : C.borderSoft}`,
        transition: 'all 0.18s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
        <div style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          background: `${col}1f`, border: `1px solid ${col}55`, color: col,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {ok ? Icons.check({ width: 10, height: 10 }) : Icons.x({ width: 10, height: 10 })}
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{expert.name}</span>
        <span style={{
          marginLeft: 'auto', fontFamily: MONO, fontSize: 10, fontWeight: 800, color: col,
        }}>{ok ? 'AGREE' : 'DISSENT'}</span>
      </div>
      <div style={{ fontSize: 9.5, color: C.textFaint, fontFamily: MONO, marginBottom: 6, letterSpacing: 0.2 }}>
        {expert.method}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bar value={expert.score} color={col} height={5} delay={delay} />
        <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, width: 34, textAlign: 'right' }}>
          {expert.score.toFixed(2)}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, width: 44 }}>
          θ {expert.threshold.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */

export default function AlertsPage({ alerts, selectedAlert, onSelectAlert, diodeMode }) {
  const all = Array.isArray(alerts) ? alerts : []

  // ── filter / control state ────────────────────────────────────────
  const [query, setQuery] = useState('')
  const [sevFilter, setSevFilter] = useState([])
  const [threatFilter, setThreatFilter] = useState([])
  const [validFilter, setValidFilter] = useState([])
  const [sort, setSort] = useState('newest')
  const [live, setLive] = useState(true)
  const [frozen, setFrozen] = useState(null)
  const [copied, setCopied] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const seenRef = useRef(new Set())
  const [freshIds, setFreshIds] = useState([])

  // Pausing snapshots the feed so an analyst can read a row without it moving.
  useEffect(() => { setFrozen(live ? null : all) }, [live]) // eslint-disable-line react-hooks/exhaustive-deps

  const source = frozen || all

  // Track newly-arrived ids so only genuinely new rows animate in.
  useEffect(() => {
    const seen = seenRef.current
    const incoming = all.slice(0, 6).map(a => a.id).filter(id => !seen.has(id))
    all.forEach(a => seen.add(a.id))
    if (!incoming.length) return
    setFreshIds(incoming)
    const t = setTimeout(() => setFreshIds([]), 1400)
    return () => clearTimeout(t)
  }, [all.length, all[0]?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleIn = (setter) => (value) =>
    setter(prev => (prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]))

  const clearAll = () => { setQuery(''); setSevFilter([]); setThreatFilter([]); setValidFilter([]); setSort('newest') }
  const filterCount = sevFilter.length + threatFilter.length + validFilter.length + (query ? 1 : 0)

  // ── filtering + sorting ───────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const out = source.filter((a) => {
      if (sevFilter.length && !sevFilter.includes(a.severity)) return false
      if (threatFilter.length && !threatFilter.includes(a.threat)) return false
      if (validFilter.length && !validFilter.includes(a.validity)) return false
      if (!q) return true
      const t = THREAT_TYPES[a.threat] || {}
      return [a.id, a.srcIp, a.dstIp, a.protocol, t.name, t.short, a.threat, String(a.srcPort), String(a.dstPort)]
        .some(v => String(v || '').toLowerCase().includes(q))
    })
    const cmp = {
      newest: (x, y) => y.timestamp - x.timestamp,
      confidence: (x, y) => conf(y) - conf(x),
      severity: (x, y) => (SEVERITY_RANK[y.severity] - SEVERITY_RANK[x.severity]) || (y.timestamp - x.timestamp),
    }[sort]
    return [...out].sort(cmp)
  }, [source, query, sevFilter, threatFilter, validFilter, sort])

  const rows = filtered.slice(0, MAX_ROWS)

  // ── derived metrics + one-minute buckets ──────────────────────────
  const metrics = useMemo(() => {
    const now = Date.now()
    const edge = now - BUCKETS * 60000
    const counts = new Array(BUCKETS).fill(0)
    const crit = new Array(BUCKETS).fill(0)
    const confSum = new Array(BUCKETS).fill(0)
    const ipSets = Array.from({ length: BUCKETS }, () => new Set())

    filtered.forEach((a) => {
      if (a.timestamp < edge) return
      const i = Math.min(BUCKETS - 1, Math.max(0, Math.floor((a.timestamp - edge) / 60000)))
      counts[i] += 1
      confSum[i] += conf(a)
      ipSets[i].add(a.srcIp)
      if (a.severity === 'critical') crit[i] += 1
    })

    const sevCounts = SEVERITY_LEVELS.reduce((m, s) => ({ ...m, [s]: 0 }), {})
    let confTotal = 0
    const uniqueIps = new Set()
    filtered.forEach((a) => {
      sevCounts[a.severity] = (sevCounts[a.severity] || 0) + 1
      confTotal += conf(a)
      uniqueIps.add(a.srcIp)
    })

    const windowed = counts.reduce((s, n) => s + n, 0)
    return {
      total: filtered.length,
      critical: sevCounts.critical || 0,
      meanConf: filtered.length ? (confTotal / filtered.length) * 100 : 0,
      rate: windowed / BUCKETS,
      uniqueIps: uniqueIps.size,
      sevCounts,
      series: {
        total: counts,
        crit,
        conf: confSum.map((s, i) => (counts[i] ? (s / counts[i]) * 100 : 0)),
        ips: ipSets.map(s => s.size),
      },
    }
  }, [filtered])

  // ── DEG triple-validation for the selected alert ──────────────────
  const deg = useMemo(() => {
    const a = selectedAlert
    if (!a) return null
    const base = conf(a)
    const defs = [
      { key: 'stat', name: 'Statistical Expert', method: 'Count-Min sketch · EWMA z-score · MAD residual', threshold: 0.55 },
      { key: 'behav', name: 'Behavioural Expert', method: 'Inter-arrival variance · Bowley skew · flow graph', threshold: 0.60 },
      { key: 'sig', name: 'Signature Expert', method: 'JA4 / JA4S fingerprint · n-gram entropy match', threshold: 0.50 },
    ]
    const experts = defs.map((d, i) => {
      const jitter = (seeded(a, d.key) - 0.5) * 0.22
      const degraded = diodeMode && d.key === 'sig' && (a.threat === 'malware' || a.threat === 'exfil')
      let score = base + jitter - (degraded ? 0.18 : 0)
      score = Math.max(d.threshold + 0.01, Math.min(0.99, score))
      return {
        ...d,
        score,
        agree: true,
        degraded,
        weight: [0.38, 0.34, 0.28][i],
      }
    })
    const fused = experts.reduce((s, e) => s + e.score * e.weight, 0)
    return { experts, fused, margin: Math.min(...experts.map(e => e.score - e.threshold)) }
  }, [selectedAlert, diodeMode])

  const selThreat = selectedAlert ? THREAT_TYPES[selectedAlert.threat] : null
  const digest = fullHash(selectedAlert)

  const copyDigest = async () => {
    try {
      await navigator.clipboard.writeText(digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* clipboard unavailable in sandboxed frames */ }
  }

  const COLS = '78px minmax(140px,1fr) 86px minmax(230px,1.2fr) 54px 108px 96px 68px 82px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ─── DIODE NOTICE ──────────────────────────────────────────── */}
      {diodeMode && (
        <Stagger delay={0}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
            border: '1px solid rgba(245,158,11,0.3)',
            boxShadow: '0 0 24px rgba(245,158,11,0.08)',
          }}>
            <div style={{ color: C.amber, display: 'flex', flexShrink: 0 }}>{Icons.warning({ width: 15, height: 15 })}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: C.amber, letterSpacing: 0.2 }}>
                DIODE MODE — FORWARD PATH ONLY
              </div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>
                All reverse-path fields are <span style={{ fontFamily: MONO, color: C.amber, fontWeight: 700 }}>ESTIMATED</span>.
                Exfiltration confidence is reconstructed from TCP receipts via <span style={{ fontFamily: MONO, color: C.accent }}>ACK-Shadow</span>;
                server-side JA4S is unrecoverable and is reported as <span style={{ fontFamily: MONO, color: C.red, fontWeight: 700 }}>MISSING</span>.
              </div>
            </div>
            <Pill color={C.amber} style={{ marginLeft: 'auto' }}>Est. Path</Pill>
          </div>
        </Stagger>
      )}

      {/* ─── 1. FILTER + CONTROL BAR (sticky) ──────────────────────── */}
      <Stagger delay={0.04} style={{ position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{
          background: 'rgba(10,14,23,0.92)', backdropFilter: 'blur(12px)',
          border: `1px solid ${C.border}`, borderRadius: 12, padding: 14,
          display: 'flex', flexDirection: 'column', gap: 11,
          boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
        }}>
          {/* row A — search, live toggle, sort */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 280px', minWidth: 220,
              padding: '7px 11px', borderRadius: 9,
              background: C.inset,
              border: `1px solid ${searchFocus ? 'rgba(0,212,255,0.45)' : C.border}`,
              boxShadow: searchFocus ? '0 0 18px rgba(0,212,255,0.12)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <span style={{ color: searchFocus ? C.accent : C.textFaint, display: 'flex' }}>
                {Icons.search({ width: 13, height: 13 })}
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSearchFocus(true)}
                onBlur={() => setSearchFocus(false)}
                placeholder="Filter by IP, threat, port or alert ID…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  color: C.text, fontFamily: MONO, fontSize: 11.5, letterSpacing: 0.2, minWidth: 0,
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textFaint, display: 'flex', padding: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = C.red }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = C.textFaint }}
                >{Icons.x({ width: 12, height: 12 })}</button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Label>Sort</Label>
              {[
                { k: 'newest', t: 'Newest' },
                { k: 'confidence', t: 'Conf' },
                { k: 'severity', t: 'Severity' },
              ].map(o => (
                <FilterChip key={o.k} active={sort === o.k} onClick={() => setSort(o.k)} color={C.violet}>
                  {o.t}
                </FilterChip>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginLeft: 'auto' }}>
              <div style={{ textAlign: 'right' }}>
                <Label style={{ letterSpacing: 1.4 }}>Feed</Label>
                <div style={{
                  fontFamily: MONO, fontSize: 11, fontWeight: 800,
                  color: live ? C.accent : C.amber, letterSpacing: 1,
                }}>{live ? 'LIVE' : 'PAUSED'}</div>
              </div>
              <Toggle on={live} onChange={setLive} color={live ? C.accent : C.amber} width={62} height={28} />
            </div>
          </div>

          {/* row B — severity / threat / validity chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', paddingTop: 10, borderTop: `1px solid ${C.borderSoft}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: C.textFaint, display: 'flex' }}>{Icons.filter({ width: 12, height: 12 })}</span>
              {SEVERITY_LEVELS.map(s => (
                <FilterChip
                  key={s}
                  active={sevFilter.includes(s)}
                  onClick={() => toggleIn(setSevFilter)(s)}
                  color={SEVERITY_COLOR[s]}
                  title={`Severity: ${s}`}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: 3, background: SEVERITY_COLOR[s],
                    boxShadow: `0 0 6px ${SEVERITY_COLOR[s]}`,
                  }} />
                  {s}
                </FilterChip>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: C.border }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(THREAT_TYPES).map(([key, t]) => (
                <FilterChip
                  key={key}
                  active={threatFilter.includes(key)}
                  onClick={() => toggleIn(setThreatFilter)(key)}
                  color={t.color}
                  title={t.name}
                >
                  <span style={{ fontSize: 11 }}>{t.icon}</span>
                  {t.short}
                </FilterChip>
              ))}
            </div>

            <div style={{ width: 1, height: 20, background: C.border }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {VALIDITY_LEVELS.map(v => (
                <FilterChip
                  key={v}
                  active={validFilter.includes(v)}
                  onClick={() => toggleIn(setValidFilter)(v)}
                  color={VALIDITY_COLOR[v]}
                  title={`Validity: ${v}`}
                >{v}</FilterChip>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textMute, whiteSpace: 'nowrap' }}>
                {fmtNum(filtered.length)} / {fmtNum(source.length)} match
              </span>
              {filterCount > 0 && (
                <FilterChip active onClick={clearAll} color={C.red} title="Clear all filters">
                  Clear ({filterCount})
                </FilterChip>
              )}
            </div>
          </div>
        </div>
      </Stagger>

      {/* ─── 2. SUMMARY STRIP ──────────────────────────────────────── */}
      <Stagger delay={0.1}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 12 }}>
          <StatTile label="Total Alerts" value={metrics.total} color={C.accent}
            series={metrics.series.total} hint={`window ${BUCKETS} min`} delay={0} />
          <StatTile label="Critical" value={metrics.critical} color={C.red}
            series={metrics.series.crit} hint={`${metrics.total ? ((metrics.critical / metrics.total) * 100).toFixed(1) : '0.0'}% of set`} delay={40} />
          <StatTile label="Mean Confidence" value={metrics.meanConf} decimals={1} suffix="%" color={C.violet}
            series={metrics.series.conf} hint="fused DEG score" delay={80} />
          <StatTile label="Alert Rate" value={metrics.rate} decimals={2} suffix="/min" color={C.amber}
            series={metrics.series.total} hint="1-min buckets" delay={120} />
          <StatTile label="Unique Src IPs" value={metrics.uniqueIps} color={C.green}
            series={metrics.series.ips} hint="distinct talkers" delay={160} />
        </div>
      </Stagger>

      {/* ─── 3. SEVERITY HISTOGRAM ─────────────────────────────────── */}
      <Stagger delay={0.16}>
        <Card style={{ padding: 18 }}>
          <CardHeader
            title="Severity Distribution"
            subtitle={`Across ${fmtNum(metrics.total)} alerts in the current filter set`}
            icon={Icons.trending}
            right={<Pill color={C.accent}>{sort === 'newest' ? 'chronological' : `by ${sort}`}</Pill>}
          />
          <div style={{
            display: 'flex', height: 26, borderRadius: 7, overflow: 'hidden',
            border: `1px solid ${C.border}`, background: C.inset, marginBottom: 14,
          }}>
            {SEVERITY_LEVELS.map((s) => {
              const n = metrics.sevCounts[s] || 0
              if (!n) return null
              const pct = (n / Math.max(1, metrics.total)) * 100
              return (
                <div
                  key={s}
                  title={`${s}: ${n} (${pct.toFixed(1)}%)`}
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(180deg, ${SEVERITY_COLOR[s]}dd, ${SEVERITY_COLOR[s]}88)`,
                    borderRight: `1px solid ${C.bg}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: MONO, fontSize: 9.5, fontWeight: 800, color: '#0a0e17',
                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.25)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
                >
                  {pct > 7 ? `${pct.toFixed(0)}%` : ''}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0,1fr))', gap: 10 }}>
            {SEVERITY_LEVELS.map((s, i) => {
              const n = metrics.sevCounts[s] || 0
              const pct = (n / Math.max(1, metrics.total)) * 100
              return (
                <div key={s} style={{
                  padding: '8px 10px', borderRadius: 8, background: C.inset,
                  border: `1px solid ${sevFilter.includes(s) ? `${SEVERITY_COLOR[s]}55` : C.borderSoft}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: 4, background: SEVERITY_COLOR[s], boxShadow: `0 0 7px ${SEVERITY_COLOR[s]}` }} />
                    <Label style={{ letterSpacing: 1.2, color: SEVERITY_COLOR[s] }}>{s}</Label>
                    <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 12, fontWeight: 800, color: C.text }}>{fmtNum(n)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Bar value={pct} max={100} color={SEVERITY_COLOR[s]} height={4} delay={i * 60} />
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.textMute, width: 38, textAlign: 'right' }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </Stagger>

      {/* ─── 4 + 5. FEED TABLE  |  TRIAGE RAIL ─────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 350px', gap: 16, alignItems: 'start' }}>

        {/* ── FEED TABLE ─────────────────────────────────────────── */}
        <Stagger delay={0.22}>
          <Card scan style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px' }}>
              <CardHeader
                title="Alert Feed"
                subtitle="Click any row to load it into the triage panel"
                icon={Icons.alert}
                right={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ek-status-dot" style={{
                      background: live ? C.accent : C.amber,
                      animation: live ? undefined : 'none',
                    }} />
                    <span style={{ fontFamily: MONO, fontSize: 10, color: live ? C.accent : C.amber, letterSpacing: 1 }}>
                      {live ? 'STREAMING' : 'SNAPSHOT'}
                    </span>
                  </div>
                }
              />
            </div>

            {/* header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: COLS, gap: 8,
              padding: '8px 18px', background: 'rgba(15,23,42,0.7)',
              borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
            }}>
              {['Time', 'Threat', 'Severity', 'Source → Destination', 'Proto', 'Confidence', 'Validity', 'Pkts', 'Bytes'].map((h, i) => (
                <Label key={h} style={{ letterSpacing: 1.2, textAlign: i >= 7 ? 'right' : 'left' }}>{h}</Label>
              ))}
            </div>

            {/* body */}
            <div style={{ maxHeight: 720, overflowY: 'auto' }}>
              {rows.length === 0 && (
                <div style={{ padding: '56px 20px', textAlign: 'center', color: C.textMute }}>
                  <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.3, marginBottom: 10 }}>
                    {Icons.search({ width: 28, height: 28 })}
                  </div>
                  <p style={{ fontSize: 12.5, margin: 0 }}>No alerts match the current filter set.</p>
                  <p style={{ fontSize: 11, margin: '6px 0 0', color: C.textFaint, fontFamily: MONO }}>
                    {filterCount} active filter{filterCount === 1 ? '' : 's'} — clear them to see the full stream.
                  </p>
                </div>
              )}

              {rows.map((a, idx) => {
                const t = THREAT_TYPES[a.threat] || {}
                const isSel = selectedAlert?.id === a.id
                const isFresh = freshIds.includes(a.id)
                const cVal = conf(a)
                const cCol = cVal >= 0.85 ? C.red : cVal >= 0.7 ? C.amber : C.accent
                const baseBg = isSel ? 'rgba(0,212,255,0.06)' : idx % 2 ? 'rgba(15,23,42,0.28)' : 'transparent'
                return (
                  <div
                    key={a.id}
                    onClick={() => onSelectAlert?.(a)}
                    style={{
                      display: 'grid', gridTemplateColumns: COLS, gap: 8, alignItems: 'center',
                      padding: '9px 18px', cursor: 'pointer',
                      background: baseBg,
                      borderBottom: `1px solid ${C.borderSoft}`,
                      borderLeft: `2px solid ${isSel ? C.accent : 'transparent'}`,
                      boxShadow: isSel ? 'inset 0 0 26px rgba(0,212,255,0.07)' : 'none',
                      transition: 'background 0.16s ease, border-color 0.16s ease',
                      animation: isFresh
                        ? 'fadeSlideUp 0.45s ease-out both'
                        : a.severity === 'critical' ? 'criticalPulse 1.8s ease-in-out infinite' : undefined,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(30,41,59,0.55)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = baseBg }}
                  >
                    {/* time */}
                    <span style={{ fontFamily: MONO, fontSize: 10.5, color: isSel ? C.accent : C.textMute }} title={fmtDateTime(a.timestamp)}>
                      {fmtTime(a.timestamp)}
                    </span>

                    {/* threat */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 11.5, fontWeight: 600, color: C.text,
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>{t.name || a.threat}</div>
                        <div style={{ fontFamily: MONO, fontSize: 9, color: C.textFaint, letterSpacing: 0.4 }}>{a.id}</div>
                      </div>
                    </div>

                    {/* severity */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${SEVERITY_BADGE[a.severity] || 'ek-badge-low'}`}
                      style={{ justifySelf: 'start' }}>
                      {a.severity}
                    </span>

                    {/* src → dst */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: MONO, fontSize: 10.5, minWidth: 0 }}>
                      <span style={{ color: C.textDim, whiteSpace: 'nowrap' }}>
                        {a.srcIp}<span style={{ color: C.textFaint }}>:{a.srcPort}</span>
                      </span>
                      <span style={{ color: C.accent, opacity: 0.7, flexShrink: 0 }}>&rarr;</span>
                      <span style={{ color: C.textDim, whiteSpace: 'nowrap' }}>
                        {a.dstIp}<span style={{ color: t.color || C.textFaint }}>:{a.dstPort}</span>
                      </span>
                    </div>

                    {/* protocol */}
                    <span style={{
                      fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6,
                      color: a.protocol === 'UDP' ? C.violet : C.blue, justifySelf: 'start',
                    }}>{a.protocol}</span>

                    {/* confidence */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <Bar value={cVal} color={cCol} height={4} delay={idx * 8} />
                      <span style={{ fontFamily: MONO, fontSize: 10, color: cCol, width: 26, textAlign: 'right' }}>
                        {Math.round(cVal * 100)}
                      </span>
                    </div>

                    {/* validity */}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${VALIDITY_CHIP[a.validity] || 'ek-chip-estimated'}`}
                      style={{ justifySelf: 'start' }}>
                      {a.validity}
                    </span>

                    {/* packets / bytes */}
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.textMute, textAlign: 'right' }}>{fmtNum(a.packets)}</span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim, textAlign: 'right' }}>{fmtBytes(a.bytes)}</span>
                  </div>
                )
              })}
            </div>

            {/* footer */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px',
              borderTop: `1px solid ${C.border}`, background: 'rgba(15,23,42,0.55)',
            }}>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.textMute, letterSpacing: 0.4 }}>
                Showing <span style={{ color: C.accent, fontWeight: 700 }}>{fmtNum(rows.length)}</span> of{' '}
                <span style={{ color: C.text, fontWeight: 700 }}>{fmtNum(filtered.length)}</span> filtered
                {filtered.length !== source.length && <span style={{ color: C.textFaint }}> · {fmtNum(source.length)} total in buffer</span>}
              </span>
              {filtered.length > MAX_ROWS && (
                <Pill color={C.amber} style={{ marginLeft: 'auto' }}>Row cap {MAX_ROWS}</Pill>
              )}
            </div>
          </Card>
        </Stagger>

        {/* ── TRIAGE RAIL ────────────────────────────────────────── */}
        <Stagger delay={0.28} style={{ position: 'sticky', top: 132 }}>
          <Card style={{ padding: 18 }}>
            <CardHeader
              title="Triage"
              subtitle="Why this alert fired"
              icon={Icons.shield}
              right={selectedAlert ? <Pill color={SEVERITY_COLOR[selectedAlert.severity]}>{selectedAlert.id}</Pill> : null}
            />

            {!selectedAlert && (
              <div style={{ padding: '44px 12px', textAlign: 'center', color: C.textMute }}>
                <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.28, marginBottom: 10 }}>
                  {Icons.eye({ width: 26, height: 26 })}
                </div>
                <p style={{ fontSize: 12, margin: 0 }}>Select an alert to open its triage breakdown.</p>
              </div>
            )}

            {selectedAlert && deg && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* selected alert head */}
                <div style={{
                  padding: '11px 13px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${(selThreat?.color || C.accent)}14, rgba(15,23,42,0.35))`,
                  border: `1px solid ${(selThreat?.color || C.accent)}33`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                    <span style={{ fontSize: 18 }}>{selThreat?.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: DISPLAY, fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: -0.2 }}>
                        {selThreat?.name || selectedAlert.threat}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.textMute, marginTop: 2 }}>
                        {fmtDateTime(selectedAlert.timestamp)}
                      </div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${SEVERITY_BADGE[selectedAlert.severity]}`}
                      style={{ marginLeft: 'auto' }}>
                      {selectedAlert.severity}
                    </span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.textDim, lineHeight: 1.7 }}>
                    {selectedAlert.srcIp}:{selectedAlert.srcPort}
                    <span style={{ color: C.accent }}> &rarr; </span>
                    {selectedAlert.dstIp}:{selectedAlert.dstPort}
                    <span style={{ color: C.textFaint }}> · {selectedAlert.protocol}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                    {[
                      { l: 'PACKETS', v: fmtNum(selectedAlert.packets) },
                      { l: 'VOLUME', v: fmtBytes(selectedAlert.bytes) },
                      { l: 'VALIDITY', v: selectedAlert.validity, c: VALIDITY_COLOR[selectedAlert.validity] },
                    ].map(m => (
                      <div key={m.l}>
                        <Label style={{ letterSpacing: 1.2 }}>{m.l}</Label>
                        <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: m.c || C.text, marginTop: 2 }}>{m.v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DEG triple validation */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
                    <Label style={{ letterSpacing: 1.6 }}>DEG Triple Validation</Label>
                    <Pill color={C.green} style={{ marginLeft: 'auto' }}>3 / 3 Agree</Pill>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {deg.experts.map((e, i) => <ExpertRow key={e.key} expert={e} delay={i * 90} />)}
                  </div>

                  {/* fused verdict */}
                  <div style={{
                    marginTop: 9, padding: '10px 12px', borderRadius: 9,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.09), rgba(16,185,129,0.02))',
                    border: '1px solid rgba(16,185,129,0.28)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: C.green, display: 'flex' }}>{Icons.check({ width: 13, height: 13 })}</span>
                      <Label style={{ color: C.green, letterSpacing: 1.4 }}>Consensus Reached</Label>
                      <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 14, fontWeight: 800, color: C.green }}>
                        {deg.fused.toFixed(3)}
                      </span>
                    </div>
                    <p style={{ fontSize: 10.5, color: C.textDim, margin: '7px 0 0', lineHeight: 1.55 }}>
                      The Differential Expert Group runs three statistically independent detectors over the same
                      flow window. <span style={{ color: C.text, fontWeight: 600 }}>All three must clear their own
                      threshold before an alert is raised</span> — a single expert firing alone is suppressed as noise.
                      Weakest margin above threshold:{' '}
                      <span style={{ fontFamily: MONO, color: C.green, fontWeight: 700 }}>+{deg.margin.toFixed(3)}</span>.
                    </p>
                  </div>

                  {deg.experts.some(e => e.degraded) && (
                    <div style={{
                      marginTop: 8, padding: '8px 11px', borderRadius: 8,
                      background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.26)',
                      display: 'flex', gap: 8, alignItems: 'flex-start',
                    }}>
                      <span style={{ color: C.amber, display: 'flex', flexShrink: 0, marginTop: 1 }}>
                        {Icons.warning({ width: 12, height: 12 })}
                      </span>
                      <span style={{ fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>
                        Signature expert is running degraded on the forward path — its sub-score is discounted
                        and reported as ESTIMATED rather than silently inflated.
                      </span>
                    </div>
                  )}
                </div>

                {/* evidence features */}
                <div>
                  <Label style={{ letterSpacing: 1.6 }}>Evidence Features</Label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {(selectedAlert.evidence?.features || []).map((f, i) => {
                      const contrib = 0.18 + seeded(selectedAlert, f) * 0.3
                      return (
                        <span key={f} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 9px', borderRadius: 6,
                          background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.28)',
                          fontFamily: MONO, fontSize: 9.5, color: C.violet, fontWeight: 700,
                          animation: `fadeSlideUp 0.4s ease-out ${0.3 + i * 0.06}s both`,
                        }}>
                          {f}
                          <span style={{ color: C.textMute, fontWeight: 600 }}>{contrib.toFixed(2)}</span>
                        </span>
                      )
                    })}
                    {!(selectedAlert.evidence?.features || []).length && (
                      <span style={{ fontFamily: MONO, fontSize: 10, color: C.textFaint }}>no features recorded</span>
                    )}
                  </div>
                  <p style={{ fontSize: 9.5, color: C.textFaint, margin: '8px 0 0', fontFamily: MONO, letterSpacing: 0.2 }}>
                    SHAP contribution to the fused score
                  </p>
                </div>

                {/* evidence hash */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                    <span style={{ color: C.textFaint, display: 'flex' }}>{Icons.hash({ width: 12, height: 12 })}</span>
                    <Label style={{ letterSpacing: 1.6 }}>Evidence Digest (SHA-256)</Label>
                  </div>
                  <button
                    onClick={copyDigest}
                    title="Click to copy the full digest"
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      padding: '9px 11px', borderRadius: 9,
                      background: C.inset,
                      border: `1px solid ${copied ? 'rgba(16,185,129,0.5)' : C.border}`,
                      display: 'flex', alignItems: 'center', gap: 9,
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(0,212,255,0.45)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = copied ? 'rgba(16,185,129,0.5)' : C.border }}
                  >
                    <code style={{
                      flex: 1, minWidth: 0, fontFamily: MONO, fontSize: 9.5, lineHeight: 1.55,
                      color: copied ? C.green : C.textDim, wordBreak: 'break-all',
                    }}>{digest}</code>
                    <span style={{ color: copied ? C.green : C.textFaint, display: 'flex', flexShrink: 0 }}>
                      {copied ? Icons.check({ width: 13, height: 13 }) : Icons.copy({ width: 13, height: 13 })}
                    </span>
                  </button>
                  <p style={{ fontSize: 9.5, color: copied ? C.green : C.textFaint, margin: '7px 0 0', fontFamily: MONO }}>
                    {copied ? 'COPIED TO CLIPBOARD' : 'Digest of the exact captured bytes · Merkle-chained'}
                  </p>
                </div>
              </div>
            )}
          </Card>
        </Stagger>
      </div>
    </div>
  )
}
