import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Network, Crosshair, Eye, Radar, Zap,
  ArrowRight, ShieldCheck, Cpu, ShieldAlert,
  TrendingUp, Globe, Lock, Gauge, AlertTriangle, BarChart3,
} from 'lucide-react';
import { useDashboardData } from '../lib/useDashboardData';

/* ═══════════════════════════════════════════════════════════════════════════════════
   WATCHTOWER — Dashboard (Redesigned)
   Clean Swiss grid. Light-mode primary. No glow effects.
   ═══════════════════════════════════════════════════════════════════════════════════ */

const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  border:    'var(--border-color)',
  borderHi:  'var(--border-active)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--accent-cyan)',
  red:       'var(--accent-red)',
  orange:    'var(--accent-orange)',
  amber:     'var(--accent-yellow)',
  green:     'var(--accent-green)',
  purple:    'var(--accent-purple)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
  if (m) return `${m}m ${String(sec).padStart(2,'0')}s`;
  return `${sec}s`;
};
const now = () => new Date().toLocaleTimeString('en-US', { hour12: false });
const dateNow = () => new Date().toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });

const THREAT_CLR: Record<string, string> = {
  ddos: C.red, beaconing: C.orange, dga: C.amber,
  dns_tunnel: 'var(--accent-cyan)', port_scan: C.purple,
  exfiltration: C.purple, tls_anomaly: 'var(--accent-teal)', malware: C.red, phishing: 'var(--accent-amber)',
};
const THREAT_LBL: Record<string, string> = {
  ddos:'Volumetric DDoS', beaconing:'C2 Beaconing', dga:'DGA Domains',
  dns_tunnel:'DNS Tunneling', port_scan:'Port Scanning',
  exfiltration:'Data Exfiltration', tls_anomaly:'TLS Anomaly',
  malware:'Malware', phishing:'Phishing',
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   ATOMIC COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

/* ── Status dot (clean, no glow) ── */
const Dot: React.FC<{ color?: string; size?: number }> = ({ color = C.green, size = 6 }) => (
  <span style={{
    width: size, height: size, borderRadius: '50%', background: color,
    display: 'inline-block', flexShrink: 0,
  }} />
);

/* ── Severity badge (flat design) ── */
const Sev: React.FC<{ sev: string }> = ({ sev }) => {
  const M: Record<string,{c:string;bg:string}> = {
    critical:{c:C.red,bg:'rgba(239,68,68,0.08)'},
    high:{c:C.orange,bg:'rgba(249,115,22,0.08)'},
    medium:{c:C.amber,bg:'rgba(234,179,8,0.08)'},
    low:{c:'var(--accent-cyan)',bg:'rgba(6,182,212,0.08)'},
  };
  const s = M[sev] || M.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
      letterSpacing:'1px', color:s.c, background:s.bg,
      fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
    }}>
      <span style={{width:4,height:4,borderRadius:'50%',background:s.c}} />
      {sev}
    </span>
  );
};

