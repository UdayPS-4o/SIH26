/**
 * Navigation.
 *
 * Simple shows seven destinations, flat, no section headings. Technical adds the
 * two operator surfaces and groups them. The previous build put nineteen rows here
 * before anyone had done anything.
 */

import { NavLink } from 'react-router-dom'
import {
  ArrowsMerge,
  ChartBar,
  ClockCounterClockwise,
  Gauge,
  MagnifyingGlass,
  Sliders,
  SquaresFour,
  TextAa,
  UploadSimple,
} from '@phosphor-icons/react'
import { useCopy } from '@/copy'
import { useViewMode } from '@/store/viewmode'
import { useService } from '@/store/service'
import { cx } from './ui/tokens'
import { Num } from './ui'
import { CPSES } from '@/engine/corpus'
import type { CopyKey } from '@/copy'
import type { Icon } from '@phosphor-icons/react'

interface NavItem {
  to: string
  key: CopyKey
  icon: Icon
  /** Present in Simple view. Items marked false appear only in Technical. */
  simple: boolean
  badge?: 'pending'
}

const ITEMS: NavItem[] = [
  { to: '/', key: 'navOverview', icon: SquaresFour, simple: true },
  { to: '/explorer', key: 'navExplorer', icon: MagnifyingGlass, simple: true },
  { to: '/duplicates', key: 'navDuplicates', icon: ArrowsMerge, simple: true, badge: 'pending' },
  { to: '/savings', key: 'navSavings', icon: ChartBar, simple: true },
  { to: '/registry', key: 'navRegistry', icon: Gauge, simple: true },
  { to: '/import', key: 'navImport', icon: UploadSimple, simple: true },
  { to: '/activity', key: 'navActivity', icon: ClockCounterClockwise, simple: true },
  { to: '/normalize', key: 'navNormalize', icon: TextAa, simple: false },
  { to: '/engine', key: 'navEngine', icon: Sliders, simple: false },
]

export default function Sidebar() {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const pending = useService(s => s.dashboard?.pendingPairs ?? 0)
  const loaded = useService(s => s.dashboard?.loaded ?? [])

  const visible = ITEMS.filter(item => mode === 'technical' || item.simple)
  const primary = visible.filter(item => item.simple)
  const operator = visible.filter(item => !item.simple)

  return (
    <aside className="flex w-[248px] shrink-0 flex-col border-r border-rule bg-surface">
      <div className="border-b border-rule px-5 py-4">
        <div className="font-display text-[17px] font-bold leading-none tracking-tight text-ink">
          {c('productName')}
        </div>
        <div className="mt-1.5 text-[11.5px] leading-snug text-ink-2">{c('productFull')}</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {primary.map(item => (
            <Row key={item.to} item={item} pending={pending} />
          ))}
        </ul>

        {operator.length > 0 ? (
          <>
            <div className="mt-6 px-2 pb-2 font-mono text-2xs uppercase text-ink-3">Operator</div>
            <ul className="flex flex-col gap-0.5">
              {operator.map(item => (
                <Row key={item.to} item={item} pending={pending} />
              ))}
            </ul>
          </>
        ) : null}
      </nav>

      <div className="border-t border-rule px-5 py-4">
        <div className="text-[11.5px] text-ink-2">
          {loaded.length} of {CPSES.length} {c('cpsePlural')} loaded
        </div>
        <div className="mt-1 flex flex-wrap gap-x-2 font-mono text-[11px] leading-relaxed">
          {CPSES.map(cpse => (
            <span
              key={cpse.code}
              className={loaded.includes(cpse.code) ? 'text-accent' : 'text-ink-3 line-through decoration-rule-strong'}
            >
              {cpse.code}
            </span>
          ))}
        </div>
      </div>
    </aside>
  )
}

function Row({ item, pending }: { item: NavItem; pending: number }) {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const Icon = item.icon
  const showBadge = item.badge === 'pending' && pending > 0

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === '/'}
        className={({ isActive }) =>
          cx(
            'flex items-center gap-2.5 px-2 py-[7px] text-[13px] transition-colors',
            isActive
              ? 'bg-accent-bg font-medium text-accent'
              : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
          )
        }
      >
        <Icon size={16} weight="regular" className="shrink-0" />
        <span className="truncate">{c(item.key)}</span>
        {showBadge ? (
          <span className="ml-auto shrink-0 border border-attention-edge bg-attention-bg px-1.5 py-px text-attention">
            <Num size="2xs">{mode === 'simple' ? `${pending} to check` : pending}</Num>
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}
