import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import IntroOverlay from './views/IntroOverlay';
import { l } from '../lang/Lang';

export default function Header() {
  const [forceShowIntroOverlay, setForceShowIntroOverlay] = useState(false);

  // Handle showing the overlay
  const handleShowIntro = () => {
    setForceShowIntroOverlay(true);
  };

  const handleCloseOverlay = () => {
    setForceShowIntroOverlay(false);
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
            <FontAwesomeIcon icon={faBars} />
            &nbsp;
            {l('Meny')}
          </div>
        </div>
      </header>
      <IntroOverlay forceShow={forceShowIntroOverlay} onClose={handleCloseOverlay} />
    </>
  );
}
