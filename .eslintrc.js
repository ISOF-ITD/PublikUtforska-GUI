module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'airbnb',
    'plugin:react/jsx-runtime',
    'plugin:jsx-a11y/recommended',
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    'react',
    'jsx-a11y',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off', // Do not require React to be in scope when using JSX, as of React 17
    'react/jsx-uses-vars': 'error', // Ensure variables used in JSX are marked as used
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }], // Allow JSX in .js files
    'react/no-danger': 'off', // Allow usage of dangerouslySetInnerHTML when necessary
    'react/require-default-props': 'off', // Disable requirement for default props as we do not use it
    'react/forbid-prop-types': [1, { forbid: [] }], // Allow usage of PropTypes.object and PropTypes.array
    // Forbid import of default export React from "react"
    // See: https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
    'no-restricted-imports': ['error', {
      paths: [{
        name: 'react',
        importNames: ['default'],
        message: 'Import av default export React från \'react\' är inte nödvändigt sedan React 17.',
      }],
    }],
  },
};
