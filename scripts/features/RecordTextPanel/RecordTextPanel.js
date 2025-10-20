import PropTypes from "prop-types";
import { memo, useState, useMemo, useCallback, useId } from "react";
import config from "../../config";
import { l } from "../../lang/Lang";
import sanitizeHtml from "../../utils/sanitizeHtml";
import TranscribeButton from "../../components/views/transcribe/TranscribeButton";
import { computeStatus } from "./utils/computeStatus,js";
import MediaCard from "./ui/MediaCard";
import ContributorInfo from "./ui/ContributorInfo";
import TranscribedText from "./ui/TranscribedText";
import { splitPages } from "./utils/splitPages";
import { StatusIndicator } from "./ui/TranscriptionStatusIndicator";

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
  } = data;

  const { imageUrl } = config;

  // local state
  const [highlight, setHighlight] = useState(true);
  const [expanded, setExpanded] = useState({});
  const toggleExpanded = useCallback(
    (i) => setExpanded((prev) => ({ ...prev, [i]: !prev[i] })),
    []
  );

  // a11y ids
  const switchId = useId();
  const headingId = `text-${recordId}`;

  // event handlers
  const handleMediaClick = useCallback(
    (mediaItem, index) => mediaImageClickHandler(mediaItem, media, index),
    [mediaImageClickHandler, media]
  );

  const handleKeyDown = useCallback(
    (e, mediaItem, index) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        mediaImageClickHandler(mediaItem, media, index);
      }
    },
    [mediaImageClickHandler, media]
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

  // highlight data
  const isPageByPage = transcriptiontype === "sida";
  const mediaImages = useMemo(
    () => media.filter((m) => m?.type === "image"),
    [media]
  );

  // "page-by-page" inner hits + count of <em> tags
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

  // Non-"page-by-page" highlight text + count
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || "";
  const highlightCount = useMemo(
    () => (highlightedText.match(/<em>/g) || []).length,
    [highlightedText]
  );

  // Prepare text to display for non-"page-by-page"
  const sourceText = useMemo(
    () => (highlight && highlightedText ? highlightedText : text),
    [highlight, highlightedText, text]
  );
  const textParts = useMemo(() => splitPages(sourceText), [sourceText]);

  const hasHighlights = isPageByPage
    ? innerHits.length > 0
    : Boolean(highlightedText);
  const totalHits = isPageByPage ? pageByPageHitCount : highlightCount;

  // Header (shared)
  const Header = (
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
  );

  // Side with text builder
  const buildTextSide = useCallback(
    (mediaItem, index) => {
      // If page has text and isn't awaiting transcription, show HTML (with optional highlight)
      if (
        mediaItem.text &&
        mediaItem.transcriptionstatus !== "readytotranscribe"
      ) {
        const html =
          highlight && highlightedMediaTexts[String(index)]
            ? highlightedMediaTexts[String(index)]
            : mediaItem.text;

        return (
          <TranscribedText
            html={sanitizeHtml(html)}
            expanded={!!expanded[index]}
            onToggle={() => toggleExpanded(index)}
            contentId={`page-by-page-text-${recordId}-${index}`}
          />
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
      expanded,
      highlightedMediaTexts,
      l,
      media,
      places,
      recordId,
      title,
      transcriptionstatus,
      transcriptiontype,
      highlight,
      toggleExpanded,
    ]
  );

  // ---------- Render ----------
  if (isPageByPage) {
    return (
      <section aria-labelledby={headingId} className="space-y-3">
        {Header}

        {mediaImages.map((mediaItem, index) => (
          <MediaCard
            key={`${mediaItem.source ?? "img"}-${index}`}
            mediaItem={mediaItem}
            index={index}
            imageUrl={imageUrl}
            renderIndicator={renderIndicator}
            onMediaClick={handleMediaClick}
            onKeyDown={handleKeyDown}
            right={buildTextSide(mediaItem, index)}
          />
        ))}
      </section>
    );
  }

  // Non-"page-by-page"
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      {Header}

      {mediaImages.map((mediaItem, index) => (
        <MediaCard
          key={`${mediaItem.source ?? "img"}-${index}`}
          mediaItem={mediaItem}
          index={index}
          imageUrl={imageUrl}
          renderIndicator={renderIndicator}
          onMediaClick={handleMediaClick}
          onKeyDown={handleKeyDown}
          right={
            <TranscribedText
              html={sanitizeHtml(textParts?.[index] || "")}
              onToggle={() => toggleExpanded(index)}
              contentId={`non-page-by-page-text-${recordId}-${index}`}
            />
          }
        />
      ))}

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
