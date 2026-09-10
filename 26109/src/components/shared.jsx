import { useState } from 'react'
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
  Volume2,
  VolumeX,
  Leaf,
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
  const [speaking, setSpeaking] = useState(false)

  const speakHindiIVR = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser speech synthesis is not supported')
      return
    }

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    window.speechSynthesis.cancel()
    const levelText = alert.level === 'HIGH' ? 'उच्च' : 'मध्यम'
    const text = `सावधान! पशु ${alert.animalId}, शेड ${alert.shed} में मैस्टाइटिस जोखिम ${alert.risk} प्रतिशत है। जोखिम का स्तर ${levelText} है। अनुशंसित कार्यवाही: ${alert.action || 'तुरंत पशु चिकित्सक से परामर्श लें'}`

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'hi-IN'
    utterance.rate = 0.9

    const voices = window.speechSynthesis.getVoices()
    const hiVoice = voices.find((v) => v.lang.includes('hi') || v.lang.includes('Hindi'))
    if (hiVoice) utterance.voice = hiVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return (
    <div className={`card overflow-hidden`}>
      <div className={`flex items-center justify-between border-l-4 px-3 py-2 sm:px-4 sm:py-2.5 ${m.border} ${m.bg}`} style={{ borderLeftColor: m.hex }}>
        <span className={`text-[11px] font-semibold uppercase tracking-wide sm:text-xs ${m.text}`}>{t(`risk.${alert.level}`)}</span>
        <span className="flex items-center gap-2">
          <ChannelBadges level={alert.level} />
          <button
            onClick={speakHindiIVR}
            title="Play Hindi IVR Voice Alert"
            className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold transition-all shadow-sm ${speaking
              ? 'bg-red-500 text-white animate-pulse ring-2 ring-red-300'
              : 'bg-white/80 text-gray-700 hover:bg-brand-600 hover:text-white dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-brand-600'
              }`}
          >
            {speaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
            <span>IVR</span>
          </button>
          <span className="text-xs text-gray-400">{alert.time}</span>
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

export function RecommendationCard({ rec, index }) {
  const toneMap = { High: 'red', Medium: 'amber', Low: 'gray' }
  const isAyurvedic = rec.title.toLowerCase().includes('ayurvedic')

  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${isAyurvedic ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 relative overflow-hidden' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'}`}>
      {isAyurvedic && <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-100 opacity-50 dark:bg-emerald-900/30"></div>}

      <span className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${isAyurvedic ? 'bg-emerald-200 text-emerald-800 dark:bg-emerald-800/80 dark:text-emerald-200' : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400'}`}>
        {isAyurvedic ? <Leaf size={14} /> : index + 1}
      </span>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm font-medium ${isAyurvedic ? 'text-emerald-900 dark:text-emerald-100 flex items-center gap-2' : 'text-gray-900 dark:text-gray-100'}`}>
            {rec.title}
            {isAyurvedic && <span className="rounded bg-gradient-to-r from-emerald-500 to-green-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm">Ayurveda</span>}
          </p>
          <Pill tone={isAyurvedic ? 'emerald' : toneMap[rec.priority]}>{rec.priority}</Pill>
        </div>
        <p className={`mt-1 text-xs ${isAyurvedic ? 'text-emerald-700 dark:text-emerald-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>{rec.reason}</p>
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
  const { t } = useI18n()
  const m = riskMeta(shed.level)
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-300">{t(`shed.${shed.id}`)}</span>
        <span className="font-semibold" style={{ color: m.hex }}>{shed.risk}%</span>
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
                <td className="py-2.5 text-gray-500 dark:text-gray-400">{t(`species.${a.species.toLowerCase()}`)}</td>
                <td className="py-2.5">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${m.bg} ${m.text}`}>{a.riskScore}%</span>
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
// Interactive SVG Farm Map with real layout structure, risk hotspots & halos
export function FarmMap() {
  const { t } = useI18n()
  const [hoverShed, setHoverShed] = useState(null)

  const shedCoords = {
    A: { x: 50, y: 40, w: 120, h: 70, label: 'Shed A (Low)' },
    B: { x: 210, y: 40, w: 120, h: 70, label: 'Shed B (Moderate)' },
    C: { x: 210, y: 150, w: 120, h: 70, label: 'Shed C (HOTSPOT)' },
    D: { x: 50, y: 150, w: 120, h: 70, label: 'Shed D (Low)' },
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-emerald-950/10 dark:border-gray-800 dark:bg-gray-950">
      <svg viewBox="0 0 380 250" className="w-full h-auto">
        <defs>
          <radialGradient id="hotspotGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
          </radialGradient>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-300/40 dark:text-gray-800" />
          </pattern>
        </defs>

        {/* Background Grid & Roads */}
        <rect width="380" height="250" fill="url(#grid)" />
        <path d="M 180 10 L 180 240 M 30 130 L 350 130" stroke="#cbd5e1" strokeWidth="12" strokeLinecap="round" className="dark:stroke-gray-800" />

        {/* Hotspot risk halo on Shed C */}
        <circle cx="270" cy="185" r="55" fill="url(#hotspotGlow)" className="animate-ping" style={{ animationDuration: '3s' }} />

        {/* Milking Parlour & Water Point */}
        <rect x="160" y="115" width="40" height="30" rx="4" fill="#0284c7" fillOpacity="0.2" stroke="#0284c7" strokeWidth="1.5" />
        <text x="180" y="133" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0284c7">Parlour</text>

        {/* Sheds */}
        {SHEDS.map((s) => {
          const c = shedCoords[s.id]
          const m = riskMeta(s.level)
          const isHot = s.id === 'C'
          return (
            <g key={s.id} className="cursor-pointer transition-all hover:opacity-90" onMouseEnter={() => setHoverShed(s)} onMouseLeave={() => setHoverShed(null)}>
              {/* Outer boundary */}
              <rect
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                rx="6"
                fill={isHot ? '#fef2f2' : '#ffffff'}
                stroke={m.hex}
                strokeWidth={isHot ? '2.5' : '1.5'}
                className="dark:fill-gray-900"
              />
              {/* Roof line details */}
              <line x1={c.x} y1={c.y + c.h / 2} x2={c.x + c.w} y2={c.y + c.h / 2} stroke={m.hex} strokeDasharray="3 3" strokeWidth="0.8" opacity="0.6" />
              {/* Status Pill */}
              <circle cx={c.x + 15} cy={c.y + 16} r="5" fill={m.hex} />
              <text x={c.x + 26} y={c.y + 20} fontSize="11" fontWeight="bold" fill="currentColor" className="dark:fill-gray-100">
                {t(`shed.${s.id}`)}
              </text>
              <text x={c.x + c.w - 12} y={c.y + 20} fontSize="11" fontWeight="bold" textAnchor="end" fill={m.hex}>
                {s.risk}%
              </text>
              <text x={c.x + 15} y={c.y + 45} fontSize="9" fill="#64748b" className="dark:fill-gray-400">
                {s.animals} animals
              </text>
              {isHot && (
                <rect x={c.x + 10} y={c.y + c.h - 18} width="100" height="13" rx="3" fill="#ef4444" fillOpacity="0.15">
                  <title>Hotspot Interventions required</title>
                </rect>
              )}
              {isHot && (
                <text x={c.x + 60} y={c.y + c.h - 8} fontSize="8" fontWeight="bold" textAnchor="middle" fill="#dc2626">
                  🔥 HOTSPOT CLUSTER
                </text>
              )}
            </g>
          )
        })}

        {/* Legend */}
        <g transform="translate(10, 230)">
          <text x="0" y="0" fontSize="9" fill="#94a3b8">N ↑</text>
        </g>
      </svg>

      {/* Tooltip Overlay */}
      {hoverShed && (
        <div className="absolute top-2 right-2 rounded-lg bg-gray-900/90 px-3 py-1.5 text-xs text-white shadow-lg backdrop-blur">
          <p className="font-bold">{t(`shed.${hoverShed.id}`)} Details</p>
          <p>Risk: <span style={{ color: riskMeta(hoverShed.level).hex }}>{hoverShed.risk}% ({hoverShed.level})</span></p>
          <p>Animals: {hoverShed.animals}</p>
        </div>
      )}
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
