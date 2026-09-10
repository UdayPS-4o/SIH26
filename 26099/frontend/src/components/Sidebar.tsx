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
  ArrowRight,
  ChartBar,
  ClockCounterClockwise,
  Compass,
  Drop,
  Factory,
  Gauge,
  Lightning,
  MagnifyingGlass,
  Mountains,
  Plugs,
  Sliders,
  SquaresFour,
  Stack,
  TextAa,
  UploadSimple,
} from '@phosphor-icons/react'
import { useCopy } from '@/copy'
import type { CopyKey } from '@/copy'
import type { Icon } from '@phosphor-icons/react'
import { useViewMode } from '@/store/viewmode'
import { useService } from '@/store/service'
import { cx } from './ui/tokens'
import { IconTile, Num } from './ui'
import type { Cpse } from '@/engine/types'
import { CPSES } from '@/engine/corpus'

interface NavItem {
  to: string
  key: CopyKey
  icon: Icon
  /** Present in Simple view. Items marked false appear only in Technical. */
  simple: boolean
  badge?: 'pending'
}

const ITEMS: NavItem[] = [
  { to: '/', key: 'navDashboard', icon: SquaresFour, simple: true },
  { to: '/overview', key: 'navOverview', icon: Compass, simple: true },
  { to: '/explorer', key: 'navExplorer', icon: MagnifyingGlass, simple: true },
  { to: '/duplicates', key: 'navDuplicates', icon: ArrowsMerge, simple: true, badge: 'pending' },
  { to: '/savings', key: 'navSavings', icon: ChartBar, simple: true },
  { to: '/registry', key: 'navRegistry', icon: Gauge, simple: true },
  { to: '/import', key: 'navImport', icon: UploadSimple, simple: true },
  { to: '/activity', key: 'navActivity', icon: ClockCounterClockwise, simple: true },
  { to: '/normalize', key: 'navNormalize', icon: TextAa, simple: false },
  { to: '/engine', key: 'navEngine', icon: Sliders, simple: false },
  { to: '/integration', key: 'navIntegration', icon: Plugs, simple: false },
  { to: '/migration', key: 'navMigration', icon: ArrowRight, simple: true },
]

/**
 * The four sources, each marked with the industry it is in.
 *
 * A distinct glyph per organisation earns its place where a fourth identical
 * dot does not: this strip is glanced at rather than read, and an oil drop
 * against a lightning bolt is separable at a size where "IOCL" against "NTPC"
 * is not. Colour is the non-semantic chart palette (tokens.ts CHART_PALETTE),
 * used here for the reason it is used in a chart legend - to tell four peers
 * apart, not to say anything about any of them.
 */
const SOURCE_MARK: Record<Cpse['code'], { icon: Icon; text: string }> = {
  IOCL: { icon: Drop, text: 'text-chart-1' },
  NTPC: { icon: Lightning, text: 'text-chart-2' },
  SAIL: { icon: Factory, text: 'text-chart-3' },
  CIL: { icon: Mountains, text: 'text-chart-4' },
}

/** The ERP without its version. The version does not fit at this width and is
 *  not what the row is for; the Overview names it in full. */
function shortErp(erp: string): string {
  if (erp.startsWith('SAP')) return `SAP ${erp.split(' ')[1] ?? ''}`.trim()
  if (erp.startsWith('Oracle')) return 'Oracle EBS'
  return 'In-house'
}

