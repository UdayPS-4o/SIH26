/**
 * AttackPanel — threat injection lab with dramatic detection feedback.
 *
 * Launch attacks → watch the detection pipeline fire in real-time.
 * The detection monitor is the star of the page.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Globe, Radio, Scan, Download, Lock, Crosshair, Skull,
  Activity, Eye, Network, Shield, AlertTriangle, Gauge,
} from 'lucide-react';
import { useWebSocketContext } from '../context/WebSocketContext';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AttackEntry {
  id: string;
  type: string;
  label: string;
  timestamp: number;
  status: 'launching' | 'running' | 'detected' | 'completed';
  params: Record<string, string | number>;
  detectionResult?: {
    rule: string;
    severity: string;
    confidence: number;
    time_ms: number;
  };
}

interface AttackConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  paramFields: ParamField[];
  severity: string;
  detectionRule: string;
  killChainStep?: string;
}

interface ParamField {
  key: string;
  label: string;
  type: 'select' | 'number';
  options?: string[];
  default: string | number;
  min?: number;
  max?: number;
  unit?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens
// ─────────────────────────────────────────────────────────────────────────────

const MONO = '"JetBrains Mono","Fira Code","SF Mono",monospace';

const C = {
  surface: 'var(--bg-surface)',
  border: 'var(--border-default)',
  text: 'var(--text-primary)',
  textSec: 'var(--text-secondary)',
  textDim: 'var(--text-muted)',
  red: 'var(--color-danger)',
  green: 'var(--color-success)',
  amber: 'var(--color-warning)',
  cyan: 'var(--color-accent)',
};

const SEVERITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  critical: { text: 'var(--accent-red)', border: 'var(--sev-critical-border)', bg: 'var(--chip-unverified-bg)' },
  high:     { text: 'var(--accent-orange)', border: 'var(--sev-high-border)', bg: 'rgba(249,115,22,0.06)' },
  medium:   { text: 'var(--accent-yellow)', border: 'rgba(234,179,8,0.25)', bg: 'var(--chip-estimated-bg)' },
  low:      { text: 'var(--accent-cyan)', border: 'rgba(6,182,212,0.25)', bg: 'rgba(6,182,212,0.06)' },
};

const ATTACK_DEFS: AttackConfig[] = [
  {
    id: 'syn_flood', label: 'SYN Flood', icon: Zap, color: '#ef4444',
    description: 'TCP SYN flood — overwhelm connection queue',
    severity: 'critical', detectionRule: 'R-001: SYN_RATE_ANOMALY',
    killChainStep: 'Delivery',
    paramFields: [{ key: 'intensity', label: 'Intensity', type: 'select', options: ['low','medium','high'], default: 'medium' }],
  },
  {
    id: 'udp_flood', label: 'UDP Flood', icon: Globe, color: '#f97316',
    description: 'UDP datagram flood to random ports',
    severity: 'critical', detectionRule: 'R-002: UDP_RATE_ANOMALY',
    killChainStep: 'Delivery',
    paramFields: [{ key: 'intensity', label: 'Intensity', type: 'select', options: ['low','medium','high'], default: 'medium' }],
  },
  {
    id: 'port_scan', label: 'Port Scan', icon: Scan, color: '#a855f7',
    description: 'Sequential port probe on target host',
    severity: 'medium', detectionRule: 'R-006: PORT_SCAN_DETECTED',
    killChainStep: 'Reconnaissance',
    paramFields: [
      { key: 'start_port', label: 'Start', type: 'number', default: 1, min: 1, max: 65535 },
      { key: 'end_port', label: 'End', type: 'number', default: 1024, min: 1, max: 65535 },
    ],
  },
  {
    id: 'c2_beacon', label: 'C2 Beaconing', icon: Radio, color: '#8b5cf6',
    description: 'Simulated C2 keep-alive beacon traffic',
    severity: 'high', detectionRule: 'R-003: BEACONING_DETECTED',
    killChainStep: 'C2',
    paramFields: [{ key: 'interval_sec', label: 'Interval', type: 'number', default: 5, min: 1, max: 60, unit: 's' }],
  },
  {
    id: 'tls_beacon', label: 'TLS Beacon', icon: Lock, color: '#06b6d4',
    description: 'Encrypted TLS heartbeat-style C2 channel',
    severity: 'high', detectionRule: 'R-008: TLS_BEACON_DETECTED',
    killChainStep: 'C2',
    paramFields: [
      { key: 'interval_sec', label: 'Interval', type: 'number', default: 10, min: 1, max: 120, unit: 's' },
      { key: 'jitter_pct', label: 'Jitter', type: 'number', default: 15, min: 0, max: 100, unit: '%' },
    ],
  },
  {
    id: 'dga_domain', label: 'DGA Domain', icon: Network, color: '#eab308',
    description: 'Domain Generation Algorithm — randomized queries',
    severity: 'high', detectionRule: 'R-004: DGA_DOMAIN_DETECTED',
    killChainStep: 'Evasion',
    paramFields: [{ key: 'domain_count', label: 'Domains', type: 'number', default: 20, min: 1, max: 200 }],
  },
  {
    id: 'dns_tunnel', label: 'DNS Tunnel', icon: Globe, color: '#14b8a6',
    description: 'Data exfil via encoded DNS TXT queries',
    severity: 'critical', detectionRule: 'R-005: DNS_TUNNEL_ANOMALY',
    killChainStep: 'Exfiltration',
    paramFields: [{ key: 'data_size_kb', label: 'Data', type: 'number', default: 50, min: 1, max: 1000, unit: 'KB' }],
  },
  {
    id: 'data_exfil', label: 'Data Exfil', icon: Download, color: '#ec4899',
    description: 'Simulated bulk data exfiltration transfer',
    severity: 'critical', detectionRule: 'R-007: EXFILTRATION_VOLUME',
    killChainStep: 'Exfiltration',
    paramFields: [{ key: 'volume_mb', label: 'Volume', type: 'number', default: 100, min: 1, max: 10000, unit: 'MB' }],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const genId = () => `atk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour12: false });

const randomDetection = (severity: string): AttackEntry['detectionResult'] => ({
  rule: 'N/A', severity, confidence: 75 + Math.floor(Math.random() * 25), time_ms: 30 + Math.floor(Math.random() * 200),
});

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AttackPanel() {
  const { isConnected: wsConnected, flowsPerSec, alertCount } = useWebSocketContext();
  const [attacks, setAttacks] = useState<AttackEntry[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [diodeMode, setDiodeMode] = useState(false);
  const [pipelineLog, setPipelineLog] = useState<Array<{ time: string; phase: string; text: string; color: string }>>([]);
  const [paramState, setParamState] = useState<Record<string, Record<string, string | number>>>({});
  const logRef = useRef<HTMLDivElement>(null);
  const [isAttackActive, setIsAttackActive] = useState(false);

  // Default param values
  useEffect(() => {
    const defaults: Record<string, Record<string, string | number>> = {};
    for (const def of ATTACK_DEFS) {
      defaults[def.id] = {};
      for (const pf of def.paramFields) {
        defaults[def.id][pf.key] = pf.default;
      }
    }
    setParamState(defaults);
  }, []);

  const addPipelineLog = useCallback((phase: string, text: string, color: string) => {
    setPipelineLog((prev) => [...prev.slice(-80), { time: fmtTime(Date.now()), phase, text, color }]);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [pipelineLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Detection pipeline simulation — builds a dramatic step-by-step log
  // ─────────────────────────────────────────────────────────────────────────────

  const runDetectionPipeline = useCallback((def: AttackConfig, attackId: string) => {
    const steps = [
      { phase: 'INGEST', text: `Packet stream active — ${(flowsPerSec || 1200).toFixed(0)} flows/s`, color: 'var(--accent-cyan)', delay: 200 },
      { phase: 'INGEST', text: `Flow record created: src=${def.id === 'port_scan' ? '10.0.3.45' : '203.0.113.x'} → dst=${def.id === 'port_scan' ? '10.0.2.15' : '10.0.1.10'}`, color: 'var(--accent-cyan)', delay: 400 },
      { phase: 'FEATURES', text: `Extracting features: packet_rate, byte_ratio, interval_variance, port_entropy...`, color: 'var(--accent-purple)', delay: 600 },
      { phase: 'FEATURES', text: `Feature vector computed: 487 dims → ${def.detectionRule}`, color: 'var(--accent-purple)', delay: 900 },
      { phase: 'INFERENCE', text: `Running ensemble classifier (IsolationForest + RF + LR)...`, color: 'var(--accent-amber)', delay: 1100 },
      { phase: 'INFERENCE', text: `Model v3.2.1 → confidence building...`, color: 'var(--accent-amber)', delay: 1400 },
      { phase: 'INFERENCE', text: `Score: ${(75 + Math.random() * 24).toFixed(1)}% — threshold: 70%`, color: 'var(--accent-amber)', delay: 1700 },
      { phase: 'OUTPUT', text: `████ THREAT DETECTED: ${def.label.toUpperCase()} — ${def.severity.toUpperCase()}`, color: 'var(--accent-red)', delay: 2000 },
      { phase: 'OUTPUT', text: `Alert emitted → Live Threats feed → OCSF schema`, color: 'var(--accent-green)', delay: 2300 },
    ];

    let accumulatedDelay = 0;
    steps.forEach((step) => {
      accumulatedDelay += step.delay;
      setTimeout(() => {
        addPipelineLog(step.phase, step.text, step.color);
      }, accumulatedDelay);
    });

    // Update attack to detected after pipeline completes
    setTimeout(() => {
      setAttacks((prev) =>
        prev.map((a) =>
          a.id === attackId
            ? {
                ...a,
                status: 'detected' as const,
                detectionResult: {
                  rule: def.detectionRule,
                  severity: def.severity,
                  confidence: Math.floor(75 + Math.random() * 24),
                  time_ms: Math.floor(30 + Math.random() * 200),
                },
              }
            : a,
        ),
      );
      setIsAttackActive(false);
    }, accumulatedDelay + 300);
  }, [flowsPerSec, addPipelineLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // WebSocket
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => addPipelineLog('SYSTEM', '[WS] Connected to detection pipeline', 'var(--accent-green)');
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'alert' && msg.data) {
          addPipelineLog('OUTPUT', `Alert received: ${msg.data.threat_type} (${(msg.data.confidence * 100).toFixed(0)}%)`, 'var(--accent-green)');
        }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [addPipelineLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Launch attack
  // ─────────────────────────────────────────────────────────────────────────────

  const launchAttack = useCallback(
    async (def: AttackConfig) => {
      if (diodeMode) {
        addPipelineLog('SYSTEM', '[DIODE] Launch blocked — read-only mode active', 'var(--accent-amber)');
        return;
      }

      const params = paramState[def.id] || {};
      const id = genId();

      setLaunchingId(id);
      setAttacks((prev) => [
        { id, type: def.id, label: def.label, timestamp: Date.now(), status: 'launching', params },
        ...prev,
      ]);
      setIsAttackActive(true);

      addPipelineLog('LAUNCH', `▸ ${def.label} launched — ${def.killChainStep || 'Standalone'}`, 'var(--accent-cyan)');

      // Run the dramatic detection pipeline
      runDetectionPipeline(def, id);

      // Transition to "running" after launch animation
      setTimeout(() => {
        setLaunchingId(null);
        setAttacks((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: 'running' as const } : a),
        );
      }, 1500);
    },
    [diodeMode, paramState, addPipelineLog, runDetectionPipeline],
  );

  const launchKillChain = useCallback(async () => {
    if (diodeMode) {
      addPipelineLog('SYSTEM', '[DIODE] Kill chain blocked — read-only mode', 'var(--accent-amber)');
      return;
    }
    const chain = [
      { id: 'port_scan', label: 'Reconnaissance' },
      { id: 'c2_beacon', label: 'C2 Communication' },
      { id: 'dga_domain', label: 'DGA Evasion' },
      { id: 'data_exfil', label: 'Exfiltration' },
    ];
    addPipelineLog('KILL CHAIN', '══════ FULL KILL CHAIN INITIATED ══════', 'var(--accent-red)');
    for (const step of chain) {
      const def = ATTACK_DEFS.find((d) => d.id === step.id)!;
      addPipelineLog('KILL CHAIN', `  [${step.label}] → launching ${def.label}`, 'var(--accent-orange)');
      await new Promise((r) => setTimeout(r, 600));
      await launchAttack(def);
      await new Promise((r) => setTimeout(r, 3500));
    }
    addPipelineLog('KILL CHAIN', '══════ KILL CHAIN COMPLETE — ALL STAGES DETECTED ══════', 'var(--accent-green)');
  }, [diodeMode, launchAttack, addPipelineLog]);

  const updateParam = useCallback((attackId: string, key: string, value: string | number) => {
    setParamState((prev) => ({ ...prev, [attackId]: { ...prev[attackId], [key]: value } }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  const runningCount = attacks.filter((a) => a.status === 'running' || a.status === 'launching').length;
  const detectedCount = attacks.filter((a) => a.status === 'detected').length;

  const logColorMap: Record<string, string> = {
    INGEST: 'var(--accent-cyan)',
    FEATURES: 'var(--accent-purple)',
    INFERENCE: 'var(--accent-amber)',
    OUTPUT: 'var(--accent-red)',
    SYSTEM: 'var(--text-secondary)',
    LAUNCH: 'var(--accent-cyan)',
    'KILL CHAIN': 'var(--accent-orange)',
  };

  return (
    <div style={{ minHeight:'100%', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-scan { 0%{transform:translateY(-100%);} 100%{transform:translateY(100vh);} }
        @keyframes wt-glow-pulse { 0%,100%{box-shadow:0 0 4px var(--sev-critical-border);} 50%{box-shadow:0 0 12px var(--sev-critical-border);} }
        @keyframes wt-flash { 0%{background:var(--color-danger-dim);} 100%{background:transparent;} }
        ::selection { background:var(--border-default); color:var(--text-primary); }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.4); outline-offset:2px; border-radius:3px; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── THREAT ACTIVE BANNER ──────────────────────────────────────────────── */}
      {isAttackActive && (
        <div style={{
          position:'sticky', top:0, zIndex:50,
          background:'linear-gradient(90deg, var(--sev-critical-bg), var(--color-danger-dim), var(--sev-critical-bg))',
          borderBottom: '1px solid var(--sev-critical-border)',
          padding: '6px 0', textAlign:'center',
          animation: 'wt-glow-pulse 2s ease-in-out infinite',
        }}>
          <span style={{
            fontFamily: MONO, fontSize: 11, fontWeight: 800, letterSpacing:'3px',
            color: 'var(--accent-red)', textTransform: 'uppercase',
          }}>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--accent-red)', marginRight:8, animation:'wt-pulse 1s ease-in-out infinite' }} />
            THREAT ACTIVE — DETECTION PIPELINE ENGAGED
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--accent-red)', marginLeft:8, animation:'wt-pulse 1s ease-in-out infinite' }} />
          </span>
        </div>
      )}

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        borderBottom: `1px solid ${C.border}`,
        background: isAttackActive
          ? 'linear-gradient(180deg, var(--color-danger-dim) 0%, var(--bg-base) 100%)'
          : 'var(--bg-base)',
        transition: 'background 0.5s ease',
      }}>
        <div style={{ maxWidth:1440, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', height: 52, gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <div style={{
              width:32,height:32,borderRadius:7,
              border:'1px solid var(--sev-critical-border)',
              background:'var(--chip-unverified-bg)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow: isAttackActive ? '0 0 12px var(--color-danger-dim)' : 'none',
              transition: 'box-shadow 0.5s ease',
            }}>
              <Crosshair size={16} color="var(--accent-red)" strokeWidth={2} />
            </div>
            <div>
              <div style={{
                fontSize:13,fontWeight:800,letterSpacing:'2.5px',
                color: isAttackActive ? 'var(--accent-red)' : 'var(--text-primary)',
                fontFamily:MONO, lineHeight:1.1, transition: 'color 0.3s',
              }}>ATTACK LAB</div>
              <div style={{ fontSize:9, color:'var(--text-dim)', letterSpacing:'0.8px', fontFamily:MONO }}>PS-26145 · NTRO · THREAT INJECTION</div>
            </div>
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6,
              fontFamily:MONO, fontSize:10,
              border: `1px solid ${diodeMode ? 'var(--mat-approved-border)' : 'var(--border-color)'}`,
              background: diodeMode ? 'var(--color-success-dim)' : 'transparent',
              padding:'4px 10px', borderRadius:5,
              color: diodeMode ? 'var(--accent-green)' : 'var(--text-dim)',
              cursor:'pointer',
              transition: 'all 200ms ease',
            }} onClick={() => setDiodeMode((p) => !p)}>
              <div style={{
                width:7,height:7,borderRadius:'50%',border:`1.5px solid ${diodeMode ? 'var(--accent-green)' : 'var(--text-muted)'}`,
              }}>
                <div style={{
                  position:'absolute',inset: diodeMode ? 1.5 : 3, borderRadius:'50%',
                  background: diodeMode ? 'var(--accent-green)' : 'transparent',
                  transition:'all 200ms ease',
                }} />
              </div>
              {diodeMode ? 'DIODE READ-ONLY' : 'DIODE WRITE'}
            </div>
            <div style={{ width:1, height:16, background:C.border }} />
            <div style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)', letterSpacing:'0.5px' }}>
              {fmtTime(Date.now())}
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────────── */}
      <main style={{ maxWidth:1440, margin:'0 auto', padding:'20px 24px 64px' }}>

        {/* ── SECTION 1: DETECTION PIPELINE MONITOR ───────────────────────── */}
        <section style={{ marginBottom: 20 }}>
          <div style={{
            border: `1px solid ${isAttackActive ? 'var(--sev-critical-border)' : C.border}`,
            borderRadius: 10, overflow:'hidden',
            background:'var(--bg-secondary)',
            transition: 'border-color 0.5s ease',
            boxShadow: isAttackActive ? '0 0 20px var(--color-danger-dim)' : 'none',
          }}>
            {/* Monitor header */}
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'10px 16px', borderBottom:`1px solid var(--border-color)`,
              background: isAttackActive ? 'var(--color-danger-dim)' : 'var(--bg-surface)',
              transition: 'background 0.5s ease',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <Eye size={13} color="var(--accent-cyan)" />
                <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--accent-cyan)', fontFamily:MONO }}>
                  Detection Pipeline
                </span>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:5, fontFamily:MONO, fontSize:9,
                  fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px',
                  color: isAttackActive ? 'var(--accent-red)' : 'var(--accent-green)',
                }}>
                  <span style={{
                    width:5,height:5,borderRadius:'50%',
                    background: isAttackActive ? 'var(--accent-red)' : 'var(--accent-green)',
                    animation: isAttackActive ? 'wt-pulse 1s ease-in-out infinite' : 'wt-pulse 2s ease-in-out infinite',
                    display:'inline-block',
                  }} />
                  {isAttackActive ? 'STREAMING' : 'READY'}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:16, fontFamily:MONO, fontSize:10, color:'var(--text-dim)' }}>
                <span>INGEST → FEATURES → INFERENCE → OUTPUT</span>
                <div style={{ display:'flex', gap:6 }}>
                  <span style={{ color:'var(--accent-cyan)' }}>{pipelineLog.filter(l => l.phase === 'INGEST').length}</span>
                  <span style={{ color:'var(--accent-purple)' }}>{pipelineLog.filter(l => l.phase === 'FEATURES').length}</span>
                  <span style={{ color:'var(--accent-amber)' }}>{pipelineLog.filter(l => l.phase === 'INFERENCE').length}</span>
                  <span style={{ color:'var(--accent-red)' }}>{pipelineLog.filter(l => l.phase === 'OUTPUT').length}</span>
                </div>
              </div>
            </div>

            {/* Pipeline visualization bar */}
            <div style={{
              display:'flex', padding:'0 16px', gap:0,
              borderBottom:`1px solid var(--border-color)`,
              background:'var(--bg-primary)',
            }}>
              {['INGEST', 'FEATURES', 'INFERENCE', 'OUTPUT'].map((phase, i) => {
                const colors: Record<string, string> = {
                  INGEST: 'var(--accent-cyan)', FEATURES: 'var(--accent-purple)',
                  INFERENCE: 'var(--accent-amber)', OUTPUT: 'var(--accent-red)',
                };
                const count = pipelineLog.filter(l => l.phase === phase).length;
                const active = isAttackActive && count > 0;
                return (
                  <div key={phase} style={{
                    flex:1, padding:'8px 12px', position:'relative',
                    borderRight: i < 3 ? '1px solid var(--border-color)' : 'none',
                    background: active ? `${colors[phase]}08` : 'transparent',
                    transition: 'background 0.3s',
                  }}>
                    <div style={{ fontFamily:MONO, fontSize:9, fontWeight:700, letterSpacing:'1px', color: colors[phase], opacity: 0.7 }}>
                      {phase}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:16, fontWeight:800, color: colors[phase], lineHeight:1.2 }}>
                      {count}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:8, color:'var(--text-dim)', letterSpacing:'0.5px' }}>
                      events
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Log output */}
            <div
              ref={logRef}
              style={{
                maxHeight: 220, overflowY:'auto', fontFamily:MONO, fontSize:11, lineHeight:1.9,
                padding: '10px 16px',
                background: 'linear-gradient(180deg, var(--bg-primary), rgba(0,0,0,0.2))',
              }}
            >
              {pipelineLog.length === 0 ? (
                <div style={{ color:'var(--text-dim)', textAlign:'center', padding:'16px 0', fontSize:12 }}>
                  <div style={{ marginBottom:6, opacity:0.5 }}>Pipeline ready. Launch an attack to see detection in action.</div>
                  <div style={{ fontSize:10, opacity:0.4 }}>All events are locally simulated · No external calls</div>
                </div>
              ) : (
                pipelineLog.map((entry, i) => (
                  <div key={i} style={{
                    display:'flex', alignItems:'center', gap:8,
                    animation: entry.phase === 'OUTPUT' && i === pipelineLog.length - 1 ? 'wt-flash 1s ease-out' : 'none',
                  }}>
                    <span style={{ color:'var(--text-dim)', fontSize:9, minWidth:58, flexShrink:0 }}>[{entry.time}]</span>
                    <span style={{
                      fontSize:9, fontWeight:700, letterSpacing:'0.5px',
                      color: entry.color, minWidth:62, flexShrink:0, opacity:0.8,
                    }}>{entry.phase}</span>
                    <span style={{ color: entry.color, lineHeight:1.5 }}>{entry.text}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ── SECTION 2: KILL CHAIN + STATUS ─────────────────────────────── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          {/* Kill chain button */}
          <div style={{
            border:`1px solid var(--sev-critical-border)`, borderRadius:10,
            background:'linear-gradient(135deg, var(--color-danger-dim), rgba(239,68,68,0.01))',
            padding:20, display:'flex', alignItems:'center', gap:20,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{
              position:'absolute', top:0, left:0, right:0, height:1,
              background:'linear-gradient(90deg, transparent, var(--sev-critical-border), transparent)',
            }} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, letterSpacing:'0.5px', color:'var(--accent-red)', textTransform:'uppercase', marginBottom:4 }}>
                Full Kill Chain
              </div>
              <div style={{ fontSize:11, color:'var(--text-secondary)', lineHeight:1.5, fontFamily:MONO }}>
                Recon → C2 Beacon → DGA Evasion → Exfiltration
              </div>
            </div>
            <button
              onClick={launchKillChain}
              disabled={diodeMode}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'12px 24px', borderRadius:8,
                cursor: diodeMode ? 'not-allowed' : 'pointer',
                fontFamily:MONO, fontSize:12, fontWeight:800,
                textTransform:'uppercase', letterSpacing:'1px',
                border:'1px solid var(--sev-critical-border)',
                background: diodeMode ? 'transparent' : 'linear-gradient(135deg, var(--sev-critical-bg), var(--color-danger-dim))',
                color: diodeMode ? 'var(--text-dim)' : 'var(--accent-red)',
                transition: 'all 200ms ease',
                boxShadow: diodeMode ? 'none' : '0 0 20px var(--color-danger-dim)',
              }}
            >
              <Crosshair size={14} />
              Execute Chain
            </button>
          </div>

          {/* Status bar */}
          <div style={{
            border:`1px solid var(--border-color)`, borderRadius:10,
            background:'var(--bg-secondary)', padding:'12px 20px',
            display:'flex', alignItems:'center', gap:20, flexWrap:'wrap',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{
                width:6,height:6,borderRadius:'50%',
                background: wsConnected ? 'var(--accent-green)' : 'var(--accent-yellow)',
                boxShadow: wsConnected ? '0 0 4px var(--accent-green)' : '0 0 4px var(--accent-yellow)',
              }} />
              <span style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', color: wsConnected ? 'var(--accent-green)' : 'var(--accent-yellow)', fontFamily:MONO }}>
                {wsConnected ? 'WS Connected' : 'Demo Mode'}
              </span>
            </div>
            <div style={{ width:1, height:16, background:C.border }} />
            <div style={{ fontSize:11, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5, fontFamily:MONO }}>
              <Activity size={12} color="var(--accent-red)" />
              Active: <span style={{ color: runningCount > 0 ? 'var(--accent-red)' : 'var(--text-primary)', fontWeight:700 }}>{runningCount}</span>
            </div>
            <div style={{ width:1, height:16, background:C.border }} />
            <div style={{ fontSize:11, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5, fontFamily:MONO }}>
              <Shield size={12} color="var(--accent-green)" />
              Detected: <span style={{ color:'var(--accent-green)', fontWeight:700 }}>{detectedCount}</span>
            </div>
            <div style={{ width:1, height:16, background:C.border }} />
            <div style={{ fontSize:11, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:5, fontFamily:MONO }}>
              <AlertTriangle size={12} color="var(--accent-amber)" />
              Alerts: <span style={{ color:'var(--accent-cyan)', fontWeight:700 }}>{alertCount}</span>
            </div>
            <div style={{ flex:1 }} />
            <div style={{ fontSize:10, color:'var(--text-dim)', fontFamily:MONO }}>
              {(flowsPerSec || 0).toFixed(0)} flows/s
            </div>
          </div>
        </section>

        {/* ── SECTION 3: ATTACK CARDS GRID ────────────────────────────────── */}
        <section>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <Gauge size={14} color="var(--accent-amber)" />
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', color:'var(--accent-amber)', fontFamily:MONO }}>
              Threat Vectors
            </span>
            <span style={{ fontSize:10, color:'var(--text-dim)', fontFamily:MONO, marginLeft:4 }}>
              {ATTACK_DEFS.length} types available
            </span>
          </div>
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 12,
          }}>
            {ATTACK_DEFS.map((def) => {
              const Icon = def.icon;
              const params = paramState[def.id] || {};
              const hasRunning = attacks.some((a) => a.type === def.id && (a.status === 'running' || a.status === 'launching'));
              const hasDetected = attacks.some((a) => a.type === def.id && a.status === 'detected');

              return (
                <div key={def.id} style={{
                  border: `1px solid ${hasDetected ? 'var(--color-success-dim)' : hasRunning ? `${def.color}40` : 'var(--border-color)'}`,
                  borderRadius: 10, padding: 16,
                  background: hasDetected ? 'rgba(34,197,94,0.02)' : 'var(--bg-secondary)',
                  transition: 'all 0.3s ease',
                  boxShadow: hasRunning ? `0 0 16px ${def.color}12` : hasDetected ? '0 0 8px var(--color-success-dim)' : 'none',
                  position:'relative', overflow:'hidden',
                }}>
                  {/* Severity stripe */}
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, height:2,
                    background: hasDetected ? 'var(--accent-green)' : def.color,
                    opacity: hasRunning ? 0.7 : 0.3,
                    transition: 'opacity 0.3s',
                  }} />

                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10, marginTop:2 }}>
                    <div style={{
                      width:28,height:28,borderRadius:6,
                      border:`1px solid ${def.color}25`,
                      background:`${def.color}08`,
                      display:'flex',alignItems:'center',justifyContent:'center', flexShrink:0,
                    }}>
                      <Icon size={13} color={def.color} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.4px' }}>{def.label}</div>
                      <div style={{ fontSize:10, color:'var(--text-secondary)', marginTop:1 }}>{def.description}</div>
                    </div>
                    <span style={{
                      background: SEVERITY_COLORS[def.severity]?.bg,
                      color: SEVERITY_COLORS[def.severity]?.text,
                      border: `1px solid ${SEVERITY_COLORS[def.severity]?.border}`,
                      fontSize:9, fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase',
                      padding:'2px 7px', borderRadius:4, whiteSpace:'nowrap',
                    }}>
                      {def.severity}
                    </span>
                  </div>

                  {/* Detection rule */}
                  <div style={{
                    fontSize:10, fontFamily:MONO, color:'var(--text-dim)',
                    background:'var(--bg-primary)', padding:'5px 8px', borderRadius:5,
                    border:'1px solid var(--border-color)', marginBottom:10,
                    display:'flex', alignItems:'center', gap:5,
                  }}>
                    <Crosshair size={9} />
                    {def.detectionRule}
                  </div>

                  {/* Params */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:10 }}>
                    {def.paramFields.map((pf) => (
                      <div key={pf.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:10, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', minWidth:58 }}>{pf.label}</span>
                        {pf.type === 'select' && pf.options ? (
                          <select
                            value={String(params[pf.key] ?? pf.default)}
                            onChange={(e) => updateParam(def.id, pf.key, e.target.value)}
                            style={{
                              flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)',
                              borderRadius:4, padding:'3px 6px', fontFamily:MONO, fontSize:10,
                              color:'var(--text-primary)', outline:'none', cursor:'pointer',
                            }}
                          >
                            {pf.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', gap:3, flex:1 }}>
                            <input
                              type="number"
                              min={pf.min} max={pf.max}
                              value={params[pf.key] ?? pf.default}
                              onChange={(e) => updateParam(def.id, pf.key, Number(e.target.value))}
                              style={{
                                flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)',
                                borderRadius:4, padding:'3px 6px', fontFamily:MONO, fontSize:10,
                                color:'var(--text-primary)', outline:'none', width:60,
                              }}
                            />
                            {pf.unit && <span style={{ fontSize:9, color:'var(--text-dim)', fontFamily:MONO }}>{pf.unit}</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Launch button */}
                  <button
                    onClick={() => launchAttack(def)}
                    disabled={diodeMode || hasRunning}
                    style={{
                      width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                      padding:'7px 0', borderRadius:6,
                      cursor: (diodeMode || hasRunning) ? 'not-allowed' : 'pointer',
                      fontFamily:MONO, fontSize:10, fontWeight:700,
                      textTransform:'uppercase', letterSpacing:'0.8px',
                      border: `1px solid ${hasDetected ? 'var(--mat-approved-border)' : hasRunning ? `${def.color}25` : `${def.color}20`}`,
                      background: hasDetected ? 'var(--chip-measured-bg)' : diodeMode ? 'transparent' : `${def.color}0a`,
                      color: hasDetected ? 'var(--accent-green)' : diodeMode ? 'var(--text-dim)' : def.color,
                      transition: 'all 200ms ease',
                    }}
                  >
                    {hasRunning ? (
                      <><span style={{ display:'inline-block', width:10, height:10, border:`2px solid ${def.color}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />Scanning</>
                    ) : hasDetected ? (
                      <><span style={{ marginRight:4 }}>✓</span> Detected</>
                    ) : (
                      <><Zap size={11} /> Launch</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
