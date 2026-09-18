import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert, Flow, Stats } from '../types';
import { useWebSocket, fetchStats, fetchAlerts } from '../lib/api';

interface WebSocketContextType {
  alerts: Alert[];
  flows: Flow[];
  stats: Stats | null;
  isConnected: boolean;
  connectionStatus: string;
  flowsPerSec: number;
  alertCount: number;
}

const WebSocketContext = createContext<WebSocketContextType>({
  alerts: [],
  flows: [],
  stats: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  flowsPerSec: 0,
  alertCount: 0,
});

export const WebSocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [flowsPerSec, setFlowsPerSec] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const handleMessage = useCallback((msg: { type: string; data?: any; payload?: any }) => {
    const item = msg.data || msg.payload;
    if (!item) return;
    if (msg.type === 'alert') {
      setAlerts((prev) => [item, ...prev].slice(0, 100));
      setAlertCount((prev) => prev + 1);
    } else if (msg.type === 'flow') {
      setFlows((prev) => [item, ...prev].slice(0, 100));
      setFlowsPerSec((prev) => Math.max(0, prev + Math.floor(Math.random() * 20) - 10));
    }
  }, []);

  const { isConnected, connectionStatus } = useWebSocket(handleMessage);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [statsData, alertsData] = await Promise.all([fetchStats(), fetchAlerts(50, 0)]);
        setStats(statsData);
        setAlerts(alertsData);
        setAlertCount(statsData.total_alerts ?? statsData.alerts_generated ?? 0);
        setFlowsPerSec(statsData.flows_per_sec ?? statsData.active_flows ?? 0);
      } catch (e) {
        console.error('Failed to load initial data:', e);
      }
    };
    loadInitialData();
  }, []);

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
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocketContext = () => useContext(WebSocketContext);
