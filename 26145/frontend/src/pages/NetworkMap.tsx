import { useState, useEffect, useMemo, useCallback } from 'react';
import { Server, Activity, ShieldAlert, HardDrive, TrendingUp, TrendingDown, Minus, Eye } from 'lucide-react';

// ── Theme tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:         '#060a10',
  card:       '#0a1118',
  cardHover:  '#0d1620',
  border:     '#1a2736',
  borderHi:   '#00d4ff33',
  text:       '#e0e8f0',
  muted:      '#64748b',
  dim:        '#2d4a6a',
  cyan:       '#00d4ff',
  cyanDim:    '#00d4ff22',
  green:      '#00ff41',
  orange:     '#f97316',
  yellow:     '#eab308',
  red:        '#ef4444',
  gridLine:   '#1a2736',
  gridLineHi: '#1e2d40',
};

// ── Mock data generators ──────────────────────────────────────────────────────

const SUBNETS = ['10.0.1', '10.0.2', '10.0.3', '10.0.5', '10.0.10', '172.16.0', '192.168.1', '192.168.2'];
const HOST_NAMES = ['web-prod', 'db-primary', 'db-replica', 'api-gw', 'auth-svc', 'cache-redis', 'mq-broker', 'storage-nas', 'vpn-gw', 'fw-edge', 'dns-resolver', 'monitor', 'backup-srv', 'mail-srv', 'file-srv', 'ci-cd', 'jump-host', 'fw-internal'];
const THREAT_CLASSES = ['RECONNAISSANCE', 'BRUTE_FORCE', 'SQL_INJECTION', 'XSS', 'DDoS', 'EXFILTRATION', 'MALWARE', 'PHISHING', 'MITM', 'RANSOMWARE'];

interface MockNode {
  id: string;
  ip: string;
  label: string;
  type: 'internal' | 'external' | 'server' | 'attacker';
  threatScore: number;
  port?: number;
  protocol?: string;
  connections: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface MockEdge {
  source: string;
  target: string;
  status: 'normal' | 'suspicious' | 'attack';
  protocol: string;
  packets: number;
  bytes: number;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockData() {
  const rand = seededRand(42);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const nodes: MockNode[] = [];
  const edges: MockEdge[] = [];
  const usedIPs = new Set<string>();

  function genIP(): string {
    let ip: string;
    do {
      const subnet = pick(SUBNETS);
      const octet3 = Math.floor(rand() * 254) + 1;
      const octet4 = Math.floor(rand() * 254) + 1;
      ip = `${subnet}.${octet3}.${octet4}`;
    } while (usedIPs.has(ip));
    usedIPs.add(ip);
    return ip;
  }

  // Generate attackers first (smaller count)
  const attackerCount = 5;
  for (let i = 0; i < attackerCount; i++) {
    const ip = genIP();
    nodes.push({
      id: `attacker-${i}`,
      ip,
      label: pick(['APT-KNIGHT', 'BruteBot', 'ScanHunter', 'DataLeech', 'ZeroDayX']),
      type: 'attacker',
      threatScore: 70 + Math.floor(rand() * 30),
      port: pick([22, 23, 3389, 445, 8080]),
      protocol: pick(['TCP', 'HTTP']),
      connections: [],
      x: rand() * 900 + 50,
      y: rand() * 500 + 50,
      vx: 0,
      vy: 0,
    });
  }

  // Generate servers
  const serverCount = 7;
  for (let i = 0; i < serverCount; i++) {
    const ip = genIP();
    nodes.push({
      id: `server-${i}`,
      ip,
      label: pick(HOST_NAMES.filter(h => !['jump-host', 'fw-edge', 'fw-internal'].includes(h))),
      type: 'server',
      threatScore: Math.floor(rand() * 40),
      port: pick([22, 80, 443, 3306, 5432, 6379, 5672, 445, 53, 25, 21, 8080, 8443]),
      protocol: pick(['TCP', 'TLS', 'HTTP', 'DNS']),
      connections: [],
      x: rand() * 900 + 50,
      y: rand() * 500 + 50,
      vx: 0,
      vy: 0,
    });
  }

  // Generate internal nodes
  const internalCount = 12;
  for (let i = 0; i < internalCount; i++) {
    const ip = genIP();
    nodes.push({
      id: `internal-${i}`,
      ip,
      label: pick(HOST_NAMES),
      type: 'internal',
      threatScore: Math.floor(rand() * 25),
      connections: [],
      x: rand() * 900 + 50,
      y: rand() * 500 + 50,
      vx: 0,
      vy: 0,
    });
  }

  // Generate external nodes
  const externalCount = 12;
  for (let i = 0; i < externalCount; i++) {
    const ip = genIP();
    nodes.push({
      id: `external-${i}`,
      ip,
      label: pick(['ext-proxy', 'cdn-node', 'vendor-api', 'partner-srv', 'cloud-svc', 'remote-emp', 'iot-device', 'mobile-gw']),
      type: 'external',
      threatScore: Math.floor(rand() * 50),
      connections: [],
      x: rand() * 900 + 50,
      y: rand() * 500 + 50,
      vx: 0,
      vy: 0,
    });
  }

  // Build edges — ensure good connectivity
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const attackers = nodes.filter(n => n.type === 'attacker');
  const servers = nodes.filter(n => n.type === 'server');
  const internals = nodes.filter(n => n.type === 'internal');
  const externals = nodes.filter(n => n.type === 'external');

  // Attackers connect to random internals and servers
  attackers.forEach(a => {
    const targets = [...internals.slice(0, 6), ...servers.slice(0, 3)];
    const numConns = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < numConns && targets.length > 0; i++) {
      const t = targets.splice(Math.floor(rand() * targets.length), 1)[0];
      if (t && !a.connections.includes(t.id)) {
        a.connections.push(t.id);
        edges.push({
          source: a.id,
          target: t.id,
          status: rand() < 0.6 ? 'attack' : 'suspicious',
          protocol: pick(['TCP', 'HTTP', 'UDP', 'TLS']),
          packets: Math.floor(rand() * 50000) + 100,
          bytes: Math.floor(rand() * 50000000) + 10000,
        });
      }
    }
  });

  // Internals connect to servers
  internals.forEach(internal => {
    const numConns = 1 + Math.floor(rand() * 3);
    for (let i = 0; i < numConns; i++) {
      const t = servers[Math.floor(rand() * servers.length)];
      if (t && !internal.connections.includes(t.id) && internal.id !== t.id) {
        internal.connections.push(t.id);
        edges.push({
          source: internal.id,
          target: t.id,
          status: rand() < 0.08 ? 'suspicious' : 'normal',
          protocol: pick(['TCP', 'TLS', 'HTTP', 'DNS', 'UDP']),
          packets: Math.floor(rand() * 20000) + 50,
          bytes: Math.floor(rand() * 20000000) + 5000,
        });
      }
    }
  });

  // External connects to servers/internals
  externals.forEach(external => {
    const numConns = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < numConns; i++) {
      const pool = rand() < 0.5 ? servers : internals;
      const t = pool[Math.floor(rand() * pool.length)];
      if (t && !external.connections.includes(t.id) && external.id !== t.id) {
        external.connections.push(t.id);
        edges.push({
          source: external.id,
          target: t.id,
          status: rand() < 0.15 ? 'suspicious' : 'normal',
          protocol: pick(['TCP', 'TLS', 'HTTP', 'DNS', 'UDP']),
          packets: Math.floor(rand() * 15000) + 50,
          bytes: Math.floor(rand() * 10000000) + 5000,
        });
      }
    }
  });

