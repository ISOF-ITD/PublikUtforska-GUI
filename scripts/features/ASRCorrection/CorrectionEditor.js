import React, {
  useState,
  useContext,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { useParams, useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faEdit,
  faPlay,
  faPause,
  faFlag,
  faChevronLeft,
  faChevronRight,
  faCircle,
} from "@fortawesome/free-solid-svg-icons";
import { getAudioTitle } from "../../utils/helpers";
import { AudioContext } from "../../contexts/AudioContext";
import classNames from "classnames";

const STATUS_COLORS = {
  initialized: "text-gray-400",
  edited: "text-yellow-400",
  review: "text-red-400",
  complete: "text-green-500",
};

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
            data?.archive?.arhive_org,
            data?.archive?.archive,
            audioItem.source,
            data?.year,
            data?.persons
          )
        : "",
    [audioItem, data]
  );

  const utterances = audioItem?.utterances || [];

  /* ---------- local ui state ---------- */
  const [editingId, setEditingId] = useState(null); // utterance.id being edited
  const [editedText, setEditedText] = useState("");
  const [filter, setFilter] = useState("all"); // all | needs-work | completed
  const [saving, setSaving] = useState(false);
  const tableBodyRef = useRef(null);

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

  const formatTimestamp = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  /* ---------- side‑effects ---------- */
  // Scroll the currently editing row into view
  useEffect(() => {
    if (!editingId) return;
    const rowEl = document.getElementById(`row-${editingId}`);
    rowEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [editingId]);

  /* ---------- action handlers ---------- */
  const beginEdit = (utterance) => {
    if (utterance.status === "complete") return; // lock completed lines
    setEditingId(utterance.id);
    setEditedText(utterance.text);
  };

  const discardEdit = () => setEditingId(null);

  const saveEdit = async (utterance) => {
    setSaving(true);
    try {
      // optimistic UI update
      utterance.text = editedText;
      utterance.status = "edited";
      /* TODO – replace with real API call
      await api.post("/api/transcribe/update", {
        recordId: data?.id,
        source: audioItem.source,
        utteranceId: utterance.id,
        text: editedText,
        speaker: utterance.speaker,
        start: utterance.start,
        end: utterance.end,
      });
      */
      setEditingId(null);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to save edit", err);
      alert("Misslyckades att spara ändring. Försök igen.");
    } finally {
      setSaving(false);
    }
  };

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

  const gotoPrev = () => {
    if (!editingId) return;
    const idx = filteredUtterances.findIndex((u) => u.id === editingId);
    if (idx > 0) beginEdit(filteredUtterances[idx - 1]);
  };

  const gotoNext = () => {
    if (!editingId) return;
    const idx = filteredUtterances.findIndex((u) => u.id === editingId);
    if (idx < filteredUtterances.length - 1)
      beginEdit(filteredUtterances[idx + 1]);
  };

  /* ---------- keyboard shortcuts ---------- */
  useEffect(() => {
    const onKey = (e) => {
      if (!editingId) return;
      if (e.key === "Escape") discardEdit();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const utt = utterances.find((u) => u.id === editingId);
        utt && saveEdit(utt);
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

  /* ---------- row sub‑component ---------- */
  const Row = ({ utterance }) => {
    const isEditing = editingId === utterance.id;
    return (
      <tr
        id={`row-${utterance.id}`}
        className={classNames(
          "border-b last:border-none",
          isEditing ? "bg-yellow-50" : "hover:bg-gray-50",
          utterance.status === "complete" && "opacity-60"
        )}
      >
        {/* status */}
        <td className="px-4 py-2 w-4 text-center">
          <FontAwesomeIcon
            icon={faCircle}
            className={classNames("w-2", STATUS_COLORS[utterance.status])}
          />
        </td>
        {/* timestamp */}
        <td className="px-4 py-2 font-mono whitespace-nowrap">
          {formatTimestamp(utterance.start)}
        </td>
        {/* speaker */}
        <td className="px-4 py-2">
          {isEditing ? (
            <select
              value={utterance.speaker}
              onChange={(e) => (utterance.speaker = e.target.value)}
              className="border rounded p-1 text-sm"
            >
              {data?.speakers?.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
              <option value="unknown">Okänd</option>
            </select>
          ) : (
            utterance.speaker || "—"
          )}
        </td>
        {/* play */}
        <td className="px-4 py-2 text-center">
          <button
            onClick={() => handlePlay(utterance.start)}
            className="text-isof"
          >
            <FontAwesomeIcon
              icon={isPlaying ? faPause : faPlay}
              className="w-3 h-3"
            />
          </button>
        </td>
        {/* text */}
        <td className="px-4 py-2 w-full">
          {isEditing ? (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={2}
              className="w-full p-2 border rounded focus:ring-isof focus:border-isof text-sm"
            />
          ) : (
            utterance.text
          )}
        </td>
        {/* actions */}
        <td className="px-4 py-2 whitespace-nowrap text-right">
          {isEditing ? (
            <div className="flex gap-2 justify-end">
              <button
                disabled={saving}
                className="text-green-600 disabled:opacity-50"
                title="Spara (⌘/Ctrl+Enter)"
                onClick={() => saveEdit(utterance)}
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                className="text-red-600"
                title="Avbryt (Esc)"
                onClick={discardEdit}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              {/* navigation */}
              <button
                className="text-gray-500"
                onClick={gotoPrev}
                title="Föregående (↑)"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button
                className="text-gray-500"
                onClick={gotoNext}
                title="Nästa (↓)"
              >
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2 justify-end">
              {utterance.status !== "complete" && (
                <button
                  className="text-isof"
                  onClick={() => beginEdit(utterance)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              )}
              <button
                className="text-red-500"
                onClick={() => alert("Flag TODO")}
                title="Flagga för fel"
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  /* ---------- render ---------- */
  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* header */}
      <header className="bg-white p-6 mb-6 shadow rounded-lg flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Transkribering</h1>
        <p className="text-gray-600">{audioTitle}</p>
        {/* progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
          <div
            className="bg-isof h-full transition-all"
            style={{ width: `${progress.percent}%` }}
          ></div>
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
              label="Behöver arbete"
              value="needs-work"
              filter={filter}
              setFilter={setFilter}
            />
            <FilterButton
              label="Klart"
              value="completed"
              filter={filter}
              setFilter={setFilter}
            />
          </div>
        </div>
      </header>

      {/* utterances list */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table ref={tableBodyRef} className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-4"></th>
              <th className="px-4 py-2 text-left">Tid</th>
              <th className="px-4 py-2 text-left">Talare</th>
              <th className="px-4 py-2 text-left">Spela</th>
              <th className="px-4 py-2 text-left w-full">Text</th>
              <th className="px-4 py-2 text-right">Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {filteredUtterances.map((utt) => (
              <Row key={utt.id} utterance={utt} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */
const FilterButton = ({ label, value, filter, setFilter }) => (
  <button
    onClick={() => setFilter(value)}
    className={classNames(
      "px-2 py-1 rounded",
      filter === value ? "bg-isof text-white" : "hover:bg-gray-200"
    )}
  >
    {label}
  </button>
);

CorrectionEditor.propTypes = {
  audioTitle: PropTypes.string,
};
