import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   WATCHTOWER — Activity Log
   ═══════════════════════════════════════════════════════════════════════ */

interface LogEntry {
  id: string;
  timestamp: number;
  type: 'alert' | 'system' | 'detection' | 'performance';
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  full_payload?: string;
  decision_path?: string;
}

const LEVELS: Record<string, { color: string; bg: string; dot: string }> = {
  critical: { color: 'var(--accent-red)', bg: 'rgba(239,68,68,0.12)', dot: 'var(--accent-red)' },
  high:     { color: 'var(--accent-orange)', bg: 'rgba(249,115,22,0.12)', dot: 'var(--accent-orange)' },
  medium:   { color: 'var(--accent-yellow)', bg: 'rgba(234,179,8,0.12)', dot: 'var(--accent-yellow)' },
  low:      { color: 'var(--accent-cyan)', bg: 'rgba(6,182,212,0.12)', dot: 'var(--accent-cyan)' },
};

const FILTERS = ['all', 'alert', 'system', 'detection', 'performance'] as const;

const MOCK_MESSAGES: string[] = [
  'SYN flood detected — 12K pkt/s from {ip}',
  'TLS JA3 fingerprint match: Emotet v4 config',
  'DNS query entropy anomaly: score 7.8/10',
  'Port scan fan-out: 847 ports from {ip}',
  'Beaconing pattern: 30s interval, 3 destinations',
  'Data exfiltration: 2.1MB outbound spike',
  'IsolationForest anomaly score: 0.89',
  'Flow {id} classified as DDoS — confidence 94%',
  'New flow record ingested: {id}',
  'LSH index updated: 500,423 entries',
  'HTTP flood mitigation: 45K req/min throttled',
  'C2 callback detected: {ip}:443 → 203.0.113.50',
  'DNS tunneling: 12K chars in TXT query',
  'RDP brute-force: 234 attempts from {ip}',
  'SSL certificate anomaly: self-signed cert on port 443',
  'ICMP ping flood: 8K pkt/s from {ip}',
  'SQL injection attempt on /api/v1/users',
  'XSS payload detected in HTTP POST body',
  'SMB enumeration: 47 shares scanned',
  'SSH dictionary attack: 1.2K attempts from {ip}',
];

const PIPELINE_STEPS = ['Ingest', 'Feature Ext.', 'Anomaly Det.', 'Classifier', 'Alert', 'Export'];

function randomIP(): string {
  return `${Math.floor(Math.random()*223)+1}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}.${Math.floor(Math.random()*256)}`;
}

function randomId(): string {
  return `flow-${Math.random().toString(36).substr(2, 8)}`;
}

