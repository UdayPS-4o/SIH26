import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, Bell, ChevronDown, Check, Globe, Home, Users, MapPin, CalendarDays } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'
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
          className={`absolute z-50 mt-2 ${width} overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg ${
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
  const [farm, setFarm] = useState(FARMS[0])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white px-4 lg:px-6">
      <button className="text-gray-500 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <Dropdown
        align="left"
        button={
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50">
            <Home size={15} className="text-brand-600" />
            <span className="max-w-[9rem] truncate font-semibold text-gray-800">{farm}</span>
            <ChevronDown size={14} className="text-gray-400" />
          </button>
        }
      >
        {FARMS.map((f) => (
          <button
            key={f}
            onClick={() => setFarm(f)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50"
          >
            {f}
            {f === farm && <Check size={14} className="text-brand-600" />}
          </button>
        ))}
      </Dropdown>

      <div className="hidden items-center gap-1.5 text-sm text-gray-500 xl:flex">
        <Users size={15} className="text-gray-400" />
        {HERD_STATS.totalAnimals} {t('nav.animals')}
      </div>
      <div className="hidden items-center gap-1.5 text-sm text-gray-500 xl:flex">
        <MapPin size={15} className="text-gray-400" />
        Mathura, Uttar Pradesh
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 sm:flex">
          <CalendarDays size={15} className="text-gray-400" />
          Apr 27, 2025
        </div>

        <Dropdown
          button={
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50" aria-label="Language">
              <Globe size={15} className="text-gray-400" />
              <span className="font-medium text-gray-700">{lang === 'en' ? 'English' : 'हिन्दी'}</span>
              <ChevronDown size={14} className="text-gray-400" />
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
              className="flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-gray-50"
            >
              {l.label}
              {lang === l.code && <Check size={14} className="text-brand-600" />}
            </button>
          ))}
        </Dropdown>

        <Dropdown
          width="w-64"
          button={
            <button className="relative grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" aria-label="Notifications">
              <Bell size={17} />
              {openAlerts.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {openAlerts.length}
                </span>
              )}
            </button>
          }
        >
          <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase text-gray-400">
            {openAlerts.length} {t('alerts.title')}
          </div>
          {openAlerts.slice(0, 4).map((a) => (
            <Link key={a.id} to={`/animals/${a.animalId}`} className="block px-3 py-2.5 text-sm hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">{a.animalId}</span>
                <span className="text-xs font-semibold text-red-600">{a.risk}%</span>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">{a.time}</p>
            </Link>
          ))}
        </Dropdown>

        <div className="ml-1 flex items-center gap-2 border-l border-gray-200 pl-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
            RK
          </span>
          <div className="hidden leading-tight lg:block">
            <div className="text-sm font-semibold text-gray-900">Ramesh Kumar</div>
            <div className="text-[11px] text-gray-400">Farmer</div>
          </div>
          <ChevronDown size={14} className="hidden text-gray-400 lg:block" />
        </div>
      </div>
    </header>
  )
}
