import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../lib/useDashboardData';
import { useWebSocketContext } from '../context/WebSocketContext';
import DegradationMatrix, { DegradationRow } from '../components/DegradationMatrix';
import NetworkMap from '../pages/NetworkMap';

/* ═══════════════════════════════════════════════════════════════════════════════════
   WATCHTOWER — Dashboard v3.0
   NTRO Operations Center aesthetic: flat dark surfaces, thin cyan borders,
   terminal alert feed, degradation matrix hero, scanline overlay
   ═══════════════════════════════════════════════════════════════════════════════════ */

const MONO = '"JetBrains Mono","Fira Code",monospace';
const SANS = '"Space Grotesk","Inter",system-ui,sans-serif';

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
  if (m) return `${m}m ${String(sec).padStart(2,'0')}s`;
  return `${sec}s`;
};

/* ── Degradation Matrix static data (mirrors backend model) ──────────────── */

const DEGRADATION_DATA: DegradationRow[] = [
  { threat_type:'DDoS / SYN Flood',   full_rate:94, diode_rate:41, ack_shadow_rate:78,  features_lost:'ACK validation',      severity:'critical', validity:'MEASURED',  icon:'⚡' },
  { threat_type:'C2 Beaconing',       full_rate:91, diode_rate:73, ack_shadow_rate:87,  features_lost:'Return volume',        severity:'high',     validity:'MEASURED',  icon:'📡' },
  { threat_type:'DGA / DNS Tunnel',   full_rate:88, diode_rate:85, ack_shadow_rate:88,  features_lost:'None',                severity:'high',     validity:'ESTIMATED', icon:'🔍' },
  { threat_type:'TLS Fingerprinting', full_rate:86, diode_rate:55, ack_shadow_rate:72,  features_lost:'JA4S fingerprint',    severity:'critical', validity:'MEASURED',  icon:'🔐' },
  { threat_type:'Port Scanning',      full_rate:92, diode_rate:84, ack_shadow_rate:91,  features_lost:'RST validation',      severity:'medium',   validity:'MEASURED',  icon:'🎯' },
  { threat_type:'Data Exfiltration',  full_rate:83, diode_rate:0,  ack_shadow_rate:83,  features_lost:'Entire return channel',severity:'critical', validity:'MEASURED',  icon:'🚨' },
];

/* ═══════════════════════════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

/* ── Top Bar ────────────────────────────────────────────────────────────── */

const TopBar: React.FC<{ isLive: boolean; uptime: number; clock: string }> = ({ isLive, uptime, clock }) => (
  <header style={{
    height: 48, flexShrink: 0,
    background: 'linear-gradient(180deg, var(--color-info-dim) 0%, var(--bg-base) 100%)',
    borderBottom: '1px solid var(--border-default)',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', position: 'relative', zIndex: 40,
  }}>
    {/* Branding */}
    <div style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
      <div style={{
        fontFamily: SANS, fontSize:18, fontWeight:700, letterSpacing:'0.12em',
        color: 'var(--color-accent)',
        textShadow: '0 0 12px var(--text-glow)',
      }}>WATCHTOWER</div>
      <div style={{
        fontFamily: MONO, fontSize:10, color:'var(--text-muted)',
        letterSpacing:'0.06em', borderLeft:'1px solid var(--border-default)', paddingLeft:12,
      }}>PS-26145</div>
    </div>

    {/* Center: LIVE */}
    <div style={{ position:'absolute', left:'50%', transform:'translateX(-50%)', display:'flex', alignItems:'center', gap:8 }}>
      <span style={{
        fontFamily: MONO, fontSize:10, fontWeight:700, letterSpacing:'0.15em',
        color: isLive ? 'var(--color-success)' : 'var(--color-warning)',
        textTransform:'uppercase',
      }}>
        <span style={{
          display:'inline-block', width:7, height:7, borderRadius:'50%', marginRight:6,
          background: isLive ? 'var(--color-success)' : 'var(--color-warning)',
          boxShadow: `0 0 6px ${isLive ? 'var(--color-success)' : 'var(--color-warning)'}`,
          animation:'pulse-live 2s ease-in-out infinite', verticalAlign:'middle',
        }} />
        {isLive ? 'LIVE' : 'DEMO'}
      </span>
    </div>

    {/* Right: clock + uptime */}
    <div style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
      <div style={{ fontFamily:MONO, fontSize:11, color:'var(--text-secondary)', letterSpacing:'0.06em' }}>
        {clock}
      </div>
      <div style={{
        fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
        borderLeft:'1px solid var(--border-default)', paddingLeft:12,
        letterSpacing:'0.04em',
      }}>
        UP {fmtUptime(uptime)}
      </div>
    </div>
  </header>
);

