import { useState, useEffect, useMemo, useRef } from 'react';
import { Cpu, Crosshair, Activity, Zap } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════════════════════
   WATCHTOWER — AI Analyzer
   ML Pipeline performance dashboard. Exact theme match with Dashboard.tsx.
   ═══════════════════════════════════════════════════════════════════════════════════ */

const C = {
  bg:        'var(--bg-primary)',
  surface:   'var(--bg-secondary)',
  surfaceHi: 'var(--bg-card-hover)',
  border:    'var(--border-color)',
  borderHi:  'var(--border-active)',
  text:      'var(--text-primary)',
  textSec:   'var(--text-secondary)',
  textDim:   'var(--text-muted)',
  accent:    'var(--accent-cyan)',
  red:       'var(--accent-red)',
  orange:    'var(--accent-orange)',
  amber:     'var(--accent-yellow)',
  green:     'var(--accent-green)',
  purple:    'var(--accent-purple)',
  pink:      'var(--accent-pink)',
  teal:      'var(--accent-teal)',
};
const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const MONO = '"JetBrains Mono","Fira Code",monospace';

/* ── Helpers ──────────────────────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString('en-US');
const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-US', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' });
const now = () => new Date().toLocaleTimeString('en-US', { hour12:false });

/* ═══════════════════════════════════════════════════════════════════════════════════
   ATOMIC COMPONENTS (identical to Dashboard.tsx)
   ═══════════════════════════════════════════════════════════════════════════════════ */

const Dot: React.FC<{ color?: string; size?: number }> = ({ color = C.green, size = 6 }) => (
  <span style={{
    width:size, height:size, borderRadius:'50%', background:color,
    boxShadow:`0 0 ${size}px ${color}60`,
    animation:`wt-pulse 1.6s ease-in-out infinite`,
    display:'inline-block', flexShrink:0,
  }} />
);

const SH: React.FC<{ label:string; right?: React.ReactNode }> = ({ label, right }) => (
  <div style={{
    display:'flex', alignItems:'baseline', justifyContent:'space-between',
    paddingBottom:10, marginBottom:14, borderBottom:`1px solid ${C.border}`,
  }}>
    <span style={{
      fontFamily:MONO, fontSize:10, fontWeight:700,
      letterSpacing:'2.5px', color:C.accent, textTransform:'uppercase',
    }}>{label}</span>
    {right}
  </div>
);

