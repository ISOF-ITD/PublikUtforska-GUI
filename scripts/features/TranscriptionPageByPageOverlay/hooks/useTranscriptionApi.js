import { useState, useRef, useCallback, useEffect } from "react";
import config from "../../../config";

/** All network traffic for transcribing lives here. */
export default function useTranscriptionApi() {
  const [session, setSession] = useState(null);
  const [sending, setSending] = useState(false);
  const abort = useRef(null);

  /* small helper */
  const fd = (data) => {
    const f = new FormData();
    f.append("json", JSON.stringify(data));
    return f;
  };

  /* ───── start ───── */
  const start = useCallback(async (recordId) => {
    if (!recordId) return false;
    abort.current?.abort(); // cancel earlier request
    abort.current = new AbortController();
    try {
      const res = await fetch(`${config.restApiUrl}transcribestart/`, {
        method: "POST",
        body: fd({ recordid: recordId }),
        signal: abort.current.signal,
      });
      const json = await res.json();
      if (json.success === "true" || json.success === true) {
        setSession(json.data?.transcribesession || null);
        return true;
      }
      console.error(json.message || "transcribestart failed");
      return false;
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
      return false;
    }
  }, []);

  /* ───── cancel ──── */
  const cancel = useCallback(
    async (recordId) => {
      if (!recordId || !session) return;
      try {
        await fetch(`${config.restApiUrl}transcribecancel/`, {
          method: "POST",
          body: fd({ recordid: recordId, transcribesession: session }),
        });
      } catch (err) {
        console.error("transcribecancel error:", err);
      }
      setSession(null);
    },
    [session]
  );

  /* ───── send ───── */
  const send = useCallback(
    async (payload /* plain object – we wrap it in FormData */) => {
      if (sending) return false; // double-click guard
      setSending(true);
      const ok = await fetch(`${config.restApiUrl}transcribe/`, {
        method: "POST",
        body: fd({ transcribesession: session, ...payload }),
      })
        .then((r) => r.json())
        .then((j) => j.success === "true" || j.success === true)
        .catch((err) => {
          console.error("transcribe error:", err);
          return false;
        })
        .finally(() => setSending(false));
      return ok;
    },
    [session, sending]
  );

  /* abort unfinished request on unmount */
  useEffect(() => () => abort.current?.abort(), []);

  return { session, sending, start, cancel, send };
}
