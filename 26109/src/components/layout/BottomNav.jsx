import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Beef, BellRing, Network, SlidersHorizontal } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

const items = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'nav.dashboard' },
  { to: '/animals', icon: Beef, label: 'nav.animals' },
  { to: '/alerts', icon: BellRing, label: 'nav.alerts' },
  { to: '/herd', icon: Network, label: 'nav.herd' },
  { to: '/simulator', icon: SlidersHorizontal, label: 'nav.simulator' },
]

export default function BottomNav() {
  const { t } = useI18n()
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-gray-200 bg-white lg:hidden">
      {items.map((it) => {
        const Icon = it.icon
        return (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium ${
                isActive ? 'text-brand-700' : 'text-gray-400'
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
