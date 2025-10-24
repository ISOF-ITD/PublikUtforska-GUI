/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./scripts/**/*.{ts,tsx,html,js,jsx}"],
  theme: {
    
    extend: {
      fontFamily: {
       'barlow': ['"Barlow Condensed"', 'sans-serif']
      },
      colors: {
        /* Icke aktiv knapp: (om fungerar alternativt Text alternativfärg) #3FD695 */
        "lighter-isof": "rgb(63, 214, 149)",

        /* Profilfärg - exempel på en custom classnamn - text-isof, bg-isof #005462 */
        isof: "rgb(0, 84, 98)",

        /* Aktiv knapp + knapp-hover-over #1c3f49 */
        "darker-isof": "rgb(28, 63, 73)",
      },
    },
  },
  variants: {
    extend: {},
  },
};
