import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Check, Globe, Home, Users, MapPin, CalendarDays, Sun, Moon } from 'lucide-react'
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
          className={`absolute z-50 mt-2 ${width} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={() => setOpen(false)}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export default function Topbar({ onMenu }) {
  const { t, lang, setLang } = useI18n()
  const { theme, toggleTheme } = useTheme()
  const [farm, setFarm] = useState(FARMS[0])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 overflow-hidden border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 sm:gap-3 sm:px-4 lg:px-6">
      <button className="shrink-0 text-gray-500 dark:text-gray-400 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <Dropdown
        align="left"
        button={
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 sm:gap-2 sm:px-3">
            <Home size={15} className="shrink-0 text-brand-600" />
            <span className="max-w-[5rem] truncate font-semibold text-gray-800 dark:text-gray-100 sm:max-w-[9rem]">{farm}</span>
            <ChevronDown size={14} className="hidden shrink-0 text-gray-400 sm:block" />
          </button>
        }
      >
        {FARMS.map((f) => (
          <button
            key={f}
            onClick={() => setFarm(f)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {f}
            {f === farm && <Check size={14} className="text-brand-600" />}
          </button>
        ))}
      </Dropdown>

      <div className="hidden items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 xl:flex">
        <Users size={15} className="text-gray-400" />
        {HERD_STATS.totalAnimals} {t('nav.animals')}
      </div>
      <div className="hidden items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 xl:flex">
        <MapPin size={15} className="text-gray-400" />
        Mathura, Uttar Pradesh
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300 sm:flex">
          <CalendarDays size={15} className="text-gray-400" />
          Apr 27, 2025
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
              <ChevronDown size={14} className="hidden shrink-0 text-gray-400 sm:block" />
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
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {l.label}
              {lang === l.code && <Check size={14} className="text-brand-600" />}
            </button>
          ))}
        </Dropdown>

        <Dropdown
          width="w-64"
          button={
            <button className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800" aria-label="Notifications">
              <Bell size={17} />
              {openAlerts.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {openAlerts.length}
                </span>
              )}
            </button>
          }
        >
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-400 dark:border-gray-800">
            {openAlerts.length} {t('alerts.title')}
          </div>
          {openAlerts.slice(0, 4).map((a) => (
            <Link key={a.id} to={`/animals/${a.animalId}`} className="block px-3 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.animalId}</span>
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">{a.risk}%</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">{a.time}</p>
            </Link>
          ))}
        </Dropdown>

        <div className="ml-1 flex shrink-0 items-center gap-2 border-l border-gray-200 pl-3 dark:border-gray-700">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
            RK
          </span>
          <div className="hidden leading-tight lg:block">
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">Ramesh Kumar</div>
            <div className="text-[11px] text-gray-400">Farmer</div>
          </div>
          <ChevronDown size={14} className="hidden text-gray-400 lg:block" />
        </div>
      </div>
    </header>
  )
}
