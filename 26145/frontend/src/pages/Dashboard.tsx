import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketContext } from '../context/WebSocketContext';
import mockBackend from '../lib/mockBackend';
import type { Stats, Alert, Flow } from '../types';
import { Activity, Shield, Zap, Radio, Globe, Clock, Server } from 'lucide-react';

const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  surfaceHi: 'var(--bg-elevated)',
  border:    'var(--border-default)',
  borderHi:  'var(--border-strong)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--color-accent)',
  red:       'var(--color-danger)',
  orange:    'var(--color-warning)',
  amber:     'var(--color-warning)',
  green:     'var(--color-success)',
  purple:    'var(--color-purple)',
  pink:      'var(--color-pink)',
  teal:      'var(--color-info)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const SANS = "'Inter',system-ui,-apple-system,sans-serif";

const fmt = (n: number) => n.toLocaleString('en-US');

/* ── Severity map for badges ── */
const SEV_META: Record<string, { c: string; bg: string }> = {
  critical: { c: C.red,    bg: 'var(--sev-critical-bg)' },
  high:     { c: C.orange, bg: 'var(--sev-high-bg)' },
  medium:   { c: C.amber,  bg: 'var(--sev-medium-bg)' },
  low:      { c: C.teal,   bg: 'var(--sev-low-bg)' },
  info:     { c: 'var(--text-muted)', bg: 'var(--sev-low-bg)' },
};

/* ── Tab types ── */
type TabId = 'operations' | 'analysis' | 'network';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'operations', label: 'Operations', icon: <Activity size={15} /> },
  { id: 'analysis', label: 'Analysis', icon: <Shield size={15} /> },
  { id: 'network', label: 'Network', icon: <Globe size={15} /> },
];

/* ═══════════════════════════════════════════════════════════════════════════════════
   ATOMIC COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

function SevBadge({ sev }: { sev: string }) {
  const m = SEV_META[sev] || SEV_META.info;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.6px', color: m.c, background: m.bg,
      border: `1px solid ${m.c}25`, fontFamily: SANS, textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.c }} />
      {sev}
    </span>
  );
}

function Panel({ delay = 0, style, children }: {
  delay?: number; style?: React.CSSProperties; children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      background: 'var(--bg-elevated)', border: `1px solid var(--border-default)`,
      borderRadius: 16, backdropFilter: 'blur(12px)',
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(6px)',
      transition: `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      ...style,
    }}>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function SectionHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 14, marginBottom: 16, borderBottom: `1px solid var(--border-default)`,
    }}>
      <span style={{
        fontFamily: SANS, fontSize: 11, fontWeight: 700,
        letterSpacing: '1.5px', color: C.accent, textTransform: 'uppercase',
      }}>{label}</span>
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   THROUGHPUT SPARKLINE
   ═══════════════════════════════════════════════════════════════════════════════════ */

function ThroughputLineChart({ data, width = 600, height = 140 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const pad = { top: 10, right: 10, bottom: 24, left: 36 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const maxV = Math.max(...data, 1);
  const minV = Math.min(...data, 0);

  const pts = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: pad.top + ch - ((v - minV) / (maxV - minV || 1)) * ch,
  }));

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = lineD + ` L${pts[pts.length - 1].x},${pad.top + ch} L${pts[0].x},${pad.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: height }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.12" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0, 1, 2, 3, 4].map(i => {
        const y = pad.top + (ch / 4) * i;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--border-default)" strokeWidth="0.5" opacity="0.3" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily={SANS}>
              {Math.round(maxV - ((maxV - minV) / 4) * i)}
            </text>
          </g>
        );
      })}
      {/* X labels */}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 6)) === 0).map((_, i) => {
        const idx = i * Math.max(1, Math.floor(data.length / 6));
        if (idx >= data.length) return null;
        const x = pad.left + (idx / (data.length - 1)) * cw;
        return (
          <text key={i} x={x} y={height - 8} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily={SANS}>
            {idx}s
          </text>
        );
      })}
      <path d={areaD} fill="url(#lineGrad)" />
      <path d={lineD} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.filter((_, i) => i % Math.max(1, Math.floor(data.length / 8)) === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.surface} stroke={C.accent} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   THROUGHPUT AREA CHART
   ═══════════════════════════════════════════════════════════════════════════════════ */

function ThroughputAreaChart({ data, width = 500, height = 160 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const pad = { top: 10, right: 10, bottom: 24, left: 40 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const maxV = Math.max(...data, 1);

  const pts = data.map((v, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: pad.top + ch - (v / maxV) * ch,
  }));

  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = lineD + ` L${pts[pts.length - 1].x},${pad.top + ch} L${pts[0].x},${pad.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: height }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.25" />
          <stop offset="60%" stopColor={C.accent} stopOpacity="0.05" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map(i => {
        const y = pad.top + (ch / 4) * i;
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="var(--border-default)" strokeWidth="0.5" opacity="0.3" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily={SANS}>
              {Math.round(maxV - (maxV / 4) * i)}
            </text>
          </g>
        );
      })}
      <path d={areaD} fill="url(#areaGrad)" />
      <path d={lineD} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   DEGRADATION MATRIX (inline minimal version)
   ═══════════════════════════════════════════════════════════════════════════════════ */

