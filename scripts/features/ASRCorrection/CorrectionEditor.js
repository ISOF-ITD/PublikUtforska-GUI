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
 * Height of a single row in pixels (tweak if you change row padding)
 */
const ROW_HEIGHT = 56;

export default function CorrectionEditor() {
  /* ---------- routing / context ---------- */
  const { source } = useParams();
  const { data } = useOutletContext();
  const { playAudio, isPlaying, pauseAudio } = useContext(AudioContext);

  /* ---------- derived data ---------- */
  const audioItem = useMemo(
    () =>
      data?.media?.find((item) => item.source === decodeURIComponent(source)),
    [data, source]
  );

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
  const [editingId, setEditingId] = useState(null); // utterance.id being edited
  const [editedText, setEditedText] = useState("");
  const [filter, setFilter] = useState("all"); // all | needs-work | completed
  const [saving, setSaving] = useState(false);
  const [utterances, setUtterances] = useState(audioItem?.utterances || []);

  const listRef = useRef(null); // react‑window ref

  const BASE_ROW = 56; // includes padding + 1 px border
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
    const idx = filteredUtterances.findIndex((u) => u.id === editingId);
    if (idx >= 0) {
      listRef.current?.scrollToItem(idx, "center");
    }
  }, [editingId, filteredUtterances]);

  useEffect(() => {
    // keep in sync when you load a new file
    setUtterances(audioItem?.utterances || []);
  }, [audioItem]);

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
    const u = filteredUtterances[i];
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
        ? filteredUtterances.findIndex((u) => u.id === editingId)
        : 0; // fallback — recalc everything

    // Clear the cached sizes starting with that row
    listRef.current.resetAfterIndex(idx, /* forceUpdate = */ true);
  }, [editingId, editedText, filteredUtterances]);

  /* ---------- action handlers ---------- */
  const beginEdit = useCallback((utterance) => {
    if (utterance.status === "complete") return;
    setEditingId(utterance.id);
    setEditedText(utterance.text);
  }, []);

  const discardEdit = () => setEditingId(null);

  const updateSpeaker = useCallback((id, speaker) => {
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
    if (isPlaying) {
      pauseAudio();
    } else {
      playAudio({
        record: { id: data?.id, title: audioTitle },
        audio: audioItem,
        time: startTime,
      });
    }
  };

  const gotoPrev = useCallback(() => {
    if (!editingId) return;
    const idx = filteredUtterances.findIndex((u) => u.id === editingId);
    if (idx > 0) beginEdit(filteredUtterances[idx - 1]);
  }, [editingId, filteredUtterances, beginEdit]);

  const gotoNext = useCallback(() => {
    if (!editingId) return;
    const idx = filteredUtterances.findIndex((u) => u.id === editingId);
    if (idx < filteredUtterances.length - 1)
      beginEdit(filteredUtterances[idx + 1]);
  }, [editingId, filteredUtterances, beginEdit]);

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
      if (!editingId) return;
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
  }, [editingId, filteredUtterances]);

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
        <div className="flex justify-between text-sm text-gray-600">
          <span>
            Färdigt: {progress.complete}/{progress.total} ({progress.percent}%)
          </span>
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
        </div>
      </header>

      {/* utterances list */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* table header */}
        <div className="grid grid-cols-[16px_96px_1fr_56px_1fr_auto] bg-gray-50 text-sm font-medium px-4 py-2 sticky top-0 z-10">
          <span />
          <span>Tid</span>
          <span>Talare</span>
          <span>Spela</span>
          <span>Text</span>
          <span className="text-right">Åtgärder</span>
        </div>

        {/* virtualised rows */}
        <List
          ref={listRef}
          height={600}
          itemCount={filteredUtterances.length}
          itemSize={getItemSize}
          itemKey={(index) => filteredUtterances[index].id}
          itemData={{
            rows: filteredUtterances,
            editingId,
            editedText,
            isPlaying,
            beginEdit,
            discardEdit,
            saveEdit,
            gotoPrev,
            gotoNext,
            handlePlay,
            setEditedText,
            formatTimestamp,
            updateSpeaker,
            speakers: data?.speakers ?? [],
          }}
          width="100%"
        >
          {UtteranceRow}
        </List>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */
const FilterButton = ({ label, value, filter, setFilter }) => (
  <button
    onClick={() => setFilter(value)}
    className={classNames(
      "px-2 py-1 rounded focus:ring-2 focus:ring-isof focus:outline-none",
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
};