function generateMockLogs(count: number): LogEntry[] {
  const types: LogEntry['type'][] = ['alert', 'system', 'detection', 'performance'];
  const entries: LogEntry[] = [];
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const msg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]
      .replace('{ip}', randomIP())
      .replace('{id}', randomId());
    entries.push({
      id: `LOG-${Date.now()}-${i}`,
      timestamp: Date.now() - i * 25000,
      type,
      message: msg,
      severity: Math.random() < 0.15 ? 'critical' : Math.random() < 0.35 ? 'high' : Math.random() < 0.65 ? 'medium' : 'low',
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
}

/* ═══════════════════════════════════════════════════════════════════════ */

function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>(() => generateMockLogs(25));
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const [eventsPerSec, setEventsPerSec] = useState(142);
  const [rateHistory, setRateHistory] = useState<number[]>(() => Array(30).fill(0).map(() => 80 + Math.random() * 120));
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Live event simulation
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      const newEntry: LogEntry = {
        id: `LOG-${Date.now()}`,
        timestamp: Date.now(),
        type: ['alert', 'system', 'detection', 'performance'][Math.floor(Math.random() * 4)] as LogEntry['type'],
        message: MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]
          .replace('{ip}', randomIP())
          .replace('{id}', randomId()),
        severity: Math.random() < 0.15 ? 'critical' : Math.random() < 0.35 ? 'high' : Math.random() < 0.65 ? 'medium' : 'low',
        full_payload: '',
        decision_path: JSON.stringify({
          rules_checked: 7,
          rules_triggered: Math.floor(Math.random() * 3) + 1,
          feature_vector: Array.from({ length: 15 }, () => (Math.random()).toFixed(4)),
          model_inference_ms: Math.floor(Math.random() * 50) + 10,
          final_confidence: Math.random() * 0.3 + 0.5,
        }, null, 2),
      };
      setLogs(prev => [newEntry, ...prev].slice(0, 500));
      setEventsPerSec(Math.floor(Math.random() * 120) + 80);
      setRateHistory(prev => [...prev.slice(1), Math.floor(Math.random() * 120) + 80]);
    }, 2000);
    return () => clearInterval(interval);
  }, [paused]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs, autoScroll]);

  // Stats
  const stats = {
    total: logs.length,
    alerts: logs.filter(l => l.type === 'alert').length,
    errors: logs.filter(l => l.severity === 'critical').length,
    warnings: logs.filter(l => l.severity === 'high' || l.severity === 'medium').length,
  };

  const severityCounts = {
    critical: logs.filter(l => l.severity === 'critical').length,
    high: logs.filter(l => l.severity === 'high').length,
    medium: logs.filter(l => l.severity === 'medium').length,
    low: logs.filter(l => l.severity === 'low').length,
  };
  const severityTotal = Math.max(logs.length, 1);
  const severityBars = [
    { label: 'Critical', count: severityCounts.critical, color: 'var(--accent-red)', pct: (severityCounts.critical / severityTotal) * 100 },
    { label: 'High', count: severityCounts.high, color: 'var(--accent-orange)', pct: (severityCounts.high / severityTotal) * 100 },
    { label: 'Medium', count: severityCounts.medium, color: 'var(--accent-yellow)', pct: (severityCounts.medium / severityTotal) * 100 },
    { label: 'Low', count: severityCounts.low, color: 'var(--accent-cyan)', pct: (severityCounts.low / severityTotal) * 100 },
  ];

  // Category breakdown
  const categoryCounts: Record<string, number> = {};
  logs.forEach(l => { categoryCounts[l.type] = (categoryCounts[l.type] || 0) + 1; });
  const categoryEntries = Object.entries(categoryCounts).sort(([,a],[,b]) => b - a);
  const categoryTotal = Math.max(logs.length, 1);
  const donutColors = ['var(--accent-cyan)', 'var(--accent-green)', 'var(--accent-orange)', 'var(--accent-red)', 'var(--accent-purple)'];

  const filtered = logs.filter(log => {
    if (filter !== 'all' && log.type !== filter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getPipelineStatus = (index: number, log: LogEntry | null): 'passed' | 'triggered' => {
    if (!log || !log.decision_path) return 'passed';
    try {
      const dp = JSON.parse(log.decision_path);
      const triggered = dp.rules_triggered || 0;
      return index < triggered ? 'triggered' : 'passed';
    } catch { return 'passed'; }
  };

  const maxRate = Math.max(...rateHistory, 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOP STAT CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total Events', value: stats.total, color: 'var(--accent-cyan)', icon: '◈' },
          { label: 'Alerts', value: stats.alerts, color: 'var(--accent-orange)', icon: '⚠' },
          { label: 'Critical', value: stats.errors, color: 'var(--accent-red)', icon: '✕' },
          { label: 'Warnings', value: stats.warnings, color: 'var(--accent-yellow)', icon: '◌' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{card.label}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: card.color, fontSize: '28px', fontWeight: 700, lineHeight: 1 }}>{card.value.toLocaleString()}</div>
              </div>
              <span style={{ fontSize: '18px', opacity: 0.6 }}>{card.icon}</span>
            </div>
            <div style={{ height: '3px', borderRadius: '2px', background: 'var(--border-color)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: '2px', background: `linear-gradient(90deg, ${card.color}, ${card.color}88)`, width: `${Math.min((card.value / Math.max(stats.total, 1)) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ── MIDDLE ROW: SIDEBAR + LOG FEED ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '16px', minHeight: '500px' }}>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Event Rate */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Event Rate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-green)', fontSize: '24px', fontWeight: 700 }}>{eventsPerSec}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px' }}>evt/s</span>
            </div>
            <svg viewBox="0 0 120 30" style={{ width: '100%', height: '30px' }}>
              {rateHistory.map((rate, i) => {
                const h = (rate / 200) * 28;
                const x = (i / 29) * 120;
                return <rect key={i} x={x} y={30 - h} width={4} height={h} fill={i > 25 ? 'var(--accent-green)' : 'var(--accent-cyan)'} opacity={0.7} />;
              })}
            </svg>
          </div>

          {/* Severity Distribution */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Severity Distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {severityBars.map(bar => (
                <div key={bar.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: bar.color, fontSize: '10px', fontWeight: 600 }}>{bar.label}</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px' }}>{bar.count} ({bar.pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(0,212,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '3px', background: bar.color, width: `${Math.min(bar.pct, 100)}%`, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Donut */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Categories</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg viewBox="0 0 36 36" style={{ width: '80px', height: '80px', transform: 'rotate(-90deg)', flexShrink: 0 }}>
                {categoryEntries.map(([cat, count], i) => {
                  const pct = (count / categoryTotal) * 100;
                  const offset = categoryEntries.slice(0, i).reduce((sum, [,c]) => sum + (c/categoryTotal)*100, 0);
                  return (
                    <circle key={cat} cx="18" cy="18" r="15.9155"
                      fill="none" stroke={donutColors[i % donutColors.length]}
                      strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-offset} />
                  );
                })}
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {categoryEntries.map(([cat, count], i) => (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: donutColors[i % donutColors.length], display: 'inline-block' }} />
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '10px' }}>{cat}</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px' }}>({count})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px' }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px' }}>Filter</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  background: filter === f ? 'rgba(0,212,255,0.1)' : 'transparent',
                  color: filter === f ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  border: `1px solid ${filter === f ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.08)'}`,
                  borderRadius: '6px', padding: '6px 10px', cursor: 'pointer',
                  fontFamily: '"JetBrains Mono", monospace', fontSize: '11px', textTransform: 'capitalize',
                  transition: 'all 0.2s',
                }}>
                  {f === 'all' ? 'All Events' : f}
                  {f !== 'all' && <span style={{ marginLeft: '6px', color: 'var(--text-secondary)' }}>{logs.filter(l => l.type === f).length}</span>}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search events..."
                style={{
                  width: '100%', background: 'rgba(6,10,16,0.8)', border: '1px solid rgba(0,212,255,0.12)',
                  borderRadius: '6px', padding: '8px 10px', color: 'var(--text-primary)', fontSize: '12px',
                  fontFamily: '"JetBrains Mono", monospace', outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => setPaused(!paused)} style={{
                flex: 1, background: paused ? 'rgba(255,136,51,0.15)' : 'transparent',
                color: paused ? 'var(--accent-orange)' : 'var(--text-secondary)', border: `1px solid ${paused ? 'rgba(255,136,51,0.3)' : 'rgba(0,212,255,0.12)'}`,
                borderRadius: '6px', padding: '6px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
              }}>
                {paused ? '▶ Resume' : '❚❚ Pause'}
              </button>
              <button onClick={() => {
                const data = JSON.stringify(logs, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `watchtower-logs-${Date.now()}.json`; a.click();
                URL.revokeObjectURL(url);
              }} style={{
                flex: 1, background: 'transparent', color: 'var(--accent-cyan)',
                border: '1px solid rgba(0,212,255,0.12)', borderRadius: '6px', padding: '6px', cursor: 'pointer',
                fontFamily: '"JetBrains Mono", monospace', fontSize: '11px',
              }}>Export JSON</button>
            </div>
          </div>
        </div>

        {/* LOG FEED */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px',
            overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderBottom: '1px solid #1a2736',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: 'var(--accent-green)', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Event Stream</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px' }}>({filtered.length} events)</span>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input type="checkbox" checked={autoScroll} onChange={e => setAutoScroll(e.target.checked)} />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px' }}>Auto-scroll</span>
              </label>
            </div>

            <div ref={logsContainerRef} style={{
              flex: 1, overflowY: 'auto', background: 'rgba(6,10,16,0.6)',
              maxHeight: '400px',
            }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '24px' }}>◈</div>
                  <p style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '12px', marginTop: '8px' }}>No events matching filter</p>
                </div>
              ) : (
                filtered.map((log, idx) => {
                  const ls = LEVELS[log.severity] || LEVELS.low;
                  return (
                    <div key={log.id} onClick={() => setSelectedLog(log)} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 16px', cursor: 'pointer',
                      background: selectedLog?.id === log.id ? 'rgba(0,212,255,0.06)' : idx % 2 === 0 ? 'transparent' : 'rgba(0,212,255,0.02)',
                      borderBottom: '1px solid rgba(0,212,255,0.04)',
                      borderLeft: `3px solid ${ls.color}`,
                      transition: 'background 0.15s',
                    }}>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '11px', width: '72px', flexShrink: 0 }}>
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}
                      </span>
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace', color: ls.color,
                        background: ls.bg, border: `1px solid ${ls.color}33`,
                        padding: '2px 8px', borderRadius: '4px', fontSize: '9px',
                        textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 600, flexShrink: 0,
                      }}>{log.type}</span>
                      <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '12px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.message}
                      </span>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: ls.color, flexShrink: 0, boxShadow: `0 0 4px ${ls.color}66` }} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── SELECTED LOG DETAIL ────────────────────────────────────── */}
      {selectedLog && (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderBottom: '1px solid #1a2736',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '13px', fontWeight: 600 }}>
                ◈ Detection Pipeline — {selectedLog.id}
              </span>
            </div>
            <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'var(--border-active)', cursor: 'pointer', fontSize: '16px', fontFamily: '"JetBrains Mono", monospace' }}>✕</button>
          </div>
          <div style={{ padding: '16px' }}>
            {/* Pipeline Steps */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', marginBottom: '16px' }}>
              {PIPELINE_STEPS.map((step, i) => {
                const status = getPipelineStatus(i, selectedLog);
                return (
                  <React.Fragment key={step}>
                    <div style={{
                      padding: '8px 14px', borderRadius: '6px', textAlign: 'center', minWidth: '100px',
                      background: status === 'triggered' ? 'rgba(239,68,68,0.1)' : 'rgba(0,255,65,0.06)',
                      border: `1px solid ${status === 'triggered' ? 'rgba(239,68,68,0.25)' : 'rgba(0,255,65,0.15)'}`,
                    }}>
                      <div style={{ fontFamily: '"JetBrains Mono", monospace', color: status === 'triggered' ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '11px', fontWeight: 600 }}>{step}</div>
                      <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', marginTop: '2px' }}>{status}</div>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <span style={{ color: status === 'triggered' ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '14px', flexShrink: 0 }}>→</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Event Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(6,10,16,0.6)', borderRadius: '6px', padding: '12px', border: '1px solid rgba(0,212,255,0.08)' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Event Details</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>ID</span>
                    <span style={{ color: 'var(--accent-cyan)' }}>{selectedLog.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                    <span style={{ color: 'var(--text-primary)' }}>{selectedLog.type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Severity</span>
                    <span style={{ color: (LEVELS[selectedLog.severity] || LEVELS.low).color }}>{selectedLog.severity.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Time</span>
                    <span style={{ color: 'var(--text-primary)' }}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div style={{ background: 'rgba(6,10,16,0.6)', borderRadius: '6px', padding: '12px', border: '1px solid rgba(0,212,255,0.08)' }}>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Decision Path</div>
                <pre style={{
                  fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '10px',
                  whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '120px',
                  margin: 0,
                }}>{selectedLog.decision_path || 'N/A'}</pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPage;
