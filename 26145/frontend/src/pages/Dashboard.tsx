import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert, Flow, Stats } from '../types';
import { mockBackend } from '../lib/mockBackend';
import {
  Shield, Activity, Gauge, Clock, Network, AlertTriangle,
  TrendingUp, Zap, Eye,
} from 'lucide-react';

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

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string; glow: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.08)', label: 'CRITICAL', glow: 'rgba(239, 68, 68, 0.4)' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.08)', label: 'HIGH', glow: 'rgba(249, 115, 22, 0.3)' },
  medium:   { color: '#eab308', bg: 'rgba(234, 179, 8, 0.08)', label: 'MEDIUM', glow: 'rgba(234, 179, 8, 0.2)' },
  low:      { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.08)', label: 'LOW', glow: 'rgba(6, 182, 212, 0.2)' },
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '2px',
  textTransform: 'uppercase',
  color: '#00d4ff',
  fontFamily: '"JetBrains Mono", monospace',
  marginBottom: 4,
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [uptime, setUptime] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const startTimeRef = useRef(Date.now());

  /* ── Backend ─────────────────────────────────────────────────────── */
  useEffect(() => {
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
  }, []);

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
    if (score > 150) return { level: 'CRITICAL', pct: 100, color: '#ef4444' };
    if (score > 80) return { level: 'HIGH', pct: Math.min((score / 150) * 100, 100), color: '#f97316' };
    if (score > 30) return { level: 'ELEVATED', pct: Math.min((score / 80) * 100, 100), color: '#eab308' };
    return { level: 'LOW', pct: Math.min((score / 30) * 100, 100), color: '#06b6d4' };
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

  /* ══════════════════════════════════════════════════════════════════
     RENDER — Main Dashboard
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      background: '#060a10',
      minHeight: '100vh',
      padding: '24px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#e2e8f0',
      position: 'relative',
    }}>
      {/* SYS.STATUS badge */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(10, 18, 28, 0.9)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 4,
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#94a3b8' }}>SYS.STATUS</span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#22c55e',
          textShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
          letterSpacing: '1px',
        }}>OPERATIONAL</span>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: '#22c55e',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
          animation: 'pulse-green 2s ease-in-out infinite',
        }} />
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: 32, paddingBottom: 16, borderBottom: '1px solid rgba(0, 212, 255, 0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={SECTION_LABEL_STYLE}>DASHBOARD</div>
            <h1 style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#00d4ff',
              letterSpacing: '3px',
              fontFamily: '"JetBrains Mono", monospace',
              margin: 0,
              lineHeight: 1.2,
              textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
            }}>
              EKADHARA<span style={{ color: '#64748b', fontSize: 14, fontWeight: 400, letterSpacing: '1px', marginLeft: 12 }}>v2.4.1</span>
            </h1>
            <p style={{
              fontSize: 12,
              color: '#64748b',
              marginTop: 4,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>
              PS-26145 · NTRO · SIH26 · REAL-TIME THREAT DETECTION
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#94a3b8',
              fontFamily: '"JetBrains Mono", monospace',
            }}>LIVE</span>
            <span style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 14px rgba(34, 197, 94, 0.9)',
              animation: 'pulse-green 1.5s ease-in-out infinite',
              display: 'inline-block',
            }} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          {
            label: 'TOTAL PROCESSED',
            value: totalProcessed.toLocaleString(),
            sub: `${flowsPerSec.toFixed(0)} flows/sec`,
            icon: Activity,
            iconBg: 'rgba(6, 182, 212, 0.1)',
            iconColor: '#06b6d4',
            valueColor: '#e2e8f0',
          },
          {
            label: 'ACTIVE THREATS',
            value: totalAlerts.toString(),
            sub: `${attackFlows.length} flagged flows`,
            icon: Shield,
            iconBg: 'rgba(239, 68, 68, 0.1)',
            iconColor: '#ef4444',
            valueColor: totalAlerts > 50 ? '#ef4444' : '#f97316',
            trend: totalAlerts > 50 ? '↑ +12% from avg' : null,
            trendColor: '#ef4444',
          },
          {
            label: 'AVG CONFIDENCE',
            value: `${avgConf.toFixed(1)}%`,
            sub: 'ensemble score',
            icon: Gauge,
            iconBg: 'rgba(168, 85, 247, 0.1)',
            iconColor: '#a855f7',
            valueColor: '#e2e8f0',
            trend: avgConf > 85 ? '↑ High accuracy' : null,
            trendColor: '#22c55e',
          },
          {
            label: 'UPTIME',
            value: formatUptime(uptime),
            sub: 'system running',
            icon: Clock,
            iconBg: 'rgba(234, 179, 8, 0.1)',
            iconColor: '#eab308',
            valueColor: '#22c55e',
          },
          {
            label: 'CONNECTIONS',
            value: activeConns.toLocaleString(),
            sub: 'simultaneous',
            icon: Network,
            iconBg: 'rgba(6, 182, 212, 0.1)',
            iconColor: '#06b6d4',
            valueColor: '#e2e8f0',
          },
          {
            label: 'CRITICAL',
            value: severityCounts.critical.toString(),
            sub: 'requires action',
            icon: AlertTriangle,
            iconBg: 'rgba(239, 68, 68, 0.1)',
            iconColor: '#ef4444',
            valueColor: '#ef4444',
            trend: severityCounts.critical > 0 ? '↑ Active incidents' : null,
            trendColor: '#ef4444',
          },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'rgba(10, 18, 28, 0.85)',
            border: '1px solid rgba(0, 212, 255, 0.15)',
            borderRadius: 4,
            padding: '16px',
            backdropFilter: 'blur(10px)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent)',
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: stat.iconBg,
                color: stat.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon size={18} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#94a3b8',
                fontFamily: '"JetBrains Mono", monospace',
              }}>{stat.label}</span>
            </div>
            <div style={{
              fontSize: 24,
              fontWeight: 800,
              color: stat.valueColor,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '1px',
              lineHeight: 1,
              marginBottom: 4,
            }}>
              {stat.value}
            </div>
            <div style={{
              fontSize: 11,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>{stat.sub}</div>
            {stat.trend && (
              <div style={{
                fontSize: 10,
                color: stat.trendColor,
                fontFamily: '"JetBrains Mono", monospace',
                marginTop: 4,
                fontWeight: 600,
                letterSpacing: '0.5px',
              }}>{stat.trend}</div>
            )}
          </div>
        ))}
      </div>

      {/* Threat Level */}
      <div style={{
        background: 'rgba(10, 18, 28, 0.85)',
        border: '1px solid rgba(0, 212, 255, 0.15)',
        borderRadius: 4,
        marginBottom: 24,
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={SECTION_LABEL_STYLE}>THREAT LEVEL</span>
          <span style={{
            padding: '4px 12px',
            borderRadius: 3,
            fontSize: 11,
            fontWeight: 700,
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '1px',
            color: threatLevel.color,
            background: `${threatLevel.color}15`,
            border: `1px solid ${threatLevel.color}40`,
            boxShadow: `0 0 12px ${threatLevel.color}30`,
          }}>
            {threatLevel.level}
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1,
              height: 8,
              background: 'rgba(0, 212, 255, 0.05)',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${threatLevel.pct}%`,
                height: '100%',
                background: threatLevel.color,
                boxShadow: `0 0 12px ${threatLevel.color}60`,
                borderRadius: 2,
                transition: 'width 0.5s ease',
              }} />
            </div>
            <span style={{
              fontSize: 13,
              fontWeight: 700,
              color: threatLevel.color,
              fontFamily: '"JetBrains Mono", monospace',
              minWidth: 60,
              textAlign: 'right',
              letterSpacing: '1px',
            }}>
              {threatLevel.pct.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Alert Timeline */}
        <div style={{
          background: 'rgba(10, 18, 28, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL_STYLE}>ALERT TIMELINE</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>LAST 20 MIN</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <svg viewBox="0 0 400 120" style={{ width: '100%', height: 120 }}>
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(y => (
                <line key={y} x1="0" y1={y * 1.2} x2="400" y2={y * 1.2}
                  stroke="rgba(0, 212, 255, 0.05)" strokeWidth="1" />
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
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={areaPoints} fill="url(#areaGradient)" />
                    <polyline points={points} fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                );
              })()}
              {/* Dots */}
              {alertTimeline.map((d, i) => {
                const max = Math.max(...alertTimeline.map(x => x.count), 1);
                const x = (i / Math.max(alertTimeline.length - 1, 1)) * 400;
                const y = 120 - (d.count / max) * 100;
                return d.count > 0 ? (
                  <circle key={i} cx={x} cy={y} r="3" fill="#00d4ff" style={{ filter: 'drop-shadow(0 0 2px #00d4ff)' }} />
                ) : null;
              })}
            </svg>
          </div>
        </div>

        {/* Threat Distribution */}
        <div style={{
          background: 'rgba(10, 18, 28, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL_STYLE}>THREAT DISTRIBUTION</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>{threatTypeData.length} TYPES</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            {threatTypeData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {threatTypeData.map((t, i) => {
                  const maxVal = Math.max(...threatTypeData.map(x => x.value), 1);
                  const pct = (t.value / maxVal) * 100;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#94a3b8',
                        minWidth: 120,
                        fontFamily: '"JetBrains Mono", monospace',
                        textTransform: 'capitalize',
                        letterSpacing: '0.5px',
                      }}>
                        {t.label}
                      </span>
                      <div style={{
                        flex: 1,
                        height: 6,
                        background: 'rgba(0, 212, 255, 0.05)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: '#00d4ff',
                          boxShadow: '0 0 8px rgba(0, 212, 255, 0.4)',
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#00d4ff',
                        minWidth: 28,
                        textAlign: 'right',
                        fontFamily: '"JetBrains Mono", monospace',
                      }}>
                        {t.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#475569',
              }}>
                <div style={{
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '1px',
                }}>NO THREATS DETECTED</div>
                <div style={{
                  fontSize: 10,
                  marginTop: 4,
                  color: '#334155',
                  fontFamily: '"JetBrains Mono", monospace',
                }}>Distribution will appear once detections start</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

        {/* Recent Alerts */}
        <div style={{
          background: 'rgba(10, 18, 28, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL_STYLE}>RECENT ALERTS</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>{alerts.length} TOTAL</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                }}>
                  {['SEVERITY', 'TIME', 'THREAT TYPE', 'SOURCE IP', 'DEST IP', 'CONFIDENCE'].map(h => (
                    <th key={h} style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: '#64748b',
                      fontFamily: '"JetBrains Mono", monospace',
                      textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{
                      padding: 40,
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: 11,
                      fontFamily: '"JetBrains Mono", monospace',
                      letterSpacing: '1px',
                    }}>
                      MONITORING ACTIVE — NO THREATS IN CURRENT WINDOW
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map((alert, idx) => {
                    const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
                    const rowBg = idx % 2 === 0 ? 'rgba(0, 212, 255, 0.02)' : 'transparent';
                    return (
                      <tr key={alert.id} style={{
                        background: rowBg,
                        borderBottom: '1px solid rgba(0, 212, 255, 0.04)',
                        transition: 'background 0.2s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                      >
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 3,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: '1px',
                            color: sev.color,
                            background: sev.bg,
                            border: `1px solid ${sev.color}30`,
                            boxShadow: `0 0 6px ${sev.glow}`,
                            fontFamily: '"JetBrains Mono", monospace',
                          }}>
                            {sev.label}
                          </span>
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: '#64748b',
                          letterSpacing: '0.5px',
                        }}>
                          {formatTime(alert.timestamp)}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          fontWeight: 600,
                          fontSize: 12,
                          color: '#e2e8f0',
                          fontFamily: '"JetBrains Mono", monospace',
                          textTransform: 'capitalize',
                        }}>
                          {alert.threat_type}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: '#06b6d4',
                          letterSpacing: '0.5px',
                        }}>
                          {alert.src_ip}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          color: '#06b6d4',
                          letterSpacing: '0.5px',
                        }}>
                          {alert.dst_ip}
                        </td>
                        <td style={{
                          padding: '8px 12px',
                          textAlign: 'right',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          <span style={{
                            color: alert.confidence > 85 ? '#22c55e' : alert.confidence > 60 ? '#eab308' : '#ef4444',
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
        <div style={{
          background: 'rgba(10, 18, 28, 0.85)',
          border: '1px solid rgba(0, 212, 255, 0.15)',
          borderRadius: 4,
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL_STYLE}>LIVE FLOWS</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>{flows.length} TOTAL</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 12,
            }}>
              <thead>
                <tr style={{
                  borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                }}>
                  {['TIME', 'SOURCE', 'DEST', 'BYTES', 'STATUS'].map(h => (
                    <th key={h} style={{
                      padding: '10px 8px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: '#64748b',
                      fontFamily: '"JetBrains Mono", monospace',
                      textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentFlows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{
                      padding: 40,
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: 11,
                      fontFamily: '"JetBrains Mono", monospace',
                      letterSpacing: '1px',
                    }}>
                      AWAITING FLOWS...
                    </td>
                  </tr>
                ) : (
                  recentFlows.map((flow, idx) => {
                    const rowBg = idx % 2 === 0 ? 'rgba(0, 212, 255, 0.02)' : 'transparent';
                    return (
                      <tr key={flow.id} style={{
                        background: rowBg,
                        borderBottom: '1px solid rgba(0, 212, 255, 0.04)',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = rowBg}
                      >
                        <td style={{
                          padding: '6px 8px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: '#64748b',
                          letterSpacing: '0.5px',
                        }}>
                          {formatTime(flow.timestamp)}
                        </td>
                        <td style={{
                          padding: '6px 8px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: '#94a3b8',
                          letterSpacing: '0.5px',
                        }}>
                          {flow.src_ip}:{flow.src_port}
                        </td>
                        <td style={{
                          padding: '6px 8px',
                          fontFamily: '"JetBrains Mono", monospace',
                          fontSize: 10,
                          color: '#94a3b8',
                          letterSpacing: '0.5px',
                        }}>
                          {flow.dst_ip}:{flow.dst_port}
                        </td>
                        <td style={{
                          padding: '6px 8px',
                          textAlign: 'right',
                          fontSize: 10,
                          fontFamily: '"JetBrains Mono", monospace',
                          color: '#64748b',
                        }}>
                          {formatBytes(flow.bytes_sent + flow.bytes_recv)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          {flow.isAttack ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '1px',
                              color: '#ef4444',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              boxShadow: '0 0 6px rgba(239, 68, 68, 0.3)',
                              fontFamily: '"JetBrains Mono", monospace',
                            }}>THREAT</span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '1px',
                              color: '#22c55e',
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              boxShadow: '0 0 6px rgba(34, 197, 94, 0.2)',
                              fontFamily: '"JetBrains Mono", monospace',
                            }}>OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inject pulse animation */}
      <style>{`
        @keyframes pulse-green {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
