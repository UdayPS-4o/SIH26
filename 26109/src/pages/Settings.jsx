import { useState } from 'react'
import { Check, Wifi, Radio, CloudSun } from 'lucide-react'
import { PageHeader, Card, SectionTitle, Toggle } from '../components/common/ui.jsx'
import { useI18n } from '../i18n/i18n.jsx'

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const [profile, setProfile] = useState({ name: 'Shree Dairy Farm', location: 'Anand, Gujarat', herd: 128 })
  const [prefs, setPrefs] = useState({ high: true, moderate: true, sms: true, push: false })
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle>{t('settings.farmProfile')}</SectionTitle>
          <div className="space-y-4">
            <Field label={t('settings.farmName')} value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} />
            <Field label={t('settings.location')} value={profile.location} onChange={(v) => setProfile((p) => ({ ...p, location: v }))} />
            <Field label={t('settings.herdSize')} type="number" value={profile.herd} onChange={(v) => setProfile((p) => ({ ...p, herd: v }))} />
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle>{t('settings.alertPrefs')}</SectionTitle>
          <div className="divide-y divide-gray-100">
            <Toggle checked={prefs.high} onChange={(v) => setPrefs((p) => ({ ...p, high: v }))} label={t('settings.highAlerts')} />
            <Toggle checked={prefs.moderate} onChange={(v) => setPrefs((p) => ({ ...p, moderate: v }))} label={t('settings.modAlerts')} />
            <Toggle checked={prefs.sms} onChange={(v) => setPrefs((p) => ({ ...p, sms: v }))} label={t('settings.sms')} />
            <Toggle checked={prefs.push} onChange={(v) => setPrefs((p) => ({ ...p, push: v }))} label={t('settings.push')} />
          </div>
        </Card>

        <Card className="p-5">
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
          <p className="mt-3 text-xs text-gray-400">
            Multilingual support is a core requirement for field-level adoption across Indian dairy regions.
          </p>
        </Card>

        <Card className="p-5">
          <SectionTitle>{t('settings.sensors')}</SectionTitle>
          <ul className="space-y-3">
            {sensors.map((s) => {
              const Icon = s.icon
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-gray-50 text-gray-500">
                    <Icon size={16} />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.id}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    {t('status.connected')}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-gray-400">Mock statuses — no physical hardware required for this prototype.</p>
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
