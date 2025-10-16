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

  // ---- HOOKS (always in the same order) ----
  const [highlight, setHighlight] = useState(true);

  const handleMediaClick = useCallback(
    (mediaItem, index) => {
      mediaImageClickHandler(mediaItem, media, index);
    },
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

  const isSida = transcriptiontype === "sida";

  // Data used by the "sida" path (compute unconditionally, return empty defaults when not sida)
  const innerHits =
    highlightData?.data?.[0]?.inner_hits?.media?.hits?.hits ?? [];
  const highlightedMediaTexts = useMemo(() => {
    if (!isSida) return {};
    return innerHits.reduce((acc, hit) => {
      const innerHitHighlightedText = hit?.highlight?.["media.text"]?.[0];
      // eslint-disable-next-line no-underscore-dangle
      const offset = `${hit?._nested?.offset}`;
      if (innerHitHighlightedText && offset)
        acc[offset] = innerHitHighlightedText;
      return acc;
    }, {});
  }, [isSida, innerHits]);

  // Data used by the non-"sida" path (also safe to compute always)
  const highlightedText = highlightData?.data?.[0]?.highlight?.text?.[0] || "";
  const sourceText = useMemo(
    () => (highlight && highlightedText ? highlightedText : text),
    [highlight, highlightedText, text]
  );
  const textParts = useMemo(
    () => sourceText?.split(/\/\s*$/m).map((part) => part.replace(/^\n+/, "")),
    [sourceText]
  );

  // ---- RENDER ----
  if (isSida) {
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
                className="row bg-white rounded-lg shadow-md font-serif leading-normal mb-5 max-w-full py-5 px-8"
                key={`${mediaItem.source ?? "img"}-${index}`}
              >
                <div className="eight columns">
                  {(() => {
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
                          className="whitespace-pre-wrap break-words"
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
                          archiveId={archive?.archive_id}
                          places={places}
                          images={media}
                          transcriptionType={transcriptiontype}
                          random={false}
                        />
                      );
                    }

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

  // Non-"sida"
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
              className="row bg-white rounded-lg shadow-md font-serif leading-normal mb-5 max-w-full py-5 px-8"
              key={`${mediaItem.source ?? "img"}-${index}`}
            >
              <div className="eight columns">
                <p
                  className="whitespace-pre-wrap break-words"
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
