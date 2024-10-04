/* eslint-disable react/require-default-props */
import PropTypes from 'prop-types';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';

// Main CSS: /ui-components/feedback-buttons.less

export default function FeedbackButton({
  title = '', type, country = undefined,
}) {
  const { pathname } = useLocation();

  const feedbackButtonClick = () => {
    if (window.eventBus) {
      window.eventBus.dispatch('overlay.feedback', {
        url: `${config.siteUrl}#${pathname}`,
        title,
        type,
        country,
        appUrl: config.appUrl,
      });
    }
  };

  return (
    <button
      className="feedback-button"
      onClick={feedbackButtonClick}
      type="button"
    >
      {l('Frågor och synpunkter')}
    </button>
  );
}

FeedbackButton.propTypes = {
  title: PropTypes.string,
  type: PropTypes.string.isRequired,
  country: PropTypes.string,
};
