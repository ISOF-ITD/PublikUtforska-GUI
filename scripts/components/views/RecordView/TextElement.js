/* eslint-disable react/require-default-props */
import PropTypes from "prop-types";
import { useState, useMemo, useCallback } from "react";
import config from "../../../config";
import HighlightSwitcher from "./HighlightSwitcher";
import { l } from "../../../lang/Lang";
import TranscribeButton from "../transcribe/TranscribeButton";
import ArchiveImage from "./ArchiveImage";
import ContributorInfo from "./ContributorInfo";
import sanitizeHtml from "../../../utils/sanitizeHtml";

export default function TextElement({
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
    recordtype,
  } = data;

  const { imageUrl } = config;
  const [highlight, setHighlight] = useState(true);

  // RETURN null if not relevant for display
  if (
    recordtype === "accession_row" ||
    (transcriptionstatus !== "published" && transcriptiontype !== "sida")
  ) {
    return null;
  }

  const handleMediaClick = useCallback(
    (mediaItem, index) => {
      mediaImageClickHandler(mediaItem, media, index);
    },
    [mediaImageClickHandler, media]
  );

  const handleKeyDown = useCallback(
    (e, mediaItem, index) => {
      // Support both modern and legacy values for Space
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        mediaImageClickHandler(mediaItem, media, index);
      }
    },
    [mediaImageClickHandler, media]
  );

  const renderMedia = useCallback(
    (mediaItem, index) => (
      <div
        className="four columns"
        key={`${mediaItem.source ?? "img"}-${index}`}
      >
        <ArchiveImage
          mediaItem={mediaItem}
          index={index}
          onMediaClick={handleMediaClick}
          onKeyDown={handleKeyDown}
          imageUrl={imageUrl}
          renderMagnifyingGlass
        />
      </div>
    ),
    [handleKeyDown, handleMediaClick, imageUrl]
  );

  if (transcriptiontype === "sida") {
    // Precompute highlighted media text by inner_hits offset
    const innerHits =
      highlightData?.data?.[0]?.inner_hits?.media?.hits?.hits ?? [];

    const highlightedMediaTexts = useMemo(() => {
      if (transcriptiontype !== "sida") return {};
      return innerHits.reduce((acc, hit) => {
        const innerHitHighlightedText = hit?.highlight?.["media.text"]?.[0];
        // eslint-disable-next-line no-underscore-dangle
        const offset = `${hit?._nested?.offset}`;
        if (innerHitHighlightedText && offset)
          acc[offset] = innerHitHighlightedText;
        return acc;
      }, {});
    }, [innerHits, transcriptiontype]);

    return (
      <main>
        {innerHits.length > 0 && (
          <HighlightSwitcher
            highlight={highlight}
            setHighlight={setHighlight}
            id={`highlight-${recordId}`}
          />
        )}

        {media?.map(
          (mediaItem, index) =>
            mediaItem.type === "image" && (
              <div
                className="row record-text-and-image"
                key={`${mediaItem.source ?? "img"}-${index}`}
              >
                <div className="eight columns">
                  {(() => {
                    // Visa text om den finns och inte är readytotranscribe
                    if (
                      mediaItem.text &&
                      mediaItem.transcriptionstatus !== "readytotranscribe"
                    ) {
                      const html =
                        highlight && highlightedMediaTexts[`${index}`]
                          ? highlightedMediaTexts[`${index}`]
                          : mediaItem.text;

                      return (
                        <p
                          className="display-line-breaks"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(html),
                          }}
                        />
                      );
                    }

                    if (transcriptionstatus === "readytotranscribe") {
                      return (
                        <TranscribeButton
                          className="button button-primary"
                          label={l("Skriv av")}
                          title={title}
                          recordId={recordId}
                          archiveId={archive.archive_id}
                          places={places}
                          images={media}
                          transcriptionType={transcriptiontype}
                          random={false}
                        />
                      );
                    }

                    // Visa tomt fält / statusmeddelande
                    return (
                      <p>
                        {l(
                          "Denna text håller på att skrivas av, av en användare eller är under behandling."
                        )}
                      </p>
                    );
                  })()}
                </div>
                {renderMedia(mediaItem, index)}
              </div>
            )
        )}
      </main>
    );
  }

  // Use ES highlight when available, otherwise original text
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || "";

  const sourceText = useMemo(
    () => (highlight && highlightedText ? highlightedText : text),
    [highlight, highlightedText, text]
  );

  // Split the text by '/' at EOL and remove leading newlines from each part (keep original behavior)
  const textParts = useMemo(
    () => sourceText?.split(/\/\s*$/m).map((part) => part.replace(/^\n+/, "")),
    [sourceText]
  );

  return (
    <main>
      {highlightedText && (
        <HighlightSwitcher
          highlight={highlight}
          setHighlight={setHighlight}
          id={`highlight-${recordId}`}
        />
      )}

      {media?.map(
        (mediaItem, index) =>
          mediaItem.type === "image" && (
            <div
              className="row record-text-and-image"
              key={`${mediaItem.source ?? "img"}-${index}`}
            >
              <div className="eight columns">
                <p
                  className="display-line-breaks"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(
                      textParts ? textParts[index] : "&nbsp;"
                    ),
                  }}
                />
              </div>
              {renderMedia(mediaItem, index)}
            </div>
          )
      )}

      <ContributorInfo
        transcribedby={transcribedby}
        comment={data.comment}
        transcriptiondate={data.transcriptiondate}
      />
    </main>
  );
}

TextElement.propTypes = {
  data: PropTypes.object.isRequired,
  highlightData: PropTypes.object,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
