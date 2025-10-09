import { useState, useEffect, useCallback } from 'react';
import config from '../../config';

function HelpTextOverlay() {
  const [visible, setVisible] = useState(false);
  const [kind, setKind] = useState('switcher');

  const closeButtonClickHandler = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (window.eventBus) {
      const handleHelpText = (event) => {
        setVisible(true);
        setKind(event.target.kind);
      };

      const handleHide = () => {
        setVisible(false);
      };

      window.eventBus.addEventListener('overlay.HelpText', handleHelpText);
      window.eventBus.addEventListener('overlay.hide', handleHide);

      return () => {
        window.eventBus.removeEventListener('overlay.HelpText', handleHelpText);
        window.eventBus.removeEventListener('overlay.hide', handleHide);
      };
    }
    // No-op städfunktion för att säkerställa konsekvent return
    return () => {};
  }, []);

  const overlayContent = config.siteOptions.helpTexts[kind].content;
  const overlayTitle = config.siteOptions.helpTexts[kind].title;

  return (
    <div className={`overlay-container z-[3100] ${visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {overlayTitle}
          <button
            type="button"
            title="Stäng"
            aria-label="Stäng overlay"
            className="close-button white"
            onClick={closeButtonClickHandler}
          />
        </div>
        <div dangerouslySetInnerHTML={{ __html: overlayContent }} />
      </div>
    </div>
  );
}

export default HelpTextOverlay;
