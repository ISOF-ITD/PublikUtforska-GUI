/* global afterEach, beforeEach, describe, expect, jest, test */
import { act, renderHook } from '@testing-library/react';
import useTranscriptionApi from '../useTranscriptionApi';

jest.mock('../../../../config', () => ({ restApiUrl: '/api/' }));

const SESSION = '2026-10-01 13:00:00.000';
const payload = {
  recordid: '04940_180267',
  page: 'uppteckningar/dal_04940_0018.jpg',
  pagenumber: '18',
  message: 'Avskriven text',
  from_name: 'Testperson',
  from_email: 'test@example.com',
};
const response = (json, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => json,
});

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue(response({
    success: 'true', data: { transcribesession: SESSION },
  }));
});

afterEach(() => jest.restoreAllMocks());

async function startSession(result) {
  await act(async () => expect(await result.current.start(payload.recordid)).toBe(true));
}

describe('save failures', () => {
  test.each([
    ['API_REJECTED', response({ success: 'false', message: 'Felaktigt sessions-id' }), 200],
    ['HTTP_ERROR', response({ message: 'Tjänsten är tillfälligt otillgänglig' }, 503), 503],
    ['HTTP_ERROR', { ok: false, status: 502, json: async () => { throw new SyntaxError(); } }, 502],
    ['INVALID_RESPONSE', { ok: true, status: 200, json: async () => { throw new SyntaxError(); } }, 200],
    ['INVALID_RESPONSE', response(null), 200],
    ['INVALID_RESPONSE', response({ unexpected: true }), 200],
  ])('reports %s with useful context', async (code, apiResponse, httpStatus) => {
    const { result } = renderHook(useTranscriptionApi);
    await startSession(result);
    global.fetch.mockResolvedValueOnce(apiResponse);
    await act(async () => expect(await result.current.send(payload)).toBe(false));
    expect(result.current.error).toMatchObject({
      code,
      operation: 'save',
      recordId: payload.recordid,
      page: payload.page,
      pageNumber: '18',
      hasSession: true,
      httpStatus,
    });
    expect(result.current.error.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.current.error).not.toHaveProperty('message');
    expect(result.current.error).not.toHaveProperty('from_email');
    expect(result.current.error).not.toHaveProperty('transcribesession');
    expect(result.current.sending).toBe(false);
    if (code === 'API_REJECTED') {
      expect(result.current.error.serverMessage).toBe('Felaktigt sessions-id');
    }
  });

  test.each([true, false])('distinguishes connectivity errors when online=%s', async (online) => {
    jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    const { result } = renderHook(useTranscriptionApi);
    await startSession(result);
    global.fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await act(async () => expect(await result.current.send(payload)).toBe(false));
    expect(result.current.error.code).toBe(online ? 'NETWORK_ERROR' : 'OFFLINE');
    expect(result.current.sending).toBe(false);
  });

  test('blocks saving without a session and explains why', async () => {
    const { result } = renderHook(useTranscriptionApi);
    await act(async () => expect(await result.current.send(payload)).toBe(false));
    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.current.error).toMatchObject({ code: 'SESSION_MISSING', hasSession: false });
  });

  test('reports an interrupted save even if the browser returns AbortError', async () => {
    const { result } = renderHook(useTranscriptionApi);
    await startSession(result);
    global.fetch.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    await act(async () => expect(await result.current.send(payload)).toBe(false));
    expect(result.current.error.code).toBe('NETWORK_ERROR');
    expect(result.current.sending).toBe(false);
  });

  test.each(['true', true])('clears the error after a successful retry (%s)', async (success) => {
    const { result } = renderHook(useTranscriptionApi);
    await startSession(result);
    global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Fel' }));
    await act(async () => result.current.send(payload));
    expect(result.current.error).not.toBeNull();
    global.fetch.mockResolvedValueOnce(response({ success }));
    await act(async () => expect(await result.current.send(payload)).toBe(true));
    expect(result.current.error).toBeNull();
    expect(result.current.sending).toBe(false);
  });
});

test('reports start rejection and clears it when retrying succeeds', async () => {
  global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Posten är låst' }));
  const { result } = renderHook(useTranscriptionApi);
  await act(async () => expect(await result.current.start(payload.recordid)).toBe(false));
  expect(result.current.error).toMatchObject({ operation: 'start', serverMessage: 'Posten är låst' });
  await startSession(result);
  expect(result.current.error).toBeNull();
});

test('rejects a successful start response that has no session token', async () => {
  global.fetch.mockResolvedValueOnce(response({ success: true, data: {} }));
  const { result } = renderHook(useTranscriptionApi);
  await act(async () => expect(await result.current.start(payload.recordid)).toBe(false));
  expect(result.current.error.code).toBe('INVALID_RESPONSE');
  expect(result.current.session).toBeNull();
});

test('does not display an error when a start request is deliberately aborted', async () => {
  global.fetch.mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
  const { result } = renderHook(useTranscriptionApi);
  await act(async () => expect(await result.current.start(payload.recordid)).toBe(false));
  expect(result.current.error).toBeNull();
});

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

