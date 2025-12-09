/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sl-bg': '#18181b',
        'sl-bg-nav': '#1a1a1d',
        'sl-white': '#ffffff',
        'sl-gray-1': '#f1f5f9',
        'sl-gray-2': '#cbd5e1',
        'sl-gray-3': '#94a3b8',
        'sl-gray-5': '#3f3f46',
        'sl-gray-6': '#27272a',
        'sl-gray-7': '#1a1a1d',
        'sl-accent': '#a855f7',
        'sl-accent-high': '#c084fc',
      },
      fontFamily: {
        mono: ['Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
