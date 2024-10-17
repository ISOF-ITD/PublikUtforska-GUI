// Header.js
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWindowMaximize } from '@fortawesome/free-regular-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import IntroOverlay from './views/IntroOverlay';
import { l } from '../lang/Lang';
import config from '../config';

export default function Header() {
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const location = useLocation(); // Access current route
  const navigate = useNavigate();
  const initialLoad = useRef(true); // Tracks if the app has just loaded

  // Function to check if 'k' parameter exists
  const hasKParam = () => {
    const params = new URLSearchParams(location.search);
    return params.has('k');
  };

  // Handle showing the overlay by setting the 'k' parameter and local state
  const handleShowIntro = () => {
    setShowIntroOverlay(true); // Visa overlay omedelbart
    const params = new URLSearchParams(location.search);
    params.set('k', config.kontextStartPage);
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Handle closing the overlay by removing the 'k' parameter and updating local state
  const handleCloseOverlay = () => {
    setShowIntroOverlay(false); // Dölj overlay omedelbart
    const params = new URLSearchParams(location.search);
    params.delete('k');
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Sync local state with URL on location changes
  useEffect(() => {
    if (initialLoad.current && location.pathname === '/') {
      if (hasKParam()) {
        setShowIntroOverlay(true);
      }
    }
    initialLoad.current = false; // After first load, set to false

    // Om 'k' ändras, uppdatera lokal state
    if (hasKParam()) {
      setShowIntroOverlay(true);
    } else {
      setShowIntroOverlay(false);
    }
  }, [location]);

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
