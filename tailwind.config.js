/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#000080',
          dark: '#000033',
        },
        foodco: {
          green: '#2563eb', // Premium Royal Blue
          'green-dark': '#1d4ed8', // Dark Blue
          'green-light': '#eff6ff', // Very Light Blue Background
          yellow: '#f59e0b', // Vibrant Amber/Gold for contrast
          red: '#ef4444',
          bg: '#f8fafc', // Modern Slate-50 background
          text: '#0f172a', // Slate-900 for premium readability
          gray: '#64748b' // Slate-500 for neutral text
        },
        mbi: {
          primary: '#2563eb',
          secondary: '#1d4ed8',
          accent: '#60a5fa',
          light: '#f1f5f9'
        }
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
