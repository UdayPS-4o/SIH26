import { useState, useEffect, useMemo, useRef } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../context/ThemeContext';
import { getLocalAlerts, clearLocalAlerts } from '../lib/localAttacks';
import ValidityChip from '../components/ValidityChip';
import { ShieldAlert, Search, AlertTriangle } from 'lucide-react';
import { Alert } from '../types';

const MONO = '"JetBrains Mono",monospace';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const TRANS = 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });
const rand = (lo: number, hi: number) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randIP = () => [rand(1,223), rand(0,255), rand(0,255), rand(1,254)].join('.');
let _aid = 0;
const nextId = () => `LT-${Date.now().toString(36).toUpperCase()}-${(++_aid).toString(36).toUpperCase()}`;

const COMMON_PORTS = [22,23,25,53,80,110,143,443,445,993,3306,3389,5432,5900,8080,8443,1433,6379,9200,27017];
const PROTOCOLS = ['TCP','UDP','ICMP','DNS','TLS','HTTP','HTTPS'] as const;

interface AlertData {
  id: string;
  timestamp: number;
  threat_type: string;
  severity: 'critical'|'high'|'medium'|'low';
  confidence: number;
  src_ip: string;
  dst_ip: string;
  dst_port: number;
  src_port: number;
  protocol: string;
  evidence: Record<string, any>;
  flow_count: number;
}

function makeAlert(overrides?: Partial<AlertData>): AlertData {
  const threat_type = overrides?.threat_type ?? pick(['ddos','beaconing','dga','dns_tunnel','port_scan','exfiltration','tls_anomaly','malware','phishing']);
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

const Panel: React.FC<{ delay?: number; style?: React.CSSProperties; padding?: string; children: React.ReactNode }> = ({ delay = 0, style, padding, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      border: `1px solid var(--border-color)`, borderRadius: 10,
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(8px)',
      transition: `opacity 0.4s ${EASE} ${delay}s, transform 0.4s ${EASE} ${delay}s`,
      boxShadow: '0 1px 3px var(--shadow-sm)',
      ...style,
    }}>
      <div style={{ padding: padding || '20px 24px' }}>{children}</div>
    </div>
  );
};

