import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Shield, Activity, Zap, HardDrive, Gauge, Clock, Network,
  AlertTriangle, TrendingUp, Eye, Crosshair, Radar, Scan, Globe,
} from 'lucide-react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { fetchStats, fetchHealth } from '../lib/api';

/* ══════════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ══════════════════════════════════════════════════════════════════════ */

const SECTION_LABEL: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '3px',
  textTransform: 'uppercase',
  color: 'var(--accent-cyan)',
  fontFamily: '"JetBrains Mono", monospace',
  marginBottom: 4,
};

const CARD_BASE: React.CSSProperties = {
  background: 'var(--bg-secondary)',
  border: '1px solid #1a2736',
  borderRadius: 8,
  padding: 20,
  position: 'relative',
  overflow: 'hidden',
};

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

const formatLakh = (n: number): string => {
  if (n >= 1e7) return `${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `${(n / 1e5).toFixed(2)} lakh`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString();
};

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
  critical: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.12)', label: 'CRITICAL', glow: 'rgba(239, 68, 68, 0.5)' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(249, 115, 22, 0.12)', label: 'HIGH', glow: 'rgba(249, 115, 22, 0.4)' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(234, 179, 8, 0.12)', label: 'MEDIUM', glow: 'rgba(234, 179, 8, 0.3)' },
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.12)', label: 'LOW', glow: 'rgba(6, 182, 212, 0.3)' },
};

const THREAT_LEVEL_CONFIG: Record<string, { color: string; bg: string; label: string; glow: string }> = {
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(6, 182, 212, 0.15)', label: 'LOW', glow: 'rgba(6, 182, 212, 0.4)' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(234, 179, 8, 0.15)', label: 'MEDIUM', glow: 'rgba(234, 179, 8, 0.4)' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(249, 115, 22, 0.15)', label: 'HIGH', glow: 'rgba(249, 115, 22, 0.4)' },
  critical: { color: 'var(--accent-red)', bg: 'rgba(239, 68, 68, 0.15)', label: 'CRITICAL', glow: 'rgba(239, 68, 68, 0.4)' },
};

/* ══════════════════════════════════════════════════════════════════════
   MOCK DATA GENERATOR
   ══════════════════════════════════════════════════════════════════════ */

const generateMockData = () => {
  const now = Date.now();
  const alerts: any[] = [];
  for (let i = 0; i < 24; i++) {
    const sevList = ['critical', 'high', 'medium', 'low'];
    const sev = sevList[Math.floor(Math.random() * 4)];
    alerts.push({
      id: `ALT-${1000 + i}`,
      timestamp: now - i * 34000 - Math.floor(Math.random() * 10000),
      threat_type: THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)],
      severity: sev,
      src_ip: `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      dst_ip: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      confidence: 55 + Math.floor(Math.random() * 45),
      flow_count: Math.floor(Math.random() * 30) + 1,
    });
  }

  const flows: any[] = [];
  for (let i = 0; i < 20; i++) {
    flows.push({
      id: `FLW-${5000 + i}`,
      timestamp: now - i * 5000,
      src_ip: `${10 + Math.floor(Math.random() * 240)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      dst_ip: `192.168.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
      src_port: 1024 + Math.floor(Math.random() * 60000),
      dst_port: 80 + Math.floor(Math.random() * 100),
      protocol: ['TCP', 'UDP', 'HTTP', 'DNS'][Math.floor(Math.random() * 4)],
      bytes_sent: Math.floor(Math.random() * 50000),
      bytes_recv: Math.floor(Math.random() * 50000),
      packets: Math.floor(Math.random() * 200),
      duration: Math.floor(Math.random() * 600),
      isAttack: Math.random() > 0.7,
      attack_type: Math.random() > 0.7 ? THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)] : undefined,
    });
  }

  return {
    alerts,
    flows,
    stats: {
      total_flows: 2847563,
      total_alerts: 1247,
      avg_confidence: 87.4,
      flows_per_sec: 342,
      active_connections: 18420,
    },
    health: {
      status: 'healthy',
      uptime: 2847563,
      cpu: 34 + Math.floor(Math.random() * 30),
      memory: 52 + Math.floor(Math.random() * 25),
    },
  };
};

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED COMPONENTS
   ══════════════════════════════════════════════════════════════════════ */

