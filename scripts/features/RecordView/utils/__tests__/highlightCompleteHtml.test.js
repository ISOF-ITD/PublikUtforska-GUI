/* global expect, test */
import highlightCompleteHtml from '../highlightCompleteHtml';

function parse(html) {
  return new DOMParser().parseFromString(html, 'text/html').body;
}

test('bevarar hela texten med radbrytningar och markerar flera utdrag och upprepade träffar', () => {
  const text = 'Början. Kyrkoherde Holm.\nPräster. KYRKOHERDE. Slutet.';
  const body = parse(highlightCompleteHtml(text, [
    '<span class="highlight">Kyrkoherde</span> Holm.',
    '<span class="highlight">Präster</span>.',
  ]));
  expect(body.textContent).toBe(text);
  expect([...body.querySelectorAll('.highlight')].map((marker) => marker.textContent))
    .toEqual(['Kyrkoherde', 'Präster', 'KYRKOHERDE']);
});

test('bevarar HTML-formatering och länkar och matchar avkodade entiteter och specialtecken', () => {
  const body = parse(highlightCompleteHtml(
    '<b>Början</b><br>A &amp; B (1). <a href="https://example.test">A &amp; B (1)</a>. Slut.',
    '<span class="highlight">A &amp; B (1)</span>',
  ));
  expect(body.textContent).toBe('BörjanA & B (1). A & B (1). Slut.');
  expect(body.querySelector('b').textContent).toBe('Början');
  expect(body.querySelector('br')).not.toBeNull();
  expect(body.querySelector('a').getAttribute('href')).toBe('https://example.test');
  expect(body.querySelectorAll('.highlight')).toHaveLength(2);
});

test('markeringsutdrag kan inte lägga till HTML eller förkorta originalet', () => {
  const body = parse(highlightCompleteHtml(
    'Början. &lt;img src=x onerror=alert(1)&gt;. Slut.',
    '<span class="highlight">&lt;img src=x onerror=alert(1)&gt;</span><script>bad()</script>',
  ));
  expect(body.textContent).toBe('Början. <img src=x onerror=alert(1)>. Slut.');
  expect(body.querySelector('img, script')).toBeNull();
  expect(body.querySelector('.highlight').textContent).toBe('<img src=x onerror=alert(1)>');
});

test.each(['', 'Ett omarkerat utdrag', '<span class="highlight">Annat</span>'])('originalet behålls för %s', (fragment) => {
  const body = parse(highlightCompleteHtml('Hela originalet.', fragment));
  expect(body.textContent).toBe('Hela originalet.');
  expect(body.querySelector('.highlight')).toBeNull();
});
