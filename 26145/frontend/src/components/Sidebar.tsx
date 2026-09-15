import { useState, useEffect, useMemo, Fragment, useRef } from 'react';
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
  Zap,
  Search,
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
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 200,
          }}
        />
      )}

      <aside
        className="sidebar"
        style={{
          transform: isOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)' }}>
                EKADHARA
              </div>
              <div className="sidebar-version">v2.1.0 — SIH26</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-section" style={{ flex: 1, padding: '12px' }}>
          <div className="sidebar-section-label">Platform</div>
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: 'var(--red-600)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    letterSpacing: '0.5px',
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{
            padding: '12px',
            background: 'var(--bg-muted)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Problem Statement</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
              PS-26145 · NTRO
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Smart India Hackathon 2026
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
