import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f8fb",
        panel: "#ffffff",
        ink: "#191f28",
        moss: "#3182f6",
        leaf: "#1b64da",
        clay: "#f97316",
        ember: "#4e5968",
        line: "#e5e8eb",
        mist: "#eef2f6",
        gold: "#8b95a1",
      },
      boxShadow: {
        panel: "0 18px 44px -28px rgba(15, 23, 42, 0.18)",
      },
      fontFamily: {
        sans: ["var(--font-ui)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};

export default config;
