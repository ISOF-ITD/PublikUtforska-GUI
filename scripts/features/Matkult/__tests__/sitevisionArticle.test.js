/* global expect, jest, test */
import { fetchMatkultArticle, parseMatkultArticle } from '../sitevisionArticle';

const sourceUrl = 'https://www.matkult.se/kokboken/recept/2021-01-14-flaskpannkaka-fran-gardstanga.html';
const parse = (html) => new DOMParser().parseFromString(parseMatkultArticle(html, sourceUrl), 'text/html');

test('receptet behåller rubriker, ingrediensrader och betoning utan sidans titel eller navigation', () => {
  const result = parse(`
    <nav>Huvudmeny</nav><div class="pagecontent sv-layout">
      <h1>Fläskpannkaka från Gårdstånga</h1>
      <h2>Ingredienser</h2><p>(För 8 personer)<br>5 ägg<br>1½ l söt mjölk</p>
      <h2>Beredning</h2><p><strong>Recept från:</strong> <em>Erna Larsson</em></p>
    </div><footer>Kommentarer</footer>`);
  expect(result.querySelector('h1, h2, nav, footer')).toBeNull();
  expect([...result.querySelectorAll('h3')].map((heading) => heading.textContent))
    .toEqual(['Ingredienser', 'Beredning']);
  expect(result.querySelectorAll('br')).toHaveLength(2);
  expect(result.querySelector('strong').textContent).toBe('Recept från:');
  expect(result.querySelector('em').textContent).toBe('Erna Larsson');
  expect(result.body.textContent).not.toMatch(/Huvudmeny|Kommentarer|Fläskpannkaka/);
});

test('artikelns bilder får absoluta responsiva adresser, alternativtext och semantisk bildtext', () => {
  const result = parse(`<div class="pagecontent"><div class="sv-image-portlet">
    <img src="/images/fabod.jpg" srcset="/images/fabod-small.jpg 480w, /images/fabod.jpg 1280w" alt="Fäbodstuga 1930" width="1280" height="960">
    <p><span class="sv-image-caption">Foto: William Eriksson, 1930.</span></p>
    </div></div>`);
  const image = result.querySelector('figure img');
  expect(image.getAttribute('src')).toBe('https://www.matkult.se/images/fabod.jpg');
  expect(image.getAttribute('srcset')).toBe('https://www.matkult.se/images/fabod-small.jpg 480w, https://www.matkult.se/images/fabod.jpg 1280w');
  expect(image.getAttribute('alt')).toBe('Fäbodstuga 1930');
  expect(image.getAttribute('loading')).toBe('lazy');
  expect(result.querySelector('figcaption').textContent).toBe('Foto: William Eriksson, 1930.');
});

test('PDF-länkar blir absoluta och får ett namn som förklarar att de öppnas i nytt fönster', () => {
  const result = parse('<div class="pagecontent"><a href="/download/34715.pdf">Hela uppteckningen</a><ul><li>Arkiv: Uppsala</li></ul></div>');
  const link = result.querySelector('a');
  expect(link.getAttribute('href')).toBe('https://www.matkult.se/download/34715.pdf');
  expect(link.getAttribute('target')).toBe('_blank');
  expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  expect(link.getAttribute('aria-label')).toContain('öppnas i nytt fönster');
  expect(result.querySelector('li').textContent).toBe('Arkiv: Uppsala');
});

test('skript, stilar, händelseattribut, formulär, iframes och främmande bilder tas bort', () => {
  const unsafeUrl = ['javascript', 'alert(1)'].join(':');
  const result = parse(`<base href="https://evil.test/"><div class="pagecontent fixed" id="app" style="position:fixed">
    <p onclick="alert(1)">Läsbar text</p><script>window.matkultExecuted = true;</script>
    <style>body{display:none}</style><iframe src="https://evil.test/">Ram</iframe>
    <form action="https://evil.test"><input value="Hemligt"><button>Skicka</button>Formulär</form>
    <svg><a href="${unsafeUrl}">SVG</a></svg><math><mtext>Matematik</mtext></math>
    <img src="https://evil.test/pixel.jpg" onerror="alert(1)">
    <img src="data:image/svg+xml,attack"><img src="/images/safe.jpg" srcset="https://evil.test/pixel.jpg 2x, /images/safe.jpg 480w">
    <a href="${unsafeUrl}">Osäker länk</a><div class="sv-comments2-portlet">Kommentarer</div>
    </div>`);
  expect(result.querySelector('script, style, iframe, form, input, button, svg, math, base')).toBeNull();
  expect(result.querySelector('[onclick], [onerror], [style], [id], [class]')).toBeNull();
  expect(result.querySelectorAll('img')).toHaveLength(1);
  expect(result.querySelector('img').getAttribute('srcset')).not.toContain('evil.test');
  expect(result.querySelector('a').hasAttribute('href')).toBe(false);
  expect(result.body.textContent).not.toMatch(/Formulär|Kommentarer|matkultExecuted/);
  expect(result.body.textContent).toContain('Läsbar text');
});

test.each([
  '<html><body><h1>Logga in</h1></body></html>',
  '<div class="pagecontent"><h1>Bara en rubrik</h1></div>',
  '<div class="pagecontent"><script>scriptOnly()</script></div>',
])('saknat artikelinnehåll ger fel så att indextexten kan visas som reserv', (html) => {
  expect(() => parseMatkultArticle(html, sourceUrl)).toThrow();
});

test('hämtning skickar inga cookies och använder den slutliga sidans adress som bas', async () => {
  global.fetch = jest.fn(async () => ({
    ok: true,
    url: 'https://matkult.se/till-kartan/mjolk/34715',
    text: async () => '<div class="pagecontent"><a href="bilaga.pdf">Bilaga</a></div>',
  }));
  const controller = new AbortController();
  const result = await fetchMatkultArticle(sourceUrl, controller.signal);
  expect(global.fetch).toHaveBeenCalledWith(sourceUrl, {
    credentials: 'omit', mode: 'cors', signal: controller.signal,
  });
  expect(result).toContain('https://matkult.se/till-kartan/mjolk/bilaga.pdf');
});

test('ogiltiga källadresser, svar och omdirigeringar används inte som artikelinnehåll', async () => {
  global.fetch = jest.fn(async () => ({ ok: false }));
  await expect(fetchMatkultArticle('https://evil.test/page')).rejects.toThrow();
  expect(global.fetch).not.toHaveBeenCalled();
  await expect(fetchMatkultArticle(sourceUrl)).rejects.toThrow();
  global.fetch.mockResolvedValue({
    ok: true, url: 'https://evil.test/page', text: async () => '<div class="pagecontent">Text</div>',
  });
  await expect(fetchMatkultArticle(sourceUrl)).rejects.toThrow();
});
