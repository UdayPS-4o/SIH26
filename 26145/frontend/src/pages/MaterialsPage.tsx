import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Material } from '../types';

// ── Constants ──────────────────────────────────────────────────────────────

const STATUSES: Array<'pending' | 'imported' | 'approved' | 'rejected'> = ['pending', 'imported', 'approved', 'rejected'];

const MALWARE_NAMES = ['Emotet','TrickBot','QakBot','CobaltStrike','Mirai','Mozi','Sality','Gozi','Phorphiex','Spora','LockBit','Ryuk','Conti','BlackCat','Cl0p','Void','Bazar','IcedID','BuerLoader','Snake'];
const C2_NAMES = ['CobaltBeacon','EmpireC2','MythicC2','SliverC2','VenusC2','PoshC2','Covenant','Socat','Malleable'];
const DDOS_NAMES = ['Mirai-Botnet','Mozi-Botnet','DDoS-Toolkit','Flooder-X','UDP-Flooder','SYN-Flooder','XOR-DDoS','Gafgyt','Bashlite'];
const RECON_NAMES = ['Nmap-Script','Masscan-Config','Shodan-Query','Zmap-Probe','Recon-Suite','Amass-Enum','Sublist3r','Fierce'];
const DNS_NAMES = ['DGA-Domain','DNS-Tunnel','DNS-Exfil','DynDNS-Config','DNS-Hijack','DNS-Tx','DNS-Channel'];
const PHISHING_NAMES = ['Phish-Kit-01','Phish-Kit-02','Phish-Kit-03','CredHarvest','MFA-Stealer','Link-Masq'];

const ALL_TYPES = ['Malware Sample','C2 Config','DDoS Tool','Recon Script','DNS Malware','Phishing Kit','Crypto-Miner','Backdoor','RAT','Rootkit'];
const ALL_THREAT_CLASSES = ['DDoS','Beaconing','DGA','DNS Tunneling','TLS Anomaly','Port Scan','Exfiltration','Command Shell','Data Obfuscation','Privilege Escalation'];
const SOURCES = ['DNS-Detect','Hybrid-Analysis','VirusTotal','AbuseIPDB','ThreatFox','OTX-AlienVault','MISP','Anomali','ReversingLabs','Any.Run'];
const SEVERITIES: string[] = ['critical','high','medium','low'];

const THREAT_CLASS_COLORS: Record<string,string> = {
  'DDoS':'#ef4444','Beaconing':'#f97316','DGA':'#eab308','DNS Tunneling':'#06b6d4',
  'TLS Anomaly':'#8b5cf6','Port Scan':'#ec4899','Exfiltration':'#14b8a6',
  'Command Shell':'#f43f5e','Data Obfuscation':'#a855f7','Privilege Escalation':'#f97316',
};

const STATUS_COLORS: Record<string,string> = {
  pending:'#eab308',
  imported:'#3b82f6',
  approved:'#22c55e',
  rejected:'#ef4444',
};

const STATUS_BG: Record<string,string> = {
  pending:'rgba(234,179,8,0.12)',
  imported:'rgba(59,130,246,0.12)',
  approved:'rgba(34,197,94,0.12)',
  rejected:'rgba(239,68,68,0.12)',
};

const STATUS_BORDER: Record<string,string> = {
  pending:'rgba(234,179,8,0.3)',
  imported:'rgba(59,130,246,0.3)',
  approved:'rgba(34,197,94,0.3)',
  rejected:'rgba(239,68,68,0.3)',
};

// ── Deterministic-ish hash generator ────────────────────────────────────────

function fakeHash(seed: number): string {
  let h = 0x9e3779b9 ^ (seed * 2654435761);
  const chars = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 64; i++) {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 12;
    h = Math.imul(h, 0x297a2d39);
    h ^= h >>> 15;
    out += chars[h & 0xf];
  }
  return out;
}

function fakeSig(seed: number): string {
  const chars = 'abcdef0123456789';
  let out = 'sig_';
  let h = seed * 0x9e3779b9;
  for (let i = 0; i < 16; i++) {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h ^= h >>> 12;
    h = Math.imul(h, 0x297a2d39);
    h ^= h >>> 15;
    out += chars[h & 0xf];
  }
  return out;
}

