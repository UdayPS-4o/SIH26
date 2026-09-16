import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield, Activity, Gauge, Clock, Network, AlertTriangle,
  TrendingUp, Zap, Eye, Crosshair, Radar, Scan,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
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

const THREAT_TYPES = [
  'DDoS', 'Data Exfiltration', 'DGA', 'Beaconing',
  'Brute Force', 'Port Scan', 'Malware', 'Phishing',
  'SQL Injection', 'XSS', 'Ransomware', 'Zero-Day',
];

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; label: string; glow: string }> = {
  critical: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', label: 'CRITICAL', glow: 'rgba(239, 68, 68, 0.5)' },
  high:     { color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', label: 'HIGH', glow: 'rgba(249, 115, 22, 0.4)' },
  medium:   { color: '#eab308', bg: 'rgba(234, 179, 8, 0.12)', label: 'MEDIUM', glow: 'rgba(234, 179, 8, 0.3)' },
  low:      { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.12)', label: 'LOW', glow: 'rgba(6, 182, 212, 0.3)' },
};

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: '#00d4ff',
  fontFamily: '"JetBrains Mono", monospace',
  marginBottom: 4,
};

const CARD_BASE: React.CSSProperties = {
  background: '#0a1118',
  border: '1px solid #1a2736',
  borderRadius: 8,
  padding: 20,
  position: 'relative',
  overflow: 'hidden',
};

const HOVER_GLOW: React.CSSProperties = {
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
};

/* ══════════════════════════════════════════════════════════════════════
   MOCK DATA GENERATOR
   ══════════════════════════════════════════════════════════════════════ */

const generateMockData = () => {
  const now = Date.now();
  const alerts: Array<{
    id: string;
    timestamp: number;
    threat_type: string;
    severity: string;
    src_ip: string;
    dst_ip: string;
    confidence: number;
  }> = [];
  for (let i = 0; i < 24; i++) {
    alerts.push({
      id: `ALT-${1000 + i}`,
      timestamp: now - i * 34000 - Math.floor(Math.random() * 10000),
      threat_type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)],
      src_ip: `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      dst_ip: `${192 + Math.floor(Math.random() * 16)}.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      confidence: 55 + Math.floor(Math.random() * 45),
    });
  }

  const threatCounts: Record<string, number> = {};
  THREAT_TYPES.forEach(t => { threatCounts[t] = Math.floor(Math.random() * 45) + 5; });
  threatCounts['DDoS'] = 87;
  threatCounts['Data Exfiltration'] = 42;
  threatCounts['DGA'] = 38;
  threatCounts['Beaconing'] = 35;
  threatCounts['Brute Force'] = 62;
  threatCounts['Port Scan'] = 71;
  threatCounts['Malware'] = 29;
  threatCounts['Phishing'] = 18;

  const severityCounts = { critical: 23, high: 47, medium: 83, low: 156 };

  return { alerts, threatCounts, severityCounts };
};

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED COMPONENTS
   ══════════════════════════════════════════════════════════════════════ */

const PulsingDot: React.FC<{ color?: string; size?: number }> = ({ color = '#22c55e', size = 8 }) => (
  <span style={{
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    boxShadow: `0 0 ${size}px ${color}80`,
    animation: 'wtd-pulse 1.5s ease-in-out infinite',
    display: 'inline-block',
    flexShrink: 0,
  }} />
);

const ProgressBar: React.FC<{
  value: number;
  max?: number;
  height?: number;
  animated?: boolean;
  color?: string;
  showLabel?: boolean;
}> = ({ value, max = 100, height = 6, animated = true, color = '#00d4ff', showLabel = false }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ position: 'relative', flex: 1 }}>
      <div style={{
        width: '100%',
        height,
        background: '#1a2736',
        borderRadius: height / 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, #00d4ff, #0088cc)`,
          borderRadius: height / 2,
          boxShadow: `0 0 8px ${color}40`,
          transition: 'width 1s ease-out',
          position: 'relative',
        }}>
          {animated && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'wtd-scan 2s ease-in-out infinite',
            }} />
          )}
        </div>
      </div>
      {showLabel && (
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#00d4ff',
          fontFamily: '"JetBrains Mono", monospace',
          marginLeft: 10,
          minWidth: 40,
        }}>
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value > 85 ? '#22c55e' : value > 60 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 48,
        height: 4,
        background: '#1a2736',
        borderRadius: 2,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
        }} />
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color,
        fontFamily: '"JetBrains Mono", monospace',
      }}>
        {value.toFixed(0)}%
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   BAR CHART — Threat Types Breakdown
   ══════════════════════════════════════════════════════════════════════ */

