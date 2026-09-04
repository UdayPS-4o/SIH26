/** @type {import('tailwindcss').Config} */

/*
 * NUMMF token layer.
 *
 * The palette is a full replacement, not an extension. Every colour resolves to
 * a CSS variable declared in src/index.css, so one class is correct in both
 * light and dark. Because the values are variables, Tailwind opacity modifiers
 * (bg-accent/10) do not work; use the paired -bg tokens instead.
 *
 * Three semantic hues only:
 *   accent     steel blue. Interaction and identity.
 *   attention  ochre. Needs a human decision.
 *   negative   rust. Rejected or conflicting.
 *
 * The old dark / primary / accent-scale / cyan / success / warning / danger
 * palettes are deleted on purpose. Legacy classes such as bg-dark-950 or
 * text-primary-500 will no longer resolve, which makes dead styling visible.
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

      ink: 'var(--ink)',
      'ink-2': 'var(--ink-2)',
      'ink-3': 'var(--ink-3)',

      rule: 'var(--rule)',
      'rule-strong': 'var(--rule-strong)',

      accent: 'var(--accent)',
      'accent-bg': 'var(--accent-bg)',
      'accent-edge': 'var(--accent-edge)',

      attention: 'var(--attention)',
      'attention-bg': 'var(--attention-bg)',
      'attention-edge': 'var(--attention-edge)',

      negative: 'var(--negative)',
      'negative-bg': 'var(--negative-bg)',
    },
    extend: {
      // Tailwind's stock defaults for these fall back to blue-300 / white,
      // which would smuggle a fourth hue in. Pin them to tokens. ringColor
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
          'IBM Plex Sans',
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
        display: ['Archivo', 'IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Small-caps metadata labels. Ships with its own tracking.
        '2xs': ['10.5px', { lineHeight: '1.3', letterSpacing: '0.14em' }],
      },
      borderRadius: {
        DEFAULT: '2px',
        sm: '2px',
        md: '2px',
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        '3xl': '2px',
        // 'full' is inherited from the default theme and stays 9999px.
      },
      boxShadow: {
        // The only elevation in the system. Everything else is a 1px rule.
        hairline:
          '0 1px 0 0 rgba(20, 27, 33, 0.04), 0 1px 3px -1px rgba(20, 27, 33, 0.08)',
        md: '0 1px 0 0 rgba(20, 27, 33, 0.04), 0 1px 3px -1px rgba(20, 27, 33, 0.08)',
        lg: '0 1px 0 0 rgba(20, 27, 33, 0.04), 0 1px 3px -1px rgba(20, 27, 33, 0.08)',
        xl: '0 1px 0 0 rgba(20, 27, 33, 0.04), 0 1px 3px -1px rgba(20, 27, 33, 0.08)',
      },
    },
  },
  plugins: [],
}
