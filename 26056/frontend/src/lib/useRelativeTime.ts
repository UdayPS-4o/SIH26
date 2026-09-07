import { useEffect, useState } from 'react'

function relativeTime(iso: string, now: number): string {
  const diffSec = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (diffSec < 45) return 'just now'
  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

/** Ticks a "x minutes ago" string live off a fixed ISO timestamp, so a screen
 *  left open during a demo visibly counts forward instead of showing a
 *  string frozen at build time. */
export function useRelativeTime(iso: string, tickMs = 1000): string {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [tickMs])
  return relativeTime(iso, now)
}
