/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./scripts/**/*.{ts,tsx,html,js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Icke aktiv knapp: (om fungerar alternativt Text alternativfärg) */
        'lighter-isof': '#3FD695',

        /* Profilfärg */
        'isof': '#005462',

        /* Aktiv knapp + knapp-hover-over */
        'darker-isof': '#1c3f49',
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};