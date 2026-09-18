/* ValidityChip — small rounded pill for feature/alert validity */

const VALIDITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  MEASURED:  { bg: 'rgba(34,197,94,0.12)',  text: 'var(--accent-green)',  border: 'rgba(34,197,94,0.25)' },
  ESTIMATED: { bg: 'rgba(234,179,8,0.12)',   text: 'var(--accent-yellow)', border: 'rgba(234,179,8,0.25)' },
  MISSING:   { bg: 'rgba(239,68,68,0.15)',   text: '#ffffff',             border: 'rgba(239,68,68,0.35)' },
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
