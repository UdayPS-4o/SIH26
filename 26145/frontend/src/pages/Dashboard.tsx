import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Activity, Shield, AlertTriangle, TrendingUp, Zap,
  Globe, HardDrive, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Alert, Flow, Stats } from '../types';
import { MockBackend, mockBackend, generateHistoricalAlerts, generateThreatTypeData, generateFlowTimeSeries } from '../lib/mockBackend';

/* ── Animation keyframes (injected once) ──────────────────────────── */
const ANIM_STYLE_ID = 'dashboard-animations';
const injectAnimations = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(ANIM_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = ANIM_STYLE_ID;
  style.textContent = `
    @keyframes dash-fade-in-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes dash-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes dash-pulse-glow {
      0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
      50%      { box-shadow: 0 0 12px 2px rgba(239,68,68,0.15); }
    }
    .dash-anim-card {
      animation: dash-fade-in-up 0.5s ease-out both;
    }
    .dash-anim-row:nth-child(1) .dash-anim-card { animation-delay: 0.00s; }
    .dash-anim-row:nth-child(2) .dash-anim-card { animation-delay: 0.05s; }
    .dash-anim-row:nth-child(3) .dash-anim-card { animation-delay: 0.10s; }
    .dash-anim-row:nth-child(4) .dash-anim-card { animation-delay: 0.15s; }
    .dash-anim-row:nth-child(5) .dash-anim-card { animation-delay: 0.20s; }
    .dash-anim-row:nth-child(6) .dash-anim-card { animation-delay: 0.25s; }
    .dash-anim-row:nth-child(7) .dash-anim-card { animation-delay: 0.30s; }
    .dash-anim-row:nth-child(8) .dash-anim-card { animation-delay: 0.35s; }
    .dash-anim-fade {
      animation: dash-fade-in 0.4s ease-out both;
    }
    .dash-threat-glow {
      animation: dash-pulse-glow 2s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
};

/* ── Helpers ──────────────────────────────────────────────────────── */
const formatUptime = (secs: number): string => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

const SEVERITY_COLORS: Record<string, string> = {
  low: '#3b82f6',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: 'bg-brand-blue/10',   text: 'text-brand-blue',   border: 'border-brand-blue/20' },
  medium:   { bg: 'bg-brand-amber/10',  text: 'text-brand-amber',  border: 'border-brand-amber/20' },
  high:     { bg: 'bg-orange-500/10',   text: 'text-orange-400',   border: 'border-orange-500/20' },
  critical: { bg: 'bg-brand-red/10',    text: 'text-brand-red',    border: 'border-brand-red/20' },
};

/* ── Chart shared config ──────────────────────────────────────────── */
const CHART_TEXT = '#94a3b8';
const CHART_GRID = '#1e293b';
const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  fontSize: '12px',
  color: '#e2e8f0',
};

/* ── Stat card configs ────────────────────────────────────────────── */
interface StatCardConfig {
  title: string;
  key: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  format: (raw: string | number | undefined, stats?: Stats | null) => string | number;
  getChange?: (stats: Stats | null, attackFlows: Flow[]) => number | undefined;
  changeLabel: string;
  accent: string;
}

const STAT_CARD_CONFIGS: StatCardConfig[] = [
  {
    title: 'Total Flows',
    key: 'total_flows',
    icon: <Activity size={22} />,
    iconBg: 'bg-brand-blue/10',
    iconColor: 'text-brand-blue',
    format: (v) => (typeof v === 'number' ? v.toLocaleString() : '---'),
    getChange: () => 12,
    changeLabel: 'vs last hour',
    accent: 'border-l-brand-blue',
  },
  {
    title: 'Active Threats',
    key: 'total_alerts',
    icon: <Shield size={22} />,
    iconBg: 'bg-brand-amber/10',
    iconColor: 'text-brand-amber',
    format: (v) => (typeof v === 'number' ? v.toString() : '---'),
    getChange: () => -8,
    changeLabel: 'vs last hour',
    accent: 'border-l-brand-amber',
  },
  {
    title: 'Avg Confidence',
    key: 'avg_confidence',
    icon: <AlertTriangle size={22} />,
    iconBg: 'bg-brand-green/10',
    iconColor: 'text-brand-green',
    format: (v) => (typeof v === 'number' ? `${v.toFixed(1)}%` : '---'),
    getChange: () => 3,
    changeLabel: 'model accuracy',
    accent: 'border-l-brand-green',
  },
  {
    title: 'Threat Level',
    key: 'threat_level',
    icon: <TrendingUp size={22} />,
    iconBg: 'bg-brand-red/10',
    iconColor: 'text-brand-red',
    format: (v) => v ?? '---',
    changeLabel: '',
    accent: 'border-l-brand-red',
  },
  {
    title: 'Flows / Sec',
    key: 'flows_per_sec',
    icon: <Zap size={22} />,
    iconBg: 'bg-brand-blue/10',
    iconColor: 'text-brand-blue',
    format: (v) => (typeof v === 'number' ? v.toString() : '---'),
    getChange: () => 5,
    changeLabel: 'throughput',
    accent: 'border-l-brand-blue',
  },
  {
    title: 'Active Connections',
    key: 'active_connections',
    icon: <Globe size={22} />,
    iconBg: 'bg-brand-green/10',
    iconColor: 'text-brand-green',
    format: (v) => (typeof v === 'number' ? v.toLocaleString() : '---'),
    getChange: () => -3,
    changeLabel: 'simultaneous',
    accent: 'border-l-brand-green',
  },
  {
    title: 'Attack Flows',
    key: 'attack_flows',
    icon: <HardDrive size={22} />,
    iconBg: 'bg-brand-red/10',
    iconColor: 'text-brand-red',
    format: (v) => (typeof v === 'number' ? v.toString() : '---'),
    getChange: () => 24,
    changeLabel: 'flagged',
    accent: 'border-l-brand-red',
  },
  {
    title: 'Uptime',
    key: 'uptime',
    icon: <Activity size={22} />,
    iconBg: 'bg-brand-green/10',
    iconColor: 'text-brand-green',
    format: (v) => (typeof v === 'number' ? formatUptime(v) : '---'),
    changeLabel: 'system running',
    accent: 'border-l-brand-green',
  },
];

/* ══════════════════════════════════════════════════════════════════════
   Dashboard Component
   ══════════════════════════════════════════════════════════════════════ */
const Dashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uptime, setUptime] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  /* ── Initialise mock backend ───────────────────────────────────── */
  useEffect(() => {
    injectAnimations();
    const backend = mockBackend;

    const handleAlert = (alert: Alert): void => {
      setAlerts((prev) => [alert, ...prev].slice(0, 100));
    };

    const handleFlow = (flow: Flow): void => {
      setFlows((prev) => [flow, ...prev].slice(0, 100));
    };

    const handleStats = (s: Stats): void => {
      setStats(s);
    };

    backend.onAlert(handleAlert);
    backend.onFlow(handleFlow);
    backend.onStats(handleStats)

    setStartTime(Date.now());
    setLoading(false);

    return () => {
      backend.off('alert', handleAlert);
      backend.off('flow', handleFlow);
      backend.off('stats', handleStats);
      backend.stop();
    };
  }, []);

  /* ── Uptime tick ───────────────────────────────────────────────── */
  useEffect(() => {
    const iv = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [startTime]);

  /* ── Derived data ──────────────────────────────────────────────── */
  const attackFlows = useMemo<Flow[]>(
    () => flows.filter((f) => f.isAttack),
    [flows]
  );

  const alertTimeline = useMemo(() => {
    const now = Date.now();
    const buckets: Record<number, number> = {};
    for (let i = 19; i >= 0; i--) {
      buckets[now - i * 60000] = 0;
    }
    alerts.forEach((a) => {
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
    const counts: Record<string, number> = {};
    alerts.forEach((a) => {
      counts[a.threat_type] = (counts[a.threat_type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [alerts]);

  const severityData = useMemo(() => {
    const counts: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
    alerts.forEach((a) => {
      counts[a.severity] = (counts[a.severity] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: SEVERITY_COLORS[name],
    }));
  }, [alerts]);

  const recentFlows = useMemo(() => flows.slice(0, 10), [flows]);
  const liveAlerts = useMemo(() => alerts.slice(0, 25), [alerts]);

  /* ── Enriched stats ───────────────────────────────────────────── */
  const enrichedStats = useMemo<Stats | null>(() => {
    if (!stats) return null;
    const tp = stats.threats_per_type || {};
    const score =
      (tp['DDoS'] || 0) * 3 +
      (tp['Data Exfiltration'] || 0) * 3 +
      (tp['DGA'] || 0) * 2 +
      (tp['Beaconing'] || 0) * 2 +
      (tp['Brute Force'] || 0) * 1.5 +
      (tp['Port Scan'] || 0) * 1 +
      (tp['Malware'] || 0) * 2.5 +
      (tp['Phishing'] || 0) * 1;
    let threatLevel: { level: string; score: number; pct: number };
    if (score > 150) threatLevel = { level: 'CRITICAL', score: Math.min(score, 300), pct: Math.min((score / 300) * 100, 100) };
    else if (score > 80) threatLevel = { level: 'HIGH', score, pct: Math.min((score / 150) * 100, 100) };
    else if (score > 30) threatLevel = { level: 'ELEVATED', score, pct: Math.min((score / 80) * 100, 100) };
    else threatLevel = { level: 'LOW', score: Math.max(score, 1), pct: Math.min((score / 30) * 100, 100) };
    return {
      ...stats,
      total_flows: stats.total_flows || 0,
      total_alerts: stats.total_alerts || 0,
      avg_confidence: stats.avg_confidence || 0,
      flows_per_sec: stats.flows_per_sec || 0,
      active_connections: stats.active_connections || 0,
      uptime_sec: uptime,
      attack_flows: flows.filter((f) => f.isAttack).length,
      threat_level: threatLevel as any,
    } as any;
  }, [stats, flows, uptime]);

  const threatLevelColor = enrichedStats
    ? enrichedStats.threat_level.level === 'CRITICAL'
      ? '#ef4444'
      : enrichedStats.threat_level.level === 'HIGH'
        ? '#f59e0b'
        : enrichedStats.threat_level.level === 'ELEVATED'
          ? '#3b82f6'
          : '#10b981'
    : '#10b981';

  /* ── Stat value resolver ───────────────────────────────────────── */
  const getStatValue = useCallback(
    (key: string): string | number => {
      if (!stats) return '---';
      switch (key) {
        case 'total_flows':        return stats.total_flows;
        case 'total_alerts':       return stats.total_alerts;
        case 'avg_confidence':     return stats.avg_confidence;
        case 'flows_per_sec':      return stats.flows_per_sec;
        case 'active_connections': return stats.active_connections;
        case 'attack_flows':       return attackFlows.length;
        case 'uptime':             return stats.uptime_sec;
        case 'threat_level':       return enrichedStats?.threat_level?.level || 'LOW';
        default:                   return '---';
      }
    },
    [stats, attackFlows.length, enrichedStats]
  );

  /* ── Loading state ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Initializing threat detection engine...</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 p-4 lg:p-6 max-w-[1600px] mx-auto">
      {/* ── Section Header ─────────────────────────────────────────── */}
      <div className="dash-anim-fade flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Security Operations Center</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time threat detection and network monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-green/10 border border-brand-green/20 rounded-full">
            <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse-dot" />
            <span className="text-xs font-medium text-brand-green">LIVE</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            {' '}{formatTime(Date.now())}
          </span>
        </div>
      </div>

      {/* ── Stat Cards (8 cards, 4 per row) ───────────────────────── */}
      <div className="dash-anim-row grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARD_CONFIGS.map((config) => {
          const raw = getStatValue(config.key);
          const displayValue = config.format(raw, stats);
          const change = config.getChange
            ? config.getChange(stats, attackFlows)
            : undefined;

          return (
            <div
              key={config.key}
              className={`dash-anim-card card border-l-[3px] ${config.accent} p-4 hover:shadow-lg hover:border-slate-700 transition-all duration-200`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${config.iconBg}`}>
                  <span className={config.iconColor}>{config.icon}</span>
                </div>
                {change !== undefined && (
                  <div className={`flex items-center gap-0.5 ${change >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                    {change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    <span className="text-xs font-bold">{Math.abs(change)}%</span>
                  </div>
                )}
              </div>

              <p className="text-2xl font-bold text-white tracking-tight">{displayValue}</p>

              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-slate-500 font-medium">{config.title}</p>
                {change !== undefined && (
                  <p className="text-[10px] text-slate-600">{config.changeLabel}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Real-Time Flows Table ─────────────────────────────────── */}
      <div className="dash-anim-fade card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-brand-blue" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Real-Time Flows</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {flows.length} total flows
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-navy-700/50 text-slate-400">
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider">Time</th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider">Source</th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider">Destination</th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider">Protocol</th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-right">Bytes</th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentFlows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-xs">
                    Waiting for flow data...
                  </td>
                </tr>
              ) : (
                recentFlows.map((flow) => (
                  <tr
                    key={flow.id}
                    className={`hover:bg-navy-700/40 transition-colors duration-150 ${flow.isAttack ? 'bg-red-500/[0.03]' : ''}`}
                  >
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {formatTime(flow.timestamp)}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <span className="text-brand-blue">{flow.src_ip}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-slate-400">{flow.src_port}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs">
                      <span className="text-brand-amber">{flow.dst_ip}</span>
                      <span className="text-slate-600">:</span>
                      <span className="text-slate-400">{flow.dst_port}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-700/50 text-slate-300">
                        {flow.protocol}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400 text-right">
                      {formatBytes(flow.bytes_sent + flow.bytes_recv)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {flow.isAttack ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                          THREAT
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-brand-green/10 text-brand-green border border-brand-green/20">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Charts Row: Timeline + Severity ───────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Alert Timeline */}
        <div className="dash-anim-fade card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-brand-blue rounded-full" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Alert Timeline</h3>
            <span className="text-[10px] text-slate-500 ml-auto font-mono">last 20 min</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={alertTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: CHART_TEXT }}
                stroke={CHART_GRID}
                interval={3}
              />
              <YAxis
                tick={{ fontSize: 10, fill: CHART_TEXT }}
                stroke={CHART_GRID}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) => [`${value} alerts`, 'Count']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: '#111827', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Severity Distribution */}
        <div className="dash-anim-fade card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-brand-red rounded-full" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Severity Distribution</h3>
            <span className="text-[10px] text-slate-500 ml-auto font-mono">
              {alerts.length} total alerts
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={severityData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {severityData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any, name: any) => [`${value} alerts`, name]}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ fontSize: '11px' }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row: Threat Types + Live Feed ──────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Threat Types Horizontal Bar */}
        <div className="xl:col-span-2 dash-anim-fade card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 bg-brand-amber rounded-full" />
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Threat Types</h3>
            <span className="text-[10px] text-slate-500 ml-auto font-mono">by frequency</span>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={threatTypeData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: CHART_TEXT }} stroke={CHART_GRID} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: CHART_TEXT }}
                stroke={CHART_GRID}
                width={110}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) => [`${value} occurrences`, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                {threatTypeData.map((entry, index) => (
                  <Cell key={entry.name} fill={SEVERITY_COLORS[Object.keys(SEVERITY_COLORS)[index % 4]] || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Live Threat Feed */}
        <div className="xl:col-span-1 dash-anim-fade card overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="text-brand-amber" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Live Threat Feed</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-green rounded-full animate-pulse-dot" />
              <span className="text-[10px] text-slate-400 font-mono">{alerts.length} alerts</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5 max-h-[300px]">
            {liveAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                <AlertTriangle size={28} className="mb-2 opacity-40" />
                <p className="text-xs">No threats detected</p>
              </div>
            ) : (
              liveAlerts.map((alert, idx) => {
                const badge = SEVERITY_BADGE[alert.severity];

                return (
                  <div
                    key={alert.id}
                    className="dash-anim-card bg-navy-700/30 border border-slate-700/50 rounded-lg overflow-hidden hover:border-slate-600 transition-all duration-150"
                    style={{ animationDelay: `${idx * 30}ms` }}
                  >
                    {/* Card header - always visible */}
                    <div className="p-2.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${badge.bg} ${badge.text} border ${badge.border}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className="text-xs font-semibold text-white truncate flex-1">
                          {alert.threat_type}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {formatTime(alert.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-mono mb-2">
                        <span className="text-brand-blue truncate">{alert.src_ip}</span>
                        <span className="text-slate-600">{'→'}</span>
                        <span className="text-brand-amber truncate">{alert.dst_ip}</span>
                      </div>
                      {/* Confidence bar */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${alert.confidence}%`,
                              backgroundColor:
                                alert.confidence > 80 ? '#ef4444' :
                                alert.confidence > 60 ? '#f59e0b' : '#10b981',
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono w-8 text-right">
                          {alert.confidence}%
                        </span>
                      </div>
                    </div>

                    {/* Expandable evidence panel */}
                    <details className="group">
                      <summary className="px-2.5 py-1.5 text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer select-none border-t border-slate-800/50 hover:bg-navy-700/20 transition-colors flex items-center gap-1">
                        <span className="group-open:rotate-90 transition-transform inline-block">{'▶'}</span>
                        Evidence ({Object.keys(alert.evidence).length} items)
                      </summary>
                      <div className="px-2.5 py-2 bg-navy-800/50 border-t border-slate-700/30 space-y-1">
                        {Object.entries(alert.evidence).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] text-slate-300 font-mono truncate ml-3">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
