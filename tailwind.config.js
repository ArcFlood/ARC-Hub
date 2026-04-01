/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/renderer/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        'surface-elevated': '#383838',
        border: '#404040',
        text: '#e0e0e0',
        'text-muted': '#9ca3af',
        accent: '#6366f1',
        'accent-hover': '#4f46e5',
        'arc-accent': '#8b5cf6',
        'arc-hover': '#7c3aed',
        'haiku-accent': '#f59e0b',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
