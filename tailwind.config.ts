import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg:        '#080b0f',
        surface:   '#0f1923',
        surface2:  '#1a2433',
        surface3:  '#1f2d3d',
        accent:    '#10b981',
        accentHov: '#059669',
        accent2:   '#34d399',
        border:    '#1e2d3d',
        border2:   '#253548',
        muted:     '#7d8fa3',
        muted2:    '#3d5166',
      },
      borderRadius: {
        sm:    '8px',
        DEFAULT:'12px',
        lg:    '16px',
        xl:    '20px',
        '2xl': '24px',
        '3xl': '28px',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
