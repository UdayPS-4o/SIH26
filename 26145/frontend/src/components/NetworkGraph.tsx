import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Flow } from '../types';

interface NetworkGraphProps {
  flows: Flow[];
  darkMode: boolean;
  onNodeClick?: (ip: string) => void;
}

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: 'source' | 'destination' | 'both';
  radius: number;
}

interface Edge {
  source: string;
  target: string;
  isThreat: boolean;
}

const NetworkGraph: React.FC<NetworkGraphProps> = ({ flows, darkMode }) => {
  const { nodes, edges } = useMemo(() => {
    const ipSet = new Set<string>();
    const edgeMap = new Map<string, { count: number; isThreat: boolean }>();

    flows.slice(0, 50).forEach((flow) => {
      ipSet.add(flow.src_ip);
      ipSet.add(flow.dst_ip);
      const key = `${flow.src_ip}->${flow.dst_ip}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count++;
        existing.isThreat = existing.isThreat || flow.isAttack;
      } else {
        edgeMap.set(key, { count: 1, isThreat: flow.isAttack });
      }
    });

    const uniqueIps = Array.from(ipSet).slice(0, 20);
    const trafficMap = new Map<string, number>();
    flows.slice(0, 50).forEach((flow) => {
      trafficMap.set(flow.src_ip, (trafficMap.get(flow.src_ip) || 0) + flow.bytes_sent);
      trafficMap.set(flow.dst_ip, (trafficMap.get(flow.dst_ip) || 0) + flow.bytes_recv);
    });

    const maxTraffic = Math.max(...Array.from(trafficMap.values()), 1);

    const width = 700;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;

    const nodesList: Node[] = uniqueIps.map((ip, i) => {
      const angle = (2 * Math.PI * i) / uniqueIps.length;
      const traffic = trafficMap.get(ip) || 0;
      const nodeRadius = 8 + (traffic / maxTraffic) * 20;
      return {
        id: ip,
        label: ip,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        type: 'destination',
        radius: nodeRadius,
      };
    });

    const edgesList: Edge[] = [];
    edgeMap.forEach((value, key) => {
      const [source, target] = key.split('->');
      edgesList.push({ source, target, isThreat: value.isThreat });
    });

    return { nodes: nodesList, edges: edgesList };
  }, [flows]);

  if (nodes.length === 0) {
    return (
      <div className="card p-6 flex flex-col items-center justify-center h-full text-slate-500">
        <AlertTriangle size={48} className="mb-3 opacity-50" />
        <p className="text-sm">No network data available</p>
      </div>
    );
  }

  const strokeColor = darkMode ? '#334155' : '#cbd5e1';
  const threatStroke = '#ef4444';
  const nodeFill = darkMode ? '#1e293b' : '#f1f5f9';
  const nodeStroke = darkMode ? '#3b82f6' : '#2563eb';
  const textColor = darkMode ? '#94a3b8' : '#475569';

  return (
    <div className="card p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Network Topology</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-blue" />
            <span className="text-slate-400">Normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-brand-red animate-pulse" />
            <span className="text-slate-400">Threat</span>
          </div>
        </div>
      </div>
      <svg viewBox="0 0 700 400" className="w-full h-[400px]">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const source = nodes.find((n) => n.id === edge.source);
          const target = nodes.find((n) => n.id === edge.target);
          if (!source || !target) return null;
          return (
            <line
              key={i}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke={edge.isThreat ? threatStroke : strokeColor}
              strokeWidth={edge.isThreat ? 2 : 1}
              opacity={edge.isThreat ? 0.8 : 0.3}
              filter={edge.isThreat ? 'url(#glow)' : undefined}
            >
              {edge.isThreat && (
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              )}
            </line>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.radius}
              fill={nodeFill}
              stroke={nodeStroke}
              strokeWidth={2}
              className="hover:opacity-80 cursor-pointer transition-opacity"
            />
            <text
              x={node.x}
              y={node.y + node.radius + 14}
              textAnchor="middle"
              fill={textColor}
              fontSize="9"
              fontFamily="Inter, system-ui, sans-serif"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default NetworkGraph;
