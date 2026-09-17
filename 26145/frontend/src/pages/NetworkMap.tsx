import { useState, useEffect, useMemo, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════════════
   WATCHTOWER — Network Map
   Dark ops center. Exact theme match with Dashboard.tsx.
   ═══════════════════════════════════════════════════════════════════════════════════ */

const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  surfaceHi: 'var(--bg-card-hover)',
  border:    'var(--border-color)',
  borderHi:  'var(--border-active)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--accent-cyan)',
  red:       'var(--accent-red)',
  orange:    'var(--accent-orange)',
  amber:     'var(--accent-yellow)',
  green:     'var(--accent-green)',
  purple:    'var(--accent-purple)',
  pink:      'var(--accent-pink)',
  teal:      'var(--accent-teal)',
};
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MONO = '"JetBrains Mono","Fira Code",monospace';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtBytes = (b: number) => {
  if (b >= 1e9) return `${(b/1e9).toFixed(1)} GB`;
  if (b >= 1e6) return `${(b/1e6).toFixed(1)} MB`;
  if (b >= 1e3) return `${(b/1e3).toFixed(0)} KB`;
  return `${b} B`;
};
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
const now = () => new Date().toLocaleTimeString('en-US', { hour12:false });

/* ═══════════════════════════════════════════════════════════════════════════════════
   ATOMIC COMPONENTS (identical to Dashboard.tsx)
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Dot: React.FC<{ color?: string; size?: number }> = ({ color = C.green, size = 6 }) => (
  <span style={{
    width:size, height:size, borderRadius:'50%', background:color,
    boxShadow:`0 0 ${size}px ${color}60`,
    animation:`wt-pulse 1.6s ease-in-out infinite`,
    display:'inline-block', flexShrink:0,
  }} />
);

const SH: React.FC<{ label:string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'baseline', justifyContent:'space-between',
    paddingBottom:10, marginBottom:14, borderBottom:`1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily:MONO, fontSize:10, fontWeight:700,
      letterSpacing:'2.5px', color:C.accent, textTransform:'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

const Panel: React.FC<{ delay?:number; style?:React.CSSProperties; children:React.ReactNode }> = ({ delay=0, style, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
      position:'relative', overflow:'hidden',
      opacity:ready?1:0, transform:ready?'translateY(0)':'translateY(12px)',
      transition:`opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
      ...style,
    }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.accent}30,transparent)` }} />
      <div style={{ padding:'20px 22px', position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
};

const Progress: React.FC<{ value:number; max?:number; color?:string }> = ({ value, max=100, color=C.accent }) => {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{ height:4, background:'var(--bg-secondary)', borderRadius:2, border:`1px solid ${C.border}`, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${pct}%`, background:color, opacity:0.65,
        borderRadius:1, transition:'width 1s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  );
};

const Sev: React.FC<{ sev:string }> = ({ sev }) => {
  const M: Record<string,{c:string;bg:string}> = {
    critical:{c:C.red,bg:'rgba(239,68,68,0.10)'},
    high:{c:C.orange,bg:'rgba(249,115,22,0.10)'},
    medium:{c:C.amber,bg:'rgba(234,179,8,0.10)'},
    low:{c:'var(--accent-cyan)',bg:'rgba(6,182,212,0.10)'},
  };
  const s = M[sev] || M.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
      letterSpacing:'1px', color:s.c, background:s.bg, border:`1px solid ${s.c}25`,
      fontFamily:MONO, textTransform:'uppercase',
    }}>
      <span style={{width:4,height:4,borderRadius:'50%',background:s.c}} />
      {sev}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   MOCK DATA
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
}

function buildTopology(W: number, H: number) {
  const nodes: NetNode[] = [];
  const edges: NetEdge[] = [];

  // Enclave — center
  nodes.push({ id:'enclave', label:'ENCLAVE', ip:'10.0.0.1', type:'enclave', status:'benign', x:W/2, y:H/2 });

  // 15 source IPs — left side, arranged 3 rows x 5 cols
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

  // 5 destination clusters — right side
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

  // 3 active attack paths: sources 10,11,12 → destinations 2,3,0
  const attackPaths: [number, number][] = [[10,2],[11,3],[12,0]];
  attackPaths.forEach(([si, di], idx) => {
    edges.push({
      id:`attack-${idx}`, source:`src-${si}`, target:`dst-${di}`,
      status:'attack', packets:45_000+idx*15_000, bytes:2_400_000+idx*800_000,
    });
  });

  // Normal/suspicious flows from remaining sources
  for (let i = 0; i < 15; i++) {
    if (attackPaths.some(([s]) => s === i)) continue;
    const di = (i + 1) % 5;
    edges.push({
      id:`norm-s${i}`, source:`src-${i}`, target:`dst-${di}`,
      status: srcStatuses[i] === 'suspicious' ? 'suspicious' : 'normal',
      packets: 2000 + Math.floor(Math.random()*8000),
      bytes: 100_000 + Math.floor(Math.random()*500_000),
    });
  }

  // Enclave → all destinations
  for (let i = 0; i < 5; i++) {
    edges.push({
      id:`enclave-d${i}`, source:'enclave', target:`dst-${i}`,
      status:'normal', packets:8000+i*2000, bytes:400_000+i*100_000,
    });
  }

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   SVG NETWORK TOPOLOGY
   ═══════════════════════════════════════════════════════════════════════════════════ */

