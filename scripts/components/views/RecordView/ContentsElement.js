import React, { useMemo, useState, useId, useEffect } from "react";
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

/** ------------------------------
 * Parsing utilities (prefix-agnostic)
 * -------------------------------*/

// Match things like Gr3702:a2, BD1234:b, ulm12:a, etc. (prefix may be letters incl. nordic chars)
const REC_TAG_ANY_RE =
  /\b([A-Za-zÅÄÖåäö]{1,6})\s?_?(\d{2,6})(?::([a-z])([0-9]{0,2}))?/;
// Times like 00:57 or 1:02:03; also allow optional surrounding parentheses
const TIME_ANY_RE = /\(?((?:\d{1,2}:)?\d{1,2}:\d{2})\)?/;

function toSeconds(label) {
  const clean = label.replace(/[()]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Normalize tag parts to user-visible (e.g., "GR3702:a2") and to a key (e.g., "gr3702a2")
function formatTag({ prefix, num, side, take }) {
  const showSide = side ? `:${side}${take || ""}` : "";
  return `${prefix}${num}${showSide}`;
}
function tagKey({ prefix, num, side, take }) {
  return `${prefix}${num}${side || ""}${take || ""}`.toLowerCase();
}

function parseRecTag(str) {
  const m = str.match(REC_TAG_ANY_RE);
  if (!m) return null;
  const [, prefixRaw, num, side, take] = m;
  const prefix = prefixRaw.toUpperCase();
  return { prefix, num, side: side || null, take: take || null };
}

/**
 * Extract rows from legacy contents text.
 * Produces: { tag: 'GR3702:a2', start: 'M:SS'|'H:MM:SS', seconds: number, text, media? }
 */
function extractRowsFromContents(contents, mediaIndex) {
  const text = (contents || "").replace(/\u00A0/g, " "); // NBSP -> space

  // Split candidate *recording* blocks primarily on "|". If there are no bars, treat the whole string as one block.
  const blocks = text
    .split("|")
    .map((b) => b.trim())
    .filter(Boolean);
  const rows = [];

  let carryTag = null; // In case a block starts with time straight away (rare)

  for (const block of blocks) {
    // Find a recording tag anywhere early in the block
    const tagParts = parseRecTag(block);
    let tag = tagParts ? formatTag(tagParts) : carryTag;
    let key = tagParts
      ? tagKey(tagParts)
      : carryTag
      ? carryTag.replace(/[^a-z0-9]/gi, "").toLowerCase()
      : null;

    // Remove the matched tag text from the block head for easier time parsing
    let rest = tagParts ? block.replace(REC_TAG_ANY_RE, "").trim() : block;

    // If the block has no times at all, keep as a single 0:00 row
    const timeMatches = [...rest.matchAll(new RegExp(TIME_ANY_RE, "g"))];
    if (timeMatches.length === 0) {
      const label = "0:00";
      rows.push({
        tag,
        start: label,
        seconds: 0,
        text: rest.replace(/^[;:,\-\s]+/, "").trim(),
        media: pickMediaForTag(key, mediaIndex),
      });
      carryTag = tag; // carry forward until the next explicit tag
      continue;
    }

    // Walk through each time and grab text until the next time (or end)
    let cursor = 0;
    for (let i = 0; i < timeMatches.length; i++) {
      const m = timeMatches[i];
      const matchText = m[1]; // the time label captured by TIME_ANY_RE
      const startIdx = m.index ?? 0;

      // Text between previous cursor and this time label is usually separators
      // Push entry using text until the next time
      const label = normalizeLabel(matchText);
      const endIdx =
        i + 1 < timeMatches.length ? timeMatches[i + 1].index : rest.length;

      // Description is everything after the matched time up to the next time
      const afterTimeIdx = startIdx + (m[0]?.length || matchText.length);
      const raw = rest.slice(afterTimeIdx, endIdx).trim();
      const desc = collapseWhitespace(raw.replace(/^[;:,\-\s]+/, ""));

      rows.push({
        tag,
        start: label,
        seconds: toSeconds(label),
        text: desc,
        media: pickMediaForTag(key, mediaIndex),
      });

      cursor = endIdx;
    }

    carryTag = tag; // next block inherits last tag until overridden
  }

  // Sort by tag (to keep recordings grouped) then by time within tag
  return rows.sort((a, b) => {
    const ta = a.tag || "";
    const tb = b.tag || "";
    if (ta === tb) return a.seconds - b.seconds;
    return ta.localeCompare(tb, "sv");
  });
}

function normalizeLabel(label) {
  const clean = label.replace(/[()]/g, "");
  const parts = clean.split(":").map(Number);
  if (parts.length === 2) return `${parts[0]}:${pad2(parts[1])}`;
  if (parts.length === 3)
    return `${parts[0]}:${pad2(parts[1])}:${pad2(parts[2])}`;
  return clean;
}

function collapseWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Map media items by likely recording keys extracted from their `source`.
 * Keys use compact lowercase form without separators (e.g., gr3702a2, gr3702a, gr3702).
 */
function buildMediaIndex(media = []) {
  const map = new Map();
  for (const m of media) {
    const src = (m?.source || "").toLowerCase();
    // Accept patterns like gr_3702a2, gr3702a2, ulm1234b, bd 9999, etc.
    const mm = src.match(
      /([a-zåäö]{1,6})[\s_]?(\d{2,6})([a-z])?([0-9]{0,2})?/i
    );
    if (!mm) continue;
    const prefix = (mm[1] || "").toLowerCase();
    const num = mm[2] || "";
    const side = (mm[3] || "").toLowerCase();
    const take = (mm[4] || "").toLowerCase();

    const keys = new Set();
    if (prefix && num && side && take)
      keys.add(`${prefix}${num}${side}${take}`);
    if (prefix && num && side) keys.add(`${prefix}${num}${side}`);
    if (prefix && num) keys.add(`${prefix}${num}`);

    for (const k of keys) if (!map.has(k)) map.set(k, m);
  }
  return map;
}

function pickMediaForTag(tagKeyMaybe, mediaIndex) {
  if (!tagKeyMaybe) return null;
  const key = tagKeyMaybe.toLowerCase();
  // Try exact take, then side, then base number
  if (mediaIndex.has(key)) return mediaIndex.get(key);
  // try without take (strip trailing digits)
  const sideMaybe = key.replace(/\d+$/, "");
  if (mediaIndex.has(sideMaybe)) return mediaIndex.get(sideMaybe);
  // try base number (strip trailing side)
  const baseMaybe = sideMaybe.replace(/[a-z]$/, "");
  if (mediaIndex.has(baseMaybe)) return mediaIndex.get(baseMaybe);
  return null;
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
