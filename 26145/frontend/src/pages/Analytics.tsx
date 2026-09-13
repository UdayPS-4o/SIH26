import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Stats } from '../types';
import {
  generateHistoricalAlerts,
  generateFlowTimeSeries,
  generateThreatTypeData,
  generateRadarData,
  generateTopSourceIPs,
  generateProtocolDistribution,
  getDetectionMetrics,
} from '../lib/mockBackend';

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                               */
/* ------------------------------------------------------------------ */

const PIE_COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  border: '1px solid #1e293b',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '12px',
};

const GRID_STROKE = '#1e293b';
const AXIS_STROKE = '#475569';
const AXIS_FILL = '#94a3b8';

/* ------------------------------------------------------------------ */
/*  Accuracy Gauge component                                           */
/* ------------------------------------------------------------------ */

function AccuracyGauge({ accuracy }: { accuracy: number }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const from = 0;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (accuracy - from) * ease);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [accuracy]);

  const pct = displayed / 100;
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative flex items-center justify-center">
      <svg width="110" height="110" viewBox="0 0 100 100">
        {/* background track */}
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
        {/* progress arc (only the bottom 220 degrees) */}
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#10b981"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference * 0.61}
          strokeDashoffset={offset}
          transform="rotate(126 50 50)"
          className="transition-all duration-1000"
        />
        <text
          x="50"
          y="46"
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
        >
          {displayed.toFixed(1)}%
        </text>
        <text
          x="50"
          y="62"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9"
          fontFamily="Inter, system-ui, sans-serif"
        >
          ACCURACY
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metric Card                                                        */
/* ------------------------------------------------------------------ */

interface MetricCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accentColor: string;
  delay?: number;
}

