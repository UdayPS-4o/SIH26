import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider, useWebSocketContext } from './context/WebSocketContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import LiveThreats from './pages/LiveThreats';
import NetworkMap from './pages/NetworkMap';
import Analytics from './pages/Analytics';
import AIAnalyzer from './pages/AIAnalyzer';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isConnected, connectionStatus, flowsPerSec, alertCount } = useWebSocketContext();

  const pageTitles: Record<string, string> = {
    '/': 'Dashboard',
    '/live-threats': 'Live Threats',
    '/network-map': 'Network Map',
    '/analytics': 'Analytics',
    '/ai-analyzer': 'AI Analyzer',
  };

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300
          ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
        `}
      >
        <Header
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          flowsPerSec={flowsPerSec}
          alertCount={alertCount}
          timeWindow="15m"
          onTimeWindowChange={() => {}}
          pageTitle={pageTitles[window.location.pathname] || 'Dashboard'}
        />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { alerts, flows } = useWebSocketContext();

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/live-threats" element={<LiveThreats />} />
      <Route path="/network-map" element={<NetworkMap />} />
      <Route path="/analytics" element={<Analytics darkMode={true} />} />
      <Route path="/ai-analyzer" element={<AIAnalyzer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => (
  <BrowserRouter>
    <WebSocketProvider>
      <Layout>
        <AppContent />
      </Layout>
    </WebSocketProvider>
  </BrowserRouter>
);

export default App;
