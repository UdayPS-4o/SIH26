import { useState } from 'react'
import { Check, Wifi, Radio, CloudSun, PhoneCall, MessageSquare } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Toggle } from '../components/common/ui.jsx'
import { useI18n } from '../i18n/i18n.jsx'

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const [profile, setProfile] = useState({ name: 'Shree Dairy Farm', location: 'Anand, Gujarat', herd: 128 })
  const [prefs, setPrefs] = useState({ high: true, moderate: true, sms: true, push: false, ivr: true })
  const [saved, setSaved] = useState(false)

  const sensors = [
    { icon: Radio, name: 'Milk sensor', id: 'MS-01' },
    { icon: Wifi, name: 'Smart collar gateway', id: 'GW-A' },
    { icon: CloudSun, name: 'Environment sensor', id: 'ENV-3' },
  ]

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <PageHeader
        title={t('settings.title')}
        actions={
          <button className="btn-primary" onClick={save}>
            {saved ? <><Check size={15} /> Saved</> : t('settings.save')}
          </button>
        }
      />

      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="p-4 md:p-5">
          <SectionTitle>{t('settings.farmProfile')}</SectionTitle>
          <div className="space-y-3 md:space-y-4">
            <Field label={t('settings.farmName')} value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} />
            <Field label={t('settings.location')} value={profile.location} onChange={(v) => setProfile((p) => ({ ...p, location: v }))} />
            <Field label={t('settings.herdSize')} type="number" value={profile.herd} onChange={(v) => setProfile((p) => ({ ...p, herd: v }))} />
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionTitle>{t('settings.alertPrefs')}</SectionTitle>
          <div className="divide-y divide-sand-100 dark:divide-barn-800">
            <Toggle checked={prefs.high} onChange={(v) => setPrefs((p) => ({ ...p, high: v }))} label={t('settings.highAlerts')} />
            <Toggle checked={prefs.moderate} onChange={(v) => setPrefs((p) => ({ ...p, moderate: v }))} label={t('settings.modAlerts')} />
            <Toggle checked={prefs.sms} onChange={(v) => setPrefs((p) => ({ ...p, sms: v }))} label={t('settings.sms')} />
            <Toggle checked={prefs.push} onChange={(v) => setPrefs((p) => ({ ...p, push: v }))} label={t('settings.push')} />
            <Toggle checked={prefs.ivr} onChange={(v) => setPrefs((p) => ({ ...p, ivr: v }))} label={t('settings.ivr')} />
          </div>

          <div className="mt-3 md:mt-4 rounded-card border border-dashed border-sand-200 bg-sand-50/60 p-3 md:p-4 dark:border-barn-700 dark:bg-barn-800/40">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-sand-500 dark:text-sand-400">
              <MessageSquare size={13} /> {t('settings.noSmartphonePreview')}
            </p>
            <div className="inline-block max-w-[280px] rounded-2xl rounded-bl-sm bg-forest-600 px-3.5 py-2.5 text-xs leading-relaxed text-white shadow-sm">
              {t('settings.smsSample')}
            </div>
            <p className="mt-2 md:mt-3 flex items-start gap-1.5 text-xs text-sand-500 dark:text-sand-400">
              <PhoneCall size={13} className="mt-0.5 shrink-0" />
              {t('settings.ivrNote')}
            </p>
          </div>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionTitle>{t('settings.language')}</SectionTitle>
          <div className="flex gap-2">
            {[
              { code: 'en', label: 'English' },
              { code: 'hi', label: 'हिन्दी' },
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`btn flex-1 justify-center ${lang === l.code ? 'btn-primary' : 'btn-ghost'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <p className="mt-2 md:mt-3 text-xs text-sand-400 dark:text-sand-500">
            Multilingual support is a core requirement for field-level adoption across Indian dairy regions.
          </p>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionTitle>{t('settings.sensors')}</SectionTitle>
          <ul className="space-y-2 md:space-y-3">
            {sensors.map((s) => {
              const Icon = s.icon
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid h-8 w-8 md:h-9 md:w-9 place-items-center rounded-lg bg-sand-50 text-sand-500 dark:bg-barn-800 dark:text-sand-400">
                    <Icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-sand-900 dark:text-sand-100">{s.name}</p>
                    <p className="text-xs text-sand-400">{s.id}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-forest-50 px-2.5 py-1 text-xs font-medium text-forest-700 dark:bg-forest-900/30 dark:text-forest-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-forest-500" />
                    {t('status.connected')}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-2 md:mt-3 text-xs text-sand-400 dark:text-sand-500">Mock statuses — no physical hardware required for this prototype.</p>
        </Card>

        <Card className="p-4 md:p-5">
          <SectionTitle>SMS Notification Log</SectionTitle>
          <div className="space-y-2">
            {useMemo(() => [
              { time: '2 min ago', to: 'Ramesh Kumar', msg: 'HIGH RISK — BUF-042, risk score 87%', status: 'delivered' },
              { time: '18 min ago', to: 'Vet Dr. Sharma', msg: 'ALERT — 3 animals need attention', status: 'delivered' },
              { time: '1 hr ago', to: 'Farm Manager', msg: 'Weekly summary — 12 alerts this week', status: 'delivered' },
              { time: '3 hrs ago', to: 'Ramesh Kumar', msg: 'Shed C temp above threshold (28°C)', status: 'delivered' },
              { time: 'Yesterday', to: 'Ramesh Kumar', msg: 'Moderate risk — BUF-033, score 62%', status: 'delivered' },
            ], []).map((n, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-lg border border-sand-100 bg-sand-50/70 px-3 py-2 dark:border-barn-800 dark:bg-barn-800/50">
                <MessageSquare size={13} className="mt-0.5 shrink-0 text-forest-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-sand-800 dark:text-sand-200 truncate">{n.msg}</p>
                  <p className="mt-0.5 text-[10px] text-sand-400">To: {n.to} · {n.time}</p>
                </div>
                <span className="shrink-0 rounded-full bg-forest-50 px-2 py-0.5 text-[10px] font-medium text-forest-700 dark:bg-forest-900/30 dark:text-forest-400">✓</span>
              </div>
            ))}
          </div>
          <p className="mt-2 md:mt-3 text-xs text-sand-400 dark:text-sand-500">Fabricated notification log for demo purposes.</p>
        </Card>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input mt-1" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
