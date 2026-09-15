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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isConnected, flowsPerSec, alertCount } = useWebSocketContext();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('en-US', { hour12: false });
  const dateStr = currentTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* Top Bar */}
        <div className="hud-bar">
          <div className="hud-title">
            <div className="hud-title-icon">
              <ShieldAlert size={14} />
            </div>
            EKADHARA
          </div>

          <div className="hud-divider" />

          <div style={{
            fontSize: 13,
            color: 'var(--text-secondary)',
            fontWeight: 500,
          }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>PS-26145</span>
            <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>·</span>
            <span>NTRO — AI-Based Cyber Threat Detection</span>
          </div>

          <div className="hud-spacer" />

          {/* Status + Stats */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="hud-stat">
              <span className="hud-stat-label">Status</span>
              <span style={{
                color: isConnected ? 'var(--green-600)' : 'var(--amber-500)',
                fontSize: 12,
                fontWeight: 600,
              }}>
                {isConnected ? 'Live' : 'Demo'}
              </span>
              <span className="hud-status-dot" style={{
                background: isConnected ? 'var(--green-500)' : 'var(--amber-500)',
                boxShadow: isConnected ? '0 0 6px rgba(16,185,129,0.4)' : '0 0 6px rgba(245,158,11,0.4)',
              }} />
            </div>

            <div className="hud-stat">
              <span className="hud-stat-label">Alerts</span>
              <span className="hud-stat-value">{alertCount}</span>
            </div>

            <div className="hud-stat">
              <span className="hud-stat-label">Throughput</span>
              <span className="hud-stat-value">{flowsPerSec.toFixed(0)}/s</span>
            </div>
          </div>

          <div className="hud-divider" />

          {/* Diode badge */}
          <div className="diode-badge">
            <span className="diode-dot" />
            Diode Read-Only
          </div>

          <div className="hud-divider" />

          <span className="hud-time">{dateStr} {timeStr}</span>
        </div>

        {/* Content */}
        <main className="content-area">
          {children}
        </main>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
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
