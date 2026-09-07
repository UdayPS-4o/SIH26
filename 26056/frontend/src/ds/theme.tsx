import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Mode = 'dark' | 'light'

const STORAGE_KEY = 'vimaan.theme'

interface ThemeValue {
  mode: Mode
  setMode: (m: Mode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeValue | null>(null)

function readInitialMode(): Mode {
  if (typeof document === 'undefined') return 'dark'
  const attr = document.documentElement.getAttribute('data-theme')
  return attr === 'light' ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>(readInitialMode)

  const setMode = useCallback((next: Mode) => {
    setModeState(next)
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* private mode; the in-memory value still drives the session */
    }
  }, [])

  const toggle = useCallback(
    () => setMode(mode === 'dark' ? 'light' : 'dark'),
    [mode, setMode],
  )

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode, setMode, toggle])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

/* --------------------------------------------------------------------------
   Chart tokens
   SVG presentation attributes do not resolve `var()`, and Recharts writes
   stroke/fill as attributes. So chart colours are read back off the document
   as concrete values and re-read whenever the mode flips. One resolver, so
   charts still consume design-system roles rather than literals.
   -------------------------------------------------------------------------- */

const CHART_TOKENS = [
  's1',
  's2',
  's3',
  's4',
  's5',
  's6',
  's-other',
  'line-index',
  'band',
  'reference',
  'grid',
  'axis',
  'ink',
  'ink-2',
  'ink-3',
  'line',
  'surface',
  'surface-2',
  'surface-3',
  'mark-ring',
  'accent',
  'gate',
  'good',
  'warn',
  'serious',
  'critical',
  'seq-1',
  'seq-2',
  'seq-3',
  'seq-4',
  'seq-5',
  'seq-6',
  'seq-7',
  'div-n4',
  'div-n3',
  'div-n2',
  'div-n1',
  'div-mid',
  'div-p1',
  'div-p2',
  'div-p3',
  'div-p4',
  'div-ink-strong',
  'div-ink-quiet',
] as const

export type ChartToken = (typeof CHART_TOKENS)[number]
export type ChartTokens = Record<ChartToken, string>

function resolve(): ChartTokens {
  const style = getComputedStyle(document.documentElement)
  const out = {} as ChartTokens
  for (const name of CHART_TOKENS) {
    out[name] = style.getPropertyValue(`--vm-${name}`).trim()
  }
  return out
}

export function useChartTokens(): ChartTokens {
  const { mode } = useTheme()
  const [tokens, setTokens] = useState<ChartTokens>(() => resolve())

  useEffect(() => {
    // The attribute flip and the React commit land in the same frame; read on
    // the next one so the computed styles are the new mode's.
    const id = requestAnimationFrame(() => setTokens(resolve()))
    return () => cancelAnimationFrame(id)
  }, [mode])

  return tokens
}

/** The categorical order. Index 0..5 is slot 1..6; anything past it is "Other". */
export function seriesScale(t: ChartTokens): string[] {
  return [t.s1, t.s2, t.s3, t.s4, t.s5, t.s6]
}

export function seriesColor(t: ChartTokens, i: number): string {
  const scale = seriesScale(t)
  return i < scale.length ? scale[i] : t['s-other']
}

/** Ordered sequential ramp, light to dark in light mode and the reverse in dark. */
export function sequentialScale(t: ChartTokens): string[] {
  return [t['seq-1'], t['seq-2'], t['seq-3'], t['seq-4'], t['seq-5'], t['seq-6'], t['seq-7']]
}

/** Nine-step diverging ramp with a neutral midpoint at index 4. */
export function divergingScale(t: ChartTokens): string[] {
  return [
    t['div-n4'],
    t['div-n3'],
    t['div-n2'],
    t['div-n1'],
    t['div-mid'],
    t['div-p1'],
    t['div-p2'],
    t['div-p3'],
    t['div-p4'],
  ]
}
