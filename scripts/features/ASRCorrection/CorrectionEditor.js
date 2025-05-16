import React, {
  useState,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
} from "react";
import PropTypes from "prop-types";
import { useParams, useOutletContext } from "react-router-dom";
import { VariableSizeList as List } from "react-window";
import classNames from "classnames";
import { getAudioTitle } from "../../utils/helpers";
import { AudioContext } from "../../contexts/AudioContext";
import { UtteranceRow } from "./UtteranceRow";

/**
 * Height of a single row in pixels
 */
const ROW_HEIGHT = 56;

export default function CorrectionEditor({ readOnly = true }) {
  /* ---------- routing / context ---------- */
  const { source } = useParams();
  const { data } = useOutletContext();
  const { playAudio, isPlaying, pauseAudio } = useContext(AudioContext);

  /* ---------- derived data ---------- */
  const audioItem = useMemo(() => {
    const sameSrc =
      data?.media?.filter((m) => m.source === decodeURIComponent(source)) ?? [];

    // Prefer the one that actually contains utterances
    return (
      sameSrc.find(
        (m) =>
          Array.isArray(m.utterances?.utterances) || Array.isArray(m.utterances)
      ) || sameSrc[0]
    );
  }, [data, source]);

  const audioTitle = useMemo(
    () =>
      audioItem
        ? getAudioTitle(
            audioItem.title,
            data?.contents,
            data?.archive?.archive_org,
            data?.archive?.archive,
            audioItem.source,
            data?.year,
            data?.persons
          )
        : "",
    [audioItem, data]
  );

  /* ---------- local ui state ---------- */
  // When read-only, never enter edit mode
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState("");
  const [filter, setFilter] = useState("all"); // all | needs-work | completed
  const [saving, setSaving] = useState(false);

  const buildUtterances = useCallback(() => {
    if (!audioItem) return [];

    // 2a. peel off wrapper if present
    const raw = Array.isArray(audioItem.utterances)
      ? audioItem.utterances
      : audioItem.utterances?.utterances ?? [];

    // 2b. bring the shape back to what the UI expects
    return raw.map((u, idx) => ({
      id: u.id ?? `${audioItem.source}-${idx}`,
      text: u.text ?? "",
      start: u.start ?? 0,
      end: u.end ?? 0,
      speaker: u.speaker ?? "",

      // new API has no per‑row status – default to “initialized”
      status: u.status ?? "initialized",
    }));
  }, [audioItem]);

  const [utterances, setUtterances] = useState(buildUtterances());

  const listRef = useRef(null); // react‑window ref

  const BASE_ROW = 76; // includes padding + 1 px border
  const EXTRA_LINE = 22; // ≈ height of a wrapped line

  /* ---------- helpers ---------- */
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

  const [queryRaw, setQueryRaw] = useState("");

  function useDebounce(value, delay) {
    const [debounced, setDebounced] = React.useState(value);
    React.useEffect(() => {
      const id = setTimeout(() => setDebounced(value), delay);
      return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
  }

  const query = useDebounce(queryRaw, 200);

  const visibleUtterances = useMemo(() => {
    if (!query.trim()) return filteredUtterances;
    const q = query.toLowerCase();
    return filteredUtterances.filter((u) => u.text.toLowerCase().includes(q));
  }, [filteredUtterances, query]);

  const progress = useMemo(() => {
    const complete = utterances.filter((u) => u.status === "complete").length;
    return {
      complete,
      total: utterances.length,
      percent: utterances.length
        ? Math.round((complete / utterances.length) * 100)
        : 0,
    };
  }, [utterances]);

  const formatTimestamp = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return [hrs, mins, secs]
      .filter((v, i) => v || i) // drop leading “00:” when < 1 h
      .map((v) => v.toString().padStart(2, "0"))
      .join(":");
  };

  /* ---------- side‑effects ---------- */
  // When a row enters edit mode, scroll it into view inside the virtualised list
  useEffect(() => {
    if (!editingId) return;
    const idx = visibleUtterances.findIndex((u) => u.id === editingId);
    if (idx >= 0) {
      listRef.current?.scrollToItem(idx, "center");
    }
  }, [editingId, visibleUtterances]);

  useEffect(() => {
    setUtterances(buildUtterances());
  }, [buildUtterances]);

  // top of component
  const isDirty = Boolean(editingId);

  // block browser unload
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const getItemSize = (i) => {
    const u = visibleUtterances[i];
    if (u.id === editingId) {
      const lines = Math.max(2, editedText.split("\n").length);
      return BASE_ROW + (lines - 2) * EXTRA_LINE;
    }
    return BASE_ROW;
  };

  useEffect(() => {
    if (!listRef.current) return;

    // Which row needs to be re‑measured?
    const idx =
      editingId != null
        ? visibleUtterances.findIndex((u) => u.id === editingId)
        : 0; // fallback — recalc everything

    // Clear the cached sizes starting with that row
    listRef.current.resetAfterIndex(idx, /* forceUpdate = */ true);
  }, [editingId, editedText, visibleUtterances]);

  /* ---------- action handlers ---------- */
  const beginEdit = useCallback(
    (utterance) => {
      if (readOnly || utterance.status === "complete") return;
      setEditingId(utterance.id);
      setEditedText(utterance.text);
    },
    [readOnly]
  );

  const discardEdit = () => setEditingId(null);

  const updateSpeaker = useCallback((id, speaker) => {
    if (readOnly) return;
    setUtterances((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              speaker,
              status: u.status === "initialized" ? "edited" : u.status,
            }
          : u
      )
    );
  }, []);

  const saveEdit = useCallback(
    async (utterance) => {
      if (readOnly) return;
      setSaving(true);
      try {
        const updated = { ...utterance, text: editedText, status: "edited" };
        setUtterances((prev) =>
          prev.map((u) => (u.id === utterance.id ? updated : u))
        );
        setEditingId(null);
        /* await api.post(…) */
      } catch (err) {
        console.error(err);
        alert("Misslyckades att spara ändring. Försök igen.");
      } finally {
        setSaving(false);
      }
    },
    [editedText]
  );

  const handlePlay = (startTime) => {
    // Always start (or restart) from the requested offset
    playAudio({
      record: { id: data?.id, title: audioTitle },
      audio: audioItem,
      time: startTime,
    });
  };

  const gotoPrev = useCallback(() => {
    if (readOnly) return;
    if (!editingId) return;
    const idx = visibleUtterances.findIndex((u) => u.id === editingId);
    if (idx > 0) beginEdit(visibleUtterances[idx - 1]);
  }, [editingId, visibleUtterances, beginEdit]);

  const gotoNext = useCallback(() => {
    if (readOnly) return;
    if (!editingId) return;
    const idx = visibleUtterances.findIndex((u) => u.id === editingId);
    if (idx < visibleUtterances.length - 1)
      beginEdit(visibleUtterances[idx + 1]);
  }, [editingId, visibleUtterances, beginEdit]);

  const counts = useMemo(
    () => ({
      needsWork: utterances.filter((u) =>
        ["initialized", "edited", "review"].includes(u.status)
      ).length,
      completed: utterances.filter((u) => u.status === "complete").length,
    }),
    [utterances]
  );

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (!editingId || readOnly) return;
      if (e.key === "Escape") discardEdit();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const utt = utterances.find((u) => u.id === editingId);
        if (utt) saveEdit(utt);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        gotoPrev();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        gotoNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingId, visibleUtterances]);

  function useIsMobile() {
    const [mobile, setMobile] = React.useState(
      window.matchMedia("(max-width:639px)").matches
    );
    React.useEffect(() => {
      const mq = window.matchMedia("(max-width:639px)");
      const handler = (e) => setMobile(e.matches);
      // Safari <16 uses addListener/removeListener
      (mq.addEventListener || mq.addListener).call(mq, "change", handler);
      return () =>
        (mq.removeEventListener || mq.removeListener).call(
          mq,
          "change",
          handler
        );
    }, []);
    return mobile;
  }

  // -- Which utterance is being spoken right now --------------------------
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    // Global event fired from GlobalAudioPlayer (see b) below)
    const onTick = ({ detail: { pos } }) => {
      // Find the utterance whose start ≤ pos < end
      const current = utterances.find((u) => pos >= u.start && pos < u.end);
      if (current && current.id !== activeId) {
        setActiveId(current.id);

        // make sure it is visible inside react-window
        const idx = visibleUtterances.findIndex((u) => u.id === current.id);
        if (idx >= 0) listRef.current?.scrollToItem(idx, "center");
        else setActiveId(null); // row hidden by filter/search
      }
    };

    window.addEventListener("audio.time", onTick);
    return () => window.removeEventListener("audio.time", onTick);
  }, [utterances, visibleUtterances, activeId]);

  const isMobile = useIsMobile();

  const listData = useMemo(
    () => ({
      rows: visibleUtterances,
      editingId,
      editedText,
      isPlaying,
      beginEdit,
      discardEdit,
      saveEdit,
      gotoPrev,
      gotoNext,
      readOnly,
      handlePlay,
      setEditedText,
      formatTimestamp,
      updateSpeaker,
      speakers: data?.speakers ?? [],
      activeId,
      query,
    }),
    [
      visibleUtterances,
      editingId,
      editedText,
      isPlaying,
      beginEdit,
      discardEdit,
      saveEdit,
      gotoPrev,
      gotoNext,
      handlePlay,
      formatTimestamp,
      updateSpeaker,
      data?.speakers,
      activeId,
      query,
    ]
  );

  /* ---------- render ---------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* header */}
      <header className="bg-white p-6 mb-6 shadow rounded-lg flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Transkribering</h1>
        <p className="text-gray-600">{audioTitle}</p>
        {/* progress bar */}
        <div
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-2 bg-gray-200 rounded overflow-hidden"
        >
          <div
            className="bg-isof h-full transition-all"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div>Maskin­transkription – kan innehålla fel</div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Klart: {progress.complete}/{progress.total} ({progress.percent}%)
          </span>
          {!readOnly && (
            <div className="flex gap-2 items-center">
              <FilterButton
                label="Alla"
                value="all"
                filter={filter}
                setFilter={setFilter}
              />
              <FilterButton
                label={`Behöver arbete (${counts.needsWork})`}
                value="needs-work"
                filter={filter}
                setFilter={setFilter}
              />
              <FilterButton
                label={`Klart (${counts.completed})`}
                value="completed"
                filter={filter}
                setFilter={setFilter}
              />
            </div>
          )}
        </div>
        {readOnly && (
          <input
            type="search"
            autoFocus
            placeholder="Sök i texten…"
            className="mt-3 max-w-xs border rounded px-3 py-1 text-sm"
            value={queryRaw}
            onChange={(e) => setQueryRaw(e.target.value)}
          />
        )}
        <button
          onClick={() =>
            navigator.clipboard.writeText(
              visibleUtterances.map((u) => u.text).join("\n\n")
            )
          }
        >
          Kopiera allt
        </button>
      </header>

      {/* utterances list */}
      <div className="bg-white shadow rounded-lg w-full">
        {/* table header */}
        <div className="grid grid-cols-[16px_auto_44px_1fr_auto] gap-6 bg-gray-50 text-sm font-medium px-4 py-2 sticky top-0 z-10">
          <span />
          <span>Tid</span>
          <span>Spela</span>
          <span>Text</span>
          {!readOnly && <span className="text-right">Åtgärder</span>}
        </div>

        {/* virtualised rows */}
        {isMobile ? (
          /* Plain list (no virtualisation) */
          <div className="divide-y">
            {visibleUtterances.map((_, idx) => (
              <UtteranceRow
                key={visibleUtterances[idx].id}
                index={idx}
                data={listData}
                /*  we don’t pass “style” when not virtualised  */
              />
            ))}
          </div>
        ) : (
          /* The original react‑window list for ≥640 px */
          <List
            ref={listRef}
            height={600}
            itemCount={visibleUtterances.length}
            itemSize={getItemSize}
            itemKey={(index) => visibleUtterances[index].id}
            itemData={listData}
            width="100%"
          >
            {UtteranceRow}
          </List>
        )}
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */
const FilterButton = ({ label, value, filter, setFilter }) => (
  <button
    onClick={() => setFilter(value)}
    className={classNames(
      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-isof",
      filter === value
        ? "bg-isof text-white"
        : "hover:bg-gray-200 text-gray-700"
    )}
  >
    {label}
  </button>
);

CorrectionEditor.propTypes = {
  audioTitle: PropTypes.string,
  readOnly: PropTypes.bool,
};
