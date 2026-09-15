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

const CYAN = '#00d4ff';
const BG = '#060a10';
const MUTED = '#5a7a9a';
const TEXT = '#c8d6e5';
const TEXT_MUTED = '#6a7f96';
const BORDER = 'rgba(0, 212, 255, 0.12)';
const HOVER_BG = 'rgba(0, 212, 255, 0.05)';

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
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            zIndex: 200,
          }}
        />
      )}

      <aside
        style={{
          width: 220,
          minWidth: 220,
          height: '100vh',
          background: BG,
          borderRight: `1px solid ${BORDER}`,
          color: TEXT,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Courier New', monospace",
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 300,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logo Area */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background: `${CYAN}10`,
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: CYAN,
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{
                fontSize: 14,
                fontWeight: 700,
                color: CYAN,
                letterSpacing: '2px',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.2,
              }}>
                WATCHTOWER
              </div>
              <div style={{
                fontSize: 10,
                color: `${CYAN}80`,
                letterSpacing: '0.5px',
                fontFamily: "'JetBrains Mono', monospace",
                marginTop: 1,
              }}>
                v2.1.0 — SIH26
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {/* Section label */}
          <div style={{
            padding: '12px 16px 6px',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '3px',
            color: MUTED,
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}>
            PLATFORM
          </div>

          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  margin: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? CYAN : TEXT,
                  background: isActive ? `${CYAN}12` : 'transparent',
                  borderLeft: isActive ? `3px solid ${CYAN}` : '3px solid transparent',
                  borderRight: `1px solid transparent`,
                  borderTop: `1px solid transparent`,
                  borderBottom: `1px solid transparent`,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = HOVER_BG;
                    e.currentTarget.style.boxShadow = `0 0 12px ${CYAN}15`;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <Icon
                  size={16}
                  color={isActive ? CYAN : `${TEXT_MUTED}`}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span style={{ flex: 1, letterSpacing: '0.3px' }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 3,
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    letterSpacing: '0.5px',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Problem Statement Footer */}
        <div style={{
          padding: 12,
          borderTop: `1px solid ${BORDER}`,
        }}>
          <div style={{
            padding: '12px 14px',
            background: `${CYAN}06`,
            borderRadius: 6,
            border: `1px solid ${BORDER}`,
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 4, letterSpacing: '0.5px' }}>
              &gt; PROBLEM STATEMENT
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>
              PS-26145 · NTRO
            </div>
            <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2 }}>
              Smart India Hackathon 2026
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
