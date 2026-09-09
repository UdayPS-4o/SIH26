import { useState } from 'react'
import { PhoneCall, CheckCircle2, Share2 } from 'lucide-react'
import { useI18n } from '../../i18n/i18n.jsx'

export default function VetEscalation({ animalId, riskScore }) {
  const { t } = useI18n()
  const [escalated, setEscalated] = useState(false)
  const [copied, setCopied] = useState(false)

  const sampleMessage = `ALERT: ${animalId} — Mastitis risk at ${riskScore}%. Immediate veterinary attention required. Symptoms: high SCC, possible subclinical/clinical mastitis. Please attend at the earliest. — Gaurogya Setu, Shree Dairy Farm`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sampleMessage)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available — ignore silently
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Vet Escalation: ${animalId}`, text: sampleMessage })
      } catch {
        // user cancelled share — ignore
      }
    } else {
      handleCopy()
    }
  }

  return (
    <div className="rounded-card border border-red-200 bg-red-50 p-5 dark:border-red-800/40 dark:bg-red-950/20">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
          <PhoneCall size={20} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-300">{t('suggest.contactVet')}</h3>
          <p className="text-xs text-red-600 dark:text-red-400">
            {animalId} — Risk {riskScore}%
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-red-200 bg-white p-3 dark:border-red-800/30 dark:bg-barn-950/40">
        <p className="text-xs text-sand-500 dark:text-sand-400">{t('suggest.disclaimer')}</p>
        <p className="mt-2 text-sm text-sand-700 dark:text-sand-300">{sampleMessage}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href="tel:+919876543210" className="btn-primary inline-flex items-center gap-2">
          <PhoneCall size={15} />
          {t('suggest.contactVet')}
        </a>
        <button className="btn-ghost inline-flex items-center gap-2" onClick={handleShare}>
          <Share2 size={15} />
          {copied ? t('suggest.markEscalated') : 'Share Alert'}
        </button>
        <button
          className={`btn-ghost inline-flex items-center gap-2 ${
            escalated ? 'text-forest-700 dark:text-forest-400' : ''
          }`}
          onClick={() => setEscalated(!escalated)}
        >
          {escalated ? <CheckCircle2 size={15} /> : <CheckCircle2 size={15} />}
          {escalated ? t('suggest.escalated') : t('suggest.markEscalated')}
        </button>
      </div>
    </div>
  )
}
