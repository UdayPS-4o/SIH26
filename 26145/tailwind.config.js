/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ek: {
          bg: 'var(--ek-bg-base)',
          card: 'var(--ek-bg-card)',
          elevated: 'var(--ek-bg-elevated)',
          border: 'var(--ek-border)',
          'text-primary': 'var(--ek-text-primary)',
          'text-secondary': 'var(--ek-text-secondary)',
          'text-muted': 'var(--ek-text-muted)',
          accent: 'var(--ek-accent)',
          'accent-glow': 'var(--ek-accent-glow)',
          threat: {
            critical: 'var(--ek-threat-critical)',
            high: 'var(--ek-threat-high)',
            medium: 'var(--ek-threat-medium)',
            low: 'var(--ek-threat-low)',
            info: 'var(--ek-threat-info)',
          },
          success: 'var(--ek-success)',
          warning: 'var(--ek-warning)',
          danger: 'var(--ek-danger)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-accent': '0 0 20px var(--ek-accent-glow)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.3)',
      },
      animation: {
        'scan': 'scan 3s ease-in-out infinite',
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'count-up': 'countUp 0.3s ease-out',
      },
      keyframes: {
        scan: {
          '0%': { top: '0%', opacity: '0' },
          '10%': { opacity: '0.6' },
          '90%': { opacity: '0.6' },
          '100%': { top: '100%', opacity: '0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        ping: {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'scale(0.5)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
}
