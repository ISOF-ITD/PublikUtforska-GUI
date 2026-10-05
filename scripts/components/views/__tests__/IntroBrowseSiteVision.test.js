/* global afterEach, beforeEach, expect, jest, test */
import fs from 'node:fs';
import path from 'node:path';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const script = fs.readFileSync(
  path.resolve(process.cwd(), 'docs/sitevision/folke-search-hero.js'),
  'utf8',
);
let frame;
let parentWindow;

beforeEach(() => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.isof.se/folke/start';
  document.body.appendChild(iframe);
  frame = iframe.contentWindow;
  frame.document.open();
  frame.document.write('<main><p>Välkomstinnehåll</p></main>');
  frame.document.close();
  Object.defineProperty(frame.document, 'referrer', { value: 'https://sok.folke.isof.se/' });
  parentWindow = window;
  jest.spyOn(parentWindow, 'postMessage').mockImplementation(() => {});
  frame.eval(script);
  frame.document.dispatchEvent(new frame.Event('DOMContentLoaded'));
});

afterEach(() => {
  frame.frameElement.remove();
  jest.restoreAllMocks();
});

function confirmCapability(version = 2) {
  frame.dispatchEvent(new frame.MessageEvent('message', {
    source: parentWindow,
    origin: 'https://sok.folke.isof.se',
    data: {
      type: 'introSearchCapabilityResponse',
      version,
      supported: true,
      suggestions: version >= 2,
    },
  }));
}

test.each([1, 2])('Utforska arkivet fungerar utan sökord med protokollversion %s', async (version) => {
  expect(within(frame.document.body).queryByRole('button', { name: 'Utforska arkivet' })).toBeNull();
  confirmCapability(version);
  const screen = within(frame.document.body);
  const browseButton = screen.getByRole('button', { name: 'Utforska arkivet' });
  expect(browseButton.closest('form')).toBeNull();
  expect(screen.getByRole('button', { name: 'Sök', exact: true })).toBeDisabled();
  parentWindow.postMessage.mockClear();

  const user = userEvent.setup({ document: frame.document });
  await user.click(browseButton);

  expect(parentWindow.postMessage).toHaveBeenCalledTimes(1);
  expect(parentWindow.postMessage).toHaveBeenCalledWith(
    { type: 'navigateAway' },
    'https://sok.folke.isof.se',
  );
});

test.each(['{Enter}', ' '])('Utforska arkivet kan aktiveras med %s även om sökfältet innehåller text', async (activation) => {
  confirmCapability();
  const screen = within(frame.document.body);
  const user = userEvent.setup({ document: frame.document });
  await user.type(screen.getByRole('combobox', { name: 'Sök i Folke' }), 'visa');
  const browseButton = screen.getByRole('button', { name: 'Utforska arkivet' });
  browseButton.focus();
  parentWindow.postMessage.mockClear();

  await user.keyboard(activation);

  expect(parentWindow.postMessage).toHaveBeenCalledTimes(1);
  expect(parentWindow.postMessage).toHaveBeenCalledWith(
    { type: 'navigateAway' },
    'https://sok.folke.isof.se',
  );
});

test('kapabilitetssvar skapar inte dubbla ingångar', () => {
  confirmCapability();
  confirmCapability();
  expect(within(frame.document.body).getAllByRole('button', { name: 'Utforska arkivet' })).toHaveLength(1);
});
