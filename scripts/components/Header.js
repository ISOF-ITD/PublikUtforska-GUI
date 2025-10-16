import { useEffect, useRef, useState, useCallback } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWindowMaximize } from "@fortawesome/free-regular-svg-icons";
import { useLocation } from "react-router-dom";
import IntroOverlay from "./views/IntroOverlay";
import { l } from "../lang/Lang";
import config from "../config";

export default function Header() {
  const [showIntroOverlay, setShowIntroOverlay] = useState(false);
  const location = useLocation();
  const initialLoad = useRef(true);

  const activateIntroOverlay = Boolean(config?.activateIntroOverlay);

  useEffect(() => {
    if (!activateIntroOverlay) return;

    const isRoot = location.pathname === "/";
    const noHash = !location.hash || location.hash === "#/";

    if (initialLoad.current && isRoot && noHash) {
      setShowIntroOverlay(true);
    }
    initialLoad.current = false;
  }, [location, activateIntroOverlay]);

  const handleShowIntro = useCallback(() => {
    if (activateIntroOverlay) setShowIntroOverlay(true);
  }, [activateIntroOverlay]);

  const handleCloseOverlay = useCallback(() => {
    setShowIntroOverlay(false);
  }, []);

  const handleKeyDown = useCallback(
    (e) => {
      // Prevent page scroll when "activating" with Space
      if (e.key === " ") e.preventDefault();
      if (e.key === "Enter" || e.key === " ") {
        handleShowIntro();
      }
    },
    [handleShowIntro]
  );

  if (!activateIntroOverlay) return null;

  return (
    <>
      <header>
          <button
            type="button"
            onClick={handleShowIntro}
            onKeyDown={handleKeyDown}
            className="bg-isof rounded !text-white text-xl px-2.5 py-1.5 pointer-events-auto absolute right-5 top-5 visible z-[1000]"
            aria-pressed={showIntroOverlay}
            aria-controls="intro-overlay"
          >
            <FontAwesomeIcon icon={faWindowMaximize} />
            &nbsp;{l("Meny")}
          </button>
      </header>

      <IntroOverlay
        id="intro-overlay"
        show={showIntroOverlay}
        onClose={handleCloseOverlay}
      />
    </>
  );
}
