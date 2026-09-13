import { useEffect, useState } from 'react'
import type { LiveQuote } from '@/lib/liveFeed'
import { createInitialQuotes, driftQuote, generateNewQuote } from '@/lib/liveFeed'
import { cx } from '@/ds/primitives'

const MAX_QUOTES = 50
const NEW_QUOTE_CHANCE = 0.35
const TICK_MS = 2000

const SOURCE_COLORS: Record<string, string> = {
  'IndiGo':     'bg-good-soft text-good',
  'Air India':  'bg-accent-soft text-accent',
  'SpiceJet':   'bg-warn-soft text-warn',
  'Akasa Air':  'bg-gate-soft text-gate',
  'Cleartrip':  'bg-surface-3 text-ink-2',
  'MakeMyTrip': 'bg-surface-3 text-ink-2',
  'Yatra':      'bg-surface-3 text-ink-2',
  'Amadeus':    'bg-surface-3 text-ink-2',
  'Duffel':     'bg-surface-3 text-ink-2',
  'EaseMyTrip': 'bg-surface-3 text-ink-2',
  'ixigo':      'bg-surface-3 text-ink-2',
  'Goibibo':    'bg-surface-3 text-ink-2',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 5000) return 'now'
  if (diff < 60_000) return `${Math.floor(diff / 1000)}s`
  return `${Math.floor(diff / 60_000)}s`
}

export function LiveFeed() {
  const [quotes, setQuotes] = useState<LiveQuote[]>(() => createInitialQuotes())
  const [tick, setTick] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => {
      setQuotes((prev) => {
        const next = prev.map(driftQuote)
        if (Math.random() < NEW_QUOTE_CHANCE) {
          next.unshift(generateNewQuote())
        }
        return next.slice(0, MAX_QUOTES)
      })
      setTick((t) => t + 1)
      setNow(new Date())
    }, TICK_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-card border border-line bg-surface-1 ring-1 ring-line/60">
      {/* Stats bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-line/60 px-3 py-2">
        <span className="flex items-center gap-1.5 text-[11.5px] font-medium text-good">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-good opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-good" />
          </span>
          Live
        </span>
        <span className="text-[11px] text-ink-3">
          <span className="font-mono text-ink-2">{new Set(quotes.map(q => q.source)).size}</span> sources
        </span>
        <span className="text-[11px] text-ink-3">
          <span className="font-mono text-ink-2">{quotes.length}</span> quotes in view
        </span>
        <span className="text-[11px] text-ink-3">
          Scraped{' '}
          <span className="font-mono text-ink-2">
            {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>{' '}
          IST
        </span>
        <span className="text-[11px] text-ink-3">
          +{Math.floor(Math.random() * 3 + 1)} new/min
        </span>
      </div>

      {/* Quote list */}
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full border-collapse text-[11.5px]">
          <thead className="sticky top-0 bg-surface-1">
            <tr>
              <th className="border-b border-line/60 px-2 py-1.5 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Source
              </th>
              <th className="border-b border-line/60 px-2 py-1.5 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Sector
              </th>
              <th className="border-b border-line/60 px-2 py-1.5 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Window
              </th>
              <th className="border-b border-line/60 px-2 py-1.5 text-right font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Fare
              </th>
              <th className="border-b border-line/60 px-2 py-1.5 text-left font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Cabin
              </th>
              <th className="border-b border-line/60 px-2 py-1.5 text-right font-mono text-[10px] font-medium uppercase tracking-wider text-ink-3">
                Age
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q, i) => (
              <tr
                key={q.id + '-' + tick}
                className={cx(
                  'border-b border-line/40 transition-colors',
                  q.status === 'fresh' ? 'animate-pulse bg-good-soft/40' : 'hover:bg-surface-2/60',
                  i === 0 && q.status === 'fresh' && 'bg-good-soft/20',
                )}
              >
                <td className="px-2 py-1.5 align-middle">
                  <span className={cx('rounded-chip px-1.5 py-0.5 font-mono text-[10px]', SOURCE_COLORS[q.source] ?? 'bg-surface-3 text-ink-2')}>
                    {q.source}
                  </span>
                </td>
                <td className="px-2 py-1.5 align-middle font-mono text-ink-2">{q.sector}</td>
                <td className="px-2 py-1.5 align-middle text-center font-mono text-ink-3">{q.window}</td>
                <td className={cx('px-2 py-1.5 align-middle text-right font-mono', q.status === 'flagged' ? 'text-warn' : 'text-ink')}>
                  ₹{q.fare.toLocaleString('en-IN')}
                </td>
                <td className="px-2 py-1.5 align-middle text-ink-3">{q.cabin}</td>
                <td className="px-2 py-1.5 align-middle text-right text-ink-3">{timeAgo(q.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
