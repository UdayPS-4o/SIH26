import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Flow, Stats, ThreatType } from '../types';

const WS_URL = 'ws://localhost:8000/ws';
const API_BASE = '/api';

const generateIp = (): string =>
  `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;

const attackTypes = ['DDoS', 'Port Scan', 'Data Exfiltration', 'DGA', 'Beaconing', 'Brute Force', 'Malware', 'Phishing'];
const severities: Array<'low' | 'medium' | 'high' | 'critical'> = ['low', 'medium', 'high', 'critical'];
const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS'];

const generateAlert = (id: number): Alert => {
  const threatType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
  const severity = severities[Math.floor(Math.random() * severities.length)];
  return {
    id: `alert-${id}`,
    timestamp: Date.now() - Math.floor(Math.random() * 3600000),
    threat_type: threatType,
    confidence: Math.floor(Math.random() * 40) + 60,
    severity,
    src_ip: generateIp(),
    dst_ip: generateIp(),
    evidence: {
      'packet_count': Math.floor(Math.random() * 1000) + 100,
      'unique_ports': Math.floor(Math.random() * 50) + 1,
      'anomaly_score': (Math.random() * 0.5 + 0.5).toFixed(2),
      'geo_location': `${Math.floor(Math.random() * 180) - 90}, ${Math.floor(Math.random() * 360) - 180}`,
      'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'payload_size': `${Math.floor(Math.random() * 10000)} bytes`,
    },
    flow_count: Math.floor(Math.random() * 20) + 1,
  };
};

const generateFlow = (): Flow => {
  const srcIp = generateIp();
  const dstIp = generateIp();
  const isAttack = Math.random() < 0.15;
  const attackType = isAttack ? attackTypes[Math.floor(Math.random() * attackTypes.length)] : undefined;
  return {
    id: `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    src_ip: srcIp,
    dst_ip: dstIp,
    src_port: Math.floor(Math.random() * 65535),
    dst_port: Math.floor(Math.random() * 65535),
    protocol: protocols[Math.floor(Math.random() * protocols.length)],
    bytes_sent: Math.floor(Math.random() * 100000),
    bytes_recv: Math.floor(Math.random() * 100000),
    packets: Math.floor(Math.random() * 100),
    duration: Math.floor(Math.random() * 300),
    dns_query: Math.random() < 0.3 ? `example${Math.floor(Math.random() * 100)}.com` : undefined,
    tls_fingerprint: Math.random() < 0.5 ? 'sha256:abc123...' : undefined,
    isAttack: Math.random() < 0.15,
    attack_type: attackType,
  };
};

export const fetchHealth = async (): Promise<{ status: string; uptime: number }> => {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return await res.json();
  } catch {
    return { status: 'ok', uptime: Math.floor(Math.random() * 86400) };
  }
};

export const fetchStats = async (): Promise<Stats> => {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  } catch {
    return {
      total_flows: Math.floor(Math.random() * 50000) + 10000,
      total_alerts: Math.floor(Math.random() * 500) + 100,
      threats_per_type: {
        DDoS: 45, 'Port Scan': 78, 'Data Exfiltration': 23,
        DGA: 34, Beaconing: 56, 'Brute Force': 89, Malware: 12, Phishing: 67,
      },
      avg_confidence: 78.5,
      flows_per_sec: Math.floor(Math.random() * 200) + 50,
      active_connections: Math.floor(Math.random() * 1000) + 500,
    };
  }
};

export const fetchAlerts = async (limit = 50, offset = 0): Promise<Alert[]> => {
  try {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error('Failed to fetch alerts');
    const json = await res.json();
    return Array.isArray(json.alerts) ? json.alerts : [];
  } catch {
    return Array.from({ length: limit }, (_, i) => generateAlert(i + offset));
  }
};

export const fetchThreatTypes = async (): Promise<ThreatType[]> => {
  try {
    const res = await fetch(`${API_BASE}/threat-types`);
    if (!res.ok) throw new Error('Failed to fetch threat types');
    return await res.json();
  } catch {
    return [
      { id: '1', name: 'DDoS', description: 'Distributed Denial of Service', severity_default: 'high', icon: 'Zap' },
      { id: '2', name: 'Port Scan', description: 'Port scanning activity detected', severity_default: 'medium', icon: 'Search' },
      { id: '3', name: 'Data Exfiltration', description: 'Unusual data transfer', severity_default: 'critical', icon: 'Download' },
      { id: '4', name: 'DGA', description: 'Domain Generation Algorithm', severity_default: 'high', icon: 'Globe' },
      { id: '5', name: 'Beaconing', description: 'Periodic C2 beaconing', severity_default: 'high', icon: 'Radio' },
      { id: '6', name: 'Brute Force', description: 'Brute force login attempt', severity_default: 'medium', icon: 'Lock' },
      { id: '7', name: 'Malware', description: 'Malicious payload detected', severity_default: 'critical', icon: 'Bug' },
      { id: '8', name: 'Phishing', description: 'Phishing attempt', severity_default: 'medium', icon: 'Mail' },
    ];
  }
};

export const useWebSocket = (onMessage: (data: { type: string; payload: any }) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const mockIntervalRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage(data);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        reconnectTimeoutRef.current = window.setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [onMessage]);

  const startMockStream = useCallback(() => {
    if (mockIntervalRef.current) return;
    mockIntervalRef.current = window.setInterval(() => {
      if (Math.random() < 0.25) {
        const alert = generateAlert(Date.now());
        onMessage({ type: 'alert', payload: alert });
      } else {
        const flow = generateFlow();
        onMessage({ type: 'flow', payload: flow });
      }
    }, 2000);
  }, [onMessage]);

  const stopMockStream = useCallback(() => {
    if (mockIntervalRef.current) {
      clearInterval(mockIntervalRef.current);
      mockIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    startMockStream();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      stopMockStream();
    };
  }, [connect, startMockStream, stopMockStream]);

  return { isConnected, connectionStatus, connect, disconnect: stopMockStream };
};
