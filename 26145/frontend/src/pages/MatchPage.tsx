import React, { useState, useEffect, useRef } from 'react';

interface MatchCandidate {
  id: string;
  name: string;
  similarity: number;
  threat_class: string;
  source: string;
  last_updated: string;
}

interface MatchResult {
  id: string;
  material_name: string;
  candidates: MatchCandidate[];
  algorithm: string;
  threshold: number;
  processing_ms: number;
  status: 'searching' | 'complete' | 'error';
}

const ALGORITHMS = [
  { id: 'lsh', name: 'LSH (Locality-Sensitive Hashing)', desc: 'Fast approximate nearest-neighbor on Jaccard similarity' },
  { id: 'simhash', name: 'SimHash', desc: 'Hamming distance for near-duplicate detection' },
  { id: 'embedding', name: 'ML Embedding (15-dim)', desc: 'Feature vector cosine similarity with FAISS index' },
  { id: 'fuzzy', name: 'Fuzzy Hash (TLSH/ssdeep)', desc: 'Context-triggered piecewise hashing for variant detection' },
];

function MatchPage() {
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [algorithm, setAlgorithm] = useState<string>('lsh');
  const [threshold, setThreshold] = useState<number>(0.7);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<MatchResult[]>([]);
  const [activeQueries, setActiveQueries] = useState<number>(0);
  const logsRef = useRef<HTMLDivElement>(null);

  const sampleMaterials = [
    'MAL-2024-0001', 'MAL-2024-0002', 'MAL-2024-0003', 'MAL-2024-0005',
    'C2-2024-0001', 'C2-2024-0003', 'DDOS-2024-0002',
    'DNS-2024-0001', 'EXF-2024-0001',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      if (running) {
        setResults(prev => prev.map(r => {
          if (r.status === 'searching') {
            const updated = {
              ...r,
              candidates: r.candidates.map(c => ({
                ...c,
                similarity: Math.min(0.99, c.similarity + (Math.random() * 0.15)),
              })),
              processing_ms: r.processing_ms + Math.floor(Math.random() * 50),
            };
            if (updated.processing_ms > 1200) {
              return { ...updated, status: 'complete' as const };
            }
            return updated;
          }
          return r;
        }));
      }
    }, 500);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (logsRef.current && running) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [results, running]);

  const handleRunMatch = () => {
    if (!selectedMaterial) return;
    setRunning(true);
    setActiveQueries(prev => prev + 1);
    const candidates: MatchCandidate[] = [];
    const numCandidates = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < numCandidates; i++) {
      candidates.push({
        id: `CAND-${Math.floor(Math.random() * 9000 + 1000)}`,
        name: `${['Sality','TrickBot','Emotet','QakBot','CobaltStrike','Mirai','Mozi','Spora','Phorphiex','Gozi'][Math.floor(Math.random() * 10)]}-v${Math.floor(Math.random() * 5) + 1}`,
        similarity: Math.random() * 0.3,
        threat_class: ['Malware','C2','DDoS','Recon','Exfiltration'][Math.floor(Math.random() * 5)],
        source: ['DNS-Detect','Hybrid-Analysis','VirusTotal','Custom'][Math.floor(Math.random() * 4)],
        last_updated: new Date(Date.now() - Math.floor(Math.random() * 86400000)).toISOString().split('T')[0],
      });
    }
    const newResult: MatchResult = {
      id: `MATCH-${Date.now()}`,
      material_name: selectedMaterial,
      candidates,
      algorithm: ALGORITHMS.find(a => a.id === algorithm)?.name || algorithm,
      threshold,
      processing_ms: 0,
      status: 'searching',
    };
    setResults(prev => [newResult, ...prev.slice(0, 4)]);
  };

  const getSimilarityColor = (sim: number) => {
    if (sim >= 0.9) return '#00ff41';
    if (sim >= 0.75) return '#ff8833';
    if (sim >= threshold) return '#00d4ff';
    return '#2d4a6a';
  };

  const renderResults = () => {
    if (results.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon" style={{ color: '#2d4a6a', fontFamily: 'var(--font-mono)', fontSize: '32px' }}>◈</div>
          <p style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a' }}>Select a material and run matching to see results</p>
        </div>
      );
    }
    return results.map(result => (
      <div key={result.id} style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }} className="match-card rounded-lg p-4">
        <div className="match-card-header flex items-center justify-between mb-3">
          <div>
            <span className="match-material" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600 }}>{result.material_name}</span>
            <span className="match-algo block" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '11px' }}>{result.algorithm}</span>
          </div>
          <div className="match-meta flex items-center gap-3">
            <span className={`match-status px-2 py-1 rounded text-[10px] uppercase tracking-wider`} style={{
              fontFamily: 'var(--font-mono)',
              color: result.status === 'searching' ? '#00d4ff' : result.status === 'complete' ? '#00ff41' : '#ff3355',
              border: `1px solid ${result.status === 'searching' ? 'rgba(0,212,255,0.3)' : result.status === 'complete' ? 'rgba(0,255,65,0.3)' : 'rgba(255,51,85,0.3)'}`,
              background: result.status === 'searching' ? 'rgba(0,212,255,0.08)' : result.status === 'complete' ? 'rgba(0,255,65,0.08)' : 'rgba(255,51,85,0.08)',
            }}>
              {result.status === 'searching' && '⟳ Searching'}
              {result.status === 'complete' && '✓ Complete'}
              {result.status === 'error' && '✕ Error'}
            </span>
            <span className="match-time" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px' }}>{result.processing_ms}ms</span>
          </div>
        </div>
        {result.candidates.length === 0 ? (
          <div className="match-no-candidates" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>No matches above threshold ({result.threshold})</div>
        ) : (
          <table className="match-table w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '8px 12px', textAlign: 'left' }}>Candidate</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '8px 12px', textAlign: 'left' }}>Similarity</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '8px 12px', textAlign: 'left' }}>Threat Class</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '8px 12px', textAlign: 'left' }}>Source</th>
                <th style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', padding: '8px 12px', textAlign: 'left' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {result.candidates.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid rgba(0,212,255,0.04)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="candidate-rank mr-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px' }}>#{i + 1}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{c.name}</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div className="similarity-bar-wrap flex items-center gap-2">
                      <div className="similarity-bar w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(0,212,255,0.08)' }}>
                        <div className="similarity-fill h-full rounded-full transition-all" style={{ width: `${c.similarity * 100}%`, backgroundColor: getSimilarityColor(c.similarity) }} />
                      </div>
                      <span className="similarity-val" style={{ color: getSimilarityColor(c.similarity), fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                        {(c.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span className="threat-badge px-2 py-1 rounded text-[10px] uppercase tracking-wider" style={{ background: 'rgba(255,51,85,0.08)', color: '#ff3355', border: '1px solid rgba(255,51,85,0.25)', fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '1px' }}>{c.threat_class}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px', padding: '10px 12px' }}>{c.source}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px', padding: '10px 12px' }}>{c.last_updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    ));
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span style={{ color: '#00ff41', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '1px' }} className="animate-pulse">● LIVE</span>
          </div>
          <h1 className="page-title" style={{ color: '#00d4ff', letterSpacing: '3px' }}>
            {''} Pattern Matching Engine
          </h1>
          <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a' }}>LSH, SimHash, ML Embedding, Fuzzy Hash — registry similarity search</p>
        </div>
        <div className="header-actions">
          <div className="active-indicator flex items-center gap-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '12px' }}>
            {activeQueries > 0 && <><span className="pulse-dot" style={{ backgroundColor: '#00d4ff', width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', animation: 'pulse-dot 2s ease-in-out infinite' }} /> {activeQueries} active</>}
          </div>
        </div>
      </header>

      <div className="match-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="match-controls lg:col-span-1 space-y-4">
          <div className="control-group">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Material</label>
            <select
              className="cyber-select w-full rounded-lg px-3 py-2 outline-none cursor-pointer"
              style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)', color: '#c8d6e5', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
            >
              <option value="">Select material...</option>
              {sampleMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Algorithm</label>
            <div className="algo-list space-y-2">
              {ALGORITHMS.map(algo => (
                <button
                  key={algo.id}
                  style={{
                    background: algorithm === algo.id ? 'rgba(0,212,255,0.08)' : 'transparent',
                    border: `1px solid ${algorithm === algo.id ? 'rgba(0,212,255,0.3)' : 'rgba(0,212,255,0.12)'}`,
                  }}
                  className="algo-card w-full text-left rounded-lg p-3 transition-all cursor-pointer"
                  onClick={() => setAlgorithm(algo.id)}
                >
                  <div className="algo-name" style={{ fontFamily: 'var(--font-mono)', color: algorithm === algo.id ? '#00d4ff' : '#c8d6e5', fontSize: '12px', fontWeight: 600 }}>{algo.name}</div>
                  <div className="algo-desc" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', marginTop: '2px' }}>{algo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label block mb-2" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>Similarity Threshold: {threshold.toFixed(2)}</label>
            <input
              type="range"
              min="0.3"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="cyber-slider w-full"
              style={{ accentColor: '#00d4ff' }}
            />
            <div className="threshold-marks flex justify-between mt-1" style={{ fontFamily: 'var(--font-mono)', color: '#2d4a6a', fontSize: '10px' }}>
              <span>0.3 (loose)</span>
              <span>0.7 (balanced)</span>
              <span>0.99 (strict)</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full cursor-pointer"
            onClick={handleRunMatch}
            disabled={!selectedMaterial || running}
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {running ? '⟳ Scanning Registry...' : '▶ Run Matching'}
          </button>
        </div>

        {/* Results area */}
        <div className="match-results lg:col-span-2">
          <h3 className="results-header mb-3" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>Matches</h3>
          {renderResults()}
        </div>
      </div>

      {/* History section */}
      {searchHistory.length > 0 && (
        <div className="match-history mt-6 rounded-lg p-4" style={{ background: 'rgba(10,18,28,0.85)', border: '1px solid rgba(0,212,255,0.12)' }}>
          <h3 className="section-title mb-3" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>Recent Searches</h3>
          <div className="history-list space-y-2">
            {searchHistory.slice(0, 5).map(h => (
              <div key={h.id} className="history-item flex items-center justify-between p-2 rounded" style={{ background: 'rgba(6,10,16,0.6)', border: '1px solid rgba(0,212,255,0.08)' }}>
                <span className="history-material" style={{ fontFamily: 'var(--font-mono)', color: '#c8d6e5', fontSize: '12px' }}>{h.material_name}</span>
                <span className="history-meta" style={{ fontFamily: 'var(--font-mono)', color: '#5a7a9a', fontSize: '11px' }}>{h.candidates.length} matches · {h.algorithm} · {h.processing_ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchPage;
