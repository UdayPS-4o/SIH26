import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Search, 
  GitCompare, 
  FileCheck2, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Zap,
  ClipboardList,
  Hash,
  Upload
} from 'lucide-react'
import { useDemoEngine } from '@/store/demo'

import ThemeToggle from '@/components/ThemeToggle'

export default function Sidebar() {
  const { matches, sources, logout } = useDemoEngine()
  const pendingCount = matches.filter(m => m.status === 'pending').length

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', badge: null, badgeAlert: false },
    { to: '/materials', icon: Search, label: 'Material Explorer', badge: null, badgeAlert: false },
    { to: '/matching', icon: GitCompare, label: 'AI Matching Matrix', badge: `${matches.length}`, badgeAlert: false },
    { to: '/reviews', icon: FileCheck2, label: 'Review Queue', badge: pendingCount > 0 ? `${pendingCount}` : null, badgeAlert: pendingCount > 0 },
    { to: '/analytics', icon: BarChart3, label: 'Analytics & Savings', badge: null, badgeAlert: false },
    { to: '/admin', icon: Settings, label: 'CPSE Connectors', badge: null, badgeAlert: false },
  ]

  const pipelineItems = [
    { to: '/upload',    icon: Upload,        label: 'Upload CSV Data', badge: 'NEW', badgeAlert: true },
    { to: '/normalize', icon: Zap,           label: 'Normalization', badge: null, badgeAlert: false },
    { to: '/audit',     icon: ClipboardList, label: 'Audit Trail',   badge: null, badgeAlert: false },
    { to: '/registry',  icon: Hash,          label: 'CNMC Registry', badge: null, badgeAlert: false },
  ]

  return (
    <aside className="w-64 shrink-0 h-screen flex flex-col bg-dark-900 border-r border-dark-700 select-none z-30 relative shadow-sm">
      {/* Brand Header */}
      <div className="p-4 border-b border-dark-700 bg-dark-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-blue-500/20 ring-1 ring-white/20">
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-extrabold text-dark-100 tracking-wider">NUMMF</h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-500 font-mono font-semibold border border-blue-500/20">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-dark-400 truncate tracking-tight mt-0.5">National Unified Master</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-dark-500 uppercase tracking-wider font-sans">
          Main Navigation
        </div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs font-bold'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-850 font-medium border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    size={17}
                    className={`transition-colors ${isActive ? 'text-blue-500' : 'text-dark-400 group-hover:text-dark-100'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      item.badgeAlert
                        ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30 animate-pulse'
                        : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Pipeline Tools Section */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-dark-500 uppercase tracking-wider font-sans">
          Pipeline Tools
        </div>
        {pipelineItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all duration-150 group ${
                isActive
                  ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20 shadow-xs font-bold'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-850 font-medium border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-3">
                  <item.icon
                    size={17}
                    className={`transition-colors ${isActive ? 'text-blue-500' : 'text-dark-400 group-hover:text-dark-100'}`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* CPSE Live Adapters Section */}
        <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-dark-500 uppercase tracking-wider font-sans">
          Connected CPSE Nodes
        </div>
        <div className="space-y-1.5 px-1">
          {sources.map(s => (
            <div
              key={s.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-dark-850 border border-dark-700 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{s.icon}</span>
                <span className="text-dark-100 font-semibold">{s.short}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-dark-400">{s.system.split(' ')[0]}</span>
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    s.status === 'connected'
                      ? 'bg-emerald-500'
                      : s.status === 'importing'
                      ? 'bg-blue-500 animate-ping'
                      : 'bg-dark-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User & Ministry Footer */}
      <div className="p-3 border-t border-dark-700 bg-dark-900 space-y-2">
        <ThemeToggle variant="pill" className="w-full" />
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-dark-850 border border-dark-700">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-xs shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-dark-100 truncate">Govt. of India</div>
            <div className="text-[10px] text-emerald-500 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Admin Officer
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-dark-400 hover:text-red-500 hover:bg-dark-800 rounded-lg transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </div>
        <div className="text-center">
          <span className="text-[9px] text-dark-500 font-mono tracking-tighter">
            Smart India Hackathon 2026 · PS #26099
          </span>
        </div>
      </div>
    </aside>
  )
}
