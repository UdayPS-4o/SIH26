import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  ShieldX,
  Activity,
  Zap,
  Target,
  Globe,
  Server,
  Radio,
  Search,
  Download,
  Lock,
} from 'lucide-react';
import { getDetectionMetrics, generateThreatTypeData, generateTopSourceIPs } from '../lib/mockBackend';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface TrendPoint {
  time: string;
  threats: number;
  timestamp: number;
}

interface ThreatBreakdownItem {
  name: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AttackSource {
  rank: number;
  ip: string;
  country: string;
  flag: string;
  attacks: number;
  threatType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  trend: number;
}

type TimeRange = '24h' | '7d' | '30d';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const COLORS = {
  bg: '#060a10',
  cardBg: '#0a1118',
  border: '#1a2736',
  borderLight: '#1e2d40',
  textPrimary: '#e0e8f0',
  textSecondary: '#64748b',
  textMuted: '#3a4a5e',
  accent: '#00d4ff',
  threat: {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#06b6d4',
  },
  grid: '#1a2736',
  gridLight: '#14202d',
};

const FONT_MONO = "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace";
const FONT_SANS = "'Inter', system-ui, -apple-system, sans-serif";

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

const THREAT_TYPES = [
  { id: 'DDoS', icon: Zap, severity: 'critical' as const },
  { id: 'Port Scan', icon: Search, severity: 'medium' as const },
  { id: 'Data Exfil', icon: Download, severity: 'critical' as const },
  { id: 'DGA Domains', icon: Globe, severity: 'high' as const },
  { id: 'C2 Beaconing', icon: Radio, severity: 'high' as const },
  { id: 'DNS Tunnel', icon: Server, severity: 'high' as const },
  { id: 'TLS Anomaly', icon: ShieldCheck, severity: 'medium' as const },
  { id: 'Brute Force', icon: Lock, severity: 'high' as const },
  { id: 'SQL Injection', icon: Target, severity: 'high' as const },
  { id: 'XSS Attack', icon: AlertTriangle, severity: 'medium' as const },
];

const COUNTRIES = [
  { code: 'RU', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'KP', flag: '\u{1F1F0}\u{1F1F5}' },
  { code: 'IR', flag: '\u{1F1EE}\u{1F1F7}' },
  { code: 'BR', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'US', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'VN', flag: '\u{1F1FB}\u{1F1F3}' },
  { code: 'NG', flag: '\u{1F1F3}\u{1F1EC}' },
];

/* ------------------------------------------------------------------ */
/*  Random helpers (stable per-range)                                  */
/* ------------------------------------------------------------------ */

const seededRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
};

const pick = <T,>(arr: T[], rand: () => number): T =>
  arr[Math.floor(rand() * arr.length)];

const generateIP = (rand: () => number): string =>
  `${Math.floor(rand() * 223) + 1}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}.${Math.floor(rand() * 256)}`;

/* ------------------------------------------------------------------ */
/*  Data generators per time range                                     */
/* ------------------------------------------------------------------ */

function generateTrendData(range: TimeRange): TrendPoint[] {
  const now = Date.now();
  const seed = now - (range === '24h' ? 86400000 : range === '7d' ? 604800000 : 2592000000);
  const rand = seededRandom(Math.floor(seed / 1000));
  const points: TrendPoint[] = [];
  let count = range === '24h' ? 24 : range === '7d' ? 7 : 30;
  let step = range === '24h' ? 3600000 : range === '7d' ? 86400000 : 86400000;

  for (let i = count - 1; i >= 0; i--) {
    const ts = now - i * step;
    const d = new Date(ts);
    const label = range === '24h'
      ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const hour = d.getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;
    const isNight = hour >= 22 || hour <= 5;
    const peak = range === '24h' ? (isBusinessHours ? 2.5 : isNight ? 0.4 : 1.2) : 1.0;
    const base = range === '24h' ? 30 : range === '7d' ? 200 : 600;
    const variance = range === '24h' ? 25 : range === '7d' ? 150 : 400;
    const threats = Math.max(0, Math.round((base + rand() * variance) * peak + (rand() - 0.5) * variance * 0.5));
    points.push({ time: label, threats, timestamp: ts });
  }
  return points;
}

