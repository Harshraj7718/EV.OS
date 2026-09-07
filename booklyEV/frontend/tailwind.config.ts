import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefcf5",
          100: "#d5f7e5",
          200: "#adeecd",
          300: "#78deae",
          400: "#42c78c",
          500: "#1fae71",
          600: "#128c5b",
          700: "#0f704b",
          800: "#10593d",
          900: "#0e4a34",
          950: "#062a1d",
        },
      },
    },
  },
  plugins: [],
};

export default config;
