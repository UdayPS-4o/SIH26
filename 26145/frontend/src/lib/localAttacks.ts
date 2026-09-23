/**
 * Local attack bridge — uses localStorage to communicate between
 * Attack Lab and Live Threats without any backend dependency.
 */
import { Alert } from '../types';

const LS_KEY = 'ekadhara_local_attacks';

export function getLocalAlerts(): Alert[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function launchLocalAttack(attackType: string, intensity = 0.7): Alert[] {
  const now = Date.now();
  const count = Math.floor(3 + intensity * 5);
  const alerts: Alert[] = [];

  const threatMap: Record<string, { threat_type: string; severity: 'critical'|'high'|'medium'|'low'; confidence: number }> = {
    syn_flood:     { threat_type: 'ddos', severity: 'critical', confidence: 92 + Math.floor(Math.random()*7) },
    udp_flood:     { threat_type: 'ddos', severity: 'critical', confidence: 90 + Math.floor(Math.random()*9) },
    c2_beaconing:  { threat_type: 'beaconing', severity: 'high', confidence: 85 + Math.floor(Math.random()*10) },
    dns_tunnel:    { threat_type: 'dns_tunnel', severity: 'high', confidence: 83 + Math.floor(Math.random()*12) },
    port_scan:     { threat_type: 'port_scan', severity: 'medium', confidence: 78 + Math.floor(Math.random()*15) },
    dga_domains:   { threat_type: 'dga', severity: 'high', confidence: 86 + Math.floor(Math.random()*10) },
    data_exfil:    { threat_type: 'exfiltration', severity: 'critical', confidence: 88 + Math.floor(Math.random()*10) },
    tls_anomaly:   { threat_type: 'tls_anomaly', severity: 'medium', confidence: 75 + Math.floor(Math.random()*15) },
  };

  const t = threatMap[attackType] || threatMap.syn_flood;

  for (let i = 0; i < count; i++) {
    alerts.push({
      id: `LOCAL-${now}-${i}`,
      timestamp: now + i * 500,
      threat_type: t.threat_type,
      severity: t.severity,
      confidence: t.confidence,
      src_ip: `${10 + Math.floor(Math.random()*240)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${1 + Math.floor(Math.random()*254)}`,
      dst_ip: `10.0.${1 + Math.floor(Math.random()*5)}.${1 + Math.floor(Math.random()*254)}`,
      src_port: 1024 + Math.floor(Math.random() * 64512),
      dst_port: [22, 53, 80, 443, 3389, 8080][Math.floor(Math.random() * 6)],
      protocol: ['TCP', 'UDP', 'DNS', 'TLS'][Math.floor(Math.random() * 4)],
      evidence: { source: 'local-sim', attack_type: attackType },
      flow_count: 50 + Math.floor(Math.random() * 500),
    });
  }

  try {
    const existing = getLocalAlerts();
    const merged = [...alerts, ...existing].slice(0, 100);
    localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch {
    // localStorage full — clear and retry
    localStorage.removeItem(LS_KEY);
    localStorage.setItem(LS_KEY, JSON.stringify(alerts));
  }

  return alerts;
}

export function clearLocalAlerts() {
  localStorage.removeItem(LS_KEY);
}
