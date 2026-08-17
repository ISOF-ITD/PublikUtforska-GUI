import PropTypes from 'prop-types';
import { l } from '../../../lang/Lang';
import contactButtonClassName from '../../../components/views/contactButtonClassName';

export default function TranscriptionHelpButton({
  inline = false,
  label = l('Instruktioner'),
}) {
  const helpButtonClick = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.transcriptionhelp');
    }
  };

  return (
    <button
      className={inline
        ? '!m-0 !border-0 !bg-transparent !p-0 align-baseline text-link underline hover:text-link-hover'
        : contactButtonClassName}
      onClick={helpButtonClick}
      type="button"
    >
      {label}
    </button>
  );
}

TranscriptionHelpButton.propTypes = {
  inline: PropTypes.bool,
  label: PropTypes.string,
};
