/* eslint-disable react/require-default-props */
import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';
import { l } from '../../lang/Lang';
import { getFocusableElements } from '../../utils/focusHelper';
import folkeWhiteLogo from '../../../img/folke-white.svg';
import IsofLogoWhite from '../../../img/logotyp-isof-vit.svg';

function IntroOverlay({ show = false, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  const introRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const getInitialSrc = () => {
    const params = new URLSearchParams(location.search);
    const kParam = params.get('k') || config.kontextStartPage;
    return `${config.kontextBasePath}${kParam}`;
  };

  const [iframeSrc] = useState(getInitialSrc);

  const overlayClass = `overlay-container light-modal intro-overlay ${
    show ? 'visible' : ''
  }`;

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (event.data.type === 'navigateAway') {
          setTimeout(() => {
            if (onClose) onClose();
          }, 100);
        }

        if (event.data.newSrc?.startsWith('http')) {
          const newUrlObject = new URL(event.data.newSrc);
          const newPath = newUrlObject.href.replace(config.kontextBasePath, '');

          const params = new URLSearchParams(location.search);
          if (params.get('k') !== newPath) {
            params.set('k', newPath);
            navigate(`?${params.toString()}`, { replace: true });
          }
        }
      } catch {
        // Ignore malformed postMessage payloads from the embedded content.
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [navigate, location.search, onClose]);

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!show) return undefined;

    restoreFocusRef.current = document.activeElement;
    const animationFrameId = window.requestAnimationFrame(() => {
      introRef.current?.focus();
    });

    const onDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = introRef.current;
      if (!root) return;

      const focusableElements = getFocusableElements(root);
      if (focusableElements.length === 0) {
        event.preventDefault();
        root.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;
      const activeInsideOverlay = root.contains(active);

      if (event.shiftKey) {
        if (!activeInsideOverlay || active === first || active === root) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeInsideOverlay || active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onDocumentKeyDown);
    return () => {
      document.removeEventListener('keydown', onDocumentKeyDown);
      window.cancelAnimationFrame(animationFrameId);
      try {
        const activeFilterSwitchLink = document.querySelector(
          'nav[data-focus-id="filter-switch"] a[aria-current="page"]',
        ) || document.querySelector('nav[data-focus-id="filter-switch"] a');
        if (activeFilterSwitchLink?.focus) {
          activeFilterSwitchLink.focus();
          return;
        }
        restoreFocusRef.current?.focus?.();
      } catch {
        // Ignore focus restoration failures if the previous element is gone.
      }
    };
  }, [show, handleClose]);

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
    >
      <div className="intro focus:outline-none" ref={introRef} tabIndex={-1}>
        <div className="overlay-header">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h1 className="m-0 shrink-0">
              <img
                src={folkeWhiteLogo}
                alt={l('Folkelogga')}
                className="h-12 w-auto max-w-[40vw] object-contain sm:max-w-none"
              />
            </h1>
            <span aria-hidden className="h-6 w-px shrink-0 bg-white/30" />
            <a
              href="https://www.isof.se"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-0 items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label={l('Öppna Institutet för språk och folkminnens webbplats i nytt fönster')}
              title={l('Institutet för språk och folkminnen')}
            >
              <img
                src={IsofLogoWhite}
                alt={l('Institutet för språk och folkminnen')}
                className="h-12 w-auto max-w-[40vw] object-contain sm:max-w-none"
              />
            </a>
          </div>
          <div className="controls ml-auto flex shrink-0 items-center">
            <button
              type="button"
              onClick={handleClose}
              className="intro-close-button inline-flex items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Stäng och gå vidare till kartan"
            >
              Stäng och gå vidare
              {' '}
              <FontAwesomeIcon icon={faChevronRight} />
            </button>
          </div>
        </div>

        <div className="content">
          <iframe
            ref={iframeRef}
            id="iframe"
            title="Introduktion och hjälp"
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
