import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { l } from '../lang/Lang';
import useStarredRecords from '../hooks/useStarredRecords';
import contactButtonClassName from './views/contactButtonClassName';

export default function StarredRecordButton({
  record,
  className = '',
  compact = false,
  variant = 'icon',
}) {
  const { isStarred, toggle } = useStarredRecords();
  const id = record?.id;
  const active = id ? isStarred(id) : false;
  const label = active
    ? l('Ta bort stjärnmarkering')
    : l('Stjärnmarkera');
  const visibleLabel = active
    ? l('Stjärnmarkerad')
    : l('Stjärnmarkera');

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
          ? `${contactButtonClassName} inline-flex items-center gap-2`
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
      <FontAwesomeIcon icon={active ? faStarSolid : faStarRegular} aria-hidden="true" />
      {variant === 'contact' && <span>{visibleLabel}</span>}
    </button>
  );
}

StarredRecordButton.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  className: PropTypes.string,
  compact: PropTypes.bool,
  variant: PropTypes.oneOf(['icon', 'contact']),
};
