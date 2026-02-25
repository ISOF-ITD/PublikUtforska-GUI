import PropTypes from 'prop-types';
import classNames from 'classnames';
import config from '../../../config';
import { StatusIndicator } from '../../RecordTextPanel/ui/TranscriptionStatusIndicator';
import { computeStatus } from '../../RecordTextPanel/utils/computeStatus';

export default function TranscriptionThumbnails({
  thumbnailContainerRef,
  pages,
  navigatePages,
  currentPageIndex,
}) {
  return (
    <ul
      className="flex gap-2 py-2 overflow-x-auto"
      ref={thumbnailContainerRef}
      aria-label="Bildminiatyrer"
    >
      {pages.map((page, index) => {
        if (!page?.source || page.source.includes('.pdf')) return null;

        const selected = index === currentPageIndex;
        const status = computeStatus(page);
        const pageKey = page.source || page.id || page.pagenumber || 'thumb-missing-source';

        return (
          <li
            key={pageKey}
            className="relative list-none select-none outline-none scroll-m-2"
          >
            <button
              type="button"
              onClick={() => navigatePages(index)}
              aria-current={selected ? 'page' : undefined}
              aria-label={`Gå till sida ${index + 1}`}
              title={status?.label || undefined}
              className="relative cursor-pointer select-none outline-none scroll-m-2 bg-transparent border-0 p-0 text-left"
            >
              <div
                className={classNames(
                  'relative rounded-md overflow-hidden border-solid border-3',
                  selected
                    ? 'border-isof'
                    : 'border-transparent hover:border-blue-500 focus-visible:border-blue-500',
                  'transition-shadow',
                )}
              >
                <StatusIndicator status={status} />

                <img
                  src={`${config.imageUrl}${page.source}`}
                  alt={`Miniatyr - sida ${index + 1}`}
                  className="block w-36 object-cover"
                  loading="lazy"
                />
              </div>

              <div className="mt-2 text-center text-gray-600">
                {`${index + 1} av ${pages.length}`}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

TranscriptionThumbnails.propTypes = {
  thumbnailContainerRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.any,
    }),
  ]),
  pages: PropTypes.arrayOf(
    PropTypes.shape({
      source: PropTypes.string,
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pagenumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ).isRequired,
  navigatePages: PropTypes.func.isRequired,
  currentPageIndex: PropTypes.number.isRequired,
};
