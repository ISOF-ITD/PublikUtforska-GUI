/* global afterEach, beforeEach, expect, jest, test */
import {
  act, fireEvent, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranscriptionPage from '../TranscriptionPageByPageOverlay';
import { toastOk } from '../../../utils/toast';
import { DRAFT_PREFIX } from '../hooks/useTranscriptionDrafts';

const mockRecord = {
  id: '04940_180267',
  media: [
    ...Array.from({ length: 17 }, (_, index) => ({ source: `page${index + 1}.jpg`, transcriptionstatus: 'transcribed' })),
    { source: 'page18.jpg', transcriptionstatus: 'readytotranscribe', pagenumber: '18' },
    { source: 'page19.jpg', transcriptionstatus: 'readytotranscribe', pagenumber: '19' },
  ],
};
let mockData = mockRecord;

jest.mock('../../../config', () => ({ restApiUrl: '/api/', siteUrl: '', siteOptions: {} }));
jest.mock('../../../lang/Lang', () => ({ l: (text) => text }));
jest.mock('../../../utils/helpers', () => ({ getPlaceString: () => '', getTitleText: () => 'Test' }));
jest.mock('../../../utils/toast', () => ({ toastError: jest.fn(), toastOk: jest.fn() }));
jest.mock('react-router-dom', () => ({
  useBlocker: () => ({ state: 'unblocked' }),
  useLocation: () => ({ pathname: '/records/test/transcribe', search: '?media=page18.jpg' }),
  useNavigate: () => jest.fn(),
  useOutletContext: () => ({ data: mockData }),
}));
jest.mock('../ui/ImageMap', () => () => null);
jest.mock('../ui/TranscriptionThumbnails', () => () => null);
jest.mock('../ui/OverlayHeader', () => () => null);
jest.mock('../ui/TranscribeButton', () => () => null);
jest.mock('../ui/TranscriptionHelpButton', () => () => null);
jest.mock('../ui/TranscriptionInstructions', () => () => null);
jest.mock('../ui/DiscardChangesDialog', () => () => null);
jest.mock('../../../components/views/ContributeInfoSection', () => () => null);

const response = (json) => ({ ok: true, status: 200, json: async () => json });
const startResponse = () => response({
  success: 'true', data: { transcribesession: '2026-10-01 13:00:00.000' },
});

beforeEach(() => {
  mockData = mockRecord;
  window.sessionStorage.clear();
  window.localStorage.clear();
  jest.clearAllMocks();
  global.fetch = jest.fn(async (url) => (url.endsWith('transcribestart/')
    ? startResponse()
    : response({ success: 'false', message: 'Felaktigt sessions-id' })));
});

afterEach(() => jest.restoreAllMocks());

async function fillPage() {
  render(<TranscriptionPage />);
  await waitFor(() => expect(screen.queryByText('Startar transkriberingssession…')).not.toBeInTheDocument());
  const text = screen.getByRole('textbox', { name: 'Text på sidan 18 (av 19)' });
  fireEvent.change(text, { target: { value: 'Min avskrivna text' } });
  return text;
}

test('announces a persistent save error, preserves the draft and allows keyboard copying', async () => {
  const user = userEvent.setup();
  const text = await fillPage();
  const button = screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' });
  button.focus();
  await user.keyboard('{Enter}');
  await screen.findByText('Det gick inte att bekräfta att avskriften sparades.');
  const alert = screen.getAllByRole('alert').find((element) => element.textContent);
  expect(alert).toHaveAttribute('aria-atomic', 'true');
  expect(alert).toHaveTextContent('Servern godkände inte begäran');
  expect(alert).toHaveTextContent('Din text finns kvar på sidan');
  expect(button).toHaveAttribute('aria-describedby', alert.id);
  expect(button).toHaveFocus();
  expect(button).toBeEnabled();
  expect(text).toHaveValue('Min avskrivna text');
  expect(toastOk).not.toHaveBeenCalled();
  expect(screen.queryByRole('textbox', { name: 'Text på sidan 19 (av 19)' })).not.toBeInTheDocument();

  const summary = screen.getByText('Feluppgifter för support');
  await user.tab();
  expect(summary).toHaveFocus();
  // JSDOM does not implement native keyboard activation of summary elements.
  await user.click(summary);
  expect(summary.parentElement).toHaveAttribute('open');
  const selectButton = screen.getByRole('button', { name: 'Markera feluppgifter för kopiering' });
  selectButton.focus();
  await user.keyboard('{Enter}');
  const report = screen.getByRole('textbox', { name: 'Feluppgifter att kopiera' });
  expect(report).toHaveFocus();
  expect(report).toHaveAttribute('readonly');
  expect(report.selectionStart).toBe(0);
  expect(report.selectionEnd).toBe(report.value.length);
  expect(report.value).toContain('04940_180267');
  expect(report.value).toContain('Sidnummer: 18');
  expect(report.value).toContain('Bildfil: page18.jpg');
  expect(report.value).toContain('Felkod: API_REJECTED');
  expect(report.value).toContain('HTTP: 200');
  expect(report.value).toContain('Serverns meddelande: Felaktigt sessions-id');
  expect(report.value).not.toContain('Min avskrivna text');
  expect(report.value).not.toContain('2026-10-01 13:00:00.000');

  global.fetch.mockResolvedValueOnce(response({ success: true }));
  await user.click(button);
  await waitFor(() => expect(toastOk).toHaveBeenCalled());
  expect(screen.queryByText('Det gick inte att bekräfta att avskriften sparades.')).not.toBeInTheDocument();
  expect(screen.getByRole('textbox', { name: 'Text på sidan 19 (av 19)' })).toBeInTheDocument();
});

test('keeps the session and draft after a cached return without starting or cancelling again', async () => {
  const text = await fillPage();
  await act(async () => {
    window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
  });
  await act(async () => window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  global.fetch.mockResolvedValueOnce(response({ success: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' }));
  await waitFor(() => expect(toastOk).toHaveBeenCalled());
  const [, options] = global.fetch.mock.calls.find(([url]) => url === '/api/transcribe/');
  expect(JSON.parse(options.body.get('json')).transcribesession).toBe('2026-10-01 13:00:00.000');
  expect(text).toHaveValue('Min avskrivna text');
});

test('shows start rejection with diagnostics and an accessible retry button', async () => {
  global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Posten är låst' }));
  render(<TranscriptionPage />);
  await screen.findByText('Det gick inte att starta avskrivningssessionen.');
  const retry = screen.getByRole('button', { name: 'Försök återansluta' });
  expect(retry).toHaveAccessibleDescription(/Servern godkände inte begäran/);
  const report = screen.getByRole('textbox', { name: 'Feluppgifter att kopiera', hidden: true });
  expect(report.value).toContain('Serverns meddelande: Posten är låst');
  fireEvent.click(retry);
  await waitFor(() => expect(screen.queryByText('Det gick inte att starta avskrivningssessionen.')).not.toBeInTheDocument());
  expect(screen.queryByRole('button', { name: 'Försök återansluta' })).not.toBeInTheDocument();
});

test('renders server messages as plain text in the support report', async () => {
  await fillPage();
  global.fetch.mockResolvedValueOnce(response({ success: false, message: '<img src=x onerror=alert(1)>' }));
  fireEvent.click(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' }));
  await screen.findByText('Det gick inte att bekräfta att avskriften sparades.');
  const report = screen.getByRole('textbox', { name: 'Feluppgifter att kopiera', hidden: true });
  expect(report.value).toContain('<img src=x onerror=alert(1)>');
  expect(report.closest('details').querySelector('img')).toBeNull();
});

test('waits for pagehide cancellation and reconnects only once on repeated pageshow', async () => {
  const text = await fillPage();
  let finishCancellation;
  global.fetch.mockReturnValueOnce(new Promise((resolve) => { finishCancellation = resolve; }));
  await act(async () => window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: false })));
  const sendButton = screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' });
  expect(sendButton).toBeDisabled();
  expect(sendButton).toHaveAccessibleDescription(/Sessionen saknas/);
  expect(text).toBeEnabled();
  fireEvent.change(text, { target: { value: 'Ändrad under återanslutning' } });
  await act(async () => {
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
    window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }));
  });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  await act(async () => finishCancellation(response({ success: true })));
  await waitFor(() => expect(sendButton).toBeEnabled());
  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
    '/api/transcribestart/', '/api/transcribecancel/', '/api/transcribestart/',
  ]);
  expect(text).toHaveValue('Ändrad under återanslutning');
});

