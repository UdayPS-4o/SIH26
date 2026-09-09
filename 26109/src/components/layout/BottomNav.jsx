import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Beef, BellRing, BarChart3, FlaskConical } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/animals', icon: Beef, label: 'nav.animals' },
  { to: '/alerts', icon: BellRing, label: 'nav.alerts' },
  { to: '/analytics', icon: BarChart3, label: 'nav.analytics' },
  { to: '/simulator', icon: FlaskConical, label: 'nav.simulator' },
]

export default function BottomNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-sand-200 bg-white dark:border-barn-800 dark:bg-barn-950/95 backdrop-blur lg:hidden">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-honey-600 dark:text-honey-400' : 'text-sand-400 dark:text-sand-500'
              }`
            }
          >
            <Icon size={19} />
            {t(it.label)}
          </NavLink>
        )
      })}
    </nav>
  )
}
