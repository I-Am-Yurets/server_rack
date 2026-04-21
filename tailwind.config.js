/** @type {import('tailwindcss').Config} */
/* =====================================================
   Tailwind CSS Config — ServerRack Monitor React (Варіант 2)
   Колірна палітра: Charcoal & Neon Green
   ===================================================== */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'brand-primary':   '#39ff14',
        'brand-secondary': '#2acc10',
        'surface-base':    '#1a1a1a',
        'surface-card':    '#2d2d2d',
        'surface-raised':  '#3a3a3a',
        'surface-overlay': '#4a4a4a',
        'text-base':       '#ffffff',
        'text-muted':      '#6a6a6a',
        'border-default':  '#3a3a3a',
        'border-accent':   '#39ff14',
        'status-error':    '#ff3939',
        'status-warning':  '#ffa500',
        'status-info':     '#00d4ff',
        'status-ok':       '#39ff14',
        'console-bg':      '#0a0a0a',
        'ch': {
          900: '#0f0f0f',
          800: '#1a1a1a',
          700: '#2d2d2d',
          600: '#3a3a3a',
          500: '#4a4a4a',
          400: '#6a6a6a',
        },
        'neon': {
          DEFAULT: '#39ff14',
          dark:    '#2acc10',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'blink':      'blink 1s infinite',
      },
      keyframes: {
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
      },
      boxShadow: {
        'neon-sm': '0 0 10px rgba(57,255,20,0.15)',
        'neon-md': '0 0 20px rgba(57,255,20,0.20)',
        'neon-lg': '0 0 30px rgba(57,255,20,0.25)',
      },
    },
  },
  plugins: [],
};
