import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // すべて globals.css の CSS 変数経由で使う
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        terracotta: 'rgb(var(--terracotta) / <alpha-value>)',
        sage: 'rgb(var(--sage) / <alpha-value>)',
        plum: 'rgb(var(--plum) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warn: 'rgb(var(--warn) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
      },
      fontFamily: {
        // CSS 変数で定義される
        mincho: ['var(--font-mincho)', 'serif'],
        maru: ['var(--font-maru)', 'sans-serif'],
      },
      fontSize: {
        // 本文最小 16px ベースで設計
        'kana': ['0.75rem', '1.5'],
        'small': ['0.875rem', '1.6'],
        'body': ['1rem', '1.7'],
        'lead': ['1.0625rem', '1.75'],
        'h3': ['1.25rem', '1.5'],
        'h2': ['1.5rem', '1.45'],
        'h1': ['1.875rem', '1.35'],
        'display': ['2.25rem', '1.25'],
      },
      borderRadius: {
        'card': '1.25rem',
        'pill': '999px',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(42,40,38,0.04), 0 8px 24px rgba(42,40,38,0.04)',
        'lift': '0 4px 12px rgba(42,40,38,0.08), 0 16px 40px rgba(42,40,38,0.06)',
      },
      animation: {
        'breathe': 'breathe 8s ease-in-out infinite',
        'fade-in': 'fade-in 0.4s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.08)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
