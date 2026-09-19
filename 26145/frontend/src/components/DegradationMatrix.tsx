/* DegradationMatrix — detection rates per threat type under each diode mode
   With degradation warning banner and animated transitions */

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
  diode_delta?: string;
}

interface DegradationMatrixProps {
  data: DegradationRow[];
  showWarning?: boolean;
}

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--accent-red)',
  high: 'var(--accent-orange)',
  medium: 'var(--accent-yellow)',
  low: 'var(--accent-cyan)',
};

const DegradationMatrix: React.FC<DegradationMatrixProps> = ({ data, showWarning }) => {
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
      {/* Degradation Warning Banner */}
      {showWarning && (
        <div style={{
          marginBottom: 12, padding: '10px 14px',
          background: 'linear-gradient(90deg, var(--color-danger-dim), var(--color-danger-dim))',
          border: '1px solid var(--sev-critical-border)',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 10,
          animation: 'wt-flash-in 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <span style={{
            fontSize: 14, lineHeight: 1,
          }}>⚠️</span>
          <span style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 11,
            fontWeight: 700, letterSpacing: '0.5px', color: 'var(--accent-red)',
            textTransform: 'uppercase',
          }}>DEGRADATION WARNING</span>
          <span style={{
            fontFamily: '"JetBrains Mono",monospace', fontSize: 10,
            color: 'var(--text-secondary)',
          }}>
            {data.filter(r => r.diode_rate < 50).length > 0
              ? `${data.filter(r => r.diode_rate < 50).length} threat${data.filter(r => r.diode_rate < 50).length > 1 ? 's' : ''} below 50% detection — silent failure risk`
              : 'Detection rates degraded — ACK-Shadow recommended'}
          </span>
        </div>
      )}

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
          {data.map((row, i) => {
            const sevColor = SEV_COLORS[row.severity] || 'var(--text-secondary)';
            const isDegraded = row.diode_rate < 50;
            const isRecovered = row.ack_shadow_rate > row.diode_rate + 15;
            const delta = row.full_rate - row.diode_rate;

            return (
              <tr key={row.threat_type} style={{
                borderBottom: '1px solid var(--border-color)',
                background: isDegraded ? 'var(--color-danger-dim)' : 'transparent',
                animation: 'wt-row-in 0.3s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: `${i * 0.04}s`,
              }}>
                <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.3px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {row.icon} {row.threat_type}
                </td>

                {/* Full-duplex bar */}
                <td style={{ padding: '10px 12px' }}>
                  <Bar value={row.full_rate} color="var(--accent-green)" label={`${row.full_rate.toFixed(0)}%`} />
                </td>

                {/* Diode-only bar */}
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ position:'relative' }}>
                    {isDegraded && (
                      <span style={{
                        position:'absolute', top:-14, left:0,
                        fontSize:9, fontWeight:700, color:'var(--accent-red)',
                        fontFamily:'"JetBrains Mono",monospace',
                        textTransform:'uppercase', letterSpacing:'0.3px',
                        whiteSpace:'nowrap',
                      }}>▼ -{delta}%</span>
                    )}
                    <Bar value={row.diode_rate} color={isDegraded ? 'var(--accent-red)' : 'var(--accent-orange)'} label={`${row.diode_rate.toFixed(0)}%`} />
                    {row.diode_delta && (
                      <div style={{
                        fontSize: 9, color: 'var(--accent-red)', marginTop: 2,
                        fontFamily: '"JetBrains Mono",monospace',
                      }}>{row.diode_delta}</div>
                    )}
                  </div>
                </td>

                {/* ACK-shadow bar */}
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ position:'relative' }}>
                    {isRecovered && (
                      <span style={{
                        position:'absolute', top:-14, left:0,
                        fontSize:9, fontWeight:700, color:'var(--accent-purple)',
                        fontFamily:'"JetBrains Mono",monospace',
                        textTransform:'uppercase', letterSpacing:'0.3px',
                        whiteSpace:'nowrap',
                      }}>▲ +{row.ack_shadow_rate - row.diode_rate}%</span>
                    )}
                    <Bar value={row.ack_shadow_rate} color={isRecovered ? 'var(--accent-purple)' : 'var(--accent-cyan)'} label={`${row.ack_shadow_rate.toFixed(0)}%`} />
                  </div>
                </td>

                {/* Features lost badge */}
                <td style={{ padding: '10px 12px' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: 'var(--accent-orange)',
                    background: 'var(--sev-high-bg)', border: '1px solid rgba(249,115,22,0.2)',
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
                    letterSpacing:'0.6px', color: sevColor,
                    background: `${sevColor}12`,
                    border: `1px solid ${sevColor}25`,
                    textTransform:'uppercase',
                  }}>
                    {row.severity}
                  </span>
                </td>
              </tr>
            );
          })}
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
        opacity: 0.75,
        transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)',
        boxShadow: `0 0 6px ${color}30`,
      }} />
    </div>
    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', minWidth: 38, textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
      {label}
    </span>
  </div>
);

export default DegradationMatrix;
