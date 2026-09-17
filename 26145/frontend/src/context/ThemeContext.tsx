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
  bg:        '#05080d',
  surface:   '#080d14',
  surfaceHi: '#0c1219',
  border:    '#111c2b',
  borderHi:  '#182a3d',
  text:      '#dce4ec',
  textSec:   '#556677',
  textDim:   '#2a3a4a',
  accent:    '#00d4ff',
  red:       '#ef4444',
  orange:    '#f97316',
  amber:     '#eab308',
  green:     '#22c55e',
  purple:    '#a855f7',
  pink:      '#ec4899',
  teal:      '#14b8a6',
};

const lightColors: ThemeColors = {
  bg:        '#f0f2f5',
  surface:   '#ffffff',
  surfaceHi: '#f8f9fb',
  border:    '#e2e6ec',
  borderHi:  '#ccd1d9',
  text:      '#1a1a2e',
  textSec:   '#64748b',
  textDim:   '#94a3b8',
  accent:    '#0891b2',
  red:       '#dc2626',
  orange:    '#ea580c',
  amber:     '#d97706',
  green:     '#16a34a',
  purple:    '#9333ea',
  pink:      '#db2777',
  teal:      '#0d9488',
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

    // Set CSS custom properties for CSS-class-based elements
    root.style.setProperty('--bg-primary', colors.bg);
    root.style.setProperty('--bg-secondary', colors.surface);
    root.style.setProperty('--bg-card', colors.surface);
    root.style.setProperty('--bg-card-hover', colors.surfaceHi);
    root.style.setProperty('--border-color', colors.border);
    root.style.setProperty('--border-active', colors.borderHi);
    root.style.setProperty('--text-primary', colors.text);
    root.style.setProperty('--text-secondary', colors.textSec);
    root.style.setProperty('--text-muted', colors.textDim);
    root.style.setProperty('--accent-cyan', colors.accent);
    root.style.setProperty('--accent-green', colors.green);
    root.style.setProperty('--accent-red', colors.red);
    root.style.setProperty('--accent-orange', colors.orange);
    root.style.setProperty('--accent-yellow', colors.amber);
    root.style.setProperty('--accent-purple', colors.purple);
  }, [isDark, colors]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, C: colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
