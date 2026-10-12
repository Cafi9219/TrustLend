/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          dark: '#0A1128',
          navy: '#0F1D38',
          slate: '#1E293B',
          blue: '#1D4ED8',
          blueHover: '#1E40AF',
          emerald: '#059669',
          emeraldHover: '#047857',
          mint: '#10B981',
          accent: '#0284C7',
          card: '#FFFFFF',
          cardMuted: '#F8FAFC',
          border: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft-sm': '0 1px 3px rgba(15, 23, 42, 0.05)',
        'soft': '0 4px 20px -2px rgba(15, 23, 42, 0.06)',
        'soft-lg': '0 10px 30px -4px rgba(15, 23, 42, 0.08)',
        'soft-xl': '0 20px 40px -6px rgba(15, 23, 42, 0.1)',
      }
    },
  },
  plugins: [],
}
