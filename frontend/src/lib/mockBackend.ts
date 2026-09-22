
/**
 * MockBackend - realistic cyber-threat-detection backend simulator.
 *
 * Produces live flows, alerts, and stats with believable network delays so the
 * frontend can develop and demo without a real backend.
 */

import { Alert, Flow, Stats, ThreatNode, ThreatType } from '../types';

// -- Types used by NetworkMap.tsx (re-exported from ../types where available) --

export interface EdgeData {
  source: string;
  target: string;
  status: 'normal' | 'suspicious' | 'attack';
  packets: number;
  bytes: number;
  protocol: string;
}

export interface NetworkStats {
  total_nodes: number;
  active_threats: number;
  suspicious_connections: number;
  blocked_ips: number;
}

export interface AttackPath {
  source_ip: string;
  target_ip: string;
  hops: string[];
  severity: string;
}

// -- Helpers ---------------------------------------------------------------

const randomInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min: number, max: number) =>
  Math.random() * (max - min) + min;

const pick = <T,>(arr: readonly T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const clamp = (v: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, v));

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// -- IP generation ---------------------------------------------------------

const INTERNAL_POOL: string[] = [];
for (let i = 0; i < 30; i++) {
  const r = Math.random();
  INTERNAL_POOL.push(
    r < 0.5
      ? `10.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
      : r < 0.8
        ? `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
        : `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`
  );
}

const EXTERNAL_POOL: string[] = [];
for (let i = 0; i < 20; i++) {
  let a: number;
  do { a = randomInt(1, 223); } while (a === 10 || a === 127);
  if (a === 172) {
    EXTERNAL_POOL.push(
      `172.${randomInt(16, 31)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
    );
  } else if (a === 192) {
    EXTERNAL_POOL.push(
      `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`
    );
  } else {
    EXTERNAL_POOL.push(
      `${a}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
    );
  }
}

export function generateInternalIp(): string {
  return pick(INTERNAL_POOL);
}

export function generateExternalIp(): string {
  return pick(EXTERNAL_POOL);
}

export function randomIp(): string {
  return Math.random() < 0.75
    ? generateInternalIp()
    : generateExternalIp();
}

// -- Threat type definitions -----------------------------------------------

export const THREAT_TYPES: ThreatType[] = [
  {
    id: 'ddos',
    name: 'DDoS',
    description:
      'Volumetric or protocol-based denial-of-service flood overwhelming target resources.',
    severity: 'critical',
    icon: 'Zap',
  },
  {
    id: 'port_scan',
    name: 'Port Scan',
    description:
      'Systematic sequential probing of ports to map open services and OS fingerprints.',
    severity: 'medium',
    icon: 'Search',
  },
  {
    id: 'exfiltration',
    name: 'Data Exfiltration',
    description:
      'Unusually large outbound transfers suggesting unauthorised data leaving the network.',
    severity: 'critical',
    icon: 'Download',
  },
  {
    id: 'dga',
    name: 'DGA Domains',
    description:
      'Domain Generation Algorithm queries -- randomised names used by malware for C2 resilience.',
    severity: 'high',
    icon: 'Globe',
  },
  {
    id: 'beaconing',
    name: 'C2 Beaconing',
    description:
      'Periodic low-volume callbacks with regular intervals -- classic command-and-control heartbeat.',
    severity: 'high',
    icon: 'Radio',
  },
  {
    id: 'dns_tunnel',
    name: 'DNS Tunneling',
    description:
      'Data smuggled through DNS queries/responses using encoded TXT records.',
    severity: 'high',
    icon: 'Server',
  },
  {
    id: 'tls_anomaly',
    name: 'TLS Anomaly',
    description:
      'Suspicious TLS/JA3 fingerprint, self-signed certs, or unusual cipher suites.',
    severity: 'medium',
    icon: 'Shield',
  },
  {
    id: 'brute_force',
    name: 'Brute Force',
    description:
      'Rapid repeated authentication attempts against SSH, RDP, or web login endpoints.',
    severity: 'high',
    icon: 'Lock',
  },
];

// -- ID counter ------------------------------------------------------------

