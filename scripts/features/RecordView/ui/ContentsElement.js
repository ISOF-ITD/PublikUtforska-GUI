import React, { useMemo, useState, useId, useEffect } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import ListPlayButton from "../../AudioDescription/ListPlayButton";
import { getAudioTitle } from "../../../utils/helpers";
import {
  TIME_ANY_RE,
  extractRowsFromContents,
  buildMediaIndex,
} from "../utils/legacyContentsParser";


/**
 * ContentsElement (legacy annotations)
 * - Parses legacy read-only text into structured rows when *recording tags* and/or timestamps exist.
 * - Supports blocks like:  "Gr3702:a2 00:00 Foo; 00:57 Bar | Bd1234:b 00:00 Baz …"
 * - Renders either a DescriptionList-style table OR a compact chip layout
 *   when descriptions are very short (1–5 words).
 * - Falls back to the original text block if nothing structured detected.
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

  // Build a per-recording media index so rows can play the *right* file.
  const mediaIndex = useMemo(() => buildMediaIndex(media), [media]);

  // Detect if the contents has timestamps.
  const hasStructured = useMemo(() => {
    const text = contents || "";
    return TIME_ANY_RE.test(text);
  }, [contents]);

  const [expanded, setExpanded] = useState(false);
  const contentId = useId();

  

  const defaultAudio = useMemo(() => {
    return (
      media.find((m) => (m?.type || "").toLowerCase().includes("audio")) ||
      media[0]
    );
  }, [media]);

  const audioTitle = useMemo(() => {
    // Keep title stable; using defaultAudio for the helper is fine.
    const src = defaultAudio?.source;
    return getAudioTitle(
      title,
      contents,
      archiveOrg,
      archive,
      src,
      year,
      persons
    );
  }, [title, contents, archiveOrg, archive, defaultAudio, year, persons]);

  /** Parse legacy multi-recording text into rows */
  const rows = useMemo(() => {
    if (!hasStructured) return [];
    return extractRowsFromContents(contents, mediaIndex);
  }, [contents, hasStructured, mediaIndex]);

  /** Auto-compact when entries are very short (best UX for 1–5 words) */
  const isCompact = useMemo(() => {
    if (!rows.length) return false;
    const totalLen = rows.reduce((sum, r) => sum + (r.text || "").length, 0);
    const avgLen = totalLen / rows.length;
    return rows.length <= 50 && avgLen <= 18;
  }, [rows]);

  const rowCount = useMemo(() => {
    if (hasStructured) return rows.length;
    // rough line count fallback for plain text
    return (contents || "").trim().split(/\n+/).filter(Boolean).length;
  }, [hasStructured, rows, contents]);

  /** Renderers */
  const HeaderBand = () => (
    <div className="flex items-center justify-between bg-gray-200 rounded-t-md px-4 py-3">
      <span className="font-semibold">Innehållsbeskrivningar</span>
    </div>
  );

  const RecordingBadge = ({ tag }) => (
    <span
      className="text-[11px] rounded bg-gray-100 px-1 text-gray-600 uppercase"
      title={`Inspelning ${tag.toUpperCase()}`}
      aria-label={`Inspelning ${tag.toUpperCase()}`}
    >
      {tag.toUpperCase()}
    </span>
  );

  const RenderTable = () => {
    if (!rows.length) return null;
    return (
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full table-auto border-collapse text-xs mb-0">
          <thead>
            <tr>
              <th colSpan={3} className="p-0 text-left" scope="colgroup">
                <HeaderBand />
              </th>
            </tr>
            <tr className="border-b border-gray-300 flex">
              <th scope="col" className="py-3 px-4 w-12">
                Starttid
              </th>
              <th scope="col" className="py-3 px-4">
                Beskrivning
              </th>
              {/* spacer th for alignment parity with editable list */}
              <th scope="col" className="py-3 px-4 text-right w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isHighlighted = Array.isArray(highlightData)
                ? highlightData.some((hit) => hit?._source?.start === row.start)
                : false;

              const rowMedia = row.media || defaultAudio;

              return (
                <tr
                  key={`${row.tag || "_"}-${row.start}-${index}`}
                  className="odd:bg-white even:bg-gray-50 border-b last:border-b-0 border-gray-200 flex w-full"
                >
                  <td className="py-3 px-4 w-12">
                    <div className="flex items-center">
                      {rowMedia ? (
                        <ListPlayButton
                          media={rowMedia}
                          recordId={id}
                          ariaLabel={`${audioTitle} – spela från ${row.start}`}
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
                    <span
                      className="truncate block break-words"
                      title={row.text}
                    >
                      {row.tag && <RecordingBadge tag={row.tag} />}{" "}
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
    if (!rows.length) return null;
    return (
      <div className="rounded-md border border-gray-200">
        <HeaderBand />
        <div className="p-3">
          <div className="flex flex-wrap gap-2">
            {rows.map((row, i) => {
              const isHighlighted = Array.isArray(highlightData)
                ? highlightData.some((hit) => hit?._source?.start === row.start)
                : false;
              const rowMedia = row.media || defaultAudio;

              return (
                <div
                  key={`${row.tag || "_"}-${row.start}-${i}`}
                  className={`group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${
                    isHighlighted
                      ? "border-yellow-400 bg-yellow-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                  title={row.text}
                >
                  {rowMedia ? (
                    <ListPlayButton
                      media={rowMedia}
                      recordId={id}
                      recordTitle={audioTitle}
                      startTime={row.seconds}
                      isSubList
                    />
                  ) : (
                    <span className="w-3 h-3 inline-block" />
                  )}
                  <span className="font-mono tabular-nums">{row.start}</span>
                  {row.tag && <RecordingBadge tag={row.tag} />}
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

  // Fallback renderer: the original preformatted text
  const RenderPlain = () => (
    <div className="mt-2 whitespace-pre-line text-sm leading-relaxed">
      {contents}
    </div>
  );

  const storageKey = `rv:${data?.id || "unknown"}:contents:expanded`;
  // persist expanded state per record/section
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved !== null) setExpanded(saved === "1");
    return () => {}; // no-op
  }, []); // run once

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  if (!contents) return null;

  return (
    <section className="mb-4">
      <button
        type="button"
        title={expanded ? "Dölj" : "Visa"}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex items-center gap-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        onClick={() => setExpanded((v) => !v)}
      >
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
        <span>
          <b>Beskrivning av innehållet</b>{" "}
          <span className="text-gray-500">({rowCount})</span>
        </span>
      </button>

      <div
        id={contentId}
        className={`mt-2 p-4 shadow-lg rounded-md ${expanded ? "" : "hidden"}`}
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        {hasStructured ? (
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
