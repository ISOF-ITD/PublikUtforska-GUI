import React, { useLayoutEffect, useRef } from "react";
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

/** Utility */
const formatTimestamp = (sec) =>
  [Math.floor(sec / 3600), Math.floor((sec % 3600) / 60), Math.floor(sec % 60)]
    .filter((v, i) => v || i) // drop leading “00:” when < 1 h
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");

/* ─────────────────── READ-ONLY ROW ─────────────────── */
export const ReadOnlyUtteranceRow = React.memo(function ReadOnlyUtteranceRow({
  index,
  style = {},
  data,
}) {
  const { rows, handlePlay, isPlaying, activeId, setSize } = data;
  const u = rows[index];
  const isActive = activeId === u.id;
  const isCurrentPlaying = isPlaying && isActive;

  const ts = (sec) =>
    [sec / 3600, (sec % 3600) / 60, sec % 60]
      .map((v) => Math.floor(v).toString().padStart(2, "0"))
      .filter((v, i) => v !== "00" || i)
      .join(":");

  const rowRef = useRef(null);

  // measure once the row is rendered (or when its text changes)
  useLayoutEffect(() => {
    const h = rowRef.current?.getBoundingClientRect().height;
    if (h) setSize(index, h);
  }, [index, u.text, setSize]);

  return (
    <div
      role="button"
      tabIndex={0}
      ref={rowRef}
      data-utt={u.id}
      style={{ ...style, width: "100%" }}
      onClick={() => handlePlay(u.start, u.id)}
      onKeyDown={(e) =>
        [" ", "Enter"].includes(e.key) && handlePlay(u.start, u.id)
      }
      className={classNames(
        "grid grid-cols-[auto_1fr] gap-4 px-4 py-3 rounded-md items-center",
        "relative overflow-hidden min-w-0",
        "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-isof/70",
        isActive && "bg-isof/10 ring-2 ring-inset ring-isof"
      )}
    >
      <button
        aria-label={isCurrentPlaying ? "Pausa uppspelning" : "Spela upp"}
        aria-pressed={isCurrentPlaying}
        className="inline-flex items-center justify-center w-9 h-9 rounded-full
                   text-isof focus-visible:ring-2
                   focus-visible:ring-isof"
        onClick={(e) => {
          e.stopPropagation();
          handlePlay(u.start, u.id);
        }}
      >
        <FontAwesomeIcon icon={isCurrentPlaying ? faPause : faPlay} />
      </button>

      <div className="flex flex-col min-w-0">
        <time
          dateTime={ts(u.start)}
          className="font-mono text-xs text-gray-400"
        >
          {ts(u.start)}
        </time>
        <p className="whitespace-pre-wrap break-words !mr-2">{u.text}</p>
      </div>
    </div>
  );
});