let _idCounter = 0;
const nextId = (prefix: string = 'id'): string =>
  `${prefix}-${++_idCounter}-${Math.random().toString(36).slice(2, 7)}`;

// -- Infrastructure pools --------------------------------------------------

const SERVERS: { ip: string; label: string }[] = [];
const serverLabels = [
  'DC-FileServer-01',
  'DC-WebServer-01',
  'DC-DB-Primary',
  'DC-DB-Replica',
  'DC-Gateway',
  'DC-Mail-01',
];
for (let i = 0; i < 6; i++) {
  SERVERS.push({
    ip: pick(INTERNAL_POOL),
    label: serverLabels[i],
  });
}

const ATTACKERS: string[] = [];
for (let i = 0; i < 8; i++) {
  ATTACKERS.push(
    `${randomInt(1, 223)}.${randomInt(0, 255)}.${randomInt(0, 255)}.${randomInt(1, 254)}`
  );
}

// -- Attack pattern definitions --------------------------------------------

interface AttackPattern {
  attack_type: string;
  generateFlow: () => Flow;
  generateAlert: (flow: Flow) => Alert;
}

const attackPatterns: AttackPattern[] = [
  {
    attack_type: 'DDoS',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(ATTACKERS),
      dst_ip: pick(SERVERS).ip,
      src_port: randomInt(1024, 65535),
      dst_port: pick([80, 443, 53, 3389, 8080]),
      protocol: pick(['TCP', 'UDP', 'ICMP']),
      bytes_sent: randomInt(64, 1500),
      bytes_recv: 0,
      packets: randomInt(500, 5000),
      duration: randomInt(1, 10),
      isAttack: true,
      attack_type: 'DDoS',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'DDoS',
      confidence: randomInt(72, 99),
      severity: pick(['high', 'critical']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: flow.dst_port,
      protocol: flow.protocol,
      evidence: {
        packet_count: String(randomInt(5000, 500000)),
        unique_src_ips: String(randomInt(50, 5000)),
        target_service: pick(['HTTP', 'DNS', 'SSH', 'Generic']),
        attack_vector: pick(['SYN Flood', 'UDP Flood', 'ICMP Flood', 'HTTP Flood']),
        anomaly_score: +(Math.random() * 0.3 + 0.7).toFixed(2),
      },
      flow_count: randomInt(1000, 10000),
    }),
  },
  {
    attack_type: 'Port Scan',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(ATTACKERS),
      dst_ip: pick(INTERNAL_POOL),
      src_port: randomInt(1024, 65535),
      dst_port: randomInt(1, 65535),
      protocol: 'TCP',
      bytes_sent: randomInt(40, 200),
      bytes_recv: randomInt(0, 100),
      packets: 1,
      duration: 1,
      isAttack: true,
      attack_type: 'Port Scan',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'Port Scan',
      confidence: randomInt(65, 95),
      severity: pick(['low', 'medium', 'high']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: flow.dst_port,
      protocol: 'TCP',
      evidence: {
        unique_ports_scanned: String(randomInt(50, 2000)),
        scan_duration_sec: String(randomInt(5, 120)),
        scan_type: pick(['SYN Scan', 'Connect Scan', 'Stealth Scan']),
        ports_open: String(randomInt(2, 15)),
        anomaly_score: +(Math.random() * 0.4 + 0.4).toFixed(2),
      },
      flow_count: randomInt(50, 500),
    }),
  },
  {
    attack_type: 'Data Exfiltration',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(SERVERS).ip,
      dst_ip: pick(ATTACKERS),
      src_port: randomInt(49152, 65535),
      dst_port: pick([443, 8080, 4444, 53]),
      protocol: pick(['HTTPS', 'DNS', 'TCP']),
      bytes_sent: randomInt(100000, 50000000),
      bytes_recv: 0,
      packets: randomInt(100, 5000),
      duration: randomInt(60, 3600),
      isAttack: true,
      attack_type: 'Data Exfiltration',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'Data Exfiltration',
      confidence: randomInt(70, 98),
      severity: 'critical',
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: flow.dst_port,
      protocol: flow.protocol,
      evidence: {
        data_transferred_mb: String(
          (flow.bytes_sent / 1048576).toFixed(1)
        ),
        transfer_duration_sec: String(flow.duration),
        destination_country: pick(['RU', 'CN', 'KP', 'IR', 'Unknown']),
        encoding: pick(['Base64', 'Hex', 'Encrypted TLS', 'DNS TXT']),
        anomaly_score: +(Math.random() * 0.2 + 0.75).toFixed(2),
      },
      flow_count: randomInt(10, 100),
    }),
  },
  {
    attack_type: 'DGA',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(INTERNAL_POOL),
      dst_ip: '8.8.8.8',
      src_port: randomInt(1024, 65535),
      dst_port: 53,
      protocol: 'DNS',
      bytes_sent: randomInt(60, 200),
      bytes_recv: randomInt(100, 1500),
      packets: 1,
      duration: 1,
      isAttack: true,
      attack_type: 'DGA',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'DGA',
      confidence: randomInt(60, 92),
      severity: pick(['medium', 'high']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: 53,
      protocol: 'DNS',
      evidence: {
        query_domain:
          randomInt(10, 30) + pick(['xyz', 'tk', 'ml', 'ga', 'cf']),
        entropy_score: (Math.random() * 2 + 3).toFixed(1),
        queries_per_min: String(randomInt(50, 500)),
        nxdomain_rate: `${randomInt(60, 95)}%`,
        anomaly_score: +(Math.random() * 0.3 + 0.5).toFixed(2),
      },
      flow_count: randomInt(100, 2000),
    }),
  },
  {
    attack_type: 'Beaconing',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(INTERNAL_POOL),
      dst_ip: pick(ATTACKERS),
      src_port: randomInt(1024, 65535),
      dst_port: pick([443, 8080, 4444]),
      protocol: pick(['HTTPS', 'TCP']),
      bytes_sent: randomInt(100, 5000),
      bytes_recv: randomInt(100, 5000),
      packets: randomInt(5, 50),
      duration: randomInt(5, 30),
      isAttack: true,
      attack_type: 'Beaconing',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'Beaconing',
      confidence: randomInt(75, 97),
      severity: pick(['high', 'critical']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: flow.dst_port,
      protocol: flow.protocol,
      evidence: {
        beacon_interval_sec: String(randomInt(30, 300)),
        jitter_percent: `${randomInt(5, 30)}%`,
        connection_count: String(randomInt(20, 200)),
        bytes_per_beacon: String(randomInt(128, 4096)),
        anomaly_score: +(Math.random() * 0.2 + 0.6).toFixed(2),
      },
      flow_count: randomInt(20, 200),
    }),
  },
  {
    attack_type: 'DNS Tunneling',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(INTERNAL_POOL),
      dst_ip: '8.8.8.8',
      src_port: randomInt(1024, 65535),
      dst_port: 53,
      protocol: 'DNS',
      bytes_sent: randomInt(200, 4000),
      bytes_recv: randomInt(200, 4000),
      packets: randomInt(10, 100),
      duration: randomInt(10, 120),
      isAttack: true,
      attack_type: 'DNS Tunneling',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'DNS Tunneling',
      confidence: randomInt(68, 94),
      severity: 'high',
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: 53,
      protocol: 'DNS',
      evidence: {
        tunnel_encoding: pick(['Base32', 'Base64', 'Hex']),
        data_exfiltrated_kb: String(randomInt(10, 500)),
        query_length_avg: `${randomInt(100, 2000)} chars`,
        unique_subdomains: String(randomInt(50, 1000)),
        anomaly_score: +(Math.random() * 0.3 + 0.5).toFixed(2),
      },
      flow_count: randomInt(50, 500),
    }),
  },
  {
    attack_type: 'TLS Anomaly',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(INTERNAL_POOL),
      dst_ip: pick(ATTACKERS),
      src_port: randomInt(1024, 65535),
      dst_port: 443,
      protocol: 'HTTPS',
      bytes_sent: randomInt(200, 5000),
      bytes_recv: randomInt(200, 5000),
      packets: randomInt(10, 100),
      duration: randomInt(5, 60),
      isAttack: true,
      attack_type: 'TLS Anomaly',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'TLS Anomaly',
      confidence: randomInt(55, 88),
      severity: pick(['low', 'medium']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: 443,
      protocol: 'HTTPS',
      evidence: {
        ja3_hash: pick([
          'a0e9f5d64349fb13c6fcd8ce6f1b0a',
          '4c8af77d44776c9a',
          'd2499482f17d7ab',
        ]),
        cipher_suite: pick([
          'TLS_AES_256_GCM',
          'TLS_CHACHA20_POLY1305',
          'TLS_AES_128_GCM',
        ]),
        cert_valid: Math.random() < 0.3 ? 'No' : 'Yes',
        sni_mismatch: Math.random() < 0.5 ? 'Yes' : 'No',
        anomaly_score: +(Math.random() * 0.4 + 0.3).toFixed(2),
      },
      flow_count: randomInt(5, 50),
    }),
  },
  {
    attack_type: 'Brute Force',
    generateFlow: (): Flow => ({
      id: nextId('flow'),
      timestamp: Date.now(),
      src_ip: pick(ATTACKERS),
      dst_ip: pick(SERVERS).ip,
      src_port: randomInt(1024, 65535),
      dst_port: pick([22, 3389, 21, 23]),
      protocol: 'TCP',
      bytes_sent: randomInt(100, 2000),
      bytes_recv: randomInt(100, 500),
      packets: randomInt(5, 50),
      duration: randomInt(10, 300),
      isAttack: true,
      attack_type: 'Brute Force',
    }),
    generateAlert: (flow: Flow): Alert => ({
      id: nextId('alert'),
      timestamp: Date.now(),
      threat_type: 'Brute Force',
      confidence: randomInt(70, 96),
      severity: pick(['medium', 'high']),
      src_ip: flow.src_ip,
      dst_ip: flow.dst_ip,
      src_port: flow.src_port,
      dst_port: flow.dst_port,
      protocol: 'TCP',
      evidence: {
        auth_attempts: String(randomInt(50, 2000)),
        target_service: pick(['SSH', 'RDP', 'FTP', 'Telnet']),
        usernames_tried: String(randomInt(10, 100)),
        lockout_triggered: Math.random() < 0.5 ? 'Yes' : 'No',
        anomaly_score: +(Math.random() * 0.3 + 0.4).toFixed(2),
      },
      flow_count: randomInt(20, 200),
    }),
  },
];

