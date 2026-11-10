/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Deep navy: sidebar, patient hero, assistant header.
        navy: {
          50: "#f1f5fb",
          100: "#dbe5f4",
          200: "#b9cae6",
          300: "#8fa7cc",
          400: "#6683b0",
          500: "#46628f",
          600: "#314d78",
          700: "#223a61",
          800: "#152a4a",
          900: "#0b1c38",
          950: "#07142a",
        },
        // Refined teal-blue brand. 600 is the action color (white text 5.7:1).
        brand: {
          50: "#ecf8fa",
          100: "#d0eff4",
          200: "#a4dde7",
          300: "#6cc4d4",
          400: "#35a5ba",
          500: "#1b869e",
          600: "#0f6f87",
          700: "#0c5a6f",
          800: "#0d495a",
          900: "#0e3c4a",
        },
        canvas: "#f1f4f9",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,28,56,0.04), 0 1px 3px rgba(11,28,56,0.06)",
        cardhover: "0 10px 28px -8px rgba(11,28,56,0.18)",
        pop: "0 12px 32px -10px rgba(11,28,56,0.25), 0 2px 6px rgba(11,28,56,0.06)",
      },
    },
  },
  plugins: [],
};
