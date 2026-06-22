# Folke sök GUI, aka PublikUtforska-GUI

Public crowdsource interface based on map search.

## Quick start

```bash
npm run start
```

## Common commands

```bash
npm run lint
npm run build
npm run analyze-bundle
npm run create-sitemap
```

## Code style

* Use ES6 syntax.
* Use React functional components with hooks instead of class components.
* Use PropTypes for component props.
* Follow the ESLint rules in [.eslintrc.js](.eslintrc.js). They are based on Airbnb's JavaScript Style Guide.
* Prefer Tailwind utility classes for new or rewritten styling. See [theme.md](theme.md) for color tokens and dark mode.

Recommended VS Code extensions:

* ESLint
* Prettier
* Tailwind CSS IntelliSense

`AGENTS.md` and `.github/copilot-instructions.md` have project instructions for coding assistants.

## Deploy

Run on server:

```bash
cd /var/www/react/PublikUtforska-GUI/
./gitupdate.sh
./deploy.sh
```

`deploy.sh` publishes builds as separate releases under `www/releases/<release-id>/` and updates the stable files in `www/`.

See [Deployment and rollback](docs/deployment.md) for rollback, how long releases are kept, and custom public path.

## Operations

* Create or update sitemap with `npm run create-sitemap`.
* Warning messages are shown automatically if `varning.html` exists on the server.
* Default background map is changed in `scripts/components/views/MapBase.js`.
* Different `robots.txt` files are served with Apache proxy configuration.

See [Operations](docs/operations.md) for the detailed commands and server configuration.

## Architecture notes

The project is slowly moving from a layer-based tree to a feature-first structure. Feature code should keep local hooks, UI, state, and helpers near the behaviour they belong to.

Most application state is controlled by the route, for example search parameters, search type, and display of one record. Some overlay and popup state is outside routing on purpose.

## Documentation

* [Development conventions](docs/development.md)
* [Deployment and rollback](docs/deployment.md)
* [Operations](docs/operations.md)
* [Project structure](docs/project-structure.md)
* [Routing](docs/routing.md)
* [Accessibility](Accessibility.md)
* [Tema och dark mode](theme.md)
