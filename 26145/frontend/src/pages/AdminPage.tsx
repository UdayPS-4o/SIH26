import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   WATCHTOWER — Administration
   ═══════════════════════════════════════════════════════════════════════ */

interface User {
  id: string;
  username: string;
  role: 'admin' | 'analyst' | 'viewer';
  status: 'active' | 'inactive' | 'locked';
  last_login: string;
  sessions: number;
}

interface PipelineNode {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'error' | 'idle';
  throughput: string;
  latency_ms: number;
  cpu_pct: number;
  memory_pct: number;
}

interface ModelInfo {
  name: string;
  version: string;
  accuracy: number;
  last_trained: string;
  samples: number;
  status: 'active' | 'retraining' | 'failed';
}

const PIPELINE_DATA: PipelineNode[] = [
  { id: 'PIPE-01', name: 'Ingest (PCAP/NetFlow)', status: 'running', throughput: '~10K flows/s', latency_ms: 2, cpu_pct: 15, memory_pct: 32 },
  { id: 'PIPE-02', name: 'Feature Extractor', status: 'running', throughput: '~9.8K flows/s', latency_ms: 5, cpu_pct: 45, memory_pct: 58 },
  { id: 'PIPE-03', name: 'Anomaly Detector (IsolationForest)', status: 'running', throughput: '~9.5K flows/s', latency_ms: 12, cpu_pct: 72, memory_pct: 64 },
  { id: 'PIPE-04', name: 'Classification Engine (LR)', status: 'running', throughput: '~9.5K flows/s', latency_ms: 3, cpu_pct: 38, memory_pct: 41 },
  { id: 'PIPE-05', name: 'Alert Correlator', status: 'running', throughput: '~1.2K alerts/s', latency_ms: 8, cpu_pct: 22, memory_pct: 28 },
  { id: 'PIPE-06', name: 'Output (WebSocket/REST)', status: 'running', throughput: '~1.2K events/s', latency_ms: 1, cpu_pct: 8, memory_pct: 15 },
  { id: 'PIPE-07', name: 'Registry Normalizer', status: 'running', throughput: '~50 docs/s', latency_ms: 45, cpu_pct: 12, memory_pct: 35 },
  { id: 'PIPE-08', name: 'SIEM Integration', status: 'running', throughput: '~500 evt/s', latency_ms: 15, cpu_pct: 5, memory_pct: 10 },
];

const MODEL_DATA: ModelInfo[] = [
  { name: 'IsolationForest', version: '1.2.0', accuracy: 94.2, last_trained: '2026-08-15', samples: 50000, status: 'active' },
  { name: 'LogisticRegression (multi-class)', version: '1.1.0', accuracy: 91.8, last_trained: '2026-08-10', samples: 50000, status: 'active' },
  { name: 'Custom Rule Engine', version: '2.0.0', accuracy: 97.1, last_trained: '2026-08-20', samples: 50000, status: 'active' },
];

const USER_DATA: User[] = [
  { id: 'USR-001', username: 'admin', role: 'admin', status: 'active', last_login: new Date(Date.now() - 3600000).toISOString(), sessions: 3 },
  { id: 'USR-002', username: 'analyst_01', role: 'analyst', status: 'active', last_login: new Date(Date.now() - 7200000).toISOString(), sessions: 1 },
  { id: 'USR-003', username: 'analyst_02', role: 'analyst', status: 'inactive', last_login: new Date(Date.now() - 86400000).toISOString(), sessions: 0 },
  { id: 'USR-004', username: 'viewer_01', role: 'viewer', status: 'active', last_login: new Date(Date.now() - 1800000).toISOString(), sessions: 1 },
  { id: 'USR-005', username: 'viewer_02', role: 'viewer', status: 'locked', last_login: new Date(Date.now() - 172800000).toISOString(), sessions: 0 },
];

