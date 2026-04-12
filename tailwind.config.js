/** @type {import('tailwindcss').Config} */
/* =====================================================
   Tailwind CSS Config — ServerRack Monitor (Варіант 2)
   Колірна палітра: Charcoal & Neon Green
   ===================================================== */
const config = {
  darkMode: 'class',
  content: ['./*.html'],
  theme: {
    extend: {
      colors: {
        /* ── Бренд: основні кольори варіанту 2 ── */
        'brand-primary':   '#39ff14',   /* Neon Green — головний акцент */
        'brand-secondary': '#2acc10',   /* Neon Green темніший — hover стан */
        'brand-dim':       'rgba(57,255,20,0.15)', /* Neon прозорий — фон бейджів */

        /* ── Фони (Charcoal palette) ── */
        'surface-base':    '#1a1a1a',   /* Основний фон сторінки */
        'surface-card':    '#2d2d2d',   /* Фон карток */
        'surface-raised':  '#3a3a3a',   /* Підвищений елемент (hover, input) */
        'surface-overlay': '#4a4a4a',   /* Оверлей, quaternary */

        /* ── Текст ── */
        'text-base':       '#ffffff',   /* Основний текст */
        'text-muted':      '#6a6a6a',   /* Другорядний текст */

        /* ── Межі ── */
        'border-default':  '#3a3a3a',   /* Стандартна межа */
        'border-accent':   '#39ff14',   /* Акцентна межа */

        /* ── Статуси ── */
        'status-error':    '#ff3939',   /* Критичний стан */
        'status-warning':  '#ffa500',   /* Попередження */
        'status-info':     '#00d4ff',   /* Інформаційний */
        'status-ok':       '#39ff14',   /* Норма (alias brand-primary) */

        /* ── Консоль ── */
        'console-bg':      '#0a0a0a',   /* Фон консолі логів */

        /* ── Сумісність зі старими класами (legacy) ── */
        'charcoal': {
          900: '#0f0f0f',
          800: '#1a1a1a',  /* = surface-base */
          700: '#2d2d2d',  /* = surface-card */
          600: '#3a3a3a',  /* = surface-raised */
          500: '#4a4a4a',  /* = surface-overlay */
          400: '#6a6a6a',  /* = text-muted */
        },
        'neon': {
          DEFAULT: '#39ff14', /* = brand-primary */
          dark:    '#2acc10', /* = brand-secondary */
        },
      },

      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['"JetBrains Mono"', '"Courier New"', 'monospace'],
      },

      animation: {
        'pulse-slow': 'pulse 2s infinite',
        'blink':      'blink 1s infinite',
        'gauge-fill': 'gaugeFill 1.2s ease forwards',
      },

      keyframes: {
        blink: {
          '0%,100%': { opacity: '1' },
          '50%':     { opacity: '0' },
        },
        gaugeFill: {
          from: { strokeDashoffset: '527.8' },
          to:   { strokeDashoffset: '184' },
        },
      },

      boxShadow: {
        'neon-sm':  '0 0 10px rgba(57,255,20,0.15)',
        'neon-md':  '0 0 20px rgba(57,255,20,0.20)',
        'neon-lg':  '0 0 30px rgba(57,255,20,0.25)',
      },
    },
  },
  plugins: [],
};

/* ──────────────────────────────────────────────
   Як використовувати власні кольори в HTML:
   ──────────────────────────────────────────────
   Фон картки:         bg-surface-card
   Акцентний текст:    text-brand-primary
   Кнопка (hover):     hover:bg-brand-primary
   Межа статусу:       border-status-error
   Тінь консолі:       shadow-neon-lg
   ────────────────────────────────────────────── */

// CommonJS export (для Tailwind CLI)
if (typeof module !== 'undefined') module.exports = config;
