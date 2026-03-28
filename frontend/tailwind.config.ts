import type { Config } from "tailwindcss";

const config: Config = {
  // 1. Files specify karo jahan Tailwind classes use hongi
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  // 2. Dark Mode strategy (class base toggle ke liye)
  darkMode: "class",

  theme: {
    extend: {
      // 3. Custom Colors aur Branding yahan add kar
      colors: {
        brand: {
          light: "#3b82f6",
          dark: "#1e3a8a",
          DEFAULT: "#2563eb",
        },
        background: {
          light: "#ffffff",
          dark: "#0f172a", // Zinc/Slate type dark vibe
        },
      },
      // 4. Custom Animations (Identity-service ke loaders ke liye kaam aayenge)
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        scanline: "scanline 4s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
    },
  },

  // 5. Plugins (Agar forms ya aspects ratio chahiye toh install karke yahan daal)
  plugins: [],
};

export default config;
