import React from 'react';
import PropTypes from 'prop-types';
import config from '../../config';
import { getPlaceString } from '../../utils/helpers';

// The TranscribeButton component is a functional component that, when clicked, dispatches
// a 'overlay.transcribe' event via the global eventBus object. The event data contains
// details about the current record.
// The component can take in several props to customize its appearance and behavior.
function TranscribeButton({
  random,
  recordId,
  archiveId,
  title,
  type,
  images,
  transcriptionType,
  places,
  className,
  onClick,
  label,
}) {
  // This function handles button clicks. If a custom onClick handler is provided, it uses that;
  // otherwise, it defaults to dispatching an 'overlay.transcribe' event.
  const transcribeButtonClick = () => {
    if (window.eventBus) {
      if (random) {
        window.eventBus.dispatch('overlay.transcribe', {
          random: true,
        });
      } else {
        window.eventBus.dispatch('overlay.transcribe', {
          url: `${config.siteUrl}#/records/${recordId}`,
          id: recordId,
          archiveId,
          title,
          type,
          images,
          transcriptionType,
          placeString: getPlaceString(places),
        });
      }
    }
  };

  TranscribeButton.propTypes = {
    random: PropTypes.bool,
    recordId: PropTypes.string,
    archiveId: PropTypes.string,
    title: PropTypes.string,
    type: PropTypes.string,
    images: PropTypes.array,
    transcriptionType: PropTypes.string,
    places: PropTypes.array,
    className: PropTypes.string,
    onClick: PropTypes.func,
    label: PropTypes.string.isRequired,
  };

  TranscribeButton.defaultProps = {
    random: false,
    recordId: '',
    archiveId: '',
    title: '',
    type: '',
    images: [],
    transcriptionType: '',
    places: [],
    className: '',
    onClick: transcribeButtonClick,
  };

  return (
    // Render a button with a dynamic class name based on the passed-in props.
    // The button's click event is tied to the transcribeButtonClick function,
    // or to the onClick prop if it's provided.
    <button
      className={`transcribe-button${className ? ` ${className}` : ''}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

export default TranscribeButton;
