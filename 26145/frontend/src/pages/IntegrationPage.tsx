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
      case 'disconnected': return '#ffb000';
      case 'error': return '#ff3370';
      default: return '#888';
    }
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      ocsf: 'rgba(0,212,255,0.15)', json: 'rgba(0,255,65,0.15)', cef: 'rgba(255,176,0,0.15)', syslog: 'rgba(136,136,255,0.15)',
    };
    return colors[format] || 'rgba(255,255,255,0.1)';
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon-glow">⟶</span> Integrations
          </h1>
          <p className="page-subtitle">Outbound alerting — OCSF, CEF, JSON, Syslog — zero-trust agents</p>
        </div>
        <div className="header-actions">
          <div className="integration-header-stats">
            <div className="mini-stat">
              <span className="mini-val">{eventsPerSec}</span>
              <span className="mini-lbl">evt/s</span>
            </div>
            <div className="mini-stat">
              <span className="mini-val">{totalSent}</span>
              <span className="mini-lbl">sent</span>
            </div>
            <div className="mini-stat mini-alert">
              <span className="mini-val">{integrations.filter(i => i.status === 'connected').length}/{integrations.length}</span>
              <span className="mini-lbl">online</span>
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <span>+</span> Add Integration
          </button>
        </div>
      </header>

      {/* Add form */}
      {showAddForm && (
        <div className="integration-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Name</label>
              <input className="cyber-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="My SIEM" />
            </div>
            <div className="form-group">
              <label>Endpoint</label>
              <input className="cyber-input" value={newEndpoint} onChange={e => setNewEndpoint(e.target.value)} placeholder="host:port or https://..." />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select className="cyber-select" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="siem">SIEM</option>
                <option value="siem-emulator">SIEM Emulator</option>
                <option value="api">REST API</option>
                <option value="agent">Agent</option>
                <option value="forwarder">Forwarder</option>
              </select>
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleAddIntegration}>Add</button>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Integration cards */}
      <div className="integrations-grid">
        {integrations.map(int => (
          <div key={int.id} className="integration-card" onClick={() => setSelectedIntegration(int)}>
            <div className="int-card-header">
              <div className="int-name">{int.name}</div>
              <div className="int-status" style={{ color: getStatusColor(int.status) }}>
                <span className="int-dot" style={{ backgroundColor: getStatusColor(int.status) }} />
                {int.status}
              </div>
            </div>
            <div className="int-card-body">
              <div className="int-row">
                <span className="int-label">Type</span>
                <span className="int-value">{int.type}</span>
              </div>
              <div className="int-row">
                <span className="int-label">Endpoint</span>
                <code className="int-endpoint">{int.endpoint}</code>
              </div>
              <div className="int-row">
                <span className="int-label">Latency</span>
                <span className="int-value">{int.latency_ms > 0 ? `${int.latency_ms}ms` : '—'}</span>
              </div>
              <div className="int-row">
                <span className="int-label">Events</span>
                <span className="int-value">{int.events_sent.toLocaleString()}</span>
              </div>
            </div>
            <div className="int-card-footer">
              <span className="int-id">{int.id}</span>
              <span className="int-heartbeat">♥ {new Date(int.last_heartbeat).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Event stream */}
      <div className="event-stream-section">
        <h3 className="section-title">
          Outgoing Events
          <span className="live-badge">LIVE</span>
        </h3>
        <div className="event-stream" ref={eventsRef}>
          <table className="event-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Format</th>
                <th>Target</th>
                <th>Threat Class</th>
                <th>Confidence</th>
                <th>Size</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {outgoingEvents.map(evt => (
                <tr key={evt.id}>
                  <td><span className="time-badge">{new Date(evt.timestamp).toLocaleTimeString()}</span></td>
                  <td><span className="format-badge" style={{ backgroundColor: getFormatBadge(evt.format) }}>{evt.format.toUpperCase()}</span></td>
                  <td>{evt.target}</td>
                  <td><span className="threat-badge">{evt.threat_class}</span></td>
                  <td>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{
                        width: `${evt.confidence}%`,
                        backgroundColor: evt.confidence > 80 ? '#00ff41' : evt.confidence > 60 ? '#ffb000' : '#00d4ff',
                      }} />
                      <span>{evt.confidence}%</span>
                    </div>
                  </td>
                  <td>{evt.size_bytes}B</td>
                  <td>
                    <span className={`status-indicator status-${evt.status}`}>
                      {evt.status === 'sent' && '✓'}
                      {evt.status === 'queued' && '◌'}
                      {evt.status === 'failed' && '✕'}
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
        <div className="modal-overlay" onClick={() => setSelectedIntegration(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="material-detail-header">
              <h3 className="modal-title">{selectedIntegration.name}</h3>
              <button className="modal-close" onClick={() => setSelectedIntegration(null)}>✕</button>
            </div>
            <div className="material-detail-grid">
              <div className="detail-field"><label>ID</label><span className="detail-value">{selectedIntegration.id}</span></div>
              <div className="detail-field"><label>Type</label><span className="detail-value">{selectedIntegration.type}</span></div>
              <div className="detail-field"><label>Endpoint</label><span className="detail-value"><code>{selectedIntegration.endpoint}</code></span></div>
              <div className="detail-field"><label>Status</label><span className="detail-value" style={{ color: getStatusColor(selectedIntegration.status) }}>{selectedIntegration.status}</span></div>
              <div className="detail-field"><label>Events Sent</label><span className="detail-value">{selectedIntegration.events_sent.toLocaleString()}</span></div>
              <div className="detail-field"><label>Latency</label><span className="detail-value">{selectedIntegration.latency_ms}ms</span></div>
              <div className="detail-field"><label>Last Heartbeat</label><span className="detail-value">{new Date(selectedIntegration.last_heartbeat).toLocaleString()}</span></div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => {
                setIntegrations(prev => prev.map(i =>
                  i.id === selectedIntegration.id ? { ...i, status: 'connected' as const, latency_ms: Math.floor(Math.random() * 20) + 1 } : i
                ));
                setSelectedIntegration(null);
              }}>
                Reconnect
              </button>
              <button className="btn btn-danger" onClick={() => {
                setIntegrations(prev => prev.filter(i => i.id !== selectedIntegration.id));
                setSelectedIntegration(null);
              }}>
                Remove
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedIntegration(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IntegrationPage;
