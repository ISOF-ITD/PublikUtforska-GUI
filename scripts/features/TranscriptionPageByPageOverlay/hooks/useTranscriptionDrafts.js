import {
  useCallback, useEffect, useRef, useState,
} from 'react';

export const DRAFT_PREFIX = 'transcriptionDraft:v1:';
export const DRAFT_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const STRING_FIELDS = [
  'text', 'comment', 'pagenumber', 'informantName', 'informantBirthDate',
  'informantBirthPlace', 'informantInformation', 'titleDraft',
];
const BOOLEAN_FIELDS = ['fonetic_signs', 'unreadable'];

// Persist only editable page content, never session tokens or server statuses.
export const draftContent = (page) => Object.fromEntries([
  ...STRING_FIELDS.map((field) => [field, typeof page[field] === 'string' ? page[field] : '']),
  ...BOOLEAN_FIELDS.map((field) => [field, page[field] === true]),
]);

export const sameDraft = (a, b) => (
  JSON.stringify(draftContent(a)) === JSON.stringify(draftContent(b))
);

function readDrafts(recordId) {
  const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    .filter((key) => key?.startsWith(DRAFT_PREFIX));
  const drafts = [];
  keys.forEach((key) => {
    let draft;
    const raw = localStorage.getItem(key);
    try {
      draft = JSON.parse(raw);
    } catch {
      localStorage.removeItem(key);
      return;
    }
    if (draft?.version !== 1 || !Number.isFinite(draft.updatedAt)
      || Date.now() - draft.updatedAt >= DRAFT_MAX_AGE || !Array.isArray(draft.pages)) {
      localStorage.removeItem(key);
      return;
    }
    if (draft.recordId === recordId) {
      drafts.push({
        ...draft,
        key,
        pages: draft.pages.filter((page) => typeof page?.source === 'string')
          .map((page) => ({ source: page.source, ...draftContent(page) })),
      });
    }
  });
  return drafts.sort((a, b) => b.updatedAt - a.updatedAt);
}

export default function useTranscriptionDrafts(recordId, pages, setPages) {
  const [candidates, setCandidates] = useState([]);
  const [storageError, setStorageError] = useState(false);
  const [restored, setRestored] = useState(false);
  const editorId = useRef(null);
  if (!editorId.current) {
    editorId.current = crypto.randomUUID?.()
      || Array.from(crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join('-');
  }
  const latest = useRef({ recordId, pages });
  latest.current = { recordId, pages };
  const timer = useRef(null);
  const restoredKey = useRef(null);
  const acknowledged = useRef(new Map());

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    const { current } = latest;
    if (!current.recordId) return;
    try {
      const key = `${DRAFT_PREFIX}${encodeURIComponent(current.recordId)}:${editorId.current}`;
      const unsaved = current.pages.filter((page) => page.unsavedChanges
        && (!acknowledged.current.has(page.source)
          || !sameDraft(page, acknowledged.current.get(page.source))))
        .map((page) => ({ source: page.source, ...draftContent(page) }));
      if (unsaved.length) {
        localStorage.setItem(key, JSON.stringify({
          version: 1, recordId: current.recordId, updatedAt: Date.now(), pages: unsaved,
        }));
      } else {
        localStorage.removeItem(key);
      }
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, []);

  useEffect(() => {
    acknowledged.current.clear();
    restoredKey.current = null;
    setRestored(false);
    setCandidates([]);
    if (!recordId) return;
    try {
      const available = readDrafts(recordId);
      setCandidates(available.filter((draft) => draft.pages.some(
        (saved) => latest.current.pages.some(
          (page) => page.source === saved.source && page.transcriptionstatus === 'readytotranscribe',
        ),
      )));
    } catch {
      setStorageError(true);
    }
    // Candidates are read once when the record opens; editing must not reset the offer.
  }, [recordId]);

  useEffect(() => {
    timer.current = setTimeout(flush, 500);
    return () => clearTimeout(timer.current);
  }, [pages, recordId, flush]);

  useEffect(() => {
    const hide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', flush);
    return () => {
      flush();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', flush);
    };
  }, [flush]);

  const restore = (key) => {
    const draft = candidates.find((candidate) => candidate.key === key);
    if (!draft) return;
    restoredKey.current = key;
    setPages((current) => current.map((page) => {
      const saved = draft.pages.find((entry) => entry.source === page.source);
      if (!saved || page.unsavedChanges || page.transcriptionstatus !== 'readytotranscribe') return page;
      return { ...page, ...draftContent(saved), unsavedChanges: true };
    }));
    setCandidates([]);
    setRestored(true);
  };

  const saved = (source, snapshot) => {
    acknowledged.current.set(source, draftContent(snapshot));
    clearTimeout(timer.current);
    const keys = [
      `${DRAFT_PREFIX}${encodeURIComponent(latest.current.recordId)}:${editorId.current}`,
      restoredKey.current,
    ].filter(Boolean);
    try {
      keys.forEach((key) => {
        const draft = JSON.parse(localStorage.getItem(key));
        if (!draft?.pages) return;
        const remaining = draft.pages.filter(
          (page) => page.source !== source || !sameDraft(page, snapshot),
        );
        if (remaining.length === draft.pages.length) return;
        if (remaining.length) {
          localStorage.setItem(key, JSON.stringify({ ...draft, pages: remaining }));
        } else localStorage.removeItem(key);
      });
    } catch {
      setStorageError(true);
    }
  };

  return {
    candidates,
    storageError,
    restored,
    flush,
    restore,
    saved,
    dismiss: () => setCandidates([]),
  };
}
