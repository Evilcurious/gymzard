/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef5ff',
          100: '#d9e8ff',
          200: '#bcd7ff',
          300: '#8ebcff',
          400: '#5997ff',
          500: '#3475fb',
          600: '#1557d6',
          700: '#1645aa',
          800: '#183b86',
          900: '#19356b',
          950: '#122246',
        },
      },
      boxShadow: {
        soft: '0 10px 35px -12px rgba(21, 68, 145, 0.22)',
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -16px rgba(16, 24, 40, 0.24)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(24px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease both',
        'slide-in': 'slide-in 0.25s ease both',
      },
    },
  },
  plugins: [],
}
