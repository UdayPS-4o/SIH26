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
  Stack,
  TextAa,
  UploadSimple,
} from '@phosphor-icons/react'
import { useCopy } from '@/copy'
import { useViewMode } from '@/store/viewmode'
import { useService } from '@/store/service'
import { cx } from './ui/tokens'
import { IconTile, Num } from './ui'
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

// Cycled per CPSE so the "loaded" strip at the bottom reads as four distinct
// organisations rather than four identical dots. Decorative only, matches
// the non-semantic chart palette (tokens.ts CHART_PALETTE) used elsewhere.
const CPSE_DOT = ['bg-chart-1', 'bg-chart-2', 'bg-chart-3', 'bg-chart-4', 'bg-chart-5', 'bg-chart-6']

export default function Sidebar() {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const pending = useService(s => s.dashboard?.pendingPairs ?? 0)
  const loaded = useService(s => s.dashboard?.loaded ?? [])

  const visible = ITEMS.filter(item => mode === 'technical' || item.simple)
  const primary = visible.filter(item => item.simple)
  const operator = visible.filter(item => !item.simple)

  return (
    <aside className="flex w-[254px] shrink-0 flex-col border-r border-rule bg-surface">
      <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
        <IconTile icon={<Stack size={18} weight="fill" />} tone="accent" />
        <div className="min-w-0">
          <div className="font-display text-[17px] font-bold leading-none tracking-tight text-ink">
            {c('productName')}
          </div>
          <div className="mt-1.5 truncate text-[11.5px] leading-snug text-ink-2">
            {c('productFull')}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {primary.map(item => (
            <Row key={item.to} item={item} pending={pending} />
          ))}
        </ul>

        {operator.length > 0 ? (
          <>
            <div className="mt-6 px-3 pb-2 font-mono text-2xs uppercase text-ink-3">Operator</div>
            <ul className="flex flex-col gap-1">
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
        <div className="mt-2 flex flex-wrap gap-2">
          {CPSES.map((cpse, index) => {
            const isLoaded = loaded.includes(cpse.code)
            return (
              <span
                key={cpse.code}
                className={cx(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10.5px]',
                  isLoaded ? 'border-rule-strong text-ink' : 'border-rule text-ink-3',
                )}
              >
                <span
                  className={cx(
                    'h-1.5 w-1.5 rounded-full',
                    isLoaded ? CPSE_DOT[index % CPSE_DOT.length] : 'bg-rule-strong',
                  )}
                />
                {cpse.code}
              </span>
            )
          })}
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
            'flex items-center gap-2.5 rounded-xl px-2.5 py-[7px] text-[13px] font-medium transition-colors',
            isActive
              ? 'bg-accent-bg text-accent'
              : 'text-ink-2 hover:bg-surface-hover hover:text-ink',
          )
        }
      >
        <Icon size={17} weight="regular" className="shrink-0" />
        <span className="truncate">{c(item.key)}</span>
        {showBadge ? (
          <span className="ml-auto shrink-0 rounded-full border border-attention-edge bg-attention-bg px-1.5 py-px">
            <Num size="2xs" className="text-attention">
              {mode === 'simple' ? `${pending} to check` : pending}
            </Num>
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}
