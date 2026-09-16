import React, { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────
interface MatchEntry {
  id: string;
  materialA: string;
  materialB: string;
  matchType: 'Exact Match' | 'Partial Match' | 'Similar Match';
  score: number;
  algorithm: string;
  status: 'verified' | 'pending' | 'rejected';
  date: string;
  similarityBreakdown: {
    structural: number;
    semantic: number;
    behavioral: number;
  };
  analystNotes?: string;
}

interface AlgorithmMetric {
  name: string;
  precision: number;
  recall: number;
  f1: number;
}

// ─── Mock Data Generator ──────────────────────────────────────────────────
const MATERIAL_PREFIXES = ['MAL', 'C2', 'DDOS', 'DNS', 'EXF', 'RAT', 'KEYL', 'WORM', 'SPM', 'INF'];
const MATERIAL_IDS = [
  '2024-0001','2024-0002','2024-0003','2024-0004','2024-0005','2024-0006',
  '2024-0007','2024-0008','2024-0009','2024-0010','2024-0011','2024-0012',
  '2024-0013','2024-0014','2024-0015','2024-0016','2024-0017','2024-0018',
  '2024-0019','2024-0020','2024-0021','2024-0022','2024-0023','2024-0024',
  '2024-0025',
];
const ALGO_NAMES = ['Exact Match', 'Fuzzy Match', 'Similarity Hash', 'ML Embedding'];
const THREAT_CLASSES = ['APT', 'Ransomware', 'Trojan', 'Rootkit', 'Worm', 'Spyware', 'Adware', 'Backdoor'];
const ANALYSTS = ['KOWALSKI','CHEN','MUELLER','PATEL','OKAFOR','NAKAMURA','HASSAN','VOLKOV'];

function randomFrom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomBetween(min: number, max: number): number { return Math.round((Math.random() * (max - min) + min) * 100) / 100; }

function generateMockMatches(count: number): MatchEntry[] {
  const matches: MatchEntry[] = [];
  for (let i = 0; i < count; i++) {
    const score = randomBetween(0.05, 0.98);
    const matchType: MatchEntry['matchType'] =
      score >= 0.85 ? 'Exact Match' : score >= 0.5 ? 'Partial Match' : 'Similar Match';
    const status: MatchEntry['status'] =
      i < 8 ? 'verified' : i < 16 ? 'pending' : 'rejected';
    const dateOffset = Math.floor(Math.random() * 90);
    const d = new Date(Date.now() - dateOffset * 86400000);
    matches.push({
      id: `MATCH-${String(i + 1).padStart(4, '0')}`,
      materialA: `${randomFrom(MATERIAL_PREFIXES)}-${randomFrom(MATERIAL_IDS)}`,
      materialB: `${randomFrom(MATERIAL_PREFIXES)}-${randomFrom(MATERIAL_IDS)}`,
      matchType,
      score,
      algorithm: randomFrom(ALGO_NAMES),
      status,
      date: d.toISOString().split('T')[0],
      similarityBreakdown: {
        structural: randomBetween(score - 0.15, Math.min(1, score + 0.1)),
        semantic: randomBetween(score - 0.2, Math.min(1, score + 0.05)),
        behavioral: randomBetween(score - 0.25, Math.min(1, score + 0.05)),
      },
      analystNotes: Math.random() > 0.5 ? `Review by ${randomFrom(ANALYSTS)} – ${randomFrom(['family attribution confirmed','false positive suspected','variant analysis pending','cross-ref needed'])}` : undefined,
    });
  }
  return matches.sort((a, b) => b.score - a.score);
}

const MOCK_MATCHES = generateMockMatches(24);

const ALGORITHM_METRICS: AlgorithmMetric[] = [
  { name: 'Exact Match', precision: 0.97, recall: 0.82, f1: 0.89 },
  { name: 'Fuzzy Match', precision: 0.88, recall: 0.91, f1: 0.89 },
  { name: 'Similarity Hash', precision: 0.79, recall: 0.94, f1: 0.86 },
  { name: 'ML Embedding', precision: 0.93, recall: 0.87, f1: 0.90 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────
function scoreColor(s: number): string {
  if (s >= 0.8) return '#22c55e';
  if (s >= 0.6) return '#84cc16';
  if (s >= 0.4) return '#eab308';
  if (s >= 0.2) return '#f97316';
  return '#ef4444';
}

function scoreGradient(s: number): string {
  if (s >= 0.8) return 'linear-gradient(90deg, #16a34a, #22c55e)';
  if (s >= 0.6) return 'linear-gradient(90deg, #65a30d, #84cc16)';
  if (s >= 0.4) return 'linear-gradient(90deg, #ca8a04, #eab308)';
  if (s >= 0.2) return 'linear-gradient(90deg, #ea580c, #f97316)';
  return 'linear-gradient(90deg, #dc2626, #ef4444)';
}

const MATCH_TYPE_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  'Exact Match':   { bg: 'rgba(34,197,94,0.1)',   color: '#22c55e', border: 'rgba(34,197,94,0.35)' },
  'Partial Match': { bg: 'rgba(234,179,8,0.1)',   color: '#eab308', border: 'rgba(234,179,8,0.35)' },
  'Similar Match': { bg: 'rgba(6,182,212,0.1)',   color: '#06b6d4', border: 'rgba(6,182,212,0.35)' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  verified: { bg: 'rgba(34,197,94,0.1)',  color: '#22c55e', border: 'rgba(34,197,94,0.35)' },
  pending:  { bg: 'rgba(234,179,8,0.1)',  color: '#eab308', border: 'rgba(234,179,8,0.35)' },
  rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#ef4444', border: 'rgba(239,68,68,0.35)' },
};

// ─── Distribution buckets ─────────────────────────────────────────────────
function useScoreDistribution(matches: MatchEntry[]) {
  return useMemo(() => {
    const buckets = [
      { label: '0 – 20%', min: 0, max: 0.2, count: 0 },
      { label: '21 – 40%', min: 0.21, max: 0.4, count: 0 },
      { label: '41 – 60%', min: 0.41, max: 0.6, count: 0 },
      { label: '61 – 80%', min: 0.61, max: 0.8, count: 0 },
      { label: '81 – 100%', min: 0.81, max: 1.0, count: 0 },
    ];
    matches.forEach(m => {
      const b = buckets.find(b => m.score >= b.min && m.score <= b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [matches]);
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({ label, value, subtext, color }: { label: string; value: number | string; subtext?: string; color: string }) {
  return (
    <div style={{
      background: '#0a1118',
      border: '1px solid #1a2736',
      borderRadius: '8px',
      padding: '20px 24px',
      minWidth: '180px',
      flex: '1 1 0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
      }} />
      <div style={{
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px',
        color: '#64748b', marginBottom: '8px',
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
        fontSize: '36px', fontWeight: 700, color,
        lineHeight: 1.1,
      }}>{value}</div>
      {subtext && (
        <div style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          fontSize: '11px', color: '#64748b', marginTop: '6px',
        }}>{subtext}</div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
      color: '#00d4ff',
      fontSize: '12px',
      fontWeight: 700,
      letterSpacing: '3px',
      textTransform: 'uppercase',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      <span style={{ fontSize: '14px' }}>◈</span>
      <span>{title}</span>
      <span style={{
        flex: 1, height: '1px',
        background: 'linear-gradient(90deg, rgba(0,212,255,0.35), transparent)',
      }} />
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
function MatchPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const matches = MOCK_MATCHES;

  const stats = useMemo(() => {
    const total = matches.length;
    const highConf = matches.filter(m => m.score >= 0.8).length;
    const pending = matches.filter(m => m.status === 'pending').length;
    const verified = matches.filter(m => m.status === 'verified').length;
    return { total, highConf, pending, verified };
  }, [matches]);

  const distribution = useScoreDistribution(matches);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return matches;
    const q = searchQuery.toLowerCase();
    return matches.filter(m =>
      m.id.toLowerCase().includes(q) ||
      m.materialA.toLowerCase().includes(q) ||
      m.materialB.toLowerCase().includes(q) ||
      m.algorithm.toLowerCase().includes(q) ||
      m.matchType.toLowerCase().includes(q),
    );
  }, [matches, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkAction = (action: 'verify' | 'reject') => {
    console.log(`[WATCHTOWER] Bulk ${action} for:`, Array.from(selected));
    setSelected(new Set());
  };

  const maxBucketCount = Math.max(...distribution.map(b => b.count), 1);

  return (
    <div style={{
      background: '#060a10',
      minHeight: '100vh',
      padding: '24px 32px',
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      color: '#e0e8f0',
    }}>
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            color: '#00ff41', fontSize: '10px', letterSpacing: '1px',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }}>
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              backgroundColor: '#00ff41', display: 'inline-block',
            }} />
            LIVE
          </span>
          <span style={{
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            color: '#64748b', fontSize: '11px',
          }}>THREAT INTELLIGENCE MATCHING SYSTEM</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          color: '#00d4ff',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          margin: 0,
          lineHeight: 1.2,
        }}>
          ◈ Match Analysis
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
          color: '#64748b',
          fontSize: '12px',
          marginTop: '4px',
        }}>
          Cross-material pattern matching · {stats.total} entries indexed · Real-time correlation engine
        </p>
      </div>

      {/* ─── Stat Cards ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <StatCard label="Total Matches" value={stats.total} subtext="All time" color="#00d4ff" />
        <StatCard label="High Confidence" value={stats.highConf} subtext={`${Math.round((stats.highConf / stats.total) * 100)}% of total`} color="#22c55e" />
        <StatCard label="Pending Review" value={stats.pending} subtext="Awaiting analyst input" color="#eab308" />
        <StatCard label="Verified" value={stats.verified} subtext="Threat confirmed" color="#22c55e" />
      </div>

      {/* ─── Score Distribution ────────────────────────────────────── */}
      <div style={{
        background: '#0a1118',
        border: '1px solid #1a2736',
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <SectionHeader title="Match Score Distribution" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {distribution.map(bucket => {
            const pct = (bucket.count / maxBucketCount) * 100;
            return (
              <div key={bucket.label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '11px',
                  color: '#64748b',
                  width: '70px',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>{bucket.label}</div>
                <div style={{
                  flex: 1, height: '18px',
                  background: '#1a2736',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: scoreGradient((bucket.min + bucket.max) / 2),
                    borderRadius: '4px',
                    transition: 'width 0.6s ease',
                    minWidth: bucket.count > 0 ? '4px' : '0',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: scoreColor((bucket.min + bucket.max) / 2),
                  width: '28px',
                  textAlign: 'right',
                  flexShrink: 0,
                }}>{bucket.count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Algorithms Performance ────────────────────────────────── */}
      <div style={{
        background: '#0a1118',
        border: '1px solid #1a2736',
        borderRadius: '8px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <SectionHeader title="Match Algorithms" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          {ALGORITHM_METRICS.map(algo => {
            const col = '#00d4ff';
            return (
              <div key={algo.name} style={{
                background: 'rgba(6,10,16,0.6)',
                border: '1px solid rgba(0,212,255,0.12)',
                borderRadius: '6px',
                padding: '14px 16px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#e0e8f0',
                  marginBottom: '10px',
                }}>{algo.name}</div>
                {(['precision', 'recall', 'f1'] as const).map(metric => {
                  const val = algo[metric];
                  return (
                    <div key={metric} style={{ marginBottom: '6px' }}>
                      <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                        fontSize: '10px',
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '3px',
                      }}>
                        <span>{metric}</span>
                        <span style={{ color: col }}>{(val * 100).toFixed(1)}%</span>
                      </div>
                      <div style={{
                        height: '5px',
                        background: '#1a2736',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%',
                          width: `${val * 100}%`,
                          background: `linear-gradient(90deg, rgba(0,212,255,0.4), ${col})`,
                          borderRadius: '3px',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Main Table ────────────────────────────────────────────── */}
      <div style={{
        background: '#0a1118',
        border: '1px solid #1a2736',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '24px',
      }}>
        {/* Table toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid #1a2736',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SectionHeader title="Match Registry" />
            {selected.size > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: '11px',
                color: '#00d4ff',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.25)',
                padding: '3px 10px',
                borderRadius: '4px',
              }}>{selected.size} selected</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {selected.size > 0 && (
              <>
                <button onClick={() => handleBulkAction('verify')} style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.35)',
                  color: '#22c55e',
                  padding: '5px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>Verify Selected</button>
                <button onClick={() => handleBulkAction('reject')} style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.35)',
                  color: '#ef4444',
                  padding: '5px 14px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>Reject Selected</button>
              </>
            )}
            <button onClick={() => setModalOpen(true)} style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              background: 'rgba(0,212,255,0.1)',
              border: '1px solid rgba(0,212,255,0.35)',
              color: '#00d4ff',
              padding: '5px 14px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              letterSpacing: '1px',
              textTransform: 'uppercase',
            }}>+ Run New Match</button>
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #1a2736' }}>
          <input
            type="text"
            placeholder="Search by ID, material, algorithm, or type…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(6,10,16,0.7)',
              border: '1px solid #1a2736',
              borderRadius: '4px',
              padding: '8px 12px',
              color: '#e0e8f0',
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '12px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            fontSize: '12px',
          }}>
            <thead>
              <tr style={{
                borderBottom: '1px solid #1a2736',
                background: 'rgba(6,10,16,0.4)',
              }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, width: '36px' }}>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selected.size === filtered.length}
                    onChange={e => {
                      if (e.target.checked) setSelected(new Set(filtered.map(m => m.id)));
                      else setSelected(new Set());
                    }}
                    style={{ accentColor: '#00d4ff', cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Match ID</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Material A</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Material B</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Score</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Algorithm</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Date</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600, width: '30px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const expanded = expandedRows.has(m.id);
                const checked = selected.has(m.id);
                return (
                  <React.Fragment key={m.id}>
                    <tr style={{
                      borderBottom: expanded ? 'none' : '1px solid rgba(26,39,54,0.6)',
                      background: checked ? 'rgba(0,212,255,0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0,212,255,0.03)'; }}
                      onMouseLeave={e => { if (!checked) (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(m.id)}
                          style={{ accentColor: '#00d4ff', cursor: 'pointer' }}
                          onClick={e => e.stopPropagation()}
                        />
                      </td>
                      <td style={{ padding: '10px 14px', color: '#00d4ff', fontWeight: 600, fontSize: '12px' }}>{m.id}</td>
                      <td style={{ padding: '10px 14px', color: '#c8d6e5' }}>{m.materialA}</td>
                      <td style={{ padding: '10px 14px', color: '#c8d6e5' }}>{m.materialB}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '3px',
                          background: MATCH_TYPE_STYLES[m.matchType].bg,
                          color: MATCH_TYPE_STYLES[m.matchType].color,
                          border: `1px solid ${MATCH_TYPE_STYLES[m.matchType].border}`,
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontWeight: 600,
                        }}>{m.matchType}</span>
                      </td>
                      <td style={{ padding: '10px 14px', minWidth: '130px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            flex: 1, height: '6px', background: '#1a2736',
                            borderRadius: '3px', overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${m.score * 100}%`,
                              background: scoreGradient(m.score),
                              borderRadius: '3px',
                            }} />
                          </div>
                          <span style={{
                            color: scoreColor(m.score),
                            fontSize: '11px',
                            fontWeight: 600,
                            width: '38px',
                            textAlign: 'right',
                          }}>{(m.score * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{m.algorithm}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '3px',
                          background: STATUS_STYLES[m.status].bg,
                          color: STATUS_STYLES[m.status].color,
                          border: `1px solid ${STATUS_STYLES[m.status].border}`,
                          fontSize: '10px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontWeight: 600,
                        }}>{m.status}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', fontSize: '11px' }}>{m.date}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleExpand(m.id)}
                          style={{
                            background: 'transparent',
                            border: '1px solid #1a2736',
                            color: '#64748b',
                            cursor: 'pointer',
                            borderRadius: '3px',
                            padding: '2px 6px',
                            fontSize: '10px',
                            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                          }}
                        >{expanded ? '▲' : '▼'}</button>
                      </td>
                    </tr>
                    {expanded && (
                      <tr style={{ borderBottom: '1px solid #1a2736' }}>
                        <td colSpan={10} style={{
                          padding: '14px 20px 18px 56px',
                          background: 'rgba(6,10,16,0.5)',
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            {/* Similarity breakdown */}
                            <div>
                              <div style={{
                                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                fontSize: '10px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '8px',
                              }}>Similarity Breakdown</div>
                              {Object.entries(m.similarityBreakdown).map(([key, val]) => (
                                <div key={key} style={{ marginBottom: '6px' }}>
                                  <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                    fontSize: '10px',
                                    color: '#64748b',
                                    textTransform: 'capitalize',
                                    marginBottom: '2px',
                                  }}>
                                    <span>{key}</span>
                                    <span style={{ color: '#00d4ff' }}>{(val * 100).toFixed(1)}%</span>
                                  </div>
                                  <div style={{
                                    height: '4px',
                                    background: '#1a2736',
                                    borderRadius: '2px',
                                    overflow: 'hidden',
                                  }}>
                                    <div style={{
                                      height: '100%',
                                      width: `${val * 100}%`,
                                      background: 'linear-gradient(90deg, rgba(0,212,255,0.35), #00d4ff)',
                                      borderRadius: '2px',
                                    }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                            {/* Notes */}
                            <div>
                              <div style={{
                                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                fontSize: '10px',
                                color: '#64748b',
                                textTransform: 'uppercase',
                                letterSpacing: '2px',
                                marginBottom: '8px',
                              }}>Analyst Notes</div>
                              <div style={{
                                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                fontSize: '11px',
                                color: '#94a3b8',
                                background: 'rgba(6,10,16,0.6)',
                                border: '1px solid #1a2736',
                                borderRadius: '4px',
                                padding: '8px 12px',
                                lineHeight: 1.5,
                              }}>
                                {m.analystNotes || (
                                  <span style={{ color: '#475569', fontStyle: 'italic' }}>No analyst notes on record.</span>
                                )}
                              </div>
                              <div style={{
                                marginTop: '8px',
                                display: 'flex',
                                gap: '6px',
                                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                                fontSize: '10px',
                                color: '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                              }}>
                                <span>Algorithm: <span style={{ color: '#00d4ff' }}>{m.algorithm}</span></span>
                                <span>·</span>
                                <span>Type: <span style={{ color: MATCH_TYPE_STYLES[m.matchType].color }}>{m.matchType}</span></span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#475569',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '12px',
                  }}>
                    No matches found for query "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#0a1118',
              border: '1px solid #1a2736',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 0 60px rgba(0,212,255,0.08)',
            }}
          >
            <div style={{
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: '14px',
              color: '#00d4ff',
              letterSpacing: '2px',
              marginBottom: '20px',
            }}>◈ Run New Match</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '10px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '6px',
                  display: 'block',
                }}>Material A</label>
                <input
                  type="text"
                  placeholder="e.g. MAL-2024-0001"
                  style={{
                    width: '100%',
                    background: 'rgba(6,10,16,0.7)',
                    border: '1px solid #1a2736',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: '#e0e8f0',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '10px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '6px',
                  display: 'block',
                }}>Material B</label>
                <input
                  type="text"
                  placeholder="e.g. C2-2024-0001"
                  style={{
                    width: '100%',
                    background: 'rgba(6,10,16,0.7)',
                    border: '1px solid #1a2736',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    color: '#e0e8f0',
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                    fontSize: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '10px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  marginBottom: '6px',
                  display: 'block',
                }}>Algorithm</label>
                <select style={{
                  width: '100%',
                  background: 'rgba(6,10,16,0.7)',
                  border: '1px solid #1a2736',
                  borderRadius: '4px',
                  padding: '8px 12px',
                  color: '#e0e8f0',
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: '12px',
                  outline: 'none',
                  cursor: 'pointer',
                }}>
                  {ALGO_NAMES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'flex-end' }}>
                <button onClick={() => setModalOpen(false)} style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  background: 'transparent',
                  border: '1px solid #1a2736',
                  color: '#64748b',
                  padding: '7px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                }}>Cancel</button>
                <button onClick={() => { setModalOpen(false); console.log('[WATCHTOWER] Run match'); }} style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  background: 'rgba(0,212,255,0.12)',
                  border: '1px solid rgba(0,212,255,0.4)',
                  color: '#00d4ff',
                  padding: '7px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}>Execute</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchPage;
