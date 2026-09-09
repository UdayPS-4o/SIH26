import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Maximize2,
  Smartphone,
  MessageSquare,
  PhoneCall,
} from 'lucide-react'
import { RiskBadge, Pill } from './common/ui.jsx'
import { riskMeta, levelFromScore } from '../utils/riskUtils'
import { useI18n } from '../i18n/i18n.jsx'
import farmMap from '../assets/farm-map.svg'
import { SHEDS } from '../data/mockData'

/* ---------------- ChannelBadges ---------------- */
function channelsForLevel(level) {
  if (level === 'HIGH') return ['app', 'sms', 'ivr']
  if (level === 'MODERATE') return ['app', 'sms']
  return ['app']
}
const CHANNEL_META = {
  app: { icon: Smartphone, label: 'App' },
  sms: { icon: MessageSquare, label: 'SMS' },
  ivr: { icon: PhoneCall, label: 'IVR Call' },
}
export function ChannelBadges({ level }) {
  const channels = channelsForLevel(level)
  return (
    <span className="inline-flex items-center gap-1">
      {channels.map((c) => {
        const { icon: Icon, label } = CHANNEL_META[c]
        return (
          <span
            key={c}
            title={label}
            aria-label={label}
            className="grid h-4 w-4 place-items-center rounded-full bg-sand-100 text-sand-500 dark:bg-barn-800 dark:text-sand-400"
          >
            <Icon size={10} />
          </span>
        )
      })}
    </span>
  )
}

