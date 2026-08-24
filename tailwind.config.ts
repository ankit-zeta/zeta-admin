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
        brand: {
          50: "#f0fdf6",
          100: "#dcfce9",
          200: "#bbf7d2",
          300: "#86efad",
          400: "#4ade7d",
          500: "#22c55e",
          600: "#176B4D",
          700: "#13573E",
          800: "#0f4430",
          900: "#0b3123",
          950: "#051b13",
        },
        bgWarm: "#FAFAF7",
        textMain: "#202522",
        textMuted: "#69736D",
        borderSubtle: "#E4E8E5",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
