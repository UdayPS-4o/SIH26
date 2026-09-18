/* DiodeToggle — three-state toggle: Full-Duplex / Diode-Only / ACK-Shadow */

import React from 'react';

interface DiodeToggleProps {
  mode: 'full-duplex' | 'diode-only' | 'ack-shadow';
  onChange: (mode: 'full-duplex' | 'diode-only' | 'ack-shadow') => void;
}

const MODES: { key: DiodeToggleProps['mode']; label: string; color: string }[] = [
  { key: 'full-duplex',  label: 'FULL-DUPLEX',    color: 'var(--accent-cyan)'  },
  { key: 'diode-only',   label: 'DIODE-ONLY',      color: 'var(--accent-orange)' },
  { key: 'ack-shadow',   label: 'ACK-SHADOW',      color: 'var(--accent-yellow)' },
];

const DiodeToggle: React.FC<DiodeToggleProps> = ({ mode, onChange }) => {
  const idx = MODES.findIndex(m => m.key === mode);

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 0,
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 8, padding: 3, position: 'relative',
      fontFamily: '"JetBrains Mono",monospace',
    }}>
      {MODES.map((m) => {
        const active = m.key === mode;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              position: 'relative', zIndex: 1,
              padding: '8px 18px',
              border: 'none', borderRadius: 6, cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: '"JetBrains Mono",monospace',
              background: active ? 'var(--bg-secondary)' : 'transparent',
              color: active ? m.color : 'var(--text-muted)',
              transition: 'color 0.25s cubic-bezier(0.22,1,0.36,1), background 0.25s cubic-bezier(0.22,1,0.36,1)',
              boxShadow: active ? '0 0 0 1px var(--border-color)' : 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
};

export default DiodeToggle;
