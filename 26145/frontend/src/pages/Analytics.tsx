import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  AlertTriangle, ShieldCheck, Clock, ShieldX,
  Activity, Zap, Target, Globe, Server, Radio,
  Search, Download, Lock, Crosshair, Cpu,
} from 'lucide-react';
import {
  getDetectionMetrics, generateThreatTypeData, generateTopSourceIPs,
  generateProtocolDistribution, generateFlowTimeSeries, generateHistoricalAlerts,
} from '../lib/mockBackend';

const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  surfaceHi: 'var(--bg-card-hover)',
  border:    'var(--border-color)',
  borderHi:  'var(--border-active)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--accent-cyan)',
  red:       'var(--accent-red)',
  orange:    'var(--accent-orange)',
  amber:     'var(--accent-yellow)',
  green:     'var(--accent-green)',
  purple:    'var(--accent-purple)',
  pink:      'var(--accent-pink)',
  teal:      'var(--accent-teal)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const FONT = '"JetBrains Mono","Fira Code",monospace';
const SANS = "'Inter',system-ui,sans-serif";

const SEV_META: Record<string, { c: string; bg: string }> = {
  critical: { c: 'var(--accent-red)',    bg: 'var(--sev-critical-bg)' },
  high:     { c: 'var(--accent-orange)', bg: 'var(--sev-high-bg)' },
  medium:   { c: 'var(--accent-yellow)', bg: 'var(--sev-medium-bg)' },
  low:      { c: 'var(--accent-cyan)',   bg: 'var(--sev-low-bg)' },
};

const SEV_LABEL: Record<string, string> = {
  critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low',
};

/* ── Utility helpers ── */

const fmt = (n: number) => n.toLocaleString('en-US');
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ═══════════════════════════════════════════════════════════════════════════════════
   Atomic components
   ═══════════════════════════════════════════════════════════════════════════════════ */

function SH({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{
        fontFamily: FONT, fontSize: 11, fontWeight: 600,
        letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
      }}>{label}</span>
      {right}
    </div>
  );
}

function Panel({ delay = 0, style, children }: {
  delay?: number; style?: React.CSSProperties; children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(8px)',
      transition: `opacity 0.4s ${EASE} ${delay}s, transform 0.4s ${EASE} ${delay}s`,
      boxShadow: '0 1px 3px var(--shadow-sm)',
      ...style,
    }}>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function SevBadge({ sev }: { sev: string }) {
  const m = SEV_META[sev] || SEV_META.low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.8px', color: m.c, background: m.bg,
      border: `1px solid ${m.c}30`, fontFamily: FONT, textTransform: 'uppercase',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: m.c }} />
      {sev}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   1. DONUT CHART — Severity distribution (SVG stroke-dasharray)
   ═══════════════════════════════════════════════════════════════════════════════════ */

