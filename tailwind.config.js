// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebefff',
          200: '#d7dfff',
          300: '#b8c5ff',
          400: '#93a1ff',
          500: '#6c7cff',
          600: '#4955ff',
          700: '#293789', // Main Mineazy blue
          800: '#1e2563', // Darker shade
          900: '#151b47',
        },
        accent: {
          50: '#fefef0',
          100: '#fefce0',
          200: '#fef9c0',
          300: '#fef387',
          400: '#fde943',
          500: '#fbf152', // Main Mineazy yellow
          600: '#ebd12f',
          700: '#c5a916',
          800: '#a08618',
          900: '#856e1b',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}