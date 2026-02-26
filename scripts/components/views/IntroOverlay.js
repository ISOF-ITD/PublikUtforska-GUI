/* eslint-disable react/require-default-props */
import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useLocation, useNavigate } from "react-router-dom";
import config from "../../config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { getFocusableElements } from "../../utils/focusHelper";

function IntroOverlay({ show = false, onClose, focusSearchOnClose = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const iframeRef = useRef(null);
  // Referens till overlay-roten som används för fokusfällan.
  const introRef = useRef(null);
  // Sparar elementet som hade fokus innan overlayn öppnades.
  const restoreFocusRef = useRef(null);

  const getInitialSrc = () => {
    const params = new URLSearchParams(location.search);
    const kParam = params.get("k") || config.kontextStartPage;
    return `${config.kontextBasePath}${kParam}`;
  };

  const [iframeSrc, setIframeSrc] = useState(getInitialSrc);

  const overlayClass = `overlay-container light-modal intro-overlay ${
    show ? "visible" : ""
  }`;

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        if (event.data.type === "navigateAway") {
          // Anropa onClose med en liten fördröjning för att låta navigeringen ske
          setTimeout(() => {
            if (onClose) onClose();
          }, 100); // Fördröjning i millisekunder, justera vid behov
        }

        if (event.data.newSrc?.startsWith("http")) {
          const newUrlObject = new URL(event.data.newSrc);
          const newPath = newUrlObject.href.replace(config.kontextBasePath, "");

          const params = new URLSearchParams(location.search);
          if (params.get("k") !== newPath) {
            params.set("k", newPath);
            navigate(`?${params.toString()}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Fel vid hantering av meddelande:", error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate, location.search, onClose]);

  const handleIntroductionClick = () => {
    // Uppdatera både iframeSrc och URL:en
    const newSrc = config.kontextBasePath + config.kontextStartPage;
    setIframeSrc(newSrc);
    const params = new URLSearchParams(location.search);
    params.set("k", config.kontextStartPage);
    navigate(`?${params.toString()}`, { replace: true });
  };

  // Stabil callback så att keydown-lyssnaren kan återanvändas mellan renderingar.
  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!show) return undefined;

    // Flytta in fokus i overlayn direkt när den visas.
    restoreFocusRef.current = document.activeElement;
    const animationFrameId = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements(introRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }
      introRef.current?.focus();
    });

    const onDocumentKeyDown = (event) => {
      // Escape stänger overlayn oavsett var fokus ligger.
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const root = introRef.current;
      if (!root) return;

      // Tab/Shift+Tab hålls inom overlayn för bättre tillgänglighet.
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
        if (focusSearchOnClose) {
          const searchInput = document.getElementById('searchInputMapMenu');
          if (searchInput?.focus) {
            searchInput.focus();
            return;
          }
        }
        // Återställ fokus till tidigare element när overlayn stängs.
        restoreFocusRef.current?.focus?.();
      } catch {
        // Ignorera fel om tidigare element inte längre finns i DOM.
      }
    };
  }, [show, handleClose, focusSearchOnClose]);

  return (
    <div
      className={overlayClass}
      role="dialog"
      aria-modal="true"
    >
      <div className="intro" ref={introRef} tabIndex={-1}>
        <div className="overlay-header">
          <span
            className="overflow-hidden text-ellipsis whitespace-nowrap mr-4"
            title={config.siteTitle}
          ></span>
          <div className="controls">
            <span
              onClick={handleClose}
              role="button"
              tabIndex="0"
              className="intro-close-button flex items-center"
              aria-label="Stäng och gå vidare till kartan"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClose();
              }}
            >
              {"Stäng och gå vidare till kartan"}{" "}
              <FontAwesomeIcon icon={faChevronRight} />
            </span>
          </div>
        </div>

        <div className="content">
          <iframe
            ref={iframeRef}
            id="iframe"
            title="Introduktion och hjälp"
            src={iframeSrc}
            tabIndex={0}
            style={{
              border: "none",
              width: "100%",
              height: "100%",
              display: "block",
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
  focusSearchOnClose: PropTypes.bool,
};

export default IntroOverlay;
