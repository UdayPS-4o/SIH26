import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '@/store/theme'

interface ThemeToggleProps {
  variant?: 'compact' | 'pill' | 'segmented'
  className?: string
}

export default function ThemeToggle({ variant = 'compact', className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme, setTheme } = useThemeStore()
  const isDark = theme === 'dark'

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center p-1 bg-dark-800 border border-dark-700 rounded-xl ${className}`}>
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            !isDark
              ? 'bg-white text-slate-900 shadow-sm font-semibold'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Sun size={14} className={!isDark ? 'text-amber-500 fill-amber-500/20' : ''} />
          <span>Light</span>
        </button>
        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isDark
              ? 'bg-dark-900 text-white shadow-sm border border-dark-700/80 font-semibold'
              : 'text-dark-400 hover:text-dark-200'
          }`}
        >
          <Moon size={14} className={isDark ? 'text-blue-400 fill-blue-400/20' : ''} />
          <span>Dark</span>
        </button>
      </div>
    )
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-dark-850 border border-dark-700 hover:border-dark-600 transition-all cursor-pointer group ${className}`}
        title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      >
        <div className="flex items-center gap-2.5">
          {isDark ? (
            <Moon size={16} className="text-blue-400" />
          ) : (
            <Sun size={16} className="text-amber-500 fill-amber-500/30" />
          )}
          <span className="text-xs font-bold text-dark-100">
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>
        <div className={`w-9 h-5 rounded-full p-0.5 relative transition-colors ${!isDark ? 'bg-indigo-600' : 'bg-dark-700'}`}>
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              !isDark ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </button>
    )
  }

  // Default compact button
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-lg bg-dark-800 border border-dark-700 hover:bg-dark-750 text-dark-300 hover:text-dark-100 transition-all duration-200 relative group ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          size={16}
          className={`absolute transition-all duration-300 ${
            isDark
              ? 'opacity-0 rotate-90 scale-50'
              : 'opacity-100 rotate-0 scale-100 text-amber-500 fill-amber-500/30'
          }`}
        />
        <Moon
          size={16}
          className={`absolute transition-all duration-300 ${
            isDark
              ? 'opacity-100 rotate-0 scale-100 text-blue-400'
              : 'opacity-0 -rotate-90 scale-50'
          }`}
        />
      </div>
    </button>
  )
}
