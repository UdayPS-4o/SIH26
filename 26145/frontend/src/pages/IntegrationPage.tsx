import React, { useState, useEffect, useRef } from 'react';

/* ═══════════════════════════════════════════════════════════════════════
   EKADHARA — Integrations
   ═══════════════════════════════════════════════════════════════════════ */

interface Integration {
  id: string;
  name: string;
  type: 'siem' | 'siem-emulator' | 'api' | 'agent' | 'forwarder';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  events_sent: number;
  last_heartbeat: string;
  latency_ms: number;
}

interface OutgoingEvent {
  id: string;
  timestamp: string;
  format: 'ocsf' | 'json' | 'cef' | 'syslog';
  target: string;
  threat_class: string;
  confidence: number;
  size_bytes: number;
  status: 'sent' | 'queued' | 'failed';
}

const INTEGRATION_DATA: Integration[] = [
  { id: 'INT-001', name: 'SOC Platform (SIEM)', type: 'siem', endpoint: '192.168.50.10:514', status: 'connected', events_sent: 15234, last_heartbeat: new Date(Date.now() - 5000).toISOString(), latency_ms: 12 },
  { id: 'INT-002', name: 'SIEM Emulator', type: 'siem-emulator', endpoint: 'localhost:8080/api/v1/alerts', status: 'connected', events_sent: 8921, last_heartbeat: new Date(Date.now() - 2000).toISOString(), latency_ms: 3 },
  { id: 'INT-003', name: 'REST API Endpoint', type: 'api', endpoint: 'https://api.internal/v2/ingest', status: 'disconnected', events_sent: 2341, last_heartbeat: new Date(Date.now() - 60000).toISOString(), latency_ms: 0 },
  { id: 'INT-004', name: 'Fluent Bit Forwarder', type: 'forwarder', endpoint: 'localhost:24224', status: 'connected', events_sent: 56789, last_heartbeat: new Date(Date.now() - 1000).toISOString(), latency_ms: 1 },
  { id: 'INT-005', name: 'Windows Agent', type: 'agent', endpoint: '192.168.50.20:5000', status: 'error', events_sent: 1234, last_heartbeat: new Date(Date.now() - 120000).toISOString(), latency_ms: 0 },
];

const FORMAT_COLORS: Record<string, string> = { ocsf: 'var(--accent-cyan)', json: 'var(--accent-green)', cef: 'var(--accent-orange)', syslog: 'var(--accent-purple)' };
const THREAT_CLASSES = ['DDoS', 'Port Scan', 'Exfiltration', 'Beaconing', 'DGA', 'TLS Anomaly', 'SQL Injection', 'XSS', 'Brute Force', 'Malware C2'];
const FORMATS: Array<'ocsf' | 'json' | 'cef' | 'syslog'> = ['ocsf', 'json', 'cef', 'syslog'];

