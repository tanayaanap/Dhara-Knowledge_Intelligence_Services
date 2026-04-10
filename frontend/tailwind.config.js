/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      fontFamily: {
        'baloo': ['Baloo 2', 'cursive'],
        'poppins': ['Poppins', 'sans-serif'],
      },
      colors: {
        dhara: {
          green: '#a8e063',
          darkgreen: '#56ab2f',
        }
      }
    },
  },
  plugins: [],
}
