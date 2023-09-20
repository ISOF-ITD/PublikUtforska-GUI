import React, { useState, useEffect } from 'react';

function IntroOverlay() {
  // useState hook for managing visibility of the overlay
  const [showOverlay, setShowOverlay] = useState(true);
  // useState hook for managing the content fetched from the API
  const [content, setContent] = useState('');

  useEffect(() => {
    const hideIntroOverlay = localStorage.getItem('hideIntroOverlay');
    
    if (hideIntroOverlay) {
      setShowOverlay(false);
    } else {
      fetch('https://www.isof.se/rest-api/folke-context/start', {
        method: 'GET',
      })
      .then((response) => response.json())
      .then((data) => {
        setContent(data.content);
      })
      .catch((err) => console.error('Något gick fel:', err));
    }
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
          <button className="close-button white" onClick={handleCloseButtonClick} />
          <h2>Välkommen till Folke sök!</h2>
        </div>
        <div>
          {/* The content fetched from the API */}
        </div>
        <div>
          {/* Här använder vi 'dangerouslySetInnerHTML' för att injicera den HTML-formaterade texten */}
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
        {/* Checkbox to choose not to show the overlay again */}
        <p />
        <label htmlFor="hideOverlay">
          <input id="hideOverlay" type="checkbox" onChange={handleCheckboxChange} />
          Visa inte igen
        </label>
        {/* Adding the Close button here */}
        <button onClick={handleCloseButtonClick}>Stäng</button>
      </div>
    </div>
  );
}

export default IntroOverlay;
