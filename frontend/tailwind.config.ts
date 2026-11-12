import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-bai-jamjuree)",
          "Bai Jamjuree",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      maxWidth: {
        container: "1200px",
      },
      colors: {
        club: {
          forest: "#143628",
          "forest-hover": "#1b4534",
          "forest-active": "#0e271d",
          "forest-light": "#ebf2ee",
          "forest-border": "#c5d9ce",
          charcoal: "#181a18",
          secondary: "#4a4f4b",
          muted: "#767b76",
          stone: "#f6f5f0",
          sand: "#efece6",
          border: "#e2dfd7",
          "border-strong": "#d2cec3",
        },
        primary: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          active: "var(--color-primary-active)",
          light: "var(--color-primary-light)",
          border: "var(--color-primary-border)",
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          muted: "var(--color-surface-muted)",
          subtle: "var(--color-surface-subtle)",
        },
        sport: {
          badminton: {
            bg: "#f3f1ec",
            text: "#143628",
            border: "#dcd8ce",
            dot: "#143628",
          },
          tennis: {
            bg: "#f3f1ec",
            text: "#143628",
            border: "#dcd8ce",
            dot: "#143628",
          },
          futsal: {
            bg: "#f3f1ec",
            text: "#143628",
            border: "#dcd8ce",
            dot: "#143628",
          },
          basketball: {
            bg: "#f3f1ec",
            text: "#143628",
            border: "#dcd8ce",
            dot: "#143628",
          },
          fitness: {
            bg: "#f3f1ec",
            text: "#143628",
            border: "#dcd8ce",
            dot: "#143628",
          },
        },
      },
      borderRadius: {
        card: "12px",
        control: "8px",
        subtle: "6px",
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(20, 30, 24, 0.04)",
        card: "0 4px 14px -2px rgba(20, 30, 24, 0.06), 0 1px 3px 0 rgba(20, 30, 24, 0.04)",
        elevated:
          "0 12px 28px -4px rgba(20, 30, 24, 0.10), 0 4px 10px -2px rgba(20, 30, 24, 0.05)",
      },
    },
  },
  plugins: [],
};
export default config;
