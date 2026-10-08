/* global afterEach, beforeEach, expect, jest, test */
import 'whatwg-fetch';
import '../../utils/focusHelper';
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Application from '../Application';
import RoutePageShell from '../RoutePageShell';
import RecordViewHeader from '../../features/RecordView/ui/RecordViewHeader';

jest.mock('../MapWrapper', () => () => null);
jest.mock('../../features/AudioPlayer/GlobalAudioPlayer', () => () => null);
jest.mock('../../hooks/useTranscriptionAvailability', () => () => false);
jest.mock('../../hooks/useBookmarkedRecords', () => () => ({
  isBookmarked: () => false, toggle: jest.fn(),
}));
jest.mock('../../utils/helpers', () => ({ getTitleText: (data) => data.title }));

const data = {
  id: 'record-a',
  title: 'Testaccession',
  recordtype: 'one_accession_row',
  archive: { archive_id: 'A1', archive_id_row: 'A1', archive_org: 'Uppsala' },
};

async function renderPage(content) {
  const router = createMemoryRouter([{
    path: '/',
    loader: () => ({
      results: Promise.resolve([null, { data: [], metadata: {} }]),
      audioResults: Promise.resolve({ data: [], metadata: {} }),
      pictureResults: Promise.resolve({ data: [], metadata: {} }),
    }),
    hydrateFallbackElement: <p>Laddar</p>,
    element: <Application />,
    children: [{
      path: 'records/:id',
      handle: { surface: 'page' },
      element: <RoutePageShell>{content}</RoutePageShell>,
    }],
  }], { initialEntries: ['/records/record-a'] });
  render(<RouterProvider router={router} />);
  await screen.findByRole('main');
  await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalledWith({ top: 0 }));
  return router;
}

beforeEach(() => {
  window.eventBus = { addEventListener: jest.fn(), removeEventListener: jest.fn() };
  Element.prototype.scrollTo = jest.fn();
  Element.prototype.scrollBy = jest.fn();
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  document.body.classList.remove('tab-navigation');
});

test('innehållslänken fokuserar accessionens titel och nästa Tab når Spara', async () => {
  const user = userEvent.setup();
  await renderPage(<RecordViewHeader data={data} />);
  const title = screen.getByRole('heading', { level: 1, name: data.title });
  const skip = screen.getByRole('link', { name: 'Hoppa till innehåll' });
  expect(screen.getByRole('main')).not.toHaveFocus();
  await user.tab();
  expect(skip).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(title).toHaveFocus();
  expect(title).toHaveAttribute('tabindex', '-1');
  expect(title.scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  await user.tab();
  const save = screen.getByRole('button', { name: 'Spara' });
  expect(save).toHaveFocus();
  expect(save).toHaveClass('header-keyboard-focus');
  expect(document.body).toHaveClass('tab-navigation');
});

test('vanlig tabbning hoppar över sidans scrollbehållare', async () => {
  const user = userEvent.setup();
  await renderPage(<RecordViewHeader data={data} />);
  expect(screen.getByRole('main').parentElement).toHaveAttribute('tabindex', '-1');
  await user.tab();
  expect(screen.getByRole('link', { name: 'Hoppa till innehåll' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('link', { name: 'Till Folkes startsida' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('link', { name: 'Öppna Institutet för språk och folkminnens webbplats i nytt fönster' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('link', { name: 'Till sökresultaten' })).toHaveFocus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Spara' })).toHaveFocus();
});

test('pilar skrollar direkt efter öppning och första Tab når fortfarande innehållslänken', async () => {
  const user = userEvent.setup();
  await renderPage(<RecordViewHeader data={data} />);
  await user.keyboard('{ArrowDown}{ArrowUp}');
  expect(Element.prototype.scrollBy).toHaveBeenNthCalledWith(1, { top: 40 });
  expect(Element.prototype.scrollBy).toHaveBeenNthCalledWith(2, { top: -40 });
  expect(Element.prototype.scrollBy.mock.instances[0]).toBe(screen.getByRole('main').parentElement);
  await user.tab();
  expect(screen.getByRole('link', { name: 'Hoppa till innehåll' })).toHaveFocus();
});

test('pilhanteringen lämnar kontroller, dialoger och modifierade tangenter ifred', async () => {
  await renderPage(<input aria-label="Kommentar" />);
  render(<div role="dialog" aria-label="Dialog"><button type="button">Dialogknapp</button></div>);
  const field = screen.getByRole('textbox', { name: 'Kommentar' });
  expect(fireEvent.keyDown(field, { key: 'ArrowDown' })).toBe(true);
  expect(fireEvent.keyDown(screen.getByRole('button', { name: 'Dialogknapp' }), { key: 'ArrowUp' })).toBe(true);
  expect(fireEvent.keyDown(document.body, { key: 'ArrowDown', ctrlKey: true })).toBe(true);
  expect(Element.prototype.scrollBy).not.toHaveBeenCalled();
});

test.each(['Laddar accessionen', 'Det gick inte att ladda posten'])('utan titel och media används main för %s', async (message) => {
  await renderPage(<p>{message}</p>);
  expect(screen.getByRole('link', { name: 'Hoppa till innehåll' }))
    .toHaveAttribute('href', '#route-page-content');
  expect(screen.queryByRole('link', { name: 'Hoppa till materialet' })).not.toBeInTheDocument();
});

test('navigering mellan accessioner och tillbaka fokuserar main', async () => {
  const router = await renderPage(<RecordViewHeader data={data} />);
  const main = screen.getByRole('main');
  expect(main).not.toHaveFocus();
  await act(() => router.navigate('/records/record-b'));
  await waitFor(() => expect(main).toHaveFocus());
  main.blur();
  await act(() => router.navigate(-1));
  await waitFor(() => expect(main).toHaveFocus());
});
