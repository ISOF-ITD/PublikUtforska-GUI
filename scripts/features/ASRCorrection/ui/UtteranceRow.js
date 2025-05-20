import React from "react";
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faEdit,
  faFlag,
  faPause,
  faPlay,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";

import highlight from "../utils/highlight";
import StatusDot from "./StatusDot";
import MobileEditBar from "./MobileEditBar";

/** Re-usable Tailwind snippets */
const rowBase = "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-isof/70";

export default React.memo(function UtteranceRow({ index, style = {}, data }) {
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
    readOnly,
    activeId,
    query,
  } = data;

  const utterance = rows[index];
  const isEditing = !readOnly && editingId === utterance.id;
  const isActive = activeId === utterance.id;

  /* ----------- helpers ------------ */
  const disabledSave = editedText.trim() === (utterance.text ?? "").trim();

  const commonRowClasses = classNames(
    // mobile layout
    "flex flex-col gap-2 sm:grid sm:grid-cols-[16px_auto_44px_1fr_auto] sm:items-center sm:gap-4",
    rowBase,
    isEditing ? "bg-yellow-50" : "hover:bg-gray-50",
    utterance.status === "complete" && "opacity-60",
    isActive
      ? "bg-isof/10 ring-2 ring-inset ring-isof/70 border-l-4 border-isof"
      : undefined
  );

  const formatTimestamp = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = Math.floor(sec % 60);
    return [hrs, mins, secs]
      .filter((v, i) => v || i) // drop leading “00:” when < 1 h
      .map((v) => v.toString().padStart(2, "0"))
      .join(":");
  };

  /* ----------- render ------------ */
  return (
    <div
      role="button"
      tabIndex={0}
      style={style}
      onClick={(e) => {
        // Don’t start playback when interacting with form controls
        if (
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLInputElement ||
          e.target.closest("button, a")
        ) {
          return;
        }
        handlePlay(utterance.start, utterance.id);
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") handlePlay(utterance.start, utterance.id);
      }}
      className={commonRowClasses}
    >
      {/* status dot */}
      <span className="flex items-center justify-center">
        <StatusDot status={utterance.status} />
      </span>

      {/* timestamp */}
      <span
        className="font-mono whitespace-nowrap text-gray-500"
        title={new Date(utterance.start * 1000).toISOString().substr(11, 8)}
      >
        {formatTimestamp(utterance.start)}
      </span>

      {/* play / pause */}
      <span>
        <a
          onClick={(e) => {
            e.stopPropagation();
            handlePlay(utterance.start, utterance.id);
          }}
          className="inline-flex items-center justify-center w-8 h-8 rounded-full text-isof hover:cursor-pointer
                     focus-visible:ring-2 focus-visible:ring-isof"
          aria-label={isPlaying && isActive ? "Pausa uppspelning" : "Spela upp"}
        >
          <FontAwesomeIcon
            icon={isPlaying && isActive ? faPause : faPlay}
            className="w-4 h-4"
          />
        </a>
      </span>

      {/* text / textarea */}
      <span className="w-full">
        {isEditing ? (
          <textarea
            autoFocus
            rows={1}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            className="w-full p-3 text-base sm:text-sm border rounded
                       focus:ring-isof focus:border-isof"
          />
        ) : (
          <span className="w-full overflow-hidden text-ellipsis">
            {highlight(utterance.text, query)}
          </span>
        )}
      </span>

      {/* desktop action buttons */}
      {!readOnly && (
        <span className="whitespace-nowrap text-right">
          {isEditing ? (
            <div className="flex gap-2 justify-end">
              <button
                className="text-green-600 disabled:opacity-50"
                title="Spara (⌘/Ctrl+Enter)"
                disabled={disabledSave}
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
      )}

      {/* mobile action bar */}
      {!readOnly && (
        <MobileEditBar
          visible={Boolean(editingId)}
          disabled={disabledSave}
          onSave={() =>
            editingId && saveEdit(rows.find((u) => u.id === editingId))
          }
          onCancel={discardEdit}
          onPrev={gotoPrev}
          onNext={gotoNext}
        />
      )}
    </div>
  );
});
