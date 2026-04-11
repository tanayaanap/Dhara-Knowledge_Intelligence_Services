/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#10b981',
        secondary: '#059669',
        accent: '#34d399',
        'dhara-green': '#10b981',
        'dhara-emerald': '#059669',
        'dhara-light': '#d1fae5',
        'dhara-orange': '#f97316',
        'dhara-blue': '#0ea5e9',
        'dhara-purple': '#a855f7',
        'dhara-amber': '#f59e0b',
      },
      fontFamily: {
        baloo: ["'Baloo 2'", 'cursive'],
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(16, 185, 129, 0.5)' },
          '50%': { opacity: '0.8', boxShadow: '0 0 40px rgba(16, 185, 129, 0.8)' },
        },
        'slide-in': {
          'from': { transform: 'translateX(-100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'slide-in': 'slide-in 0.5s ease-out',
        'fade-in': 'fade-in 1s ease-out',
      },
    },
  },
  plugins: [],
}
