import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Beef,
  BellRing,
  Network,
  Droplets,
  CloudSun,
  ClipboardCheck,
  FlaskConical,
  FileBarChart2,
  Settings,
  X,
  Sparkles,
  ScanSearch,
} from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'
import { ALERTS } from '../../data/mockData'
import logoMark from '../../assets/logo-mark.svg'
import pasture from '../../assets/sidebar-img.jpg'

const openAlerts = ALERTS.filter((a) => a.status === 'open').length

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard', feature: 'OVERVIEW' },
  { to: '/animals', icon: Beef, label: 'nav.animals', feature: 'MONITOR' },
  { to: '/alerts', icon: BellRing, label: 'nav.alerts', badge: openAlerts, feature: 'PREDICT' },
  { to: '/herd', icon: Network, label: 'nav.herd', feature: 'ANALYZE' },
  { to: '/milk-quality', icon: Droplets, label: 'nav.milk', feature: 'TRACK' },
  { to: '/environment', icon: CloudSun, label: 'nav.environment', feature: 'MONITOR' },
  { to: '/worker-hygiene', icon: ClipboardCheck, label: 'nav.workerHygiene', feature: 'ANALYZE' },
  { to: '/simulator', icon: FlaskConical, label: 'nav.simulator', feature: 'SIMULATE' },
  { to: '/analytics', icon: FileBarChart2, label: 'nav.analytics', feature: 'INSIGHTS' },
  { to: '/detection', icon: ScanSearch, label: 'nav.detection', feature: 'DETECT' },
  { to: '/reports', icon: FileBarChart2, label: 'nav.reports', feature: 'EXPORT' },
  { to: '/settings', icon: Settings, label: 'nav.settings', feature: 'CONFIG' },
]

const featureColors = {
  OVERVIEW: 'bg-ai/20 text-ai border-ai/30',
  MONITOR: 'bg-forest-500/20 text-forest-400 border-forest-500/30',
  PREDICT: 'bg-honey-500/20 text-honey-400 border-honey-500/30',
  ANALYZE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TRACK: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  SIMULATE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  INSIGHTS: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  DETECT: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  EXPORT: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  CONFIG: 'bg-sand-400/20 text-sand-400 border-sand-400/30',
}

const sidebarBadgeColors = {
  PREDICTION: 'var(--sidebar-badge-prediction, #f59e0b)',
  PREVENTION: 'var(--sidebar-badge-prevention, #22c55e)',
  ANALYSIS: 'var(--sidebar-badge-analysis, #3B9EFF)',
  DETECTION: 'var(--sidebar-badge-detection, #ef4444)',
  SUGGESTIONS: 'var(--sidebar-badge-suggestions, #a855f7)',
}

export default function Sidebar({ mobileOpen, onClose }) {
  const { t } = useI18n()

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b text-white transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: `linear-gradient(to bottom, var(--custom-sidebar-from, #14532d), var(--custom-sidebar-via, #14532d), var(--custom-sidebar-to, #78350f))`,
        }}
      >
        {/* Brand */}
        <div className="relative flex items-center gap-3 px-4 pb-3 pt-4">
          <div className="relative">
            <img src={logoMark} alt="Gaurogya Setu" className="h-10 w-10 shrink-0 relative z-10 drop-shadow-lg" />
            <div className="absolute -inset-1 rounded-full bg-honey-400/40 blur-md animate-pulse-soft" />
          </div>
          <div className="leading-tight">
            <div className="text-xl font-black tracking-tight" style={{ color: 'var(--sidebar-text, #f0fdf4)' }}>
              GAUROGYA <span className="text-honey-400">SETU</span>
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--sidebar-muted, #86efac)' }}>
              AI-Powered Dairy Intelligence
            </div>
          </div>
          <button className="ml-auto rounded-lg p-1.5 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu" style={{ color: 'var(--sidebar-muted, #86efac)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Feature Tags Banner */}
        <div className="mx-3 mb-3 rounded-xl border border-honey-400/30 bg-gradient-to-r from-honey-500/20 via-forest-500/10 to-ai/20 px-3 py-2.5">
          <div className="flex flex-wrap gap-1">
            {['PREDICTION', 'PREVENTION', 'ANALYSIS', 'DETECTION', 'SUGGESTIONS'].map((feat) => {
              const badgeColor = sidebarBadgeColors[feat] || '#f59e0b'
              return (
                <span key={feat} className="rounded-md px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase" style={{
                  backgroundColor: `${badgeColor}22`,
                  color: badgeColor,
                  border: `1px solid ${badgeColor}44`
                }}>
                  {feat}
                </span>
              )
            })}
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll flex-1 space-y-0.5 overflow-y-auto px-2.5 py-2">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
              >
                {({ isActive }) => (
                  <div className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all ${isActive ? 'text-white shadow-lg shadow-honey-500/40' : ''}`}
                    style={{ background: isActive ? 'linear-gradient(to right, var(--custom-sidebar-active, #f59e0b), #d97706)' : 'transparent' }}
                  >
                    <Icon size={17} className={isActive ? 'text-white' : 'text-honey-400 group-hover:text-honey-300'} />
                    <span className="flex-1" style={{ color: isActive ? '#fff' : 'var(--sidebar-text, #f0fdf4)' }}>{t(item.label)}</span>
                    <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black tracking-wider ${featureColors[item.feature] || 'bg-sand-400/20 text-sand-400 border-sand-400/30'}`}>
                      {item.feature}
                    </span>
                    {item.badge ? (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white shadow-lg shadow-red-500/40">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-3 pt-2">
          <div className="border-t border-forest-700/60 pt-2.5">
            <p className="text-[10px] font-bold text-honey-400">Empowering Farmers with AI</p>
            <p className="text-[9px] text-forest-400">Gaurogya Setu  |  SIH 2026</p>
          </div>
        </div>
      </aside>
    </>
  )
}
