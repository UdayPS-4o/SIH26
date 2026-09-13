import { useState, useEffect, useRef, useCallback } from 'react';
import { Zap, Globe, Shield, AlertTriangle, Activity, Network, Link2 } from 'lucide-react';
import type { ThreatNode } from '../types';
import { MockBackend, mockBackend } from '../lib/mockBackend';

// ── Local canvas node (extends ThreatNode with rendering fields) ──────────

interface CanvasNode extends ThreatNode {
  pulsePhase: number;
}

interface CanvasEdge {
  source: string;
  target: string;
  status: 'normal' | 'suspicious' | 'attack';
  packets: number;
  bytes: number;
  protocol: string;
  pulseOffset: number;
}

// ── Color maps ─────────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, { fill: string; stroke: string; glow: string; text: string }> = {
  internal:   { fill: 'rgba(59,130,246,0.15)',  stroke: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  text: '#93c5fd' },
  external:   { fill: 'rgba(148,163,184,0.1)',  stroke: '#64748b', glow: 'rgba(148,163,184,0.4)',text: '#94a3b8' },
  server:     { fill: 'rgba(16,185,129,0.15)',  stroke: '#10b981', glow: 'rgba(16,185,129,0.6)', text: '#6ee7b7' },
  attacker:   { fill: 'rgba(239,68,68,0.2)',    stroke: '#ef4444', glow: 'rgba(239,68,68,0.7)',  text: '#fca5a5' },
};

const EDGE_COLORS: Record<string, { stroke: string; glow: string }> = {
  normal:     { stroke: 'rgba(100,116,139,0.25)', glow: 'rgba(100,116,139,0)' },
  suspicious: { stroke: 'rgba(245,158,11,0.5)',   glow: 'rgba(245,158,11,0.3)' },
  attack:     { stroke: 'rgba(239,68,68,0.7)',    glow: 'rgba(239,68,68,0.4)' },
};

const PROTOCOLS = ['TCP', 'UDP', 'HTTP', 'HTTPS', 'DNS', 'ICMP'];

// ── Force simulation ───────────────────────────────────────────────────────

function computeForceLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  width: number,
  height: number,
  damping = 0.82,
) {
  const repulsion = 8000;
  const attraction = 0.006;
  const centerGravity = 0.008;
  const idealLength = 160;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = repulsion / (dist * dist);
      const fx = (dx / dist) * force, fy = (dy / dist) * force;
      a.vx -= fx; a.vy -= fy;
      b.vx += fx; b.vy += fy;
    }
  }

  edges.forEach(edge => {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    if (!src || !tgt) return;
    let dx = tgt.x - src.x, dy = tgt.y - src.y;
    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const force = (dist - idealLength) * attraction;
    const fx = (dx / dist) * force, fy = (dy / dist) * force;
    src.vx += fx; src.vy += fy;
    tgt.vx -= fx; tgt.vy -= fy;
  });

  const cx = width / 2, cy = height / 2;
  nodes.forEach(node => {
    node.vx += (cx - node.x) * centerGravity;
    node.vy += (cy - node.y) * centerGravity;
    node.vx *= damping; node.vy *= damping;
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > 4) { node.vx = (node.vx / speed) * 4; node.vy = (node.vy / speed) * 4; }
    node.x += node.vx; node.y += node.vy;
    const margin = 40;
    node.x = Math.max(margin, Math.min(width - margin, node.x));
    node.y = Math.max(margin, Math.min(height - margin, node.y));
  });
}

