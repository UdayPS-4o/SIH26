import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Search } from 'lucide-react';
import { Alert } from '../types';
import ValidityChip from '../components/ValidityChip';

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

const SEV_MAP: Record<string, { color: string; bg: string }> = {
  critical: { color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.08)' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.08)' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.08)' },
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.06)' },
};

const THREAT_TYPES = ['ddos','beaconing','dga','dns_tunnel','port_scan','exfiltration','tls_anomaly','malware','phishing'] as const;

const THREAT_CLR: Record<string,string> = {
  ddos: C.red, beaconing: C.orange, dga: C.amber,
  dns_tunnel: C.teal, port_scan: C.purple,
  exfiltration: C.pink, tls_anomaly: C.teal, malware: C.red, phishing: C.amber,
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
   ATOMIC COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Panel: React.FC<{ delay?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ delay = 0, style, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(8px)',
      transition: `opacity 0.4s ${EASE} ${delay}s, transform 0.4s ${EASE} ${delay}s`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
};

const SH: React.FC<{ label: string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily:'"JetBrains Mono",monospace', fontSize: 11, fontWeight: 600,
      letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

const Sev: React.FC<{ sev: string }> = ({ sev }) => {
  const s = SEV_MAP[sev] || SEV_MAP.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 5,
      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.8px', color: s.color, background: s.bg,
      border: `1px solid ${s.color}30`,
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

const Sparkline: React.FC<{ data: number[]; width?: number; height?: number }> = ({
  data, width = 220, height = 48,
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
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#spark-grad)" />
      <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={data.length - 1} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5" fill={C.accent} stroke={C.bg} strokeWidth="1.5" />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   LIVE THREATS PAGE
   ═══════════════════════════════════════════════════════════════════════════════════ */

const LiveThreats: React.FC = () => {
  const navigate = useNavigate();
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
      minHeight:'100%', background: C.bg, color: C.text,
      fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0; transform:translateX(-4px);} to{opacity:1; transform:translateX(0);} }
        ::selection { background: rgba(0,212,255,0.12); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid rgba(0,212,255,0.4); outline-offset: 2px; border-radius: 3px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textSec}; }
      `}</style>

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 28px',
          display:'flex', alignItems:'center', height: 52, gap: 14,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, flexShrink:0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: `${C.accent}10`, border: `1px solid ${C.accent}25`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShieldAlert size={15} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing:'3px', color: C.text }}>WATCHTOWER</span>
          </div>
          <div style={{ width:1, height:16, background: C.border, flexShrink:0 }} />
          <span style={{ fontSize: 10, color: C.textSec, letterSpacing:'0.8px', flexShrink:0 }}>
            PS-26145 · LIVE THREATS
          </span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
              background: `${C.red}08`, border: `1px solid ${C.red}25`, borderRadius: 4,
            }}>
              <span style={{
                width:6, height:6, borderRadius:'50%', background: C.red,
                animation:'wt-pulse 1.6s ease-in-out infinite',
                display:'inline-block',
              }} />
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing:'1.2px', color: C.red }}>STREAMING</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
              border:`1px solid var(--border-color)`, borderRadius:4,
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:C.green, display:'inline-block' }} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.5px', color:C.green, fontFamily:'"JetBrains Mono",monospace' }}>DIODE FULL-DUPLEX</span>
            </div>
            <span style={{ fontSize: 11, color: C.textSec, letterSpacing:'0.5px', fontVariantNumeric:'tabular-nums' }}>
              {new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })} &middot; {clock}
            </span>
          </div>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN ────────────────────────────────────────────────── */}
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'24px 28px 64px' }}>

        {/* Page title */}
        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, marginBottom: 4 }}>
            Live Threat Feed
          </h1>
          <p style={{ fontSize: 13, color: C.textSec, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Real-time alert stream — auto-refresh every 2 seconds
          </p>
        </section>

        {/* ── SECTION 1 — Throughput + Severity Summary + Filters ─────────── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr', gap: 12, marginBottom: 20 }}>
          <Panel delay={0.05}>
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap: 20, alignItems:'center' }}>
              {/* Sparkline */}
              <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing:'0.5px', textTransform:'uppercase' }}>Throughput</span>
                <Sparkline data={throughput} width={200} height={48} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: C.text, fontVariantNumeric:'tabular-nums' }}>
                    {throughput[throughput.length - 1]}
                  </span>
                  <span style={{ fontSize: 10, color: C.textDim }}>alerts/s</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap: 12 }}>
                {/* Severity count badges */}
                <div style={{ display:'flex', gap: 6, alignItems:'center', flexWrap:'wrap' }}>
                  {([
                    { k:'critical', label:'Critical', c: C.red },
                    { k:'high', label:'High', c: C.orange },
                    { k:'medium', label:'Medium', c: C.amber },
                    { k:'low', label:'Low', c: C.accent },
                  ]).map(s => (
                    <button key={s.k} onClick={() => setFilterSeverity(filterSeverity === s.k ? 'all' : s.k)}
                      style={{
                        padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: 'none',
                        background: filterSeverity === s.k ? `${s.c}15` : 'transparent',
                        color: s.c, fontSize: 12, fontWeight: 600,
                        fontFamily: '"Inter",system-ui,sans-serif',
                        transition: `all 0.2s ${EASE}`,
                        display:'flex', alignItems:'center', gap: 6,
                      }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{severityCounts[s.k]}</span>
                      <span style={{ fontSize: 11 }}>{s.label}</span>
                    </button>
                  ))}
                  <div style={{ padding: '5px 12px', borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    display:'flex', alignItems:'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform:'uppercase' }}>Total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric:'tabular-nums' }}>
                      {filteredAlerts.length}
                    </span>
                  </div>
                </div>

                {/* Filter controls */}
                <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
                  {/* Threat type chips */}
                  <div style={{ display:'flex', gap: 4, flexWrap:'wrap', alignItems:'center' }}>
                    {THREAT_TYPES.slice(0, 5).map(type => (
                      <button key={type} onClick={() => toggleType(type)}
                        style={{
                          display:'inline-flex', alignItems:'center', gap: 4, padding:'4px 10px',
                          borderRadius: 6, border: `1px solid ${filterTypes.includes(type) ? C.accent + '40' : C.border}`,
                          background: filterTypes.includes(type) ? `${C.accent}08` : 'transparent',
                          cursor:'pointer', transition: `all 0.2s ${EASE}`,
                          color: filterTypes.includes(type) ? C.text : C.textSec,
                          fontSize: 11, fontWeight: filterTypes.includes(type) ? 600 : 400,
                          fontFamily: '"Inter",system-ui,sans-serif',
                          textTransform:'capitalize',
                        }}>
                        {THREAT_LBL[type]}
                      </button>
                    ))}
                  </div>

                  <div style={{ width:1, height:20, background: C.border, flexShrink:0 }} />

                  {/* Severity dropdown */}
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    style={{
                      padding:'5px 10px', background: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: 6, color: C.text, fontSize: 12,
                      cursor:'pointer', outline:'none',
                    }}
                  >
                    <option value="all">All Severity</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>

                  {/* Search */}
                  <div style={{ position:'relative' }}>
                    <input
                      type="text"
                      placeholder="Search IP or type..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      style={{
                        padding:'5px 10px 5px 30px', background: C.surface,
                        border: `1px solid ${C.border}`, borderRadius: 6, color: C.text,
                        fontSize: 12, width: 180, outline:'none',
                        transition: `border-color 0.2s ${EASE}`,
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = `${C.accent}40`; }}
                      onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
                    />
                    <Search size={14} color={C.textDim} strokeWidth={1.8} style={{
                      position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  </div>

                  <button
                    onClick={clearFilters}
                    style={{
                      padding:'5px 12px', background: 'transparent',
                      border: `1px solid ${C.border}`, borderRadius: 6,
                      color: C.textSec, fontSize: 12, fontWeight: 500,
                      cursor:'pointer', transition: `all 0.2s ${EASE}`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${C.accent}40`; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSec; }}
                  >Reset</button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* ── SECTION 2 — Threat Feed Table ─────────────────────────────────── */}
        <Panel delay={0.1} style={{ marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 0, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            <span style={{
              fontFamily:'"JetBrains Mono",monospace', fontSize: 11, fontWeight: 600,
              letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
            }}>Live Threat Feed</span>
            <span style={{ fontSize: 11, color: C.textSec, letterSpacing:'0.3px' }}>{filteredAlerts.length} events &middot; auto-scroll on</span>
          </div>

          {filteredAlerts.length === 0 ? (
            <div style={{
              padding:'60px 20px', textAlign:'center', color: C.textDim,
              display:'flex', flexDirection:'column', alignItems:'center', gap: 12,
            }}>
              <div style={{ fontSize: 24, opacity: 0.5 }}>No alerts match the current filters</div>
            </div>
          ) : (
            <div style={{ overflowX:'auto', marginTop: 0 }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Time','Threat Class','Source IP','Dest IP','Port','Confidence','Severity','Validity'].map(h => (
                      <th key={h} style={{
                        padding:'10px 14px', textAlign:'left', fontSize: 10, fontWeight: 600,
                        letterSpacing:'0.8px', color: C.textSec,
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
                    const rowBg = fresh ? `${C.red}06` : (idx % 2 === 0 ? 'transparent' : `${C.accent}02`);
                    const validity = (alert.confidence > 0.85 ? 'MEASURED' : alert.confidence > 0.6 ? 'ESTIMATED' : 'MISSING') as 'MEASURED' | 'ESTIMATED' | 'MISSING';
                    return (
                      <tr key={alert.id} style={{
                        borderBottom: `1px solid ${C.border}30`,
                        background: rowBg,
                        animation: `wt-row-in 0.3s ${EASE} ${Math.min(idx * 0.005, 0.3)}s both`,
                        transition: `background 0.15s ${EASE}`,
                        cursor:'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}06`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                        onClick={() => navigate(`/evidence?alertId=${encodeURIComponent(alert.id)}`)}
                      >
                        <td style={{
                          padding:'10px 14px', fontSize: 12, color: C.textSec,
                          fontFamily:'"JetBrains Mono",monospace', whiteSpace:'nowrap',
                          fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{fmtTime(alert.timestamp)}</td>

                        <td style={{
                          padding:'10px 14px', fontSize: 12, fontWeight: 600,
                          fontFamily:'"JetBrains Mono",monospace',
                          letterSpacing:'0.3px', textTransform:'uppercase', color: tClr,
                        }}>
                          <span style={{
                            display:'inline-block', width:5, height:5, borderRadius:'50%',
                            background: tClr, marginRight: 7, verticalAlign:'middle',
                          }} />
                          {THREAT_LBL[alert.threat_type] || alert.threat_type}
                        </td>

                        <td style={{
                          padding:'10px 14px', fontSize: 12,
                          fontFamily:'"JetBrains Mono",monospace', color: C.accent,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{alert.src_ip}</td>

                        <td style={{
                          padding:'10px 14px', fontSize: 12,
                          fontFamily:'"JetBrains Mono",monospace', color: C.textSec,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{alert.dst_ip}</td>

                        <td style={{
                          padding:'10px 14px', fontSize: 12,
                          fontFamily:'"JetBrains Mono",monospace', color: C.text,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums',
                        }}>{alert.dst_port}</td>

                        <td style={{
                          padding:'10px 14px', fontSize: 12, fontWeight: 600,
                          fontFamily:'"JetBrains Mono",monospace', color: C.green,
                          fontVariantNumeric:'tabular-nums',
                        }}>{alert.confidence.toFixed(1)}%</td>

                        <td style={{ padding:'10px 14px' }}>
                          <Sev sev={alert.severity} />
                        </td>

                        <td style={{ padding:'10px 14px' }}>
                          <ValidityChip validity={validity} />
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
        <Panel delay={0.15} style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: C.textDim }}>
            WATCHTOWER v3.2.1 &middot; EKADHARA &middot; NTRO SIH26
          </span>
          <span style={{ fontSize: 11, color: C.textDim, fontVariantNumeric:'tabular-nums' }}>
            Auto-refresh 2s &middot; {filteredAlerts.length} filtered &middot; {alerts.length} total
          </span>
        </Panel>

      </main>
    </div>
  );
};

export default LiveThreats;
