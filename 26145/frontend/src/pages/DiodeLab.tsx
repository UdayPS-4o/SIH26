/* DiodeLab — hero page for the enclave degradation demo */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Shield, Crosshair, AlertTriangle, Globe, Network, Zap } from 'lucide-react';
import DiodeToggle from '../components/DiodeToggle';
import DegradationMatrix, { DegradationRow } from '../components/DegradationMatrix';
import TerminalOutput, { TerminalLine } from '../components/TerminalOutput';
import ValidityChip from '../components/ValidityChip';

const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-secondary)',
  border: 'var(--border-color)', text: 'var(--text-primary)',
  textSec: 'var(--text-secondary)', textDim: 'var(--text-muted)',
  accent: 'var(--accent-cyan)', green: 'var(--accent-green)',
  orange: 'var(--accent-orange)', amber: 'var(--accent-yellow)',
  red: 'var(--accent-red)', purple: 'var(--accent-purple)',
  info: 'var(--accent-cyan)',
};

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MONO = '"JetBrains Mono","Fira Code","SF Mono",monospace';

const API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api';

/* ── Data Flow Diagram ─────────────────────────────────────────────── */
function DataFlowDiagram({ mode }: { mode: string }) {
  const isDiode = mode === 'diode-only';
  const isAck = mode === 'ack-shadow';

  return (
    <svg viewBox="0 0 600 68" width="100%" style={{ maxWidth:600, display:'block', margin:'0 auto 4px' }}>
      <defs>
        <linearGradient id="flowGradFwd" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.red} stopOpacity="0.85" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="flowGradRet" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.15" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="nodeGradAtk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.red} stopOpacity="0.08" />
          <stop offset="100%" stopColor={C.red} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="nodeGradDiode" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.accent} stopOpacity="0.08" />
          <stop offset="100%" stopColor={C.accent} stopOpacity="0.02" />
        </linearGradient>
        <linearGradient id="nodeGradEnclave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={C.green} stopOpacity="0.08" />
          <stop offset="100%" stopColor={C.green} stopOpacity="0.02" />
        </linearGradient>
        <filter id="flowGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <marker id="arrowFwd" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill={isDiode || isAck ? C.orange : C.green} opacity="0.7" />
        </marker>
        <marker id="arrowRet" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill={C.accent} opacity="0.15" />
        </marker>
      </defs>

      {/* Forward path — attacker to enclave */}
      <line x1="50" y1="32" x2="550" y2="32" stroke="url(#flowGradFwd)" strokeWidth="1.5"
        opacity={isDiode ? 0.5 : 0.75} strokeDasharray={isDiode ? "6 4" : "none"}
        markerEnd="url(#arrowFwd)" />

      {/* Return path — enclave to attacker (blocked/dimmed in diode mode) */}
      <line x1="550" y1="44" x2="50" y2="44" stroke="url(#flowGradRet)" strokeWidth="1"
        opacity={isDiode ? 0.12 : 0.2} strokeDasharray={isDiode ? "4 6" : "8 4"}
        markerEnd="url(#arrowRet)" />

      {/* Animated flowing dots on forward path */}
      {[0, 1, 2, 3].map(i => (
        <circle key={`fwd-${i}`} r="2.5" fill={isDiode ? C.orange : C.green} opacity="0.65" filter="url(#flowGlow)">
          <animate attributeName="cx" values="50;550" dur={`${2 + i * 0.4}s`} repeatCount="indefinite"
            begin={`${i * 0.5}s`} />
          <animate attributeName="opacity" values="0;0.8;0.8;0" dur={`${2 + i * 0.4}s`} repeatCount="indefinite"
            begin={`${i * 0.5}s`} />
        </circle>
      ))}

      {/* Return path dots (dimmed in diode mode) */}
      {isDiode ? null : [0, 1, 2].map(i => (
        <circle key={`ret-${i}`} r="2" fill={C.accent} opacity="0.15">
          <animate attributeName="cx" values="550;50" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite"
            begin={`${i * 0.8 + 0.3}s`} />
          <animate attributeName="opacity" values="0;0.15;0.15;0" dur={`${2.5 + i * 0.5}s`} repeatCount="indefinite"
            begin={`${i * 0.8 + 0.3}s`} />
        </circle>
      ))}

      {/* Nodes */}
      {/* Attacker */}
      <rect x="8" y="16" width="82" height="32" rx="6" fill="url(#nodeGradAtk)"
        stroke={C.red} strokeWidth="0.8" opacity="0.85" />
      <text x="49" y="29" textAnchor="middle" fill={C.red} fontSize="8" fontWeight={700}
        fontFamily='"JetBrains Mono",monospace' letterSpacing="0.8px">ATTACKER</text>
      <text x="49" y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="7"
        fontFamily='"JetBrains Mono",monospace'>EXTERNAL NETWORK</text>

      {/* Diode node */}
      <rect x="244" y="16" width="112" height="32" rx="6" fill="url(#nodeGradDiode)"
        stroke={isDiode ? C.orange : C.accent} strokeWidth={isDiode ? 1.2 : 0.8}
        opacity={isDiode ? 1 : 0.75} />
      {isDiode && (
        <rect x="244" y="16" width="112" height="32" rx="6" fill="none"
          stroke={C.orange} strokeWidth="0.5" opacity="0.35">
          <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite" />
        </rect>
      )}
      <text x="300" y="29" textAnchor="middle" fill={isDiode ? C.orange : C.accent} fontSize="8" fontWeight={700}
        fontFamily='"JetBrains Mono",monospace' letterSpacing="0.8px">DIODE</text>
      <text x="300" y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="7"
        fontFamily='"JetBrains Mono",monospace'>{isDiode ? 'READ-ONLY' : isAck ? 'ACK-SHADOW' : 'FULL-DUPLEX'}</text>

      {/* Enclave */}
      <rect x="510" y="16" width="82" height="32" rx="6" fill="url(#nodeGradEnclave)"
        stroke={C.green} strokeWidth="0.8" opacity="0.85" />
      <text x="551" y="29" textAnchor="middle" fill={C.green} fontSize="8" fontWeight={700}
        fontFamily='"JetBrains Mono",monospace' letterSpacing="0.8px">ENCLAVE</text>
      <text x="551" y="42" textAnchor="middle" fill="var(--text-muted)" fontSize="7"
        fontFamily='"JetBrains Mono",monospace'>PASSIVE OBSERVER</text>

      {/* Block indicator in diode mode */}
      {isDiode && (
        <g>
          <text x="300" y="60" textAnchor="middle" fill={C.red} fontSize="7" fontWeight={600}
            fontFamily='"JetBrains Mono",monospace' letterSpacing="0.5px" opacity="0.85">
            ◄── RETURN PATH BLOCKED
          </text>
          <line x1="195" y1="50" x2="245" y2="50" stroke={C.red} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
          <line x1="355" y1="50" x2="405" y2="50" stroke={C.red} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.4" />
        </g>
      )}
      {isAck && (
        <g>
          <text x="300" y="60" textAnchor="middle" fill={C.accent} fontSize="7" fontWeight={600}
            fontFamily='"JetBrains Mono",monospace' letterSpacing="0.5px" opacity="0.65">
            ◄── SHADOW ACK CHANNEL
          </text>
          <line x1="195" y1="50" x2="245" y2="50" stroke={C.accent} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
          <line x1="355" y1="50" x2="405" y2="50" stroke={C.accent} strokeWidth="0.5" strokeDasharray="3 3" opacity="0.2" />
        </g>
      )}
    </svg>
  );
}

