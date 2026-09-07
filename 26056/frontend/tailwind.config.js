/** @type {import('tailwindcss').Config} */

// Tailwind is bound to the design-system tokens rather than to raw palettes.
// `bg-surface`, `text-ink-2`, `border-line` resolve to CSS custom properties,
// so a mode switch is a single attribute flip on <html> with no class churn.
const token = (name) => `var(--vm-${name})`

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: {
          DEFAULT: token('surface'),
          2: token('surface-2'),
          3: token('surface-3'),
          inset: token('surface-inset'),
        },
        ink: {
          DEFAULT: token('ink'),
          2: token('ink-2'),
          3: token('ink-3'),
          invert: token('ink-invert'),
        },
        line: {
          DEFAULT: token('line'),
          strong: token('line-strong'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          ink: token('accent-ink'),
          soft: token('accent-soft'),
          line: token('accent-line'),
        },
        gate: {
          DEFAULT: token('gate'),
          soft: token('gate-soft'),
          line: token('gate-line'),
        },
        good: { DEFAULT: token('good'), soft: token('good-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        serious: { DEFAULT: token('serious'), soft: token('serious-soft') },
        critical: { DEFAULT: token('critical'), soft: token('critical-soft') },
        s1: token('s1'),
        s2: token('s2'),
        s3: token('s3'),
        s4: token('s4'),
        s5: token('s5'),
        s6: token('s6'),
        reference: token('reference'),
        grid: token('grid'),
      },
      borderRadius: {
        chip: token('r-chip'),
        control: token('r-control'),
        panel: token('r-panel'),
      },
      fontFamily: {
        display: [token('font-display')],
        sans: [token('font-sans')],
        mono: [token('font-mono')],
      },
      boxShadow: {
        panel: token('shadow'),
        lift: token('shadow-lift'),
      },
      transitionTimingFunction: {
        vm: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'vm-rise': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'vm-sweep': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(300%)' },
        },
        'vm-pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.9)', opacity: '0' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
      animation: {
        rise: 'vm-rise var(--vm-dur-slow) var(--vm-ease) both',
        sweep: 'vm-sweep 1.6s ease-in-out infinite',
        'pulse-ring': 'vm-pulse-ring 2.4s ease-out infinite',
      },
    },
  },
  plugins: [],
}
