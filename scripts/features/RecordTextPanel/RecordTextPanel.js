// src/views/record/RecordTextPanel.jsx
import PropTypes from "prop-types";
import { memo, useState, useMemo, useCallback, useId } from "react";
import config from "../../config";
import { l } from "../../lang/Lang";
import sanitizeHtml from "../../utils/sanitizeHtml";
import TranscribeButton from "../../components/views/transcribe/TranscribeButton";
import { computeStatus } from "./utils/computeStatus.js";
import ContributorInfo, { PageContributor } from "./ui/ContributorInfo";
import TranscribedText from "./ui/TranscribedText";
import { splitPages } from "./utils/splitPages";
import { StatusIndicator } from "./ui/TranscriptionStatusIndicator";
import HighlightSwitcher from "./ui/HighlightSwitcher";
import RecordSegment from "./ui/RecordSegment";

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
  const [highlight, setHighlight] = useState(true);
  const [expandedTextByIndex, setExpandedTextByIndex] = useState({});
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
      const tx =
        (transcriptiontype === "sida"
          ? mediaItem?.transcriptionstatus
          : transcriptionstatus) || null;
      const status = tx ? computeStatus({ transcriptionstatus: tx }) : null;
      return <StatusIndicator status={status} size="md" />;
    },
    [transcriptionstatus, transcriptiontype]
  );

  // Always page-by-page after all records are one_accession_row (one_record is removed).
  // When we are sure isPageByPage is not needed it could be removed entirely.
  const isPageByPage = true;

  // All image media (absolute order)
  const mediaImagesAbsolute = useMemo(
    () => media.filter((m) => m?.type === "image"),
    [media]
  );

  // -------------- Highlight plumbing (unchanged) --------------
  const innerHits =
    highlightData?.data?.[0]?.inner_hits?.media?.hits?.hits ?? [];

  const highlightedMediaTexts = useMemo(() => {
    if (!isPageByPage) return {};
    return innerHits.reduce((acc, hit) => {
      const innerHitHighlightedText = hit?.highlight?.["media.text"]?.[0];
      // eslint-disable-next-line no-underscore-dangle
      const offset = `${hit?._nested?.offset}`;
      if (innerHitHighlightedText && offset)
        acc[offset] = innerHitHighlightedText;
      return acc;
    }, {});
  }, [isPageByPage, innerHits]);

  const pageByPageHitCount = useMemo(
    () =>
      innerHits.reduce((sum, h) => {
        const str = h?.highlight?.["media.text"]?.[0] || "";
        return sum + (str.match(/<em>/g) || []).length;
      }, 0),
    [innerHits]
  );

  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || "";
  const highlightCount = useMemo(
    () => (highlightedText.match(/<em>/g) || []).length,
    [highlightedText]
  );

  const sourceText = useMemo(
    () => (highlight && highlightedText ? highlightedText : text),
    [highlight, highlightedText, text]
  );
  const textParts = useMemo(() => splitPages(sourceText), [sourceText]);

  const hasHighlights = isPageByPage
    ? innerHits.length > 0
    : Boolean(highlightedText);
  const totalHits = isPageByPage ? pageByPageHitCount : highlightCount;

  // -------------- Segment grouping --------------
  /**
   * Build segments from data.segments (with start_media_id) or fallback to a single segment.
   * Each segment spans from its start index up to (but not including) the next segment's start.
   */
  const segments = useMemo(() => {
    const images = mediaImagesAbsolute;
    if (!images.length) return [];

    const idToIndex = new Map(images.map((m, idx) => [m.id, idx]));
    const personsById = new Map((data.persons || []).map((p) => [p.id, p]));

    const raw =
      !rawSegments || rawSegments.length === 0
        ? [{ id: "__all__", startIndex: 0 }]
        : rawSegments;

    const normalized = raw
      .map((s, i) => ({
        ...s,
        __order: i,
        startIndex: idToIndex.has(s.start_media_id)
          ? idToIndex.get(s.start_media_id)
          : Number.POSITIVE_INFINITY,
      }))
      .filter((s) => Number.isFinite(s.startIndex))
      .sort((a, b) => a.startIndex - b.startIndex);

    const built = normalized.map((s, i) => {
      const start = s.startIndex;
      const end =
        i < normalized.length - 1
          ? normalized[i + 1].startIndex
          : images.length;
      const items = images.slice(start, end);

      const pageLabel =
        items.length === 1
          ? `${l("Sida")} ${start + 1}`
          : `${l("Sidor")} ${start + 1}–${end}`;

      const allReadyToTranscribe =
        items.length > 0 &&
        items.every((m) => m?.transcriptionstatus === "readytotranscribe");

      const titleFromFirst = items[0]?.title || pageLabel;
      const displayTitle = allReadyToTranscribe
        ? `${pageLabel}: ${l("kan skrivas av")}`
        : titleFromFirst;

      // NEW: resolve persons on this segment
      const segmentPersons = (s.person_ids || [])
        .map((pid) => personsById.get(pid))
        .filter(Boolean);

      // aggregate status (as you had)
      const segmentTxStatus = (() => {
        const pageStatuses = items
          .map((m) => m?.transcriptionstatus)
          .filter(Boolean);

        // if any page says “readytotranscribe”, show that (so volunteers see work)
        if (pageStatuses.some((st) => st === "readytotranscribe")) {
          return "readytotranscribe";
        }
        const nonPublished = pageStatuses.find((st) => st !== "published");
        if (nonPublished) return nonPublished;
        if (
          pageStatuses.length &&
          pageStatuses.every((st) => st === "published")
        ) {
          return "published";
        }
        return transcriptionstatus ?? null;
      })();

      return {
        id: s.id ?? `seg-${i}`,
        startIndex: start,
        items,
        title: displayTitle,
        segmentTranscriptionstatus: segmentTxStatus,
        persons: segmentPersons, // ← important
      };
    });

    return built.length
      ? built
      : [
          {
            id: "__all__",
            startIndex: 0,
            items: images,
            title: images[0]?.title || `${l("Sida")} 1`,
            segmentTranscriptionstatus: transcriptionstatus ?? null,
            persons: [],
          },
        ];
  }, [mediaImagesAbsolute, rawSegments, transcriptionstatus, data.persons]);

  // -------------- Side (text) builder, now works with absolute index --------------
  const buildTextSide = useCallback(
    (mediaItem, absoluteIndex) => {
      // If page has text and isn't awaiting transcription, show HTML (with optional highlight)
      if (
        mediaItem.text &&
        mediaItem.transcriptionstatus !== "readytotranscribe"
      ) {
        const key = String(absoluteIndex);
        const html =
          highlight && highlightedMediaTexts[key]
            ? highlightedMediaTexts[key]
            : mediaItem.text;

        return (
          <div className="space-y-2">
            <TranscribedText
              html={sanitizeHtml(html)}
              expanded={!!expandedTextByIndex[absoluteIndex]}
              onToggle={() => toggleExpanded(absoluteIndex)}
              contentId={`page-by-page-text-${recordId}-${absoluteIndex}`}
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
      if (transcriptionstatus === "readytotranscribe") {
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
              images={media}
              transcriptionType={transcriptiontype}
              random={false}
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
        <header className="flex items-center justify-between mb-1">
          <h2 id={headingId} className="sr-only">
            {l("Text och bild")}
          </h2>

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

        {/* Segments */}
        <div className="space-y-3">
          {segments.map((seg, i) => (
            <RecordSegment
              key={seg.id || `seg-${i}`}
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
              persons={seg.persons} // ← NEW
            />
          ))}
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
      <header className="flex items-center justify-between mb-1">
        <h2 id={headingId} className="sr-only">
          {l("Text och bild")}
        </h2>

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
