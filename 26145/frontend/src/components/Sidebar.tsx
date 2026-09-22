import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  Brain,
  Radar,
  BarChart3,
  FileText,
  Clock,
  Settings,
  Plug,
} from 'lucide-react';

const MONITORING_ITEMS = [
  { label: 'Operations', path: '/', icon: LayoutDashboard, key: 'ops' },
  { label: 'Live Threats', path: '/live-threats', icon: ShieldAlert, key: 'threats', badge: 'LIVE' },
  { label: 'Network', path: '/network-map', icon: Network, key: 'netmap' },
  { label: 'AI Analyzer', path: '/ai-analyzer', icon: Brain, key: 'ai' },
  { label: 'Diode Lab', path: '/diode-lab', icon: Radar, key: 'diode' },
];

const PLATFORM_ITEMS = [
  { label: 'Analytics', path: '/analytics', icon: BarChart3, key: 'analytics' },
  { label: 'Materials', path: '/materials', icon: FileText, key: 'materials' },
  { label: 'Activity', path: '/activity', icon: Clock, key: 'activity' },
  { label: 'Settings', path: '/admin', icon: Settings, key: 'admin' },
  { label: 'Integrations', path: '/integrations', icon: Plug, key: 'integrations' },
];

const NAV_ITEMS = [...MONITORING_ITEMS, ...PLATFORM_ITEMS];

const Sidebar: React.FC<{ isOpen?: boolean }> = ({ isOpen: _isOpen }) => {
  const location = useLocation();

  return (
    <aside className="sidebar">
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">EKADHARA</span>
            <span className="sidebar-brand-sub">PS-26145 · NTRO</span>
          </div>
        </div>
        </div>

      <nav className="sidebar-nav">
        <div className="sidebar-section-label">MONITORING</div>
        {MONITORING_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
              </span>
              <span className="nav-label">{item.label}</span>
              {item.badge && (
                <span className="nav-badge nav-badge-live">{item.badge}</span>
              )}
            </Link>
          );
        })}

        <div className="sidebar-section-label">PLATFORM</div>
        {PLATFORM_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item${isActive ? ' active' : ''}`}
            >
              <span className="nav-icon">
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
              </span>
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-line" />
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontFamily: 'var(--font-mono, monospace)', fontSize: '10px',
          color: 'var(--text-secondary)', marginBottom: '4px',
        }}>
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: 'var(--accent-green)', boxShadow: '0 0 6px #22c55e',
            animation: 'wt-pulse-dot 1.5s ease-in-out infinite', flexShrink: 0,
          }} />
          <span style={{ color: 'var(--accent-green)', fontWeight: 600, letterSpacing: '0.08em' }}>LIVE</span>
        </div>
        <div className="sidebar-footer-sub" style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: '9px',
          color: 'var(--text-muted)', letterSpacing: '0.02em',
        }}>
          EKADHARA v3.2.1
        </div>
        <div className="sidebar-footer-sub" style={{
          fontFamily: 'var(--font-mono, monospace)', fontSize: '8px',
          color: 'var(--text-muted)', opacity: 0.7, marginTop: '2px',
        }}>
          PS-26145 · NTRO · SIH26
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
