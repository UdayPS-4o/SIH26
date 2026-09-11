import { useEffect, useState } from 'react'
import { TrendDown, TrendUp, WifiHigh } from '@phosphor-icons/react'
import { PageHeader, Panel, StatTile, Callout } from '@/ds'
import { DEMO_DATE } from '@/data/generate'

const TODAY = new Date(DEMO_DATE)

const KPI_CARDS = [
  {
    label: 'Overall APIx',
    value: '104.42',
    delta: { value: '+1.30', direction: 'up' as const, good: false },
    note: 'Sep 2026 · Monthly',
    tone: 'warn' as const,
  },
  {
    label: 'YoY Inflation',
    value: '8.4%',
    delta: { value: '+2.1 pp', direction: 'up' as const, good: false },
    note: 'vs Sep 2025',
    tone: 'warn' as const,
  },
  {
    label: 'Routes Covered',
    value: '24 / 24',
    delta: { value: '100%', direction: 'flat' as const },
    note: 'Basket fully populated',
    tone: 'good' as const,
  },
  {
    label: 'Data Freshness',
    value: '2h ago',
    delta: { value: '12/12 sources', direction: 'flat' as const },
    note: 'Latest scrape 06:15 IST',
    tone: 'good' as const,
  },
]

const SECTOR_OVERVIEW = [
  { sector: 'DEL – BOM', current: 4820, change: '+4.2%', trend: 'rising' as const, confidence: 'high' as const },
  { sector: 'DEL – BLR', current: 3980, change: '-1.8%', trend: 'falling' as const, confidence: 'high' as const },
  { sector: 'BOM – BLR', current: 3450, change: '+0.5%', trend: 'stable' as const, confidence: 'high' as const },
  { sector: 'DEL – CCU', current: 4120, change: '+6.1%', trend: 'rising' as const, confidence: 'medium' as const },
  { sector: 'BLR – HYD', current: 2680, change: '-3.2%', trend: 'falling' as const, confidence: 'high' as const },
  { sector: 'MAA – DEL', current: 4550, change: '+2.8%', trend: 'rising' as const, confidence: 'high' as const },
]

export default function DashboardPage() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div>
      <PageHeader
        kicker="Real-time Airfare Price Index"
        title="APIx Dashboard"
        lede={`Updated ${TODAY.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={
          <span className="flex items-center gap-2 text-[11.5px] text-ink-3">
            <WifiHigh size={14} weight="fill" className="text-good" />
            <span className="font-mono">
              {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="hidden sm:inline">IST</span>
          </span>
        }
      />

      <Callout tone="accent" title="System health: all clear">
        12 of 12 sources active. Latest scrape completed at 06:15 IST. 2,847 fresh quotes ingested
        from 8 airlines and 4 OTAs. No anomalies detected in the quality gate.
      </Callout>

      {/* KPI strip */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {KPI_CARDS.map((kpi) => (
          <StatTile
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            delta={kpi.delta}
            tone={kpi.tone}
            note={kpi.note}
          />
        ))}
      </div>

      {/* Sector overview table */}
      <Panel
        className="mt-4"
        title="Sector overview"
        meta="Top routes by passenger traffic — live pricing"
        icon={TrendDown}
      >
        <div className="overflow-auto">
          <table className="w-full border-collapse text-[12.5px]">
            <thead className="sticky top-0 bg-surface-2">
              <tr>
                <th scope="col" className="border-b border-line px-3 py-2 text-left font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Sector
                </th>
                <th scope="col" className="border-b border-line px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Index value
                </th>
                <th scope="col" className="border-b border-line px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  30d change
                </th>
                <th scope="col" className="border-b border-line px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Trend
                </th>
                <th scope="col" className="border-b border-line px-3 py-2 text-right font-mono text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-3">
                  Confidence
                </th>
              </tr>
            </thead>
            <tbody>
              {SECTOR_OVERVIEW.map((row) => (
                <tr key={row.sector} className="border-b border-line/60 transition-colors hover:bg-surface-2">
                  <td className="px-3 py-2.5 align-middle font-medium text-ink">{row.sector}</td>
                  <td className="px-3 py-2.5 align-middle text-right font-mono text-ink-2">
                    ₹{row.current.toLocaleString('en-IN')}
                  </td>
                  <td
                    className={[
                      'px-3 py-2.5 align-middle text-right font-mono',
                      row.trend === 'rising' ? 'text-warn' : row.trend === 'falling' ? 'text-good' : 'text-ink-3',
                    ].join(' ')}
                  >
                    {row.change}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right">
                    {row.trend === 'rising' && <TrendUp size={14} weight="bold" className="text-warn" />}
                    {row.trend === 'falling' && <TrendDown size={14} weight="bold" className="text-good" />}
                    {row.trend === 'stable' && <span className="text-ink-3">—</span>}
                  </td>
                  <td className="px-3 py-2.5 align-middle text-right">
                    <span
                      className={[
                        'rounded-chip px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1',
                        row.confidence === 'high'
                          ? 'bg-good-soft text-good ring-good/40'
                          : 'bg-accent-soft text-accent ring-accent/40',
                      ].join(' ')}
                    >
                      {row.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  )
}
