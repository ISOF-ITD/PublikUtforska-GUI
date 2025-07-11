/** @type {import('tailwindcss').Config} */

const plugin = require("tailwindcss/plugin");

module.exports = {
  content: ["./scripts/**/*.{ts,tsx,html,js,jsx}"],
  theme: {
    extend: {
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
  plugins: [
    plugin(({ addComponents }) => {
      addComponents({
        /* Hide the header on < md, keep it for a11y */
        ".mobile-table thead": "@apply hidden md:table-header-group",

        /* --- ROW ---------------------------------------------------------- */
        /* Real table row ≥ md … a flex‑column “card” below md  */
        ".mobile-table tbody tr":
          "@apply md:table-row flex flex-col w-full border-b border-gray-200 even:bg-white odd:bg-gray-50",

        /* --- CELL --------------------------------------------------------- */
        /* Full‑width, stacked cells on mobile, normal cells on desktop      */
        ".mobile-table tbody td":
          "@apply md:table-cell flex flex-col px-4 py-2 gap-1",

        /* Label above the value on mobile (using the data‑title attr)       */
        ".mobile-table tbody td::before": {
          content: "attr(data-title)",
          "@apply md:hidden mb-1 text-xs font-medium text-gray-600": {},
        },
      });
    }),
  ],
};
