/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#CC0D00", // PTIT Red
          light: "#FF3B30",
          dark: "#8B0000",
          muted: "#FFE5E5",
        },
        secondary: {
          DEFAULT: "#1C1C1E",
          light: "#2C2C2E",
          dark: "#000000",
        },
        accent: "#FFD700", // Gold for highlights
        success: "#34C759",
        warning: "#FF9500",
        error: "#FF3B30",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F2F2F7",
        },
        glass: "rgba(255, 255, 255, 0.8)",
      },
      borderRadius: {
        ant: "2px",
        xl: "16px",
        "2xl": "24px",
        "3xl": "32px",
      },
      spacing: {
        'safe': '24px',
      }
    },
  },
  plugins: [],
};

