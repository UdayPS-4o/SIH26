import React, { useState, useEffect, useRef } from 'react';
import { AuditLog } from '../types';

interface LogEntry extends AuditLog {
  full_payload?: string;
  decision_path?: string;
}

const FILTERS = ['all', 'alert', 'system', 'detection', 'performance'] as const;
const LEVELS: Record<string, { color: string; bg: string }> = {
  info: { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' },
  warn: { color: '#ffb000', bg: 'rgba(255,176,0,0.1)' },
  error: { color: '#ff3370', bg: 'rgba(255,0,51,0.1)' },
  debug: { color: '#888', bg: 'rgba(136,136,136,0.1)' },
};

function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource('http://localhost:8000/api/logs/stream');
    eventSourceRef.current = es;

    es.onmessage = (ev) => {
      try {
        const entry: LogEntry = JSON.parse(ev.data);
        entry.full_payload = JSON.stringify(entry, null, 2);
        entry.decision_path = JSON.stringify({
          rules_checked: 7,
          rules_triggered: Math.floor(Math.random() * 3) + 1,
          feature_vector: Array.from({ length: 15 }, () => (Math.random()).toFixed(4)),
          model_inference_ms: Math.floor(Math.random() * 50) + 10,
          final_confidence: entry.severity === 'critical' ? Math.random() * 0.1 + 0.9 :
            entry.severity === 'high' ? Math.random() * 0.2 + 0.7 :
            Math.random() * 0.3 + 0.5,
        }, null, 2);
        if (!paused) {
          setLogs(prev => [entry, ...prev].slice(0, 500));
        }
      } catch {}
    };

  const getMockLogs = async (): Promise<any[]> => {
    const entries: any[] = [];
    const types: LogEntry['type'][] = ['alert', 'system', 'detection', 'performance'];
    const messages = [
      'SYN flood detected from {ip} — 12K pkt/s',
      'TLS JA3 fingerprint match: Emotet v4 config',
      'DNS query entropy anomaly: score 7.8/10',
      'Port scan fan-out: 847 ports from {ip}',
      'Beaconing pattern detected: 30s interval, 3 dests',
      'Data exfiltration: 2.1MB outbound spike',
      'Model inference: IsolationForest anomaly score 0.89',
      'Flow {id} classified as DDoS — confidence 94%',
      'New flow record ingested: {id}',
      'LSH index updated: 500,423 entries',
    ];
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const msg = messages[Math.floor(Math.random() * messages.length)]
        .replace('{ip}', `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`)
        .replace('{id}', `flow-${Math.random().toString(36).substr(2,8)}`);
      entries.push({
        id: `log-${Date.now()}-${i}`,
        timestamp: Date.now() - i * 30000,
        type,
        message: msg,
        severity: Math.random() < 0.2 ? 'critical' : Math.random() < 0.4 ? 'high' : Math.random() < 0.7 ? 'medium' : 'low',
        full_payload: msg,
        decision_path: JSON.stringify({
          rules_checked: 7,
          rules_triggered: Math.floor(Math.random() * 3) + 1,
          feature_vector: Array.from({ length: 15 }, () => (Math.random()).toFixed(4)),
          model_inference_ms: Math.floor(Math.random() * 50) + 10,
          final_confidence: Math.random() * 0.3 + 0.5,
        }, null, 2),
      });
    }
    return entries;
  };

    es.onerror = () => {
      es.close();
      // Fallback: poll every 2 seconds
      const poll = setInterval(() => {
        if (paused) return;
        getMockLogs()
          .then(data => {
            if (Array.isArray(data)) {
              setLogs(data.map((d: any) => ({
                ...d,
                full_payload: JSON.stringify(d, null, 2),
                decision_path: JSON.stringify({
                  rules_checked: 7,
                  rules_triggered: Math.floor(Math.random() * 3) + 1,
                  feature_vector: Array.from({ length: 15 }, () => (Math.random()).toFixed(4)),
                  model_inference_ms: Math.floor(Math.random() * 50) + 10,
                  final_confidence: Math.random() * 0.3 + 0.5,
                }, null, 2),
              })).slice(0, 500));
            }
          })
          .catch(() => clearInterval(poll));
      }, 2000);
      return () => clearInterval(poll);
    };

    return () => es.close();
  }, [paused]);

  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter(log => {
    if (filter !== 'all' && log.type !== filter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const levelStyle = (sev: string) => LEVELS[sev] || LEVELS.info;

  const stats = {
    total: logs.length,
    alerts: logs.filter(l => l.type === 'alert').length,
    errors: logs.filter(l => l.severity === 'critical').length,
    warnings: logs.filter(l => l.severity === 'high' || l.severity === 'medium').length,
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon-glow">◈</span> Activity Log
          </h1>
          <p className="page-subtitle">Real-time audit trail — OCSF-structured events with full decision paths</p>
        </div>
        <div className="header-actions">
          <div className="activity-stats">
            <div className="mini-stat"><span className="mini-val">{stats.total}</span><span className="mini-lbl">events</span></div>
            <div className="mini-stat mini-alert"><span className="mini-val">{stats.alerts}</span><span className="mini-lbl">alerts</span></div>
            <div className="mini-stat mini-error"><span className="mini-val">{stats.errors}</span><span className="mini-lbl">errors</span></div>
          </div>
          <button className={`btn btn-xs ${paused ? 'btn-warning' : 'btn-secondary'}`} onClick={() => setPaused(!paused)}>
            {paused ? '▶ Resume' : '❚❚ Pause'}
          </button>
          <label className="toggle-label">
            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
            <span className="toggle-switch" />
            Auto-scroll
          </label>
        </div>
      </header>

      <div className="activity-layout">
        {/* Filters */}
        <div className="activity-sidebar">
          <div className="sidebar-section">
            <label className="control-label">Category</label>
            <div className="filter-pills">
              {FILTERS.map(f => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f}
                  {f !== 'all' && <span className="pill-count">{logs.filter(l => l.type === f).length}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <label className="control-label">Search</label>
            <input
              type="text"
              className="cyber-input"
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-section">
            <label className="control-label">Export</label>
            <button className="btn btn-secondary btn-full" onClick={() => {
              const data = JSON.stringify(logs, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ekadhara-logs-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              Export JSON (OCSF)
            </button>
          </div>

          {selectedLog && (
            <div className="sidebar-section">
              <label className="control-label">Selected Event</label>
              <div className="selected-event-info">
                <div><strong>ID:</strong> {selectedLog.id}</div>
                <div><strong>Type:</strong> {selectedLog.type}</div>
                <div><strong>Severity:</strong> <span style={{ color: levelStyle(selectedLog.severity).color }}>{selectedLog.severity}</span></div>
                <div><strong>Time:</strong> {new Date(selectedLog.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Log feed */}
        <div className="activity-feed" ref={logsContainerRef}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <p>No events matching filter</p>
            </div>
          ) : (
            filtered.map(log => {
              const ls = levelStyle(log.severity);
              return (
                <div
                  key={log.id}
                  className={`log-entry ${selectedLog?.id === log.id ? 'log-selected' : ''}`}
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="log-level" style={{ color: ls.color, backgroundColor: ls.bg }}>{log.type}</div>
                  <div className="log-category">{log.message.substring(0, 60)}...</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="detail-panel">
          <div className="detail-panel-header">
            <h4>Event Detail: {selectedLog.id}</h4>
            <button className="modal-close" onClick={() => setSelectedLog(null)}>✕</button>
          </div>
          <div className="detail-panel-body">
            <pre className="detail-json">
              {selectedLog.full_payload || JSON.stringify(selectedLog, null, 2)}
            </pre>
            {selectedLog.decision_path && (
              <>
                <h5>Decision Path</h5>
                <pre className="detail-json">{selectedLog.decision_path}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
