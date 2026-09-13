import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Eye, ArrowRight } from 'lucide-react';
import { Alert } from '../types';

interface ThreatFeedProps {
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

const ThreatFeed: React.FC<ThreatFeedProps> = ({ alerts, maxVisible = 50 }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const visibleAlerts = alerts.slice(0, maxVisible);

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle size={18} className="text-brand-amber" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Live Threat Feed</h3>
        </div>
        <span className="text-xs text-slate-400 font-mono">{alerts.length} total</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
        {visibleAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <Eye size={48} className="mb-3 opacity-50" />
            <p className="text-sm">No threats detected</p>
          </div>
        ) : (
          visibleAlerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const isExpanded = expandedId === alert.id;

            return (
              <div
                key={alert.id}
                className="animate-slide-in bg-navy-700/30 border border-slate-700/50 rounded-lg p-3 hover:border-slate-600 transition-all duration-150"
              >
                <div className="flex items-start gap-3">
                  {/* Severity badge */}
                  <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${config.bg} ${config.text} border ${config.border} whitespace-nowrap`}>
                    {config.label}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{alert.threat_type}</span>
                        <span className="text-xs text-slate-500 font-mono">{formatTime(alert.timestamp)}</span>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>

                    {/* IP addresses */}
                    <div className="flex items-center gap-2 text-xs font-mono mb-2">
                      <span className="text-brand-blue">{alert.src_ip}</span>
                      <ArrowRight size={10} className="text-slate-600" />
                      <span className="text-brand-amber">{alert.dst_ip}</span>
                    </div>

                    {/* Confidence bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-navy-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            alert.confidence > 80 ? 'bg-brand-red' :
                            alert.confidence > 60 ? 'bg-brand-amber' : 'bg-brand-green'
                          }`}
                          style={{ width: `${alert.confidence}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 font-mono w-10 text-right">{alert.confidence}%</span>
                    </div>
                  </div>
                </div>

                {/* Expanded evidence */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-2 gap-2 animate-slide-in">
                    {Object.entries(alert.evidence).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs text-slate-300 font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ThreatFeed;
