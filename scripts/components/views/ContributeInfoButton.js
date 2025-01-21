/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';

// Main CSS: /ui-components/feedback-buttons.less";

export default function ContributeInfoButton({
  title = '',
  type,
  country = undefined,
  id = undefined,
}) {
  const { pathname } = useLocation();

  const contributeinfoButtonClick = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.contributeinfo', {
        url: `${config.siteUrl}${pathname}`,
        title,
        type,
        country,
        appUrl: config.appUrl,
        id,
      });
    }
  };

  return (
    <button
      className="feedback-button contributeinfo-button"
      onClick={contributeinfoButtonClick}
      type="button"
    >
      {l('Vet du mer?')}
    </button>
  );
}

ContributeInfoButton.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
  country: PropTypes.string,
  id: PropTypes.string,
};
