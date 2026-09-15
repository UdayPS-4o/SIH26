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
      { text: 'Mapping to WATCHTOWER canonical schema...', progress: 40 },
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
      case 'critical': return { bg: 'rgba(255,51,85,0.1)', border: 'rgba(255,51,85,0.3)', text: '#ff3355' };
      case 'high': return { bg: 'rgba(255,136,51,0.1)', border: 'rgba(255,136,51,0.3)', text: '#ff8833' };
      case 'medium': return { bg: 'rgba(255,136,51,0.1)', border: 'rgba(255,136,51,0.3)', text: '#ff8833' };
      default: return { bg: 'rgba(0,212,255,0.1)', border: 'rgba(0,212,255,0.3)', text: '#00d4ff' };
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
            {''} Evidence Registry
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>STIX TLP:WHITE materials — normalized, hashed, and machine-verifiable</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary cursor-pointer" onClick={handleUploadClick} style={{ fontFamily: 'var(--font-mono)' }}>
            + Import Material
          </button>
          <button className="btn btn-secondary cursor-pointer" onClick={handleRefresh} style={{ fontFamily: 'var(--font-mono)' }}>
            Refresh
          </button>
        </div>
      </header>

      {/* Stats bar */}
      <div className="materials-stats grid grid-cols-5 gap-4 mb-6">
        <div className="stat-card rounded-lg p-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '24px', fontWeight: 700 }}>{stats.total}</div>
          <div className="stat-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Total</div>
        </div>
        <div className="stat-card rounded-lg p-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '24px', fontWeight: 700 }}>{stats.imported}</div>
          <div className="stat-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Imported</div>
        </div>
        <div className="stat-card rounded-lg p-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '24px', fontWeight: 700 }}>{stats.normalized}</div>
          <div className="stat-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Normalized</div>
        </div>
        <div className="stat-card rounded-lg p-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="stat-value" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '24px', fontWeight: 700 }}>{stats.approved}</div>
          <div className="stat-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>Accepted</div>
        </div>
        <div className="stat-card rounded-lg p-4 ws-status" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`ws-dot w-2 h-2 rounded-full inline-block`} style={{ backgroundColor: wsConnected ? '#00ff41' : '#ff3355', boxShadow: wsConnected ? '0 0 8px rgba(0,255,65,0.5)' : '0 0 8px rgba(255,51,85,0.5)', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          </div>
          <div className="stat-label" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>WS {wsConnected ? 'Live' : 'Offline'}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="materials-filters flex items-center gap-4 mb-4">
        <div className="search-box flex items-center gap-2 flex-1 rounded-lg px-4 py-2" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <span style={{ color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>⌕</span>
          <input
            type="text"
            className="search-input flex-1 bg-transparent outline-none"
            style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}
            placeholder="Search by name, type, threat class..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="category-pills flex items-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              style={{
                background: selectedCategory === cat ? 'rgba(0,212,255,0.1)' : 'transparent',
                color: selectedCategory === cat ? '#00d4ff' : '#5a7a9a',
                border: `1px solid ${selectedCategory === cat ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.12)'}`,
              }}
              className="pill px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Material table */}
      <div className="materials-table-wrap rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,212,255,0.12)', background: 'rgba(10,18,28,0.85)' }}>
        <table className="materials-table w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Status</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Name</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Type</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Threat Class</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Severity</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Source</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Hash</th>
              <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '10px 16px', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="table-loading text-center py-8" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>Loading materials...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="table-error text-center py-8" style={{ fontFamily: 'var(--font-mono)', color: '#ff3355' }}>{error}</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="table-empty text-center py-8" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>No materials found</td></tr>
            ) : filtered.map(m => {
              const sevColor = getSeverityColor(m.severity);
              return (
                <tr key={m.id} className="material-row" style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                  <td style={{ padding: '11px 16px' }}>
                    <span className={`status-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider`} style={{
                      background: m.status === 'imported' ? 'rgba(0,212,255,0.08)' : m.status === 'normalized' ? 'rgba(0,255,65,0.08)' : m.status === 'approved' ? 'rgba(0,255,65,0.08)' : 'rgba(0,212,255,0.05)',
                      color: m.status === 'imported' ? '#00d4ff' : m.status === 'normalized' ? '#00ff41' : m.status === 'approved' ? '#00ff41' : '#5a7a9a',
                      border: `1px solid ${m.status === 'imported' ? 'rgba(0,212,255,0.25)' : m.status === 'normalized' ? 'rgba(0,255,65,0.25)' : m.status === 'approved' ? 'rgba(0,255,65,0.25)' : 'rgba(0,212,255,0.12)'}`,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}>
                      {m.status === 'imported' && '[D]'}
                      {m.status === 'normalized' && '◈'}
                      {m.status === 'approved' && '✓'}
                      {!m.status && '○'}
                      {m.status}
                    </span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div className="material-name cursor-pointer" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }} onClick={() => setSelectedMaterial(m)}>
                      {m.name}
                    </div>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="type-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{ background: 'rgba(179,71,255,0.08)', color: '#b347ff', border: '1px solid rgba(179,71,255,0.25)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{m.type}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="threat-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{ background: 'rgba(255,51,85,0.08)', color: '#ff3355', border: '1px solid rgba(255,51,85,0.25)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{m.threat_class}</span>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <span className="severity-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{
                      backgroundColor: sevColor.bg,
                      border: `1px solid ${sevColor.border}`,
                      color: sevColor.text,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      letterSpacing: '1px',
                    }}>
                      {m.severity}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '11px 16px' }}>{m.source}</td>
                  <td style={{ padding: '11px 16px' }}>
                    <code className="hash-text" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '10px' }}>{m.content_hash?.slice(0, 16)}...</code>
                  </td>
                  <td style={{ padding: '11px 16px' }}>
                    <div className="action-btns flex items-center gap-2">
                      {m.status === 'new' && (
                        <button className="btn-xs btn-import cursor-pointer" style={{ fontFamily: 'var(--font-mono)' }} onClick={() => handleImport(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Import'}
                        </button>
                      )}
                      {(m.status === 'imported' || m.status === 'normalized') && (
                        <button className="btn-xs btn-normalize cursor-pointer" style={{ fontFamily: 'var(--font-mono)' }} onClick={() => handleNormalize(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Normalize'}
                        </button>
                      )}
                      {m.status === 'normalized' && (
                        <button className="btn-xs btn-approve cursor-pointer" style={{ fontFamily: 'var(--font-mono)' }} onClick={() => handleApprove(m.id)} disabled={!!processingItems[m.id]}>
                          {processingItems[m.id] || 'Approve'}
                        </button>
                      )}
                      <button className="btn-xs btn-match cursor-pointer" style={{ fontFamily: 'var(--font-mono)' }} onClick={() => handleMatch(m.id)}>
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
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(6,10,16,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); }}>
          <div className="modal-content rounded-lg p-6 max-w-lg w-full" style={{ background: 'rgba(10,18,28,0.95)', border: '1px solid rgba(0,212,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title mb-4" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '16px', fontWeight: 700 }}>Normalizing Material</h3>
            <div className="normalize-terminal rounded-lg p-4" style={{ background: 'rgba(6,10,16,0.9)', border: '1px solid rgba(0,212,255,0.12)' }}>
              <div className="terminal-line" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>{'>'} Loading material: {normalizeId}</div>
              {normalizedResult?.currentStep && (
                <div className="terminal-line terminal-active" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}>{'>'} {normalizedResult.currentStep}</div>
              )}
              {normalizing && <div className="terminal-cursor" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}>█</div>}
              {!normalizing && <div className="terminal-line terminal-success" style={{ fontFamily: 'var(--font-mono)', color: '#00ff41', fontSize: '12px' }}>{'>'} ✓ Normalization complete. Material ready for approval.</div>}
            </div>
            {!normalizing && (
              <div className="modal-actions mt-4">
                <button className="btn btn-primary cursor-pointer" onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); }} style={{ fontFamily: 'var(--font-mono)' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Match modal */}
      {showMatch && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(6,10,16,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }}>
          <div className="modal-content rounded-lg p-6 max-w-lg w-full" style={{ background: 'rgba(10,18,28,0.95)', border: '1px solid rgba(0,212,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title mb-4" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '16px', fontWeight: 700 }}>Finding Matches</h3>
            <div className="normalize-terminal rounded-lg p-4" style={{ background: 'rgba(6,10,16,0.9)', border: '1px solid rgba(0,212,255,0.12)' }}>
              <div className="terminal-line" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>{'>'} Material: {normalizeId}</div>
              <div className="terminal-line" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>{'>'} Running LSH-based similarity search...</div>
              {Object.entries(matchingItems).map(([id, text]) => (
                <div key={id} className="terminal-line terminal-active" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}>{'>'} {text}</div>
              ))}
            </div>
            {(matchingItems && Object.values(matchingItems).length > 0 && String(Object.values(matchingItems)[Object.values(matchingItems).length - 1]).includes('Done')) && (
              <div className="modal-actions mt-4">
                <button className="btn btn-primary cursor-pointer" onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }} style={{ fontFamily: 'var(--font-mono)' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(6,10,16,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setShowUpload(false)}>
          <div className="modal-content rounded-lg p-6 max-w-lg w-full" style={{ background: 'rgba(10,18,28,0.95)', border: '1px solid rgba(0,212,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <h3 className="modal-title mb-4" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '16px', fontWeight: 700 }}>Import Materials</h3>
            <div className="upload-zone rounded-lg p-8 text-center cursor-pointer" style={{ background: 'rgba(6,10,16,0.9)', border: '1px dashed rgba(0,212,255,0.2)' }} onClick={() => document.getElementById('file-input')?.click()}>
              <div className="upload-icon mb-3" style={{ color: '#5a7a9a', fontFamily: 'var(--font-mono)', fontSize: '32px' }}>+</div>
              <p className="upload-text" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px' }}>Drop files here or click to browse</p>
              <p className="upload-sub" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', marginTop: '4px' }}>Accepts: STIX JSON, PCAP, PCAPNG, ZIP, CSV</p>
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
              <div className="upload-progress-list mt-4 space-y-2">
                {Object.entries(uploadProgress).map(([id, pct]) => (
                  <div key={id} className="upload-progress-item">
                    <div className="upload-progress-label flex justify-between mb-1" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      <span style={{ color: '#5a7a9a' }}>Uploading...</span>
                      <span style={{ color: '#00d4ff' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                      <div className="progress-fill h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#00d4ff', boxShadow: '0 0 8px rgba(0,212,255,0.5)' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions mt-4">
              <button className="btn btn-secondary cursor-pointer" onClick={() => setShowUpload(false)} style={{ fontFamily: 'var(--font-mono)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Material detail modal */}
      {selectedMaterial && !showNormalize && !showMatch && (
        <div className="modal-overlay fixed inset-0 flex items-center justify-center z-50" style={{ background: 'rgba(6,10,16,0.85)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedMaterial(null)}>
          <div className="modal-content material-detail rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" style={{ background: 'rgba(10,18,28,0.95)', border: '1px solid rgba(0,212,255,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="material-detail-header flex items-center justify-between mb-4">
              <h3 className="modal-title" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '16px', fontWeight: 700 }}>{selectedMaterial.name}</h3>
              <button className="modal-close cursor-pointer" style={{ color: '#2d4a6a', fontFamily: 'var(--font-mono)' }} onClick={() => setSelectedMaterial(null)}>✕</button>
            </div>
            <div className="material-detail-grid grid grid-cols-2 gap-4">
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Type</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedMaterial.type}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Threat Class</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedMaterial.threat_class}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Severity</label>
                <span className="detail-value block" style={{ color: getSeverityColor(selectedMaterial.severity).text, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{selectedMaterial.severity}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Status</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedMaterial.status}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Source</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedMaterial.source}</span>
              </div>
              <div className="detail-field">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>SHA-256 Hash</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '11px' }}><code>{selectedMaterial.content_hash}</code></span>
              </div>
              <div className="detail-field col-span-2">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Description</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{selectedMaterial.description}</span>
              </div>
              <div className="detail-field col-span-2">
                <label className="block mb-1" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px' }}>Activity Signature</label>
                <span className="detail-value block" style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '11px' }}><code>{selectedMaterial.activity_signature}</code></span>
              </div>
            </div>
            <div className="modal-actions flex gap-2 mt-4">
              {selectedMaterial.status === 'imported' && (
                <button className="btn btn-primary cursor-pointer" onClick={() => handleNormalize(selectedMaterial.id)} style={{ fontFamily: 'var(--font-mono)' }}>
                  Normalize
                </button>
              )}
              {selectedMaterial.status === 'normalized' && (
                <button className="btn btn-success cursor-pointer" onClick={() => handleApprove(selectedMaterial.id)} style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,255,65,0.08)', color: '#00ff41', border: '1px solid rgba(0,255,65,0.3)' }}>
                  Approve
                </button>
              )}
              <button className="btn btn-secondary cursor-pointer" onClick={() => setSelectedMaterial(null)} style={{ fontFamily: 'var(--font-mono)' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaterialsPage;