function NetworkTopologySVG({ nodes, edges, width, height }: { nodes:NetNode[]; edges:NetEdge[]; width:number; height:number }) {
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

  const statusColors: Record<string,{fill:string;stroke:string;label:string}> = {
    benign:    { fill:`${C.green}18`,   stroke:C.green,   label:C.green },
    suspicious:{ fill:`${C.amber}18`,   stroke:C.amber,   label:C.amber },
    threat:    { fill:`${C.red}18`,     stroke:C.red,     label:C.red },
  };

  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <defs>
        <filter id="attGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* Grid */}
      <pattern id="nwSm" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke={C.border} strokeWidth="0.4" opacity="0.3" />
      </pattern>
      <pattern id="nwBg" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="url(#nwSm)" />
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke={C.border} strokeWidth="0.8" opacity="0.2" />
      </pattern>
      <rect width={width} height={height} fill={C.bg} />
      <rect width={width} height={height} fill="url(#nwBg)" />

      {/* Zone labels */}
      <text x={70} y={16} textAnchor="middle" fill={C.textDim} fontSize="8" fontFamily={MONO} fontWeight="700" letterSpacing="1.5">
        SOURCE IPS
      </text>
      <text x={width/2} y={16} textAnchor="middle" fill={C.accent} fontSize="8" fontFamily={MONO} fontWeight="700" letterSpacing="1.5">
        ENCLAVE
      </text>
      <text x={width-100} y={16} textAnchor="middle" fill={C.textDim} fontSize="8" fontFamily={MONO} fontWeight="700" letterSpacing="1.5">
        DEST CLUSTERS
      </text>

      {/* Edges */}
      {edges.map(edge => {
        const src = nodeMap.get(edge.source);
        const tgt = nodeMap.get(edge.target);
        if (!src || !tgt) return null;
        const isAttack = edge.status === 'attack';
        const isSusp = edge.status === 'suspicious';
        const eColor = isAttack ? C.red : isSusp ? C.amber : `${C.accent}30`;
        const eOpacity = isAttack ? 0.7 : isSusp ? 0.4 : 0.18;

        return (
          <g key={edge.id}>
            {isAttack && (
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={C.red} strokeWidth={5} opacity={0.1} filter="url(#softGlow)" />
            )}
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={eColor}
              strokeWidth={isAttack?2:isSusp?1.2:0.7}
              strokeDasharray={isAttack?'10 5':isSusp?'6 4':'none'}
              className={isAttack?'flow-attack':isSusp?'flow-suspicious':'flow-normal'}
              strokeLinecap="round" opacity={eOpacity} />
            {isAttack && (
              <circle r={3} fill={C.red} opacity={0.8} filter="url(#attGlow)">
                <animateMotion dur="2s" repeatCount="indefinite" path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`} />
                <animate attributeName="opacity" values="0.3;0.9;0.3" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const isEnclave = node.type === 'enclave';
        const isHov = node.id === hovered;
        const sc = isEnclave ? {fill:`${C.accent}15`,stroke:C.accent,label:C.accent} : statusColors[node.status];
        const r = isEnclave ? 20 : node.type==='dest' ? 14 : 10;
        const pulse = node.status === 'threat' ? 1 + 0.1*Math.sin(t*4 + node.id.charCodeAt(4)) : 1;
        const fr = r * (isEnclave ? 1 + 0.04*Math.sin(t*2) : pulse);

        return (
          <g key={node.id}
            onMouseEnter={() => setHovered(node.id)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor:'pointer' }}>
            {/* Glow */}
            {(node.status==='threat'||isEnclave) && (
              <circle cx={node.x} cy={node.y} r={fr*2.5}
                fill={isEnclave?`${C.accent}10`:`${C.red}12`}
                filter={isEnclave?'url(#attGlow)':'url(#softGlow)'}>
                {node.status==='threat' && (
                  <animate attributeName="opacity" values="0.15;0.4;0.15" dur="2s" repeatCount="indefinite" />
                )}
              </circle>
            )}
            {/* Threat ring */}
            {node.status==='threat' && (
              <circle cx={node.x} cy={node.y} r={fr+4} fill="none"
                stroke={C.red} strokeWidth={2} opacity="0.8"
                strokeDasharray={`${0.4*2*Math.PI*(fr+4)} ${2*Math.PI*(fr+4)}`}
                strokeLinecap="round" transform={`rotate(-90 ${node.x} ${node.y})`}>
                <animateTransform attributeName="transform" type="rotate"
                  from={`-90 ${node.x} ${node.y}`} to={`270 ${node.x} ${node.y}`}
                  dur="4s" repeatCount="indefinite" />
              </circle>
            )}
            {/* Hover ring */}
            {isHov && (
              <circle cx={node.x} cy={node.y} r={fr+7} fill="none"
                stroke={C.text} strokeWidth={1} opacity={0.35} />
            )}
            {/* Node body */}
            <circle cx={node.x} cy={node.y} r={fr}
              fill={sc.fill} stroke={isHov?C.text:sc.stroke}
              strokeWidth={isHov?2.5:isEnclave?2:1.5}
              filter={node.status==='threat'?'url(#attGlow)':isEnclave?'url(#attGlow)':undefined} />
            {/* Enclave pattern */}
            {isEnclave && (
              <circle cx={node.x} cy={node.y} r={fr*0.5}
                fill="none" stroke={C.accent} strokeWidth={1.5} opacity="0.4" />
            )}
            {/* Inner dot */}
            <circle cx={node.x} cy={node.y} r={fr*0.3}
              fill={isEnclave?`${C.accent}50`:`${sc.stroke}40`} />
            {/* Enclave symbol */}
            {isEnclave && (
              <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="central"
                fill={C.accent} fontSize="14" fontFamily={MONO} fontWeight="700" opacity={0.9}>◈</text>
            )}
            {/* Label */}
            <text x={node.x} y={node.y+fr+14} textAnchor="middle"
              fill={isHov?C.text:sc.label} fontSize={isEnclave?10:9} fontFamily={MONO}
              fontWeight={node.status==='threat'?'700':isEnclave?'700':'400'}
              opacity={isHov?1:0.85}>
              {node.label.length>14?node.label.slice(0,12)+'…':node.label}
            </text>
            <text x={node.x} y={node.y+fr+25} textAnchor="middle"
              fill={C.textSec} fontSize="8" fontFamily={MONO} opacity="0.6">{node.ip}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   MAIN NetworkMap COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════════ */

const NetworkMap: React.FC = () => {
  const [clock, setClock] = useState(now());
  const [svgDims, setSvgDims] = useState({ width:900, height:480 });
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeMapRef = useRef<Map<string,{label:string;ip:string;status:string}>>(new Map());

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

  const { nodes, edges } = useMemo(() => buildTopology(svgDims.width, svgDims.height), [svgDims.width, svgDims.height]);

  // Build node map
  useEffect(() => {
    nodeMapRef.current = new Map(nodes.map(n => [n.id, {label:n.label, ip:n.ip, status:n.status}]));
  }, [nodes]);

  const totalFlows = useMemo(() => edges.reduce((s,e) => s + e.packets, 0), [edges]);
  const blockedConns = useMemo(() => edges.filter(e=>e.status==='attack').reduce((s,e) => s + e.packets, 0), [edges]);
  const activeThreats = useMemo(() => edges.filter(e=>e.status==='attack').length, [edges]);

  const attackEdges = useMemo(() => edges.filter(e=>e.status==='attack'), [edges]);
  const suspEdges = useMemo(() => edges.filter(e=>e.status==='suspicious'), [edges]);

  return (
    <div style={{ minHeight:'100%', background:C.bg, color:C.text, fontFamily:MONO, fontSize:12, lineHeight:1.5 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0;transform:translateX(-6px);} to{opacity:1;transform:translateX(0);} }
        @keyframes flow-attack { to { stroke-dashoffset: -30; } }
        @keyframes flow-suspicious { to { stroke-dashoffset: -20; } }
        .flow-attack { stroke-dasharray: 10 5; animation: flow-attack 0.8s linear infinite; }
        .flow-suspicious { stroke-dasharray: 6 4; animation: flow-suspicious 2s linear infinite; }
        ::selection { background:rgba(0,212,255,0.15); color:${C.text}; }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.5); outline-offset:2px; border-radius:2px; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:3px; }
        .wt-interactive { transition:transform 160ms cubic-bezier(0.22,1,0.36,1), background 0.2s; }
        .wt-interactive:active { transform:scale(0.98); }
        a { color:inherit; text-decoration:none; }
        @media (max-width:1024px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
        @media (max-width:768px) { .wt-grid-aside { grid-template-columns:1fr !important; } }
        @media (max-width:480px) {
          header>div { padding:0 14px !important; gap:8px !important; }
          main { padding:20px 14px 60px !important; }
        }
      `}</style>

      {/* ── STICKY HUD BAR ─────────────────────────────────────────────── */}
      <header style={{
        position:'sticky',top:0,zIndex:40,
        background:'rgba(5,8,13,0.94)',
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth:1480,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height:48,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:26,height:26,borderRadius:5,
              background:`linear-gradient(135deg,${C.accent}18,${C.accent}06)`,
              border:`1px solid ${C.accent}30`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize:13,fontWeight:800,letterSpacing:'4px',color:C.text,fontVariantNumeric:'tabular-nums' }}>
              WATCHTOWER
            </span>
          </div>
          <div style={{ width:1,height:18,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>
            PS-26145 · NETWORK MAP
          </span>
          <div style={{ flex:1 }} />
          <span style={{ fontSize:11,color:C.textSec,letterSpacing:'0.8px',fontVariantNumeric:'tabular-nums' }}>{clock}</span>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN ────────────────────────────────────────────── */}
      <main style={{ maxWidth:1480,margin:'0 auto',padding:'28px 28px 80px' }}>

        {/* Hero context */}
        <section style={{ marginBottom:32 }}>
          <h1 style={{ fontSize:13,fontWeight:700,letterSpacing:'2.5px',color:C.accent,marginBottom:8 }}>
            Network Topology — Live Traffic Map
          </h1>
          <p style={{ fontSize:13,color:C.textSec,maxWidth:720,lineHeight:1.75,margin:0 }}>
            Real-time visualization of flow topology across the enclave. Enclave node monitors
            bidirectional streams between {nodes.filter(n=>n.type==='source').length} source segments and
            {nodes.filter(n=>n.type==='dest').length} destination clusters. Attack paths highlighted with
            animated indicators. Passive observation only.
          </p>
        </section>

        {/* Section 1: Stats sidebar + Network Topology */}
        <section style={{ display:'grid',gridTemplateColumns:'260px 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">

          {/* Stats sidebar */}
          <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
            <Panel delay={0.05}>
              <SH label="Flow Stats" />
              <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                {[
                  { label:'Total Flows', value:fmt(totalFlows), color:C.accent },
                  { label:'Blocked Conns', value:fmt(blockedConns), color:C.red },
                  { label:'Active Threats', value:String(activeThreats), color:C.orange },
                ].map((s,i) => (
                  <div key={i} style={{
                    padding:'14px 16px', border:`1px solid ${C.border}`, borderRadius:5,
                    background:'rgba(255,255,255,0.008)',
                    transition:`border-color 0.2s ${EASE}`,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${s.color}40`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}
                  >
                    <div style={{ fontSize:9,fontWeight:700,letterSpacing:'1.2px',color:C.textSec,marginBottom:6 }}>{s.label}</div>
                    <div style={{
                      fontSize:26,fontWeight:800,color:s.color,
                      fontFamily:MONO,letterSpacing:'-0.5px',lineHeight:1.1,
                      fontVariantNumeric:'tabular-nums',
                    }}>{s.value}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel delay={0.1}>
              <SH label="Traffic Volume" />
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {[
                  { label:'Total Transferred', value:fmtBytes(edges.reduce((s,e)=>s+e.bytes,0)), color:C.green },
                  { label:'Attack Traffic', value:fmtBytes(attackEdges.reduce((s,e)=>s+e.bytes,0)), color:C.red },
                  { label:'Connections', value:fmt(edges.length), color:C.purple },
                ].map((s,i) => (
                  <div key={i} style={{
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    padding:'7px 0', borderBottom:i<2?`1px solid ${C.border}`:'none',
                  }}>
                    <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.3px' }}>{s.label}</span>
                    <span style={{ fontSize:11,fontWeight:700,color:s.color,fontVariantNumeric:'tabular-nums' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel delay={0.15}>
              <SH label="Source Breakdown" />
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                {[
                  { status:'benign', label:'Benign', color:C.green },
                  { status:'suspicious', label:'Suspicious', color:C.amber },
                  { status:'threat', label:'Threat', color:C.red },
                ].map(s => {
                  const count = nodes.filter(n=>n.type==='source'&&n.status===s.status).length;
                  return (
                    <div key={s.status} style={{
                      display:'flex',alignItems:'center',gap:8,padding:'6px 10px',
                      border:`1px solid ${C.border}`,borderRadius:4,
                    }}>
                      <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,boxShadow:`0 0 6px ${s.color}50`,flexShrink:0 }} />
                      <span style={{ fontSize:10,color:C.textSec,textTransform:'capitalize',flex:1 }}>{s.label}</span>
                      <span style={{ fontSize:11,fontWeight:700,color:s.color,fontVariantNumeric:'tabular-nums' }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>

            <Panel delay={0.2}>
              <SH label="Dest Clusters" />
              <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                {nodes.filter(n=>n.type==='dest').map(node => {
                  const c = node.status==='threat'?C.red:node.status==='suspicious'?C.amber:C.green;
                  return (
                    <div key={node.id} style={{
                      display:'flex',alignItems:'center',gap:8,padding:'5px 10px',
                    }}>
                      <div style={{ width:6,height:6,borderRadius:2,background:c,opacity:0.7 }} />
                      <span style={{ fontSize:10,color:C.textSec,flex:1 }}>{node.label}</span>
                      <span style={{ fontSize:9,color:C.textDim,fontFamily:MONO }}>{node.ip}</span>
                    </div>
                  );
                })}
              </div>
            </Panel>
          </div>

          {/* Network topology */}
          <Panel delay={0.05}>
            <SH label="Live Topology" right={
              <span style={{ fontSize:9,color:C.textSec }}>
                {nodes.length} NODES · {edges.length} EDGES
              </span>
            } />
            <div ref={containerRef} style={{ position:'relative' }}>
              <NetworkTopologySVG nodes={nodes} edges={edges} width={svgDims.width} height={svgDims.height} />
            </div>
          </Panel>
        </section>

        {/* Section 2: Flow Table */}
        <Panel delay={0.25} style={{ marginBottom:20 }}>
          <SH label="Active Flow Table" right={
            <span style={{ fontSize:9,color:C.textSec }}>
              {edges.length} FLOWS · {fmt(totalFlows)} TOTAL PACKETS
            </span>
          } />
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:`1px solid ${C.border}`,background:'rgba(0,212,255,0.015)' }}>
                  {['Source','Destination','Status','Packets','Bytes','Direction'].map(h => (
                    <th key={h} style={{
                      padding:'9px 14px',textAlign:'left',fontSize:9,fontWeight:700,
                      letterSpacing:'1.2px',color:C.textSec,fontFamily:MONO,
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
                  return (
                    <tr key={edge.id} style={{
                      borderBottom:`1px solid ${C.border}`,
                      background: fresh && edge.status==='attack' ? 'rgba(239,68,68,0.025)' : 'transparent',
                      animation:`wt-row-in 0.35s ${EASE} ${idx*0.02}s both`,
                      transition:`background 0.15s ${EASE}`,
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${C.accent}04`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=fresh&&edge.status==='attack'?'rgba(239,68,68,0.025)':'transparent';}}
                    >
                      <td style={{ padding:'9px 14px',fontSize:11,fontFamily:MONO,color:C.accent,fontVariantNumeric:'tabular-nums' }}>
                        {srcN?.label ?? edge.source}
                      </td>
                      <td style={{ padding:'9px 14px',fontSize:11,fontFamily:MONO,color:C.textSec }}>
                        {tgtN?.label ?? edge.target}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{
                          display:'inline-flex',alignItems:'center',gap:5,
                          padding:'2px 8px',borderRadius:3,fontSize:9,fontWeight:700,
                          letterSpacing:'1px',color:sc,background:`${sc}0a`,
                          border:`1px solid ${sc}25`,fontFamily:MONO,textTransform:'uppercase',
                        }}>
                          {edge.status==='attack' && <span style={{width:4,height:4,borderRadius:'50%',background:sc,animation:'wt-pulse 1.6s ease-in-out infinite'}} />}
                          {edge.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding:'9px 14px',fontSize:11,fontFamily:MONO,color:C.text,fontVariantNumeric:'tabular-nums' }}>{fmt(edge.packets)}</td>
                      <td style={{ padding:'9px 14px',fontSize:11,fontFamily:MONO,color:C.textSec,fontVariantNumeric:'tabular-nums' }}>{fmtBytes(edge.bytes)}</td>
                      <td style={{ padding:'9px 14px',fontSize:11,fontFamily:MONO }}>
                        <span style={{color:C.accent}}>INGRESS</span>
                        {' → '}
                        <span style={{color:C.purple}}>EGRESS</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Section 3: Source Assessment + Performance */}
        <section style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">
          <Panel delay={0.3}>
            <SH label="Source Threat Assessment" right={
              <span style={{ fontSize:9,color:C.red }}>
                {nodes.filter(n=>n.type==='source'&&n.status==='threat').length} COMPROMISED
              </span>
            } />
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              {nodes.filter(n=>n.type==='source').map(node => {
                const sc = node.status==='threat'?C.red:node.status==='suspicious'?C.amber:C.green;
                return (
                  <div key={node.id} style={{
                    display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
                    border:`1px solid ${C.border}`,borderRadius:4,
                    transition:`border-color 0.2s ${EASE}`,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${sc}40`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}
                  >
                    <div style={{ width:8,height:8,borderRadius:'50%',background:sc,boxShadow:`0 0 6px ${sc}50`,flexShrink:0 }} />
                    <span style={{ fontSize:11,fontFamily:MONO,color:C.text,flex:1,fontVariantNumeric:'tabular-nums' }}>{node.ip}</span>
                    <span style={{ fontSize:9,fontWeight:700,letterSpacing:'0.8px',color:sc,textTransform:'uppercase' }}>{node.status}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel delay={0.35}>
            <SH label="Network Performance" right={
              <span style={{ fontSize:9,color:C.textSec }}>TARGET 50K FLOWS/S</span>
            } />
            <div style={{ display:'flex',flexDirection:'column',gap:14,paddingTop:2 }}>
              {[
                { label:'Ingress throughput', value:'34.2K flows/s', pct:68, color:C.accent },
                { label:'Egress throughput', value:'28.7K flows/s', pct:57, color:C.purple },
                { label:'Enclave utilization', value:'72%', pct:72, color:C.amber },
                { label:'Processing latency', value:'8ms p99', pct:8, color:C.green },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display:'flex',justifyContent:'space-between',marginBottom:5 }}>
                    <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.3px' }}>{m.label}</span>
                    <span style={{ fontSize:10,fontWeight:700,color:C.text,fontVariantNumeric:'tabular-nums' }}>{m.value}</span>
                  </div>
                  <Progress value={m.pct} max={100} color={m.color} />
                </div>
              ))}
            </div>
          </Panel>
        </section>

        {/* Footer */}
        <footer style={{
          padding:'24px 0',borderTop:`1px solid ${C.border}`,
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,
        }}>
          <span style={{ fontSize:9,color:C.textDim,letterSpacing:'1px' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:9,color:C.textDim,letterSpacing:'0.5px',fontVariantNumeric:'tabular-nums' }}>
            {nodes.length} NODES · {edges.length} FLOWS · {fmt(totalFlows)} PACKETS
          </span>
        </footer>
      </main>
    </div>
  );
};

export default NetworkMap;