function generateThreatBreakdown(range: TimeRange): ThreatBreakdownItem[] {
  const rand = seededRandom(range === '24h' ? 1 : range === '7d' ? 2 : 3);
  const multiplier = range === '24h' ? 1 : range === '7d' ? 6 : 25;

  return THREAT_TYPES.map((type) => {
    const base = type.severity === 'critical' ? 8 : type.severity === 'high' ? 15 : 25;
    const count = Math.round((base + rand() * base * 2) * multiplier);
    return { name: type.id, count, severity: type.severity };
  }).sort((a, b) => b.count - a.count);
}

function generateAttackSources(range: TimeRange): AttackSource[] {
  const rand = seededRandom(range === '24h' ? 10 : range === '7d' ? 20 : 30);
  const sources: AttackSource[] = [];
  const usedIPs = new Set<string>();

  for (let i = 0; i < 10; i++) {
    let ip: string;
    do { ip = generateIP(rand); } while (usedIPs.has(ip));
    usedIPs.add(ip);

    const country = pick(COUNTRIES, rand);
    const threatType = pick(THREAT_TYPES, rand);
    const severityRand = rand();
    let severity: AttackSource['severity'];
    if (severityRand < 0.15) severity = 'critical';
    else if (severityRand < 0.4) severity = 'high';
    else if (severityRand < 0.75) severity = 'medium';
    else severity = 'low';

    const baseAttacks = range === '24h' ? 120 : range === '7d' ? 800 : 3000;
    const attacks = Math.round(baseAttacks * (0.3 + rand() * 0.7) * (1 - i * 0.08));
    const trend = Math.round((rand() - 0.4) * 60);

    sources.push({
      rank: i + 1,
      ip,
      country: country.code,
      flag: country.flag,
      attacks,
      threatType: threatType.id,
      severity,
      trend,
    });
  }

  return sources.sort((a, b) => b.attacks - a.attacks).map((s, i) => ({ ...s, rank: i + 1 }));
}

/* ------------------------------------------------------------------ */
/*  Metric helpers                                                     */
/* ------------------------------------------------------------------ */

const THREAT_COLORS: Record<string, string> = {
  critical: COLORS.threat.critical,
  high: COLORS.threat.high,
  medium: COLORS.threat.medium,
  low: COLORS.threat.low,
};

/* ------------------------------------------------------------------ */
/*  Inline SVG chart components                                        */
/* ------------------------------------------------------------------ */