test('deduplicates concurrent starts and sends, including before React rerenders', async () => {
  const pending = deferred();
  global.fetch.mockReturnValueOnce(pending.promise);
  const { result } = renderHook(useTranscriptionApi);
  let first;
  let second;
  act(() => {
    first = result.current.start(payload.recordid);
    second = result.current.start(payload.recordid);
  });
  expect(first).toBe(second);
  await act(async () => pending.resolve(response({
    success: true, data: { transcribesession: SESSION },
  })));
  expect(global.fetch).toHaveBeenCalledTimes(1);
  const saving = deferred();
  global.fetch.mockReturnValueOnce(saving.promise);
  let sent;
  await act(async () => {
    sent = result.current.send(payload);
    expect(await result.current.send(payload)).toBe(false);
  });
  await act(async () => saving.resolve(response({ success: true })));
  expect(await sent).toBe(true);
  expect(global.fetch).toHaveBeenCalledTimes(2);
});

test('waits for cancellation before restarting and preserves the new token', async () => {
  const { result } = renderHook(useTranscriptionApi);
  await startSession(result);
  const cancellation = deferred();
  global.fetch.mockReturnValueOnce(cancellation.promise);
  let cancelling;
  let starting;
  await act(async () => { cancelling = result.current.cancel(payload.recordid); });
  expect(result.current.session).toBeNull();
  act(() => { starting = result.current.start(payload.recordid); });
  expect(global.fetch).toHaveBeenCalledTimes(2);
  global.fetch.mockResolvedValueOnce(response({ success: true, data: { transcribesession: 'new-token' } }));
  await act(async () => {
    cancellation.resolve(response({ success: true }));
    await cancelling;
    expect(await starting).toBe(true);
  });
  expect(result.current.session).toBe('new-token');
  expect(global.fetch).toHaveBeenCalledTimes(3);
});

test('cancels a session that was still starting before allowing a new start', async () => {
  const opening = deferred();
  global.fetch.mockReturnValueOnce(opening.promise);
  const { result } = renderHook(useTranscriptionApi);
  let initial;
  await act(async () => { initial = result.current.start(payload.recordid); });
  let cancelled;
  let restarted;
  act(() => {
    cancelled = result.current.cancel(payload.recordid);
    restarted = result.current.start(payload.recordid);
  });
  global.fetch.mockResolvedValueOnce(response({ success: true }));
  global.fetch.mockResolvedValueOnce(response({ success: true, data: { transcribesession: 'new-token' } }));
  await act(async () => {
    opening.resolve(response({ success: true, data: { transcribesession: SESSION } }));
    await initial;
    await cancelled;
    await restarted;
  });
  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
    '/api/transcribestart/', '/api/transcribecancel/', '/api/transcribestart/',
  ]);
  expect(result.current.session).toBe('new-token');
});

test('does not adopt a late token or error from another record', async () => {
  const old = deferred();
  global.fetch.mockReturnValueOnce(old.promise);
  const { result } = renderHook(useTranscriptionApi);
  let initial;
  await act(async () => { initial = result.current.start(payload.recordid); });
  await act(async () => expect(await result.current.start('other-record')).toBe(true));
  await act(async () => {
    old.resolve(response({ success: false, message: 'Old rejection' }));
    expect(await initial).toBe(false);
  });
  expect(result.current.session).toBe(SESSION);
  expect(result.current.error).toBeNull();
});

test('reports a failed reconnect after cancellation failed instead of assuming a session', async () => {
  const { result } = renderHook(useTranscriptionApi);
  await startSession(result);
  global.fetch.mockRejectedValueOnce(new TypeError('offline'));
  await act(async () => result.current.cancel(payload.recordid));
  global.fetch.mockResolvedValueOnce(response({ success: false, message: 'Posten är låst' }));
  await act(async () => expect(await result.current.start(payload.recordid)).toBe(false));
  expect(result.current.session).toBeNull();
  expect(result.current.error.serverMessage).toBe('Posten är låst');
});

test('cancels a queued start before it can acquire a server lock', async () => {
  const { result } = renderHook(useTranscriptionApi);
  let starting;
  let cancelling;
  act(() => {
    starting = result.current.start(payload.recordid);
    cancelling = result.current.cancel(payload.recordid);
  });
  await act(async () => {
    expect(await starting).toBe(false);
    await cancelling;
  });
  expect(global.fetch).not.toHaveBeenCalled();
  await startSession(result);
});

test('ignores a late save failure after another record has started', async () => {
  const { result } = renderHook(useTranscriptionApi);
  await startSession(result);
  const saving = deferred();
  global.fetch.mockReturnValueOnce(saving.promise);
  let sent;
  act(() => { sent = result.current.send(payload); });
  await act(async () => result.current.start('other-record'));
  await act(async () => {
    saving.resolve(response({ success: false, message: 'Old save rejection' }));
    expect(await sent).toBe(false);
  });
  expect(result.current.error).toBeNull();
});