function getNodeRadius(node: CanvasNode) {
  return 8 + (node.threat_score / 100) * 14;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Build edges from node connection lists (deterministic with cached nodes)
function buildEdges(nodes: CanvasNode[]): CanvasEdge[] {
  const seen = new Set<string>();
  const edges: CanvasEdge[] = [];
  for (const node of nodes) {
    for (const connId of node.connections) {
      const key = [node.id, connId].sort().join('-');
      if (!seen.has(key)) {
        seen.add(key);
        const isAttacker = node.type === 'attacker';
        edges.push({
          source: node.id,
          target: connId,
          status: isAttacker ? 'attack' : Math.random() < 0.2 ? 'suspicious' : 'normal',
          packets: Math.floor(Math.random() * 10000) + 100,
          bytes: Math.floor(Math.random() * 5000000) + 1000,
          protocol: PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)],
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }
  }
  return edges;
}

// Build attack path summaries from attacker nodes
function buildAttackPaths(nodes: CanvasNode[]): { source: string; target: string; hops: string[]; severity: string }[] {
  const attackers = nodes.filter(n => n.type === 'attacker');
  const servers = nodes.filter(n => n.type === 'server');
  return attackers.slice(0, 4).map(a => ({
    source: a.ip,
    target: servers[0]?.ip || '10.0.0.1',
    hops: [a.ip, nodes[Math.floor(Math.random() * nodes.length)]?.ip || '10.0.0.1',
           nodes[Math.floor(Math.random() * nodes.length)]?.ip || '10.0.0.1',
           servers[0]?.ip || '10.0.0.1'],
    severity: 'critical',
  }));
}

// ── Component ──────────────────────────────────────────────────────────────

const NetworkMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<CanvasNode[]>([]);
  const edgesRef = useRef<CanvasEdge[]>([]);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState<{ total_nodes: number; active_threats: number; suspicious_connections: number; blocked_ips: number } | null>(null);
  const [topThreatened, setTopThreatened] = useState<ThreatNode[]>([]);
  const [attackPaths, setAttackPaths] = useState<{ source: string; target: string; hops: string[]; severity: string }[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'threats' | 'paths'>('stats');
  const [totalConns, setTotalConns] = useState(0);
  const [avgScore, setAvgScore] = useState(0);

  // Initialize from MockBackend
  useEffect(() => {
    const mb = mockBackend;
    mb.start();

    const rawNodes = mb.getNetworkNodes();
    const canvasNodes: CanvasNode[] = rawNodes.map((n: ThreatNode) => ({
      ...n,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    const canvasEdges = buildEdges(canvasNodes);
    nodesRef.current = canvasNodes;
    edgesRef.current = canvasEdges;
    setTotalConns(canvasEdges.length);
    setAvgScore(Math.round(canvasNodes.reduce((s, n) => s + n.threat_score, 0) / canvasNodes.length));

    // Derive stats from nodes
    const threatCount = canvasNodes.filter(n => n.type === 'attacker').length;
    setStats({
      total_nodes: canvasNodes.length,
      active_threats: threatCount,
      suspicious_connections: canvasEdges.filter(e => e.status === 'suspicious').length,
      blocked_ips: Math.floor(Math.random() * 50) + 10,
    });

    setTopThreatened(
      [...canvasNodes]
        .filter(n => n.type === 'attacker' || n.threat_score > 30)
        .sort((a, b) => b.threat_score - a.threat_score)
        .slice(0, 5)
    );
    setAttackPaths(buildAttackPaths(canvasNodes));
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (timestamp: number) => {
      timeRef.current = timestamp * 0.001;
      const t = timeRef.current;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width, h = rect.height;

      computeForceLayout(nodesRef.current, edgesRef.current, w, h, 0.82);

      ctx.clearRect(0, 0, w, h);

      // Background
      ctx.fillStyle = '#0a0e1a';
      ctx.fillRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(30,41,59,0.3)';
      ctx.lineWidth = 0.5;
      for (let x = 40; x < w; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 40; y < h; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const nodes = nodesRef.current;
      const edges = edgesRef.current;

      const connectedToHovered = new Set<string>();
      if (hoveredNode) {
        connectedToHovered.add(hoveredNode);
        edges.forEach(e => {
          if (e.source === hoveredNode) connectedToHovered.add(e.target);
          if (e.target === hoveredNode) connectedToHovered.add(e.source);
        });
      }

      const selectedConnections = new Set<string>();
      if (selectedNode) {
        selectedConnections.add(selectedNode.id);
        edges.forEach(e => {
          if (e.source === selectedNode.id) selectedConnections.add(e.target);
          if (e.target === selectedNode.id) selectedConnections.add(e.source);
        });
      }

      // Draw edges
      edges.forEach(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return;

        const isConn = hoveredNode && (edge.source === hoveredNode || edge.target === hoveredNode);
        const isSelEdge = selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id);

        let alpha = 0.15, lw = 1;
        if (hoveredNode && isConn) { alpha = 0.7; lw = 2; }
        if (selectedNode && isSelEdge) { alpha = 0.9; lw = 2.5; }
        if (!hoveredNode && !selectedNode) { alpha = edge.status === 'attack' ? 0.5 : 0.2; }

        const colors = EDGE_COLORS[edge.status];

        // Glow for attack edges
        if (edge.status === 'attack') {
          ctx.save(); ctx.globalAlpha = alpha * 0.3; ctx.strokeStyle = colors.glow;
          ctx.lineWidth = lw + 4;
          ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y); ctx.stroke();
          ctx.restore();
        }

        // Pulse
        let pulseAlpha = 1;
        if (edge.status === 'attack') pulseAlpha = 0.6 + 0.4 * Math.sin(t * 4 + edge.pulseOffset);
        else if (edge.status === 'suspicious') pulseAlpha = 0.7 + 0.3 * Math.sin(t * 2 + edge.pulseOffset);

        ctx.save();
        ctx.globalAlpha = alpha * pulseAlpha;
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = lw;
        ctx.setLineDash(edge.status === 'suspicious' ? [6, 4] : []);
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tgt.x, tgt.y); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Arrowhead for attack edges
        if (edge.status === 'attack') {
          const midX = (src.x + tgt.x) / 2, midY = (src.y + tgt.y) / 2;
          const angle = Math.atan2(tgt.y - src.y, tgt.x - src.x);
          const arrowSize = 6;
          ctx.save();
          ctx.globalAlpha = alpha * pulseAlpha;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(midX + arrowSize * Math.cos(angle), midY + arrowSize * Math.sin(angle));
          ctx.lineTo(midX + arrowSize * Math.cos(angle + 2.5), midY + arrowSize * Math.sin(angle + 2.5));
          ctx.lineTo(midX + arrowSize * Math.cos(angle - 2.5), midY + arrowSize * Math.sin(angle - 2.5));
          ctx.closePath(); ctx.fill();
          ctx.restore();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const r = getNodeRadius(node);
        const colors = NODE_COLORS[node.type];
        const isHovered = node.id === hoveredNode;
        const isSelected = node.id === selectedNode?.id;

        let alpha = 1;
        if (hoveredNode && !connectedToHovered.has(node.id)) alpha = 0.15;
        if (selectedNode && !selectedConnections.has(node.id)) alpha = 0.1;

        let pulseScale = 1;
        if (node.type === 'attacker') pulseScale = 1 + 0.15 * Math.sin(t * 3 + node.pulsePhase);
        const finalR = r * pulseScale;

        // Outer glow
        ctx.save();
        ctx.globalAlpha = alpha * (isHovered || isSelected ? 0.6 : 0.35);
        ctx.beginPath(); ctx.arc(node.x, node.y, finalR * 3, 0, Math.PI * 2);
        const glowGrad = ctx.createRadialGradient(node.x, node.y, finalR * 0.3, node.x, node.y, finalR * 3);
        glowGrad.addColorStop(0, colors.glow);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glowGrad; ctx.fill();
        ctx.restore();

        // Selection ring
        if (isSelected) {
          ctx.save(); ctx.globalAlpha = 0.8; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.arc(node.x, node.y, finalR + 8, 0, Math.PI * 2);
          ctx.stroke(); ctx.setLineDash([]); ctx.restore();
        }

        // Hover ring
        if (isHovered && !isSelected) {
          ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(node.x, node.y, finalR + 5, 0, Math.PI * 2);
          ctx.stroke(); ctx.restore();
        }

        // Fill
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.beginPath(); ctx.arc(node.x, node.y, finalR, 0, Math.PI * 2);
        const fillGrad = ctx.createRadialGradient(node.x - finalR * 0.3, node.y - finalR * 0.3, 0, node.x, node.y, finalR);
        fillGrad.addColorStop(0, colors.fill.replace(/[\d.]+\)$/, '0.4)'));
        fillGrad.addColorStop(1, colors.fill);
        ctx.fillStyle = fillGrad; ctx.fill();
        ctx.restore();

        // Stroke
        ctx.save(); ctx.globalAlpha = alpha;
        ctx.strokeStyle = colors.stroke; ctx.lineWidth = (isHovered || isSelected) ? 2.5 : 1.5;
        ctx.beginPath(); ctx.arc(node.x, node.y, finalR, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();

        // Threat arc indicator
        if (node.threat_score > 50 && alpha > 0.5) {
          ctx.save(); ctx.globalAlpha = alpha * 0.8;
          ctx.strokeStyle = node.type === 'attacker' ? '#ef4444' : '#f59e0b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, finalR + 3, -Math.PI / 2, -Math.PI / 2 + (node.threat_score / 100) * Math.PI * 2);
          ctx.stroke(); ctx.restore();
        }

        // Score text inside node
        if (finalR > 14 && alpha > 0.5) {
          ctx.save(); ctx.globalAlpha = alpha * 0.9; ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px "SF Mono","Fira Code","Consolas",monospace';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(node.threat_score)}`, node.x, node.y);
          ctx.restore();
        }

        // Label
        ctx.save(); ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = colors.text;
        ctx.font = `${node.type === 'attacker' ? 'bold ' : ''}10px "SF Mono","Fira Code","Consolas",monospace`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        ctx.fillText(node.label, node.x, node.y + finalR + 5);
        ctx.restore();
      });

      // Tooltip
      if (hoveredNode && !selectedNode) {
        const node = nodes.find(n => n.id === hoveredNode);
        if (node) {
          const r = getNodeRadius(node);
          const tipX = node.x + r + 12, tipY = node.y - 20;
          const lines = [node.label, node.ip, `Type: ${node.type}`, `Threat Score: ${Math.round(node.threat_score)}`, `Connections: ${node.connections.length}`];
          const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
          const px = 10, py = 6, tipW = maxW + px * 2 + 20, tipH = lines.length * 14 + py * 2;
          ctx.save(); ctx.globalAlpha = 0.95; ctx.fillStyle = 'rgba(15,23,42,0.95)';
          ctx.strokeStyle = NODE_COLORS[node.type].stroke; ctx.lineWidth = 1;
          roundRect(ctx, tipX, tipY, tipW, tipH, 6); ctx.fill(); ctx.stroke();
          ctx.font = 'bold 10px Inter,system-ui,sans-serif'; ctx.fillStyle = NODE_COLORS[node.type].text;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          ctx.fillText(lines[0], tipX + px, tipY + py);
          ctx.font = '9px "SF Mono","Fira Code","Consolas",monospace';
          lines.slice(1).forEach((line, i) => {
            ctx.fillStyle = '#94a3b8';
            ctx.fillText(line, tipX + px, tipY + py + 4 + (i + 1) * 14);
          });
          ctx.restore();
        }
      }

      // Title overlay
      ctx.save(); ctx.globalAlpha = 0.7;
      ctx.font = 'bold 11px Inter,system-ui,sans-serif'; ctx.fillStyle = '#64748b';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText('NETWORK TOPOLOGY', 12, 12);
      ctx.font = '9px Inter,system-ui,sans-serif';
      ctx.fillText(`Live · ${nodes.length} nodes · ${edges.length} edges`, 12, 28);
      ctx.restore();

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [hoveredNode, selectedNode]);

  // Mouse handlers
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const findNodeAt = useCallback((pos: { x: number; y: number }) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const r = getNodeRadius(node) + 4;
      const dx = pos.x - node.x, dy = pos.y - node.y;
      if (dx * dx + dy * dy < r * r) return node;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    setMousePos(pos);
    const node = findNodeAt(pos);
    setHoveredNode(node?.id ?? null);
    if (canvasRef.current) canvasRef.current.style.cursor = node ? 'pointer' : 'default';
  }, [getCanvasPos, findNodeAt]);

  const handleMouseLeave = useCallback(() => { setHoveredNode(null); setMousePos(null); }, []);
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    setSelectedNode(findNodeAt(pos));
  }, [getCanvasPos, findNodeAt]);

  // ── Sidebar sub-components ───────────────────────────────────────────────

  const StatBar = () => {
    if (!stats) return null;
    return (
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-navy-800/60 border border-slate-700/40 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Total Nodes</p>
          <p className="text-lg font-bold text-white">{stats.total_nodes}</p>
        </div>
        <div className="bg-navy-800/60 border border-red-500/20 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Active Threats</p>
          <p className="text-lg font-bold text-brand-red">{stats.active_threats}</p>
        </div>
        <div className="bg-navy-800/60 border border-amber-500/20 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Suspicious</p>
          <p className="text-lg font-bold text-brand-amber">{stats.suspicious_connections}</p>
        </div>
        <div className="bg-navy-800/60 border border-brand-blue/20 rounded-lg p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Blocked IPs</p>
          <p className="text-lg font-bold text-brand-blue">{stats.blocked_ips}</p>
        </div>
      </div>
    );
  };

  const ThreatList = () => (
    <div className="space-y-2">
      {topThreatened.map((node, i) => {
        const cn = nodesRef.current.find(n => n.id === node.id);
        return (
          <div key={node.id}
            className="flex items-center justify-between p-2.5 rounded-lg bg-navy-800/40 border border-slate-700/30 hover:border-brand-red/30 transition-colors cursor-pointer"
            onClick={() => setSelectedNode(cn || null)}>
            <div className="flex items-center gap-2.5">
              <div className={`w-2 h-2 rounded-full ${
                node.type === 'attacker' ? 'bg-brand-red' :
                node.type === 'server' ? 'bg-brand-green' :
                node.type === 'internal' ? 'bg-brand-blue' : 'bg-slate-500'
              }`} />
              <div>
                <p className="text-xs font-mono text-slate-200">{node.label}</p>
                <p className="text-[10px] text-slate-500">{node.ip}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-brand-red">{Math.round(node.threat_score)}</p>
              <p className="text-[10px] text-slate-500">{node.connections?.length || 0} conn</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const AttackPathsList = () => (
    <div className="space-y-3">
      {attackPaths.map((path, i) => {
        const sevColor = path.severity === 'critical' ? 'text-brand-red border-red-500/40'
          : path.severity === 'high' ? 'text-orange-400 border-orange-500/30'
          : 'text-brand-amber border-amber-500/30';
        return (
          <div key={i} className={`p-3 rounded-lg bg-navy-800/40 border ${sevColor}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-brand-red">Attack Path #{i + 1}</span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${sevColor}`}>
                {path.severity}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-mono text-brand-red whitespace-nowrap">
                {path.source.split('.').slice(-1)[0]}
              </span>
              {path.hops.map((hop, j) => (
                <span key={j} className="text-slate-500">→</span>
              ))}
              <span className="text-brand-green font-mono whitespace-nowrap">
                {path.target.split('.').slice(-1)[0]}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1 font-mono truncate">
              {path.source} → … → {path.target}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Canvas area */}
      <div className="flex-1 flex flex-col min-w-0 p-4">
        <StatBar />

        <div ref={containerRef} className="flex-1 relative rounded-xl overflow-hidden border border-slate-700/40 shadow-2xl">
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
            className="absolute inset-0 w-full h-full"
          />

          {/* Legend */}
          <div className="absolute top-3 left-3 bg-navy-900/80 backdrop-blur-sm border border-slate-700/40 rounded-lg p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">Legend</p>
            <div className="space-y-1.5">
              {Object.entries(NODE_COLORS).map(([type, colors]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full border-2"
                    style={{ backgroundColor: colors.fill, borderColor: colors.stroke }} />
                  <span className="text-[11px] text-slate-300 capitalize">{type}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-700/40 mt-2 pt-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-slate-500/40 rounded" />
                <span className="text-[11px] text-slate-400">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5" style={{ borderBottom: '2px dashed rgba(245,158,11,0.6)' }} />
                <span className="text-[11px] text-slate-400">Suspicious</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-0.5 bg-red-500/70 rounded" />
                <span className="text-[11px] text-slate-400">Attack</span>
              </div>
            </div>
          </div>

          {/* Selected node detail panel */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 bg-navy-900/90 backdrop-blur-sm border border-brand-blue/30 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center"
                    style={{ borderColor: NODE_COLORS[selectedNode.type].stroke, backgroundColor: NODE_COLORS[selectedNode.type].fill }}>
                    {selectedNode.type === 'attacker' && <AlertTriangle size={18} className="text-brand-red" />}
                    {selectedNode.type === 'server' && <Shield size={18} className="text-brand-green" />}
                    {selectedNode.type === 'internal' && <Globe size={18} className="text-brand-blue" />}
                    {selectedNode.type === 'external' && <Network size={18} className="text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedNode.label}</p>
                    <p className="text-xs font-mono text-slate-400">{selectedNode.ip}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                        selectedNode.type === 'attacker' ? 'bg-brand-red/20 text-brand-red' :
                        selectedNode.type === 'server' ? 'bg-brand-green/20 text-brand-green' :
                        selectedNode.type === 'internal' ? 'bg-brand-blue/20 text-brand-blue' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>{selectedNode.type}</span>
                      <span className="text-[10px] text-slate-500">Score: <span className="text-white font-bold">{Math.round(selectedNode.threat_score)}</span></span>
                      <span className="text-[10px] text-slate-500">Conns: <span className="text-white font-bold">{selectedNode.connections.length}</span></span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white transition-colors p-1">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-14' : 'w-80'} border-l border-slate-700/40 bg-navy-900/50 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-slate-700/40 flex items-center justify-between">
          {!sidebarCollapsed && (
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Network Intel</h3>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="text-slate-500 hover:text-white transition-colors p-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {sidebarCollapsed ? (
                <path d="M2 7H12M9 4L12 7L9 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              ) : (
                <path d="M12 7H2M5 4L2 7L5 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </svg>
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {stats && (
              <div className="px-3 py-3 border-b border-slate-700/30">
                <div className="flex items-center gap-2 text-xs">
                  <Activity size={14} className="text-brand-green" />
                  <span className="text-slate-400">Total Connections:</span>
                  <span className="text-white font-bold ml-auto">{totalConns}</span>
                </div>
                <div className="flex items-center gap-2 text-xs mt-1">
                  <Zap size={14} className="text-brand-amber" />
                  <span className="text-slate-400">Avg Threat Score:</span>
                  <span className="text-white font-bold ml-auto">{avgScore}%</span>
                </div>
              </div>
            )}

            <div className="flex border-b border-slate-700/40">
              {[
                { key: 'stats' as const, label: 'Stats', icon: Activity },
                { key: 'threats' as const, label: 'Threats', icon: AlertTriangle },
                { key: 'paths' as const, label: 'Paths', icon: Link2 },
              ].map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] uppercase tracking-wider transition-colors ${
                    activeTab === tab.key ? 'text-brand-blue border-b-2 border-brand-blue bg-navy-800/50' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  <tab.icon size={12} /> {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
              {activeTab === 'stats' && (
                <div className="space-y-4">
                  <div className="bg-navy-800/40 border border-slate-700/30 rounded-lg p-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-3 font-semibold">Node Distribution</h4>
                    {stats && (
                      <div className="space-y-2">
                        {[
                          { label: 'Internal', count: nodesRef.current.filter(n => n.type === 'internal').length, color: 'bg-brand-blue', text: 'text-brand-blue' },
                          { label: 'External', count: nodesRef.current.filter(n => n.type === 'external').length, color: 'bg-slate-500', text: 'text-slate-400' },
                          { label: 'Servers', count: nodesRef.current.filter(n => n.type === 'server').length, color: 'bg-brand-green', text: 'text-brand-green' },
                          { label: 'Attackers', count: nodesRef.current.filter(n => n.type === 'attacker').length, color: 'bg-brand-red', text: 'text-brand-red' },
                        ].map(item => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${item.color}`} />
                              <span className="text-xs text-slate-300">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`}
                                  style={{ width: `${(item.count / (stats.total_nodes || 1)) * 100}%` }} />
                              </div>
                              <span className={`text-[11px] font-mono w-6 text-right ${item.text}`}>{item.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-navy-800/40 border border-slate-700/30 rounded-lg p-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-3 font-semibold">Edge Status</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Normal', count: edgesRef.current.filter(e => e.status === 'normal').length, color: 'text-slate-400' },
                        { label: 'Suspicious', count: edgesRef.current.filter(e => e.status === 'suspicious').length, color: 'text-brand-amber' },
                        { label: 'Attack', count: edgesRef.current.filter(e => e.status === 'attack').length, color: 'text-brand-red' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-xs text-slate-300">{item.label}</span>
                          <span className={`text-[11px] font-mono font-bold ${item.color}`}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-navy-800/40 border border-slate-700/30 rounded-lg p-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">Protocols</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(
                        edgesRef.current.reduce((acc, e) => { acc[e.protocol] = (acc[e.protocol] || 0) + 1; return acc; }, {} as Record<string, number>)
                      ).sort((a, b) => b[1] - a[1]).map(([proto, count]) => (
                        <span key={proto} className="text-[10px] font-mono px-2 py-1 bg-navy-700/60 text-slate-300 rounded border border-slate-700/30">
                          {proto} <span className="text-slate-500">({count})</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'threats' && <ThreatList />}
              {activeTab === 'paths' && <AttackPathsList />}
            </div>

            <div className="p-3 border-t border-slate-700/40">
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <Activity size={10} />
                <span>Simulated threat data · MockBackend</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkMap;