function ThreatTrendChart({ data }: { data: TrendPoint[] }) {
  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...data.map((d) => d.threats));
  const minVal = Math.min(...data.map((d) => d.threats));
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.threats - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath =
    linePath +
    ` L${points[points.length - 1].x},${padding.top + chartH}` +
    ` L${points[0].x},${padding.top + chartH} Z`;

  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) =>
    Math.round(minVal + (range * i) / (yTicks - 1))
  );

  const xLabels = data.filter((_, i) => i % Math.ceil(data.length / 8) === 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: height }}>
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.accent} stopOpacity="0.2" />
          <stop offset="100%" stopColor={COLORS.accent} stopOpacity="0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid lines */}
      {yTickValues.map((val) => {
        const y = padding.top + chartH - ((val - minVal) / range) * chartH;
        return (
          <g key={`grid-${val}`}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke={COLORS.gridLight} strokeWidth="1" />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fill={COLORS.textSecondary}
              fontSize="10"
              fontFamily={FONT_MONO}
            >
              {val.toLocaleString()}
            </text>
          </g>
        );
      })}

      {/* Vertical grid lines */}
      {xLabels.map((_, i) => {
        const idx = Math.floor((i / 8) * (data.length - 1));
        const x = points[idx]?.x;
        if (!x) return null;
        return <line key={`vgrid-${i}`} x1={x} y1={padding.top} x2={x} y2={padding.top + chartH} stroke={COLORS.gridLight} strokeWidth="1" />;
      })}

      {/* Area fill */}
      <path d={areaPath} fill="url(#trendGradient)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={COLORS.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />

      {/* Data points */}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        const isMax = data[i].threats === maxVal;
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={isLast || isMax ? 5 : 3} fill={COLORS.bg} stroke={COLORS.accent} strokeWidth="2" />
            {isLast && (
              <circle cx={p.x} cy={p.y} r="8" fill={COLORS.accent} opacity="0.15" />
            )}
          </g>
        );
      })}

      {/* X-axis labels */}
      {xLabels.map((d, i) => {
        const idx = Math.floor((i / 8) * (data.length - 1));
        const x = points[idx]?.x;
        if (!x) return null;
        return (
          <text
            key={d.time}
            x={x}
            y={height - 12}
            textAnchor="middle"
            fill={COLORS.textSecondary}
            fontSize="10"
            fontFamily={FONT_MONO}
          >
            {d.time}
          </text>
        );
      })}

      {/* Max annotation */}
      {(() => {
        const maxIdx = data.findIndex((d) => d.threats === maxVal);
        const p = points[maxIdx];
        if (!p || maxIdx < 2) return null;
        return (
          <g>
            <text
              x={p.x}
              y={p.y - 14}
              textAnchor="middle"
              fill={COLORS.accent}
              fontSize="11"
              fontWeight="700"
              fontFamily={FONT_MONO}
            >
              {maxVal.toLocaleString()}
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

function ThreatBreakdownChart({ data }: { data: ThreatBreakdownItem[] }) {
  const width = 700;
  const height = 340;
  const padding = { top: 10, right: 80, bottom: 10, left: 130 };
  const chartH = height - padding.top - padding.bottom;
  const barHeight = Math.min(28, (chartH - (data.length - 1) * 6) / data.length);
  const maxVal = Math.max(...data.map((d) => d.count));
  const chartW = width - padding.left - padding.right;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: height }}>
      {data.map((item, i) => {
        const y = padding.top + i * (barHeight + 6);
        const barW = (item.count / maxVal) * chartW;
        const color = THREAT_COLORS[item.severity] || COLORS.accent;

        return (
          <g key={item.name}>
            {/* Label */}
            <text
              x={padding.left - 10}
              y={y + barHeight / 2 + 4}
              textAnchor="end"
              fill={COLORS.textSecondary}
              fontSize="11"
              fontFamily={FONT_MONO}
            >
              {item.name}
            </text>

            {/* Bar background */}
            <rect
              x={padding.left}
              y={y}
              width={chartW}
              height={barHeight}
              fill={COLORS.grid}
              rx="2"
            />

            {/* Bar fill */}
            <rect
              x={padding.left}
              y={y}
              width={barW}
              height={barHeight}
              fill={color}
              rx="2"
              opacity="0.85"
            />

            {/* Value */}
            <text
              x={padding.left + barW + 8}
              y={y + barHeight / 2 + 4}
              fill={color}
              fontSize="11"
              fontWeight="600"
              fontFamily={FONT_MONO}
            >
              {item.count.toLocaleString()}
            </text>

            {/* Severity dot */}
            <circle cx={width - padding.right + 18} cy={y + barHeight / 2} r="4" fill={color} />
            <text
              x={width - padding.right + 28}
              y={y + barHeight / 2 + 4}
              fill={COLORS.textMuted}
              fontSize="9"
              fontFamily={FONT_MONO}
            >
              {SEVERITY_LABELS[item.severity]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Severity bar component                                             */
/* ------------------------------------------------------------------ */

function SeverityBar({ severity, attacks }: { severity: string; attacks: number }) {
  const color = THREAT_COLORS[severity] || COLORS.accent;
  const width = Math.min(100, Math.max(15, Math.log10(attacks) * 12));

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 rounded-full" style={{ width: 100, background: COLORS.grid }}>
        <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="text-[10px] uppercase tracking-wider" style={{ color, fontFamily: FONT_MONO, minWidth: 56 }}>
        {SEVERITY_LABELS[severity] || severity.toUpperCase()}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Trend indicator                                                    */
/* ------------------------------------------------------------------ */

function TrendIndicator({ value }: { value: number }) {
  const isUp = value > 0;
  const color = isUp ? COLORS.threat.critical : COLORS.threat.low;
  const arrow = isUp ? '↑' : '↓';

  return (
    <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color, fontFamily: FONT_MONO }}>
      {arrow} {Math.abs(value)}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card                                                           */
/* ------------------------------------------------------------------ */

interface KPICardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  accentColor: string;
  trend?: number;
  progress?: number;
}

function KPICard({ label, value, subValue, icon, accentColor, trend, progress }: KPICardProps) {
  return (
    <div
      className="relative overflow-hidden rounded-lg p-5 transition-all duration-300 hover:border-opacity-40 group"
      style={{
        background: COLORS.cardBg,
        border: `1px solid ${COLORS.border}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accentColor}40`;
        e.currentTarget.style.boxShadow = `0 0 20px ${accentColor}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = COLORS.border;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />

      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-md" style={{ background: `${accentColor}12`, color: accentColor }}>
          {icon}
        </div>
        {trend !== undefined && <TrendIndicator value={trend} />}
      </div>

      <div className="mb-1">
        <span className="text-2xl font-bold tracking-tight" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
          {value}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>
          {label}
        </span>
        {subValue && <span className="text-[10px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>{subValue}</span>}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="mt-3 relative h-1 rounded-full" style={{ background: COLORS.grid }}>
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, progress)}%`, background: accentColor, opacity: 0.6 }}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section header                                                     */
/* ------------------------------------------------------------------ */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-sm" style={{ color: COLORS.accent, fontFamily: FONT_MONO, letterSpacing: '2px', fontWeight: 700 }}>
        {'◈'}
      </span>
      <div>
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: COLORS.accent, fontFamily: FONT_MONO, letterSpacing: '2px' }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-[10px] mt-0.5" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${COLORS.border}, transparent)` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Analytics page                                                */
/* ------------------------------------------------------------------ */

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [metrics] = useState(getDetectionMetrics);

  const trendData = useMemo(() => generateTrendData(timeRange), [timeRange]);
  const breakdownData = useMemo(() => generateThreatBreakdown(timeRange), [timeRange]);
  const attackSources = useMemo(() => generateAttackSources(timeRange), [timeRange]);

  const totalThreats = useMemo(() => trendData.reduce((sum, d) => sum + d.threats, 0), [trendData]);
  const detectionRate = useMemo(() => (94.2 + Math.random() * 2.5).toFixed(1), [timeRange]);
  const falsePositiveRate = useMemo(() => (2.1 + Math.random() * 2.8).toFixed(1), [timeRange]);
  const avgResponseTime = useMemo(() => (120 + Math.random() * 80).toFixed(0), [timeRange]);

  const rangeLabels: Record<TimeRange, string> = {
    '24h': 'Last 24 hours',
    '7d': 'Last 7 days',
    '30d': 'Last 30 days',
  };

  return (
    <div className="space-y-5 p-5" style={{ background: COLORS.bg, fontFamily: FONT_SANS }}>
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00ff41' }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: '#00ff41' }} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#00ff41', fontFamily: FONT_MONO }}>
              Live Monitoring Active
            </span>
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider" style={{ color: COLORS.accent, fontFamily: FONT_MONO, letterSpacing: '3px' }}>
            Threat Analytics
          </h1>
          <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>
            {rangeLabels[timeRange]} · Comprehensive threat intelligence overview
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}>
          {(['24h', '7d', '30d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className="px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200"
              style={{
                background: timeRange === range ? `${COLORS.accent}15` : 'transparent',
                color: timeRange === range ? COLORS.accent : COLORS.textSecondary,
                fontFamily: FONT_MONO,
                border: timeRange === range ? `1px solid ${COLORS.accent}30` : '1px solid transparent',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================
           1. KPI CARDS
           ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Total Threats Detected"
          value={totalThreats.toLocaleString()}
          subValue={`${timeRange}`}
          icon={<Activity size={20} />}
          accentColor={COLORS.threat.critical}
          trend={Math.round(Math.random() * 30 - 10)}
          progress={75 + Math.random() * 20}
        />
        <KPICard
          label="Detection Rate"
          value={`${detectionRate}%`}
          subValue="Model accuracy"
          icon={<ShieldCheck size={20} />}
          accentColor={COLORS.threat.low}
          trend={Math.round(Math.random() * 5)}
          progress={parseFloat(detectionRate)}
        />
        <KPICard
          label="False Positive Rate"
          value={`${falsePositiveRate}%`}
          subValue="Target: < 3%"
          icon={<Target size={20} />}
          accentColor={COLORS.threat.medium}
          trend={Math.round(Math.random() * -15)}
          progress={parseFloat(falsePositiveRate) * 10}
        />
        <KPICard
          label="Avg Response Time"
          value={`${avgResponseTime}ms`}
          subValue="Mean time to respond"
          icon={<Clock size={20} />}
          accentColor={COLORS.accent}
          trend={Math.round(Math.random() * -20)}
          progress={50 + Math.random() * 30}
        />
      </div>

      {/* ============================================================
           2. THREAT TREND
           ============================================================ */}
      <div
        className="rounded-lg p-5"
        style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}
      >
        <SectionHeader title="Threat Trend" subtitle={`Detected threats over ${rangeLabels[timeRange].toLowerCase()}`} />
        <div className="w-full overflow-hidden">
          <ThreatTrendChart data={trendData} />
        </div>
      </div>

      {/* ============================================================
           3. THREAT BREAKDOWN
           ============================================================ */}
      <div
        className="rounded-lg p-5"
        style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}
      >
        <SectionHeader title="Threat Breakdown" subtitle="Distribution by threat category" />
        <div className="w-full overflow-x-auto">
          <ThreatBreakdownChart data={breakdownData} />
        </div>
      </div>

      {/* ============================================================
           4. TOP ATTACK SOURCES
           ============================================================ */}
      <div
        className="rounded-lg overflow-hidden"
        style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}
      >
        <div className="p-5 pb-3">
          <SectionHeader title="Top Attack Sources" subtitle="Ranked by attack volume" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Rank
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Source IP
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Country
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Attack Count
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Threat Type
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Severity
                </th>
                <th className="text-left px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
                  Trend
                </th>
              </tr>
            </thead>
            <tbody>
              {attackSources.map((source) => (
                <tr
                  key={source.ip}
                  className="transition-colors duration-150"
                  style={{ borderBottom: `1px solid ${COLORS.border}30` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${COLORS.accent}05`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold"
                      style={{
                        background: source.rank <= 3 ? `${COLORS.threat.critical}15` : COLORS.grid,
                        color: source.rank <= 3 ? COLORS.threat.critical : COLORS.textSecondary,
                        fontFamily: FONT_MONO,
                      }}
                    >
                      {source.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold tracking-wide" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
                      {source.ip}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-base" role="img" aria-label={source.country}>
                      {source.flag}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold" style={{ color: COLORS.textPrimary, fontFamily: FONT_MONO }}>
                      {source.attacks.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>
                      {source.threatType}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <SeverityBar severity={source.severity} attacks={source.attacks} />
                  </td>
                  <td className="px-5 py-3">
                    <TrendIndicator value={source.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---- Footer status bar ---- */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-lg"
        style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff41' }} />
            <span className="text-[10px]" style={{ color: COLORS.textSecondary, fontFamily: FONT_MONO }}>
              SYSTEM ONLINE
            </span>
          </div>
          <div className="h-3 w-px" style={{ background: COLORS.border }} />
          <span className="text-[10px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
            NODE: WATCHTOWER-PRIME
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px]" style={{ color: COLORS.textMuted, fontFamily: FONT_MONO }}>
            UPTIME: {Math.floor(Math.random() * 24 + 12)}h {Math.floor(Math.random() * 60)}m
          </span>
          <div className="h-3 w-px" style={{ background: COLORS.border }} />
          <span className="text-[10px]" style={{ color: COLORS.accent, fontFamily: FONT_MONO }}>
            v2.4.1
          </span>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