  // Inter-server connections
  for (let i = 0; i < servers.length; i++) {
    for (let j = i + 1; j < servers.length; j++) {
      if (rand() < 0.4) {
        servers[i].connections.push(servers[j].id);
        servers[j].connections.push(servers[i].id);
        edges.push({
          source: servers[i].id,
          target: servers[j].id,
          status: rand() < 0.05 ? 'suspicious' : 'normal',
          protocol: pick(['TCP', 'TLS']),
          packets: Math.floor(rand() * 30000) + 100,
          bytes: Math.floor(rand() * 30000000) + 10000,
        });
      }
    }
  }

  return { nodes, edges };
}

// ── Chart data generators ─────────────────────────────────────────────────────

function generateProtocolTraffic() {
  const protocols = ['TCP', 'UDP', 'ICMP', 'HTTP', 'DNS', 'TLS'];
  const baseVolumes = [4200, 1800, 340, 2100, 890, 3200];
  const variance = 0.3;
  const rand = seededRand(77);
  return protocols.map((proto, i) => ({
    protocol: proto,
    volume: Math.round(baseVolumes[i] * (1 + (rand() - 0.5) * variance * 2)),
    color: proto === 'TCP' ? C.cyan :
           proto === 'TLS' ? '#6366f1' :
           proto === 'HTTP' ? C.yellow :
           proto === 'DNS' ? '#22c55e' :
           proto === 'UDP' ? C.orange :
           '#a855f7',
  }));
}

function generate24hTraffic() {
  const buckets: { hour: string; inbound: number; outbound: number }[] = [];
  const rand = seededRand(123);
  const basePattern = [
    120, 85, 60, 45, 40, 55, 130, 380, 650, 820, 910, 950,
    880, 920, 870, 810, 780, 820, 890, 760, 550, 380, 250, 160
  ];
  for (let h = 0; h < 24; h++) {
    const noise = 1 + (rand() - 0.5) * 0.25;
    const base = basePattern[h] * noise;
    buckets.push({
      hour: `${String(h).padStart(2, '0')}:00`,
      inbound: Math.round(base * (0.55 + rand() * 0.2)),
      outbound: Math.round(base * (0.35 + rand() * 0.15)),
    });
  }
  return buckets;
}

