import PropTypes from 'prop-types';
import { useId, useState } from 'react';
import MediaCard from './MediaCard';
import { l } from '../../../lang/Lang';
import { StatusIndicator } from './TranscriptionStatusIndicator';
import SegmentPersons from './SegmentPersons';

export default function RecordSegment({
  title, mediaItems, startIndex, imageUrl, renderIndicator, onMediaClick,
  buildTextSide, defaultOpen = false, segmentStatus, persons = [],
}) {
  const id = useId();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section aria-labelledby={`${id}-heading`} className="relative overflow-hidden rounded border !border-solid border-border bg-surface shadow-sm">
      <h3 id={`${id}-heading`} className="!m-0 text-lg font-semibold">
        <button
          type="button"
          className="!m-0 flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((previous) => !previous)}
        >
          <span className="flex min-w-0 items-center gap-2">
            <StatusIndicator status={segmentStatus} positionClass="" className="shrink-0" />
            <span>{title || l('Alla sidor')}</span>
          </span>
          <span className="shrink-0 text-sm text-subtle">{open ? l('Dölj') : l('Visa')}</span>
        </button>
      </h3>
      {persons.length > 0 && (
        <div className="px-4 pb-2"><SegmentPersons persons={persons} maxVisible={2} /></div>
      )}
      <div id={`${id}-panel`} hidden={!open}>
        {open && (
          <div className="space-y-3 p-4 lg:p-2">
            {mediaItems.map((item, index) => (
              <MediaCard
                key={item.id || item.source}
                mediaItem={item}
                index={startIndex + index}
                imageUrl={imageUrl}
                renderIndicator={renderIndicator}
                onMediaClick={onMediaClick}
                right={buildTextSide(item, startIndex + index)}
                headingLevel="h4"
              />
            ))}
          </div>
        )}
      </div>
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
  buildTextSide: PropTypes.func.isRequired,
  defaultOpen: PropTypes.bool,
  segmentStatus: PropTypes.object,
  persons: PropTypes.array,
};
