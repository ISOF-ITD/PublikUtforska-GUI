import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../config';

function IntroOverlay({ forceShow, onClose }) {
  const [isLoading, setIsLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(localStorage.getItem('hideIntroOverlay005') !== 'true');
  const iframeRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const overlayClass = `overlay-container light-modal intro-overlay ${showOverlay ? 'visible' : ''}`;

  const getKParam = () => {
    const params = new URLSearchParams(location.search);
    return params.get('k') || config.kontextStartPage;
  };

  const updateKParam = (newPath) => {
    const params = new URLSearchParams(location.search);
    params.set('k', newPath);
    navigate({ search: params.toString() }, { replace: true });
  };

  useEffect(() => {
    if (forceShow) {
      setShowOverlay(true);
    }
  }, [forceShow]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (!params.has('k')) {
      updateKParam(config.kontextStartPage);
    }
  }, [location]);

  useEffect(() => {
    const kParam = getKParam();
    if (iframeRef.current) {
      const iframeSrc = `${config.folkeKontextApiUrl}?path=${config.kontextBasePath}${kParam}`;
      iframeRef.current.src = iframeSrc;
    }
  }, [location]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;

      if (!event.data || !event.data.newSrc) return;

      try {
        let newUrl;
        if (event.data.newSrc.startsWith('http')) {
          newUrl = new URL(event.data.newSrc);
        } else {
          newUrl = new URL(event.data.newSrc, window.location.origin);
        }

        const newPath = newUrl.pathname.replace(config.kontextBasePath, '');
        updateKParam(newPath);
      } catch (error) {
        console.error('Error constructing URL:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleIntroductionClick = () => {
    updateKParam(config.kontextStartPage);
  };

  const handleClose = () => {
    setShowOverlay(false);
    if (onClose) onClose();
  };

  const handleDontShowAgain = () => {
    localStorage.setItem('hideIntroOverlay005', 'true');
    handleClose();
  };

  return (
    <div className={overlayClass}>
      <div className="intro">
        <div className="overlay-header">
          <span
            className="text"
            style={{ cursor: 'pointer' }}
            onClick={handleIntroductionClick}
            role="button"
            tabIndex="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleIntroductionClick();
            }}
          >
            <FontAwesomeIcon icon={faBookOpen} />
            &nbsp; Introduktion
          </span>
          <div className="controls">
            {localStorage.getItem('hideIntroOverlay005') === 'true' ? null : (
              <span
                className="control-link"
                onClick={handleDontShowAgain}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleDontShowAgain();
                }}
              >
                Visa inte igen
              </span>
            )}
            <span
              onClick={handleClose}
              role="button"
              tabIndex="0"
              className="intro-close-button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClose();
              }}
            >
              Stäng
            </span>
          </div>
        </div>

        <div className="content">
          {isLoading ? <div className="iframe-loading" /> : null}
          <iframe
            ref={iframeRef}
            id="iframe"
            title="iframe"
            src=""
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

IntroOverlay.propTypes = {
  forceShow: PropTypes.bool,
  onClose: PropTypes.func,
};

IntroOverlay.defaultProps = {
  forceShow: false,
  onClose: null,
};

export default IntroOverlay;
