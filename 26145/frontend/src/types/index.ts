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
  dns_query?: string;
  tls_fingerprint?: string;
  isAttack: boolean;
  attack_type?: string;
}

export interface Alert {
  id: string;
  timestamp: number;
  threat_type: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  src_ip: string;
  dst_ip: string;
  evidence: Record<string, any>;
  flow_count: number;
}

export interface ThreatType {
  id: string;
  name: string;
  description: string;
  severity_default: string;
  icon: string;
}

export interface Stats {
  total_flows: number;
  total_alerts: number;
  threats_per_type: Record<string, number>;
  avg_confidence: number;
  flows_per_sec: number;
  active_connections: number;
}
