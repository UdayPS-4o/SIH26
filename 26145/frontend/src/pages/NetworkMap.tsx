import { useState, useEffect, useMemo, useRef } from 'react';

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
   ATOMIC COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

const SH: React.FC<{ label:string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily: MONO, fontSize: 11, fontWeight: 600,
      letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

const Panel: React.FC<{ delay?:number; style?:React.CSSProperties; children:React.ReactNode }> = ({ delay=0, style, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
      opacity:ready?1:0, transform:ready?'translateY(0)':'translateY(8px)',
      transition:`opacity 0.4s ${EASE} ${delay}s, transform 0.4s ${EASE} ${delay}s`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      ...style,
    }}>
      <div style={{ padding:'20px 24px' }}>{children}</div>
    </div>
  );
};

const Sev: React.FC<{ sev:string }> = ({ sev }) => {
  const M: Record<string,{c:string;bg:string}> = {
    critical:{c:C.red,bg:'rgba(239,68,68,0.08)'},
    high:{c:C.orange,bg:'rgba(249,115,22,0.08)'},
    medium:{c:C.amber,bg:'rgba(234,179,8,0.08)'},
    low:{c:'var(--accent-cyan)',bg:'rgba(6,182,212,0.06)'},
  };
  const s = M[sev] || M.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap: 5,
      padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.8px', color: s.c, background: s.bg, border: `1px solid ${s.c}30`,
      fontFamily: MONO, textTransform: 'uppercase',
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

  const attackPaths: [number, number][] = [[10,2],[11,3],[12,0]];
  attackPaths.forEach(([si, di], idx) => {
    edges.push({
      id:`attack-${idx}`, source:`src-${si}`, target:`dst-${di}`,
      status:'attack', packets:45_000+idx*15_000, bytes:2_400_000+idx*800_000,
    });
  });

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

  const statusColors: Record<string,{fill:string;stroke:string}> = {
    benign:    { fill: `${C.green}12`, stroke: C.green },
    suspicious:{ fill: `${C.amber}12`, stroke: C.amber },
    threat:    { fill: `${C.red}12`,   stroke: C.red },
  };

  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      {/* Grid */}
      <pattern id="nwSm" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke={C.border} strokeWidth="0.4" opacity="0.4" />
      </pattern>
      <pattern id="nwBg" width="120" height="120" patternUnits="userSpaceOnUse">
        <rect width="120" height="120" fill="url(#nwSm)" />
        <path d="M 120 0 L 0 0 0 120" fill="none" stroke={C.border} strokeWidth="0.8" opacity="0.3" />
      </pattern>
      <rect width={width} height={height} fill={C.bg} />
      <rect width={width} height={height} fill="url(#nwBg)" />

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
            {isAttack && (
              <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={C.red} strokeWidth={4} opacity={0.06} />
            )}
            <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={eColor} strokeWidth={isAttack?1.5:isSusp?1:0.6}
              strokeDasharray={isAttack?'8 4':isSusp?'5 3':'none'}
              strokeLinecap="round" opacity={eOpacity} />
            {isAttack && (
              <circle r={2.5} fill={C.red} opacity={0.7}>
                <animateMotion dur="2s" repeatCount="indefinite" path={`M${src.x},${src.y} L${tgt.x},${tgt.y}`} />
                <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        );
      })}

      {/* Nodes */}
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
                fill={C.accent} fontSize="12" fontFamily={MONO} fontWeight="700" opacity={0.9}>{'◈'}</text>
            )}
            {/* Label */}
            <text x={node.x} y={node.y+r+14} textAnchor="middle"
              fill={isHov?C.text: C.textSec} fontSize={isEnclave?9:8} fontFamily={MONO}
              fontWeight={node.status==='threat'?'600':isEnclave?'600':'400'} opacity={isHov?1:0.8}>
              {node.label.length>14?node.label.slice(0,12)+'…':node.label}
            </text>
            <text x={node.x} y={node.y+r+24} textAnchor="middle"
              fill={C.textDim} fontSize="7" fontFamily={MONO} opacity={0.7}>{node.ip}</text>
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

  useEffect(() => {
    nodeMapRef.current = new Map(nodes.map(n => [n.id, {label:n.label, ip:n.ip, status:n.status}]));
  }, [nodes]);

  const totalFlows = useMemo(() => edges.reduce((s,e) => s + e.packets, 0), [edges]);
  const blockedConns = useMemo(() => edges.filter(e=>e.status==='attack').reduce((s,e) => s + e.packets, 0), [edges]);
  const activeThreats = useMemo(() => edges.filter(e=>e.status==='attack').length, [edges]);

  const attackEdges = useMemo(() => edges.filter(e=>e.status==='attack'), [edges]);
  const suspEdges = useMemo(() => edges.filter(e=>e.status==='suspicious'), [edges]);

  const statCards = [
    { label:'Total Flows', value: fmt(totalFlows), color: C.accent },
    { label:'Blocked Conns', value: fmt(blockedConns), color: C.red },
    { label:'Active Threats', value: String(activeThreats), color: C.orange },
  ];

  return (
    <div style={{ minHeight:'100%', background: C.bg, color: C.text, fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6 }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        ::selection { background:rgba(0,212,255,0.12); color:${C.text}; }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.4); outline-offset:2px; border-radius:3px; }
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
              background:`${C.accent}10`,border:`1px solid ${C.accent}25`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.8">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color:C.text,fontVariantNumeric:'tabular-nums' }}>
              WATCHTOWER
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
          <p style={{ fontSize: 13, color: C.textSec, maxWidth: 640, lineHeight: 1.65, margin: 0 }}>
            Real-time visualization of flow topology across the enclave. {nodes.filter(n=>n.type==='source').length} source segments connected to {nodes.filter(n=>n.type==='dest').length} destination clusters. Attack paths highlighted with animated indicators.
          </p>
        </section>

        {/* Section 1: Stats sidebar + Network Topology */}
        <section style={{ display:'grid',gridTemplateColumns:'240px 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">

          {/* Stats sidebar */}
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {statCards.map((s, i) => (
              <Panel key={i} delay={0.05 + i * 0.05}>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.textSec, letterSpacing:'0.5px', textTransform:'uppercase', marginBottom: 6 }}>{s.label}</div>
                <div style={{
                  fontSize: 28, fontWeight: 700, color: s.color,
                  fontFamily: MONO, letterSpacing: '-0.5px', lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}>{s.value}</div>
              </Panel>
            ))}

            <Panel delay={0.2}>
              <SH label="Traffic Volume" />
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
            </Panel>

            <Panel delay={0.25}>
              <SH label="Legend" />
              <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
                {[
                  { status:'benign', label:'Benign', color: C.green },
                  { status:'suspicious', label:'Suspicious', color: C.amber },
                  { status:'threat', label:'Threat', color: C.red },
                  { label:'Attack Path', color: C.red, dashed: true },
                ].map(s => (
                  <div key={s.status || s.label} style={{ display:'flex',alignItems:'center',gap:8,padding:'4px 0' }}>
                    {s.dashed ? (
                      <svg width="24" height="4"><line x1="0" y1="2" x2="24" y2="2" stroke={s.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.7" /></svg>
                    ) : (
                      <div style={{ width:8,height:8,borderRadius:'50%',background:s.color,flexShrink:0 }} />
                    )}
                    <span style={{ fontSize: 12, color: C.textSec }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {/* Network topology */}
          <Panel delay={0.05}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 0, paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Live Topology</span>
              <span style={{ fontSize: 11, color: C.textSec }}>
                {nodes.length} nodes &middot; {edges.length} edges
              </span>
            </div>
            <div ref={containerRef} style={{ position:'relative', marginTop: 12 }}>
              <NetworkTopologySVG nodes={nodes} edges={edges} width={svgDims.width} height={svgDims.height} />
            </div>
          </Panel>
        </section>

        {/* Section 2: Flow Table */}
        <Panel delay={0.25} style={{ marginBottom: 20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom: 12, marginBottom: 0, borderBottom: `1px solid ${C.border}` }}>
            <span style={{
              fontFamily: MONO, fontSize: 11, fontWeight: 600,
              letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
            }}>Active Flow Table</span>
            <span style={{ fontSize: 11, color: C.textSec }}>
              {edges.length} flows &middot; {fmt(totalFlows)} total packets
            </span>
          </div>
          <div style={{ overflowX:'auto', marginTop: 0 }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  {['Source','Destination','Status','Packets','Bytes','Direction'].map(h => (
                    <th key={h} style={{
                      padding:'9px 14px',textAlign:'left',fontSize:10,fontWeight:600,
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
                  const rowBg = fresh && edge.status==='attack' ? `${C.red}05` : (idx % 2 === 0 ? 'transparent' : `${C.accent}01`);
                  return (
                    <tr key={edge.id} style={{
                      borderBottom: `1px solid ${C.border}25`,
                      background: rowBg,
                      animation:`wt-row-in 0.3s ${EASE} ${idx*0.015}s both`,
                      transition:`background 0.15s ${EASE}`,
                    }}
                      onMouseEnter={e=>{e.currentTarget.style.background=`${C.accent}05`;}}
                      onMouseLeave={e=>{e.currentTarget.style.background=rowBg;}}
                    >
                      <td style={{ padding:'9px 14px',fontSize:12,fontFamily:MONO,color:C.accent,fontVariantNumeric:'tabular-nums', fontWeight: 500 }}>
                        {srcN?.label ?? edge.source}
                      </td>
                      <td style={{ padding:'9px 14px',fontSize:12,fontFamily:MONO,color:C.textSec }}>
                        {tgtN?.label ?? edge.target}
                      </td>
                      <td style={{ padding:'9px 14px' }}>
                        <span style={{
                          display:'inline-flex',alignItems:'center',gap:5,
                          padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600,
                          letterSpacing:'0.5px',color:sc,background:`${sc}10`,
                          border:`1px solid ${sc}25`,fontFamily:MONO,textTransform:'uppercase',
                        }}>
                          {edge.status==='attack' && <span style={{width:4,height:4,borderRadius:'50%',background:sc,animation:'wt-pulse 1.6s ease-in-out infinite'}} />}
                          {edge.status}
                        </span>
                      </td>
                      <td style={{ padding:'9px 14px',fontSize:12,fontFamily:MONO,color:C.text,fontVariantNumeric:'tabular-nums' }}>{fmt(edge.packets)}</td>
                      <td style={{ padding:'9px 14px',fontSize:12,fontFamily:MONO,color:C.textSec,fontVariantNumeric:'tabular-nums' }}>{fmtBytes(edge.bytes)}</td>
                      <td style={{ padding:'9px 14px',fontSize:12,fontFamily:MONO,letterSpacing:'0.3px' }}>
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
        </Panel>

        {/* Section 3: Source Assessment + Performance */}
        <section style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }} className="wt-grid-aside">
          <Panel delay={0.3}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Source Assessment</span>
              <span style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>
                {nodes.filter(n=>n.type==='source'&&n.status==='threat').length} compromised
              </span>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
              {nodes.filter(n=>n.type==='source').map(node => {
                const sc = node.status==='threat'?C.red:node.status==='suspicious'?C.amber:C.green;
                return (
                  <div key={node.id} style={{
                    display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
                    border:`1px solid ${C.border}`,borderRadius:6,
                    transition:`border-color 0.2s ${EASE}`,
                  }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor=`${sc}40`;}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor=C.border;}}
                  >
                    <div style={{ width:7,height:7,borderRadius:'50%',background:sc,flexShrink:0 }} />
                    <span style={{ fontSize:12,fontFamily:MONO,color:C.text,flex:1,fontVariantNumeric:'tabular-nums', fontWeight: 500 }}>{node.ip}</span>
                    <span style={{ fontSize:10,fontWeight:600,letterSpacing:'0.5px',color:sc,textTransform:'uppercase' }}>{node.status}</span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel delay={0.35}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingBottom: 12, marginBottom: 14, borderBottom: `1px solid ${C.border}` }}>
              <span style={{
                fontFamily: MONO, fontSize: 11, fontWeight: 600,
                letterSpacing: '2px', color: C.accent, textTransform: 'uppercase',
              }}>Network Performance</span>
              <span style={{ fontSize: 11, color: C.textSec }}>Target: 50K flows/s</span>
            </div>
            <div style={{ display:'flex', flexDirection:'column',gap:16 }}>
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
          </Panel>
        </section>

        {/* Footer */}
        <footer style={{
          padding:'20px 0', borderTop: `1px solid ${C.border}`,
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,
        }}>
          <span style={{ fontSize:11,color:C.textDim }}>
            WATCHTOWER v3.2.1 &middot; EKADHARA &middot; NTRO SIH26
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
