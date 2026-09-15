import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Shield } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <span className="text-lg">📊</span> },
  { label: 'Live Threats', path: '/live-threats', icon: <span className="text-lg">⚡</span> },
  { label: 'Network Map', path: '/network-map', icon: <span className="text-lg">🌐</span> },
  { label: 'Analytics', path: '/analytics', icon: <span className="text-lg">📈</span> },
  { label: 'AI Analyzer', path: '/ai-analyzer', icon: <span className="text-lg">🤖</span> },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggleCollapse}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          bg-navy-800 border-r border-slate-800
          transition-all duration-300 ease-in-out
          ${isCollapsed ? '-translate-x-full lg:translate-x-0 lg:w-16' : 'translate-x-0 w-64'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-800">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Shield className="text-brand-blue" size={28} />
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Ekadhara</h1>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Threat Detection</p>
              </div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-white transition-colors lg:hidden"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-150 group
                  ${isActive
                    ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/20'
                    : 'text-slate-400 hover:text-white hover:bg-navy-700 border border-transparent'
                  }
                  ${isCollapsed ? 'lg:justify-center' : ''}
                `}
              >
                <span className={isActive ? 'text-brand-blue' : 'text-slate-500 group-hover:text-white'}>
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-slate-800">
          <p className="text-[10px] text-slate-500 text-center px-3">
            {!isCollapsed ? 'v1.0 — SIH26' : 'v1.0'}
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
