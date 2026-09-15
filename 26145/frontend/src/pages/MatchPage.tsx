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
    if (sim >= 0.75) return '#ffb000';
    if (sim >= threshold) return '#00d4ff';
    return '#666';
  };

  const renderResults = () => {
    if (results.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">&#x2B21;</div>
          <p>Select a material and run matching to see results</p>
        </div>
      );
    }
    return results.map(result => (
      <div key={result.id} className="match-card">
        <div className="match-card-header">
          <div>
            <span className="match-material">{result.material_name}</span>
            <span className="match-algo">{result.algorithm}</span>
          </div>
          <div className="match-meta">
            <span className={`match-status status-${result.status}`}>
              {result.status === 'searching' && '&#x27F3; Searching'}
              {result.status === 'complete' && '&#x2713; Complete'}
              {result.status === 'error' && '&#x2715; Error'}
            </span>
            <span className="match-time">{result.processing_ms}ms</span>
          </div>
        </div>
        {result.candidates.length === 0 ? (
          <div className="match-no-candidates">No matches above threshold ({result.threshold})</div>
        ) : (
          <table className="match-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Similarity</th>
                <th>Threat Class</th>
                <th>Source</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {result.candidates.map((c, i) => (
                <tr key={c.id}>
                  <td>
                    <span className="candidate-rank">#{i + 1}</span>
                    {c.name}
                  </td>
                  <td>
                    <div className="similarity-bar-wrap">
                      <div className="similarity-bar">
                        <div
                          className="similarity-fill"
                          style={{
                            width: `${c.similarity * 100}%`,
                            backgroundColor: getSimilarityColor(c.similarity),
                          }}
                        />
                      </div>
                      <span className="similarity-val" style={{ color: getSimilarityColor(c.similarity) }}>
                        {(c.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td><span className="threat-badge">{c.threat_class}</span></td>
                  <td><span className="source-text">{c.source}</span></td>
                  <td><span className="date-text">{c.last_updated}</span></td>
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
          <h1 className="page-title">
            <span className="icon-glow">&#x2B21;</span> Pattern Matching Engine
          </h1>
          <p className="page-subtitle">LSH, SimHash, ML Embedding, Fuzzy Hash — registry similarity search</p>
        </div>
        <div className="header-actions">
          <div className="active-indicator">
            {activeQueries > 0 && <><span className="pulse-dot" /> {activeQueries} active</>}
          </div>
        </div>
      </header>

      <div className="match-layout">
        {/* Controls */}
        <div className="match-controls">
          <div className="control-group">
            <label className="control-label">Material</label>
            <select
              className="cyber-select"
              value={selectedMaterial}
              onChange={e => setSelectedMaterial(e.target.value)}
            >
              <option value="">Select material...</option>
              {sampleMaterials.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Algorithm</label>
            <div className="algo-list">
              {ALGORITHMS.map(algo => (
                <button
                  key={algo.id}
                  className={`algo-card ${algorithm === algo.id ? 'algo-active' : ''}`}
                  onClick={() => setAlgorithm(algo.id)}
                >
                  <div className="algo-name">{algo.name}</div>
                  <div className="algo-desc">{algo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="control-group">
            <label className="control-label">Similarity Threshold: {threshold.toFixed(2)}</label>
            <input
              type="range"
              min="0.3"
              max="0.99"
              step="0.01"
              value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              className="cyber-slider"
            />
            <div className="threshold-marks">
              <span>0.3 (loose)</span>
              <span>0.7 (balanced)</span>
              <span>0.99 (strict)</span>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={handleRunMatch}
            disabled={!selectedMaterial || running}
          >
            {running ? '&#x27F3; Scanning Registry...' : '&#x25B6; Run Matching'}
          </button>
        </div>

        {/* Results area */}
        <div className="match-results">
          <h3 className="results-header">Matches</h3>
          {renderResults()}
        </div>
      </div>

      {/* History section */}
      {searchHistory.length > 0 && (
        <div className="match-history">
          <h3 className="section-title">Recent Searches</h3>
          <div className="history-list">
            {searchHistory.slice(0, 5).map(h => (
              <div key={h.id} className="history-item">
                <span className="history-material">{h.material_name}</span>
                <span className="history-meta">{h.candidates.length} matches &middot; {h.algorithm} &middot; {h.processing_ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchPage;
