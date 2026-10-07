import { useId, useState } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import config from '../../../config';
import ArchiveImage from '../../RecordTextPanel/ui/ArchiveImage';

const CHUNK_SIZE = 24;

export default function RecordViewThumbnails({
  images, onMediaClick, renderIndicator,
}) {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(CHUNK_SIZE);
  const contentId = useId();
  if (!images.length) return null;
  return (
    <div>
      <h3 className="!m-0 text-sm font-semibold text-muted">
        <button
          type="button"
          title={expanded ? 'Dölj' : 'Visa'}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="!m-0 !flex !h-auto min-h-11 w-full items-center justify-start gap-3 !rounded-none !border-0 !bg-transparent !p-0 !text-left !text-sm !font-semibold !text-muted !leading-normal ![font-family:inherit] !whitespace-normal !normal-case !tracking-normal hover:!text-link hover:underline focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus focus-visible:outline-offset-2"
          onClick={() => setExpanded((previous) => !previous)}
        >
          <span className="min-w-0 break-words">
            {`${expanded ? 'Dölj' : 'Visa'} sidöversikt `}
            <span className="text-subtle">{`(${images.length})`}</span>
          </span>
          <FontAwesomeIcon icon={expanded ? faChevronDown : faChevronRight} aria-hidden="true" focusable="false" className="w-3 shrink-0" />
        </button>
      </h3>
      <div id={contentId} hidden={!expanded}>
        {expanded && (
          <ul className="!m-0 flex max-h-96 !list-none flex-wrap gap-3 overflow-auto rounded-lg bg-surface p-3">
            {images.slice(0, visibleCount).map((item, index) => (
              <li key={item.id || item.source} className="w-28 sm:w-32">
                <ArchiveImage
                  mediaItem={item}
                  index={index}
                  imageUrl={config.imageUrl}
                  variant="thumbnail"
                  showCaption={false}
                  renderMagnifyingGlass={false}
                  className="!w-full"
                  imgProps={{ loading: 'lazy', decoding: 'async' }}
                  buttonLabel={`Öppna större bild av sida ${index + 1}`}
                  onMediaClick={onMediaClick}
                  renderIndicator={renderIndicator}
                />
                <span aria-hidden="true" className="block text-center text-sm">{index + 1}</span>
              </li>
            ))}
            {visibleCount < images.length && (
              <li className="w-full">
                <button
                  type="button"
                  className="button button-secondary text-sm"
                  onClick={() => setVisibleCount(
                    (count) => Math.min(count + CHUNK_SIZE, images.length),
                  )}
                >
                  {`Visa fler (${images.length - visibleCount} kvar)`}
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

RecordViewThumbnails.propTypes = {
  images: PropTypes.arrayOf(PropTypes.object).isRequired,
  onMediaClick: PropTypes.func.isRequired,
  renderIndicator: PropTypes.func.isRequired,
};
