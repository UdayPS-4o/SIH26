import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Beef,
  BellRing,
  Network,
  Droplets,
  CloudSun,
  FlaskConical,
  FileBarChart2,
  Settings,
  X,
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
  { to: '/simulator', icon: FlaskConical, label: 'nav.simulator' },
  { to: '/reports', icon: FileBarChart2, label: 'nav.reports' },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { t } = useI18n()
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-gray-900/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gradient-to-b from-navy-800 to-navy-950 text-slate-300 transition-transform lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 pb-4 pt-5">
          <img src={logoMark} alt="Gaurogya Setu" className="h-11 w-11 shrink-0" />
          <div className="leading-tight">
            <div className="text-lg font-bold text-white">
              Gaurogya <span className="text-ai">Setu</span>
            </div>
            <div className="text-[10px] tracking-wide text-slate-400">
              Healthy Animals&nbsp;|&nbsp;Safe Milk&nbsp;|&nbsp;Better Future
            </div>
          </div>
          <button className="ml-auto text-slate-400 lg:hidden" onClick={onClose} aria-label="Close menu">
            <X size={18} />
          </button>
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
                  `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1c6fd0] text-white shadow-lg shadow-[#1c6fd0]/30'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} />
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

        {/* Footer art */}
        <div className="relative mt-2">
          <p className="px-5 pb-2 font-script text-2xl leading-none text-emerald-300/90">
            Healthy Herd
            <br />
            Profitable Farm
          </p>
          <div
            className="h-28 w-full bg-cover bg-bottom"
            style={{ backgroundImage: `url(${pasture})` }}
          />
        </div>
      </aside>
    </>
  )
}