// -- Normal flow generator -------------------------------------------------

function generateNormalFlow(): Flow {
  const srcIp =
    Math.random() < 0.7 ? pick(INTERNAL_POOL) : pick(EXTERNAL_POOL);
  const dstIp =
    Math.random() < 0.7 ? pick(EXTERNAL_POOL) : pick(INTERNAL_POOL);
  return {
    id: nextId('flow'),
    timestamp: Date.now(),
    src_ip: srcIp,
    dst_ip: dstIp,
    src_port: randomInt(1024, 65535),
    dst_port: pick([80, 443, 53, 22, 3389, 25, 587, 3306, 5432, 6379, 8080]),
    protocol: pick(['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS']),
    bytes_sent: randomInt(64, 100000),
    bytes_recv: randomInt(64, 100000),
    packets: randomInt(1, 500),
    duration: randomInt(1, 300),
    isAttack: false,
    attack_type: undefined,
  };
}

// -- Stats builder ----------------------------------------------------------

interface LiveState {
  flowsProcessed: number;
  alertsGenerated: number;
  startTime: number;
  alerts: Alert[];
  threatCounts: Map<string, number>;
  alertConfidences: number[];
}

function computeStats(s: LiveState): Stats {
  const uptime = (Date.now() - s.startTime) / 1000;
  const threatsPerType: Record<string, number> = {};
  for (const [k, v] of s.threatCounts) threatsPerType[k] = v;
  const recent = s.alerts.slice(0, 50);
  const avgConf =
    recent.length > 0
      ? Math.round(
          recent.reduce((sum, a) => sum + a.confidence, 0) /
            recent.length
        )
      : 0;
  return {
    total_flows: s.flowsProcessed,
    total_alerts: s.alertsGenerated,
    threats_per_type: threatsPerType,
    avg_confidence: avgConf,
    flows_per_sec: uptime > 0
      ? Math.min(Math.round(s.flowsProcessed / uptime), 500)
      : 0,
    active_connections: randomInt(200, 800),
    uptime_sec: Math.round(uptime),
  };
}

