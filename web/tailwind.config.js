/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      fontFamily: {
        heading: ["'Nunito'", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"]
      },
      colors: {
        kawaii: {
          peach: "#f8be9e",
          peachDark: "#e89470",
          peachLight: "#fcc9ab",
          blue: "#70d6ff",
          blueDark: "#2bbaff",
          yellow: "#ffd670",
          yellowDark: "#ffbf2b",
          green: "#bcffbe",
          greenDark: "#78ff75",
          pink: "#ff7096",
          pinkDark: "#ff2b64",
          ink: "#000000",
          bg: "#faede2",
          card: "#fff9f5",
          subtle: "#f5e2d3",
          darkBg: "#121214",
          darkCard: "#1a1a1e",
          darkSubtle: "#242429",
          darkBorder: "#ffffff"
        }
      },
      boxShadow: {
        kawaii: "4px 4px 0px #000000",
        "kawaii-sm": "2.5px 2.5px 0px #000000",
        "kawaii-lg": "6px 6px 0px #000000",
        "kawaii-pop": "8px 8px 0px #000000",
        "kawaii-dark": "4px 4px 0px #ffffff",
        "kawaii-dark-sm": "2.5px 2.5px 0px #ffffff",
        "kawaii-dark-pop": "8px 8px 0px #ffffff"
      },
      borderRadius: {
        "2xl": "20px",
        "3xl": "28px"
      }
    }
  },
  plugins: []
};
