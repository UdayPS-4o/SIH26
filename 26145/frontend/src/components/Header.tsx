import { Wifi, WifiOff, Activity, AlertTriangle, Clock } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  connectionStatus: string;
  flowsPerSec: number;
  alertCount: number;
  timeWindow: string;
  onTimeWindowChange: (window: string) => void;
  pageTitle: string;
}

const Header: React.FC<HeaderProps> = ({
  isConnected,
  connectionStatus,
  flowsPerSec,
  alertCount,
  timeWindow,
  onTimeWindowChange,
  pageTitle,
}) => {
  return (
    <header className="h-16 bg-navy-800/80 backdrop-blur-sm border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-white">{pageTitle}</h2>
        <span className="text-slate-500">/</span>
        <span className="text-sm text-slate-400">SIH26 - Problem 26145</span>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-6">
        {/* Time window selector */}
        <select
          value={timeWindow}
          onChange={(e) => onTimeWindowChange(e.target.value)}
          className="input text-xs py-1.5 pr-8"
        >
          <option value="5m">Last 5 minutes</option>
          <option value="15m">Last 15 minutes</option>
          <option value="1h">Last 1 hour</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
        </select>

        {/* Throughput */}
        <div className="flex items-center gap-2 text-sm">
          <Activity size={16} className="text-brand-green" />
          <span className="text-slate-300 font-mono text-xs">{flowsPerSec}</span>
          <span className="text-slate-500 text-xs">flows/s</span>
        </div>

        {/* Alert count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-700/50 rounded-lg border border-slate-700">
          <AlertTriangle size={16} className="text-brand-amber" />
          <span className="text-slate-300 font-mono text-xs font-semibold">{alertCount}</span>
          <span className="text-slate-500 text-xs">alerts</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="relative">
                <Wifi size={16} className="text-brand-green" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand-green rounded-full animate-pulse-dot" />
              </div>
              <span className="text-xs text-brand-green font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={16} className="text-slate-500" />
              <span className="text-xs text-slate-500">Demo Mode</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
