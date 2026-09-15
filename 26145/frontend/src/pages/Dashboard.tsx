import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert, Flow, Stats } from '../types';
import { mockBackend } from '../lib/mockBackend';
import {
  Shield, Activity, Gauge, Clock, Network, AlertTriangle,
  TrendingUp, Zap, Eye,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   BOOT SCREEN — Clean loading experience
   ══════════════════════════════════════════════════════════════════════ */

function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Initializing system...');

  useEffect(() => {
    const stages = [
      { pct: 15, text: 'Loading ML models...' },
      { pct: 35, text: 'Initializing traffic simulator...' },
      { pct: 55, text: 'Starting detection strategies...' },
      { pct: 75, text: 'Connecting WebSocket...' },
      { pct: 90, text: 'Loading threat intelligence...' },
      { pct: 100, text: 'System ready' },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < stages.length) {
        setProgress(stages[i].pct);
        setStatus(stages[i].text);
        i++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 400);
      }
    }, 350);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="boot-screen">
      <div className="boot-logo">
        <Shield size={48} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'white', marginBottom: 4 }}>
          EKADHARA
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
          AI-Based Cyber Threat Detection
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>
          PS-26145 · NTRO · SIH26
        </div>
      </div>
      <div className="boot-progress-container">
        <div className="boot-progress-bar" style={{ width: `${progress}%` }} />
      </div>
      <div className="boot-status">{status}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════════ */

const formatUptime = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
};

