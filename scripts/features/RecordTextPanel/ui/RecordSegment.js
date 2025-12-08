import PropTypes from "prop-types";
import { memo, useId, useState, useCallback } from "react";
import MediaCard from "./MediaCard";
import { l } from "../../../lang/Lang";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { StatusIndicator } from "./TranscriptionStatusIndicator";
import SegmentPersons from "./SegmentPersons";

function RecordSegment({
  title,
  mediaItems,
  startIndex,
  imageUrl,
  renderIndicator,
  onMediaClick,
  onKeyDown,
  buildTextSide,
  defaultOpen = false,
  segmentStatus,
  persons = [],
}) {
  const segId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <section className="bg-white shadow-sm border border-black/5 overflow-hidden relative">
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border !border-solid border-gray-500 rounded !m-0"
        aria-expanded={open}
        aria-controls={`seg-panel-${segId}`}
        onClick={toggle}
      >
        {/* LEFT SIDE: indicator + title + persons */}
        <span className="flex items-center gap-2 flex-1 min-w-0">
          {segmentStatus && (
            <StatusIndicator
              status={segmentStatus}
              size="sm"
              positionClass=""
              className="shrink-0"
            />
          )}

          {/* This is the bit that will truncate nicely */}
          <span className="font-medium truncate max-w-full">
            {title || l("Segment")}
          </span>

          {persons.length > 0 && (
            <div className="px-4 pb-0 max-sm:hidden">
              <SegmentPersons persons={persons} maxVisible={2} />
            </div>
          )}
        </span>

        {/* RIGHT SIDE: "Visa/Dölj" + chevron, never shrink */}
        <span className="flex items-center gap-2 shrink-0">
          <span className="text-gray-500 shrink-0">
            {open ? (
              <span>
                {l("Dölj")}{" "}
                <FontAwesomeIcon className="text-lg" icon={faChevronUp} />
              </span>
            ) : (
              <span>
                {l("Visa")}{" "}
                <FontAwesomeIcon className="text-lg" icon={faChevronDown} />
              </span>
            )}
          </span>
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
}

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
  segmentStatus: PropTypes.shape({
    key: PropTypes.string,
    label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired,
    icon: PropTypes.any,
  }),
};

export default RecordSegment;
