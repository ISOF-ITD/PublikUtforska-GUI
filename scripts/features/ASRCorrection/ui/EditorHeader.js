import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faDownload } from "@fortawesome/free-solid-svg-icons";
import FilterButton from "./FilterButton";

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
      className="bg-white p-6 mb-6 shadow rounded-lg flex flex-col gap-2
                 sticky top-0 z-30 backdrop-blur supports-backdrop-blur:bg-white/90"
    >
      <h1 className="text-2xl font-semibold">Transkribering</h1>
      <p className="text-gray-600">{audioTitle}</p>
      <div>
        <strong>OBS!</strong> Automatisk transkription – kan innehålla fel
      </div>

      {/* progress bar */}
      <div
        role="progressbar"
        aria-valuenow={progress.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuetext={`${progress.percent}% klart`}
        className="w-full h-2 bg-gray-200 rounded overflow-hidden"
      >
        <div
          className="bg-gradient-to-r from-isof to-isof/60 h-full transition-all"
          style={{ width: `${progress.percent}%` }}
        />
      </div>

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
              label={`Behöver granskas (${counts.needsWork})`}
              value="needs-work"
              filter={filter}
              setFilter={setFilter}
            />
            <FilterButton
              label={`Färdigt (${counts.completed})`}
              value="completed"
              filter={filter}
              setFilter={setFilter}
            />
          </div>
        )}
      </div>

      <div className="flex gap-2 items-center">
        <input
          type="search"
          autoFocus
          aria-label="Sök i transkriptionen"
          placeholder="Sök i texten…"
          className="mt-3 max-w-xs border rounded px-3 py-1 text-sm"
          value={queryRaw}
          onChange={(e) => setQueryRaw(e.target.value)}
        />
        {queryRaw && (
          <span className="ml-2 text-sm text-gray-500">
            {visibleUtterances.length} träffar
          </span>
        )}
      </div>

      {/* actions */}
      <div className="flex justify-end gap-2 text-sm text-gray-600">
        <label className="flex items-center gap-2 text-sm select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-isof"
            checked={followActive}
            onChange={(e) => setFollowActive(e.target.checked)}
          />
          Följ texten
        </label>

        {/* copy / download */}
        <TextActions
          visibleUtterances={visibleUtterances}
          audioTitle={audioTitle}
        />
      </div>
    </header>
  );
}

function TextActions({ visibleUtterances, audioTitle }) {
  const download = (ext, mime, builder) => {
    const blob = new Blob([builder()], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${audioTitle || "transcript"}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        title="Kopiera text till urklipp"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(
              visibleUtterances.map((u) => u.text).join("\n\n")
            );
            alert("Texten har kopierats!");
          } catch {
            alert(
              "Kunde inte kopiera – prova den nya 'Ladda ned fil'-knappen."
            );
          }
        }}
        className="flex gap-1 items-center cursor-pointer hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faCopy} />
        Kopiera text
      </button>

      {/* .txt */}
      <button
        onClick={() =>
          download("txt", "text/plain;charset=utf-8", () =>
            visibleUtterances.map((u) => u.text).join("\r\n\r\n")
          )
        }
        className="flex gap-1 items-center cursor-pointer hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faDownload} />
        Hämta .txt
      </button>

      {/* .vtt */}
      <button
        onClick={() =>
          download("vtt", "text/vtt;charset=utf-8", () => {
            const pad = (n, size = 2) => String(n).padStart(size, "0");
            const ts = (s, sep = ".") => {
              const h = pad(Math.floor(s / 3600));
              const m = pad(Math.floor((s % 3600) / 60));
              const sc = pad(Math.floor(s % 60));
              const ms = pad(Math.round((s % 1) * 1000), 3);
              return `${h}:${m}:${sc}${sep}${ms}`;
            };
            return [
              "WEBVTT",
              "",
              ...visibleUtterances.map(
                (u, i) => `${i + 1}
${ts(u.start, ".")} --> ${ts(u.end, ".")}
${u.text}
`
              ),
            ].join("\n");
          })
        }
        className="flex gap-1 items-center cursor-pointer hover:text-isof focus-visible:ring-2 focus-visible:ring-isof"
      >
        <FontAwesomeIcon icon={faDownload} />
        Hämta .vtt
      </button>
    </>
  );
}