function generateEvents(count: number, integrations: Integration[]): OutgoingEvent[] {
  const events: OutgoingEvent[] = [];
  for (let i = 0; i < count; i++) {
    events.push({
      id: `EVT-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - i * 2000).toISOString(),
      format: FORMATS[Math.floor(Math.random() * FORMATS.length)],
      target: integrations[Math.floor(Math.random() * integrations.length)]?.name || 'Unknown',
      threat_class: THREAT_CLASSES[Math.floor(Math.random() * THREAT_CLASSES.length)],
      confidence: Math.floor(Math.random() * 40) + 60,
      size_bytes: Math.floor(Math.random() * 2000) + 200,
      status: Math.random() < 0.92 ? 'sent' : Math.random() < 0.5 ? 'queued' : 'failed',
    });
  }
  return events;
}

const STATUS_COLOR: Record<string, string> = {
  connected: 'var(--accent-green)', disconnected: 'var(--accent-orange)', error: 'var(--accent-red)',
};
const TYPE_COLORS: Record<string, string> = {
  siem: 'var(--accent-cyan)', 'siem-emulator': 'var(--accent-green)', api: 'var(--accent-orange)', agent: 'var(--accent-purple)', forwarder: 'var(--accent-cyan)',
};

function IntegrationPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(INTEGRATION_DATA);
  const [events, setEvents] = useState<OutgoingEvent[]>(() => generateEvents(15, INTEGRATION_DATA));
  const [selected, setSelected] = useState<Integration | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newType, setNewType] = useState<string>('siem');
  const [eventsPerSec, setEventsPerSec] = useState(142);
  const [totalSent, setTotalSent] = useState(0);
  const [queueDepth, setQueueDepth] = useState(12);
  const [throughputHistory, setThroughputHistory] = useState<number[]>(() => Array(60).fill(0).map(() => 100 + Math.random() * 100));
  const [avgLatency, setAvgLatency] = useState(8);
  const eventsRef = useRef<HTMLDivElement>(null);

  // Live simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: OutgoingEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        format: FORMATS[Math.floor(Math.random() * FORMATS.length)],
        target: integrations[Math.floor(Math.random() * integrations.length)]?.name || 'Unknown',
        threat_class: THREAT_CLASSES[Math.floor(Math.random() * THREAT_CLASSES.length)],
        confidence: Math.floor(Math.random() * 40) + 60,
        size_bytes: Math.floor(Math.random() * 2000) + 200,
        status: Math.random() < 0.92 ? 'sent' : Math.random() < 0.5 ? 'queued' : 'failed',
      };
      setEvents(prev => [newEvent, ...prev].slice(0, 100));
      setEventsPerSec(Math.floor(Math.random() * 120) + 80);
      setTotalSent(prev => prev + 1);
      setQueueDepth(Math.floor(Math.random() * 30) + 5);
      setThroughputHistory(prev => [...prev.slice(1), Math.floor(Math.random() * 120) + 80]);

      const connected = integrations.filter(i => i.status === 'connected' && i.latency_ms > 0);
      if (connected.length > 0) {
        const avg = Math.round(connected.reduce((s, i) => s + i.latency_ms, 0) / connected.length);
        setAvgLatency(avg);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [integrations]);

  const successRate = events.length > 0 ? (events.filter(e => e.status === 'sent').length / events.length) * 100 : 0;
  const maxThroughput = Math.max(...throughputHistory, 1);

  const handleAdd = () => {
    if (!newName || !newEndpoint) return;
    const newInt: Integration = {
      id: `INT-${String(integrations.length + 1).padStart(3, '0')}`,
      name: newName,
      type: newType as Integration['type'],
      endpoint: newEndpoint,
      status: 'disconnected',
      events_sent: 0,
      last_heartbeat: new Date().toISOString(),
      latency_ms: 0,
    };
    setIntegrations(prev => [...prev, newInt]);
    setNewName(''); setNewEndpoint(''); setNewType('siem'); setShowAdd(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── TOP STAT CARDS ─────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {[
          { label: 'Events/sec', value: eventsPerSec, color: 'var(--accent-cyan)' },
          { label: 'Total Sent', value: totalSent.toLocaleString(), color: 'var(--accent-green)' },
          { label: 'Online', value: `${integrations.filter(i => i.status === 'connected').length}/${integrations.length}`, color: 'var(--accent-green)' },
          { label: 'Queue', value: queueDepth, color: 'var(--accent-orange)' },
          { label: 'Avg Latency', value: `${avgLatency}ms`, color: 'var(--accent-green)' },
          { label: 'Success Rate', value: `${successRate.toFixed(1)}%`, color: 'var(--accent-cyan)' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px',
          }}>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>{card.label}</div>
            <div style={{ fontFamily: '"JetBrains Mono", monospace', color: card.color, fontSize: '22px', fontWeight: 700, lineHeight: 1 }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── THROUGHPUT SPARKLINE ─────────────────────────────────── */}
      <div style={{
        background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '14px',
        display: 'flex', alignItems: 'center', gap: '20px',
      }}>
        <div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '4px' }}>Throughput (60s)</div>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '20px', fontWeight: 700 }}>{eventsPerSec} <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 400 }}>evt/s</span></div>
        </div>
        <svg viewBox="0 0 120 40" style={{ width: '300px', height: '40px', flexShrink: 0 }}>
          {throughputHistory.map((val, i) => {
            const h = (val / maxThroughput) * 38;
            const x = (i / 59) * 120;
            return <rect key={i} x={x} y={40 - h} width={2} height={h} fill={i > 50 ? 'var(--accent-green)' : 'var(--accent-cyan)'} opacity={0.8} />;
          })}
        </svg>
      </div>

      {/* ── INTEGRATION CARDS ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {integrations.map(int => (
          <div key={int.id} onClick={() => setSelected(int)} style={{
            background: 'var(--bg-secondary)', border: `1px solid ${int.status === 'error' ? 'var(--mat-rejected-border)' : int.status === 'disconnected' ? 'rgba(255,136,51,0.2)' : 'var(--border-color)'}`,
            borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: 'border-color 0.2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '13px', fontWeight: 600 }}>{int.name}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '10px', marginTop: '2px' }}>{int.id}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: STATUS_COLOR[int.status] || 'var(--border-active)', boxShadow: `0 0 6px ${STATUS_COLOR[int.status] || 'var(--border-active)'}66` }} />
                <span style={{ fontFamily: '"JetBrains Mono", monospace', color: STATUS_COLOR[int.status] || 'var(--border-active)', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>{int.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Type</span>
                <span style={{ color: TYPE_COLORS[int.type] || 'var(--text-primary)', fontSize: '10px', textTransform: 'uppercase' }}>{int.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Endpoint</span>
                <code style={{ color: 'var(--accent-cyan)', fontSize: '11px', background: 'var(--color-info-dim)', padding: '1px 6px', borderRadius: '3px' }}>{int.endpoint}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Latency</span>
                <span style={{ color: 'var(--text-primary)' }}>{int.latency_ms > 0 ? `${int.latency_ms}ms` : '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: '"JetBrains Mono", monospace', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Events Sent</span>
                <span style={{ color: 'var(--text-primary)' }}>{int.events_sent.toLocaleString()}</span>
              </div>
            </div>

            {/* Throughput mini bar */}
            <div style={{ borderTop: '1px solid var(--color-info-dim)', paddingTop: '10px' }}>
              <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Throughput</div>
              <div style={{ height: '20px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                {Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 20).map((val, i) => (
                  <div key={i} style={{
                    flex: 1, height: `${val}%`, borderRadius: '1px',
                    background: int.status === 'connected' ? 'var(--accent-green)' : 'var(--accent-orange)', opacity: 0.5 + (val / 200),
                  }} />
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid var(--color-info-dim)' }}>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '10px' }}>{int.id}</span>
              <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-red)', fontSize: '10px' }}>♥ {new Date(int.last_heartbeat).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── FORMAT DISTRIBUTION + EVENT STREAM ───────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Format Distribution */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '14px' }}>Format Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(FORMAT_COLORS).map(([fmt, color]) => {
              const count = events.filter(e => e.format === fmt).length;
              const pct = events.length > 0 ? (count / events.length) * 100 : 0;
              return (
                <div key={fmt}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: color, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>{fmt}</span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '11px' }}>{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--color-info-dim)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: '4px', background: color, width: (pct + '%'), transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Stream */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderBottom: '1px solid #1a2736',
          }}>
            <span style={{ color: 'var(--accent-green)', fontFamily: '"JetBrains Mono", monospace', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Outgoing Events</span>
          </div>
          <div ref={eventsRef} style={{ maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a2736' }}>
                  {['Time', 'Format', 'Target', 'Class', 'Confidence', 'Status'].map(h => (
                    <th key={h} style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 12).map(evt => (
                  <tr key={evt.id} style={{ borderBottom: '1px solid var(--color-info-dim)' }}>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '10px', padding: '7px 12px' }}>
                      {new Date(evt.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      {(() => {
                        const fc = FORMAT_COLORS[evt.format] || 'var(--border-active)';
                        return (
                          <span style={{
                            fontFamily: '"JetBrains Mono", monospace', color: fc,
                            background: fc + '18',
                            border: '1px solid ' + fc + '44',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '9px', textTransform: 'uppercase', fontWeight: 600,
                          }}>{evt.format}</span>
                        );
                      })()}
                    </td>
                    <td style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '11px', padding: '7px 12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.target}</td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-red)',
                        background: 'var(--sev-critical-bg)', border: '1px solid rgba(239,68,68,0.2)',
                        padding: '2px 6px', borderRadius: '4px', fontSize: '9px', textTransform: 'uppercase',
                      }}>{evt.threat_class}</span>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--color-info-dim)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: '2px', background: evt.confidence > 80 ? 'var(--accent-green)' : evt.confidence > 60 ? 'var(--accent-orange)' : 'var(--accent-cyan)', width: `${evt.confidence}%` }} />
                        </div>
                        <span style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-primary)', fontSize: '10px' }}>{evt.confidence}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '7px 12px' }}>
                      <span style={{
                        fontFamily: '"JetBrains Mono", monospace', fontSize: '9px', textTransform: 'uppercase', fontWeight: 600,
                        color: evt.status === 'sent' ? 'var(--accent-green)' : evt.status === 'queued' ? 'var(--accent-yellow)' : 'var(--accent-red)',
                      }}>{evt.status === 'sent' ? '✓' : evt.status === 'queued' ? '◌' : '✕'} {evt.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── ADD INTEGRATION FORM ─────────────────────────────────── */}
      {showAdd && (
        <div style={{
          background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '8px', padding: '16px',
          display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="My SIEM" style={{
              width: '100%', background: 'var(--modal-backdrop)', border: '1px solid var(--accent-cyan)', borderRadius: '6px',
              padding: '8px 10px', color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', outline: 'none',
            }} />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Endpoint</label>
            <input value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)} placeholder="host:port or https://..." style={{
              width: '100%', background: 'var(--modal-backdrop)', border: '1px solid var(--accent-cyan)', borderRadius: '6px',
              padding: '8px 10px', color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', outline: 'none',
            }} />
          </div>
          <div style={{ minWidth: '130px' }}>
            <label style={{ display: 'block', fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '6px' }}>Type</label>
            <select value={newType} onChange={e => setNewType(e.target.value)} style={{
              width: '100%', background: 'var(--modal-backdrop)', border: '1px solid var(--accent-cyan)', borderRadius: '6px',
              padding: '8px 10px', color: 'var(--text-primary)', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', outline: 'none', cursor: 'pointer',
            }}>
              <option value="siem">SIEM</option>
              <option value="siem-emulator">SIEM Emulator</option>
              <option value="api">REST API</option>
              <option value="agent">Agent</option>
              <option value="forwarder">Forwarder</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} style={{
              background: 'var(--border-active)', color: 'var(--accent-cyan)', border: '1px solid var(--border-active)',
              borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
            }}>+ Add</button>
            <button onClick={() => setShowAdd(false)} style={{
              background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--accent-cyan)',
              borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── DETAIL MODAL ─────────────────────────────────────────── */}
      {selected && (
        <div onClick={() => setSelected(null)} style={{
          position: 'fixed', inset: 0, background: 'var(--overlay-strong)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--bg-secondary)', border: '1px solid #1a2736', borderRadius: '10px',
            padding: '24px', maxWidth: '480px', width: '90%',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--accent-cyan)', fontSize: '16px', fontWeight: 600 }}>{selected.name}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--border-active)', fontSize: '11px', marginTop: '2px' }}>{selected.id}</div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--border-active)', cursor: 'pointer', fontSize: '18px', fontFamily: '"JetBrains Mono", monospace' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Type', value: selected.type, color: TYPE_COLORS[selected.type] || 'var(--text-primary)' },
                { label: 'Status', value: selected.status, color: STATUS_COLOR[selected.status] },
                { label: 'Endpoint', value: selected.endpoint, color: 'var(--accent-cyan)' },
                { label: 'Latency', value: selected.latency_ms > 0 ? `${selected.latency_ms}ms` : '—', color: 'var(--text-primary)' },
                { label: 'Events Sent', value: selected.events_sent.toLocaleString(), color: 'var(--text-primary)' },
                { label: 'Last Heartbeat', value: new Date(selected.last_heartbeat).toLocaleString(), color: 'var(--text-primary)' },
              ].map(field => (
                <div key={field.label} style={{ background: 'var(--overlay-md)', borderRadius: '6px', padding: '10px', border: '1px solid var(--color-info-dim)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--text-secondary)', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '4px' }}>{field.label}</div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', color: field.color, fontSize: '12px', fontWeight: 600 }}>{field.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => {
                setIntegrations(prev => prev.map(i => i.id === selected.id ? { ...i, status: 'connected' as const, latency_ms: Math.floor(Math.random() * 20) + 1 } : i));
                setSelected(null);
              }} style={{
                flex: 1, background: 'var(--status-stopped-bg)', color: 'var(--accent-green)', border: '1px solid rgba(0,255,65,0.25)',
                borderRadius: '6px', padding: '8px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
              }}>Reconnect</button>
              <button onClick={() => { setIntegrations(prev => prev.filter(i => i.id !== selected.id)); setSelected(null); }} style={{
                flex: 1, background: 'var(--sev-critical-bg)', color: 'var(--accent-red)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '6px', padding: '8px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
              }}>Remove</button>
              <button onClick={() => setSelected(null)} style={{
                flex: 1, background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--accent-cyan)',
                borderRadius: '6px', padding: '8px', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: '12px',
              }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationPage;
