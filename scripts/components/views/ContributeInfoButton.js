/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { l } from '../../lang/Lang';
import contactButtonClassName from './contactButtonClassName';

const inlineButtonClassName = [
  'm-0 inline-flex min-h-11 items-center rounded-md border border-border',
  'bg-surface px-4 py-2 font-semibold text-body shadow-sm',
  'hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2',
  'focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
].join(' ');

export default function ContributeInfoButton({
  expanded,
  controls,
  onClick,
  buttonRef = undefined,
  variant = 'header',
}) {
  return (
    <button
      ref={buttonRef}
      className={variant === 'inline' ? inlineButtonClassName : contactButtonClassName}
      onClick={onClick}
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
    >
      {l('Komplettera eller rätta en uppgift, ställ en fråga eller lämna en synpunkt.')}
    </button>
  );
}

ContributeInfoButton.propTypes = {
  expanded: PropTypes.bool.isRequired,
  controls: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  buttonRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
  variant: PropTypes.oneOf(['header', 'inline']),
};
