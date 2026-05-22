import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        leaf: "#0f6b4f",
        mint: "#dff5ec",
        honey: "#f6c65b",
        clay: "#d96d4c",
        skyglass: "#eaf5ff"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(23, 33, 27, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
