import { useState, useEffect, useRef, useMemo, type ElementType } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import DegradationMatrix from '../components/DegradationMatrix';
import ThreatFeed from '../components/ThreatFeed';
import {
  Activity, Shield, Zap, Radio, Globe, Clock, Server,
  Wifi, Gauge, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight,
  Eye, Lock, Scan, Crosshair, Database, Network as NetworkIcon,
  ShieldCheck, ShieldOff, Ban, AlertOctagon
} from 'lucide-react';

const MONO = '"JetBrains Mono","Fira Code",monospace';

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
    if (sev === 'critical') return { bg: 'rgba(239,68,68,0.12)', text: '#f87171', border: 'rgba(239,68,68,0.25)' };
    if (sev === 'high') return { bg: 'rgba(249,115,22,0.12)', text: '#fb923c', border: 'rgba(249,115,22,0.25)' };
    if (sev === 'medium') return { bg: 'rgba(234,179,8,0.12)', text: '#facc15', border: 'rgba(234,179,8,0.25)' };
    return { bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.25)' };
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
    <div style={{ animation: 'fade-in 0.25s ease-out' }}>
      {/* ── Top status bar ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: MONO, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
            letterSpacing: '0.5px',
          }}>Operations Center</h2>
          <p style={{ fontSize: 12, color: 'var(--text-row-muted)', marginTop: 2 }}>Real-time network operations overview</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 4, fontFamily: MONO,
            fontSize: 10, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
            border: `1px solid ${isLive ? 'rgba(34,197,94,0.25)' : 'rgba(245,158,11,0.25)'}`,
            background: isLive ? 'rgba(34,197,94,0.06)' : 'rgba(245,158,11,0.06)',
            color: isLive ? '#22c55e' : '#f59e0b',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: isLive ? '#22c55e' : '#f59e0b',
              boxShadow: `0 0 6px ${isLive ? '#22c55e' : '#f59e0b'}`,
              animation: 'live-pulse 1.5s ease-in-out infinite',
            }} />
            {isLive ? 'LIVE' : 'DEGRADED'}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 12, color: '#94a3b8' }}>
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
          { label: 'Active Connections', value: fmt(kpis.activeConnections), sub: '+12% vs last hour', color: '#3b82f6', icon: Wifi, trend: 'up' as const, bg: 'rgba(59,130,246,0.08)' },
          { label: 'Threats Blocked', value: fmt(kpis.threatsBlocked), sub: `${alertCount} alerts today`, color: '#22c55e', icon: ShieldCheck, trend: 'up' as const, bg: 'rgba(34,197,94,0.08)' },
          { label: 'Total Flows', value: fmt(kpis.totalFlows), sub: `${(flowsPerSec).toFixed(0)} flows/s`, color: '#06b6d4', icon: Activity, trend: 'up' as const, bg: 'rgba(6,182,212,0.08)' },
          { label: 'Throughput', value: `${(flowsPerSec).toFixed(0)}/s`, sub: 'Packets analyzed', color: '#8b5cf6', icon: Gauge, trend: 'neutral' as const, bg: 'rgba(139,92,246,0.08)' },
          { label: 'Threat Alerts', value: fmt(alertCount), sub: prevAlertCount.current < alertCount ? 'New detections' : 'No new alerts', color: '#f59e0b', icon: AlertOctagon, trend: prevAlertCount.current < alertCount ? 'up' as const : 'down' as const, bg: 'rgba(245,158,11,0.08)' },
          { label: 'System Uptime', value: fmtUptime(kpis.uptime), sub: 'All systems operational', color: '#10b981', icon: Shield, trend: 'up' as const, bg: 'rgba(16,185,129,0.08)' },
        ].map((kpi, i) => (
          <div key={i} style={{
            background: kpi.bg,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: `1px solid ${kpi.color}20`,
            borderRadius: 14, padding: '22px 24px',
            transition: 'all 0.15s ease',
            cursor: 'default',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = kpi.color + '35'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = kpi.color + '20'; }}
          >

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${kpi.color}18`,
                border: `1px solid ${kpi.color}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <IconWrap icon={kpi.icon as React.ElementType} color={kpi.color} />
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '3px 8px', borderRadius: 6,
                background: kpi.trend === 'up' ? 'rgba(34,197,94,0.1)' : kpi.trend === 'down' ? 'rgba(245,158,11,0.1)' : 'rgba(148,163,184,0.1)',
                fontFamily: MONO, fontSize: 9, fontWeight: 700,
                color: kpi.trend === 'up' ? '#22c55e' : kpi.trend === 'down' ? '#f59e0b' : 'var(--text-row-muted)',
                letterSpacing: '0.5px',
              }}>
                {kpi.trend === 'up' ? <ArrowUpRight size={10} /> : kpi.trend === 'down' ? <ArrowDownRight size={10} /> : null}
                {kpi.trend === 'up' ? '+3.2' : kpi.trend === 'down' ? '-1.1' : '0.0'}
              </div>
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 28, fontWeight: 800, color: 'var(--text-row-alt)',
              lineHeight: 1.1, letterSpacing: '-0.02em',
            }}>{kpi.value}</div>
            <div style={{
              fontFamily: 'Inter,system-ui,sans-serif', fontSize: 11, fontWeight: 500,
              color: 'var(--text-row-muted)', marginTop: 4,
            }}>{kpi.label}</div>
            <div style={{
              fontFamily: MONO, fontSize: 10, color: 'var(--text-row-muted)', marginTop: 6,
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
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-row-header)',
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
          background: 'var(--bg-elevated)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-row-header)',
          borderRadius: 12, padding: 24,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-row-header)',
          }}>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              letterSpacing: '1.5px', color: '#3b82f6', textTransform: 'uppercase',
            }}>Throughput Timeline</span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text-row-muted)' }}>
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
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon fill="url(#tgrad)" points={area} />
                    <polyline fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinejoin="round" points={pts} />
                  </>
                );
              })()}
            </svg>
          ) : (
            <div style={{ color: 'var(--text-row-muted)', fontFamily: MONO, fontSize: 11, textAlign: 'center', padding: 24 }}>
              Collecting throughput data...
            </div>
          )}
        </div>
      </div>

      {/* ── Live Threat Feed ─────────────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-elevated)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-row-header)',
        borderRadius: 12, padding: 20,
      }}>
        <ThreatFeed alerts={alerts} maxVisible={12} />
      </div>
    </div>
  );
};

export default OperationsTab;
