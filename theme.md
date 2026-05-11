# Tema och dark mode

Det här dokumentet beskriver hur Folkes tema är uppbyggt, hur automatiskt dark mode fungerar och hur samma färger används från både Tailwind och legacy LESS/CSS.

## Grundprincip

Temat styrs av webbläsarens och operativsystemets inställning via CSS-regeln:

```css
@media (prefers-color-scheme: dark) {
  ...
}
```

Light mode är default. Om användaren har dark mode aktiverat i systemet eller webbläsaren skrivs färgtokens över av dark mode-värden.

Det betyder att React-komponenterna i normalfallet inte behöver veta om temat är ljust eller mörkt. De ska bara använda semantiska färger, till exempel `surface`, `body`, `link` eller `border`.

## Var färgerna definieras

Alla centrala färger definieras i:

```text
less/theme-tokens.less
```

Den filen importeras tidigt i:

```text
less/style-basic.less
```

Det gör att variablerna är tillgängliga för både nyare Tailwind-baserad styling och äldre LESS/CSS.

Exempel på semantiska tokens:

```css
--color-bg
--color-surface
--color-surface-muted
--color-text
--color-text-muted
--color-text-subtle
--color-link
--color-link-hover
--color-border
--color-primary
--color-focus
--color-input-bg
--color-disabled-bg
```

Namnen beskriver vad färgen används till, inte exakt hur den ser ut. Det är avsiktligt. En komponent ska till exempel säga "jag behöver en panelbakgrund" genom att använda `--color-surface`, inte "jag behöver vit".

## Hur automatiskt dark mode fungerar

I `less/theme-tokens.less` finns först default-värden för light mode:

```css
:root {
  color-scheme: light;
  --color-bg: ...;
  --color-surface: ...;
  --color-text: ...;
}
```

Sedan finns en dark mode-sektion:

```css
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --color-bg: ...;
    --color-surface: ...;
    --color-text: ...;
  }
}
```

När webbläsaren matchar `prefers-color-scheme: dark` ersätts variabelvärdena på `:root`. Alla regler som använder `var(--color-...)` får då automatiskt dark mode utan extra JavaScript.

Exempel:

```css
.panel {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}
```

Samma CSS fungerar i båda teman eftersom variablernas värden ändras.

## Ingen manuell tema-override

Temat styrs bara av `prefers-color-scheme`. Det finns ingen manuell knapp, ingen sparad användarinställning och ingen URL-parameter som växlar tema.

Om du behöver testa båda lägena manuellt ska du ändra systemets eller webbläsarens färgtema, eller använda webbläsarens utvecklarverktyg för att emulera `prefers-color-scheme`.

## Samspel med Tailwind

Tailwind-konfigurationen finns i:

```text
tailwind.config.js
```

Där mappas Tailwind-färger till samma CSS-variabler som LESS använder.

Exempel:

```js
colors: {
  surface: tokenColor('--color-surface-rgb'),
  body: tokenColor('--color-text-rgb'),
  muted: tokenColor('--color-text-muted-rgb'),
  link: tokenColor('--color-link-rgb'),
  border: tokenColor('--color-border-rgb'),
  primary: tokenColor('--color-primary-rgb'),
}
```

Det gör att ny React-kod kan använda Tailwind-klasser som:

```jsx
<div className="bg-surface text-body border border-border">
  <a className="text-link hover:text-link-hover" href="/records/abc">
    Visa post
  </a>
</div>
```

De här klasserna följer automatiskt temat eftersom Tailwind-värdet i slutänden är en CSS-variabel.

### Viktigt om `dark:` i Tailwind

Tailwind är konfigurerat med:

```js
darkMode: 'media'
```

Det betyder att Tailwinds `dark:`-variant följer `prefers-color-scheme`.

Undvik ändå att introducera nya `dark:`-klasser när en token räcker. Semantiska tokenklasser som `bg-surface`, `text-body`, `text-link` och `border-border` gör att Tailwind och legacy LESS/CSS använder samma färgkälla.

## Samspel med legacy LESS och äldre CSS

Det finns fortfarande mycket äldre LESS/CSS i projektet. Därför gör `less/theme-tokens.less` två saker:

1. Definierar semantiska CSS-variabler.
2. Remappar vanliga äldre Tailwind-/legacy-klasser i dark mode.

Exempel på remapping:

