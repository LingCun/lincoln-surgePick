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
          // 표준 공포·탐욕 스펙트럼: 탐욕=초록(좋음) → 중립=노랑 → 공포=빨강(나쁨)
          extremeGreed: '#15803d',
          greed: '#22c55e',
          neutral: '#facc15',
          fear: '#f97316',
          extremeFear: '#dc2626',
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
