/* FeatureValidityPanel — expandable panel showing features with validity + SHAP */
import React from 'react';

export interface FeatureEntry {
  name: string;
  value: string | number;
  unit: string;
  validity: 'MEASURED' | 'ESTIMATED' | 'MISSING';
  shap_contribution: number;
}

interface FeatureValidityPanelProps {
  features: FeatureEntry[];
}

const VALIDITY_COLORS: Record<string, string> = {
  MEASURED:  'var(--accent-green)',
  ESTIMATED: 'var(--accent-yellow)',
  MISSING:   'var(--accent-red)',
};

const FeatureValidityPanel: React.FC<FeatureValidityPanelProps> = ({ features }) => {
  const [expanded, setExpanded] = React.useState(false);
  const counts = React.useMemo(() => {
    const c = { MEASURED: 0, ESTIMATED: 0, MISSING: 0 };
    features.forEach(f => { c[f.validity] = (c[f.validity] || 0) + 1; });
    return c;
  }, [features]);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      fontFamily: '"JetBrains Mono","Fira Code",monospace',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 18px', background:'transparent', border:'none', cursor:'pointer',
          color:'var(--text-primary)', fontSize: 12, fontWeight: 700,
          letterSpacing:'0.8px', textTransform:'uppercase',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{ display:'flex', alignItems:'center', gap: 12 }}>
          <span style={{ color:'var(--accent-cyan)' }}>Feature Validity Breakdown</span>
          <div style={{ display:'flex', gap:6, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'var(--accent-green)', background:'rgba(34,197,94,0.08)', padding:'2px 7px', borderRadius:4, border:'1px solid rgba(34,197,94,0.2)' }}>
              {counts.MEASURED} Measured
            </span>
            <span style={{ fontSize:10, color:'var(--accent-yellow)', background:'rgba(234,179,8,0.08)', padding:'2px 7px', borderRadius:4, border:'1px solid rgba(234,179,8,0.2)' }}>
              {counts.ESTIMATED} Estimated
            </span>
            <span style={{ fontSize:10, color:'var(--accent-red)', background:'var(--color-danger-dim)', padding:'2px 7px', borderRadius:4, border:'1px solid var(--sev-critical-border)' }}>
              {counts.MISSING} Missing
            </span>
          </div>
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)', transition:'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▾
        </span>
      </button>

      {/* Expandable content */}
      <div style={{
        maxHeight: expanded ? (features.length * 52) : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{ borderTop:'1px solid var(--border-color)' }}>
          {/* Column header */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', gap: 8,
            padding:'8px 18px', background:'var(--bg-primary)',
            borderBottom:'1px solid var(--border-color)',
          }}>
            {['Feature', 'Value', 'Validity', 'SHAP'].map(h => (
              <span key={h} style={{ fontSize:9, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.6px' }}>
                {h}
              </span>
            ))}
          </div>

          {features.map((f, i) => (
            <div key={f.name} style={{
              display:'grid', gridTemplateColumns:'1fr 100px 100px 100px', gap: 8,
              padding:'8px 18px', alignItems:'center',
              borderBottom: i < features.length - 1 ? '1px solid var(--border-color)' : 'none',
              background: i % 2 === 0 ? 'transparent' : 'var(--bg-primary)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-primary)'; }}
            >
              {/* Name */}
              <span style={{ fontSize:11, color:'var(--text-primary)', fontWeight:500, letterSpacing:'0.2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {f.name}
              </span>

              {/* Value */}
              <span style={{ fontSize:11, color:'var(--accent-cyan)', fontWeight:600, fontVariantNumeric:'tabular-nums' }}>
                {f.value} <span style={{ color:'var(--text-muted)', fontWeight:400 }}>{f.unit}</span>
              </span>

              {/* Validity chip */}
              <span style={{
                fontSize:9, fontWeight:700, letterSpacing:'0.5px',
                textTransform:'uppercase',
                color: VALIDITY_COLORS[f.validity] || 'var(--text-muted)',
              }}>{f.validity}</span>

              {/* SHAP contribution bar */}
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{
                  flex:1, height:6, background:'var(--border-color)', borderRadius:3, overflow:'hidden',
                }}>
                  <div style={{
                    height:'100%',
                    width:`${Math.max(f.shap_contribution, 0)}%`,
                    background: f.shap_contribution > 60 ? 'var(--accent-cyan)' : f.shap_contribution > 30 ? 'var(--accent-orange)' : 'var(--text-muted)',
                    borderRadius:3,
                    transition:'width 0.5s cubic-bezier(0.22,1,0.36,1)',
                  }} />
                </div>
                <span style={{ fontSize:10, color:'var(--text-muted)', minWidth:28, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                  {f.shap_contribution.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeatureValidityPanel;
