import React, { useState, useEffect, useRef } from 'react';

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

function IntegrationPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [outgoingEvents, setOutgoingEvents] = useState<OutgoingEvent[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<string>('siem');
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [totalSent, setTotalSent] = useState(0);
  const eventsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const integrationsData: Integration[] = [
      { id: 'INT-001', name: 'SOC Platform (SIEM)', type: 'siem', endpoint: '192.168.50.10:514', status: 'connected', events_sent: 15234, last_heartbeat: new Date(Date.now() - 5000).toISOString(), latency_ms: 12 },
      { id: 'INT-002', name: 'SIEM Emulator', type: 'siem-emulator', endpoint: 'localhost:8080/api/v1/alerts', status: 'connected', events_sent: 8921, last_heartbeat: new Date(Date.now() - 2000).toISOString(), latency_ms: 3 },
      { id: 'INT-003', name: 'REST API Endpoint', type: 'api', endpoint: 'https://api.internal/v2/ingest', status: 'disconnected', events_sent: 2341, last_heartbeat: new Date(Date.now() - 60000).toISOString(), latency_ms: 0 },
      { id: 'INT-004', name: 'Fluent Bit Forwarder', type: 'forwarder', endpoint: 'localhost:24224', status: 'connected', events_sent: 56789, last_heartbeat: new Date(Date.now() - 1000).toISOString(), latency_ms: 1 },
      { id: 'INT-005', name: 'Windows Agent', type: 'agent', endpoint: '192.168.50.20:5000', status: 'error', events_sent: 1234, last_heartbeat: new Date(Date.now() - 120000).toISOString(), latency_ms: 0 },
    ];
    setIntegrations(integrationsData);

    const events: OutgoingEvent[] = [];
    for (let i = 0; i < 10; i++) {
      events.push({
        id: `EVT-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - i * 2000).toISOString(),
        format: ['ocsf', 'json', 'cef', 'syslog'][Math.floor(Math.random() * 4)] as any,
        target: integrationsData[Math.floor(Math.random() * integrationsData.length)].name,
        threat_class: ['DDoS', 'Port Scan', 'Exfiltration', 'Beaconing', 'DGA'][Math.floor(Math.random() * 5)],
        confidence: Math.floor(Math.random() * 40) + 60,
        size_bytes: Math.floor(Math.random() * 2000) + 200,
        status: ['sent', 'sent', 'sent', 'queued', 'failed'][Math.floor(Math.random() * 5)] as any,
      });
    }
    setOutgoingEvents(events);
  }, []);

  useEffect(() => {
    if (eventsRef.current) {
      eventsRef.current.scrollTop = 0;
    }
  }, [outgoingEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent: OutgoingEvent = {
        id: `EVT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        format: ['ocsf', 'json', 'cef', 'syslog'][Math.floor(Math.random() * 4)] as any,
        target: integrations[Math.floor(Math.random() * integrations.length)]?.name || 'Unknown',
        threat_class: ['DDoS', 'Port Scan', 'Exfiltration', 'Beaconing', 'DGA', 'TLS Anomaly'][Math.floor(Math.random() * 6)],
        confidence: Math.floor(Math.random() * 40) + 60,
        size_bytes: Math.floor(Math.random() * 2000) + 200,
        status: Math.random() < 0.95 ? 'sent' : Math.random() < 0.5 ? 'queued' : 'failed',
      };
      setOutgoingEvents(prev => [newEvent, ...prev].slice(0, 100));
      setEventsPerSec(Math.floor(Math.random() * 300) + 100);
      setTotalSent(prev => prev + 1);
    }, 1500);
    return () => clearInterval(interval);
  }, [integrations]);

  const handleAddIntegration = () => {
    if (!newName || !newEndpoint) return;
    const newInt: Integration = {
      id: `INT-${String(integrations.length + 1).padStart(3, '0')}`,
      name: newName,
      type: newType as any,
      endpoint: newEndpoint,
      status: 'disconnected',
      events_sent: 0,
      last_heartbeat: new Date().toISOString(),
      latency_ms: 0,
    };
    setIntegrations(prev => [...prev, newInt]);
    setNewName('');
    setNewEndpoint('');
    setNewType('siem');
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return '#00ff41';
      case 'disconnected': return '#ff8833';
      case 'error': return '#ff3355';
      default: return '#2d4a6a';
    }
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      ocsf: 'rgba(0,212,255,0.15)', json: 'rgba(0,255,65,0.15)', cef: 'rgba(255,136,51,0.15)', syslog: 'rgba(90,122,154,0.15)',
    };
    return colors[format] || 'rgba(200,214,229,0.1)';
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span style={{ color: '#00ff41', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
          </div>
          <h1 className="page-title" style={{ color: '#00d4ff', letterSpacing: '3px' }}>
            {''} Integrations
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>Outbound alerting — OCSF, CEF, JSON, Syslog — zero-trust agents</p>
        </div>
        <div className="header-actions">
          <div className="integration-header-stats flex items-center gap-4">
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '16px', fontWeight: 700 }}>{eventsPerSec}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>evt/s</span>
            </div>
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#00ff41', fontSize: '16px', fontWeight: 700 }}>{totalSent}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>sent</span>
            </div>
            <div className="mini-stat text-center">
              <span className="mini-val block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '16px', fontWeight: 700 }}>{integrations.filter(i => i.status === 'connected').length}/{integrations.length}</span>
              <span className="mini-lbl block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>online</span>
            </div>
          </div>
          <button className="btn btn-primary cursor-pointer" onClick={() => setShowAddForm(!showAddForm)} style={{ fontFamily: 'var(--font-mono)' }}>
            + Add Integration
          </button>
        </div>
      </header>

      {/* Add form */}
      {showAddForm && (
        <div className="integration-form rounded-lg p-4 mb-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="form-grid grid grid-cols-4 gap-4">
            <div className="form-group">
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Name</label>
              <input className="cyber-input w-full rounded-lg px-3 py-2 outline-none" style={{ background: 'rgba(6,10,16,0.9)', border: '1px solid rgba(0,212,255,0.12)', color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }} value={newName} onChange={e => setNewName(e.target.value)} placeholder="My SIEM" />
            </div>
            <div className="form-group">
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Endpoint</label>
              <input className="cyber-input w-full rounded-lg px-3 py-2 outline-none" style={{ background: 'rgba(6,10,16,0.9)', border: '1px solid rgba(0,212,255,0.12)', color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }} value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)} placeholder="host:port or https://..." />
            </div>
            <div className="form-group">
              <label className="block mb-1.5" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Type</label>
              <select className="cyber-select w-full rounded-lg px-3 py-2 outline-none cursor-pointer" style={{ background: 'rgba(6,10,16,0.9)', border: '1px solid rgba(0,212,255,0.12)', color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }} value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="siem">SIEM</option>
                <option value="siem-emulator">SIEM Emulator</option>
                <option value="api">REST API</option>
                <option value="agent">Agent</option>
                <option value="forwarder">Forwarder</option>
              </select>
            </div>
            <div className="form-actions flex items-end gap-2">
              <button className="btn btn-primary cursor-pointer" onClick={handleAddIntegration} style={{ fontFamily: 'var(--font-mono)' }}>Add</button>
              <button className="btn btn-secondary cursor-pointer" onClick={() => setShowAddForm(false)} style={{ fontFamily: 'var(--font-mono)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Integration cards */}
      <div className="integrations-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {integrations.map(int => (
          <div key={int.id} style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }} className="rounded-lg p-4 cursor-pointer transition-all" onClick={() => setSelectedIntegration(int)}>
            <div className="int-card-header flex items-center justify-between mb-3">
              <div className="int-name" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{int.name}</div>
              <div className="int-status flex items-center gap-2" style={{ color: getStatusColor(int.status), fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600 }}>
                <span className="int-dot" style={{ backgroundColor: getStatusColor(int.status), width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block' }} />
                {int.status}
              </div>
            </div>
            <div className="int-card-body space-y-2">
              <div className="int-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: '#5a7a9a' }}>Type</span>
                <span style={{ color: '#c8d6e5' }}>{int.type}</span>
              </div>
              <div className="int-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: '#5a7a9a' }}>Endpoint</span>
                <code style={{ color: '#00d4ff', fontSize: '11px' }}>{int.endpoint}</code>
              </div>
              <div className="int-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: '#5a7a9a' }}>Latency</span>
                <span style={{ color: '#c8d6e5' }}>{int.latency_ms > 0 ? `${int.latency_ms}ms` : '—'}</span>
              </div>
              <div className="int-row flex justify-between" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                <span style={{ color: '#5a7a9a' }}>Events</span>
                <span style={{ color: '#c8d6e5' }}>{int.events_sent.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }} className="int-card-footer flex items-center justify-between mt-3 pt-2">
              <span className="int-id" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '10px' }}>{int.id}</span>
              <span className="int-heartbeat" style={{ fontFamily: 'var(--font-mono)', color: '#ff3355', fontSize: '10px' }}>♥ {new Date(int.last_heartbeat).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Event stream */}
      <div className="event-stream-section rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(10,18,28,0.85)' }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
          <h3 className="section-title flex items-center gap-3" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>
            Outgoing Events
            <span className="live-badge px-2 py-0.5 rounded text-[10px]" style={{ background: 'rgba(0,255,65,0.1)', color: '#00ff41', border: '1px solid rgba(0,255,65,0.3)', fontFamily: 'var(--font-mono)', animation: 'pulse-dot 2s ease-in-out infinite' }}>LIVE</span>
          </h3>
        </div>
        <div className="event-stream overflow-x-auto" ref={eventsRef}>
          <table className="event-table w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Time</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Format</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Target</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Threat Class</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Confidence</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Size</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {outgoingEvents.map(evt => (
                <tr key={evt.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '11px', padding: '10px 16px' }}>{new Date(evt.timestamp).toLocaleTimeString()}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="format-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{ backgroundColor: getFormatBadge(evt.format), color: '#c8d6e5', border: `1px solid ${getFormatBadge(evt.format).replace('0.15', '0.3')}`, fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{evt.format.toUpperCase()}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '10px 16px' }}>{evt.target}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className="threat-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{ background: 'rgba(255,51,85,0.08)', color: '#ff3355', border: '1px solid rgba(255,51,85,0.25)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{evt.threat_class}</span>
                  </td>
                  <td style={{ padding: '10px 16px' }}>
                    <div className="confidence-bar flex items-center gap-2">
                      <div className="confidence-track w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                        <div className="confidence-fill h-full rounded-full" style={{ width: `${evt.confidence}%`, backgroundColor: evt.confidence > 80 ? '#00ff41' : evt.confidence > 60 ? '#ff8833' : '#00d4ff' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '11px' }}>{evt.confidence}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '10px 16px' }}>{evt.size_bytes}B</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`status-indicator flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-wider`} style={{
                      background: evt.status === 'sent' ? 'rgba(0,255,65,0.08)' : evt.status === 'queued' ? 'rgba(255,204,0,0.08)' : 'rgba(255,51,85,0.08)',
                      color: evt.status === 'sent' ? '#00ff41' : evt.status === 'queued' ? '#ffcc00' : '#ff3355',
                      border: `1px solid ${evt.status === 'sent' ? 'rgba(0,255,65,0.25)' : evt.status === 'queued' ? 'rgba(255,204,0,0.25)' : 'rgba(255,51,85,0.25)'}`,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}>
                      <span>{evt.status === 'sent' ? '✓' : evt.status === 'queued' ? '◌' : '✕'}</span>
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Integration detail modal */}
      {selectedIntegration && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(6,10,16,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedIntegration(null)}>
          <div className="modal-content rounded-lg p-6 max-w-lg w-full" style={{ background: 'rgba(10,18,28,0.95)', border: '1px solid rgba(0,212,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="material-detail-header flex items-center justify-between mb-4">
              <h3 className="modal-title" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '16px', fontWeight: 700 }}>{selectedIntegration.name}</h3>
              <button className="modal-close cursor-pointer" style={{ color: '#2d4a6a', fontFamily: 'var(--font-mono)' }} onClick={() => setSelectedIntegration(null)}>✕</button>
            </div>
            <div className="material-detail-grid grid grid-cols-2 gap-4">
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>ID</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}>{selectedIntegration.id}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Type</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedIntegration.type}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Endpoint</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}><code>{selectedIntegration.endpoint}</code></span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Status</label>
                <span className="detail-value block" style={{ color: getStatusColor(selectedIntegration.status), fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedIntegration.status}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Events Sent</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedIntegration.events_sent.toLocaleString()}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Latency</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedIntegration.latency_ms}ms</span>
              </div>
              <div className="detail-field col-span-2">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Last Heartbeat</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{new Date(selectedIntegration.last_heartbeat).toLocaleString()}</span>
              </div>
            </div>
            <div className="modal-actions flex gap-2 mt-4">
              <button className="btn btn-primary cursor-pointer" onClick={() => {
                setIntegrations(prev => prev.map(i =>
                  i.id === selectedIntegration.id ? { ...i, status: 'connected' as const, latency_ms: Math.floor(Math.random() * 20) + 1 } : i
                ));
                setSelectedIntegration(null);
              }} style={{ fontFamily: 'var(--font-mono)' }}>
                Reconnect
              </button>
              <button className="btn btn-danger cursor-pointer" onClick={() => {
                setIntegrations(prev => prev.filter(i => i.id !== selectedIntegration.id));
                setSelectedIntegration(null);
              }} style={{ fontFamily: 'var(--font-mono)' }}>
                Remove
              </button>
              <button className="btn btn-secondary cursor-pointer" onClick={() => setSelectedIntegration(null)} style={{ fontFamily: 'var(--font-mono)' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationPage;
