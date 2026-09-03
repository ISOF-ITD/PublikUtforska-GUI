# Folke sök GUI, aka PublikUtforska-GUI

Public crowdsource interface based on map search.

[Accessibility](Accessibility.md)

[Tema och dark mode](theme.md)

## Quick start

```bash
npm run start
```

## Common commands

```bash
npm run lint # Lint code with ESLint
npm run build # Build production bundle in /build
npm run analyze-bundle # Analyze bundle size with source-map-explorer
npm run create-sitemap # Create or update sitemap.xml on the server
```

## Code style

* Use EcmaScript syntax.
* Use React functional components with hooks instead of class components.
* Use PropTypes for component props.
* Follow the ESLint rules in [.eslintrc.js](.eslintrc.js). They are based on Airbnb's JavaScript Style Guide.
* Prefer Tailwind utility classes for new or rewritten styling. See [theme.md](theme.md) for color tokens and dark mode.

Recommended VS Code extensions:

* ESLint
* Prettier
* Tailwind CSS IntelliSense

`AGENTS.md` and `.github/copilot-instructions.md` have project instructions for coding assistants.

## Intro-overlay och SiteVision

Folke visar SiteVisions hjälpsidor i en iframe. SiteVision och Folke ligger på
olika webbadresser, så koden på de två sidorna får inte anropa varandras
funktioner direkt. De skickar i stället små meddelanden till varandra med
`window.postMessage`.

Folke-sidan finns i [`IntroOverlay.js`](scripts/components/views/IntroOverlay.js).
Adressen till SiteVision och namnet på startsidan finns i
[`scripts/config.js`](scripts/config.js). [`SearchControls`](scripts/components/SearchControls.js)
öppnar och stänger overlayen och kommer ihåg i `localStorage` att användaren har
sett den.

### Filerna i SiteVision

SiteVision-filerna finns inte i detta repository. Om meddelandena ändras här
måste de därför även ändras i SiteVision.

#### `postMessage.js`

Den här filen ligger i sidmallen och körs på alla hjälpsidor.

- När en sida har laddats skickar skriptet sidans adress till Folke som
  `newSrc`. Folke sparar den i URL-parametern `k`. Det gör att en viss hjälpsida
  kan öppnas igen direkt. Startsidan blir `k=start`.
- När användaren klickar på en länk med `target="_parent"` skickar skriptet
  `navigateAway`. Folke stänger då overlayen innan länken tar över hela
  webbläsarfönstret.
- Skriptet skickar också `introScroll` när användaren scrollar. Det behövs inte
  av den nuvarande Folke-koden, eftersom sökfältet numera ligger inne på
  SiteVision-sidan och scrollar med innehållet. Koden finns kvar för äldre
  versioner och kan tas bort när de inte längre behöver stödjas.

Klickkontrollen tittar just nu bara på det element som träffades. Om en länk
innehåller en ikon eller en `<span>` kan ett klick på det inre elementet därför
missas. En tåligare lösning är:

```javascript
const link = event.target.closest('a[href][target="_parent"]');
```

#### `folke-search-hero.js`

Den här filen ligger bara på startsidan `/folke/start`.

Hela filen ligger i en funktion som körs direkt. Det gör att variablerna i filen
inte blandas ihop med SiteVisions övriga JavaScript. Mönstret kallas ibland IIFE,
men namnet är inte viktigt för att förstå lösningen.

Skriptet gör följande:

1. Kontrollerar att sidan visas i en iframe och att adressen är
   `/folke/start`.
2. Frågar Folke om den nya sökfunktionen stöds. Frågan skickas högst fem gånger
   med 400 ms mellan försöken, eftersom Folke ibland behöver lite tid för att
   starta sin meddelandelyssnare.
3. Skapar bara sökfältet om Folke svarar att version 1 stöds. En gammal
   produktionsversion svarar inte, så där visas inget oanvändbart sökfält.
4. Lägger in CSS och sökformuläret först i sidans `<main>`. CSS-reglerna gäller
   bara söksektionen och innehåller mobilanpassning och dark mode.
5. Aktiverar sökknappen när fältet innehåller text. Vid sökning trimmas texten
   och skickas till Folke som `introSearch`.

Formuläret har en kopplad etikett och hjälptext för skärmläsare, tydlig
fokusmarkering, läsbara kontraster och ett statusmeddelande när resultatet
öppnas. Det har också attribut som minskar risken att lösenordshanterare
misstolkar sökfältet som ett inloggningsfält.

### Meddelanden mellan sidorna

| Från | Meddelande | Vad mottagaren gör |
| --- | --- | --- |
| SiteVision | `{ newSrc: window.location.href }` | Folke uppdaterar URL-parametern `k`. |
| SiteVision | `{ type: 'navigateAway' }` | Folke stänger overlayen efter 100 ms. |
| SiteVision | `{ type: 'introScroll', scrollY: number }` | Nuvarande Folke-version ignorerar meddelandet. |
| SiteVision | `{ type: 'introSearchCapabilityRequest', version: 1 }` | Folke svarar om sökfunktionen stöds. |
| Folke | `{ type: 'introSearchCapabilityResponse', version: 1, supported: true }` | SiteVision skapar sökfältet. |
| SiteVision | `{ type: 'introSearch', search: string }` | Folke öppnar det vanliga sökresultatet som lista. |

