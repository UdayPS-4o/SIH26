import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowUpRight,
  Circle,
  Database,
  DownloadSimple,
  Moon,
  Sun,
  X,
  List as ListIcon,
} from '@phosphor-icons/react'
import { Badge, Button, cx, StatusChip, useTheme } from '@/ds'
import { NAV } from '@/nav'
import { DAILY, DEMO_DATE, LATEST, PREVIOUS } from '@/data/generate'
import { fmtDayFull, fmtIndex, fmtSigned } from '@/lib/format'
import { downloadCsv } from '@/lib/download'

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-control bg-accent font-display text-[15px] font-bold text-accent-ink">
        V
      </span>
      <span className="leading-none">
        <span className="block font-display text-[15px] font-semibold tracking-tight text-ink">
          VIMAAN
        </span>
        <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
          MoSPI · PS 26056
        </span>
      </span>
    </div>
  )
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-2.5 py-3">
      {NAV.map((group) => (
        <div key={group.id} className="mb-4 last:mb-0">
          <p className="px-2 pb-1.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'group flex items-start gap-2.5 rounded-control px-2 py-1.5 transition-colors duration-[var(--vm-dur-fast)]',
                      isActive
                        ? 'bg-accent-soft text-ink ring-1 ring-accent-line'
                        : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        size={17}
                        weight={isActive ? 'fill' : 'duotone'}
                        className={cx('mt-0.5 shrink-0', isActive ? 'text-accent' : 'text-ink-3')}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[12.5px] font-medium leading-tight">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-ink-3">
                          {item.blurb}
                        </span>
                      </span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarFooter() {
  return (
    <div className="border-t border-line px-3 py-3">
      <div className="rounded-control bg-surface-inset p-2.5 ring-1 ring-line">
        <div className="flex items-center gap-1.5">
          <Database size={13} weight="duotone" className="text-gate" />
          <p className="text-[11px] font-semibold text-ink">Fixture panel</p>
        </div>
        <p className="mt-1 text-[10.5px] leading-snug text-ink-3">
          Collection is off. Every figure comes from the seeded 90-day panel, not from a
          live portal.
        </p>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { mode, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="grid h-8 w-8 place-items-center rounded-control bg-surface-2 text-ink-2 ring-1 ring-line
                 transition-colors duration-[var(--vm-dur-fast)] hover:bg-surface-3 hover:text-ink"
    >
      {mode === 'dark' ? <Sun size={16} weight="duotone" /> : <Moon size={16} weight="duotone" />}
    </button>
  )
}

function HeadlineTicker() {
  const delta = LATEST.total - PREVIOUS.total
  const pct = (delta / PREVIOUS.total) * 100
  const up = delta >= 0
  const DeltaIcon = up ? ArrowUpRight : ArrowDownRight
  return (
    <div className="hidden items-center gap-3 rounded-control bg-surface-2 px-3 py-1.5 ring-1 ring-line lg:flex">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink-3">APIx</span>
      <span className="vm-num text-[15px] font-semibold leading-none text-ink">
        {fmtIndex(LATEST.total)}
      </span>
      <span
        className={cx(
          'vm-num inline-flex items-center gap-0.5 text-[11.5px] font-medium',
          up ? 'text-critical' : 'text-good',
        )}
        title="Dearer fares take the warm arm of the diverging scale, the same way the heatmap paints them"
      >
        <DeltaIcon size={11} weight="bold" />
        {fmtSigned(delta)} ({fmtSigned(pct)}%)
      </span>
      <StatusChip status={LATEST.status} />
    </div>
  )
}

function exportSeries() {
  downloadCsv(
    `apix-daily-${DEMO_DATE}.csv`,
    [
      { key: 'date', header: 'ref_date' },
      { key: 'total', header: 'index_total' },
      { key: 'totalLow', header: 'ci_low' },
      { key: 'totalHigh', header: 'ci_high' },
      { key: 'base', header: 'index_base_fare' },
      { key: 'coverage', header: 'coverage_pct' },
      { key: 'status', header: 'status' },
    ],
    DAILY,
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="relative z-10 flex min-h-[100dvh]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-[100dvh] w-[236px] shrink-0 flex-col border-r border-line bg-surface/85 backdrop-blur lg:flex">
        <div className="border-b border-line px-3.5 py-3.5">
          <BrandMark />
        </div>
        <SidebarNav />
        <SidebarFooter />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--vm-bg)]/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[268px] flex-col border-r border-line bg-surface shadow-lift">
            <div className="flex items-center justify-between border-b border-line px-3.5 py-3">
              <BrandMark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation"
                className="grid h-8 w-8 place-items-center rounded-control text-ink-2 hover:bg-surface-2"
              >
                <X size={16} weight="bold" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <SidebarFooter />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-3 backdrop-blur sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-control bg-surface-2 text-ink-2 ring-1 ring-line lg:hidden"
          >
            <ListIcon size={16} weight="bold" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-[13.5px] font-semibold text-ink">
              Airfare Price Index for India
            </p>
            <p className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              Reference date {fmtDayFull(DEMO_DATE)} · base 2024 = 100
            </p>
          </div>

          <HeadlineTicker />

          <Badge tone="gate" icon={Circle} className="hidden shrink-0 sm:inline-flex">
            Fixture data
          </Badge>

          <ThemeToggle />

          <Button
            variant="primary"
            icon={DownloadSimple}
            className="hidden shrink-0 sm:inline-flex"
            onClick={exportSeries}
          >
            Export series
          </Button>
        </header>

        <main id="vm-main" className="min-w-0 flex-1 px-3 py-5 sm:px-5">
          <div className="mx-auto w-full max-w-[1440px] animate-rise">{children}</div>
        </main>
      </div>
    </div>
  )
}
