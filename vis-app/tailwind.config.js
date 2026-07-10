/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Industrial Blue primary palette
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#1e3354',
        },
        // Neutral workspace grays
        neutral: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          150: '#eef2f7',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Status colors
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Workspace background
        workspace: '#f1f5f9',
        surface: '#ffffff',
        'surface-raised': '#f8fafc',
        border: '#e2e8f0',
        'border-strong': '#cbd5e1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['10px', '14px'],
        xs:   ['11px', '16px'],
        sm:   ['12px', '18px'],
        base: ['13px', '20px'],
        md:   ['14px', '20px'],
        lg:   ['15px', '22px'],
        xl:   ['16px', '24px'],
        '2xl': ['18px', '26px'],
        '3xl': ['20px', '28px'],
        '4xl': ['24px', '32px'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
      },
      boxShadow: {
        xs:  '0 1px 2px 0 rgba(0,0,0,.05)',
        sm:  '0 1px 3px 0 rgba(0,0,0,.07), 0 1px 2px -1px rgba(0,0,0,.07)',
        DEFAULT: '0 2px 6px -1px rgba(0,0,0,.08), 0 1px 4px -2px rgba(0,0,0,.06)',
        md:  '0 4px 12px -2px rgba(0,0,0,.08), 0 2px 6px -3px rgba(0,0,0,.06)',
        lg:  '0 8px 24px -4px rgba(0,0,0,.1), 0 4px 8px -4px rgba(0,0,0,.06)',
        card: '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
        panel: 'inset 0 0 0 1px rgba(0,0,0,.07)',
      },
      animation: {
        'fade-in': 'fadeIn .18s ease-out',
        'slide-in-left': 'slideInLeft .2s ease-out',
        'slide-up': 'slideUp .2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'blink': 'blink 1.2s step-start infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
