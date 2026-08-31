/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          dark: '#111b21',
          panel: '#202c33',
          hover: '#2a3942',
          green: '#00a884',
          'green-dark': '#008069',
          'chat-bg': '#0b141a',
          'chat-bubble': '#005c4b',
          'chat-bubble-in': '#202c33',
          'text': '#e9edef',
          'text-secondary': '#8696a0',
        },
        amber: {
          glow: '#ffb020',
          heat: '#ff8c00',
        }
      },
      keyframes: {
        'amber-glow': {
          '0%, 100%': { boxShadow: '0 0 6px 1px rgba(255,176,32,0.35), 0 0 0 rgba(255,140,0,0)' },
          '50%': { boxShadow: '0 0 20px 6px rgba(255,176,32,0.75), 0 0 34px 10px rgba(255,140,0,0.35)' },
        },
        'solar-heat': {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.045)', filter: 'brightness(1.12)' },
        },
      },
      animation: {
        'amber-glow': 'amber-glow 2.2s ease-in-out infinite',
        'solar-heat': 'solar-heat 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
