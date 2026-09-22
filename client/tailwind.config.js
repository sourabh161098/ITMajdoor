/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: "#ff8a00",
          hover: "#e67c00",
          // Theme-aware accent tuned for use as text (WCAG AA contrast).
          text: "var(--accent-text)",
        },
      },
      fontFamily: {
        brand: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      keyframes: {
        "rise-in": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "reaction-float": {
          "0%": { opacity: "0", transform: "translateY(0) scale(0.6)" },
          "10%": { opacity: "1", transform: "translateY(-8vh) scale(1.1)" },
          "85%": { opacity: "1", transform: "translateY(-62vh) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-72vh) scale(0.9)" },
        },
      },
      animation: {
        "rise-in": "rise-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "gradient-pan": "gradient-pan 6s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        "reaction-float": "reaction-float 4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
