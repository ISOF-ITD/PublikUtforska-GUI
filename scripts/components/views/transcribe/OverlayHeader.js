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
      {recordDetails.title || recordDetails.id}
      {' '}
      {recordDetails.transcriptionType === 'sida' ? '(sida för sida)' : ''}
      <button type="button" title="stäng" className="close-button white" onClick={handleHideOverlay}>Stäng</button>
      {
      !config.siteOptions.hideContactButton
      && <FeedbackButton type="Uppteckning" />
    }
      {
      !config.siteOptions.hideContactButton
      && <ContributeInfoButton type="Uppteckning" />
    }
      {
      !config.siteOptions.hideContactButton
      && <TranscriptionHelpButton type="Uppteckning" />
    }
    </div>
  );
}

export default OverlayHeader;