function MetricCard({ label, value, subtitle, icon, accentColor, delay = 0 }: MetricCardProps) {
  return (
    <div
      className="card p-5 hover:border-slate-600 transition-all duration-300 animate-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2.5 rounded-lg"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section title helper                                               */
/* ------------------------------------------------------------------ */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-semibold text-white uppercase tracking-wider">
        {title}
      </h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Analytics page                                                */
/* ------------------------------------------------------------------ */

const Analytics: React.FC<{ darkMode: boolean }> = () => {
  const [alertsTrend, setAlertsTrend] = useState<{ time: string; alerts: number }[]>([]);
  const [flowSeries, setFlowSeries] = useState<{ time: string; flows: number }[]>([]);
  const [threatTypeData, setThreatTypeData] = useState<{ name: string; count: number; severity: string }[]>([]);
  const [radarData, setRadarData] = useState<{ category: string; risk: number }[]>([]);
  const [topIPs, setTopIPs] = useState<{ ip: string; attacks: number }[]>([]);
  const [protocolData, setProtocolData] = useState<{ name: string; value: number }[]>([]);
  const [metrics, setMetrics] = useState(getDetectionMetrics());
  const [stats, setStats] = useState<Stats | null>(null);

  /* ---- helpers ---- */
  const randomBetween = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  /* ---- load mock data on mount ---- */
  useEffect(() => {
    setAlertsTrend(generateHistoricalAlerts(30));
    setFlowSeries(generateFlowTimeSeries(30));
    setThreatTypeData(generateThreatTypeData());
    setRadarData(generateRadarData());
    setTopIPs(generateTopSourceIPs(8));
    setProtocolData(generateProtocolDistribution());
    setMetrics(getDetectionMetrics());

    // Simulate a Stats fetch
    const timer = setTimeout(() => {
      setStats({
        total_flows: randomBetween(15000, 50000),
        total_alerts: randomBetween(200, 600),
        threats_per_type: {},
        avg_confidence: randomBetween(85, 95),
        flows_per_sec: randomBetween(50, 200),
        active_connections: randomBetween(500, 1500),
        uptime_sec: randomBetween(36000, 86400),
      });
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  /* ---- refresh handler ---- */
  const refreshData = () => {
    setAlertsTrend(generateHistoricalAlerts(30));
    setFlowSeries(generateFlowTimeSeries(30));
    setThreatTypeData(generateThreatTypeData());
    setRadarData(generateRadarData());
    setTopIPs(generateTopSourceIPs(8));
    setProtocolData(generateProtocolDistribution());
    setMetrics(getDetectionMetrics());
  };

  const totalProtocol = useMemo(
    () => protocolData.reduce((sum, d) => sum + d.value, 0),
    [protocolData],
  );

  const threatsBlocked = metrics.threatsBlockedToday.toLocaleString();

  return (
    <div className="space-y-6 p-6">
      {/* ---- Header row ---- */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Threat intelligence overview &middot; last 30 minutes
          </p>
        </div>
        <button
          onClick={refreshData}
          className="btn btn-secondary text-xs flex items-center gap-1.5"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* ============================================================
           1. THREAT TRENDS
           ============================================================ */}
      <div className="card p-6">
        <SectionTitle title="Threat Trends" subtitle="Alerts detected per minute — last 30 minutes" />

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={alertsTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: AXIS_FILL }}
              stroke={GRID_STROKE}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis tick={{ fontSize: 10, fill: AXIS_FILL }} stroke={GRID_STROKE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="alerts"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#alertGradient)"
              dot={false}
              activeDot={{ r: 4, stroke: '#ef4444', fill: '#111827' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ============================================================
           2. DETECTION PERFORMANCE
           ============================================================ */}
      <div className="card p-6">
        <SectionTitle title="Detection Performance" subtitle="Real-time model metrics" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Accuracy Gauge */}
          <div className="flex flex-col items-center justify-center">
            <AccuracyGauge accuracy={metrics.modelAccuracy} />
            <p className="text-xs text-slate-500 mt-2">Model Accuracy</p>
          </div>

          <MetricCard
            label="False Positive Rate"
            value={`${metrics.falsePositiveRate.toFixed(1)}%`}
            subtitle="Target: &lt; 5%"
            accentColor="#f59e0b"
            delay={100}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            }
          />

          <MetricCard
            label="Avg Detection Time"
            value={`${metrics.avgDetectionTime.toFixed(1)}s`}
            subtitle="Mean time to detect"
            accentColor="#3b82f6"
            delay={200}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />

          <MetricCard
            label="Threats Blocked"
            value={threatsBlocked}
            subtitle="Past 24 hours"
            accentColor="#10b981"
            delay={300}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
          />

          <MetricCard
            label="Active Connections"
            value={stats?.active_connections?.toLocaleString() ?? '---'}
            subtitle="Current live flows"
            accentColor="#8b5cf6"
            delay={400}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ============================================================
           3. THREAT DISTRIBUTION
           ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Horizontal bar chart */}
        <div className="card p-6">
          <SectionTitle title="Threat Distribution" subtitle="Counts by threat type" />

          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={threatTypeData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: AXIS_FILL }} stroke={GRID_STROKE} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: AXIS_FILL }}
                stroke={GRID_STROKE}
                width={110}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any) => [`${value} alerts`, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18}>
                {threatTypeData.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.severity === 'critical'
                        ? '#dc2626'
                        : entry.severity === 'high'
                          ? '#ef4444'
                          : entry.severity === 'medium'
                            ? '#f59e0b'
                            : '#3b82f6'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar chart */}
        <div className="card p-6">
          <SectionTitle title="Risk Radar" subtitle="Current risk levels by category" />

          <ResponsiveContainer width="100%" height={340}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke={GRID_STROKE} />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: AXIS_FILL }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} />
              <Radar
                name="Risk Level"
                dataKey="risk"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.2}
                strokeWidth={2}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any) => [`${value}/100`, 'Risk Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ============================================================
           4. TRAFFIC ANALYSIS
           ============================================================ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line chart: flows per second */}
        <div className="card p-6 xl:col-span-2">
          <SectionTitle title="Network Throughput" subtitle="Flows per second over the last 30 minutes" />

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={flowSeries} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: AXIS_FILL }}
                stroke={GRID_STROKE}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis tick={{ fontSize: 10, fill: AXIS_FILL }} stroke={GRID_STROKE} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line
                type="monotone"
                dataKey="flows"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, stroke: '#3b82f6', fill: '#111827' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Protocol distribution pie chart */}
        <div className="card p-6">
          <SectionTitle title="Protocol Distribution" subtitle="Share by protocol type" />

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={protocolData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
              >
                {protocolData.map((_entry, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: any, name: any) => [
                  `${value.toLocaleString()} (${((value / totalProtocol) * 100).toFixed(1)}%)`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top source IPs bar chart — full width */}
      <div className="card p-6">
        <SectionTitle title="Top Attack Sources" subtitle="Source IPs ranked by attack count" />

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={topIPs} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis
              dataKey="ip"
              tick={{ fontSize: 9, fill: AXIS_FILL }}
              stroke={GRID_STROKE}
              angle={-30}
              textAnchor="end"
              height={60}
            />
            <YAxis tick={{ fontSize: 10, fill: AXIS_FILL }} stroke={GRID_STROKE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value: any) => [`${value} attacks`, 'Count']} />
            <Bar dataKey="attacks" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Analytics;
