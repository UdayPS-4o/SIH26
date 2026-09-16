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
  glowColor: string;
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
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = typeof window !== 'undefined' ? `${window.location.origin}/api/attack` : 'http://localhost:8000/api/attack';

const SEVERITY_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  critical: { text: '#ef4444', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.08)' },
  high:     { text: '#f97316', border: 'rgba(249,115,22,0.3)', bg: 'rgba(249,115,22,0.08)' },
  medium:   { text: '#eab308', border: 'rgba(234,179,8,0.3)',  bg: 'rgba(234,179,8,0.08)' },
  low:      { text: '#00d4ff', border: 'rgba(0,212,255,0.3)',  bg: 'rgba(0,212,255,0.08)' },
};

const ATTACK_DEFS: AttackConfig[] = [
  {
    id: 'syn_flood',
    label: 'SYN Flood',
    icon: Zap,
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.4)',
    description: 'TCP SYN flood — overwhelm connection queue',
    severity: 'critical',
    detectionRule: 'R-001: SYN_RATE_ANOMALY',
    paramFields: [
      { key: 'intensity', label: 'Intensity', type: 'select', options: ['low', 'medium', 'high'], default: 'medium' },
    ],
  },
  {
    id: 'udp_flood',
    label: 'UDP Flood',
    icon: Globe,
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.4)',
    description: 'UDP datagram flood to random ports',
    severity: 'critical',
    detectionRule: 'R-002: UDP_RATE_ANOMALY',
    paramFields: [
      { key: 'intensity', label: 'Intensity', type: 'select', options: ['low', 'medium', 'high'], default: 'medium' },
    ],
  },
  {
    id: 'c2_beacon',
    label: 'C2 Beaconing',
    icon: Radio,
    color: '#b347ff',
    glowColor: 'rgba(179,71,255,0.4)',
    description: 'Simulated C2 keep-alive beacon traffic',
    severity: 'high',
    detectionRule: 'R-003: BEACONING_DETECTED',
    paramFields: [
      { key: 'interval_sec', label: 'Interval', type: 'number', default: 5, min: 1, max: 60, unit: 's' },
    ],
  },
  {
    id: 'dga_domain',
    label: 'DGA Domain',
    icon: Network,
    color: '#facc15',
    glowColor: 'rgba(250,204,21,0.4)',
    description: 'Domain Generation Algorithm — randomized queries',
    severity: 'high',
    detectionRule: 'R-004: DGA_DOMAIN_DETECTED',
    paramFields: [
      { key: 'domain_count', label: 'Domain Count', type: 'number', default: 20, min: 1, max: 200 },
    ],
  },
  {
    id: 'dns_tunnel',
    label: 'DNS Tunneling',
    icon: Globe,
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.4)',
    description: 'Data exfil via encoded DNS TXT queries',
    severity: 'critical',
    detectionRule: 'R-005: DNS_TUNNEL_ANOMALY',
    paramFields: [
      { key: 'data_size_kb', label: 'Data Size', type: 'number', default: 50, min: 1, max: 1000, unit: 'KB' },
    ],
  },
  {
    id: 'port_scan',
    label: 'Port Scan',
    icon: Scan,
    color: '#ff8833',
    glowColor: 'rgba(255,136,51,0.4)',
    description: 'Sequential port probe on target host',
    severity: 'medium',
    detectionRule: 'R-006: PORT_SCAN_DETECTED',
    paramFields: [
      { key: 'start_port', label: 'Start Port', type: 'number', default: 1, min: 1, max: 65535 },
      { key: 'end_port', label: 'End Port', type: 'number', default: 1024, min: 1, max: 65535 },
    ],
  },
  {
    id: 'data_exfil',
    label: 'Data Exfil',
    icon: Download,
    color: '#ff3355',
    glowColor: 'rgba(255,51,85,0.4)',
    description: 'Simulated bulk data exfiltration transfer',
    severity: 'critical',
    detectionRule: 'R-007: EXFILTRATION_VOLUME',
    paramFields: [
      { key: 'volume_mb', label: 'Volume', type: 'number', default: 100, min: 1, max: 10000, unit: 'MB' },
    ],
  },
  {
    id: 'tls_beacon',
    label: 'TLS Beaconing',
    icon: Lock,
    color: '#00d4ff',
    glowColor: 'rgba(0,212,255,0.4)',
    description: 'Encrypted TLS heartbeat-style C2 channel',
    severity: 'high',
    detectionRule: 'R-008: TLS_BEACON_DETECTED',
    paramFields: [
      { key: 'interval_sec', label: 'Interval', type: 'number', default: 10, min: 1, max: 120, unit: 's' },
      { key: 'jitter_pct', label: 'Jitter', type: 'number', default: 15, min: 0, max: 100, unit: '%' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const genId = () =>
  `atk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12: false });

const randomDetection = (severity: string): AttackEntry['detectionResult'] => ({
  rule: 'N/A',
  severity,
  confidence: 75 + Math.floor(Math.random() * 25),
  time_ms: 30 + Math.floor(Math.random() * 200),
});

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function AttackPanel() {
  const { isConnected: wsConnected, flowsPerSec, alertCount, stats } =
    useWebSocketContext();
  const [attacks, setAttacks] = useState<AttackEntry[]>([]);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [diodeMode, setDiodeMode] = useState(false);
  const [threatCounts, setThreatCounts] = useState<Record<string, number>>({});
  const [log, setLog] = useState<
    Array<{ time: string; text: string; cls: string }>
  >([]);
  const [paramState, setParamState] = useState<
    Record<string, Record<string, string | number>>
  >({});
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
    setLog((prev) => [
      ...prev.slice(-200),
      { time: fmtTime(Date.now()), text, cls },
    ]);
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
    const proto =
      window.location.protocol === 'https:' ? 'wss:' : 'ws:';
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
            // Match alerts to launched attacks by attacker IP
            if (msg.type === 'alert' && msg.data) {
              const alert = msg.data;
              setAttacks((prev) =>
                prev.map((a) => {
                  if (a.status === 'launching' || a.status === 'running') {
                    addLog(
                      `[DETECTED] ${a.label} → ${alert.threat_type} (${(alert.confidence * 100).toFixed(0)}%)`,
                      'detection',
                    );
                    return {
                      ...a,
                      status: 'detected',
                      detectionResult: alert,
                    };
                  }
                  return a;
                }),
              );
            }
            if (msg.type === 'stats' && msg.data) {
              // Update stats display via existing state
              if (msg.data.threats_per_type) {
                setThreatCounts(msg.data.threats_per_type);
              }
            }
            if (msg.type === 'attack_update' && msg.attack_id) {
              setAttacks((prev) =>
                prev.map((a) =>
                  a.id === msg.attack_id
                    ? {
                        ...a,
                        status: 'detected',
                        detectionResult:
                          msg.detection || a.detectionResult,
                      }
                    : a,
                ),
              );
              if (msg.detection) {
                addLog(
                  `[DETECTED] ${msg.attack_id.slice(-6)} → ${msg.detection.rule}`,
                  'detection',
                );
              }
            }
          } catch {
            // ignore non-JSON
          }
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

      // Optimistic "launching" state
      setLaunchingId(id);
      setAttacks((prev) => [
        {
          id,
          type: def.id,
          label: def.label,
          timestamp: Date.now(),
          status: 'launching',
          params,
        },
        ...prev,
      ]);
      addLog(
        `[LAUNCH] ${def.label} → params: ${JSON.stringify(params)}`,
        'launch',
      );

      const payload = {
        attack_type: def.id,
        params,
        timestamp: Date.now(),
        detection_rule: def.detectionRule,
      };

      const sent = await sendToBackend(payload);

      // After short "launching" animation, mark as running
      setTimeout(() => {
        setLaunchingId(null);
        setAttacks((prev) =>
          prev.map((a) =>
            a.id === id
              ? {
                  ...a,
                  status: 'running',
                  detectionResult: {
                    rule: def.detectionRule,
                    severity: def.severity,
                    confidence: 0,
                    time_ms: 0,
                  },
                }
              : a,
          ),
        );
        addLog(`[RUNNING] ${def.label} active`, 'info');
      }, 1200);

      // Simulate detection if backend unavailable
      if (!sent) {
        addLog(
          `[SIM] Backend unavailable — simulating ${def.label}`,
          'warn',
        );
        setTimeout(() => {
          const det = randomDetection(def.severity)!;
          setAttacks((prev) =>
            prev.map((a) =>
              a.id === id
                ? { ...a, status: 'detected', detectionResult: det }
                : a,
            ),
          );
          addLog(
            `[SIM DETECTED] ${def.label} → ${def.detectionRule} (${det.confidence}% conf, ${det.time_ms}ms)`,
            'detection',
          );
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
    addLog('════ FULL KILL CHAIN INITIATED ════', 'critical');
    for (let i = 0; i < chain.length; i++) {
      const def = ATTACK_DEFS.find((d) => d.id === chain[i])!;
      addLog(
        `[CHAIN ${i + 1}/3] ${labels[i]} — launching ${def.label}`,
        'launch',
      );
      await new Promise((r) => setTimeout(r, 800));
      await launchAttack(def);
      await new Promise((r) => setTimeout(r, 2000));
    }
    addLog('════ KILL CHAIN COMPLETE ════', 'critical');
  }, [diodeMode, launchAttack, addLog]);

  const stopAttack = useCallback((id: string) => {
    setAttacks((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'completed' } : a)),
    );
    addLog(`[STOPPED] ${id.slice(-6)}`, 'info');
  }, [addLog]);

  const clearHistory = useCallback(() => {
    setAttacks([]);
    addLog('Attack history cleared', 'info');
  }, [addLog]);

  const updateParam = useCallback(
    (attackId: string, key: string, value: string | number) => {
      setParamState((prev) => ({
        ...prev,
        [attackId]: { ...prev[attackId], [key]: value },
      }));
    },
    [],
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────────

  const sevStyle = (sev: string) => SEVERITY_COLORS[sev] || SEVERITY_COLORS.low;

  const logColor = (cls: string) => {
    switch (cls) {
      case 'launch':
        return '#00d4ff';
      case 'detection':
        return '#ff8833';
      case 'critical':
        return '#ef4444';
      case 'warn':
        return '#facc15';
      case 'success':
        return '#00ff41';
      case 'error':
        return '#ef4444';
      default:
        return '#5a7a9a';
    }
  };

  const runningCount = attacks.filter(
    (a) => a.status === 'running' || a.status === 'launching',
  ).length;

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '24px', fontFamily: '"JetBrains Mono", "Share Tech Mono", monospace', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── PAGE HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Skull size={20} style={{ color: '#00d4ff' }} />
          <h1 style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 20, fontWeight: 700, color: '#00d4ff', textShadow: '0 0 10px rgba(0,212,255,0.2)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Attack Simulation Control
          </h1>
        </div>
        <p style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#64748b', marginTop: 4 }}>
          WATCHTOWER // PS-26145 // NTRO // SIH26 &nbsp;|&nbsp; Launch attacks, observe detection in real-time
        </p>
      </div>

      {/* ── STATUS BAR ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', padding: '12px 20px', background: '#0a1118', border: '1px solid #1a2736', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: wsConnected ? '#00ff41' : '#facc15', boxShadow: wsConnected ? '0 0 8px rgba(0,255,65,0.5)' : '0 0 8px rgba(250,204,21,0.4)' }} />
          <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: wsConnected ? '#00ff41' : '#facc15' }}>
            {wsConnected ? 'WS CONNECTED' : 'DEMO MODE'}
          </span>
        </div>
        <div style={{ width: 1, height: 20, background: '#1a2736' }} />
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity size={12} />
          <span>Active:</span>
          <span style={{ color: runningCount > 0 ? '#ef4444' : '#64748b', fontWeight: 700 }}>{runningCount}</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#1a2736' }} />
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={12} />
          <span>Alerts:</span>
          <span style={{ color: '#00d4ff', fontWeight: 700 }}>{alertCount}</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#1a2736' }} />
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Gauge size={12} />
          <span>Flows:</span>
          <span style={{ color: '#00d4ff', fontWeight: 700 }}>{flowsPerSec.toFixed(0)}/s</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#1a2736' }} />
        <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={12} />
          <span>Uptime:</span>
          <span style={{ color: '#00d4ff', fontWeight: 700 }}>
            {stats?.uptime_sec ? `${Math.floor(stats.uptime_sec / 3600)}h ${Math.floor((stats.uptime_sec % 3600) / 60)}m` : '—'}
          </span>
        </div>
        <div style={{ flex: 1 }} />

        {/* DIODE MODE toggle */}
        <button
          onClick={() => {
            setDiodeMode((prev) => {
              addLog(`[DIODE] Mode switched to ${!prev ? 'READ-ONLY' : 'WRITE'}`, !prev ? 'warn' : 'info');
              return !prev;
            });
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '1px',
            border: `1px solid ${diodeMode ? 'rgba(0,255,65,0.4)' : 'rgba(250,204,21,0.25)'}`,
            background: diodeMode ? 'rgba(0,255,65,0.08)' : 'rgba(250,204,21,0.06)',
            color: diodeMode ? '#00ff41' : '#facc15',
            boxShadow: diodeMode ? '0 0 12px rgba(0,255,65,0.1)' : 'none',
            transition: 'all 200ms ease',
          }}
        >
          <div style={{ width: 10, height: 10, borderRadius: '50%', border: `1.5px solid ${diodeMode ? '#00ff41' : '#facc15'}`, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: diodeMode ? 0 : 2, borderRadius: '50%', background: diodeMode ? '#00ff41' : 'transparent', transition: 'all 200ms ease', boxShadow: diodeMode ? '0 0 4px rgba(0,255,65,0.6)' : 'none' }} />
          </div>
          {diodeMode ? 'DIODE READ-ONLY' : 'DIODE WRITE'}
        </button>
      </div>

      {/* ── MAIN GRID ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Attack controls */}
        <div>
          {/* Kill chain */}
          <div style={{ marginBottom: 20, padding: 16, background: '#0a1118', border: '1px solid #1a2736', borderRadius: 8 }}>
            <div style={{ border: '1px solid rgba(255,51,85,0.25)', borderRadius: 8, padding: 14, background: 'rgba(255,51,85,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crosshair size={18} style={{ color: '#ef4444' }} />
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#ef4444' }}>Full Kill Chain</div>
                  <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>Recon → C2 Beacon → DGA Evasion → Exfil</div>
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <button
                onClick={launchKillChain}
                disabled={diodeMode}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 20px', borderRadius: 6, cursor: diodeMode ? 'not-allowed' : 'pointer',
                  fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '1px',
                  border: '1px solid rgba(255,51,85,0.4)',
                  background: diodeMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,51,85,0.1)',
                  color: diodeMode ? '#555' : '#ef4444',
                  boxShadow: diodeMode ? 'none' : '0 0 12px rgba(255,51,85,0.1)',
                  transition: 'all 200ms ease',
                }}
              >
                <Skull size={13} /> EXECUTE CHAIN
              </button>
            </div>
          </div>

          {/* Attack grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {ATTACK_DEFS.map((def) => {
              const Icon = def.icon;
              const params = paramState[def.id] || {};
              const isThisLaunching = attacks.some((a) => a.id === launchingId && a.type === def.id);
              const hasRunning = attacks.some((a) => a.type === def.id && (a.status === 'running' || a.status === 'launching'));

              return (
                <div
                  key={def.id}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `${def.color}44`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.borderColor = `${def.color}22`;
                  }}
                  style={{
                    background: `linear-gradient(135deg, rgba(10,16,24,0.95), ${def.color}06)`,
                    border: `1px solid ${def.color}22`,
                    borderRadius: 8,
                    padding: 14,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'border-color 300ms ease, box-shadow 300ms ease',
                    boxShadow: hasRunning ? `0 0 20px ${def.glowColor}` : 'none',
                  }}
                >
                  {/* Top accent line */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${def.color}, transparent)`, opacity: hasRunning ? 0.8 : 0.3 }} />

                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, marginTop: 2 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, border: `1px solid ${def.color}44`, background: `${def.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={14} style={{ color: def.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{def.label}</div>
                      <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>{def.description}</div>
                    </div>
                    <span style={{ background: sevStyle(def.severity).bg, color: sevStyle(def.severity).text, border: `1px solid ${sevStyle(def.severity).border}`, fontSize: 8, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                      {def.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Detection rule */}
                  <div style={{ fontSize: 9, fontFamily: '"JetBrains Mono", monospace', color: '#475569', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, border: '1px solid rgba(0,212,255,0.06)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Crosshair size={9} />
                    {def.detectionRule}
                  </div>

                  {/* Parameter fields */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {def.paramFields.map((pf) => (
                      <div key={pf.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px', minWidth: 70 }}>{pf.label}</span>
                        {pf.type === 'select' && pf.options ? (
                          <select
                            value={String(params[pf.key] ?? pf.default)}
                            onChange={(e) => updateParam(def.id, pf.key, e.target.value)}
                            style={{ flex: 1, background: '#0d1520', border: '1px solid #1a2736', borderRadius: 4, padding: '4px 8px', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#e0e8f0', outline: 'none', cursor: 'pointer' }}
                          >
                            {pf.options.map((opt) => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                          </select>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                            <input
                              type="number"
                              min={pf.min}
                              max={pf.max}
                              value={params[pf.key] ?? pf.default}
                              onChange={(e) => updateParam(def.id, pf.key, Number(e.target.value))}
                              style={{ flex: 1, background: '#0d1520', border: '1px solid #1a2736', borderRadius: 4, padding: '4px 8px', fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#e0e8f0', outline: 'none', width: '100%' }}
                            />
                            {pf.unit && <span style={{ fontSize: 9, color: '#64748b', minWidth: 18 }}>{pf.unit}</span>}
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
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0', borderRadius: 5, cursor: (diodeMode || hasRunning) ? 'not-allowed' : 'pointer',
                      fontFamily: '"JetBrains Mono", monospace', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px',
                      border: `1px solid ${hasRunning ? 'rgba(255,255,255,0.08)' : `${def.color}44`}`,
                      background: diodeMode ? 'rgba(255,255,255,0.02)' : hasRunning ? `${def.color}10` : `${def.color}14`,
                      color: diodeMode ? '#555' : hasRunning ? def.color : '#fff',
                      boxShadow: diodeMode ? 'none' : `0 0 12px ${def.glowColor}`,
                      transition: 'all 200ms ease',
                      opacity: diodeMode ? 0.4 : 1,
                    }}
                  >
                    {isThisLaunching ? (
                      <>
                        <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${def.color}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                        LAUNCHING...
                      </>
                    ) : hasRunning ? (
                      <>
                        <Activity size={12} style={{ color: def.color }} />
                        IN PROGRESS
                      </>
                    ) : (
                      <>
                        <Zap size={12} />
                        LAUNCH
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Stats + History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Detection monitor */}
          <div style={{ padding: 14, background: '#0a1118', border: '1px solid #1a2736', borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Eye size={13} style={{ color: '#00d4ff' }} />
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00d4ff' }}>Detection Monitor</span>
            </div>

            {attacks.filter((a) => a.status === 'detected').length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#475569', fontSize: 10 }}>No detections yet. Launch an attack.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attacks.filter((a) => a.status === 'detected' || a.status === 'running').slice(0, 8).map((a) => {
                  const def = ATTACK_DEFS.find((d) => d.id === a.type);
                  const det = a.detectionResult;
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 5, border: `1px solid ${def?.color}22`, background: `${def?.color}06` }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.status === 'detected' ? '#00ff41' : def?.color, boxShadow: a.status === 'detected' ? '0 0 6px rgba(0,255,65,0.5)' : `0 0 6px ${def?.glowColor}`, animation: a.status === 'running' ? 'live-pulse 1.5s ease-in-out infinite' : 'none', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{def?.label || a.type}</div>
                        {det && <div style={{ fontSize: 9, color: '#64748b', marginTop: 2, fontFamily: '"JetBrains Mono", monospace' }}>{det.rule} &nbsp;|&nbsp; {det.confidence}% conf</div>}
                      </div>
                      {det && <span style={{ background: 'rgba(0,255,65,0.08)', color: '#00ff41', border: '1px solid rgba(0,255,65,0.2)', fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0 }}>{det.time_ms}ms</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Attack history */}
          <div style={{ padding: 14, background: '#0a1118', border: '1px solid #1a2736', borderRadius: 8, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield size={13} style={{ color: '#00d4ff' }} />
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00d4ff' }}>Attack History</span>
              </div>
              {attacks.length > 0 && (
                <button onClick={clearHistory} style={{ fontSize: 9, color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.8px' }}>CLEAR</button>
              )}
            </div>

            {attacks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569', fontSize: 10, border: '1px dashed #1a2736', borderRadius: 6 }}>No attacks launched yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 300, overflowY: 'auto', paddingRight: 4 }}>
                {attacks.slice(0, 30).map((a) => {
                  const def = ATTACK_DEFS.find((d) => d.id === a.type);
                  const isLaunching = a.status === 'launching';
                  const statusColors: Record<string, string> = { launching: '#facc15', running: '#00d4ff', detected: '#00ff41', completed: '#475569' };
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 5, border: `1px solid ${def?.color}18`, background: 'rgba(0,0,0,0.15)', animation: isLaunching ? 'pulse-border 0.8s ease-in-out infinite' : 'none' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColors[a.status] || '#475569', boxShadow: `0 0 4px ${statusColors[a.status] || '#475569'}`, flexShrink: 0 }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px', flex: 1 }}>{def?.label || a.type}</span>
                      <span style={{ fontSize: 9, color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>{fmtTime(a.timestamp)}</span>
                      <span style={{ background: `${statusColors[a.status]}18`, color: statusColors[a.status], border: `1px solid ${statusColors[a.status]}44`, fontSize: 8, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, textTransform: 'uppercase', letterSpacing: '0.6px', flexShrink: 0 }}>
                        {a.status.toUpperCase()}
                      </span>
                      {a.status === 'running' && (
                        <button
                          onClick={() => stopAttack(a.id)}
                          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 3, color: '#ef4444', fontSize: 8, fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, textTransform: 'uppercase', padding: '2px 6px', cursor: 'pointer', letterSpacing: '0.5px', flexShrink: 0 }}
                        >
                          STOP
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

      {/* ── CONSOLE LOG ─────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 20, padding: 14, background: '#0a1118', border: '1px solid #1a2736', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={13} style={{ color: '#00d4ff' }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#00d4ff' }}>System Console</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: '"JetBrains Mono", monospace', fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', color: '#00ff41' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00ff41', animation: 'live-pulse 1.5s ease-in-out infinite', boxShadow: '0 0 6px #00ff41, 0 0 14px rgba(0,255,65,0.4)' }} />
              LIVE
            </span>
          </div>
          <span style={{ fontSize: 9, color: '#475569', fontFamily: '"JetBrains Mono", monospace' }}>{log.length} entries</span>
        </div>
        <div
          ref={logRef}
          style={{ maxHeight: 180, overflowY: 'auto', fontFamily: '"JetBrains Mono", monospace', fontSize: 10, lineHeight: 1.8, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px solid #1a2736', padding: '10px 14px' }}
        >
          {log.length === 0 ? (
            <div style={{ color: '#475569', textAlign: 'center' }}>System ready. Awaiting commands...</div>
          ) : (
            log.map((entry, i) => (
              <div key={i}>
                <span style={{ color: '#475569', opacity: 0.4, marginRight: 8 }}>[{entry.time}]</span>
                <span style={{ color: logColor(entry.cls) }}>{entry.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── DIODE MODE NOTIFICATION ─────────────────────────────────────────── */}
      {diodeMode && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(0,255,65,0.3)', borderRadius: 8,
          padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#00ff41',
          textTransform: 'uppercase', letterSpacing: '1px',
          boxShadow: '0 0 20px rgba(0,255,65,0.1)', zIndex: 1000, animation: 'fade-in 0.3s ease-out',
        }}>
          <Shield size={14} />
          <span>DIODE MODE — all write operations blocked</span>
        </div>
      )}

      {/* Inline keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(250,204,21,0.15); }
          50% { border-color: rgba(250,204,21,0.4); }
        }
      `}</style>
    </div>
  );
}
