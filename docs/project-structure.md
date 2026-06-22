# Project structure

The project is slowly moving from a layer-based tree, like `components/` and `views/`, to a feature-first structure.

The first migration step moved the RecordList behaviour into its own folder. Files that implement one behaviour should live together, with local hooks, UI, state, and helpers near the feature.

References:

* Robin Wieruch, React Folder Structure in 5 Steps: https://www.robinwieruch.de/react-folder-structure/
* Feature-Sliced Design methodology: https://feature-sliced.github.io/documentation/

## How the feature structure is used here

The project uses components and features, but no pages layer for now.

Features usually have one slice, or no explicit slice. Common feature segments are:

* `hooks`: logic, often custom React hooks.
* `ui`: presentation, usually JSX.
* `utils`: helper functions that do not use React hooks.

When a feature file gets too large, move focused logic into a suitable `hooks`, `ui`, or `utils` file near the feature.

## Props

Use PropTypes for component props:

```javascript
import PropTypes from 'prop-types';
```

See [development conventions](development.md) for code style rules.
