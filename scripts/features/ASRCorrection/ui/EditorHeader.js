import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCopy,
  faDownload,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";
import FilterButton from "./FilterButton";

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
      className="bg-white p-6 mb-6 shadow rounded-lg sticky top-0 z-30
                 backdrop-blur supports-backdrop-blur:bg-white/90
                 flex flex-col gap-6 divide-y divide-gray-200"
    >
      {/* ─── Title ─────────────────────────────────── */}
      <section className="first:pt-0">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          {audioTitle || "Transkribering"}
        </h1>
        <p className="mt-1 text-gray-600">
          <strong className="text-red-600">OBS!</strong> Automatisk
          transkription – kan innehålla fel
        </p>
      </section>

      {/* ─── Progress ──────────────────────────────── */}
      <section className="pt-1">
        <span className="block font-semibold text-gray-500 mb-2">
          Färdigt&nbsp;{progress.complete}/{progress.total}
          <span className="sr-only"> rader</span> ({progress.percent}%)
        </span>
        <div
          role="progressbar"
          aria-valuenow={progress.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${progress.percent}% klart`}
          className="h-2 w-full rounded-full bg-gray-200 overflow-hidden"
        >
          <div
            className="h-full bg-gradient-to-r from-isof to-isof/60 transition-[width] duration-300"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </section>

      {/* ─── Filter & Search ───────────────────────── */}
      <section className="pt-4 flex flex-col sm:flex-row sm:items-end gap-4">
        {/* Filters */}
        {readOnly && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              Filter
            </span>
            <div className="flex gap-2">
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
        <div className="relative flex-1 max-w-sm">
          <span className="hidden sm:block text-xs font-semibold text-gray-500 uppercase mb-1">
            Sök
          </span>
          <FontAwesomeIcon
            icon={faSearch}
            className="pointer-events-none absolute inset-y-0 right-3 my-auto pt-4 h-4 w-4 text-gray-400"
          />
          <input
            type="search"
            placeholder="Sök i texten…"
            aria-label="Sök i transkriptionen"
            value={queryRaw}
            onChange={(e) => setQueryRaw(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm
                       focus:outline-none focus:ring-2 focus:ring-isof"
          />
          {queryRaw && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              {visibleUtterances.length}
            </span>
          )}
        </div>
      </section>

      {/* ─── Actions ───────────────────────────────── */}
      <section className="pt-4 flex flex-wrap justify-between sm:justify-end gap-4 text-sm text-gray-600">
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
  };

  return (
    <div className="flex gap-3">
      {/* copy */}
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              visibleUtterances.map((u) => u.text).join("\n\n")
            );
            alert("Texten är kopierad till urklipp");
          } catch {
            alert("Kunde inte kopiera – prova 'Ladda ned fil'-knappen.");
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
            const pad = (n, size = 2) => String(n).padStart(size, "0");
            const ts = (s) => {
              const h = pad(Math.floor(s / 3600));
              const m = pad(Math.floor((s % 3600) / 60));
              const sc = pad(Math.floor(s % 60));
              const ms = pad(Math.round((s % 1) * 1000), 3);
              return `${h}:${m}:${sc},${ms}`;
            };
            return [
              "WEBVTT",
              "",
              ...visibleUtterances.map(
                (u, i) => `${i + 1}
${ts(u.start)} --> ${ts(u.end)}
${u.text}
`
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
