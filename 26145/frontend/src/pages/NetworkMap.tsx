import { useState, useEffect, useMemo, useRef } from 'react';
import { useWebSocketContext } from '../context/WebSocketContext';
import { useTheme } from '../context/ThemeContext';
import { Alert, Flow } from '../types';

const MONO = '"JetBrains Mono","Fira Code",monospace';
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtBytes = (b: number) => {
  if (b >= 1e9) return `${(b/1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b/1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b/1e3).toFixed(0)} KB`;
  return `${b} B`;
};
const now = () => new Date().toLocaleTimeString('en-US', { hour12:false });

/* ═══════════════════════════════════════════════════════════════════════════════════
   SVG NETWORK TOPOLOGY
   ═══════════════════════════════════════════════════════════════════════════════════ */

function NetworkTopologySVG({ nodes, edges, dynamicEdges, width, height, C }: {
  nodes: NetNode[]; edges: NetEdge[]; dynamicEdges: NetEdge[];
  width: number; height: number; C: { [key: string]: string };
}) {
  const [hovered, setHovered] = useState<string|null>(null);
  const animTime = useRef(0);
  const rafRef = useRef(0);

  useEffect(() => {
    let running = true;
    const tick = (ts: number) => {
      if (!running) return;
      animTime.current = ts * 0.001;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const t = animTime.current;

  const statusColors: Record<string,{fill:string;stroke:string}> = {
    benign:    { fill: `${C.green}12`, stroke: C.green },
    suspicious:{ fill: `${C.amber}12`, stroke: C.amber },
    threat:    { fill: `${C.red}12`,   stroke: C.red },
  };

  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      {/* Canvas background uses surface color */}
      <rect width={width} height={height} fill={C.surface} />

      {/* Grid */}
      <pattern id="nwSm" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke={C.border} strokeWidth="0.4" opacity="0.5" />
      </pattern>
      <pattern id="nwBg" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="url(#nwSm)" />
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke={C.border} strokeWidth="0.8" opacity="0.4" />
      </pattern>
      <rect width={width} height={height} fill="url(#nwBg)" />

      {/* Glow filter for attack paths */}
      <defs>
        <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="attack-pulse" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.red} stopOpacity="0.3" />
          <stop offset="100%" stopColor={C.red} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Zone labels */}
      <text x={70} y={16} textAnchor="middle" fill={C.textDim} fontSize="9" fontFamily={MONO} fontWeight="600" letterSpacing="1.5">
        SOURCE IPS
      </text>
      <text x={width/2} y={16} textAnchor="middle" fill={C.accent} fontSize="9" fontFamily={MONO} fontWeight="600" letterSpacing="1.5">
        ENCLAVE
      </text>
      <text x={width-100} y={16} textAnchor="middle" fill={C.textDim} fontSize="9" fontFamily={MONO} fontWeight="600" letterSpacing="1.5">
        DEST CLUSTERS
      </text>

      {/* Edges */}
      {edges.map(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;
        const isAttack = edge.status === 'attack';
        const isSusp = edge.status === 'suspicious';
        const eColor = isAttack ? C.red : isSusp ? C.amber : `${C.accent}25`;
        const eOpacity = isAttack ? 0.6 : isSusp ? 0.35 : 0.15;

        return (
          <g key={edge.id}>
            {/* Attack glow */}
            {isAttack && (
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={C.red} strokeWidth={6} opacity={0.08}
                filter="url(#glow-red)" />
            )}
            {/* Suspicious glow */}
            {isSusp && (
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={C.amber} strokeWidth={4} opacity={0.06}
                filter="url(#glow-amber)" />
            )}
            {/* Main line */}
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={eColor} strokeWidth={isAttack?1.5:isSusp?1:0.6}
              strokeDasharray={isAttack?'8 4':isSusp?'5 3':'none'}
              strokeLinecap="round" opacity={eOpacity} />
            {/* Attack packet animation */}
            {isAttack && (
              <circle r={2.5} fill={C.red} opacity={0.8}>
                <animateMotion dur="2s" repeatCount="indefinite" path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`} />
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Suspicious subtle pulse */}
            {isSusp && (
              <circle r={1.5} fill={C.amber} opacity={0.5}>
                <animateMotion dur="3s" repeatCount="indefinite" path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`} />
                <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Dynamic attack edges from WebSocket */}
      {dynamicEdges.map(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;
        const color = edge.color || C.red;
        const age = 5000 - ((edge.expiresAt || 0) - Date.now());
        const opacity = Math.max(0.15, 1 - age / 5000);
        const edgeId = `dynamic-${edge.id}`;

        return (
          <g key={edgeId}>
            {/* Glow line */}
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={color} strokeWidth={8} opacity={opacity * 0.15}
              filter="url(#glow-red)" />
            {/* Main line */}
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={color} strokeWidth={1.5}
              strokeDasharray="8 4" strokeLinecap="round" opacity={opacity} />
            {/* Animated packet dot */}
            <circle r={3} fill={color} opacity={opacity * 0.9}>
              <animateMotion dur="2s" repeatCount="indefinite" path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`} />
              <animate attributeName="opacity" values={`${opacity*0.3};${opacity*0.9};${opacity*0.3}`} dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Target pulse when newly created */}
            {age < 1500 && (
              <circle cx={tgt.x} cy={tgt.y} r={25} fill="none" stroke={color} strokeWidth={2}
                opacity={1 - age / 1500}>
                <animate attributeName="r" values="10;30" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}
      {nodes.map(node => {
        const isEnclave = node.type === 'enclave';
        const isHov = node.id === hovered;
        const sc = isEnclave ? {fill:`${C.accent}10`,stroke:C.accent} : statusColors[node.status];
        const r = isEnclave ? 18 : node.type==='dest' ? 12 : 8;

        return (
          <g key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor:'pointer' }}>
            {/* Threat ring */}
            {node.status==='threat' && (
              <circle cx={node.x} cy={node.y} r={r+5} fill="none"
                stroke={C.red} strokeWidth={1.5} opacity="0.6"
                strokeDasharray={`${0.4*2*Math.PI*(r+5)} ${2*Math.PI*(r+5)}`}
                strokeLinecap="round" transform={`rotate(-90 ${node.x} ${node.y})`}>
                <animateTransform attributeName="transform" type="rotate"
                  from={`-90 ${node.x} ${node.y}`} to={`270 ${node.x} ${node.y}`}
                  dur="4s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Hover ring */}
            {isHov && (
              <circle cx={node.x} cy={node.y} r={r+6} fill="none"
                stroke={C.text} strokeWidth={1} opacity="0.25" />
            )}
            {/* Node body */}
            <circle cx={node.x} cy={node.y} r={r}
              fill={sc.fill} stroke={isHov?C.text:sc.stroke}
              strokeWidth={isHov?2:isEnclave?1.5:1} />
            {/* Inner dot */}
            <circle cx={node.x} cy={node.y} r={r*0.3}
              fill={isEnclave?`${C.accent}40`:`${sc.stroke}30`} />
            {/* Enclave symbol */}
            {isEnclave && (
              <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="central"
                fill={C.accent} fontSize="12" fontFamily={MONO} fontWeight="700" opacity="0.9">{'◈'}</text>
            )}
            {/* Label */}
            <text x={node.x} y={node.y+r+14} textAnchor="middle"
              fill={isHov?C.text: C.textSec} fontSize={isEnclave?9:8} fontFamily={MONO}
              fontWeight={node.status==='threat'?'600':isEnclave?'600':'400'} opacity={isHov?1:0.8}>
              {node.label.length>14?node.label.slice(0,12)+'…':node.label}
            </text>
            <text x={node.x} y={node.y+r+24} textAnchor="middle"
              fill={C.textDim} fontSize="7" fontFamily={MONO} opacity="0.7">{node.ip}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   DATA TYPES
   ═══════════════════════════════════════════════════════════════════════════════════ */

interface NetNode {
  id: string; label: string; ip: string;
  type: 'enclave'|'source'|'dest'; status: 'benign'|'suspicious'|'threat';
  x: number; y: number;
}
interface NetEdge {
  id: string; source: string; target: string;
  status: 'normal'|'suspicious'|'attack';
  packets: number; bytes: number;
  expiresAt?: number;
  color?: string;
  threatType?: string;
}

function buildTopology(W: number, H: number) {
  const nodes: NetNode[] = [];
  const edges: NetEdge[] = [];

  nodes.push({ id:'enclave', label:'ENCLAVE', ip:'10.0.0.1', type:'enclave', status:'benign', x:W/2, y:H/2 });

  const srcStatuses: Array<'benign'|'suspicious'|'threat'> = [
    'benign','benign','benign','benign','benign',
    'benign','benign','benign','benign','benign',
    'threat','threat','threat','suspicious','suspicious',
  ];
  const srcLabels = [
    '192.168.1.10','192.168.1.20','192.168.1.30','192.168.1.40','192.168.1.50',
    '10.0.1.10','10.0.1.20','10.0.1.30','10.0.1.40','10.0.1.50',
    '172.16.0.10','172.16.0.20','172.16.0.30','192.168.2.10','192.168.2.20',
  ];
  for (let i = 0; i < 15; i++) {
    const col = i % 5, row = Math.floor(i / 5);
    nodes.push({
      id:`src-${i}`, label:srcLabels[i], ip:srcLabels[i], type:'source',
      status:srcStatuses[i],
      x: 80 + col * ((W - 300) / 4),
      y: 70 + row * ((H - 100) / 2),
    });
  }

  const destDefs: Array<{ label:string; ip:string; status:'benign'|'suspicious'|'threat' }> = [
    { label:'DB CLUSTER', ip:'10.0.5.10', status:'benign' },
    { label:'API GW',     ip:'10.0.5.20', status:'benign' },
    { label:'WEB FARM',   ip:'10.0.5.30', status:'suspicious' },
    { label:'AUTH SVC',   ip:'10.0.5.40', status:'benign' },
    { label:'STORAGE',    ip:'10.0.5.50', status:'benign' },
  ];
  destDefs.forEach((d, i) => {
    nodes.push({
      id:`dst-${i}`, label:d.label, ip:d.ip, type:'dest',
      status:d.status,
      x: W - 130,
      y: 60 + i * ((H - 120) / 4),
    });
  });

  for (let i = 0; i < 5; i++) {
    edges.push({
      id:`enclave-d${i}`, source:'enclave', target:`dst-${i}`,
      status:'normal', packets:8000+i*2000, bytes:400_000+i*100_000,
    });
  }

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   MAIN NetworkMap COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════════ */

const NetworkMap: React.FC = () => {
  const { C } = useTheme();
  const { alerts: wsAlerts } = useWebSocketContext();
  const [clock, setClock] = useState(now());
  const [svgDims, setSvgDims] = useState({ width:900, height:480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMapRef = useRef<Map<string,{label:string;ip:string;status:string}>>(new Map());
  const prevAlertCountRef = useRef(0);
  const [dynamicEdges, setDynamicEdges] = useState<NetEdge[]>([]);
  const [liveFlowCount, setLiveFlowCount] = useState(0);
  const [liveFlows, setLiveFlows] = useState<Flow[]>([]);
  const liveFlowsFetched = useRef(0);

  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const r = containerRef.current.getBoundingClientRect();
      setSvgDims({ width:Math.max(r.width,600), height:480 });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Fetch live flows from backend and map them to topology nodes
  useEffect(() => {
    let cancelled = false;
    const fetchFlows = async () => {
      try {
        const { fetchFlows: getFlows } = await import('../lib/realBackend');
        const flows = await getFlows(50);
        if (!cancelled) {
          setLiveFlows(flows);
          setLiveFlowCount(flows.length);
          liveFlowsFetched.current += flows.length;
        }
      } catch { /* silently ignore */ }
    };
    fetchFlows();
    const interval = setInterval(fetchFlows, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Map WebSocket alerts to dynamic attack edges
  useEffect(() => {
    const newAlerts = wsAlerts.slice(0, prevAlertCountRef.current || wsAlerts.length);
    prevAlertCountRef.current = wsAlerts.length;

    const THREAT_COLORS: Record<string,string> = {
      ddos: C.red, beaconing: C.orange, dga: C.amber,
      dns_tunnel: C.teal, port_scan: C.purple,
      exfiltration: C.pink, tls_anomaly: C.teal, malware: C.red, phishing: C.amber,
    };

    wsAlerts.forEach((alert: Alert) => {
      const srcIp = (alert.src_ip || '').replace(/\./g, '-');
      let srcNodeId = `src-${srcIp}`;
      const { nodes } = buildTopology(svgDims.width, svgDims.height);
      let ipMatch = nodes.find(n => n.ip === alert.src_ip);
      if (!ipMatch) {
        const srcNodes = nodes.filter(n => n.type === 'source');
        ipMatch = srcNodes.find(n => n.ip.startsWith(alert.src_ip.split('.')[0]));
      }

      if (ipMatch) {
        srcNodeId = ipMatch.id;
        const targetNodeId = 'enclave';
        const color = THREAT_COLORS[alert.threat_type?.toLowerCase()] || C.red;

        setDynamicEdges(prev => {
          const exists = prev.some(e => e.id === `dyn-${alert.id}`);
          if (exists) return prev;

          const newEdge: NetEdge = {
            id: `dyn-${alert.id}`,
            source: srcNodeId,
            target: targetNodeId,
            status: 'attack',
            packets: 1,
            bytes: 0,
            expiresAt: Date.now() + 5000,
            color,
            threatType: alert.threat_type,
          };

          return [...prev, newEdge];
        });
      }
    });
  }, [wsAlerts, svgDims.width, svgDims.height, C]);

  // Fade out expired dynamic edges
  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicEdges(prev => prev.filter(e => (e.expiresAt || 0) > Date.now()));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Enrich topology with real flow data
  const { nodes, edges } = useMemo(() => {
    const { nodes: baseNodes, edges: baseEdges } = buildTopology(svgDims.width, svgDims.height);
    if (liveFlows.length > 0) {
      const flowEdges: NetEdge[] = liveFlows.slice(0, 20).map((f, i) => ({
        id: `flow-${i}`,
        source: f.src_ip,
        target: f.dst_ip,
        status: f.isAttack ? 'attack' : (f.attack_type ? 'suspicious' : 'normal'),
        packets: f.packets || 1,
        bytes: (f.bytes_sent || 0) + (f.bytes_recv || 0),
        color: f.isAttack ? C.red : (f.attack_type ? C.amber : C.green),
      }));
      return { nodes: baseNodes, edges: [...baseEdges, ...flowEdges] };
    }
    return { nodes: baseNodes, edges: baseEdges };
  }, [svgDims.width, svgDims.height, liveFlows, C.green, C.red, C.amber]);

  // Merge dynamic edges into base edges
  const allEdges = useMemo(() => {
    const merged = [...edges];
    dynamicEdges.forEach(de => { merged.push(de); });
    return merged;
  }, [edges, dynamicEdges]);

  useEffect(() => {
    nodeMapRef.current = new Map(nodes.map(n => [n.id, {label:n.label, ip:n.ip, status:n.status}]));
  }, [nodes]);

  const totalFlows = useMemo(() => allEdges.reduce((s,e) => s + e.packets, 0), [allEdges]);
  const blockedConns = useMemo(() => allEdges.filter(e=>e.status==='attack').reduce((s,e) => s + e.packets, 0), [allEdges]);
  const activeThreats = useMemo(() => allEdges.filter(e=>e.status==='attack').length, [allEdges]);

  const attackEdges = useMemo(() => allEdges.filter(e=>e.status==='attack'), [allEdges]);
  const suspEdges = useMemo(() => allEdges.filter(e=>e.status==='suspicious'), [allEdges]);

  const statCards = [
    { label:'Total Flows', value: liveFlowCount > 0 ? fmt(liveFlowCount + liveFlowsFetched.current) : fmt(totalFlows), color: C.accent },
    { label:'Live Flows', value: fmt(liveFlows.length), color: C.green },
    { label:'Blocked Conns', value: fmt(blockedConns), color: C.red },
    { label:'Active Threats', value: String(activeThreats), color: 'var(--accent-orange)' },
  ];

  return (
    <div style={{ minHeight:'100%', background: C.bg, color: C.text, fontFamily: '"Inter",system-ui,sans-serif', fontSize: 12, lineHeight: 1.6 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        ::selection { background:var(--accent-cyan); color:${C.text}; }
        :focus-visible { outline:1.5px solid var(--border-active); outline-offset:2px; border-radius:3px; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        .wt-interactive { transition:transform 160ms cubic-bezier(0.22,1,0.36,1), background 0.2s; }
        .wt-interactive:active { transform:scale(0.98); }
        a { color:inherit; text-decoration:none; }
        @keyframes flow-attack { to { stroke-dashoffset: -30; } }
        .flow-attack { stroke-dasharray: 8 4; animation: flow-attack 0.8s linear infinite; }
        @keyframes flow-suspicious { to { stroke-dashoffset: -20; } }
        .flow-suspicious { stroke-dasharray: 5 3; animation: flow-suspicious 2s linear infinite; }
        @media (max-width:1024px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
        @media (max-width:768px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
        @media (max-width:480px) {
          main { padding:20px 16px 60px !important; }
        }
      `}</style>

      {/* ── STICKY HEADER ─────────────────────────────────────────────── */}
      <header style={{
        position:'sticky',top:0,zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth:1400,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height: 52,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:30,height:30,borderRadius:6,
              background:`var(--accent-cyan)10`,border:`1px solid var(--accent-cyan)25`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color:C.text,fontVariantNumeric:'tabular-nums' }}>
              EKADHARA
            </span>
          </div>
          <div style={{ width:1,height:16,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>
            PS-26145 · NETWORK TOPOLOGY
          </span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:11,color:C.textSec,letterSpacing:'0.5px',fontVariantNumeric:'tabular-nums' }}>{clock}</span>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN ────────────────────────────────────────────── */}
      <main style={{ maxWidth:1400,margin:'0 auto',padding:'24px 28px 64px' }}>

        {/* Hero context */}
        <section style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.3px', color: C.text, marginBottom: 6 }}>
            Network Topology
          </h1>
          <p style={{ fontSize: 12, color: C.textSec, maxWidth: 640, lineHeight: 1.65, margin: 0 }}>
            Real-time visualization of flow topology across the enclave. {nodes.filter(n=>n.type==='source').length} source segments connected to {nodes.filter(n=>n.type==='dest').length} destination clusters. Attack paths highlighted with animated indicators.
          </p>
        </section>

        {/* Section 1: Stats sidebar + Network Topology */}
        <section style={{ display:'grid',gridTemplateColumns:'240px 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">

          {/* Stats sidebar */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {statCards.map((s, i) => (
              <div key={i} style={{
                background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
                padding: '18px 20px',
                transition: `all 0.2s ${EASE}`,
                boxShadow: '0 1px 3px var(--shadow-sm)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{
                  fontSize: 20, fontWeight: 700, color: s.color,
                  fontFamily: MONO, letterSpacing: '-0.5px', lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}>{s.value}</div>
              </div>
            ))}

            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px var(--shadow-sm)',
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
                paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}`,
              }}>Traffic Volume</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 6 }}>
                {[
                  { label:'Total Transferred', value: fmtBytes(edges.reduce((s,e)=>s+e.bytes,0)), color: C.green },
                  { label:'Attack Traffic', value: fmtBytes(attackEdges.reduce((s,e)=>s+e.bytes,0)), color: C.red },
                  { label:'Connections', value: fmt(edges.length), color: C.purple },
                ].map((s,i) => (
                  <div key={i} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'7px 0', borderBottom: i < 2 ? `1px solid ${C.border}30` : 'none',
                  }}>
                    <span style={{ fontSize: 12, color: C.textSec }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: s.color, fontVariantNumeric:'tabular-nums', fontFamily: MONO }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '18px 20px',
              boxShadow: '0 1px 3px var(--shadow-sm)',
            }}>
              <div style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
                paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}`,
              }}>Legend</div>
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {[
                  { status:'benign', label:'Benign', color: C.green },
                  { status:'suspicious', label:'Suspicious', color: C.amber },
                  { status:'threat', label:'Threat', color: C.red },
                  { label:'Attack Path', color: C.red, dashed: true },
                  { label:'WS Attack Path', color: C.red, dashed: true, dot: true },
                ].map(s => (
                  <div key={s.status || s.label} style={{ display:'flex',alignItems:'center',gap:8,padding:'3px 0' }}>
                    {s.dashed ? (
                      s.dot ? (
                        <svg width="24" height="6"><line x1="0" y1="3" x2="24" y2="3" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" />
                          <circle cx="12" cy="3" r="2" fill={s.color} opacity="0.9" /></svg>
                      ) : (
                        <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" /></svg>
                      )
                    ) : (
                      <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }} />
                    )}
                    <span style={{ fontSize: 12, color: C.textSec }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Network topology */}
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            boxShadow: '0 1px 3px var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Live Topology</span>
              <span style={{ fontSize: 11, color: C.textSec }}>
                {nodes.length} nodes &middot; {edges.length} edges
              </span>
            </div>
            <div ref={containerRef} style={{ position:'relative', marginTop: 12, padding: '0 8px 12px' }}>
              <NetworkTopologySVG nodes={nodes} edges={allEdges} dynamicEdges={dynamicEdges} width={svgDims.width} height={svgDims.height} C={C as any} />
            </div>
          </div>
        </section>

        {/* Section 2: Flow Table */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
          boxShadow: '0 1px 3px var(--shadow-sm)',
          marginBottom: 20, overflow: 'hidden',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
            }}>Active Flow Table</span>
            <span style={{ fontSize: 11, color: C.textSec }}>
              {allEdges.length} flows &middot; {fmt(totalFlows)} total packets
            </span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surfaceHi }}>
                  {['Source','Destination','Status','Packets','Bytes','Direction'].map(h => (
                    <th key={h} style={{
                      padding:'10px 14px',textAlign:'left',fontSize:10,fontWeight:600,
                      letterSpacing:'0.8px',color:C.textSec,fontFamily:MONO,
                      textTransform:'uppercase',whiteSpace:'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {edges.map((edge,idx) => {
                  const srcN = nodeMapRef.current.get(edge.source);
                  const tgtN = nodeMapRef.current.get(edge.target);
                  const sc = edge.status==='attack'?C.red:edge.status==='suspicious'?C.amber:C.green;
                  const fresh = idx < 3;
                  const rowBg = fresh && edge.status==='attack' ? `var(--color-danger-dim)` : (idx % 2 === 0 ? 'transparent' : C.surfaceHi);
                  return (
                    <tr key={edge.id} style={{
                      borderBottom: `1px solid ${C.border}25`,
                      background: rowBg,
                      transition:`background 0.15s ${EASE}`,
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--table-hover-bg)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background=rowBg;}}
                    >
                      <td style={{ padding:'10px 14px',fontSize:12,fontFamily:MONO,color:C.accent,fontVariantNumeric:'tabular-nums', fontWeight: 500 }}>
                        {srcN?.label ?? edge.source}
                      </td>
                      <td style={{ padding:'10px 14px',fontSize:12,fontFamily:MONO,color:C.textSec }}>
                        {tgtN?.label ?? edge.target}
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{
                          display:'inline-flex',alignItems:'center',gap:5,
                          padding:'2px 10px',borderRadius:5,fontSize:10,fontWeight:600,
                          letterSpacing:'0.5px',color:sc,background:`${sc}12`,
                          border:`1px solid ${sc}25`,fontFamily:MONO,textTransform:'uppercase',
                        }}>
                          {edge.status==='attack' && <span style={{width:4,height:4,borderRadius:'50%',background:sc,animation:'wt-pulse 1.6s ease-in-out infinite'}} />}
                          {edge.status}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px',fontSize:12,fontFamily:MONO,color:C.text,fontVariantNumeric:'tabular-nums' }}>{fmt(edge.packets)}</td>
                      <td style={{ padding:'10px 14px',fontSize:12,fontFamily:MONO,color:C.textSec,fontVariantNumeric:'tabular-nums' }}>{fmtBytes(edge.bytes)}</td>
                      <td style={{ padding:'10px 14px',fontSize:12,fontFamily:MONO,letterSpacing:'0.3px' }}>
                        <span style={{color:C.accent, fontWeight: 500}}>Ingress</span>
                        {' → '}
                        <span style={{color:C.purple, fontWeight: 500}}>Egress</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Source Assessment + Performance */}
        <section style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">
          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            boxShadow: '0 1px 3px var(--shadow-sm)', overflow: 'hidden',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Source Assessment</span>
              <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                {nodes.filter(n=>n.type==='source'&&n.status==='threat').length} compromised
              </span>
            </div>
            <div style={{ padding: '14px 20px', display:'flex',flexDirection:'column',gap:5 }}>
              {nodes.filter(n=>n.type==='source').map(node => {
                const sc = node.status==='threat'?C.red:node.status==='suspicious'?C.amber:C.green;
                return (
                  <div key={node.id} style={{
                    display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
                    border:`1px solid ${C.border}`,borderRadius:6,
                    transition:`border-color 0.2s ${EASE}, background 0.2s ${EASE}`,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${sc}40`;e.currentTarget.style.background=`${sc}06`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;e.currentTarget.style.background='transparent';}}
                  >
                    <div style={{ width:7,height:7,borderRadius:'50%',background:sc,flexShrink:0 }} />
                    <span style={{ fontSize:12,fontFamily:MONO,color:C.text,flex:1,fontVariantNumeric:'tabular-nums', fontWeight: 500 }}>{node.ip}</span>
                    <span style={{ fontSize:10,fontWeight:600,letterSpacing:'0.5px',color:sc,textTransform:'uppercase' }}>{node.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{
            background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
            boxShadow: '0 1px 3px var(--shadow-sm)', overflow: 'hidden',
          }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Network Performance</span>
              <span style={{ fontSize: 11, color: C.textSec }}>Target: 50K flows/s</span>
            </div>
            <div style={{ padding: '16px 20px', display:'flex', flexDirection:'column',gap:16 }}>
              {[
                { label:'Ingress throughput', value:'34.2K flows/s', pct:68, color:C.accent },
                { label:'Egress throughput', value:'28.7K flows/s', pct:57, color:C.purple },
                { label:'Enclave utilization', value:'72%', pct:72, color:C.amber },
                { label:'Processing latency', value:'8ms p99', pct:8, color:C.green },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                    <span style={{ fontSize:12,color:C.textSec, letterSpacing:'0.2px' }}>{m.label}</span>
                    <span style={{ fontSize:12,fontWeight:600,color:C.text,fontVariantNumeric:'tabular-nums', fontFamily: MONO }}>{m.value}</span>
                  </div>
                  <div style={{ height:4, background: C.border, borderRadius:2, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', width:`${m.pct}%`, background:m.color, borderRadius:2,
                      transition:'width 1s cubic-bezier(0.22,1,0.36,1)', opacity: 0.8,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding:'20px 0', borderTop: `1px solid ${C.border}`,
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,
        }}>
          <span style={{ fontSize:11,color:C.textDim }}>
            EKADHARA v3.2.1 &middot; EKADHARA &middot; NTRO SIH26
          </span>
          <span style={{ fontSize:11,color:C.textDim,fontVariantNumeric:'tabular-nums' }}>
            {nodes.length} nodes &middot; {edges.length} flows &middot; {fmt(totalFlows)} packets
          </span>
        </footer>
      </main>
    </div>
  );
};

export default NetworkMap;