function generateMaterials(): Material[] {
  const items: Material[] = [];
  let id = 1;
  const cats = [
    { cat: 'Malware', names: MALWARE_NAMES },
    { cat: 'C2', names: C2_NAMES },
    { cat: 'DDoS', names: DDOS_NAMES },
    { cat: 'Recon', names: RECON_NAMES },
    { cat: 'DNS', names: DNS_NAMES },
    { cat: 'Phishing', names: PHISHING_NAMES },
  ];

  for (const { cat, names } of cats) {
    for (const name of names) {
      const ver = (id % 5) + 1;
      const status = STATUSES[(id * 7 + 3) % 4];
      const threatIdx = (id * 13 + 5) % ALL_THREAT_CLASSES.length;
      const typeIdx = (id * 17 + 3) % ALL_TYPES.length;
      const sevIdx = (id * 23 + 7) % SEVERITIES.length;
      const srcIdx = (id * 31) % SOURCES.length;

      items.push({
        id: `MAT-${String(id).padStart(4,'0')}`,
        name: `${name}-v${ver}`,
        type: ALL_TYPES[typeIdx],
        threat_class: ALL_THREAT_CLASSES[threatIdx],
        category: cat,
        status,
        confidence: 55 + ((id * 37) % 45),
        source: SOURCES[srcIdx],
        created_at: new Date(Date.now() - ((id * 86400000) % (30 * 86400000))).toISOString().split('T')[0],
        hash: fakeHash(id),
        size: `${(10 + ((id * 47) % 500)).toFixed(1)}KB`,
        severity: SEVERITIES[sevIdx],
        content_hash: fakeHash(id + 9999),
        description: `${name} v${ver} — known ${cat.toLowerCase()} threat variant with ${ALL_THREAT_CLASSES[threatIdx].toLowerCase()} capabilities.`,
        activity_signature: fakeSig(id),
        is_accepted: status === 'approved',
      });
      id++;
      if (id > 40) break;
    }
    if (id > 40) break;
  }
  return items;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const IconBox = ({ children, color = '#00d4ff' }: { children: React.ReactNode; color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color, flexShrink: 0 }}>
    {children}
  </svg>
);

const TotalIcon = () => (
  <IconBox color="#00d4ff">
    <rect x="2" y="2" width="7" height="7" rx="1" fill="currentColor" opacity="0.8" />
    <rect x="11" y="2" width="7" height="7" rx="1" fill="currentColor" opacity="0.6" />
    <rect x="2" y="11" width="7" height="7" rx="1" fill="currentColor" opacity="0.5" />
    <rect x="11" y="11" width="7" height="7" rx="1" fill="currentColor" opacity="0.3" />
  </IconBox>
);
const PendingIcon = () => (
  <IconBox color="#eab308">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.8" fill="none" />
    <polyline points="7,10 10,13 14,7" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </IconBox>
);
const ApprovedIcon = () => (
  <IconBox color="#22c55e">
    <polyline points="4,10 8,14 16,6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </IconBox>
);
const RejectedIcon = () => (
  <IconBox color="#ef4444">
    <line x1="6" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <line x1="14" y1="6" x2="6" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </IconBox>
);

// ── Component ───────────────────────────────────────────────────────────────

