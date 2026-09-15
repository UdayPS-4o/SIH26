/**
 * AttackPanel — attack generator controls for the demo.
 *
 * Connects to the backend WebSocket (/ws/attack) to launch real attacks:
 *   - SYN flood (DDoS)
 *   - Port scan
 *   - Beaconing (C2 simulation)
 *   - DNS flood
 *   - HTTP flood
 *
 * Shows real-time status of active attacks and packet capture stats.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AttackState {
  id: string;
  type: string;
  status: 'idle' | 'running' | 'stopped';
  duration: number;
  startTime: number | null;
}

interface CaptureStats {
  total_packets: number;
  total_bytes: number;
  active_flows: number;
  alerts_generated: number;
  capture_mode: 'real' | 'simulated';
  uptime_sec: number;
  packets_captured?: number;
  interface?: string;
}

interface ActiveAttack {
  id: string;
  type: string;
  result: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ATTACK_PRESETS: Record<string, { label: string; icon: string; color: string; defaultDuration: number }> = {
  ddos: {
    label: 'SYN Flood',
    icon: '🌊',
    color: '#ff0055',
    defaultDuration: 8,
  },
  port_scan: {
    label: 'Port Scan',
    icon: '🔍',
    color: '#ffaa00',
    defaultDuration: 10,
  },
  beaconing: {
    label: 'C2 Beaconing',
    icon: '📡',
    color: '#aa00ff',
    defaultDuration: 15,
  },
  dns_tunnel: {
    label: 'DNS Flood',
    icon: '🔗',
    color: '#00aaff',
    defaultDuration: 8,
  },
  http_flood: {
    label: 'HTTP Flood',
    icon: '🔥',
    color: '#ff5500',
    defaultDuration: 8,
  },
};

const WS_URL = (() => {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.hostname}:8000`;
})();

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AttackPanel() {
  const [targetIp, setTargetIp] = useState('192.168.29.168'); // Change this to attacker's IP
  const [attacks, setAttacks] = useState<AttackState[]>([]);
  const [stats, setStats] = useState<CaptureStats | null>(null);
  const [activeAttacks, setActiveAttacks] = useState<ActiveAttack[]>([]);
  const [captureMode, setCaptureMode] = useState<'unknown' | 'real' | 'simulated'>('unknown');
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<Array<{ time: string; text: string; cls: string }>>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const statsWsRef = useRef<WebSocket | null>(null);

  // ---------------------------------------------------------------------------
  // Logging
  // ---------------------------------------------------------------------------

  const addLog = useCallback((text: string, cls: string = 'info') => {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev.slice(-100), { time, text, cls }]);
  }, []);

  // ---------------------------------------------------------------------------
  // WebSocket: Attack Control
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(`${WS_URL}/ws/attack`);

        ws.onopen = () => {
          setConnected(true);
          addLog('Connected to attack control server', 'success');
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            handleAttackMessage(msg);
          } catch {
            // ignore non-JSON
          }
        };

        ws.onclose = () => {
          setConnected(false);
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          addLog('Attack control connection error', 'error');
        };

        wsRef.current = ws;
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addLog]);

  const handleAttackMessage = (msg: Record<string, any>) => {
    switch (msg.type) {
      case 'attack_started':
        addLog(`Attack started: ${msg.attack_type} (${msg.attack_id.slice(-6)})`, 'warning');
        setAttacks(prev => [...prev, {
          id: msg.attack_id,
          type: msg.attack_type,
          status: 'running',
          duration: 0,
          startTime: Date.now(),
        }]);
        break;

      case 'attack_stopped':
        addLog(`Attack stopped: ${msg.attack_id.slice(-6)}`, 'info');
        setAttacks(prev => prev.map(a =>
          a.id === msg.attack_id ? { ...a, status: 'stopped' } : a
        ));
        break;

      case 'all_attacks_stopped':
        addLog('All attacks stopped', 'info');
        setAttacks(prev => prev.map(a => ({ ...a, status: 'stopped' })));
        break;

      case 'attack_status':
        setActiveAttacks(msg.active || []);
        break;
    }
  };

  // ---------------------------------------------------------------------------
  // WebSocket: Stats
  // ---------------------------------------------------------------------------

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connect = () => {
      try {
        ws = new WebSocket(`${WS_URL}/ws/dashboard`);

        ws.onopen = () => {
          addLog('Connected to stats server', 'success');
        };

        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'stats') {
              setStats(msg.data);
              setCaptureMode(msg.data.capture_mode === 'real' ? 'real' : 'simulated');
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          reconnectTimer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          // silent
        };

        statsWsRef.current = ws;
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [addLog]);

  // ---------------------------------------------------------------------------
  // Poll active attacks
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch('/api/active-attacks');
        const data = await res.json();
        setActiveAttacks(data.attacks || []);
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(iv);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  const launchAttack = (attackType: string) => {
    const preset = ATTACK_PRESETS[attackType];
    if (!preset) return;

    const duration = preset.defaultDuration;
    addLog(`Launching ${preset.label} → ${targetIp} (${duration}s)...`, 'warning');

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'launch',
        type: attackType,
        target: targetIp,
        duration,
      }));
    }

    // Update attack progress timer
    setAttacks(prev => [...prev, {
      id: `pending-${Date.now()}`,
      type: attackType,
      status: 'running',
      duration,
      startTime: Date.now(),
    }]);
  };

  const stopAll = () => {
    addLog('Stopping all attacks...', 'error');
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'stop_all' }));
    }
    setAttacks(prev => prev.map(a => ({ ...a, status: 'stopped' })));
  };

  const clearLogs = () => setLogs([]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="attack-panel">
      {/* Header */}
      <div className="attack-header">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">⚡</span>
          <h3 className="text-sm font-bold uppercase tracking-widest text-white">
            Attack Simulator
          </h3>
          <span
            className="ml-auto text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded"
            style={{
              background: connected ? 'rgba(0,255,65,0.1)' : 'rgba(255,0,51,0.1)',
              color: connected ? 'var(--term-green)' : 'var(--term-red)',
              border: `1px solid ${connected ? 'rgba(0,255,65,0.2)' : 'rgba(255,0,51,0.2)'}`,
            }}
          >
            {connected ? '● CONNECTED' : '○ DISCONNECTED'}
          </span>
        </div>
        <p className="text-[10px] text-slate-500">
          Launch real attacks to test detection. All traffic targets localhost.
        </p>
      </div>

      {/* Target IP input — set this to the dashboard PC's IP for cross-device attacks */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest whitespace-nowrap">Target IP</span>
        <input
          type="text"
          value={targetIp}
          onChange={(e) => setTargetIp(e.target.value)}
          className="flex-1 bg-navy-900/50 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-cyan-400 focus:border-cyan-500/50 focus:outline-none"
          placeholder="192.168.x.x"
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}
        />
        <span className="text-[8px] text-slate-600 uppercase tracking-wider hidden sm:inline">
          Same WiFi
        </span>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-navy-900/50 border border-slate-800 rounded px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Packets</div>
            <div className="text-sm font-mono text-white font-bold">
              {stats.total_packets.toLocaleString()}
            </div>
          </div>
          <div className="bg-navy-900/50 border border-slate-800 rounded px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Bytes</div>
            <div className="text-sm font-mono text-white font-bold">
              {stats.total_bytes > 1_000_000
                ? `${(stats.total_bytes / 1_000_000).toFixed(1)}MB`
                : `${(stats.total_bytes / 1000).toFixed(0)}KB`}
            </div>
          </div>
          <div className="bg-navy-900/50 border border-slate-800 rounded px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Flows</div>
            <div className="text-sm font-mono text-white font-bold">
              {stats.active_flows || 0}
            </div>
          </div>
          <div className="bg-navy-900/50 border border-slate-800 rounded px-2 py-1.5">
            <div className="text-[9px] text-slate-500 uppercase tracking-wider">Mode</div>
            <div
              className="text-sm font-mono font-bold"
              style={{ color: captureMode === 'real' ? 'var(--term-green)' : 'var(--term-amber)' }}
            >
              {captureMode.toUpperCase()}
            </div>
          </div>
        </div>
      )}

      {/* Attack buttons */}
      <div className="mb-3">
        <div className="text-[9px] text-slate-500 uppercase tracking-widest mb-2">
          Launch Attack
        </div>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(ATTACK_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => launchAttack(key)}
              className="attack-btn group relative"
              style={{
                borderColor: `${preset.color}33`,
                background: `${preset.color}08`,
              }}
            >
              <span className="text-lg mb-1 block">{preset.icon}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 group-hover:text-white transition-colors">
                {preset.label}
              </span>
              <span
                className="absolute bottom-1 right-1 text-[8px] font-mono opacity-40"
                style={{ color: preset.color }}
              >
                {preset.defaultDuration}s
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active attacks */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">
            Active Attacks ({activeAttacks.length})
          </span>
          {activeAttacks.length > 0 && (
            <button
              onClick={stopAll}
              className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Stop All
            </button>
          )}
        </div>

        {activeAttacks.length === 0 ? (
          <div className="text-[10px] text-slate-600 py-2 text-center border border-dashed border-slate-800 rounded">
            No active attacks — click a button above to launch
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeAttacks.map((attack) => {
              const preset = ATTACK_PRESETS[attack.type];
              return (
                <div
                  key={attack.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded border"
                  style={{
                    borderColor: preset ? `${preset.color}33` : 'rgba(255,255,255,0.1)',
                    background: preset ? `${preset.color}08` : 'rgba(255,255,255,0.02)',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: preset?.color || '#fff' }}
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {preset?.icon} {preset?.label || attack.type}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono ml-auto">
                    {attack.id.slice(-6)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Console log */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest">
            Attack Log
          </span>
          <button
            onClick={clearLogs}
            className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors"
          >
            Clear
          </button>
        </div>
        <div
          className="attack-log"
          style={{
            maxHeight: 180,
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            lineHeight: 1.6,
          }}
        >
          {logs.map((log, i) => (
            <div key={i} style={{ color: 'var(--term-text-dim)' }}>
              <span style={{ color: 'var(--term-text-dim)', opacity: 0.5 }}>{log.time}</span>{' '}
              <span style={{
                color: log.cls === 'error' ? 'var(--term-red)'
                  : log.cls === 'success' ? 'var(--term-green)'
                  : log.cls === 'warning' ? 'var(--term-amber)'
                  : 'var(--term-text-dim)',
              }}>
                {log.text}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-600 text-center py-3">
              Waiting for activity...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
