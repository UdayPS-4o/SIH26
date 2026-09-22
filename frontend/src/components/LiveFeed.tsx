import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, ArrowRight } from 'lucide-react';
import { Alert } from '../types';

interface LiveFeedProps {
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

const LiveFeed: React.FC<LiveFeedProps> = ({ alerts, maxVisible = 50 }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visible = alerts.slice(0, maxVisible);

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 12px', borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap: 6 }}>
          <div style={{ width:5, height:5, borderRadius:'50%', background:'var(--accent-green)', boxShadow:'0 0 4px var(--accent-green)', animation:'hud-pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing:'1.5px', textTransform:'uppercase', color: 'var(--text-primary)' }}>Live Feed</span>
        </div>
        <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace' }}>{alerts.length} alerts</span>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding: '4px 0' }}>
        {visible.length === 0 ? (
          <div style={{ padding:'24px 16px', textAlign:'center', color: 'var(--text-dim)' }}>
            <Eye size={24} style={{ opacity: 0.4, marginBottom: 6 }} />
            <p style={{ fontSize: 11 }}>No threats detected</p>
          </div>
        ) : (
          visible.map((alert) => {
            const sc = severityConfig[alert.severity] || severityConfig.low;
            const isExp = expandedId === alert.id;
            return (
              <div key={alert.id} style={{
                display:'flex', alignItems:'center', gap: 8,
                padding: '5px 10px', borderBottom: '1px solid var(--border-color)18',
                cursor:'pointer', transition: 'background 0.15s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--table-hover-bg)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                onClick={() => setExpandedId(isExp ? null : alert.id)}
              >
                <span style={{ width:5, height:5, borderRadius:'50%', background: sc.c, flexShrink:0 }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)', textTransform:'uppercase', letterSpacing:'0.2px', minWidth: 64 }}>{alert.threat_type || '?'}</span>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {alert.src_ip} <span style={{ color:'var(--text-dim)' }}>→</span> {alert.dst_ip}
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: '"JetBrains Mono",monospace' }}>{alert.confidence?.toFixed(0) ?? '—'}%</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
