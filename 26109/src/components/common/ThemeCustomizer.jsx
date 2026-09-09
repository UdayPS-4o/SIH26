import { useState, useCallback, useEffect, useMemo } from 'react'
import { X, Download, Upload, Type, Sliders, Sparkles, Check, Keyboard, Copy, RefreshCw, Palette } from 'lucide-react'
import { THEME_SYSTEMS, exportThemeJSON, resolveTheme } from '../../data/themeSystems'
import { useTheme } from '../../context/ThemeContext.jsx'

const CATEGORIES = [
  { key: 'all', label: 'All', labelKey: 'All' },
  { key: 'dark', label: 'Dark', labelKey: 'Dark' },
  { key: 'pastel', label: 'Pastel', labelKey: 'Pastel' },
  { key: 'light', label: 'Light', labelKey: 'Light' },
  { key: 'curated', label: 'Curated', labelKey: 'Curated' },
  { key: 'monochrome', label: 'Mono', labelKey: 'Mono' },
]

const FONT_OPTIONS = [
  'Inter','Manrope','Karla','Nunito','Nunito Sans','Rubik','Lato',
  'Work Sans','IBM Plex Sans','Source Sans 3','Poppins','Quicksand',
  'Mulish','Fredoka','Archivo','Courgette','Permanent Marker',
  'Caveat Brush','Caveat','Dancing Script','Oleo Script',
  'Calligraffitti','Indie Flower','Gloria Hallelujah','Kaushan Script',
  'Elsie','Satisfy','Aclonica','Lobster Two','Libre Baskerville',
  'Playfair Display',
]

function hexToRgb(hex) {
  const m = hex.replace('#','').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? `${parseInt(m[1],16)}, ${parseInt(m[2],16)}, ${parseInt(m[3],16)}` : '0,0,0'
}

