/** @type {import('tailwindcss').Config} */

// ============================================================
// APEX AI — Tailwind Design System
// Tactical dark UI / Enterprise fleet aesthetics
// ============================================================

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      // ─── Apex Color System ───────────────────────────────
      colors: {
        apex: {
          // Core backgrounds
          void:     '#050810',
          base:     '#0a0f1e',
          surface:  '#0d1426',
          panel:    '#111827',
          card:     '#131d31',
          overlay:  '#162038',
          border:   '#1e2d47',
          muted:    '#243352',

          // Neon accent system
          cyan:     '#00d4ff',
          blue:     '#3b82f6',
          indigo:   '#6366f1',
          violet:   '#8b5cf6',
          green:    '#10b981',
          teal:     '#14b8a6',
          amber:    '#f59e0b',
          orange:   '#f97316',
          red:      '#ef4444',
          rose:     '#f43f5e',

          // Neon glows (transparent variants)
          'cyan-glow':   'rgba(0, 212, 255, 0.15)',
          'blue-glow':   'rgba(59, 130, 246, 0.15)',
          'green-glow':  'rgba(16, 185, 129, 0.15)',
          'red-glow':    'rgba(239, 68, 68, 0.15)',
          'amber-glow':  'rgba(245, 158, 11, 0.15)',

          // Text hierarchy
          'text-primary':   '#e2e8f0',
          'text-secondary': '#94a3b8',
          'text-muted':     '#4b6a9b',
          'text-dim':       '#2d4470',
        }
      },

      // ─── Typography ──────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif']
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.5rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1' }],
      },

      // ─── Spacing ─────────────────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '68':  '17rem',
        '72':  '18rem',
        '80':  '20rem',
        '88':  '22rem',
        '96':  '24rem',
      },

      // ─── Border Radius ───────────────────────────────────
      borderRadius: {
        'xs':  '0.125rem',
        'sm':  '0.25rem',
        DEFAULT: '0.375rem',
        'md':  '0.5rem',
        'lg':  '0.75rem',
        'xl':  '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },

      // ─── Backdrop Blur ───────────────────────────────────
      backdropBlur: {
        xs:  '2px',
        sm:  '4px',
        md:  '8px',
        lg:  '12px',
        xl:  '20px',
        '2xl': '40px',
      },

      // ─── Box Shadows / Glow System ───────────────────────
      boxShadow: {
        'apex-sm':    '0 1px 3px rgba(0,0,0,0.4)',
        'apex':       '0 4px 12px rgba(0,0,0,0.5)',
        'apex-md':    '0 8px 24px rgba(0,0,0,0.6)',
        'apex-lg':    '0 16px 48px rgba(0,0,0,0.7)',
        'glow-cyan':  '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(0,212,255,0.1)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.3), 0 0 40px rgba(59,130,246,0.1)',
        'glow-green': '0 0 20px rgba(16,185,129,0.3), 0 0 40px rgba(16,185,129,0.1)',
        'glow-red':   '0 0 20px rgba(239,68,68,0.3)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },

      // ─── Animations ──────────────────────────────────────
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0,212,255,0.3)' },
          '50%':       { opacity: '0.8', boxShadow: '0 0 40px rgba(0,212,255,0.6)' }
        },
        'scan-line': {
          '0%':   { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' }
        },
        'data-flow': {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '50%':  { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-left': {
          '0%':   { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        'blink': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.3' }
        },
        'rotate-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
        'scan-line':      'scan-line 4s linear infinite',
        'data-flow':      'data-flow 2s ease-in-out infinite',
        'fade-in':        'fade-in 0.3s ease-out',
        'slide-in-left':  'slide-in-left 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'blink':          'blink 1.5s ease-in-out infinite',
        'rotate-slow':    'rotate-slow 8s linear infinite',
      },

      // ─── Z-Index Scale ───────────────────────────────────
      zIndex: {
        '1':   '1',
        '2':   '2',
        '5':   '5',
        '60':  '60',
        '70':  '70',
        '80':  '80',
        '90':  '90',
        '100': '100',
      },

      // ─── Grid ────────────────────────────────────────────
      gridTemplateColumns: {
        'sidebar': '16rem 1fr',
        'sidebar-collapsed': '4rem 1fr',
        'dashboard': 'repeat(12, 1fr)',
      }
    }
  },
  plugins: []
}