test('allows editing during failed reconnect and retries via keyboard without losing the draft', async () => {
  const user = userEvent.setup();
  const text = await fillPage();
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Posten är låst' }));
  await act(async () => window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })));
  const retry = await screen.findByRole('button', { name: 'Försök återansluta' });
  expect(text).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' })).toBeDisabled();
  retry.focus();
  await user.keyboard('{Enter}');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' })).toBeEnabled());
  expect(text).toHaveValue('Min avskrivna text');
});

test('preserves local drafts on save failure and never automatically resends', async () => {
  await fillPage();
  global.fetch.mockRejectedValueOnce(new TypeError('network'));
  fireEvent.click(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' }));
  await screen.findByText('Det gick inte att bekräfta att avskriften sparades.');
  const keys = Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX));
  expect(keys).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(keys[0])).pages[0].text).toBe('Min avskrivna text');
  await act(async () => window.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })));
  expect(global.fetch.mock.calls.filter(([url]) => url === '/api/transcribe/')).toHaveLength(1);
});

test('does not clear newer text or advance when an earlier version is confirmed', async () => {
  const text = await fillPage();
  let finishSave;
  global.fetch.mockReturnValueOnce(new Promise((resolve) => { finishSave = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' }));
  fireEvent.change(text, { target: { value: 'Nyare text som måste behållas' } });
  await act(async () => finishSave(response({ success: true })));
  expect(text).toHaveValue('Nyare text som måste behållas');
  expect(text).toBeEnabled();
  expect(screen.getAllByRole('status').some((element) => element.textContent.includes('Dina senare ändringar'))).toBe(true);
  expect(screen.queryByRole('textbox', { name: 'Text på sidan 19 (av 19)' })).not.toBeInTheDocument();
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  const key = Object.keys(localStorage).find((entry) => entry.startsWith(DRAFT_PREFIX));
  expect(JSON.parse(localStorage.getItem(key)).pages[0].text).toBe('Nyare text som måste behållas');
});

test('flushes on page changes and applies a pending save only to its original page', async () => {
  await fillPage();
  let finishSave;
  global.fetch.mockReturnValueOnce(new Promise((resolve) => { finishSave = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Nästa sida', exact: true }));
  const nextText = screen.getByRole('textbox', { name: 'Text på sidan 19 (av 19)' });
  fireEvent.change(nextText, { target: { value: 'Andra sidans text' } });
  await act(async () => finishSave(response({ success: true })));
  expect(nextText).toHaveValue('Andra sidans text');
  expect(nextText).toBeEnabled();
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  const key = Object.keys(localStorage).find((entry) => entry.startsWith(DRAFT_PREFIX));
  expect(JSON.parse(localStorage.getItem(key)).pages).toMatchObject([
    { source: 'page19.jpg', text: 'Andra sidans text' },
  ]);
});

test('does not reset the form or session when the same record data is refreshed', async () => {
  const view = render(<TranscriptionPage />);
  await waitFor(() => expect(screen.queryByText('Startar transkriberingssession…')).not.toBeInTheDocument());
  const text = screen.getByRole('textbox', { name: 'Text på sidan 18 (av 19)' });
  fireEvent.change(text, { target: { value: 'Text under uppdatering' } });
  mockData = { ...mockRecord, media: [...mockRecord.media] };
  view.rerender(<TranscriptionPage />);
  expect(text).toHaveValue('Text under uppdatering');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('offers a labelled draft choice and restores by keyboard without requiring a working session', async () => {
  const user = userEvent.setup();
  localStorage.setItem(`${DRAFT_PREFIX}backup`, JSON.stringify({
    version: 1,
    recordId: mockRecord.id,
    updatedAt: Date.now(),
    pages: [{ source: 'page18.jpg', text: 'Återställd avskrift', comment: 'Min kommentar' }],
  }));
  global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Posten är låst' }));
  render(<TranscriptionPage />);
  const select = await screen.findByRole('combobox', { name: 'Välj utkast' });
  select.focus();
  await user.tab();
  expect(screen.getByRole('button', { name: 'Återställ utkast' })).toHaveFocus();
  await user.keyboard('{Enter}');
  expect(screen.getByRole('textbox', { name: 'Text på sidan 18 (av 19)' })).toHaveValue('Återställd avskrift');
  expect(screen.getByRole('textbox', { name: 'Text på sidan 18 (av 19)' })).toHaveFocus();
  expect(screen.getAllByRole('status').some((element) => element.textContent.includes('Utkastet har återställts'))).toBe(true);
  expect(screen.getByRole('textbox', { name: 'Text på sidan 18 (av 19)' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Skicka sida 18 (av 19)' })).toBeDisabled();
});

test('announces a storage failure without moving focus or preventing editing', async () => {
  const text = await fillPage();
  text.focus();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  await act(async () => window.dispatchEvent(new Event('pagehide')));
  const message = screen.getAllByRole('alert').find((element) => element.textContent.includes('Utkastet kunde inte sparas'));
  expect(message).toHaveAttribute('aria-atomic', 'true');
  expect(text).toHaveFocus();
  expect(text).toBeEnabled();
  expect(text).toHaveValue('Min avskrivna text');
});
