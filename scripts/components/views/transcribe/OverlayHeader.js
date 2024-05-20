import React from 'react';

const OverlayHeader = ({ recordDetails, handleHideOverlay }) => (
  <div className="overlay-header">
    Skriv av
    {' '}
    {recordDetails.title || recordDetails.id}
    <button type="button" title="stäng" className="close-button white" onClick={handleHideOverlay}>Stäng</button>
  </div>
);

export default OverlayHeader;
