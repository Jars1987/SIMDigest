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
        solana: {
          purple: "#9945FF",
          green: "#14F195",
          blue: "#00D4FF",
          dark: "#0D0208",
        },
      },
      backgroundImage: {
        "gradient-solana": "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