function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [threatFilter, setThreatFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Material | null>(null);
  const [showNormalize, setShowNormalize] = useState(false);
  const [showMatch, setShowMatch] = useState(false);
  const [normalizeId, setNormalizeId] = useState<string | null>(null);
  const [normalizeProgress, setNormalizeProgress] = useState(0);
  const [normalizing, setNormalizing] = useState(false);
  const [normalizedResult, setNormalizedResult] = useState<any>(null);
  const [matchingItems, setMatchingItems] = useState<Record<string,string>>({});

  // Upload
  const [showUpload, setShowUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [processingItems, setProcessingItems] = useState<Record<string, string>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Live counter
  const [processedCount, setProcessedCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  // Load data
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
            if (msg.type === 'material_update' && active) {
              setMaterials(prev => prev.map(m => m.id === msg.material.id ? { ...m, ...msg.material } : m));
            }
          } catch {}
        };
        wsRef.current = ws;
      } catch { if (active) setWsConnected(false); }
    };
    connectWs();
    return () => {
      active = false;
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let active = true;
    setTimeout(() => {
      if (!active) return;
      setMaterials(generateMaterials());
      setProcessedCount(0);
      setLoading(false);
      setError(null);
    }, 400);
    return () => { active = false; };
  }, []);

  // Simulated WS ingestion tick
  useEffect(() => {
    if (materials.length === 0) return;
    const total = materials.length;
    const interval = setInterval(() => {
      setProcessedCount(prev => {
        const next = prev + Math.floor(Math.random() * 3) + 1;
        return next >= total ? total : next;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [materials.length]);

  // Filtered materials
  const filtered = useMemo(() => {
    return materials.filter(m => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = m.name.toLowerCase().includes(q)
          || m.id.toLowerCase().includes(q)
          || (m.content_hash || '').toLowerCase().includes(q)
          || m.threat_class.toLowerCase().includes(q)
          || m.source.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (statusFilter !== 'all' && m.status !== statusFilter) return false;
      if (threatFilter !== 'all' && m.threat_class !== threatFilter) return false;
      if (typeFilter !== 'all' && m.type !== typeFilter) return false;
      return true;
    });
  }, [materials, searchQuery, statusFilter, threatFilter, typeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = materials.length;
    const pending = materials.filter(m => m.status === 'pending').length;
    const approved = materials.filter(m => m.status === 'approved').length;
    const rejected = materials.filter(m => m.status === 'rejected').length;
    const avgConf = total > 0 ? Math.round(materials.reduce((s, m) => s + m.confidence, 0) / total) : 0;
    return { total, pending, approved, rejected, avgConf };
  }, [materials]);

  const ingestionPct = stats.total > 0 ? Math.round((processedCount / stats.total) * 100) : 0;

  // Unique filter options
  const uniqueThreats = useMemo(() => [...new Set(materials.map(m => m.threat_class))].sort(), [materials]);
  const uniqueTypes = useMemo(() => [...new Set(materials.map(m => m.type))].sort(), [materials]);

  // Handlers
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(m => m.id)));
    }
  };

  const setStatusForSelected = (status: 'approved' | 'rejected') => {
    setMaterials(prev => prev.map(m => selectedIds.has(m.id) ? { ...m, status, is_accepted: status === 'approved' } : m));
    setSelectedIds(new Set());
  };

  const handleNormalize = (id: string) => {
    setNormalizeId(id);
    setNormalizedResult(null);
    setShowNormalize(true);
    setNormalizing(true);
    setNormalizeProgress(0);
    const steps = [
      { text: 'Parsing raw source fields...', progress: 20 },
      { text: 'Mapping to EKADHARA canonical schema...', progress: 40 },
      { text: 'Generating SHA-256 content hash...', progress: 55 },
      { text: 'Computing fuzzy similarity to known samples...', progress: 70 },
      { text: 'Embedding ML feature vector (15-dim)...', progress: 85 },
      { text: 'Validation passed. Normalized.', progress: 100 },
    ];
    let i = 0;
    const tick = () => {
      if (i >= steps.length) {
        setNormalizing(false);
        setMaterials(prev => prev.map(m => m.id === id ? { ...m, status: 'imported' as const } : m));
        return;
      }
      const step = steps[i++];
      setNormalizeProgress(step.progress);
      setNormalizedResult((prev: any) => ({ ...prev, currentStep: step.text }));
      setTimeout(tick, 350 + Math.random() * 250);
    };
    tick();
  };

  const handleMatch = (id: string) => {
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
    let i = 0;
    const tick = () => {
      if (i >= steps.length) return;
      setMatchingItems((prev: Record<string,string>) => ({ ...prev, [id]: steps[i].text }));
      setTimeout(tick, 400 + Math.random() * 300);
      i++;
    };
    tick();
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const uid = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setUploadProgress(prev => ({ ...prev, [uid]: 0 }));
      setProcessingItems(prev => ({ ...prev, [uid]: 'Uploading...' }));
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setUploadProgress(prev => ({ ...prev, [uid]: 100 }));
          setProcessingItems(prev => { const n = { ...prev }; delete n[uid]; return n; });
        } else {
          setUploadProgress(prev => ({ ...prev, [uid]: Math.floor(progress) }));
        }
      }, 250);
    });
    setShowUpload(false);
  };

  const handleAddMaterial = (newMat: Omit<Material, 'id' | 'created_at' | 'hash' | 'content_hash' | 'activity_signature'>) => {
    const id = `MAT-${String(materials.length + 1).padStart(4,'0')}`;
    const seed = materials.length + 1;
    const mat: Material = {
      ...newMat,
      id,
      created_at: new Date().toISOString().split('T')[0],
      hash: fakeHash(seed),
      content_hash: fakeHash(seed + 9999),
      activity_signature: fakeSig(seed),
    } as Material;
    setMaterials(prev => [mat, ...prev]);
    setShowAddModal(false);
  };

  // ── Confidence bar ────────────────────────────────────────────────────────

  const ConfidenceBar = ({ value, color = '#00d4ff' }: { value: number; color?: string }) => (
    <div className="flex items-center gap-2" style={{ minWidth: '120px' }}>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.06)' }}>
        <div className="h-full rounded-full" style={{
          width: `${value}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 6px ${color}44`,
          transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', color, fontSize: '11px', fontWeight: 600, minWidth: '34px', textAlign: 'right' }}>{value}%</span>
    </div>
  );

  // ── Progress ring SVG helper ───────────────────────────────────────────────
  const ProgressRing = ({ progress, size = 72, strokeWidth = 5 }: { progress: number; size?: number; strokeWidth?: number }) => {
    const r = (size - strokeWidth) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (progress / 100) * circ;
    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,212,255,0.06)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#00d4ff" strokeWidth={strokeWidth}
          strokeDasharray={`${circ} ${circ}`} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.35s ease' }} />
      </svg>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="page" style={{ background: '#060a10', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '13px', letterSpacing: '2px' }}>LOADING EVIDENCE REGISTRY...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page" style={{ background: '#060a10', minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: 'var(--font-mono)', color: '#ff3355', fontSize: '13px' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: '#060a10', minHeight: '100%' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: '#00ff41', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
            <span style={{ color: wsConnected ? '#00ff41' : '#ff3355', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>WS {wsConnected ? 'CONNECTED' : 'OFFLINE'}</span>
          </div>
          <h1 className="page-title" style={{ color: '#00d4ff', letterSpacing: '3px', fontSize: '22px' }}>
            ◈ EVIDENCE REGISTRY
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
            FORENSIC MATERIAL MANAGEMENT — STIX NORMATIVE / MACHINE-VERIFIABLE
          </p>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-primary" onClick={() => setShowUpload(true)} style={{ fontFamily: 'var(--font-mono)' }}>
            + Import Material
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ fontFamily: 'var(--font-mono' }}>
            + Add Material
          </button>
        </div>
      </header>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'TOTAL MATERIALS', value: stats.total, icon: <TotalIcon />, color: '#00d4ff', trend: '+12%', trendUp: true },
          { label: 'PENDING REVIEW', value: stats.pending, icon: <PendingIcon />, color: '#eab308', trend: `${stats.pending} awaiting`, trendUp: stats.pending > 0 },
          { label: 'APPROVED', value: stats.approved, icon: <ApprovedIcon />, color: '#22c55e', trend: `${stats.total > 0 ? Math.round((stats.approved/stats.total)*100) : 0}% rate`, trendUp: true },
          { label: 'REJECTED', value: stats.rejected, icon: <RejectedIcon />, color: '#ef4444', trend: `${stats.total > 0 ? Math.round((stats.rejected/stats.total)*100) : 0}% rate`, trendUp: false },
        ].map((card) => (
          <div key={card.label} style={{
            background: '#0a1118',
            border: '1px solid #1a2736',
            borderRadius: '8px',
            padding: '16px 18px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Subtle glow */}
            <div style={{
              position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%',
              background: card.color, opacity: 0.04, filter: 'blur(20px)',
            }} />
            <div style={{ marginTop: '2px' }}>{card.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', color: card.color, fontSize: '28px', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.5px' }}>
                {card.value}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '4px' }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: '10px', marginTop: '6px',
                color: card.trendUp ? '#22c55e' : '#ef4444',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span style={{ fontSize: '9px' }}>{card.trendUp ? '▲' : '▼'}</span> {card.trend}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Ingestion Progress ─────────────────────────────────────────────── */}
      <div style={{
        background: '#0a1118', border: '1px solid #1a2736', borderRadius: '8px',
        padding: '14px 18px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
          <ProgressRing progress={ingestionPct} size={48} strokeWidth={4} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '11px', fontWeight: 700,
          }}>
            {ingestionPct}%
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '6px' }}>
            ◈ MATERIAL INGESTION PIPELINE
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a2736' }}>
            <div className="rounded-full" style={{
              width: `${ingestionPct}%`, height: '100%',
              background: 'linear-gradient(90deg, #00d4ff88, #00d4ff)',
              boxShadow: '0 0 10px rgba(0,212,255,0.3)',
              transition: 'width 0.4s ease',
            }} />
          </div>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', flexShrink: 0 }}>
          {processedCount} / {stats.total} processed
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div style={{
        background: '#0a1118', border: '1px solid #1a2736', borderRadius: '8px',
        padding: '12px 16px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{
          flex: '1 1 240px', display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(0,212,255,0.03)', border: '1px solid #1a2736', borderRadius: '6px', padding: '6px 12px',
        }}>
          <span style={{ color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>⌕</span>
          <input
            type="text"
            placeholder="Search by name, ID, hash, threat..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'var(--font-mono)', color: '#e0e8f0', fontSize: '12px',
            }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>✕</button>
          )}
        </div>

        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e0e8f0',
          background: 'rgba(0,212,255,0.03)', border: '1px solid #1a2736', borderRadius: '6px',
          padding: '6px 10px', outline: 'none', cursor: 'pointer',
        }}>
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {/* Threat class filter */}
        <select value={threatFilter} onChange={e => setThreatFilter(e.target.value)} style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e0e8f0',
          background: 'rgba(0,212,255,0.03)', border: '1px solid #1a2736', borderRadius: '6px',
          padding: '6px 10px', outline: 'none', cursor: 'pointer',
        }}>
          <option value="all">All Threat Classes</option>
          {uniqueThreats.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Type filter */}
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#e0e8f0',
          background: 'rgba(0,212,255,0.03)', border: '1px solid #1a2736', borderRadius: '6px',
          padding: '6px 10px', outline: 'none', cursor: 'pointer',
        }}>
          <option value="all">All Types</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Results count */}
        <span style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Bulk Actions ───────────────────────────────────────────────────── */}
      {selectedIds.size > 0 && (
        <div style={{
          background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '8px',
          padding: '10px 16px', marginBottom: '12px',
          display: 'flex', alignItems: 'center', gap: '12px',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px' }}>
            {selectedIds.size} selected
          </span>
          <button onClick={() => setStatusForSelected('approved')} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 12px' }}>
            ✓ Approve Selected
          </button>
          <button onClick={() => setStatusForSelected('rejected')} className="btn btn-danger" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 12px' }}>
            ✕ Reject Selected
          </button>
          <button onClick={() => {
            setMaterials(prev => prev.map(m => ({ ...m, status: 'imported' as const })));
            setSelectedIds(new Set());
          }} className="btn btn-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '4px 12px' }}>
            ↻ Normalize All
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{
            marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '11px',
            color: '#64748b', background: 'none', border: 'none', cursor: 'pointer',
          }}>
            Clear selection
          </button>
        </div>
      )}

      {/* ── Main Table ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#0a1118', border: '1px solid #1a2736', borderRadius: '8px',
        overflow: 'hidden', marginBottom: '16px',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a2736' }}>
                <th style={{ padding: '10px 12px', textAlign: 'center', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    ref={el => { if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < filtered.length; }}
                    onChange={toggleSelectAll}
                    style={{ accentColor: '#00d4ff', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  ID
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Name
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Type
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Threat Class
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600, minWidth: '140px' }}>
                  Confidence
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Source
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'left', fontWeight: 600 }}>
                  Date
                </th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1.5px', padding: '10px 12px', textAlign: 'center', fontWeight: 600, width: '90px' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '40px 20px', fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '12px' }}>
                    No materials match current filters
                  </td>
                </tr>
              ) : filtered.map(m => {
                const tcColor = THREAT_CLASS_COLORS[m.threat_class] || '#64748b';
                const stColor = STATUS_COLORS[m.status] || '#64748b';
                const stBg = STATUS_BG[m.status] || 'transparent';
                const stBorder = STATUS_BORDER[m.status] || 'transparent';
                const isExpanded = expandedId === m.id;
                const isSelected = selectedIds.has(m.id);
                const confColor = m.confidence >= 85 ? '#22c55e' : m.confidence >= 70 ? '#00d4ff' : m.confidence >= 55 ? '#eab308' : '#ef4444';

                return (
                  <React.Fragment key={m.id}>
                    <tr style={{
                      borderBottom: isExpanded ? 'none' : '1px solid rgba(0,212,255,0.04)',
                      background: isSelected ? 'rgba(0,212,255,0.04)' : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(m.id)} style={{ accentColor: '#00d4ff', cursor: 'pointer' }} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', padding: '10px 12px', fontWeight: 500 }}>
                        {m.id}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <button onClick={() => setShowDetail(m)} style={{
                          fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '12px',
                          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                          textDecoration: 'none',
                        }}>
                          {m.name}
                        </button>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#b8c8d8', fontSize: '11px', padding: '10px 12px' }}>
                        {m.type}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px',
                          color: tcColor, background: `${tcColor}18`, border: `1px solid ${tcColor}33`,
                          padding: '3px 8px', borderRadius: '4px',
                        }}>
                          {m.threat_class}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase',
                          color: stColor, background: stBg, border: `1px solid ${stBorder}`,
                          padding: '3px 8px', borderRadius: '4px',
                        }}>
                          {m.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <ConfidenceBar value={m.confidence} color={confColor} />
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', padding: '10px 12px' }}>
                        {m.source}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '11px', padding: '10px 12px' }}>
                        {m.created_at}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <button onClick={() => setExpandedId(isExpanded ? null : m.id)} title="Details" style={{
                            background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                            color: '#00d4ff', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: '10px',
                          }}>
                            {isExpanded ? '▼' : '▶'}
                          </button>
                          {m.status !== 'approved' && m.status !== 'rejected' && (
                            <button onClick={() => handleNormalize(m.id)} title="Normalize" style={{
                              background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
                              color: '#f97316', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer',
                              fontFamily: 'var(--font-mono)', fontSize: '10px',
                            }}>N</button>
                          )}
                          <button onClick={() => handleMatch(m.id)} title="Find Match" style={{
                            background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)',
                            color: '#8b5cf6', borderRadius: '4px', padding: '4px 7px', cursor: 'pointer',
                            fontFamily: 'var(--font-mono)', fontSize: '10px',
                          }}>M</button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0, borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                          <div style={{
                            background: 'rgba(6,10,16,0.6)', padding: '14px 18px',
                            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px',
                          }}>
                            <div>
                              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                SHA-256 Hash
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <code style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '10px', wordBreak: 'break-all' }}>
                                  {(m.content_hash || m.hash).slice(0, 32)}...
                                </code>
                                <button onClick={() => handleCopyHash(m.content_hash || m.hash)} style={{
                                  background: 'none', border: 'none', color: copiedHash === (m.content_hash || m.hash) ? '#00ff41' : '#64748b',
                                  cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px', padding: 0,
                                }} title="Copy hash">
                                  {copiedHash === (m.content_hash || m.hash) ? '✓' : '⧉'}
                                </button>
                              </div>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                Size
                              </div>
                              <div style={{ fontFamily: 'var(--font-mono)', color: '#e0e8f0', fontSize: '12px' }}>{m.size}</div>
                            </div>
                            <div>
                              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                Severity
                              </div>
                              <div style={{ fontFamily: 'var(--font-mono)', color: m.severity === 'critical' ? '#ff3355' : m.severity === 'high' ? '#f97316' : m.severity === 'medium' ? '#eab308' : '#00d4ff', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600 }}>
                                {m.severity}
                              </div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                Description
                              </div>
                              <div style={{ fontFamily: 'var(--font-mono)', color: '#b8c8d8', fontSize: '11px' }}>{m.description}</div>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                                Activity Signature
                              </div>
                              <code style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '11px' }}>{m.activity_signature}</code>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Footer bar ─────────────────────────────────────────────────────── */}
      <div style={{
        background: '#0a1118', border: '1px solid #1a2736', borderRadius: '8px',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#64748b',
      }}>
        <span>WATCHTOWER v2.1.0</span>
        <span style={{ color: 'rgba(0,212,255,0.15)' }}>|</span>
        <span>CLASSIFIED // TLP:WHITE</span>
        <span style={{ color: 'rgba(0,212,255,0.15)' }}>|</span>
        <span>{new Date().toISOString().slice(0,10)}</span>
        <span style={{ flex: 1 }} />
        <span>FIXTURE MODE — NO BACKEND</span>
      </div>

      {/* ── Add Material Modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(6,10,16,0.88)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowAddModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,17,26,0.97)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px',
            padding: '24px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '14px', fontWeight: 700, letterSpacing: '1px' }}>
                ◈ ADD NEW MATERIAL
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px',
                fontFamily: 'var(--font-mono)',
              }}>✕</button>
            </div>
            <AddMaterialForm onSubmit={handleAddMaterial} types={uniqueTypes} threats={uniqueThreats} sources={SOURCES} />
          </div>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────────────────────── */}
      {showDetail && !showNormalize && !showMatch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(6,10,16,0.88)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowDetail(null)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,17,26,0.97)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px',
            padding: '24px', width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 0 40px rgba(0,0,0,0.5), 0 0 20px rgba(0,212,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-mono)', color: '#e0e8f0', fontSize: '14px', fontWeight: 700 }}>
                {showDetail.name}
              </h3>
              <button onClick={() => setShowDetail(null)} style={{
                background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px',
                fontFamily: 'var(--font-mono)',
              }}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { label: 'ID', value: showDetail.id },
                { label: 'Type', value: showDetail.type },
                { label: 'Threat Class', value: showDetail.threat_class, highlight: true, color: THREAT_CLASS_COLORS[showDetail.threat_class] || '#64748b' },
                { label: 'Status', value: showDetail.status, highlight: true, color: STATUS_COLORS[showDetail.status] || '#64748b' },
                { label: 'Severity', value: showDetail.severity, color: showDetail.severity === 'critical' ? '#ff3355' : showDetail.severity === 'high' ? '#f97316' : showDetail.severity === 'medium' ? '#eab308' : '#00d4ff' },
                { label: 'Confidence', value: `${showDetail.confidence}%` },
                { label: 'Source', value: showDetail.source },
                { label: 'Date Added', value: showDetail.created_at },
                { label: 'Size', value: showDetail.size },
                { label: 'Description', value: showDetail.description || '—' },
              ].map((field, i) => (
                <div key={i}>
                  <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    {field.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: '12px', color: field.color || '#e0e8f0',
                    ...(field.highlight ? {
                      color: field.color,
                      background: `${field.color}15`,
                      border: `1px solid ${field.color}33`,
                      padding: '3px 8px', borderRadius: '4px', display: 'inline-block',
                    } : {}),
                  }}>
                    {field.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                SHA-256 Content Hash
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <code style={{
                  fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '10px',
                  wordBreak: 'break-all', background: 'rgba(0,212,255,0.03)', padding: '6px 10px', borderRadius: '4px',
                  border: '1px solid #1a2736', flex: 1,
                }}>
                  {showDetail.content_hash}
                </code>
                <button onClick={() => handleCopyHash(showDetail.content_hash || showDetail.hash)} style={{
                  background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)', color: '#00d4ff',
                  borderRadius: '4px', padding: '6px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '10px',
                }}>
                  {copiedHash === (showDetail.content_hash || showDetail.hash) ? '✓ COPIED' : '⧉ COPY'}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Description
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#b8c8d8', fontSize: '12px', background: 'rgba(0,212,255,0.02)', padding: '10px 12px', borderRadius: '6px', border: '1px solid #1a2736' }}>
                {showDetail.description}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Activity Signature
              </div>
              <code style={{
                fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '11px', wordBreak: 'break-all',
                background: 'rgba(0,212,255,0.03)', padding: '8px 12px', borderRadius: '6px',
                border: '1px solid #1a2736', display: 'block',
              }}>
                {showDetail.activity_signature}
              </code>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              {showDetail.status === 'imported' && (
                <button onClick={() => { handleNormalize(showDetail.id); setShowDetail(null); }} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  Normalize
                </button>
              )}
              {showDetail.status !== 'rejected' && (
                <button onClick={() => {
                  setMaterials(prev => prev.map(m => m.id === showDetail.id ? { ...m, status: 'approved' as const, is_accepted: true } : m));
                  setShowDetail(null);
                }} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'rgba(34,197,94,0.08)', color: '#22c55e', borderColor: 'rgba(34,197,94,0.3)' }}>
                  ✓ Approve
                </button>
              )}
              {showDetail.status !== 'approved' && showDetail.status !== 'rejected' && (
                <button onClick={() => {
                  setMaterials(prev => prev.map(m => m.id === showDetail.id ? { ...m, status: 'rejected' as const } : m));
                  setShowDetail(null);
                }} className="btn btn-danger" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                  ✕ Reject
                </button>
              )}
              <button onClick={() => setShowDetail(null)} className="btn btn-secondary" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Normalize Modal ────────────────────────────────────────────────── */}
      {showNormalize && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,10,16,0.9)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); setNormalizeProgress(0); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,17,26,0.97)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px',
            padding: '24px', width: '100%', maxWidth: '500px',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
              NORMALIZING: {normalizeId}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
                <ProgressRing progress={normalizeProgress} size={72} strokeWidth={5} />
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', color: '#00d4ff', fontSize: '14px', fontWeight: 700,
                }}>
                  {normalizeProgress}%
                </div>
              </div>
              <div style={{
                flex: 1, background: 'rgba(6,10,16,0.8)', border: '1px solid rgba(0,212,255,0.12)',
                borderRadius: '6px', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: '11px',
                minHeight: '60px',
              }}>
                <div style={{ color: '#64748b', marginBottom: '4px' }}>&gt; Loading material: {normalizeId}</div>
                {normalizedResult?.currentStep && (
                  <div style={{ color: '#00d4ff' }}>&gt; {normalizedResult.currentStep}</div>
                )}
                {normalizing && <span style={{ color: '#00d4ff' }}>█</span>}
                {!normalizing && <div style={{ color: '#00ff41' }}>&gt; ✓ Normalization complete. Material ready for approval.</div>}
              </div>
            </div>
            {!normalizing && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowNormalize(false); setNormalizeId(null); setNormalizedResult(null); setNormalizeProgress(0); }} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Match Modal ────────────────────────────────────────────────────── */}
      {showMatch && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(6,10,16,0.9)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,17,26,0.97)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px',
            padding: '24px', width: '100%', maxWidth: '500px',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
              FINDING MATCHES: {normalizeId}
            </h3>
            <div style={{
              background: 'rgba(6,10,16,0.8)', border: '1px solid rgba(139,92,246,0.12)',
              borderRadius: '6px', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: '11px',
              minHeight: '80px',
            }}>
              <div style={{ color: '#64748b', marginBottom: '6px' }}>&gt; Material: {normalizeId}</div>
              <div style={{ color: '#64748b', marginBottom: '6px' }}>&gt; Running LSH-based similarity search...</div>
              {Object.entries(matchingItems).map(([id, text]) => (
                <div key={id} style={{ color: '#8b5cf6' }}>&gt; {text}</div>
              ))}
            </div>
            {String(Object.values(matchingItems)[Object.values(matchingItems).length - 1])?.includes('Done') && (
              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={() => { setShowMatch(false); setNormalizeId(null); setMatchingItems({}); }} className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)', borderColor: 'rgba(139,92,246,0.3)', color: '#8b5cf6' }}>
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload Modal ───────────────────────────────────────────────────── */}
      {showUpload && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(6,10,16,0.88)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowUpload(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'rgba(10,17,26,0.97)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '10px',
            padding: '24px', width: '100%', maxWidth: '480px',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>
              IMPORT MATERIALS
            </h3>
            <div onClick={() => document.getElementById('mat-file-input')?.click()} style={{
              background: 'rgba(6,10,16,0.8)', border: '1px dashed rgba(0,212,255,0.2)', borderRadius: '8px',
              padding: '32px', textAlign: 'center', cursor: 'pointer',
            }}>
              <div style={{ color: '#64748b', fontFamily: 'var(--font-mono)', fontSize: '28px', marginBottom: '8px' }}>+</div>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', marginBottom: '4px' }}>
                Drop files here or click to browse
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', color: '#64748b', fontSize: '10px' }}>
                Accepts: STIX JSON, PCAP, PCAPNG, ZIP, CSV
              </div>
              <input id="mat-file-input" type="file" multiple accept=".json,.pcap,.pcapng,.zip,.csv" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>
            {Object.entries(uploadProgress).length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(uploadProgress).map(([id, pct]) => (
                  <div key={id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                      <span style={{ color: '#64748b' }}>Uploading...</span>
                      <span style={{ color: '#00d4ff' }}>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.06)' }}>
                      <div className="rounded-full" style={{ width: `${pct}%`, height: '100%', background: '#00d4ff', boxShadow: '0 0 6px rgba(0,212,255,0.4)', transition: 'width 0.2s' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button onClick={() => setShowUpload(false)} className="btn btn-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Material Form Component ──────────────────────────────────────────────

function AddMaterialForm({ onSubmit, types, threats, sources }: {
  onSubmit: (data: Omit<Material, 'id' | 'created_at' | 'hash' | 'content_hash' | 'activity_signature'>) => void;
  types: string[];
  threats: string[];
  sources: string[];
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState(types[0] || 'Malware Sample');
  const [threatClass, setThreatClass] = useState(threats[0] || 'DDoS');
  const [status, setStatus] = useState<'pending' | 'imported'>('pending');
  const [confidence, setConfidence] = useState(80);
  const [source, setSource] = useState(sources[0] || 'DNS-Detect');
  const [severity, setSeverity] = useState('medium');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      threat_class: threatClass,
      category: type,
      status,
      confidence,
      source,
      severity,
      size: '—',
      description: description.trim() || `${name} — imported forensic material.`,
      is_accepted: false,
    });
  };

  const fieldLabel = (label: string) => (
    <label style={{
      display: 'block', fontFamily: 'var(--font-sans)', color: '#64748b', fontSize: '9px',
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px',
    }}>{label}</label>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(0,212,255,0.03)', border: '1px solid #1a2736', borderRadius: '6px',
    padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#e0e8f0',
    outline: 'none',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        {fieldLabel('Material Name')}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Emotet-v4" required style={inputStyle} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          {fieldLabel('Type')}
          <select value={type} onChange={e => setType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          {fieldLabel('Threat Class')}
          <select value={threatClass} onChange={e => setThreatClass(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {threats.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          {fieldLabel('Status')}
          <select value={status} onChange={e => setStatus(e.target.value as any)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="pending">Pending</option>
            <option value="imported">Imported</option>
          </select>
        </div>
        <div>
          {fieldLabel('Source')}
          <select value={source} onChange={e => setSource(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {sources.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          {fieldLabel('Confidence')}
          <input type="number" value={confidence} onChange={e => setConfidence(Number(e.target.value))} min={0} max={100} style={inputStyle} />
        </div>
        <div>
          {fieldLabel('Severity')}
          <select value={severity} onChange={e => setSeverity(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {['critical','high','medium','low'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>
      </div>
      <div>
        {fieldLabel('Description')}
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief forensic description..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
        <button type="button" onClick={() => {}} className="btn btn-secondary" style={{ fontFamily: 'var(--font-mono)' }}>Cancel</button>
        <button type="submit" className="btn btn-primary" style={{ fontFamily: 'var(--font-mono)' }}>+ Add Material</button>
      </div>
    </form>
  );
}

export default MaterialsPage;