const BarChart: React.FC<{ data: Array<{ label: string; value: number }> }> = ({ data }) => {
  const maxVal = useMemo(() => Math.max(...data.map(d => d.value), 1), [data]);
  const barColors = useMemo(() => {
    const colors = ['#00d4ff', '#0088cc', '#06b6d4', '#0ea5e9', '#22c55e', '#a855f7', '#f97316', '#eab308', '#ef4444'];
    return data.map((_, i) => colors[i % colors.length]);
  }, [data]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Y-axis grid labels */}
      {[0, 25, 50, 75, 100].map(tick => (
        <div key={tick} style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          height: 28,
        }}>
          <span style={{
            fontSize: 9,
            color: '#334155',
            fontFamily: '"JetBrains Mono", monospace',
            width: 24,
            textAlign: 'right',
            flexShrink: 0,
          }}>
            {Math.round((tick / 100) * maxVal)}
          </span>
          <div style={{
            flex: 1,
            height: 1,
            background: tick > 0 ? '#1a2736' : 'transparent',
          }} />
        </div>
      ))}
      {/* Bars */}
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 9,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              width: 24,
              textAlign: 'right',
              flexShrink: 0,
              letterSpacing: '0.5px',
              textTransform: 'capitalize',
            }}>
              {d.value}
            </span>
            <div style={{
              flex: 1,
              height: 22,
              background: '#0d1520',
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
            }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                background: `linear-gradient(90deg, ${barColors[i]}40, ${barColors[i]}cc)`,
                borderRadius: 3,
                transition: 'width 1.2s ease-out',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 6,
                minWidth: pct > 10 ? 'auto' : 0,
              }}>
                {pct > 12 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#e0e8f0',
                    fontFamily: '"JetBrains Mono", monospace',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  }}>
                    {d.value}
                  </span>
                )}
              </div>
            </div>
            <span style={{
              fontSize: 9,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              width: 80,
              flexShrink: 0,
              letterSpacing: '0.3px',
              textTransform: 'uppercase',
            }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   DONUT CHART — Severity Distribution
   ══════════════════════════════════════════════════════════════════════ */

const DonutChart: React.FC<{ data: Array<{ label: string; value: number; color: string }> }> = ({ data }) => {
  const svgSize = 160;
  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const outerR = 70;
  const innerR = 44;

  const segments = useMemo(() => {
    const total = data.reduce((s, d) => s + d.value, 0);
    if (total === 0) return [];
    let angle = -90;
    return data.map(d => {
      const slice = (d.value / total) * 360;
      const startAngle = angle;
      const endAngle = angle + slice;
      angle = endAngle;
      return { ...d, startAngle, endAngle, pct: ((d.value / total) * 100).toFixed(1) };
    });
  }, [data]);

  const polarToXY = (angleDeg: number, r: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const buildArcPath = (startAngle: number, endAngle: number, outer: number, inner: number) => {
    const outerStart = polarToXY(startAngle, outer);
    const outerEnd = polarToXY(endAngle, outer);
    const innerStart = polarToXY(startAngle, inner);
    const innerEnd = polarToXY(endAngle, inner);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outer} ${outer} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${inner} ${inner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      'Z',
    ].join(' ');
  };

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="#1a2736" strokeWidth={outerR - innerR} />
        {/* Segments */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={buildArcPath(seg.startAngle, seg.endAngle + 1, outerR, innerR)}
            fill={seg.color}
            opacity={0.85}
            style={{ filter: `drop-shadow(0 0 3px ${seg.color}60)`, transition: 'all 0.3s' }}
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#e0e8f0" fontSize={18} fontWeight={800} fontFamily='"JetBrains Mono", monospace'>
          {total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#64748b" fontSize={8} fontWeight={700} letterSpacing="2px" fontFamily='"JetBrains Mono", monospace'>
          TOTAL
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => {
          const segPct = segments[i]?.pct || '0.0';
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8,
                height: 8,
                borderRadius: 2,
                background: d.color,
                boxShadow: `0 0 4px ${d.color}60`,
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 10,
                color: '#94a3b8',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                minWidth: 70,
              }}>
                {d.label}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#e0e8f0',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                {d.value}
              </span>
              <span style={{
                fontSize: 9,
                color: '#475569',
                fontFamily: '"JetBrains Mono", monospace',
              }}>
                ({segPct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD
   ══════════════════════════════════════════════════════════════════════ */

const Dashboard: React.FC = () => {
  const [uptime, setUptime] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(true);
  const startTimeRef = useRef(Date.now());

  const { alerts, threatCounts, severityCounts } = useMemo(() => generateMockData(), []);

  /* ── Uptime tick ──────────────────────────────────────────────────── */
  useEffect(() => {
    const iv = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  /* ── Scan progress animation ──────────────────────────────────────── */
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setScanProgress(prev => {
        if (prev >= 100) {
          setIsScanning(false);
          return 100;
        }
        // Slowly advance, then complete
        const increment = prev < 70 ? 0.15 : prev < 90 ? 0.05 : 0.02;
        return Math.min(prev + increment + Math.random() * 0.1, 100);
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  /* ── Derived stats ────────────────────────────────────────────────── */
  const totalScanned = 2_847_593;
  const threatsBlocked = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length * 137 + 8924;
  const activeConnections = 1847 + Math.floor(Math.sin(Date.now() / 5000) * 50);
  const alertsToday = alerts.length * 23 + 156;
  const detectionRate = 97.3 + Math.sin(Date.now() / 8000) * 1.2;
  const falsePositiveRate = 2.1 + Math.sin(Date.now() / 10000) * 0.5;
  const dataProcessed = 14.7; // TB

  const threatTypeData = useMemo(() =>
    Object.entries(threatCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value),
    [threatCounts]
  );

  const severityData = useMemo(() => [
    { label: 'Critical', value: severityCounts.critical, color: '#ef4444' },
    { label: 'High', value: severityCounts.high, color: '#f97316' },
    { label: 'Medium', value: severityCounts.medium, color: '#eab308' },
    { label: 'Low', value: severityCounts.low, color: '#06b6d4' },
  ], [severityCounts]);

  const recentAlerts = useMemo(() => alerts.slice(0, 15), [alerts]);

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div style={{
      background: '#060a10',
      minHeight: '100vh',
      padding: '24px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#e0e8f0',
      position: 'relative',
    }}>
      <style>{`
        @keyframes wtd-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.75); }
        }
        @keyframes wtd-scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes wtd-fadein {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes wtd-typing {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>

      {/* ── SYS.STATUS Badge ────────────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        background: 'rgba(10, 17, 24, 0.95)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        borderRadius: 4,
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '2px', color: '#64748b' }}>SYS.STATUS</span>
        <span style={{
          fontSize: 11,
          fontWeight: 700,
          color: '#22c55e',
          letterSpacing: '1px',
          textShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
        }}>OPERATIONAL</span>
        <PulsingDot color="#22c55e" size={7} />
      </div>

      {/* ── PAGE HEADER ─────────────────────────────────────────────── */}
      <div style={{
        marginBottom: 28,
        paddingBottom: 18,
        borderBottom: '1px solid rgba(0, 212, 255, 0.12)',
        animation: 'wtd-fadein 0.5s ease-out',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={SECTION_LABEL}>◈ DASHBOARD</div>
            <h1 style={{
              fontSize: 36,
              fontWeight: 800,
              color: '#00d4ff',
              letterSpacing: '4px',
              fontFamily: '"JetBrains Mono", monospace',
              margin: '4px 0 0 0',
              lineHeight: 1.1,
              textShadow: '0 0 30px rgba(0, 212, 255, 0.25)',
            }}>
              WATCHTOWER
            </h1>
            <p style={{
              fontSize: 11,
              color: '#475569',
              marginTop: 6,
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>
              NTRO · SIH26 · NATIONAL THREAT INTELLIGENCE PLATFORM · v3.2.1
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
            <span style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#94a3b8',
            }}>LIVE</span>
            <PulsingDot color="#22c55e" size={9} />
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>
              {formatTime(Date.now())}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 1: KPI STAT CARDS
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          {
            label: 'Total Scanned',
            value: totalScanned.toLocaleString(),
            sub: `${dataProcessed} TB processed`,
            icon: Activity,
            iconColor: '#00d4ff',
            iconBg: 'rgba(0, 212, 255, 0.08)',
            progress: 78,
            progressLabel: '78%',
            trend: '+2.4K/s',
            trendUp: true,
          },
          {
            label: 'Threats Blocked',
            value: threatsBlocked.toLocaleString(),
            sub: 'active countermeasures',
            icon: Shield,
            iconColor: '#ef4444',
            iconBg: 'rgba(239, 68, 68, 0.08)',
            progress: 92,
            progressLabel: '92%',
            trend: '+12%',
            trendUp: true,
          },
          {
            label: 'Active Connections',
            value: activeConnections.toLocaleString(),
            sub: 'simultaneous sessions',
            icon: Network,
            iconColor: '#a855f7',
            iconBg: 'rgba(168, 85, 247, 0.08)',
            progress: 65,
            progressLabel: '65%',
            trend: '+34',
            trendUp: true,
          },
          {
            label: 'Alerts Today',
            value: alertsToday.toLocaleString(),
            sub: 'detection events',
            icon: AlertTriangle,
            iconColor: '#f97316',
            iconBg: 'rgba(249, 115, 22, 0.08)',
            progress: 83,
            progressLabel: '83%',
            trend: '+7%',
            trendUp: true,
          },
          {
            label: 'Detection Rate',
            value: `${detectionRate.toFixed(1)}%`,
            sub: 'model accuracy',
            icon: Crosshair,
            iconColor: '#22c55e',
            iconBg: 'rgba(34, 197, 94, 0.08)',
            progress: detectionRate,
            progressLabel: `${detectionRate.toFixed(0)}%`,
            trend: 'HIGH',
            trendUp: true,
          },
          {
            label: 'False Positive',
            value: `${falsePositiveRate.toFixed(1)}%`,
            sub: 'noise filter rate',
            icon: Eye,
            iconColor: '#eab308',
            iconBg: 'rgba(234, 179, 8, 0.08)',
            progress: 100 - falsePositiveRate,
            progressLabel: `${(100 - falsePositiveRate).toFixed(0)}%`,
            trend: '-0.3%',
            trendUp: true,
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              ...CARD_BASE,
              animation: `wtd-fadein 0.5s ease-out ${i * 0.08}s both`,
              ...HOVER_GLOW,
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.4)';
              e.currentTarget.style.boxShadow = `0 0 20px rgba(0, 212, 255, 0.08), inset 0 1px 0 rgba(0, 212, 255, 0.1)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#1a2736';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Top glow line */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${stat.iconColor}40, transparent)`,
            }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: stat.iconBg,
                color: stat.iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <stat.icon size={20} strokeWidth={1.5} />
              </div>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '1.5px',
                color: '#64748b',
                fontFamily: '"Inter", "JetBrains Mono", monospace',
              }}>
                {stat.label.toUpperCase()}
              </span>
            </div>

            {/* BIG NUMBER */}
            <div style={{
              fontSize: 34,
              fontWeight: 800,
              color: '#e0e8f0',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {stat.value}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}>
              <span style={{
                fontSize: 10,
                color: '#475569',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.3px',
              }}>
                {stat.sub}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: stat.trendUp ? '#22c55e' : '#ef4444',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.5px',
              }}>
                {stat.trend}
              </span>
            </div>

            {/* Mini progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1,
                height: 4,
                background: '#1a2736',
                borderRadius: 2,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(stat.progress, 100)}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${stat.iconColor}80, ${stat.iconColor})`,
                  borderRadius: 2,
                  boxShadow: `0 0 6px ${stat.iconColor}40`,
                  transition: 'width 1s ease-out',
                }} />
              </div>
              <span style={{
                fontSize: 9,
                fontWeight: 700,
                color: stat.iconColor,
                fontFamily: '"JetBrains Mono", monospace',
                minWidth: 28,
                textAlign: 'right',
              }}>
                {stat.progressLabel}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 2: SCAN PROGRESS
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        ...CARD_BASE,
        marginBottom: 24,
        animation: 'wtd-fadein 0.5s ease-out 0.5s both',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={SECTION_LABEL}>◈ NATIONAL TRAFFIC ANALYSIS</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isScanning ? (
              <>
                <span style={{
                  fontSize: 10,
                  color: '#00d4ff',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '1px',
                  animation: 'wtd-pulse 1s ease-in-out infinite',
                }}>
                  SCANNING...
                </span>
                <PulsingDot color="#00d4ff" size={6} />
              </>
            ) : (
              <span style={{
                fontSize: 10,
                color: '#22c55e',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '1px',
                fontWeight: 700,
              }}>
                COMPLETE
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{
                height: 12,
                background: '#1a2736',
                borderRadius: 6,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(0, 212, 255, 0.08)',
              }}>
                <div style={{
                  width: `${scanProgress}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, #00d4ff, #0088cc)`,
                  borderRadius: 6,
                  boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
                  position: 'relative',
                  transition: 'width 0.3s ease-out',
                }}>
                  {isScanning && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                      animation: 'wtd-scan 1.8s ease-in-out infinite',
                    }} />
                  )}
                </div>
                {/* Tick marks */}
                {[0, 25, 50, 75, 100].map(tick => (
                  <div key={tick} style={{
                    position: 'absolute',
                    left: `${tick}%`,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'rgba(0, 212, 255, 0.15)',
                  }} />
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{
                  fontSize: 9,
                  color: '#475569',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px',
                }}>
                  SESSION INIT
                </span>
                <span style={{
                  fontSize: 9,
                  color: '#475569',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px',
                }}>
                  TRAFFIC ANALYSIS
                </span>
                <span style={{
                  fontSize: 9,
                  color: '#475569',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px',
                }}>
                  THREAT MATCHING
                </span>
                <span style={{
                  fontSize: 9,
                  color: '#475569',
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: '0.5px',
                }}>
                  REPORT GENERATION
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right', minWidth: 80 }}>
              <div style={{
                fontSize: 42,
                fontWeight: 800,
                color: '#00d4ff',
                fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1,
                textShadow: '0 0 20px rgba(0, 212, 255, 0.3)',
              }}>
                {scanProgress.toFixed(0)}<span style={{ fontSize: 20 }}>%</span>
              </div>
              <div style={{
                fontSize: 9,
                color: '#475569',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '0.5px',
                marginTop: 4,
              }}>
                {isScanning ? 'PROCESSING' : 'FINISHED'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 3: CHARTS ROW — Bar + Donut
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: 16,
        marginBottom: 24,
      }}>
        {/* Threat Types Bar Chart */}
        <div style={{
          ...CARD_BASE,
          animation: 'wtd-fadein 0.5s ease-out 0.6s both',
        }}>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL}>◈ THREAT TYPE DISTRIBUTION</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>
              {threatTypeData.length} CLASSIFICATIONS
            </span>
          </div>
          <div style={{ padding: '20px', overflowX: 'auto' }}>
            <BarChart data={threatTypeData} />
          </div>
        </div>

        {/* Severity Donut Chart */}
        <div style={{
          ...CARD_BASE,
          animation: 'wtd-fadein 0.5s ease-out 0.7s both',
        }}>
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={SECTION_LABEL}>◈ SEVERITY BREAKDOWN</span>
            <span style={{
              fontSize: 10,
              color: '#64748b',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '0.5px',
            }}>
              LIVE FEED
            </span>
          </div>
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <DonutChart data={severityData} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
           SECTION 4: LIVE THREAT FEED TABLE
         ══════════════════════════════════════════════════════════════ */}
      <div style={{
        ...CARD_BASE,
        animation: 'wtd-fadein 0.5s ease-out 0.8s both',
      }}>
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid rgba(0, 212, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={SECTION_LABEL}>◈ LIVE THREAT FEED</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PulsingDot color="#ef4444" size={6} />
              <span style={{
                fontSize: 9,
                color: '#ef4444',
                fontFamily: '"JetBrains Mono", monospace',
                letterSpacing: '1px',
                fontWeight: 700,
              }}>
                STREAMING
              </span>
            </div>
          </div>
          <span style={{
            fontSize: 10,
            color: '#64748b',
            fontFamily: '"JetBrains Mono", monospace',
            letterSpacing: '0.5px',
          }}>
            {alerts.length} EVENTS · LAST 60 MIN
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid rgba(0, 212, 255, 0.1)',
                background: 'rgba(0, 212, 255, 0.02)',
              }}>
                {['SEVERITY', 'TIMESTAMP', 'THREAT TYPE', 'SOURCE IP', 'DEST IP', 'CONFIDENCE', 'STATUS'].map(h => (
                  <th key={h} style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    color: '#64748b',
                    fontFamily: '"Inter", "JetBrains Mono", monospace',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: 60,
                    textAlign: 'center',
                    color: '#475569',
                    fontSize: 11,
                    fontFamily: '"JetBrains Mono", monospace',
                    letterSpacing: '1px',
                  }}>
                    MONITORING ACTIVE — AWAITING THREAT SIGNATURES...
                  </td>
                </tr>
              ) : (
                recentAlerts.map((alert, idx) => {
                  const sev = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.low;
                  const isNew = idx < 3;
                  return (
                    <tr key={alert.id} style={{
                      background: isNew ? `${sev.bg}` : idx % 2 === 0 ? 'rgba(0, 212, 255, 0.015)' : 'transparent',
                      borderBottom: '1px solid rgba(0, 212, 255, 0.04)',
                      transition: 'all 0.2s',
                      animation: isNew ? 'wtd-fadein 0.3s ease-out' : undefined,
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0, 212, 255, 0.05)'; }}
                      onMouseLeave={(e) => {
                        if (isNew) e.currentTarget.style.background = sev.bg;
                        else e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(0, 212, 255, 0.015)' : 'transparent';
                      }}
                    >
                      {/* Severity */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 4,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '1px',
                          color: sev.color,
                          background: sev.bg,
                          border: `1px solid ${sev.color}25`,
                          boxShadow: `0 0 6px ${sev.glow}`,
                          fontFamily: '"JetBrains Mono", monospace',
                        }}>
                          <span style={{
                            width: 5,
                            height: 5,
                            borderRadius: '50%',
                            background: sev.color,
                            boxShadow: `0 0 4px ${sev.glow}`,
                            flexShrink: 0,
                          }} />
                          {sev.label}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td style={{
                        padding: '10px 14px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: '#64748b',
                        letterSpacing: '0.5px',
                        whiteSpace: 'nowrap',
                      }}>
                        {formatTime(alert.timestamp)}
                      </td>

                      {/* Threat Type */}
                      <td style={{
                        padding: '10px 14px',
                        fontWeight: 600,
                        fontSize: 12,
                        color: '#e0e8f0',
                        fontFamily: '"JetBrains Mono", monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}>
                        {alert.threat_type}
                      </td>

                      {/* Source IP */}
                      <td style={{
                        padding: '10px 14px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: '#06b6d4',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                      }}>
                        {alert.src_ip}
                      </td>

                      {/* Dest IP */}
                      <td style={{
                        padding: '10px 14px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: '#94a3b8',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                      }}>
                        {alert.dst_ip}
                      </td>

                      {/* Confidence Bar */}
                      <td style={{ padding: '10px 14px' }}>
                        <ConfidenceBar value={alert.confidence} />
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 10px',
                          borderRadius: 3,
                          fontSize: 9,
                          fontWeight: 700,
                          letterSpacing: '1px',
                          color: alert.severity === 'critical' || alert.severity === 'high'
                            ? '#ef4444'
                            : '#22c55e',
                          background: alert.severity === 'critical' || alert.severity === 'high'
                            ? 'rgba(239, 68, 68, 0.1)'
                            : 'rgba(34, 197, 94, 0.1)',
                          border: `1px solid ${alert.severity === 'critical' || alert.severity === 'high'
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(34, 197, 94, 0.3)'}`,
                          boxShadow: alert.severity === 'critical' || alert.severity === 'high'
                            ? '0 0 6px rgba(239, 68, 68, 0.3)'
                            : '0 0 6px rgba(34, 197, 94, 0.2)',
                          fontFamily: '"JetBrains Mono", monospace',
                        }}>
                          {alert.severity === 'critical' || alert.severity === 'high' ? 'BLOCKED' : 'LOGGED'}
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

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        marginTop: 20,
        padding: '12px 0',
        borderTop: '1px solid rgba(0, 212, 255, 0.06)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 9,
          color: '#334155',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '1px',
        }}>
          WATCHTOWER v3.2.1 · NTRO · SIH26 · UPTIME: {formatUptime(uptime)}
        </span>
        <span style={{
          fontSize: 9,
          color: '#334155',
          fontFamily: '"JetBrains Mono", monospace',
          letterSpacing: '0.5px',
        }}>
          LAST SYNC: {formatTime(Date.now())}
        </span>
      </div>
    </div>
  );
};

export default Dashboard;
