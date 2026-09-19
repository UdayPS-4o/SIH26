/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: { 900: '#0a0e27', 800: '#111827', 700: '#1a1f3a', 600: '#1e293b' },
        slate: { 350: '#94a3b8', 50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 800: '#1e293b', 900: '#0f172a' },
        brand: { blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444', critical: '#dc2626' }
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
