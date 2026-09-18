/* global afterEach, beforeEach, expect, jest, test */
import fs from 'node:fs';
import path from 'node:path';
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SearchControls from '../SearchControls';
import RoutePageShell from '../RoutePageShell';
import IntroOverlay from '../views/IntroOverlay';

jest.mock('../../features/Search/SearchPanel', () => function SearchPanel() {
  return null;
});

jest.mock('../../hooks/useBookmarkedRecords', () => ({
  __esModule: true,
  BOOKMARKED_RECORDS_RETURN_STORAGE_KEY: 'bookmarked-records-return-test',
  default: () => ({ ids: ['record-1'], count: 1 }),
}));

jest.mock('../../features/Search/hooks/useSearchRouting', () => () => ({
  navigateToSearch: jest.fn(),
}));

jest.mock('../../features/Search/hooks/useSearchSuggestions', () => () => ({
  visibleSuggestionGroups: [],
  loading: false,
}));

beforeEach(() => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  localStorage.setItem('folke:introSeen:v1', '1');
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: jest.fn(),
  });
});

afterEach(() => {
  document.body.classList.remove('tab-navigation');
});

test('sökheaderns kontroller använder tangentbordsstyrd fokusmarkering', async () => {
  const user = userEvent.setup();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <SearchControls loading={false} />
    </MemoryRouter>,
  );
  const searchHeader = within(document.querySelector('#searchcontrols-panel header'));

  const controls = [
    searchHeader.getByRole('link', { name: 'Till Folkes startsida' }),
    searchHeader.getByRole('link', {
      name: 'Öppna Institutet för språk och folkminnens webbplats i nytt fönster',
    }),
    searchHeader.getByRole('button', { name: 'Visa 1 sparat arkivmaterial' }),
    searchHeader.getByRole('link', { name: 'Statistik' }),
    searchHeader.getByRole('button', { name: 'Hjälp och nyheter' }),
  ];

  controls.forEach((control) => expect(control).toHaveClass('header-keyboard-focus'));

  await user.tab();
  expect(document.body).toHaveClass('tab-navigation');
  expect(controls[0]).toHaveFocus();

  fireEvent.pointerDown(document.body);
  expect(document.body).not.toHaveClass('tab-navigation');
});

test('post- och avskriftsheaderns länkar använder samma fokusmarkering', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RoutePageShell>
        <p>Sidinnehåll</p>
      </RoutePageShell>
    </MemoryRouter>,
  );

  [
    screen.getByRole('link', { name: 'Till Folkes startsida' }),
    screen.getByRole('link', {
      name: 'Öppna Institutet för språk och folkminnens webbplats i nytt fönster',
    }),
    screen.getByRole('link', { name: 'Till sökresultaten' }),
  ].forEach((control) => expect(control).toHaveClass('header-keyboard-focus'));
});

test('IntroOverlay-headern markerar kontroller vid tangentbordsnavigering', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <IntroOverlay show onClose={jest.fn()} />
    </MemoryRouter>,
  );

  const isofLink = screen.getByRole('link', {
    name: 'Öppna Institutet för språk och folkminnens webbplats i nytt fönster',
  });
  const continueButton = screen.getByRole('button', { name: 'Gå vidare' });
  expect(isofLink).toHaveClass('header-keyboard-focus');
  expect(continueButton).toHaveClass('header-keyboard-focus');

  await waitFor(() => expect(document.querySelector('.intro')).toHaveFocus());
  fireEvent.keyDown(document, { key: 'Tab' });
  isofLink.focus();
  expect(isofLink).toHaveFocus();
  expect(document.body).toHaveClass('tab-navigation');
});

test('fokusklassen har transparent normalläge och vit tangentbordskant', () => {
  const styles = fs.readFileSync(
    path.resolve(process.cwd(), 'less/style-basic.less'),
    'utf8',
  );

  expect(styles).toMatch(
    /\.header-keyboard-focus\s*{[^}]*border:\s*3px solid transparent !important;/s,
  );
  expect(styles).toMatch(
    /body\.tab-navigation \.header-keyboard-focus:focus\s*{[^}]*border-color:\s*var\(--color-text-inverted\) !important;/s,
  );
});
