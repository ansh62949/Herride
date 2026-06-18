/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#6D28D9",
          hover: "#5B21B6",
          light: "#EDE9FE",
          dark: "#4C1D95",
        },
        secondary: {
          DEFAULT: "#4338CA",
          hover: "#3730A3",
          light: "#E0E7FF",
          dark: "#312E81",
        },
        accent: {
          DEFAULT: "#F472B6",
          hover: "#EC4899",
          light: "#FDF2F8",
          dark: "#BE185D",
        },
        success: {
          DEFAULT: "#10B981",
          light: "#D1FAE5",
          dark: "#065F46",
        },
        danger: {
          DEFAULT: "#EF4444",
          light: "#FEE2E2",
          dark: "#991B1B",
        },
        surface: {
          DEFAULT: "#F8FAFC",
          card: "#FFFFFF",
          muted: "#F1F5F9",
        },
        brandText: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
          light: "#94A3B8",
        },
        brandBorder: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
      boxShadow: {
        premium: "0 10px 30px -10px rgba(109, 40, 217, 0.08)",
        card: "0 4px 20px -2px rgba(15, 23, 42, 0.04)",
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.04)",
      },
    },
  },
  plugins: [],
}