/* ── KPI Card ───────────────────────────────────────────────────────────── */

const KpiCard: React.FC<{
  label: string; value: string; sub?: string;
  borderColor: string; pulse?: boolean;
}> = ({ label, value, sub, borderColor, pulse }) => {
  const prevRef = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 400);
      prevRef.current = value;
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div style={{
      background:'var(--bg-surface)',
      borderLeft: `2px solid ${borderColor}`,
      borderTop: '1px solid var(--border-default)',
      borderRight: '1px solid var(--border-default)',
      borderBottom: '1px solid var(--border-default)',
      padding: '16px 20px',
      position:'relative',
      overflow:'hidden',
      animation: pulse ? 'critical-pulse 1.5s ease-in-out infinite' : 'none',
      ...(flash ? { transition:'background 0.2s', background:'var(--bg-elevated)' } : {}),
    }}>
      <div style={{
        fontFamily: SANS, fontSize:9, fontWeight:600, color:'var(--text-muted)',
        textTransform:'uppercase', letterSpacing:'0.12em', marginBottom:8,
      }}>{label}</div>
      <div style={{
        fontFamily: MONO, fontSize:28, fontWeight:800, color:'var(--text-primary)',
        lineHeight:1.1, letterSpacing:'-0.02em', fontVariantNumeric:'tabular-nums',
        textShadow: flash ? `0 0 12px ${borderColor}40` : 'none',
        transition:'text-shadow 0.2s',
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
          marginTop:4, letterSpacing:'0.04em',
        }}>{sub}</div>
      )}
    </div>
  );
};

/* ── Alert Feed Line ────────────────────────────────────────────────────── */

const AlertLine: React.FC<{ alert: {
  timestamp: number;
  severity: 'low'|'medium'|'high'|'critical';
  threat_type: string;
  src_ip: string;
  dst_ip: string;
  confidence: number;
  evidence: Record<string, any>;
}; index: number;
}> = ({ alert, index }) => {
  const sevColors: Record<string,string> = {
    critical:'var(--color-danger)', high:'var(--color-warning)',
    medium:'var(--accent-yellow)', low:'var(--accent-cyan)',
  };
  const color = sevColors[alert.severity] || 'var(--text-muted)';
  const time = new Date(alert.timestamp).toLocaleTimeString('en-US', { hour12:false });
  const conf = (alert.confidence * 100).toFixed(0);
  const ev = alert.evidence as any;
  const evidenceSummary = typeof ev === 'string'
    ? ev.slice(0, 80)
    : ev?.summary || ev?.description || '—';

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      padding:'5px 16px', fontFamily:MONO, fontSize:11,
      borderLeft: `2px solid ${color}`,
      background: index < 2 ? `${color}08` : 'transparent',
      animation:'alert-slide-in 0.35s cubic-bezier(0.22,1,0.36,1) both',
      animationDelay: `${Math.min(index * 0.03, 0.3)}s`,
      transition:'background 0.2s',
    }} className="alert-line">
      <span style={{ color:'var(--text-muted)', fontSize:10, flexShrink:0, minWidth:72 }}>[{time}]</span>
      <span style={{
        color, fontWeight:700, fontSize:9, letterSpacing:'0.1em',
        textTransform:'uppercase', flexShrink:0, minWidth:68,
      }}>{alert.severity}</span>
      <span style={{ color:'var(--text-primary)', fontWeight:600, flexShrink:0, minWidth:100, letterSpacing:'0.3px', textTransform:'uppercase', fontSize:10 }}>
        {alert.threat_type}
      </span>
      <span style={{ color:'var(--text-secondary)', fontSize:10 }}>from</span>
      <span style={{ color:'var(--accent-cyan)', fontSize:10, flexShrink:0 }}>{alert.src_ip}</span>
      <span style={{ color:'var(--text-muted)', fontSize:10 }}>→</span>
      <span style={{ color:'var(--accent-cyan)', fontSize:10, flexShrink:0 }}>{alert.dst_ip}</span>
      <span style={{ color:'var(--text-muted)', fontSize:9, margin:'0 4px' }}>|</span>
      <span style={{ color:'var(--text-muted)', fontSize:9 }}>conf:</span>
      <span style={{
        color: +conf > 85 ? 'var(--color-danger)' : +conf > 60 ? 'var(--color-warning)' : 'var(--color-info)',
        fontSize:10, fontWeight:600, flexShrink:0,
      }}>{conf}%</span>
      <span style={{
        color:'var(--text-muted)', fontSize:10, overflow:'hidden', textOverflow:'ellipsis',
        whiteSpace:'nowrap', flex:1, textAlign:'right',
      }} title={evidenceSummary}>{evidenceSummary}</span>
    </div>
  );
};

