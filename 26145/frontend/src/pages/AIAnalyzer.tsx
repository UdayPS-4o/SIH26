import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}

interface AnalysisRecord {
  id: string;
  timestamp: number;
  inputType: string;
  threatType: string;
  result: string;
  confidence: number;
  severity: string;
}

interface AnalysisResult {
  reportId: string;
  timestamp: string;
  threatType: string;
  severity: string;
  confidence: number;
  affectedIPs: string[];
  recommendations: string[];
  details: {
    packetsAnalyzed: string;
    flowsProcessed: string;
    analysisDuration: string;
    dataVolume: string;
    portsScanned: string;
    geoSource: string;
    attackVector: string;
    modelVersion: string;
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SCAN_STEPS = [
  { label: 'Packet Inspection', duration: 800 },
  { label: 'Feature Extraction', duration: 900 },
  { label: 'ML Inference', duration: 1200 },
  { label: 'Pattern Matching', duration: 700 },
  { label: 'Threat Classification', duration: 800 },
  { label: 'Report Generation', duration: 500 },
];

const THREAT_TYPES = [
  'SQL Injection', 'DDoS Attack', 'Brute Force', 'Port Scanning',
  'Malware Beacon', 'Data Exfiltration', 'Command Injection',
  'Cross-Site Scripting', 'DNS Tunneling', 'Ransomware Communication',
];

const SEVERITY_LIST: Array<'critical' | 'high' | 'medium' | 'low'> = ['critical', 'high', 'medium', 'low'];

const RESULT_LABELS = ['Blocked', 'Mitigated', 'Quarantined', 'Investigating'];
const ATTACK_VECTORS = [
  'Network Scanning → Brute Force', 'Reconnaissance → Initial Access',
  'Initial Access → Execution', 'Exfiltration via DNS Tunnel', 'C2 Beaconing Pattern',
];
const GEO_SOURCES = ['Russia', 'China', 'North Korea', 'Iran', 'Romania', 'Brazil', 'Unknown'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number, dec = 1) => (Math.random() * (max - min) + min).toFixed(dec);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const genIP = () => `${rand(1,223)}.${rand(0,255)}.${rand(0,255)}.${rand(1,254)}`;

const severityConfig = (s: string) => {
  const m: Record<string, { color: string; bg: string; border: string; label: string }> = {
    critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', label: 'CRITICAL' },
    high:     { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.25)', label: 'HIGH' },
    medium:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)', label: 'MEDIUM' },
    low:      { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)', border: 'rgba(6,182,212,0.25)', label: 'LOW' },
  };
  return m[s] || m.low;
};

const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' });

const C = {
  bg: '#060a10', card: '#0a1118', border: '#1a2736', borderAct: '#1e3a5f',
  txt: '#e0e8f0', txt2: '#64748b', cyan: '#00d4ff', green: '#00ff41',
  red: '#ef4444', orange: '#f97316', yellow: '#eab308', purple: '#a855f7',
};

const sectionHeader = (label: string) => (
  <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'16px', marginTop:'8px' }}>
    <span style={{ color: C.cyan, fontSize:'10px', letterSpacing:'2px', fontFamily:"'JetBrains Mono',monospace" }}>◈</span>
    <span style={{
      color: C.cyan, fontSize:'11px', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase',
      fontFamily:"'JetBrains Mono',monospace",
    }}>{label}</span>
    <div style={{ flex:1, height:'1px', background:`linear-gradient(90deg, ${C.borderAct}, transparent)` }} />
  </div>
);

// ─── Mock Data ────────────────────────────────────────────────────────────────

const buildAnalysisResult = (): AnalysisResult => {
  const threatType = pick(THREAT_TYPES);
  const severity = pick(SEVERITY_LIST);
  const confidence = rand(78, 99);
  const affectedIPs = Array.from({ length: rand(2,5) }, genIP);
  const reportId = `RPT-${Date.now().toString(36).toUpperCase().slice(-8)}`;
  const recs: Record<string, string[]> = {
    critical: [
      'ISOLATE affected systems immediately at network perimeter',
      'Deploy emergency firewall rules for all flagged source IPs',
      'Initiate incident response protocol IRP-001',
      'Preserve forensic images of affected endpoints',
      'Notify SOC leadership and escalate to Tier-2 analysis',
    ],
    high: [
      'Block source IPs at edge firewall within 15 minutes',
      'Enable enhanced logging on affected system segments',
      'Schedule forensic review within 4 hours',
      'Monitor for lateral movement indicators',
    ],
    medium: [
      'Add flagged IPs to SIEM watchlist for 72-hour monitoring',
      'Review authentication logs for brute-force indicators',
      'Schedule routine patch cycle review',
    ],
    low: [
      'Log event for trend analysis',
      'Include in next weekly security report',
    ],
  };

  return {
    reportId,
    timestamp: new Date().toISOString(),
    threatType,
    severity,
    confidence,
    affectedIPs,
    recommendations: recs[severity] || recs.low,
    details: {
      packetsAnalyzed: rand(5000,50000).toLocaleString(),
      flowsProcessed: rand(50,2000).toLocaleString(),
      analysisDuration: `${randFloat(0.3,12.0)}s`,
      dataVolume: `${randFloat(1.2,48.5)} MB`,
      portsScanned: [22,23,80,443,445,3389,8080,8443].sort(()=>Math.random()-0.5).slice(0,rand(2,5)).join(', '),
      geoSource: pick(GEO_SOURCES),
      attackVector: pick(ATTACK_VECTORS),
      modelVersion: 'Ekadhara v3.2.1',
    },
  };
};

