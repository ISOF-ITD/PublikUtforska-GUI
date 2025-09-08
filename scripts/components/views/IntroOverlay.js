/* eslint-disable react/require-default-props */
import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import config from '../../config';

function IntroOverlay({ show = false, onClose }) {
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
        if (event.data.type === 'navigateAway') {
          // Anropa onClose med en liten fördröjning för att låta navigeringen ske
          setTimeout(() => {
            if (onClose) onClose();
          }, 100); // Fördröjning i millisekunder, justera vid behov
        }

        if (event.data.newSrc?.startsWith('http')) {
          const newUrlObject = new URL(event.data.newSrc);
          const newPath = newUrlObject.href.replace(
            config.kontextBasePath,
            '',
          );

          const params = new URLSearchParams(location.search);
          if (params.get('k') !== newPath) {
            params.set('k', newPath);
            navigate(`?${params.toString()}`, { replace: true });
          }
        }
      } catch (error) {
        console.error('Fel vid hantering av meddelande:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, location.search, onClose]);

  const handleIntroductionClick = () => {
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
            style={{
              // no text wrapping, use ellipsis if text is too long
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginRight: '15px',
            }}
            title={config.siteTitle}
          >
            
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
              {/* Stäng */}
              {'Gå vidare till karta med sökfunktion >'}
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

export default IntroOverlay;