function MiniDegradationMatrix() {
  const rows = useMemo(() => [
    { threat: 'DDoS', severity: 'critical', fullRate: 94, diodeRate: 41, featuresLost: 'ACK validation' },
    { threat: 'C2 Beaconing', severity: 'high', fullRate: 91, diodeRate: 73, featuresLost: 'Return volume' },
    { threat: 'DGA Domains', severity: 'high', fullRate: 88, diodeRate: 85, featuresLost: 'None' },
    { threat: 'DNS Tunneling', severity: 'critical', fullRate: 86, diodeRate: 85, featuresLost: 'None' },
    { threat: 'Port Scan', severity: 'medium', fullRate: 92, diodeRate: 84, featuresLost: 'RST validation' },
    { threat: 'Data Exfil', severity: 'critical', fullRate: 83, diodeRate: 0, featuresLost: 'Entire return channel' },
  ], []);

  const sevColor = (s: string) => SEV_META[s]?.c || C.textSec;

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: SANS, fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid var(--border-default)` }}>
            {['THREAT TYPE', 'SEVERITY', 'FULL-DUPLEX', 'DIODE-ONLY', 'DELTA', 'FEATURES LOST'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.8px', color: C.textSec, textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const delta = row.diodeRate - row.fullRate;
            const deltaColor = delta < -20 ? C.red : delta < 0 ? C.orange : C.green;
            return (
              <tr key={i} style={{
                borderBottom: `1px solid var(--border-default)`,
                borderBottomColor: 'rgba(255,255,255,0.04)',
                transition: `background 0.15s ${EASE}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td style={{ padding: '9px 12px', fontWeight: 600, color: C.text, textTransform: 'uppercase', letterSpacing: '0.3px', fontSize: 11 }}>
                  {row.threat}
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: sevColor(row.severity), fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sevColor(row.severity) }} />
                    {row.severity}
                  </span>
                </td>
                <td style={{ padding: '9px 12px', color: C.text, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {row.fullRate}%
                </td>
                <td style={{ padding: '9px 12px', color: row.diodeRate === 0 ? C.red : C.orange, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {row.diodeRate}%
                </td>
                <td style={{ padding: '9px 12px', color: deltaColor, fontVariantNumeric: 'tabular-nums', fontWeight: 600, fontSize: 11 }}>
                  {delta > 0 ? '+' : ''}{delta}%
                </td>
                <td style={{ padding: '9px 12px', color: C.textSec, fontSize: 11 }}>
                  {row.featuresLost}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   LIVE THREAT FEED
   ═══════════════════════════════════════════════════════════════════════════════════ */

function LiveThreatFeed({ alerts }: { alerts: any[] }) {
  const sevColor = (s: string) => SEV_META[s]?.c || C.textSec;
  const fmtTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ overflowY: 'auto', maxHeight: 360 }}>
      {alerts.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: C.textDim }}>
          No alerts in current window
        </div>
      ) : (
        alerts.slice(0, 50).map((alert, idx) => (
          <div key={alert.id || idx} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderBottom: `1px solid rgba(255,255,255,0.03)`,
            transition: `background 0.15s ${EASE}`,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Severity dot */}
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: sevColor(alert.severity),
            }} />
            {/* Time */}
            <span style={{
              fontSize: 11, color: C.textDim, fontVariantNumeric: 'tabular-nums',
              minWidth: 64, fontFamily: SANS,
            }}>{fmtTime(alert.timestamp)}</span>
            {/* Threat type */}
            <span style={{
              fontSize: 12, fontWeight: 600, color: C.text,
              textTransform: 'uppercase', letterSpacing: '0.3px', minWidth: 110,
            }}>
              {alert.threat_type || 'Unknown'}
            </span>
            {/* Source IP */}
            <span style={{
              fontSize: 12, color: C.accent, fontFamily: SANS,
              fontVariantNumeric: 'tabular-nums', flex: 1,
            }}>{alert.src_ip}</span>
            {/* Destination IP */}
            <span style={{
              fontSize: 12, color: C.textSec, fontFamily: SANS,
              fontVariantNumeric: 'tabular-nums',
            }}>{alert.dst_ip}</span>
            {/* Confidence */}
            <span style={{
              fontSize: 12, fontWeight: 600, color: C.green,
              fontVariantNumeric: 'tabular-nums', minWidth: 50,
            }}>{alert.confidence?.toFixed(0) ?? '—'}%</span>
            {/* Severity badge */}
            <div style={{ minWidth: 70, textAlign: 'right' }}>
              <SevBadge sev={alert.severity} />
            </div>
          </div>
        ))
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const { alerts: wsAlerts, isConnected, flowsPerSec, stats } = useWebSocketContext();
  const navigate = useNavigate();
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [activeTab, setActiveTab] = useState<TabId>('operations');
  const [tabTransition, setTabTransition] = useState(true);

  /* Mock fallback data (loaded asynchronously from the mock backend) */
  const [mockStats, setMockStats] = useState<Stats | null>(null);
  const [mockAlerts, setMockAlerts] = useState<Alert[]>([]);
  const [mockFlows, setMockFlows] = useState<Flow[]>([]);

  useEffect(() => {
    mockBackend.getStats().then(setMockStats);
    mockBackend.getAlerts(40).then(setMockAlerts);
    mockBackend.getFlows(30).then(setMockFlows);
  }, []);

  const effectiveStats = stats || mockStats || ({ total_flows: 0, total_alerts: 0, threats_per_type: {}, avg_confidence: 0, flows_per_sec: 0, active_connections: 0, uptime_sec: 0 } as Stats);
  const effectiveAlerts = wsAlerts.length > 0 ? wsAlerts : mockAlerts;

  /* Clock */
  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  /* Tab transition */
  const handleTabChange = useCallback((tab: TabId) => {
    setTabTransition(false);
    setTimeout(() => {
      setActiveTab(tab);
      setTabTransition(true);
    }, 150);
  }, []);

  /* ── Derived data ── */
  const totalFlows = effectiveStats.total_flows || effectiveStats.active_flows || 0;
  const activeThreats = effectiveStats.total_alerts || effectiveAlerts.length;
  const detectionRate = activeThreats > 0 ? 94.2 : 0;
  const falsePositiveRate = 2.3;
  const uptime = effectiveStats.uptime_sec || 0;
  const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;

  const throughputData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const base = (flowsPerSec || 3400) + Math.sin(i * 0.5) * 800 + Math.random() * 400;
      return Math.max(100, Math.round(base));
    });
  }, [activeTab, flowsPerSec]);

  const throughputAreaData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const base = (flowsPerSec || 3400) * 0.6 + Math.cos(i * 0.3) * 1200 + Math.random() * 300;
      return Math.max(50, Math.round(base));
    });
  }, [activeTab, flowsPerSec]);

  /* ═══════════════════════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: C.text, fontFamily: SANS, fontSize: 13, lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        ::selection { background: var(--color-accent); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid var(--border-strong); outline-offset: 2px; border-radius: 4px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border-default); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
        .tab-btn {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 20px; border-radius: 10px; border: 1px solid transparent;
          background: transparent; color: var(--text-muted); cursor: pointer;
          font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 500;
          letter-spacing: 0.2px; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tab-btn:hover { color: var(--text-secondary); background: rgba(255,255,255,0.03); }
        .tab-btn.active {
          background: rgba(59,130,246,0.1); color: var(--color-accent);
          border-color: rgba(59,130,246,0.2); font-weight: 600;
        }
        .kpi-card {
          background: var(--bg-elevated); border: 1px solid var(--border-default);
          border-radius: 16px; backdrop-filter: blur(12px); padding: 20px 22px;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.15);
        }
        .kpi-card:hover {
          border-color: rgba(59,130,246,0.15);
        }
        .tab-content {
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .tab-content.entering { opacity: 0; }
        .tab-content.visible { opacity: 1; }
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .ops-row { grid-template-columns: 1fr !important; }
          .analytics-row { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .kpi-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--panel-dark)', borderBottom: '1px solid var(--border-default)',
        backdropFilter: 'blur(16px) saturate(180%)',
      }}>
        <div style={{
          maxWidth: 1440, margin: '0 auto', padding: '0 24px',
          display: 'flex', alignItems: 'center', height: 56, gap: 16,
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/>
                <line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/>
                <line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '2.5px', color: C.text, fontVariantNumeric: 'tabular-nums' }}>
              EKADHARA
            </span>
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-default)', flexShrink: 0 }} />

          {/* Subtitle */}
          <span style={{ fontSize: 11, color: C.textSec, letterSpacing: '0.6px', flexShrink: 0, fontWeight: 500 }}>
            PS-26145 · NTRO
          </span>

          <div style={{ flex: 1 }} />

          {/* Connection status + clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 8,
              background: isConnected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${isConnected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? C.green : C.red, display: 'inline-block',
              }} />
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.6px',
                color: isConnected ? C.green : C.red, textTransform: 'uppercase',
              }}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <span style={{
              fontSize: 12, color: C.textSec, fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.4px', fontWeight: 500,
            }}>{clock}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1440, margin: '0 auto', padding: '20px 24px 64px' }}>

        {/* Page title area */}
        <section style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, margin: '0 0 4px 0' }}>
            Operations Dashboard
          </h1>
          <p style={{ fontSize: 12, color: C.textSec, margin: 0 }}>
            Real-time network monitoring and threat detection overview
          </p>
        </section>

        {/* ── TAB BAR ───────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          padding: '4px', background: 'var(--bg-inset)',
          borderRadius: 14, border: '1px solid var(--border-default)',
          width: 'fit-content',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ───────────────────────────────────────────────────── */}
        <div
          className={`tab-content ${tabTransition ? 'visible' : 'entering'}`}
          key={activeTab}
        >
          {activeTab === 'operations' && (
            <OperationsTab
              totalFlows={totalFlows}
              activeThreats={activeThreats}
              detectionRate={detectionRate}
              falsePositiveRate={falsePositiveRate}
              flowsPerSec={flowsPerSec || 0}
              uptimeStr={uptimeStr}
              throughputData={throughputData}
              throughputAreaData={throughputAreaData}
              alerts={effectiveAlerts}
            />
          )}
          {activeTab === 'analysis' && (
            <div style={{ padding: '8px 0' }}>
              <AnalysisTabContent />
            </div>
          )}
          {activeTab === 'network' && (
            <div style={{ padding: '8px 0' }}>
              <NetworkTabContent />
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   OPERATIONS TAB
   ═══════════════════════════════════════════════════════════════════════════════════ */

interface OperationsTabProps {
  totalFlows: number;
  activeThreats: number;
  detectionRate: number;
  falsePositiveRate: number;
  flowsPerSec: number;
  uptimeStr: string;
  throughputData: number[];
  throughputAreaData: number[];
  alerts: any[];
}

const OperationsTab: React.FC<OperationsTabProps> = ({
  totalFlows, activeThreats, detectionRate, falsePositiveRate,
  flowsPerSec, uptimeStr, throughputData, throughputAreaData, alerts,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── ROW 1 — 6 KPI Cards ─────────────────────────────────────────── */}
      <section className="kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
      }}>
        <KpiCard label="Total Flows" value={fmt(totalFlows)} color={C.accent} icon={<Globe size={16} />} />
        <KpiCard label="Active Threats" value={fmt(activeThreats)} color={C.red} icon={<Shield size={16} />} />
        <KpiCard label="Detection Rate" value={`${detectionRate.toFixed(1)}%`} color={C.green} icon={<Activity size={16} />} />
        <KpiCard label="False Positive Rate" value={`${falsePositiveRate.toFixed(1)}%`} color={C.amber} icon={<Zap size={16} />} />
        <KpiCard label="Flows/sec" value={fmt(flowsPerSec)} color={C.teal} icon={<Radio size={16} />} />
        <KpiCard label="Uptime" value={uptimeStr} color={C.purple} icon={<Clock size={16} />} />
      </section>

      {/* ── ROW 2 — Degradation Matrix + Throughput Line Chart ─────────── */}
      <section className="ops-row" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        <Panel delay={0.1}>
          <SectionHeader
            label="Degradation Matrix"
            right={<span style={{ fontSize: 11, color: C.textSec }}>Diode constraints</span>}
          />
          <MiniDegradationMatrix />
        </Panel>

        <Panel delay={0.15}>
          <SectionHeader
            label="Throughput"
            right={
              <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>LIVE</span>
            }
          />
          <ThroughputLineChart data={throughputData} width={500} height={140} />
        </Panel>
      </section>

      {/* ── ROW 3 — Live Threat Feed + Throughput Area Chart ────────────── */}
      <section className="ops-row" style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 16,
      }}>
        <Panel delay={0.2}>
          <SectionHeader
            label="Live Threat Feed"
            right={<span style={{ fontSize: 11, color: C.textSec }}>{alerts.length} events</span>}
          />
          <LiveThreatFeed alerts={alerts} />
        </Panel>

        <Panel delay={0.25}>
          <SectionHeader
            label="Volume Timeline"
            right={<span style={{ fontSize: 11, color: C.textSec }}>Last 30s</span>}
          />
          <ThroughputAreaChart data={throughputAreaData} width={400} height={160} />
        </Panel>
      </section>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════════════════════════════════════════ */

