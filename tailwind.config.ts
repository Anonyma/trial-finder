import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      fontFamily: {
        // Display: warm characterful serif
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        // Body: clean modern sans
        sans: ["var(--font-geist)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        // editorial medical palette
        ink: {
          DEFAULT: "#1a1814",
          muted: "#4a4540",
          subtle: "#7a746c",
          faint: "#a8a299",
        },
        paper: {
          DEFAULT: "#faf8f3",
          raised: "#ffffff",
          sunken: "#f3efe6",
        },
        rule: {
          DEFAULT: "#e8e2d4",
          strong: "#d4ccba",
        },
        accent: {
          DEFAULT: "#a83a1a", // restrained terracotta
          soft: "#f4e8e1",
        },
        // semantic
        recruiting: "#2d6a4f",
        "not-yet": "#8a6d1c",
        completed: "#5a5a5a",
        warning: "#a83a1a",
        // shadcn compatibility
        background: "#faf8f3",
        foreground: "#1a1814",
        border: "#e8e2d4",
        input: "#e8e2d4",
        ring: "#a83a1a",
        primary: {
          DEFAULT: "#1a1814",
          foreground: "#faf8f3",
        },
        secondary: {
          DEFAULT: "#f3efe6",
          foreground: "#1a1814",
        },
        muted: {
          DEFAULT: "#f3efe6",
          foreground: "#4a4540",
        },
        destructive: {
          DEFAULT: "#a83a1a",
          foreground: "#faf8f3",
        },
      },
      borderRadius: {
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      fontSize: {
        "display-xl": ["3.5rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "display-md": ["2rem", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
        "display-sm": ["1.5rem", { lineHeight: "1.25", letterSpacing: "-0.005em" }],
      },
      maxWidth: {
        prose: "68ch",
        narrow: "42rem",
      },
    },
  },
  plugins: [],
};

export default config;
