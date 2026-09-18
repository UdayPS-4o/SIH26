import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeColors {
  bg: string;
  surface: string;
  surfaceHi: string;
  border: string;
  borderHi: string;
  text: string;
  textSec: string;
  textDim: string;
  accent: string;
  red: string;
  orange: string;
  amber: string;
  green: string;
  purple: string;
  pink: string;
  teal: string;
}

const darkColors: ThemeColors = {
  bg:        '#0a0e14',
  surface:   '#11151c',
  surfaceHi: '#181d27',
  border:    '#1e2736',
  borderHi:  '#2a3548',
  text:      '#e8ecf1',
  textSec:   '#8b95a5',
  textDim:   '#4f5b6b',
  accent:    '#3b82f6',
  red:       '#ef4444',
  orange:    '#f59e0b',
  amber:     '#f59e0b',
  green:     '#22c55e',
  purple:    '#8b5cf6',
  pink:      '#ec4899',
  teal:      '#06b6d4',
};

const lightColors: ThemeColors = {
  bg:        '#f8fafc',
  surface:   '#ffffff',
  surfaceHi: '#f1f5f9',
  border:    '#e2e8f0',
  borderHi:  '#cbd5e1',
  text:      '#0f172a',
  textSec:   '#475569',
  textDim:   '#94a3b8',
  accent:    '#2563eb',
  red:       '#dc2626',
  orange:    '#d97706',
  amber:     '#d97706',
  green:     '#16a34a',
  purple:    '#7c3aed',
  pink:      '#db2777',
  teal:      '#0891b2',
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  C: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType>({
  isDark: true,
  toggleTheme: () => {},
  C: darkColors,
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('watchtower-theme');
    return saved ? saved === 'dark' : true;
  });

  const colors = isDark ? darkColors : lightColors;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('watchtower-theme', isDark ? 'dark' : 'light');

    const set = (prop: string, val: string) => root.style.setProperty(prop, val);

    /* Old names (backward compat for inline styles & existing CSS) */
    set('--bg-primary',    colors.bg);
    set('--bg-secondary',  colors.surface);
    set('--bg-card',       colors.surface);
    set('--bg-card-hover', colors.surfaceHi);
    set('--border-color',  colors.border);
    set('--border-active', colors.borderHi);
    set('--text-primary',  colors.text);
    set('--text-secondary',colors.textSec);
    set('--text-muted',    colors.textDim);
    set('--accent-cyan',   colors.accent);
    set('--accent-green',  colors.green);
    set('--accent-red',    colors.red);
    set('--accent-orange', colors.orange);
    set('--accent-yellow', colors.amber);
    set('--accent-purple', colors.purple);

    /* New design-system tokens */
    set('--bg-base',     colors.bg);
    set('--bg-surface',  colors.surface);
    set('--bg-elevated', colors.surfaceHi);
    set('--bg-inset',    colors.bg);
    set('--border-default', colors.border);
    set('--border-strong',  colors.borderHi);
    set('--border-muted',   isDark ? '#151c28' : '#eef1f5');
    set('--color-accent',    colors.accent);
    set('--color-accent-dim', isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)');
    set('--color-success',   colors.green);
    set('--color-success-dim', isDark ? 'rgba(34,197,94,0.10)' : 'rgba(22,163,74,0.06)');
    set('--color-danger',    colors.red);
    set('--color-danger-dim',  isDark ? 'rgba(239,68,68,0.10)' : 'rgba(220,38,38,0.06)');
    set('--color-warning',   colors.orange);
    set('--color-warning-dim', isDark ? 'rgba(245,158,11,0.10)' : 'rgba(217,119,6,0.06)');
    set('--color-info',    colors.teal);
    set('--color-info-dim', isDark ? 'rgba(6,182,212,0.10)' : 'rgba(8,145,178,0.06)');
    set('--color-purple',  colors.purple);
    set('--color-purple-dim', isDark ? 'rgba(139,92,246,0.10)' : 'rgba(124,58,237,0.06)');
  }, [isDark, colors]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, C: colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
