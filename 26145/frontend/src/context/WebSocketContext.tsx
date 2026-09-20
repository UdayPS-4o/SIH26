import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Alert, Flow, Stats } from '../types';
import { useRealWebSocket, fetchStats, fetchAlerts, fetchFlows, fetchHealth, isBackendOnline as checkBackendOnline } from '../lib/realBackend';

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [flowsPerSec, setFlowsPerSec] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const pollRef = useRef<number | null>(null);

  // REST API polling as reliable fallback
  useEffect(() => {
    let mounted = true;
    let lastAlertId = '';

    const poll = async () => {
      try {
        const s = await fetchStats();
        if (!mounted) return;
        setStats(s);
        setFlowsPerSec(s.flows_per_sec || 0);
        setAlertCount(s.total_alerts || 0);
        if (!backendOnline) setBackendOnline(true);
        setIsConnected(true);
        setConnectionStatus('connected');
      } catch {
        if (mounted) {
          setBackendOnline(false);
          setIsConnected(false);
          setConnectionStatus('disconnected');
        }
      }

      try {
        const newAlerts = await fetchAlerts(20, 0);
        if (!mounted) return;
        setAlerts(prev => {
          const combined = [...newAlerts.filter(a => a.id !== lastAlertId), ...prev];
          const unique = combined.filter((a, i, arr) => arr.findIndex(b => b.id === a.id) === i);
          if (newAlerts.length > 0) lastAlertId = newAlerts[0].id;
          return unique.slice(0, 200);
        });
        setAlertCount(prev => {
          const maxCount = newAlerts.length > 0 ? Math.max(prev, newAlerts[0].timestamp ? 1 : 0) : prev;
          return maxCount;
        });
      } catch { /* ignore alert fetch errors */ }

      try {
        const newFlows = await fetchFlows(20);
        if (!mounted) return;
        setFlows(prev => {
          const existingIds = new Set(prev.slice(0, 20).map(f => f.id));
          const unique = newFlows.filter(f => !existingIds.has(f.id));
          return [...unique, ...prev].slice(0, 200);
        });
      } catch { /* ignore flow fetch errors */ }
    };

    // Initial poll
    poll();
    // Poll every 2 seconds
    pollRef.current = window.setInterval(poll, 2000);

    return () => {
      mounted = false;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [backendOnline]);

  // Also try WebSocket connection
  const wsState = useRealWebSocket();

  useEffect(() => {
    if (wsState.isConnected) {
      setIsConnected(true);
      setConnectionStatus('connected');
      if (wsState.stats) setStats(wsState.stats);
      if (wsState.alerts.length > 0) setAlerts(wsState.alerts);
      if (wsState.flows.length > 0) setFlows(wsState.flows);
      setFlowsPerSec(wsState.flowsPerSec);
      setAlertCount(wsState.alertCount);
      if (!backendOnline) setBackendOnline(true);
    }
  }, [wsState.isConnected, wsState.stats, wsState.alerts, wsState.flows, wsState.flowsPerSec, wsState.alertCount, backendOnline]);

  return (
    <WebSocketContext.Provider
      value={{
        alerts,
        flows,
        stats,
        isConnected,
        connectionStatus,
        flowsPerSec,
        alertCount,
        backendOnline,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);
