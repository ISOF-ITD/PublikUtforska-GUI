import { useState, useEffect, useCallback } from 'react';
import config from '../../config';
import PdfViewer from '../PdfViewer';

// Main CSS: ui-components/overlay.less

export default function ImageOverlay() {
  const [imageUrl, setImageUrl] = useState(null);
  const [type, setType] = useState(null);
  const [visible, setVisible] = useState(false);

  // Funktion för att stänga overlayen
  // useCallback förhindrar att closeOverlay skapas om vid varje render,
  // vilket förbättrar prestandan och säkerställer att useEffect inte körs i onödan.
  const closeOverlay = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    const viewImageHandler = (event) => {
      setImageUrl(event.target.imageUrl);
      setType(event.target.type);
      setVisible(true);
    };

    const hideHandler = () => {
      setVisible(false);
    };

    if (window.eventBus) {
      window.eventBus.addEventListener('overlay.viewimage', viewImageHandler);
      window.eventBus.addEventListener('overlay.hide', hideHandler);
    }

    // Hantera ESC-tangenttryck
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeOverlay();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.viewimage', viewImageHandler);
        window.eventBus.removeEventListener('overlay.hide', hideHandler);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOverlay]);

  const closeButtonClickHandler = () => {
    setVisible(false);
  };

  // Klickhanterare för att stänga overlayen när man klickar utanför innehållet
  const overlayClickHandler = (event) => {
    // Kontrollera om klicket är direkt på overlay-containern
    if (event.target.classList.contains('overlay-container')) {
      closeOverlay();
    }
  };

  // Tangentbordshanterare för overlay-containern
  const overlayKeyDownHandler = (event) => {
    // Du kan definiera specifika tangenter som ska stänga overlayen
    // Här stänger vi overlayen om användaren trycker på Enter eller Space
    if (event.key === 'Enter' || event.key === ' ') {
      closeOverlay();
    }
  };

  return (
    <div
      className={`overlay-container${visible ? ' visible' : ''}`}
      onClick={overlayClickHandler}
      onKeyDown={overlayKeyDownHandler}
      role="dialog"
      aria-modal="true"
    >
      <div className="overlay-content">
        {imageUrl && type === 'image' && (
          <img
            className="overlay-image"
            src={config.imageUrl + imageUrl}
            alt="Overlay"
          />
        )}
        {imageUrl && type === 'pdf' && (
          <PdfViewer
            url={(config.pdfUrl || config.imageUrl) + imageUrl}
            height="100%"
          />
        )}
        <button
          title="Stäng"
          className="close-button white"
          onClick={closeButtonClickHandler}
          aria-label="Stäng overlay"
          type="button"
        />
      </div>
    </div>
  );
}
