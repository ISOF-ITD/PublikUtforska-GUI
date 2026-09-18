import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';
import contactButtonClassName from '../../../components/views/contactButtonClassName';

export default function TranscriptionHelpButton({
  className = null,
  inline = false,
  label = l('Instruktioner'),
  expanded,
  controls,
  onClick,
  buttonRef = null,
}) {
  return (
    <button
      ref={buttonRef}
      className={className || (inline
        ? '!m-0 !border-0 !bg-transparent !p-0 align-baseline text-link underline hover:text-link-hover'
        : contactButtonClassName)}
      onClick={onClick}
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
    >
      {label}
    </button>
  );
}

TranscriptionHelpButton.propTypes = {
  className: PropTypes.string,
  inline: PropTypes.bool,
  label: PropTypes.string,
  expanded: PropTypes.bool.isRequired,
  controls: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  buttonRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }),
};
