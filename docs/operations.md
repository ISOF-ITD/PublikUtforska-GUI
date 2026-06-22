# Operations

## Sitemap

Create or update sitemap on the server:

```bash
npm run create-sitemap
```

A cron job on the production server runs the sitemap script every Monday at 04:00:

```bash
cd /var/www/react/PublikUtforska-GUI/ && npm run create-sitemap | awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap.log 2>> >(awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap-error.log)
```

The command changes to the project directory, runs the sitemap script, and logs output and errors separately. Check the logs in the project's `logs` directory. Change the cron job with `crontab -e`.

## Warning message

To add a custom warning message in the application:

1. Create `varning.html` in the main folder on the server. You can copy one of the `varning.template*.html` files as start.
2. Add the warning message HTML. Plain text and simple HTML tags like `<pre>` and `<strong>` can be used.
3. Deploy again with `./deploy.sh`.

If `varning.html` exists, the warning message is shown automatically.

## Temporarily disable transcription

Change `activateTranscription` in `scripts/config.js` on the server and deploy again.

Disable transcription:

```javascript
activateTranscription: false,
```

Then run:

```bash
cd /var/www/react/PublikUtforska-GUI/
./deploy.sh
```

Enable transcription again:

```javascript
activateTranscription: true,
```

Then deploy again:

```bash
cd /var/www/react/PublikUtforska-GUI/
./deploy.sh
```

## Change default background map

In `scripts/components/views/MapBase.js`, change `DEFAULT_BASE` to the name of the wanted map layer in `tileLayers` in `maphelper.js`.

Example:

```javascript
// Prefer OSM as default while Lantmäteriet is down
const DEFAULT_BASE = 'Open Street Map Mapnik';
```

## robots.txt with Apache proxy

Different environments use different `robots.txt` files. Test should prevent indexing, while production should use the rules from `/robots/robots.production.txt`.

### Test environment

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.test.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

### Production environment

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.production.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

If `robots.txt` must be changed, update the right file in `/robots/` and check that the proxy points to the intended version.
