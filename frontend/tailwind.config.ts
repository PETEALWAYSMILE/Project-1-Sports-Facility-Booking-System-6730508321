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
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "var(--font-ibm-plex-thai)",
          "IBM Plex Sans Thai",
          "Noto Sans Thai",
          "sans-serif",
        ],
      },
      maxWidth: {
        container: "1200px",
      },
      colors: {
        apple: {
          blue: "#0071e3",
          "blue-hover": "#0077ed",
          "blue-active": "#0062c4",
          dark: "#1d1d1f",
          gray: "#86868b",
          "light-gray": "#f5f5f7",
          border: "rgba(0, 0, 0, 0.08)",
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
            bg: "#ecfdf5",
            text: "#065f46",
            border: "#a7f3d0",
            dot: "#10b981",
          },
          tennis: {
            bg: "#f7fee7",
            text: "#3f6212",
            border: "#bef264",
            dot: "#84cc16",
          },
          futsal: {
            bg: "#f0f9ff",
            text: "#075985",
            border: "#bae6fd",
            dot: "#0ea5e9",
          },
          basketball: {
            bg: "#fff7ed",
            text: "#9a3412",
            border: "#fed7aa",
            dot: "#f97316",
          },
          fitness: {
            bg: "#faf5ff",
            text: "#6b21a8",
            border: "#e9d5ff",
            dot: "#a855f7",
          },
        },
      },
      borderRadius: {
        card: "20px",
        control: "9999px",
        subtle: "12px",
      },
      boxShadow: {
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        card: "0 2px 16px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        elevated: "0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.03)",
        apple: "0 4px 20px -2px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};
export default config;
