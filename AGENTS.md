# AGENTS.md — AI Coding Rules (React/JSX)

These rules are mandatory. If anything conflicts, follow the repo configuration files (especially `.eslintrc.js`).

## Source of truth
- `.eslintrc.js` is the source of truth for all style and lint decisions.
- Do not “guess” style rules. If unsure, prefer what ESLint would accept.

## Linting must pass
Before you say the work is done:
1) Run `npm run lint`.
2) Fix all reported issues (errors and warnings) in the changed files.
3) If your workflow supports autofix, prefer it:
   - Try `npm run lint -- --fix` (or `npm run lint:fix` if it exists), then re-run `npm run lint`.

## Do not bypass rules
- Do NOT add `// eslint-disable` or relax rules to silence errors unless explicitly asked.
- Do NOT change `.eslintrc.js` (or lint config) just to make a change pass unless explicitly asked.
- If linting would require a tradeoff (e.g. rule exception vs refactor), choose the option that satisfies the linter without changing lint rules.

## React/JSX conventions
- Follow Airbnb style as enforced by the repo’s ESLint setup.
- Respect React 17+ JSX runtime conventions:
  - Do not add `import React from "react"` unless ESLint explicitly requires it (it shouldn’t).
- Use the repo’s configured quote style and formatting rules (no stylistic bikeshedding).

## Change discipline
- Keep changes minimal and consistent with existing code patterns.
- Avoid unrelated refactors in the same change.
- If you introduce new code paths, update or add tests where the repo already uses them.

## When blocked
- If you cannot run commands in the environment, still write code that is consistent with `.eslintrc.js` and explain what you expect `npm run lint` to report.
- If rules appear contradictory, report the conflict and propose the smallest fix that restores consistency.