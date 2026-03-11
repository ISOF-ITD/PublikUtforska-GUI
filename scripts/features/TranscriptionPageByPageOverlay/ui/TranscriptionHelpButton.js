/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import contactButtonClassName from '../../../components/views/contactButtonClassName';

export default function TranscriptionHelpButton({ title = '', type }) {
  const { pathname } = useLocation();

  const helpButtonClick = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.transcriptionhelp', {
        url: `${config.siteUrl}${pathname}`,
        title,
        type,
        appUrl: config.appUrl,
      });
    }
  };

  return (
    <button
      className={contactButtonClassName}
      onClick={helpButtonClick}
      type="button"
    >
      {l('Instruktioner')}
    </button>
  );
}

TranscriptionHelpButton.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
};
