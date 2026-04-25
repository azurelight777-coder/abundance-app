/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        phthalo: {
          900: '#011F13', // Deep emerald green
          800: '#023824',
          700: '#035235',
        },
        oldgold: {
          400: '#FFE680', // Radiant soft gold
          500: '#E5C158',
          600: '#CC9D3D',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