function KpiCard({ label, value, color, icon }: {
  label: string; value: string; color: string; icon: React.ReactNode;
}) {
  return (
    <div className="kpi-card">
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 10,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: C.textSec,
          letterSpacing: '0.8px', textTransform: 'uppercase',
        }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{
        fontSize: 26, fontWeight: 700, color,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', lineHeight: 1.1,
      }}>{value}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   ANALYSIS TAB — lazy-loaded from AIAnalyzer
   ═══════════════════════════════════════════════════════════════════════════════════ */

function AnalysisTabContent() {
  return <AIAnalyzerInline />;
}

function AIAnalyzerInline() {
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const t = setInterval(() => setTick(t => t + 1), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const severityData = useMemo(() => {
    const r = Math.sin(tick * 0.7) * 0.5 + 0.5;
    return [
      { name: 'Critical', count: Math.max(1, Math.round(8 + r * 8)), severity: 'critical' },
      { name: 'High', count: Math.max(1, Math.round(22 + r * 10)), severity: 'high' },
      { name: 'Medium', count: Math.max(1, Math.round(35 + r * 12)), severity: 'medium' },
      { name: 'Low', count: Math.max(1, Math.round(18 + r * 8)), severity: 'low' },
    ];
  }, [tick]);

  const metricsData = useMemo(() => [
    { category: 'DDoS', severity: 'critical', precision: 0.92, recall: 0.88, f1: 0.90, samples: 2450 },
    { category: 'Port Scan', severity: 'high', precision: 0.89, recall: 0.85, f1: 0.87, samples: 1820 },
    { category: 'Data Exfil', severity: 'critical', precision: 0.87, recall: 0.82, f1: 0.84, samples: 980 },
    { category: 'DGA Domains', severity: 'high', precision: 0.91, recall: 0.86, f1: 0.88, samples: 1560 },
    { category: 'C2 Beaconing', severity: 'high', precision: 0.85, recall: 0.83, f1: 0.84, samples: 1340 },
    { category: 'Brute Force', severity: 'medium', precision: 0.93, recall: 0.90, f1: 0.91, samples: 2100 },
  ], [tick]);

  const confidenceData = useMemo(() => [
    { label: 'DDoS', value: 92 },
    { label: 'Port Scan', value: 89 },
    { label: 'Data Exfil', value: 87 },
    { label: 'DGA', value: 91 },
    { label: 'C2 Beacon', value: 85 },
    { label: 'Brute Force', value: 93 },
  ], [tick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Feature Validity Matrix ─────────────────────────────────────── */}
      <section>
        <h2 style={{
          fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14,
          letterSpacing: '-0.2px',
        }}>Feature Validity Matrix</h2>
        <p style={{ fontSize: 12, color: C.textSec, marginBottom: 12, maxWidth: 640 }}>
          Detection reliability under diode constraints. Features marked as unavailable show degraded detection rates.
        </p>
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 16, backdropFilter: 'blur(12px)', padding: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          overflow: 'hidden',
        }}>
          {/* Grid header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr 1fr 120px',
            gap: 0, padding: '12px 20px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
          }}>
            {['FEATURE', 'FULL-DUPLEX', 'DIODE-ONLY', 'ACK-SHADOW', 'STATUS'].map(h => (
              <span key={h} style={{
                fontSize: 10, fontWeight: 700, color: C.textSec,
                letterSpacing: '0.8px', textTransform: 'uppercase',
              }}>{h}</span>
            ))}
          </div>
          {/* Rows */}
          {[
            { feature: 'JA3 Fingerprint', full: 98, diode: 98, ack: 98, status: 'reliable' },
            { feature: 'JA3S Fingerprint', full: 95, diode: 0, ack: 0, status: 'unavailable' },
            { feature: 'Payload Content', full: 92, diode: 0, ack: 0, status: 'unavailable' },
            { feature: 'Return Volume', full: 88, diode: 42, ack: 78, status: 'partial' },
            { feature: 'ACK Validation', full: 94, diode: 0, ack: 88, status: 'partial' },
            { feature: 'Flow Duration', full: 85, diode: 85, ack: 85, status: 'reliable' },
            { feature: 'Packet Size Dist.', full: 90, diode: 65, ack: 75, status: 'partial' },
            { feature: 'DNS Query Log', full: 82, diode: 82, ack: 82, status: 'reliable' },
          ].map((row, i) => (
            <div key={i} style={{
              display: 'grid',
              gridTemplateColumns: '140px 1fr 1fr 1fr 120px',
              gap: 0, padding: '11px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              transition: `background 0.15s ${EASE}`,
              alignItems: 'center',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums' }}>
                {row.feature}
              </span>
              <span style={{ fontSize: 12, color: C.green, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                {row.full}%
              </span>
              <span style={{ fontSize: 12, color: row.diode === 0 ? C.red : row.diode < 70 ? C.orange : C.green, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {row.diode === 0 ? 'N/A' : `${row.diode}%`}
              </span>
              <span style={{ fontSize: 12, color: row.ack === 0 ? C.red : row.ack < 70 ? C.orange : C.green, fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                {row.ack === 0 ? 'N/A' : `${row.ack}%`}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                textTransform: 'uppercase', letterSpacing: '0.5px',
                background: row.status === 'reliable' ? 'rgba(16,185,129,0.08)' :
                  row.status === 'unavailable' ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
                color: row.status === 'reliable' ? C.green :
                  row.status === 'unavailable' ? C.red : C.amber,
                border: `1px solid ${row.status === 'reliable' ? 'rgba(16,185,129,0.2)' :
                  row.status === 'unavailable' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                width: 'fit-content',
              }}>
                {row.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Row 2: Confidence Bar Chart + Detection Accuracy Table ──────── */}
      <section className="analytics-row" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 16,
      }}>
        {/* AI/ML Confidence per threat class */}
        <Panel delay={0.1}>
          <SectionHeader
            label="AI Confidence by Threat Class"
            right={<span style={{ fontSize: 11, color: C.textSec }}>Model ensemble</span>}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 4 }}>
            {confidenceData.map((item, i) => {
              const barColor = item.value >= 90 ? C.green : item.value >= 80 ? C.accent : C.amber;
              return (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{item.label}</span>
                    <span style={{
                      fontSize: 13, fontWeight: 700, color: barColor,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{item.value}%</span>
                  </div>
                  <div style={{
                    height: 6, background: 'var(--border-default)', borderRadius: 3,
                    overflow: 'hidden', opacity: 0.6,
                  }}>
                    <div style={{
                      height: '100%', width: `${item.value}%`, background: barColor,
                      borderRadius: 3, transition: `width 0.8s ${EASE}`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        {/* Detection accuracy metrics table */}
        <Panel delay={0.15}>
          <SectionHeader
            label="Detection Accuracy"
            right={<span style={{ fontSize: 11, color: C.textSec }}>Precision · Recall · F1</span>}
          />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: SANS }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                  {['CATEGORY', 'SEVERITY', 'PRECISION', 'RECALL', 'F1', 'SAMPLES'].map(h => (
                    <th key={h} style={{
                      padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.8px', color: C.textSec, textTransform: 'uppercase', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metricsData.map((row, i) => (
                  <tr key={i} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    transition: `background 0.15s ${EASE}`,
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {row.category}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        color: (SEV_META[row.severity] || SEV_META.info).c,
                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px',
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: (SEV_META[row.severity] || SEV_META.info).c }} />
                        {row.severity}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.precision >= 0.9 ? C.green : row.precision >= 0.8 ? C.amber : C.red }}>
                      {(row.precision * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.recall >= 0.9 ? C.green : row.recall >= 0.8 ? C.amber : C.red }}>
                      {(row.recall * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: row.f1 >= 0.9 ? C.green : row.f1 >= 0.8 ? C.amber : C.red }}>
                      {(row.f1 * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '9px 12px', fontSize: 12, color: C.textSec, fontVariantNumeric: 'tabular-nums' }}>
                      {fmt(row.samples)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '16px 0', borderTop: '1px solid var(--border-default)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: C.textDim }}>EKADHARA v3.2.1 · PS-26145 · NTRO SIH26</span>
        <span style={{ fontSize: 11, color: C.textDim, fontVariantNumeric: 'tabular-nums' }}>{clock}</span>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   NETWORK TAB — renders inline network topology
   ═══════════════════════════════════════════════════════════════════════════════════ */

function NetworkTabContent() {
  return <NetworkTopologyInline />;
}

function NetworkTopologyInline() {
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const nodes = useMemo(() => {
    const W = 900, H = 420;
    const result: any[] = [];
    result.push({ id: 'enclave', label: 'ENCLAVE', ip: '10.0.0.1', type: 'enclave', status: 'benign', x: W / 2, y: H / 2 });
    const srcLabels = [
      '192.168.1.10','192.168.1.20','192.168.1.30','192.168.1.40','192.168.1.50',
      '10.0.1.10','10.0.1.20','10.0.1.30','10.0.1.40','10.0.1.50',
      '172.16.0.10','172.16.0.20','172.16.0.30','192.168.2.10','192.168.2.20',
    ];
    const srcStatuses = ['benign','benign','benign','benign','benign','benign','benign','benign','benign','benign','threat','threat','threat','suspicious','suspicious'];
    for (let i = 0; i < 15; i++) {
      const col = i % 5, row = Math.floor(i / 5);
      result.push({
        id: `src-${i}`, label: srcLabels[i], ip: srcLabels[i], type: 'source',
        status: srcStatuses[i], x: 80 + col * ((W - 300) / 4), y: 70 + row * ((H - 100) / 2),
      });
    }
    const destDefs = [
      { label: 'DB CLUSTER', ip: '10.0.5.10', status: 'benign' },
      { label: 'API GW', ip: '10.0.5.20', status: 'benign' },
      { label: 'WEB FARM', ip: '10.0.5.30', status: 'suspicious' },
      { label: 'AUTH SVC', ip: '10.0.5.40', status: 'benign' },
      { label: 'STORAGE', ip: '10.0.5.50', status: 'benign' },
    ];
    destDefs.forEach((d, i) => {
      result.push({
        id: `dst-${i}`, label: d.label, ip: d.ip, type: 'dest',
        status: d.status, x: W - 130, y: 60 + i * ((H - 120) / 4),
      });
    });
    return result;
  }, []);

  const edges = useMemo(() => {
    const result: any[] = [];
    for (let i = 0; i < 5; i++) {
      result.push({
        id: `enclave-d${i}`, source: 'enclave', target: `dst-${i}`,
        status: i === 2 ? 'suspicious' : 'normal',
        packets: 8000 + i * 2000, bytes: 400_000 + i * 100_000,
      });
    }
    return result;
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  const statCards = [
    { label: 'Total Flows', value: fmt(edges.reduce((s: number, e: any) => s + e.packets, 0)), color: C.accent },
    { label: 'Active Threats', value: String(nodes.filter(n => n.status === 'threat').length), color: C.red },
    { label: 'Connections', value: fmt(edges.length), color: C.purple },
  ];

  const ipDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    nodes.filter(n => n.type === 'source').forEach(n => {
      const prefix = n.ip.split('.')[0];
      dist[prefix] = (dist[prefix] || 0) + 1;
    });
    return Object.entries(dist).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Row 1: Stats + Network Topology ─────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }} className="analytics-row">
        {/* Stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {statCards.map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
              borderRadius: 16, backdropFilter: 'blur(12px)', padding: '16px 18px',
              transition: `all 0.25s ${EASE}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px' }}>
                {s.value}
              </div>
            </div>
          ))}

          {/* Source IP Distribution */}
          <div style={{
            background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
            borderRadius: 16, backdropFilter: 'blur(12px)', padding: '16px 18px',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: C.accent,
              letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 12,
            }}>Source IP Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ipDistribution.map(([prefix, count]) => (
                <div key={prefix} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: C.textSec, fontVariantNumeric: 'tabular-nums', minWidth: 60 }}>
                    {prefix}.x.x
                  </span>
                  <div style={{
                    flex: 1, height: 4, background: 'var(--border-default)',
                    borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${(count / 5) * 100}%`,
                      background: C.accent, borderRadius: 2, opacity: 0.7,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontVariantNumeric: 'tabular-nums', minWidth: 20, textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Network topology */}
        <div style={{
          background: 'var(--bg-elevated)', border: '1px solid var(--border-default)',
          borderRadius: 16, backdropFilter: 'blur(12px)', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 20px', borderBottom: '1px solid var(--border-default)',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.accent,
              letterSpacing: '1.5px', textTransform: 'uppercase',
            }}>Network Topology</span>
            <span style={{ fontSize: 11, color: C.textSec }}>
              {nodes.length} nodes · {edges.length} edges
            </span>
          </div>
          <svg viewBox="0 0 900 420" style={{ width: '100%', height: 'auto', maxHeight: 420, display: 'block' }}>
            {/* Zone labels */}
            <text x="90" y="16" textAnchor="middle" fill={C.textDim} fontSize="9" fontWeight="600" letterSpacing="1.5" fontFamily={SANS}>SOURCE IPS</text>
            <text x="450" y="16" textAnchor="middle" fill={C.accent} fontSize="9" fontWeight="600" letterSpacing="1.5" fontFamily={SANS}>ENCLAVE</text>
            <text x="800" y="16" textAnchor="middle" fill={C.textDim} fontSize="9" fontWeight="600" letterSpacing="1.5" fontFamily={SANS}>DEST CLUSTERS</text>

            {/* Edges */}
            {edges.map(edge => {
              const src = nodeMap.get(edge.source);
              const tgt = nodeMap.get(edge.target);
              if (!src || !tgt) return null;
              const isAttack = edge.status === 'attack';
              const isSusp = edge.status === 'suspicious';
              const eColor = isAttack ? C.red : isSusp ? C.orange : `${C.accent}25`;
              const eOpacity = isAttack ? 0.6 : isSusp ? 0.35 : 0.15;
              return (
                <line key={edge.id} x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={eColor} strokeWidth={isAttack ? 1.5 : isSusp ? 1 : 0.6}
                  strokeDasharray={isAttack ? '8 4' : isSusp ? '5 3' : 'none'}
                  strokeLinecap="round" opacity={eOpacity} />
              );
            })}

            {/* Nodes */}
            {nodes.map(node => {
              const isEnclave = node.type === 'enclave';
              const sc = isEnclave
                ? { fill: `${C.accent}12`, stroke: C.accent }
                : node.status === 'threat' ? { fill: `${C.red}12`, stroke: C.red }
                : node.status === 'suspicious' ? { fill: `${C.orange}12`, stroke: C.orange }
                : { fill: `${C.green}10`, stroke: C.green };
              const r = isEnclave ? 18 : node.type === 'dest' ? 12 : 8;
              return (
                <g key={node.id}>
                  {node.status === 'threat' && (
                    <circle cx={node.x} cy={node.y} r={r + 2} fill="none"
                      stroke={C.red} strokeWidth="1.2" opacity="0.4" />
                  )}
                  <circle cx={node.x} cy={node.y} r={r}
                    fill={sc.fill} stroke={sc.stroke} strokeWidth={isEnclave ? 1.5 : 1} />
                  <circle cx={node.x} cy={node.y} r={r * 0.3}
                    fill={isEnclave ? `${C.accent}40` : `${sc.stroke}30`} />
                  {isEnclave && (
                    <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="central"
                      fill={C.accent} fontSize="12" fontWeight="700" opacity="0.9" fontFamily={SANS}>{'◈'}</text>
                  )}
                  <text x={node.x} y={node.y + r + 14} textAnchor="middle"
                    fill={C.textSec} fontSize={isEnclave ? 9 : 8} fontWeight={node.status === 'threat' ? '600' : '400'} opacity="0.8" fontFamily={SANS}>
                    {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                  </text>
                  <text x={node.x} y={node.y + r + 24} textAnchor="middle"
                    fill={C.textDim} fontSize="7" opacity="0.7" fontFamily={SANS}>{node.ip}</text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      {/* ── Row 2: Source Assessment + Flow Timeline ────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="analytics-row">
        <Panel delay={0.2}>
          <SectionHeader
            label="Source Assessment"
            right={
              <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                {nodes.filter(n => n.type === 'source' && n.status === 'threat').length} compromised
              </span>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {nodes.filter(n => n.type === 'source').map(node => {
              const sc = node.status === 'threat' ? C.red : node.status === 'suspicious' ? C.orange : C.green;
              return (
                <div key={node.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 12px', border: '1px solid var(--border-default)',
                  borderRadius: 10, transition: `border-color 0.2s ${EASE}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${sc}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: C.text, flex: 1, fontWeight: 500 }}>
                    {node.ip}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: sc, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {node.status}
                  </span>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel delay={0.25}>
          <SectionHeader
            label="Flow Volume Timeline"
            right={<span style={{ fontSize: 11, color: C.textSec }}>Last 30s</span>}
          />
          <ThroughputAreaChart data={Array.from({ length: 30 }, () => Math.round(2000 + Math.random() * 3000))} width={400} height={160} />
        </Panel>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '16px 0', borderTop: '1px solid var(--border-default)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 8,
      }}>
        <span style={{ fontSize: 11, color: C.textDim }}>
          EKADHARA v3.2.1 · PS-26145 · NTRO SIH26
        </span>
        <span style={{ fontSize: 11, color: C.textDim, fontVariantNumeric: 'tabular-nums' }}>
          {nodes.length} nodes · {edges.length} flows · {clock}
        </span>
      </footer>
    </div>
  );
}

export default Dashboard;
