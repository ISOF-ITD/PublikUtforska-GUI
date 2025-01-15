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
  ],
  rules: {
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    'react/no-danger': 'off',
    'react/forbid-prop-types': [1, { forbid: [] }],
    // New rule: No import av default export "React" från "react"
    // See: https://legacy.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
    'no-restricted-imports': ['error', {
      paths: [{
        name: 'react',
        importNames: ['default'],
        message: 'Import av default export "React" från "react" är inte nödvändigt sedan React 17.',
      }],
    }],
  },
};
