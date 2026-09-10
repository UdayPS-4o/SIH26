import { useState, useRef, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Check, Globe, Home, Users, MapPin, CalendarDays, Sun, Moon, Loader2 } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { FARMS, ALERTS, HERD_STATS } from '../../data/mockData'

const openAlerts = ALERTS.filter((a) => a.status === 'open')

function Dropdown({ button, children, align = 'right', width = 'w-56' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen((o) => !o)}>{button}</div>
      {open && (
        <div
          className={`absolute z-50 mt-2 ${width} overflow-hidden rounded-xl border border-sand-200 bg-white shadow-warm-lg dark:border-barn-800 dark:bg-barn-900`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

import { useAlerts } from '../../context/AlertContext.jsx'

export default function Topbar({ onMenu }) {
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const { isReviewed } = useAlerts()
  const [farm, setFarm] = useState(FARMS[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(t)
  }, [])

  const openAlerts = useMemo(
    () => ALERTS.filter((a) => a.status === 'open' && !isReviewed(a.id) && !isReviewed(a.animalId)),
    [isReviewed]
  )

  const todayStr = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }, [])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 sm:gap-3 sm:px-4 lg:px-6">
      <button className="shrink-0 text-gray-500 dark:text-gray-400 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <Dropdown
        align="left"
        button={
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:gap-2 sm:px-3">
            <Home size={15} className="shrink-0 text-brand-600" />
            <span className="max-w-[5rem] truncate font-semibold text-gray-800 dark:text-gray-100 sm:max-w-[9rem]">{farm}</span>
            <ChevronDown size={14} className="shrink-0 text-gray-400" />
          </button>
        }
      >
        {FARMS.map((f) => (
          <button
            key={f}
            onClick={() => setFarm(f)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {FARMS.map((f) => (
              <button
                key={f}
                onClick={() => setFarm(f)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-sand-50 dark:text-sand-200 dark:hover:bg-barn-800"
              >
                {f}
                {f === farm && <Check size={14} className="text-honey-600" />}
              </button>
            ))}
          </Dropdown>

          <div className="hidden items-center gap-1.5 text-xs text-sand-500 dark:text-sand-400 xl:flex">
            <Users size={14} className="text-sand-400" />
            {HERD_STATS.totalAnimals} {t('nav.animals')}
          </div>
          <div className="hidden items-center gap-1.5 text-xs text-sand-500 dark:text-sand-400 xl:flex">
            <MapPin size={14} className="text-sand-400" />
            Mathura, Uttar Pradesh
          </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300 md:flex">
          <CalendarDays size={15} className="text-gray-400" />
          {todayStr}
        </div>

        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        <Dropdown
          button={
            <button className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:gap-2 sm:px-3" aria-label="Language">
              <Globe size={15} className="shrink-0 text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-200 sm:hidden">{lang === 'en' ? 'EN' : 'हि'}</span>
              <span className="hidden font-medium text-gray-700 dark:text-gray-200 sm:inline">{lang === 'en' ? 'English' : 'हिन्दी'}</span>
              <ChevronDown size={14} className="shrink-0 text-gray-400" />
            </button>
          }
        >
          {[
            { code: 'en', label: 'English' },
            { code: 'hi', label: 'हिन्दी' },
          ].map((l) => (
            <button
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand-200 text-sand-500 hover:bg-sand-50 dark:border-barn-800 dark:text-sand-300 dark:hover:bg-barn-800"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <Dropdown
              button={
                <button className="flex items-center gap-1 rounded-lg border border-sand-200 px-2 py-2 text-sm hover:bg-sand-50 dark:border-barn-800 dark:hover:bg-barn-800 sm:gap-2 sm:px-2.5" aria-label="Language">
                  <Globe size={14} className="shrink-0 text-sand-400" />
                  <span className="font-semibold text-sand-700 dark:text-sand-200 sm:hidden">{lang === 'en' ? 'EN' : 'हि'}</span>
                  <span className="hidden font-semibold text-sand-700 dark:text-sand-200 sm:inline">{lang === 'en' ? 'EN' : 'हिन्दी'}</span>
                  <ChevronDown size={14} className="hidden shrink-0 text-sand-400 sm:block" />
                </button>
              }
            >
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी' },
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className="flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-sand-50 dark:text-sand-200 dark:hover:bg-barn-800"
                >
                  {l.label}
                  {lang === l.code && <Check size={14} className="text-honey-600" />}
                </button>
              ))}
            </Dropdown>

            <Dropdown
              width="w-80"
              button={
                <button className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-sand-200 text-sand-500 hover:bg-sand-50 dark:border-barn-800 dark:text-sand-300 dark:hover:bg-barn-800 bell-pulse" aria-label="Notifications">
                  <Bell size={16} />
                  <span className="absolute -right-1 -top-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-barn-900">3</span>
                </button>
              }
            >
              <div className="border-b border-sand-200 px-3 py-2.5 dark:border-barn-800">
                <p className="text-xs font-bold text-sand-900 dark:text-sand-100">Notifications</p>
                <p className="text-[11px] text-sand-400">3 unread alerts</p>
              </div>
              <div className="divide-y divide-sand-100 dark:divide-barn-800">
                <div className="px-3 py-2.5 hover:bg-sand-50 dark:hover:bg-barn-800">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <p className="text-xs font-medium text-sand-900 dark:text-sand-100">BUF-042: High risk detected (87%)</p>
                  </div>
                  <p className="mt-0.5 ml-3.5 text-[11px] text-sand-400">SCC rising rapidly - action required</p>
                </div>
                <div className="px-3 py-2.5 hover:bg-sand-50 dark:hover:bg-barn-800">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-honey-500" />
                    <p className="text-xs font-medium text-sand-900 dark:text-sand-100">Shed C humidity exceeds threshold</p>
                  </div>
                  <p className="mt-0.5 ml-3.5 text-[11px] text-sand-400">Humidity at 82% - ventilation check needed</p>
                </div>
                <div className="px-3 py-2.5 hover:bg-sand-50 dark:hover:bg-barn-800">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ai" />
                    <p className="text-xs font-medium text-sand-900 dark:text-sand-100">Vet visit scheduled for tomorrow 9AM</p>
                  </div>
                  <p className="mt-0.5 ml-3.5 text-[11px] text-sand-400">Dr. Sharma - Shed B inspection</p>
                </div>
              </div>
              <div className="border-t border-sand-200 px-3 py-2 dark:border-barn-800">
                <button className="text-xs font-medium text-honey-600 hover:underline dark:text-honey-400">View all notifications →</button>
              </div>
            </Dropdown>

        <Dropdown
          width="w-48"
          button={
            <button className="ml-1 flex shrink-0 items-center gap-2 border-l border-gray-200 pl-3 dark:border-gray-700 hover:opacity-90">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
                RK
              </span>
              <div className="hidden leading-tight lg:block text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ramesh Kumar</div>
                <div className="text-[11px] text-gray-400">Farmer</div>
              </div>
              <ChevronDown size={14} className="shrink-0 text-gray-400" />
            </button>
          }
        >
          <div className="px-3 py-2 text-xs font-semibold border-b border-gray-100 dark:border-gray-800 text-gray-500">
            Ramesh Kumar (Farmer)
          </div>
          <Link to="/settings" className="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-200">
            {t('nav.settings')}
          </Link>
        </Dropdown>
      </div>
    </header>
  )
}
