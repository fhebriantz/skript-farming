import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { doc: ["Arial", "Helvetica", "sans-serif"] },
      colors: {
        ink: "#111318",
        panel: "#1a1d24",
        line: "#2a2f39",
        muted: "#8b93a7",
        accent: "#4f8cff",
      },
    },
  },
  plugins: [],
} satisfies Config;