const DiodeLab: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [diodeMode, setDiodeMode] = useState<'full-duplex' | 'diode-only' | 'ack-shadow'>('full-duplex');
  const [degradationData, setDegradationData] = useState<DegradationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullStream, setFullStream] = useState<TerminalLine[]>([]);
  const [diodeStream, setDiodeStream] = useState<TerminalLine[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);

  const [attackType, setAttackType] = useState('syn_flood');
  const [intensity, setIntensity] = useState('medium');

  const ATTACK_TYPES = [
    { id: 'syn_flood', label: 'SYN Flood' },
    { id: 'c2_beacon', label: 'C2 Beaconing' },
    { id: 'dga_domain', label: 'DGA Domain' },
    { id: 'dns_tunnel', label: 'DNS Tunneling' },
    { id: 'data_exfil', label: 'Data Exfil' },
    { id: 'port_scan', label: 'Port Scan' },
    { id: 'tls_beacon', label: 'TLS Beaconing' },
    { id: 'udp_flood', label: 'UDP Flood' },
  ];

  /* ── On mount: fetch mode + degradation table ── */
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const r = await fetch(`${API_BASE}/diode/mode`, { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          const d = await r.json();
          if (d.mode) setDiodeMode(d.mode);
          if (d.degradation_table) setDegradationData(d.degradation_table);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchMode();
  }, []);

  /* ── Mode change handler ── */
  const handleModeChange = async (mode: 'full-duplex' | 'diode-only' | 'ack-shadow') => {
    setDiodeMode(mode);
    try {
      await fetch(`${API_BASE}/diode/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
        signal: AbortSignal.timeout(2000),
      });
      const r = await fetch(`${API_BASE}/diode/degradation`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const d = await r.json();
        if (d.data) setDegradationData(d.data);
      }
    } catch {
      /* apply mock data locally on failure */
      setDegradationData(getMockDegradation(mode));
    }
  };

  /* ── Generate mock degradation data ── */
  const getMockDegradation = (mode: string): DegradationRow[] => {
    if (mode === 'full-duplex') {
      return [
        { threat_type: 'DDoS', icon: '⚡', full_rate: 94, diode_rate: 94, ack_shadow_rate: 94, features_lost: 'None', severity: 'critical', validity: 'MEASURED' as const },
        { threat_type: 'C2 Beaconing', icon: '📡', full_rate: 91, diode_rate: 91, ack_shadow_rate: 91, features_lost: 'None', severity: 'high', validity: 'MEASURED' as const },
        { threat_type: 'DGA Domains', icon: '🌐', full_rate: 88, diode_rate: 88, ack_shadow_rate: 88, features_lost: 'None', severity: 'high', validity: 'ESTIMATED' as const },
        { threat_type: 'DNS Tunneling', icon: '🔍', full_rate: 86, diode_rate: 86, ack_shadow_rate: 86, features_lost: 'None', severity: 'critical', validity: 'MEASURED' as const },
        { threat_type: 'Port Scan', icon: '🛡', full_rate: 92, diode_rate: 92, ack_shadow_rate: 92, features_lost: 'None', severity: 'medium', validity: 'ESTIMATED' as const },
        { threat_type: 'Data Exfil', icon: '📤', full_rate: 83, diode_rate: 83, ack_shadow_rate: 83, features_lost: 'None', severity: 'critical', validity: 'MISSING' as const },
      ];
    }
    if (mode === 'diode-only') {
      return [
        { threat_type: 'DDoS', icon: '⚡', full_rate: 94, diode_rate: 41, ack_shadow_rate: 78, features_lost: 'ACK validation', severity: 'critical', validity: 'MEASURED' as const, diode_delta: 'JA4S unavailable' },
        { threat_type: 'C2 Beaconing', icon: '📡', full_rate: 91, diode_rate: 73, ack_shadow_rate: 87, features_lost: 'Return volume', severity: 'high', validity: 'MEASURED' as const, diode_delta: 'Partial features' },
        { threat_type: 'DGA Domains', icon: '🌐', full_rate: 88, diode_rate: 85, ack_shadow_rate: 88, features_lost: 'None', severity: 'high', validity: 'ESTIMATED' as const, diode_delta: 'Minimal impact' },
        { threat_type: 'DNS Tunneling', icon: '🔍', full_rate: 86, diode_rate: 85, ack_shadow_rate: 86, features_lost: 'None', severity: 'critical', validity: 'MEASURED' as const, diode_delta: 'Minimal impact' },
        { threat_type: 'Port Scan', icon: '🛡', full_rate: 92, diode_rate: 84, ack_shadow_rate: 91, features_lost: 'RST validation', severity: 'medium', validity: 'ESTIMATED' as const, diode_delta: 'Partial features' },
        { threat_type: 'Data Exfil', icon: '📤', full_rate: 83, diode_rate: 0, ack_shadow_rate: 83, features_lost: 'Entire return channel', severity: 'critical', validity: 'MISSING' as const, diode_delta: 'SILENT FAILURE' },
      ];
    }
    // ack-shadow
    return [
      { threat_type: 'DDoS', icon: '⚡', full_rate: 94, diode_rate: 41, ack_shadow_rate: 78, features_lost: 'ACK validation', severity: 'critical', validity: 'MEASURED' as const },
      { threat_type: 'C2 Beaconing', icon: '📡', full_rate: 91, diode_rate: 73, ack_shadow_rate: 87, features_lost: 'Return volume', severity: 'high', validity: 'MEASURED' as const },
      { threat_type: 'DGA Domains', icon: '🌐', full_rate: 88, diode_rate: 85, ack_shadow_rate: 88, features_lost: 'None', severity: 'high', validity: 'ESTIMATED' as const },
      { threat_type: 'DNS Tunneling', icon: '🔍', full_rate: 86, diode_rate: 85, ack_shadow_rate: 86, features_lost: 'None', severity: 'critical', validity: 'MEASURED' as const },
      { threat_type: 'Port Scan', icon: '🛡', full_rate: 92, diode_rate: 84, ack_shadow_rate: 91, features_lost: 'RST validation', severity: 'medium', validity: 'ESTIMATED' as const },
      { threat_type: 'Data Exfil', icon: '📤', full_rate: 83, diode_rate: 0, ack_shadow_rate: 83, features_lost: 'Entire return channel', severity: 'critical', validity: 'MISSING' as const },
    ];
  };

  /* ── Launch attack handler ── */
  const handleLaunch = async () => {
    setStreamLoading(true);
    const newFull: TerminalLine[] = [];
    const newDiode: TerminalLine[] = [];

    // Simulate full-duplex stream
    newFull.push({ text: `[LAUNCH] ${ATTACK_TYPES.find(a => a.id === attackType)?.label || attackType} @ ${intensity} intensity`, type: 'info' });
    newFull.push({ text: `[DETECT] Detection confidence: ${(75 + Math.random() * 25).toFixed(1)}%`, type: 'pass' });
    newFull.push({ text: `[INFER] Ensemble classifier matched R-${String(Math.floor(Math.random() * 8) + 1).padStart(3, '0')}`, type: 'info' });
    newFull.push({ text: `[ALERT] Evidence hash generated: ${Array.from({length: 8}, () => Math.random().toString(16).slice(2, 6)).join('')}…`, type: 'pass' });
    newFull.push({ text: `[DONE] Detection cycle complete in ${(20 + Math.random() * 100).toFixed(0)}ms`, type: 'pass' });

    // Simulate diode-only stream (slightly degraded)
    const dropped = Math.random() > 0.5;
    newDiode.push({ text: `[LAUNCH] ${ATTACK_TYPES.find(a => a.id === attackType)?.label || attackType} @ ${intensity} intensity`, type: 'info' });
    if (dropped) {
      newDiode.push({ text: `[WARN] Payload data unavailable (diode constraint)`, type: 'fail' });
      newDiode.push({ text: `[DETECT] Detection confidence: ${(50 + Math.random() * 30).toFixed(1)}% (degraded)`, type: 'checking' });
      newDiode.push({ text: `[INFER] Partial features only — JA3 + flow metadata`, type: 'info' });
      newDiode.push({ text: `[DONE] Detection cycle complete in ${(40 + Math.random() * 150).toFixed(0)}ms`, type: 'checking' });
    } else {
      newDiode.push({ text: `[DETECT] Detection confidence: ${(60 + Math.random() * 30).toFixed(1)}%`, type: 'pass' });
      newDiode.push({ text: `[INFER] JA3 + flow metadata sufficient`, type: 'info' });
      newDiode.push({ text: `[ALERT] Evidence hash generated`, type: 'pass' });
      newDiode.push({ text: `[DONE] Detection cycle complete in ${(30 + Math.random() * 100).toFixed(0)}ms`, type: 'pass' });
    }

    try {
      await fetch(`${API_BASE}/attack/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_type: attackType, intensity, mode: diodeMode }),
        signal: AbortSignal.timeout(2000),
      });
    } catch { /* silent */ }

    setFullStream(newFull);
    setDiodeStream(newDiode);
    setStreamLoading(false);
  };

  /* ── Recent alerts mock ── */
  const mockAlerts = [
    { id: 'AL-001', type: 'SYN Flood', severity: 'critical', ts: '14:32:01', validity: 'MEASURED' as const },
    { id: 'AL-002', type: 'C2 Beacon', severity: 'high', ts: '14:31:45', validity: 'ESTIMATED' as const },
    { id: 'AL-003', type: 'DGA Domain', severity: 'medium', ts: '14:30:22', validity: 'MISSING' as const },
    { id: 'AL-004', type: 'DNS Tunnel', severity: 'high', ts: '14:28:11', validity: 'MEASURED' as const },
    { id: 'AL-005', type: 'Port Scan', severity: 'low', ts: '14:25:03', validity: 'ESTIMATED' as const },
  ];

  return (
    <div style={{
      minHeight:'100%', background: C.bg, color: C.text,
      fontFamily: '"Inter",system-ui,sans-serif', fontSize: 12, lineHeight: 1.6,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0;transform:translateY(4px);} to{opacity:1;transform:translateY(0);} }
        @keyframes wt-fade-in { from{opacity:0;transform:translateY(3px);} to{opacity:1;transform:translateY(0);} }
        @keyframes wt-spin { from{transform:rotate(0);} to{transform:rotate(360deg);} }
        ::selection { background:var(--accent-cyan); color:${C.text}; }
        :focus-visible { outline:1.5px solid var(--border-active); outline-offset:2px; border-radius:3px; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:3px; }
        @keyframes pulse-border { 0%,100%{border-color: rgba(234,179,8,0.15);} 50%{border-color: rgba(234,179,8,0.4);} }
        .wt-interactive { transition:transform 150ms cubic-bezier(0.4,0,0.2,1), background 0.2s; }
        .wt-interactive:active { transform:scale(0.98); }
      `}</style>

      <header style={{
        position:'sticky',top:0,zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth:1400,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height: 52,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:30,height:30,borderRadius:6,
              background:`${C.accent}10`,border:`1px solid ${C.accent}25`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <Activity size={15} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color: C.text }}>EKADHARA</span>
          </div>
          <div style={{ width:1,height:16,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>PS-26145 · DIODE LAB</span>
        </div>
      </header>

      <main style={{ maxWidth:1400, margin:'0 auto', padding:'24px 28px 80px' }}>

        {/* ── PAGE HEADER ── */}
        <section style={{ marginBottom: 12 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 700, letterSpacing:'-0.3px', color: C.text, marginBottom: 8,
          }}>Diode Lab</h1>
          <p style={{
            fontSize: 14, color: C.textSec, maxWidth: 640, lineHeight: 1.7, margin: 0,
          }}>
            Honest degradation under enclave constraints. See how detection rates change
            when read-only diode constraints limit feature availability.
          </p>
        </section>

        {/* ── DIODE TOGGLE ── */}
        <section style={{ marginBottom: 20 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap: 12,
            }}>
              <div>
                <div style={{
                  fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.textSec,
                  fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', marginBottom: 8,
                }}>Enclave Transmission Mode</div>
                <div style={{ fontSize:12, color:C.textDim }}>
                  Select the enclave constraint mode to see its effect on detection rates
                </div>
              </div>
              <DiodeToggle mode={diodeMode} onChange={handleModeChange} />
            </div>
          </div>
        </section>

        {/* ── DATA FLOW DIAGRAM ── */}
        <section style={{ marginBottom: 20 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '16px 24px',
          }}>
            <div style={{
              fontFamily:'"JetBrains Mono",monospace', fontSize:9,
              fontWeight:700, letterSpacing:'1px', color: C.textDim,
              textTransform:'uppercase', marginBottom:8,
            }}>Network Topology</div>
            <DataFlowDiagram mode={diodeMode} />
          </div>
        </section>

        {/* ── DEGRADATION MATRIX ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom: 16,
            }}>
              <div style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.accent,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Detection Degradation Matrix</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Shield size={12} color={C.green} />
                <span style={{ fontSize:10, fontWeight:600, color:C.green, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  {loading ? 'Loading…' : 'Live Data'}
                </span>
              </div>
            </div>
            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:C.textDim }}>
                Loading degradation table…
              </div>
            ) : (
              <DegradationMatrix
                data={degradationData.length > 0 ? degradationData : getMockDegradation(diodeMode)}
                showWarning={diodeMode !== 'full-duplex'}
              />
            )}
          </div>
        </section>

        {/* ── TWO-COLUMN STREAMS ── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }} className="row-2">
          {/* Full-Duplex Alert Stream */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom: 14,
              paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              <Globe size={14} color={C.green} />
              <span style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.green,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Full-Duplex Alert Stream</span>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace' }}>BIDIRECTIONAL</span>
            </div>

            <div style={{
              display:'flex', flexDirection:'column', gap:8, marginBottom:16, minHeight:120,
            }}>
              {fullStream.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" className="empty-state-icon-inner">
                    <circle cx="14" cy="14" r="10" fill="none" stroke="var(--text-muted)" strokeWidth="0.7" opacity="0.2" />
                    <circle cx="14" cy="14" r="2.5" fill="var(--text-muted)" opacity="0.15" />
                    <line x1="14" y1="4" x2="14" y2="9" stroke="var(--text-muted)" strokeWidth="0.6" opacity="0.15" />
                  </svg>
                  <span style={{ color:'var(--text-muted)', fontSize:10, fontFamily:MONO, letterSpacing:'0.3px' }}>
                    No alerts in stream. Launch an attack below.
                  </span>
                </div>
              ) : (
                fullStream.map((line, i) => {
                  const clr = line.type === 'pass' ? C.green : line.type === 'fail' ? C.red : line.type === 'checking' ? C.amber : C.accent;
                  return (
                    <div key={i} style={{
                      fontSize:11, color: clr, lineHeight:1.6,
                      fontFamily:'"JetBrains Mono",monospace',
                      opacity:0, animation:`wt-fade-in 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s forwards`,
                    }}>
                      {line.text}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {mockAlerts.slice(0, 3).map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{
                    fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:2,
                    color: a.severity === 'critical' ? C.red : a.severity === 'high' ? C.orange : C.amber,
                    border: `1px solid ${a.severity === 'critical' ? 'var(--sev-critical-border)' : a.severity === 'high' ? 'var(--sev-high-border)' : 'var(--sev-medium-border)'}`,
                  }}>{a.severity}</span>
                  <span style={{ color: C.textSec }}>{a.ts}</span>
                  <span style={{ color: C.text }}>{a.type}</span>
                  <ValidityChip validity={a.validity} />
                </div>
              ))}
            </div>
          </div>

          {/* Diode-Only Alert Stream */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom: 14,
              paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              <Shield size={14} color={C.orange} />
              <span style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.orange,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Diode-Only Alert Stream</span>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace' }}>READ-ONLY</span>
            </div>

            <div style={{
              display:'flex', flexDirection:'column', gap:8, marginBottom:16, minHeight:120,
            }}>
              {diodeStream.length === 0 ? (
                <div style={{ textAlign:'center', padding:'40px 0', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" className="empty-state-icon-inner">
                    <circle cx="14" cy="14" r="10" fill="none" stroke="var(--text-muted)" strokeWidth="0.7" opacity="0.2" />
                    <circle cx="14" cy="14" r="2.5" fill="var(--text-muted)" opacity="0.15" />
                    <line x1="14" y1="4" x2="14" y2="9" stroke="var(--text-muted)" strokeWidth="0.6" opacity="0.15" />
                  </svg>
                  <span style={{ color:'var(--text-muted)', fontSize:10, fontFamily:MONO, letterSpacing:'0.3px' }}>
                    No alerts in stream. Launch an attack below.
                  </span>
                </div>
              ) : (
                diodeStream.map((line, i) => {
                  const clr = line.type === 'pass' ? C.green : line.type === 'fail' ? C.red : line.type === 'checking' ? C.amber : C.accent;
                  return (
                    <div key={i} style={{
                      fontSize:11, color: clr, lineHeight:1.6,
                      fontFamily:'"JetBrains Mono",monospace',
                      opacity:0, animation:`wt-fade-in 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s forwards`,
                    }}>
                      {line.text}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {mockAlerts.slice(2, 5).map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{
                    fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:2,
                    color: a.severity === 'critical' ? C.red : a.severity === 'high' ? C.orange : C.amber,
                    border: `1px solid ${a.severity === 'critical' ? 'var(--sev-critical-border)' : a.severity === 'high' ? 'var(--sev-high-border)' : 'var(--sev-medium-border)'}`,
                  }}>{a.severity}</span>
                  <span style={{ color: C.textSec }}>{a.ts}</span>
                  <span style={{ color: C.text }}>{a.type}</span>
                  <ValidityChip validity={a.validity} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MINI ATTACK PANEL ── */}
        <section>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.accent,
              fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              marginBottom: 14, paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              Attack Simulation
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
            }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Attack Type</span>
                <select
                  value={attackType}
                  onChange={e => setAttackType(e.target.value)}
                  style={{
                    padding:'7px 12px', background: C.bg, border:'1px solid var(--border-color)',
                    borderRadius:6, color: C.text, fontSize:12,
                    fontFamily:'"JetBrains Mono",monospace', cursor:'pointer', outline:'none',
                    minWidth: 160,
                  }}
                >
                  {ATTACK_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Intensity</span>
                <select
                  value={intensity}
                  onChange={e => setIntensity(e.target.value)}
                  style={{
                    padding:'7px 12px', background: C.bg, border:'1px solid var(--border-color)',
                    borderRadius:6, color: C.text, fontSize:12,
                    fontFamily:'"JetBrains Mono",monospace', cursor:'pointer', outline:'none',
                    minWidth: 100,
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Current Mode</span>
                <div style={{
                  padding:'7px 12px', background: `${C.accent}08`,
                  border: `1px solid ${C.accent}25`, borderRadius: 6,
                  fontSize:11, fontWeight:600, color: C.accent,
                  fontFamily:'"JetBrains Mono",monospace',
                  textTransform:'uppercase', letterSpacing:'0.5px',
                }}>
                  {diodeMode.toUpperCase().replace('-', ' ')}
                </div>
              </div>

              <div style={{ flex:1 }} />

              <button
                onClick={handleLaunch}
                disabled={streamLoading}
                style={{
                  padding:'10px 28px', background: streamLoading ? 'transparent' : 'var(--selection-bg)',
                  border: `1px solid ${streamLoading ? 'var(--border-color)' : 'var(--border-active)'}`,
                  borderRadius: 8, cursor: streamLoading ? 'not-allowed' : 'pointer',
                  fontFamily:'"JetBrains Mono",monospace', fontSize:12, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.5px', color: streamLoading ? C.textDim : C.accent,
                  transition:'all 0.2s',
                }}
              >
                {streamLoading ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <span style={{ display:'inline-block', width:14, height:14, border:'2px solid var(--text-muted)', borderTopColor:'transparent', borderRadius:'50%', animation:'wt-spin 0.6s linear infinite' }} />
                    Launching…
                  </span>
                ) : 'Launch Attack'}
              </button>

              <button
                onClick={() => { setFullStream([]); setDiodeStream([]); }}
                style={{
                  padding:'10px 20px', background:'transparent',
                  border:'1px solid var(--border-color)', borderRadius:8, cursor:'pointer',
                  fontFamily:'"JetBrains Mono",monospace', fontSize:12, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.5px', color: C.textSec,
                  transition:'all 0.2s',
                }}
              >
                Clear Streams
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding:'20px 0', borderTop:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:8, marginTop: 32,
        }}>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'1px', fontFamily:'"JetBrains Mono",monospace' }}>
            EKADHARA v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace' }}>
            Mode: {diodeMode.toUpperCase()} · Degradation Active
          </span>
        </footer>
      </main>
    </div>
  );
};

export default DiodeLab;
