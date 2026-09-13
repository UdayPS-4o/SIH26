import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, ArrowRight } from 'lucide-react';
import { Alert } from '../types';

interface LiveFeedProps {
  alerts: Alert[];
  maxVisible?: number;
}

const severityConfig = {
  low: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', label: 'LOW' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', label: 'MEDIUM' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', label: 'HIGH' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', label: 'CRITICAL' },
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const LiveFeed: React.FC<LiveFeedProps> = ({ alerts, maxVisible = 50 }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleAlerts = alerts.slice(0, maxVisible);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-brand-amber" />
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">Live Feed</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-brand-green rounded-full animate-pulse-dot" />
          <span className="text-[10px] text-slate-400 font-mono">{alerts.length} alerts</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1.5">
        {visibleAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-8">
            <Eye size={32} className="mb-2 opacity-50" />
            <p className="text-xs">No threats detected</p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                className="animate-slide-in bg-navy-700/30 border border-slate-700/50 rounded-md p-2.5 hover:border-slate-600 transition-all duration-150"
              >
                <div className="flex items-start gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${config.bg} ${config.text} border ${config.border} whitespace-nowrap shrink-0`}>
                    {config.label}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white truncate">{alert.threat_type}</span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className="text-slate-500 hover:text-white transition-colors shrink-0 ml-2"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] font-mono mb-1.5">
                      <span className="text-brand-blue truncate">{alert.src_ip}</span>
                      <ArrowRight size={8} className="text-slate-600 shrink-0" />
                      <span className="text-brand-amber truncate">{alert.dst_ip}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            alert.confidence > 80 ? 'bg-brand-red' :
                            alert.confidence > 60 ? 'bg-brand-amber' : 'bg-brand-green'
                          }`}
                          style={{ width: `${alert.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono w-8 text-right">{alert.confidence}%</span>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-700/50 grid grid-cols-2 gap-1.5 animate-slide-in">
                        {Object.entries(alert.evidence).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-[10px] text-slate-300 font-mono truncate ml-2">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveFeed;
