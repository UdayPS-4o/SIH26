import { createContext, useContext, useState, useCallback, useLayoutEffect, useMemo } from 'react'
import { THEME_SYSTEMS } from '../data/themeSystems'

const STORAGE_KEY = 'gaurogya-theme'
const CUSTOMIZER_KEY = 'gaurogya-theme-customizer'

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch (e) { /* ignore */ }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

function getInitialCustomizer() {
  try {
    const saved = localStorage.getItem(CUSTOMIZER_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [customConfig, setCustomConfig] = useState(getInitialCustomizer)

  /* dark/light mode toggle */
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try { localStorage.setItem(STORAGE_KEY, theme) } catch (e) { /* ignore */ }
  }, [theme])

  /* apply custom theme overrides */
  useLayoutEffect(() => {
    const root = document.documentElement

    const hasCustomTheme = customConfig && (
      (customConfig.themeId && customConfig.themeId !== 'warm-sand') ||
      (customConfig.overrides && Object.keys(customConfig.overrides).length > 0) ||
      (customConfig.cssVars && Object.keys(customConfig.cssVars).some(k => customConfig.cssVars[k]))
    )
    if (hasCustomTheme) {
      root.setAttribute('data-custom-theme', 'true')
    } else {
      root.removeAttribute('data-custom-theme')
    }

    if (customConfig?.highContrast) root.setAttribute('data-high-contrast', 'true')
    else root.removeAttribute('data-high-contrast')

    if (customConfig?.reduceMotion) root.setAttribute('data-reduce-motion', 'true')
    else root.removeAttribute('data-reduce-motion')

    if (customConfig?.cssVars) {
      Object.entries(customConfig.cssVars).forEach(([key, value]) => {
        if (value) root.style.setProperty(key, value)
        else root.style.removeProperty(key)
      })
    }

    // Apply theme CSS variables for site-wide theme switching
    if (customConfig?.themeId) {
      const base = THEME_SYSTEMS[customConfig.themeId]
      if (base) {
        const o = customConfig.overrides || {}
        const cv = customConfig.cssVars || {}
        root.style.setProperty('--custom-bg', cv['--bg'] || o.bg || base.bg)
        root.style.setProperty('--custom-card', cv['--card'] || o.card || base.card)
        root.style.setProperty('--custom-headline', cv['--headline'] || o.headline || base.headline)
        root.style.setProperty('--custom-button', cv['--button'] || o.button || base.button)
        root.style.setProperty('--custom-text', cv['--text'] || o.text || base.text)
        root.style.setProperty('--custom-border', cv['--border'] || o.border || base.border || base.card)
        root.style.setProperty('--custom-muted', cv['--muted'] || base.muted || '#9ca3af')
        root.style.setProperty('--custom-accent', cv['--accent'] || base.headline)
        root.style.setProperty('--custom-surface', cv['--surface'] || base.card)
        root.style.setProperty('--custom-font-heading', cv['--font-heading'] || o.headingFont || base.headingFont)
        root.style.setProperty('--custom-font-body', cv['--font-body'] || o.bodyFont || base.bodyFont)
        root.style.setProperty('--custom-font-scale', String(customConfig.fontSizeScale || 1))
        root.style.setProperty('--custom-radius', `${customConfig.borderRadius || 12}px`)

        /* Sidebar overrides */
        const hasSidebarOverrides = o.sidebarFrom || o.sidebarVia || o.sidebarTo || o.sidebarText || o.sidebarMuted || o.sidebarActive
        if (hasSidebarOverrides) {
          root.style.setProperty('--custom-sidebar-from', cv['--sidebar-from'] || o.sidebarFrom || '#14532d')
          root.style.setProperty('--custom-sidebar-via', cv['--sidebar-via'] || o.sidebarVia || '#14532d')
          root.style.setProperty('--custom-sidebar-to', cv['--sidebar-to'] || o.sidebarTo || '#78350f')
          root.style.setProperty('--custom-sidebar-text', cv['--sidebar-text'] || o.sidebarText || '#f0fdf4')
          root.style.setProperty('--custom-sidebar-muted', cv['--sidebar-muted'] || o.sidebarMuted || '#86efac')
          root.style.setProperty('--custom-sidebar-active', cv['--sidebar-active'] || o.sidebarActive || '#f59e0b')
        } else {
          ;['--custom-sidebar-from', '--custom-sidebar-via', '--custom-sidebar-to', '--custom-sidebar-text', '--custom-sidebar-muted', '--custom-sidebar-active'].forEach(k => root.style.removeProperty(k))
        }

        if (customConfig.highContrast) root.classList.add('high-contrast')
        else root.classList.remove('high-contrast')
        if (customConfig.reduceMotion) root.classList.add('reduce-motion')
        else root.classList.remove('reduce-motion')
      }
    }
  }, [customConfig])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  const toggleCustomizer = useCallback(() => {
    setCustomizerOpen((prev) => !prev)
  }, [])

  const updateCustomConfig = useCallback((updater) => {
    setCustomConfig((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      try { localStorage.setItem(CUSTOMIZER_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const resetCustomConfig = useCallback(() => {
    setCustomConfig(null)
    try { localStorage.removeItem(CUSTOMIZER_KEY) } catch {}
    document.documentElement.removeAttribute('data-custom-theme')
    document.documentElement.removeAttribute('data-high-contrast')
    document.documentElement.removeAttribute('data-reduce-motion')
  }, [])

  const value = useMemo(() => ({
    theme, setTheme, toggleTheme,
    customizerOpen, setCustomizerOpen, toggleCustomizer,
    customConfig, updateCustomConfig, resetCustomConfig,
  }), [theme, toggleTheme, customizerOpen, toggleCustomizer, customConfig, updateCustomConfig, resetCustomConfig])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
