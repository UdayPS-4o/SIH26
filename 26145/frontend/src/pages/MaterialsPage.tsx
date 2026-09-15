import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Material } from '../types';
import { mockBackend } from '../lib/mockBackend';
import { materialsApi } from '../lib/api';

const CATEGORIES = ['All', 'Malware', 'C2', 'DDoS', 'Recon', 'Phishing', 'DNS'] as const;

// -- Helpers ---------------------------------------------------------------

const MALWARE_NAMES = ['Emotet', 'TrickBot', 'QakBot', 'CobaltStrike', 'Mirai', 'Mozi', 'Sality', 'Gozi', 'Phorphiex', 'Spora'];
const C2_NAMES = ['CobaltBeacon', 'EmpireC2', 'MythicC2', 'SliverC2', 'VenusC2', 'PoshC2', 'Covenant'];
const DDOS_NAMES = ['Mirai-Botnet', 'Mozi-Botnet', 'DDoS-Toolkit', 'Flooder-X', 'UDP-Flooder', 'SYN-Flooder'];
const RECON_NAMES = ['Nmap-Script', 'Masscan-Config', 'Shodan-Query', 'Zmap-Probe', 'Recon-Suite'];
const DNS_NAMES = ['DGA-Domain', 'DNS-Tunnel', 'DNS-Exfil', 'DynDNS-Config', 'DNS-Hijack'];
const SOURCES = ['DNS-Detect', 'Hybrid-Analysis', 'VirusTotal', 'AbuseIPDB', 'ThreatFox', 'OTX-AlienVault'];
const ALL_TYPES = ['Malware Sample', 'C2 Config', 'DDoS Tool', 'Recon Script', 'DNS Malware', 'Phishing Kit'];
const ALL_THREAT_CLASSES = ['DDoS', 'Beaconing', 'DGA', 'DNS Tunneling', 'TLS Anomaly', 'Port Scan', 'Exfiltration'];
const ALL_STATUSES: Array<'pending' | 'imported' | 'approved' | 'rejected'> = ['pending', 'imported', 'approved', 'rejected'];
const SEVERITIES: string[] = ['critical', 'high', 'medium', 'low'];

function generateMaterials(): Material[] {
  const items: Material[] = [];
  let id = 1;
  const cats = [
    { cat: 'Malware', names: MALWARE_NAMES },
    { cat: 'C2', names: C2_NAMES },
    { cat: 'DDoS', names: DDOS_NAMES },
    { cat: 'Recon', names: RECON_NAMES },
    { cat: 'Phishing', names: ['Phish-Kit-01', 'Phish-Kit-02', 'Phish-Kit-03'] },
    { cat: 'DNS', names: DNS_NAMES },
  ];
  for (const { cat, names } of cats) {
    for (const name of names) {
      const status = ALL_STATUSES[Math.floor(Math.random() * ALL_STATUSES.length)];
      items.push({
        id: `MAT-${String(id++).padStart(4, '0')}`,
        name: `${name}-v${Math.floor(Math.random() * 5) + 1}`,
        type: ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)],
        threat_class: ALL_THREAT_CLASSES[Math.floor(Math.random() * ALL_THREAT_CLASSES.length)],
        category: cat,
        status,
        confidence: Math.floor(Math.random() * 40) + 60,
        source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 30)).toISOString().split('T')[0],
        hash: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        size: `${(Math.random() * 500 + 10).toFixed(1)}KB`,
        severity: SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)],
        content_hash: Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
        description: `${name} — known ${cat.toLowerCase()} threat variant.`,
        activity_signature: `sig_${Array.from({ length: 16 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`,
        is_accepted: status === 'approved',
      });
    }
  }
  return items;
}

