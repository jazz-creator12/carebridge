/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      colors: {
        // Primary brand blue. 600 is the default action color (white text 5.2:1),
        // 700/800 are used for text on tinted backgrounds (6.7:1+).
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.05), 0 1px 3px rgba(15,23,42,0.06)",
        cardhover: "0 8px 24px -6px rgba(15,23,42,0.16)",
      },
    },
  },
  plugins: [],
};
