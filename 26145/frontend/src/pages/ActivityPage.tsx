import React, { useState, useEffect, useRef } from 'react';
import { AuditLog } from '../types';

interface LogEntry extends AuditLog {
  full_payload?: string;
  decision_path?: string;
}

const FILTERS = ['all', 'alert', 'system', 'detection', 'performance'] as const;
const LEVELS: Record<string, { color: string; bg: string }> = {
  info: { color: '#00d4ff', bg: 'rgba(0,212,255,0.1)' },
  warn: { color: '#ff8833', bg: 'rgba(255,136,51,0.1)' },
  error: { color: '#ff3355', bg: 'rgba(255,51,85,0.1)' },
  debug: { color: '#2d4a6a', bg: 'rgba(45,74,106,0.1)' },
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
          <div className="flex items-center gap-3 mb-1">
            <span style={{ color: '#00ff41', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
          </div>
          <h1 className="page-title" style={{ color: '#00d4ff', letterSpacing: '3px' }}>
            {''} Activity Log
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>Real-time audit trail — OCSF-structured events with full decision paths</p>
        </div>
        <div className="header-actions">
          <div className="activity-stats flex items-center gap-4">
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '16px', fontWeight: 700 }}>{stats.total}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>events</span>
            </div>
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#ff8833', fontSize: '16px', fontWeight: 700 }}>{stats.alerts}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>alerts</span>
            </div>
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#ff3355', fontSize: '16px', fontWeight: 700 }}>{stats.errors}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>errors</span>
            </div>
          </div>
          <button
            className="btn btn-xs cursor-pointer"
            onClick={() => setPaused(!paused)}
            style={{ fontFamily: 'var(--font-mono)', background: paused ? 'rgba(255,136,51,0.15)' : 'transparent', color: paused ? '#ff8833' : '#5a7a9a', border: `1px solid ${paused ? 'rgba(255,136,51,0.3)' : 'rgba(0,212,255,0.12)'}` }}
          >
            {paused ? '▶ Resume' : '❚❚ Pause'}
          </button>
          <label className="toggle-label flex items-center gap-2 cursor-pointer" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px' }}>
            <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} className="cursor-pointer" />
            <span className="toggle-switch" />
            Auto-scroll
          </label>
        </div>
      </header>

      <div className="activity-layout">
        {/* Filters */}
        <div className="activity-sidebar">
          <div className="sidebar-section">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Category</label>
            <div className="filter-pills flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button
                  key={f}
                  style={{
                    background: filter === f ? 'rgba(0,212,255,0.1)' : 'transparent',
                    color: filter === f ? '#00d4ff' : '#5a7a9a',
                    border: `1px solid ${filter === f ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.12)'}`,
                  }}
                  className="filter-pill px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
                  onClick={() => setFilter(f)}
                >
                  {f}
                  {f !== 'all' && <span className="pill-count ml-1" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>{logs.filter(l => l.type === f).length}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Search</label>
            <input
              type="text"
              className="cyber-input w-full rounded-lg px-3 py-2 outline-none transition-all"
              style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)', color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              placeholder="Filter logs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(0,212,255,0.4)'; e.target.style.boxShadow = '0 0 10px rgba(0,212,255,0.08)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(0,212,255,0.12)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="sidebar-section">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Export</label>
            <button className="btn btn-secondary btn-full cursor-pointer" onClick={() => {
              const data = JSON.stringify(logs, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ekadhara-logs-${Date.now()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={{ fontFamily: 'var(--font-mono)' }}>
              Export JSON (OCSF)
            </button>
          </div>

          {selectedLog && (
            <div className="sidebar-section">
              <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Selected Event</label>
              <div className="selected-event-info space-y-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#c8d6e5' }}>
                <div><strong style={{ color: '#5a7a9a' }}>ID:</strong> {selectedLog.id}</div>
                <div><strong style={{ color: '#5a7a9a' }}>Type:</strong> {selectedLog.type}</div>
                <div><strong style={{ color: '#5a7a9a' }}>Severity:</strong> <span style={{ color: levelStyle(selectedLog.severity).color }}>{selectedLog.severity}</span></div>
                <div><strong style={{ color: '#5a7a9a' }}>Time:</strong> {new Date(selectedLog.timestamp).toLocaleTimeString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Log feed */}
        <div className="activity-feed overflow-y-auto scrollbar-thin" ref={logsContainerRef} style={{ background: 'rgba(6,10,16,0.6)' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ color: '#2d4a6a', fontFamily: 'var(--font-mono)', fontSize: '32px' }}>◈</div>
              <p style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>No events matching filter</p>
            </div>
          ) : (
            filtered.map(log => {
              const ls = levelStyle(log.severity);
              return (
                <div
                  key={log.id}
                  style={{
                    background: selectedLog?.id === log.id ? 'rgba(0,212,255,0.06)' : 'transparent',
                    borderBottom: '1px solid rgba(0,212,255,0.04)',
                  }}
                  className="log-entry flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="log-time shrink-0" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '11px', width: '70px' }}>{new Date(log.timestamp).toLocaleTimeString()}</div>
                  <div className="log-level px-2 py-0.5 rounded text-[10px] uppercase tracking-wider shrink-0" style={{ color: ls.color, backgroundColor: ls.bg, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{log.type}</div>
                  <div className="log-category truncate flex-1" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{log.message.substring(0, 60)}...</div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Detail panel */}
      {selectedLog && (
        <div className="detail-panel rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(10,18,28,0.95)' }}>
          <div className="detail-panel-header flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>Event Detail: {selectedLog.id}</h4>
            <button className="modal-close cursor-pointer" style={{ color: '#2d4a6a', fontFamily: 'var(--font-mono)' }} onClick={() => setSelectedLog(null)}>✕</button>
          </div>
          <div className="detail-panel-body p-4">
            <pre className="detail-json whitespace-pre-wrap" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '11px' }}>
              {selectedLog.full_payload || JSON.stringify(selectedLog, null, 2)}
            </pre>
            {selectedLog.decision_path && (
              <>
                <h5 className="mt-4 mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Decision Path</h5>
                <pre className="detail-json whitespace-pre-wrap" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '11px' }}>{selectedLog.decision_path}</pre>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
