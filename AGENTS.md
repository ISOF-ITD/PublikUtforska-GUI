# AGENTS.md — React/JSX

## General

- Keep changes minimal and limited to the requested task.
- Follow existing repository patterns.
- `.eslintrc.js` is the source of truth for JS/JSX style and lint rules.
- Do not change lint configuration or add `eslint-disable` unless explicitly requested.
- Avoid unrelated refactoring or cleanup.

## Validation

- Fix lint issues caused by your changes, not unrelated pre-existing issues.
- Validate proportionally to the change:
  - small to mediumchanges: lint changed files when practical;
  - only very large changes: run `npm run lint`;
  - run relevant existing tests when behavior changes.
- If validation cannot be run, say what was not verified.

## React

- Follow Airbnb style as enforced by ESLint.
- Use the React 17+ JSX runtime; do not add `import React` unless required.
- Reuse existing components, hooks, and utilities where reasonable.
- Avoid unnecessary abstractions.

## Styling and theme

- Prefer Tailwind for new or changed styling.
- Read `theme.md` before theme/color changes.
- Use semantic theme tokens instead of hardcoded colors.
- Avoid new `dark:` variants when semantic tokens can be used.
- Keep LESS-to-Tailwind migrations limited to the touched feature.

## Accessibility

For UI changes:
- use semantic HTML and native interactive elements;
- preserve keyboard accessibility and visible focus;
- meet WCAG AA contrast requirements;
- check relevant light/dark and responsive states.

## Scope

- Do not modify unrelated files or behavior.
- Add/update tests for meaningful new behavior when the repo already uses tests there.
- If uncertain, inspect nearby code and config and choose the least invasive solution.