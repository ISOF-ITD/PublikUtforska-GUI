## AI Coding Rules
- For JSX/React changes, follow the Airbnb JavaScript Style Guide as enforced by this repository's ESLint setup (`eslint-config-airbnb`, `eslint-plugin-react`).
- Treat `.eslintrc.js` as the source of truth. If Airbnb defaults and local ESLint rules differ, follow local ESLint rules.
- Use Airbnb/default ESLint quote style unless `.eslintrc.js` introduces an explicit override.
- Before finishing code changes, run `npm run lint`.
