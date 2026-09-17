import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShieldAlert, Search, X } from 'lucide-react';
import { Alert } from '../types';

/* ═══════════════════════════════════════════════════════════════════════════════════
   WATCHTOWER — Live Threats
   ═══════════════════════════════════════════════════════════════════════════════════ */

/* ── Palette (locked — one accent, matches Dashboard.tsx) ─────────────────── */

const C = {
  bg: 'var(--bg-primary)',
  surface: 'var(--bg-secondary)',
  surfaceHi: 'var(--bg-card-hover)',
  border: 'var(--border-color)',
  borderHi: 'var(--border-active)',
  text: 'var(--text-primary)',
  textSec: 'var(--text-secondary)',
  textDim: 'var(--text-muted)',
  accent: 'var(--accent-cyan)',
  red: 'var(--accent-red)',
  orange: 'var(--accent-orange)',
  amber: 'var(--accent-yellow)',
  green: 'var(--accent-green)',
  purple: 'var(--accent-purple)',
  pink: 'var(--accent-pink)',
  teal: 'var(--accent-teal)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });
const rand = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randIP = () => [rand(1,223), rand(0,255), rand(0,255), rand(1,254)].join('.');
let _aid = 0;
const nextId = () => `LT-${Date.now().toString(36).toUpperCase()}-${(++_aid).toString(36).toUpperCase()}`;

const SEV_MAP: Record<string, { color: string; bg: string; glow: string }> = {
  critical: { color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.10)', glow: 'rgba(239,68,68,0.40)' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.10)', glow: 'rgba(249,115,22,0.30)' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.10)',  glow: 'rgba(234,179,8,0.25)' },
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(0,212,255,0.08)',  glow: 'rgba(0,212,255,0.25)' },
};

const THREAT_TYPES = ['ddos','beaconing','dga','dns_tunnel','port_scan','exfiltration','tls_anomaly','malware','phishing'] as const;

const THREAT_CLR: Record<string,string> = {
  ddos: C.red, beaconing: C.orange, dga: C.amber,
  dns_tunnel: 'var(--accent-cyan)', port_scan: C.purple,
  exfiltration: C.pink, tls_anomaly: C.teal, malware: C.red, phishing: 'var(--accent-amber)',
};
const THREAT_LBL: Record<string,string> = {
  ddos:'DDoS', beaconing:'Beaconing', dga:'DGA',
  dns_tunnel:'DNS Tunnel', port_scan:'Port Scan',
  exfiltration:'Exfiltration', tls_anomaly:'TLS Anomaly',
  malware:'Malware', phishing:'Phishing',
};

const COMMON_PORTS = [22,23,25,53,80,110,143,443,445,993,3306,3389,5432,5900,8080,8443,1433,6379,9200,27017];
const PROTOCOLS = ['TCP','UDP','ICMP','DNS','TLS','HTTP','HTTPS'] as const;

