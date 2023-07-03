import React, { useState, useEffect } from 'react';

function IntroOverlay() {
  // useState hook for managing visibility of the overlay
  const [showOverlay, setShowOverlay] = useState(true);
  // useState hook for managing the content fetched from the API
  const [content, setContent] = useState(`
    Välkommen till Folke sök! Här kan du söka i ISOFs arkiv och samlingar. 
    Du kan söka på personer, platser, föremål, händelser och mycket mer.
    Du kan också söka i Folkebibeln, en samling av bibeltexter på svenska dialekter.
    Folke sök är en del av projektet Folke, som är ett samarbete mellan
    Institutet för språk och folkminnen (ISOF) och Kungliga biblioteket (KB).

    Hur fungerar Folke sök?
    Folke sök är en söktjänst som söker i flera olika databaser samtidigt.
    När du söker på något i Folke sök får du träffar från flera olika databaser.
    Du kan sedan klicka dig vidare till den databas som du är intresserad av.
    Du kan också välja att söka direkt i en databas genom att klicka på dess namn i menyn.
    Då kommer du till den databasens egen söksida.

    Hur söker jag?
    Du kan söka på flera olika sätt. Du kan söka på ett ord eller en fras.
    Du kan också söka på flera ord samtidigt. Då får du träffar som innehåller alla orden.
    Du kan också söka på en exakt fras genom att sätta citattecken runt orden.
    Du kan också söka på en exakt fras genom att sätta citattecken runt orden.
    Du kan också söka på en exakt fras genom att sätta citattecken runt orden.

  `);

  useEffect(() => {
    // On component mount, we check if the 'hideIntroOverlay' value exists in localStorage
    // As we are using localStorage, if set, this value will persist indefinitely (until manually cleared)
    const hideIntroOverlay = localStorage.getItem('hideIntroOverlay');

    if (hideIntroOverlay) {
      // If it exists, we set the 'showOverlay' state to false, hence, not displaying the overlay
      setShowOverlay(false);
    } else {
      // If 'hideIntroOverlay' doesn't exist in localStorage, it means the user hasn't chosen to hide the overlay
      // We fetch the content from the API to display in the overlay
      fetch('URL_TILL_SITEVISION_API')
        .then((response) => response.json())
        .then((data) => {
          // Once the data is fetched, we update the 'content' state with the text from the API
          setContent(data.text); // Replace 'data.text' with the actual key based on API response's structure
        })
        .catch((err) => console.error(err));
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
        {content}
        {/* Checkbox to choose not to show the overlay again */}
        <p/>
        <label htmlFor="hideOverlay">
          <input id="hideOverlay" type="checkbox" onChange={handleCheckboxChange} />
          Visa inte igen
        </label>
      </div>
    </div>
  );
}

export default IntroOverlay;
