# AGENTS.md — AI Coding Rules (React/JSX)

These rules are mandatory. If anything conflicts, follow the repo configuration files (especially `.eslintrc.js`).

## Source of truth
- `.eslintrc.js` is the source of truth for all style and lint decisions.
- Do not “guess” style rules. If unsure, prefer what ESLint would accept.

## Linting must pass
Before you say the work is done:
1) Run `npm run lint`.
2) Fix all reported issues (errors and warnings) in the changed lines, but not in the whole of the changed file!

## Do not bypass rules
- Do NOT add `// eslint-disable` or relax rules to silence errors unless explicitly asked.
- Do NOT change `.eslintrc.js` (or lint config) just to make a change pass unless explicitly asked.
- If linting would require a tradeoff (e.g. rule exception vs refactor), choose the option that satisfies the linter without changing lint rules.

## React/JSX conventions
- Follow Airbnb style as enforced by the repo’s ESLint setup.
- Respect React 17+ JSX runtime conventions:
  - Do not add `import React from "react"` unless ESLint explicitly requires it (it shouldn’t).
- Use the repo’s configured quote style and formatting rules (no stylistic bikeshedding).

## Styling conventions
- Prefer Tailwind utility classes over LESS when implementing or updating styling.
- When styling changes are made, remove or reduce related LESS code where possible and replace it with Tailwind classes.
- Keep styling migrations incremental and limited to the touched feature or component.

## DRY
- Avoid introducing new code that duplicates existing logic, styles, or components.
- If you find yourself writing code that seems similar to existing code, check if you can reuse or refactor existing code instead of creating new code.
- If you need to create new components or utilities, check if there are existing ones that can be extended or modified to fit the new use case.

## Theme and dark mode conventions
- Read [theme.md](theme.md) before making theme, color, or component styling changes.
- The application uses automatic dark mode through `prefers-color-scheme`; do not add a permanent manual theme toggle, `localStorage`, cookies, or persisted user preferences unless explicitly requested.
- Use the shared semantic color tokens from `less/theme-tokens.less` and `tailwind.config.js` instead of hardcoded colors.
- For new or updated Tailwind code, prefer semantic classes such as `bg-surface`, `bg-surface-muted`, `text-body`, `text-muted`, `text-subtle`, `text-link`, `hover:text-link-hover`, `border-border`, `ring-focus`, `bg-disabled`, and `text-danger`.
- For LESS/CSS that cannot reasonably be migrated to Tailwind yet, use CSS custom properties such as `var(--color-surface)`, `var(--color-text)`, `var(--color-border)`, and `var(--color-focus)`.
- Avoid introducing new `dark:` Tailwind variants when a semantic token can express the same styling. Tokens keep styling consistent between Tailwind and legacy LESS/CSS.
- Do not rely on legacy remapping of classes like `bg-white`, `text-gray-*`, or `border-gray-*` in new code. That remapping exists as compatibility support for old components.
- When changing UI, check both light and dark mode for backgrounds, text contrast, links, borders, form fields, disabled states, hover/focus states, icons, mobile views, and search result cards/lists.
- Keep the existing ISOF/Folke visual identity. In dark mode, links should use the shared link tokens, which intentionally resolve to white or suitable gray tones rather than green.

## A11y and semantics
- Follow best practices for accessibility (a11y) with a focus on WCAG AA standards.
- Use semantic HTML elements where appropriate (e.g. `<header>`, `<nav>`, `<main>`, `<footer>`, `<button>`, etc.).
- Ensure interactive elements are keyboard accessible and have appropriate ARIA attributes if needed.

## Change discipline
- Keep changes minimal and consistent with existing code patterns.
- Avoid unrelated refactors in the same change.
- If you introduce new code paths, update or add tests where the repo already uses them.

## When blocked
- If you cannot run commands in the environment, still write code that is consistent with `.eslintrc.js` and explain what you expect `npm run lint` to report.
- If rules appear contradictory, report the conflict and propose the smallest fix that restores consistency.

## Enforcement
- At the end of every change, always enforce Airbnb style conventions for the lines you have modified.
