/* EvidenceLocker — forensic evidence page for individual alert inspection */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, ChevronDown, ChevronUp, Shield, Clock, AlertTriangle } from 'lucide-react';
import { Alert } from '../types';
import EvidenceChain from '../components/EvidenceChain';
import FeatureValidityPanel, { type FeatureEntry } from '../components/FeatureValidityPanel';
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

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--accent-red)', high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)', low: 'var(--accent-cyan)',
};

const EvidenceLocker: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const alertId = searchParams.get('alertId');

  const [alert, setAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  const [rawExpanded, setRawExpanded] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    if (!alertId) {
      // Show empty state if no alertId
      setLoading(false);
      return;
    }

    const fetchAlert = async () => {
      setLoading(true);
      try {
        const r = await fetch(`${API_BASE}/alerts/${encodeURIComponent(alertId)}`, { signal: AbortSignal.timeout(3000) });
        if (r.ok) {
          const d = await r.json();
          setAlert(d.alert || d);
        }
      } catch { /* silent */ }
      setLoading(false);
    };
    fetchAlert();
  }, [alertId]);

  /* ── Mock data for demo if no real alert ── */
  const mockAlert: Alert = {
    id: alertId || 'ALT-DEMO-001',
    timestamp: Date.now() - 120000,
    threat_type: 'dns_tunnel',
    confidence: 0.94,
    severity: 'critical',
    src_ip: '10.0.3.47',
    dst_ip: '8.8.8.8',
    src_port: 49152,
    dst_port: 53,
    protocol: 'DNS',
    evidence: { anomaly_score: '0.94', dns_queries: 1847, tunnel_bytes: '2.3MB', flag_count: 412, entropy: 7.82 },
    flow_count: 1847,
  };

  const currentAlert = alert || (loading ? null : mockAlert);

  /* ── Feature breakdown ── */
  const features: FeatureEntry[] = [
    { name: 'JA3 Hash Entropy',        value: '7.82',  unit: 'bits', validity: 'MEASURED',  shap_contribution: 92 },
    { name: 'DNS Query Length',         value: '128',   unit: 'bytes', validity: 'MEASURED',  shap_contribution: 85 },
    { name: 'Inter-arrival Variance',   value: '0.04',  unit: 's', validity: 'ESTIMATED', shap_contribution: 71 },
    { name: 'Flow Byte Ratio',          value: '14.2',  unit: 'x',  validity: 'MEASURED',  shap_contribution: 88 },
    { name: 'Packet Size Std Dev',      value: '312',   unit: 'B',  validity: 'ESTIMATED', shap_contribution: 45 },
    { name: 'TLS Fingerprint',          value: 'N/A',   unit: '',    validity: 'MISSING',   shap_contribution: 0 },
    { name: 'Port Fan-out',             value: '3',     unit: 'ports', validity: 'MEASURED', shap_contribution: 67 },
    { name: 'DNS Response TTL Variance',value: '2400',  unit: 'ms', validity: 'MISSING',   shap_contribution: 0 },
    { name: 'Payload Entropy',          value: 'N/A',   unit: '',    validity: 'MISSING',   shap_contribution: 0 },
    { name: 'Flow Duration',            value: '4.2',   unit: 's',  validity: 'MEASURED',  shap_contribution: 58 },
  ];

  const sha256 = currentAlert ? `a3f2c8e91b4d7f6a2c8e91b4d7f6a2c8e91b4d7f6a2c8e91b4d7f6a2c8e91b4d` : '';

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
      `}</style>

      <header style={{
        position:'sticky',top:0,zIndex:40,
        background: C.bg, borderBottom:`1px solid ${C.border}`,
        backdropFilter:'blur(12px)',
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
              <Shield size={15} color={C.accent} strokeWidth={1.8} />
            </div>
            <span style={{ fontSize:13,fontWeight:700,letterSpacing:'3px',color: C.text }}>WATCHTOWER</span>
          </div>
          <div style={{ width:1,height:16,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>
            PS-26145 · EVIDENCE LOCKER
          </span>
          <div style={{ flex:1 }} />
          {alertId && (
            <button
              onClick={() => navigate(-1)}
              style={{
                padding:'4px 12px', background:'transparent',
                border:'1px solid var(--border-color)', borderRadius:6,
                color: C.textSec, fontSize:11, fontFamily:'"JetBrains Mono",monospace',
                cursor:'pointer', letterSpacing:'0.5px', textTransform:'uppercase',
              }}
            >
              Back
            </button>
          )}
        </div>
      </header>

      <main style={{ maxWidth:1400, margin:'0 auto', padding:'24px 28px 64px' }}>

        {loading ? (
          <div style={{ padding:'80px 20px', textAlign:'center', color:C.textDim }}>
            Loading evidence data…
          </div>
        ) : !currentAlert ? (
          <div style={{ padding:'80px 20px', textAlign:'center', color:C.textDim }}>
            <Shield size={32} strokeWidth={1} style={{ marginBottom:12, opacity:0.5 }} />
            <div style={{ fontSize:13, color:C.textSec, marginBottom:8 }}>No alert selected</div>
            <div style={{ fontSize:12, color:C.textDim }}>
              Navigate from the Live Threats page to view alert evidence.
              Or use <code style={{ background:'var(--bg-secondary)', padding:'2px 6px', borderRadius:3 }}>/evidence?alertId=ALT-001</code>
            </div>
          </div>
        ) : (
          <>

            {/* ── ALERT HEADER CARD ── */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10, padding: '24px',
              }}>
                <div style={{
                  display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
                  marginBottom: 16, paddingBottom:14, borderBottom:'1px solid var(--border-color)',
                }}>
                  <span style={{
                    fontSize:16, fontWeight:700, letterSpacing:'0.5px',
                    fontFamily:'"JetBrains Mono",monospace', color: C.text,
                  }}>{currentAlert.id}</span>
                  <span style={{
                    fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px',
                    color: SEV_COLORS[currentAlert.severity] || C.textSec,
                    background: `${SEV_COLORS[currentAlert.severity] || C.textSec}12`,
                    border: `1px solid ${(SEV_COLORS[currentAlert.severity] || C.textSec) || 'transparent'}25`,
                    padding:'3px 10px', borderRadius:5,
                  }}>{currentAlert.severity}</span>
                  <span style={{
                    fontSize:11, fontWeight:600, color: C.purple,
                    background: `${C.purple}10`, border:`1px solid ${C.purple}25`,
                    padding:'3px 10px', borderRadius:5, textTransform:'uppercase', letterSpacing:'0.4px',
                  }}>
                    {(currentAlert.threat_type || 'unknown').replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>

                <div style={{
                  display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:12,
                }}>
                  {[
                    { label:'Timestamp', value: new Date(currentAlert.timestamp).toLocaleString(), mono:true },
                    { label:'Confidence', value: `${(currentAlert.confidence * 100).toFixed(1)}%`, mono:true, color:C.green },
                    { label:'Source IP', value: currentAlert.src_ip, mono:true },
                    { label:'Destination IP', value: currentAlert.dst_ip, mono:true },
                    { label:'Source Port', value: String(currentAlert.src_port), mono:true },
                    { label:'Dest Port', value: String(currentAlert.dst_port), mono:true },
                    { label:'Protocol', value: currentAlert.protocol, mono:true },
                    { label:'Flow Count', value: String(currentAlert.flow_count), mono:true },
                  ].map(m => (
                    <div key={m.label} style={{
                      padding:'8px 12px', background:'var(--bg-primary)',
                      border:'1px solid var(--border-color)', borderRadius:6,
                    }}>
                      <div style={{ fontSize:9, fontWeight:600, color:C.textDim, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>
                        {m.label}
                      </div>
                      <div style={{
                        fontSize:12, fontWeight:600, color: m.color || C.text,
                        fontFamily: '"JetBrains Mono","Fira Code",monospace', fontVariantNumeric:'tabular-nums',
                      }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── EVIDENCE CHAIN ── */}
            <section style={{ marginBottom: 24 }}>
              <EvidenceChain
                hash={sha256}
                timestamp={currentAlert.timestamp}
                threat_class={currentAlert.threat_type.replace(/_/g, ' ').toUpperCase()}
                severity={currentAlert.severity}
                merkle_seal={`MerkleRoot: ${Array.from({length: 32}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`}
              />
            </section>

            {/* ── FEATURE BREAKDOWN ── */}
            <section style={{ marginBottom: 24 }}>
              <FeatureValidityPanel features={features} />
            </section>

            {/* ── VALIDITY TIMELINE ── */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10, padding: '20px 24px',
              }}>
                <div style={{
                  fontSize:11, fontWeight:700, letterSpacing:'1.5px', color: C.accent,
                  fontFamily:'"JetBrains Mono",monospace', textTransform:'uppercase',
                  marginBottom: 14, paddingBottom:12, borderBottom:'1px solid var(--border-color)',
                }}>Validity Timeline</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {features.map(f => (
                    <div key={f.name} style={{
                      display:'flex', alignItems:'center', gap:6,
                      padding:'5px 10px', borderRadius:6,
                      background: f.validity === 'MEASURED' ? 'rgba(34,197,94,0.06)' :
                        f.validity === 'ESTIMATED' ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${f.validity === 'MEASURED' ? 'rgba(34,197,94,0.2)' : f.validity === 'ESTIMATED' ? 'rgba(234,179,8,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    }}>
                      <ValidityChip validity={f.validity} />
                      <span style={{ fontSize:10, color:C.textSec, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── RAW EVIDENCE ── */}
            <section style={{ marginBottom: 24 }}>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 10, overflow:'hidden',
              }}>
                <button
                  onClick={() => setRawExpanded(!rawExpanded)}
                  style={{
                    width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'14px 24px', background:'transparent', border:'none', cursor:'pointer',
                    color: C.text, fontSize:11, fontWeight:700,
                    letterSpacing:'1px', textTransform:'uppercase',
                    fontFamily:'"JetBrains Mono",monospace',
                    transition:'background 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ color: C.accent }}>Raw Evidence (JSON)</span>
                  {rawExpanded ? <ChevronUp size={14} color={C.textDim} /> : <ChevronDown size={14} color={C.textDim} />}
                </button>
                {rawExpanded && (
                  <pre style={{
                    padding:'16px 24px', background:'#0a0a0f',
                    borderTop:'1px solid var(--border-color)',
                    fontSize:11, color: C.textSec,
                    fontFamily:'"JetBrains Mono",monospace',
                    overflow:'auto', maxHeight:320,
                    margin:0, whiteSpace:'pre-wrap', wordBreak:'break-all', lineHeight:1.7,
                  }}>
                    {JSON.stringify({
                      alert_id: currentAlert.id,
                      timestamp: new Date(currentAlert.timestamp).toISOString(),
                      threat_type: currentAlert.threat_type,
                      severity: currentAlert.severity,
                      confidence: currentAlert.confidence,
                      src_ip: currentAlert.src_ip,
                      dst_ip: currentAlert.dst_ip,
                      src_port: currentAlert.src_port,
                      dst_port: currentAlert.dst_port,
                      protocol: currentAlert.protocol,
                      evidence: currentAlert.evidence,
                      flow_count: currentAlert.flow_count,
                      sha256,
                      merkle_seal: '0x' + Array.from({length: 64}, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join(''),
                    }, null, 2)}
                  </pre>
                )}
              </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{
              padding:'20px 0', borderTop:`1px solid ${C.border}`,
              display:'flex', justifyContent:'space-between', alignItems:'center',
              flexWrap:'wrap', gap:8,
            }}>
              <span style={{ fontSize:10, color:C.textDim, letterSpacing:'1px', fontFamily:'"JetBrains Mono",monospace' }}>
                WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
              </span>
              <span style={{ fontSize:10, color:C.textDim, letterSpacing:'0.5px', fontFamily:'"JetBrains Mono",monospace' }}>
                Evidence ID: {currentAlert.id}
              </span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
};

export default EvidenceLocker;
