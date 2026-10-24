/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        app: {
          bg: 'var(--bg-app)',
          surface: 'var(--bg-surface)',
          sidebar: 'var(--bg-sidebar)',
          hover: 'var(--bg-hover)',
          elevated: 'var(--bg-elevated)',
          borderSubtle: 'var(--border-subtle)',
          borderStrong: 'var(--border-strong)',
          text: 'var(--text-primary)',
          muted: 'var(--text-muted)',
          subtle: 'var(--text-subtle)',
          accent: 'var(--accent-base)',
          accentHover: 'var(--accent-hover)',
          accentSubtle: 'var(--accent-subtle)',
          warning: 'var(--warning-base)',
          error: 'var(--error-base)',
          success: 'var(--success-base)'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
};
