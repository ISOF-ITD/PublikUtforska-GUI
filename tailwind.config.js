/** @type {import('tailwindcss').Config} */

const tokenColor = (variable) => ({ opacityValue }) => {
  if (opacityValue === undefined) {
    return `rgb(var(${variable}))`;
  }

  return `rgb(var(${variable}) / ${opacityValue})`;
};

module.exports = {
  content: ['./scripts/**/*.{ts,tsx,html,js,jsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        barlow: ['"Barlow Condensed"', 'sans-serif'],
      },
      colors: {
        app: tokenColor('--color-bg-rgb'),
        surface: tokenColor('--color-surface-rgb'),
        'surface-muted': tokenColor('--color-surface-muted-rgb'),
        'surface-hover': tokenColor('--color-surface-hover-rgb'),
        body: tokenColor('--color-text-rgb'),
        muted: tokenColor('--color-text-muted-rgb'),
        subtle: tokenColor('--color-text-subtle-rgb'),
        link: tokenColor('--color-link-rgb'),
        'link-hover': tokenColor('--color-link-hover-rgb'),
        border: tokenColor('--color-border-rgb'),
        primary: tokenColor('--color-primary-rgb'),
        'primary-hover': tokenColor('--color-primary-hover-rgb'),
        focus: tokenColor('--color-focus-rgb'),
        disabled: tokenColor('--color-disabled-bg-rgb'),
        accent: tokenColor('--color-accent-rgb'),
        danger: tokenColor('--color-danger-rgb'),
        'player-bg': tokenColor('--color-player-bg-rgb'),
        'player-text': tokenColor('--color-player-text-rgb'),
        'player-muted': tokenColor('--color-player-muted-rgb'),
        'player-control': tokenColor('--color-player-control-rgb'),
        'player-control-hover': tokenColor('--color-player-control-hover-rgb'),
        'player-accent': tokenColor('--color-player-accent-rgb'),
        'player-focus': tokenColor('--color-player-focus-rgb'),

        // Legacy Isof utility names now resolve through the shared tokens.
        'lighter-isof': tokenColor('--color-accent-rgb'),
        isof: tokenColor('--color-primary-rgb'),
        'darker-isof': tokenColor('--color-primary-hover-rgb'),
      },
    },
  },
  variants: {
    extend: {},
  },
};
