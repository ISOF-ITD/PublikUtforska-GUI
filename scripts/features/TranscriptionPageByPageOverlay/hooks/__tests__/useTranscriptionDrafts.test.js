/* global afterEach, beforeEach, expect, jest, test */
import { useState } from 'react';
import { act, renderHook } from '@testing-library/react';
import useTranscriptionDrafts, { DRAFT_MAX_AGE, DRAFT_PREFIX } from '../useTranscriptionDrafts';

const recordId = '04940_180267';
const initialPages = [
  { source: 'page18.jpg', text: '', transcriptionstatus: 'readytotranscribe' },
  { source: 'page19.jpg', text: '', transcriptionstatus: 'readytotranscribe' },
];
const stored = () => Object.keys(localStorage).filter((key) => key.startsWith(DRAFT_PREFIX))
  .map((key) => ({ key, ...JSON.parse(localStorage.getItem(key)) }));
const seed = (id, pages, updatedAt = Date.now(), accession = recordId) => {
  localStorage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify({
    version: 1, recordId: accession, updatedAt, pages,
  }));
};
const useDrafts = () => {
  const [pages, setPages] = useState(initialPages);
  return { ...useTranscriptionDrafts(recordId, pages, setPages), pages, setPages };
};
const edit = (result, text = 'Min text', index = 0) => act(() => result.current.setPages(
  (pages) => pages.map((page, i) => (i === index ? { ...page, text, unsavedChanges: true } : page)),
));

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('debounces all page drafts and stores only page content', () => {
  const { result } = renderHook(useDrafts);
  edit(result);
  act(() => jest.advanceTimersByTime(499));
  expect(stored()).toHaveLength(0);
  edit(result, 'Andra sidan', 1);
  act(() => jest.advanceTimersByTime(500));
  expect(stored()[0]).toMatchObject({
    recordId,
    version: 1,
    pages: [
      { source: 'page18.jpg', text: 'Min text' }, { source: 'page19.jpg', text: 'Andra sidan' },
    ],
  });
  expect(stored()[0].pages[0]).not.toHaveProperty('transcriptionstatus');
  expect(stored()[0]).not.toHaveProperty('transcribesession');
  expect(stored()[0].pages[0]).not.toHaveProperty('emailInput');
});

test('flushes immediately when hidden, on pagehide and on unmount', () => {
  const { result, unmount } = renderHook(useDrafts);
  edit(result);
  jest.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(stored()[0].pages[0].text).toBe('Min text');
  edit(result, 'Ändrad text');
  act(() => window.dispatchEvent(new Event('pagehide')));
  expect(stored()[0].pages[0].text).toBe('Ändrad text');
  edit(result, 'Sista texten');
  unmount();
  expect(stored()[0].pages[0].text).toBe('Sista texten');
});

test('keeps drafts for separate tabs independent', () => {
  const first = renderHook(useDrafts);
  const second = renderHook(useDrafts);
  edit(first.result, 'Flik ett');
  edit(second.result, 'Flik två');
  act(() => jest.advanceTimersByTime(500));
  expect(stored()).toHaveLength(2);
  expect(stored().map((draft) => draft.pages[0].text).sort()).toEqual(['Flik ett', 'Flik två']);
});

test('expires drafts at seven days and offers only matching records and writable files, newest first', () => {
  seed('expired', [{ source: 'page18.jpg', text: 'Gammalt' }], Date.now() - DRAFT_MAX_AGE);
  seed('older', [{ source: 'page19.jpg', text: 'Äldre' }], Date.now() - 1000);
  seed('newer', [{ source: 'page18.jpg', text: 'Nyast' }]);
  seed('other-record', [{ source: 'page18.jpg', text: 'Annan accession' }], Date.now(), 'other');
  seed('other-file', [{ source: 'missing.jpg', text: 'Annan fil' }]);
  localStorage.setItem(`${DRAFT_PREFIX}broken`, '{');
  const { result } = renderHook(useDrafts);
  expect(result.current.candidates.map((draft) => draft.pages[0].text)).toEqual(['Nyast', 'Äldre']);
  expect(localStorage.getItem(`${DRAFT_PREFIX}expired`)).toBeNull();
  expect(localStorage.getItem(`${DRAFT_PREFIX}broken`)).toBeNull();
});

test('offers restoration without doing it automatically and preserves current edits', () => {
  seed('backup', [
    {
      source: 'page18.jpg', text: 'Sparad text', comment: 'Kommentar', fonetic_signs: true,
    },
    { source: 'page19.jpg', text: 'Sparad sida två' },
  ]);
  const { result } = renderHook(useDrafts);
  expect(result.current.pages[0].text).toBe('');
  edit(result, 'Nya egna ändringar', 1);
  act(() => result.current.restore(result.current.candidates[0].key));
  expect(result.current.pages[0]).toMatchObject({
    text: 'Sparad text', comment: 'Kommentar', fonetic_signs: true, unsavedChanges: true,
  });
  expect(result.current.pages[1].text).toBe('Nya egna ändringar');
  expect(result.current.restored).toBe(true);
});

test('removes only the confirmed version, including its restored backup', () => {
  seed('backup', [{ source: 'page18.jpg', text: 'Sparad text' }]);
  const { result } = renderHook(useDrafts);
  act(() => result.current.restore(result.current.candidates[0].key));
  act(() => result.current.flush());
  expect(stored()).toHaveLength(2);
  const snapshot = result.current.pages[0];
  act(() => result.current.saved('page18.jpg', snapshot));
  act(() => result.current.flush());
  expect(stored()).toHaveLength(0);
});

test('retains newer edits when an older send is confirmed', () => {
  const { result } = renderHook(useDrafts);
  edit(result);
  const snapshot = result.current.pages[0];
  act(() => result.current.flush());
  edit(result, 'Nyare ändringar');
  act(() => result.current.flush());
  act(() => result.current.saved('page18.jpg', snapshot));
  act(() => result.current.flush());
  expect(stored()[0].pages[0].text).toBe('Nyare ändringar');
});

test('reports quota errors and recovers without losing the in-memory draft', () => {
  const { result } = renderHook(useDrafts);
  edit(result);
  const failure = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
  act(() => result.current.flush());
  expect(result.current.storageError).toBe(true);
  expect(result.current.pages[0].text).toBe('Min text');
  failure.mockRestore();
  act(() => result.current.flush());
  expect(result.current.storageError).toBe(false);
  expect(stored()[0].pages[0].text).toBe('Min text');
});

test('reports denied storage access on opening without blocking editing', () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
  // Reading an existing entry exercises the denied-storage path.
  seed('backup', [{ source: 'page18.jpg', text: 'Sparad text' }]);
  const { result } = renderHook(useDrafts);
  expect(result.current.storageError).toBe(true);
  edit(result);
  expect(result.current.pages[0].text).toBe('Min text');
});
