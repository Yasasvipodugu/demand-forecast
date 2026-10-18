/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D1E',
          900: '#0B132B',
          800: '#1C2541',
          700: '#2C395B',
          600: '#3A4B75'
        },
        brand: {
          blue: '#2563EB',
          teal: '#0D9488',
          accent: '#0284C7'
        }
      }
    },
  },
  plugins: [],
}