När Folke tar emot en sökning kontrolleras att söktexten verkligen är en text,
och blanksteg i början och slutet tas bort. En tom sökning ignoreras. En giltig
sökning använder samma routing som det vanliga sökfältet och behåller aktuellt
material- eller transkriptionsläge. Overlayen stängs och markeras samtidigt som
visad.

### Kontroller av avsändaren

Folke tar bara emot meddelanden från den iframe som `IntroOverlay` själv har
skapat. SiteVision kontrollerar på samma sätt att svaret om sökstöd kommer från
föräldrafönstret. När förälderns webbadress går att läsa från
`document.referrer` används den som mottagaradress. `'*'` används som reserv om
adressen saknas.

### Publicering och test

Sökstödet är gjort så att SiteVision-koden kan publiceras först:

1. Publicera `postMessage.js` och `folke-search-hero.js` i SiteVision.
2. Kontrollera att den gamla Folke-versionen inte visar sökfältet.
3. Publicera den nya Folke-versionen.
4. Ladda om utan cache och kontrollera startsidan och en undersida.
5. Kontrollera sökning, interna länkar, `target="_parent"`-länkar, mobil bredd
   samt ljust och mörkt systemtema.

Om sökfältet inte visas, kontrollera först att iframe-adressen är exakt
`/folke/start` och att SiteVision inte serverar en äldre cachad fil. I
webbläsarens utvecklarverktyg går det sedan att kontrollera att frågan
`introSearchCapabilityRequest` skickas och att Folke svarar med
`introSearchCapabilityResponse`. Kontrollera även `document.referrer` och att
URL-parametern `k` ändras när en annan hjälpsida öppnas.

## Deploy code on server

Run on server:

```bash
cd /var/www/react/PublikUtforska-GUI/
./gitupdate.sh
./deploy.sh
```

`deploy.sh` publishes every build as a separate release under `www/releases/<release-id>/` and updates the stable files in `www/`, for example `index.html`.

Old releases are kept for 7 days by default. Change it for one deploy:

```bash
./deploy.sh --keepDays 14
```

Use a fixed release id when needed:

```bash
./deploy.sh --releaseId 20260521-1430
```

## Manual rollback

Each deploy creates one release folder in `www/releases/`. To roll back, choose one old release id and make `www/index.html` point to that release again.

Example release id:

```text
20260521-1430
```

First list available releases:

```bash
cd /var/www/react/PublikUtforska-GUI/
ls -1 www/releases
```

Then copy the old `index.html` back:

```bash
cp www/releases/20260521-1430/index.html www/index.html
printf '%s\n' '20260521-1430' > www/current-release.txt
```

This is normally enough, because `index.html` contains the bundle and chunk URLs for that release.

If images, fonts, or favicon also must match the old release, copy them too:

```bash
cp -R www/releases/20260521-1430/img/. www/img/
cp -R www/releases/20260521-1430/fonts/. www/fonts/
cp www/releases/20260521-1430/favicon.ico www/favicon.ico
```

Rollback only works while the old release folder still exists.

## Deploy with custom public path

If the application should be deployed to a subpath, for example `/demo/test/www/` instead of `/`, use `--publicPath`.

```bash
./deploy.sh --publicPath /demo/test/www/
```

The script makes sure the path ends with a trailing slash.

In development, pass the same path with `PUBLIC_PATH`:

```bash
PUBLIC_PATH=/demo/test/www/ npm run start
```

## Sitemap

Create or update sitemap on the server:

```bash
npm run create-sitemap
```

On production, cron runs this every Monday at 04:00:

```bash
cd /var/www/react/PublikUtforska-GUI/ && npm run create-sitemap | awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap.log 2>> >(awk '{print strftime("[%Y-%m-%d %H:%M:%S]"), $0}' >> /var/www/react/PublikUtforska-GUI/logs/sitemap-error.log)
```

Check logs in the `logs` directory. Change the cron job with `crontab -e`.

## Warning message

To show a custom warning message:

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

Enable transcription again:

```javascript
activateTranscription: true,
```

Then deploy:

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

Test:

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.test.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

Production:

```apache
Alias /robots.txt /var/www/react/PublikUtforska-GUI/robots/robots.production.txt

<Directory "/var/www/react/PublikUtforska-GUI/config">
    Require all granted
</Directory>
```

If `robots.txt` must be changed, update the right file in `/robots/` and check that the proxy points to the intended version.

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

## Styling migration

We are slowly replacing old LESS with Tailwind CSS v3.4.

* New or rewritten components should use Tailwind utility classes.
* Old `.less` files stay until their component is migrated.
* Some old LESS rules target broad HTML selectors, for example all `<button>` elements. These can override Tailwind styles and should be reduced when that component is touched.
* Tailwind JIT is configured in `tailwind.config.js`; run `npm run start` as usual.
* For conditional or dynamic styling, compose Tailwind classes with `classnames` instead of manual string concatenation.
* For small non-blocking notifications, use the `toastOk()` and `toastError()` helpers in `utils/toast.js`.
* Use Tailwind arbitrary values for Folke-specific z-indexes, for example `z-[23]`.
* When old LESS must be overridden from Tailwind, use the important modifier, for example `!mt-2`.

## Popups and modals

Avoid popups when the same task can be solved inline. If a modal is needed, make sure focus, keyboard handling, and z-index works.

Reference: https://www.nngroup.com/articles/popups/