const buildInitialRecords = (): AnalysisRecord[] => {
  const recs: AnalysisRecord[] = [];
  for (let i = 0; i < 6; i++) {
    recs.push({
      id: `init-${i}`,
      timestamp: Date.now() - rand(60000,3600000) * (i+1),
      inputType: pick(['Deep Analysis','IP Reputation','Threat Prediction','Alert Summary']),
      threatType: pick(THREAT_TYPES),
      result: pick(RESULT_LABELS),
      confidence: rand(72,98),
      severity: pick(SEVERITY_LIST),
    });
  }
  return recs;
};

// ─── Animations (injected into DOM once) ─────────────────────────────────────

let animsInjected = false;
const injectAnims = () => {
  if (animsInjected || typeof document === 'undefined') return;
  animsInjected = true;
  const s = document.createElement('style');
  s.textContent = `
    @keyframes scan-sweep { 0%{left:-30%} 100%{left:110%} }
    @keyframes pulse-glow { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes fade-in-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    .af0 { animation: fade-in-up .5s ease-out both }
    .af1 { animation: fade-in-up .5s ease-out .08s both }
    .af2 { animation: fade-in-up .5s ease-out .16s both }
    .af3 { animation: fade-in-up .5s ease-out .24s both }
    .af4 { animation: fade-in-up .5s ease-out .32s both }
    .af5 { animation: fade-in-up .5s ease-out .4s both }
  `;
  document.head.appendChild(s);
};

// ─── Icons ────────────────────────────────────────────────────────────────────

