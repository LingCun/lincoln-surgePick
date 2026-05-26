/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,ts,tsx,js,jsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          pick: '#2563eb',
          mood: '#f59e0b',
        },
        fear: {
          extremeGreed: '#dc2626',
          greed: '#f97316',
          neutral: '#facc15',
          fear: '#3b82f6',
          extremeFear: '#7c3aed',
        },
        horizon: {
          short: '#facc15',
          mid: '#3b82f6',
          long: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Pretendard', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
