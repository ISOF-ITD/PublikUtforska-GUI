import { useState, useEffect, useCallback } from 'react';
import config from '../../config';
import PdfViewer from '../PdfViewer';

// Main CSS: ui-components/overlay.less

export default function ImageOverlay() {
  const [imageUrl, setImageUrl] = useState(null);
  const [type, setType] = useState(null);
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mediaList, setMediaList] = useState([]);

  const closeOverlay = useCallback(() => {
    setVisible(false);
  }, []);

  const showNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (!mediaList || mediaList.length === 0 || nextIndex >= mediaList.length) return;
    const nextMediaItem = mediaList[nextIndex];
    setCurrentIndex(nextIndex);
    setImageUrl(nextMediaItem.source);
    setType(nextMediaItem.type);
  }, [mediaList, currentIndex]);

  const showPrev = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (!mediaList || mediaList.length === 0 || prevIndex < 0) return;
    const prevMediaItem = mediaList[prevIndex];
    setCurrentIndex(prevIndex);
    setImageUrl(prevMediaItem.source);
    setType(prevMediaItem.type);
  }, [mediaList, currentIndex]);

  useEffect(() => {
    const viewImageHandler = (event) => {
      const {
        imageUrl: newImageUrl,
        type: newType,
        mediaList: newMediaList = [],
        currentIndex: newCurrentIndex,
      } = event.target;

      setImageUrl(newImageUrl);
      setType(newType);
      setVisible(true);
      setMediaList(newMediaList);
      setCurrentIndex(newCurrentIndex);
    };

    const hideHandler = () => {
      setVisible(false);
    };

    if (window.eventBus) {
      window.eventBus.addEventListener('overlay.viewimage', viewImageHandler);
      window.eventBus.addEventListener('overlay.hide', hideHandler);
    }

    const handleKeyDown = (event) => {
      if (!visible) return;
      if (event.key === 'Escape') {
        closeOverlay();
      } else if (event.key === 'ArrowRight') {
        showNext();
      } else if (event.key === 'ArrowLeft') {
        showPrev();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.viewimage', viewImageHandler);
        window.eventBus.removeEventListener('overlay.hide', hideHandler);
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOverlay, visible, showNext, showPrev]);

  const closeButtonClickHandler = () => {
    setVisible(false);
  };

  const overlayClickHandler = (event) => {
    if (event.target.classList.contains('overlay-container')) {
      closeOverlay();
    }
  };

  const overlayKeyDownHandler = (event) => {
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
        {/* TODO: add buttons and create styling */}
        {/* {mediaList && mediaList.length > 1 && (
          <>
            <button
              className="prev-button"
              onClick={showPrev}
              aria-label="Föregående bild"
              type="button"
            >
              ‹
            </button>
            <button
              className="next-button"
              onClick={showNext}
              aria-label="Nästa bild"
              type="button"
            >
              ›
            </button>
          </>
        )} */}
      </div>
    </div>
  );
}
