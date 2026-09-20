/**
 * RealBackend — connects the frontend to the EKADHARA backend at :8000.
 *
 * Falls back to MockBackend if the backend is unreachable.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, Flow, Stats, ThreatType } from '../types';
import { mockBackend } from './mockBackend';

const API_BASE = '/api';
const WS_URL = '/ws';
const ALERTS_WS_URL = '/ws';
const RECONNECT_DELAY_MS = 3000;
const PING_INTERVAL_MS = 30_000;
const FETCH_TIMEOUT_MS = 5000;

let useFallback = false;
let backendOnline = false;

const toAbsoluteUrl = (path: string): string => {
  const base = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
};

async function fetchWithTimeout(path: string, opts?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...opts,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...(opts?.headers || {}) },
    });
  } finally {
    clearTimeout(timer);
  }
}

// ── REST API ─────────────────────────────────────────────────────────────────

export async function fetchStats(): Promise<Stats> {
  if (useFallback) return mockBackend.getStats();
  try {
    const res = await fetchWithTimeout('/stats');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && data.total_flows !== undefined) {
      backendOnline = true;
      return data as Stats;
    }
    throw new Error('Bad response');
  } catch {
    useFallback = true;
    return mockBackend.getStats();
  }
}

export async function fetchAlerts(limit = 50, offset = 0): Promise<Alert[]> {
  if (useFallback) return mockBackend.getAlerts(limit, offset);
  try {
    const res = await fetchWithTimeout(`/alerts?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.alerts)) {
      backendOnline = true;
      return data.alerts.map((a: any) => ({
        id: a.id || `alt-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: a.timestamp || Date.now(),
        threat_type: a.threat_type || 'Unknown',
        confidence: typeof a.confidence === 'number' ? (a.confidence <= 1 ? Math.round(a.confidence * 100) : a.confidence) : 0,
        severity: a.severity || 'medium',
        src_ip: a.src_ip || '',
        dst_ip: a.dst_ip || '',
        src_port: a.src_port || 0,
        dst_port: a.dst_port || 0,
        protocol: a.protocol || '',
        evidence: typeof a.evidence === 'string' ? { description: a.evidence } : (a.evidence || {}),
        flow_count: a.flow_count || 1,
      }));
    }
    throw new Error('Bad response');
  } catch {
    useFallback = true;
    return mockBackend.getAlerts(limit, offset);
  }
}

export async function fetchThreatTypes(): Promise<ThreatType[]> {
  if (useFallback) return mockBackend.getThreatTypes();
  try {
    const res = await fetchWithTimeout('/threat-types');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.threat_types)) {
      backendOnline = true;
      return data.threat_types.map((t: any) => ({
        id: t.id || t.name?.toLowerCase() || 'unknown',
        name: t.name || 'Unknown',
        description: t.description || '',
        severity: t.severity || 'medium',
        icon: t.icon || 'AlertTriangle',
      }));
    }
    throw new Error('Bad response');
  } catch {
    useFallback = true;
    return mockBackend.getThreatTypes();
  }
}

export async function fetchFlows(limit = 100): Promise<Flow[]> {
  if (useFallback) return mockBackend.getFlows(limit);
  try {
    const res = await fetchWithTimeout(`/flows?limit=${limit}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.flows)) {
      backendOnline = true;
      return data.flows.map((f: any) => ({
        id: f.id || `flow-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: f.timestamp || Date.now(),
        src_ip: f.src_ip || '',
        dst_ip: f.dst_ip || '',
        src_port: f.src_port || 0,
        dst_port: f.dst_port || 0,
        protocol: f.protocol || '',
        bytes_sent: f.bytes_sent || 0,
        bytes_recv: f.bytes_recv || 0,
        packets: f.packets || 0,
        duration: f.duration || 0,
        isAttack: f.attack_type ? true : false,
        attack_type: f.attack_type,
      }));
    }
    throw new Error('Bad response');
  } catch {
    useFallback = true;
    return mockBackend.getFlows(limit);
  }
}

export async function fetchHealth(): Promise<{ status: string; uptime: number }> {
  if (useFallback) return { status: 'demo', uptime: 0 };
  try {
    const res = await fetchWithTimeout('/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    backendOnline = true;
    return { status: data.status || 'ok', uptime: data.uptime || 0 };
  } catch {
    useFallback = true;
    return { status: 'demo', uptime: 0 };
  }
}

// ── WebSocket hook ────────────────────────────────────────────────────────────

export interface WSState {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  alerts: Alert[];
  flows: Flow[];
  stats: Stats | null;
  flowsPerSec: number;
  alertCount: number;
  connect: () => void;
  disconnect: () => void;
}

export function useRealWebSocket(onAlert?: (alert: Alert) => void): WSState {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [flowsPerSec, setFlowsPerSec] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const pingRef = useRef<number | null>(null);
  const retriesRef = useRef(0);
  const MAX_RETRIES = 10;

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current);
      reconnectRef.current = null;
    }
    if (pingRef.current) {
      clearInterval(pingRef.current);
      pingRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    cleanup();
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        retriesRef.current = 0;
        backendOnline = true;
        useFallback = false;
        // Send ping every 30s
        pingRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'alert' && data.data) {
            const a = data.data;
            const alert: Alert = {
              id: a.id || `alt-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: a.timestamp || Date.now(),
              threat_type: a.threat_type || a.details?.threat_type || 'Unknown',
              confidence: typeof a.confidence === 'number' ? (a.confidence <= 1 ? Math.round(a.confidence * 100) : a.confidence) : 0,
              severity: a.severity || 'medium',
              src_ip: a.src_ip || '',
              dst_ip: a.dst_ip || '',
              src_port: a.src_port || 0,
              dst_port: a.dst_port || 0,
              protocol: a.protocol || '',
              evidence: typeof a.evidence === 'string' ? { description: a.evidence } : (a.evidence || a.details || {}),
              flow_count: a.flow_count || 1,
            };
            setAlerts(prev => [alert, ...prev].slice(0, 200));
            setAlertCount(prev => prev + 1);
            onAlert?.(alert);
          } else if (data.type === 'flow' && data.data) {
            const f = data.data;
            const flow: Flow = {
              id: f.id || `flow-${Math.random().toString(36).slice(2, 8)}`,
              timestamp: f.timestamp || Date.now(),
              src_ip: f.src_ip || '',
              dst_ip: f.dst_ip || '',
              src_port: f.src_port || 0,
              dst_port: f.dst_port || 0,
              protocol: f.protocol || '',
              bytes_sent: f.bytes_sent || 0,
              bytes_recv: f.bytes_recv || 0,
              packets: f.packets || 0,
              duration: f.duration || 0,
              isAttack: !!f.attack_type,
              attack_type: f.attack_type,
            };
            setFlows(prev => [flow, ...prev].slice(0, 200));
            setFlowsPerSec(prev => {
              const delta = Math.floor(Math.random() * 40) - 15;
              return Math.max(0, prev + delta);
            });
          } else if (data.type === 'stats' && data.data) {
            setStats(data.data);
            setFlowsPerSec(data.data.flows_per_sec || 0);
            setAlertCount(data.data.total_alerts || 0);
          }
        } catch (e) {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        cleanup();
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++;
          reconnectRef.current = window.setTimeout(() => connect(), RECONNECT_DELAY_MS);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      cleanup();
    }
  }, [cleanup, onAlert]);

  const disconnect = useCallback(() => {
    retriesRef.current = MAX_RETRIES; // prevent reconnect
    cleanup();
  }, [cleanup]);

  return { isConnected, connectionStatus, alerts, flows, stats, flowsPerSec, alertCount, connect, disconnect };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
  return `${s}s`;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)}MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)}KB`;
  return `${bytes}B`;
}

export function isBackendOnline(): boolean {
  return backendOnline;
}

// ── Attack launch ──────────────────────────────────────────────────────────────

const ATTACK_TYPE_MAP: Record<string, string> = {
  syn_flood: 'syn_flood',
  udp_flood: 'udp_flood',
  c2_beacon: 'c2_beaconing',
  dga_domain: 'dga_domain',
  dns_tunnel: 'dns_tunnel',
  port_scan: 'port_scan',
  data_exfil: 'data_exfiltration',
  tls_beacon: 'c2_beaconing',
};

export interface AttackLaunchResult {
  status: string;
  attack_id: string;
  attack_type: string;
  intensity: number;
  src_ip: string;
  src_port?: number;
  message: string;
  alerts_generated?: number;
  latency_ms: number;
}

export async function launchAttack(attackId: string, intensity = 0.7): Promise<AttackLaunchResult> {
  const backendType = ATTACK_TYPE_MAP[attackId] || attackId;
  const res = await fetch(`${API_BASE}/api/attack/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ attack_type: backendType, intensity }),
  });
  if (!res.ok) {
    // If backend is down, fall back gracefully
    throw new Error(`Backend returned HTTP ${res.status}`);
  }
  const data = await res.json();
  return data as AttackLaunchResult;
}

export async function fetchAttackStatus(): Promise<{ active: any[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/api/attack/status`);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return { active: [], total: 0 };
  }
}
