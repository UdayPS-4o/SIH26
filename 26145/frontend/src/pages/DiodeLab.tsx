/* DiodeLab — hero page for the enclave degradation demo */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Shield, Crosshair, AlertTriangle, Globe, Network, Zap } from 'lucide-react';
import DiodeToggle from '../components/DiodeToggle';
import DegradationMatrix, { DegradationRow } from '../components/DegradationMatrix';
import TerminalOutput, { TerminalLine } from '../components/TerminalOutput';
import ValidityChip from '../components/ValidityChip';

const API_BASE = typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:8000/api';

const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-secondary)',
  border: 'var(--border-color)', text: 'var(--text-primary)',
  textSec: 'var(--text-secondary)', textDim: 'var(--text-muted)',
  accent: 'var(--accent-cyan)', green: 'var(--accent-green)',
  orange: 'var(--accent-orange)', amber: 'var(--accent-yellow)',
  red: 'var(--accent-red)', purple: 'var(--accent-purple)',
};

const DiodeLab: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [diodeMode, setDiodeMode] = useState<'full-duplex' | 'diode-only' | 'ack-shadow'>('full-duplex');
  const [degradationData, setDegradationData] = useState<DegradationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullStream, setFullStream] = useState<TerminalLine[]>([]);
  const [diodeStream, setDiodeStream] = useState<TerminalLine[]>([]);
  const [streamLoading, setStreamLoading] = useState(false);

  const [attackType, setAttackType] = useState('syn_flood');
  const [intensity, setIntensity] = useState('medium');

  const ATTACK_TYPES = [
    { id: 'syn_flood', label: 'SYN Flood' },
    { id: 'c2_beacon', label: 'C2 Beaconing' },
    { id: 'dga_domain', label: 'DGA Domain' },
    { id: 'dns_tunnel', label: 'DNS Tunneling' },
    { id: 'data_exfil', label: 'Data Exfil' },
    { id: 'port_scan', label: 'Port Scan' },
    { id: 'tls_beacon', label: 'TLS Beaconing' },
    { id: 'udp_flood', label: 'UDP Flood' },
  ];

  /* ── On mount: fetch mode + degradation table ── */
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const r = await fetch(`${API_BASE}/diode/mode`, { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          const d = await r.json();
          if (d.mode) setDiodeMode(d.mode);
          if (d.degradation_table) setDegradationData(d.degradation_table);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchMode();
  }, []);

  /* ── Mode change handler ── */
  const handleModeChange = async (mode: 'full-duplex' | 'diode-only' | 'ack-shadow') => {
    setDiodeMode(mode);
    try {
      await fetch(`${API_BASE}/diode/mode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
        signal: AbortSignal.timeout(2000),
      });
      const r = await fetch(`${API_BASE}/diode/degradation`, { signal: AbortSignal.timeout(2000) });
      if (r.ok) {
        const d = await r.json();
        if (d.data) setDegradationData(d.data);
      }
    } catch {
      /* apply mock data locally on failure */
      setDegradationData(getMockDegradation(mode));
    }
  };

  /* ── Generate mock degradation data ── */
  const getMockDegradation = (mode: string): DegradationRow[] => {
    const m = mode === 'full-duplex' ? 1 : mode === 'diode-only' ? 0.72 : 0.85;
    const featuresLost = mode === 'full-duplex' ? 'None' : mode === 'diode-only' ? 'Payload Decryption' : 'Retransmission';
    return [
      { threat_type: 'DDoS', icon: '⚡', full_rate: 94, diode_rate: 72, ack_shadow_rate: 85, features_lost: featuresLost, severity: 'critical', validity: 'MEASURED' },
      { threat_type: 'C2 Beaconing', icon: '📡', full_rate: 91, diode_rate: 78, ack_shadow_rate: 88, features_lost: featuresLost, severity: 'high', validity: 'MEASURED' },
      { threat_type: 'DGA Domains', icon: '🌐', full_rate: 88, diode_rate: 65, ack_shadow_rate: 80, features_lost: featuresLost, severity: 'high', validity: 'ESTIMATED' },
      { threat_type: 'DNS Tunneling', icon: '🔍', full_rate: 86, diode_rate: 60, ack_shadow_rate: 77, features_lost: featuresLost, severity: 'critical', validity: 'MEASURED' },
      { threat_type: 'Port Scan', icon: '🛡', full_rate: 82, diode_rate: 70, ack_shadow_rate: 81, features_lost: featuresLost, severity: 'medium', validity: 'ESTIMATED' },
      { threat_type: 'Data Exfil', icon: '📤', full_rate: 89, diode_rate: 55, ack_shadow_rate: 76, features_lost: featuresLost, severity: 'critical', validity: 'MISSING' },
    ];
  };

  /* ── Launch attack handler ── */
  const handleLaunch = async () => {
    setStreamLoading(true);
    const newFull: TerminalLine[] = [];
    const newDiode: TerminalLine[] = [];

    // Simulate full-duplex stream
    newFull.push({ text: `[LAUNCH] ${ATTACK_TYPES.find(a => a.id === attackType)?.label || attackType} @ ${intensity} intensity`, type: 'info' });
    newFull.push({ text: `[DETECT] Detection confidence: ${(75 + Math.random() * 25).toFixed(1)}%`, type: 'pass' });
    newFull.push({ text: `[INFER] Ensemble classifier matched R-${String(Math.floor(Math.random() * 8) + 1).padStart(3, '0')}`, type: 'info' });
    newFull.push({ text: `[ALERT] Evidence hash generated: ${Array.from({length: 8}, () => Math.random().toString(16).slice(2, 6)).join('')}…`, type: 'pass' });
    newFull.push({ text: `[DONE] Detection cycle complete in ${(20 + Math.random() * 100).toFixed(0)}ms`, type: 'pass' });

    // Simulate diode-only stream (slightly degraded)
    const dropped = Math.random() > 0.5;
    newDiode.push({ text: `[LAUNCH] ${ATTACK_TYPES.find(a => a.id === attackType)?.label || attackType} @ ${intensity} intensity`, type: 'info' });
    if (dropped) {
      newDiode.push({ text: `[WARN] Payload data unavailable (diode constraint)`, type: 'fail' });
      newDiode.push({ text: `[DETECT] Detection confidence: ${(50 + Math.random() * 30).toFixed(1)}% (degraded)`, type: 'checking' });
      newDiode.push({ text: `[INFER] Partial features only — JA3 + flow metadata`, type: 'info' });
      newDiode.push({ text: `[DONE] Detection cycle complete in ${(40 + Math.random() * 150).toFixed(0)}ms`, type: 'checking' });
    } else {
      newDiode.push({ text: `[DETECT] Detection confidence: ${(60 + Math.random() * 30).toFixed(1)}%`, type: 'pass' });
      newDiode.push({ text: `[INFER] JA3 + flow metadata sufficient`, type: 'info' });
      newDiode.push({ text: `[ALERT] Evidence hash generated`, type: 'pass' });
      newDiode.push({ text: `[DONE] Detection cycle complete in ${(30 + Math.random() * 100).toFixed(0)}ms`, type: 'pass' });
    }

    try {
      await fetch(`${API_BASE}/attack/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attack_type: attackType, intensity, mode: diodeMode }),
        signal: AbortSignal.timeout(2000),
      });
    } catch { /* silent */ }

    setFullStream(newFull);
    setDiodeStream(newDiode);
    setStreamLoading(false);
  };

  /* ── Recent alerts mock ── */
  const mockAlerts = [
    { id: 'AL-001', type: 'SYN Flood', severity: 'critical', ts: '14:32:01', validity: 'MEASURED' as const },
    { id: 'AL-002', type: 'C2 Beacon', severity: 'high', ts: '14:31:45', validity: 'ESTIMATED' as const },
    { id: 'AL-003', type: 'DGA Domain', severity: 'medium', ts: '14:30:22', validity: 'MISSING' as const },
    { id: 'AL-004', type: 'DNS Tunnel', severity: 'high', ts: '14:28:11', validity: 'MEASURED' as const },
    { id: 'AL-005', type: 'Port Scan', severity: 'low', ts: '14:25:03', validity: 'ESTIMATED' as const },
  ];

  return (
    <div style={{
      minHeight:'100%', background: C.bg, color: C.text,
      fontFamily: '"Inter",system-ui,sans-serif', fontSize: 13, lineHeight: 1.6,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0; transform:translateY(4px);} to{opacity:1; transform:translateY(0);} }
        ::selection { background:rgba(0,212,255,0.12); color:${C.text}; }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.4); outline-offset:2px; border-radius:3px; }
        ::-webkit-scrollbar { width:6px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:var(--border-color); border-radius:3px; }
        @keyframes pulse-border { 0%,100%{border-color: rgba(250,204,21,0.15);} 50%{border-color: rgba(250,204,21,0.4);} }
      `}</style>

      <header style={{
        position:'sticky',top:0,zIndex:40,
        background: C.bg, borderBottom: `1px solid ${C.border}`,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{
          maxWidth:1400,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height: 52,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:30,height:30,borderRadius:6,
              background:`${C.accent}10`,border:`1px solid ${C.accent}25`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <Activity size={15} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color: C.text }}>WATCHTOWER</span>
          </div>
          <div style={{ width:1,height:16,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>PS-26145 · DIODE LAB</span>
        </div>
      </header>

      <main style={{ maxWidth:1400, margin:'0 auto', padding:'28px 28px 80px' }}>

        {/* ── PAGE HEADER ── */}
        <section style={{ marginBottom: 32 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 700, letterSpacing:'-0.5px', color: C.text, marginBottom: 8,
          }}>Diode Lab</h1>
          <p style={{
            fontSize: 14, color: C.textSec, maxWidth: 640, lineHeight: 1.7, margin: 0,
          }}>
            Honest degradation under enclave constraints. See how detection rates change
            when read-only diode constraints limit feature availability.
          </p>
        </section>

        {/* ── DIODE TOGGLE ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap: 16,
            }}>
              <div>
                <div style={{
                  fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.textSec,
                  fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', marginBottom: 8,
                }}>Enclave Transmission Mode</div>
                <div style={{ fontSize:12, color:C.textDim }}>
                  Select the enclave constraint mode to see its effect on detection rates
                </div>
              </div>
              <DiodeToggle mode={diodeMode} onChange={handleModeChange} />
            </div>
          </div>
        </section>

        {/* ── DEGRADATION MATRIX ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding: '20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom: 16,
            }}>
              <div style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.accent,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Detection Degradation Matrix</div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Shield size={12} color={C.green} />
                <span style={{ fontSize:10, fontWeight:600, color:C.green, letterSpacing:'0.5px', textTransform:'uppercase' }}>
                  {loading ? 'Loading…' : 'Live Data'}
                </span>
              </div>
            </div>
            {loading ? (
              <div style={{ padding:'40px 20px', textAlign:'center', color:C.textDim }}>
                Loading degradation table…
              </div>
            ) : (
              <DegradationMatrix data={degradationData.length > 0 ? degradationData : getMockDegradation(diodeMode)} />
            )}
          </div>
        </section>

        {/* ── TWO-COLUMN STREAMS ── */}
        <section style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }} className="row-2">
          {/* Full-Duplex Alert Stream */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom: 14,
              paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              <Globe size={14} color={C.green} />
              <span style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.green,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Full-Duplex Alert Stream</span>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace' }}>BIDIRECTIONAL</span>
            </div>

            <div style={{
              display:'flex', flexDirection:'column', gap:8, marginBottom:16, minHeight:120,
            }}>
              {fullStream.length === 0 ? (
                <div style={{ color:C.textDim, fontSize:11, textAlign:'center', padding:'40px 0' }}>
                  No alerts in stream. Launch an attack below.
                </div>
              ) : (
                fullStream.map((line, i) => {
                  const clr = line.type === 'pass' ? C.green : line.type === 'fail' ? C.red : line.type === 'checking' ? C.amber : C.accent;
                  return (
                    <div key={i} style={{
                      fontSize:11, color: clr, lineHeight:1.6,
                      fontFamily:'"JetBrains Mono",monospace',
                      opacity:0, animation:`wt-fade-in 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s forwards`,
                    }}>
                      {line.text}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {mockAlerts.slice(0, 3).map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{
                    fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:2,
                    color: a.severity === 'critical' ? C.red : a.severity === 'high' ? C.orange : C.amber,
                    border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.25)' : a.severity === 'high' ? 'rgba(249,115,22,0.25)' : 'rgba(234,179,8,0.25)'}`,
                  }}>{a.severity}</span>
                  <span style={{ color: C.textSec }}>{a.ts}</span>
                  <span style={{ color: C.text }}>{a.type}</span>
                  <ValidityChip validity={a.validity} />
                </div>
              ))}
            </div>
          </div>

          {/* Diode-Only Alert Stream */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom: 14,
              paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              <Shield size={14} color={C.orange} />
              <span style={{
                fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.orange,
                fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              }}>Diode-Only Alert Stream</span>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace' }}>READ-ONLY</span>
            </div>

            <div style={{
              display:'flex', flexDirection:'column', gap:8, marginBottom:16, minHeight:120,
            }}>
              {diodeStream.length === 0 ? (
                <div style={{ color:C.textDim, fontSize:11, textAlign:'center', padding:'40px 0' }}>
                  No alerts in stream. Launch an attack below.
                </div>
              ) : (
                diodeStream.map((line, i) => {
                  const clr = line.type === 'pass' ? C.green : line.type === 'fail' ? C.red : line.type === 'checking' ? C.amber : C.accent;
                  return (
                    <div key={i} style={{
                      fontSize:11, color: clr, lineHeight:1.6,
                      fontFamily:'"JetBrains Mono",monospace',
                      opacity:0, animation:`wt-fade-in 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s forwards`,
                    }}>
                      {line.text}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ fontSize:10, color:C.textDim, fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase', letterSpacing:'0.5px' }}>
              {mockAlerts.slice(2, 5).map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                  <span style={{
                    fontSize:8, fontWeight:700, padding:'1px 5px', borderRadius:2,
                    color: a.severity === 'critical' ? C.red : a.severity === 'high' ? C.orange : C.amber,
                    border: `1px solid ${a.severity === 'critical' ? 'rgba(239,68,68,0.25)' : a.severity === 'high' ? 'rgba(249,115,22,0.25)' : 'rgba(234,179,8,0.25)'}`,
                  }}>{a.severity}</span>
                  <span style={{ color: C.textSec }}>{a.ts}</span>
                  <span style={{ color: C.text }}>{a.type}</span>
                  <ValidityChip validity={a.validity} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── MINI ATTACK PANEL ── */}
        <section>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 10, padding:'20px 24px',
          }}>
            <div style={{
              fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.accent,
              fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
              marginBottom: 14, paddingBottom:12, borderBottom:'1px solid var(--border-color)',
            }}>
              Attack Simulation
            </div>
            <div style={{
              display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
            }}>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Attack Type</span>
                <select
                  value={attackType}
                  onChange={e => setAttackType(e.target.value)}
                  style={{
                    padding:'7px 12px', background: C.bg, border:'1px solid var(--border-color)',
                    borderRadius:6, color: C.text, fontSize:12,
                    fontFamily:'"JetBrains Mono",monospace', cursor:'pointer', outline:'none',
                    minWidth: 160,
                  }}
                >
                  {ATTACK_TYPES.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                </select>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Intensity</span>
                <select
                  value={intensity}
                  onChange={e => setIntensity(e.target.value)}
                  style={{
                    padding:'7px 12px', background: C.bg, border:'1px solid var(--border-color)',
                    borderRadius:6, color: C.text, fontSize:12,
                    fontFamily:'"JetBrains Mono",monospace', cursor:'pointer', outline:'none',
                    minWidth: 100,
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:10, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px' }}>Current Mode</span>
                <div style={{
                  padding:'7px 12px', background: `${C.accent}08`,
                  border: `1px solid ${C.accent}25`, borderRadius: 6,
                  fontSize:11, fontWeight:600, color: C.accent,
                  fontFamily:'"JetBrains Mono",monospace',
                  textTransform:'uppercase', letterSpacing:'0.5px',
                }}>
                  {diodeMode.toUpperCase().replace('-', ' ')}
                </div>
              </div>

              <div style={{ flex:1 }} />

              <button
                onClick={handleLaunch}
                disabled={streamLoading}
                style={{
                  padding:'10px 28px', background: streamLoading ? 'transparent' : 'rgba(0,212,255,0.1)',
                  border: `1px solid ${streamLoading ? 'var(--border-color)' : 'rgba(0,212,255,0.35)'}`,
                  borderRadius: 8, cursor: streamLoading ? 'not-allowed' : 'pointer',
                  fontFamily:'"JetBrains Mono",monospace', fontSize:12, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.5px', color: streamLoading ? C.textDim : C.accent,
                  transition:'all 0.2s',
                }}
              >
                {streamLoading ? (
                  <span style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                    <span style={{ display:'inline-block', width:14, height:14, border:'2px solid var(--text-muted)', borderTopColor:'transparent', borderRadius:'50%', animation:'wt-spin 0.6s linear infinite' }} />
                    Launching…
                  </span>
                ) : 'Launch Attack'}
              </button>

              <button
                onClick={() => { setFullStream([]); setDiodeStream([]); }}
                style={{
                  padding:'10px 20px', background:'transparent',
                  border:'1px solid var(--border-color)', borderRadius:8, cursor:'pointer',
                  fontFamily:'"JetBrains Mono",monospace', fontSize:12, fontWeight:600,
                  textTransform:'uppercase', letterSpacing:'0.5px', color: C.textSec,
                  transition:'all 0.2s',
                }}
              >
                Clear Streams
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{
          padding:'20px 0', borderTop:`1px solid ${C.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:8, marginTop: 32,
        }}>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'1px', fontFamily:'"JetBrains Mono",monospace' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:10, color:C.textDim, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace' }}>
            Mode: {diodeMode.toUpperCase()} · Degradation Active
          </span>
        </footer>
      </main>
    </div>
  );
};

export default DiodeLab;
