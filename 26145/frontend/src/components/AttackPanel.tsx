/**
 * AttackPanel — military-grade attack simulation control panel.
 *
 * Sends attack launches to http://localhost:8000/api/attack (or simulates
 * locally when the backend is unavailable). Shows expected detection results,
 * real-time stats, attack history, and a DIODE MODE read-only toggle.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Shield, Globe, Network, Radio, Scan, Download, Lock,
  Server, Crosshair, Skull, Activity, Eye, Cpu, Gauge, AlertTriangle,
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
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const API_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/attack` : 'http://localhost:8000/api/attack';

const SEVERITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  critical: { text: 'var(--accent-red)', border: 'rgba(239,68,68,0.25)', bg: 'rgba(239,68,68,0.06)' },
  high:     { text: 'var(--accent-orange)', border: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.06)' },
  medium:   { text: 'var(--accent-yellow)', border: 'rgba(234,179,8,0.25)', bg: 'rgba(234,179,8,0.06)' },
  low:      { text: 'var(--accent-cyan)', border: 'rgba(6,182,212,0.25)', bg: 'rgba(6,182,212,0.06)' },
};

const ATTACK_DEFS: AttackConfig[] = [
  {
    id: 'syn_flood', label: 'SYN Flood', icon: Zap, color: 'var(--accent-red)',
    description: 'TCP SYN flood — overwhelm connection queue',
    severity: 'critical', detectionRule: 'R-001: SYN_RATE_ANOMALY',
    paramFields: [{ key: 'intensity', label: 'Intensity', type: 'select', options: ['low','medium','high'], default: 'medium' }],
  },
  {
    id: 'udp_flood', label: 'UDP Flood', icon: Globe, color: 'var(--accent-orange)',
    description: 'UDP datagram flood to random ports',
    severity: 'critical', detectionRule: 'R-002: UDP_RATE_ANOMALY',
    paramFields: [{ key: 'intensity', label: 'Intensity', type: 'select', options: ['low','medium','high'], default: 'medium' }],
  },
  {
    id: 'c2_beacon', label: 'C2 Beaconing', icon: Radio, color: 'var(--accent-purple)',
    description: 'Simulated C2 keep-alive beacon traffic',
    severity: 'high', detectionRule: 'R-003: BEACONING_DETECTED',
    paramFields: [{ key: 'interval_sec', label: 'Interval', type: 'number', default: 5, min: 1, max: 60, unit: 's' }],
  },
  {
    id: 'dga_domain', label: 'DGA Domain', icon: Network, color: 'var(--accent-yellow)',
    description: 'Domain Generation Algorithm — randomized queries',
    severity: 'high', detectionRule: 'R-004: DGA_DOMAIN_DETECTED',
    paramFields: [{ key: 'domain_count', label: 'Domains', type: 'number', default: 20, min: 1, max: 200 }],
  },
  {
    id: 'dns_tunnel', label: 'DNS Tunneling', icon: Globe, color: 'var(--accent-cyan)',
    description: 'Data exfil via encoded DNS TXT queries',
    severity: 'critical', detectionRule: 'R-005: DNS_TUNNEL_ANOMALY',
    paramFields: [{ key: 'data_size_kb', label: 'Data Size', type: 'number', default: 50, min: 1, max: 1000, unit: 'KB' }],
  },
  {
    id: 'port_scan', label: 'Port Scan', icon: Scan, color: 'var(--accent-amber)',
    description: 'Sequential port probe on target host',
    severity: 'medium', detectionRule: 'R-006: PORT_SCAN_DETECTED',
    paramFields: [
      { key: 'start_port', label: 'Start Port', type: 'number', default: 1, min: 1, max: 65535 },
      { key: 'end_port', label: 'End Port', type: 'number', default: 1024, min: 1, max: 65535 },
    ],
  },
  {
    id: 'data_exfil', label: 'Data Exfil', icon: Download, color: 'var(--accent-pink)',
    description: 'Simulated bulk data exfiltration transfer',
    severity: 'critical', detectionRule: 'R-007: EXFILTRATION_VOLUME',
    paramFields: [{ key: 'volume_mb', label: 'Volume', type: 'number', default: 100, min: 1, max: 10000, unit: 'MB' }],
  },
  {
    id: 'tls_beacon', label: 'TLS Beaconing', icon: Lock, color: 'var(--accent-cyan)',
    description: 'Encrypted TLS heartbeat-style C2 channel',
    severity: 'high', detectionRule: 'R-008: TLS_BEACON_DETECTED',
    paramFields: [
      { key: 'interval_sec', label: 'Interval', type: 'number', default: 10, min: 1, max: 120, unit: 's' },
      { key: 'jitter_pct', label: 'Jitter', type: 'number', default: 15, min: 0, max: 100, unit: '%' },
    ],
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
  const { isConnected: wsConnected, flowsPerSec, alertCount, stats } = useWebSocketContext();
  const [attacks, setAttacks] = useState<AttackEntry[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [diodeMode, setDiodeMode] = useState(false);
  const [log, setLog] = useState<Array<{ time: string; text: string; cls: string }>>([]);
  const [paramState, setParamState] = useState<Record<string, Record<string, string | number>>>({});
  const logRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

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

  const addLog = useCallback((text: string, cls = 'info') => {
    setLog((prev) => [...prev.slice(-200), { time: fmtTime(Date.now()), text, cls }]);
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  // ─────────────────────────────────────────────────────────────────────────────
  // WebSocket — subscribe to attack events from backend
  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${proto}//${window.location.hostname}:8000/ws`;

    const connect = () => {
      try {
        const ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          addLog('[WS] Connected to attack control channel', 'success');
          wsRef.current = ws;
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'alert' && msg.data) {
              const alert = msg.data;
              setAttacks((prev) =>
                prev.map((a) => {
                  if (a.status === 'launching' || a.status === 'running') {
                    addLog(`[DETECTED] ${a.label} → ${alert.threat_type} (${(alert.confidence * 100).toFixed(0)}%)`, 'detection');
                    return { ...a, status: 'detected', detectionResult: alert };
                  }
                  return a;
                }),
              );
            }
            if (msg.type === 'stats' && msg.data) {
              if (msg.data.threats_per_type) {
                setThreatCounts(msg.data.threats_per_type);
              }
            }
            if (msg.type === 'attack_update' && msg.attack_id) {
              setAttacks((prev) =>
                prev.map((a) =>
                  a.id === msg.attack_id
                    ? { ...a, status: 'detected', detectionResult: msg.detection || a.detectionResult }
                    : a,
                ),
              );
              if (msg.detection) {
                addLog(`[DETECTED] ${msg.attack_id.slice(-6)} → ${msg.detection.rule}`, 'detection');
              }
            }
          } catch { /* ignore non-JSON */ }
        };
        ws.onclose = () => {
          addLog('[WS] Attack channel closed, reconnecting...', 'warn');
          setTimeout(connect, 3000);
        };
        ws.onerror = () => ws.close();
      } catch {
        setTimeout(connect, 3000);
      }
    };

    connect();
    return () => wsRef.current?.close();
  }, [addLog]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Launch attack — POST to backend or simulate locally
  // ─────────────────────────────────────────────────────────────────────────────

  const sendToBackend = async (payload: Record<string, any>): Promise<boolean> => {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  };

  const launchAttack = useCallback(
    async (def: AttackConfig) => {
      if (diodeMode) {
        addLog('[DIODE] Launch blocked — read-only mode active', 'warn');
        return;
      }

      const params = paramState[def.id] || {};
      const id = genId();

      setLaunchingId(id);
      setAttacks((prev) => [
        { id, type: def.id, label: def.label, timestamp: Date.now(), status: 'launching', params },
        ...prev,
      ]);
      addLog(`[LAUNCH] ${def.label} → params: ${JSON.stringify(params)}`, 'launch');

      const payload = { attack_type: def.id, params, timestamp: Date.now(), detection_rule: def.detectionRule };
      const sent = await sendToBackend(payload);

      setTimeout(() => {
        setLaunchingId(null);
        setAttacks((prev) =>
          prev.map((a) => a.id === id ? { ...a, status: 'running', detectionResult: { rule: def.detectionRule, severity: def.severity, confidence: 0, time_ms: 0 } } : a),
        );
        addLog(`[RUNNING] ${def.label} active`, 'info');
      }, 1200);

      if (!sent) {
        addLog(`[SIM] Backend unavailable — simulating ${def.label}`, 'warn');
        setTimeout(() => {
          const det = randomDetection(def.severity)!;
          setAttacks((prev) => prev.map((a) => a.id === id ? { ...a, status: 'detected', detectionResult: det } : a));
          addLog(`[SIM DETECTED] ${def.label} → ${def.detectionRule} (${det.confidence}% conf, ${det.time_ms}ms)`, 'detection');
        }, 2000 + Math.random() * 3000);
      }
    },
    [diodeMode, paramState, addLog],
  );

  const launchKillChain = useCallback(async () => {
    if (diodeMode) {
      addLog('[DIODE] Kill chain blocked — read-only mode active', 'warn');
      return;
    }
    const chain = ['c2_beacon', 'data_exfil', 'dga_domain'];
    const labels = ['Reconnaissance', 'Exfiltration', 'DGA Evasion'];
    addLog('═══ FULL KILL CHAIN INITIATED ═══', 'critical');
    for (let i = 0; i < chain.length; i++) {
      const def = ATTACK_DEFS.find((d) => d.id === chain[i])!;
      addLog(`[CHAIN ${i + 1}/3] ${labels[i]} — launching ${def.label}`, 'launch');
      await new Promise((r) => setTimeout(r, 800));
      await launchAttack(def);
      await new Promise((r) => setTimeout(r, 2000));
    }
    addLog('═══ KILL CHAIN COMPLETE ═══', 'critical');
  }, [diodeMode, launchAttack, addLog]);

  const [threatCounts, setThreatCounts] = useState<Record<string, number>>({});

  const stopAttack = useCallback((id: string) => {
    setAttacks((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)));
    addLog(`[STOPPED] ${id.slice(-6)}`, 'info');
  }, [addLog]);

  const clearHistory = useCallback(() => {
    setAttacks([]);
    addLog('Attack history cleared', 'info');
  }, [addLog]);

  const updateParam = useCallback((attackId: string, key: string, value: string | number) => {
    setParamState((prev) => ({ ...prev, [attackId]: { ...prev[attackId], [key]: value } }));
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const logColor = (cls: string) => {
    switch (cls) {
      case 'launch': return 'var(--accent-cyan)';
      case 'detection': return 'var(--accent-amber)';
      case 'critical': return 'var(--accent-red)';
      case 'warn': return 'var(--accent-yellow)';
      case 'success': return 'var(--accent-green)';
      case 'error': return 'var(--accent-red)';
      default: return 'var(--text-secondary)';
    }
  };

  const runningCount = attacks.filter((a) => a.status === 'running' || a.status === 'launching').length;

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    launching: { bg: 'rgba(250,204,21,0.08)', text: 'var(--accent-yellow)', border: 'rgba(250,204,21,0.25)' },
    running:   { bg: 'rgba(0,212,255,0.08)',  text: 'var(--accent-cyan)',   border: 'rgba(6,182,212,0.25)' },
    detected:  { bg: 'rgba(34,197,94,0.08)',  text: 'var(--accent-green)',  border: 'rgba(34,197,94,0.25)' },
    completed: { bg: 'rgba(100,116,139,0.06)', text: 'var(--text-secondary)', border: 'rgba(100,116,139,0.2)' },
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight:'100%', background:'var(--bg-primary)', color:'var(--text-primary)', fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        ::selection { background:rgba(0,212,255,0.12); color:var(--text-primary); }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.4); outline-offset:2px; border-radius:3px; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:3px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(250,204,21,0.15); }
          50% { border-color: rgba(250,204,21,0.4); }
        }
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        position:'sticky',top:0,zIndex:40,
        background:'var(--bg-primary)', borderBottom: `1px solid var(--border-color)`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth:1400,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height: 52,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:30,height:30,borderRadius:6,
              background:'var(--accent-cyan)10',border:'1px solid var(--accent-cyan)25',
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <Skull size={15} color="var(--accent-cyan)" strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color:'var(--text-primary)' }}>WATCHTOWER</span>
          </div>
          <div style={{ width:1,height:16,background:'var(--border-color)',flexShrink:0 }} />
          <span style={{ fontSize:10,color:'var(--text-secondary)',letterSpacing:'0.8px',flexShrink:0 }}>
            PS-26145 · ATTACK SIMULATION
          </span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:11,color:'var(--text-secondary)',fontVariantNumeric:'tabular-nums' }}>{fmtTime(Date.now())}</span>
        </div>
      </header>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main style={{ maxWidth:1400,margin:'0 auto',padding:'24px 28px 64px' }}>

        {/* Page title */}
        <section style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)', marginBottom: 4 }}>
            Attack Simulation
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.6, margin: 0 }}>
            Launch controlled attacks and observe real-time detection in the WATCHTOWER pipeline
          </p>
        </section>

        {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
        <div style={{
          marginBottom: 20, display:'flex', alignItems:'center', gap: 20, flexWrap:'wrap',
          padding: '14px 20px', background:'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius:'50%', background: wsConnected ? 'var(--accent-green)' : 'var(--accent-yellow)', display:'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.5px', color: wsConnected ? 'var(--accent-green)' : 'var(--accent-yellow)' }}>
              {wsConnected ? 'WS Connected' : 'Demo Mode'}
            </span>
          </div>
          <div style={{ width:1, height:18, background:'var(--border-color)' }} />
          <div style={{ fontSize: 12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap: 6, fontFamily: MONO }}>
            <Activity size={13} />
            <span>Active:</span>
            <span style={{ color: runningCount > 0 ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: 600 }}>{runningCount}</span>
          </div>
          <div style={{ width:1, height:18, background:'var(--border-color)' }} />
          <div style={{ fontSize: 12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap: 6, fontFamily: MONO }}>
            <AlertTriangle size={13} />
            <span>Alerts:</span>
            <span style={{ color:'var(--accent-cyan)', fontWeight: 600 }}>{alertCount}</span>
          </div>
          <div style={{ width:1, height:18, background:'var(--border-color)' }} />
          <div style={{ fontSize: 12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap: 6, fontFamily: MONO }}>
            <Gauge size={13} />
            <span>Flows:</span>
            <span style={{ color:'var(--accent-cyan)', fontWeight: 600 }}>{(flowsPerSec ?? 0).toFixed(0)}/s</span>
          </div>
          <div style={{ width:1, height:18, background:'var(--border-color)' }} />
          <div style={{ fontSize: 12, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap: 6, fontFamily: MONO }}>
            <Cpu size={13} />
            <span>Uptime:</span>
            <span style={{ color:'var(--accent-cyan)', fontWeight: 600 }}>
              {stats?.uptime_sec ? `${Math.floor(stats.uptime_sec / 3600)}h ${Math.floor((stats.uptime_sec % 3600) / 60)}m` : '—'}
            </span>
          </div>
          <div style={{ flex:1 }} />

          {/* DIODE MODE toggle */}
          <button
            onClick={() => {
              setDiodeMode((prev) => {
                addLog(`[DIODE] Mode switched to ${!prev ? 'READ-ONLY' : 'WRITE'}`, !prev ? 'warn' : 'info');
                return !prev;
              });
            }}
            style={{
              display:'flex', alignItems:'center', gap: 8,
              padding: '6px 14px', borderRadius: 6, cursor:'pointer',
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              textTransform:'uppercase', letterSpacing:'0.5px',
              border: `1px solid ${diodeMode ? 'rgba(34,197,94,0.35)' : 'var(--border-color)'}`,
              background: diodeMode ? 'rgba(34,197,94,0.06)' : 'transparent',
              color: diodeMode ? 'var(--accent-green)' : 'var(--text-secondary)',
              transition: 'all 200ms ease',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius:'50%', border: `1.5px solid ${diodeMode ? 'var(--accent-green)' : 'var(--text-secondary)'}`, position:'relative' }}>
              <div style={{ position:'absolute', inset: diodeMode ? 1 : 2, borderRadius:'50%', background: diodeMode ? 'var(--accent-green)' : 'transparent', transition:'all 200ms ease' }} />
            </div>
            {diodeMode ? 'Diode Read-Only' : 'Diode Write'}
          </button>
        </div>

        {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, alignItems: 'start' }}>

          {/* LEFT: Attack controls */}
          <div>
            {/* Kill chain */}
            <div style={{ marginBottom: 20, padding: 16, background:'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <div style={{ border: `1px solid var(--accent-red)30`, borderRadius: 8, padding: 14, background: 'rgba(239,68,68,0.03)', display:'flex', alignItems:'center', gap: 16 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <Crosshair size={18} color="var(--accent-red)" />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--accent-red)' }}>Full Kill Chain</div>
                    <div style={{ fontSize: 11, color:'var(--text-secondary)', marginTop: 2 }}>Recon → C2 Beacon → DGA Evasion → Exfil</div>
                  </div>
                </div>
                <div style={{ flex:1 }} />
                <button
                  onClick={launchKillChain}
                  disabled={diodeMode}
                  style={{
                    display:'flex', alignItems:'center', gap: 8,
                    padding: '8px 18px', borderRadius: 6, cursor: diodeMode ? 'not-allowed' : 'pointer',
                    fontFamily: MONO, fontSize: 11, fontWeight: 700,
                    textTransform:'uppercase', letterSpacing:'0.5px',
                    border: '1px solid var(--accent-red)40',
                    background: diodeMode ? 'transparent' : 'rgba(239,68,68,0.08)',
                    color: diodeMode ? 'var(--text-dim)' : 'var(--accent-red)',
                    transition: 'all 200ms ease',
                  }}
                >
                  <Skull size={13} /> Execute Chain
                </button>
              </div>
            </div>

            {/* Attack grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {ATTACK_DEFS.map((def) => {
                const Icon = def.icon;
                const params = paramState[def.id] || {};
                const isThisLaunching = attacks.some((a) => a.id === launchingId && a.type === def.id);
                const hasRunning = attacks.some((a) => a.type === def.id && (a.status === 'running' || a.status === 'launching'));

                return (
                  <div key={def.id} style={{
                    background:'var(--bg-secondary)', border: `1px solid var(--border-color)`,
                    borderRadius: 8, padding: 16, position:'relative', overflow:'hidden',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: hasRunning ? `0 0 16px ${def.color}15` : 'none',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${def.color}40`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                  >
                    {/* Header row */}
                    <div style={{ display:'flex', alignItems:'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width:30,height:30,borderRadius:6,
                        border: `1px solid ${def.color}30`, background: `${def.color}08`,
                        display:'flex',alignItems:'center',justifyContent:'center', flexShrink: 0,
                      }}>
                        <Icon size={14} color={def.color} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{def.label}</div>
                        <div style={{ fontSize: 11, color:'var(--text-secondary)', marginTop: 2 }}>{def.description}</div>
                      </div>
                      <span style={{
                        background: SEVERITY_COLORS[def.severity]?.bg, color: SEVERITY_COLORS[def.severity]?.text,
                        border: `1px solid ${SEVERITY_COLORS[def.severity]?.border}`,
                        fontSize: 10, fontWeight: 600, letterSpacing:'0.5px', textTransform:'uppercase',
                        padding: '2px 8px', borderRadius: 4, whiteSpace:'nowrap',
                      }}>
                        {def.severity}
                      </span>
                    </div>

                    {/* Detection rule */}
                    <div style={{
                      fontSize: 11, fontFamily: MONO, color:'var(--text-dim)',
                      background:'var(--bg-primary)', padding: '6px 10px', borderRadius: 4,
                      border: `1px solid var(--border-color)`, marginBottom: 12,
                      display:'flex', alignItems:'center', gap: 6,
                    }}>
                      <Crosshair size={10} />
                      {def.detectionRule}
                    </div>

                    {/* Parameter fields */}
                    <div style={{ display:'flex', flexDirection:'column', gap: 6, marginBottom: 12 }}>
                      {def.paramFields.map((pf) => (
                        <div key={pf.key} style={{ display:'flex', alignItems:'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.5px', minWidth: 72 }}>{pf.label}</span>
                          {pf.type === 'select' && pf.options ? (
                            <select
                              value={String(params[pf.key] ?? pf.default)}
                              onChange={(e) => updateParam(def.id, pf.key, e.target.value)}
                              style={{
                                flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)',
                                borderRadius: 5, padding: '4px 8px', fontFamily: MONO, fontSize: 11,
                                color:'var(--text-primary)', outline:'none', cursor:'pointer',
                              }}
                            >
                              {pf.options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <div style={{ display:'flex', alignItems:'center', gap: 4, flex:1 }}>
                              <input
                                type="number"
                                min={pf.min} max={pf.max}
                                value={params[pf.key] ?? pf.default}
                                onChange={(e) => updateParam(def.id, pf.key, Number(e.target.value))}
                                style={{
                                  flex:1, background:'var(--bg-primary)', border:'1px solid var(--border-color)',
                                  borderRadius: 5, padding: '4px 8px', fontFamily: MONO, fontSize: 11,
                                  color:'var(--text-primary)', outline:'none',
                                }}
                              />
                              {pf.unit && <span style={{ fontSize: 10, color:'var(--text-secondary)', minWidth: 16, fontFamily: MONO }}>{pf.unit}</span>}
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
                        width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap: 8,
                        padding: '8px 0', borderRadius: 6,
                        cursor: (diodeMode || hasRunning) ? 'not-allowed' : 'pointer',
                        fontFamily: MONO, fontSize: 11, fontWeight: 700,
                        textTransform:'uppercase', letterSpacing:'0.5px',
                        border: `1px solid ${hasRunning ? 'var(--border-color)' : `${def.color}30`}`,
                        background: diodeMode ? 'transparent' : hasRunning ? `${def.color}08` : `${def.color}12`,
                        color: diodeMode ? 'var(--text-dim)' : hasRunning ? def.color : def.color,
                        transition: 'all 200ms ease',
                      }}
                    >
                      {isThisLaunching ? (
                        <>
                          <span style={{ display:'inline-block', width:12, height:12, border:`2px solid ${def.color}`, borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
                          Launching...
                        </>
                      ) : hasRunning ? (
                        <>
                          <Activity size={12} />
                          In Progress
                        </>
                      ) : (
                        <>
                          <Zap size={12} />
                          Launch
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Detection Monitor + Attack History */}
          <div style={{ display:'flex', flexDirection:'column', gap: 16 }}>
            {/* Detection monitor */}
            <div style={{ padding: 16, background:'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
              <div style={{ display:'flex', alignItems:'center', gap: 8, marginBottom: 14 }}>
                <Eye size={13} color="var(--accent-cyan)" />
                <span style={{ fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--accent-cyan)', fontFamily: MONO }}>Detection Monitor</span>
              </div>

              {attacks.filter((a) => a.status === 'detected').length === 0 ? (
                <div style={{ textAlign:'center', padding:'20px 0', color:'var(--text-dim)', fontSize: 12 }}>No detections yet. Launch an attack.</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                  {attacks.filter((a) => a.status === 'detected' || a.status === 'running').slice(0, 8).map((a) => {
                    const def = ATTACK_DEFS.find((d) => d.id === a.type);
                    const det = a.detectionResult;
                    const sc = statusColors[a.status];
                    return (
                      <div key={a.id} style={{ display:'flex', alignItems:'center', gap: 8, padding: '8px 10px', borderRadius: 6, border: `1px solid var(--border-color)`, background:'var(--bg-primary)' }}>
                        <div style={{
                          width:6,height:6,borderRadius:'50%',flexShrink:0,
                          background: a.status === 'detected' ? 'var(--accent-green)' : def?.color,
                        }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.3px' }}>{def?.label || a.type}</div>
                          {det && <div style={{ fontSize: 10, color:'var(--text-secondary)', marginTop: 2, fontFamily: MONO }}>{det.rule} · {det.confidence}% conf</div>}
                        </div>
                        {det && <span style={{
                          background:'rgba(34,197,94,0.06)', color:'var(--accent-green)',
                          border: '1px solid rgba(34,197,94,0.2)',
                          fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                          textTransform:'uppercase', letterSpacing:'0.3px', flexShrink: 0, fontFamily: MONO,
                        }}>{det.time_ms}ms</span>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Attack history */}
            <div style={{ padding: 16, background:'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8, flex: 1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
                <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                  <Shield size={13} color="var(--accent-cyan)" />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--accent-cyan)', fontFamily: MONO }}>Attack History</span>
                </div>
                {attacks.length > 0 && (
                  <button onClick={clearHistory} style={{
                    fontSize:10, color:'var(--text-secondary)', background:'none', border:'none', cursor:'pointer',
                    fontFamily: MONO, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight: 600,
                  }}>Clear</button>
                )}
              </div>

              {attacks.length === 0 ? (
                <div style={{
                  textAlign:'center', padding:'24px 0', color:'var(--text-dim)', fontSize: 12,
                  border: '1px dashed var(--border-color)', borderRadius: 6,
                }}>No attacks launched yet</div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap: 4, maxHeight: 300, overflowY:'auto', paddingRight: 4 }}>
                  {attacks.slice(0, 30).map((a) => {
                    const def = ATTACK_DEFS.find((d) => d.id === a.type);
                    const isLaunching = a.status === 'launching';
                    const sc = statusColors[a.status];
                    return (
                      <div key={a.id} style={{
                        display:'flex', alignItems:'center', gap: 8, padding: '7px 10px', borderRadius: 5,
                        border: `1px solid var(--border-color)`, background:'var(--bg-primary)',
                        animation: isLaunching ? 'pulse-border 0.8s ease-in-out infinite' : 'none',
                      }}>
                        <div style={{ width:5,height:5,borderRadius:'50%',background:sc?.text || 'var(--text-secondary)',flexShrink:0 }} />
                        <span style={{ fontSize:11,fontWeight:600,color:'var(--text-primary)',textTransform:'uppercase',letterSpacing:'0.3px',flex:1 }}>{def?.label || a.type}</span>
                        <span style={{ fontSize:10,color:'var(--text-dim)',fontFamily:MONO }}>{fmtTime(a.timestamp)}</span>
                        <span style={{
                          background: sc?.bg, color: sc?.text, border: `1px solid ${sc?.border}`,
                          fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius: 4,
                          textTransform:'uppercase', letterSpacing:'0.3px', flexShrink:0, fontFamily: MONO,
                        }}>
                          {a.status}
                        </span>
                        {a.status === 'running' && (
                          <button
                            onClick={() => stopAttack(a.id)}
                            style={{
                              background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)',
                              borderRadius: 4, color:'var(--accent-red)', fontSize: 9, fontFamily: MONO,
                              fontWeight: 600, textTransform:'uppercase', padding:'2px 6px', cursor:'pointer',
                              letterSpacing:'0.3px', flexShrink: 0,
                            }}
                          >
                            Stop
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SYSTEM CONSOLE ─────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 20, padding: 16, background:'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
              <Server size={13} color="var(--accent-cyan)" />
              <span style={{ fontSize: 11, fontWeight: 700, textTransform:'uppercase', letterSpacing:'1px', color:'var(--accent-cyan)', fontFamily: MONO }}>System Console</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap: 5, fontFamily: MONO, fontSize: 10, fontWeight: 600, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--accent-green)' }}>
                <span style={{ width:5,height:5,borderRadius:'50%',background:'var(--accent-green)',animation:'wt-pulse 1.5s ease-in-out infinite',display:'inline-block' }} />
                Live
              </span>
            </div>
            <span style={{ fontSize: 10, color:'var(--text-dim)', fontFamily: MONO }}>{log.length} entries</span>
          </div>
          <div
            ref={logRef}
            style={{
              maxHeight: 180, overflowY:'auto', fontFamily: MONO, fontSize: 11, lineHeight: 1.8,
              background:'var(--bg-primary)', borderRadius: 6, border: '1px solid var(--border-color)',
              padding: '10px 14px',
            }}
          >
            {log.length === 0 ? (
              <div style={{ color:'var(--text-dim)', textAlign:'center' }}>System ready. Awaiting commands...</div>
            ) : (
              log.map((entry, i) => (
                <div key={i}>
                  <span style={{ color:'var(--text-dim)', marginRight: 8, fontSize: 10 }}>[{entry.time}]</span>
                  <span style={{ color: logColor(entry.cls) }}>{entry.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── DIODE MODE NOTIFICATION ─────────────────────────────────────────── */}
        {diodeMode && (
          <div style={{
            position:'fixed', bottom: 24, right: 24,
            background:'var(--bg-secondary)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8,
            padding: '12px 18px', display:'flex', alignItems:'center', gap: 10,
            fontFamily: MONO, fontSize: 11, color:'var(--accent-green)',
            textTransform:'uppercase', letterSpacing:'0.5px', zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}>
            <Shield size={14} />
            <span>Diode Mode — all write operations blocked</span>
          </div>
        )}
      </main>
    </div>
  );
}