function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [filtered, setFiltered] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showNormalize, setShowNormalize] = useState(false);
  const [normalizeId, setNormalizeId] = useState<string | null>(null);
  const [normalizedResult, setNormalizedResult] = useState<any>(null);
  const [normalizing, setNormalizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [showUpload, setShowUpload] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [processingItems, setProcessingItems] = useState<Record<string, string>>({});
  const [showMatch, setShowMatch] = useState(false);
  const [matchingItems, setMatchingItems] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const connectWs = () => {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws');
        ws.onopen = () => { if (active) setWsConnected(true); };
        ws.onclose = () => { if (active) setWsConnected(false); };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg.type === 'material_update') {
              setMaterials(prev => {
                const next = prev.map(m => m.id === msg.material.id ? { ...m, ...msg.material } : m);
                return next;
              });
            }
          } catch {}
        };
        wsRef.current = ws;
      } catch { setWsConnected(false); }
    };
    connectWs();
    return () => {
      active = false;
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    setLoading(true);
    // Use mockBackend for materials since there's no real endpoint
    const data = generateMaterials();
    setMaterials(data);
    setFiltered(data);
    setLoading(false);
  }, []);

  const refreshMaterials = useCallback(() => {
    setMaterials(generateMaterials());
  }, []);

  const handleRefresh = () => refreshMaterials();

  const handleImport = async (id: string) => {
    setProcessingItems(prev => ({ ...prev, [id]: 'Checking registry...' }));
    await new Promise(r => setTimeout(r, 600));
    setProcessingItems(prev => ({ ...prev, [id]: 'Importing from DNS-Detect...' }));
    await new Promise(r => setTimeout(r, 800));
    setProcessingItems(prev => ({ ...prev, [id]: 'Generating activity signature...' }));
    await new Promise(r => setTimeout(r, 600));
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'imported' as const } : m));
    setProcessingItems(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleApprove = async (id: string) => {
    setProcessingItems(prev => ({ ...prev, [id]: 'Running classifier...' }));
    await new Promise(r => setTimeout(r, 500));
    setProcessingItems(prev => ({ ...prev, [id]: 'Writing to evidence table...' }));
    await new Promise(r => setTimeout(r, 500));
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'approved' as const, is_accepted: true } : m));
    setProcessingItems(prev => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleNormalize = async (id: string) => {
    setNormalizeId(id);
    setNormalizedResult(null);
    setShowNormalize(true);
    setNormalizing(true);
    const material = materials.find(m => m.id === id);
    const steps = [
      { text: 'Parsing raw source fields...', progress: 20 },
      { text: 'Mapping to EKADHARA canonical schema...', progress: 40 },
      { text: 'Generating SHA-256 content hash...', progress: 55 },
      { text: 'Computing fuzzy similarity to known samples...', progress: 70 },
      { text: 'Embedding ML feature vector (15-dim)...', progress: 85 },
      { text: 'Validation passed. Normalized.', progress: 100 },
    ];
    for (const step of steps) {
      await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
      setNormalizedResult((prev: any) => ({ ...prev, currentStep: step.text }));
    }
    setNormalizing(false);
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'imported' as const } : m));
  };

  const handleMatch = async (id: string) => {
    setNormalizeId(id);
    setShowMatch(true);
    setMatchingItems({});
    const steps = [
      { text: 'Normalizing input...', progress: 15 },
      { text: 'Building LSH index...', progress: 30 },
      { text: 'Scanning 500K registry entries...', progress: 50 },
      { text: 'Computing Jaccard similarity...', progress: 70 },
      { text: 'Finding best matches...', progress: 85 },
      { text: 'Done. 3 candidates.', progress: 100 },
    ];
    for (const step of steps) {
      setMatchingItems((prev: Record<string, string>) => ({ ...prev, [id]: step.text }));
      await new Promise(r => setTimeout(r, 500 + Math.random() * 400));
    }
  };

  const handleUploadClick = () => {
    setShowUpload(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const id = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));
      setProcessingItems(prev => ({ ...prev, [id]: 'Uploading...' }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => ({ ...prev, [id]: 100 }));
          setProcessingItems(prev => { const n = { ...prev }; delete n[id]; return n; });
        } else {
          setUploadProgress(prev => ({ ...prev, [id]: Math.floor(progress) }));
        }
      }, 300);
    });
    setShowUpload(false);
    setTimeout(handleRefresh, 2000);
  };

  const stats = {
    total: materials.length,
    imported: materials.filter(m => m.status === 'imported').length,
    normalized: materials.filter(m => m.status === 'normalized').length,
    approved: materials.filter(m => m.is_accepted).length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return { bg: 'rgba(255,0,51,0.1)', border: 'rgba(255,0,51,0.3)', text: '#ff3370' };
      case 'high': return { bg: 'rgba(255,120,0,0.1)', border: 'rgba(255,120,0,0.3)', text: '#ff8800' };
      case 'medium': return { bg: 'rgba(255,176,0,0.1)', border: 'rgba(255,176,0,0.3)', text: '#ffb000' };
      default: return { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)', text: '#00d4ff' };
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon-glow">📁</span> Evidence Registry
          </h1>
          <p className="page-subtitle">STIX TLP:WHITE materials — normalized, hashed, and machine-verifiable</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleUploadClick}>
            <span>+</span> Import Material
          </button>
          <button className="btn btn-secondary" onClick={handleRefresh}>
            <span>↻</span> Refresh
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="materials-stats">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.imported}</div>
          <div className="stat-label">Imported</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.normalized}</div>
          <div className="stat-label">Normalized</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-card ws-status">
          <div className={`ws-dot ${wsConnected ? 'connected' : ''}`} />
          <div className="stat-label">WS {wsConnected ? 'Live' : 'Offline'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="materials-filters">
        <div className="search-box">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, type, threat class..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-pills">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Material table */}
      <div className="materials-table-wrap">
        <table className="materials-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>Type</th>
              <th>Threat Class</th>
              <th>Severity</th>
              <th>Source</th>
              <th>Hash</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="table-loading">
                <div className="spinner" />
                <span>Loading materials...</span>
              </td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="table-error">{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="table-empty">No materials found</td></tr>
            ) : filtered.map(m => {
              const sevColor = getSeverityColor(m.severity);
              return (
                <tr key={m.id} className="material-row">
                  <td>
                    <span className={`status-badge status-${m.status}`}>
                      {m.status === 'imported' && '⤓'}
                      {m.status === 'normalized' && '◈'}
                      {m.status === 'approved' && '✓'}
                      {!m.status && '○'}
                      {m.status}
                    </span>
                  </td>
                  <td>
                    <div className="material-name" onClick={() => setSelectedMaterial(m)}>
                      {m.name}
                    </div>
                  </td>
                  <td><span className="type-badge">{m.type}</span></td>
                  <td><span className="threat-badge">{m.threat_class}</span></td>
                  <td>
                    <span className="severity-badge" style={{
                      backgroundColor: sevColor.bg,
                      borderColor: sevColor.border,
                      color: sevColor.text,
                    }}>
                      {m.severity}
                    </span>
                  </td>
                  <td><span className="source-text">{m.source}</span></td>
                  <td>
                    <code className="hash-text">{m.content_hash?.slice(0, 16)}...</code>
                  </td>
                  <td>
                    <div className="action-btns">
                      {m.status === 'new' && (
                        <button className="btn-xs btn-import" onClick={() => handleImport(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Import'}
                        </button>
                      )}
                      {(m.status === 'imported' || m.status === 'normalized') && (
                        <button className="btn-xs btn-normalize" onClick={() => handleNormalize(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Normalize'}
                        </button>
                      )}
                      {m.status === 'normalized' && (
                        <button className="btn-xs btn-approve" onClick={() => handleApprove(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Approve'}
                        </button>
                      )}
                      <button className="btn-xs btn-match" onClick={() => handleMatch(m.id)}>
                        Match
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Normalize modal */}
      {showNormalize && (
        <div className="modal-overlay" onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Normalizing Material</h3>
            <div className="normalize-terminal">
              <div className="terminal-line">{'>'} Loading material: {normalizeId}</div>
              {normalizedResult?.currentStep && (
                <div className="terminal-line terminal-active">{'>'} {normalizedResult.currentStep}</div>
              )}
              {normalizing && <div className="terminal-cursor">█</div>}
              {!normalizing && <div className="terminal-line terminal-success">{'>'} ✓ Normalization complete. Material ready for approval.</div>}
            </div>
            {!normalizing && (
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match modal */}
      {showMatch && (
        <div className="modal-overlay" onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Finding Matches</h3>
            <div className="normalize-terminal">
              <div className="terminal-line">{'>'} Material: {normalizeId}</div>
              <div className="terminal-line">{'>'} Running LSH-based similarity search...</div>
              {Object.entries(matchingItems).map(([id, text]) => (
                <div key={id} className="terminal-line terminal-active">{'>'} {text}</div>
              ))}
            </div>
            {(matchingItems && Object.values(matchingItems).length > 0 && String(Object.values(matchingItems)[Object.values(matchingItems).length - 1]).includes('Done')) && (
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Import Materials</h3>
            <div className="upload-zone" onClick={() => document.getElementById('file-input')?.click()}>
              <div className="upload-icon">☁</div>
              <p className="upload-text">Drop files here or click to browse</p>
              <p className="upload-sub">Accepts: STIX JSON, PCAP, PCAPNG, ZIP, CSV</p>
              <input
                id="file-input"
                type="file"
                multiple
                accept=".json,.pcap,.pcapng,.zip,.csv"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>
            {Object.entries(uploadProgress).length > 0 && (
              <div className="upload-progress-list">
                {Object.entries(uploadProgress).map(([id, pct]) => (
                  <div key={id} className="upload-progress-item">
                    <div className="upload-progress-label">
                      <span>Uploading...</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowUpload(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Material detail modal */}
      {selectedMaterial && !showNormalize && !showMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMaterial(null)}>
          <div className="modal-content material-detail" onClick={e => e.stopPropagation()}>
            <div className="material-detail-header">
              <h3 className="modal-title">{selectedMaterial.name}</h3>
              <button className="modal-close" onClick={() => setSelectedMaterial(null)}>✕</button>
            </div>
            <div className="material-detail-grid">
              <div className="detail-field">
                <label>Type</label>
                <span className="detail-value">{selectedMaterial.type}</span>
              </div>
              <div className="detail-field">
                <label>Threat Class</label>
                <span className="detail-value">{selectedMaterial.threat_class}</span>
              </div>
              <div className="detail-field">
                <label>Severity</label>
                <span className="detail-value">{selectedMaterial.severity}</span>
              </div>
              <div className="detail-field">
                <label>Status</label>
                <span className="detail-value">{selectedMaterial.status}</span>
              </div>
              <div className="detail-field">
                <label>Source</label>
                <span className="detail-value">{selectedMaterial.source}</span>
              </div>
              <div className="detail-field">
                <label>SHA-256 Hash</label>
                <span className="detail-value"><code>{selectedMaterial.content_hash}</code></span>
              </div>
              <div className="detail-field">
                <label>Description</label>
                <span className="detail-value">{selectedMaterial.description}</span>
              </div>
              <div className="detail-field">
                <label>Activity Signature</label>
                <span className="detail-value"><code>{selectedMaterial.activity_signature}</code></span>
              </div>
            </div>
            <div className="modal-actions">
              {selectedMaterial.status === 'imported' && (
                <button className="btn btn-primary" onClick={() => handleNormalize(selectedMaterial.id)}>
                  Normalize
                </button>
              )}
              {selectedMaterial.status === 'normalized' && (
                <button className="btn btn-success" onClick={() => handleApprove(selectedMaterial.id)}>
                  Approve
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedMaterial(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialsPage;
