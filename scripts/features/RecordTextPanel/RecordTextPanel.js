import PropTypes from "prop-types";
import { memo, useState, useMemo, useCallback, useId } from "react";
import config from "../../config";
import { l } from "../../lang/Lang";
import sanitizeHtml from "../../utils/sanitizeHtml";
import TranscribeButton from "../TranscriptionPageByPageOverlay/ui/TranscribeButton";
import { computeStatus } from "./utils/computeStatus.js";
import ContributorInfo, { PageContributor } from "./ui/ContributorInfo";
import TranscribedText from "./ui/TranscribedText";
import { StatusIndicator } from "./ui/TranscriptionStatusIndicator";
import HighlightSwitcher from "./ui/HighlightSwitcher";
import RecordSegment from "./ui/RecordSegment";
import buildSegments from "./utils/buildSegments";
import { useRecordHighlights } from "./hooks/useRecordHighlights";
import { useDownloadAllText } from "./hooks/useDownloadAllText";
import {
  faCompress,
  faDownload,
  faExpand,
  faHighlighter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

/**
 * RecordTextPanel component
 * Shows text for all media items in a record, grouped into expandable segments.
 */
export default function RecordTextPanel({
  data,
  highlightData = null,
  mediaImageClickHandler,
}) {
  const {
    id: recordId,
    title,
    archive,
    places,
    text,
    transcribedby,
    transcriptiontype,
    transcriptionstatus,
    media = [],
    segments: rawSegments = [],
  } = data;

  const { imageUrl } = config;

  // local state
  const [expandedTextByIndex, setExpandedTextByIndex] = useState({});
  // keep track of which segments are open
  const [openSegments, setOpenSegments] = useState({});
  const toggleExpanded = useCallback(
    (i) => setExpandedTextByIndex((prev) => ({ ...prev, [i]: !prev[i] })),
    []
  );

  // a11y ids
  const switchId = useId();
  const headingId = `text-${recordId}`;

  // handlers for media open
  const handleMediaClick = useCallback(
    (mediaItem, allMedia, index) =>
      mediaImageClickHandler(mediaItem, allMedia, index),
    [mediaImageClickHandler]
  );
  const handleKeyDown = useCallback(
    (e, mediaItem, index) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        mediaImageClickHandler(mediaItem, mediaImagesAbsolute, index);
      }
    },
    // NOTE: mediaImagesAbsolute is defined below; we re-bind safely after memo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mediaImageClickHandler]
  );

  // status indicator overlay
  const renderIndicator = useCallback(
    (mediaItem) => {
      // 1. prefer the page status
      const tx =
        mediaItem?.transcriptionstatus ||
        // 2. otherwise fall back to record-level
        transcriptionstatus ||
        null;

      if (!tx) return null;

      const status = computeStatus({ transcriptionstatus: tx });
      if (!status) return null;

      return <StatusIndicator status={status} size="md" />;
    },
    [transcriptionstatus]
  );

  // Always page-by-page after all records are one_accession_row (one_record is removed).
  // When we are sure isPageByPage is not needed it could be removed entirely.
  const isPageByPage = true;

  const {
    highlight,
    setHighlight,
    highlightedMediaTexts,
    hasHighlights,
    totalHits,
    textParts,
  } = useRecordHighlights({ highlightData, text, isPageByPage });

  // All image media (absolute order)
  const mediaImagesAbsolute = useMemo(
    () => media.filter((m) => m?.type === "image"),
    [media]
  );

  // Calculate the offset of the first media that is of type image
  // to adjust for skipped PDF media items when building text sides.
  // This works because PDFs are always before images in the media array
  const firstImageOffset = useMemo(
    () => media.findIndex((item) => item?.type === "image"),
    [media],
  );

  // -------------- Segment grouping --------------
  /**
   * Build segments from data.segments (with start_media_id) or fallback to a single segment.
   * Each segment spans from its start index up to (but not including) the next segment's start.
   */
  const segments = useMemo(
    () =>
      buildSegments({
        mediaImages: mediaImagesAbsolute,
        rawSegments,
        transcriptionstatus,
        persons: data.persons,
      }),
    [mediaImagesAbsolute, rawSegments, transcriptionstatus, data.persons]
  );

  // --- Segment open/close controls (for “Öppna alla / Stäng alla”) ---
  const handleToggleSegment = useCallback((segKey) => {
    setOpenSegments((prev) => ({
      ...prev,
      [segKey]: !prev[segKey],
    }));
  }, []);

  const handleOpenAllSegments = useCallback(() => {
    setOpenSegments(() => {
      const next = {};
      segments.forEach((seg, index) => {
        const key = seg.id || `seg-${index}`;
        next[key] = true;
      });
      return next;
    });
  }, [segments]);

  const handleCloseAllSegments = useCallback(() => {
    setOpenSegments(() => {
      const next = {};
      segments.forEach((seg, index) => {
        const key = seg.id || `seg-${index}`;
        next[key] = false;
      });
      return next;
    });
  }, [segments]);

  // Map page index -> persons[] (derived from segments)
  const getPersonsForPage = useCallback(
    (pageIndex) => {
      const seg = segments.find((seg) => {
        const start = seg.startIndex;
        const end = start + seg.items.length;
        return pageIndex >= start && pageIndex < end;
      });

      return seg?.persons || [];
    },
    [segments]
  );

  // --- Flat list of all text pages we can export ---
  const { textPages, handleDownloadAllText } = useDownloadAllText({
    isPageByPage,
    mediaImages: mediaImagesAbsolute,
    textParts,
    title,
    recordId,
    getPersonsForPage,
  });

  const allOpen =
    segments.length > 0 &&
    segments.every((seg, index) => {
      const key = seg.id || `seg-${index}`;
      return openSegments[key] === true;
    });

  const allClosed =
    segments.length > 0 &&
    segments.every((seg, index) => {
      const key = seg.id || `seg-${index}`;
      return openSegments[key] === false;
    });

  // -------------- Side (text) builder, now works with absolute index --------------
  const buildTextSide = useCallback(
    (mediaItem, absoluteIndex) => {
      const adjustedAbsoluteIndex = absoluteIndex + firstImageOffset;
      // If page has text and isn't awaiting transcription, show HTML (with optional highlight)
      if (
        mediaItem.text &&
        mediaItem.transcriptionstatus !== "readytotranscribe"
      ) {
        const key = String(adjustedAbsoluteIndex);
        const html =
          highlight && highlightedMediaTexts[key]
            ? highlightedMediaTexts[key]
            : mediaItem.text;

        return (
          <div className="space-y-2">
            <TranscribedText
              html={sanitizeHtml(html)}
              expanded={!!expandedTextByIndex[adjustedAbsoluteIndex]}
              onToggle={() => toggleExpanded(adjustedAbsoluteIndex)}
              contentId={`page-by-page-text-${recordId}-${adjustedAbsoluteIndex}`}
            />
            {/* compact contributor under the text */}
            <PageContributor
              transcribedby={mediaItem.transcribedby || transcribedby}
              transcriptiondate={
                mediaItem.transcriptiondate || data.transcriptiondate
              }
              comment={mediaItem.comment}
            />
          </div>
        );
      }

      // If record is ready to be transcribed, show CTA
      if (
        transcriptionstatus === "readytotranscribe"
      ) {
        return (
          <div className="flex flex-col items-center justify-between gap-2 p-2 rounded-lg bg-gray-50">
            <span className="text-gray-700">
              {l("Den här sidan kan skrivas av.")}
            </span>
            <TranscribeButton
              className="button button-primary"
              label={l("Skriv av")}
              title={title}
              recordId={recordId}
              archiveId={archive?.archive_id}
              places={places}
              images={media} // all pages
              transcriptionType={transcriptiontype}
              random={false}
              // tell the overlay which page to open
              initialPageIndex={adjustedAbsoluteIndex}
              initialPageSource={mediaItem.source}
            />
          </div>
        );
      }

      // Otherwise, it's being processed
      return (
        <p className="text-gray-700">
          {l(
            "Texten är ännu inte färdig – transkribering eller granskning pågår."
          )}
        </p>
      );
    },
    [
      archive?.archive_id,
      expandedTextByIndex,
      highlightedMediaTexts,
      highlight,
      media,
      places,
      recordId,
      title,
      transcriptionstatus,
      transcriptiontype,
      toggleExpanded,
      transcribedby,
      data.transcriptiondate,
    ]
  );

  // ---------- Render ----------
  if (isPageByPage) {
    return (
      <section aria-labelledby={headingId} className="space-y-3">
        {/* Header */}
        <header className="mb-1 px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {segments && <h2 id={headingId}>{l("Text och bild")}</h2>}

            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {/* Segment controls */}
              {segments?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    className="button button-secondary text-sm"
                    onClick={handleOpenAllSegments}
                    disabled={allOpen}
                  >
                    <FontAwesomeIcon
                      icon={faExpand}
                      className="mr-1"
                      aria-hidden="true"
                    />
                    {l("Öppna alla")}
                  </button>

                  <button
                    type="button"
                    className="button button-ghost text-sm"
                    onClick={handleCloseAllSegments}
                    disabled={allClosed}
                  >
                    <FontAwesomeIcon
                      icon={faCompress}
                      className="mr-1"
                      aria-hidden="true"
                    />
                    {l("Stäng alla")}
                  </button>
                </div>
              )}

              {/* Download control */}
              {textPages.length > 0 && (
                <button
                  type="button"
                  className="button button-secondary text-sm"
                  onClick={handleDownloadAllText}
                >
                  <FontAwesomeIcon
                    icon={faDownload}
                    className="mr-1"
                    aria-hidden="true"
                  />
                  {l("Ladda ner text (.txt)")}
                </button>
              )}

              {/* Highlight switch */}
              {hasHighlights && (
                <HighlightSwitcher
                  id={switchId}
                  highlight={highlight}
                  setHighlight={setHighlight}
                />
              )}
            </div>
          </div>
        </header>

        {/* Segments */}
        <div className="space-y-3">
          {segments.map((seg, i) => {
            const segKey = seg.id || `seg-${i}`;
            const isOpen = Object.prototype.hasOwnProperty.call(
              openSegments,
              segKey
            )
              ? openSegments[segKey]
              : i === 0; // first segment open by default

            return (
              <RecordSegment
                key={segKey}
                title={seg.title}
                mediaItems={seg.items}
                startIndex={seg.startIndex}
                imageUrl={imageUrl}
                renderIndicator={renderIndicator}
                onMediaClick={(item, _arr, absIndex) =>
                  handleMediaClick(item, mediaImagesAbsolute, absIndex)
                }
                onKeyDown={(e, item, absIndex) =>
                  handleKeyDown(e, item, absIndex)
                }
                buildTextSide={buildTextSide}
                defaultOpen={i === 0}
                segmentStatus={
                  seg.segmentTranscriptionstatus
                    ? computeStatus({
                        transcriptionstatus: seg.segmentTranscriptionstatus,
                      })
                    : null
                }
                persons={seg.persons}
                isOpen={isOpen}
                onToggle={() => handleToggleSegment(segKey)}
              />
            );
          })}
        </div>

        {/* Contributor info (keep at the end) */}
        <ContributorInfo
          transcribedby={transcribedby}
          comment={data.comment}
          transcriptiondate={data.transcriptiondate}
        />
      </section>
    );
  }

  // Non-"page-by-page" fallback (still grouped by segments and using split text by absolute index)
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <header className="flex items-center justify-between mb-1 px-4">
        {segments && (
          <h2 id={headingId} className="mr-4">
            {l("Text och bild")}
          </h2>
        )}

        {hasHighlights && (
          <HighlightSwitcher
            id={switchId}
            highlight={highlight}
            setHighlight={setHighlight}
            count={totalHits}
            ariaLabel={l("Markera träffar")}
          />
        )}
      </header>

      <div className="space-y-3">
        {segments.map((seg, i) => (
          <Segment
            key={seg.id || `seg-${i}`}
            title={seg.title}
            mediaItems={seg.items}
            startIndex={seg.startIndex}
            imageUrl={imageUrl}
            renderIndicator={renderIndicator}
            onMediaClick={(item, _arr, absIndex) =>
              handleMediaClick(item, mediaImagesAbsolute, absIndex)
            }
            onKeyDown={(e, item, absIndex) => handleKeyDown(e, item, absIndex)}
            buildTextSide={(mediaItem, absoluteIndex) => (
              <TranscribedText
                html={sanitizeHtml(textParts?.[absoluteIndex] || "")}
                onToggle={() => toggleExpanded(absoluteIndex)}
                contentId={`non-page-by-page-text-${recordId}-${absoluteIndex}`}
              />
            )}
            defaultOpen={i === 0}
          />
        ))}
      </div>

      <ContributorInfo
        transcribedby={transcribedby}
        comment={data.comment}
        transcriptiondate={data.transcriptiondate}
      />
    </section>
  );
}

RecordTextPanel.propTypes = {
  data: PropTypes.object.isRequired,
  highlightData: PropTypes.object,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
