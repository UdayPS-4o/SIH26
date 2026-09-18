/* DegradationMatrix — detection rates per threat type under each diode mode */

import React from 'react';
import ValidityChip from './ValidityChip';

export interface DegradationRow {
  threat_type: string;
  icon: string;
  full_rate: number;
  diode_rate: number;
  ack_shadow_rate: number;
  features_lost: string;
  severity: string;
  validity: 'MEASURED' | 'ESTIMATED' | 'MISSING';
}

interface DegradationMatrixProps {
  data: DegradationRow[];
}

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-cyan)',
};

const DegradationMatrix: React.FC<DegradationMatrixProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center',
        color: 'var(--text-muted)', fontSize: 13,
        fontFamily: '"JetBrains Mono",monospace',
      }}>
        Awaiting degradation data…
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{
        width: '100%', borderCollapse: 'collapse',
        fontFamily: '"JetBrains Mono",monospace', fontSize: 12,
      }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            {['Threat', 'FULL-DUPLEX', 'DIODE-ONLY', 'ACK-SHADOW', 'Features Lost', 'Validity', 'Sev'].map(h => (
              <th key={h} style={{
                padding: '9px 12px', textAlign: 'left', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.8px', color: 'var(--text-muted)',
                textTransform: 'uppercase', whiteSpace: 'nowrap',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.threat_type} style={{
              borderBottom: '1px solid var(--border-color)',
              background: 'transparent',
              animation: 'wt-row-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
              animationDelay: `${i * 0.04}s`,
            }}>
              {/* Threat type name */}
              <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {row.icon} {row.threat_type}
              </td>

              {/* Full-duplex bar */}
              <td style={{ padding: '10px 12px' }}>
                <Bar value={row.full_rate} color="var(--accent-green)" label={`${row.full_rate.toFixed(0)}%`} />
              </td>

              {/* Diode-only bar */}
              <td style={{ padding: '10px 12px' }}>
                <Bar value={row.diode_rate} color="var(--accent-orange)" label={`${row.diode_rate.toFixed(0)}%`} />
              </td>

              {/* ACK-shadow bar */}
              <td style={{ padding: '10px 12px' }}>
                <Bar value={row.ack_shadow_rate} color="var(--accent-yellow)" label={`${row.ack_shadow_rate.toFixed(0)}%`} />
              </td>

              {/* Features lost badge */}
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--accent-orange)',
                  background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                  padding: '2px 7px', borderRadius: 4,
                  textTransform: 'uppercase', letterSpacing: '0.4px',
                }}>{row.features_lost}</span>
              </td>

              {/* Validity chip */}
              <td style={{ padding: '10px 12px' }}>
                <ValidityChip validity={row.validity} />
              </td>

              {/* Severity */}
              <td style={{ padding: '10px 12px' }}>
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:4,
                  padding:'2px 7px', borderRadius:3, fontSize:9, fontWeight:700,
                  letterSpacing:'0.6px', color: SEV_COLORS[row.severity] || 'var(--text-secondary)',
                  background: `${SEV_COLORS[row.severity] || 'var(--text-secondary)'}12`,
                  border: `1px solid ${(SEV_COLORS[row.severity] || 'var(--text-secondary)')}25`,
                  textTransform:'uppercase',
                }}>
                  {row.severity}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/* ── Animated bar sub-component ── */
const Bar: React.FC<{ value: number; color: string; label: string }> = ({ value, color, label }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
    <div style={{
      flex: 1, height: 14, background: 'var(--bg-secondary)',
      borderRadius: 3, overflow: 'hidden',
      border: '1px solid var(--border-color)',
    }}>
      <div style={{
        height: '100%',
        width: `${Math.min(value, 100)}%`,
        background: color,
        borderRadius: 2,
        opacity: 0.7,
        transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
      }} />
    </div>
    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 38, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
      {label}
    </span>
  </div>
);

export default DegradationMatrix;