/* ── Throughput Sparkline ───────────────────────────────────────────────── */

const ThroughputSparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const w = 400, h = 140;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pad = 8;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((v - min) / range) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = line + ` L${pts[pts.length-1].x} ${h} L${pts[0].x} ${h} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ display:'block' }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={pad} y1={pad + f * (h - pad*2)} x2={w - pad} y2={pad + f * (h - pad*2)}
          stroke="var(--border-muted)" strokeWidth="0.5" />
      ))}
      <path d={area} fill="url(#spark-grad)" />
      <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={last.x} cy={last.y} r="3" fill="var(--color-accent)" opacity="0.9">
        <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x={w - pad} y={h - 2} textAnchor="end" fill="var(--text-muted)"
        fontFamily={MONO} fontSize="8" letterSpacing="0.5px">flows/s · 60s</text>
    </svg>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const data = useDashboardData(3000);
  const ws = useWebSocketContext();
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { hour12:false }));
  const [showMap, setShowMap] = useState(false);

  /* Clock tick */
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour12:false })), 1000);
    return () => clearInterval(t);
  }, []);

  /* Throughput history buffer (60s window, 1 sample/sec) */
  const throughputRef = useRef<number[]>([]);
  const [throughput, setThroughput] = useState<number[]>([]);

  useEffect(() => {
    throughputRef.current.push(data.flowsPerSec);
    if (throughputRef.current.length > 60) throughputRef.current.shift();
    setThroughput([...throughputRef.current]);
  }, [data.flowsPerSec]);

  /* Alert feed — use WebSocket alerts, cap at 50, newest first */
  const alertFeed = useMemo(() => {
    const all = [...ws.alerts].reverse().slice(0, 50);
    return all;
  }, [ws.alerts]);

  /* Count-up animation key */
  const [kpiTick, setKpiTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setKpiTick(k => k + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const isLive = data.isLive;

  return (
    <div style={{
      minHeight:'100vh', background:'var(--bg-base)',
      fontFamily:'"Inter",system-ui,sans-serif', color:'var(--text-primary)',
    }}>
      {/* ── Inline animation keyframes (required for ops-center feel) ──── */}
      <style>{`
        @keyframes pulse-live {
          0%, 100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.3; transform:scale(1.3); }
        }
        @keyframes alert-slide-in {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes alert-flash {
          0%   { background:var(--flash-color, rgba(239,68,68,0.12)); }
          100% { background:transparent; }
        }
        @keyframes scanline-sweep {
          0%   { transform:translateY(-100%); }
          100% { transform:translateY(100vh); }
        }
        @keyframes count-glow {
          0%   { text-shadow:0 0 8px var(--glow-color, var(--color-accent)); }
          100% { text-shadow:none; }
        }
        @keyframes critical-pulse {
          0%, 100% { box-shadow:inset 0 0 0 rgba(239,68,68,0); }
        50%      { box-shadow:inset 0 0 20px rgba(239,68,68,0.06); }
        }
        @keyframes scanline-h {
          0%   { top:-4px; }
          100% { top:100%; }
        }
        /* Scrollbar for alert feed */
        .alert-feed-scroll::-webkit-scrollbar { width:3px; }
        .alert-feed-scroll::-webkit-scrollbar-track { background:transparent; }
        .alert-feed-scroll::-webkit-scrollbar-thumb { background:var(--accent-cyan); border-radius:2px; }
        .alert-feed-scroll { scrollbar-width:thin; scrollbar-color:var(--accent-cyan) transparent; }
        /* Network map mini */
        .mini-map canvas { border-radius:4px; }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────────── */}
      <TopBar isLive={isLive} uptime={data.uptime} clock={clock} />

      {/* ── SCROLLABLE CONTENT ──────────────────────────────────────── */}
      <main style={{
        maxWidth:1440, margin:'0 auto',
        padding:'20px 24px 80px',
      }}>

        {/* ══════════════════════════════════════════════════════════════
             ROW 0 — ALERT FEED (HERO, full width, 320px)
             ══════════════════════════════════════════════════════════════ */}
        <section style={{
          marginBottom:20,
          background:'var(--bg-base)',
          border:'1px solid var(--border-default)',
          position:'relative',
          overflow:'hidden',
        }}>
          {/* Classification banner */}
          <div style={{
            display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'8px 16px',
            background:'linear-gradient(90deg, var(--color-info-dim) 0%, transparent 60%)',
            borderBottom:'1px solid var(--border-default)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{
                fontFamily:MONO, fontSize:9, fontWeight:700, letterSpacing:'0.15em',
                color:'var(--color-accent)', textTransform:'uppercase',
              }}>
                ▶ TERMINAL ALERT FEED
              </span>
              <span style={{
                fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
              }}>
                {alertFeed.length} EVENTS · AUTO-SCROLL
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              {(['critical','high','medium','low'] as const).map(sev => {
                const sevColors: Record<string,string> = { critical:'var(--color-danger)', high:'var(--color-warning)', medium:'var(--accent-yellow)', low:'var(--accent-cyan)' };
                const count = alertFeed.filter(a => a.severity === sev).length;
                return (
                  <span key={sev} style={{
                    fontFamily:MONO, fontSize:9, fontWeight:600,
                    color: sevColors[sev], letterSpacing:'0.08em',
                    textTransform:'uppercase',
                  }}>
                    {sev}: {count}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Alert lines */}
          <div className="alert-feed-scroll" style={{
            height: 280,
            overflowY:'auto',
            background:'var(--bg-base)',
            position:'relative',
          }}>
            {/* Subtle grid background */}
            <div style={{
              position:'absolute', inset:0, pointerEvents:'none',
              backgroundImage:
                'linear-gradient(var(--color-info-dim) 1px, transparent 1px), linear-gradient(90deg, var(--color-info-dim) 1px, transparent 1px)',
              backgroundSize:'32px 32px',
            }} />
            {alertFeed.length === 0 ? (
              <div style={{
                padding:'60px 20px', textAlign:'center',
                fontFamily:MONO, fontSize:11, color:'var(--text-muted)',
              }}>
                <div style={{ marginBottom:8, letterSpacing:'0.1em' }}>AWAITING THREAT STREAM</div>
                <div style={{ fontSize:9, color:'var(--text-muted)', letterSpacing:'0.5px' }}>
                  {isLive ? 'Monitoring passive observation enclave...' : 'Launch an attack from the Attack Lab to begin detection'}
                </div>
              </div>
            ) : (
              <div style={{ position:'relative', zIndex:1 }}>
                {alertFeed.map((alert, i) => (
                  <AlertLine key={`${alert.id ?? alert.timestamp}-${i}`} alert={alert} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Scanline overlay on feed */}
          <div style={{
            position:'absolute', left:0, right:0, height:2, top:0,
            background:'linear-gradient(180deg, transparent, var(--color-info-dim), transparent)',
            pointerEvents:'none', zIndex:2,
            animation:'scanline-h 8s linear infinite',
          }} />
        </section>

        {/* ══════════════════════════════════════════════════════════════
             ROW 1 — KPI STRIP (6 cards)
             ══════════════════════════════════════════════════════════════ */}
        <section style={{
          display:'grid',
          gridTemplateColumns:'repeat(6, 1fr)',
          gap:1,
          marginBottom:20,
          border:'1px solid var(--border-default)',
        }}>
          <KpiCard
            label="Total Flows" value={fmt(data.totalScanned)}
            sub={`+${data.flowsPerSec}/s`} borderColor="var(--color-accent)"
          />
          <KpiCard
            label="Active Threats" value={fmt(data.threatsBlocked)}
            sub="detected" borderColor="var(--color-danger)" pulse
          />
          <KpiCard
            label="Detection Rate" value={`${data.detectionRate.toFixed(1)}%`}
            sub="avg confidence" borderColor="var(--color-warning)"
          />
          <KpiCard
            label="False Positive" value={`${data.falsePositiveRate.toFixed(1)}%`}
            sub="filtered" borderColor="var(--color-success)"
          />
          <KpiCard
            label="Flows/sec" value={fmt(data.flowsPerSec)}
            sub="ingest rate" borderColor="var(--color-accent)"
          />
          <KpiCard
            label="Uptime" value={fmtUptime(data.uptime)}
            sub={isLive ? 'connected' : 'demo mode'} borderColor="var(--text-muted)"
          />
        </section>

        {/* ══════════════════════════════════════════════════════════════
             ROW 2 — DEGRADATION MATRIX (50%) + THROUGHPUT TIMELINE (50%)
             ══════════════════════════════════════════════════════════════ */}
        <section style={{
          display:'grid', gridTemplateColumns:'1fr 1fr',
          gap:1,
          marginBottom:20,
        }}>
          {/* Degradation Matrix — HERO VISUALIZATION */}
          <div style={{
            background:'var(--bg-surface)',
            border:'1px solid var(--border-default)',
            overflow:'hidden',
          }}>
            <div style={{
              padding:'12px 16px', borderBottom:'1px solid var(--border-default)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
              background:'linear-gradient(135deg, var(--color-info-dim), transparent)',
            }}>
              <div>
                <div style={{
                  fontFamily:MONO, fontSize:10, fontWeight:700,
                  color:'var(--text-secondary)', letterSpacing:'0.1em',
                  textTransform:'uppercase',
                }}>DEGRADATION MATRIX</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'var(--text-muted)', marginTop:2 }}>
                  F1 score per threat type · diode impact analysis
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:3, background:'var(--color-success)', display:'inline-block', borderRadius:1 }} />
                  <span style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase' }}>Full</span>
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:3, background:'var(--color-danger)', display:'inline-block', borderRadius:1 }} />
                  <span style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase' }}>Diode</span>
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:3, background:'var(--color-purple)', display:'inline-block', borderRadius:1 }} />
                  <span style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase' }}>ACK</span>
                </span>
              </div>
            </div>
            <DegradationMatrix data={DEGRADATION_DATA} showWarning />
          </div>

          {/* Throughput Timeline */}
          <div style={{
            background:'var(--bg-surface)',
            border:'1px solid var(--border-default)',
            overflow:'hidden',
          }}>
            <div style={{
              padding:'12px 16px', borderBottom:'1px solid var(--border-default)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div>
                <div style={{
                  fontFamily:MONO, fontSize:10, fontWeight:700,
                  color:'var(--text-secondary)', letterSpacing:'0.1em',
                  textTransform:'uppercase',
                }}>THROUGHPUT</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'var(--text-muted)', marginTop:2 }}>
                  flows/sec · rolling 60s
                </div>
              </div>
              <div style={{
                fontFamily:MONO, fontSize:11, fontWeight:700,
                color:'var(--color-accent)', fontVariantNumeric:'tabular-nums',
              }}>
                {data.flowsPerSec} <span style={{ fontSize:9, color:'var(--text-muted)', fontWeight:400 }}>fps</span>
              </div>
            </div>
            <div style={{ padding:'12px 8px' }}>
              {throughput.length < 2 ? (
                <div style={{
                  padding:'40px 20px', textAlign:'center',
                  fontFamily:MONO, fontSize:10, color:'var(--text-muted)',
                }}>Collecting samples…</div>
              ) : (
                <ThroughputSparkline data={throughput} />
              )}
            </div>

            {/* Mini stats below sparkline */}
            <div style={{
              display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0,
              borderTop:'1px solid var(--border-muted)',
            }}>
              {[
                { label:'PEAK', value: Math.max(...throughput, 0), unit:'fps' },
                { label:'AVG', value: throughput.length ? Math.round(throughput.reduce((a,b)=>a+b,0)/throughput.length) : 0, unit:'fps' },
                { label:'MIN', value: Math.min(...throughput.filter(v=>v>0), 0), unit:'fps' },
              ].map(s => (
                <div key={s.label} style={{
                  padding:'10px 12px',
                  borderRight: s.label !== 'MIN' ? '1px solid var(--border-muted)' : 'none',
                  textAlign:'center',
                }}>
                  <div style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{s.label}</div>
                  <div style={{ fontFamily:MONO, fontSize:13, fontWeight:700, color:'var(--text-primary)', fontVariantNumeric:'tabular-nums' }}>
                    {s.value}<span style={{ fontSize:8, color:'var(--text-muted)', marginLeft:3 }}>{s.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
             ROW 3 — NETWORK MAP (full width, 300px)
             ══════════════════════════════════════════════════════════════ */}
        <section style={{
          marginBottom:20,
          background:'var(--bg-surface)',
          border:'1px solid var(--border-default)',
          overflow:'hidden',
        }}>
          <div style={{
            padding:'12px 16px', borderBottom:'1px solid var(--border-default)',
            display:'flex', alignItems:'center', justifyContent:'space-between',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{
                fontFamily:MONO, fontSize:10, fontWeight:700,
                color:'var(--text-secondary)', letterSpacing:'0.1em',
                textTransform:'uppercase',
              }}>NETWORK TOPOLOGY</span>
              <span style={{
                fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
              }}>
                {isLive ? 'LIVE' : 'DEMO'} · passive observation
              </span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:8, height:2, background:'var(--color-accent)', display:'inline-block', borderRadius:1 }} />
                <span style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase' }}>Normal</span>
              </span>
              <span style={{ display:'flex', alignItems:'center', gap:4 }}>
                <span style={{ width:8, height:2, background:'var(--color-danger)', display:'inline-block', borderRadius:1 }} />
                <span style={{ fontFamily:MONO, fontSize:8, color:'var(--text-muted)', textTransform:'uppercase' }}>Attack</span>
              </span>
            </div>
          </div>
          <div style={{ height: 300, position:'relative' }}>
            <NetworkMap />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
             ROW 4 — QUICK NAV (compact, horizontal)
             ══════════════════════════════════════════════════════════════ */}
        <section style={{
          display:'flex', gap:1, marginBottom:20,
        }}>
          {[
            { label:'ATTACK LAB', path:'/attack',  color:'var(--color-danger)',   icon:'⚡' },
            { label:'LIVE THREATS', path:'/live-threats', color:'var(--color-warning)', icon:'◉' },
            { label:'NETWORK MAP', path:'/network-map', color:'var(--color-accent)',  icon:'◈' },
            { label:'DIODE LAB', path:'/diode-lab',  color:'var(--color-purple)',  icon:'◎' },
            { label:'AI ANALYZER', path:'/ai-analyzer', color:'var(--color-info)',   icon:'⌬' },
            { label:'ANALYTICS', path:'/analytics', color:'var(--text-secondary)', icon:'◫' },
          ].map(action => (
            <button key={action.path} onClick={() => navigate(action.path)} style={{
              flex:1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              padding:'12px 16px',
              background:'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              fontFamily:MONO, fontSize:10, fontWeight:600,
              color: action.color,
              letterSpacing:'0.1em', textTransform:'uppercase',
              cursor:'pointer', transition:'all 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor = `${action.color}40`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-surface)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
            >
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{
          padding:'16px 0', borderTop:'1px solid var(--border-muted)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:8,
        }}>
          <span style={{
            fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
            letterSpacing:'0.6px',
          }}>WATCHTOWER · NTRO · SIH26 · PS-26145</span>
          <span style={{
            fontFamily:MONO, fontSize:9, color:'var(--text-muted)',
            letterSpacing:'0.4px', fontVariantNumeric:'tabular-nums',
          }}>
            {isLive ? 'REAL-TIME STREAM' : 'SIMULATION'} · {data.alerts.length} ALERTS · {fmtUptime(data.uptime)} UPTIME
          </span>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;