const Panel: React.FC<{ delay?:number; style?:React.CSSProperties; children:React.ReactNode }> = ({ delay=0, style, children }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      background:C.surface, border:`1px solid ${C.border}`, borderRadius:8,
      position:'relative', overflow:'hidden',
      opacity:ready?1:0, transform:ready?'translateY(0)':'translateY(12px)',
      transition:`opacity 0.5s ${EASE} ${delay}s, transform 0.5s ${EASE} ${delay}s`,
      ...style,
    }}>
      <div style={{ position:'absolute',top:0,left:0,right:0,height:1,
        background:`linear-gradient(90deg,transparent,${C.accent}30,transparent)` }} />
      <div style={{ padding:'20px 22px', position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
};

const Progress: React.FC<{ value:number; max?:number; color?:string }> = ({ value, max=100, color=C.accent }) => {
  const pct = Math.min((value/max)*100, 100);
  return (
    <div style={{ height:4, background:'var(--bg-secondary)', borderRadius:2, border:`1px solid ${C.border}`, overflow:'hidden' }}>
      <div style={{
        height:'100%', width:`${pct}%`, background:color, opacity:0.65,
        borderRadius:1, transition:'width 1s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
  );
};

const Sev: React.FC<{ sev:string }> = ({ sev }) => {
  const M: Record<string,{c:string;bg:string}> = {
    critical:{c:C.red,bg:'rgba(239,68,68,0.10)'},
    high:{c:C.orange,bg:'rgba(249,115,22,0.10)'},
    medium:{c:C.amber,bg:'rgba(234,179,8,0.10)'},
    low:{c:'var(--accent-cyan)',bg:'rgba(6,182,212,0.10)'},
  };
  const s = M[sev] || M.low;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
      letterSpacing:'1px', color:s.c, background:s.bg, border:`1px solid ${s.c}25`,
      fontFamily:MONO, textTransform:'uppercase',
    }}>
      <span style={{width:4,height:4,borderRadius:'50%',background:s.c}} />
      {sev}
    </span>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════════
   MOCK DATA — ML Pipeline
   ═══════════════════════════════════════════════════════════════════════════════════ */

interface ThreatModel {
  category: string;
  modelType: string;
  rationale: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
  status: 'active' | 'training' | 'deprecated';
  samples: number;
}

const THREAT_MODELS: ThreatModel[] = [
  { category:'DDoS Detection', modelType:'Random Forest (100 trees)',
    rationale:'High-dimensional feature space with non-linear interactions. RF handles class imbalance via balanced subsampling.',
    accuracy:96.8, precision:94.2, recall:97.1, f1:95.6, status:'active', samples:482000 },
  { category:'C2 Beaconing', modelType:'Isolation Forest + LSTM',
    rationale:'Beaconing exhibits temporal periodicity. LSTM captures timing patterns; Isolation Forest flags outliers in periodicity space.',
    accuracy:93.4, precision:91.8, recall:92.5, f1:92.1, status:'active', samples:128000 },
  { category:'DGA Domains', modelType:'Character-level CNN + RNN',
    rationale:'Domain names generated by DGAs have statistical signatures. Character CNN extracts n-gram features without lexicon lookup.',
    accuracy:95.1, precision:93.7, recall:94.3, f1:94.0, status:'active', samples:356000 },
  { category:'DNS Tunneling', modelType:'XGBoost + Statistical Features',
    rationale:'Tunneling creates entropy spikes in DNS queries. XGBoost ensemble on hand-crafted entropy + length + frequency features.',
    accuracy:91.2, precision:88.9, recall:93.4, f1:91.1, status:'active', samples:94000 },
  { category:'Port Scanning', modelType:'K-means Clustering + SVM',
    rationale:'Scanning produces distinctive fan-out patterns. Clustering identifies scan signatures; SVM classifies scan vs legitimate discovery.',
    accuracy:89.7, precision:86.3, recall:91.8, f1:89.0, status:'training', samples:210000 },
  { category:'Data Exfiltration', modelType:'Transformer Encoder',
    rationale:'Exfiltration shows asymmetric volume patterns. Transformer captures long-range dependencies in byte-volume sequences.',
    accuracy:94.5, precision:92.8, recall:93.9, f1:93.3, status:'active', samples:156000 },
  { category:'TLS Anomaly', modelType:'Isolation Forest (JA3)',
    rationale:'JA3 fingerprints are categorical. Isolation Forest detects anomalous fingerprint clusters without requiring labeled normal data.',
    accuracy:87.3, precision:85.1, recall:88.9, f1:87.0, status:'active', samples:640000 },
  { category:'Malware Detection', modelType:'Gradient Boosted Trees',
    rationale:'Multi-modal features (flow stats + timing + TLS). GBT handles mixed numeric/categorical features with SHAP explainability built in.',
    accuracy:95.8, precision:94.5, recall:96.2, f1:95.3, status:'active', samples:520000 },
];

const FEATURE_IMPORTANCE = [
  { name:'JA3 hash entropy',       importance:0.94 },
  { name:'Flow byte ratio',        importance:0.87 },
  { name:'Inter-arrival variance', importance:0.82 },
  { name:'DNS query length',       importance:0.78 },
  { name:'Port fan-out',           importance:0.74 },
  { name:'Packet size std dev',    importance:0.69 },
  { name:'TCP window ratio',       importance:0.63 },
  { name:'DNS TTL variance',       importance:0.58 },
  { name:'Flow duration',          importance:0.52 },
  { name:'Response byte ratio',    importance:0.47 },
];

const PIPELINE_STAGES = [
  { label:'INGEST',    sub:'PCAP / NetFlow / sFlow',     color:C.accent,  icon:Cpu,
    detail:'10K flows/sec · Zero-copy ring buffer · 12ms p99 latency' },
  { label:'FEATURES',  sub:'JA3 / DNS / Flow metadata',   color:C.purple,  icon:Crosshair,
    detail:'487 features per flow · Real-time enrichment · Feature store v2' },
  { label:'INFERENCE', sub:'Ensemble classifier',          color:C.green,   icon:Activity,
    detail:'8 models · Weighted ensemble · GPU-accelerated inference' },
  { label:'OUTPUT',    sub:'WebSocket + REST alerts',      color:C.amber,   icon:Zap,
    detail:'< 5ms alert dispatch · RFC 8071 JSON · Enclave-formatted' },
];

/* ═══════════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════════════ */

function PipelineStages() {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
      {PIPELINE_STAGES.map((stage, i) => (
        <div key={i} className="wt-interactive" style={{
          padding:'14px 16px', background:'rgba(255,255,255,0.008)',
          border:`1px solid ${C.border}`, borderRadius:5, cursor:'default',
          display:'flex', flexDirection:'column', gap:6,
          transition:`border-color 0.2s ${EASE}`,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = `${stage.color}40`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
        >
          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
            <Dot color={stage.color} size={4} />
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'1.2px', color:stage.color, fontFamily:MONO }}>{stage.label}</span>
          </div>
          <span style={{ fontSize:9, color:C.textSec, lineHeight:1.4 }}>{stage.sub}</span>
          <span style={{ fontSize:8, color:C.textDim, lineHeight:1.4, marginTop:2 }}>{stage.detail}</span>
        </div>
      ))}
    </div>
  );
}

function ThreatModelTable({ models }: { models: ThreatModel[] }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:`1px solid ${C.border}`, background:'rgba(0,212,255,0.015)' }}>
            {['Category','Model','Accuracy','Precision','Recall','F1','Samples','Status'].map(h => (
              <th key={h} style={{
                padding:'9px 14px', textAlign:'left', fontSize:9, fontWeight:700,
                letterSpacing:'1.2px', color:C.textSec, fontFamily:MONO,
                textTransform:'uppercase', whiteSpace:'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map((m) => {
            const sc = m.status==='active' ? C.green : m.status==='training' ? C.amber : C.red;
            const f1Color = m.f1 >= 93 ? C.green : m.f1 >= 89 ? C.amber : C.red;
            return (
              <tr key={m.category} style={{
                borderBottom:`1px solid ${C.border}`,
                background: m.status==='training' ? 'rgba(234,179,8,0.02)' : 'transparent',
                transition:`background 0.15s ${EASE}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${C.accent}04`; }}
                onMouseLeave={e => { e.currentTarget.style.background = m.status==='training' ? 'rgba(234,179,8,0.02)' : 'transparent'; }}
              >
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:11, fontWeight:600, color:C.text, letterSpacing:'0.3px', textTransform:'uppercase' }}>
                  {m.category}
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:10, color:C.textSec, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}
                  title={m.modelType}>
                  {m.modelType}
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:11, fontWeight:700, color:C.accent, fontVariantNumeric:'tabular-nums' }}>
                  {m.accuracy.toFixed(1)}%
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:11, fontWeight:700, color:C.green, fontVariantNumeric:'tabular-nums' }}>
                  {m.precision.toFixed(1)}%
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:11, fontWeight:700, color:C.purple, fontVariantNumeric:'tabular-nums' }}>
                  {m.recall.toFixed(1)}%
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:11, fontWeight:700, color:f1Color, fontVariantNumeric:'tabular-nums' }}>
                  {m.f1.toFixed(1)}%
                </td>
                <td style={{ padding:'9px 14px', fontFamily:MONO, fontSize:10, color:C.textSec, fontVariantNumeric:'tabular-nums' }}>
                  {fmt(m.samples)}
                </td>
                <td style={{ padding:'9px 14px' }}>
                  <span style={{
                    display:'inline-flex', alignItems:'center', gap:4,
                    padding:'2px 8px', borderRadius:3, fontSize:9, fontWeight:700,
                    letterSpacing:'1px', color:sc, background:`${sc}10`,
                    border:`1px solid ${sc}25`, fontFamily:MONO, textTransform:'uppercase',
                  }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background:sc }} />
                    {m.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FeatureImportanceChart({ data }: { data: { name:string; importance:number }[] }) {
  const max = Math.max(...data.map(d => d.importance));
  const palette = [C.accent, C.purple, C.green, C.amber, C.accent, C.teal, C.pink, C.orange, C.red, 'var(--accent-indigo)'];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
      {data.map((d, i) => {
        const pct = (d.importance / max) * 100;
        const color = palette[i];
        return (
          <div key={d.name} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{
              fontSize:10, color:C.textSec, width:140, flexShrink:0,
              letterSpacing:'0.3px', textTransform:'uppercase',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              fontFamily:MONO,
            }}>{d.name}</span>
            <div style={{
              flex:1, height:16, background:'var(--bg-secondary)', borderRadius:2,
              border:`1px solid ${C.border}`, overflow:'hidden',
            }}>
              <div style={{
                height:'100%', width:`${Math.max(pct, 0.5)}%`,
                background: color, opacity:0.75, borderRadius:1,
                transition:'width 1.2s cubic-bezier(0.22,1,0.36,1)',
              }} />
            </div>
            <span style={{
              fontSize:10, fontWeight:700, color, width:38, textAlign:'right',
              fontVariantNumeric:'tabular-nums', fontFamily:MONO,
            }}>{(d.importance * 100).toFixed(0)}%</span>
          </div>
        );
      })}
    </div>
  );
}

