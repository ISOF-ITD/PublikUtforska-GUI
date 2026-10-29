/* global beforeEach, expect, jest, test */
import { act, renderHook } from '@testing-library/react';
import RecordsApiClient from '../../api/RecordsApiClient';
import { SORT_OPTIONS } from '../../ui/recordListMenuOptions';
import useRecords from '../useRecords';

jest.mock('../../../../config', () => ({ hitsPerPage: 10, maxTotal: 100 }));
jest.mock('../../api/RecordsApiClient');

const fetchRecords = jest.fn();

beforeEach(() => {
  RecordsApiClient.mockImplementation(() => ({
    abort: jest.fn(),
    fetch: fetchRecords,
  }));
});

test.each([
  {},
  { search: '   ' },
  { person: 'Anna' },
  { search: 'Anna', search_field: 'person' },
  { search: 'Uppsala', search_field: 'place' },
  { search: 'ACC 1', search_field: 'archive_id' },
])('visar senast avskrivna först utan fritextsökning: %j', (params) => {
  const { result } = renderHook(() => useRecords(params));

  expect(result.current.sort).toBe('latest_transcription');
  expect(result.current.order).toBe('desc');
  expect(result.current.relevanceSortingAvailable).toBe(false);
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({
    sort: 'latest_transcription', order: 'desc', from: 0,
  }));
});

test('behåller relevans som standard vid fritextsökning', () => {
  const { result } = renderHook(() => useRecords({ search: 'berättelse' }));

  expect(result.current.relevanceSortingAvailable).toBe(true);
  expect(result.current.sort).toBe('_score');
  expect(result.current.order).toBe('desc');
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({
    search: 'berättelse', sort: '_score', order: 'desc',
  }));
});

test('needsimprovement ingår i vanlig sökning men utesluts när Kan skrivas av är valt', () => {
  const { rerender } = renderHook((params) => useRecords(params), {
    initialProps: { search: 'nattväktare' },
  });
  const requestedStatuses = () => fetchRecords.mock.lastCall[0].transcriptionstatus.split(',');

  expect(requestedStatuses()).toContain('needsimprovement');

  rerender({ search: 'nattväktare', transcribe: true });
  expect(requestedStatuses()).not.toContain('needsimprovement');
  expect(requestedStatuses()).toContain('readytotranscribe');

  rerender({ search: 'nattväktare', transcribe: false });
  expect(requestedStatuses()).toContain('needsimprovement');
});

test('återställer standard och första sidan när sökningen ändras eller rensas', () => {
  const { result, rerender } = renderHook((params) => useRecords(params), {
    initialProps: {},
  });
  act(() => {
    result.current.setSorting({ field: 'year', order: 'asc' });
  });
  act(() => result.current.setCurrentPage(3));

  rerender({ search: 'berättelse' });
  expect(result.current.sort).toBe('_score');
  expect(result.current.currentPage).toBe(1);

  act(() => result.current.setSorting({ field: 'year', order: 'asc' }));
  act(() => result.current.setCurrentPage(2));

  rerender({});
  expect(result.current.sort).toBe('latest_transcription');
  expect(result.current.order).toBe('desc');
  expect(result.current.currentPage).toBe(1);
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({
    sort: 'latest_transcription', order: 'desc', from: 0,
  }));
});

test('manuellt val av Senast avskrivna hämtar första sidan med rätt sortering', () => {
  const { result } = renderHook(() => useRecords({ search: 'berättelse' }));
  act(() => result.current.setCurrentPage(3));
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({ from: 20 }));

  act(() => result.current.setSorting(
    SORT_OPTIONS.find((option) => option.label === 'Senast avskrivna'),
  ));

  expect(result.current.currentPage).toBe(1);
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({
    sort: 'latest_transcription', order: 'desc', from: 0,
  }));
});

test('Matkult behåller recepturvalet och tömmer tidigare träffar när API:t inte kan avgränsa det', () => {
  let complete;
  let fail;
  RecordsApiClient.mockImplementation((onComplete, onError) => {
    complete = onComplete;
    fail = onError;
    return { abort: jest.fn(), fetch: fetchRecords };
  });
  const { result, rerender } = renderHook((params) => useRecords(params), {
    initialProps: { theme: 'matkult', category: 'MK-10' },
  });
  expect(result.current.sort).toBe('year');
  act(() => complete({ data: [{ id: 'recipe' }], metadata: { total: { value: 1112 } } }));
  expect(result.current.records).toHaveLength(1);
  rerender({ theme: 'matkult', category: 'MK-10,MK-12' });
  expect(fetchRecords).toHaveBeenLastCalledWith(expect.objectContaining({
    theme: 'matkult',
    category: 'MK-10,MK-12',
    recordtype: undefined,
    transcriptionstatus: undefined,
  }));
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
  act(() => fail(new Error('Välj Alla recept')));
  expect(result.current.records).toEqual([]);
  expect(result.current.total).toBe(0);
  expect(result.current.error).toBe('Välj Alla recept');
  consoleError.mockRestore();
});