function DonutChart({ data }: { data: Array<{ name: string; count: number; severity: string }> }) {
  const size = 200;
  const cx = size / 2, cy = size / 2;
  const R = 78;
  const circ = Math.PI * 2 * R;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  const sevColors: Record<string, string> = {
    critical: 'var(--accent-red)',
    high: 'var(--accent-orange)',
    medium: 'var(--accent-yellow)',
    low: 'var(--accent-cyan)',
  };

  let cumOffset = 0;
  const slices = data.map((d) => {
    const frac = d.count / total;
    const sweep = frac * Math.PI * 2;
    const dash = frac * circ;
    const offset = -cumOffset;
    cumOffset += sweep;
    return { ...d, dash, offset, color: sevColors[d.severity] || C.accent, frac };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {slices.map((s, i) => (
          <circle key={i} cx={cx} cy={cy} r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="16"
            strokeDasharray={`${s.dash} ${circ - s.dash}`}
            strokeDashoffset={s.offset}
            strokeLinecap="butt"
            opacity={0.7 + (i === 0 ? 0.25 : 0)}
            style={{ transition: 'opacity 0.3s, stroke-width 0.3s', cursor: 'pointer' }}
            className="donut-segment"
          />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={800} fontFamily={FONT}>
          {fmt(total)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text-muted)" fontSize="8" fontFamily={FONT} letterSpacing="1.5px">
          THREATS
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {data.map((d, i) => (
          <div key={i} className="donut-legend-item" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="donut-legend-dot" style={{ background: sevColors[d.severity] || C.accent }} />
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: SANS, minWidth: 64 }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', minWidth: 32, textAlign: 'right' }}>
              {fmt(d.count)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: FONT, minWidth: 38, textAlign: 'right' }}>
              {((d.count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   2. SPARKLINE — Alerts per minute, last 30 min (SVG)
   ═══════════════════════════════════════════════════════════════════════════════════ */

function AlertSparkline({ data }: { data: Array<{ time: string; alerts: number }> }) {
  const width = 800, height = 180;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;
  const maxV = Math.max(...data.map(d => d.alerts), 1);

  const pts = data.map((d, i) => ({
    x: pad.left + (i / (data.length - 1)) * cw,
    y: pad.top + ch - (d.alerts / maxV) * ch,
  }));

  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const lastPt = pts[pts.length - 1];
  const area = line + ` L${lastPt.x},${pad.top + ch} L${pts[0].x},${pad.top + ch} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', maxHeight: height }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {[0, 1, 2, 3, 4].map(i => {
        const y = pad.top + (ch / 4) * i;
        const v = Math.round(maxV - (maxV / 4) * i);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={C.border} strokeWidth="1" opacity="0.4" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="var(--text-muted)" fontSize="9" fontFamily={FONT}>{v}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={area} fill="url(#sparkGrad)" className="svg-spark-in" style={{ opacity: 0, animation: 'svg-spark-in 0.6s ease 0.4s forwards' }} />
      {/* Line */}
      <path d={line} fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="2000" strokeDashoffset="2000"
        style={{ animation: 'svg-draw-line 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards' }} />
      {/* Data points */}
      {pts.filter((_, i) => i % 5 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={C.surface} stroke={C.accent} strokeWidth="1.5" />
      ))}
      {/* Last point highlight */}
      <circle cx={lastPt.x} cy={lastPt.y} r="4" fill={C.accent} opacity="0.15">
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.15;0.05;0.15" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={lastPt.x} cy={lastPt.y} r="2.5" fill={C.accent} />
      {/* X labels */}
      {data.filter((_, i) => i % 5 === 0).map((d, i) => {
        const idx = i * 5;
        if (idx >= data.length) return null;
        const x = pts[idx]?.x;
        if (!x) return null;
        return (
          <text key={i} x={x} y={height - 8} textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontFamily={FONT}>
            {d.time}
          </text>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   3. HORIZONTAL BAR — Protocol breakdown (SVG with gradients)
   ═══════════════════════════════════════════════════════════════════════════════════ */

function ProtocolChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const colors = [C.accent, C.purple, C.amber, C.teal, C.green, C.orange];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const color = colors[i % colors.length];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 11, color: C.textSec, width: 48, flexShrink: 0,
              letterSpacing: '0.3px', fontFamily: SANS,
            }}>{d.name}</span>
            <svg width="100%" height="16" viewBox="0 0 400 16" preserveAspectRatio="none" style={{ flex:1, display:'block' }}>
              <defs>
                <linearGradient id={`prot-grad-${i}`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={color} stopOpacity="0.3" />
                </linearGradient>
                <filter id={`prot-glow-${i}`}>
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <rect x="0" y="3" width="400" height="10" rx="2" fill="var(--bg-elevated)" stroke="var(--border-muted)" strokeWidth="0.5" />
              <rect x="0" y="3" width={pct * 4} height="10" rx="2"
                fill={`url(#prot-grad-${i})`} opacity="0.5" filter={`url(#prot-glow-${i})`} />
              <rect x="0" y="3" width={pct * 4} height="10" rx="2"
                fill={`url(#prot-grad-${i})`} />
            </svg>
            <span style={{
              fontSize: 11, fontWeight: 600, color, width: 48, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums', fontFamily: FONT,
            }}>{fmt(d.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   4. TABLE — Top attacking IPs
   ═══════════════════════════════════════════════════════════════════════════════════ */

function TopIPsTable({ data }: { data: Array<{ ip: string; packets: number; attacks: number; severity: string }> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['RANK', 'SOURCE IP', 'PACKETS', 'ATTACKS', 'SEVERITY'].map(h => (
              <th key={h} style={{
                padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.8px', color: C.textSec, fontFamily: FONT, whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.ip} style={{ borderBottom: `1px solid ${C.border}25`, transition: `background 0.15s ${EASE}` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '10px 14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: 5, fontSize: 11, fontWeight: 600,
                  background: i < 3 ? `${C.red}12` : C.surfaceHi, color: i < 3 ? C.red : C.textSec,
                  fontFamily: FONT,
                }}>{i + 1}</span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, fontFamily: FONT }}>{row.ip}</span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 13, color: C.accent, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {fmt(row.packets)}
                </span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 13, color: C.text, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(row.attacks)}
                </span>
              </td>
              <td style={{ padding: '10px 14px' }}><SevBadge sev={row.severity} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   5. METRICS TABLE — Precision / Recall / F1 per category
   ═══════════════════════════════════════════════════════════════════════════════════ */

type MetricRow = {
  category: string;
  severity: string;
  precision: number;
  recall: number;
  f1: number;
  samples: number;
};

function MetricsTable({ data }: { data: MetricRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['CATEGORY', 'SEVERITY', 'PRECISION', 'RECALL', 'F1 SCORE', 'SAMPLES'].map(h => (
              <th key={h} style={{
                padding: '8px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.8px', color: C.textSec, fontFamily: FONT, whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.category} style={{ borderBottom: `1px solid ${C.border}20`, transition: `background 0.15s ${EASE}` }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {row.category}
                </span>
              </td>
              <td style={{ padding: '9px 12px' }}><SevBadge sev={row.severity} /></td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: FONT,
                  color: row.precision >= 0.9 ? C.green : row.precision >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.precision * 100).toFixed(1)}%</span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: FONT,
                  color: row.recall >= 0.9 ? C.green : row.recall >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.recall * 100).toFixed(1)}%</span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, fontFamily: FONT,
                  color: row.f1 >= 0.9 ? C.green : row.f1 >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.f1 * 100).toFixed(1)}%</span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 12, color: C.textSec, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(row.samples)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   Data generators
   ═══════════════════════════════════════════════════════════════════════════════════ */

const CATEGORIES = [
  { id: 'ddos',        name: 'DDoS',          severity: 'critical' as const },
  { id: 'port_scan',   name: 'Port Scan',     severity: 'high' as const },
  { id: 'exfiltration',name: 'Data Exfil',    severity: 'critical' as const },
  { id: 'dga',         name: 'DGA Domains',   severity: 'high' as const },
  { id: 'beaconing',   name: 'C2 Beaconing',  severity: 'high' as const },
  { id: 'brute_force', name: 'Brute Force',    severity: 'medium' as const },
];

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (s >>> 0) / 0xFFFFFFFF;
  };
}

function genSeverityDistribution(): Array<{ name: string; count: number; severity: string }> {
  const r = seededRand(Math.floor(Date.now() / 3000));
  const dist = [
    { name: 'Critical', severity: 'critical', base: 8 },
    { name: 'High',     severity: 'high',     base: 22 },
    { name: 'Medium',   severity: 'medium',   base: 35 },
    { name: 'Low',      severity: 'low',      base: 18 },
  ];
  return dist.map(d => ({
    name: d.name,
    severity: d.severity,
    count: Math.max(1, Math.round(d.base + r() * d.base * 1.8)),
  }));
}

function genAlertTimeSeries(): Array<{ time: string; alerts: number }> {
  const raw = generateHistoricalAlerts(30);
  return raw.map((d, i) => {
    const r = Math.sin(i * 0.7 + Date.now() / 3000) * 3;
    return { ...d, alerts: Math.max(0, d.alerts + Math.round(r)) };
  });
}

function genProtocolData(): Array<{ name: string; value: number }> {
  const raw = generateProtocolDistribution();
  return [
    { name: 'TCP',  value: raw.find(d => d.name === 'TCP')?.value || 0 },
    { name: 'UDP',  value: raw.find(d => d.name === 'UDP')?.value || 0 },
    { name: 'ICMP', value: raw.find(d => d.name === 'ICMP')?.value || 0 },
    { name: 'DNS',  value: raw.find(d => d.name === 'DNS')?.value || 0 },
    { name: 'TLS',  value: raw.find(d => d.name === 'HTTPS')?.value || 0 },
    { name: 'QUIC', value: Math.floor((raw.find(d => d.name === 'HTTPS')?.value || 0) * 0.15) },
  ];
}

function genTopIPs(): Array<{ ip: string; packets: number; attacks: number; severity: string }> {
  const raw = generateTopSourceIPs(8);
  const r = seededRand(Math.floor(Date.now() / 3000));
  const sevs: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];
  return raw.map((d, i) => ({
    ip: d.ip,
    packets: Math.round(d.attacks * (40 + r() * 120)),
    attacks: d.attacks,
    severity: sevs[Math.floor(r() * (i < 3 ? 2 : 4))],
  }));
}

function genMetrics(): MetricRow[] {
  const r = seededRand(Math.floor(Date.now() / 3000));
  return CATEGORIES.map(cat => {
    const pBase = cat.severity === 'critical' ? 0.88 : cat.severity === 'high' ? 0.85 : 0.82;
    const precision = clamp(pBase + (r() - 0.3) * 0.12, 0.7, 0.99);
    const recall = clamp(pBase + (r() - 0.4) * 0.15, 0.65, 0.98);
    const f1 = 2 * (precision * recall) / (precision + recall || 1);
    return {
      category: cat.name,
      severity: cat.severity,
      precision,
      recall,
      f1,
      samples: Math.round(200 + r() * 1800),
    };
  });
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   Main Analytics page
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Analytics: React.FC = () => {
  const [tick, setTick] = useState(0);
  const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));

  useEffect(() => {
    const t = setInterval(() => { setTick(t => t + 1); }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' }));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const severityData    = useMemo(() => genSeverityDistribution(), [tick]);
  const alertSeries     = useMemo(() => genAlertTimeSeries(),   [tick]);
  const protocolData    = useMemo(() => genProtocolData(),       [tick]);
  const topIPs          = useMemo(() => genTopIPs(),             [tick]);
  const metricsData     = useMemo(() => genMetrics(),            [tick]);

  const metrics = getDetectionMetrics();

  const kpiCards = [
    { label:'Avg Accuracy',  value:`${metrics.modelAccuracy.toFixed(1)}%`,  sub:'across all models', color: C.accent },
    { label:'False Positive', value:`${metrics.falsePositiveRate.toFixed(1)}%`, sub:'rate', color: C.amber },
    { label:'Avg Detection', value:`${(metrics.avgDetectionTime * 1000).toFixed(0)}ms`, sub:'p99 latency', color: C.green },
    { label:'Blocked Today', value: fmt(metrics.threatsBlockedToday), sub:'threats', color: C.red },
  ];

  return (
    <div style={{ minHeight: '100%', background: C.bg, color: C.text, fontFamily: SANS, fontSize: 13, lineHeight: 1.6 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        ::selection { background: var(--accent-cyan); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid var(--border-active); outline-offset: 2px; border-radius: 3px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        @media (max-width:1024px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
        @media (max-width:768px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
      `}</style>

      {/* ── STICKY HEADER ────────────────────────────────────────────── */}
      <header style={{
        position:'sticky', top: 0, zIndex: 40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth: 1400, margin: '0 auto', padding: '0 28px',
          display: 'flex', alignItems: 'center', height: 52, gap: 14,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:9, flexShrink:0 }}>
            <div style={{
              width:30,height:30,borderRadius:6,
              background:`${C.accent}10`,border:`1px solid ${C.accent}25`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <Activity size={15} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13, fontWeight:700, letterSpacing:'3px', color:C.text }}>EKADHARA</span>
          </div>
          <div style={{ width:1, height:16, background:C.border, flexShrink:0 }} />
          <span style={{ fontSize:10, color:C.textSec, letterSpacing:'0.8px', flexShrink:0 }}>PS-26145 · ANALYTICS</span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{ fontSize:10, fontWeight:600, color: C.green, display:'flex', alignItems:'center', gap:5, letterSpacing:'0.5px' }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background: C.green, animation:'wt-pulse 1.6s ease-in-out infinite', display:'inline-block' }} />
              Live
            </span>
            <span style={{ fontSize:11, color:C.textSec, fontVariantNumeric:'tabular-nums' }}>{clock}</span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 28px 64px' }}>

        {/* Header */}
        <section style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, marginBottom: 4,
          }}>Analytics</h1>
          <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6, margin: 0 }}>
            Detection accuracy, protocol distribution, and attack source intelligence &middot; Auto-refresh 3s
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 1 — KPI Stat Cards (4 across)
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {kpiCards.map((m, i) => (
            <Panel key={i} delay={0.05}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.textSec, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom: 8 }}>{m.label}</div>
              <div style={{
                fontSize: 28, fontWeight: 700, color: m.color,
                fontFamily: FONT, letterSpacing: '-0.5px', lineHeight: 1.1,
                fontVariantNumeric: 'tabular-nums',
              }}>{m.value}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 4 }}>{m.sub}</div>
            </Panel>
          ))}
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 2 — Donut + Sparkline
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Severity donut */}
          <Panel delay={0.1}>
            <SH label="Severity Distribution" right={
              <span style={{ fontSize: 11, color: C.textSec, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(severityData.reduce((s, d) => s + d.count, 0))} alerts
              </span>
            } />
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <DonutChart data={severityData} />
            </div>
          </Panel>

          {/* Alert sparkline */}
          <Panel delay={0.15}>
            <SH label="Alert Timeline" right={
              <span style={{ fontSize: 11, color: C.textSec }}>
                Last 30 min &middot; {fmt(alertSeries.reduce((s, d) => s + d.alerts, 0))} total
              </span>
            } />
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <AlertSparkline data={alertSeries} />
            </div>
          </Panel>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 3 — Protocol breakdown + Model performance
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Protocol breakdown */}
          <Panel delay={0.2}>
            <SH label="Protocol Distribution" right={
              <span style={{ fontSize: 11, color: C.textSec, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(protocolData.reduce((s, d) => s + d.value, 0))} packets
              </span>
            } />
            <ProtocolChart data={protocolData} />
          </Panel>

          {/* Model accuracy summary */}
          <Panel delay={0.25}>
            <SH label="Model Performance" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Accuracy',  value: `${metrics.modelAccuracy.toFixed(1)}%`,  color: C.green },
                { label: 'False Positive',   value: `${metrics.falsePositiveRate.toFixed(1)}%`, color: C.amber },
                { label: 'Avg Detection',  value: `${(metrics.avgDetectionTime * 1000).toFixed(0)}ms`, color: C.accent },
              ].map(m => (
                <div key={m.label} style={{
                  padding: '14px 16px', border: `1px solid ${C.border}`, borderRadius: 6,
                  textAlign: 'center', transition: `border-color 0.2s ${EASE}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${m.color}30`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{m.value}</div>
                  <div style={{ fontSize: 10, color: C.textSec, marginTop: 4, fontWeight: 500 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '12px 16px', border: `1px solid ${C.border}`, borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>Threats Blocked Today</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.red, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>{fmt(metrics.threatsBlockedToday)}</span>
            </div>
          </Panel>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 4 — Top IPs + Detection accuracy metrics
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Top attacking IPs */}
          <Panel delay={0.3}>
            <SH label="Top Attacking IPs" right={
              <span style={{ fontSize: 11, color: C.textSec }}>By packet volume</span>
            } />
            <TopIPsTable data={topIPs} />
          </Panel>

          {/* Detection accuracy per category */}
          <Panel delay={0.35}>
            <SH label="Detection Accuracy" right={
              <span style={{ fontSize: 11, color: C.textSec }}>Precision · Recall · F1</span>
            } />
            <MetricsTable data={metricsData} />
          </Panel>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer style={{
          padding:'16px 0', borderTop: `1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8,
        }}>
          <span style={{ fontSize:11,color:C.textDim }}>
            EKADHARA v3.2.1 &middot; EKADHARA &middot; NTRO SIH26
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent-green)', animation:'wt-pulse 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize:11,color:C.textSec }}>
              Simulation &middot; Auto-refresh 3s &middot; {clock}
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default Analytics;
