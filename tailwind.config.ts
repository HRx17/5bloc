import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:       'var(--surface)',
        'navy-mid': 'var(--surface-container)',
        'navy-lt':  'var(--surface-container-high)',
        amber:      '#F5A623',
        'amber-lt': '#FFB94A',
        'amber-dk': '#D4891A',
        blue:       '#0066CC',
        'blue-lt':  '#2997FF',
        pwhite:     '#FBFBFD',
        'off-white': '#F5F5F7',
        stone:      '#86868B',
        slate:      '#6E6E73',
        success:    '#2ECC8A',
        error:      '#FF3B30',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'Roboto', 'sans-serif'],
        body:    ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Text', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono:    ['SF Mono', 'ui-monospace', 'JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
