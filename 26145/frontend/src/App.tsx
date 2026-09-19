import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { WebSocketProvider, useWebSocketContext } from './context/WebSocketContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import LiveThreats from './pages/LiveThreats';
import NetworkMap from './pages/NetworkMap';
import Analytics from './pages/Analytics';
import AIAnalyzer from './pages/AIAnalyzer';
import AttackLab from './pages/AttackLab';
import DiodeLab from './pages/DiodeLab';
import { Sun, Moon } from 'lucide-react';

const SIDEBAR_WIDTH = 260;
const HUD_HEIGHT = 56;

const FULLSCREEN_PAGES = ['/attack', '/diode-lab'];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // All hooks must be at the top — no early returns before them
  const location = useLocation();
  const { isConnected, flowsPerSec, alertCount } = useWebSocketContext();
  const { isDark, toggleTheme } = useTheme();
  const isFullscreen = FULLSCREEN_PAGES.includes(location.pathname);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [pageKey, setPageKey] = useState(0);
  const [fadeIn, setFadeIn] = useState(true);

  // Animate page transition on route change
  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => {
      setPageKey(k => k + 1);
      setFadeIn(true);
    }, 80);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Scroll to top on every route change
  useEffect(() => {
    const content = document.querySelector('.content-area');
    if (content) content.scrollTop = 0;
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

  if (isFullscreen) {
    return (
      <div className="app-shell">
        <main className="content-area fullscreen-page">
          <div className="content-inner" key={location.pathname} style={{
            opacity: 1,
            transform: 'none',
          }}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Sidebar — fixed width, always visible */}
      <Sidebar />

      {/* Main column: header + scrollable content */}
      <div className="app-main">
        {/* ── HUD Header ── */}
        <header
          className="hud-bar hud-bar-scanlines"
          style={{ height: HUD_HEIGHT }}
        >
          {/* Left: wordmark + subtitle */}
          <div className="hud-left">
            <div className="hud-wordmark">EKADHARA</div>
            <div className="hud-subtitle">
              <span className="hud-subtitle-project">PS-26145</span>
              <span className="hud-subtitle-sep">·</span>
              <span>NTRO · SIH26</span>
            </div>
          </div>

          {/* Right: telemetry + controls */}
          <div className="hud-right">
            {/* Connection status */}
            <div
              className={`hud-status-badge ${isConnected ? 'status-live' : 'status-demo'}`}
            >
              <span className="hud-status-dot live-pulse-dot" />
              <span className="hud-status-text">{isConnected ? 'LIVE' : 'DEMO'}</span>
            </div>

            <div className="hud-divider" />

            {/* Alert count */}
            <div className="hud-stat">
              <span className="hud-stat-label">Alerts</span>
              <span className="hud-stat-value">{alertCount}</span>
            </div>

            <div className="hud-divider" />

            {/* Throughput */}
            <div className="hud-stat">
              <span className="hud-stat-label">Throughput</span>
              <span className="hud-stat-value">{(flowsPerSec ?? 0).toFixed(0)}/s</span>
            </div>

            <div className="hud-divider" />

            {/* Diode indicator */}
            <div className="diode-badge">
              <span className="diode-dot" />
              Diode Read-Only
            </div>

            <div className="hud-divider" />

            {/* Clock */}
            <div className="hud-clock">
              <span className="hud-clock-date">{dateStr}</span>
              <span className="hud-clock-sep">|</span>
              <span className="hud-clock-time">{timeStr}</span>
            </div>

            {/* Theme toggle — remove before final submission */}
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* ── Scrollable Content ── */}
        <main className="content-area">
          <div className="content-inner" key={pageKey} style={{
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? 'translateY(0)' : 'translateY(4px)',
            transition: 'opacity 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 150ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}>
            {children}
          </div>
        </main>
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
    <Route path="/attack" element={<AttackLab />} />
    <Route path="/diode-lab" element={<DiodeLab />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App: React.FC = () => (
  <BrowserRouter>
    <ThemeProvider>
      <WebSocketProvider>
        <ErrorBoundary>
          <Layout>
            <AppContent />
          </Layout>
        </ErrorBoundary>
      </WebSocketProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
