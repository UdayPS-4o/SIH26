import { create } from 'zustand'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nummf.theme'

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

interface ThemeStore {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggle: () => void
}

export const useTheme = create<ThemeStore>((set, get) => ({
  theme: 'light',
  setTheme: theme => {
    apply(theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // Preference will not persist, which is not worth failing the switch over.
    }
    set({ theme })
  },
  toggle: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
}))

/** Called once at start-up, before React paints, to avoid a flash of the wrong theme. */
export function initTheme() {
  const theme = initialTheme()
  apply(theme)
  useTheme.setState({ theme })
}
