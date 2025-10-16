import { useCallback, useEffect, useMemo, useState, useId } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faTh,
} from "@fortawesome/free-solid-svg-icons";
import classNames from "classnames";
import config from "../../../config";
import ArchiveImage from "./ArchiveImage";
import {
  computeStatus,
  StatusIndicator,
} from "../transcribe/TranscriptionStatusIndicator";

export default function RecordViewThumbnails({ data, mediaImageClickHandler }) {
  const {
    transcriptionstatus,
    transcriptiontype,
    media,
    id: recordId,
  } = data || {};

  const mediaList = Array.isArray(media) ? media : [];
  const [expanded, setExpanded] = useState(false);
  const [hasLoadedImages, setHasLoadedImages] = useState(false);
  const contentId = useId();

  const images = useMemo(
    () => mediaList.filter((m) => (m?.type || "").toLowerCase() === "image"),
    [mediaList]
  );
  const hasImages = images.length > 0;

  // Provide a stable indicator renderer for ArchiveImage
  const renderIndicator = useCallback(
    (item) => {
      // Merge record-level + item-level in case transcriptionstatus lives only on one of them
      const status = computeStatus({ ...data, ...item });
      return <StatusIndicator status={status} />;
    },
    [data]
  );

  const storageKey = `rv:${recordId || "unknown"}:thumbnails:expanded`;

  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    const shouldAutoOpen =
      transcriptionstatus === "readytotranscribe" &&
      transcriptiontype !== "sida";
    const next = saved !== null ? saved === "1" : shouldAutoOpen;
    setExpanded(next);
    setHasLoadedImages(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && !hasLoadedImages) setHasLoadedImages(true);
      return next;
    });
  }, [hasLoadedImages]);

  if (!hasImages) return null;

  return (
    <section className="mb-4">
      <button
        type="button"
        title={expanded ? "Dölj" : "Visa"}
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex items-center gap-2 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 py-1.5"
        aria-label={`Visa översikt, ${images.length} bild${
          images.length === 1 ? "" : "er"
        }`}
        onClick={toggle}
      >
        <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} />
        <span>
          <b>Visa översikt</b>{" "}
          <span className="text-gray-500">({images.length})</span>
        </span>
        <FontAwesomeIcon icon={faTh} />
      </button>

      {hasLoadedImages && (
        <div
          id={contentId}
          className={classNames(
            "inline-block bg-white rounded-lg shadow-md font-serif leading-normal mb-5 max-w-full py-5 px-8",
            !expanded && "hidden"
          )}
          aria-hidden={!expanded}
        >
          {images.map((mediaItem, index) => (
            <ArchiveImage
              key={mediaItem?.source || `${index}`}
              mediaItem={mediaItem}
              index={index}
              imageUrl={config.imageUrl}
              loading="lazy"
              decoding="async"
              onMediaClick={(item, idx) =>
                mediaImageClickHandler?.(item, images, idx)
              }
              onKeyDown={(e, item, idx) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  mediaImageClickHandler?.(item, images, idx);
                }
              }}
              renderIndicator={renderIndicator}
            />
          ))}
        </div>
      )}
    </section>
  );
}

RecordViewThumbnails.propTypes = {
  data: PropTypes.shape({
    transcriptionstatus: PropTypes.string,
    transcriptiontype: PropTypes.string,
    media: PropTypes.arrayOf(
      PropTypes.shape({
        source: PropTypes.string,
        type: PropTypes.string,
      })
    ),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
