import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { l } from '../lang/Lang';

export default function ParishGroupingToggle({
  grouped,
  onToggle,
  variant = 'surface',
}) {
  return (
    <button
      type="button"
      aria-pressed={grouped}
      aria-controls="record-list-panel"
      data-result-group-toggle
      onClick={onToggle}
      className={classNames(
        'inline-flex min-h-8 items-center justify-center gap-2 rounded border px-3 py-1',
        'text-sm leading-normal focus-visible:outline focus-visible:outline-2',
        'focus-visible:outline-offset-2',
        variant === 'inverse'
          ? 'border-white/70 bg-transparent !text-white hover:bg-primary-hover focus-visible:outline-white'
          : 'border-border bg-surface text-link hover:bg-surface-hover focus-visible:outline-focus',
        grouped && variant === 'inverse' && [
          '!border-white !bg-surface !text-body hover:!bg-surface-hover',
        ],
        grouped && variant === 'surface' && [
          '!border-primary !bg-surface-muted !text-body',
        ],
      )}
    >
      <FontAwesomeIcon icon={faList} aria-hidden="true" />
      {l('Visa kartans innehåll som lista')}
    </button>
  );
}

ParishGroupingToggle.propTypes = {
  grouped: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['surface', 'inverse']),
};
