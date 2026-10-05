import {
  useState, useRef, useCallback, useEffect,
} from 'react';
import config from '../../../config';

const fd = (data) => {
  const form = new FormData();
  form.append('json', JSON.stringify(data));
  return form;
};

/** All network traffic for transcribing lives here. */
export default function useTranscriptionApi() {
  const [session, setSession] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const abort = useRef(null);
  const sessionRef = useRef(null);
  const startingRef = useRef(null);
  const cancellingRef = useRef(Promise.resolve());
  const generation = useRef(0);
  const sendingRef = useRef(false);

  const request = useCallback(async (operation, payload, signal, current = () => true) => {
    setError(null);
    const context = {
      operation,
      recordId: payload.recordid,
      page: payload.page,
      pageNumber: payload.pagenumber,
      timestamp: new Date().toISOString(),
      hasSession: !!payload.transcribesession,
    };

    if (operation === 'save' && !payload.transcribesession) {
      setError({ ...context, code: 'SESSION_MISSING' });
      return null;
    }

    try {
      const response = await fetch(
        `${config.restApiUrl}${operation === 'start' ? 'transcribestart' : 'transcribe'}/`,
        { method: 'POST', body: fd(payload), signal },
      );
      if (!current()) return null;
      let json;
      try {
        json = await response.json();
      } catch {
        if (signal?.aborted || !current()) return null;
        setError({
          ...context,
          code: response.ok ? 'INVALID_RESPONSE' : 'HTTP_ERROR',
          httpStatus: response.status,
        });
        return null;
      }
      if (!current()) return null;

      const serverMessage = typeof json?.message === 'string' ? json.message : '';
      if (!response.ok) {
        setError({
          ...context, code: 'HTTP_ERROR', httpStatus: response.status, serverMessage,
        });
        return null;
      }
      if (json?.success !== 'true' && json?.success !== true) {
        setError({
          ...context,
          code: json?.success === 'false' || json?.success === false ? 'API_REJECTED' : 'INVALID_RESPONSE',
          httpStatus: response.status,
          serverMessage,
        });
        return null;
      }
      if (operation === 'start' && (
        typeof json.data?.transcribesession !== 'string' || !json.data.transcribesession
      )) {
        setError({ ...context, code: 'INVALID_RESPONSE', httpStatus: response.status });
        return null;
      }
      return json;
    } catch (err) {
      if (current() && (err.name !== 'AbortError' || operation === 'save')) {
        setError({ ...context, code: navigator.onLine === false ? 'OFFLINE' : 'NETWORK_ERROR' });
      }
      return null;
    }
  }, []);

  /* ───── start ───── */
  const start = useCallback((recordId) => {
    if (!recordId) return Promise.resolve(false);
    if (startingRef.current?.recordId === recordId) return startingRef.current.promise;
    if (sessionRef.current?.recordId === recordId) return Promise.resolve(true);
    // A cancelled start must finish so its returned token can be released first.
    if (startingRef.current) abort.current?.abort();
    const previousCancellation = cancellingRef.current;
    const controller = new AbortController();
    abort.current = controller;
    const pending = {
      recordId, waiting: true, promise: null, controller,
    };
    pending.promise = (async () => {
      await previousCancellation;
      pending.waiting = false;
      if (controller.signal.aborted) return false;
      generation.current += 1;
      const version = generation.current;
      const json = await request(
        'start',
        { recordid: recordId },
        controller.signal,
        () => version === generation.current && !controller.signal.aborted,
      );
      if (!json || version !== generation.current) return false;
      const token = json.data.transcribesession;
      sessionRef.current = { recordId, token };
      setSession(token);
      return true;
    })().finally(() => {
      if (startingRef.current === pending) startingRef.current = null;
    });
    startingRef.current = pending;
    return pending.promise;
  }, [request]);

  /* ───── cancel ──── */
  const cancel = useCallback(
    (recordId) => {
      const activeSession = sessionRef.current?.recordId === recordId ? sessionRef.current : null;
      const pendingStart = startingRef.current;
      const waitForStart = pendingStart?.recordId === recordId && !pendingStart.waiting
        ? pendingStart.promise : null;
      if (waitForStart) startingRef.current = null;
      if (pendingStart?.recordId === recordId && pendingStart.waiting) {
        pendingStart.controller.abort();
        startingRef.current = null;
      }
      if (activeSession) {
        sessionRef.current = null;
        setSession(null);
      }
      const previousCancellation = cancellingRef.current;
      const pending = (async () => {
        await previousCancellation;
        await waitForStart;
        const target = activeSession
          || (sessionRef.current?.recordId === recordId ? sessionRef.current : null);
        if (!target) return;
        if (sessionRef.current === target) {
          sessionRef.current = null;
          setSession(null);
        }
        try {
          await fetch(`${config.restApiUrl}transcribecancel/`, {
            method: 'POST',
            body: fd({ recordid: recordId, transcribesession: target.token }),
            keepalive: true,
          });
        } catch {
          // The server may retain its lock; the next start reports that failure.
        }
      })();
      cancellingRef.current = pending;
      return pending;
    },
    [],
  );

  const waitForCancellation = useCallback(() => cancellingRef.current, []);

  /* ───── send ───── */
  const send = useCallback(
    async (payload /* plain object – we wrap it in FormData */) => {
      if (sendingRef.current) return false;
      sendingRef.current = true;
      setSending(true);
      try {
        const token = sessionRef.current?.recordId === payload.recordid
          ? sessionRef.current.token : null;
        const version = generation.current;
        const json = await request(
          'save',
          { ...payload, transcribesession: token },
          undefined,
          () => version === generation.current,
        );
        return !!json;
      } finally {
        setSending(false);
        sendingRef.current = false;
      }
    },
    [request],
  );

  /* abort unfinished request on unmount */
  useEffect(() => () => abort.current?.abort(), []);

  return {
    session, sending, error, start, cancel, send, waitForCancellation,
  };
}
