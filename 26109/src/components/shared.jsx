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
// Purely presentational — which notification channels an alert would have gone out on,
// derived from the alert's risk level so farmers without smartphones are still reached (SMS/IVR).
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
            className="grid h-5 w-5 place-items-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
          >
            <Icon size={11} />
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
      <div className={`flex items-center justify-between border-l-4 px-4 py-2.5 ${m.border} ${m.bg}`} style={{ borderLeftColor: m.hex }}>
        <span className={`text-xs font-semibold uppercase tracking-wide ${m.text}`}>{t(`risk.${alert.level}`)}</span>
        <span className="flex items-center gap-2">
          <ChannelBadges level={alert.level} />
          <span className="text-xs text-gray-400">{alert.time}</span>
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <Link to={`/animals/${alert.animalId}`} className="text-base font-semibold text-gray-900 hover:text-brand-700 dark:text-gray-100">
              {alert.animalId}
            </Link>
            <p className="text-xs text-gray-400">Shed {alert.shed}</p>
          </div>
          <span className="text-xl font-bold" style={{ color: m.hex }}>{alert.risk}%</span>
        </div>

        {!compact && (
          <ul className="mt-3 space-y-1">
            {alert.factors.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="h-1 w-1 rounded-full bg-gray-400" />
                {f}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          <span className="font-medium text-gray-500 dark:text-gray-400">{t('alerts.predWindow')}: </span>
          {t('common.days')}
          <p className="mt-1">{alert.action}</p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Link to={`/animals/${alert.animalId}`} className="btn-primary flex-1 justify-center">
            {t('common.viewAnimal')}
          </Link>
          {alert.status === 'open' ? (
            <button className="btn-ghost" onClick={() => onReview?.(alert.id)}>
              {t('common.markReviewed')}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-2 text-sm font-medium text-brand-700">
              <CheckCircle2 size={15} /> {t('alerts.filter.resolved')}
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
      <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <Sparkles size={16} />
          <span className="text-sm font-semibold">{title}</span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{body}</p>
        {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/* ---------------- RiskFactors ---------------- */
export function RiskFactors({ factors }) {
  const max = Math.max(...factors.map((f) => f.value ?? f.weight ?? 1), 1)
  return (
    <div className="space-y-3">
      {factors.map((f) => {
        const val = f.value ?? f.weight ?? 0
        const pct = Math.max(6, (val / max) * 100)
        return (
          <div key={f.key || f.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{f.label || f.key}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{f.delta}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
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
    ok: { dot: 'bg-brand-500', icon: CheckCircle2 },
    warn: { dot: 'bg-amber-500', icon: Clock },
    alert: { dot: 'bg-red-500', icon: AlertTriangle },
  }
  return (
    <ol className="relative ml-2 space-y-5 border-l border-gray-200 pl-6 dark:border-gray-800">
      {items.map((it, i) => {
        const tone = toneMap[it.tone] || toneMap.ok
        const Icon = tone.icon
        return (
          <li key={i} className="relative">
            <span className={`absolute -left-[31px] grid h-4 w-4 place-items-center rounded-full ${tone.dot} ring-4 ring-white dark:ring-gray-900`} />
            <div className="flex items-center gap-2">
              <Icon size={14} className="text-gray-400" />
              <span className="text-xs font-medium text-gray-400">{it.date}</span>
            </div>
            <p className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{it.label}</p>
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
    <div className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rec.title}</p>
          <Pill tone={toneMap[rec.priority]}>{rec.priority}</Pill>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{rec.reason}</p>
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
            <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-800/60 dark:text-gray-400">
              {cols.map((c) => (
                <th key={c} className="whitespace-nowrap px-4 py-3 font-medium">{t(`animals.col.${c}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {animals.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <Link to={`/animals/${a.id}`} className="font-medium text-gray-900 hover:text-brand-700 dark:text-gray-100">{a.id}</Link>
                  <div className="text-xs text-gray-400">{a.name} · {a.species}</div>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.breed}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.age}y</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.lactation}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.milkYield} L</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{a.scc}k</td>
                <td className={`px-4 py-3 ${a.activity < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>{a.activity > 0 ? '+' : ''}{a.activity}%</td>
                <td className="px-4 py-3"><RiskBadge level={a.riskLevel} score={a.riskScore} /></td>
                <td className="px-4 py-3 text-xs text-gray-400">{a.lastUpdated}</td>
                <td className="px-4 py-3">
                  <Link to={`/animals/${a.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                    {t('common.viewAnimal')} <ArrowUpRight size={14} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* mobile cards */}
      <div className="divide-y divide-gray-100 dark:divide-gray-800 md:hidden">
        {animals.map((a) => (
          <Link key={a.id} to={`/animals/${a.id}`} className="flex items-center gap-3 p-4 active:bg-gray-50 dark:active:bg-gray-800/50">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">{a.id}</span>
                <RiskBadge level={a.riskLevel} score={a.riskScore} />
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {a.breed} · {a.age}y · Lact {a.lactation} · {a.milkYield} L · SCC {a.scc}k
              </p>
            </div>
            <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
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
    <div className={`rounded-xl border p-4 ${m.border} ${m.bg}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{shed.name}</span>
        <span className={`h-2.5 w-2.5 rounded-full ${m.dot}`} />
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="text-2xl font-bold" style={{ color: m.hex }}>{shed.risk}%</span>
        <span className={`text-xs font-medium ${m.text}`}>{t(`risk.${shed.level}`)}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{shed.animals} animals</p>
    </div>
  )
}

/* ---------------- ShedRiskBar ---------------- */
export function ShedRiskBar({ shed }) {
  const m = riskMeta(shed.level)
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{shed.name}</span>
        <span className="font-semibold" style={{ color: m.hex }}>{shed.risk}%</span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div className="h-full rounded-full" style={{ width: `${shed.risk}%`, background: m.hex }} />
      </div>
    </div>
  )
}

/* ---------------- Sparkline ---------------- */
export function Sparkline({ data, color = '#16a34a', width = 72, height = 26 }) {
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
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrendArrow({ dir }) {
  if (dir === 'up') return <TrendingUp size={15} className="text-red-500" />
  if (dir === 'down') return <TrendingDown size={15} className="text-brand-600" />
  return <Minus size={15} className="text-gray-400" />
}

/* ---------------- RecentHighRisk table ---------------- */
export function RecentHighRiskTable({ animals }) {
  const { t } = useI18n()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-gray-400">
            <th className="pb-2 font-medium">{t('dash.rhr.id')}</th>
            <th className="pb-2 font-medium">{t('dash.rhr.type')}</th>
            <th className="pb-2 font-medium">{t('dash.rhr.score')}</th>
            <th className="pb-2 font-medium">{t('dash.rhr.trend')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {animals.map((a) => {
            const m = riskMeta(a.riskLevel)
            const sparkColor = a.trend === 'down' ? '#16a34a' : a.trend === 'up' ? '#ef4444' : '#94a3b8'
            return (
              <tr key={a.id}>
                <td className="py-2.5">
                  <Link to={`/animals/${a.id}`} className="font-semibold text-gray-900 hover:text-brand-700 dark:text-gray-100">{a.id}</Link>
                </td>
                <td className="py-2.5 text-gray-500 dark:text-gray-400">{a.species}</td>
                <td className="py-2.5">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.text}`}>{a.riskScore}%</span>
                </td>
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
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
    <div className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
      <img src={farmMap} alt="Farm map" className="h-full w-full object-cover" />
      {SHEDS.map((s) => {
        const m = riskMeta(s.level)
        return (
          <div
            key={s.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-semibold shadow-md ring-1 ring-black/5 dark:bg-gray-900/95 dark:text-gray-100 dark:ring-white/10"
            style={SHED_POS[s.id]}
          >
            <span className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${m.dot}`} />
              {s.name}
              <span style={{ color: m.hex }}>{s.risk}%</span>
            </span>
          </div>
        )
      })}
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-2 rounded-lg bg-white/95 px-2 py-1 text-[10px] shadow ring-1 ring-black/5 dark:bg-gray-900/95 dark:ring-white/10">
        {[['NONE', t('risk.NONE')], ['LOW', t('risk.LOW')], ['MODERATE', t('risk.MODERATE')], ['HIGH', t('risk.HIGH')]].map(
          ([k, lbl]) => (
            <span key={k} className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full" style={{ background: riskMeta(k).hex }} />
              {lbl}
            </span>
          ),
        )}
      </div>
      <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-lg bg-white/95 text-gray-500 shadow ring-1 ring-black/5 dark:bg-gray-900/95 dark:text-gray-400 dark:ring-white/10">
        <Maximize2 size={13} />
      </span>
    </div>
  )
}

/* ---------------- UrgentAlertItem ---------------- */
export function UrgentAlertItem({ alert }) {
  const { t } = useI18n()
  const m = riskMeta(alert.level)
  return (
    <Link to={`/animals/${alert.animalId}`} className="block border-t border-gray-100 py-3 first:border-t-0 hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-gray-800/40">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase ${m.bg} ${m.text}`}>
            {t(`risk.${alert.level}`)}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{alert.animalId}</span>
        </span>
        <span className="text-xs font-semibold" style={{ color: m.hex }}>{alert.risk}% {t('dash.risk')}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{alert.factors.join(', ')}</p>
    </Link>
  )
}

/* ---------------- QuickAction ---------------- */
export function QuickAction({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand-300 hover:bg-brand-50/50 dark:border-gray-800 dark:text-gray-300 dark:hover:border-brand-700 dark:hover:bg-brand-900/20"
    >
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
        <Icon size={16} />
      </span>
      {label}
      <ChevronRight size={15} className="ml-auto text-gray-300 dark:text-gray-600" />
    </Link>
  )
}
