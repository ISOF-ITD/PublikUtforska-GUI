import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faDownload,
  faInfoCircle,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import FilterButton from "./FilterButton";
import { toastError, toastOk } from "../../../utils/toast";

/* ─────────────────  HEADER CARD  ───────────────── */
export default function EditorHeader({
  audioTitle,
  progress,
  readOnly,
  counts,
  filterState,
  searchState,
  visibleUtterances,
  followActive,
  setFollowActive,
}) {
  const { filter, setFilter } = filterState;
  const { queryRaw, setQueryRaw } = searchState;

  return (
    <header
      className="bg-white p-4 sm:p-6 mb-6 shadow rounded-lg sticky top-0 z-30
                 backdrop-blur supports-backdrop-blur:bg-white/90
                 flex flex-col gap-6 divide-y divide-gray-200"
    >
      {/* ─── Title ─────────────────────────────────── */}
      <section className="first:pt-0 space-y-1">
        <h1 className="text-2xl sm:text-3xl font-semibold break-words">
          {audioTitle || "Transkribering"}
        </h1>

        <p className="flex items-center gap-2 text-orange-600">
          <FontAwesomeIcon icon={faInfoCircle} />
          OBS! Automat­genererad text – kan innehålla fel
        </p>
      </section>

      {/* ─── Progress ──────────────────────────────── */}
      <section className="pt-1">
        <span
          className="block font-semibold text-gray-500 mb-2"
          aria-live="polite"
        >
          Färdigt&nbsp;{progress.complete}/{progress.total}
          <span className="sr-only"> rader</span> ({progress.percent}%)
        </span>
        <progress
          className="block w-full h-2 rounded-full overflow-hidden !bg-gray-200"
          value={progress.percent}
          max={100}
        />
        <div
          className="h-full bg-gradient-to-r from-isof to-isof/60 transition-[width] duration-300"
          style={{ width: `${progress.percent}%` }}
        />
      </section>

      {/* ─── Filter & Search ───────────────────────── */}
      <section className="pt-4 !flex !flex-col gap-4 sm:grid sm:grid-cols-[auto_1fr] sm:items-start">
        {/* Filters */}
        {!readOnly && (
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Filter
            </span>
            <div
              className="flex gap-2 flex-nowrap overflow-x-auto pb-1
                         sm:flex-wrap sm:overflow-visible
                         -mx-4 px-4 sm:mx-0 sm:px-0"
            >
              <FilterButton
                label="Alla"
                value="all"
                {...{ filter, setFilter }}
              />
              <FilterButton
                label={`Behöver granskas (${counts.needsWork})`}
                value="needs-work"
                {...{ filter, setFilter }}
              />
              <FilterButton
                label={`Färdigt (${counts.completed})`}
                value="completed"
                {...{ filter, setFilter }}
              />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <span className="hidden sm:block text-xs font-semibold text-gray-500 uppercase mb-1">
            Sök
          </span>

          {/* search icon */}
          <FontAwesomeIcon
            icon={faSearch}
            className="pointer-events-none absolute right-3 top-1/4 lg:top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          />

          <input
            type="search"
            id="transcript-search"
            placeholder="Sök i texten…"
            aria-label="Sök i transkriptionen"
            value={queryRaw}
            onChange={(e) => setQueryRaw(e.target.value)}
            className="w-full pl-10 pr-14 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-isof"
          />

          {/* hit-count pill */}
          {queryRaw && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2
                         text-xs px-1.5 py-0.5 rounded-full
                         bg-gray-200 text-gray-600"
            >
              {visibleUtterances.length}
            </span>
          )}
        </div>
      </section>

      {/* ─── Actions ───────────────────────────────── */}
      <section
        className="pt-4 flex flex-col sm:flex-row
                   justify-between sm:justify-end gap-4 text-sm text-gray-600"
      >
        <label className="flex items-center gap-2 select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-isof"
            checked={followActive}
            onChange={(e) => setFollowActive(e.target.checked)}
          />
          Följ texten
        </label>

        <TextActions {...{ visibleUtterances, audioTitle }} />
      </section>
    </header>
  );
}

/* ─────────────────  COPY / DOWNLOAD BUTTONS  ───────────────── */
function TextActions({ visibleUtterances, audioTitle }) {
  const download = (ext, mime, builder) => {
    const blob = new Blob([builder()], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: `${audioTitle || "transcript"}.${ext}`,
    });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toastOk(`Laddade ned .${ext}-filen`);
  };

  /* — render — */
  return (
    <div className="flex gap-3 flex-wrap">
      {/* copy */}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              visibleUtterances.map((u) => u.text).join("\n\n")
            );
            toastOk("Texten ligger på urklipp!");
          } catch {
            toastError("Kunde inte kopiera – prova 'Ladda ned fil'-knappen.");
          }
        }}
        className="flex items-center gap-1 hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faCopy} />
        Kopiera
      </button>

      {/* .txt */}
      <button
        onClick={() =>
          download("txt", "text/plain;charset=utf-8", () =>
            visibleUtterances.map((u) => u.text).join("\r\n\r\n")
          )
        }
        className="flex items-center gap-1 hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faDownload} />
        .txt
      </button>

      {/* .vtt */}
      <button
        onClick={() =>
          download("vtt", "text/vtt;charset=utf-8", () => {
            const pad = (n, s = 2) => String(n).padStart(s, "0");
            const ts = (sec) =>
              `${pad(sec / 3600)}:${pad((sec % 3600) / 60)}:${pad(
                sec % 60
              )}.${pad(Math.round((sec % 1) * 1000), 3)}`;

            return [
              "WEBVTT\n",
              ...visibleUtterances.map(
                (u, i) =>
                  `${i + 1}\n${ts(u.start)} --> ${ts(u.end)}\n${u.text}\n`
              ),
            ].join("\n");
          })
        }
        className="flex items-center gap-1 hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faDownload} />
        .vtt
      </button>
    </div>
  );
}
