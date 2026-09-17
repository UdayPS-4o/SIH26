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

/* ================================================================== */
/*  Palette — exact match to Dashboard.tsx                            */
/* ================================================================== */

const C = {
  bg:        '#05080d',
  surface:   '#080d14',
  surfaceHi: '#0c1219',
  border:    '#111c2b',
  borderHi:  '#182a3d',
  text:      '#dce4ec',
  textSec:   '#556677',
  textDim:   '#2a3a4a',
  accent:    '#00d4ff',
  red:       '#ef4444',
  orange:    '#f97316',
  amber:     '#eab308',
  green:     '#22c55e',
  purple:    '#a855f7',
  pink:      '#ec4899',
  teal:      '#14b8a6',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

const FONT = '"JetBrains Mono","Fira Code",monospace';
const SANS = "'Inter',system-ui,sans-serif";

const SEV_META: Record<string, { c: string; bg: string }> = {
  critical: { c: C.red,    bg: 'rgba(239,68,68,0.10)' },
  high:     { c: C.orange, bg: 'rgba(249,115,22,0.10)' },
  medium:   { c: C.amber,  bg: 'rgba(234,179,8,0.10)' },
  low:      { c: '#06b6d4', bg: 'rgba(6,182,212,0.10)' },
};

const SEV_LABEL: Record<string, string> = {
  critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW',
};

/* ================================================================== */
/*  Utility helpers                                                    */
/* ================================================================== */

const fmt = (n: number) => n.toLocaleString('en-US');
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* ================================================================== */
/*  Atomic components — match Dashboard.tsx                            */
/* ================================================================== */

function Dot({ color = C.green, size = 6 }: { color?: string; size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: color,
      boxShadow: `0 0 ${size}px ${color}60`,
      animation: 'wt-pulse 1.6s ease-in-out infinite',
      display: 'inline-block', flexShrink: 0,
    }} />
  );
}

function SevBadge({ sev }: { sev: string }) {
  const m = SEV_META[sev] || SEV_META.low;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '2px 8px', borderRadius: 3, fontSize: 9, fontWeight: 700,
      letterSpacing: '1px', color: m.c, background: m.bg,
      border: `1px solid ${m.c}25`, fontFamily: FONT, textTransform: 'uppercase',
    }}>
      <span style={{ width: 4, height: 4, borderRadius: '50%', background: m.c }} />
      {sev}
    </span>
  );
}

/* ── Section header ── */
function SH({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      paddingBottom: 10, marginBottom: 14, borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{
        fontFamily: FONT, fontSize: 10, fontWeight: 700,
        letterSpacing: '2.5px', color: C.accent, textTransform: 'uppercase',
      }}>{label}</span>
      {right}
    </div>
  );
}

