import React, { useState, useEffect, useRef } from 'react';

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

function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pipeline, setPipeline] = useState<PipelineNode[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'pipeline' | 'models' | 'terminal'>('pipeline');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [retrainingModel, setRetrainingModel] = useState<string | null>(null);

  useEffect(() => {
    setUsers([
      { id: 'USR-001', username: 'admin', role: 'admin', status: 'active', last_login: new Date(Date.now() - 3600000).toISOString(), sessions: 3 },
      { id: 'USR-002', username: 'analyst_01', role: 'analyst', status: 'active', last_login: new Date(Date.now() - 7200000).toISOString(), sessions: 1 },
      { id: 'USR-003', username: 'analyst_02', role: 'analyst', status: 'inactive', last_login: new Date(Date.now() - 86400000).toISOString(), sessions: 0 },
      { id: 'USR-004', username: 'viewer_01', role: 'viewer', status: 'active', last_login: new Date(Date.now() - 1800000).toISOString(), sessions: 1 },
      { id: 'USR-005', username: 'viewer_02', role: 'viewer', status: 'locked', last_login: new Date(Date.now() - 172800000).toISOString(), sessions: 0 },
    ]);

    setPipeline([
      { id: 'PIPE-01', name: 'Ingest (PCAP/NetFlow)', status: 'running', throughput: '~10K flows/s', latency_ms: 2, cpu_pct: 15, memory_pct: 32 },
      { id: 'PIPE-02', name: 'Feature Extractor', status: 'running', throughput: '~9.8K flows/s', latency_ms: 5, cpu_pct: 45, memory_pct: 58 },
      { id: 'PIPE-03', name: 'Anomaly Detector (IsolationForest)', status: 'running', throughput: '~9.5K flows/s', latency_ms: 12, cpu_pct: 72, memory_pct: 64 },
      { id: 'PIPE-04', name: 'Classification Engine (LR)', status: 'running', throughput: '~9.5K flows/s', latency_ms: 3, cpu_pct: 38, memory_pct: 41 },
      { id: 'PIPE-05', name: 'Alert Correlator', status: 'running', throughput: '~1.2K alerts/s', latency_ms: 8, cpu_pct: 22, memory_pct: 28 },
      { id: 'PIPE-06', name: 'Output (WebSocket/REST)', status: 'running', throughput: '~1.2K events/s', latency_ms: 1, cpu_pct: 8, memory_pct: 15 },
      { id: 'PIPE-07', name: 'Registry Normalizer', status: 'running', throughput: '~50 docs/s', latency_ms: 45, cpu_pct: 12, memory_pct: 35 },
      { id: 'PIPE-08', name: 'SIEM Integration', status: 'running', throughput: '~500 evt/s', latency_ms: 15, cpu_pct: 5, memory_pct: 10 },
    ]);

    setModels([
      { name: 'IsolationForest', version: '1.2.0', accuracy: 94.2, last_trained: '2026-08-15', samples: 50000, status: 'active' },
      { name: 'LogisticRegression (multi-class)', version: '1.1.0', accuracy: 91.8, last_trained: '2026-08-10', samples: 50000, status: 'active' },
      { name: 'Custom Rule Engine', version: '2.0.0', accuracy: 97.1, last_trained: '2026-08-20', samples: 50000, status: 'active' },
    ]);
  }, []);

  useEffect(() => {
    if (activeTab === 'terminal') {
      const initLines = [
        'EKADHARA Admin Console v1.0.0',
        '> Connected to localhost:8000',
        '> Authenticated as: admin',
        '> Session: ' + Math.random().toString(36).substr(2, 12),
        '> Last login: ' + new Date().toLocaleString(),
        '',
      ];
      setTerminalLines(initLines);

      const interval = setInterval(() => {
        const newLines = [
          `[${new Date().toLocaleTimeString()}] INFO: Pipeline throughput: ${(Math.random() * 2 + 8).toFixed(1)}K flows/s`,
          `[${new Date().toLocaleTimeString()}] INFO: P99 latency: ${Math.floor(Math.random() * 20 + 10)}ms`,
          `[${new Date().toLocaleTimeString()}] ${Math.random() < 0.9 ? 'INFO' : 'WARN'}: ${Math.random() < 0.9 ? 'Health check passed' : 'High memory usage on feature extractor'}`,
        ];
        setTerminalLines(prev => [...prev, ...newLines].slice(-50));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPipeline(prev => prev.map(p => ({
        ...p,
        latency_ms: Math.max(1, p.latency_ms + Math.floor(Math.random() * 5) - 2),
        cpu_pct: Math.min(100, Math.max(5, p.cpu_pct + Math.floor(Math.random() * 7) - 3)),
        memory_pct: Math.min(100, Math.max(5, p.memory_pct + Math.floor(Math.random() * 5) - 2)),
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleRetrain = (modelName: string) => {
    setRetrainingModel(modelName);
    const steps = [
      { text: `[RETRAIN] Loading training dataset (50K samples)...` },
      { text: `[RETRAIN] Splitting: 80% train / 20% test` },
      { text: `[RETRAIN] Training ${modelName}...` },
      { text: `[RETRAIN] Cross-validation: 5 folds` },
      { text: `[RETRAIN] Computing accuracy metrics...` },
      { text: `[RETRAIN] Model saved. Version bumped.` },
    ];
    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setTerminalLines(prev => [...prev, steps[i].text]);
        i++;
      } else {
        clearInterval(interval);
        setRetrainingModel(null);
        setModels(prev => prev.map(m =>
          m.name === modelName ? { ...m, version: String(parseFloat(m.version) + 0.1).slice(0, 3), accuracy: Math.min(99.9, m.accuracy + Math.random() * 2) } : m
        ));
      }
    }, 1500);
  };

  const handleTogglePipeline = (id: string) => {
    setPipeline(prev => prev.map(p =>
      p.id === id ? { ...p, status: p.status === 'running' ? 'paused' as const : 'running' as const } : p
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': case 'active': return '#00ff41';
      case 'paused': case 'inactive': return '#ff8833';
      case 'error': case 'locked': return '#ff3355';
      case 'retraining': return '#00d4ff';
      default: return '#2d4a6a';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ff3355';
      case 'analyst': return '#00d4ff';
      case 'viewer': return '#ff8833';
      default: return '#2d4a6a';
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span style={{ color: '#00ff41', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
          </div>
          <h1 className="page-title" style={{ color: '#00d4ff', letterSpacing: '3px' }}>
            {'' /* text symbol replaces icon-glow span */} Administration
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>User management · Pipeline control · Model retraining · System monitoring</p>
        </div>
        <div className="header-actions">
          <div className="admin-health" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>
            {pipeline.filter(p => p.status === 'running').length}/{pipeline.length} pipelines active
          </div>
        </div>
      </header>

      {/* Admin tabs */}
      <div className="admin-tabs">
        {[
          { id: 'pipeline', label: 'Pipeline Control', symbol: '≋' },
          { id: 'models', label: 'Models', symbol: '◈' },
          { id: 'users', label: 'User Management', symbol: '[]' },
          { id: 'terminal', label: 'Terminal', symbol: '>_' },
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              background: activeTab === tab.id ? 'rgba(0,212,255,0.08)' : 'transparent',
              color: activeTab === tab.id ? '#00d4ff' : '#2d4a6a',
              borderBottom: activeTab === tab.id ? '2px solid rgba(0,212,255,0.4)' : '2px solid transparent',
            }}
            className="admin-tab transition-all cursor-pointer"
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.symbol} {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline Control */}
      {activeTab === 'pipeline' && (
        <div className="pipeline-grid">
          {pipeline.map(node => (
            <div key={node.id} style={{ background: 'rgba(10,18,28,0.85)', border: `1px solid ${node.status === 'error' ? 'rgba(255,51,85,0.3)' : 'rgba(0,212,255,0.12)'}` }} className="rounded-lg p-4 transition-all">
              <div className="pipeline-card-header flex items-start justify-between">
                <div>
                  <div className="pipeline-name" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{node.name}</div>
                  <div className="pipeline-id" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '10px' }}>{node.id}</div>
                </div>
                <div className="pipeline-status flex items-center gap-2" style={{ color: getStatusColor(node.status), fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                  <span className="pulse-dot" style={{ backgroundColor: getStatusColor(node.status), width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }} />
                  {node.status.toUpperCase()}
                </div>
              </div>
              <div className="pipeline-metrics grid grid-cols-2 gap-3 mt-3">
                <div className="metric">
                  <div className="metric-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Throughput</div>
                  <div className="metric-value" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{node.throughput}</div>
                </div>
                <div className="metric">
                  <div className="metric-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Latency</div>
                  <div className="metric-value" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{node.latency_ms}ms</div>
                </div>
              </div>
              <div className="resource-bars mt-3 space-y-2">
                <div className="resource-bar flex items-center gap-2">
                  <span className="resource-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', fontWeight: 600 }}>CPU</span>
                  <div className="resource-track flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                    <div className="resource-fill h-full rounded-full transition-all" style={{ width: `${node.cpu_pct}%`, backgroundColor: node.cpu_pct > 80 ? '#ff3355' : node.cpu_pct > 50 ? '#ff8833' : '#00ff41' }} />
                  </div>
                  <span className="resource-val" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '11px' }}>{node.cpu_pct}%</span>
                </div>
                <div className="resource-bar flex items-center gap-2">
                  <span className="resource-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', fontWeight: 600 }}>MEM</span>
                  <div className="resource-track flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                    <div className="resource-fill h-full rounded-full transition-all" style={{ width: `${node.memory_pct}%`, backgroundColor: node.memory_pct > 80 ? '#ff3355' : node.memory_pct > 50 ? '#ff8833' : '#00d4ff' }} />
                  </div>
                  <span className="resource-val" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '11px' }}>{node.memory_pct}%</span>
                </div>
              </div>
              <div className="pipeline-actions mt-3">
                <button
                  className="btn btn-xs cursor-pointer"
                  onClick={() => handleTogglePipeline(node.id)}
                  style={{
                    background: node.status === 'running' ? 'rgba(255,51,85,0.15)' : 'rgba(0,255,65,0.15)',
                    color: node.status === 'running' ? '#ff3355' : '#00ff41',
                    border: `1px solid ${node.status === 'running' ? 'rgba(255,51,85,0.3)' : 'rgba(0,255,65,0.3)'}`,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {node.status === 'running' ? '■ Pause' : '▶ Resume'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Models */}
      {activeTab === 'models' && (
        <div className="models-section">
          <div className="models-grid">
            {models.map(model => (
              <div key={model.name} style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }} className="rounded-lg p-4">
                <div className="model-card-header flex items-center justify-between mb-3">
                  <div className="model-name" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{model.name}</div>
                  <div className="model-version" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '11px' }}>v{model.version}</div>
                </div>
                <div className="model-metrics">
                  <div className="model-accuracy flex items-center justify-center mb-3">
                    <div className="accuracy-ring relative" style={{ width: '60px', height: '60px' }}>
                      <svg viewBox="0 0 36 36" style={{ width: '60px', height: '60px' }}>
                        <path className="accuracy-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="3" />
                        <path
                          className="accuracy-fill"
                          strokeDasharray={`${model.accuracy}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#00d4ff"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="accuracy-value absolute inset-0 flex items-center justify-center" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '14px', fontWeight: 700 }}>
                        {model.accuracy.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="model-details space-y-1.5">
                    <div className="model-detail-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: '#5a7a9a' }}>Samples</span>
                      <span style={{ color: '#c8d6e5' }}>{model.samples.toLocaleString()}</span>
                    </div>
                    <div className="model-detail-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: '#5a7a9a' }}>Trained</span>
                      <span style={{ color: '#c8d6e5' }}>{model.last_trained}</span>
                    </div>
                    <div className="model-detail-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: '#5a7a9a' }}>Status</span>
                      <span style={{ color: getStatusColor(model.status) }}>{model.status}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-full mt-3 cursor-pointer"
                  onClick={() => handleRetrain(model.name)}
                  disabled={retrainingModel === model.name}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {retrainingModel === model.name ? '⟳ Retraining...' : '↻ Retrain Model'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {activeTab === 'users' && (
        <div className="users-section">
          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>ID</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Username</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Role</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Status</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Last Login</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Sessions</th>
                  <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px', padding: '11px 16px' }}>{user.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '11px 16px' }}>{user.username}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span className="role-badge" style={{
                        backgroundColor: getRoleColor(user.role).replace(')', ',0.15)').replace('rgb', 'rgba'),
                        color: getRoleColor(user.role),
                        border: `1px solid ${getRoleColor(user.role).replace(')', ',0.3)')}`,
                        fontFamily: 'var(--font-mono)',
                        fontSize: '10px',
                        padding: '3px 10px',
                        borderRadius: '9999px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        fontWeight: 700,
                        display: 'inline-block',
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span className="user-status flex items-center gap-2" style={{ color: getStatusColor(user.status), fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        <span className="user-status-dot" style={{ backgroundColor: getStatusColor(user.status), width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }} />
                        {user.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '11px 16px' }}>{new Date(user.last_login).toLocaleString()}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '11px 16px' }}>{user.sessions}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <div className="action-btns">
                        <button
                          className="btn-xs cursor-pointer"
                          style={{
                            background: user.status === 'locked' ? 'rgba(0,255,65,0.15)' : 'rgba(255,136,51,0.15)',
                            color: user.status === 'locked' ? '#00ff41' : '#ff8833',
                            border: `1px solid ${user.status === 'locked' ? 'rgba(0,255,65,0.3)' : 'rgba(255,136,51,0.3)'}`,
                            fontFamily: 'var(--font-mono)',
                          }}
                          onClick={() => setUsers(prev => prev.map(u =>
                            u.id === user.id ? { ...u, status: u.status === 'locked' ? 'active' as const : 'locked' as const, sessions: u.status === 'locked' ? 1 : 0 } : u
                          ))}
                        >
                          {user.status === 'locked' ? 'Unlock' : 'Lock'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Terminal */}
      {activeTab === 'terminal' && (
        <div className="admin-terminal rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(6,10,16,0.95)' }}>
          <div className="terminal-header flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(0,212,255,0.12)', background: 'rgba(10,16,24,0.9)' }}>
            <div className="terminal-buttons flex items-center gap-2">
              <span className="terminal-btn w-3 h-3 rounded-full" style={{ backgroundColor: '#ff3355' }} />
              <span className="terminal-btn w-3 h-3 rounded-full" style={{ backgroundColor: '#ff8833' }} />
              <span className="terminal-btn w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff41' }} />
            </div>
            <span className="terminal-title" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px' }}>ekadhara@admin:~</span>
          </div>
          <div className="terminal-body p-4 overflow-y-auto scrollbar-thin" ref={terminalRef} style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', maxHeight: '400px', color: '#c8d6e5' }}>
            {terminalLines.map((line, i) => (
              <div key={i} className="terminal-line" style={{ color: line.includes('WARN') ? '#ff8833' : line.includes('ERROR') ? '#ff3355' : line.includes('RETRAIN') ? '#00d4ff' : '#c8d6e5' }}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
