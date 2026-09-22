/* ValidityChip — small rounded pill for feature/alert validity */

const VALIDITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MEASURED:  { bg: 'var(--mat-approved-bg)',  text: 'var(--accent-green)',  border: 'var(--color-success-dim)' },
  ESTIMATED: { bg: 'var(--mat-pending-bg)',   text: 'var(--accent-yellow)', border: 'rgba(234,179,8,0.25)' },
  MISSING:   { bg: 'var(--chip-unverified-border)',   text: 'var(--accent-red)',             border: 'var(--sev-critical-border)' },
};

const ValidityChip: React.FC<{ validity: string; label?: string }> = ({ validity, label }) => {
  const v = (validity || '').toUpperCase();
  const c = VALIDITY_COLORS[v] || VALIDITY_COLORS.MISSING;
  const text = label || v;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 9999,
      fontSize: 10, fontWeight: 700,
      letterSpacing: '0.05em',
      fontFamily: '"JetBrains Mono",monospace',
      textTransform: 'uppercase',
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap',
      lineHeight: '16px',
    }}>
      {text}
    </span>
  );
};

export default ValidityChip;
