# Deploy and rollback

## Deploy code on server

Run on server:

```bash
cd /var/www/react/PublikUtforska-GUI/
# gitupdate.sh is run separately so older versions can still be deployed.
./gitupdate.sh
./deploy.sh
```

`deploy.sh` publishes every build as a separate release under `www/releases/<release-id>/` and updates only the stable files in `www/`, for example `index.html`. This lets users with an older open browser tab keep loading chunks from the version they already have.

Old releases are kept for 7 days by default. You can change this for one deploy:

```bash
./deploy.sh --keepDays 14
```

You can also set a fixed release id when needed:

```bash
./deploy.sh --releaseId 20260521-1430
```

## Manual rollback to an earlier release

Rollback is done by copying the earlier release's `index.html` back to `www/index.html`. The file has the asset URLs for that release, so new page loads use the older bundle and chunks again.

Run on server:

```bash
cd /var/www/react/PublikUtforska-GUI/
ls -1 www/releases
cp www/releases/20260521-1430/index.html www/index.html
printf '%s\n' '20260521-1430' > www/current-release.txt
```

If static root assets also must match the rolled back release, copy them too:

```bash
cp -R www/releases/20260521-1430/img/. www/img/
cp -R www/releases/20260521-1430/fonts/. www/fonts/
cp www/releases/20260521-1430/favicon.ico www/favicon.ico
```

Rollback is only possible while the release directory still exists.

## Deploy with a custom public path

If the application should be deployed to a subpath, for example `/demo/test/www/` instead of `/`, use the `--publicPath` flag to `deploy.sh`.

```bash
./deploy.sh --publicPath /demo/test/www/
```

The script makes sure the path ends with a trailing slash.

Examples:

* `./deploy.sh --publicPath /demo/test/www/` uses `/demo/test/www/`.
* `./deploy.sh --publicPath /demo/test/www` is corrected to `/demo/test/www/`.

In development, `publicPath` is passed as an environment variable (`PUBLIC_PATH`) and used by `webpack.config.js`:

```bash
PUBLIC_PATH=/demo/test/www/ npm run start
```

If no `--publicPath` is provided, it defaults to `/`.

When release assets are published, the configured public path gets the release directory added.

Examples:

* `./deploy.sh` loads assets from `/releases/<release-id>/`
* `./deploy.sh --publicPath /demo/test/www/` loads assets from `/demo/test/www/releases/<release-id>/`

During build, `webpack.config.js` prints the active `PUBLIC_PATH` to the console. With release deploys, the printed path includes the release directory, for example `/demo/test/www/releases/20260521-1430/`.