function ConfidenceHistogram() {
  const dist = [0, 0, 1, 1, 2, 4, 8, 18, 35, 62, 89];
  const labels = ['0–50','50–55','55–60','60–65','65–70','70–75','75–80','80–85','85–90','90–95','95–100'];
  const maxCount = Math.max(...dist);
  const chartW = 520;
  const chartH = 160;
  const pad = { top:16, right:10, bottom:28, left:36 };
  const iW = chartW - pad.left - pad.right;
  const iH = chartH - pad.top - pad.bottom;
  const barW = iW / dist.length;

  return (
    <svg width={chartW} height={chartH + 20} style={{ display:'block' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={pad.left} y1={pad.top + (1-pct)*iH}
          x2={pad.left+iW} y2={pad.top+(1-pct)*iH}
          stroke={C.border} strokeWidth={0.5} opacity={0.5} />
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => {
        const val = Math.round(maxCount * pct);
        return (
          <text key={pct} x={pad.left-5} y={pad.top+(1-pct)*iH+3}
            textAnchor="end" fill={C.textSec} fontSize="8" fontFamily={MONO}>{val}</text>
        );
      })}
      {dist.map((count, i) => {
        const barH = (count / maxCount) * iH;
        const x = pad.left + i * barW + 1;
        const y = pad.top + iH - barH;
        const barColor = count/maxCount > 0.7 ? C.accent : count/maxCount > 0.4 ? C.green : C.amber;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW-2} height={barH} rx={2} fill={barColor} opacity={0.75}>
              <animate attributeName="height" from="0" to={barH} dur="0.6s" fill="freeze" />
              <animate attributeName="y" from={pad.top+iH} to={y} dur="0.6s" fill="freeze" />
            </rect>
            <text x={x + (barW-2)/2} y={pad.top+iH+14}
              textAnchor="middle" fill={C.textSec} fontSize="7" fontFamily={MONO}>{labels[i]}</text>
          </g>
        );
      })}
      <text x={pad.left+iW/2} y={pad.top+iH+28}
        textAnchor="middle" fill={C.textDim} fontSize="8" fontFamily={MONO} letterSpacing="1">
        CONFIDENCE (%)
      </text>
    </svg>
  );
}

