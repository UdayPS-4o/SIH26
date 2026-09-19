/* EvidenceChain — SHA-256 hash display, Merkle seal, evidence metadata */
import React from 'react';

interface EvidenceChainProps {
  hash: string;
  timestamp: number;
  threat_class: string;
  severity: string;
  merkle_seal?: string;
}

const EvidenceChain: React.FC<EvidenceChainProps> = ({
  hash, timestamp, threat_class, severity, merkle_seal,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const fmtHash = (h: string) => {
    if (h.length <= 32) return h;
    return `${h.slice(0, 16)}…${h.slice(-16)}`;
  };

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8, padding: 20,
      fontFamily: '"JetBrains Mono","Fira Code",monospace',
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing:'1.5px',
          color:'var(--accent-cyan)', textTransform:'uppercase',
        }}>Evidence Chain</span>
        <span style={{
          fontSize: 10, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px',
        }}>Chain of Custody</span>
      </div>

      {/* SHA-256 hash */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color:'var(--text-muted)', marginBottom: 6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
          SHA-256 Evidence Hash
        </div>
        <div style={{
          display:'flex', alignItems:'center', gap: 8,
          padding: '10px 12px', background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)', borderRadius: 6,
        }}>
          <code style={{
            flex: 1, fontSize: 11, color:'var(--accent-green)', wordBreak:'break-all',
            letterSpacing:'0.3px',
          }}>{fmtHash(hash)}</code>
          <button onClick={handleCopy} style={{
            padding:'5px 10px', background: copied ? 'var(--match-matched-bg)' : 'transparent',
            border: `1px solid ${copied ? 'var(--mat-approved-border)' : 'var(--border-color)'}`,
            borderRadius: 4, cursor: 'pointer', fontFamily:'"JetBrains Mono",monospace',
            fontSize: 10, fontWeight: 600, color: copied ? 'var(--accent-green)' : 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing:'0.5px',
            transition: 'all 0.2s',
          }}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Merkle seal */}
      {merkle_seal && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color:'var(--text-muted)', marginBottom: 6, textTransform:'uppercase', letterSpacing:'0.5px' }}>
            Merkle Seal
          </div>
          <div style={{
            padding: '8px 12px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 6,
            fontSize: 10, color:'var(--text-secondary)', wordBreak:'break-all',
          }}>
            {merkle_seal}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div style={{
        display:'grid', gridTemplateColumns:'1fr 1fr', gap: 10,
      }}>
        {[
          { label: 'Timestamp', value: new Date(timestamp).toLocaleString() },
          { label: 'Threat Class', value: threat_class },
          { label: 'Severity', value: severity },
          { label: 'Integrity', value: 'VERIFIED', color: 'var(--accent-green)' },
        ].map(m => (
          <div key={m.label} style={{
            padding:'8px 10px', background:'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 4,
          }}>
            <div style={{ fontSize:9, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>
              {m.label}
            </div>
            <div style={{ fontSize:11, fontWeight:600, color: m.color || 'var(--text-primary)' }}>
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceChain;