export default function Sidebar() {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const pending = useService(s => s.dashboard?.pendingPairs ?? 0)
  const loaded = useService(s => s.dashboard?.loaded ?? [])

  const visible = ITEMS.filter(item => mode === 'technical' || item.simple)
  const primary = visible.filter(item => item.simple)
  const operator = visible.filter(item => !item.simple)

  return (
    <aside className="flex w-[272px] shrink-0 flex-col border-r border-rule bg-surface">
      <div className="flex items-center gap-3 border-b border-rule px-5 py-4">
        <IconTile icon={<Stack size={19} weight="fill" />} tone="accent" />
        <div className="min-w-0">
          <div className="font-display text-[18px] font-bold leading-none tracking-tight text-ink">
            {c('productName')}
          </div>
          <div className="mt-1.5 truncate text-[12px] leading-snug text-ink-2">
            {c('productFull')}
          </div>
        </div>
      </div>

      {/* min-h-0 so the nav, not the source strip below it, is what scrolls
          when the two together exceed the viewport. Without it the flex item
          refuses to shrink under its content and the last source is clipped
          off the bottom of a short window. */}
      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {primary.map(item => (
            <Row key={item.to} item={item} pending={pending} />
          ))}
        </ul>

        {operator.length > 0 ? (
          <>
            <div className="mt-6 px-3 pb-2 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
              Operator
            </div>
            <ul className="flex flex-col gap-0.5">
              {operator.map(item => (
                <Row key={item.to} item={item} pending={pending} />
              ))}
            </ul>
          </>
        ) : null}
      </nav>

      <IntegrationStatus loaded={loaded} />
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
            'group relative flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-[14px] font-medium transition-colors',
            isActive
              ? 'bg-accent-bg text-accent'
              : 'text-ink-2 hover:bg-surface-hover hover:text-ink',
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* A short bar on the active row, so the current page is findable
                without relying on the tint alone. */}
            <span
              className={cx(
                'absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full transition-opacity',
                isActive ? 'bg-accent opacity-100' : 'opacity-0',
              )}
            />
            <Icon size={18} weight={isActive ? 'fill' : 'regular'} className="shrink-0" />
            <span className="truncate">{c(item.key)}</span>
            {showBadge ? (
              <span className="ml-auto shrink-0 rounded-full border border-attention-edge bg-attention-bg px-1.5 py-px">
                <Num size="2xs" className="text-attention">
                  {mode === 'simple' ? `${pending} to check` : pending}
                </Num>
              </span>
            ) : null}
          </>
        )}
      </NavLink>
    </li>
  )
}

/**
 * Quick-glance connectivity strip for the four ERP sources.
 *
 * Shows each CPSE, its ERP system, and a live / pending dot. The count below each
 * row is the total records available from that source. This is not a connection
 * poll: the dot reflects whether the source's data has been loaded into the local
 * registry (green) or not yet (amber).
 */
function IntegrationStatus({ loaded }: { loaded: string[] }) {
  const active = CPSES.filter(cpse => loaded.includes(cpse.code)).length

  return (
    <div className="border-t border-rule px-3 py-3">
      <div className="flex items-baseline justify-between gap-2 px-2 pb-2">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
          Integrations
        </span>
        <span className="font-mono text-[10.5px] text-ink-3">
          {active}/{CPSES.length} active
        </span>
      </div>

      <ul className="flex flex-col">
        {CPSES.map(cpse => {
          const mark = SOURCE_MARK[cpse.code]
          const Glyph = mark.icon
          const isConnected = loaded.includes(cpse.code)
          return (
            <li
              key={cpse.code}
              className={cx(
                'flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors',
                'hover:bg-surface-hover',
              )}
            >
              <Glyph
                size={16}
                weight="regular"
                className={cx('shrink-0', isConnected ? mark.text : 'text-ink-3')}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[12px] font-medium text-ink">
                    {cpse.code}
                  </span>
                  <span className="truncate font-mono text-[10.5px] text-ink-3">
                    {shortErp(cpse.erp)}
                  </span>
                </div>
                <div className="font-mono text-[10.5px] text-ink-3">
                  {(cpse.totalRecords / 100_000).toFixed(2)} lakh records
                </div>
              </div>
              <span
                className={cx(
                  'h-[7px] w-[7px] shrink-0 rounded-full',
                  isConnected ? 'bg-positive' : 'bg-attention',
                )}
                title={isConnected ? 'Connected' : 'Pending'}
              />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
