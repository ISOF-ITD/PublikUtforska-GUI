import PropTypes from "prop-types";
import { memo, useId, useState, useCallback } from "react";
import MediaCard from "./MediaCard";
import { l } from "../../../lang/Lang";

/**
 * RecordSegment component
 * Shows text for media items within a segment of a record.
 * 
 * Props:
 * - imageUrl: Full path to file storage of images
 * - mediaItem: Media item object containing source with relative path to image file, title, comment, etc.
 */
function RecordSegment ({
  title,
  mediaItems,
  startIndex,
  imageUrl,
  renderIndicator,
  onMediaClick,
  onKeyDown,
  buildTextSide,
  defaultOpen = false,
}) {
  const segId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <section className="bg-white shadow-sm border border-black/5 overflow-hidden">
      <button
            type="button"
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border !border-solid border-gray-500 rounded !m-0"
            aria-expanded={open}
            aria-controls={`seg-panel-${segId}`}
            onClick={toggle}
        >
            <span className="font-medium truncate">{title || l("Segment")}</span>
            <span className="text-sm text-gray-500 shrink-0">
            {open ? l("Dölj") : l("Visa")}
            </span>
        </button>

      {open && (
        <div id={`seg-panel-${segId}`} className="lg:p-2 p-4 space-y-3">
          {mediaItems.map((mediaItem, i) => {
            const absoluteIndex = startIndex + i;
            return (
              <MediaCard
                key={`${mediaItem.source ?? "img"}-${absoluteIndex}`}
                mediaItem={mediaItem}
                index={absoluteIndex}
                imageUrl={imageUrl}
                renderIndicator={renderIndicator}
                onMediaClick={onMediaClick}
                onKeyDown={onKeyDown}
                right={buildTextSide(mediaItem, absoluteIndex)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

RecordSegment.propTypes = {
  title: PropTypes.string,
  mediaItems: PropTypes.arrayOf(PropTypes.object).isRequired,
  startIndex: PropTypes.number.isRequired,
  imageUrl: PropTypes.string.isRequired,
  renderIndicator: PropTypes.func.isRequired,
  onMediaClick: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  buildTextSide: PropTypes.func.isRequired,
  defaultOpen: PropTypes.bool,
};

export default RecordSegment;