```css
@media (prefers-color-scheme: dark) {
  [class~="bg-white"] {
    background-color: var(--color-surface) !important;
  }

  [class~="text-gray-700"] {
    color: var(--color-text) !important;
  }

  [class~="border-gray-300"] {
    border-color: var(--color-border) !important;
  }
}
```

Det här är en skyddsnivå för gamla komponenter som fortfarande använder hårdkodade klasser som `bg-white`, `text-gray-700` eller `border-gray-300`.

Vid ny kod ska man ändå inte luta sig mot remappingen. Den finns för kompatibilitet, inte som rekommenderat arbetssätt.

## Rekommenderat arbetssätt i nya komponenter

Använd semantiska Tailwind-klasser:

```jsx
<section className="bg-surface text-body border border-border">
  <h2 className="text-link">Rubrik</h2>
  <p className="text-muted">Metadata eller hjälpinformation</p>
</section>
```

För formulär:

```jsx
<input
  className="bg-surface text-body border border-border placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-focus"
  placeholder="Sök..."
/>
```

För disabled states:

```jsx
<button className="bg-disabled text-subtle disabled:cursor-not-allowed" disabled>
  Sparar
</button>
```

I LESS/CSS används variablerna direkt:

```css
.legacy-panel {
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
```

## Länkar i dark mode

Länkar använder tokenparet:

```css
--color-link
--color-link-hover
```

I light mode ligger länkarna nära ISOF:s gröna profilfärg. I dark mode är länkarna avsiktligt vita eller gråvita, eftersom gröna länkar upplevdes sticka ut för mycket mot mörka ytor.

Använd därför:

```jsx
<a className="text-link hover:text-link-hover" href="/...">
  Länktext
</a>
```

Undvik nya länkar med hårdkodade `text-isof` om länken ska följa dark mode på ett förutsägbart sätt.

## Logotyper och bilder

ISOF-logotypen byts mellan:

```text
img/logotyp-isof.svg
img/logotyp-isof-vit.svg
```

Theme-aware logotyper använder klasserna:

```css
.theme-aware-logo--light
.theme-aware-logo--dark
```

De styrs av `prefers-color-scheme`.

För bakgrundsbilden i mapmenu används en separat tint-token:

```css
--image-header-back-tint
```

I dark mode ligger en mörk transparent ton ovanpå bilden så att den behåller samma uttryck men inte blir för ljus.

## Checklista när du ändrar UI

När du ändrar en komponent, kontrollera minst:

- Bakgrund: använd `bg-surface`, `bg-surface-muted` eller `var(--color-surface)`.
- Text: använd `text-body`, `text-muted`, `text-subtle` eller motsvarande variabel.
- Länkar: använd `text-link hover:text-link-hover`.
- Borders: använd `border-border`.
- Fokus: använd `focus-visible:ring-focus` eller `var(--color-focus)`.
- Formulärfält: kontrollera bakgrund, text, placeholder, border och disabled state.
- Ikoner: kontrollera att de syns mot både ljus och mörk bakgrund.
- Hover/focus: kontrollera att tillståndet syns men inte bryter färgidentiteten.
- Mobilvy: kontrollera särskilt mapmenu, sökpanel och list-/kortvyer.

## Praktisk testning

För systemstyrt tema:

1. Byt tema i operativsystemet eller webbläsaren.
2. Ladda om sidan.
3. Kontrollera att appen följer systemläget.

För snabb testning kan du använda webbläsarens utvecklarverktyg för att emulera `prefers-color-scheme: dark` eller `prefers-color-scheme: light`.

Testa gärna både desktop och mobil bredd, särskilt:

- sökresultat i kortvy och listvy
- recordview
- personer och platser
- audioitems och global audio player
- sökpanelen med kryssrutor
- mapmenu-panelen
- formulär och overlays

## Vanliga fallgropar

Använd inte hårdkodade färger i ny kod om det finns en token.

Undvik:

```jsx
<div className="bg-white text-gray-900 border-gray-300">
```

Föredra:

```jsx
<div className="bg-surface text-body border-border">
```

Undvik nya `dark:`-klasser om samma sak kan uttryckas med tokens. Tokens håller Tailwind och legacy LESS/CSS synkade.

Lägg inte till en permanent manuell dark mode-toggle utan ett uttryckligt beslut. Den nuvarande modellen är att temat styrs automatiskt av systemet, med URL-parametern endast som test- och granskningshjälp.
