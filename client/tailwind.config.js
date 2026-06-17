/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#05070A",
        panel: "#0B0F17",
        glass: "rgba(13,18,28,0.62)",
        cyan: {
          DEFAULT: "#00E5FF",
          dim: "#0B7285",
        },
        signal: {
          profit: "#00FF94",
          loss: "#FF3864",
          warn: "#FFB800",
          blue: "#2979FF",
        },
        ink: {
          primary: "#E6F1FF",
          secondary: "#7C93B3",
          faint: "#3A4A60",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(0,229,255,0.18)",
        glowStrong: "0 0 40px rgba(0,229,255,0.32)",
      },
      backgroundImage: {
        grid:
          "linear-gradient(rgba(0,229,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "36px 36px",
      },
    },
  },
  plugins: [],
};