const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${bytes}B`;
};

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)', label: 'Critical' },
  high:     { color: '#ea580c', bg: 'rgba(249, 115, 22, 0.1)', label: 'High' },
  medium:   { color: '#d97706', bg: 'rgba(245, 158, 11, 0.1)', label: 'Medium' },
  low:      { color: '#0891b2', bg: 'rgba(6, 182, 212, 0.1)', label: 'Low' },
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const [booted, setBooted] = useState(() => !sessionStorage.getItem('ekadhara-booted'));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [uptime, setUptime] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const startTimeRef = useRef(Date.now());

  /* ── Boot ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (booted) return;
    const backend = mockBackend;

    const handleAlert = (alert: Alert): void => {
      setAlerts(prev => [alert, ...prev].slice(0, 200));
    };
    const handleFlow = (flow: Flow): void => {
      setFlows(prev => [flow, ...prev].slice(0, 100));
      setTotalProcessed(c => c + 1);
    };
    const handleStats = (s: Stats): void => {
      setStats(s);
    };

    backend.onAlert(handleAlert);
    backend.onFlow(handleFlow);
    backend.onStats(handleStats);
    backend.start();

    Promise.all([
      backend.getFlows(50),
      backend.getAlerts(50, 0),
      backend.getStats(),
    ]).then(([initialFlows, initialAlerts, initialStats]) => {
      setFlows(initialFlows);
      setAlerts(initialAlerts);
      setStats(initialStats);
    });

    startTimeRef.current = Date.now();
    return () => {
      backend.off('alert', handleAlert);
      backend.off('flow', handleFlow);
      backend.off('stats', handleStats);
      backend.stop();
    };
  }, [booted]);

  /* ── Uptime ────────────────────────────────────────────────────── */
  useEffect(() => {
    const iv = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ── Derived Data ─────────────────────────────────────────────── */
  const attackFlows = useMemo(() => flows.filter(f => f.isAttack), [flows]);
  const recentAlerts = useMemo(() => alerts.slice(0, 20), [alerts]);
  const recentFlows = useMemo(() => flows.slice(0, 15), [flows]);

  const threatCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    alerts.forEach(a => { counts[a.threat_type] = (counts[a.threat_type] || 0) + 1; });
    return counts;
  }, [alerts]);

  const severityCounts = useMemo(() => {
    const c = { critical: 0, high: 0, medium: 0, low: 0 };
    alerts.forEach(a => { if (c.hasOwnProperty(a.severity)) c[a.severity]++; });
    return c;
  }, [alerts]);

  const threatLevel = useMemo(() => {
    const tp = stats?.threats_per_type || {};
    const score =
      (tp['DDoS'] || 0) * 3 + (tp['Data Exfiltration'] || 0) * 3 +
      (tp['DGA'] || 0) * 2 + (tp['Beaconing'] || 0) * 2 +
      (tp['Brute Force'] || 0) * 1.5 + (tp['Port Scan'] || 0) * 1 +
      (tp['Malware'] || 0) * 2.5 + (tp['Phishing'] || 0) * 1;
    if (score > 150) return { level: 'CRITICAL', pct: 100, color: '#dc2626' };
    if (score > 80) return { level: 'HIGH', pct: Math.min((score / 150) * 100, 100), color: '#ea580c' };
    if (score > 30) return { level: 'ELEVATED', pct: Math.min((score / 80) * 100, 100), color: '#d97706' };
    return { level: 'LOW', pct: Math.min((score / 30) * 100, 100), color: '#0891b2' };
  }, [stats]);

  const alertTimeline = useMemo(() => {
    const now = Date.now();
    const buckets: Record<number, number> = {};
    for (let i = 19; i >= 0; i--) buckets[now - i * 60000] = 0;
    alerts.forEach(a => {
      const slot = Math.floor((a.timestamp - (now - 19 * 60000)) / 60000);
      if (slot >= 0 && slot <= 19) {
        const key = now - (19 - slot) * 60000;
        buckets[key] = (buckets[key] || 0) + 1;
      }
    });
    return Object.entries(buckets)
      .map(([ts, count]) => ({ time: formatTime(+ts), count }))
      .slice(-20);
  }, [alerts]);

  const threatTypeData = useMemo(() => {
    return Object.entries(threatCounts)
      .map(([name, count]) => ({ label: name, value: count as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [threatCounts]);

  const flowsPerSec = stats?.flows_per_sec || 0;
  const totalFlows = stats?.total_flows || flows.length;
  const totalAlerts = stats?.total_alerts || alerts.length;
  const avgConf = stats?.avg_confidence || 0;
  const activeConns = stats?.active_connections || 0;

  /* ── Boot Screen ──────────────────────────────────────────────── */
  if (booted) {
    return <BootScreen onComplete={() => { sessionStorage.setItem('ekadhara-booted', '1'); setBooted(false); }} />;
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER — Main Dashboard
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-description">
              Real-time threat detection and network monitoring overview
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div className="live-indicator">Live</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
            <Activity size={20} />
          </div>
          <div className="stat-card-label">Total Processed</div>
          <div className="stat-card-value">{totalProcessed.toLocaleString()}</div>
          <div className="stat-card-sub">{flowsPerSec.toFixed(0)} flows/sec</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
            <Shield size={20} />
          </div>
          <div className="stat-card-label">Active Threats</div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>{totalAlerts}</div>
          <div className="stat-card-sub">{attackFlows.length} flagged flows</div>
          {totalAlerts > 50 && (
            <div className="stat-card-trend down">↑ +12% from avg</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <Gauge size={20} />
          </div>
          <div className="stat-card-label">Avg Confidence</div>
          <div className="stat-card-value">{avgConf.toFixed(1)}%</div>
          <div className="stat-card-sub">ensemble score</div>
          {avgConf > 85 && (
            <div className="stat-card-trend up">↑ High accuracy</div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <Clock size={20} />
          </div>
          <div className="stat-card-label">Uptime</div>
          <div className="stat-card-value">{formatUptime(uptime)}</div>
          <div className="stat-card-sub">system running</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <Network size={20} />
          </div>
          <div className="stat-card-label">Connections</div>
          <div className="stat-card-value">{activeConns.toLocaleString()}</div>
          <div className="stat-card-sub">simultaneous</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            <AlertTriangle size={20} />
          </div>
          <div className="stat-card-label">Critical</div>
          <div className="stat-card-value" style={{ color: '#dc2626' }}>{severityCounts.critical}</div>
          <div className="stat-card-sub">requires action</div>
          {severityCounts.critical > 0 && (
            <div className="stat-card-trend down">↑ Active incidents</div>
          )}
        </div>
      </div>

      {/* Threat Level */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <span className="card-title">Threat Level</span>
          <span style={{
            padding: '4px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: 12,
            fontWeight: 700,
            color: threatLevel.color,
            background: threatLevel.color + '15',
            border: '1px solid ' + threatLevel.color + '30',
          }}>
            {threatLevel.level}
          </span>
        </div>
        <div className="card-body" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="progress-bar" style={{ flex: 1, height: 10 }}>
              <div className="progress-fill" style={{
                width: `${threatLevel.pct}%`,
                background: threatLevel.color,
                boxShadow: `0 0 8px ${threatLevel.color}40`,
              }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: threatLevel.color, minWidth: 60, textAlign: 'right' }}>
              {threatLevel.pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Alert Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Alert Timeline</span>
            <span className="card-subtitle">Last 20 minutes</span>
          </div>
          <div className="card-body">
            <svg viewBox="0 0 400 120" style={{ width: '100%', height: 120 }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y * 1.2} x2="400" y2={y * 1.2}
                  stroke="#f1f5f9" strokeWidth="1" />
              ))}
              {/* Area */}
              {alertTimeline.length > 1 && (() => {
                const max = Math.max(...alertTimeline.map(d => d.count), 1);
                const points = alertTimeline.map((d, i) => {
                  const x = (i / Math.max(alertTimeline.length - 1, 1)) * 400;
                  const y = 120 - (d.count / max) * 100;
                  return `${x},${y}`;
                }).join(' ');
                const areaPoints = `0,120 ${points} 400,120`;
                return (
                  <>
                    <polygon points={areaPoints} fill="rgba(59, 130, 246, 0.08)" />
                    <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}
              {/* Dots */}
              {alertTimeline.map((d, i) => {
                const max = Math.max(...alertTimeline.map(x => x.count), 1);
                const x = (i / Math.max(alertTimeline.length - 1, 1)) * 400;
                const y = 120 - (d.count / max) * 100;
                return d.count > 0 ? (
                  <circle key={i} cx={x} cy={y} r="3" fill="#3b82f6" />
                ) : null;
              })}
            </svg>
          </div>
        </div>

        {/* Threat Distribution */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Threat Distribution</span>
            <span className="card-subtitle">{threatTypeData.length} types detected</span>
          </div>
          <div className="card-body">
            {threatTypeData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {threatTypeData.map((t, i) => {
                  const maxVal = Math.max(...threatTypeData.map(x => x.value), 1);
                  const pct = (t.value / maxVal) * 100;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', minWidth: 100, textTransform: 'capitalize' }}>
                        {t.label}
                      </span>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill progress-fill-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 28, textAlign: 'right' }}>
                        {t.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-title">No threats detected yet</div>
                <div className="empty-state-description">Threat distribution will appear here once detections start</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Alerts</span>
            <span className="card-subtitle">{alerts.length} total</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Time</th>
                  <th>Threat Type</th>
                  <th>Source IP</th>
                  <th>Destination IP</th>
                  <th style={{ textAlign: 'right' }}>Confidence</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state" style={{ padding: 32 }}>
                        <div className="empty-state-icon">🛡️</div>
                        <div className="empty-state-title">Monitoring active</div>
                        <div className="empty-state-description">No threats detected in the current window</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map(alert => {
                    const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
                    return (
                      <tr key={alert.id}>
                        <td>
                          <span className={`badge badge-${alert.severity}`}>{sev.label}</span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {formatTime(alert.timestamp)}
                        </td>
                        <td style={{ fontWeight: 500 }}>{alert.threat_type}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{alert.src_ip}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{alert.dst_ip}</td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          <span style={{
                            color: alert.confidence > 85 ? 'var(--green-600)' : alert.confidence > 60 ? 'var(--amber-500)' : 'var(--red-600)',
                            fontWeight: 600,
                          }}>
                            {alert.confidence.toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Flows */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Live Flows</span>
            <span className="card-subtitle">{flows.length} total</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Source</th>
                  <th>Dest</th>
                  <th style={{ textAlign: 'right' }}>Bytes</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentFlows.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state" style={{ padding: 24 }}>
                        <div className="empty-state-title">Awaiting flows</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentFlows.map(flow => (
                    <tr key={flow.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {formatTime(flow.timestamp)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {flow.src_ip}:{flow.src_port}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {flow.dst_ip}:{flow.dst_port}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: 12 }}>
                        {formatBytes(flow.bytes_sent + flow.bytes_recv)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {flow.isAttack ? (
                          <span className="badge badge-critical">Threat</span>
                        ) : (
                          <span className="badge badge-success">OK</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
