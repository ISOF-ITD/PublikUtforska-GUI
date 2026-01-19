/**
 * All utterance-related state in one place
 * – list building
 * – filtering
 * – search
 * – active row following
 * – progress counters
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import useDebounce from "./useDebounce";

export default function useUtterances(audioItem, activeId) {
  /* ---- build flat list once audioItem is ready ---- */
  const buildUtterances = useCallback(() => {
    if (!audioItem) return [];
    const raw = Array.isArray(audioItem.utterances)
      ? audioItem.utterances
      : audioItem.utterances?.utterances ?? [];

    return raw.map((u, idx) => ({
      id: u.id ?? `${audioItem.source}-${idx}`,
      text: u.text ?? "",
      start: u.start ?? 0,
      end: u.end ?? 0,
      speaker: u.speaker ?? "",
      status: u.status ?? "initialized",
    }));
  }, [audioItem]);

  // pull utterances-metadata from the media item
  const metadata = useMemo(
    () => audioItem?.utterances?.metadata ?? null,
    [audioItem]
  );

  const [utterances, setUtterances] = useState(buildUtterances);
  useEffect(() => setUtterances(buildUtterances()), [buildUtterances]);

  /* ---- filter & search ---- */
  const [filter, setFilter] = useState("all"); // all | needs-work | completed
  const [queryRaw, setQueryRaw] = useState("");
  const query = useDebounce(queryRaw, 200);

  const [showOnlyMatches, setShowOnlyMatches] = useState(true); // "show in text" mode

  const norm = useCallback(
    (s) => (s ?? "").toLocaleLowerCase("sv").normalize("NFC"),
    []
  );
  const tokens = useMemo(() => {
    const q = norm(query).trim();
    // match "quoted phrases" or single words
    const parts = q.match(/"[^"]+"|\S+/g) || [];
    return parts.map((p) => p.replace(/^"|"$/g, ""));
  }, [query, norm]);
  const matches = useCallback(
    (u) => {
      if (!tokens.length) return false;
      const t = norm(u.text);
      return tokens.every((tok) => t.includes(tok));
    },
    [tokens, norm]
  );

  const filteredUtterances = useMemo(() => {
    switch (filter) {
      case "needs-work":
        return utterances.filter((u) =>
          ["initialized", "edited", "review"].includes(u.status)
        );
      case "completed":
        return utterances.filter((u) => u.status === "complete");
      default:
        return utterances;
    }
  }, [filter, utterances]);

  const {
    list: visibleUtterances,
    hits: searchHits,
    matchIds,
  } = useMemo(() => {
    const matched = tokens.length ? filteredUtterances.filter(matches) : [];
    const matchIds = matched.map((u) => u.id);

    const baseList =
      tokens.length && showOnlyMatches ? matched : filteredUtterances;

    const hits = matched.length; // number of rows that match (fast + useful)

    // Ensure active utterance is always in the list
    if (activeId && baseList !== matched) {
      const activeUtterance = utterances.find((u) => u.id === activeId);
      if (activeUtterance && !baseList.some((u) => u.id === activeId)) {
        return { list: [...baseList, activeUtterance], hits, matchIds };
      }
    }
    return { list: baseList, hits, matchIds };
  }, [
    filteredUtterances,
    tokens,
    matches,
    utterances,
    activeId,
    showOnlyMatches,
  ]);

  /* ---- counters ---- */
  const counts = useMemo(
    () => ({
      needsWork: utterances.filter((u) =>
        ["initialized", "edited", "review"].includes(u.status)
      ).length,
      completed: utterances.filter((u) => u.status === "complete").length,
    }),
    [utterances]
  );

  const progress = useMemo(() => {
    const complete = counts.completed;
    const total = utterances.length;
    return {
      complete,
      total,
      percent: total ? Math.round((complete / total) * 100) : 0,
    };
  }, [counts.completed, utterances.length]);

  return {
    utterances,
    setUtterances,
    metadata, // expose media.utterances.metadata here
    filterState: { filter, setFilter },
    searchState: {
      queryRaw,
      setQueryRaw,
      query,
      showOnlyMatches,
      setShowOnlyMatches,
      matchIds, // ordered list of utterance IDs that match
    },
    visibleUtterances,
    searchHits,
    counts,
    progress,
  };
}
