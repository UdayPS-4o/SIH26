import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShieldAlert,
  Network,
  Brain,
  Crosshair,
  Radar,
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, key: 'dash' },
  { label: 'Live Threats', path: '/live-threats', icon: ShieldAlert, key: 'threats', badge: 'LIVE' },
  { label: 'Network Map', path: '/network-map', icon: Network, key: 'netmap' },
  { label: 'AI Analyzer', path: '/ai-analyzer', icon: Brain, key: 'ai' },
  { label: 'Attack Lab', path: '/attack', icon: Crosshair, key: 'attack' },
  { label: 'Diode Lab', path: '/diode-lab', icon: Radar, key: 'diode' },
];

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

        {/* ── Animated Data Diode SVG ─────────────────────────────────── */}
        <div style={{ marginTop: '12px', padding: '0 4px' }}>
          <svg width="120" height="24" viewBox="0 0 120 24" fill="none" style={{ display: 'block' }}>
            {/* Left packets (benign, cyan) */}
            <circle cx="6" cy="8" r="2.5" fill="var(--accent-cyan)" opacity="0.9" className="diode-dot-clear" style={{ animationDelay: '0s' }} />
            <circle cx="14" cy="16" r="2" fill="var(--accent-cyan)" opacity="0.7" className="diode-dot-clear" style={{ animationDelay: '0.8s' }} />
            <circle cx="4" cy="18" r="1.5" fill="var(--accent-cyan)" opacity="0.5" className="diode-dot-clear" style={{ animationDelay: '1.6s' }} />

            {/* Attack packets (red, slower) */}
            <circle cx="10" cy="12" r="2" fill="var(--accent-red)" opacity="0.8" className="diode-dot-attack" style={{ animationDelay: '0.4s' }} />
            <circle cx="2" cy="14" r="1.5" fill="var(--accent-red)" opacity="0.6" className="diode-dot-attack" style={{ animationDelay: '2s' }} />

            {/* Diode symbol */}
            <g transform="translate(44, 12)">
              {/* Triangle */}
              <polygon points="-6,-6 4,0 -6,6" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" className="diode-triangle-pulse" style={{ color: 'var(--accent-cyan)' }} />
              {/* Bar */}
              <line x1="6" y1="-7" x2="6" y2="7" stroke="var(--accent-cyan)" strokeWidth="2" opacity="0.9" />
              {/* IN label */}
              <text x="-14" y="-9" textAnchor="start" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600">IN</text>
              {/* OUT label */}
              <text x="10" y="-9" textAnchor="start" fill="var(--text-muted)" fontSize="7" fontFamily="var(--font-mono, monospace)" fontWeight="600">OUT</text>
            </g>

            {/* Right packets (benign, cyan) */}
            <circle cx="78" cy="8" r="2.5" fill="var(--accent-cyan)" opacity="0.9" className="diode-dot-clear" style={{ animationDelay: '0.5s' }} />
            <circle cx="86" cy="16" r="2" fill="var(--accent-cyan)" opacity="0.7" className="diode-dot-clear" style={{ animationDelay: '1.3s' }} />
            <circle cx="74" cy="18" r="1.5" fill="var(--accent-cyan)" opacity="0.5" className="diode-dot-clear" style={{ animationDelay: '2.1s' }} />

            {/* Right packets (attack, red) */}
            <circle cx="82" cy="12" r="2" fill="var(--accent-red)" opacity="0.7" className="diode-dot-attack" style={{ animationDelay: '1s' }} />
            <circle cx="90" cy="8" r="1.5" fill="var(--accent-red)" opacity="0.5" className="diode-dot-attack" style={{ animationDelay: '2.4s' }} />
          </svg>
        </div>
      </div>

      {/* ── Diode Status Section ────────────────────────────────────────── */}
      <div style={{
        padding: '8px 14px 12px',
        margin: '0 10px',
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <div className="sidebar-section-label" style={{ padding: 0, marginBottom: '8px' }}>DIODE STATUS</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'var(--font-mono, monospace)', fontSize: '9px', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
          }}>
            <span style={{ color: 'var(--text-secondary)' }}>INBOUND</span>
            <svg width="20" height="10" viewBox="0 0 20 10" fill="none" style={{ opacity: 0.5 }}>
              <line x1="0" y1="5" x2="8" y2="5" stroke="var(--accent-cyan)" strokeWidth="1" strokeDasharray="2 1.5" />
              <polygon points="8,2 14,5 8,8" fill="var(--accent-cyan)" opacity="0.7" />
              <line x1="14" y1="5" x2="20" y2="5" stroke="var(--accent-cyan)" strokeWidth="1" />
            </svg>
            <span style={{ color: 'var(--accent-cyan)' }}>ENCLAVE</span>
          </div>
          <div style={{
            display: 'flex', gap: '6px', flexWrap: 'wrap',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 6px', borderRadius: '3px',
              background: 'var(--sev-critical-bg)',
              color: 'var(--accent-red)',
              border: '1px solid var(--sev-critical-border)',
            }}>NO RETURN PATH</span>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: '8px', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.06em',
              padding: '2px 6px', borderRadius: '3px',
              background: 'var(--sev-medium-bg)',
              color: 'var(--accent-orange)',
              border: '1px solid var(--sev-medium-border)',
            }}>NO DECRYPTION</span>
          </div>
        </div>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">MONITORING</div>

        {NAV_ITEMS.map(item => {
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
