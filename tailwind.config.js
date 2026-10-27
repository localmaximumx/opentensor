/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--bg-main, #0B0B12)",
        foreground: "var(--text-primary, #F4F4FA)",
        card: {
          DEFAULT: "var(--surface-raised, #191925)",
          foreground: "var(--text-primary, #F4F4FA)"
        },
        popover: {
          DEFAULT: "var(--surface-overlay, #222231)",
          foreground: "var(--text-primary, #F4F4FA)"
        },
        primary: {
          DEFAULT: "var(--brand-btn, #7C3AED)",
          foreground: "#FFFFFF"
        },
        secondary: {
          DEFAULT: "var(--surface-secondary, #13131D)",
          foreground: "var(--text-secondary, #B5B5C8)"
        },
        muted: {
          DEFAULT: "var(--surface-secondary, #13131D)",
          foreground: "var(--text-muted, #9292A8)"
        },
        accent: {
          DEFAULT: "var(--surface-selected, #251B3B)",
          foreground: "var(--brand-primary, #8B5CF6)"
        },
        border: "var(--border-default, #303041)",
        input: "var(--border-default, #303041)",
        ring: "var(--accent-lime, #C4F75B)",
        surface: {
          main: "var(--bg-main, #0B0B12)",
          secondary: "var(--surface-secondary, #13131D)",
          raised: "var(--surface-raised, #191925)",
          overlay: "var(--surface-overlay, #222231)",
          hover: "var(--surface-hover, #272738)",
          selected: "var(--surface-selected, #251B3B)"
        },
        brand: {
          DEFAULT: "var(--brand-primary, #8B5CF6)",
          primary: "var(--brand-primary, #8B5CF6)",
          hover: "var(--brand-hover, #A78BFA)",
          active: "var(--brand-active, #7C3AED)",
          btn: "var(--brand-btn, #7C3AED)",
          "btn-hover": "var(--brand-btn-hover, #6D28D9)",
          "btn-pressed": "var(--brand-btn-pressed, #5B21B6)",
          soft: "var(--brand-soft, #251B3B)",
          accent: "var(--brand-primary, #8B5CF6)",
          cta: "var(--brand-btn, #7C3AED)",
          "cta-foreground": "#FFFFFF",
          line: "var(--border-strong, #45455B)"
        },
        lime: {
          DEFAULT: "var(--accent-lime, #C4F75B)",
          accent: "var(--accent-lime, #C4F75B)"
        },
        semantic: {
          success: "var(--success, #22C55E)",
          "success-text": "var(--success-text, #4ADE80)",
          "success-bg": "var(--success-bg, #14291D)",
          "success-border": "var(--success-border, #28633D)",
          error: "var(--error, #F87171)",
          "error-text": "var(--error, #F87171)",
          "error-bg": "var(--error-bg, #30191E)",
          "error-border": "var(--error-border, #70303A)",
          warning: "var(--warning, #FBBF24)",
          "warning-text": "var(--warning, #FBBF24)",
          "warning-bg": "var(--warning-bg, #302719)",
          "warning-border": "var(--warning-border, #70521D)",
          info: "var(--info, #38BDF8)",
          "info-text": "var(--info, #38BDF8)",
          "info-bg": "var(--info-bg, #132A38)",
          "info-border": "var(--info-border, #24516B)"
        },
        difficulty: {
          easy: "var(--diff-easy, #4ADE80)",
          medium: "var(--diff-medium, #FBBF24)",
          hard: "var(--diff-hard, #F87171)"
        },
        editor: {
          bg: "var(--editor-bg, #0E0E16)",
          highlight: "var(--editor-line-highlight, #1B1B29)",
          numbers: "var(--editor-line-numbers, #77778D)",
          selection: "var(--editor-selection, #493276)"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
