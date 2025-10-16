import React, { useCallback, useEffect, useMemo, useState, useId } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronRight,
  faLock,
  faNewspaper,
  faPen,
  faTh,
} from "@fortawesome/free-solid-svg-icons";
import config from "../../../config";
import ArchiveImage from "./ArchiveImage";

const getThumbStatus = (item) => {
  if (!item) return null;

  if (item.transcriptionstatus === "transcribed") {
    return {
      label: "Sidan kontrolleras",
      color: "bg-gray-400",
      icon: faLock,
    };
  }
  if (item.transcriptionstatus === "published") {
    return {
      label: "Sidan har publicerats",
      color: "bg-isof",
      icon: faNewspaper,
    };
  }
  if (item.transcriptionstatus === "readytotranscribe") {
    return {
      key: "ready",
      label: "Sidan kan skrivas av",
      color: "bg-lighter-isof",
      icon: faPen,
    };
  }
  return null;
};

// Small, accessible dot
const ThumbStatusDot = ({ status }) => {
  if (!status) return null;
  return (
    <div
      className={[
        "absolute top-2 right-2 h-6 w-6 rounded-full",
        "flex items-center justify-center text-white shadow",
        "border-2 border-solid border-white",
        status.color,
      ].join(" ")}
      title={status.label}
      aria-label={status.label}
    >
      {status.icon && <FontAwesomeIcon className="h-4" icon={status.icon} />}
      <span className="sr-only">{status.label}</span>
    </div>
  );
};

export default function RecordViewThumbnails({ data, mediaImageClickHandler }) {
  const {
    transcriptionstatus,
    transcriptiontype,
    media,
    id: recordId,
  } = data || {};

  // Normalize inputs
  const mediaList = Array.isArray(media) ? media : [];

  const [expanded, setExpanded] = useState(false);
  const [hasLoadedImages, setHasLoadedImages] = useState(false);
  const contentId = useId();

  // Filter only image media once
  const images = useMemo(
    () => mediaList.filter((m) => (m?.type || "").toLowerCase() === "image"),
    [mediaList]
  );

  const hasImages = images.length > 0;

  // Indicator renderer (stable reference for ArchiveImage to avoid re-renders)
  const renderIndicator = useCallback((item) => {
    const status = getThumbStatus(item);
    return <ThumbStatusDot status={status} />;
  }, []);

  const storageKey = `rv:${recordId || "unknown"}:thumbnails:expanded`;

  // Persist expanded state (align with other sections)
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    const shouldAutoOpen =
      transcriptionstatus === "readytotranscribe" &&
      transcriptiontype !== "sida";
    const next = saved !== null ? saved === "1" : shouldAutoOpen;
    setExpanded(next);
    setHasLoadedImages(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once

  useEffect(() => {
    sessionStorage.setItem(storageKey, expanded ? "1" : "0");
  }, [expanded, storageKey]);

  // Kontrollera om det finns några bilder

  // Toggle + lazy-load once
  const toggle = useCallback(() => {
    setExpanded((prev) => {
      const next = !prev;
      if (next && !hasLoadedImages) setHasLoadedImages(true);
      return next;
    });
  }, [hasLoadedImages]);

  if (!hasImages) {
    return null;
  }

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
          className="inline-block bg-white rounded-lg shadow-md font-serif leading-normal mb-5 max-w-full py-5 px-8"
          style={{ display: expanded ? undefined : "none" }}
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
        // any other fields used by ArchiveImage can be added here
      })
    ),
  }).isRequired,
  mediaImageClickHandler: PropTypes.func.isRequired,
};
