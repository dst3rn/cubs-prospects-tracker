/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cubs: {
          blue: '#0E3386',
          red: '#CC3433',
          white: '#FFFFFF'
        }
      }
    },
  },
  plugins: [],
}
