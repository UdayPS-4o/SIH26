import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert, Flow, Stats } from '../types';
import { useRealWebSocket, fetchStats, fetchAlerts, isBackendOnline } from '../lib/realBackend';

interface WebSocketContextType {
  alerts: Alert[];
  flows: Flow[];
  stats: Stats | null;
  isConnected: boolean;
  connectionStatus: string;
  flowsPerSec: number;
  alertCount: number;
  backendOnline: boolean;
}

const WebSocketContext = createContext<WebSocketContextType>({
  alerts: [],
  flows: [],
  stats: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  flowsPerSec: 0,
  alertCount: 0,
  backendOnline: false,
});

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [backendOnline, setBackendOnline] = useState(false);

  const handleAlert = useCallback((alert: Alert) => {
    // Handled by useRealWebSocket internally via its state
  }, []);

  const wsState = useRealWebSocket(handleAlert);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const online = await fetchStats().then(() => true).catch(() => false);
        if (mounted) setBackendOnline(online);
      } catch { /* offline mode */ }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        alerts: wsState.alerts,
        flows: wsState.flows,
        stats: wsState.stats,
        isConnected: wsState.isConnected,
        connectionStatus: wsState.connectionStatus,
        flowsPerSec: wsState.flowsPerSec,
        alertCount: wsState.alertCount,
        backendOnline,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);
