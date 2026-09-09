/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        honey: {
          50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
          400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
          800: '#92400e', 900: '#78350f',
        },
        sand: {
          50: '#fdf9f3', 100: '#f5efe0', 200: '#e8dfd0', 300: '#d6c9b0',
          400: '#b8a88a', 500: '#9c8b6e', 600: '#7a6b55', 700: '#5e4a35',
          800: '#453628', 900: '#2d241b',
        },
        forest: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
          400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
          800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        barn: {
          50: '#fdf8f3', 100: '#f5e6d3', 200: '#e8cdab', 300: '#d4a97a',
          400: '#b8854a', 500: '#9c6b34', 600: '#7d5628', 700: '#5e4020',
          800: '#453018', 900: '#2d2010', 950: '#1a110b',
        },
        ai: '#3B9EFF',
        'ai-light': '#e8f4ff',
        'ai-dark': '#1a6fcc',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        script: ['Caveat', 'ui-serif', 'cursive'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
        warm: '0 4px 20px -2px rgb(180 130 60 / 0.15)',
        'warm-lg': '0 10px 30px -5px rgb(180 130 60 / 0.25)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.5' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.7' },
        },
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}
