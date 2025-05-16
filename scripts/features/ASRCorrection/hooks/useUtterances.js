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

  const [utterances, setUtterances] = useState(buildUtterances);
  useEffect(() => setUtterances(buildUtterances()), [buildUtterances]);

  /* ---- filter & search ---- */
  const [filter, setFilter] = useState("all"); // all | needs-work | completed
  const [queryRaw, setQueryRaw] = useState("");
  const query = useDebounce(queryRaw, 200);

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

  const visibleUtterances = useMemo(() => {
    const list = query.trim()
      ? filteredUtterances.filter((u) =>
          u.text.toLowerCase().includes(query.toLowerCase())
        )
      : filteredUtterances;

    const active = utterances.find((u) => u.id === activeId);
    return active && !list.includes(active) ? [...list, active] : list;
  }, [filteredUtterances, query, utterances, activeId]);

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
    filterState: { filter, setFilter },
    searchState: { queryRaw, setQueryRaw, query },
    visibleUtterances,
    counts,
    progress,
  };
}
