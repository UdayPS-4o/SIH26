import { Fragment } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  BarChart3,
  Brain,
  FolderOpen,
  Activity,
  Plug,
  Settings,
  Shield,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, key: 'dash' },
  { label: 'Live Threats', path: '/live-threats', icon: ShieldAlert, key: 'threats', badge: 'LIVE' },
  { label: 'Network Map', path: '/network-map', icon: Network, key: 'netmap' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, key: 'analytics' },
  { label: 'AI Analyzer', path: '/ai-analyzer', icon: Brain, key: 'ai' },
  { label: 'Evidence', path: '/materials', icon: FolderOpen, key: 'materials' },
  { label: 'Activity Log', path: '/activity', icon: Activity, key: 'activity' },
  { label: 'Integrations', path: '/integrations', icon: Plug, key: 'integrations' },
  { label: 'Administration', path: '/admin', icon: Settings, key: 'admin' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  return (
    <Fragment>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            display: 'block',
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 299,
          }}
        />
      )}

      <aside
        className="sidebar"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.4)' : 'none',
        }}
      >
        {/* Logo Area */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <Shield size={18} strokeWidth={1.8} />
            </div>
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">WATCHTOWER</span>
              <span className="sidebar-version">v2.4 &middot; SIH26</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Platform</div>

          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.8} />
                </span>
                <span className="nav-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge nav-badge-live`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">OP</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Operator</div>
              <div className="sidebar-user-role">ENCLAVE · READ-ONLY</div>
            </div>
          </div>
        </div>
      </aside>
    </Fragment>
  );
};

export default Sidebar;
