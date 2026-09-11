import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookmark as faBookmarkSolid } from '@fortawesome/free-solid-svg-icons';
import { faBookmark as faBookmarkRegular } from '@fortawesome/free-regular-svg-icons';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { l } from '../lang/Lang';
import useBookmarkedRecords from '../hooks/useBookmarkedRecords';

const compactContactButtonClassName = [
  'feedback-button relative z-[1] inline-flex !h-auto self-start items-center gap-2',
  'm-0 whitespace-nowrap rounded-full !border-0 bg-isof !px-3 !py-2',
  'appearance-none !leading-[inherit] text-white shadow-[0_1px_2px_rgba(0,0,0,0.61)]',
  'transition hover:bg-white/55 focus-visible:outline focus-visible:outline-2',
  'focus-visible:outline-offset-2 focus-visible:outline-white',
].join(' ');

export default function BookmarkedRecordButton({
  record,
  className = '',
  compact = false,
  variant = 'icon',
}) {
  const { isBookmarked, toggle } = useBookmarkedRecords();
  const id = record?.id;
  const active = id ? isBookmarked(id) : false;
  const label = active
    ? l('Ta bort från sparade')
    : l('Spara');
  const visibleLabel = active
    ? l('Sparad')
    : l('Spara');

  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle(record);
  };

  return (
    <button
      type="button"
      className={classNames(
        variant === 'contact'
          ? compactContactButtonClassName
          : [
            'inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-surface text-link shadow-sm',
            'hover:bg-surface-hover hover:text-link-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-focus',
            compact ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg',
            active && 'text-primary',
          ],
        className,
      )}
      onClick={handleClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={!id}
    >
      <FontAwesomeIcon icon={active ? faBookmarkSolid : faBookmarkRegular} aria-hidden="true" />
      {variant === 'contact' && <span>{visibleLabel}</span>}
    </button>
  );
}

BookmarkedRecordButton.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  variant: PropTypes.oneOf(['icon', 'contact']),
};
