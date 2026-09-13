export interface Alert {
  id: string;
  timestamp: number;
  threat_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  evidence: Record<string, string | number>;
  flow_count: number;
}

export interface Flow {
  id: string;
  timestamp: number;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: string;
  bytes_sent: number;
  bytes_recv: number;
  packets: number;
  duration: number;
  isAttack: boolean;
  attack_type: string | undefined;
}

export interface Stats {
  total_flows: number;
  total_alerts: number;
  threats_per_type: Record<string, number>;
  avg_confidence: number;
  flows_per_sec: number;
  active_connections: number;
  uptime_sec: number;
}

export interface ThreatNode {
  id: string;
  ip: string;
  label: string;
  type: 'internal' | 'external' | 'server' | 'attacker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  threat_score: number;
  connections: string[];
}

export interface ThreatType {
  id: string;
  name: string;
  description: string;
  severity: string;
  icon: string;
}
