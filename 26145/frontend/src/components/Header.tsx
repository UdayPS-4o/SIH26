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
    <header
      className="h-12 flex items-center justify-between px-5 border-b"
      style={{
        background: 'linear-gradient(180deg, #0a0f18 0%, #060a10 100%)',
        borderBottom: '1px solid rgba(0,212,255,0.12)',
      }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <h2
          className="text-sm font-bold tracking-wider"
          style={{
            fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace",
            color: '#00d4ff',
            textShadow: '0 0 8px rgba(0,212,255,0.3)',
            letterSpacing: '1.5px',
          }}
        >
          {pageTitle}
        </h2>
        <span style={{ color: 'rgba(0,212,255,0.25)' }}>|</span>
        <span
          className="text-xs"
          style={{
            color: '#5a7a9a',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
          }}
        >
          PS-26145 // NTRO // SIH26
        </span>
      </div>

      {/* Right: status indicators */}
      <div className="flex items-center gap-5">
        {/* Time window */}
        <select
          value={timeWindow}
          onChange={(e) => onTimeWindowChange(e.target.value)}
          className="text-xs py-1 pr-8"
          style={{
            background: 'rgba(0,212,255,0.03)',
            border: '1px solid rgba(0,212,255,0.1)',
            borderRadius: '3px',
            color: '#c8d6e5',
            fontFamily: "'JetBrains Mono','Fira Code',monospace",
            fontSize: '11px',
          }}
        >
          <option value="5m">LAST 5 MIN</option>
          <option value="15m">LAST 15 MIN</option>
          <option value="1h">LAST 1 HR</option>
          <option value="6h">LAST 6 HR</option>
          <option value="24h">LAST 24 HR</option>
        </select>

        {/* Throughput */}
        <div className="flex items-center gap-2 text-xs">
          <Activity size={14} style={{ color: '#00d4ff' }} />
          <span
            className="font-bold"
            style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", color: '#c8d6e5', fontSize: '12px' }}
          >
            {flowsPerSec}
          </span>
          <span style={{ color: '#5a7a9a', fontSize: '11px' }}>flows/s</span>
        </div>

        {/* Alert count */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded"
          style={{
            background: 'rgba(0,212,255,0.03)',
            border: '1px solid rgba(0,212,255,0.08)',
          }}
        >
          <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
          <span
            className="font-bold"
            style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace", color: '#c8d6e5', fontSize: '12px' }}
          >
            {alertCount}
          </span>
          <span style={{ color: '#5a7a9a', fontSize: '11px' }}>alerts</span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="relative">
                <Wifi size={14} style={{ color: '#00ff41' }} />
                <div
                  className="absolute rounded-full"
                  style={{
                    top: '-2px',
                    right: '-2px',
                    width: '6px',
                    height: '6px',
                    background: '#00ff41',
                    animation: 'live-pulse 1.5s ease-in-out infinite',
                    boxShadow: '0 0 4px rgba(0,255,65,0.5)',
                  }}
                />
              </div>
              <span
                className="text-xs font-bold tracking-wider"
                style={{ color: '#00ff41', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '11px' }}
              >
                CONNECTED
              </span>
            </>
          ) : (
            <>
              <WifiOff size={14} style={{ color: '#5a7a9a' }} />
              <span
                className="text-xs"
                style={{ color: '#5a7a9a', fontFamily: "'JetBrains Mono','Fira Code',monospace", fontSize: '11px' }}
              >
                DEMO MODE
              </span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
