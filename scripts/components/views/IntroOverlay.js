import React, { useState, useEffect } from 'react';
import config from '../../config';

function IntroOverlay() {
  // useState hook for managing visibility of the overlay
  const [showOverlay, setShowOverlay] = useState(true);
  // const [iframeSrc, setIframeSrc] = useState(config.kontextStartPage);

  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlIframeSrc = urlParams.get('iframeSrc');
      if (urlIframeSrc) {
        // setIframeSrc(urlIframeSrc);
        const iframe = document.getElementById('iframe');
        iframe.src = `${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${urlIframeSrc}`;
      }
    };
    handleLocationChange();
    window.onpopstate = handleLocationChange;

    return () => {
      window.onpopstate = null;
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.newSrc) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('iframeSrc', event.data.newSrc.split(config.kontextBasePath)[1]);
        window.history.pushState({}, '', newUrl); // Uppdaterar URL utan att ladda om
      }
    };

    window.addEventListener('message', handleMessage);

    // Rensa upp
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Function to handle checkbox change
  const handleCheckboxChange = () => {
    // When the checkbox is checked, we set 'hideIntroOverlay' in localStorage and hide the overlay
    // As we are using localStorage, this value will persist indefinitely (until manually cleared)
    localStorage.setItem('hideIntroOverlay', 'true');
    setShowOverlay(false);
  };

  // Function to handle close button click
  const handleCloseButtonClick = () => {
    // When the close button is clicked, we hide the overlay
    setShowOverlay(false);
    // Remove search param "iframeSrc":
    const url = new URL(window.location);
    url.searchParams.delete('iframeSrc');
    window.history.pushState({}, '', url);
  };

  // If 'showOverlay' is false, we don't render anything
  if (!showOverlay) {
    return null;
  }

  // Setting the class for the main div. If 'showOverlay' is true, we add 'visible' to the class
  const overlayClass = `overlay-container light-modal intro-overlay ${showOverlay ? 'visible' : ''}`;

  return (
    <div className={overlayClass}>
      <div className="overlay-window intro">
        <div className="overlay-header">
          {/* Close button. On click, it hides the overlay */}
          <button
            className="close-button white"
            onClick={handleCloseButtonClick}
            type="button"
          />
          <h2>Välkommen till Folke sök!</h2>
        </div>
        <iframe
          id="iframe"
          title="iframe"
          src={`${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${config.kontextStartPage}`}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',

          }}
        />
        {/* Checkbox to choose not to show the overlay again */}
        <p />
        <label htmlFor="hideOverlay">
          <input id="hideOverlay" type="checkbox" onChange={handleCheckboxChange} />
          Visa inte igen
        </label>
        {/* Adding the Close button here */}
        <button
          onClick={handleCloseButtonClick}
          type="button"
        >
          Stäng
        </button>
      </div>
    </div>
  );
}

export default IntroOverlay;
