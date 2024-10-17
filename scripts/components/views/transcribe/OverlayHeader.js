import React from 'react';
import config from '../../../config';

import ContributeInfoButton from '../ContributeInfoButton';
import FeedbackButton from '../FeedbackButton';
import TranscriptionHelpButton from './TranscriptionHelpButton';

function OverlayHeader({ recordDetails, handleHideOverlay }) {
  return (
    <div className="overlay-header">
      Skriv av
      {' '}
      {recordDetails.title || 'uppteckning'}
      {recordDetails.archiveId && (
        <small>
          &nbsp;(ur {recordDetails.archiveId}
          {recordDetails.placeString ? ` ${recordDetails.placeString}` : ''}
          )
        </small>
      )}
      {' '}
      {recordDetails.transcriptionType === 'sida' && (
        <small>(sida för sida)</small>
      )}
      <button
        type="button"
        title="stäng"
        className="close-button white"
        onClick={handleHideOverlay}
        aria-label="Stäng"
      />

      {!config.siteOptions.hideContactButton && (
        <>
          <FeedbackButton type="Uppteckning" />
          <ContributeInfoButton type="Uppteckning" />
          <TranscriptionHelpButton type="Uppteckning" />
        </>
      )}
    </div>
  );
}

export default OverlayHeader;
