import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMaximize } from '@fortawesome/free-regular-svg-icons';
import { useLocation } from 'react-router-dom';
import IntroOverlay from './views/IntroOverlay';
import { l } from '../lang/Lang';
import config from '../config';

export default function Header() {
  if (!config.activateIntroOverlay) return null;

  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const location = useLocation(); // Använd useLocation för att få tillgång till current route
  const initialLoad = useRef(true); // En ref som håller koll på om appen precis laddats

  // Kontrollera om användaren är på root-routen och uppdatera state.
  useEffect(() => {
    const isRoot = location.pathname === '/';
    const noHash = !location.hash || location.hash === '#/';

    if (initialLoad.current && isRoot && noHash) {
      setShowIntroOverlay(true);
    }
    initialLoad.current = false;
  }, [location]);

  // Handle showing the overlay
  const handleShowIntro = () => {
    setShowIntroOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowIntroOverlay(false);
  };

  // Handle keyboard interaction (Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleShowIntro();
    }
  };

  return (
    <>
      <header>
        <div className="isof-app-header">
          <div
            onClick={handleShowIntro}
            onKeyDown={handleKeyDown} // Add key event listener
            role="button" // Set role to button for accessibility
            tabIndex={0} // Make it focusable via keyboard
            style={{
              cursor: 'pointer',
            }}
          >
            <FontAwesomeIcon icon={faWindowMaximize} />
            &nbsp;
            {l('Meny')}
          </div>
        </div>
      </header>
      <IntroOverlay show={showIntroOverlay} onClose={handleCloseOverlay} />
    </>
  );
}
