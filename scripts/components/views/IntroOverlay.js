import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';

function IntroOverlay({ forceShow, onClose }) {
  const [showOverlay, setShowOverlay] = useState(localStorage.getItem('hideIntroOverlay002') !== 'true');
  const [isLoading, setIsLoading] = useState(true);
  // useState hook for managing visibility of the overlay
  // const [showOverlay, setShowOverlay] = useState(true);
  // const [iframeSrc, setIframeSrc] = useState(config.kontextStartPage);

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.target.click();
    }
  };

  // React to changes in forceShow
  useEffect(() => {
    if (forceShow) {
      setShowOverlay(true);
    }
  }, [forceShow]);

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

  const handleClose = () => {
    setShowOverlay(false);
    const url = new URL(window.location);
    url.searchParams.delete('iframeSrc');
    window.history.pushState({}, '', url);
    if (onClose) onClose(); // Kalla på onClose om den finns
  };

  // Function to handle checkbox change
  const handleDontShowAgain = () => {
    // When the checkbox is checked, we set 'hideIntroOverlay002' in localStorage and hide the overlay
    // As we are using localStorage, this value will persist indefinitely (until manually cleared)
    handleClose();
    localStorage.setItem('hideIntroOverlay002', 'true');
  };

  const handleCloseButtonClick = () => {
    handleClose();
  };

  // If 'showOverlay' is false, we don't render anything
  if (!showOverlay) {
    return null;
  }

  // Setting the class for the main div. If 'showOverlay' is true, we add 'visible' to the class
  const overlayClass = `overlay-container light-modal intro-overlay ${showOverlay ? 'visible' : ''}`;

  if (!showOverlay) return null;

  return (
    <div className={overlayClass}>
      <div className="intro">
        <div className="overlay-header">
          <span className="text">
            <FontAwesomeIcon icon={faBookOpen} />
            &nbsp; Introduktion
          </span>
          <div className="controls">
            {/* If 'hideIntroOverlay002' is true in localStorage,
            we don't render the link to hide it again */}
            { localStorage.getItem('hideIntroOverlay002') === 'true'
              ? null
              : (
                <span
                  className="control-link"
                  onClick={handleDontShowAgain}
                  onKeyDown={handleKeyDown}
                  role="button"
                  tabIndex="0"
                >
                  Visa inte igen
              </span>
              )
            }
            <span
              onClick={handleCloseButtonClick}
              onKeyDown={handleKeyDown}
              role="button"
              tabIndex="0"
              className="intro-close-button"
            >
              Stäng
            </span>

          </div>
        </div>

        <div className="content">
          {
            isLoading
              ? <div className="iframe-loading" />
              : null
          }
          <iframe
            id="iframe"
            title="iframe"
            src={`${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${config.kontextStartPage}`}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: isLoading ? 'none' : 'block',
            }}
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
}

export default IntroOverlay;

// props validation
IntroOverlay.propTypes = {
  forceShow: PropTypes.bool,
  onClose: PropTypes.func,
};

IntroOverlay.defaultProps = {
  forceShow: false,
  onClose: null,
};