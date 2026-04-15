/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        kirana: {
          50: 'hsl(142, 70%, 97%)',
          100: 'hsl(142, 65%, 93%)',
          200: 'hsl(142, 72%, 84%)',
          300: 'hsl(142, 71%, 73%)',
          400: 'hsl(142, 69%, 58%)',
          500: 'hsl(142, 76%, 45%)',
          600: 'hsl(142, 72%, 35%)',
          700: 'hsl(142, 70%, 25%)',
          800: 'hsl(142, 65%, 18%)',
          900: 'hsl(142, 60%, 14%)',
          green: '#15803d',
          orange: '#f97316',
          light: '#f0fdf4',
          dark: '#14532d'
        },
        brand: {
          primary: 'hsl(142, 76%, 36%)',     /* Vivid Emerald */
          secondary: 'hsl(24, 94%, 53%)',   /* Electric Orange */
          accent: 'hsl(199, 89%, 48%)',      /* Sky Blue */
          surface: 'hsl(222, 47%, 11%)',    /* Midnight Surface */
        }
      },
      borderRadius: {
        'button': '1rem',
        'card': '2rem',
        'panel': '2.5rem',
      },
      boxShadow: {
        'premium': '0 20px 50px -12px rgba(0, 0, 0, 0.15)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'inner-light': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glow-green': '0 0 20px -5px rgba(34, 197, 94, 0.5)',
        'glow-orange': '0 0 20px -5px rgba(249, 115, 22, 0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'mesh': 'mesh 15s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        mesh: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
