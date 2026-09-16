import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  ShieldAlert,
  Zap,
  Globe,
  Network,
  Activity,
  X,
  RefreshCw,
  AlertTriangle,
  Shield,
  Server,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  AlertOctagon,
  Crosshair,
  Siren,
  FileSearch,
  Skull,
  Bug,
  Lock,
  Radar,
  Bell,
  Target,
  Wifi,
} from 'lucide-react';
import { Alert } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type Severity = 'critical' | 'high' | 'medium' | 'low';
type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d';

interface ThreatIntelSource {
  name: string;
  url: string;
  color: string;
}

interface RecommendedAction {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  action: string;
  detail: string;
}

interface MockAlert extends Alert {
  intelSources?: ThreatIntelSource[];
  recommendedAction?: RecommendedAction;
  flowCount?: number;
  packetsAnalyzed?: number;
  firstSeen?: number;
  lastSeen?: number;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const COLORS = {
  bg: '#060a10',
  cardBg: '#0a1118',
  border: '#1a2736',
  textPrimary: '#e0e8f0',
  textSecondary: '#64748b',
  accentCyan: '#00d4ff',
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#06b6d4',
};

const SEVERITY_CFG: Record<Severity, {
  bg: string; text: string; border: string; dot: string; label: string;
  glow: string; bar: string; bgCard: string;
}> = {
  critical: {
    bg: 'rgba(239,68,68,0.08)',
    text: COLORS.critical,
    border: 'rgba(239,68,68,0.4)',
    dot: COLORS.critical,
    label: 'CRITICAL',
    glow: '0 0 12px rgba(239,68,68,0.5)',
    bar: COLORS.critical,
    bgCard: 'rgba(239,68,68,0.06)',
  },
  high: {
    bg: 'rgba(249,115,22,0.08)',
    text: COLORS.high,
    border: 'rgba(249,115,22,0.35)',
    dot: COLORS.high,
    label: 'HIGH',
    glow: '0 0 10px rgba(249,115,22,0.4)',
    bar: COLORS.high,
    bgCard: 'rgba(249,115,22,0.05)',
  },
  medium: {
    bg: 'rgba(234,179,8,0.08)',
    text: COLORS.medium,
    border: 'rgba(234,179,8,0.3)',
    dot: COLORS.medium,
    label: 'MEDIUM',
    glow: '0 0 8px rgba(234,179,8,0.3)',
    bar: COLORS.medium,
    bgCard: 'rgba(234,179,8,0.04)',
  },
  low: {
    bg: 'rgba(6,182,212,0.08)',
    text: COLORS.low,
    border: 'rgba(6,182,212,0.3)',
    dot: COLORS.low,
    label: 'LOW',
    glow: '0 0 8px rgba(6,182,212,0.3)',
    bar: COLORS.low,
    bgCard: 'rgba(6,182,212,0.04)',
  },
};

const SEVERITY_ORDER: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

const THREAT_TYPES = [
  'DDoS', 'Port Scan', 'Beaconing', 'DNS Tunneling',
  'Data Exfiltration', 'Malware C2', 'SQL Injection', 'XSS', 'Brute Force'
];

const THREAT_ICONS: Record<string, typeof ShieldAlert> = {
  DDoS: Zap,
  'Port Scan': Search,
  Beaconing: Radar,
  'DNS Tunneling': Globe,
  'Data Exfiltration': Download,
  'Malware C2': Bug,
  'SQL Injection': FileSearch,
  XSS: Shield,
  'Brute Force': Lock,
};

const INTEL_SOURCES: ThreatIntelSource[] = [
  { name: 'VirusTotal', url: 'https://virustotal.com', color: '#4d9de0' },
  { name: 'AbuseIPDB', url: 'https://abuseipdb.com', color: '#e74c3c' },
  { name: 'OTX', url: 'https://otx.alienvault.com', color: '#6c5ce7' },
  { name: 'Shodan', url: 'https://shodan.io', color: '#f39c12' },
  { name: 'URLhaus', url: 'https://urlhaus.com', color: '#2ecc71' },
  { name: 'ThreatFox', url: 'https://threatfox.com', color: '#e91e63' },
];

const ACTIONS: Record<string, RecommendedAction> = {
  DDoS: {
    priority: 'immediate',
    action: 'BLOCK_SOURCE_IP',
    detail: 'Add to WAF blocklist, enable SYN cookies, contact upstream ISP.',
  },
  'Port Scan': {
    priority: 'medium',
    action: 'MONITOR_AND_LOG',
    detail: 'Log source IP, increase alert sensitivity, review exposed services.',
  },
  Beaconing: {
    priority: 'high',
    action: 'ISOLATE_ENDPOINT',
    detail: 'Quarantine affected host, capture memory dump, hunt for implant.',
  },
  'DNS Tunneling': {
    priority: 'high',
    action: 'BLOCK_DNS_EGRESS',
    detail: 'Restrict DNS to internal resolvers only, inspect TXT records.',
  },
  'Data Exfiltration': {
    priority: 'immediate',
    action: 'SEIZE_CONNECTION',
    detail: 'Terminate session, rotate credentials, audit data access logs.',
  },
  'Malware C2': {
    priority: 'immediate',
    action: 'REMEDIATE_IMMEDIATE',
    detail: 'Kill process, remove persistence, scan all connected hosts.',
  },
  'SQL Injection': {
    priority: 'high',
    action: 'PATCH_WAF_RULES',
    detail: 'Update WAF rules, sanitize inputs, audit DB for unauthorized queries.',
  },
  XSS: {
    priority: 'high',
    action: 'REVIEW_INPUT_FILTERS',
    detail: 'Update CSP headers, sanitize user input, review affected pages.',
  },
  'Brute Force': {
    priority: 'high',
    action: 'LOCKOUT_IP',
    detail: 'Apply account lockout policy, enable 2FA, rate-limit login endpoint.',
  },
};

// ---------------------------------------------------------------------------
// Mock data generation
// ---------------------------------------------------------------------------
const now = Date.now();
const m = (minAgo: number) => now - minAgo * 60_000;
const s = (secAgo: number) => now - secAgo * 1000;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genIp(octetRange: number = 255): string {
  return `${randInt(1,223)}.${randInt(0,octetRange)}.${randInt(0,octetRange)}.${randInt(1,254)}`;
}

const INTERNAL_PREFIXES = ['10.0', '172.16', '192.168'];
function genInternalIp(): string {
  const prefix = pick(INTERNAL_PREFIXES);
  if (prefix === '10.0') return `10.${randInt(0,255)}.${randInt(0,255)}.${randInt(1,254)}`;
  if (prefix === '172.16') return `172.${randInt(16,31)}.${randInt(0,255)}.${randInt(1,254)}`;
  return `192.168.${randInt(0,255)}.${randInt(1,254)}`;
}

function genThreatIntel(severity: Severity): ThreatIntelSource[] {
  const count = severity === 'critical' ? randInt(3,5) : severity === 'high' ? randInt(2,4) : randInt(1,3);
  const shuffled = [...INTEL_SOURCES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function confidenceForSeverity(severity: Severity): number {
  switch (severity) {
    case 'critical': return randInt(82, 99);
    case 'high': return randInt(68, 92);
    case 'medium': return randInt(55, 85);
    case 'low': return randInt(35, 70);
  }
}

function severityForType(type: string): Severity {
  switch (type) {
    case 'DDoS': return pick(['critical', 'high']);
    case 'Port Scan': return pick(['low', 'medium']);
    case 'Beaconing': return 'high';
    case 'DNS Tunneling': return 'high';
    case 'Data Exfiltration': return 'critical';
    case 'Malware C2': return pick(['critical', 'high']);
    case 'SQL Injection': return 'high';
    case 'XSS': return pick(['medium', 'high']);
    case 'Brute Force': return 'high';
    default: return 'medium';
  }
}

function evidenceForType(type: string, srcIp: string, dstIp: string) {
  const base = {
    src_ip: srcIp,
    dst_ip: dstIp,
    timestamp: now,
  };
  switch (type) {
    case 'DDoS':
      return { ...base, packet_count: String(randInt(5000, 500000)), unique_src_ips: String(randInt(50, 5000)), attack_vector: pick(['SYN Flood', 'UDP Flood', 'ICMP Flood', 'HTTP Flood']), anomaly_score: +(Math.random() * 0.3 + 0.7).toFixed(2) };
    case 'Port Scan':
      return { ...base, unique_ports_scanned: String(randInt(50, 2000)), scan_duration_sec: String(randInt(5, 120)), scan_type: pick(['SYN Scan', 'Connect Scan', 'Stealth Scan']), ports_open: String(randInt(2, 15)), anomaly_score: +(Math.random() * 0.4 + 0.4).toFixed(2) };
    case 'Beaconing':
      return { ...base, beacon_interval_sec: String(randInt(30, 300)), jitter_pct: String(randInt(5, 25)), destination_domain: `c2-${randInt(100,999)}.malware.net`, anomaly_score: +(Math.random() * 0.3 + 0.6).toFixed(2) };
    case 'DNS Tunneling':
      return { ...base, query_type: 'TXT', encoded_payload_length: String(randInt(200, 2000)), query_rate_per_min: String(randInt(100, 2000)), anomaly_score: +(Math.random() * 0.35 + 0.55).toFixed(2) };
    case 'Data Exfiltration':
      return { ...base, exfil_bytes: String(randInt(100_000, 50_000_000)), transfer_duration_sec: String(randInt(60, 3600)), destination_country: pick(['RU', 'CN', 'KP', 'IR', 'Unknown']), anomaly_score: +(Math.random() * 0.25 + 0.7).toFixed(2) };
    case 'Malware C2':
      return { ...base, malware_family: pick(['Emotet', 'TrickBot', 'Qakbot', 'Cobalt Strike', 'Mirai']), command: pick(['download', 'upload', 'execute', 'persist']), encoded_payload: 'aGVsbG8gd29ybGQ=', anomaly_score: +(Math.random() * 0.2 + 0.75).toFixed(2) };
    case 'SQL Injection':
      return { ...base, injected_query: "' OR 1=1--", target_table: pick(['users', 'transactions', 'credentials']), dbms: pick(['MySQL', 'PostgreSQL', 'MSSQL']), anomaly_score: +(Math.random() * 0.3 + 0.6).toFixed(2) };
    case 'XSS':
      return { ...base, payload_type: pick(['Reflected', 'Stored', 'DOM-based']), script_tag: '<script>alert(1)</script>', target_page: pick(['/search', '/profile', '/comments']), anomaly_score: +(Math.random() * 0.3 + 0.5).toFixed(2) };
    case 'Brute Force':
      return { ...base, attempts_per_min: String(randInt(50, 500)), target_service: pick(['SSH', 'RDP', 'HTTP-Login', 'FTP']), usernames_tried: String(randInt(10, 100)), anomaly_score: +(Math.random() * 0.35 + 0.5).toFixed(2) };
    default:
      return { ...base, anomaly_score: +(Math.random()).toFixed(2) };
  }
}

function generateMockAlerts(count: number = 30): MockAlert[] {
  const alerts: MockAlert[] = [];
  for (let i = 0; i < count; i++) {
    const threatType = pick(THREAT_TYPES);
    const severity = severityForType(threatType);
    const srcIp = Math.random() < 0.4 ? genIp() : genInternalIp();
    const dstIp = Math.random() < 0.6 ? genInternalIp() : genIp();
    const ts = now - randInt(0, 1000 * 60 * 60 * 24);
    const confidence = confidenceForSeverity(severity);

    alerts.push({
      id: `ALT-${String(randInt(10000, 99999))}`,
      timestamp: ts,
      threat_type: threatType,
      confidence,
      severity,
      src_ip: srcIp,
      dst_ip: dstIp,
      src_port: randInt(1024, 65535),
      dst_port: pick([21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 5900, 8080, 8443]),
      protocol: pick(['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS']),
      evidence: evidenceForType(threatType, srcIp, dstIp),
      flow_count: randInt(1, 5000),
      intelSources: genThreatIntel(severity),
      recommendedAction: ACTIONS[threatType],
      packetsAnalyzed: randInt(100, 1000000),
      firstSeen: ts - randInt(0, 3600_000),
      lastSeen: ts,
    });
  }
  return alerts.sort((a, b) => b.timestamp - a.timestamp);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatRelative(ts: number): string {
  const diff = now - ts;
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function confidenceColor(confidence: number): { bar: string; text: string } {
  if (confidence >= 85) return { bar: '#00ff41', text: '#00ff41' };
  if (confidence >= 70) return { bar: COLORS.medium, text: COLORS.medium };
  if (confidence >= 50) return { bar: COLORS.high, text: COLORS.high };
  return { bar: '#5a7a9a', text: '#5a7a9a' };
}

function TrendIcon({ count }: { count: number }) {
  if (count > 3) return <TrendingUp size={12} color="#ef4444" />;
  if (count > 1) return <TrendingUp size={12} color="#f97316" />;
  if (count === 1) return <Minus size={12} color="#eab308" />;
  return <TrendingDown size={12} color="#06b6d4" />;
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------
function Sparkline({ data, color = COLORS.accentCyan, height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const width = 280;
  const step = width / Math.max(data.length - 1, 1);
  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 8)}`).join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;
  const mid = Math.floor(data.length / 2);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => (
        <circle key={i} cx={i * step} cy={height - (v / max) * (height - 8)} r="2.5" fill={color} stroke={COLORS.cardBg} strokeWidth="1.5" />
      ))}
      <line x1={mid * step} y1="0" x2={mid * step} y2={height} stroke={COLORS.border} strokeDasharray="3 3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LiveThreats: React.FC = () => {
  const [alerts] = useState<MockAlert[]>(() => generateMockAlerts(30));
  const [isLive, setIsLive] = useState(true);
  const [searchIp, setSearchIp] = useState('');
  const [activeSeverities, setActiveSeverities] = useState<Set<Severity>>(
    new Set(['critical', 'high', 'medium', 'low'])
  );
  const [threatTypeFilter, setThreatTypeFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 8;

  // Live tick simulation
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => setLiveTick((t) => t + 1), 4000);
    return () => clearInterval(interval);
  }, [isLive]);

  // Severity counts
  const severityCounts = useMemo(() => {
    const counts: Record<Severity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const a of alerts) {
      if (counts[a.severity] !== undefined) counts[a.severity]++;
    }
    return counts;
  }, [alerts]);

  // Time cutoff
  const timeCutoff = useMemo(() => {
    switch (timeRange) {
      case '15m': return now - 15 * 60_000;
      case '1h': return now - 60 * 60_000;
      case '6h': return now - 6 * 60 * 60_000;
      case '24h': return now - 24 * 60 * 60_000;
      case '7d': return now - 7 * 24 * 60 * 60_000;
    }
  }, [timeRange]);

  // Timeline data (buckets by hour or minute depending on range)
  const timelineData = useMemo(() => {
    const filteredInRange = alerts.filter(a => a.timestamp >= timeCutoff);
    const bucketMs = timeRange === '15m' ? 60_000 : timeRange === '1h' ? 300_000 : 3_600_000;
    const numBuckets = Math.min(12, Math.max(1, Math.ceil((now - timeCutoff) / bucketMs)));
    const buckets = new Array(numBuckets).fill(0);
    for (const a of filteredInRange) {
      const idx = Math.min(numBuckets - 1, Math.floor((a.timestamp - timeCutoff) / bucketMs));
      buckets[idx]++;
    }
    return buckets;
  }, [alerts, timeRange, timeCutoff]);

  // Unique threat types
  const uniqueThreatTypes = useMemo(() => {
    const types = new Set(alerts.map((a) => a.threat_type));
    return Array.from(types).sort();
  }, [alerts]);

  // Filtered alerts
  const filtered = useMemo(() => {
    let result = [...alerts];
    if (searchIp) {
      const q = searchIp.toLowerCase();
      result = result.filter((a) => a.src_ip.includes(q) || a.dst_ip.includes(q));
    }
    if (activeSeverities.size > 0 && activeSeverities.size < 4) {
      result = result.filter((a) => activeSeverities.has(a.severity));
    }
    if (threatTypeFilter !== 'all') {
      result = result.filter((a) => a.threat_type === threatTypeFilter);
    }
    result = result.filter((a) => a.timestamp >= timeCutoff);
    result.sort((a, b) => b.timestamp - a.timestamp);
    return result;
  }, [alerts, searchIp, activeSeverities, threatTypeFilter, timeCutoff]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => filtered.slice((safePage - 1) * perPage, safePage * perPage), [filtered, safePage]);

  useEffect(() => { setCurrentPage(1); }, [searchIp, activeSeverities, threatTypeFilter, timeRange]);

  const toggleSeverity = (sev: Severity) => {
    setActiveSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  };

  const clearFilters = () => {
    setSearchIp('');
    setActiveSeverities(new Set(['critical', 'high', 'medium', 'low']));
    setThreatTypeFilter('all');
    setTimeRange('1h');
  };

  const hasActiveFilters =
    searchIp !== '' ||
    activeSeverities.size < 4 ||
    threatTypeFilter !== 'all' ||
    timeRange !== '1h';

  // ---------------------------------------------------------------------------
  // Styles
  // ---------------------------------------------------------------------------
  const fontMono = "'JetBrains Mono', 'Fira Code', 'Courier New', monospace";
  const fontSans = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

  const s: Record<string, any> = {
    page: {
      background: COLORS.bg,
      minHeight: '100vh',
      padding: '20px 24px',
      color: COLORS.textPrimary,
      fontFamily: fontSans,
    },
    header: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      flexWrap: 'wrap',
      marginBottom: 20,
    },
    titleBlock: { display: 'flex', alignItems: 'center', gap: 14 },
    titleIcon: {
      width: 44, height: 44, borderRadius: 10,
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    title: {
      fontFamily: fontMono, fontSize: 22, fontWeight: 700, color: COLORS.accentCyan,
      letterSpacing: 3, textTransform: 'uppercase', margin: 0, lineHeight: 1.1,
    },
    subtitle: {
      fontSize: 12, color: COLORS.textSecondary, margin: '4px 0 0', fontFamily: fontMono,
      display: 'flex', alignItems: 'center', gap: 10,
    },
    liveBadge: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      color: '#00ff41', fontSize: 10, fontWeight: 700, letterSpacing: 1,
    },
    liveDot: {
      width: 7, height: 7, borderRadius: '50%', backgroundColor: '#00ff41',
      boxShadow: '0 0 6px #00ff41, 0 0 12px rgba(0,255,65,0.5)',
      animation: 'livePulse 1.4s ease-in-out infinite',
    },
    buttonGroup: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    btn: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      border: '1px solid', cursor: 'pointer', fontFamily: fontMono, transition: 'all 0.15s ease',
      background: COLORS.cardBg,
    },
    severityGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16,
    },
    severityCard: (cfg: any) => ({
      padding: '14px 16px', borderRadius: 8, textAlign: 'left',
      border: `1px solid ${cfg.border}`,
      background: `linear-gradient(135deg, ${cfg.bgCard}, rgba(10,17,24,0.8))`,
      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.03), ${cfg.glow}`,
      transition: 'all 0.2s ease',
      position: 'relative', overflow: 'hidden',
    }),
    severityCardBg: (cfg: any) => ({
      position: 'absolute', top: -10, right: -10, width: 60, height: 60,
      borderRadius: '50%', background: cfg.bg, filter: 'blur(16px)', opacity: 0.5,
    }),
    severityLabel: (cfg: any) => ({
      fontSize: 10, fontWeight: 700, color: cfg.text, letterSpacing: 1.5,
      fontFamily: fontMono,
    }),
    severityCount: {
      fontSize: 32, fontWeight: 700, color: COLORS.textPrimary, marginTop: 4,
      fontFamily: fontMono, lineHeight: 1,
    },
    severityTrend: {
      display: 'flex', alignItems: 'center', gap: 4, marginTop: 6,
      fontSize: 10, color: COLORS.textSecondary, fontFamily: fontMono,
    },
    filterBar: {
      background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 8,
      padding: '14px 16px', marginBottom: 16,
    },
    filterRow: {
      display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
    },
    pill: (sev: Severity, active: boolean) => {
      const cfg = SEVERITY_CFG[sev];
      return {
        padding: '5px 12px', borderRadius: 20, fontSize: 10, fontWeight: 700,
        border: `1px solid ${active ? cfg.border : COLORS.border}`,
        background: active ? cfg.bg : 'transparent',
        color: active ? cfg.text : COLORS.textSecondary,
        cursor: 'pointer', fontFamily: fontMono, letterSpacing: 1, transition: 'all 0.15s ease',
        whiteSpace: 'nowrap' as const,
      };
    },
    select: {
      padding: '6px 28px 6px 10px', borderRadius: 6, fontSize: 11,
      background: COLORS.cardBg, border: `1px solid ${COLORS.border}`,
      color: COLORS.textPrimary, fontFamily: fontMono, outline: 'none',
      cursor: 'pointer', appearance: 'none' as const,
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
    },
    timePill: (active: boolean) => ({
      padding: '5px 10px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      border: `1px solid ${active ? COLORS.accentCyan : COLORS.border}`,
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      color: active ? COLORS.accentCyan : COLORS.textSecondary,
      cursor: 'pointer', fontFamily: fontMono, transition: 'all 0.15s ease',
    }),
    sectionLabel: {
      fontSize: 9, fontWeight: 700, color: COLORS.textSecondary, letterSpacing: 2,
      fontFamily: fontMono, textTransform: 'uppercase' as const,
    },
    tableCard: {
      background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 8,
      overflow: 'hidden',
    },
    tableHead: {
      background: 'rgba(10,17,24,0.95)', borderBottom: `1px solid ${COLORS.border}`,
    },
    th: {
      padding: '10px 12px', fontSize: 9, fontWeight: 700,
      textTransform: 'uppercase' as const, letterSpacing: 1.5,
      color: COLORS.textSecondary, fontFamily: fontMono, whiteSpace: 'nowrap' as const,
      textAlign: 'left' as const,
    },
    row: (sev: Severity, isEven: boolean, isExpanded: boolean): React.CSSProperties => {
      const cfg = SEVERITY_CFG[sev];
      if (isExpanded) return { background: cfg.bg, borderLeft: `3px solid ${cfg.text}` };
      if (isEven) return { background: 'rgba(10,17,24,0.4)', borderLeft: `3px solid ${cfg.text}40` };
      return { background: 'transparent', borderLeft: `3px solid ${cfg.text}30` };
    },
    rowHover: (cfg: typeof SEVERITY_CFG.critical) => ({
      background: cfg.bg,
    }),
    td: {
      padding: '10px 12px', fontSize: 11, fontFamily: fontMono, color: COLORS.textPrimary,
    },
    severityBadge: (cfg: typeof SEVERITY_CFG.critical) => ({
      display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 4,
      fontSize: 9, fontWeight: 700, letterSpacing: 1,
      background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
      boxShadow: cfg.glow, fontFamily: fontMono,
    }),
    confidenceTrack: {
      width: 60, height: 6, borderRadius: 3,
      background: 'rgba(10,17,24,0.8)', border: `1px solid ${COLORS.border}`,
      overflow: 'hidden', position: 'relative' as const,
    },
    confidenceFill: (color: string, pct: number) => ({
      height: '100%', borderRadius: 2, background: color,
      boxShadow: `0 0 6px ${color}`, transition: 'width 0.6s ease',
      width: `${pct}%`,
    }),
    confidenceText: (color: string) => ({
      fontSize: 10, fontWeight: 600, color, fontFamily: fontMono,
      textShadow: `0 0 4px ${color}40`, width: 36, textAlign: 'right' as const,
    }),
    ipText: (color: string) => ({
      fontFamily: fontMono, fontSize: 11, color, textShadow: `0 0 4px ${color}30`,
    }),
    actionBtn: (active: boolean, cfg: typeof SEVERITY_CFG.critical) => ({
      padding: '5px 10px', borderRadius: 5, fontSize: 10, fontWeight: 600,
      border: `1px solid ${active ? cfg.border : COLORS.border}`,
      background: active ? cfg.bg : 'transparent',
      color: active ? cfg.text : COLORS.textSecondary,
      cursor: 'pointer', fontFamily: fontMono, transition: 'all 0.15s ease',
      display: 'inline-flex', alignItems: 'center', gap: 4,
    }),
    expandedSection: {
      background: 'rgba(0,212,255,0.02)', borderTop: `1px solid ${COLORS.border}`,
    },
    intelBadge: (color: string) => ({
      display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 6px',
      borderRadius: 3, fontSize: 9, fontWeight: 600,
      border: `1px solid ${color}30`, background: `${color}15`,
      color, fontFamily: fontMono,
    }),
    pagination: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 12, padding: '10px 14px', borderTop: `1px solid ${COLORS.border}`,
      flexWrap: 'wrap' as const,
    },
    pagText: {
      fontSize: 10, color: COLORS.textSecondary, fontFamily: fontMono,
    },
    pageBtn: (active: boolean) => ({
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: fontMono,
      cursor: 'pointer', border: `1px solid ${active ? COLORS.accentCyan : 'transparent'}`,
      background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
      color: active ? COLORS.accentCyan : COLORS.textSecondary, transition: 'all 0.15s ease',
    }),
    emptyState: {
      display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
      justifyContent: 'center', padding: '64px 20px', color: COLORS.textSecondary,
    },
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div style={s.page}>
      <style>{`
        @font-face {
          font-family: 'JetBrains Mono';
          font-style: normal;
          font-weight: 400 700;
          font-display: swap;
          src: url('https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjOVGa.woff2') format('woff2');
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px currentColor, 0 0 12px currentColor; }
          50% { opacity: 0.4; box-shadow: 0 0 2px currentColor, 0 0 4px currentColor; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .row-enter { animation: fadeIn 0.3s ease; }
      `}</style>

      {/* ---- HEADER ---- */}
      <div style={s.header}>
        <div style={s.titleBlock}>
          <div style={s.titleIcon}>
            <ShieldAlert size={22} color={COLORS.critical} />
          </div>
          <div>
            <h1 style={s.title}>LIVE THREATS</h1>
            <p style={s.subtitle}>
              Real-time threat intelligence monitoring &mdash; WATCHTOWER v2.4
              {isLive && (
                <span style={s.liveBadge}>
                  <span style={s.liveDot} />
                  LIVE
                </span>
              )}
            </p>
          </div>
        </div>
        <div style={s.buttonGroup}>
          <button
            onClick={() => setIsLive((v) => !v)}
            style={{
              ...s.btn,
              color: isLive ? '#00ff41' : COLORS.textSecondary,
              borderColor: isLive ? 'rgba(0,255,65,0.4)' : COLORS.border,
              boxShadow: isLive ? '0 0 8px rgba(0,255,65,0.2)' : 'none',
            }}
          >
            <RefreshCw size={13} style={{ animation: isLive ? 'spin 1.2s linear infinite' : 'none' }} />
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <button
            onClick={() => {
              const headers = ['Alert ID', 'Timestamp', 'Threat Type', 'Severity', 'Confidence', 'Source IP', 'Dest IP', 'Protocol', 'Flow Count', 'Packets', 'Intel Sources'];
              const rows = filtered.map((a) => [
                a.id, new Date(a.timestamp).toISOString(), a.threat_type, a.severity,
                `${a.confidence}%`, a.src_ip, a.dst_ip, a.protocol, a.flow_count,
                a.packetsAnalyzed ?? 0, (a.intelSources ?? []).map(s => s.name).join(';'),
              ]);
              const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `watchtower-threats-${Date.now()}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              ...s.btn,
              color: COLORS.textPrimary,
              borderColor: 'rgba(0,212,255,0.25)',
              boxShadow: '0 0 4px rgba(0,212,255,0.08)',
            }}
          >
            <Download size={13} />
            EXPORT
          </button>
        </div>
      </div>

      {/* ---- SEVERITY CARDS ---- */}
      <div style={s.severityGrid}>
        {(Object.keys(SEVERITY_CFG) as Severity[]).map((sev) => {
          const cfg = SEVERITY_CFG[sev];
          const count = severityCounts[sev];
          const active = activeSeverities.has(sev);
          return (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              style={s.severityCard(cfg)}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={s.severityCardBg(cfg)} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={s.severityLabel(cfg)}>{cfg.label}</span>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', backgroundColor: cfg.dot,
                    boxShadow: active ? cfg.glow : 'none',
                    animation: active ? 'livePulse 1.4s ease-in-out infinite' : 'none',
                  }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={s.severityCount}>{String(count).padStart(2, '0')}</span>
                  <div style={s.severityTrend}>
                    <TrendIcon count={count} />
                    <span>{count > 5 ? 'Elevated' : count > 2 ? 'Moderate' : 'Normal'}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ---- THREAT TIMELINE ---- */}
      <div style={{
        background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 8,
        padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={COLORS.accentCyan} />
            <span style={s.sectionLabel}>// THREAT TIMELINE</span>
          </div>
          <span style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: fontMono }}>
            {filtered.filter(a => a.timestamp >= timeCutoff).length} alerts in selected window
          </span>
        </div>
        <Sparkline data={timelineData} color={COLORS.accentCyan} height={36} />
      </div>

      {/* ---- FILTER BAR ---- */}
      <div style={s.filterBar}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={14} color={COLORS.accentCyan} />
            <span style={{ ...s.sectionLabel, color: COLORS.accentCyan }}>// FILTERS</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ ...s.pagText, fontSize: 10 }}>
              Showing{' '}
              <span style={{ color: COLORS.accentCyan, fontWeight: 600 }}>{filtered.length}</span>
              {' '}of{' '}
              <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{alerts.length}</span>
              {' '}alerts
            </span>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ ...s.pill('low', true), padding: '3px 8px', fontSize: 9 }}>
                <X size={10} /> CLEAR
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: COLORS.textSecondary, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="> SEARCH IP..."
              value={searchIp}
              onChange={(e) => setSearchIp(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 6, fontSize: 11,
                background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                color: COLORS.textPrimary, fontFamily: fontMono, outline: 'none',
                transition: 'all 0.15s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = COLORS.accentCyan; e.currentTarget.style.boxShadow = `0 0 8px ${COLORS.accentCyan}20`; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {/* Threat type */}
          <select value={threatTypeFilter} onChange={(e) => setThreatTypeFilter(e.target.value)} style={s.select}>
            <option value="all">ALL_TYPES</option>
            {uniqueThreatTypes.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>

          {/* Time range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: COLORS.bg, padding: 3, borderRadius: 6, border: `1px solid ${COLORS.border}` }}>
            {(['15m', '1h', '6h', '24h', '7d'] as TimeRange[]).map((range) => (
              <button key={range} onClick={() => setTimeRange(range)} style={s.timePill(timeRange === range)}>
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Severity pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {(Object.keys(SEVERITY_CFG) as Severity[]).map((sev) => {
              const cfg = SEVERITY_CFG[sev];
              const active = activeSeverities.has(sev);
              return (
                <button key={sev} onClick={() => toggleSeverity(sev)} style={s.pill(sev, active)}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ---- TABLE ---- */}
      <div style={s.tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' as const }}>
            <thead style={s.tableHead}>
              <tr>
                <th style={{ ...s.th, width: 36, padding: '10px 8px' }}>
                  <span style={{ display: 'block', width: 8, height: 8, borderRadius: '50%', background: COLORS.textSecondary }} />
                </th>
                <th style={s.th}>TIMESTAMP</th>
                <th style={s.th}>SEVERITY</th>
                <th style={s.th}>THREAT TYPE</th>
                <th style={s.th}>CONFIDENCE</th>
                <th style={s.th}>SRC_IP</th>
                <th style={s.th}>DST_IP</th>
                <th style={s.th}>INTEL</th>
                <th style={s.th}>ACTION</th>
                <th style={{ ...s.th, width: 40, padding: '10px 8px' }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((alert, idx) => {
                const cfg = SEVERITY_CFG[alert.severity];
                const isExpanded = expandedId === alert.id;
                const conf = confidenceColor(alert.confidence);
                const ThreatIcon = THREAT_ICONS[alert.threat_type] ?? ShieldAlert;
                const isEven = idx % 2 === 0;

                return (
                  <Fragment key={alert.id}>
                    <tr
                      className="row-enter"
                      style={s.row(alert.severity, isEven, isExpanded)}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = cfg.bg;
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = isEven ? 'rgba(10,17,24,0.4)' : 'transparent';
                      }}
                    >
                      {/* Indicator dot */}
                      <td style={{ ...s.td, padding: '10px 8px' }}>
                        <span style={{
                          display: 'block', width: 7, height: 7, borderRadius: '50%',
                          backgroundColor: cfg.dot, boxShadow: cfg.glow,
                          animation: 'livePulse 2s ease-in-out infinite',
                        }} title={cfg.label} />
                      </td>

                      {/* Timestamp */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontFamily: fontMono, fontSize: 11, color: COLORS.textPrimary }}>
                            {formatTimestamp(alert.timestamp)}
                          </span>
                          <span style={{ fontSize: 9, color: COLORS.textSecondary }}>
                            {formatRelative(alert.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Severity badge */}
                      <td style={s.td}>
                        <span style={s.severityBadge(cfg)}>
                          {cfg.label}
                        </span>
                      </td>

                      {/* Threat type */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ThreatIcon size={14} color={cfg.text} />
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: COLORS.textPrimary,
                            fontFamily: fontMono, textTransform: 'uppercase' as const, letterSpacing: 0.5,
                            whiteSpace: 'nowrap' as const,
                          }}>
                            {alert.threat_type}
                          </span>
                        </div>
                      </td>

                      {/* Confidence bar */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={s.confidenceTrack}>
                            <div style={s.confidenceFill(conf.bar, alert.confidence)} />
                          </div>
                          <span style={s.confidenceText(conf.text)}>{alert.confidence}%</span>
                        </div>
                      </td>

                      {/* SRC IP */}
                      <td style={s.td}>
                        <span style={s.ipText(COLORS.low)}>{alert.src_ip}</span>
                      </td>

                      {/* DST IP */}
                      <td style={s.td}>
                        <span style={s.ipText(COLORS.accentCyan)}>{alert.dst_ip}</span>
                      </td>

                      {/* Intel sources */}
                      <td style={s.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                          {(alert.intelSources ?? []).slice(0, 2).map((src) => (
                            <span key={src.name} style={s.intelBadge(src.color)} title={src.name}>
                              {src.name.slice(0, 4)}
                            </span>
                          ))}
                          {(alert.intelSources?.length ?? 0) > 2 && (
                            <span style={{ fontSize: 9, color: COLORS.textSecondary, fontFamily: fontMono }}>
                              +{(alert.intelSources!.length - 2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Recommended action */}
                      <td style={s.td}>
                        {alert.recommendedAction ? (
                          <span style={{
                            fontSize: 10, fontWeight: 600, color: cfg.text, fontFamily: fontMono,
                            background: cfg.bg, padding: '2px 6px', borderRadius: 3,
                            border: `1px solid ${cfg.border}`,
                          }}>
                            {alert.recommendedAction.action}
                          </span>
                        ) : (
                          <span style={{ fontSize: 10, color: COLORS.textSecondary }}>--</span>
                        )}
                      </td>

                      {/* Expand button */}
                      <td style={{ ...s.td, padding: '10px 8px', textAlign: 'center' as const }}>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                          style={{
                            padding: '4px', borderRadius: 4,
                            background: isExpanded ? 'rgba(0,212,255,0.12)' : 'transparent',
                            color: isExpanded ? COLORS.accentCyan : COLORS.textSecondary,
                            border: `1px solid ${isExpanded ? 'rgba(0,212,255,0.3)' : COLORS.border}`,
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <Eye size={14} />}
                        </button>
                      </td>
                    </tr>

                    {/* ---- EXPANDED ROW ---- */}
                    {isExpanded && (
                      <tr style={s.expandedSection}>
                        <td colSpan={10} style={{ padding: '16px 14px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {/* Left: Evidence */}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <FileSearch size={13} color={COLORS.accentCyan} />
                                <span style={{ ...s.sectionLabel, color: COLORS.accentCyan }}>EVIDENCE</span>
                                <span style={{ fontSize: 9, color: COLORS.textSecondary, fontFamily: fontMono }}>
                                  Alert ID: {alert.id}
                                </span>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {Object.entries(alert.evidence).slice(0, 8).map(([key, value]) => {
                                  const displayValue = typeof value === 'number' ? value.toLocaleString() : String(value ?? '--');
                                  const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                                  return (
                                    <div key={key} style={{
                                      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                                      borderRadius: 6, padding: '8px 10px',
                                    }}>
                                      <span style={{ fontSize: 8, color: COLORS.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 1, fontFamily: fontMono, fontWeight: 600 }}>
                                        {displayKey}
                                      </span>
                                      <p style={{ fontSize: 11, color: COLORS.textPrimary, fontFamily: fontMono, margin: '2px 0 0', wordBreak: 'break-all' as const, textShadow: `0 0 4px ${COLORS.accentCyan}15` }}>
                                        {displayValue}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right: Intel + Actions + Metrics */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                              {/* Intel sources */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                  <Target size={13} color={COLORS.accentCyan} />
                                  <span style={{ ...s.sectionLabel, color: COLORS.accentCyan }}>THREAT INTEL</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {(alert.intelSources ?? []).map((src) => (
                                    <span key={src.name} style={s.intelBadge(src.color)} title={src.url}>
                                      <ExternalLink size={9} /> {src.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Recommended action */}
                              {alert.recommendedAction && (
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <Siren size={13} color={cfg.text} />
                                    <span style={{ ...s.sectionLabel, color: cfg.text }}>RECOMMENDED ACTION</span>
                                  </div>
                                  <div style={{
                                    background: cfg.bg, border: `1px solid ${cfg.border}`,
                                    borderRadius: 6, padding: '10px 12px',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                      <span style={{
                                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 3,
                                        background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                                        fontFamily: fontMono,
                                      }}>
                                        {alert.recommendedAction.priority.toUpperCase()}
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 600, color: cfg.text, fontFamily: fontMono }}>
                                        {alert.recommendedAction.action}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: 10, color: COLORS.textSecondary, fontFamily: fontMono, margin: 0, lineHeight: 1.5 }}>
                                      {alert.recommendedAction.detail}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Metrics */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                  <Activity size={13} color={COLORS.accentCyan} />
                                  <span style={{ ...s.sectionLabel, color: COLORS.accentCyan }}>METRICS</span>
                                </div>
                                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                  {[
                                    { label: 'FLOWS', value: String(alert.flow_count) },
                                    { label: 'PKTS', value: (alert.packetsAnalyzed ?? 0).toLocaleString() },
                                    { label: 'PROTO', value: alert.protocol },
                                    { label: 'PORTS', value: `${alert.src_port} → ${alert.dst_port}` },
                                    { label: 'FIRST', value: formatRelative(alert.firstSeen ?? alert.timestamp) },
                                    { label: 'LAST', value: formatRelative(alert.lastSeen ?? alert.timestamp) },
                                  ].map((m) => (
                                    <div key={m.label} style={{
                                      background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                                      borderRadius: 4, padding: '4px 8px', minWidth: 64,
                                    }}>
                                      <span style={{ fontSize: 8, color: COLORS.textSecondary, fontFamily: fontMono, letterSpacing: 1 }}>{m.label}</span>
                                      <p style={{ fontSize: 10, color: COLORS.textPrimary, fontFamily: fontMono, margin: 0, fontWeight: 600 }}>{m.value}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {paginated.length === 0 && (
          <div style={s.emptyState}>
            <AlertOctagon size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, fontFamily: fontMono }}>
              NO_ALERTS_MATCH_FILTERS
            </p>
            <p style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6, fontFamily: fontMono }}>
              Adjust your filters or expand the time range
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} style={{
                ...s.btn, marginTop: 14,
                color: COLORS.textSecondary, borderColor: `${COLORS.accentCyan}40`,
              }}>
                <X size={12} /> CLEAR ALL FILTERS
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {paginated.length > 0 && (
          <div style={s.pagination}>
            <p style={s.pagText}>
              Page <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{safePage}</span> of{' '}
              <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{totalPages}</span>
              <span style={{ marginLeft: 8 }}>({filtered.length} total)</span>
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                style={{ ...s.pageBtn(false), opacity: safePage === 1 ? 0.3 : 1, cursor: safePage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={15} />
              </button>

              {(() => {
                const pages: (number | string)[] = [];
                const maxVisible = 5;
                let start = Math.max(1, safePage - Math.floor(maxVisible / 2));
                const end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
                if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
                return pages;
              })().map((p, i) =>
                p === '...' ? (
                  <span key={`e-${i}`} style={{ padding: '0 4px', fontSize: 11, color: COLORS.textSecondary, fontFamily: fontMono }}>...</span>
                ) : (
                  <button key={p} onClick={() => setCurrentPage(Number(p))} style={s.pageBtn(safePage === p)}>
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                style={{ ...s.pageBtn(false), opacity: safePage === totalPages ? 0.3 : 1, cursor: safePage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveThreats;
