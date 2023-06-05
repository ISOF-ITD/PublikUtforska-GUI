import { useState, useEffect } from 'react';
import config from '../../config';
import PdfViewer from '../PdfViewer';

// Main CSS: ui-components/overlay.less

export default function ImageOverlay() {
  const [imageUrl, setImageUrl] = useState(null);
  const [type, setType] = useState(null);
  const [visible, setVisible] = useState(false);

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

    // Cleanup
    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.viewimage', viewImageHandler);
        window.eventBus.removeEventListener('overlay.hide', hideHandler);
      }
    };
  }, []);

  const closeButtonClickHandler = () => {
    setVisible(false);
  };

  return (
    <div className={`overlay-container${visible ? ' visible' : ''}`}>
      {imageUrl && type === 'image' && (
        <img className="overlay-image" src={config.imageUrl + imageUrl} />
      )}
      {imageUrl && type === 'pdf' && (
        <PdfViewer url={(config.pdfUrl || config.imageUrl) + imageUrl} height="100%" />
      )}
      <button
        title="stäng"
        className="close-button white"
        onClick={closeButtonClickHandler}
      />
    </div>
  );
}
