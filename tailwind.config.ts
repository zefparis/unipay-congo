import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Legacy palette (kept for backward compat in dashboard/admin pages)
        ink: '#0A0F1C',
        'ink-muted': '#4A5263',
        rust: '#B85C2E',
        'rust-deep': '#8A4220',
        signal: '#1C9E7A',
        'signal-dark': '#178E6A',
        'signal-deep': '#076143',
        bone: '#EDE6D6',
        danger: '#C94A3A',
        // New corporate financial palette
        navy: '#0A1930',
        'navy-panel': '#12233F',
        'navy-muted': '#1A2D4D',
        gold: '#D9B36C',
        'green-deep': '#0F6E56',
        'text-primary': '#EDF1F5',
        'text-secondary': '#7C93AC',
      },
      fontFamily: {
        heading: ['var(--font-source-serif)', 'var(--font-space-grotesk)', 'serif'],
        body: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        serif: ['var(--font-source-serif)', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
