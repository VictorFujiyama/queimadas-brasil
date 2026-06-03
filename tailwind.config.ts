import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fire: {
          DEFAULT: "#E66C37",
          dark: "#C2410C",
        },
      },
    },
  },
  plugins: [],
};
export default config;
