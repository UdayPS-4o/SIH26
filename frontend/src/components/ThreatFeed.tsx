import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, ArrowRight } from 'lucide-react';
import { Alert } from '../types';

interface ThreatFeedProps {
  alerts: Alert[];
  maxVisible?: number;
}

const severityConfig = {
  low:    { c: 'var(--accent-cyan)' },
  medium: { c: 'var(--accent-yellow)' },
  high:   { c: 'var(--accent-orange)' },
  critical:{ c: 'var(--accent-red)' },
};

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString('en-US', { hour12: false, hour:'2-digit', minute:'2-digit', second:'2-digit' });

const ThreatFeed: React.FC<ThreatFeedProps> = ({ alerts, maxVisible = 50 }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = alerts.slice(0, maxVisible);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'10px 14px', borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
          <AlertTriangle size={14} style={{ color: 'var(--accent-yellow)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing:'1.5px', textTransform:'uppercase', color: 'var(--text-primary)' }}>Live Threat Feed</span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace' }}>{alerts.length} events</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding: '6px 0' }}>
        {visible.length === 0 ? (
          <div style={{ padding:'40px 20px', textAlign:'center', color: 'var(--text-dim)' }}>
            <Eye size={32} style={{ opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontSize: 12 }}>No threats detected</p>
          </div>
        ) : (
          visible.map((alert) => {
            const sc = severityConfig[alert.severity] || severityConfig.low;
            const isExp = expandedId === alert.id;
            return (
              <div key={alert.id} style={{
                display:'flex', alignItems:'center', gap: 10,
                padding: '7px 12px', borderBottom: '1px solid var(--border-color)20',
                cursor:'pointer',
                transition: 'background 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--table-hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => setExpandedId(isExp ? null : alert.id)}
              >
                {/* Severity dot */}
                <span style={{
                  width: 6, height: 6, borderRadius:'50%', flexShrink:0,
                  background: sc.c,
                }} />
                {/* Time */}
                <span style={{
                  fontSize: 10, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace',
                  minWidth: 56, fontVariantNumeric:'tabular-nums',
                }}>{formatTime(alert.timestamp)}</span>
                {/* Threat type */}
                <span style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-primary)',
                  textTransform:'uppercase', letterSpacing:'0.3px', minWidth: 100,
                }}>{alert.threat_type || 'Unknown'}</span>
                {/* IPs */}
                <span style={{
                  fontSize: 10, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace',
                  flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                }}>
                  <span style={{ color: 'var(--accent-cyan)' }}>{alert.src_ip}</span>
                  <span style={{ color:'var(--text-dim)', margin:'0 4px' }}>→</span>
                  <span style={{ color: 'var(--accent-yellow)' }}>{alert.dst_ip}</span>
                </span>
                {/* Confidence */}
                <span style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
                  fontFamily: '"JetBrains Mono",monospace', minWidth: 36, textAlign:'right',
                }}>{alert.confidence?.toFixed(0) ?? '—'}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ThreatFeed;
