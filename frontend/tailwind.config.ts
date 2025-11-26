import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563eb',
          muted: '#cbd5f5'
        }
      }
    }
  },
  plugins: []
} satisfies Config;