/* ---------------- AlertCard ---------------- */
export function AlertCard({ alert, onReview, compact = false }) {
  const { t } = useI18n()
  const m = riskMeta(alert.level)
  return (
    <div className={`card overflow-hidden`}>
      <div className={`flex items-center justify-between border-l-4 px-3 py-2 sm:px-4 sm:py-2.5 ${m.border} ${m.bg}`} style={{ borderLeftColor: m.hex }}>
        <span className={`text-[11px] font-semibold uppercase tracking-wide sm:text-xs ${m.text}`}>{t(`risk.${alert.level}`)}</span>
        <span className="flex items-center gap-2">
          <ChannelBadges level={alert.level} />
          <span className="text-[11px] text-sand-400">{alert.time}</span>
        </span>
      </div>
      <div className="p-3 sm:p-4">
        <div className="flex items-start justify-between">
          <div>
            <Link to={`/animals/${alert.animalId}`} className="text-sm font-semibold text-sand-900 hover:text-honey-700 dark:text-sand-100">
              {alert.animalId}
            </Link>
            <p className="text-[11px] text-sand-400">Shed {alert.shed}</p>
          </div>
          <span className="text-lg font-bold sm:text-xl" style={{ color: m.hex }}>{alert.risk}%</span>
        </div>

        {!compact && (
          <ul className="mt-2 space-y-0.5">
            {alert.factors.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-sand-600 dark:text-sand-400">
                <span className="h-1 w-1 rounded-full bg-sand-400" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-2.5 rounded-lg bg-sand-100 px-2.5 py-2 text-xs text-sand-600 dark:bg-barn-800 dark:text-sand-400">
          <span className="font-medium text-sand-500 dark:text-sand-400">{t('alerts.predWindow')}: </span>
          {t('common.days')}
          <p className="mt-1">{alert.action}</p>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <Link to={`/animals/${alert.animalId}`} className="btn-primary flex-1 justify-center">
            {t('common.viewAnimal')}
          </Link>
          {alert.status === 'open' ? (
            <button className="btn-ghost text-xs" onClick={() => onReview?.(alert.id)}>
              {t('common.markReviewed')}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-forest-50 px-2.5 py-2 text-xs font-medium text-forest-700 dark:bg-forest-900/40 dark:text-forest-400">
              <CheckCircle2 size={14} /> {t('alerts.filter.resolved')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------------- InsightCard ---------------- */
export function InsightCard({ title, body, actions }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-ai to-ai-dark px-4 py-3 text-white sm:px-5 sm:py-4">
        <div className="flex items-center gap-2">
          <Sparkles size={15} />
          <span className="text-sm font-bold">{title}</span>
        </div>
      </div>
      <div className="p-3 sm:p-5">
        <p className="text-xs leading-relaxed text-sand-600 dark:text-sand-400 sm:text-sm">{body}</p>
        {actions && <div className="mt-2.5 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------------- RiskFactors ---------------- */
export function RiskFactors({ factors }) {
  const max = Math.max(...factors.map((f) => f.value ?? f.weight ?? 1), 1)
  return (
    <div className="space-y-2 sm:space-y-3">
      {factors.map((f) => {
        const val = f.value ?? f.weight ?? 0
        const pct = Math.max(6, (val / max) * 100)
        return (
          <div key={f.key || f.label}>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-sand-600 dark:text-sand-400">{f.label || f.key}</span>
              <span className="font-medium text-sand-900 dark:text-sand-100">{f.delta}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800 sm:h-2">
              <div className="h-full rounded-full bg-gradient-to-r from-honey-500 to-honey-400" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- HealthTimeline ---------------- */
export function HealthTimeline({ items }) {
  const toneMap = {
    ok: { dot: 'bg-forest-500', icon: CheckCircle2 },
    warn: { dot: 'bg-honey-500', icon: Clock },
    alert: { dot: 'bg-red-500', icon: AlertTriangle },
  }
  return (
    <ol className="relative ml-2 space-y-3 border-l border-sand-200 pl-4 dark:border-barn-800 sm:space-y-5 sm:pl-6">
      {items.map((it, i) => {
        const tone = toneMap[it.tone] || toneMap.ok
        const Icon = tone.icon
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[21px] grid h-3.5 w-3.5 place-items-center rounded-full ${tone.dot} ring-2 ring-white dark:ring-barn-950`} />
            <div className="flex items-center gap-2">
              <Icon size={13} className="text-sand-400" />
              <span className="text-[11px] font-medium text-sand-400 sm:text-xs">{it.date}</span>
            </div>
            <p className="mt-0.5 text-xs text-sand-700 dark:text-sand-300">{it.label}</p>
          </li>
        )
      })}
    </ol>
  )
}

/* ---------------- RecommendationCard ---------------- */
export function RecommendationCard({ rec, index }) {
  const toneMap = { High: 'red', Medium: 'amber', Low: 'gray' }
  return (
    <div className="flex gap-2.5 rounded-xl border border-sand-200 bg-white p-3 dark:border-barn-800 dark:bg-barn-950/60 sm:p-4">
      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-honey-100 text-xs font-bold text-honey-700 dark:bg-honey-900/40 dark:text-honey-400 sm:h-7 sm:w-7">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-sand-900 dark:text-sand-100 sm:text-sm">{rec.title}</p>
          <Pill tone={toneMap[rec.priority]}>{rec.priority}</Pill>
        </div>
        <p className="mt-0.5 text-[11px] text-sand-500 dark:text-sand-400 sm:text-xs">{rec.reason}</p>
      </div>
    </div>
  )
}

/* ---------------- AnimalTable ---------------- */
export function AnimalTable({ animals }) {
  const { t } = useI18n()
  const cols = ['animal', 'breed', 'age', 'lactation', 'yield', 'scc', 'activity', 'risk', 'updated', 'action']
  return (
    <div className="card overflow-hidden">
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-100/80 text-left text-[11px] uppercase tracking-wide text-sand-500 dark:border-barn-800 dark:bg-barn-900/60 dark:text-sand-400">
              {cols.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2.5 font-medium">{t(`animals.col.${c}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-sand-100 dark:divide-barn-800">
            {animals.map((a) => (
              <tr key={a.id} className="hover:bg-sand-50 dark:hover:bg-barn-900/40">
                <td className="px-3 py-2.5">
                  <Link to={`/animals/${a.id}`} className="font-medium text-sand-900 hover:text-honey-700 dark:text-sand-100">{a.id}</Link>
                  <div className="text-[11px] text-sand-400">{a.name} · {a.species}</div>
                </td>
                <td className="px-3 py-2.5 text-sand-600 dark:text-sand-400">{a.breed}</td>
                <td className="px-3 py-2.5 text-sand-600 dark:text-sand-400">{a.age}y</td>
                <td className="px-3 py-2.5 text-sand-600 dark:text-sand-400">{a.lactation}</td>
                <td className="px-3 py-2.5 text-sand-600 dark:text-sand-400">{a.milkYield} L</td>
                <td className="px-3 py-2.5 text-sand-600 dark:text-sand-400">{a.scc}k</td>
                <td className={`px-3 py-2.5 ${a.activity < 0 ? 'text-red-600 dark:text-red-400' : 'text-sand-600 dark:text-sand-400'}`}>{a.activity > 0 ? '+' : ''}{a.activity}%</td>
                <td className="px-3 py-2.5"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                <td className="px-3 py-2.5 text-[11px] text-sand-400">{a.lastUpdated}</td>
                <td className="px-3 py-2.5">
                  <Link to={`/animals/${a.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-honey-600 hover:underline">
                    {t('common.viewAnimal')} <ArrowUpRight size={12} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="divide-y divide-sand-100 dark:divide-barn-800 md:hidden">
        {animals.map((a) => (
          <Link key={a.id} to={`/animals/${a.id}`} className="flex items-center gap-2.5 p-3 active:bg-sand-50 dark:active:bg-barn-900/40">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sand-900 dark:text-sand-100">{a.id}</span>
                <RiskBadge level={a.riskLevel} score={a.riskScore} />
              </div>
              <p className="mt-0.5 text-[11px] text-sand-400">
                {a.breed} · {a.age}y · Lact {a.lactation} · {a.milkYield} L · SCC {a.scc}k
              </p>
            </div>
            <ChevronRight size={14} className="text-sand-300 dark:text-barn-700" />
          </Link>
        ))}
      </div>
    </div>
  )
}

/* ---------------- ShedRiskCard ---------------- */
export function ShedRiskCard({ shed }) {
  const { t } = useI18n()
  const m = riskMeta(shed.level)
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${m.border} ${m.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-sand-900 dark:text-sand-100 sm:text-sm">{shed.name}</span>
        <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      </div>
      <div className="mt-1.5 flex items-end justify-between">
        <span className="text-xl font-bold sm:text-2xl" style={{ color: m.hex }}>{shed.risk}%</span>
        <span className={`text-[11px] font-medium ${m.text}`}>{t(`risk.${shed.level}`)}</span>
      </div>
      <p className="mt-1 text-[11px] text-sand-500 dark:text-sand-400">{shed.animals} animals</p>
    </div>
  )
}

/* ---------------- ShedRiskBar ---------------- */
export function ShedRiskBar({ shed }) {
  const m = riskMeta(shed.level)
  return (
    <div>
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium text-sand-700 dark:text-sand-300">{shed.name}</span>
        <span className="font-bold" style={{ color: m.hex }}>{shed.risk}%</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-sand-100 dark:bg-barn-800 sm:mt-1.5 sm:h-2.5">
        <div className="h-full rounded-full" style={{ width: `${shed.risk}%`, background: m.hex }} />
      </div>
    </div>
  )
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({ data, color = '#22c55e', width = 72, height = 26 }) {
  if (!data?.length) return null
  const vals = data.map((d) => d.v)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const pts = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((d.v - min) / span) * (height - 4) - 2
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrendArrow({ dir }) {
  if (dir === 'up') return <TrendingUp size={13} className="text-red-500" />
  if (dir === 'down') return <TrendingDown size={13} className="text-forest-600" />
  return <Minus size={13} className="text-sand-400" />
}

/* ---------------- RecentHighRisk table ---------------- */
export function RecentHighRiskTable({ animals }) {
  const { t } = useI18n()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wide text-sand-400 sm:text-xs">
            <th className="pb-1.5 font-medium">{t('dash.rhr.id')}</th>
            <th className="pb-1.5 font-medium">{t('dash.rhr.type')}</th>
            <th className="pb-1.5 font-medium">{t('dash.rhr.score')}</th>
            <th className="pb-1.5 font-medium">{t('dash.rhr.trend')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100 dark:divide-barn-800">
          {animals.map((a) => {
            const m = riskMeta(a.riskLevel)
            const sparkColor = a.trend === 'down' ? '#22c55e' : a.trend === 'up' ? '#ef4444' : '#94a3b8'
            return (
              <tr key={a.id}>
                <td className="py-2">
                  <Link to={`/animals/${a.id}`} className="font-semibold text-sand-900 hover:text-honey-700 dark:text-sand-100">{a.id}</Link>
                </td>
                <td className="py-2 text-sand-500 dark:text-sand-400">{a.species}</td>
                <td className="py-2">
                  <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${m.bg} ${m.text}`}>{a.riskScore}%</span>
                </td>
                <td className="py-2">
                  <span className="flex items-center gap-1.5">
                    <TrendArrow dir={a.trend} />
                    <Sparkline data={a.spark} color={sparkColor} />
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- FarmMap ---------------- */
const SHED_POS = {
  A: { top: '20%', left: '20%' },
  B: { top: '16%', left: '68%' },
  C: { top: '68%', left: '70%' },
  D: { top: '70%', left: '20%' },
}
export function FarmMap() {
  const { t } = useI18n()
  return (
    <div className="relative overflow-hidden rounded-xl border border-sand-200 dark:border-barn-800">
      <img src={farmMap} alt="Farm map" className="h-full w-full object-cover" />
      {SHEDS.map((s) => {
        const m = riskMeta(s.level)
        return (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/95 px-1.5 py-1 text-[10px] font-bold shadow-md ring-1 ring-black/5 dark:bg-barn-900/95 dark:text-sand-100 dark:ring-white/10"
            style={SHED_POS[s.id]}
          >
            <span className="flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
              {s.id} <span style={{ color: m.hex }}>{s.risk}%</span>
            </span>
          </div>
        )
      })}
      <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-1.5 rounded-lg bg-white/95 px-2 py-1 text-[10px] shadow ring-1 ring-black/5 dark:bg-barn-900/95 dark:ring-white/10">
        {[['NONE', t('risk.NONE')], ['LOW', t('risk.LOW')], ['MODERATE', t('risk.MODERATE')], ['HIGH', t('risk.HIGH')]].map(
          ([k, lbl]) => (
            <span key={k} className="flex items-center gap-1 text-sand-600 dark:text-sand-300">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: riskMeta(k).hex }} />
              {lbl}
            </span>
          ),
        )}
      </div>
      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-lg bg-white/95 text-sand-500 shadow ring-1 ring-black/5 dark:bg-barn-900/95 dark:text-sand-400 dark:ring-white/10">
        <Maximize2 size={11} />
      </span>
    </div>
  )
}

/* ---------------- UrgentAlertItem ---------------- */
export function UrgentAlertItem({ alert }) {
  const { t } = useI18n()
  const m = riskMeta(alert.level)
  return (
    <Link to={`/animals/${alert.animalId}`} className="block border-t border-sand-100 py-2.5 first:border-t-0 hover:bg-sand-50 dark:border-barn-800 dark:hover:bg-barn-900/40">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${m.bg} ${m.text}`}>
            {t(`risk.${alert.level}`)}
          </span>
          <span className="font-semibold text-sand-900 dark:text-sand-100">{alert.animalId}</span>
        </span>
        <span className="text-[11px] font-semibold" style={{ color: m.hex }}>{alert.risk}% {t('dash.risk')}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-sand-500 dark:text-sand-400">{alert.factors.join(', ')}</p>
    </Link>
  )
}

/* ---------------- QuickAction ---------------- */
export function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg border border-sand-200 px-3 py-2.5 text-xs font-medium text-sand-700 transition-colors hover:border-honey-300 hover:bg-honey-50 dark:border-barn-800 dark:text-sand-300 dark:hover:border-honey-700 dark:hover:bg-honey-900/20"
    >
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-ai-light text-ai dark:bg-ai-dark/40 dark:text-ai">
        <Icon size={14} />
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight size={14} className="text-sand-300 dark:text-barn-700" />
    </Link>
  )
}