function contrastRatio(hex1, hex2) {
  const lum = (h) => {
    const [r,g,b] = hexToRgb(h).split(',').map(Number)
    const [rs,gs,bs] = [r,g,b].map(c => c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4))
    return 0.2126*rs + 0.7152*gs + 0.0722*bs
  }
  const l1 = lum(hex1), l2 = lum(hex2)
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function ColorField({ label, value, onChange, role }) {
  const ratio = role && value ? contrastRatio(value, '#000000') : null
  return (
    <div className="flex items-center gap-2.5">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-8 cursor-pointer rounded-lg border-2 border-sand-200 bg-transparent p-0.5"
      />
      <div className="flex-1 min-w-0">
        <span className="text-[11px] font-medium text-sand-500">{label}</span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-sand-700 dark:text-sand-300">{value}</span>
          <button onClick={() => copyToClipboard(value)} className="text-sand-400 hover:text-sand-600">
            <Copy size={10} />
          </button>
          {ratio && (
            <span className={`text-[10px] font-medium ${ratio >= 4.5 ? 'text-forest-600' : ratio >= 3 ? 'text-honey-600' : 'text-red-500'}`}>
              {ratio.toFixed(1)}:1
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ThemePreviewCard({ themeId, selected, onClick }) {
  const t = THEME_SYSTEMS[themeId]
  return (
    <button
      onClick={onClick}
      className={`group relative w-full rounded-xl border-2 p-2.5 text-left transition-all ${
        selected
          ? 'border-honey-500 shadow-warm ring-2 ring-honey-200 dark:ring-honey-900'
          : 'border-sand-200 hover:border-honey-300 dark:border-barn-700'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex -space-x-1">
          {[t.bg, t.card, t.headline, t.button].map((c, i) => (
            <span key={i} className="h-4 w-4 rounded-full border border-white dark:border-barn-900" style={{ background: c }} />
          ))}
        </div>
        {selected && <Check size={14} className="ml-auto text-honey-600" />}
      </div>
      <p className="text-xs font-semibold text-sand-900 dark:text-sand-100 truncate">{t.name}</p>
      <p className="text-[10px] text-sand-400">{t.accentLabel}</p>
    </button>
  )
}

function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'presets', label: 'Presets', icon: Palette },
    { id: 'basic', label: 'Basic', icon: Type },
    { id: 'advanced', label: 'Advanced', icon: Sliders },
    { id: 'export', label: 'Export', icon: Download },
  ]
  return (
    <div className="flex items-center gap-0.5 rounded-xl bg-sand-100 p-1 dark:bg-barn-800/40">
      {tabs.map((tab) => {
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
              active === tab.id
                ? 'bg-white text-sand-900 shadow-sm dark:bg-barn-900 dark:text-sand-100'
                : 'text-sand-500 hover:text-sand-700 dark:text-sand-400'
            }`}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function ThemeCustomizer() {
  const { theme: darkMode, toggleTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('presets')
  const [category, setCategory] = useState('all')

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('gaurogya-theme-customizer')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {
      themeId: 'warm-sand',
      category: 'light',
      overrides: {},
      cssVars: {},
      highContrast: false,
      reduceMotion: false,
      fontSizeScale: 1,
      borderRadius: 12,
    }
  })

  const resolved = useMemo(() => resolveTheme(config.themeId, config.overrides, config.cssVars), [config])
  const filteredThemes = useMemo(() =>
    Object.entries(THEME_SYSTEMS).filter(([, t]) => category === 'all' || t.category === category),
    [category])

  useEffect(() => {
    try { localStorage.setItem('gaurogya-theme-customizer', JSON.stringify(config)) } catch {}
  }, [config])

  useEffect(() => {
    if (!resolved || !resolved.resolved) return
    const root = document.documentElement
    const c = resolved.resolved
    root.style.setProperty('--custom-bg', c.bg)
    root.style.setProperty('--custom-card', c.card)
    root.style.setProperty('--custom-headline', c.headline)
    root.style.setProperty('--custom-button', c.button)
    root.style.setProperty('--custom-text', c.text)
    root.style.setProperty('--custom-font-heading', c.headingFont)
    root.style.setProperty('--custom-font-body', c.bodyFont)
    root.style.setProperty('--custom-font-scale', String(config.fontSizeScale))
    root.style.setProperty('--custom-radius', `${config.borderRadius}px`)
    if (config.highContrast) root.classList.add('high-contrast')
    else root.classList.remove('high-contrast')
    if (config.reduceMotion) root.classList.add('reduce-motion')
    else root.classList.remove('reduce-motion')
  }, [resolved, config])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'T' && e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handler, { capture: true })
    return () => window.removeEventListener('keydown', handler, { capture: true })
  }, [])

  const selectTheme = useCallback((id) => {
    setConfig((prev) => ({ ...prev, themeId: id, overrides: {}, cssVars: {} }))
  }, [])

  const updateOverride = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, overrides: { ...prev.overrides, [key]: value } }))
  }, [])

  const updateCssVar = useCallback((key, value) => {
    setConfig((prev) => ({ ...prev, cssVars: { ...prev.cssVars, [key]: value } }))
  }, [])

  const handleExport = useCallback(() => {
    const json = exportThemeJSON(config)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gaurogya-theme-${config.themeId}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [config])

  const handleImport = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const text = await file.text()
      try {
        const data = JSON.parse(text)
        if (data.theme) {
          setConfig({
            themeId: data.theme.id || 'warm-sand',
            category: data.theme.category || 'light',
            overrides: data.theme.overrides || {},
            cssVars: data.theme.cssVars || {},
            highContrast: data.theme.accessibility?.highContrast || false,
            reduceMotion: data.theme.accessibility?.reduceMotion || false,
            fontSizeScale: data.theme.layout?.fontSizeScale || 1,
            borderRadius: data.theme.layout?.borderRadius || 12,
          })
          setTab('basic')
        }
      } catch {}
    }
    input.click()
  }, [])

  const resetAll = useCallback(() => {
    setConfig({
      themeId: 'warm-sand',
      category: 'light',
      overrides: {},
      cssVars: {},
      highContrast: false,
      reduceMotion: false,
      fontSizeScale: 1,
      borderRadius: 12,
    })
  }, [])

  const c = resolved && resolved.resolved

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-barn-900">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-sand-200 px-4 py-3 dark:border-barn-800">
          <div>
            <h2 className="text-sm font-bold text-sand-900 dark:text-sand-100">Theme Customizer</h2>
            <p className="text-[11px] text-sand-400">{resolved?.name} · <kbd className="rounded border border-sand-200 bg-sand-50 px-1 py-0.5 text-[10px] font-mono dark:border-barn-700 dark:bg-barn-800">Shift+T</kbd> to toggle</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={resetAll} className="grid h-8 w-8 place-items-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-sand-600 dark:hover:bg-barn-800" title="Reset all">
              <RefreshCw size={14} />
            </button>
            <button onClick={() => setOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-sand-400 hover:bg-sand-100 hover:text-sand-600 dark:hover:bg-barn-800">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 border-b border-sand-100 px-4 py-2.5 dark:border-barn-800/60">
          <TabBar active={tab} onChange={setTab} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {tab === 'presets' && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                      category === cat.key
                        ? 'bg-honey-100 text-honey-800 dark:bg-honey-900/30 dark:text-honey-300'
                        : 'bg-sand-50 text-sand-600 hover:bg-sand-100 dark:bg-barn-800/40 dark:text-sand-300'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredThemes.map(([id]) => (
                  <ThemePreviewCard
                    key={id}
                    themeId={id}
                    selected={config.themeId === id}
                    onClick={() => selectTheme(id)}
                  />
                ))}
              </div>

              {/* 3 picks */}
              <div className="mt-4 rounded-xl border border-honey-200 bg-honey-50/50 p-3 dark:border-honey-800/40 dark:bg-honey-900/10">
                <p className="text-xs font-semibold text-honey-800 dark:text-honey-300">Recommended for Gaurogya Setu</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { id: 'warm-sand', label: 'Warm Sand' },
                    { id: 'sage-garden', label: 'Sage Garden' },
                    { id: 'obsidian-amber', label: 'Obsidian Amber' },
                  ].map((pick) => {
                    const pt = THEME_SYSTEMS[pick.id]
                    const isSelected = config.themeId === pick.id
                    return (
                      <button
                        key={pick.id}
                        onClick={() => selectTheme(pick.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? 'border-honey-400 bg-honey-100 text-honey-800 shadow-sm dark:bg-honey-900/30 dark:text-honey-300 dark:border-honey-700'
                            : 'border-honey-200 bg-white text-sand-700 hover:bg-honey-50 dark:bg-barn-800 dark:text-sand-300 dark:border-barn-700 dark:hover:bg-barn-700'
                        }`}
                      >
                        <div className="flex -space-x-1">
                          {[pt.bg, pt.card, pt.headline, pt.button].map((cl, i) => (
                            <span key={i} className="h-3.5 w-3.5 rounded-full border border-white dark:border-barn-900" style={{ background: cl }} />
                          ))}
                        </div>
                        <span>{pick.label}</span>
                        {isSelected && <Check size={12} className="ml-0.5" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === 'basic' && (
            <div className="space-y-5">
              {c && (
                <div className="rounded-xl border border-sand-200 overflow-hidden dark:border-barn-700">
                  <div className="px-3 py-2 text-[10px] font-semibold text-sand-400 uppercase tracking-wider border-b border-sand-100 dark:border-barn-800">
                    Live Preview
                  </div>
                  <div className="p-4 space-y-3" style={{ background: c.bg }}>
                    <div className="rounded-lg p-3" style={{ background: c.card }}>
                      <p className="text-sm font-bold" style={{ color: c.headline, fontFamily: c.headingFont }}>Welcome to Gaurogya Setu</p>
                      <p className="mt-1 text-xs" style={{ color: c.text, opacity: 0.85 }}>
                        AI-powered cattle health monitoring for modern farmers.
                      </p>
                      <button className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90" style={{ background: c.button }}>
                        Get Started
                      </button>
                    </div>
                    <div className="flex gap-2">
                      {[c.headline, c.button, c.text].map((cl, i) => (
                        <span key={i} className="h-5 w-5 rounded-full border-2 border-white/50" style={{ background: cl }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold text-sand-700 dark:text-sand-300">Colors</p>
                {[
                  { key: 'bg', label: 'Background' },
                  { key: 'card', label: 'Card' },
                  { key: 'headline', label: 'Headline / Accent' },
                  { key: 'button', label: 'Button' },
                  { key: 'text', label: 'Text' },
                ].map(({ key, label }) => (
                  <ColorField
                    key={key}
                    label={label}
                    value={config.overrides[key] || (c && c[key]) || '#ffffff'}
                    onChange={(v) => updateOverride(key, v)}
                    role={key}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-sand-700 dark:text-sand-300">Typography</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-sand-500">Heading font</label>
                    <select
                      value={config.overrides.headingFont || (c && c.headingFont) || 'Inter'}
                      onChange={(e) => updateOverride('headingFont', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-xs dark:border-barn-700 dark:bg-barn-800 dark:text-sand-100"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] italic" style={{ fontFamily: config.overrides.headingFont || (c && c.headingFont) }}>
                      Ag {config.overrides.headingFont || (c && c.headingFont)}
                    </p>
                  </div>
                  <div>
                    <label className="text-[11px] text-sand-500">Body font</label>
                    <select
                      value={config.overrides.bodyFont || (c && c.bodyFont) || 'Inter'}
                      onChange={(e) => updateOverride('bodyFont', e.target.value)}
                      className="mt-1 w-full rounded-lg border border-sand-200 bg-white px-2.5 py-1.5 text-xs dark:border-barn-700 dark:bg-barn-800 dark:text-sand-100"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px]" style={{ fontFamily: config.overrides.bodyFont || (c && c.bodyFont) }}>
                      Ag {config.overrides.bodyFont || (c && c.bodyFont)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-ai" />
                  <p className="text-xs font-semibold text-sand-700 dark:text-sand-300">CSS Custom Properties</p>
                </div>
                <p className="text-[11px] text-sand-400">Override any CSS variable. These take precedence over theme presets.</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {[
                    { key: '--bg', label: 'Background', default: c && c.bg },
                    { key: '--card', label: 'Card', default: c && c.card },
                    { key: '--headline', label: 'Headline', default: c && c.headline },
                    { key: '--button', label: 'Button', default: c && c.button },
                    { key: '--text', label: 'Primary Text', default: c && c.text },
                    { key: '--border', label: 'Border', default: '#e8dfd0' },
                    { key: '--muted', label: 'Muted Text', default: '#9ca3af' },
                    { key: '--accent', label: 'Accent', default: c && c.headline },
                    { key: '--surface', label: 'Surface', default: c && c.card },
                    { key: '--font-heading', label: 'Heading Font', default: c && c.headingFont },
                    { key: '--font-body', label: 'Body Font', default: c && c.bodyFont },
                  ].map(({ key, label, default: def }) => (
                    <div key={key} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={config.cssVars[key] || def || '#ffffff'}
                        onChange={(e) => updateCssVar(key, e.target.value)}
                        className="h-8 w-8 cursor-pointer rounded-lg border-2 border-sand-200 bg-transparent p-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[11px] text-sand-500">{label}</span>
                        <div className="font-mono text-[10px] text-sand-400">{key}</div>
                      </div>
                      <input
                        type="text"
                        value={config.cssVars[key] || ''}
                        onChange={(e) => updateCssVar(key, e.target.value)}
                        placeholder={def}
                        className="w-24 rounded border border-sand-200 bg-white px-1.5 py-1 text-[10px] font-mono dark:border-barn-700 dark:bg-barn-800 dark:text-sand-100"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-sand-700 dark:text-sand-300">Accessibility</p>
                <div className="space-y-2.5">
                  {[
                    { key: 'highContrast', label: 'High Contrast Mode', desc: 'Increases contrast to WCAG AAA (7:1 minimum)' },
                    { key: 'reduceMotion', label: 'Reduce Motion', desc: 'Disables animations and transitions for vestibular sensitivity' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} className="flex items-start gap-3 rounded-lg border border-sand-200 p-3 dark:border-barn-700 cursor-pointer">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config[key]}
                        onClick={() => setConfig((p) => ({ ...p, [key]: !p[key] }))}
                        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                          config[key] ? 'bg-forest-500' : 'bg-sand-300 dark:bg-barn-700'
                        }`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          config[key] ? 'translate-x-5' : 'translate-x-0.5'
                        }`} />
                      </button>
                      <div>
                        <p className="text-xs font-medium text-sand-800 dark:text-sand-200">{label}</p>
                        <p className="mt-0.5 text-[11px] text-sand-400">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-sand-700 dark:text-sand-300">Layout</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] text-sand-500">Font Size Scale</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range" min="0.875" max="1.25" step="0.125"
                        value={config.fontSizeScale}
                        onChange={(e) => setConfig((p) => ({ ...p, fontSizeScale: Number(e.target.value) }))}
                        className="flex-1"
                      />
                      <span className="w-10 text-right text-xs font-medium text-sand-700 dark:text-sand-300">{Math.round(config.fontSizeScale * 100)}%</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-sand-500">Border Radius: {config.borderRadius}px</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="range" min="0" max="16" step="2"
                        value={config.borderRadius}
                        onChange={(e) => setConfig((p) => ({ ...p, borderRadius: Number(e.target.value) }))}
                        className="flex-1"
                      />
                      <div className="flex gap-1">
                        {[0, 4, 8, 12, 16].map((r) => (
                          <button
                            key={r}
                            onClick={() => setConfig((p) => ({ ...p, borderRadius: r }))}
                            className={`grid h-7 w-7 place-items-center rounded-md text-[10px] font-medium ${
                              config.borderRadius === r
                                ? 'bg-honey-100 text-honey-700 dark:bg-honey-900/30 dark:text-honey-300'
                                : 'bg-sand-50 text-sand-500 dark:bg-barn-800 dark:text-sand-400'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-sand-200 p-3 dark:border-barn-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-sand-800 dark:text-sand-200">Dark Mode</p>
                    <p className="text-[11px] text-sand-400">{darkMode === 'dark' ? 'Dark theme active' : 'Light theme active'}</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative h-8 w-14 rounded-full transition-colors ${
                      darkMode === 'dark' ? 'bg-barn-700' : 'bg-sand-300'
                    }`}
                  >
                    <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      darkMode === 'dark' ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'export' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-sand-200 p-4 dark:border-barn-700">
                <h3 className="text-sm font-semibold text-sand-900 dark:text-sand-100">{resolved?.name}</h3>
                <p className="mt-0.5 text-xs text-sand-400">{resolved?.category} · {resolved?.accentLabel}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {c && ['bg','card','headline','button','text'].map((role) => (
                    <div key={role} className="flex items-center gap-1.5 rounded-lg border border-sand-200 bg-white px-2 py-1.5 dark:border-barn-700 dark:bg-barn-800">
                      <span className="h-3.5 w-3.5 rounded-full" style={{ background: c[role] }} />
                      <span className="text-[10px] font-mono text-sand-600 dark:text-sand-300">{c[role]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {(config.overrides.bg || config.overrides.headline || config.cssVars['--bg'] || config.cssVars['--border']) && (
                <div className="rounded-xl border border-honey-200 bg-honey-50/50 p-3 dark:border-honey-800/40 dark:bg-honey-900/10">
                  <p className="text-xs font-semibold text-honey-800 dark:text-honey-300">Custom Overrides Active</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {Object.entries(config.overrides).filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[10px] font-mono dark:bg-barn-800">
                        <span className="h-2 w-2 rounded-full" style={{ background: v }} />
                        {k}: {v}
                      </span>
                    ))}
                    {Object.entries(config.cssVars).filter(([, v]) => v).map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-1 text-[10px] font-mono dark:bg-barn-800">
                        <span className="h-2 w-2 rounded-full" style={{ background: typeof v === 'string' && v.startsWith('#') ? v : '#888' }} />
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 rounded-xl bg-honey-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-honey-700"
                >
                  <Download size={16} /> Export JSON
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-sand-200 px-4 py-3 text-sm font-semibold text-sand-700 transition-colors hover:border-honey-300 hover:bg-sand-50 dark:border-barn-700 dark:text-sand-300"
                >
                  <Upload size={16} /> Import JSON
                </button>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-medium text-sand-500">JSON Preview</p>
                  <button
                    onClick={() => copyToClipboard(exportThemeJSON(config))}
                    className="inline-flex items-center gap-1 text-[11px] text-sand-400 hover:text-honey-600"
                  >
                    <Copy size={10} /> Copy
                  </button>
                </div>
                <pre className="overflow-x-auto rounded-xl border border-sand-200 bg-sand-50 p-3 text-[11px] leading-relaxed text-sand-700 dark:border-barn-700 dark:bg-barn-950 dark:text-sand-300">
                  {exportThemeJSON(config)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 flex items-center justify-between border-t border-sand-100 px-4 py-2 text-[11px] text-sand-400 dark:border-barn-800">
          <span>22 themes · {Object.keys(THEME_SYSTEMS).length} presets</span>
          <div className="flex items-center gap-1">
            <Keyboard size={10} />
            <kbd className="rounded border border-sand-200 bg-sand-50 px-1 py-0.5 text-[10px] font-mono dark:border-barn-700 dark:bg-barn-800">Shift+T</kbd>
          </div>
        </div>
      </div>
    </div>
  )
}
