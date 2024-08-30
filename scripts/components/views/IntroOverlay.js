import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';

function IntroOverlay({ forceShow, onClose }) {
  const [showOverlay, setShowOverlay] = useState(localStorage.getItem('hideIntroOverlay003') !== 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const iframeRef = useRef(null); // Create ref for iframe
  // useState hook for managing visibility of the overlay
  const [currentIframeSrc, setCurrentIframeSrc] = useState('');
  // const [showOverlay, setShowOverlay] = useState(true);
  // const [iframeSrc, setIframeSrc] = useState(config.kontextStartPage);

  const resetIframeSrc = () => {
    if (iframeRef.current) {
      setCurrentIframeSrc(`${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${config.kontextStartPage}`);
    }
  };

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

  // useEffect to check when iframeRef.current is set (i.e., iframe is mounted)
  useEffect(() => {
    if (iframeRef.current) {
      setIsIframeLoaded(true); // Sätt state till true när iframen är tillgänglig
    }
  }, [iframeRef.current]); // Lägg till iframeRef.current som beroende

  useEffect(() => {
    if (iframeRef.current) {
    iframeRef.current.src = currentIframeSrc;
    }
  }, [currentIframeSrc]);

  useEffect(() => {
    const handleLocationChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      // Senare: Vill man "maskera" kontext-värdet i URL:t, kan man använda t ex base64-kodning
      const urlIframeSrc = urlParams.get('k');
      if (urlIframeSrc) {
        if (iframeRef.current) {
          iframeRef.current.src = `${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${urlIframeSrc}`;
          // setCurrentIframeSrc(`${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${urlIframeSrc}`)
        }
        setShowOverlay(true);
      }
    };
    handleLocationChange();
    window.onpopstate = handleLocationChange;

    return () => {
      window.onpopstate = null;
    };
  }, [isIframeLoaded]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.status && event.data.status !== 200) {
        resetIframeSrc(); // Återställ eller hantera felet på lämpligt sätt
      }
      
      if (event.data.newSrc) {
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('k', event.data.newSrc.split(config.kontextBasePath)[1]);
        window.history.pushState({}, '', newUrl); // Uppdaterar URL utan att ladda om
      }
    };

    window.addEventListener('message', handleMessage);

    // Rensa upp
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClose = () => {
    setShowOverlay(false);
    setIsLoading(true);
    const url = new URL(window.location);
    url.searchParams.delete('k');
    window.history.pushState({}, '', url);
    if (onClose) onClose(); // Kalla på onClose om den finns
  };

  // Function to handle checkbox change
  const handleDontShowAgain = () => {
    // When the checkbox is checked, we set 'hideIntroOverlay003' in localStorage and hide the overlay
    // As we are using localStorage, this value will persist indefinitely (until manually cleared)
    handleClose();
    localStorage.setItem('hideIntroOverlay003', 'true');
  };

  const handleCloseButtonClick = () => {
    handleClose();
  };

  // If 'showOverlay' is false, we don't render anything
  // if (!showOverlay) {
  //   return null;
  // }

  // Setting the class for the main div. If 'showOverlay' is true, we add 'visible' to the class
  const overlayClass = `overlay-container light-modal intro-overlay ${showOverlay ? 'visible' : ''}`;

  if (!showOverlay) return null;

  return (
    <div className={overlayClass}>
      <div className="intro">
        <div className="overlay-header">
          <span
            className="text"
            onClick={resetIframeSrc}
            onKeyDown={(event) => event.key === 'Enter' && resetIframeSrc()}
            role="button"
            tabIndex="0"
            style={{
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faBookOpen} />
            &nbsp; Introduktion
          </span>
          <div className="controls">
            {/* If 'hideIntroOverlay003' is true in localStorage,
            we don't render the link to hide it again */}
            { localStorage.getItem('hideIntroOverlay003') === 'true'
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
            ref={iframeRef}
            id="iframe"
            title="iframe"
            src={`${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${config.kontextStartPage}`}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: isLoading ? 'none' : 'block',
            }}
            onLoad={() => {
              setIsLoading(false);
              setIsIframeLoaded(true); // När iframen laddas, sätt state till true
            }}
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