// -- Network topology generator ---------------------------------------------

function generateNetworkNodes(): ThreatNode[] {
  const nodes: ThreatNode[] = [];

  for (let i = 0; i < 12; i++) {
    nodes.push({
      id: `internal-${i}`,
      ip: pick(INTERNAL_POOL),
      label: pick([
        'Workstation',
        'Laptop',
        'IoT Device',
        'Printer',
        'Camera',
      ]),
      type: 'internal',
      x: randomFloat(100, 700),
      y: randomFloat(100, 500),
      vx: randomFloat(-0.3, 0.3),
      vy: randomFloat(-0.3, 0.3),
      threat_score: randomInt(0, 20),
      connections: [],
    });
  }

  for (let i = 0; i < 6; i++) {
    nodes.push({
      id: `server-${i}`,
      ip: SERVERS[i].ip,
      label: SERVERS[i].label,
      type: 'server',
      x: randomFloat(200, 600),
      y: randomFloat(150, 450),
      vx: randomFloat(-0.1, 0.1),
      vy: randomFloat(-0.1, 0.1),
      threat_score: randomInt(10, 40),
      connections: [],
    });
  }

  for (let i = 0; i < 5; i++) {
    nodes.push({
      id: `attacker-${i}`,
      ip: ATTACKERS[i],
      label: `Threat-${i + 1}`,
      type: 'attacker',
      x: randomFloat(50, 750),
      y: randomFloat(50, 550),
      vx: randomFloat(-0.5, 0.5),
      vy: randomFloat(-0.5, 0.5),
      threat_score: randomInt(60, 100),
      connections: [],
    });
  }

  for (let i = 0; i < nodes.length; i++) {
    const numConns = randomInt(1, 4);
    for (let c = 0; c < numConns; c++) {
      const target = randomInt(0, nodes.length - 1);
      if (
        target !== i &&
        !nodes[i].connections.includes(nodes[target].id)
      ) {
        nodes[i].connections.push(nodes[target].id);
      }
    }
  }

  return nodes;
}

