import type { Config } from "tailwindcss";

// Design token parity with apps/web/src/app/globals.css @theme block.
export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./contexts/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces_600SemiBold"],
        "display-bold": ["Fraunces_700Bold"],
        sans: ["Inter_400Regular"],
        medium: ["Inter_500Medium"],
        semibold: ["Inter_600SemiBold"],
        bold: ["Inter_700Bold"],
      },
      colors: {
        primary: "#B5604A",
        tertiary: "#557239",
        surface: "#FAFAF7",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#FBF8F3",
        "surface-container": "#F5F0E8",
        "surface-container-high": "#EDE5D6",
        "surface-container-highest": "#E0D5C0",
        "on-surface": "#1F1B17",
        "on-surface-variant": "#4F4838",
        "on-primary": "#FFFFFF",
        outline: "#A09683",
        "outline-variant": "#E0D5C0",
        error: "#B14F3B",
        clay: {
          50: "#FBF1EC", 100: "#F5DDCF", 200: "#ECC2AB", 300: "#E0A285",
          400: "#D58A6B", 500: "#CC785C", 600: "#B5604A", 700: "#944A39",
          800: "#6E3829", 900: "#4A2519",
        },
        cream: {
          50: "#FBF8F3", 100: "#F5F0E8", 200: "#EDE5D6",
          300: "#E0D5C0", 400: "#C9BBA1", 500: "#A8987C",
        },
        ink: {
          50: "#F4F1EC", 100: "#E5DFD4", 200: "#C9C0AF", 300: "#A09683",
          400: "#756B5A", 500: "#4F4838", 600: "#3A3528", 700: "#2A2620",
          800: "#1F1B17", 900: "#14110D",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
