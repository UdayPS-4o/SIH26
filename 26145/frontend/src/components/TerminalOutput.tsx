/* TerminalOutput — styled terminal container with monospace output */
import React from 'react';

export interface TerminalLine {
  text: string;
  type: 'info' | 'pass' | 'fail' | 'checking';
}

interface TerminalOutputProps {
  lines: TerminalLine[];
  typewriter?: boolean;
  typewriterDelay?: number;
}

const TYPE_COLORS: Record<string, string> = {
  info:    'var(--accent-cyan)',
  pass:    'var(--accent-green)',
  fail:    'var(--accent-red)',
  checking:'var(--accent-yellow)',
};

const TYPE_PREFIX: Record<string, string> = {
  info:    'ℹ',
  pass:    '✔',
  fail:    '✘',
  checking:'◌',
};

const TerminalOutput: React.FC<TerminalOutputProps> = ({ lines, typewriter = false, typewriterDelay = 60 }) => {
  const [visibleCount, setVisibleCount] = React.useState(typewriter ? 0 : lines.length);

  React.useEffect(() => {
    if (!typewriter) {
      setVisibleCount(lines.length);
      return;
    }
    setVisibleCount(0);
    if (lines.length === 0) return;
    let i = 0;
    const t = setInterval(() => {
      i++;
      setVisibleCount(i);
      if (i >= lines.length) clearInterval(t);
    }, typewriterDelay);
    return () => clearInterval(t);
  }, [lines, typewriter, typewriterDelay]);

  return (
    <div style={{
      background: '#0a0a0f',
      border: '1px solid var(--border-color)',
      borderRadius: 8,
      fontFamily: '"JetBrains Mono","Fira Code",monospace',
      fontSize: 12, lineHeight: 1.7,
      overflow: 'hidden',
    }}>
      {/* Terminal header bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'8px 14px', background:'var(--bg-secondary)',
        borderBottom:'1px solid var(--border-color)',
      }}>
        <span style={{ width:8, height:8, borderRadius:'50%', background:'#ef4444', display:'inline-block' }} />
        <span style={{ width:8, height:8, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }} />
        <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} />
        <span style={{ flex:1 }} />
        <span style={{ fontSize:10, color:'var(--text-muted)', letterSpacing:'0.5px', textTransform:'uppercase' }}>Self-Test Terminal</span>
      </div>

      {/* Terminal body */}
      <div style={{
        padding: '16px 18px',
        maxHeight: 420, overflowY: 'auto',
        background: '#0a0a0f',
      }}>
        {lines.slice(0, visibleCount).map((line, i) => (
          <div
            key={i}
            style={{
              color: TYPE_COLORS[line.type] || 'var(--text-secondary)',
              opacity: 0,
              animation: `wt-fade-in 0.3s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s forwards`,
            }}
          >
            <span style={{ color:'var(--text-muted)', marginRight: 10, fontSize: 10, userSelect:'none' }}>
              {TYPE_PREFIX[line.type] || '>'}
            </span>
            {line.text}
          </div>
        ))}
        {visibleCount > 0 && visibleCount >= lines.length && (
          <span style={{
            display:'inline-block', width:7, height:13, background:'var(--accent-cyan)',
            animation: 'wt-pulse-dot 1s step-end infinite', marginLeft: 18, verticalAlign:'middle',
          }} />
        )}
      </div>
    </div>
  );
};

export default TerminalOutput;
