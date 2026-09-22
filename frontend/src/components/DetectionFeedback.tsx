/* DetectionFeedback — inline detection result after attack launch */
import React from 'react';

interface DetectionFeedbackProps {
  attack: { name: string; type: string };
  detection: {
    confidence: number;
    latency: number;
    evidence: string[];
  };
}

const DetectionFeedback: React.FC<DetectionFeedbackProps> = ({ attack, detection }) => {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => { setVisible(false); const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, [attack.name, attack.type]);

  if (!visible) return null;

  return (
    <div style={{
      display:'flex', flexDirection:'column', gap: 10,
      padding: '14px 16px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      opacity: 0,
      animation: 'wt-slide-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
      fontFamily: '"JetBrains Mono","Fira Code",monospace',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap: 10, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:700, color:'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.3px' }}>
          {attack.name}
        </span>

        {/* Detection status badge */}
        <span style={{
          display:'inline-flex', alignItems:'center', gap:4,
          padding:'2px 8px', borderRadius:4,
          fontSize:10, fontWeight:700, letterSpacing:'0.5px',
          textTransform:'uppercase',
          background:'var(--match-matched-bg)',
          color:'var(--accent-green)',
          border:'1px solid var(--color-success-dim)',
        }}>
          <span style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent-green)', display:'inline-block' }} />
          DETECTED
        </span>

        {/* Confidence */}
        <span style={{ fontSize:11, color:'var(--accent-cyan)', fontWeight:600 }}>
          {detection.confidence}% confidence
        </span>

        {/* Latency */}
        <span style={{ fontSize:10, color:'var(--text-muted)' }}>
          {detection.latency}ms latency
        </span>
      </div>

      {/* Evidence summary */}
      {detection.evidence.length > 0 && (
        <div style={{
          display:'flex', gap:6, flexWrap:'wrap',
          marginTop: 2,
        }}>
          {detection.evidence.map((ev, i) => (
            <span key={i} style={{
              fontSize:10, color:'var(--text-secondary)',
              padding:'2px 8px', borderRadius:4,
              background:'var(--bg-primary)',
              border:'1px solid var(--border-color)',
            }}>{ev}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetectionFeedback;
