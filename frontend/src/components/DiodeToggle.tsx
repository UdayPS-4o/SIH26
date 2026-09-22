/* DiodeToggle — three-state toggle: Full-Duplex / Diode-Only / ACK-Shadow
   With sliding highlight indicator and glow effect */

import React from 'react';

interface DiodeToggleProps {
  mode: 'full-duplex' | 'diode-only' | 'ack-shadow';
  onChange: (mode: 'full-duplex' | 'diode-only' | 'ack-shadow') => void;
}

const MODES: { key: DiodeToggleProps['mode']; label: string; short: string; color: string; glow: string }[] = [
  { key: 'full-duplex',  label: 'Full-Duplex',   short: 'FULL',      color: 'var(--accent-green)',  glow: 'rgba(34,197,94,0.15)' },
  { key: 'diode-only',   label: 'Diode-Only',    short: 'DIODE',     color: 'var(--accent-orange)', glow: 'rgba(249,115,22,0.15)' },
  { key: 'ack-shadow',   label: 'ACK-Shadow',    short: 'ACK',       color: 'var(--accent-cyan)',   glow: 'rgba(6,182,212,0.15)' },
];

const DiodeToggle: React.FC<DiodeToggleProps> = ({ mode, onChange }) => {
  const idx = MODES.findIndex(m => m.key === mode);

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 0,
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-color)',
      borderRadius: 10, padding: 3, position: 'relative',
      fontFamily: '"JetBrains Mono",monospace',
      boxShadow: '0 0 0 1px var(--border-default)',
    }}>
      {MODES.map((m) => {
        const active = m.key === mode;
        return (
          <button
            key={m.key}
            onClick={() => onChange(m.key)}
            style={{
              position: 'relative', zIndex: 2,
              padding: '10px 20px',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: '"JetBrains Mono",monospace',
              background: active ? 'var(--bg-secondary)' : 'transparent',
              color: active ? m.color : 'var(--text-muted)',
              transition: 'color 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {active && (
              <span style={{
                position:'absolute', inset: 0, borderRadius: 8, zIndex: -1,
                background: m.glow,
                boxShadow: `inset 0 0 12px ${m.glow}, 0 0 8px ${m.glow}`,
                animation: 'wt-toggle-glow 2s ease-in-out infinite',
              }} />
            )}
            <span style={{
              display:'inline-flex', alignItems:'center', gap:6,
            }}>
              {active && (
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: m.color,
                  boxShadow: `0 0 6px ${m.color}`,
                  animation: 'wt-pulse 1.5s ease-in-out infinite',
                  display: 'inline-block',
                }} />
              )}
              {m.short}
            </span>
          </button>
        );
      })}
      <style>{`
        @keyframes wt-toggle-glow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default DiodeToggle;
