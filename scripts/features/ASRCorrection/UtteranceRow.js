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

export const UtteranceRow = React.memo(function UtteranceRow({
  index,
  style,
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
  } = data;

  const utterance = rows[index];
  const isEditing = editingId === utterance.id;

  return (
    <div
      style={style}
      className={classNames(
        "grid grid-cols-[16px_96px_1fr_56px_1fr_auto] items-start border-b last:border-none px-4 py-2",
        isEditing ? "bg-yellow-50" : "hover:bg-gray-50",
        utterance.status === "complete" && "opacity-60"
      )}
    >
      {/* status dot */}
      <span className="flex items-center justify-center">
        <FontAwesomeIcon
          icon={faCircle}
          className={classNames("w-2 h-2", STATUS_COLORS[utterance.status])}
        />
      </span>

      {/* timestamp */}
      <span className="font-mono whitespace-nowrap">
        {formatTimestamp(utterance.start)}
      </span>

      {/* speaker */}
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
      </span>

      {/* play/pause */}
      <span className="text-center">
        <button
          onClick={() => handlePlay(utterance.start)}
          className="text-isof"
          aria-label={isPlaying ? "Pausa uppspelning" : "Spela upp"}
        >
          <FontAwesomeIcon
            icon={isPlaying ? faPause : faPlay}
            className="w-3 h-3"
          />
        </button>
      </span>

      {/* text */}
      <span className="w-full">
        {isEditing ? (
          <textarea
            autoFocus
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={Math.max(2, editedText.split("\n").length)}
            className="w-full p-2 border rounded focus:ring-isof focus:border-isof text-sm"
          />
        ) : (
          <span className="w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {utterance.text}
          </span>
        )}
      </span>

      {/* actions */}
      <span className="whitespace-nowrap text-right">
        {isEditing ? (
          <div className="flex gap-2 justify-end">
            <button
              className="text-green-600 disabled:opacity-50"
              title="Spara (⌘/Ctrl+Enter)"
              disabled={editedText.trim() === utterance.text.trim()}
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
            {utterance.status !== "complete" && (
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
    </div>
  );
});
