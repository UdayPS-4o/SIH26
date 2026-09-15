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
      case 'paused': case 'inactive': return '#ffb000';
      case 'error': case 'locked': return '#ff3370';
      case 'retraining': return '#00d4ff';
      default: return '#888';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ff3370';
      case 'analyst': return '#00d4ff';
      case 'viewer': return '#ffb000';
      default: return '#888';
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon-glow">⚙</span> Administration
          </h1>
          <p className="page-subtitle">User management · Pipeline control · Model retraining · System monitoring</p>
        </div>
        <div className="header-actions">
          <div className="admin-health">
            {pipeline.filter(p => p.status === 'running').length}/{pipeline.length} pipelines active
          </div>
        </div>
      </header>

      {/* Admin tabs */}
      <div className="admin-tabs">
        {[
          { id: 'pipeline', label: 'Pipeline Control', icon: '≋' },
          { id: 'models', label: 'Models', icon: '◈' },
          { id: 'users', label: 'User Management', icon: '👤' },
          { id: 'terminal', label: 'Terminal', icon: '>_' },
        ].map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Pipeline Control */}
      {activeTab === 'pipeline' && (
        <div className="pipeline-grid">
          {pipeline.map(node => (
            <div key={node.id} className={`pipeline-card ${node.status === 'error' ? 'card-error' : ''}`}>
              <div className="pipeline-card-header">
                <div>
                  <div className="pipeline-name">{node.name}</div>
                  <div className="pipeline-id">{node.id}</div>
                </div>
                <div className="pipeline-status" style={{ color: getStatusColor(node.status) }}>
                  <span className="pulse-dot" style={{ backgroundColor: getStatusColor(node.status) }} />
                  {node.status.toUpperCase()}
                </div>
              </div>
              <div className="pipeline-metrics">
                <div className="metric">
                  <div className="metric-label">Throughput</div>
                  <div className="metric-value">{node.throughput}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">Latency</div>
                  <div className="metric-value">{node.latency_ms}ms</div>
                </div>
              </div>
              <div className="resource-bars">
                <div className="resource-bar">
                  <span className="resource-label">CPU</span>
                  <div className="resource-track">
                    <div className="resource-fill" style={{ width: `${node.cpu_pct}%`, backgroundColor: node.cpu_pct > 80 ? '#ff3370' : node.cpu_pct > 50 ? '#ffb000' : '#00ff41' }} />
                  </div>
                  <span className="resource-val">{node.cpu_pct}%</span>
                </div>
                <div className="resource-bar">
                  <span className="resource-label">MEM</span>
                  <div className="resource-track">
                    <div className="resource-fill" style={{ width: `${node.memory_pct}%`, backgroundColor: node.memory_pct > 80 ? '#ff3370' : node.memory_pct > 50 ? '#ffb000' : '#00d4ff' }} />
                  </div>
                  <span className="resource-val">{node.memory_pct}%</span>
                </div>
              </div>
              <div className="pipeline-actions">
                <button
                  className="btn btn-xs"
                  onClick={() => handleTogglePipeline(node.id)}
                  style={{
                    backgroundColor: node.status === 'running' ? 'rgba(255,0,51,0.15)' : 'rgba(0,255,65,0.15)',
                    color: node.status === 'running' ? '#ff3370' : '#00ff41',
                    border: `1px solid ${node.status === 'running' ? 'rgba(255,0,51,0.3)' : 'rgba(0,255,65,0.3)'}`,
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
              <div key={model.name} className="model-card">
                <div className="model-card-header">
                  <div className="model-name">{model.name}</div>
                  <div className="model-version">v{model.version}</div>
                </div>
                <div className="model-metrics">
                  <div className="model-accuracy">
                    <div className="accuracy-ring">
                      <svg viewBox="0 0 36 36" className="accuracy-svg">
                        <path className="accuracy-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path
                          className="accuracy-fill"
                          strokeDasharray={`${model.accuracy}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="accuracy-value">{model.accuracy.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="model-details">
                    <div className="model-detail-row"><span>Samples</span><span>{model.samples.toLocaleString()}</span></div>
                    <div className="model-detail-row"><span>Trained</span><span>{model.last_trained}</span></div>
                    <div className="model-detail-row"><span>Status</span><span style={{ color: getStatusColor(model.status) }}>{model.status}</span></div>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => handleRetrain(model.name)}
                  disabled={retrainingModel === model.name}
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
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Sessions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td><code className="id-text">{user.id}</code></td>
                    <td>{user.username}</td>
                    <td>
                      <span className="role-badge" style={{
                        backgroundColor: getRoleColor(user.role).replace(')', ',0.15)').replace('rgb', 'rgba'),
                        color: getRoleColor(user.role),
                        borderColor: getRoleColor(user.role).replace(')', ',0.3)').replace('rgb', 'rgba'),
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className="user-status" style={{ color: getStatusColor(user.status) }}>
                        <span className="user-status-dot" style={{ backgroundColor: getStatusColor(user.status) }} />
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.last_login).toLocaleString()}</td>
                    <td>{user.sessions}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-xs"
                          style={{
                            backgroundColor: user.status === 'locked' ? 'rgba(0,255,65,0.15)' : 'rgba(255,176,0,0.15)',
                            color: user.status === 'locked' ? '#00ff41' : '#ffb000',
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
        <div className="admin-terminal">
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="terminal-btn terminal-btn-red">●</span>
              <span className="terminal-btn terminal-btn-yellow">●</span>
              <span className="terminal-btn terminal-btn-green">●</span>
            </div>
            <span className="terminal-title">ekadhara@admin:~</span>
          </div>
          <div className="terminal-body" ref={terminalRef}>
            {terminalLines.map((line, i) => (
              <div key={i} className="terminal-line">{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;
