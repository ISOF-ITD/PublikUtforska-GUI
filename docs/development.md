# Development conventions

## Code style

* Use ES6 syntax.
* Use [React](https://reactjs.org/) functional components with hooks instead of class components.
* When changing an old class component, consider if it can be changed to a functional component.
* Use [PropTypes](https://reactjs.org/docs/typechecking-with-proptypes.html) for component props.
* Use [Airbnb's JavaScript Style Guide](https://github.com/airbnb/javascript) with [ESLint](https://eslint.org/).

The ESLint rules are defined in [.eslintrc.js](../.eslintrc.js).

## Visual Studio Code

Recommended extensions:

* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* Optional: [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
* Tailwind CSS IntelliSense

`AGENTS.md` and `.github/copilot-instructions.md` have project instructions for coding assistants.

## Styling migration

We are slowly replacing old LESS with Tailwind CSS v3.4.

* New or rewritten components should use Tailwind utility classes.
* Old `.less` files stay until their component is migrated.
* Some old LESS rules target broad HTML selectors, for example all `<button>` elements. These can override Tailwind styles and should be reduced when that component is touched.
* Tailwind JIT is configured in [tailwind.config.js](../tailwind.config.js); run `npm run start` as usual.
* For conditional or dynamic styling, compose Tailwind classes with `classnames` instead of manual string concatenation.
* For small non-blocking notifications, use the `toastOk()` and `toastError()` helpers in `utils/toast.js`.
* Use Tailwind arbitrary values for Folke-specific z-indexes, for example `z-[23]`.
* When old LESS must be overridden from Tailwind, use the important modifier, for example `!mt-2`.

See [theme.md](theme.md) for color tokens, dark mode, and theme conventions.

## Icons

When possible, use SVG icons to keep data size down.

Use Font Awesome through:

```javascript
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
```

Common icon packages:

* `@fortawesome/free-regular-svg-icons`
* `@fortawesome/free-solid-svg-icons`

Put standalone icon files in `/img`.

## Popups and modals

Avoid popups when the same task can be solved inline. If a modal is needed, make sure focus, keyboard handling, and z-index works.

Reference: https://www.nngroup.com/articles/popups/
