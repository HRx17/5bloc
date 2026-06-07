import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy:       '#0C1220', 
        'navy-mid': '#141E30', 
        'navy-lt':  '#1C2A3E',
        amber:      '#F5A623', 
        'amber-lt': '#FFB94A', 
        'amber-dk': '#D4891A',
        blue:       '#2B7FFF', 
        'blue-lt':  '#5B9FFF',
        pwhite:     '#F7F5F0', 
        'off-white': '#EDE9E2',
        stone:      '#9E9687', 
        slate:      '#6B7485',
        success:    '#2ECC8A', 
        error:      '#E84545',
      },
      fontFamily: {
        display: ["'Bebas Neue'", 'sans-serif'],
        body:    ["'DM Sans'", 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