function makeAlert(overrides?: Partial<Alert>): Alert {
  const threat_type = overrides?.threat_type ?? pick([...THREAT_TYPES]);
  let severity: 'critical'|'high'|'medium'|'low' = 'low';
  if (!overrides?.severity) {
    const r = Math.random();
    if (r < 0.08) severity = 'critical';
    else if (r < 0.28) severity = 'high';
    else if (r < 0.60) severity = 'medium';
  }
  const confidence = overrides?.confidence ?? rand(35, 99);
  const src_port = rand(1024, 65535);
  const dst_port = overrides?.dst_port ?? pick(COMMON_PORTS);
  const protocol = pick([...PROTOCOLS]);
  const evidence = overrides?.evidence ?? {
    src_port,
    proto: protocol,
    flag_count: rand(0, 5000),
    anomaly_score: (Math.random() * 0.4 + 0.5).toFixed(2),
    flows: rand(10, 2000),
  };

  return {
    id: overrides?.id ?? nextId(),
    timestamp: overrides?.timestamp ?? Date.now(),
    threat_type,
    severity,
    confidence,
    src_ip: overrides?.src_ip ?? randIP(),
    dst_ip: overrides?.dst_ip ?? randIP(),
    dst_port,
    src_port: (evidence as any).src_port ?? src_port,
    protocol: (evidence as any).proto ?? protocol,
    evidence,
    flow_count: rand(10, 2000),
  };
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   ATOMIC COMPONENTS (identical to Dashboard.tsx — shared surface)
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Panel: React.FC<{ delay?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ delay = 0, style, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      position: 'relative', overflow: 'hidden',
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
      ...style,
    }}>
      <div style={{
        position:'absolute', top:0, left:0, right:0, height:1,
        background:`linear-gradient(90deg, transparent, ${C.accent}30, transparent)`,
      }} />
      <div style={{ padding:'20px 22px', position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
};

const SH: React.FC<{ label: string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'baseline', justifyContent:'space-between',
    paddingBottom:10, marginBottom:14, borderBottom:`1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily:'"JetBrains Mono",monospace', fontSize:10, fontWeight:700,
      letterSpacing:'2.5px', color:C.accent, textTransform:'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

const Sev: React.FC<{ sev: string }> = ({ sev }) => {
  const s = SEV_MAP[sev] || SEV_MAP.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
      letterSpacing:'1px', color:s.color, background:s.bg, border:`1px solid ${s.color}25`,
      fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
    }}>
      <span style={{width:4,height:4,borderRadius:'50%',background:s.color}} />
      {sev}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   SPARKLINE COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Sparkline: React.FC<{ data: number[]; width?: number; height?: number; color?: string }> = ({
  data, width = 220, height = 40, color = C.accent
}) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const areaPts = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#spark-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={data.length - 1} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5" fill={color} stroke={C.bg} strokeWidth="1.5" />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   LIVE THREATS PAGE
   ═══════════════════════════════════════════════════════════════════════════════════ */

const LiveThreats: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(() => {
    const initial: Alert[] = [];
    const t = Date.now();
    for (let i = 0; i < 30; i++) initial.push(makeAlert({ timestamp: t - i * rand(3000, 15000) }));
    return initial.sort((a, b) => b.timestamp - a.timestamp);
  });
  const [clock, setClock] = useState(now());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [throughput, setThroughput] = useState<number[]>(Array.from({ length: 30 }, () => rand(10, 120)));

  /* ── Clock ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Live alert stream (every 2 seconds) ────────────────────────────────── */
  useEffect(() => {
    const interval = setInterval(() => {
      const count = rand(1, 4);
      const newAlerts: Alert[] = [];
      for (let i = 0; i < count; i++) {
        newAlerts.push(makeAlert({ timestamp: Date.now() - i * rand(200, 1200) }));
      }
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 200));
      setThroughput(prev => [...prev.slice(1), newAlerts.length * rand(10, 40) + rand(5, 20)]);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  /* ── Filters ────────────────────────────────────────────────────────────── */
  const filteredAlerts = useMemo(() => {
    let result = alerts;
    if (filterSeverity !== 'all') result = result.filter(a => a.severity === filterSeverity);
    if (filterTypes.length > 0) result = result.filter(a => filterTypes.includes(a.threat_type));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        a.src_ip.includes(q) || a.dst_ip.includes(q) || a.threat_type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [alerts, filterSeverity, filterTypes, searchQuery]);

  const toggleType = (type: string) => {
    setFilterTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(a => { counts[a.severity] = (counts[a.severity] || 0) + 1; });
    return counts;
  }, [alerts]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.threat_type] = (counts[a.threat_type] || 0) + 1; });
    return counts;
  }, [alerts]);

  const clearFilters = useCallback(() => {
    setFilterSeverity('all');
    setFilterTypes([]);
    setSearchQuery('');
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{
      minHeight:'100%', background:C.bg, color:C.text,
      fontFamily:'"JetBrains Mono","Fira Code",monospace', fontSize:12, lineHeight:1.5,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0; transform:translateX(-6px);} to{opacity:1; transform:translateX(0);} }
        @keyframes wt-glow { 0%,100%{box-shadow:0 0 3px rgba(239,68,68,0.2);} 50%{box-shadow:0 0 8px rgba(239,68,68,0.4);} }
        ::selection { background: rgba(0,212,255,0.15); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid rgba(0,212,255,0.5); outline-offset: 2px; border-radius: 2px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textSec}; }
      `}</style>

      {/* ── STICKY HUD BAR ─────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        background:'rgba(5,8,13,0.94)',
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth:1480, margin:'0 auto', padding:'0 28px',
          display:'flex', alignItems:'center', height:48, gap:14,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
            <div style={{
              width:26, height:26, borderRadius:5,
              background:`linear-gradient(135deg, ${C.accent}18, ${C.accent}06)`,
              border:`1px solid ${C.accent}30`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShieldAlert size={14} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13, fontWeight:800, letterSpacing:'4px', color:C.text }}>WATCHTOWER</span>
          </div>
          <div style={{ width:1, height:18, background:C.border, flexShrink:0 }} />
          <span style={{ fontSize:10, color:C.textSec, letterSpacing:'0.8px', flexShrink:0 }}>
            PS-26145 · LIVE THREATS
          </span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
              background:`${C.red}0a`, border:`1px solid ${C.red}25`, borderRadius:4, cursor:'default',
              animation:'wt-glow 2s ease-in-out infinite',
            }}>
              <span style={{
                width:5, height:5, borderRadius:'50%', background:C.red,
                animation:'wt-pulse 1.6s ease-in-out infinite', boxShadow:`0 0 5px ${C.red}60`,
                display:'inline-block',
              }} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color:C.red }}>STREAMING</span>
            </div>
            <span style={{ fontSize:11, color:C.textSec, letterSpacing:'0.8px', fontVariantNumeric:'tabular-nums' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} · {clock}
            </span>
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN ────────────────────────────────────────────────── */}
      <main style={{ maxWidth:1480, margin:'0 auto', padding:'28px 28px 80px' }}>

        {/* Page title */}
        <section style={{ marginBottom:28 }}>
          <h1 style={{ fontSize:13, fontWeight:700, letterSpacing:'2.5px', color:C.accent, marginBottom:6 }}>
            ◈ LIVE THREATS
          </h1>
          <p style={{ fontSize:12, color:C.textSec, maxWidth:700, lineHeight:1.7, margin:0 }}>
            Real-time threat intelligence feed. Alerts auto-refresh every 2 seconds with full packet metadata.
            Passive observation — no probes, no decryption.
          </p>
        </section>

        {/* ── SECTION 1 — Throughput Sparkline + Severity Summary + Filters ─── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr', gap:12, marginBottom:20 }}>

          {/* Throughput + Summary */}
          <Panel delay={0.05}>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, alignItems:'center' }}>
              {/* Sparkline */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color:C.textSec, textTransform:'uppercase' }}>Throughput (alerts/s)</span>
                <Sparkline data={throughput} width={200} height={48} color={C.accent} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize:18, fontWeight:800, color:C.accent, fontVariantNumeric:'tabular-nums' }}>
                    {throughput[throughput.length - 1]}
                  </span>
                  <span style={{ fontSize:9, color:C.textDim }}>alerts/s</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {/* Severity count badges */}
                <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                  {([
                    { k:'critical', label:'CRITICAL', c:C.red },
                    { k:'high', label:'HIGH', c:C.orange },
                    { k:'medium', label:'MEDIUM', c:C.amber },
                    { k:'low', label:'LOW', c:'var(--accent-cyan)' },
                  ]).map(s => (
                    <div key={s.k} onClick={() => setFilterSeverity(filterSeverity === s.k ? 'all' : s.k)}
                      style={{
                        padding:'5px 10px', borderRadius:4, cursor:'pointer',
                        border:`1px solid ${s.c}25`, background: filterSeverity === s.k ? `${s.c}12` : 'transparent',
                        transition: `all 0.2s ${EASE}`,
                        display:'flex', alignItems:'center', gap:6,
                      }}>
                      <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', color:s.c, textTransform:'uppercase' }}>{s.label}</span>
                      <span style={{ fontSize:14, fontWeight:800, color:s.c, fontVariantNumeric:'tabular-nums' }}>
                        {severityCounts[s.k]}
                      </span>
                    </div>
                  ))}
                  <div style={{ padding:'5px 10px', borderRadius:4, border:`1px solid ${C.border}`,
                    display:'flex', alignItems:'center', gap:6 }}>
                    <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', color:C.textSec, textTransform:'uppercase' }}>TOTAL</span>
                    <span style={{ fontSize:14, fontWeight:800, color:C.accent, fontVariantNumeric:'tabular-nums' }}>
                      {filteredAlerts.length}
                    </span>
                  </div>
                </div>

                {/* Filter controls */}
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                  {/* Threat type checkboxes */}
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap', alignItems:'center' }}>
                    {THREAT_TYPES.map(type => (
                      <label key={type} style={{
                        display:'inline-flex', alignItems:'center', gap:4, padding:'3px 8px',
                        borderRadius:3, border:`1px solid ${filterTypes.includes(type) ? C.accent + '40' : C.border}`,
                        background: filterTypes.includes(type) ? `${C.accent}0a` : 'transparent',
                        cursor:'pointer', transition: `all 0.2s ${EASE}`,
                      }}>
                        <input
                          type="checkbox"
                          checked={filterTypes.includes(type)}
                          onChange={() => toggleType(type)}
                          style={{ display:'none' }}
                        />
                        <span style={{
                          width:7, height:7, borderRadius:2, border:`1px solid ${C.textSec}40`,
                          background: filterTypes.includes(type) ? C.accent : 'transparent',
                          transition: `all 0.15s ${EASE}`, display:'inline-block', flexShrink:0,
                        }} />
                        <span style={{
                          fontSize:9, fontWeight:600, letterSpacing:'0.5px',
                          color: filterTypes.includes(type) ? C.text : C.textSec,
                          fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
                        }}>{THREAT_LBL[type]}</span>
                      </label>
                    ))}
                  </div>

                  <div style={{ width:1, height:20, background:C.border, flexShrink:0 }} />

                  {/* Severity dropdown */}
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    style={{
                      padding:'4px 8px', background:'rgba(0,212,255,0.03)', border:`1px solid ${C.border}`,
                      borderRadius:3, color:C.text, fontFamily:'"JetBrains Mono",monospace', fontSize:10,
                      letterSpacing:'0.5px', cursor:'pointer', outline:'none',
                    }}
                  >
                    <option value="all">ALL SEVERITY</option>
                    <option value="critical">CRITICAL</option>
                    <option value="high">HIGH</option>
                    <option value="medium">MEDIUM</option>
                    <option value="low">LOW</option>
                  </select>

                  {/* Search */}
                  <div style={{ position:'relative' }}>
                    <input
                      type="text"
                      placeholder="Search IP or type..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding:'4px 10px', paddingLeft:26, background:'rgba(0,212,255,0.03)',
                        border:`1px solid ${C.border}`, borderRadius:3, color:C.text,
                        fontFamily:'"JetBrains Mono",monospace', fontSize:10, width:190,
                        outline:'none', transition: `border-color 0.2s ${EASE}`,
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = `${C.accent}40`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
                    />
                    <Search size={12} color={C.textSec} strokeWidth={2} style={{
                      position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  </div>

                  <button
                    onClick={clearFilters}
                    style={{
                      padding:'4px 10px', background:'rgba(0,212,255,0.04)', border:`1px solid ${C.border}`,
                      borderRadius:3, color:C.textSec, fontFamily:'"JetBrains Mono",monospace',
                      fontSize:9, letterSpacing:'0.5px', cursor:'pointer',
                      transition: `all 0.2s ${EASE}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent + '40'; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >RESET</button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* ── SECTION 2 — Threat Feed Table ─────────────────────────────────── */}
        <Panel delay={0.1} style={{ marginBottom:20 }}>
          <SH label="Live Threat Feed" right={
            <span style={{ fontSize:9, color:C.textSec, letterSpacing:'0.5px' }}>{filteredAlerts.length} EVENTS · AUTO-SCROLL ON</span>
          } />

          {filteredAlerts.length === 0 ? (
            <div style={{
              padding:'60px 20px', textAlign:'center', color:C.textDim,
              display:'flex', flexDirection:'column', alignItems:'center', gap:12,
            }}>
              <div style={{ fontSize:28, color:C.textDim }}>◈</div>
              <div style={{ fontSize:10, color:C.textSec, letterSpacing:'1px' }}>NO ALERTS MATCH FILTERS</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(0,212,255,0.015)' }}>
                    {['Time', 'Threat Class', 'Source IP', 'Dest IP', 'Port', 'Confidence', 'Severity'].map(h => (
                      <th key={h} style={{
                        padding:'9px 10px', textAlign:'left', fontSize:9, fontWeight:700,
                        letterSpacing:'1px', color:C.textSec,
                        fontFamily:'"JetBrains Mono",monospace',
                        textTransform:'uppercase', whiteSpace:'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, idx) => {
                    const fresh = idx < 5;
                    const tClr = THREAT_CLR[alert.threat_type.toLowerCase()] || C.accent;
                    const sevStyle = SEV_MAP[alert.severity] || SEV_MAP.low;
                    return (
                      <tr key={alert.id} style={{
                        borderBottom:`1px solid ${C.border}`,
                        background: fresh ? `rgba(239,68,68,0.015)` : 'transparent',
                        animation: `wt-row-in 0.35s ${EASE} ${Math.min(idx * 0.01, 0.4)}s both`,
                        transition: `background 0.15s ${EASE}`,
                        cursor:'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = fresh ? `rgba(239,68,68,0.015)` : 'transparent'; }}
                        onClick={() => setSelectedAlert(alert)}
                      >
                        <td style={{
                          padding:'9px 14px', fontSize:11, color:C.textSec,
                          fontFamily:'"JetBrains Mono",monospace', whiteSpace:'nowrap',
                          fontVariantNumeric:'tabular-nums', letterSpacing:'0.3px',
                        }}>{fmtTime(alert.timestamp)}</td>

                        <td style={{
                          padding:'9px 14px', fontSize:11, fontWeight:600,
                          fontFamily:'"JetBrains Mono",monospace',
                          letterSpacing:'0.4px', textTransform:'uppercase', color:tClr,
                        }}>
                          <span style={{
                            display:'inline-block', width:5, height:5, borderRadius:'50%',
                            background:tClr, marginRight:6, verticalAlign:'middle',
                            boxShadow: fresh ? `0 0 5px ${tClr}60` : 'none',
                          }} />
                          {alert.threat_type}
                        </td>

                        <td style={{
                          padding:'9px 14px', fontSize:11,
                          fontFamily:'"JetBrains Mono",monospace', color:C.accent,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.3px',
                        }}>{alert.src_ip}</td>

                        <td style={{
                          padding:'9px 14px', fontSize:11,
                          fontFamily:'"JetBrains Mono",monospace', color:C.textSec,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.3px',
                        }}>{alert.dst_ip}</td>

                        <td style={{
                          padding:'9px 14px', fontSize:11,
                          fontFamily:'"JetBrains Mono",monospace', color:C.text,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.3px',
                        }}>{alert.dst_port}</td>

                        <td style={{
                          padding:'9px 14px', fontSize:11, fontWeight:700,
                          fontFamily:'"JetBrains Mono",monospace', color:C.green,
                          fontVariantNumeric:'tabular-nums',
                        }}>{alert.confidence.toFixed(1)}%</td>

                        <td style={{ padding:'9px 14px' }}>
                          <span style={{
                            display:'inline-flex', alignItems:'center', gap:5,
                            padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
                            letterSpacing:'1px', color:sevStyle.color, background:sevStyle.bg,
                            border:`1px solid ${sevStyle.color}25`,
                            fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
                          }}>
                            <span style={{width:4,height:4,borderRadius:'50%',background:sevStyle.color}} />
                            {alert.severity}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* ── Threat Class Distribution Bar ────────────────────────────────── */}
        <Panel delay={0.15} style={{ marginBottom:20 }}>
          <SH label="Threat Class Distribution" right={
            <span style={{ fontSize:9, color:C.textSec }}>{Object.keys(typeCounts).length} CLASSES ACTIVE</span>
          } />
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {Object.entries(typeCounts)
              .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
              .map(([type, count]) => {
                const total = Object.values(typeCounts).reduce((s: number, c: number) => s + c, 0) || 1;
                const pct = (count / total * 100);
                const clr = THREAT_CLR[type.toLowerCase()] || C.accent;
                return (
                  <div key={type} style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{
                      width:9, height:9, borderRadius:2, background:clr, flexShrink:0,
                      boxShadow: `0 0 4px ${clr}40`,
                    }} />
                    <span style={{
                      fontSize:10, fontWeight:600, color:C.text, minWidth:110,
                      textTransform:'uppercase', letterSpacing:'0.5px',
                    }}>{THREAT_LBL[type] || type}</span>
                    <div style={{
                      flex:1, height:6, background:C.border, borderRadius:3, overflow:'hidden',
                    }}>
                      <div style={{
                        height:'100%', width:`${pct}%`, background:`linear-gradient(90deg, ${clr}, ${clr}80)`,
                        borderRadius:3, transition: `width 0.5s ${EASE}`,
                      }} />
                    </div>
                    <span style={{
                      fontSize:10, fontWeight:700, color:C.textSec, fontVariantNumeric:'tabular-nums',
                      minWidth:30, textAlign:'right',
                    }}>{count}</span>
                  </div>
                );
              })}
          </div>
        </Panel>

        {/* ── Alert Detail Modal ─────────────────────────────────────────────── */}
        {selectedAlert && (
          <div style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)',
            zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center',
          }} onClick={() => setSelectedAlert(null)}>
            <div style={{
              background:C.surface, border:`1px solid ${SEV_MAP[selectedAlert.severity]?.color || C.accent}40`,
              borderRadius:8, padding:24, maxWidth:580, width:'90%', maxHeight:'80vh', overflow:'auto',
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'2px', color:C.accent }}>
                  ◈ ALERT DETAIL · {selectedAlert.id}
                </span>
                <button onClick={() => setSelectedAlert(null)} style={{ background:'none', border:'none', color:C.textSec, cursor:'pointer', padding:4 }}>
                  <X size={14} />
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {[
                  { label:'THREAT TYPE', val: selectedAlert.threat_type, mono:true },
                  { label:'SEVERITY', val: <Sev sev={selectedAlert.severity} /> },
                  { label:'SOURCE IP', val: selectedAlert.src_ip, mono:true },
                  { label:'DEST IP', val: selectedAlert.dst_ip, mono:true },
                  { label:'DEST PORT', val: String(selectedAlert.dst_port ?? '—'), mono:true },
                  { label:'SRC PORT', val: String((selectedAlert.evidence as any)?.src_port ?? '—'), mono:true },
                  { label:'PROTOCOL', val: String((selectedAlert.evidence as any)?.proto ?? (selectedAlert as any).protocol ?? '—'), mono:true },
                  { label:'CONFIDENCE', val: `${selectedAlert.confidence.toFixed(1)}%`, mono:true },
                  { label:'FLOW COUNT', val: String(selectedAlert.flow_count), mono:true },
                  { label:'TIMESTAMP', val: new Date(selectedAlert.timestamp).toLocaleString(), mono:true },
                ].map(({label, val, mono}) => (
                  <div key={label} style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    <span style={{ fontSize:8, fontWeight:700, letterSpacing:'1px', color:C.textDim, textTransform:'uppercase' }}>{label}</span>
                    <span style={{
                      fontSize:12, color:C.text, fontFamily: mono ? '"JetBrains Mono",monospace' : 'inherit',
                    }}>{val}</span>
                  </div>
                ))}
                <div style={{ gridColumn:'1 / -1', marginTop:4 }}>
                  <span style={{ fontSize:8, fontWeight:700, letterSpacing:'1px', color:C.textDim, display:'block', marginBottom:3, textTransform:'uppercase' }}>EVIDENCE</span>
                  <pre style={{
                    background:'rgba(0,212,255,0.03)', border:`1px solid ${C.border}`,
                    borderRadius:4, padding:'10px 12px', fontSize:10, color:C.textSec,
                    fontFamily:'"JetBrains Mono",monospace', overflow:'auto', maxHeight:120,
                    margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all',
                  }}>{typeof selectedAlert.evidence === 'string' ? selectedAlert.evidence : JSON.stringify(selectedAlert.evidence, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <footer style={{
          padding:'24px 0', borderTop:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
        }}>
          <span style={{ fontSize:9, color:C.textDim, letterSpacing:'1px' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:9, color:C.textDim, letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums' }}>
            AUTO-REFRESH 2s · {filteredAlerts.length} FILTERED · {alerts.length} TOTAL ALERTS
          </span>
        </footer>

      </main>
    </div>
  );
};

export default LiveThreats;
