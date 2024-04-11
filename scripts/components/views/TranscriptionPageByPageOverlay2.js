import React, { useState, useEffect } from 'react';
import axios from 'axios'; // För enklare API-anrop
import config from '../../config'; // Kontrollera att sökvägen är korrekt

function TranscriptionPageComponent({ recordId }) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [message, setMessage] = useState('');
  const [pages, setPages] = useState([]);
  const [recordDetails, setRecordDetails] = useState({
    url: '',
    id: '',
    archiveId: '',
    title: '',
    type: '',
    transcriptionType: '',
    placeString: '',
  });

  useEffect(() => {
    const handleShowOverlay = (event) => {
      setIsVisible(true);
      setRecordDetails({
        url: event.target.url,
        id: recordId,
        archiveId: event.target.archiveId,
        title: event.target.title,
        type: event.target.type,
        transcriptionType: event.target.transcriptionType,
        placeString: event.target.placeString,
      });
      setPages(event.target.images || []);
    };

    const handleHideOverlay = () => {
      setIsVisible(false);
    };

    window.eventBus.addEventListener('overlay.transcribePageByPage', handleShowOverlay);
    window.eventBus.addEventListener('overlay.hide', handleHideOverlay);

    return () => {
      window.eventBus.removeEventListener('overlay.transcribePageByPage', handleShowOverlay);
      window.eventBus.removeEventListener('overlay.hide', handleHideOverlay);
    };
  }, [recordId]);

  const navigatePages = (index) => {
    setCurrentPageIndex(index);
    setTranscriptionText('');
    setMessage('');
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        pageId: pages[currentPageIndex].id,
        text: transcriptionText,
      };

      await axios.post(`${config.apiUrl}transcribe`, payload);
      setMessage('Transkriptionen skickades in framgångsrikt.');
      setTranscriptionText('');
    } catch (error) {
      setMessage('Det gick inte att skicka in transkriptionen.');
    }
  };

  const handleTextChange = (e) => {
    setTranscriptionText(e.target.value);
  };

  if (!isVisible) return null;

  return (
    <div className={'overlay-container visible'}>
      <div className="overlay-window large">
        <div className="overlay-header">
          Skriv av {recordDetails.title} - {recordDetails.type}
          <button title="stäng" className="close-button white" onClick={() => setIsVisible(false)}>Stäng</button>
        </div>
        <div className="row">
          <div className="four columns">
            <textarea
              value={transcriptionText}
              onChange={handleTextChange}
              placeholder="Skriv din transkription här..."
              className="u-full-width"
            />
            <button className="button-primary" onClick={handleSubmit}>Skicka in</button>
          </div>
          <div className="eight columns">
            {pages.length > 0 && (
              <img
                className="main-image"
                src={`${config.imageUrl}${pages[currentPageIndex].source}`}
                alt={`Sida ${currentPageIndex + 1}`}
              />
            )}
            <div className="image-thumbnails">
              {pages.map((page, index) => (
                page.source && page.source.indexOf('.pdf') === -1 && (
                  <img
                    key={index}
                    className="thumbnail"
                    src={`${config.imageUrl}${page.source}`}
                    alt={`Thumbnail ${index + 1}`}
                    onClick={() => navigatePages(index)}
                  />
                )
              ))}
            </div>
          </div>
        </div>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default TranscriptionPageComponent;