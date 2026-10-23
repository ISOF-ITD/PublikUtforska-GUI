/* global afterEach, beforeEach, expect, jest, test */
import { act, render, screen } from '@testing-library/react';
import ServiceWarning from '../ServiceWarning';

const warningHtml = '<strong>Tekniska problem i Folke</strong><br>Just nu fungerar inte sökning och visning av arkivmaterial. Försök igen senare.';
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(warningHtml),
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  document.querySelectorAll('script[data-warning-test]').forEach((script) => script.remove());
});

test('visar den aktuella drifttexten utan anrop till API:et', async () => {
  render(<ServiceWarning />);

  const warning = await screen.findByRole('alert', { name: 'Driftinformation' });
  expect(warning).toHaveTextContent('Tekniska problem i Folke');
  expect(warning).toHaveTextContent('Just nu fungerar inte sökning och visning av arkivmaterial');
  expect(warning.querySelector('strong')).toHaveTextContent('Tekniska problem i Folke');
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(global.fetch).toHaveBeenCalledWith('/varning.html', expect.objectContaining({
    cache: 'no-store',
  }));
});

test.each([
  ['https://folke.example/bndl.hash.js', 'https://folke.example/varning.html'],
  ['https://folke.example/releases/20261023/bndl.hash.js', 'https://folke.example/varning.html'],
  ['https://folke.example/demo/www/bndl.hash.js', 'https://folke.example/demo/www/varning.html'],
  ['https://folke.example/demo/www/releases/20261023/bndl.hash.js', 'https://folke.example/demo/www/varning.html'],
])('hämtar en redigerbar varning från stabil rot för %s', async (src, warningUrl) => {
  const script = document.createElement('script');
  script.src = src;
  script.dataset.warningTest = 'true';
  document.head.appendChild(script);

  render(<ServiceWarning />);
  await screen.findByRole('alert');

  expect(global.fetch).toHaveBeenCalledWith(warningUrl, expect.objectContaining({
    cache: 'no-store',
  }));
});

test.each(['', ' \n\t', '<!doctype html><html><body>Folke</body></html>', '<html lang="sv"><body>Folke</body></html>'])(
  'döljer varningen för tom fil eller SPA-fallback: %s',
  async (content) => {
    global.fetch.mockResolvedValue({ ok: true, text: () => Promise.resolve(content) });

    await act(async () => { render(<ServiceWarning />); });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  },
);

test.each([404, 503])('döljer varningen när filen svarar med %s', async (status) => {
  const text = jest.fn();
  global.fetch.mockResolvedValue({ ok: false, status, text });

  await act(async () => { render(<ServiceWarning />); });

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  expect(text).not.toHaveBeenCalled();
});

test('hanterar nätverksfel när varningsfilen hämtas', async () => {
  global.fetch.mockRejectedValue(new TypeError('Failed to fetch'));

  await act(async () => { render(<ServiceWarning />); });

  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

test('avbryter hämtningen när varningen avmonteras', () => {
  global.fetch.mockImplementation(() => new Promise(() => {}));
  const { unmount } = render(<ServiceWarning />);
  const { signal } = global.fetch.mock.calls[0][1];

  unmount();

  expect(signal.aborted).toBe(true);
});