const PulsingDot: React.FC<{ color?: string; size?: number }> = ({ color = 'var(--accent-green)', size = 8 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color,
      boxShadow: `0 0 ${size}px ${color}80`,
      animation: 'wtd-pulse 1.5s ease-in-out infinite',
      display: 'inline-block',
      flexShrink: 0,
    }}
  />
);

const ProgressBar: React.FC<{
  value: number;
  max?: number;
  height?: number;
  color?: string;
  showLabel?: boolean;
}> = ({ value, max = 100, height = 6, color = 'var(--accent-cyan)', showLabel = false }) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div
        style={{
          flex: 1,
          height,
          background: 'var(--border-color)',
          borderRadius: height / 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
            borderRadius: height / 2,
            boxShadow: `0 0 8px ${color}40`,
            transition: 'width 1s ease-out',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              animation: 'wtd-scan 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color,
            fontFamily: '"JetBrains Mono", monospace',
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {pct.toFixed(0)}%
        </span>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   SPARKLINE COMPONENT
   ══════════════════════════════════════════════════════════════════════ */

const Sparkline: React.FC<{ data: number[]; color?: string; height?: number }> = ({
  data, color = 'var(--accent-cyan)', height = 32,
}) => {
  const width = 120;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#sparkGrad-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="2.5" fill={color} />
    </svg>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   RADIAL GAUGE (Threat Level)
   ══════════════════════════════════════════════════════════════════════ */

const ThreatGauge: React.FC<{ level: 'low' | 'medium' | 'high' | 'critical'; value: number }> = ({
  level, value,
}) => {
  const config = THREAT_LEVEL_CONFIG[level] || THREAT_LEVEL_CONFIG.low;
  const size = 160;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / 100, 1);
  const dashoffset = circumference * (1 - pct);
  const center = size / 2;

  const segments = [
    { from: 0, to: 25, color: 'var(--accent-cyan)', label: 'LOW' },
    { from: 25, to: 50, color: 'var(--accent-yellow)', label: 'MED' },
    { from: 50, to: 75, color: 'var(--accent-orange)', label: 'HIGH' },
    { from: 75, to: 100, color: 'var(--accent-red)', label: 'CRIT' },
  ];

  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-color)"
          strokeWidth={strokeWidth}
        />
        {/* colored segments */}
        {segments.map((seg) => {
          const segStart = (seg.from / 100) * circumference;
          const segLen = ((seg.to - seg.from) / 100) * circumference;
          return (
            <circle
              key={seg.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segLen} ${circumference - segLen}`}
              strokeDashoffset={-segStart}
              opacity={0.25}
            />
          );
        })}
        {/* active arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
        />
        {/* glow on active end */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={config.color}
          strokeWidth={strokeWidth + 6}
          strokeDasharray={`${circumference * pct} ${circumference}`}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          opacity={0.2}
          style={{ filter: `drop-shadow(0 0 6px ${config.glow || config.color})` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'none',
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '2px',
            color: config.color,
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          THREAT LEVEL
        </span>
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: config.color,
            fontFamily: '"JetBrains Mono", monospace',
            lineHeight: 1,
            textShadow: `0 0 12px ${config.glow || config.color}`,
          }}
        >
          {config.label}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-secondary)',
            fontFamily: '"JetBrains Mono", monospace',
            marginTop: 2,
          }}
        >
          {Math.round(value)}%
        </span>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
   ══════════════════════════════════════════════════════════════════════ */

const DashboardPage: React.FC = () => {
  const { alerts: wsAlerts, flows: wsFlows, stats: wsStats, isConnected } = useWebSocketContext();
  const [loading, setLoading] = useState(true);

  /* -- API-backed data -- */
  const [apiStats, setApiStats] = useState<any>(null);
  const [apiHealth, setApiHealth] = useState<any>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [s, h] = await Promise.all([fetchStats(), fetchHealth()]);
        setApiStats(s);
        setApiHealth(h);
      } catch {
        // WebSocketContext will supply data
      }
      setLoading(false);
    };
    loadInitialData();
  }, []);

  /* -- Prefer WS context stats, fall back to API, then mock -- */
  const stats = useMemo(() => {
    if (wsStats) {
      return {
        total_flows: wsStats.total_flows ?? 0,
        total_alerts: wsStats.total_alerts ?? wsAlerts.length,
        avg_confidence: wsStats.avg_confidence ?? 87.4,
        flows_per_sec: wsStats.flows_per_sec ?? 0,
        active_connections: wsStats.active_connections ?? 0,
      };
    }
    if (apiStats) {
      return {
        total_flows: apiStats.total_flows ?? 0,
        total_alerts: apiStats.total_alerts ?? 0,
        avg_confidence: apiStats.avg_confidence ?? 87.4,
        flows_per_sec: apiStats.flows_per_sec ?? 0,
        active_connections: apiStats.active_connections ?? 0,
      };
    }
    return generateMockData().stats;
  }, [wsStats, apiStats, wsAlerts]);

  const health = useMemo(() => {
    if (apiHealth) return apiHealth;
    return generateMockData().health;
  }, [apiHealth]);

  const alerts = useMemo(() => wsAlerts.length > 0 ? wsAlerts : generateMockData().alerts, [wsAlerts]);
  const flows = useMemo(() => wsFlows.length > 0 ? wsFlows : generateMockData().flows, [wsFlows]);

  /* -- Sparkline data generators -- */
  const sparklineData = useCallback((len = 10, base = 50, variance = 20) => {
    return Array.from({ length: len }, (_, i) => base + Math.sin(i * 0.8) * variance + Math.random() * variance);
  }, []);

  const attackFlows = useMemo(() => flows.filter((f: any) => f.isAttack), [flows]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '80vh',
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono", monospace', fontSize: 14 }}>
          <span style={{ animation: 'wtd-pulse 1s infinite', marginRight: 8 }}>◉</span>
          LOADING INTELLIGENCE FEED...
        </div>
      </div>
    );
  }

  /* -- derive threat level -- */
  const threatPct = useMemo(() => {
    const crit = alerts.filter((a) => a.severity === 'critical').length;
    const high = alerts.filter((a) => a.severity === 'high').length;
    const raw = Math.min(100, crit * 8 + high * 4 + alerts.length * 0.3);
    return raw;
  }, [alerts]);

  const threatLevel: 'low' | 'medium' | 'high' | 'critical' =
    threatPct >= 70 ? 'critical'
    : threatPct >= 50 ? 'high'
    : threatPct >= 30 ? 'medium'
    : 'low';

  return (
    <div
      style={{
        background: 'var(--bg-primary)',
        minHeight: '100%',
        padding: 24,
        fontFamily: '"Inter", sans-serif',
        color: 'var(--text-primary)',
      }}
    >
      {/* ================================================================
          TOP: SECTION HEADER
         ================================================================ */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Radar size={20} style={{ color: 'var(--accent-cyan)' }} />
        <span style={{ ...SECTION_LABEL, marginBottom: 0, fontSize: 12 }}>◈ OPERATIONS DASHBOARD</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            color: isConnected ? 'var(--accent-green)' : 'var(--text-secondary)',
            fontFamily: '"JetBrains Mono", monospace',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {isConnected ? <><PulsingDot color="var(--accent-green)" size={6} /> FEED ACTIVE</> : 'OFFLINE MODE'}
        </span>
      </div>

      {/* ================================================================
         ROW 1: 4 KPI CARDS
         ================================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Total Flows */}
        <KpiCard
          icon={<Activity size={18} style={{ color: 'var(--accent-cyan)' }} />}
          label="Total Flows"
          value={formatLakh(stats.total_flows)}
          sub="processed in session"
          sparkline={sparklineData(12, stats.total_flows / 1e5, stats.total_flows / 1e6)}
          sparkColor="var(--accent-cyan)"
          trend="+12.4%"
          trendUp
        />

        {/* Total Alerts */}
        <KpiCard
          icon={<Shield size={18} style={{ color: 'var(--accent-orange)' }} />}
          label="Total Alerts"
          value={stats.total_alerts.toLocaleString()}
          sub="detected events"
          sparkline={sparklineData(12, stats.total_alerts / 10, stats.total_alerts / 30)}
          sparkColor="var(--accent-orange)"
          trend={stats.total_alerts > 100 ? '+8.2%' : '-4.1%'}
          trendUp={stats.total_alerts > 100}
        />

        {/* Avg Confidence */}
        <KpiCard
          icon={<Eye size={18} style={{ color: 'var(--accent-green)' }} />}
          label="Avg Confidence"
          value={`${stats.avg_confidence.toFixed(1)}%`}
          sub="ML model accuracy"
          sparkline={sparklineData(12, stats.avg_confidence, 5)}
          sparkColor="var(--accent-green)"
          trend="+2.3%"
          trendUp
        />

        {/* Flows/sec */}
        <KpiCard
          icon={<Zap size={18} style={{ color: 'var(--accent-yellow)' }} />}
          label="Flows / sec"
          value={stats.flows_per_sec.toString()}
          sub="current throughput"
          sparkline={sparklineData(12, stats.flows_per_sec, stats.flows_per_sec * 0.3)}
          sparkColor="var(--accent-yellow)"
          trend="steady"
          trendUp={false}
        />
      </div>

      {/* ================================================================
         ROW 2: SYSTEM HEALTH + THREAT GAUGE
         ================================================================ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* SYSTEM HEALTH */}
        <div style={{ ...CARD_BASE }}>
          <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>◈ System Health</div>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Left: status block */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 160 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <PulsingDot color="var(--accent-green)" size={10} />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--accent-green)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {health.status || 'OPERATIONAL'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                <Clock size={14} />
                <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
                  Uptime: {formatUptime(health.uptime)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
                <Network size={14} />
                <span style={{ fontSize: 12, fontFamily: '"JetBrains Mono", monospace' }}>
                  {stats.active_connections.toLocaleString()} active connections
                </span>
              </div>
            </div>
            {/* Right: bars */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MetricBar label="CPU" value={health.cpu ?? 34} unit="%" color="var(--accent-cyan)" />
              <MetricBar label="MEM" value={health.memory ?? 62} unit="%" color="var(--accent-purple)" />
              <MetricBar label="NET" value={28 + Math.floor(Math.random() * 40)} unit="%" color="var(--accent-green)" />
            </div>
          </div>
        </div>

        {/* THREAT LEVEL GAUGE */}
        <div style={{ ...CARD_BASE, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...SECTION_LABEL, marginBottom: 12 }}>◈ Threat Level</div>
          <ThreatGauge level={threatLevel} value={threatPct} />
        </div>
      </div>

      {/* ================================================================
         ROW 3: RECENT ALERTS TABLE
         ================================================================ */}
      <div style={{ ...CARD_BASE, marginBottom: 24 }}>
        <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>◈ Recent Alerts</div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2736' }}>
                {['TIME', 'SEVERITY', 'THREAT TYPE', 'SOURCE', 'CONFIDENCE', 'FLOWS'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 10).map((a: any) => {
                const sev = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.low;
                return (
                  <tr
                    key={a.id}
                    style={{
                      borderBottom: '1px solid #0f1c2b',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 212, 255, 0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {formatTime(a.timestamp)}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <SeverityBadge severity={a.severity} />
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {a.threat_type}
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: 'var(--accent-cyan)',
                      }}
                    >
                      {a.src_ip}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <ConfidenceBar value={a.confidence} />
                    </td>
                    <td
                      style={{
                        padding: '10px 12px',
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {a.flow_count ?? Math.floor(Math.random() * 30)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
         ROW 4: REAL-TIME FLOWS TABLE
         ================================================================ */}
      <div style={{ ...CARD_BASE }}>
        <div style={{ ...SECTION_LABEL, marginBottom: 16 }}>◈ Live Traffic Matrix</div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2736' }}>
                {['TIME', 'SOURCE', 'DESTINATION', 'PROTO', 'BYTES', 'STATUS'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '1.5px',
                      color: 'var(--text-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {flows.slice(0, 10).map((flow: any) => (
                <tr
                  key={flow.id}
                  style={{
                    borderBottom: '1px solid #0f1c2b',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 212, 255, 0.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatTime(flow.timestamp)}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: 'var(--accent-cyan)',
                    }}
                  >
                    {flow.src_ip}:{flow.src_port}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: 'var(--accent-purple)',
                    }}
                  >
                    {flow.dst_ip}:{flow.dst_port}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{flow.protocol}</td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {formatBytes(flow.bytes_sent + flow.bytes_recv)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    {flow.isAttack ? (
                      <SeverityBadge severity="critical" />
                    ) : (
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          background: 'rgba(34, 197, 94, 0.1)',
                          color: 'var(--accent-green)',
                          border: '1px solid rgba(34, 197, 94, 0.2)',
                          letterSpacing: '0.5px',
                        }}
                      >
                        CLEAR
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════ */

const KpiCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  sparkline: number[];
  sparkColor: string;
  trend: string;
  trendUp: boolean;
}> = ({ icon, label, value, sub, sparkline, sparkColor, trend, trendUp }) => (
  <div
    style={{
      ...CARD_BASE,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
      cursor: 'default',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = sparkColor + '40';
      e.currentTarget.style.boxShadow = `0 0 20px ${sparkColor}10`;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'var(--border-color)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 8,
        background: `${sparkColor}12`,
        border: `1px solid ${sparkColor}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, letterSpacing: '0.3px' }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: 'var(--text-primary)',
          fontFamily: '"JetBrains Mono", monospace',
          lineHeight: 1,
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 4 }}>{sub}</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
      <Sparkline data={sparkline} color={sparkColor} height={32} />
      {trendUp !== null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: trendUp ? 'var(--accent-green)' : 'var(--accent-red)',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {trendUp ? '↑' : '↓'} {trend}
        </span>
      )}
    </div>
  </div>
);

const MetricBar: React.FC<{ label: string; value: number; unit: string; color: string }> = ({
  label, value, unit, color,
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        fontFamily: '"JetBrains Mono", monospace',
        width: 36,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
    <div style={{ flex: 1 }}>
      <ProgressBar value={value} max={100} height={8} color={color} showLabel={true} />
    </div>
  </div>
);

const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const cfg = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.low;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 10px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}25`,
        letterSpacing: '0.5px',
        fontFamily: '"JetBrains Mono", monospace',
      }}
    >
      {severity === 'critical' && <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 4px ${cfg.glow}` }} />}
      {cfg.label}
    </span>
  );
};

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const color = value > 85 ? 'var(--accent-green)' : value > 60 ? 'var(--accent-yellow)' : 'var(--accent-red)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 56,
          height: 4,
          background: 'var(--border-color)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: '100%',
            background: color,
            borderRadius: 2,
            transition: 'width 1s ease-out',
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          fontFamily: '"JetBrains Mono", monospace',
          minWidth: 36,
        }}
      >
        {value.toFixed(0)}%
      </span>
    </div>
  );
};

export default DashboardPage;
