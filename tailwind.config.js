/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        status: {
          safe: '#10B981', // Green-500
          watch: '#FBBF24', // Amber-400
          warning: '#F97316', // Orange-500
          danger: '#EF4444', // Red-500
        }
      }
    },
  },
  plugins: [],
}
