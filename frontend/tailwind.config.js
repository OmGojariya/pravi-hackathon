/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0a2240',
          'navy-dark': '#061528',
          'navy-light': '#143864',
          saffron: '#e66000',
          'saffron-light': '#ff8533',
          gold: '#c27803',
          green: '#138808',
          'green-dark': '#0d5c05',
          cream: '#fffdfa',
          sand: '#fdfbf7',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38aaf7',
          500: '#0e8fe7',
          600: '#0a2240',
          700: '#081c35',
          800: '#06162a',
          900: '#040e1b',
          950: '#02070e',
        },
        slate: {
          850: '#172033',
          950: '#0b0f19',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