/* ── Panel (exact match to Dashboard.tsx) ── */
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
      position: 'relative', overflow: 'hidden',
      opacity: ready ? 1 : 0, transform: ready ? 'translateY(0)' : 'translateY(12px)',
      transition: `opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${C.accent}30, transparent)`,
      }} />
      <div style={{ padding: '20px 22px', position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

/* ── Progress bar ── */
function Progress({ value, max = 100, color = C.accent }: {
  value: number; max?: number; color?: string;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div style={{
      height: 4, background: '#0a1018', borderRadius: 2,
      border: `1px solid ${C.border}`, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color, opacity: 0.65,
        borderRadius: 1, transition: 'width 1s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  );
}

/* ================================================================== */
/*  1. DONUT CHART — Severity distribution                            */
/* ================================================================== */

function DonutChart({ data }: { data: Array<{ name: string; count: number; severity: string }> }) {
  const size = 220;
  const cx = size / 2, cy = size / 2;
  const outerR = 90, innerR = 56;
  const total = data.reduce((s, d) => s + d.count, 0) || 1;

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const frac = d.count / total;
    const sweep = frac * Math.PI * 2;
    const start = angle;
    const end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const mid = start + sweep / 2;

    const x1 = cx + outerR * Math.cos(start);
    const y1 = cy + outerR * Math.sin(start);
    const x2 = cx + outerR * Math.cos(end);
    const y2 = cy + outerR * Math.sin(end);
    const ix1 = cx + innerR * Math.cos(end);
    const iy1 = cy + innerR * Math.sin(end);
    const ix2 = cx + innerR * Math.cos(start);
    const iy2 = cy + innerR * Math.sin(start);

    const path = sweep >= 0.001
      ? `M${x1},${y1} A${outerR},${outerR} 0 ${large},1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${large},0 ${ix2},${iy2} Z`
      : '';

    // Label line endpoint
    const lx = cx + (outerR + 14) * Math.cos(mid);
    const ly = cy + (outerR + 14) * Math.sin(mid);

    angle = end;

    return { ...d, path, color: SEV_META[d.severity]?.c || C.accent, frac, lx, ly, mid };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <defs>
          <filter id="donutGlow">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color} opacity={0.85} filter="url(#donutGlow)" />
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill={C.text} fontSize={18} fontWeight={800} fontFamily={FONT}>
          {fmt(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={C.textSec} fontSize={8} fontFamily={FONT} letterSpacing="1.5px">
          TOTAL
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 8, height: 8, borderRadius: 2, background: SEV_META[d.severity]?.c,
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 10, color: C.textSec, fontFamily: FONT, letterSpacing: '0.3px', textTransform: 'uppercase', minWidth: 70 }}>
              {d.name}
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.text, fontFamily: FONT, fontVariantNumeric: 'tabular-nums', minWidth: 36, textAlign: 'right' }}>
              {fmt(d.count)}
            </span>
            <span style={{ fontSize: 9, color: C.textDim, fontFamily: FONT, minWidth: 36, textAlign: 'right' }}>
              {((d.count / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  2. SPARKLINE — Alerts per minute, last 30 min                     */
/* ================================================================== */

function AlertSparkline({ data }: { data: Array<{ time: string; alerts: number }> }) {
  const width = 800, height = 200;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
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
  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: height }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0" />
        </linearGradient>
        <filter id="sparkGlow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Grid */}
      {[0, 1, 2, 3, 4].map(i => {
        const y = pad.top + (ch / 4) * i;
        const v = Math.round(maxV - (maxV / 4) * i);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#0a1018" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill={C.textDim} fontSize="9" fontFamily={FONT}>{v}</text>
          </g>
        );
      })}
      {/* Vertical ticks */}
      {data.filter((_, i) => i % 5 === 0).map((d, i) => {
        const idx = i * 5;
        if (idx >= data.length) return null;
        const x = pts[idx]?.x;
        if (!x) return null;
        return <line key={i} x1={x} y1={pad.top} x2={x} y2={pad.top + ch} stroke="#0a1018" strokeWidth="1" />;
      })}
      <path d={area} fill="url(#sparkGrad)" />
      <path d={line} fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#sparkGlow)" />
      {pts.filter((_, i) => i % 5 === 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={C.bg} stroke={C.accent} strokeWidth="1.5" />
      ))}
      <circle cx={last.x} cy={last.y} r="4" fill={C.accent} opacity="0.2" />
      <circle cx={last.x} cy={last.y} r="2.5" fill={C.accent} />
      {/* X labels */}
      {data.filter((_, i) => i % 5 === 0).map((d, i) => {
        const idx = i * 5;
        if (idx >= data.length) return null;
        const x = pts[idx]?.x;
        if (!x) return null;
        return (
          <text key={i} x={x} y={height - 10} textAnchor="middle" fill={C.textSec} fontSize="9" fontFamily={FONT}>
            {d.time}
          </text>
        );
      })}
      {/* Last value annotation */}
      <text x={last.x - 4} y={last.y - 10} textAnchor="end" fill={C.accent} fontSize="10" fontWeight={700} fontFamily={FONT}>
        {data[data.length - 1]?.alerts}
      </text>
    </svg>
  );
}

/* ================================================================== */
/*  3. HORIZONTAL BAR — Protocol breakdown                            */
/* ================================================================== */

function ProtocolChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const palette = [C.accent, '#0891b2', '#06b6d4', '#0ea5e9', C.teal, C.green];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const c = palette[i % palette.length];
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontSize: 10, color: C.textSec, width: 56, flexShrink: 0,
              letterSpacing: '0.3px', textTransform: 'uppercase', fontFamily: FONT,
            }}>{d.name}</span>
            <div style={{
              flex: 1, height: 16, background: '#0a1018', borderRadius: 2,
              border: `1px solid ${C.border}`, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${Math.max(pct, 0.5)}%`,
                background: c, opacity: 0.75, borderRadius: 1,
                transition: 'width 1.2s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: c, width: 44, textAlign: 'right',
              fontVariantNumeric: 'tabular-nums', fontFamily: FONT,
            }}>{fmt(d.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================== */
/*  4. TABLE — Top attacking IPs with packet counts                   */
/* ================================================================== */

function TopIPsTable({ data }: { data: Array<{ ip: string; packets: number; attacks: number; severity: string }> }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${C.border}` }}>
            {['RANK', 'SOURCE IP', 'PACKETS', 'ATTACKS', 'SEVERITY'].map(h => (
              <th key={h} style={{
                padding: '8px 14px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                letterSpacing: '1.2px', color: C.textSec, fontFamily: FONT, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.ip} style={{
              borderBottom: `1px solid ${C.border}30`,
              transition: `background 0.15s ${EASE}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '10px 14px' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: 3, fontSize: 10, fontWeight: 700,
                  background: i < 3 ? `${C.red}15` : C.surfaceHi, color: i < 3 ? C.red : C.textSec,
                  fontFamily: FONT,
                }}>{i + 1}</span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: FONT }}>{row.ip}</span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 12, color: C.accent, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
                  {fmt(row.packets)}
                </span>
              </td>
              <td style={{ padding: '10px 14px' }}>
                <span style={{ fontSize: 12, color: C.text, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
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

/* ================================================================== */
/*  5. METRICS TABLE — Precision / Recall / F1 per category            */
/* ================================================================== */

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
                padding: '8px 12px', textAlign: 'left', fontSize: 9, fontWeight: 700,
                letterSpacing: '1.2px', color: C.textSec, fontFamily: FONT, whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.category} style={{
              borderBottom: `1px solid ${C.border}20`,
              transition: `background 0.15s ${EASE}`,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.text, fontFamily: FONT, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  {row.category}
                </span>
              </td>
              <td style={{ padding: '9px 12px' }}><SevBadge sev={row.severity} /></td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: FONT,
                  color: row.precision >= 0.9 ? C.green : row.precision >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.precision * 100).toFixed(1)}%</span>
                <Progress value={row.precision * 100} max={100} color={row.precision >= 0.9 ? C.green : row.precision >= 0.8 ? C.amber : C.red} />
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: FONT,
                  color: row.recall >= 0.9 ? C.green : row.recall >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.recall * 100).toFixed(1)}%</span>
                <Progress value={row.recall * 100} max={100} color={row.recall >= 0.9 ? C.green : row.recall >= 0.8 ? C.amber : C.red} />
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: FONT,
                  color: row.f1 >= 0.9 ? C.green : row.f1 >= 0.8 ? C.amber : C.red,
                  fontVariantNumeric: 'tabular-nums',
                }}>{(row.f1 * 100).toFixed(1)}%</span>
              </td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 10, color: C.textSec, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>
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

/* ================================================================== */
/*  Data generators (stable-seeded, refreshed every 3 s)               */
/* ================================================================== */

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

/* ================================================================== */
/*  Main Analytics page                                               */
/* ================================================================== */

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

  return (
    <div style={{ minHeight: '100%', background: C.bg, color: C.text, fontFamily: FONT, fontSize: 12, lineHeight: 1.5 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        ::selection { background: rgba(0,212,255,0.15); color: ${C.text}; }
        :focus-visible { outline: 1.5px solid rgba(0,212,255,0.5); outline-offset: 2px; border-radius: 2px; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.textDim}; }
      `}</style>

      {/* ── STICKY HUD BAR ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(5,8,13,0.94)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: 1480, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', height: 48, gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 5,
              background: `linear-gradient(135deg, ${C.accent}18, ${C.accent}06)`,
              border: `1px solid ${C.accent}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Activity size={14} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: '4px', color: C.text }}>WATCHTOWER</span>
          </div>
          <div style={{ width: 1, height: 18, background: C.border, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: C.textSec, letterSpacing: '0.8px', flexShrink: 0 }}>PS-26145 · NTRO · SIH26</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: C.green, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Dot color={C.green} size={5} />
              ANALYTICS
            </span>
            <span style={{ fontSize: 11, color: C.textSec, letterSpacing: '0.8px', fontVariantNumeric: 'tabular-nums' }}>
              {clock}
            </span>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
      <main style={{ maxWidth: 1480, margin: '0 auto', padding: '28px 28px 80px' }}>

        {/* Header */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Dot color="#00ff41" size={6} />
            <span style={{ fontSize: 9, fontWeight: 700, color: '#00ff41', fontFamily: FONT, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              Live Monitoring Active
            </span>
          </div>
          <h1 style={{
            fontSize: 16, fontWeight: 800, letterSpacing: '3px', color: C.accent, fontFamily: FONT, marginBottom: 4,
          }}>ANALYTICS</h1>
          <p style={{ fontSize: 11, color: C.textSec, fontFamily: FONT }}>
            Detection accuracy, protocol distribution, and attack source intelligence · Auto-refresh 3s
          </p>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 1 — Donut + Sparkline
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Severity donut */}
          <Panel delay={0.05}>
            <SH label="Severity Distribution" right={
              <span style={{ fontSize: 9, color: C.textSec, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(severityData.reduce((s, d) => s + d.count, 0))} ALERTS
              </span>
            } />
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
              <DonutChart data={severityData} />
            </div>
          </Panel>

          {/* Alert sparkline */}
          <Panel delay={0.1}>
            <SH label="Alert Timeline" right={
              <span style={{ fontSize: 9, color: C.textSec }}>
                LAST 30 MIN · {fmt(alertSeries.reduce((s, d) => s + d.alerts, 0))} TOTAL
              </span>
            } />
            <div style={{ width: '100%', overflow: 'hidden' }}>
              <AlertSparkline data={alertSeries} />
            </div>
          </Panel>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 2 — Protocol breakdown + Detection metrics
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Protocol breakdown */}
          <Panel delay={0.15}>
            <SH label="Protocol Distribution" right={
              <span style={{ fontSize: 9, color: C.textSec, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(protocolData.reduce((s, d) => s + d.value, 0))} PACKETS
              </span>
            } />
            <ProtocolChart data={protocolData} />
          </Panel>

          {/* Model accuracy summary */}
          <Panel delay={0.2}>
            <SH label="Model Performance" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { label: 'ACCURACY',  value: `${metrics.modelAccuracy.toFixed(1)}%`,  color: C.green },
                { label: 'FALSE +',   value: `${metrics.falsePositiveRate.toFixed(1)}%`, color: C.amber },
                { label: 'AVG DET.',  value: `${(metrics.avgDetectionTime * 1000).toFixed(0)}ms`, color: C.accent },
              ].map(m => (
                <div key={m.label} style={{
                  padding: '14px 12px', border: `1px solid ${C.border}`, borderRadius: 5,
                  textAlign: 'center', transition: `border-color 0.2s ${EASE}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${m.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: m.color, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>{m.value}</div>
                  <div style={{ fontSize: 8, color: C.textSec, letterSpacing: '1.2px', marginTop: 4 }}>{m.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 9, color: C.textSec, letterSpacing: '0.8px' }}>THREATS BLOCKED TODAY</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.red, fontFamily: FONT, fontVariantNumeric: 'tabular-nums' }}>{fmt(metrics.threatsBlockedToday)}</span>
            </div>
          </Panel>
        </section>

        {/* ════════════════════════════════════════════════════════════════
             ROW 3 — Top IPs + Detection accuracy metrics
             ════════════════════════════════════════════════════════════════ */}
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }} className="wt-grid-aside">

          {/* Top attacking IPs */}
          <Panel delay={0.25}>
            <SH label="Top Attacking IPs" right={
              <span style={{ fontSize: 9, color: C.textSec }}>BY PACKET VOLUME</span>
            } />
            <TopIPsTable data={topIPs} />
          </Panel>

          {/* Detection accuracy per category */}
          <Panel delay={0.3}>
            <SH label="Detection Accuracy" right={
              <span style={{ fontSize: 9, color: C.textSec }}>PRECISION · RECALL · F1</span>
            } />
            <MetricsTable data={metricsData} />
          </Panel>
        </section>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <footer style={{
          padding: '18px 0', borderTop: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: '1px' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff41', animation: 'wt-pulse 1.6s ease-in-out infinite' }} />
            <span style={{ fontSize: 9, color: C.textSec, letterSpacing: '0.5px' }}>
              SIMULATION · AUTO-REFRESH 3s · {clock}
            </span>
          </div>
        </footer>

      </main>
    </div>
  );
};

export default Analytics;