function generateThreatDistribution() {
  const rand = seededRand(256);
  const types = [
    { name: 'DDoS', count: Math.floor(rand() * 40) + 20, color: C.red },
    { name: 'Brute Force', count: Math.floor(rand() * 35) + 15, color: C.orange },
    { name: 'SQL Injection', count: Math.floor(rand() * 25) + 10, color: C.yellow },
    { name: 'XSS', count: Math.floor(rand() * 20) + 8, color: '#a855f7' },
    { name: 'Malware', count: Math.floor(rand() * 15) + 5, color: '#ec4899' },
    { name: 'Phishing', count: Math.floor(rand() * 12) + 3, color: '#14b8a6' },
    { name: 'MITM', count: Math.floor(rand() * 10) + 2, color: '#f43f5e' },
  ];
  const total = types.reduce((s, t) => s + t.count, 0);
  return types.map(t => ({ ...t, pct: Math.round((t.count / total) * 100) }));
}

// ── Force simulation ──────────────────────────────────────────────────────────

function simulateForces(nodes: MockNode[], width: number, height: number, iterations = 40) {
  const { nodes: simulated } = nodes.reduce(
    (acc, n) => {
      acc.nodes.push({ ...n, vx: 0, vy: 0 });
      return acc;
    },
    { nodes: [] as MockNode[] }
  );
  const sim = simulated;
  const nodeMap = new Map(sim.map(n => [n.id, n]));

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;

    // Repulsion
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        let dx = sim[j].x - sim[i].x;
        let dy = sim[j].y - sim[i].y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 5000 / (dist * dist) * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        sim[i].vx -= fx; sim[i].vy -= fy;
        sim[j].vx += fx; sim[j].vy += fy;
      }
    }

    // Attraction along edges
    const seenEdges = new Set<string>();
    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const key = [node.id, targetId].sort().join('|');
        if (seenEdges.has(key)) return;
        seenEdges.add(key);
        const src = nodeMap.get(node.id);
        const tgt = nodeMap.get(targetId);
        if (!src || !tgt) return;
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 140) * 0.004 * alpha;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        src.vx += fx; src.vy += fy;
        tgt.vx -= fx; tgt.vy -= fy;
      });
    });

    // Center gravity
    const cx = width / 2, cy = height / 2;
    sim.forEach(n => {
      n.vx += (cx - n.x) * 0.005 * alpha;
      n.vy += (cy - n.y) * 0.005 * alpha;
    });

    // Apply
    const damping = 0.85;
    sim.forEach(n => {
      n.vx *= damping; n.vy *= damping;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(40, Math.min(width - 40, n.x));
      n.y = Math.max(40, Math.min(height - 40, n.y));
    });
  }

  return sim;
}

// ── SVG chart helpers ─────────────────────────────────────────────────────────

const MONO = '"JetBrains Mono", "Fira Code", "SF Mono", monospace';
const SANS = '"Inter", "Segoe UI", system-ui, sans-serif';

