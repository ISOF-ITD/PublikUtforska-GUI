import { useEffect, useId, useState } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import sanitizeHtml from 'sanitize-html';
import ListPlayButton from "../../AudioDescription/ListPlayButton";
import useLegacyContents from "../hooks/useLegacyContents";
import highlightCompleteHtml from '../utils/highlightCompleteHtml';

/** Renderers */
const renderHeaderBand = () => (
  <div className="flex items-center justify-between bg-surface-hover rounded-t-md px-4 py-3 text-body">
    <span className="font-semibold">Innehållsbeskrivningar</span>
  </div>
);

const renderRecordingBadge = (tag) => (
  <span
    className="text-[11px] rounded bg-surface-hover px-1 text-muted uppercase"
    title={`Inspelning ${tag.toUpperCase()}`}
    aria-label={`Inspelning ${tag.toUpperCase()}`}
  >
    {tag.toUpperCase()}
  </span>
);

const highlightedChipClassName = [
  'border-[var(--color-highlight)]',
  'bg-[var(--color-highlight)]',
  'text-[var(--color-highlight-text)]',
].join(' ');
const defaultChipClassName = 'border-border bg-surface hover:bg-surface-hover';
const sanitizeHighlightConfig = {
  allowedTags: ['b', 'i', 'em', 'strong', 'br', 'span'],
  allowedAttributes: {
    span: ['class'],
  },
  allowedClasses: {
    span: ['highlight'],
  },
};

const toSafeHighlightHtml = (html) => sanitizeHtml(
  String(html ?? '').replace(/\r\n/g, '\n').replace(/\n/g, '<br />'),
  sanitizeHighlightConfig,
);

const renderTable = ({ rows, highlightData, defaultAudio, id, audioTitle }) => {
  if (!rows.length) return null;

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-surface text-body">
      <table className="w-full table-auto border-collapse text-xs mb-0">
        <caption className="text-left bg-surface-hover px-4 py-3 font-semibold text-body">Innehållsbeskrivningar</caption>
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="py-3 px-4 w-12">
              Starttid
            </th>
            <th scope="col" className="py-3 px-4">
              Beskrivning
            </th>
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
                className="odd:bg-surface even:bg-surface-muted border-b last:border-b-0 border-border"
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
                  <span className="truncate block break-words" title={row.text}>
                    {row.tag && renderRecordingBadge(row.tag)}{" "}
                    {row.text || (
                      <span className="text-subtle italic">—</span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/** Compact chip layout for ultra-short notes */
const renderCompact = ({
  rows,
  highlightData,
  defaultAudio,
  id,
  audioTitle,
}) => {
  if (!rows.length) return null;

  return (
    <div className="rounded-md border border-border bg-surface text-body">
      {renderHeaderBand()}
      <div className="p-3">
        <ul className="!m-0 !p-0 !list-none flex flex-wrap gap-2">
          {rows.map((row, i) => {
            const isHighlighted = Array.isArray(highlightData)
              ? highlightData.some((hit) => hit?._source?.start === row.start)
              : false;
            const rowMedia = row.media || defaultAudio;

            return (
              <li
                key={`${row.tag || "_"}-${row.start}-${i}`}
                className={`group inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs ${
                  isHighlighted
                    ? highlightedChipClassName
                    : defaultChipClassName
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
                {row.tag && renderRecordingBadge(row.tag)}
                <span className="text-body whitespace-nowrap">
                  {row.text || '—'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

// Fallback renderer: the original preformatted text
const renderPlain = (contents, highlightHtml) => {
  const fullHtml = String(contents).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanHighlightHtml = highlightHtml?.length
    ? toSafeHighlightHtml(highlightCompleteHtml(fullHtml, highlightHtml))
    : '';

  if (cleanHighlightHtml) {
    return (
      <div
        className="whitespace-pre-line text-sm leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: cleanHighlightHtml,
        }}
      />
    );
  }

  return (
    <div className="whitespace-pre-line text-sm leading-relaxed">
      {contents}
    </div>
  );
};

/**
 * ContentsElement (legacy annotations)
 * - Parses legacy read-only text into structured rows when *recording tags* and/or timestamps exist.
 * - Supports blocks like:  "Gr3702:a2 00:00 Foo; 00:57 Bar | Bd1234:b 00:00 Baz ..."
 * - Renders either a DescriptionList-style table OR a compact chip layout
 *   when descriptions are very short (1-5 words).
 * - Falls back to the original text block if nothing structured detected.
 */
export default function ContentsElement({
  data,
  highlightData = [],
  highlightHtml = '',
}) {
  const {
    contents = "",
    id,
    media = [],
    title,
    archive: { archive_org: archiveOrg, archive } = {},
    year,
    persons,
  } = data || {};

  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const hasHighlight = Boolean(highlightHtml?.length)
    || (Array.isArray(highlightData) && highlightData.length > 0);

  const { hasStructured, rows, isCompact, rowCount, defaultAudio, audioTitle } =
    useLegacyContents({
      contents,
      media,
      title,
      archiveOrg,
      archive,
      year,
      persons,
    });

  const storageKey = `rv:${data?.id || "unknown"}:contents:expanded`;
  // persist expanded state per record/section

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (hasHighlight) setExpanded(true);
    else if (saved !== null) setExpanded(saved === "1");
    return () => {}; // no-op
  }, [hasHighlight, storageKey]);

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  if (!contents) return null;

  return (
    <div className="min-w-0">
      <dt id={`${contentId}-label`} className="!m-0 text-sm font-semibold text-muted">
        <button
          type="button"
          title={expanded ? "Dölj" : "Visa"}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="!m-0 !flex !h-auto min-h-11 w-full items-center justify-start gap-3 !rounded-none !border-0 !bg-transparent !p-0 !text-left !text-sm !font-semibold !text-muted !leading-normal ![font-family:inherit] !whitespace-normal !normal-case !tracking-normal hover:!text-link hover:underline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          onClick={() => setExpanded((v) => !v)}
        >
          <span className="min-w-0 break-words">
            Beskrivning av innehållet{" "}
            <span className="text-subtle">({rowCount})</span>
          </span>
          <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} aria-hidden="true" focusable="false" className="w-3 shrink-0" />
        </button>
      </dt>

      <dd
        id={contentId}
        className="m-0 pt-2 pb-2 min-[650px]:ml-[10.5rem]"
        hidden={!expanded}
        aria-hidden={!expanded}
      >
        {hasStructured
          ? isCompact
            ? renderCompact({
                rows,
                highlightData,
                defaultAudio,
                id,
                audioTitle,
              })
            : renderTable({
                rows,
                highlightData,
                defaultAudio,
                id,
                audioTitle,
              })
          : renderPlain(contents, highlightHtml)}
      </dd>
    </div>
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
  highlightHtml: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
};