const SH: React.FC<{ label: string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    paddingBottom: 12, marginBottom: 16, borderBottom: `1px solid var(--border-color)`,
  }}>
    <span style={{
      fontFamily: MONO, fontSize: 11, fontWeight: 600,
      letterSpacing: '2px', color: 'var(--accent-cyan)', textTransform: 'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

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
          <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill="url(#spark-grad)" />
      <polyline points={pts} fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={data.length - 1} cy={height - ((data[data.length - 1] - min) / range) * (height - 4) - 2}
        r="2.5" fill="var(--accent-cyan)" stroke="var(--bg-primary)" strokeWidth="1.5" />
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   LIVE THREATS PAGE
   ═══════════════════════════════════════════════════════════════════════════════════ */

const LiveThreats: React.FC = () => {
  const { C } = useTheme();
  const { alerts: wsAlerts, isConnected, backendOnline, flowsPerSec } = useWebSocketContext();
  const [clock, setClock] = useState(now());
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const tableRef = useRef<HTMLDivElement>(null);
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);

  /* ── Poll localStorage for locally-launched attacks ───────────── */
  useEffect(() => {
    const poll = setInterval(() => {
      setLocalAlerts(getLocalAlerts());
    }, 500);
    return () => clearInterval(poll);
  }, []);

  const mountTimeRef = useRef<number>(Date.now());

  /* ── Only show alerts that arrived AFTER this page was opened ─────────── */
  const liveAlerts = useMemo(() => {
    const freshLocal = localAlerts.filter(a => (a.timestamp || 0) >= mountTimeRef.current);
    const freshWs = wsAlerts.filter(a => (a.timestamp || 0) >= mountTimeRef.current);
    return [...freshLocal, ...freshWs];
  }, [wsAlerts]);

  /* ── Clock ──────────────────────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Auto-scroll ────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (autoScroll && tableRef.current) {
      tableRef.current.scrollTop = 0;
    }
  }, [liveAlerts.length, autoScroll]);

  /* ── Filters ────────────────────────────────────────────────────────────── */
  const filteredAlerts = useMemo(() => {
    let result = liveAlerts;
    if (filterSeverity !== 'all') result = result.filter(a => a.severity === filterSeverity);
    if (filterTypes.length > 0) {
      result = result.filter(a => filterTypes.some(t =>
        (a.threat_type || '').toLowerCase().includes(t.toLowerCase())
      ));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(a =>
        (a.src_ip || '').includes(q) || (a.dst_ip || '').includes(q) || (a.threat_type || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [liveAlerts, filterSeverity, filterTypes, searchQuery]);

  const toggleType = (type: string) => {
    setFilterTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    liveAlerts.forEach(a => {
      const s = (a.severity as string) || 'medium';
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [liveAlerts]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    liveAlerts.forEach(a => {
      const t = a.threat_type || 'unknown';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [liveAlerts]);

  const clearFilters = () => {
    setFilterSeverity('all');
    setFilterTypes([]);
    setSearchQuery('');
  };

  const THREAT_TYPES = ['ddos','beaconing','dga','dns_tunnel','port_scan','exfiltration','tls_anomaly','malware','phishing'];
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

  /* ═══════════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{
      minHeight:'100%', background: C.bg, color: C.text,
      fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6,
    }}>
      <style>{`
        ::selection { background: var(--accent-cyan); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid var(--border-active); outline-offset: 2px; border-radius: 3px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textSec}; }
        @keyframes hud-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
      `}</style>

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 28px',
          display:'flex', alignItems:'center', height: 52, gap: 12,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 10, flexShrink:0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: `var(--accent-cyan)10`, border: `1px solid var(--accent-cyan)25`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShieldAlert size={15} color="var(--accent-cyan)" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing:'3px', color: C.text }}>EKADHARA</span>
          </div>
          <div style={{ width:1, height:16, background: C.border, flexShrink:0 }} />
          <span style={{ fontSize: 10, color: C.textSec, letterSpacing:'0.8px', flexShrink:0 }}>
            PS-26145 · LIVE THREATS
          </span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 10px',
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5,
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background: C.green,
                boxShadow: `0 0 4px ${C.green}`,
                animation: isConnected ? 'hud-pulse 1.5s ease-in-out infinite' : 'none',
                display:'inline-block' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600,
                color: 'var(--color-success)', letterSpacing: '0.6px' }}>
                {isConnected ? 'LIVE' : 'DEMO'}
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
              border:`1px solid var(--border-color)`, borderRadius:5,
            }}>
              <span style={{ width:5, height:5, borderRadius:'50%',
                background: backendOnline ? C.green : 'var(--text-muted)', display:'inline-block' }} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'0.5px',
                color: backendOnline ? C.green : 'var(--text-muted)',
                fontFamily: MONO }}>
                {backendOnline ? 'DIODE ACTIVE' : 'DIODE STANDBY'}
              </span>
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
        <section style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, marginBottom: 4 }}>
            Live Threat Feed
          </h1>
          <p style={{ fontSize: 12, color: C.textSec, maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Real-time alert stream from the backend detection pipeline.
          </p>
        </section>

        {/* ── SECTION 1 — Throughput + Severity Summary + Filters ─────────── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr', gap: 12, marginBottom: 24 }}>
          <Panel delay={0.05} padding="14px 18px">
            <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap: 20, alignItems:'center' }}>
              {/* Sparkline */}
              <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing:'0.5px', textTransform:'uppercase' }}>Throughput</span>
                <Sparkline data={[flowsPerSec, flowsPerSec * 0.8, flowsPerSec * 1.2, flowsPerSec * 0.9, flowsPerSec]} width={200} height={48} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: C.text, fontVariantNumeric:'tabular-nums' }}>
                    {flowsPerSec}
                  </span>
                  <span style={{ fontSize: 10, color: C.textDim }}>flows/s</span>
                </div>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
                {/* Severity count badges */}
                <div style={{ display:'flex', gap: 4, alignItems:'center', flexWrap:'wrap' }}>
                  {([
                    { k:'critical', label:'Critical', c: C.red },
                    { k:'high', label:'High', c: C.orange },
                    { k:'medium', label:'Medium', c: C.amber },
                    { k:'low', label:'Low', c: C.accent },
                  ]).map(s => {
                    const isActive = filterSeverity === s.k;
                    return (
                      <button key={s.k} onClick={() => setFilterSeverity(filterSeverity === s.k ? 'all' : s.k)}
                        style={{
                          padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                          border: `1px solid ${isActive ? `${s.c}30` : 'var(--border-color)'}`,
                          background: isActive ? `var(--color-${s.k === 'critical' ? 'danger' : s.k === 'high' ? 'warning' : s.k === 'medium' ? 'warning' : 'info'}-dim, ${s.c}10)` : 'transparent',
                          color: s.c, fontSize: 12, fontWeight: isActive ? 700 : 500,
                          transition: TRANS,
                          display:'inline-flex', alignItems:'center', gap: 6,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${s.c}12`; e.currentTarget.style.borderColor = `${s.c}30`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isActive ? `${s.c}10` : 'transparent'; e.currentTarget.style.borderColor = isActive ? `${s.c}30` : 'var(--border-color)'; }}
                      >
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{severityCounts[s.k]}</span>
                        <span style={{ fontSize: 11 }}>{s.label}</span>
                      </button>
                    );
                  })}
                  <div style={{ padding: '5px 12px', borderRadius: 6,
                    border: `1px solid var(--border-color)`,
                    display:'inline-flex', alignItems:'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: C.textSec, textTransform:'uppercase', letterSpacing:'0.5px' }}>Total</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontVariantNumeric:'tabular-nums' }}>
                      {filteredAlerts.length}
                    </span>
                  </div>
                </div>

                {/* Filter controls row */}
                <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
                  {/* Auto-scroll toggle */}
                  <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    style={{
                      display:'inline-flex', alignItems:'center', gap: 6,
                      padding: '4px 10px', borderRadius: 5,
                      border: `1px solid ${autoScroll ? 'var(--accent-cyan)30' : 'var(--border-color)'}`,
                      background: autoScroll ? 'var(--accent-cyan)10' : 'transparent',
                      color: autoScroll ? 'var(--accent-cyan)' : C.textSec,
                      fontSize: 10, fontWeight: 600, cursor: 'pointer',
                      transition: TRANS,
                      fontFamily: MONO, letterSpacing:'0.5px',
                    }}
                    title="Auto-scroll to newest alerts"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    AUTO-SCROLL
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: autoScroll ? 'var(--accent-cyan)' : C.textDim,
                      boxShadow: autoScroll ? `0 0 4px var(--accent-cyan)` : 'none',
                    }} />
                  </button>

                  <div style={{ width:1, height:18, background: C.border, flexShrink:0 }} />

                  {/* Severity dropdown */}
                  <select
                    value={filterSeverity}
                    onChange={e => setFilterSeverity(e.target.value)}
                    style={{
                      padding:'5px 10px', background: C.surface, border: `1px solid var(--border-color)`,
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
                        padding:'6px 10px 6px 28px', background: C.surface,
                        border: `1px solid var(--border-color)`, borderRadius: 6, color: C.text,
                        fontSize: 12, width: 170, outline:'none',
                        transition: `border-color 0.2s ${EASE}`,
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)40'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    />
                    <Search size={13} color={C.textDim} strokeWidth={1.8} style={{
                      position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
                  </div>

                  {/* Reset */}
                  <button
                    onClick={clearFilters}
                    style={{
                      padding:'5px 12px', background: 'transparent',
                      border: `1px solid var(--border-color)`, borderRadius: 6,
                      color: C.textSec, fontSize: 12, fontWeight: 500,
                      cursor:'pointer', transition: TRANS,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-cyan)40'; e.currentTarget.style.color = C.text; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.color = C.textSec; }}
                  >Reset</button>
                </div>
              </div>
            </div>
          </Panel>
        </section>

        {/* ── SECTION 2 — Threat Feed Table ─────────────────────────────────── */}
        <Panel delay={0.1} style={{ marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom: 12, marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              letterSpacing: '2px', color: 'var(--accent-cyan)', textTransform: 'uppercase',
            }}>Live Threat Feed</span>
            <span style={{ fontSize: 11, color: C.textSec, letterSpacing:'0.3px' }}>
              {filteredAlerts.length} events &middot;
              <span style={{
                display:'inline-flex', alignItems:'center', gap:4, marginLeft:6,
                color: autoScroll ? 'var(--color-success)' : C.textDim,
              }}>
                <span style={{
                  width:5, height:5, borderRadius:'50%',
                  background: autoScroll ? 'var(--color-success)' : C.textDim,
                  boxShadow: autoScroll ? `0 0 4px var(--color-success)` : 'none',
                }} />
                auto-scroll {autoScroll ? 'on' : 'off'}
              </span>
            </span>
          </div>

          {filteredAlerts.length === 0 ? (
            /* ── Empty state ── */
            <div style={{
              padding:'60px 20px', textAlign:'center',
              display:'flex', flexDirection:'column', alignItems:'center', gap: 14,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: C.surfaceHi, border: `1px solid ${C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <AlertTriangle size={24} color={C.textDim} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 4 }}>No alerts match the current filters</div>
                <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.5 }}>Try adjusting your severity, threat type, or search criteria to see results.</div>
              </div>
              <button onClick={clearFilters} style={{
                padding:'7px 18px', borderRadius: 6,
                border: `1px solid var(--accent-cyan)30`,
                background: 'var(--accent-cyan)10',
                color: 'var(--accent-cyan)', fontSize: 12, fontWeight: 600,
                cursor:'pointer', transition: TRANS,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-cyan)18'; e.currentTarget.style.borderColor = 'var(--accent-cyan)50'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-cyan)10'; e.currentTarget.style.borderColor = 'var(--accent-cyan)30'; }}
              >Clear all filters</button>
            </div>
          ) : (
            <div ref={tableRef} style={{ overflowX:'auto', marginTop: 0, maxHeight: 520, overflowY: 'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                    {['Time','Threat Class','Source IP','Dest IP','Port','Confidence','Severity','Validity'].map(h => (
                      <th key={h} style={{
                        padding:'8px 12px', textAlign:'left', fontSize: 10, fontWeight: 600,
                        letterSpacing:'0.8px', color: C.textSec,
                        fontFamily: MONO,
                        textTransform:'uppercase', whiteSpace:'nowrap',
                        background: C.surfaceHi,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((alert, idx) => {
                    const fresh = idx < 5;
                    const tClr = THREAT_CLR[alert.threat_type?.toLowerCase()] || 'var(--accent-cyan)';
                    const validity = (alert.confidence >= 85 ? 'MEASURED' : alert.confidence >= 60 ? 'ESTIMATED' : 'MISSING') as 'MEASURED' | 'ESTIMATED' | 'MISSING';
                    const sevClr = { critical: 'var(--accent-red)', high: 'var(--accent-orange)', medium: 'var(--accent-yellow)', low: 'var(--accent-cyan)' }[alert.severity] || 'var(--accent-cyan)';
                    const rowBg = fresh
                      ? `var(--color-danger-dim, rgba(220,38,38,0.04))`
                      : idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)';
                    return (
                      <tr key={alert.id} style={{
                        borderBottom: '1px solid var(--border-color)',
                        background: rowBg,
                        transition: `background 0.15s ${EASE}`,
                        cursor:'pointer',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--table-hover-bg)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = rowBg; }}
                      >
                        <td style={{
                          padding:'8px 12px', fontSize: 11, color: C.textSec,
                          fontFamily: MONO, whiteSpace:'nowrap',
                          fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{fmtTime(alert.timestamp)}</td>

                        <td style={{
                          padding:'8px 12px', fontSize: 11, fontWeight: 600,
                          fontFamily: MONO,
                          letterSpacing:'0.3px', textTransform:'uppercase', color: tClr,
                        }}>
                          <span style={{
                            display:'inline-block', width:4, height:4, borderRadius:'50%',
                            background: tClr, marginRight: 5, verticalAlign:'middle',
                          }} />
                          {(THREAT_LBL as Record<string,string>)[alert.threat_type] || alert.threat_type}
                        </td>

                        <td style={{
                          padding:'8px 12px', fontSize: 11,
                          fontFamily: MONO, color: C.accent,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{alert.src_ip}</td>

                        <td style={{
                          padding:'8px 12px', fontSize: 11,
                          fontFamily: MONO, color: C.textSec,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums', letterSpacing:'0.2px',
                        }}>{alert.dst_ip}</td>

                        <td style={{
                          padding:'8px 12px', fontSize: 11,
                          fontFamily: MONO, color: C.text,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums',
                        }}>{alert.dst_port}</td>

                        <td style={{
                          padding:'8px 12px', fontSize: 11,
                          fontFamily: MONO,
                          color: C.textSec, fontVariantNumeric:'tabular-nums',
                        }}>{alert.confidence.toFixed(1)}</td>

                        <td style={{ padding:'6px 10px' }}>
                          <span style={{
                            display:'inline-flex', alignItems:'center', gap: 4,
                          }}>
                            <span style={{ width:4, height:4, borderRadius:'50%', background: sevClr }} />
                            <span style={{ fontSize: 9, fontFamily: MONO, fontWeight: 600, letterSpacing:'0.5px', textTransform:'uppercase', color: sevClr }}>{alert.severity}</span>
                          </span>
                        </td>

                        <td style={{ padding:'6px 10px' }}>
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

        {/* ── Footer ─────────────────────────────────────────────────────────── */}
        <div style={{
          padding:'16px 0', borderTop: `1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
        }}>
          <span style={{ fontSize:11, color: C.textDim }}>
            EKADHARA v3.2.1 &middot; NTRO SIH26
          </span>
          <span style={{ fontSize:11, color: C.textDim, fontVariantNumeric:'tabular-nums' }}>
            WebSocket: {isConnected ? 'connected' : 'disconnected'} &middot; {filteredAlerts.length} filtered &middot; {liveAlerts.length} total
          </span>
        </div>

      </main>
    </div>
  );
};

export default LiveThreats;
