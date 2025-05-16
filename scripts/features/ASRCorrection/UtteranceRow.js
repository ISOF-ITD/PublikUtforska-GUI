import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircle,
  faEdit,
  faFlag,
  faPause,
  faPlay,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React from "react";

/**
 * Row status → Tailwind text‑color map
 */
const STATUS_COLORS = {
  initialized: "text-gray-400",
  edited: "text-yellow-400",
  review: "text-red-400",
  complete: "text-green-500",
};

/* ------------------------------------------------------------------ */
/*  MobileEditBar – appears only while editing and only on < 640 px   */
/* ------------------------------------------------------------------ */
export function MobileEditBar({
  visible,
  disabled,
  onSave,
  onCancel,
  onPrev,
  onNext,
}) {
  if (!visible) return null; // nothing if not editing
  return (
    <div
      className="fixed bottom-0 inset-x-0 z-20 sm:hidden
                      bg-white/95 backdrop-blur border-t shadow-md"
    >
      <div className="flex justify-between items-center p-3 text-lg">
        <button onClick={onPrev} className="px-2" title="↑">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <div className="flex gap-6">
          <button
            onClick={onCancel}
            className="px-3 py-1 rounded-lg bg-red-100 text-red-700"
          >
            Avbryt
          </button>
          <button
            disabled={disabled}
            onClick={onSave}
            className="px-3 py-1 rounded-lg bg-green-600 text-white disabled:opacity-50"
          >
            Spara
          </button>
        </div>
        <button onClick={onNext} className="px-2" title="↓">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}

export const UtteranceRow = React.memo(function UtteranceRow({
  index,
  style = {},
  data,
}) {
  const {
    rows,
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
    readOnly,
    activeId,
  } = data;

  const utterance = rows[index];
  const isEditing = !readOnly && editingId === utterance?.id;
  const isActive = data.activeId === utterance?.id;

  // helper
  const highlight = (txt, q) => {
    if (!q.trim()) return txt;
    const parts = txt.split(
      new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "i")
    );
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200">
          {p}
        </mark>
      ) : (
        p
      )
    );
  };

  return (
    <div
      type="button"
      onClick={() => handlePlay(utterance.start)}
      onKeyDown={(e) =>
        (e.key === " " || e.key === "Enter") && handlePlay(utterance.start)
      }
      style={style}
      tabIndex={0}
      /* On phones we fall back to a stacked flex layout;
     from sm: ≥640 px we switch back to your grid. */
      className={classNames(
        // ⬇️  Mobile
        "flex flex-col gap-2 border-b border-gray-200 last:border-none px-4 py-3",
        // ⬆️  Desktop
        "sm:grid sm:grid-cols-[16px_auto_44px_1fr_auto] sm:items-center sm:gap-4",
        isEditing ? "bg-yellow-50" : "hover:bg-gray-50",
        utterance?.status === "complete" && "opacity-60",
        "text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-isof/70",
        isActive ? "bg-isof/10 ring-isof/40" : "hover:bg-gray-50"
      )}
    >
      {/* status dot */}
      <span className="flex items-center justify-center">
        <FontAwesomeIcon
          icon={faCircle}
          className={classNames("w-2 h-2", STATUS_COLORS[utterance?.status])}
        />
      </span>
      {/* timestamp */}
      <span
        className="font-mono whitespace-nowrap text-gray-500"
        title={new Date(utterance.start * 1000).toISOString().substr(11, 8)}
      >
        {formatTimestamp(utterance?.start)}
      </span>
      {/* speaker 
      <span>
        {isEditing ? (
          <select
            value={utterance.speaker ?? "unknown"}
            onChange={(e) => data.updateSpeaker(utterance.id, e.target.value)}
            className="border rounded p-1 text-sm"
          >
            {data.speakers.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value="unknown">Okänd</option>
          </select>
        ) : (
          utterance.speaker || "—"
        )}
      </span>*/}
      {/* play/pause */}
      <span className="text-left">
        <a
          onClick={(e) => {
            e.stopPropagation();
            handlePlay(utterance.start);
          }}
          className="text-isof"
          aria-label={isPlaying && isActive ? "Pausa uppspelning" : "Spela upp"}
        >
          <FontAwesomeIcon
            icon={isPlaying && isActive ? faPause : faPlay}
            className="w-3 h-3"
          />
        </a>
      </span>
      {/* text */}
      <span className="">
        {isEditing ? (
          <textarea
            autoFocus
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={1}
            style={{ height: "auto" }}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full p-3 text-base sm:text-sm border rounded
                     focus:ring-isof focus:border-isof"
          />
        ) : (
          <span className="w-full overflow-hidden text-ellipsis">
            {highlight(utterance?.text ?? "", data.query)}
          </span>
        )}
      </span>
      {!readOnly && (
        <span className="whitespace-nowrap text-right">
          {isEditing ? (
            <div className="flex gap-2 justify-end">
              <button
                className="text-green-600 disabled:opacity-50"
                title="Spara (⌘/Ctrl+Enter)"
                disabled={editedText.trim() === utterance?.text.trim()}
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
              {utterance?.status !== "complete" && (
                <button
                  className="text-isof"
                  onClick={() => beginEdit(utterance)}
                  aria-label="Redigera"
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              )}
              <button
                className="text-red-500"
                onClick={() => alert("Flag TODO")}
                title="Flagga för fel"
                aria-label="Flagga"
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            </div>
          )}
        </span>
      )}
      {!readOnly && (
        <MobileEditBar
          visible={Boolean(editingId)}
          disabled={editedText.trim() === utterance?.text?.trim()}
          onSave={() =>
            editingId && saveEdit(utterances?.find((u) => u.id === editingId))
          }
          onCancel={discardEdit}
          onPrev={gotoPrev}
          onNext={gotoNext}
        />
      )}
    </div>
  );
});