// -- AI analysis text generator ---------------------------------------------

function generateAIAnalysis(ip: string, alerts: Alert[]): string {
  const relatedAlerts = alerts.filter(
    (a) => a.src_ip === ip || a.dst_ip === ip
  );

  if (relatedAlerts.length === 0) {
    return (
      `**Analysis for ${ip}**\n\n` +
      `This IP address shows no recent threat indicators in the current monitoring window. ` +
      `Traffic patterns appear normal with no detected anomalies.\n\n` +
      `**Recommendation:** Continue monitoring. No immediate action required.`
    );
  }

  const threatTypes = [
    ...new Set(relatedAlerts.map((a) => a.threat_type)),
  ];
  const avgConf = Math.round(
    relatedAlerts.reduce((s, a) => s + a.confidence, 0) /
      relatedAlerts.length
  );
  const severityOrder = ['low', 'medium', 'high', 'critical'] as const;
  const maxSeverity = relatedAlerts.reduce((max, a) =>
    severityOrder.indexOf(a.severity) > severityOrder.indexOf(max as Alert['severity'])
      ? a.severity
      : max,
    'low' as Alert['severity']
  );

  const severityEmoji: Record<string, string> = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };
  const severityLabel: Record<string, string> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL',
  };

  let analysis = `${severityEmoji[maxSeverity]} **Threat Analysis: ${ip}**\n\n`;
  analysis += `**Overall Risk: ${severityLabel[maxSeverity]}** (Confidence: ${avgConf}%)\n\n`;
  analysis += `**Indicators of Compromise:**\n`;
  analysis += `- ${relatedAlerts.length} threat events detected\n`;
  analysis += `- Attack vectors: ${threatTypes.join(', ')}\n`;
  analysis += `- Primary threat type: ${relatedAlerts[0].threat_type}\n`;
  analysis += `- First seen: ${new Date(relatedAlerts[relatedAlerts.length - 1].timestamp).toLocaleString()}\n\n`;
  analysis += `**Kill Chain Assessment:**\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('port')))
    analysis += `- ✅ Reconnaissance phase detected (port scanning activity)\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('brute')))
    analysis += `- ✅ Initial Access attempt detected (brute force)\n`;
  if (
    threatTypes.some(
      (t) =>
        t.toLowerCase().includes('dga') ||
        t.toLowerCase().includes('beacon') ||
        t.toLowerCase().includes('dns')
    )
  )
    analysis += `- ✅ Command & Control communication detected\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('exfiltr')))
    analysis += `- ⚠️ Data Exfiltration detected -- potential data loss\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('ddos')))
    analysis += `- ⚠️ Denial of Service attack in progress\n`;

  analysis += `\n**Mitigation Recommendations:**\n`;
  if (maxSeverity === 'critical')
    analysis += `1. 🚩 **IMMEDIATE ACTION**: Isolate affected systems from network\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('ddos')))
    analysis += `2. Activate DDoS mitigation filters and rate limiting\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('port')))
    analysis += `3. Block source IP at firewall and enable port knocking\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('exfiltr')))
    analysis += `4. Initiate incident response protocol for data breach assessment\n`;
  if (threatTypes.some((t) => t.toLowerCase().includes('brute')))
    analysis += `5. Enable account lockout policies and MFA enforcement\n`;
  if (
    threatTypes.some(
      (t) =>
        t.toLowerCase().includes('dga') ||
        t.toLowerCase().includes('dns')
    )
  )
    analysis += `6. Deploy DNS sinkholing and block suspicious domains\n`;
  analysis += `7. Review SIEM correlation rules for this indicator\n`;
  analysis += `8. Update threat intelligence feeds with this IoC\n`;

  return analysis;
}

// -- Main MockBackend class -------------------------------------------------

export class MockBackend {
  private alerts: Alert[] = [];
  private flows: Flow[] = [];
  private flowsProcessed = 0;
  private alertsGenerated = 0;
  private startTime = Date.now();
  private running = false;
  private flowTimer: ReturnType<typeof setTimeout> | null = null;
  private statsTimer: ReturnType<typeof setInterval> | null = null;
  private threatCounts = new Map<string, number>();
  private alertConfidences: number[] = [];
  private eventHandlers: Record<string, Set<(data: any) => void>> = {};

  constructor() {
    // Pre-seed ~40 flows so the UI is not empty on first load
    const now = Date.now();
    for (let i = 0; i < 40; i++) {
      const t = now - randomInt(1000, 3600000);
      const isAttack = Math.random() < 0.15;
      const pattern = isAttack ? pick(attackPatterns) : null;
      const flow = pattern ? pattern.generateFlow() : generateNormalFlow();
      flow.timestamp = t;
      this.flows.push(flow);
      this.flowsProcessed++;

      if (pattern) {
        const alert = pattern.generateAlert(flow);
        alert.timestamp = t;
        this.alerts.push(alert);
        this.alertsGenerated++;
        this.threatCounts.set(
          alert.threat_type,
          (this.threatCounts.get(alert.threat_type) ?? 0) + 1
        );
        this.alertConfidences.push(alert.confidence);
      }
    }
    this.alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  // -- Lifecycle -----------------------------------------------------------

  start(): void {
    if (this.running) return;
    this.running = true;
    this.startTime = Date.now();
    this.scheduleFlow();
    this.statsTimer = setInterval(() => this.tickStats(), 3000);
  }

  stop(): void {
    this.running = false;
    if (this.flowTimer) {
      clearTimeout(this.flowTimer);
      this.flowTimer = null;
    }
    if (this.statsTimer) {
      clearInterval(this.statsTimer);
      this.statsTimer = null;
    }
  }

  initialize(): void { this.start(); }
  shutdown(): void { this.stop(); }

  // -- Generic event bus (used by Dashboard, LiveThreats) ----------------

  on(event: string, handler: (data: any) => void): void {
    (this.eventHandlers[event] ||= new Set()).add(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const set = this.eventHandlers[event];
    if (set) set.delete(handler);
  }

  emit(event: string, data: any): void {
    const set = this.eventHandlers[event];
    if (set) set.forEach((h) => h(data));
  }

  // -- Typed listeners -----------------------------------------------------

  onAlert(cb: (alert: Alert) => void): void {
    this.on('alert', cb);
  }
  onFlow(cb: (flow: Flow) => void): void {
    this.on('flow', cb);
  }
  onStats(cb: (stats: Stats) => void): void {
    this.on('stats', cb);
  }

  offAlert(cb: (alert: Alert) => void): void {
    this.off('alert', cb);
  }
  offFlow(cb: (flow: Flow) => void): void {
    this.off('flow', cb);
  }
  offStats(cb: (stats: Stats) => void): void {
    this.off('stats', cb);
  }

  // -- Query methods (simulated async with realistic delays) ----------------

  async getStats(): Promise<Stats> {
    await delay(randomInt(150, 350));
    return this.buildStats();
  }

  async getAlerts(limit = 50, offset = 0): Promise<Alert[]> {
    await delay(randomInt(250, 400));
    return this.alerts.slice(offset, offset + limit);
  }

  async getFlows(limit = 50): Promise<Flow[]> {
    await delay(randomInt(150, 300));
    return this.flows.slice(0, limit);
  }

  getThreatTypes(): ThreatType[] {
    return [...THREAT_TYPES];
  }

  getNetworkNodes(): ThreatNode[] {
    const nodes = generateNetworkNodes();
    for (const n of nodes) {
      n.x = clamp(n.x + n.vx + randomFloat(-0.5, 0.5), 30, 970);
      n.y = clamp(n.y + n.vy + randomFloat(-0.5, 0.5), 30, 670);
      if (Math.random() < 0.05) {
        n.vx = randomFloat(-0.4, 0.4);
        n.vy = randomFloat(-0.4, 0.4);
      }
    }
    return nodes;
  }

  async analyzeThreat(ip: string): Promise<string> {
    await delay(randomInt(600, 1000));
    return generateAIAnalysis(ip, this.alerts);
  }

  // -- Internal simulation engine ------------------------------------------

  private scheduleFlow(): void {
    if (!this.running) return;
    const nextDelay = randomInt(800, 2000);
    this.flowTimer = setTimeout(
      () => {
        this.produceFlow();
        this.scheduleFlow();
      },
      nextDelay
    );
  }

  private produceFlow(): void {
    const isAttack = Math.random() < 0.15;
    let flow: Flow;
    let alert: Alert | null = null;

    if (isAttack) {
      const pattern = pick(attackPatterns);
      flow = pattern.generateFlow();
      alert = pattern.generateAlert(flow);
      this.alertsGenerated++;
      this.alerts.unshift(alert);
      if (this.alerts.length > 200) this.alerts.length = 200;
      this.threatCounts.set(
        alert.threat_type,
        (this.threatCounts.get(alert.threat_type) ?? 0) + 1
      );
      this.alertConfidences.push(alert.confidence);
      if (this.alertConfidences.length > 500) {
        this.alertConfidences = this.alertConfidences.slice(-500);
      }
    } else {
      flow = generateNormalFlow();
    }

    this.flowsProcessed++;
    this.flows.unshift(flow);
    if (this.flows.length > 500) this.flows.length = 500;

    setTimeout(() => {
      this.emit('flow', flow);
    }, randomInt(5, 30));

    if (alert) {
      setTimeout(() => {
        this.emit('alert', alert);
      }, randomInt(10, 60));
    }
  }

  private tickStats(): void {
    const stats = this.buildStats();
    this.emit('stats', stats);
  }

  private buildStats(): Stats {
    return computeStats({
      flowsProcessed: this.flowsProcessed,
      alertsGenerated: this.alertsGenerated,
      startTime: this.startTime,
      alerts: this.alerts,
      threatCounts: this.threatCounts,
      alertConfidences: this.alertConfidences,
    });
  }
}

// -- Singleton factory ------------------------------------------------------

let instance: MockBackend | null = null;

export function createMockBackend(): MockBackend {
  if (!instance) {
    instance = new MockBackend();
  }
  return instance;
}

export const mockBackend = createMockBackend();
export default mockBackend;

// -- Analytics helper functions -------------------------------------------------

const ra = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const raIp = (): string => `${ra(1, 223)}.${ra(0, 255)}.${ra(0, 255)}.${ra(0, 255)}`;

export function generateHistoricalAlerts(minutes = 30): { time: string; alerts: number }[] {
  const now = Date.now();
  const out: { time: string; alerts: number }[] = [];
  for (let i = minutes - 1; i >= 0; i--) {
    const ts = now - i * 60000;
    const d = new Date(ts);
    const label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hour = d.getHours();
    const peak = hour >= 9 && hour <= 17 ? 1.8 : hour >= 20 || hour <= 5 ? 0.5 : 1.2;
    out.push({ time: label, alerts: Math.round(ra(2, 12) * peak + Math.random() * 5) });
  }
  return out;
}

export function generateFlowTimeSeries(minutes = 30): { time: string; flows: number }[] {
  const now = Date.now();
  const out: { time: string; flows: number }[] = [];
  for (let i = minutes - 1; i >= 0; i--) {
    const ts = now - i * 60000;
    const d = new Date(ts);
    const label = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const hour = d.getHours();
    const peak = hour >= 9 && hour <= 17 ? 2.0 : hour >= 20 || hour <= 5 ? 0.4 : 1.3;
    out.push({ time: label, flows: Math.round(ra(40, 120) * peak + Math.random() * 30) });
  }
  return out;
}

export function generateThreatTypeData(): { name: string; count: number; severity: string }[] {
  return [
    { name: 'Brute Force', count: ra(60, 140), severity: 'medium' },
    { name: 'Port Scan', count: ra(50, 120), severity: 'medium' },
    { name: 'Phishing', count: ra(40, 110), severity: 'medium' },
    { name: 'Beaconing', count: ra(30, 90), severity: 'high' },
    { name: 'DDoS', count: ra(20, 80), severity: 'high' },
    { name: 'DGA', count: ra(15, 65), severity: 'high' },
    { name: 'Data Exfiltration', count: ra(5, 40), severity: 'critical' },
    { name: 'Malware', count: ra(3, 25), severity: 'critical' },
  ].sort((a, b) => b.count - a.count);
}

export function generateRadarData(): { category: string; risk: number }[] {
  return ['Network', 'Application', 'Host', 'Data', 'Identity'].map((cat) => ({ category: cat, risk: ra(35, 95) }));
}

export function generateTopSourceIPs(limit = 8): { ip: string; attacks: number }[] {
  const used = new Set<string>();
  const out: { ip: string; attacks: number }[] = [];
  for (let i = 0; i < limit; i++) {
    let ip: string;
    do { ip = raIp(); } while (used.has(ip));
    used.add(ip);
    out.push({ ip, attacks: ra(5, 120 - i * 10) });
  }
  return out.sort((a, b) => b.attacks - a.attacks);
}

export function generateProtocolDistribution(): { name: string; value: number }[] {
  return [
    { name: 'TCP', value: ra(3000, 8000) },
    { name: 'UDP', value: ra(2000, 6000) },
    { name: 'HTTP', value: ra(1500, 5000) },
    { name: 'HTTPS', value: ra(2000, 7000) },
    { name: 'DNS', value: ra(500, 2000) },
    { name: 'ICMP', value: ra(100, 500) },
  ].sort((a, b) => b.value - a.value);
}

export function getDetectionMetrics() {
  return {
    modelAccuracy: ra(92, 96) + Math.random(),
    falsePositiveRate: ra(2, 5) + Math.random(),
    avgDetectionTime: ra(8, 18) / 10,
    threatsBlockedToday: ra(850, 1200),
  };
}

