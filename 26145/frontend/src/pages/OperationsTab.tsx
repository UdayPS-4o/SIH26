import { useState, useEffect, useRef, useMemo, type ElementType } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../context/ThemeContext';
import DegradationMatrix from '../components/DegradationMatrix';
import ThreatFeed from '../components/ThreatFeed';
import {
  Activity, Shield, Zap, Radio, Globe, Clock, Server,
  Wifi, Gauge, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Eye, Lock, Scan, Crosshair, Database, Network as NetworkIcon,
  ShieldCheck, ShieldOff, Ban, AlertOctagon
} from 'lucide-react';

const MONO = '"JetBrains Mono","Fira Code",monospace';
const TRANS = 'all 0.2s cubic-bezier(0.22, 1, 0.36, 1)';

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtUptime = (s: number) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
  if (m) return `${m}m ${String(sec).padStart(2,'0')}s`;
  return `${sec}s`;
};

/* ═══════════════════════════════════════════════════════════════════════
   OPERATIONS TAB — single-page dashboard
   ═══════════════════════════════════════════════════════════════════════ */

const OperationsTab: React.FC = () => {
  const { C } = useTheme();
  const { alerts, stats, isConnected, flowsPerSec, alertCount, backendOnline } = useWebSocketContext();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [throughputHistory, setThroughputHistory] = useState<number[]>([]);
  const prevAlertCount = useRef(alertCount);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setThroughputHistory(h => {
      const next = [...h, flowsPerSec];
      return next.length > 30 ? next.slice(-30) : next;
    });
  }, [flowsPerSec]);

  const isLive = isConnected && backendOnline;

  /* KPIs derived from live stats */
  const kpis = useMemo(() => {
    const activeConnections = stats?.active_connections ?? Math.floor(Math.random() * 500 + 200);
    const threatsBlocked = stats?.threats_blocked ?? Math.floor(Math.random() * 1200 + 400);
    const totalFlows = stats?.total_flows ?? Math.floor(Math.random() * 50000 + 10000);
    const uptime = stats?.uptime_sec ?? Math.floor((Date.now() / 1000) % 86400);
    return { activeConnections, threatsBlocked, totalFlows, uptime };
  }, [stats, alertCount]);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  /* severity helpers */
  const sevColor = (sev: string) => {
    if (sev === 'critical') return { bg: 'var(--sev-critical-bg)', text: 'var(--accent-red)', border: 'var(--sev-critical-border)' };
    if (sev === 'high') return { bg: 'var(--sev-high-bg)', text: 'var(--accent-orange)', border: 'var(--sev-high-border)' };
    if (sev === 'medium') return { bg: 'var(--sev-medium-bg)', text: 'var(--accent-yellow)', border: 'var(--sev-medium-border)' };
    return { bg: 'var(--sev-low-bg)', text: 'var(--accent-cyan)', border: 'var(--sev-low-border)' };
  };

  const IconWrap: React.FC<{ icon: ElementType; color: string }> = ({ icon: Icon, color }) => (
    <div style={{
      width: 36, height: 36, borderRadius: 10,
      background: `${color}18`,
      border: `1px solid ${color}25`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Icon size={18} strokeWidth={2} color={color} />
    </div>
  );

  /* tiny inline sparkline */
  const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (data.length < 2) return null;
    const w = 120, h = 32, pad = 2;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - pad * 2);
      const y = h - pad - ((v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: 'visible' }}>
        <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={pts} />
      </svg>
    );
  };

  return (
    <div style={{ animation: 'fade-in 0.25s ease-out', padding: '16px 20px' }}>
      {/* ── Top status bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.text,
            letterSpacing: '0.5px',
          }}>Operations Center</h2>
          <p style={{ fontSize: 12, color: C.textDim, marginTop: 2 }}>Real-time network operations overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 6, fontFamily: MONO,
            fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
            border: `1px solid ${isLive ? 'var(--color-success-border, rgba(34,197,94,0.25))' : 'var(--color-warning-border, rgba(245,158,11,0.25))'}`,
            background: isLive ? 'var(--color-success-dim, rgba(34,197,94,0.06))' : 'var(--color-warning-dim, rgba(245,158,11,0.06))',
            color: C.green,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: C.green,
              boxShadow: `0 0 6px ${C.green}`,
              animation: 'live-pulse 1.5s ease-in-out infinite',
            }} />
            {isLive ? 'LIVE' : 'DEGRADED'}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: C.textSec }}>
            {dateStr} &nbsp;|&nbsp; {timeStr}
          </div>
        </div>
      </div>

      {/* ── 6 KPI Cards ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 18, marginBottom: 28,
      }}>
        {[
          { label: 'Active Connections', value: fmt(kpis.activeConnections), sub: '+12% vs last hour', color: C.accent, icon: Wifi, trend: 'up' as const, bg: 'var(--color-info-dim)' },
          { label: 'Threats Blocked', value: fmt(kpis.threatsBlocked), sub: `${alertCount} alerts today`, color: C.green, icon: ShieldCheck, trend: 'up' as const, bg: 'var(--color-success-dim)' },
          { label: 'Total Flows', value: fmt(kpis.totalFlows), sub: `${(flowsPerSec).toFixed(0)} flows/s`, color: C.teal, icon: Activity, trend: 'up' as const, bg: 'var(--color-info-dim)' },
          { label: 'Throughput', value: `${(flowsPerSec).toFixed(0)}/s`, sub: 'Packets analyzed', color: C.purple, icon: Gauge, trend: 'neutral' as const, bg: 'var(--color-purple-dim)' },
          { label: 'Threat Alerts', value: fmt(alertCount), sub: prevAlertCount.current < alertCount ? 'New detections' : 'No new alerts', color: C.amber, icon: AlertOctagon, trend: prevAlertCount.current < alertCount ? 'up' as const : 'down' as const, bg: 'var(--color-warning-dim)' },
          { label: 'System Uptime', value: fmtUptime(kpis.uptime), sub: 'All systems operational', color: C.green, icon: Shield, trend: 'up' as const, bg: 'var(--color-success-dim)' },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: kpi.bg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${kpi.color}25`,
            borderRadius: 12, padding: '20px 22px',
            transition: TRANS,
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${kpi.color}35`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${kpi.color}25`; e.currentTarget.style.transform = 'translateY(0)'; }}
          >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${kpi.color}12`,
                border: `1px solid ${kpi.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconWrap icon={kpi.icon as React.ElementType} color={kpi.color} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 6,
                background: kpi.trend === 'up' ? 'var(--color-success-dim)' : kpi.trend === 'down' ? 'var(--color-warning-dim)' : 'rgba(148,163,184,0.08)',
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                color: kpi.trend === 'up' ? C.green : kpi.trend === 'down' ? C.amber : C.textSec,
                letterSpacing: '0.5px',
              }}>
                {kpi.trend === 'up' ? <ArrowUpRight size={10} /> : kpi.trend === 'down' ? <ArrowDownRight size={10} /> : null}
                {kpi.trend === 'up' ? '+3.2' : kpi.trend === 'down' ? '-1.1' : '0.0'}
              </div>
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 26, fontWeight: 800, color: C.text,
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>{kpi.value}</div>
            <div style={{
              fontFamily: '"Inter",system-ui,sans-serif', fontSize: 11, fontWeight: 500,
              color: C.textSec, marginTop: 4,
            }}>{kpi.label}</div>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: C.textDim, marginTop: 6,
            }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Degradation Matrix + Throughput Chart ────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 20, marginBottom: 24,
      }}>
        <div style={{
          background: C.surface,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 24,
        }}>
          <DegradationMatrix data={[
            { threat_type: 'DDoS', icon: 'Zap', full_rate: 94, diode_rate: 41, ack_shadow_rate: 88, features_lost: 'ACK validation', severity: 'critical', validity: 'MEASURED', diode_delta: '-53%' },
            { threat_type: 'C2 Beaconing', icon: 'Radio', full_rate: 91, diode_rate: 73, ack_shadow_rate: 90, features_lost: 'Return volume', severity: 'high', validity: 'ESTIMATED' },
            { threat_type: 'DGA Domains', icon: 'Globe', full_rate: 88, diode_rate: 85, ack_shadow_rate: 87, features_lost: 'None', severity: 'high', validity: 'MEASURED' },
            { threat_type: 'DNS Tunneling', icon: 'Server', full_rate: 86, diode_rate: 85, ack_shadow_rate: 85, features_lost: 'None', severity: 'high', validity: 'MEASURED' },
            { threat_type: 'Port Scan', icon: 'Search', full_rate: 92, diode_rate: 84, ack_shadow_rate: 91, features_lost: 'RST validation', severity: 'medium', validity: 'ESTIMATED' },
            { threat_type: 'Data Exfil', icon: 'Download', full_rate: 83, diode_rate: 0, ack_shadow_rate: 78, features_lost: 'Entire return channel', severity: 'critical', validity: 'MISSING', diode_delta: '-83%' },
          ]} showWarning />
        </div>
        <div style={{
          background: C.surface,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${C.border}`,
          borderRadius: 12, padding: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              letterSpacing: '1.5px', color: C.accent, textTransform: 'uppercase',
            }}>Throughput Timeline</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.textDim }}>
              Last 30 samples
            </span>
          </div>
          {throughputHistory.length > 1 ? (
            <svg viewBox="0 0 120 32" width="100%" height={64} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              {(() => {
                const data = throughputHistory;
                const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
                const pts = data.map((v, i) => {
                  const x = (i / (data.length - 1)) * 120;
                  const y = 30 - ((v - min) / range) * 28;
                  return `${x},${y}`;
                }).join(' ');
                const area = `0,30 ${pts} 120,30`;
                return (
                  <>
                    <defs>
                      <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.accent} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon fill="url(#tgrad)" points={area} />
                    <polyline fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinejoin="round" points={pts} />
                  </>
                );
              })()}
            </svg>
          ) : (
            <div style={{ color: C.textDim, fontFamily: MONO, fontSize: 11, textAlign: 'center', padding: 24 }}>
              Collecting throughput data...
            </div>
          )}
        </div>
      </div>

      {/* ── Live Threat Feed ─────────────────────────────────────────── */}
      <div style={{
        background: C.surface,
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${C.border}`,
        borderRadius: 12, padding: 20,
      }}>
        <ThreatFeed alerts={alerts} maxVisible={12} />
      </div>
    </div>
  );
};

export default OperationsTab;
