/** @type {import('tailwindcss').Config} */

/*
 * CodeOne token layer.
 *
 * The palette is a full replacement, not an extension. Every colour resolves to
 * a CSS variable declared in src/index.css, so one class is correct in both
 * light and dark. Because the values are variables, Tailwind opacity modifiers
 * (bg-accent/10) do not work; use the paired -bg tokens instead.
 *
 * Semantic hues:
 *   accent     brand identity. Headings, links, active nav, focus.
 *   primary    interactive. Primary buttons and calls to action.
 *   attention  needs a human decision.
 *   negative   rejected or conflicting.
 *   positive   matched, accepted, success.
 *   info       secondary, sparing use only.
 * Plus chart-1..6, an explicitly non-semantic palette for chart series (see
 * src/components/ui/tokens.ts). Legacy classes such as bg-dark-950 or
 * text-primary-500-from-a-different-scale will not resolve, which makes dead
 * styling visible.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      white: '#FFFFFF',
      black: '#000000',

      paper: 'var(--paper)',
      surface: 'var(--surface)',
      'surface-2': 'var(--surface-2)',
      'surface-hover': 'var(--surface-hover)',

      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      'ink-3': 'var(--ink-3)',

      rule: 'var(--rule)',
      'rule-strong': 'var(--rule-strong)',

      accent: 'var(--accent)',
      'accent-bg': 'var(--accent-bg)',
      'accent-edge': 'var(--accent-edge)',

      primary: 'var(--primary)',
      'primary-bg': 'var(--primary-bg)',
      'primary-edge': 'var(--primary-edge)',
      'primary-ink': 'var(--primary-ink)',

      attention: 'var(--attention)',
      'attention-bg': 'var(--attention-bg)',
      'attention-edge': 'var(--attention-edge)',

      negative: 'var(--negative)',
      'negative-bg': 'var(--negative-bg)',
      'negative-edge': 'var(--negative-edge)',

      positive: 'var(--positive)',
      'positive-bg': 'var(--positive-bg)',
      'positive-edge': 'var(--positive-edge)',

      info: 'var(--info)',
      'info-bg': 'var(--info-bg)',
      'info-edge': 'var(--info-edge)',

      'chart-1': 'var(--chart-1)',
      'chart-2': 'var(--chart-2)',
      'chart-3': 'var(--chart-3)',
      'chart-4': 'var(--chart-4)',
      'chart-5': 'var(--chart-5)',
      'chart-6': 'var(--chart-6)',
    },
    extend: {
      // Tailwind's stock defaults for these fall back to blue-300 / white,
      // which would smuggle in an unwired hue. Pin them to tokens. ringColor
      // must be a function, otherwise Tailwind cannot alpha-blend a var() and
      // silently reverts to its blue default.
      ringColor: {
        DEFAULT: () => 'var(--accent)',
      },
      ringOffsetColor: {
        DEFAULT: 'var(--paper)',
      },
      fontFamily: {
        sans: [
          'Karla',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'IBM Plex Mono',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'Liberation Mono',
          'monospace',
        ],
        display: ['Karla', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Small-caps metadata labels. Ships with its own tracking.
        '2xs': ['10.5px', { lineHeight: '1.3', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '28px',
        // 'full' is inherited from the default theme and stays 9999px.
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-lg)',
        // Kept for any leftover references during the transition.
        hairline: 'var(--shadow-sm)',
      },
    },
  },
  plugins: [],
}