export default React.memo(function UtteranceRow({
  index,
  style = {}, // from react-window (desktop only)
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
    readOnly,
    activeId,
    query,
    setSize,
  } = data;

  const utterance = rows[index];
  const isEditing = !readOnly && editingId === utterance.id;
  const isActive = activeId === utterance.id;
  const isCurrentPlaying = isPlaying && isActive;
  const disabledSave = editedText.trim() === (utterance.text ?? "").trim();

  /* ---------- dynamic height ---------- */
  const rowRef = useRef(null);
  useLayoutEffect(() => {
    const h = rowRef.current?.getBoundingClientRect().height;
    if (h) setSize(index, h);
  }, [index, utterance.text, editedText, isEditing, setSize]);

  /* ---------- MOBILE (“< sm”) – card ---------- */
  const mobileCard = (
    <article
      role="button"
      tabIndex={0}
      data-utt={utterance.id}
      onClick={() => handlePlay(utterance.start, utterance.id)}
      onKeyDown={(e) =>
        (e.key === " " || e.key === "Enter") &&
        handlePlay(utterance.start, utterance.id)
      }
      className={classNames(
        "m-0 rounded-2xl bg-white shadow p-4 space-y-3",
        isEditing && "bg-yellow-50",
        isActive && "ring-2 ring-isof/70 ring-inset"
      )}
      aria-label={`Uttalande ${index + 1}, starttid ${formatTimestamp(
        utterance.start
      )}`}
    >
      {/* first row – status · play/pause · timestamp */}
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-3">
          <StatusDot status={utterance.status} />
          <a
            className="w-11 h-11 flex items-center justify-center rounded-full
                       bg-isof/10 text-isof focus:outline-none focus:ring-2
                       focus:ring-isof/70"
            aria-label={isCurrentPlaying ? "Pausa uppspelning" : "Spela upp"}
            aria-pressed={isCurrentPlaying}
            onClick={(e) => {
              e.stopPropagation();
              handlePlay(utterance.start, utterance.id);
            }}
          >
            <FontAwesomeIcon
              icon={isCurrentPlaying ? faPause : faPlay}
              className="w-5 h-5"
            />
          </a>
        </span>

        <time
          dateTime={formatTimestamp(utterance.start)}
          className="font-mono text-sm text-gray-500"
        >
          {formatTimestamp(utterance.start)}
        </time>
      </header>

      {/* transcript text / textarea */}
      {isEditing ? (
        <textarea
          autoFocus
          rows={2}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onInput={(e) => {
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
          }}
          className="w-full text-base border rounded
                     focus:border-isof focus:ring-isof resize-none"
        />
      ) : (
        <p className="whitespace-pre-wrap break-words break-all">
          {highlight(utterance.text, query)}
        </p>
      )}

      {/* action bar (only when not read-only) */}
      {!readOnly && (
        <div className="flex justify-end gap-4">
          {isEditing ? (
            <>
              <button
                title="Spara (⌘/Ctrl + Enter)"
                className="text-green-600 disabled:opacity-50"
                disabled={disabledSave}
                onClick={() => saveEdit(u)}
              >
                <FontAwesomeIcon icon={faCheck} />
              </button>
              <button
                title="Avbryt (Esc)"
                className="text-red-600"
                onClick={discardEdit}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
              <button title="Föregående (↑)" onClick={gotoPrev}>
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
              <button title="Nästa (↓)" onClick={gotoNext}>
                <FontAwesomeIcon icon={faChevronRight} />
              </button>
            </>
          ) : (
            <>
              {utterance.status !== "complete" && (
                <button
                  aria-label="Redigera"
                  className="text-isof"
                  onClick={() => beginEdit(utterance)}
                >
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              )}
              <button
                aria-label="Flagga"
                className="text-red-500"
                onClick={() => alert("Flag TODO")}
              >
                <FontAwesomeIcon icon={faFlag} />
              </button>
            </>
          )}
        </div>
      )}

      {/* mobile edit bar (kept for shortcut compatibility) */}
      {!readOnly && (
        <MobileEditBar
          visible={Boolean(editingId)}
          disabled={disabledSave}
          onSave={() =>
            editingId && saveEdit(rows.find((x) => x.id === editingId))
          }
          onCancel={discardEdit}
          onPrev={gotoPrev}
          onNext={gotoNext}
        />
      )}
    </article>
  );

  /* ---------- DESKTOP (“≥ sm”) – original table row ---------- */
  const desktopRow = (
    <article
      role="button"
      tabIndex={0}
      data-utt={utterance.id}
      onClick={(e) => {
        if (
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLInputElement ||
          e.target.closest("button, a")
        )
          return;
        handlePlay(utterance.start, utterance.id);
      }}
      onKeyDown={(e) =>
        (e.key === " " || e.key === "Enter") &&
        handlePlay(utterance.start, utterance.id)
      }
      className={classNames(
        "m-0 hidden sm:grid sm:grid-cols-[16px_auto_2fr_1fr_auto] sm:items-center sm:gap-4 min-w-0",
        "px-4 py-3 focus:outline-none focus:ring-2 focus:ring-isof/70 rounded-md",
        isEditing ? "bg-yellow-50" : "",
        utterance.status === "complete" && "opacity-60",
        isActive &&
          "bg-isof/10 ring-2 ring-inset ring-isof border-l-4 border-isof"
      )}
      aria-label={`Uttalande ${index + 1}, starttid ${formatTimestamp(
        utterance.start
      )}`}
    >
      {/* status dot */}
      <span className="flex items-center justify-center">
        <StatusDot status={utterance.status} />
      </span>
      {/* timestamp & play */}
      <span className="flex items-center gap-3">
        <a
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePlay(utterance.start, utterance.id);
          }}
          className="inline-flex items-center justify-center w-9 h-9 rounded-full
                     shrink-0 text-isof hover:bg-isof/10
                     focus-visible:ring-2 focus-visible:ring-isof focus:outline-none"
          aria-label={isCurrentPlaying ? "Pausa uppspelning" : "Spela upp"}
          aria-pressed={isCurrentPlaying}
        >
          <FontAwesomeIcon
            icon={isCurrentPlaying ? faPause : faPlay}
            className="w-4 h-4"
          />
        </a>
        <time
          dateTime={formatTimestamp(utterance.start)}
          className="font-mono text-xs text-gray-500 sm:text-sm"
        >
          {formatTimestamp(utterance.start)}
        </time>
      </span>
      {/* text / textarea */}
      <span className="w-full min-w-0">
        {isEditing ? (
          <textarea
            autoFocus
            rows={1}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onInput={(e) => {
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`;
            }}
            className="w-full p-3 text-base sm:text-sm border rounded
                       focus:ring-isof focus:border-isof resize-none"
          />
        ) : (
          <span className="whitespace-pre-wrap break-all break-words">
            {highlight(utterance.text, query)}
          </span>
        )}
      </span>
      {/* desktop buttons (same as before) */}
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
    </article>
  );

  /* ---------- choose version ---------- */
  return (
    /* <List> needs this element – it’s what gets positioned */
    <div ref={rowRef} style={{ ...style, width: "100%" }}>
      {/* mobile (< sm) */}
      <div className="sm:hidden">{mobileCard}</div>

      {/* desktop (≥ sm) */}
      <div className="hidden sm:block">{desktopRow}</div>
    </div>
  );
});
