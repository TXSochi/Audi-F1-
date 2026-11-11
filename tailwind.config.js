/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        audi: { black: "#000000", red: "#E60042", grey: "#8C8C8C", white: "#FFFFFF" },
      },
      fontFamily: {
        display: ['"Archivo"', '"Arial Narrow"', "Arial", "sans-serif"],
        sans: ['"Inter"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
