import { useState } from 'react'
import { Check, X, PhoneCall } from 'lucide-react'

const OPTIONS = [
  { key: 'confirmed', hi: 'सही है ✓', en: 'Confirmed', icon: Check, tone: 'green' },
  { key: 'not-confirmed', hi: 'नहीं', en: 'Not Confirmed', icon: X, tone: 'gray' },
  { key: 'vet-called', hi: 'वेट कॉल', en: 'Vet Called', icon: PhoneCall, tone: 'amber' },
]

export default function OutcomeButtons({ alertId, onRecord }) {
  const [done, setDone] = useState(false)
  const [choice, setChoice] = useState(null)

  const handle = (opt) => {
    setChoice(opt)
    setDone(true)
    onRecord?.(alertId, opt.key)
  }

  if (done) {
    const selected = OPTIONS.find(o => o.key === choice)
    return (
      <div className="flex items-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs dark:bg-stone-800">
        <selected.icon size={14} />
        <span className="font-medium">{selected.hi} / {selected.en}</span>
        <span className="text-stone-400">· Recorded {new Date().toLocaleDateString('en-IN')}</span>
      </div>
    )
  }

  const toneMap = {
    green: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300',
    gray: 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300',
    amber: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-300',
  }

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon
        return (
          <button
            key={opt.key}
            onClick={() => handle(opt)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${toneMap[opt.tone]}`}
          >
            <Icon size={12} />
            {opt.hi} / {opt.en}
          </button>
        )
      })}
    </div>
  )
}