function ModelRationaleCard({ model }: { model: ThreatModel }) {
  const [expanded, setExpanded] = useState(false);
  const sc = model.status==='active' ? C.green : model.status==='training' ? C.amber : C.red;

  return (
    <div className="wt-interactive" style={{
      padding:'14px 16px', border:`1px solid ${C.border}`, borderRadius:4,
      background:'rgba(255,255,255,0.008)', cursor:'pointer',
      transition:`border-color 0.2s ${EASE}, background 0.2s ${EASE}`,
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = C.borderHi; e.currentTarget.style.background = `${C.accent}03`; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'rgba(255,255,255,0.008)'; }}
      onClick={() => setExpanded(!expanded)}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, fontWeight:600, color:C.text, fontFamily:MONO, textTransform:'uppercase', letterSpacing:'0.3px' }}>
            {model.category}
          </span>
          <Sev sev={model.status} />
        </div>
        <span style={{ fontFamily:MONO, fontSize:9, color:C.textDim, letterSpacing:'0.5px' }}>
          {expanded ? '▲ HIDE' : '▼ RATIONALE'}
        </span>
      </div>
      <div style={{ fontFamily:MONO, fontSize:10, color:C.textSec, marginTop:5, lineHeight:1.5 }}>{model.modelType}</div>
      {expanded && (
        <div style={{
          marginTop:10, padding:'10px 12px', background:`${C.accent}04`,
          border:`1px solid ${C.border}`, borderRadius:3,
          fontSize:10, color:C.textSec, lineHeight:1.65, fontFamily:MONO,
        }}>
          <span style={{ color:C.accent, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', fontSize:9 }}>
            Rationale: </span>
          {model.rationale}
          <div style={{ display:'flex', gap:16, marginTop:8, fontSize:9 }}>
            <span style={{ color:C.green }}>Accuracy: {model.accuracy.toFixed(1)}%</span>
            <span style={{ color:C.purple }}>F1: {model.f1.toFixed(1)}%</span>
            <span style={{ color:C.textDim }}>Samples: {fmt(model.samples)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function LiveInferenceStats() {
  const [stats, setStats] = useState({ pps:0, latency:0, queue:0, gpu:0 });
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const pps = 8200 + Math.floor(Math.random() * 2000);
      const lat = +(12 + Math.random() * 8).toFixed(1);
      const qd = 50 + Math.floor(Math.random() * 150);
      const gpu = 60 + Math.floor(Math.random() * 25);
      setStats({ pps, latency:lat, queue:qd, gpu });
      setHistory(prev => { const next = [...prev, pps]; return next.length > 30 ? next.slice(-30) : next; });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
        {[
          { label:'Predictions/sec', value:stats.pps.toLocaleString('en-US'), unit:'/s', color:C.accent },
          { label:'Avg Latency', value:stats.latency.toFixed(1), unit:'ms', color:C.green },
          { label:'Queue Depth', value:String(stats.queue), unit:'flows', color:C.amber },
          { label:'GPU Utilization', value:`${stats.gpu}%`, unit:'', color:C.purple },
        ].map(s => (
          <div key={s.label} style={{
            padding:'12px 14px', border:`1px solid ${C.border}`, borderRadius:4,
            background:'rgba(255,255,255,0.008)',
          }}>
            <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', color:C.textSec, marginBottom:4, textTransform:'uppercase' }}>
              {s.label}
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
              <span style={{
                fontSize:24, fontWeight:800, color:s.color,
                fontFamily:MONO, letterSpacing:'-0.5px', fontVariantNumeric:'tabular-nums',
              }}>{s.value}</span>
              <span style={{ fontSize:9, color:C.textDim, fontFamily:MONO }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Sparkline */}
      <div style={{
        padding:'10px 14px', border:`1px solid ${C.border}`, borderRadius:4,
        background:'rgba(255,255,255,0.008)',
      }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:'1px', color:C.textSec, marginBottom:8, textTransform:'uppercase' }}>
          Inference Throughput (30s)
        </div>
        <svg width="100%" height="48" viewBox={`0 0 ${30*8} 48`} preserveAspectRatio="none" style={{ display:'block' }}>
          {history.length > 1 && (() => {
            const max = Math.max(...history), min = Math.min(...history), range = max - min || 1;
            const pts = history.map((v,i) => `${i*8},${46 - ((v-min)/range)*40}`).join(' ');
            const area = `${pts} ${(history.length-1)*8},48 0,48`;
            return (
              <>
                <polyline points={area} fill={`${C.accent}15`} stroke="none" />
                <polyline points={pts} fill="none" stroke={C.accent} strokeWidth="1.5" opacity="0.7" />
              </>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════════
   MAIN AIAnalyzer COMPONENT
   ═══════════════════════════════════════════════════════════════════════════════════ */

const AIAnalyzer: React.FC = () => {
  const [clock, setClock] = useState(now());

  useEffect(() => {
    const t = setInterval(() => setClock(now()), 1000);
    return () => clearInterval(t);
  }, []);

  const activeModels = useMemo(() => THREAT_MODELS.filter(m => m.status === 'active').length, []);
  const avgAccuracy = useMemo(() => {
    const a = THREAT_MODELS.filter(m => m.status === 'active');
    return a.reduce((s, m) => s + m.accuracy, 0) / a.length;
  }, []);
  const avgF1 = useMemo(() => {
    const a = THREAT_MODELS.filter(m => m.status === 'active');
    return a.reduce((s, m) => s + m.f1, 0) / a.length;
  }, []);
  const totalSamples = useMemo(() => THREAT_MODELS.reduce((s, m) => s + m.samples, 0), []);

  return (
    <div style={{
      minHeight:'100%', background:C.bg, color:C.text,
      fontFamily:MONO, fontSize:12, lineHeight:1.5,
    }}>
      <style>{`
        @keyframes wt-pulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
        @keyframes wt-row-in { from{opacity:0;transform:translateX(-6px);} to{opacity:1;transform:translateX(0);} }
        ::selection { background:rgba(0,212,255,0.15);color:${C.text}; }
        :focus-visible { outline:1.5px solid rgba(0,212,255,0.5);outline-offset:2px;border-radius:2px; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border};border-radius:3px; }
        .wt-interactive { transition:transform 160ms cubic-bezier(0.22,1,0.36,1), background 0.2s; }
        .wt-interactive:active { transform:scale(0.98); }
        a { color:inherit;text-decoration:none; }
        @media (max-width:1024px) { .wt-grid-aside { grid-template-columns:1fr !important; } .wt-pipeline-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:768px) { .wt-grid-aside { grid-template-columns:1fr !important; } .wt-pipeline-grid { grid-template-columns:repeat(2,1fr) !important; } }
        @media (max-width:480px) { .wt-pipeline-grid { grid-template-columns:1fr !important; } header>div { padding:0 14px !important; } main { padding:20px 14px 60px !important; } }
      `}</style>

      {/* ── STICKY HUD BAR ─────────────────────────────────────────────── */}
      <header style={{
        position:'sticky',top:0,zIndex:40,
        background:'rgba(5,8,13,0.94)',
        borderBottom:`1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth:1480,margin:'0 auto',padding:'0 28px',
          display:'flex',alignItems:'center',height:48,gap:14,
        }}>
          <div style={{ display:'flex',alignItems:'center',gap:9,flexShrink:0 }}>
            <div style={{
              width:26,height:26,borderRadius:5,
              background:`linear-gradient(135deg,${C.accent}18,${C.accent}06)`,
              border:`1px solid ${C.accent}30`,
              display:'flex',alignItems:'center',justifyContent:'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2">
                <path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M12 2a4 4 0 0 0-4 4c0 1.95 1.4 3.58 3.25 3.93"/>
                <path d="M12 10v4"/><path d="M8 18h8"/><circle cx="12" cy="18" r="2"/>
              </svg>
            </div>
            <span style={{ fontSize:13,fontWeight:800,letterSpacing:'4px',color:C.text,fontVariantNumeric:'tabular-nums' }}>
              WATCHTOWER
            </span>
          </div>
          <div style={{ width:1,height:18,background:C.border,flexShrink:0 }} />
          <span style={{ fontSize:10,color:C.textSec,letterSpacing:'0.8px',flexShrink:0 }}>
            PS-26145 · AI ANALYZER
          </span>
          <div style={{ flex:1 }} />
          <div style={{ display:'flex',alignItems:'center',gap:4 }}>
            <Dot color={C.green} size={5} />
            <span style={{ fontSize:9,fontWeight:700,letterSpacing:'1.5px',color:C.green }}>STREAMING</span>
          </div>
          <span style={{ fontSize:11,color:C.textSec,letterSpacing:'0.8px',fontVariantNumeric:'tabular-nums' }}>{clock}</span>
        </div>
      </header>

      {/* ── SCROLLABLE MAIN ────────────────────────────────────────────── */}
      <main style={{ maxWidth:1480,margin:'0 auto',padding:'28px 28px 80px' }}>

        {/* Hero context */}
        <section style={{ marginBottom:36 }}>
          <h1 style={{ fontSize:13,fontWeight:700,letterSpacing:'2.5px',color:C.accent,marginBottom:8 }}>
            AI Threat Analyzer — ML Pipeline
          </h1>
          <p style={{ fontSize:13,color:C.textSec,maxWidth:720,lineHeight:1.75,margin:0 }}>
            Ekadhara Detection Engine v3.2.1 — Deep learning classification pipeline with {THREAT_MODELS.length} threat-specific models.
            Streaming inference on 487 features per flow at 10K flows/sec sustained throughput.
            Each model is selected for its specific threat pattern characteristics.
          </p>
        </section>

        {/* Section 1: Pipeline + Inference Stats */}
        <section style={{ display:'grid',gridTemplateColumns:'3fr 2fr',gap:16,marginBottom:20 }} className="wt-grid-aside">

          {/* Pipeline */}
          <Panel delay={0.05}>
            <SH label="ML Pipeline" right={
              <span style={{ fontSize:9,color:C.textSec,fontVariantNumeric:'tabular-nums' }}>
                {activeModels} MODELS ACTIVE · {fmt(totalSamples)} SAMPLES
              </span>
            } />
            <div className="wt-pipeline-grid" style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8 }}>
              {PIPELINE_STAGES.map((stage, i) => (
                <div key={i} className="wt-interactive" style={{
                  padding:'14px 16px', background:'rgba(255,255,255,0.008)',
                  border:`1px solid ${C.border}`, borderRadius:5, cursor:'default',
                  display:'flex', flexDirection:'column', gap:6,
                  transition:`border-color 0.2s ${EASE}`,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = `${stage.color}40`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <Dot color={stage.color} size={4} />
                    <span style={{ fontSize:10,fontWeight:700,letterSpacing:'1.2px',color:stage.color,fontFamily:MONO }}>{stage.label}</span>
                  </div>
                  <span style={{ fontSize:9,color:C.textSec,lineHeight:1.4 }}>{stage.sub}</span>
                  <span style={{ fontSize:8,color:C.textDim,lineHeight:1.4,marginTop:2 }}>{stage.detail}</span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Inference Stats */}
          <Panel delay={0.1}>
            <SH label="Inference Engine" right={
              <span style={{ display:'flex',alignItems:'center',gap:4 }}>
                <Dot color={C.green} size={4} />
                <span style={{ fontSize:9,color:C.green,fontWeight:700,letterSpacing:'0.5px' }}>STREAMING</span>
              </span>
            } />
            <LiveInferenceStats />
          </Panel>
        </section>

        {/* Section 2: KPI Strip */}
        <Panel delay={0.15} style={{ marginBottom:20 }}>
          <div style={{ display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:0 }}>
            {[
              { label:'Avg Accuracy',   value:`${avgAccuracy.toFixed(1)}%`,  sub:'across all models',  color:C.accent,  trend:{ value:1.2, up:true } },
              { label:'Avg F1 Score',   value:`${avgF1.toFixed(1)}%`,       sub:'harmonic mean',      color:C.green,   trend:{ value:0.8, up:true } },
              { label:'Active Models',  value:String(activeModels),        sub:'of 8 total',          color:C.purple },
              { label:'Training Samples',value:`${(totalSamples/1e6).toFixed(1)}M`, sub:'total corpus',     color:C.amber },
              { label:'Inference Latency',value:'12ms',                     sub:'p99 latency',         color:C.teal,   trend:{ value:3.5, up:false } },
            ].map((m, i) => (
              <div key={i} className="wt-interactive" style={{
                padding:'16px 20px',
                borderRight: i < 4 ? `1px solid ${C.border}` : 'none',
                cursor:'default',
                transition:`background 0.2s ${EASE}`,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${m.color}04`; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize:9,fontWeight:700,letterSpacing:'1.2px',color:C.textSec,marginBottom:6,textTransform:'uppercase' }}>
                  {m.label}
                </div>
                <div style={{
                  fontSize:28,fontWeight:800,color:m.color,
                  fontFamily:MONO,letterSpacing:'-0.5px',lineHeight:1.1,
                  fontVariantNumeric:'tabular-nums',
                }}>{m.value}</div>
                <div style={{ display:'flex',alignItems:'center',gap:5,marginTop:5 }}>
                  <span style={{ fontSize:9,color:C.textDim }}>{m.sub}</span>
                  {m.trend && (
                    <span style={{ fontSize:9,fontWeight:600,color:m.trend.up?C.green:C.red,fontFamily:MONO }}>
                      {m.trend.up?'▲':'▼'} {m.trend.value}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>

        {/* Section 3: Threat Model Performance */}
        <Panel delay={0.2} style={{ marginBottom:20 }}>
          <SH label="Threat Model Performance" right={
            <span style={{ fontSize:9,color:C.textSec }}>
              {THREAT_MODELS.length} MODELS · {activeModels} ACTIVE
            </span>
          } />
          <ThreatModelTable models={THREAT_MODELS} />
        </Panel>

        {/* Section 4: Feature Importance + Confidence Histogram */}
        <section style={{ display:'grid',gridTemplateColumns:'5fr 4fr',gap:16,marginBottom:20 }} className="wt-grid-aside">

          {/* Feature importance */}
          <Panel delay={0.25}>
            <SH label="Top 10 Feature Importance" right={
              <span style={{ fontSize:9,color:C.textSec }}>
                487 total features · SHAP-weighted
              </span>
            } />
            <FeatureImportanceChart data={FEATURE_IMPORTANCE} />
          </Panel>

          {/* Confidence histogram */}
          <Panel delay={0.3}>
            <SH label="Confidence Distribution" right={
              <span style={{ fontSize:9,color:C.textSec }}>
                Last 24 hours
              </span>
            } />
            <ConfidenceHistogram />
            <div style={{ display:'flex',justifyContent:'space-between',marginTop:8,fontSize:9,color:C.textDim,fontFamily:MONO }}>
              <span>0%</span>
              <span style={{ color:C.green }}>Peak at 95–100%</span>
              <span>100%</span>
            </div>
          </Panel>
        </section>

        {/* Section 5: Model Selection Rationale */}
        <Panel delay={0.35} style={{ marginBottom:20 }}>
          <SH label="Model Selection Rationale" right={
            <span style={{ fontSize:9,color:C.textSec }}>
              Click any card to expand rationale
            </span>
          } />
          <div style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8 }}>
            {THREAT_MODELS.map((model) => (
              <ModelRationaleCard key={model.category} model={model} />
            ))}
          </div>
        </Panel>

        {/* Footer */}
        <footer style={{
          padding:'24px 0',borderTop:`1px solid ${C.border}`,
          display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8,
        }}>
          <span style={{ fontSize:9,color:C.textDim,letterSpacing:'1px' }}>
            WATCHTOWER v3.2.1 · EKADHARA · NTRO SIH26
          </span>
          <span style={{ fontSize:9,color:C.textDim,letterSpacing:'0.5px',fontVariantNumeric:'tabular-nums' }}>
            {activeModels} MODELS · {fmt(totalSamples)} SAMPLES · {clock} LOCAL
          </span>
        </footer>
      </main>
    </div>
  );
};

export default AIAnalyzer;