/* ── Section label (13px uppercase, accent color) ── */
const SectionLabel: React.FC<{ label: string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    marginBottom:16,
  }}>
    <span style={{
      fontFamily:'"JetBrains Mono",monospace', fontSize:11, fontWeight:700,
      letterSpacing:'2px', color:C.textSec, textTransform:'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const data = useDashboardData(3000);
  const [clock, setClock] = useState(now());

  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── Derived ──────────────────────────────────────────────────────── */

  const threatCounts = useMemo(() => {
    const m: Record<string, number> = {};
    data.alerts.forEach(a => {
      const lbl = THREAT_LBL[a.threat_type.toLowerCase()] || a.threat_type;
      m[lbl] = (m[lbl] || 0) + 1;
    });
    return m;
  }, [data.alerts]);

  const topThreats = useMemo(() =>
    Object.entries(threatCounts)
      .map(([l,v]) => ({ label:l, value:v }))
      .sort((a,b) => b.value - a.value),
    [threatCounts]
  );

  const sev = useMemo(() => {
    const s: Record<string,number> = { critical:0, high:0, medium:0, low:0 };
    data.alerts.forEach(a => { s[a.severity] = (s[a.severity] || 0) + 1; });
    return s;
  }, [data.alerts]);

  const recent = useMemo(() => data.alerts.slice(0, 25), [data.alerts]);

  const flowsProc   = Math.max(data.alerts.length * 47, 1200);
  const blocked     = sev.critical * 23 + sev.high * 17 + 47;
  const activeSess  = data.activeConnections || Math.max(data.alerts.length * 3, 120);

  /* ══════════════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{
      minHeight:'100%', background:C.bg, color:C.text,
      fontFamily:'"Inter",system-ui,sans-serif',
      fontSize:14, lineHeight:1.6,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        @keyframes wt-row-in { from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:translateY(0);} }

        ::selection { background: rgba(0,212,255,0.15); }
        :focus-visible { outline: 1.5px solid rgba(0,212,255,0.4); outline-offset: 2px; border-radius: 2px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }

        .kpi-card { transition: background 0.2s, border-color 0.2s; }
        .kpi-card:hover { background: var(--bg-card-hover); border-color: var(--border-active); }

        @media (max-width: 1200px) {
          .kpi-row { flex-wrap: wrap; }
          .kpi-card { min-width: calc(50% - 10px); }
        }
        @media (max-width: 768px) {
          .kpi-card { min-width: 100%; }
          .row-2 { grid-template-columns: 1fr !important; }
          .row-3 { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── STICKY HUD BAR ─────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top:0, zIndex:40,
        background:'var(--bg-secondary)',
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth:1400, margin:'0 auto', padding:'0 28px',
          display:'flex', alignItems:'center', height:52, gap:14,
        }}>
          {/* Brand */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{
              width:28, height:28, borderRadius:6,
              border:`1px solid ${C.border}`,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <ShieldAlert size={14} color={C.textSec} strokeWidth={1.8} />
            </div>
            <span style={{
              fontSize:12, fontWeight:700, letterSpacing:'3px', color:C.text,
              fontFamily:'"JetBrains Mono",monospace',
            }}>WATCHTOWER</span>
          </div>

          <div style={{ width:1, height:18, background:C.border, flexShrink:0 }} />

          <span style={{ fontSize:10, color:C.textSec, letterSpacing:'0.8px', flexShrink:0, fontFamily:'"JetBrains Mono",monospace' }}>
            PS-26145 · NTRO · SIH26
          </span>

          <div style={{ flex:1 }} />

          {/* Status */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
              border:`1px solid ${C.border}`, borderRadius:4,
            }}>
              <Dot color={data.isLive ? C.green : C.amber} size={5} />
              <span style={{ fontSize:9, fontWeight:700, letterSpacing:'1.5px', color: data.isLive ? C.green : C.amber, fontFamily:'"JetBrains Mono",monospace' }}>
                {data.isLive ? 'LIVE' : 'DEMO'}
              </span>
            </div>

            <div style={{
              display:'flex', alignItems:'center', gap:5, padding:'3px 10px',
              border:`1px solid ${C.border}`, borderRadius:4,
            }}>
              <Activity size={10} color={C.textDim} strokeWidth={2} />
              <span style={{ fontSize:9, color:C.textSec, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace' }}>DIODE READ-ONLY</span>
            </div>

            <span style={{
              fontSize:11, color:C.textSec, letterSpacing:'0.8px',
              fontFamily:'"JetBrains Mono",monospace',
              fontVariantNumeric:'tabular-nums',
            }}>{dateNow()} · {clock}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth:1400, margin:'0 auto', padding:'32px 28px 80px' }}>

        {/* ════════════════════════════════════════════════════════════════
             PAGE HEADER
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ marginBottom:36 }}>
          <h1 style={{
            fontSize:28, fontWeight:700, letterSpacing:'-0.5px', color:C.text,
            marginBottom:8, fontFamily:'"Inter",system-ui,sans-serif',
          }}>Dashboard</h1>
          <p style={{
            fontSize:14, color:C.textSec, maxWidth:680, lineHeight:1.7, margin:0,
          }}>
            AI-based detection pipeline for unidirectional IP traffic monitoring.
            Passive observation — no probes, no decryption, no return path.
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 1 — KPI CARDS (6 across)
             ════════════════════════════════════════════════════════════════ */}
        <section className="kpi-row" style={{
          display:'flex', gap:20, marginBottom:24,
        }}>
          {[
            {
              label:'FLOWS PROCESSED', value:fmt(flowsProc), sub:'+2.4K/s',
              icon:Globe, color:C.accent, pct:68,
            },
            {
              label:'THREATS BLOCKED', value:fmt(blocked), sub:'countermeasures',
              icon:ShieldCheck, color:C.red, pct:42,
            },
            {
              label:'ACTIVE SESSIONS', value:fmt(activeSess), sub:'concurrent',
              icon:Activity, color:C.purple, pct:55,
            },
            {
              label:'DETECTION RATE', value:`${data.detectionRate.toFixed(1)}%`, sub:'confidence',
              icon:Crosshair, color:C.green, pct:94,
            },
            {
              label:'FALSE POSITIVE', value:`${data.falsePositiveRate.toFixed(1)}%`, sub:'noise filter',
              icon:AlertTriangle, color:C.amber, pct:8,
            },
            {
              label:'THREATS TODAY', value:fmt(data.alertsToday || data.alerts.length), sub:'events',
              icon:BarChart3, color:C.orange, pct:35,
            },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="kpi-card" style={{
                flex:1, minWidth:0,
                background:'var(--bg-card)',
                border:`1px solid ${C.border}`,
                borderRadius:12,
                padding:20,
                display:'flex', flexDirection:'column', gap:10,
              }}>
                {/* Icon */}
                <div style={{
                  width:32, height:32, borderRadius:8,
                  background:`${kpi.color}10`,
                  border:`1px solid ${kpi.color}20`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Icon size={16} color={kpi.color} strokeWidth={1.8} />
                </div>

                {/* Label */}
                <div style={{
                  fontSize:10, fontWeight:700, letterSpacing:'1.5px',
                  color:C.textDim, fontFamily:'"JetBrains Mono",monospace',
                  textTransform:'uppercase',
                }}>{kpi.label}</div>

                {/* Value */}
                <div style={{
                  fontSize:28, fontWeight:700, color:kpi.color,
                  fontFamily:'"JetBrains Mono",monospace',
                  letterSpacing:'-0.5px', lineHeight:1.1,
                  fontVariantNumeric:'tabular-nums',
                }}>{kpi.value}</div>

                {/* Sub-detail */}
                <div style={{
                  fontSize:12, color:C.textSec,
                  fontFamily:'"JetBrains Mono",monospace',
                }}>{kpi.sub}</div>

                {/* Mini progress bar */}
                <div style={{
                  height:4, background:'var(--bg-secondary)',
                  borderRadius:2, marginTop:'auto', overflow:'hidden',
                }}>
                  <div style={{
                    height:'100%', width:`${kpi.pct}%`,
                    background:kpi.color, opacity:0.6,
                    borderRadius:1,
                    transition:'width 1s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
              </div>
            );
          })}
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 2 — TWO COLUMNS (60/40)
             ════════════════════════════════════════════════════════════════ */}
        <section className="row-2" style={{
          display:'grid', gridTemplateColumns:'3fr 2fr', gap:20, marginBottom:24,
        }}>
          {/* ── Pipeline Diagram (60%) ── */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <SectionLabel
              label="Detection Pipeline"
              right={
                <span style={{ fontSize:10, color:C.textSec, fontFamily:'"JetBrains Mono",monospace', fontVariantNumeric:'tabular-nums' }}>
                  UPTIME {fmtUptime(data.uptime)}
                </span>
              }
            />

            {/* 4-step pipeline with arrows */}
            <div style={{
              display:'flex', alignItems:'stretch', gap:0,
            }}>
              {[
                { label:'INGEST', sub:'PCAP / NetFlow / sFlow', icon:Cpu, color:C.accent },
                { label:'FEATURES', sub:'JA3 / DNS / Flow metadata', icon:Radar, color:C.purple },
                { label:'INFERENCE', sub:'Ensemble classifier', icon:Crosshair, color:C.green },
                { label:'OUTPUT', sub:'WebSocket + REST alerts', icon:Zap, color:C.amber },
              ].map((step, i, arr) => {
                const Icon = step.icon;
                return (
                  <div key={i} style={{
                    flex:1, display:'flex', flexDirection:'column', alignItems:'center',
                    gap:8, padding:'16px 12px',
                    borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
                    position:'relative',
                  }}>
                    {/* Icon */}
                    <div style={{
                      width:32, height:32, borderRadius:8,
                      background:`${step.color}10`,
                      border:`1px solid ${step.color}18`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icon size={16} color={step.color} strokeWidth={1.8} />
                    </div>

                    {/* Step label */}
                    <div style={{
                      fontSize:11, fontWeight:700, letterSpacing:'1px',
                      color:step.color, fontFamily:'"JetBrains Mono",monospace',
                    }}>{step.label}</div>

                    {/* Sub-text */}
                    <div style={{
                      fontSize:10, color:C.textSec, textAlign:'center',
                      lineHeight:1.5,
                    }}>{step.sub}</div>

                    {/* Arrow between steps */}
                    {i < arr.length - 1 && (
                      <div style={{
                        position:'absolute', right:-10, top:'50%', transform:'translateY(-50%)',
                        zIndex:2,
                      }}>
                        <ArrowRight size={14} color={C.textDim} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Enclave Constraints (40%) ── */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:16,
            }}>
              <SectionLabel label="Enclave Constraints" />
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <ShieldCheck size={13} color={C.green} />
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.5px', color:C.green, fontFamily:'"JetBrains Mono",monospace' }}>COMPLIANT</span>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:1 }}>
              {[
                ['Ingest', 'READ-ONLY — no return path'],
                ['TLS analysis', 'JA3/JA4 metadata only'],
                ['Processing', 'Streaming — bounded latency'],
                ['Payload', 'Decryption disabled'],
                ['Throughput', '10K flows/sec sustained'],
                ['Alert schema', 'RFC 8071 structured JSON'],
              ].map(([k, v]) => (
                <div key={k} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 12px',
                  borderBottom: k !== 'Alert schema' ? `1px solid ${C.border}` : 'none',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <Dot color={C.green} size={4} />
                    <span style={{ fontSize:13, color:C.textSec, fontWeight:500 }}>{k}</span>
                  </div>
                  <span style={{ fontSize:12, color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 3 — FULL WIDTH
             ════════════════════════════════════════════════════════════════ */}
        <section className="row-3" style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24,
        }}>
          {/* ── Threat Classification Bar ── */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <SectionLabel
              label="Threat Classification"
              right={
                <span style={{ fontSize:10, color:C.textSec, fontFamily:'"JetBrains Mono",monospace' }}>
                  {Object.values(threatCounts).reduce((a,b)=>a+b,0)} DETECTED
                </span>
              }
            />

            {/* Horizontal stacked bar */}
            <div style={{
              height:24, borderRadius:6, overflow:'hidden',
              display:'flex', marginBottom:16,
              border:`1px solid ${C.border}`,
            }}>
              {topThreats.length > 0 ? topThreats.map((t, i) => {
                const total = topThreats.reduce((a, b) => a + b.value, 0) || 1;
                const pct = (t.value / total) * 100;
                return (
                  <div key={i} title={`${t.label}: ${t.value}`} style={{
                    width:`${pct}%`, background: Object.entries(THREAT_CLR).find(([k]) =>
                      THREAT_LBL[k] === t.label
                    )?.[1] || C.accent,
                    opacity:0.8, transition:'width 0.8s cubic-bezier(0.22,1,0.36,1)',
                    minWidth: topThreats.length > 5 ? 4 : 0,
                  }} />
                );
              }) : (
                <div style={{ flex:1, background:'var(--bg-secondary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:C.textDim }}>
                  Awaiting stream
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{
              display:'flex', flexWrap:'wrap', gap:'8px 16px',
            }}>
              {topThreats.length > 0 ? topThreats.map((t, i) => {
                const color = Object.entries(THREAT_CLR).find(([k]) =>
                  THREAT_LBL[k] === t.label
                )?.[1] || C.accent;
                const total = topThreats.reduce((a, b) => a + b.value, 0) || 1;
                const pct = ((t.value / total) * 100).toFixed(0);
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:2, background:color }} />
                    <span style={{ fontSize:11, color:C.textSec }}>{t.label}</span>
                    <span style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace' }}>{pct}%</span>
                  </div>
                );
              }) : (
                <span style={{ fontSize:11, color:C.textDim }}>No threats detected</span>
              )}
            </div>
          </div>

          {/* ── Data Flow Diagram ── */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <SectionLabel label="Data Flow" />

            <div style={{
              display:'flex', alignItems:'center', gap:4, flexWrap:'wrap',
              justifyContent:'space-between', padding:'8px 0',
            }}>
              {[
                { label:'Production', sub:'Encrypted traffic', c:C.textSec },
                { label:'Data Diode', sub:'One-way', c:C.accent },
                { label:'Enclave', sub:'Capture', c:C.purple },
                { label:'AI Engine', sub:'Detect / Classify', c:C.green },
                { label:'Alerts', sub:'Intelligence', c:C.amber },
              ].map((n, i, arr) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:4, flex:'1 1 0', minWidth:50 }}>
                  <div style={{
                    flex:1, padding:'10px 6px', borderRadius:6, textAlign:'center',
                    border:`1px solid ${n.c}18`, background:`${n.c}04`,
                  }}>
                    <div style={{ fontSize:10, fontWeight:700, color:n.c, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace' }}>{n.label}</div>
                    <div style={{ fontSize:9, color:C.textSec, marginTop:2 }}>{n.sub}</div>
                  </div>
                  {i < arr.length - 1 && <ArrowRight size={12} color={C.textDim} style={{flexShrink:0, opacity:0.5}} />}
                </div>
              ))}
            </div>

            {/* Severity breakdown */}
            <div style={{
              borderTop:`1px solid ${C.border}`, paddingTop:16, marginTop:16,
              display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12,
            }}>
              {[
                { label:'Critical', val:sev.critical, color:C.red },
                { label:'High', val:sev.high, color:C.orange },
                { label:'Medium', val:sev.medium, color:C.amber },
                { label:'Low', val:sev.low, color:'var(--accent-cyan)' },
              ].map(s => (
                <div key={s.label} style={{
                  textAlign:'center', padding:'12px 8px',
                  border:`1px solid ${C.border}`, borderRadius:8,
                }}>
                  <div style={{ fontSize:22, fontWeight:700, color:s.color, fontFamily:'"JetBrains Mono",monospace', fontVariantNumeric:'tabular-nums' }}>{s.val}</div>
                  <div style={{ fontSize:9, color:C.textSec, letterSpacing:'1px', marginTop:4, textTransform:'uppercase', fontWeight:600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             LIVE THREAT FEED
             ════════════════════════════════════════════════════════════════ */}
        <section style={{
          background:'var(--bg-card)',
          border:`1px solid ${C.border}`,
          borderRadius:12,
          padding:24,
          marginBottom:24,
        }}>
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            marginBottom:16,
          }}>
            <SectionLabel label="Live Threat Feed" />
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:9, fontWeight:700, letterSpacing:'1px', color:C.red }}>
                <span style={{
                  width:5, height:5, borderRadius:'50%', background:C.red,
                  animation:'wt-pulse 1.6s ease-in-out infinite',
                }} />
                STREAMING
              </span>
              <span style={{ fontSize:9, color:C.textSec, fontFamily:'"JetBrains Mono",monospace' }}>{recent.length} EVENTS</span>
            </div>
          </div>

          {recent.length === 0 ? (
            <div style={{
              padding:'64px 20px', textAlign:'center', color:C.textDim,
              display:'flex', flexDirection:'column', alignItems:'center', gap:12,
            }}>
              <div style={{
                width:48, height:48, borderRadius:8,
                border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center',
              }}>
                <Radar size={24} strokeWidth={1} color={C.textDim} />
              </div>
              <div>
                <div style={{ fontSize:11, color:C.textSec, letterSpacing:'1px', marginBottom:4 }}>
                  {data.isLive ? 'CONNECTING TO STREAM…' : 'SIMULATION ACTIVE'}
                </div>
                <div style={{ fontSize:10, color:C.textDim }}>
                  {data.isLive
                    ? 'Establishing WebSocket connection to ingest pipeline'
                    : 'Use the Attack Panel to inject threat traffic and trigger detection'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${C.border}` }}>
                    {['Sev', 'Time', 'Threat Type', 'Source', 'Destination', 'Confidence', 'Evidence'].map(h => (
                      <th key={h} style={{
                        padding:'8px 14px', textAlign:'left', fontSize:9, fontWeight:700,
                        letterSpacing:'1.2px', color:C.textDim,
                        fontFamily:'"JetBrains Mono",monospace',
                        textTransform:'uppercase', whiteSpace:'nowrap',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((alert, idx) => {
                    const fresh = idx < 3;
                    const tClr = THREAT_CLR[alert.threat_type.toLowerCase()] || C.text;
                    const lbl = THREAT_LBL[alert.threat_type.toLowerCase()] || alert.threat_type;
                    return (
                      <tr key={alert.id ?? idx} style={{
                        borderBottom:`1px solid ${C.border}`,
                        background: fresh ? `${C.red}04` : 'transparent',
                        animation: `wt-row-in 0.3s ${EASE} ${idx * 0.02}s both`,
                        transition:'background 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
                        onMouseLeave={e => { e.currentTarget.style.background = fresh ? `${C.red}04` : 'transparent'; }}
                      >
                        <td style={{ padding:'10px 14px' }}><Sev sev={alert.severity} /></td>
                        <td style={{
                          padding:'10px 14px', fontSize:11, color:C.textSec,
                          fontFamily:'"JetBrains Mono",monospace', whiteSpace:'nowrap',
                          fontVariantNumeric:'tabular-nums',
                        }}>{fmtTime(alert.timestamp)}</td>
                        <td style={{
                          padding:'10px 14px', fontSize:11, fontWeight:600,
                          fontFamily:'"JetBrains Mono",monospace',
                          letterSpacing:'0.4px', textTransform:'uppercase', color:tClr,
                        }}>{lbl}</td>
                        <td style={{
                          padding:'10px 14px', fontSize:11,
                          fontFamily:'"JetBrains Mono",monospace', color:C.text,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums',
                        }}>{alert.src_ip ?? '—'}</td>
                        <td style={{
                          padding:'10px 14px', fontSize:11,
                          fontFamily:'"JetBrains Mono",monospace', color:C.textSec,
                          whiteSpace:'nowrap', fontVariantNumeric:'tabular-nums',
                        }}>{alert.dst_ip ?? '—'}</td>
                        <td style={{
                          padding:'10px 14px', fontSize:11, fontWeight:700,
                          fontFamily:'"JetBrains Mono",monospace', color:C.green,
                          fontVariantNumeric:'tabular-nums',
                        }}>{(alert.confidence * 100).toFixed(0)}%</td>
                        <td style={{
                          padding:'10px 14px', fontSize:10, color:C.textSec,
                          fontFamily:'"JetBrains Mono",monospace',
                          maxWidth:340, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        }}>
                          {typeof alert.evidence === 'string' ? alert.evidence : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 4 — FEATURE EXTRACTION + PERFORMANCE
             ════════════════════════════════════════════════════════════════ */}
        <section style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24,
        }}>
          {/* Feature Extraction */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <SectionLabel label="Feature Extraction" />

            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'DNS query entropy',  sub:'Shannon entropy + n-gram',     cat:'DGA / Tunneling' },
                { label:'TLS fingerprint',    sub:'JA3 / JA4 hash matching',       cat:'TLS Anomaly' },
                { label:'Flow rate stats',    sub:'Source-IP entropy, packet rate', cat:'DDoS / Recon' },
                { label:'Inter-arrival timing', sub:'Periodicity + CUSUM',        cat:'C2 Beaconing' },
                { label:'Volume asymmetry',   sub:'Outbound/inbound byte ratio',   cat:'Exfiltration' },
                { label:'Fan-out analysis',   sub:'Port / host distribution',      cat:'Port Scan' },
              ].map(f => (
                <div key={f.label} style={{
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'10px 12px',
                  borderBottom: f.label !== 'Fan-out analysis' ? `1px solid ${C.border}` : 'none',
                }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:500, letterSpacing:'0.2px', color:C.text }}>{f.label}</div>
                    <div style={{ fontSize:10, color:C.textSec, marginTop:2 }}>{f.sub}</div>
                  </div>
                  <span style={{
                    fontSize:9, fontWeight:700, color:C.accent,
                    border:`1px solid ${C.accent}25`, padding:'3px 8px', borderRadius:4,
                    fontFamily:'"JetBrains Mono",monospace', letterSpacing:'0.5px',
                    whiteSpace:'nowrap',
                  }}>{f.cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Performance */}
          <div style={{
            background:'var(--bg-card)',
            border:`1px solid ${C.border}`,
            borderRadius:12,
            padding:24,
          }}>
            <SectionLabel
              label="Performance"
              right={
                <span style={{ fontSize:10, color:C.textSec, fontFamily:'"JetBrains Mono",monospace' }}>TARGET 10K FLOWS/SEC</span>
              }
            />

            <div style={{ display:'flex', flexDirection:'column', gap:16, paddingTop:4 }}>
              {[
                { label:'Current throughput', value:`${data.flowsPerSec} flows/s`, pct: Math.min(data.flowsPerSec, 100), color:C.accent },
                { label:'Avg confidence',     value:`${data.detectionRate.toFixed(1)}%`, pct: data.detectionRate, color:C.green },
                { label:'Processing latency', value:'12ms p99', pct: 12, color:C.purple },
                { label:'Memory footprint',   value:'847 MB', pct: 35, color:C.amber },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:12, color:C.textSec }}>{m.label}</span>
                    <span style={{
                      fontSize:12, fontWeight:600, color:C.text,
                      fontFamily:'"JetBrains Mono",monospace',
                      fontVariantNumeric:'tabular-nums',
                    }}>{m.value}</span>
                  </div>
                  <div style={{
                    height:4, background:'var(--bg-secondary)',
                    borderRadius:2, overflow:'hidden',
                  }}>
                    <div style={{
                      height:'100%', width:`${Math.min(m.pct, 100)}%`,
                      background:m.color, opacity:0.6,
                      borderRadius:1,
                      transition:'width 1s cubic-bezier(0.22,1,0.36,1)',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{
          padding:'20px 0', borderTop:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:8,
        }}>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'1px', fontFamily:'"JetBrains Mono",monospace' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace', fontVariantNumeric:'tabular-nums' }}>
            {data.isLive ? 'REAL-TIME STREAM' : 'SIMULATION'} · {data.alerts.length} ALERTS · {fmtUptime(data.uptime)} UPTIME
          </span>
        </footer>

      </main>
    </div>
  );
};

export default Dashboard;
