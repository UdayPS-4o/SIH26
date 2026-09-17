import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { WebSocketProvider, useWebSocketContext } from './context/WebSocketContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import LiveThreats from './pages/LiveThreats';
import NetworkMap from './pages/NetworkMap';
import Analytics from './pages/Analytics';
import AIAnalyzer from './pages/AIAnalyzer';
import MaterialsPage from './pages/MaterialsPage';
import ActivityPage from './pages/ActivityPage';
import IntegrationPage from './pages/IntegrationPage';
import AdminPage from './pages/AdminPage';
import MatchPage from './pages/MatchPage';
import AttackPanel from './components/AttackPanel';
import { ShieldAlert } from 'lucide-react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected, flowsPerSec, alertCount } = useWebSocketContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = currentTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="terminal-wrapper" style={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar — always visible, fixed position */}
      <Sidebar isOpen={true} onClose={() => {}} />

      {/* Main content area */}
      <div
        className="terminal-main"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          marginLeft: 220,
          height: '100vh',
          overflowY: 'auto',
        }}
      >
        {/* HUD HEADER BAR */}
        <div className="hud-bar">
          <div className="hud-title">
            <span className="hud-title-icon">
              <ShieldAlert size={14} />
            </span>
            ◈ WATCHTOWER
          </div>

          <div className="hud-divider" />

          {/* Project info */}
          <div
            className="hud-subtitle"
            style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              PS-26145
            </span>
            <span className="hud-subtitle-sep" />
            <span>NTRO · SIH26</span>
          </div>

          <div className="hud-spacer" />

          {/* Status indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="hud-stat">
              <span className="hud-stat-label">STATUS</span>
              <span
                className="hud-live-text"
                style={{
                  color: isConnected ? 'var(--accent-green)' : '#f59e0b',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {isConnected ? 'LIVE' : 'DEMO'}
              </span>
              <span
                className="hud-status-dot"
                style={{
                  background: isConnected ? 'var(--accent-green)' : '#f59e0b',
                  boxShadow: isConnected
                    ? '0 0 8px rgba(0,255,65,0.5)'
                    : '0 0 8px rgba(245,158,11,0.5)',
                }}
              />
            </div>

            <div className="hud-divider" />

            <div className="hud-stat">
              <span className="hud-stat-label">ALERTS</span>
              <span className="hud-stat-value">{alertCount}</span>
            </div>

            <div className="hud-stat">
              <span className="hud-stat-label">THROUGHPUT</span>
              <span className="hud-stat-value">{(flowsPerSec ?? 0).toFixed(0)}/s</span>
            </div>

            <div className="hud-divider" />

            <div className="diode-badge">
              <span className="diode-dot" />
              DIODE READ-ONLY
            </div>

            <div className="hud-divider" />

            <div className="hud-clock">
              <span className="hud-clock-date">{dateStr}</span>
              <span className="hud-clock-sep">|</span>
              <span className="hud-clock-time">{timeStr}</span>
            </div>
          </div>
        </div>

        {/* CONTENT AREA */}
        <main className="terminal-content">{children}</main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => (
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/live-threats" element={<LiveThreats />} />
    <Route path="/network-map" element={<NetworkMap />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/ai-analyzer" element={<AIAnalyzer />} />
    <Route path="/materials" element={<MaterialsPage />} />
    <Route path="/materials/:id" element={<MaterialsPage />} />
    <Route path="/activity" element={<ActivityPage />} />
    <Route path="/integrations" element={<IntegrationPage />} />
    <Route path="/admin" element={<AdminPage />} />
    <Route path="/match" element={<MatchPage />} />
    <Route path="/attack" element={<AttackPanel />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

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
