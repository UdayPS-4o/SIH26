import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var module = { exports: {} };

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#78350f',
          950: '#451a03',
        },
        navy: {
          700: '#123f66',
          800: '#0e3252',
          900: '#0b2540',
          950: '#081b30',
        },
        ai: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        devanagari: ['"Noto Sans Devanagari"', '"Inter"', 'sans-serif'],
        script: ['Caveat', 'ui-serif', 'cursive'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 6px -1px rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [],
