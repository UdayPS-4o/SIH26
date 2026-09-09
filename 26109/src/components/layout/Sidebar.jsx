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
  Brain,
  ScanSearch,
} from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'
import { ALERTS } from '../../data/mockData'
import logoMark from '../../assets/logo-mark.svg'
import pasture from '../../assets/sidebar-img.jpg'

const openAlerts = ALERTS.filter((a) => a.status === 'open').length

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/animals', icon: Beef, label: 'nav.animals' },
  { to: '/alerts', icon: BellRing, label: 'nav.alerts', badge: openAlerts },
  { to: '/herd', icon: Network, label: 'nav.herd' },
  { to: '/milk-quality', icon: Droplets, label: 'nav.milk' },
  { to: '/environment', icon: CloudSun, label: 'nav.environment' },
  { to: '/worker-hygiene', icon: ClipboardCheck, label: 'nav.workerHygiene' },
  { to: '/simulator', icon: FlaskConical, label: 'nav.simulator' },
  { to: '/analytics', icon: FileBarChart2, label: 'nav.analytics' },
  { to: '/detection', icon: ScanSearch, label: 'nav.detection' },
  { to: '/reports', icon: FileBarChart2, label: 'nav.reports' },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { t } = useI18n()
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-barn-900 via-barn-900 to-barn-950 text-sand-300 transition-transform dark:from-barn-950 dark:to-black lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="relative flex items-center gap-3 px-5 pb-4 pt-5">
          <div className="relative">
            <img src={logoMark} alt="Gaurogya Setu" className="h-11 w-11 shrink-0 relative z-10" />
            <div className="absolute inset-0 h-11 w-11 rounded-full bg-honey-400/30 blur-md" />
          </div>
          <div className="leading-tight">
            <div className="text-lg font-bold text-white">
              Gaurogya <span className="text-ai">Setu</span>
            </div>
            <div className="text-[10px] tracking-wide text-sand-400">
              AI-Powered Herd Health Intelligence
            </div>
          </div>
          <button className="ml-auto text-sand-400 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* AI Badge */}
        <div className="mx-4 mb-3 rounded-lg border border-honey-400/30 bg-honey-400/10 px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-honey-300">100% AI Powered</p>
          <p className="mt-0.5 text-[10px] text-sand-400 leading-relaxed">Prediction · Prevention · Analysis · Detection · Suggestions</p>
        </div>

        {/* Nav */}
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-honey-500 to-honey-600 text-white shadow-lg shadow-honey-500/30'
                      : 'text-sand-300 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-white' : 'text-sand-400 group-hover:text-honey-400'} />
                    <span className="flex-1">{t(item.label)}</span>
                    {item.badge ? (
                      <span className="grid h-5 min-w-[20px] place-items-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 pb-4 pt-2">
          <div className="border-t border-sand-700/50 pt-3">
            <p className="text-[10px] text-sand-500">Smart Dairy Intelligence</p>
            <p className="text-[10px] text-honey-500 mt-0.5">Empowering Farmers with AI</p>
          </div>
        </div>
      </aside>
    </>
  )
}