function formatBytes(b: number): string {
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b / 1e3).toFixed(0)} KB`;
  return `${b} B`;
}

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function TrendArrow({ value }: { value: number }) {
  if (value > 0) return <TrendingUp size={14} color="#22c55e" />;
  if (value < 0) return <TrendingDown size={14} color={C.red} />;
  return <Minus size={14} color={C.muted} />;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, trend, color, suffix = '',
}: {
  label: string; value: number | string; icon: React.ElementType; trend: number; color: string; suffix?: string;
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: '18px 20px',
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.03]"
        style={{ background: `radial-gradient(circle, ${color}, transparent 70%)`, transform: 'translate(30%, -30%)' }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '2.5px' }}>
            {label}
          </p>
          <p className="text-3xl font-bold leading-none" style={{ color: C.text, fontFamily: MONO, fontWeight: 700 }}>
            {typeof value === 'number' ? formatNumber(value) : value}
            {suffix && <span className="text-lg ml-0.5" style={{ color: C.muted }}>{suffix}</span>}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5">
            <TrendArrow value={trend} />
            <span className="text-[11px] font-medium" style={{
              color: trend > 0 ? '#22c55e' : trend < 0 ? C.red : C.muted,
              fontFamily: MONO,
            }}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
            <span className="text-[10px]" style={{ color: C.muted }}>vs last hour</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

// ── Network Topology SVG ──────────────────────────────────────────────────────

function NetworkTopology({ nodes, edges }: { nodes: MockNode[]; edges: MockEdge[] }) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<MockNode | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animTime = useRef(0);
  const rafRef = useRef(0);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const edgeKey = useMemo(() => {
    const s = new Set<string>();
    edges.forEach(e => { s.add([e.source, e.target].sort().join('|')); });
    return s;
  }, [edges]);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setDimensions({ width: Math.max(rect.width, 600), height: Math.max(rect.height, 420) });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Run force simulation on data change or dimension change
  const layout = useMemo(() => {
    return simulateForces(nodes, dimensions.width, dimensions.height);
  }, [nodes, dimensions.width, dimensions.height]);

  useEffect(() => {
    let running = true;
    const animate = (ts: number) => {
      if (!running) return;
      animTime.current = ts * 0.001;
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const nodeColor = (node: MockNode) => {
    if (node.type === 'attacker') return { fill: `${C.red}18`, stroke: C.red, glow: C.red, label: C.red };
    if (node.type === 'server') return { fill: `${C.green}18`, stroke: C.green, glow: C.green, label: C.green };
    if (node.type === 'internal') return { fill: `${C.cyan}18`, stroke: C.cyan, glow: C.cyan, label: C.cyan };
    return { fill: `${C.muted}15`, stroke: C.muted, glow: 'transparent', label: C.muted };
  };

  const threatColor = (score: number) => {
    if (score >= 80) return C.red;
    if (score >= 55) return C.orange;
    if (score >= 35) return C.yellow;
    return '#06b6d4';
  };

  const visibleEdges = useMemo(() => {
    const h = hoveredNode;
    const s = selectedNode?.id;
    if (!h && !s) return edges;
    const connected = new Set<string>();
    if (h) { connected.add(h); edges.filter(e => e.source === h || e.target === h).forEach(e => { connected.add(e.source); connected.add(e.target); }); }
    if (s) { connected.add(s); edges.filter(e => e.source === s || e.target === s).forEach(e => { connected.add(e.source); connected.add(e.target); }); }
    return edges.filter(e => connected.has(e.source) && connected.has(e.target));
  }, [edges, hoveredNode, selectedNode]);

  const visibleNodes = useMemo(() => {
    if (!hoveredNode && !selectedNode) return layout;
    const connected = new Set<string>();
    if (hoveredNode) {
      connected.add(hoveredNode);
      edges.filter(e => e.source === hoveredNode || e.target === hoveredNode).forEach(e => { connected.add(e.source); connected.add(e.target); });
    }
    if (selectedNode) {
      connected.add(selectedNode.id);
      edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).forEach(e => { connected.add(e.source); connected.add(e.target); });
    }
    return layout.filter(n => connected.has(n.id));
  }, [layout, hoveredNode, selectedNode, edges]);

  const t = animTime.current;

  return (
    <div className="relative" style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-5 rounded-full" style={{ background: C.cyan }} />
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text, fontFamily: MONO, letterSpacing: '3px' }}>
            Network Topology
          </h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: C.cyanDim, color: C.cyan, fontFamily: MONO, border: `1px solid ${C.cyan}25` }}>
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>
          <span>{layout.length} nodes</span>
          <span style={{ color: C.border }}>|</span>
          <span>{edges.length} connections</span>
          <span style={{ color: C.border }}>|</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.red }} />
            {edges.filter(e => e.status === 'attack').length} attacks
          </span>
        </div>
      </div>

      <div ref={containerRef} className="relative" style={{ height: 480 }}>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full"
          style={{ display: 'block' }}
        >
          <defs>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="attackGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <linearGradient id="gridGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.border} stopOpacity="0.3" />
              <stop offset="100%" stopColor={C.border} stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Grid */}
          <pattern id="smallGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d={`M 30 0 L 0 0 0 30`} fill="none" stroke={C.border} strokeWidth="0.5" opacity="0.4" />
          </pattern>
          <pattern id="grid" width="150" height="150" patternUnits="userSpaceOnUse">
            <rect width="150" height="150" fill="url(#smallGrid)" />
            <path d={`M 150 0 L 0 0 0 150`} fill="none" stroke={C.gridLineHi} strokeWidth="1" opacity="0.3" />
          </pattern>
          <rect width="100%" height="100%" fill={C.bg} />
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Edges */}
          {visibleEdges.map((edge, i) => {
            const src = layout.find(n => n.id === edge.source);
            const tgt = layout.find(n => n.id === edge.target);
            if (!src || !tgt) return null;

            const isAttack = edge.status === 'attack';
            const isSuspicious = edge.status === 'suspicious';
            const edgeColor = isAttack ? C.red : isSuspicious ? C.orange : C.muted;
            const edgeOpacity = isAttack ? 0.55 : isSuspicious ? 0.35 : 0.12;

            // Animated dash for attacks
            const dashOffset = t * (isAttack ? 40 : 15);

            return (
              <g key={`${edge.source}-${edge.target}-${i}`}>
                {/* Glow line for attacks */}
                {isAttack && (
                  <line
                    x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                    stroke={C.red} strokeWidth={4} opacity={0.15}
                    filter="url(#softGlow)"
                  />
                )}
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={edgeColor}
                  strokeWidth={isAttack ? 1.8 : isSuspicious ? 1.2 : 0.8}
                  strokeDasharray={isSuspicious ? '6 4' : isAttack ? '8 4' : 'none'}
                  strokeDashoffset={isAttack || isSuspicious ? -dashOffset : 0}
                  strokeLinecap="round"
                  opacity={edgeOpacity}
                />
                {/* Arrowhead for attacks */}
                {isAttack && (
                  <circle cx={tgt.x} cy={tgt.y} r={3} fill={C.red} opacity={0.6}>
                    <animate attributeName="r" values="2;5;2" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0.8;0.3" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {visibleNodes.map(node => {
            const colors = nodeColor(node);
            const isHovered = node.id === hoveredNode;
            const isSelected = node.id === selectedNode?.id;
            const isAttacker = node.type === 'attacker';
            const radius = isAttacker ? 10 : node.type === 'server' ? 9 : 7;
            const tColor = threatColor(node.threatScore);

            // Pulse for attackers
            const pulse = isAttacker ? 1 + 0.12 * Math.sin(t * 3 + node.id.charCodeAt(9) || 0) : 1;
            const finalR = radius * pulse;

            return (
              <g
                key={node.id}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(node)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer glow */}
                <circle
                  cx={node.x} cy={node.y} r={finalR * 3}
                  fill={`url(#attackGlow)`}
                  opacity={isAttacker ? 0.2 : isHovered ? 0.12 : 0.05}
                >
                  {isAttacker && (
                    <animate attributeName="opacity" values="0.15;0.35;0.15" dur="2s" repeatCount="indefinite" />
                  )}
                </circle>

                {/* Threat ring */}
                {node.threatScore > 35 && (
                  <circle
                    cx={node.x} cy={node.y} r={finalR + 3}
                    fill="none"
                    stroke={tColor}
                    strokeWidth={2}
                    strokeDasharray={`${(node.threatScore / 100) * 2 * Math.PI * (finalR + 3)} ${2 * Math.PI * (finalR + 3)}`}
                    strokeLinecap="round"
                    opacity={0.7}
                    transform={`rotate(-90 ${node.x} ${node.y})`}
                  />
                )}

                {/* Selection ring */}
                {isSelected && (
                  <circle
                    cx={node.x} cy={node.y} r={finalR + 10}
                    fill="none"
                    stroke={C.cyan}
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    opacity={0.8}
                  />
                )}

                {/* Hover ring */}
                {isHovered && !isSelected && (
                  <circle
                    cx={node.x} cy={node.y} r={finalR + 6}
                    fill="none"
                    stroke={C.text}
                    strokeWidth={1}
                    opacity={0.4}
                  />
                )}

                {/* Node fill */}
                <circle
                  cx={node.x} cy={node.y} r={finalR}
                  fill={colors.fill}
                  stroke={isHovered || isSelected ? C.text : colors.stroke}
                  strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  filter={isAttacker ? 'url(#attackGlow)' : isHovered ? 'url(#nodeGlow)' : undefined}
                />

                {/* Node inner dot */}
                <circle
                  cx={node.x} cy={node.y} r={finalR * 0.35}
                  fill={isAttacker ? `${C.red}60` : `${colors.stroke}40`}
                />

                {/* Score text for large nodes */}
                {finalR >= 10 && (
                  <text
                    x={node.x} y={node.y}
                    textAnchor="middle" dominantBaseline="central"
                    fill={C.text}
                    fontSize="8"
                    fontFamily={MONO}
                    fontWeight="bold"
                    opacity={0.85}
                  >
                    {node.threatScore}
                  </text>
                )}

                {/* Label */}
                <text
                  x={node.x} y={node.y + finalR + 14}
                  textAnchor="middle"
                  fill={isAttacker ? C.red : isHovered ? C.text : colors.label}
                  fontSize="9"
                  fontFamily={MONO}
                  fontWeight={isAttacker ? 'bold' : 'normal'}
                  opacity={isHovered ? 1 : 0.7}
                >
                  {node.label.length > 14 ? node.label.slice(0, 12) + '…' : node.label}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {hoveredNode && (() => {
            const node = nodeMap.get(hoveredNode);
            if (!node) return null;
            const tx = Math.min(node.x + 20, dimensions.width - 220);
            const ty = Math.max(node.y - 100, 10);
            const lines = [
              { label: 'NODE', value: node.label, color: node.type === 'attacker' ? C.red : node.type === 'server' ? C.green : C.cyan },
              { label: 'IP ADDR', value: node.ip, color: C.muted },
              { label: 'PORT', value: node.port ? String(node.port) : '—', color: C.muted },
              { label: 'PROTO', value: node.protocol || 'N/A', color: C.muted },
              { label: 'THREAT', value: `${node.threatScore}%`, color: threatColor(node.threatScore) },
              { label: 'TYPE', value: node.type.toUpperCase(), color: node.type === 'attacker' ? C.red : node.type === 'server' ? C.green : C.cyan },
              { label: 'CONNS', value: String(node.connections.length), color: C.muted },
            ];

            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect x={tx - 4} y={ty - 4} width={210} height={lines.length * 17 + 12} rx={6}
                  fill={C.card} stroke={node.type === 'attacker' ? C.red : C.cyan} strokeWidth={1} opacity={0.97} />
                {lines.map((line, i) => (
                  <text key={i} x={tx + 8} y={ty + i * 17 + 6}
                    fill={line.color} fontSize="10" fontFamily={MONO}>
                    {line.label === 'NODE' ? (
                      <tspan fontWeight="bold" fill={line.color}>{line.value}</tspan>
                    ) : (
                      <>
                        <tspan fill={C.dim}>{line.label}</tspan>
                        <tspan dx="8" fill={line.color} fontWeight="500">{line.value}</tspan>
                      </>
                    )}
                  </text>
                ))}
              </g>
            );
          })()}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 flex items-center gap-4 px-3 py-2 rounded-lg"
          style={{ background: `${C.bg}dd`, border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}>
          {[
            { label: 'Server', color: C.green },
            { label: 'Internal', color: C.cyan },
            { label: 'External', color: C.muted },
            { label: 'Attacker', color: C.red },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 6px ${item.color}50` }} />
              <span className="text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Selected node detail */}
        {selectedNode && (
          <div className="absolute top-3 right-3 w-64 rounded-lg p-4"
            style={{ background: `${C.bg}ee`, border: `1px solid ${C.border}`, backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: C.cyan, fontFamily: MONO, letterSpacing: '2px' }}>
                Selected Node
              </span>
              <button onClick={() => setSelectedNode(null)} className="p-0.5 rounded transition-colors" style={{ color: C.muted }}>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: `${nodeColor(selectedNode).stroke}18`, border: `1px solid ${nodeColor(selectedNode).stroke}40` }}>
                <Server size={16} color={nodeColor(selectedNode).stroke} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ fontFamily: MONO, color: C.text }}>{selectedNode.label}</p>
                <p className="text-[11px]" style={{ fontFamily: MONO, color: C.muted }}>{selectedNode.ip}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[
                { label: 'Type', value: selectedNode.type.toUpperCase(), color: nodeColor(selectedNode).stroke },
                { label: 'Threat Score', value: `${selectedNode.threatScore}%`, color: threatColor(selectedNode.threatScore) },
                { label: 'Connections', value: String(selectedNode.connections.length), color: C.text },
                { label: 'Status', value: selectedNode.type === 'attacker' ? 'COMPROMISED' : 'ACTIVE', color: selectedNode.type === 'attacker' ? C.red : C.green },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between text-[11px]">
                  <span style={{ fontFamily: MONO, color: C.muted }}>{row.label}</span>
                  <span className="font-semibold" style={{ fontFamily: MONO, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
            {selectedNode.connections.length > 0 && (
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '1.5px' }}>Connected To</p>
                <div className="flex flex-wrap gap-1">
                  {selectedNode.connections.slice(0, 6).map(cid => {
                    const cn = nodeMap.get(cid);
                    return (
                      <span key={cid} className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: C.border, color: C.muted, fontFamily: MONO }}>
                        {cn?.label?.split('-')[0] || cid.slice(0, 8)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bar chart: protocol traffic ───────────────────────────────────────────────

function ProtocolBarChart({ data }: { data: { protocol: string; volume: number; color: string }[] }) {
  const maxVol = Math.max(...data.map(d => d.volume));
  const barWidth = 28;
  const chartHeight = 180;
  const chartWidth = 340;

  return (
    <div className="flex items-center gap-4">
      <svg width={chartWidth} height={chartHeight + 50} style={{ flexShrink: 0 }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct}
            x1={40} y1={20 + (1 - pct) * chartHeight}
            x2={chartWidth - 10} y2={20 + (1 - pct) * chartHeight}
            stroke={C.border} strokeWidth={0.5} strokeDasharray="3 3"
          />
        ))}
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const val = Math.round(maxVol * pct);
          return (
            <text key={pct} x={38} y={24 + (1 - pct) * chartHeight}
              textAnchor="end" fill={C.muted} fontSize="8" fontFamily={MONO}>
              {val >= 1000 ? `${val / 1000}K` : val}
            </text>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const barH = (d.volume / maxVol) * chartHeight;
          const x = 50 + i * (barWidth + 8);
          const y = 20 + chartHeight - barH;
          return (
            <g key={d.protocol}>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={d.color} opacity={0.8}>
                <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={20 + chartHeight} to={y} dur="0.6s" fill="freeze" />
              </rect>
              <rect x={x} y={y} width={barWidth} height={barH} rx={3} fill={C.text} opacity={0.06} />
              <text x={x + barWidth / 2} y={chartHeight + 36}
                textAnchor="middle" fill={C.muted} fontSize="9" fontFamily={MONO} fontWeight="600">
                {d.protocol}
              </text>
              <text x={x + barWidth / 2} y={y - 5}
                textAnchor="middle" fill={C.text} fontSize="8" fontFamily={MONO} opacity={0.7}>
                {d.volume >= 1000 ? `${(d.volume / 1000).toFixed(1)}K` : d.volume}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        {data.map(d => (
          <div key={d.protocol} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span className="text-[11px]" style={{ fontFamily: MONO, color: C.muted }}>{d.protocol}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Line chart: 24h traffic ───────────────────────────────────────────────────

function TrafficLineChart({ data }: { data: { hour: string; inbound: number; outbound: number }[] }) {
  const chartHeight = 160;
  const chartWidth = 580;
  const padding = { top: 20, right: 30, bottom: 30, left: 45 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  const allVals = data.flatMap(d => [d.inbound, d.outbound]);
  const maxVal = Math.max(...allVals) * 1.1;

  const points = (vals: number[]) => vals.map((v, i) => ({
    x: padding.left + (i / (vals.length - 1)) * innerW,
    y: padding.top + innerH - (v / maxVal) * innerH,
  }));

  const inboundPts = points(data.map(d => d.inbound));
  const outboundPts = points(data.map(d => d.outbound));

  const linePath = (pts: typeof inboundPts) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const areaPath = (pts: typeof inboundPts) =>
    `${linePath(pts)} L ${pts[pts.length - 1].x} ${padding.top + innerH} L ${pts[0].x} ${padding.top + innerH} Z`;

  const gridY = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg width={chartWidth} height={chartHeight + 40} style={{ display: 'block' }}>
      {/* Grid */}
      {gridY.map(pct => (
        <line key={pct}
          x1={padding.left} y1={padding.top + (1 - pct) * innerH}
          x2={padding.left + innerW} y2={padding.top + (1 - pct) * innerH}
          stroke={C.border} strokeWidth={0.5} opacity={0.5}
        />
      ))}
      {/* Y labels */}
      {gridY.map(pct => (
        <text key={pct} x={padding.left - 6} y={padding.top + (1 - pct) * innerH + 3}
          textAnchor="end" fill={C.muted} fontSize="8" fontFamily={MONO}>
          {Math.round(maxVal * pct) >= 1000 ? `${(maxVal * pct / 1000).toFixed(0)}K` : Math.round(maxVal * pct)}
        </text>
      ))}
      {/* Area fills */}
      <path d={areaPath(inboundPts)} fill={C.cyan} opacity={0.06} />
      <path d={areaPath(outboundPts)} fill={C.green} opacity={0.04} />
      {/* Lines */}
      <path d={linePath(outboundPts)} fill="none" stroke={C.green} strokeWidth={1.5} opacity={0.6} />
      <path d={linePath(inboundPts)} fill="none" stroke={C.cyan} strokeWidth={2} filter="url(#nodeGlow)" />
      {/* End dots */}
      {inboundPts.map((p, i) => i % 4 === 0 || i === inboundPts.length - 1 ? (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={C.cyan} opacity={0.8} />
      ) : null)}
      {/* X labels */}
      {data.filter((_, i) => i % 3 === 0).map((d, i) => {
        const idx = i * 3;
        const x = padding.left + (idx / (data.length - 1)) * innerW;
        return (
          <text key={d.hour} x={x} y={padding.top + innerH + 18}
            textAnchor="middle" fill={C.muted} fontSize="8" fontFamily={MONO}>
            {d.hour}
          </text>
        );
      })}
    </svg>
  );
}

// ── Donut chart: threat distribution ─────────────────────────────────────────

function ThreatDonutChart({ data }: { data: { name: string; count: number; pct: number; color: string }[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 80;
  const innerR = 48;
  const total = data.reduce((s, d) => s + d.count, 0);

  let cumulativeAngle = -Math.PI / 2;

  const segments = data.map(d => {
    const sliceAngle = (d.count / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    const midAngle = startAngle + sliceAngle / 2;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);

    const ix1 = cx + innerR * Math.cos(startAngle);
    const iy1 = cy + innerR * Math.sin(startAngle);
    const ix2 = cx + innerR * Math.cos(endAngle);
    const iy2 = cy + innerR * Math.sin(endAngle);

    const largeArc = sliceAngle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      'Z',
    ].join(' ');

    const labelR = outerR + 18;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    cumulativeAngle = endAngle;

    return { ...d, path, midAngle, lx, ly, sliceAngle };
  });

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {segments.map((seg, i) => (
          <g key={i}>
            <path d={seg.path} fill={seg.color} opacity={0.8}>
              <animate attributeName="opacity" from="0" to="0.8" dur="0.5s" fill="freeze" begin={`${i * 0.05}s`} />
            </path>
            <path d={seg.path} fill={C.text} opacity={0.06} />
          </g>
        ))}
        {/* Center text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={C.text} fontSize="16" fontFamily={MONO} fontWeight="bold">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={C.muted} fontSize="8" fontFamily={MONO} letterSpacing="1.5">
          THREATS
        </text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {segments.map(seg => (
          <div key={seg.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-sm" style={{ background: seg.color }} />
            <span className="text-[11px]" style={{ fontFamily: MONO, color: C.text }}>{seg.name}</span>
            <span className="text-[10px] ml-auto" style={{ fontFamily: MONO, color: C.muted }}>
              {seg.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function Section({
  title, icon, children, accentColor = C.cyan,
}: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accentColor?: string;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
        <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: C.text, fontFamily: MONO, letterSpacing: '3px' }}>
          {title}
        </h3>
        {icon}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Main NetworkMap component ────────────────────────────────────────────────

import { useRef } from 'react';

const NetworkMap: React.FC = () => {
  const { nodes, edges } = useMemo(() => generateMockData(), []);
  const [stats, setStats] = useState({
    totalNodes: 0,
    activeConns: 0,
    threatNodes: 0,
    dataTransferred: 0,
  });
  const [trends, setTrends] = useState({ nodes: 0, conns: 0, threats: 0, data: 0 });

  useEffect(() => {
    // Simulate live stat changes
    const threatCount = nodes.filter(n => n.type === 'attacker').length;
    const totalBytes = edges.reduce((s, e) => s + e.bytes, 0);
    setStats({
      totalNodes: nodes.length,
      activeConns: edges.length,
      threatNodes: threatCount,
      dataTransferred: totalBytes,
    });
    setTrends({
      nodes: Math.round((Math.random() - 0.3) * 15),
      conns: Math.round((Math.random() - 0.3) * 20),
      threats: Math.round((Math.random() - 0.5) * 25),
      data: Math.round((Math.random() - 0.2) * 18),
    });
  }, [nodes, edges]);

  const protocolTraffic = useMemo(() => generateProtocolTraffic(), []);
  const traffic24h = useMemo(() => generate24hTraffic(), []);
  const threatDist = useMemo(() => generateThreatDistribution(), []);

  const totalTraffic = useMemo(() => protocolTraffic.reduce((s, d) => s + d.volume, 0), [protocolTraffic]);

  return (
    <div className="min-h-[calc(100vh-64px)] p-5" style={{ background: C.bg }}>
      {/* ── Top stat cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Total Nodes"
          value={stats.totalNodes}
          icon={Server}
          trend={trends.nodes}
          color={C.cyan}
        />
        <StatCard
          label="Active Connections"
          value={stats.activeConns}
          icon={Activity}
          trend={trends.conns}
          color={C.green}
        />
        <StatCard
          label="Threat Nodes"
          value={stats.threatNodes}
          icon={ShieldAlert}
          trend={trends.threats}
          color={C.red}
        />
        <StatCard
          label="Data Transferred"
          value={formatBytes(stats.dataTransferred)}
          icon={HardDrive}
          trend={trends.data}
          color={C.orange}
        />
      </div>

      {/* ── Network Topology ───────────────────────────────────────── */}
      <Section title="Network Topology" icon={
        <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse"
          style={{ background: `${C.red}18`, color: C.red, fontFamily: MONO, border: `1px solid ${C.red}30` }}>
          ● MONITORING
        </span>
      } accentColor={C.cyan}>
        <NetworkTopology nodes={nodes} edges={edges} />
      </Section>

      {/* ── Traffic + Threat Distribution row ──────────────────────── */}
      <div className="grid grid-cols-5 gap-4">
        {/* Traffic Analysis (3/5 width) */}
        <div className="col-span-3">
          <Section title="Traffic Analysis" icon={
            <span className="text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>
              {formatBytes(totalTraffic * 10000)} / 24h
            </span>
          } accentColor={C.green}>
            {/* Bar chart */}
            <div className="mb-4">
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '1.5px' }}>
                By Protocol
              </p>
              <ProtocolBarChart data={protocolTraffic} />
            </div>

            {/* Divider */}
            <div style={{ borderTop: `1px solid ${C.border}` }} className="my-4" />

            {/* Line chart */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted, fontFamily: MONO, letterSpacing: '1.5px' }}>
                  24-Hour Traffic Volume
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded" style={{ background: C.cyan }} />
                    <span className="text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>Inbound</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-0.5 rounded" style={{ background: C.green }} />
                    <span className="text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>Outbound</span>
                  </div>
                </div>
              </div>
              <TrafficLineChart data={traffic24h} />
            </div>
          </Section>
        </div>

        {/* Threat Distribution (2/5 width) */}
        <div className="col-span-2">
          <Section title="Threat Distribution" icon={
            <Eye size={14} color={C.muted} />
          } accentColor={C.red}>
            <ThreatDonutChart data={threatDist} />

            {/* Summary stats */}
            <div className="mt-4 pt-4 grid grid-cols-2 gap-3" style={{ borderTop: `1px solid ${C.border}` }}>
              {[
                { label: 'Critical', value: threatDist.filter(t => t.color === C.red).reduce((s, t) => s + t.count, 0), color: C.red },
                { label: 'High', value: threatDist.filter(t => t.color === C.orange).reduce((s, t) => s + t.count, 0), color: C.orange },
                { label: 'Medium', value: threatDist.filter(t => t.color === C.yellow).reduce((s, t) => s + t.count, 0), color: C.yellow },
                { label: 'Low', value: threatDist.filter(t => t.color === '#06b6d4').reduce((s, t) => s + t.count, 0), color: '#06b6d4' },
              ].map(stat => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ fontFamily: MONO, color: C.muted }}>{stat.label}</span>
                  <span className="text-sm font-bold" style={{ fontFamily: MONO, color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* ── Footer info ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mt-5 px-1">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.green }} />
          <span className="text-[10px]" style={{ fontFamily: MONO, color: C.muted }}>
            Data refreshed every 5s · {nodes.length} nodes monitored · {edges.length} active flows
          </span>
        </div>
        <span className="text-[10px]" style={{ fontFamily: MONO, color: C.dim }}>
          WATCHTOWER v2.4.1 · Mock Data Environment
        </span>
      </div>
    </div>
  );
};

export default NetworkMap;