const Icon = ({ type, size = 22 }: { type: string; size?: number }) => {
  const c = C.cyan;
  const s = size;
  const icons: Record<string, React.ReactNode> = {
    analysis: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 11-6.219-8.56" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    threat: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
    accuracy: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
    time: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  };
  return <>{icons[type] || null}</>;
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; trend?: { value: number; up: boolean }; delay: string;
}> = ({ label, value, sub, icon, trend, delay }) => (
  <div className={`af${delay}`} style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius:'8px', padding:'20px',
    position:'relative', overflow:'hidden', transition:'border-color .2s, box-shadow .2s',
  }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderAct; e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.06), inset 0 1px 0 rgba(0,212,255,0.06)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
  >
    <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg, transparent, ${C.cyan}33, transparent)` }} />
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'14px' }}>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:600, color:C.txt2, letterSpacing:'1.5px', textTransform:'uppercase' }}>{label}</span>
      <div style={{ width:'32px', height:'32px', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(0,212,255,0.06)', border:'1px solid rgba(0,212,255,0.15)', color:C.cyan }}>
        {icon}
      </div>
    </div>
    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'30px', fontWeight:700, color:C.cyan, textShadow:'0 0 16px rgba(0,212,255,0.3)', lineHeight:1.1 }}>{value}</div>
    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'8px' }}>
      {sub && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:C.txt2 }}>{sub}</span>}
      {trend && <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:600, color: trend.up ? C.green : C.red }}>{trend.up ? '▲' : '▼'} {trend.value}%</span>}
    </div>
  </div>
);

const ConfidenceMeter: React.FC<{ value: number; severity: string }> = ({ value, severity }) => {
  const cfg = severityConfig(severity);
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
      <div style={{ position:'relative', width:'110px', height:'110px', flexShrink:0 }}>
        <svg width="110" height="110" viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke={C.border} strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={cfg.color} strokeWidth="8"
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition:'stroke-dashoffset 1.5s ease-out', filter:`drop-shadow(0 0 4px ${cfg.color}66)` }} />
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'26px', fontWeight:700, color:cfg.color, textShadow:`0 0 12px ${cfg.color}55`, lineHeight:1 }}>{value}%</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'8px', color:C.txt2, letterSpacing:'1px', textTransform:'uppercase', marginTop:'2px' }}>confidence</span>
        </div>
      </div>
      <div style={{ flex:1 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:C.txt2, marginBottom:'10px', letterSpacing:'0.5px' }}>CONFIDENCE BREAKDOWN</div>
        {[
          { label:'ML Model', pct: rand(70,95) },
          { label:'Pattern Match', pct: rand(60,90) },
          { label:'Signature DB', pct: rand(65,92) },
        ].map(item => (
          <div key={item.label} style={{ marginBottom:'8px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.txt2 }}>{item.label}</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.cyan }}>{item.pct}%</span>
            </div>
            <div style={{ width:'100%', height:'3px', background:'rgba(0,212,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ width:`${item.pct}%`, height:'100%', borderRadius:'2px', background:C.cyan, boxShadow:'0 0 8px rgba(0,212,255,0.4)', transition:'width 1s ease-out' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ScanningAnimation: React.FC<{ active: boolean; currentStep: number }> = ({ active, currentStep }) => {
  if (!active) return null;
  return (
    <div className="af3" style={{
      background: C.card, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'24px',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, bottom:0, width:'30%', background:'linear-gradient(90deg,transparent,rgba(0,212,255,0.03),rgba(0,212,255,0.06),rgba(0,212,255,0.03),transparent)', animation:'scan-sweep 2.5s ease-in-out infinite', pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, bottom:0, left:'30%', width:'2px', background:`linear-gradient(180deg,transparent,${C.cyan}44,${C.cyan}88,${C.cyan}44,transparent)`, boxShadow:`0 0 12px ${C.cyan}66,0 0 30px ${C.cyan}22`, animation:'scan-sweep 2.5s ease-in-out infinite', pointerEvents:'none' }} />

      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'20px', position:'relative', zIndex:1 }}>
        <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.cyan, boxShadow:`0 0 8px ${C.cyan}`, animation:'pulse-glow 1s ease-in-out infinite' }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight:700, color:C.cyan, letterSpacing:'2px', textTransform:'uppercase' }}>
          Deep Analysis In Progress
        </span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:0, position:'relative', zIndex:1 }}>
        {SCAN_STEPS.map((step, idx) => {
          const done = idx < currentStep;
          const cur = idx === currentStep;
          return (
            <div key={step.label} style={{
              display:'flex', alignItems:'center', gap:'14px', padding:'10px 12px',
              background: cur ? 'rgba(0,212,255,0.03)' : 'transparent',
              borderLeft: cur ? `2px solid ${C.cyan}` : '2px solid transparent', transition:'all .3s',
            }}>
              <div style={{
                width:'22px', height:'22px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                border: `1px solid ${done ? C.green : cur ? C.cyan : C.border}`,
                background: done ? 'rgba(0,255,65,0.1)' : cur ? 'rgba(0,212,255,0.1)' : 'transparent',
                flexShrink:0,
                boxShadow: done ? '0 0 8px rgba(0,255,65,0.2)' : cur ? '0 0 8px rgba(0,212,255,0.2)' : 'none',
              }}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                ) : cur ? (
                  <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:C.cyan, boxShadow:`0 0 6px ${C.cyan}`, animation:'pulse-glow .8s ease-in-out infinite' }} />
                ) : (
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:C.border }} />
                )}
              </div>
              <div style={{ flex:1 }}>
                <span style={{
                  fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', fontWeight: cur ? 600 : 400,
                  color: done ? C.green : cur ? C.cyan : C.txt2, transition:'color .3s',
                }}>{step.label}</span>
              </div>
              <span style={{
                fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', letterSpacing:'0.5px',
                color: done ? C.green : cur ? C.cyan : 'transparent',
              }}>{done ? 'DONE' : cur ? 'PROCESSING' : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ResultsPanel: React.FC<{ result: AnalysisResult }> = ({ result }) => {
  const cfg = severityConfig(result.severity);
  return (
    <div className="af3">
      {sectionHeader('Analysis Results')}
      <div style={{ background:C.card, border:`1px solid ${cfg.border}`, borderRadius:'8px', overflow:'hidden' }}>
        {/* Header row */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}`, background:cfg.bg, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px', flexWrap:'wrap' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'6px', padding:'4px 12px', borderRadius:'4px',
              background:cfg.bg, border:`1px solid ${cfg.border}`,
              fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:700, color:cfg.color,
              letterSpacing:'1px', textTransform:'uppercase',
            }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:cfg.color, boxShadow:`0 0 6px ${cfg.color}`, animation:'pulse-glow 1.5s ease-in-out infinite' }} />
              {cfg.label}
            </div>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:700, color:C.txt }}>{result.threatType}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.txt2, marginTop:'2px' }}>{result.reportId}</div>
            </div>
          </div>
          <ConfidenceMeter value={result.confidence} severity={result.severity} />
        </div>

        {/* Metadata grid */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'16px' }}>
            {[
              { label:'Affected IPs', value:result.affectedIPs.join('  ·  '), mono:true },
              { label:'Geographic Origin', value:result.details.geoSource, mono:false },
              { label:'Attack Vector', value:result.details.attackVector, mono:false },
              { label:'Packets Analyzed', value:result.details.packetsAnalyzed, mono:true },
              { label:'Flows Processed', value:result.details.flowsProcessed, mono:true },
              { label:'Data Volume', value:result.details.dataVolume, mono:true },
              { label:'Analysis Duration', value:result.details.analysisDuration, mono:true },
              { label:'Ports Scanned', value:result.details.portsScanned, mono:true },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:600, color:C.txt2, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'4px' }}>{item.label}</div>
                <div style={{
                  fontFamily: item.mono ? "'JetBrains Mono',monospace" : "'Inter',sans-serif",
                  fontSize:'13px', color:C.txt, fontWeight: item.mono ? 500 : 400, wordBreak:'break-all',
                }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ padding:'20px 24px', borderBottom:`1px solid ${C.border}` }}>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:600, color:C.txt2, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:'12px' }}>
            Recommended Actions
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {result.recommendations.map((rec, idx) => (
              <div key={idx} style={{ display:'flex', alignItems:'flex-start', gap:'10px', padding:'8px 12px', background:'rgba(0,212,255,0.02)', border:'1px solid rgba(0,212,255,0.06)', borderRadius:'4px' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', fontWeight:700, color:C.cyan, flexShrink:0, marginTop:'1px' }}>{String(idx+1).padStart(2,'0')}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:C.txt, lineHeight:1.5 }}>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 24px', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(0,212,255,0.01)', borderTop:`1px solid ${C.border}` }}>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.txt2 }}>Model: {result.details.modelVersion}</span>
          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.txt2 }}>{new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const ModelPerformanceSection: React.FC = () => {
  const [metrics] = useState({ precision:0.94, recall:0.91, f1:0.925, accuracy:0.96 });
  const rows = [
    { label:'PRECISION', value:metrics.precision, color:C.cyan },
    { label:'RECALL', value:metrics.recall, color:C.green },
    { label:'F1 SCORE', value:metrics.f1, color:C.yellow },
    { label:'ACCURACY', value:metrics.accuracy, color:C.purple },
  ];
  return (
    <div className="af4">
      {sectionHeader('Threat Classification Model')}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px' }}>
          {rows.map(m => (
            <div key={m.label}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:'8px' }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:600, color:C.txt2, letterSpacing:'1.5px', textTransform:'uppercase' }}>{m.label}</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'18px', fontWeight:700, color:m.color, textShadow:`0 0 8px ${m.color}44` }}>{(m.value*100).toFixed(1)}%</span>
              </div>
              <div style={{ width:'100%', height:'6px', background:'rgba(0,212,255,0.06)', borderRadius:'3px', overflow:'hidden', border:'1px solid rgba(0,212,255,0.04)' }}>
                <div style={{ width:`${m.value*100}%`, height:'100%', borderRadius:'3px', background:m.color, boxShadow:`0 0 10px ${m.color}55, 0 0 20px ${m.color}22`, transition:'width 1.5s ease-out' }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:'20px', padding:'12px 16px', background:'rgba(0,212,255,0.02)', border:'1px solid rgba(0,212,255,0.06)', borderRadius:'4px', display:'flex', gap:'24px', flexWrap:'wrap' }}>
          {[
            { l:'ARCHITECTURE', v:'Transformer-XL' },
            { l:'TRAINING DATA', v:'2.4M samples' },
            { l:'CLASSES', v:'28 threat types' },
            { l:'LAST RETRAINED', v:'2026-09-14' },
          ].map(item => (
            <div key={item.l}>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:C.txt2, letterSpacing:'1px', textTransform:'uppercase' }}>{item.l}: </span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.cyan }}>{item.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RecentAnalysesTable: React.FC<{ records: AnalysisRecord[] }> = ({ records }) => {
  if (records.length === 0) {
    return (
      <div className="af5">
        {sectionHeader('Recent Analyses')}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'48px 24px', textAlign:'center' }}>
          <div style={{ color:C.txt2, fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>No analyses recorded yet. Run your first deep analysis above.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="af5">
      {sectionHeader('Recent Analyses')}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px' }}>
            <thead>
              <tr>
                {['Timestamp','Analysis Type','Threat','Result','Confidence','Severity'].map(h => (
                  <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:'9px', fontWeight:600, color:C.txt2, textTransform:'uppercase', letterSpacing:'1.5px', borderBottom:`1px solid ${C.border}`, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                const sc = severityConfig(rec.severity);
                return (
                  <tr key={rec.id} style={{ borderBottom:`1px solid rgba(26,39,54,0.5)`, transition:'background .15s', cursor:'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0,212,255,0.03)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding:'11px 16px', color:C.txt2, fontSize:'11px', whiteSpace:'nowrap' }}>{fmtTime(rec.timestamp)}</td>
                    <td style={{ padding:'11px 16px', color:C.txt }}>{rec.inputType}</td>
                    <td style={{ padding:'11px 16px', color:C.cyan, fontSize:'11px' }}>{rec.threatType}</td>
                    <td style={{ padding:'11px 16px' }}><span style={{ fontSize:'11px', color:C.txt }}>{rec.result}</span></td>
                    <td style={{ padding:'11px 16px', color:C.txt, fontSize:'13px', fontWeight:600 }}>{rec.confidence}%</td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:'5px', padding:'3px 10px', borderRadius:'3px',
                        fontSize:'10px', fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`,
                        letterSpacing:'1px', textTransform:'uppercase',
                      }}>
                        <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:sc.color, boxShadow:`0 0 4px ${sc.color}` }} />
                        {rec.severity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Chat Content Renderer ───────────────────────────────────────────────────

const ChatContent: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  const els: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t === '') return;
    if (/^#{1,3}\s/.test(t)) {
      const lvl = t.match(/^#{1,3}/)![0].length;
      const title = t.replace(/^#{1,3}\s+/, '');
      const sz = lvl===1?'14px':lvl===2?'12px':'11px';
      els.push(<div key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:sz, fontWeight:700, color:C.cyan, marginTop:lvl===1?'12px':'8px', marginBottom:'4px', letterSpacing:'0.5px' }}>{title}</div>);
      return;
    }
    if (t === '---') { els.push(<div key={i} style={{ height:'1px', background:C.border, margin:'10px 0' }} />); return; }
    if (t.startsWith('- ')) {
      const content = t.replace(/^- /, '');
      els.push(<div key={i} style={{ display:'flex', gap:'8px', marginTop:'3px' }}>
        <span style={{ color:C.cyan, flexShrink:0 }}>›</span>
        <span style={{ fontSize:'12px', color:C.txt, lineHeight:1.5 }}>{fmtInline(content)}</span>
      </div>);
      return;
    }
    if (/^\d+\.\s/.test(t)) {
      const m = t.match(/^(\d+)\.\s(.+)/);
      if (m) els.push(<div key={i} style={{ display:'flex', gap:'8px', marginTop:'3px' }}>
        <span style={{ color:C.txt2, flexShrink:0, minWidth:'16px' }}>{m[1]}.</span>
        <span style={{ fontSize:'12px', color:C.txt, lineHeight:1.5 }}>{fmtInline(m[2])}</span>
      </div>);
      return;
    }
    els.push(<div key={i} style={{ fontSize:'12px', color:C.txt, lineHeight:1.6, marginTop:'2px' }}>{fmtInline(t)}</div>);
  });
  return <>{els}</>;
};

const fmtInline = (text: string): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  text.split(/(\*\*[^*]+\*\*)/g).forEach((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      parts.push(<strong key={idx} style={{ color:C.txt, fontWeight:600 }}>{seg.slice(2,-2)}</strong>);
    } else if (seg.startsWith('[') && seg.includes(']')) {
      const m = seg.match(/^\[([^\]]+)\]/);
      if (m) { parts.push(<span key={idx} style={{ color:C.cyan, fontWeight:600 }}>{m[1]}</span>); parts.push(seg.slice(m[0].length)); }
      else parts.push(seg);
    } else parts.push(seg);
  });
  return parts;
};

// ─── Main Component ──────────────────────────────────────────────────────────

const AIAnalyzer: React.FC = () => {
  const [analysisRuns, setAnalysisRuns] = useState(142);
  const [threatPatterns, setThreatPatterns] = useState(37);
  const [modelAccuracy] = useState(96.2);
  const [avgTime, setAvgTime] = useState(2.4);
  const [isRunning, setIsRunning] = useState(false);
  const [scanStep, setScanStep] = useState(-1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scanTimerRef = useRef<number | null>(null);

  useEffect(() => {
    injectAnims();
    setRecentAnalyses(buildInitialRecords());
  }, []);

  // Welcome message
  useEffect(() => {
    if (chatMessages.length === 0) {
      const t = setTimeout(() => {
        setChatMessages([{
          id:'welcome', role:'ai', timestamp:Date.now(),
          content: `## WATCHTOWER AI — Threat Analysis Engine Online\n\nAll systems nominal. The deep analysis engine is ready.\n\n**Available capabilities:**\n\n[S] Deep packet inspection across all monitored segments\n[chart] ML-based threat classification (28 categories)\n[crystal] Predictive threat modeling and trajectory analysis\n[shield] IP reputation and geolocation intelligence\n\n**Current network posture:**\n- Monitoring 12,847 active flows\n- 37 active threat patterns detected\n- Model accuracy: 96.2%\n\nUse the dashboard controls above or ask a question to begin.`,
        }]);
      }, 800);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:'smooth' }); }, [chatMessages]);

  // ─── Run Deep Analysis ─────────────────────────────────────────────────────

  const runDeepAnalysis = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setScanStep(0);
    setResult(null);

    let stepIdx = 0;
    const advance = () => {
      if (stepIdx >= SCAN_STEPS.length) {
        const r = buildAnalysisResult();
        setResult(r);
        const rec: AnalysisRecord = {
          id:`run-${Date.now()}`, timestamp:Date.now(),
          inputType:'Deep Analysis', threatType:r.threatType,
          result:pick(RESULT_LABELS), confidence:r.confidence, severity:r.severity,
        };
        setRecentAnalyses(prev => [rec, ...prev.slice(0,9)]);
        setAnalysisRuns(prev => prev + 1);
        setThreatPatterns(prev => prev + rand(0,2));
        setAvgTime(prev => parseFloat(randFloat(1.8,3.5)));
        setChatMessages(prev => [...prev, {
          id:`chat-${Date.now()}`, role:'ai', timestamp:Date.now(),
          content: `## Deep Analysis Complete\n\n**Threat detected:** ${r.threatType}\n**Severity:** ${r.severity.toUpperCase()}\n**Confidence:** ${r.confidence}%\n\nAll analysis modules executed successfully. See results panel below for full breakdown.`,
        }]);
        setIsRunning(false);
        return;
      }
      setScanStep(stepIdx);
      stepIdx++;
      scanTimerRef.current = window.setTimeout(advance, SCAN_STEPS[stepIdx-1].duration);
    };
    advance();
    return () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); };
  }, [isRunning]);

  useEffect(() => () => { if (scanTimerRef.current) clearTimeout(scanTimerRef.current); }, []);

  // ─── Chat ──────────────────────────────────────────────────────────────────

  const sendChat = useCallback((prompt: string) => {
    if (!prompt.trim() || isRunning) return;
    setChatMessages(prev => [...prev, { id:`u-${Date.now()}`, role:'user', content:prompt, timestamp:Date.now() }]);
    setChatInput('');
    setTimeout(() => {
      const lower = prompt.toLowerCase();
      let resp = '';
      if (lower.includes('sql') || lower.includes('injection')) {
        resp = '## SQL Injection Analysis\n\n[!] **CRITICAL** — SQL injection vectors detected in 3 input fields.\n\n**Findings:**\n- Unsanitized user input in login form (username field)\n- Blind SQL injection possible via order-by parameter\n- UNION-based injection confirmed in search endpoint\n\n**Immediate actions:**\n1. Deploy parameterized queries\n2. Enable WAF rules for SQL patterns\n3. Audit all database connections';
      } else if (lower.includes('ddos') || lower.includes('flood')) {
        resp = '## DDoS Assessment\n\n[+] **HIGH** — Distributed denial-of-service pattern detected.\n\n**Traffic analysis:**\n- 15,000+ req/s from 200+ source IPs\n- SYN flood + HTTP GET flood combined attack\n- Target: load balancer frontend\n\n**Mitigation:** Enable rate limiting, activate scrubbing center, notify ISP upstream.';
      } else {
        resp = '## Threat Analysis Received\n\nProcessing your query through the analysis pipeline...\n\n[i] **Analysis queued.** The deep analysis engine has logged your request. Use the "RUN DEEP ANALYSIS" control above for immediate automated scanning.\n\n**Quick commands:**\n- "Analyze SQL injection" — injection detection\n- "Check DDoS patterns" — volumetric attack analysis\n- "Scan for malware" — endpoint threat detection';
      }
      setChatMessages(prev => [...prev, { id:`ai-${Date.now()}`, role:'ai', content:resp, timestamp:Date.now() }]);
    }, 1200 + Math.random()*800);
  }, [isRunning]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.txt, fontFamily:"'Inter',sans-serif" }}>
      {/* HUD Bar */}
      <div style={{
        height:'52px', background:'linear-gradient(180deg,#0a0f18,#060a10)',
        borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center',
        padding:'0 24px', gap:'16px', position:'sticky', top:0, zIndex:50,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          <div style={{
            width:'24px', height:'24px', border:`1px solid ${C.cyan}`, borderRadius:'4px',
            display:'flex', alignItems:'center', justifyContent:'center', color:C.cyan,
            fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:700,
            boxShadow:'0 0 8px rgba(0,212,255,0.2)',
          }}>AI</div>
          <span style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', fontWeight:700,
            color:C.cyan, letterSpacing:'2px', textShadow:'0 0 8px rgba(0,212,255,0.3)',
          }}>AI ANALYZER</span>
        </div>
        <div style={{ width:'1px', height:'22px', background:C.border }} />
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:"'JetBrains Mono',monospace", fontSize:'10px', color:C.green, letterSpacing:'1px', textTransform:'uppercase' }}>
          <div style={{ width:'7px', height:'7px', borderRadius:'50%', background:C.green, boxShadow:'0 0 6px rgba(0,255,65,0.5)', animation:'pulse-glow 1.5s ease-in-out infinite' }} />
          ONLINE
        </div>
        <div style={{ flex:1 }} />
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:C.cyan, textShadow:'0 0 6px rgba(0,212,255,0.2)', letterSpacing:'1px' }}>
          {new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding:'24px', maxWidth:'1440px', margin:'0 auto' }}>

        {/* Page Title */}
        <div className="af0" style={{ marginBottom:'24px' }}>
          <h1 style={{
            fontFamily:"'JetBrains Mono',monospace", fontSize:'20px', fontWeight:700,
            color:C.cyan, letterSpacing:'2px', textTransform:'uppercase',
            textShadow:'0 0 10px rgba(0,212,255,0.25)', marginBottom:'4px',
          }}>AI Threat Analyzer</h1>
          <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:C.txt2, letterSpacing:'0.5px' }}>
            Ekadhara Detection Engine v3.2.1 — Deep Learning Classification Pipeline
          </p>
        </div>

        {/* Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'16px', marginBottom:'24px' }}>
          <StatCard delay="0" label="Analysis Runs Today" value={analysisRuns} sub="+12% from yesterday" trend={{value:12,up:true}} icon={<Icon type="analysis" />} />
          <StatCard delay="1" label="Threat Patterns Found" value={threatPatterns} sub="Active signatures" trend={{value:8,up:true}} icon={<Icon type="threat" />} />
          <StatCard delay="2" label="Model Accuracy" value={`${modelAccuracy}%`} sub="Last 7-day average" trend={{value:2.1,up:true}} icon={<Icon type="accuracy" />} />
          <StatCard delay="3" label="Avg Analysis Time" value={`${avgTime}s`} sub="Per deep scan" trend={{value:15,up:false}} icon={<Icon type="time" />} />
        </div>

        {/* Quick Analysis */}
        <div className="af3" style={{ marginBottom:'24px' }}>
          {sectionHeader('Quick Analysis')}
          <div style={{
            background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', padding:'24px',
            display:'flex', alignItems:'center', justifyContent:'space-between', gap:'20px', flexWrap:'wrap',
          }}>
            <div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'14px', fontWeight:600, color:C.txt, marginBottom:'6px' }}>
                Deep Threat Analysis Pipeline
              </div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', color:C.txt2, maxWidth:'520px', lineHeight:1.5 }}>
                Executes a full 6-stage analysis: packet inspection, feature extraction, ML inference, pattern matching, threat classification, and report generation.
              </div>
            </div>
            <button
              onClick={runDeepAnalysis} disabled={isRunning}
              style={{
                display:'inline-flex', alignItems:'center', gap:'8px', padding:'12px 28px',
                borderRadius:'6px', fontFamily:"'JetBrains Mono',monospace", fontSize:'13px', fontWeight:700,
                letterSpacing:'1px', textTransform:'uppercase', cursor: isRunning ? 'not-allowed' : 'pointer',
                background: isRunning ? 'rgba(0,212,255,0.05)' : 'rgba(0,212,255,0.1)',
                color:C.cyan, border:`1px solid ${isRunning ? 'rgba(0,212,255,0.15)' : C.borderAct}`,
                boxShadow: isRunning ? 'none' : '0 0 20px rgba(0,212,255,0.1), 0 0 40px rgba(0,212,255,0.05)',
                transition:'all .2s', opacity: isRunning ? 0.6 : 1, whiteSpace:'nowrap',
              }}
              onMouseEnter={(e) => { if (!isRunning) { e.currentTarget.style.background='rgba(0,212,255,0.18)'; e.currentTarget.style.boxShadow='0 0 24px rgba(0,212,255,0.18),0 0 48px rgba(0,212,255,0.08)'; } }}
              onMouseLeave={(e) => { if (!isRunning) { e.currentTarget.style.background='rgba(0,212,255,0.1)'; e.currentTarget.style.boxShadow='0 0 20px rgba(0,212,255,0.1),0 0 40px rgba(0,212,255,0.05)'; } }}
            >
              {isRunning ? (
                <>
                  <div style={{ width:'14px', height:'14px', border:'2px solid rgba(0,212,255,0.2)', borderTopColor:C.cyan, borderRadius:'50%', animation:'spin-slow .8s linear infinite' }} />
                  Analyzing...
                </>
              ) : (
                <>{/* play icon */}<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>Run Deep Analysis</>
              )}
            </button>
          </div>
        </div>

        {/* Scanning Animation */}
        <ScanningAnimation active={isRunning} currentStep={scanStep} />

        {/* Results */}
        {result && <ResultsPanel result={result} />}

        {/* Model Performance */}
        <div style={{ marginTop:'24px' }}>
          <ModelPerformanceSection />
        </div>

        {/* Recent Analyses */}
        <div style={{ marginTop:'24px', marginBottom:'32px' }}>
          <RecentAnalysesTable records={recentAnalyses} />
        </div>

        {/* Chat Console */}
        <div className="af5" style={{ marginBottom:'32px' }}>
          {sectionHeader('AI Chat Console')}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:'8px', overflow:'hidden' }}>
            {/* Messages */}
            <div style={{ maxHeight:'340px', overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
              {chatMessages.map(msg => (
                <div key={msg.id} style={{ display:'flex', justifyContent: msg.role==='user'?'flex-end':'flex-start', gap:'10px' }}>
                  {msg.role === 'ai' && (
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(0,212,255,0.08)', border:'1px solid rgba(0,212,255,0.2)', color:C.cyan,
                      fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:700, flexShrink:0,
                    }}>AI</div>
                  )}
                  <div style={{
                    maxWidth:'75%', padding:'12px 16px', borderRadius:'6px',
                    background: msg.role==='user' ? 'rgba(0,212,255,0.1)' : 'rgba(6,10,16,0.8)',
                    border: msg.role==='user' ? '1px solid rgba(0,212,255,0.25)' : `1px solid ${C.border}`,
                  }}>
                    <ChatContent text={msg.content} />
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', color:C.txt2, marginTop:'6px', opacity:0.6 }}>{fmtTime(msg.timestamp)}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div style={{
                      width:'28px', height:'28px', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center',
                      background:'rgba(100,116,139,0.08)', border:'1px solid rgba(100,116,139,0.2)', color:C.txt2,
                      fontFamily:"'JetBrains Mono',monospace", fontSize:'9px', fontWeight:700, flexShrink:0,
                    }}>OP</div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', gap:'10px', alignItems:'center', background:'rgba(6,10,16,0.6)' }}>
              <input
                type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
                placeholder="Ask about threats, request analysis, query intelligence..."
                disabled={isRunning}
                style={{
                  flex:1, background:'rgba(0,212,255,0.02)', border:`1px solid ${C.border}`, borderRadius:'4px',
                  padding:'10px 14px', fontFamily:"'JetBrains Mono',monospace", fontSize:'12px', color:C.txt,
                  outline:'none', opacity: isRunning ? 0.5 : 1,
                }}
              />
              <button onClick={() => sendChat(chatInput)} disabled={!chatInput.trim()||isRunning} style={{
                padding:'10px 16px', borderRadius:'4px', background:'rgba(0,212,255,0.1)',
                border:`1px solid ${C.borderAct}`, color:C.cyan,
                fontFamily:"'JetBrains Mono',monospace", fontSize:'11px', fontWeight:600, letterSpacing:'1px',
                cursor: chatInput.trim()&&!isRunning ? 'pointer' : 'not-allowed',
                opacity: chatInput.trim()&&!isRunning ? 1 : 0.4, textTransform:'uppercase',
              }}>Send</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAnalyzer;
