import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidad de marca XAIXO
        marca: {
          DEFAULT: "#E5231B",
          hover:   "#C41E17",
          light:   "#FEF2F2",
        },
        // Colores de camiones / tipos (no cambiar)
        franjo:  { bg: "#DBEAFE", border: "#3B82F6", text: "#1D4ED8" },
        david:   { bg: "#DCFCE7", border: "#22C55E", text: "#15803D" },
        trailer: { bg: "#FFEDD5", border: "#F97316", text: "#C2410C" },
        danger:  "#EF4444",
      },
    },
  },
  plugins: [],
};
export default config;
