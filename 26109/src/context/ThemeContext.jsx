import { createContext, useContext, useState, useCallback, useLayoutEffect, useMemo } from 'react'

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

    if (customConfig?.themeId && customConfig.themeId !== 'warm-sand') {
      root.setAttribute('data-custom-theme', 'true')
    } else if (!customConfig?.overrides?.bg && !customConfig?.cssVars?.['--bg']) {
      root.removeAttribute('data-custom-theme')
    } else if (customConfig?.overrides?.bg || customConfig?.cssVars?.['--bg']) {
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
