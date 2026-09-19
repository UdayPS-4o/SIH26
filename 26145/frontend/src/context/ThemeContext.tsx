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

    /* HUD bar */
    set('--hud-bg', isDark ? '#080d16' : '#f8fafc');
    set('--hud-border', isDark ? 'rgba(0,212,255,0.08)' : 'rgba(0,0,0,0.07)');
    set('--hud-text', isDark ? '#dce4ec' : '#1e293b');
    set('--hud-text-sec', isDark ? '#556677' : '#64748b');
    set('--hud-stat-bg', isDark ? '#080c14' : '#f1f5f9');
    set('--hud-stat-border', isDark ? 'rgba(0,212,255,0.06)' : 'rgba(0,0,0,0.06)');
    set('--hud-glow-color', isDark ? '#00d4ff' : '#3b82f6');

    /* Sidebar */
    set('--sidebar-bg', isDark ? '#060a14' : '#f1f5f9');
    set('--sidebar-border', isDark ? 'rgba(0,212,255,0.06)' : 'rgba(0,0,0,0.06)');
    set('--sidebar-text', isDark ? '#556677' : '#64748b');
    set('--sidebar-hover-bg', isDark ? 'rgba(59,130,246,0.10)' : 'rgba(37,99,235,0.06)');
    set('--sidebar-active-bg', isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.07)');
    set('--sidebar-active-border', isDark ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.2)');

    /* Grid background */
    set('--grid-opacity', isDark ? '0.4' : '0.02');
    set('--grid-color', isDark ? 'rgba(0,212,255,0.03)' : 'rgba(0,0,0,0.04)');

    /* Scanline — dark mode only */
    set('--scanline-opacity', isDark ? '0.03' : '0');

    /* Selection */
    set('--selection-bg', isDark ? 'rgba(0,212,255,0.2)' : 'rgba(37,99,235,0.15)');
    set('--selection-color', isDark ? '#e2e8f0' : '#ffffff');

    /* Scrollbar */
    set('--scrollbar-thumb', isDark ? 'rgba(0,212,255,0.15)' : '#cbd5e1');
    set('--scrollbar-thumb-hover', isDark ? 'rgba(0,212,255,0.3)' : '#94a3b8');

    /* Card glow */
    set('--card-glow', isDark ? 'rgba(59,130,246,0.04)' : 'rgba(37,99,235,0.02)');

    /* Shadow tokens for inline styles */
    set('--shadow-sm',  isDark ? 'rgba(0,0,0,0.3)'  : 'rgba(0,0,0,0.06)');
    set('--shadow-md',  isDark ? 'rgba(0,0,0,0.4)'  : 'rgba(0,0,0,0.08)');
    set('--shadow-lg',  isDark ? 'rgba(0,0,0,0.5)'  : 'rgba(0,0,0,0.12)');
    set('--shadow-glow', isDark ? 'rgba(0,212,255,0.12)' : 'rgba(37,99,235,0.08)');
    set('--shadow-glow-strong', isDark ? 'rgba(0,212,255,0.2)' : 'rgba(37,99,235,0.12)');
    set('--shadow-accent', isDark ? 'rgba(0,212,255,0.15)' : 'rgba(37,99,235,0.10)');
    set('--shadow-danger', isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)');
    set('--shadow-success', isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)');
    set('--shadow-warning', isDark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.08)');
    set('--shadow-purple', isDark ? 'rgba(139,92,246,0.12)' : 'rgba(124,58,237,0.08)');

    /* Severity badge backgrounds */
    set('--sev-critical-bg', isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.07)');
    set('--sev-critical-border', isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)');
    set('--sev-high-bg', isDark ? 'rgba(249,115,22,0.1)' : 'rgba(234,88,12,0.07)');
    set('--sev-high-border', isDark ? 'rgba(249,115,22,0.25)' : 'rgba(234,88,12,0.2)');
    set('--sev-medium-bg', isDark ? 'rgba(234,179,8,0.1)' : 'rgba(202,138,4,0.07)');
    set('--sev-medium-border', isDark ? 'rgba(234,179,8,0.25)' : 'rgba(202,138,4,0.2)');
    set('--sev-low-bg', isDark ? 'rgba(6,182,212,0.08)' : 'rgba(8,145,178,0.06)');
    set('--sev-low-border', isDark ? 'rgba(6,182,212,0.2)' : 'rgba(8,145,178,0.15)');

    /* Category tag backgrounds */
    set('--tag-ddos-bg', isDark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.05)');
    set('--tag-ddos-border', isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)');
    set('--tag-c2-bg', isDark ? 'rgba(168,85,247,0.08)' : 'rgba(147,51,234,0.05)');
    set('--tag-c2-border', isDark ? 'rgba(168,85,247,0.2)' : 'rgba(147,51,234,0.15)');
    set('--tag-dns-bg', isDark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.05)');
    set('--tag-dns-border', isDark ? 'rgba(245,158,11,0.2)' : 'rgba(217,119,6,0.15)');
    set('--tag-tls-bg', isDark ? 'rgba(6,182,212,0.08)' : 'rgba(8,145,178,0.05)');
    set('--tag-tls-border', isDark ? 'rgba(6,182,212,0.2)' : 'rgba(8,145,178,0.15)');
    set('--tag-scan-bg', isDark ? 'rgba(249,115,22,0.08)' : 'rgba(234,88,12,0.05)');
    set('--tag-scan-border', isDark ? 'rgba(249,115,22,0.2)' : 'rgba(234,88,12,0.15)');
    set('--tag-exfil-bg', isDark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.05)');
    set('--tag-exfil-border', isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)');
    set('--tag-benign-bg', isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.05)');
    set('--tag-benign-border', isDark ? 'rgba(34,197,94,0.2)' : 'rgba(22,163,74,0.15)');

    /* Status chip backgrounds */
    set('--status-running-bg', isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)');
    set('--status-running-border', isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)');
    set('--status-stopped-bg', isDark ? 'rgba(0,255,65,0.12)' : 'rgba(22,163,74,0.08)');
    set('--status-stopped-border', isDark ? 'rgba(0,255,65,0.25)' : 'rgba(34,197,94,0.2)');
    set('--status-locked-bg', isDark ? 'rgba(0,255,65,0.12)' : 'rgba(22,163,74,0.08)');
    set('--status-locked-border', isDark ? 'rgba(0,255,65,0.25)' : 'rgba(34,197,94,0.2)');
    set('--status-warning-bg', isDark ? 'rgba(255,136,51,0.12)' : 'rgba(217,119,6,0.08)');
    set('--status-warning-border', isDark ? 'rgba(255,136,51,0.25)' : 'rgba(217,119,6,0.2)');
    set('--status-triggered-bg', isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.07)');
    set('--status-triggered-border', isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)');

    /* Overlay backgrounds */
    set('--overlay-strong', isDark ? 'rgba(6,10,16,0.85)' : 'rgba(248,250,252,0.92)');
    set('--overlay-md', isDark ? 'rgba(6,10,16,0.6)' : 'rgba(248,250,252,0.75)');
    set('--overlay-light', isDark ? 'rgba(6,10,16,0.4)' : 'rgba(248,250,252,0.6)');
    set('--panel-dark', isDark ? 'rgba(6,10,16,0.8)' : 'rgba(255,255,255,0.8)');
    set('--panel-dark-sm', isDark ? 'rgba(6,10,16,0.6)' : 'rgba(255,255,255,0.6)');

    /* Amber alias */
    set('--amber', isDark ? '#eab308' : '#d97706');

    /* Focus / selection */
    set('--focus-ring', isDark ? 'rgba(0,212,255,0.4)' : 'rgba(37,99,235,0.3)');
    set('--selection-bg', isDark ? 'rgba(0,212,255,0.12)' : 'rgba(37,99,235,0.1)');

    /* Modal / dialog overlays */
    set('--modal-backdrop', isDark ? 'rgba(6,10,16,0.88)' : 'rgba(248,250,252,0.85)');
    set('--modal-surface', isDark ? 'rgba(10,17,26,0.97)' : 'rgba(255,255,255,0.97)');
    set('--modal-shadow', isDark ? '0 0 40px rgba(0,0,0,0.5)' : '0 0 40px rgba(0,0,0,0.15)');

    /* Chart grid / bar backgrounds */
    set('--grid-bg', isDark ? 'rgba(0,212,255,0.06)' : 'rgba(37,99,235,0.04)');
    set('--bar-track-bg', isDark ? 'rgba(0,212,255,0.06)' : 'rgba(37,99,235,0.04)');

    /* Evidence validity chip */
    set('--chip-measured-bg', isDark ? 'rgba(34,197,94,0.06)' : 'rgba(22,163,74,0.05)');
    set('--chip-measured-border', isDark ? 'rgba(34,197,94,0.2)' : 'rgba(22,163,74,0.15)');
    set('--chip-estimated-bg', isDark ? 'rgba(234,179,8,0.06)' : 'rgba(202,138,4,0.05)');
    set('--chip-estimated-border', isDark ? 'rgba(234,179,8,0.2)' : 'rgba(202,138,4,0.15)');
    set('--chip-unverified-bg', isDark ? 'rgba(239,68,68,0.06)' : 'rgba(220,38,38,0.05)');
    set('--chip-unverified-border', isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)');

    /* Text glow for headings */
    set('--text-glow', isDark ? 'rgba(0,212,255,0.3)' : 'rgba(37,99,235,0.2)');

    /* Materials status backgrounds */
    set('--mat-pending-bg', isDark ? 'rgba(234,179,8,0.12)' : 'rgba(202,138,4,0.08)');
    set('--mat-imported-bg', isDark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)');
    set('--mat-approved-bg', isDark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)');
    set('--mat-rejected-bg', isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)');
    set('--mat-pending-border', isDark ? 'rgba(234,179,8,0.3)' : 'rgba(202,138,4,0.2)');
    set('--mat-imported-border', isDark ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.2)');
    set('--mat-approved-border', isDark ? 'rgba(34,197,94,0.3)' : 'rgba(22,163,74,0.2)');
    set('--mat-rejected-border', isDark ? 'rgba(239,68,68,0.3)' : 'rgba(220,38,38,0.2)');

    /* Border opacity variants */
    set('--border-opacity-2', isDark ? 'rgba(0,212,255,0.04)' : 'rgba(0,0,0,0.04)');
    set('--border-opacity-6', isDark ? 'rgba(0,212,255,0.06)' : 'rgba(0,0,0,0.06)');

    /* Match status colors */
    set('--match-matched-bg', isDark ? 'rgba(34,197,94,0.1)' : 'rgba(22,163,74,0.07)');
    set('--match-matched-border', isDark ? 'rgba(34,197,94,0.35)' : 'rgba(22,163,74,0.25)');
    set('--match-mismatched-bg', isDark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.07)');
    set('--match-mismatched-border', isDark ? 'rgba(239,68,68,0.35)' : 'rgba(220,38,38,0.25)');

    /* Admin matrix */
    set('--admin-match-bg', isDark ? 'rgba(0,255,65,0.12)' : 'rgba(22,163,74,0.08)');
    set('--admin-match-border', isDark ? 'rgba(0,255,65,0.2)' : 'rgba(22,163,74,0.15)');
    set('--admin-mismatch-bg', isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)');
    set('--admin-mismatch-border', isDark ? 'rgba(239,68,68,0.2)' : 'rgba(220,38,38,0.15)');
    set('--admin-running-bg', isDark ? 'rgba(239,68,68,0.12)' : 'rgba(220,38,38,0.08)');
    set('--admin-running-border', isDark ? 'rgba(239,68,68,0.25)' : 'rgba(220,38,38,0.2)');
    set('--admin-stopped-bg', isDark ? 'rgba(0,255,65,0.12)' : 'rgba(34,197,94,0.08)');
    set('--admin-stopped-border', isDark ? 'rgba(0,255,65,0.25)' : 'rgba(34,197,94,0.2)');
  }, [isDark, colors]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, C: colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
