import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../config';

function IntroOverlay({ show, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const getInitialSrc = () => {
    const params = new URLSearchParams(location.search);
    const kParam = params.get('k') || config.kontextStartPage;
    return `${config.kontextBasePath}${kParam}`;
  };

  const [iframeSrc, setIframeSrc] = useState(getInitialSrc);

  const overlayClass = `overlay-container light-modal intro-overlay ${show ? 'visible' : ''}`;

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (event.data.newSrc?.startsWith('http')) {
          const newUrlObject = new URL(event.data.newSrc);
          const newPath = newUrlObject.href.replace(
            config.kontextBasePath,
            ''
          );
          console.log('Uppdaterar k-parametern med:', newPath, 'från meddelande');

          // Uppdatera endast URL:en, men inte iframeSrc
          const params = new URLSearchParams(location.search);
          if (params.get('k') !== newPath) {
            params.set('k', newPath);
            navigate(`?${params.toString()}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Fel vid konstruktion av URL:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, location.search]);

  const handleIntroductionClick = () => {
    console.log('Återställer k-parametern till startvärdet:', config.kontextStartPage, 'från handleIntroductionClick()');

    // Uppdatera både iframeSrc och URL:en
    const newSrc = config.kontextBasePath + config.kontextStartPage;
    setIframeSrc(newSrc);
    const params = new URLSearchParams(location.search);
    params.set('k', config.kontextStartPage);
    navigate(`?${params.toString()}`, { replace: true });
  };

  const handleClose = () => {
    if (onClose) onClose();
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
            {/* Meny */}
          </span>
          <div className="controls">
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
          <iframe
            ref={iframeRef}
            id="iframe"
            title="iframe"
            src={iframeSrc}
            style={{
              border: 'none',
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </div>
      </div>
    </div>
  );
}

IntroOverlay.propTypes = {
  show: PropTypes.bool,
  onClose: PropTypes.func,
};

IntroOverlay.defaultProps = {
  show: false,
  onClose: null,
};

export default IntroOverlay;
