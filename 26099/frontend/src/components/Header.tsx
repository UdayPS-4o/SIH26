/**
 * Header.
 *
 * Global controls only. The previous build ran seven competing elements across the
 * top, including a live clock and a status pill that asserted the system was online
 * without checking anything. What survives is what a person needs to orient and
 * switch register, plus, in technical view, the last call the service answered,
 * which is the honest version of a status light.
 */

import { ArrowCounterClockwise, Moon, Sun } from '@phosphor-icons/react'
import { useCopy } from '@/copy'
import { useViewMode } from '@/store/viewmode'
import { useTheme } from '@/store/theme'
import { useService } from '@/store/service'
import { TechnicalOnly } from './Gate'
import { EndpointTag, Num, Segmented } from './ui'
import { formatCount } from '@/engine/savings'
import { CPSES } from '@/engine/corpus'
import { IS_LIVE } from '@/api/client'

export default function Header() {
  const c = useCopy()
  const mode = useViewMode(s => s.mode)
  const setMode = useViewMode(s => s.setMode)
  const theme = useTheme(s => s.theme)
  const toggleTheme = useTheme(s => s.toggle)
  const lastCall = useService(s => s.lastCall)
  const reset = useService(s => s.reset)
  const dashboard = useService(s => s.dashboard)

  const mostRecent = Object.values(lastCall).sort((a, b) => b.at - a.at)[0]
  const loaded = dashboard?.loaded.length ?? 0
  const records = dashboard?.totalRecords ?? 0

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-rule bg-surface px-6">
      {/* The trailing clause is the first thing to go when the window narrows.
          Truncating mid-word left the header reading "24.10 l...", which turns the
          one number on the screen into nonsense. */}
      <div className="min-w-0 flex-1">
        {loaded === 0 ? (
          <p className="truncate text-[12.5px] text-ink-3">
            {mode === 'simple'
              ? 'No item lists loaded yet'
              : 'registry empty · no material master loaded'}
          </p>
        ) : mode === 'simple' ? (
          <p className="truncate text-[12.5px] text-ink-2">
            <Num size="sm" className="text-ink">
              {formatCount(records)}
            </Num>{' '}
            items read
            <span className="hidden lg:inline">
              {' '}
              from {loaded} of {CPSES.length} {c('cpsePlural')}
            </span>
          </p>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
            <span className="font-mono text-[11.5px] text-ink-2 tabular-nums">
              {records.toLocaleString('en-IN')} records · {loaded}/{CPSES.length} masters loaded
            </span>
            {mostRecent ? (
              <EndpointTag
                method={mostRecent.method}
                endpoint={mostRecent.endpoint}
                ms={mostRecent.ms}
                scanned={mostRecent.scanned}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Puts the demo back to an empty registry in one click. A run that can only
          be given once is a run nobody dares interrupt with a question. */}
      {loaded > 0 ? (
        <button
          onClick={() => void reset()}
          title="Empty the registry and start again"
          className="flex h-7 items-center gap-1.5 rounded-full border border-rule-strong px-3 text-[11.5px] text-ink-2 transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <ArrowCounterClockwise size={13} />
          <span className="hidden sm:inline">Start over</span>
        </button>
      ) : null}

      <TechnicalOnly>
        <span className="hidden font-mono text-2xs uppercase text-ink-3 lg:inline">
          {IS_LIVE ? 'service: network' : 'service: in-process'}
        </span>
      </TechnicalOnly>

      <Segmented
        size="sm"
        value={mode}
        onChange={setMode}
        options={[
          { value: 'simple', label: 'Simple' },
          { value: 'technical', label: 'Technical' },
        ]}
      />

      <button
        onClick={toggleTheme}
        aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
        className="flex h-7 w-7 items-center justify-center rounded-full border border-rule-strong text-attention transition-colors hover:bg-surface-hover"
      >
        {theme === 'light' ? <Moon size={14} weight="fill" /> : <Sun size={14} weight="fill" />}
      </button>
    </header>
  )
}
