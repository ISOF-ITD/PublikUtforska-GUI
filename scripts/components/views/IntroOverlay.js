import React, { useState, useEffect } from 'react';

function IntroOverlay() {
  // useState hook for managing visibility of the overlay
  const [showOverlay, setShowOverlay] = useState(true);
  const [iframeSrc, setIframeSrc] = useState('https://www.isof.se/folke-kontext/sida-1');

  useEffect(() => {
    const hideIntroOverlay = localStorage.getItem('hideIntroOverlay');

    if (hideIntroOverlay) {
      setShowOverlay(false);
    } else {
      // kolla efter urlparam "iframepath" och sätt dess värde som state "iframepath"
      const urlParams = new URLSearchParams(window.location.search);
      setIframeSrc(urlParams.get('iframeSrc') || iframeSrc);
    }
  }, []);

  useEffect(() => {
    const handleMessage = (event) => {
      // Säkerhetskontroll: Verifiera `event.origin` för att se till
      // att det är isof.se som skickat meddelandet
      if (event.origin !== 'https://www.isof.se') return;

      if (event.data.newSrc) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('iframeSrc', event.data.newSrc);
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
  };

  // If 'showOverlay' is false, we don't render anything
  if (!showOverlay) {
    return null;
  }

  // Setting the class for the main div. If 'showOverlay' is true, we add 'visible' to the class
  const overlayClass = `overlay-container light-modal intro-overlay ${showOverlay ? 'visible' : ''}`;

  return (
    <div className={overlayClass}>
      <div className="overlay-window">
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
          src={iframeSrc}
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
