/* eslint-disable react/require-default-props */
import React from 'react';
import PropTypes from 'prop-types';
import config from '../../../config';
import { getPlaceString } from '../../../utils/helpers';

// The TranscribeButton component is a functional component that, when clicked, dispatches
// a 'overlay.transcribe' event via the global eventBus object. The event data contains
// details about the current record.
// The component can take in several props to customize its appearance and behavior.
export default function TranscribeButton({
  random = false,
  recordId = '',
  archiveId = '',
  title = '',
  type = '',
  images = [],
  transcriptionType = '',
  places = '',
  className = '',
  // NOTE: We're intentionally not setting a prop for `onClick`.
  // The default behavior for the `onClick` action is encapsulated within
  // the `transcribeButtonClick` function inside the component.
  // If we set it as a default, the function would be bound during its declaration
  // and wouldn't have access to the component's most recent props.
  // By handling the default onClick directly in the component's render logic,
  // we ensure that the function always has the latest props available to it.
  onClick,
  label,
  helptext = null,
}) {
  // This function handles button clicks. If a custom onClick handler is provided, it uses that;
  // otherwise, it defaults to dispatching an 'overlay.transcribe' event.
  const transcribeButtonClick = () => {
    if (window.eventBus) {
      if (random) {
        window.eventBus.dispatch('overlay.transcribe', {
          random: true,
        });
      } else if (transcriptionType === 'sida') {
        window.eventBus.dispatch('overlay.transcribePageByPage', {
          url: `${config.siteUrl}/records/${recordId}`,
          id: recordId,
          archiveId,
          title,
          type,
          images,
          transcriptionType,
          placeString: getPlaceString(places),
        });
      } else {
        window.eventBus.dispatch('overlay.transcribe', {
          url: `${config.siteUrl}/records/${recordId}`,
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

  const effectiveOnClick = onClick || transcribeButtonClick;

  if (!config.activateTranscription) {
    // Ingen knapp
    return null;
  }
  // else visa knapp
  return (
    // Render a button with a dynamic class name based on the passed-in props.
    // The button's click event is tied to the transcribeButtonClick function,
    // or to the onClick prop if it's provided.
    <div>
      {/* Conditionally render the help text if it's provided */}
      {helptext && (
        <div className="help-text">
          {helptext}
        </div>
      )}
      <button
        className={`transcribe-button${className ? ` ${className}` : ''}`}
        onClick={effectiveOnClick}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}

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
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  helptext: PropTypes.string,
};