const STATUS_COLOR: Record<string, string> = {
  running: 'var(--accent-green)', active: 'var(--accent-green)', paused: 'var(--accent-orange)', inactive: 'var(--accent-orange)',
  error: 'var(--accent-red)', locked: 'var(--accent-red)', retraining: 'var(--accent-cyan)', idle: 'var(--border-active)', failed: 'var(--accent-red)',
};
const ROLE_COLOR: Record<string, string> = { admin: 'var(--accent-red)', analyst: 'var(--accent-cyan)', viewer: 'var(--accent-orange)' };

function AnimatedRing({ accuracy, size = 64 }: { accuracy: number; size?: number }) {
  const [anim, setAnim] = useState(0);
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => { i += 2; if (i >= accuracy) { i = accuracy; clearInterval(interval); } setAnim(i); }, 20);
    return () => clearInterval(interval);
  }, [accuracy]);
  const r = 15.9155;
  const circ = 2 * Math.PI * r;
  const offset = circ - (anim / 100) * circ;
  const strokeColor = anim > 90 ? 'var(--accent-green)' : anim > 75 ? 'var(--accent-cyan)' : 'var(--accent-orange)';
  return (
    <div style={{ width: `${size}px`, height: `${size}px`, position: 'relative' }}>
      <svg viewBox="0 0 36 36" style={{ width: `${size}px`, height: `${size}px`, transform: 'rotate(-90deg)' }}>
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none" stroke={strokeColor} strokeWidth="3" strokeDasharray={`${anim}, 100`} strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"JetBrains Mono", monospace', color: strokeColor, fontSize: '12px', fontWeight: 700,
      }}>{anim.toFixed(0)}%</div>
    </div>
  );
}

function Sparkline({ data, max, color }: { data: number[]; max: number; color: string }) {
  const safeMax = Math.max(max, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '18px' }}>
      {data.map((v, i) => (
        <div key={i} style={{ flex: 1, height: `${Math.max(2, (v / safeMax) * 16)}px`, background: color, borderRadius: '1px', opacity: 0.7 }} />
      ))}
    </div>
  );
}

function AdminPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'models' | 'users' | 'terminal'>('pipeline');
  const [pipeline, setPipeline] = useState<PipelineNode[]>(PIPELINE_DATA);
  const [models, setModels] = useState<ModelInfo[]>(MODEL_DATA);
  const [users, setUsers] = useState<User[]>(USER_DATA);
  const [retrainingModel, setRetrainingModel] = useState<string | null>(null);
  const [nodeHistory, setNodeHistory] = useState<Record<string, { cpu: number[]; mem: number[]; latency: number[] }>>({});
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);

  // Init history
  useEffect(() => {
    const hist: Record<string, { cpu: number[]; mem: number[]; latency: number[] }> = {};
    pipeline.forEach(p => {
      hist[p.id] = { cpu: Array.from({ length: 5 }, () => p.cpu_pct + (Math.random() * 10 - 5)), mem: Array.from({ length: 5 }, () => p.memory_pct + (Math.random() * 10 - 5)), latency: Array.from({ length: 5 }, () => p.latency_ms + (Math.random() * 4 - 2)) };
    });
    setNodeHistory(hist);
  }, []);

  // Live pipeline updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPipeline(prev => {
        const updated = prev.map(p => ({
          ...p,
          cpu_pct: Math.min(100, Math.max(5, p.cpu_pct + Math.floor(Math.random() * 7) - 3)),
          memory_pct: Math.min(100, Math.max(5, p.memory_pct + Math.floor(Math.random() * 5) - 2)),
          latency_ms: Math.max(1, p.latency_ms + Math.floor(Math.random() * 5) - 2),
        }));
        setNodeHistory(prevHist => {
          const newHist = { ...prevHist };
          updated.forEach(p => {
            if (newHist[p.id]) {
              newHist[p.id] = { cpu: [...newHist[p.id].cpu.slice(1), p.cpu_pct], mem: [...newHist[p.id].mem.slice(1), p.memory_pct], latency: [...newHist[p.id].latency.slice(1), p.latency_ms] };
            }
          });
          return newHist;
        });
        return updated;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Terminal
  useEffect(() => {
    if (activeTab !== 'terminal') return;
    setTerminalLines([
      'WATCHTOWER Admin Console v1.0.0',
      '> Connected to localhost:8000',
      '> Authenticated as: admin',
      `> Session: ${Math.random().toString(36).substr(2, 12)}`,
      `> Last login: ${new Date().toLocaleString()}`,
      '',
    ]);
    const interval = setInterval(() => {
      setTerminalLines(prev => {
        const newLines = [
          `[${new Date().toLocaleTimeString()}] INFO: Pipeline throughput: ${(Math.random() * 2 + 8).toFixed(1)}K flows/s`,
          `[${new Date().toLocaleTimeString()}] INFO: P99 latency: ${Math.floor(Math.random() * 20 + 10)}ms`,
          `[${new Date().toLocaleTimeString()}] ${Math.random() < 0.9 ? 'INFO' : 'WARN'}: ${Math.random() < 0.9 ? 'Health check passed' : 'High memory usage on feature extractor'}`,
        ];
        return [...prev, ...newLines].slice(-50);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLines, terminalInput]);

  const handleTerminal = () => {
    if (!terminalInput.trim()) return;
    const cmd = terminalInput.trim().toLowerCase();
    let response = '';
    switch (cmd) {
      case 'help': response = 'Available: help, status, clear, health, stats'; break;
      case 'status': response = `Pipelines: ${pipeline.filter(p => p.status === 'running').length}/${pipeline.length} active | Models: ${models.length} loaded`; break;
      case 'health': response = `CPU: ${pipeline[2]?.cpu_pct}% | MEM: ${pipeline[2]?.memory_pct}% | Latency: ${pipeline[2]?.latency_ms}ms`; break;
      case 'stats': response = `Events/s: ${Math.floor(Math.random() * 200 + 100)} | Alerts: ${Math.floor(Math.random() * 50 + 10)} | Queue: ${Math.floor(Math.random() * 30)}`; break;
      case 'clear': setTerminalLines([]); setTerminalInput(''); return;
      default: response = `Command not found: ${cmd}. Type 'help' for available commands.`;
    }
    setTerminalLines(prev => [...prev, `> ${terminalInput}`, response]);
    setTerminalInput('');
  };

  const handleRetrain = (modelName: string) => {
    setRetrainingModel(modelName);
    const steps = [
      `[RETRAIN] Loading training dataset (50K samples)...`,
      `[RETRAIN] Splitting: 80% train / 20% test`,
      `[RETRAIN] Training ${modelName}...`,
      `[RETRAIN] Cross-validation: 5 folds`,
      `[RETRAIN] Computing accuracy metrics...`,
      `[RETRAIN] Model saved. Version bumped.`,
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) { setTerminalLines(prev => [...prev, steps[i]]); i++; }
      else {
        clearInterval(interval);
        setRetrainingModel(null);
        setModels(prev => prev.map(m => m.name === modelName ? { ...m, version: String(parseFloat(m.version) + 0.1).slice(0, 3), accuracy: Math.min(99.9, m.accuracy + Math.random() * 2) } : m));
      }
    }, 1500);
  };

  const tabs = [
    { id: 'pipeline' as const, label: 'Pipeline Control', symbol: '≋' },
    { id: 'models' as const, label: 'Models', symbol: '◈' },
    { id: 'users' as const, label: 'User Management', symbol: '[]' },
    { id: 'terminal' as const, label: 'Terminal', symbol: '>_' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── HEADER ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--accent-green)', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
          </div>
          <h1 style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '20px', letterSpacing: '3px', textTransform: 'uppercase', margin: 0 }}>Administration</h1>
          <p style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>User management · Pipeline control · Model retraining · System monitoring</p>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '12px', background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '6px', padding: '8px 14px' }}>
          {pipeline.filter(p => p.status === 'running').length}/{pipeline.length} pipelines active
        </div>
      </div>

      {/* ── TABS ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #1a2736' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'transparent',
            color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid rgba(0,212,255,0.4)' : '2px solid transparent',
            padding: '10px 18px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
            transition: 'all 0.2s',
          }}>{tab.symbol} {tab.label}</button>
        ))}
      </div>

      {/* ── PIPELINE CONTROL ──────────────────────────────────────── */}
      {activeTab === 'pipeline' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
          {pipeline.map(node => {
            const history = nodeHistory[node.id] || { cpu: [], mem: [], latency: [] };
            const healthColor = node.cpu_pct > 80 || node.memory_pct > 80 ? 'var(--accent-red)' : node.cpu_pct > 50 ? 'var(--accent-orange)' : 'var(--accent-green)';
            const latencyTrend = history.latency.length >= 2 ? history.latency[history.latency.length - 1] > history.latency[0] ? '↑' : history.latency[history.latency.length - 1] < history.latency[0] ? '↓' : '→' : '→';
            const trendColor = latencyTrend === '↑' ? 'var(--accent-red)' : latencyTrend === '↓' ? 'var(--accent-green)' : 'var(--text-secondary)';

            return (
              <div key={node.id} style={{
                background: 'var(--bg-secondary)', border: `1px solid ${node.status === 'error' ? 'rgba(239,68,68,0.3)' : 'var(--border-color)'}`,
                borderRadius: '8px', padding: '16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{node.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '10px', marginTop: '2px' }}>{node.id}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: trendColor, fontSize: '16px', fontWeight: 700 }}>{latencyTrend}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_COLOR[node.status], boxShadow: `0 0 6px ${STATUS_COLOR[node.status]}66` }} />
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', color: STATUS_COLOR[node.status], fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{node.status}</span>
                    </div>
                  </div>
                </div>

                {/* Throughput bar */}
                <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(0,212,255,0.06)', overflow: 'hidden', marginBottom: '12px' }}>
                  <div style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg, #00d4ff, #00ff41)', width: `${node.cpu_pct}%`, transition: 'width 0.5s' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Throughput</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{node.throughput}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Latency</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{node.latency_ms}ms</div>
                  </div>
                </div>

                {/* CPU/MEM sparklines */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, width: '28px' }}>CPU</span>
                    <Sparkline data={history.cpu} max={100} color={node.cpu_pct > 80 ? 'var(--accent-red)' : node.cpu_pct > 50 ? 'var(--accent-orange)' : 'var(--accent-green)'} />
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '11px', width: '32px', textAlign: 'right' }}>{node.cpu_pct}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', fontWeight: 600, width: '28px' }}>MEM</span>
                    <Sparkline data={history.mem} max={100} color={node.memory_pct > 80 ? 'var(--accent-red)' : node.memory_pct > 50 ? 'var(--accent-orange)' : 'var(--accent-green)'} />
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '11px', width: '32px', textAlign: 'right' }}>{node.memory_pct}%</span>
                  </div>
                </div>

                {/* Health + Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(0,212,255,0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: healthColor, fontSize: '10px', textTransform: 'uppercase', fontWeight: 600 }}>
                      {node.cpu_pct > 80 ? 'Critical' : node.cpu_pct > 50 ? 'Warning' : 'Healthy'}
                    </span>
                  </div>
                  <button onClick={() => setPipeline(prev => prev.map(p => p.id === node.id ? { ...p, status: p.status === 'running' ? 'paused' as const : 'running' as const } : p))} style={{
                    background: node.status === 'running' ? 'rgba(239,68,68,0.12)' : 'rgba(0,255,65,0.12)',
                    color: node.status === 'running' ? 'var(--accent-red)' : 'var(--accent-green)',
                    border: `1px solid ${node.status === 'running' ? 'rgba(239,68,68,0.25)' : 'rgba(0,255,65,0.25)'}`,
                    borderRadius: '5px', padding: '5px 12px', cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
                  }}>{node.status === 'running' ? '■ Pause' : '▶ Resume'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODELS ────────────────────────────────────────────────── */}
      {activeTab === 'models' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
          {models.map(model => {
            const features = ['Accuracy', 'Precision', 'Recall', 'F1', 'AUC'];
            const featureValues = [model.accuracy, model.accuracy - 2, model.accuracy - 4, model.accuracy - 1, model.accuracy - 3];
            const maxVal = Math.max(...featureValues, 1);
            const confusionMatrix = [
              [Math.floor(Math.random() * 10 + 85), Math.floor(Math.random() * 5 + 5)],
              [Math.floor(Math.random() * 5 + 5), Math.floor(Math.random() * 10 + 85)],
            ];

            return (
              <div key={model.name} style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{model.name}</div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '10px', marginTop: '2px' }}>v{model.version}</div>
                  </div>
                  <AnimatedRing accuracy={model.accuracy} size={64} />
                </div>

                {/* Feature importance */}
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px' }}>Feature Importance</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  {features.map((f, i) => {
                    const pct = (featureValues[i] / maxVal) * 100;
                    const barColor = i === 0 ? 'var(--accent-cyan)' : i === 1 ? 'var(--accent-green)' : i === 2 ? 'var(--accent-orange)' : i === 3 ? 'var(--accent-purple)' : 'var(--accent-red)';
                    return (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', width: '65px', textTransform: 'uppercase' }}>{f}</span>
                        <div style={{ flex: 1, height: '6px', borderRadius: '3px', background: 'rgba(0,212,255,0.06)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '3px', background: barColor, width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confusion matrix */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Confusion Matrix</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', width: '120px' }}>
                    {confusionMatrix.map((row, ri) => row.map((val, ci) => (
                      <div key={`${ri}-${ci}`} style={{
                        textAlign: 'center', borderRadius: '4px', padding: '6px',
                        background: `rgba(${ri === ci ? '0,255,65' : '239,68,68'},${val / 100 * 0.25})`,
                        border: `1px solid rgba(${ri === ci ? '0,255,65' : '239,68,68'},0.2)`,
                      }}>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: ri === ci ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '11px', fontWeight: 700 }}>{val}</span>
                      </div>
                    )))}
                  </div>
                </div>

                {/* Model info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '14px', padding: '10px', background: 'rgba(6,10,16,0.6)', borderRadius: '6px', border: '1px solid rgba(0,212,255,0.06)' }}>
                  {[
                    { label: 'Samples', value: model.samples.toLocaleString() },
                    { label: 'Trained', value: model.last_trained },
                    { label: 'Status', value: model.status, color: STATUS_COLOR[model.status] },
                  ].map(field => (
                    <div key={field.label} style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '10px' }}>{field.label}</span>
                      <span style={{ color: (field as any).color || 'var(--text-primary)' }}>{field.value}</span>
                    </div>
                  ))}
                </div>

                {retrainingModel === model.name && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px' }}>
                      <span style={{ color: 'var(--accent-cyan)' }}>Retraining...</span>
                      <span style={{ color: 'var(--accent-green)' }}>In Progress</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,212,255,0.08)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #00d4ff, #00ff41)', width: '60%' }} />
                    </div>
                  </div>
                )}

                <button onClick={() => handleRetrain(model.name)} disabled={retrainingModel === model.name} style={{
                  width: '100%', background: retrainingModel === model.name ? 'rgba(0,212,255,0.08)' : 'rgba(0,212,255,0.12)',
                  color: 'var(--accent-cyan)', border: '1px solid rgba(0,212,255,0.25)',
                  borderRadius: '6px', padding: '8px', cursor: retrainingModel === model.name ? 'not-allowed' : 'pointer',
                  fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', opacity: retrainingModel === model.name ? 0.6 : 1,
                }}>{retrainingModel === model.name ? '⟳ Retraining...' : '↻ Retrain Model'}</button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── USER MANAGEMENT ───────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Total Users', value: users.length, color: 'var(--accent-cyan)' },
              { label: 'Active', value: users.filter(u => u.status === 'active').length, color: 'var(--accent-green)' },
              { label: 'Inactive', value: users.filter(u => u.status === 'inactive').length, color: 'var(--accent-orange)' },
              { label: 'Locked', value: users.filter(u => u.status === 'locked').length, color: 'var(--accent-red)' },
            ].map(card => (
              <div key={card.label} style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: card.color, fontSize: '28px', fontWeight: 700 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Users table */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a2736' }}>
                  {['ID', 'Username', 'Role', 'Status', 'Last Login', 'Sessions', 'Actions'].map(h => (
                    <th key={h} style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '12px', padding: '11px 16px' }}>{user.id}</td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '12px', padding: '11px 16px' }}>{user.username}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{
                        background: `${ROLE_COLOR[user.role]}1a`, color: ROLE_COLOR[user.role],
                        border: `1px solid ${ROLE_COLOR[user.role]}44`,
                        fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', fontWeight: 600,
                        padding: '3px 10px', borderRadius: '9999px', textTransform: 'uppercase', letterSpacing: '0.6px',
                      }}>{user.role}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_COLOR[user.status], boxShadow: `0 0 4px ${STATUS_COLOR[user.status]}66` }} />
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: STATUS_COLOR[user.status], fontSize: '12px' }}>{user.status}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '12px', padding: '11px 16px' }}>{new Date(user.last_login).toLocaleString()}</td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '12px', padding: '11px 16px' }}>{user.sessions}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: u.status === 'locked' ? 'active' as const : 'locked' as const, sessions: u.status === 'locked' ? 1 : 0 } : u))} style={{
                        background: user.status === 'locked' ? 'rgba(0,255,65,0.12)' : 'rgba(255,136,51,0.12)',
                        color: user.status === 'locked' ? 'var(--accent-green)' : 'var(--accent-orange)',
                        border: `1px solid ${user.status === 'locked' ? 'rgba(0,255,65,0.25)' : 'rgba(255,136,51,0.25)'}`,
                        borderRadius: '5px', padding: '5px 12px', cursor: 'pointer',
                        fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
                      }}>{user.status === 'locked' ? 'Unlock' : 'Lock'}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Login Activity Timeline */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px' }}>Login Activity Timeline</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {USER_DATA.filter(u => u.status === 'active').map((entry, i) => (
                <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '2px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 4px #00ff4166' }} />
                    {i < USER_DATA.filter(u => u.status === 'active').length - 1 && <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', marginTop: '4px' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>{entry.username}</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-green)', fontSize: '10px', textTransform: 'uppercase' }}>Login</span>
                    </div>
                    <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', marginTop: '2px' }}>
                      {entry.id} · {new Date(entry.last_login).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TERMINAL ──────────────────────────────────────────────── */}
      {activeTab === 'terminal' && (
        <div style={{
          background: 'var(--bg-primary)', border: '1px solid #1a2736', borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px',
            borderBottom: '1px solid #1a2736', background: 'var(--bg-secondary)',
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-red)' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-orange)' }} />
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-green)' }} />
            </div>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '12px' }}>watchtower@admin:~</span>
          </div>
          <div ref={terminalRef} style={{
            padding: '16px', maxHeight: '400px', overflowY: 'auto',
            fontFamily: '"JetBrains Mono", monospace', fontSize: '13px', lineHeight: 1.8,
          }}>
            {terminalLines.map((line, i) => {
              let color = 'var(--text-primary)';
              if (line.includes('[RETRAIN]')) color = 'var(--accent-cyan)';
              else if (line.includes('WARN')) color = 'var(--accent-orange)';
              else if (line.includes('ERROR')) color = 'var(--accent-red)';
              else if (line.includes('INFO')) color = 'var(--accent-cyan)';
              else if (line.includes('>')) color = 'var(--accent-green)';

              return <div key={i} style={{ color, whiteSpace: 'pre-wrap' }}>{line}</div>;
            })}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #1a2736' }}>
              <span style={{ color: 'var(--accent-green)' }}>$</span>
              <input
                value={terminalInput}
                onChange={e => setTerminalInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTerminal(); }}
                placeholder="Type help, status, health, stats, or clear..."
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px',
                }}
              />
              <span style={{ color: 'var(--accent-cyan)', animation: 'pulse-dot 600ms ease-in-out infinite' }}>█</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
