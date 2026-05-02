/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Uniswap-inspired palette
        surface: "#0d1117",
        card: "#161b22",
        border: "#21262d",
        accent: "#f5a623",
        "accent-hover": "#e09415",
      },
    },
  },
  plugins: [],
};
