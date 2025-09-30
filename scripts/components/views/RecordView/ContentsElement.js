import React, { useMemo, useState, useId } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import ListPlayButton from "../../../features/AudioDescription/ListPlayButton";
import { getAudioTitle } from "../../../utils/helpers";

/**
 * ContentsElement (legacy annotations)
 * - Parses legacy read-only text into structured rows when timestamps exist.
 * - Renders either a DescriptionList-style table OR a compact chip layout
 *   when descriptions are very short (1–5 words).
 * - Falls back to the original text block if no timestamps.
 */
export default function ContentsElement({ data, highlightData = [] }) {
  const {
    contents = "",
    id,
    media = [],
    title,
    archive: { archive_org: archiveOrg, archive } = {},
    year,
    persons,
  } = data || {};

  // Prefer an explicit audio item if present; otherwise fall back to first media entry.
  const audio = useMemo(() => {
    return (
      media.find((m) => (m?.type || "").toLowerCase().includes("audio")) ||
      media[0]
    );
  }, [media]);

  // Detect timestamps like (MM:SS) or (H:MM:SS)
  const hasTimestamps = useMemo(
    () => /\((?:\d{1,2}:)?\d{1,2}:\d{2}\)/.test(contents || ""),
    [contents]
  );

  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  if (!contents) return null;

  const audioTitle = useMemo(() => {
    if (!audio) return title;
    return getAudioTitle(
      title,
      contents,
      archiveOrg,
      archive,
      audio?.source,
      year,
      persons
    );
  }, [
    title,
    contents,
    archiveOrg,
    archive,
    audio?.source,
    year,
    persons,
    audio,
  ]);

  /** Helpers */
  const toSeconds = (label) => {
    // Accept MM:SS or H:MM:SS
    const parts = label.split(":").map((n) => Number(n));
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  const pad2 = (n) => String(n).padStart(2, "0");

  /**
   * Parse legacy "free text with (time)" into rows:
   * [{ start: 'M:SS' | 'H:MM:SS', seconds: number, text: '...' }]
   */
  const legacyRows = useMemo(() => {
    if (!hasTimestamps) return [];

    const text = contents || "";
    const re = /\((?:(\d{1,2}):)?(\d{1,2}):(\d{2})\)/g; // (H:MM:SS) or (MM:SS)
    const matches = [];
    let m;
    while ((m = re.exec(text)) !== null) matches.push(m);

    const rows = matches.map((match, i) => {
      const [full, hStr, mStr, sStr] = match;
      const startIdx = match.index;
      const endIdx = startIdx + full.length;
      const nextStart =
        i + 1 < matches.length ? matches[i + 1].index : text.length;

      const h = hStr ? Number(hStr) : null;
      const mm = Number(mStr);
      const ss = Number(sStr);
      const label =
        h !== null ? `${h}:${pad2(mm)}:${pad2(ss)}` : `${mm}:${pad2(ss)}`;

      // Description is everything after the closing paren until next timestamp
      const raw = text.slice(endIdx, nextStart).trim();
      const desc = raw.replace(/\s+/g, " ").trim(); // collapse whitespace to one line

      return { start: label, seconds: toSeconds(label), text: desc };
    });

    return rows.sort((a, b) => a.seconds - b.seconds);
  }, [contents, hasTimestamps]);

  /** Auto-compact when entries are very short (best UX for 1–5 words) */
  const isCompact = useMemo(() => {
    if (!legacyRows.length) return false;
    const totalLen = legacyRows.reduce(
      (sum, r) => sum + (r.text || "").length,
      0
    );
    const avgLen = totalLen / legacyRows.length;
    return legacyRows.length <= 50 && avgLen <= 18; // tune as needed
  }, [legacyRows]);

  /** Renderers */
  const HeaderBand = () => (
    <div className="flex items-center justify-between bg-gray-200 rounded-t-md px-4 py-3">
      <span className="font-semibold">Innehållsbeskrivningar</span>
    </div>
  );

  const RenderTable = () => {
    if (!legacyRows.length) return null;
    return (
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full table-auto border-collapse text-xs mb-0">
          <thead>
            <tr>
              <th colSpan={3} className="p-0 text-left" scope="colgroup">
                <HeaderBand />
              </th>
            </tr>
            <tr className="border-b border-gray-300">
              <th scope="col" className="py-3 px-4 w-40">
                Starttid
              </th>
              <th scope="col" className="py-3 px-4">
                Beskrivning
              </th>
              {/* keep a thin "spacer" th for alignment parity with the editable list */}
              <th scope="col" className="py-3 px-4 text-right w-10"></th>
            </tr>
          </thead>
          <tbody>
            {legacyRows.map((row, index) => {
              const isHighlighted = Array.isArray(highlightData)
                ? highlightData.some((hit) => hit?._source?.start === row.start)
                : false;

              return (
                <tr
                  key={`${row.start}-${index}`}
                  className="odd:bg-white even:bg-gray-50 border-b last:border-b-0 border-gray-200"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      {audio ? (
                        <ListPlayButton
                          media={audio}
                          recordId={id}
                          recordTitle={audioTitle}
                          startTime={row.seconds}
                          isSubList
                        />
                      ) : (
                        <span className="w-3 h-3 inline-block" />
                      )}
                      <span className="ml-2 font-mono tabular-nums">
                        {row.start}
                      </span>
                    </div>
                  </td>
                  <td
                    className={`py-3 px-4 ${
                      isHighlighted ? "bg-yellow-200" : ""
                    }`}
                  >
                    <span className="truncate block" title={row.text}>
                      {row.text || (
                        <span className="text-gray-500 italic">—</span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right" />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /** Compact chip layout for ultra-short notes */
  const RenderCompact = () => {
    if (!legacyRows.length) return null;
    return (
      <div className="rounded-md border border-gray-200">
        <HeaderBand />
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {legacyRows.map((row, i) => {
              const isHighlighted = Array.isArray(highlightData)
                ? highlightData.some((hit) => hit?._source?.start === row.start)
                : false;

              return (
                <div
                  key={`${row.start}-${i}`}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs
                    ${
                      isHighlighted
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  title={row.text}
                >
                  {audio ? (
                    <ListPlayButton
                      media={audio}
                      recordId={id}
                      recordTitle={audioTitle}
                      startTime={row.seconds}
                      isSubList
                    />
                  ) : (
                    <span className="w-3 h-3 inline-block" />
                  )}
                  <span className="font-mono tabular-nums">{row.start}</span>
                  <span className="text-gray-700 whitespace-nowrap">
                    {row.text || "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // Fallback renderer: the original preformatted text (no timestamps detected)
  const RenderPlain = () => (
    <div className="mt-2 whitespace-pre-line text-sm leading-relaxed">
      {contents}
    </div>
  );

  return (
    <section className="mb-4">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex items-center gap-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        onClick={() => setExpanded((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded((v) => !v);
          }
        }}
      >
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
        <span>
          <b>Beskrivning av innehållet</b>
        </span>
      </button>

      <div id={contentId} className={`mt-2 ${expanded ? "" : "hidden"}`}>
        {hasTimestamps ? (
          isCompact ? (
            <RenderCompact />
          ) : (
            <RenderTable />
          )
        ) : (
          <RenderPlain />
        )}
      </div>
    </section>
  );
}

ContentsElement.propTypes = {
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    contents: PropTypes.string,
    title: PropTypes.string,
    year: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    persons: PropTypes.any,
    archive: PropTypes.shape({
      archive_org: PropTypes.string,
      archive: PropTypes.string,
    }),
    media: PropTypes.arrayOf(
      PropTypes.shape({
        source: PropTypes.string,
        type: PropTypes.string,
      })
    ),
  }).isRequired,
  highlightData: PropTypes.array,
};
