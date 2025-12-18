/* eslint-disable react/require-default-props */
import {
  useEffect, useState, useContext, memo,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { l } from '../lang/Lang';
import { NavigationContext } from '../NavigationContext';
import { removeViewParamsFromRoute } from '../utils/routeHelper';
import { IconButton } from './IconButton';
import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';

// Main CSS: ui-components/popupwindow.less

const RoutePopupWindow = memo(({
  children,
  manuallyOpenPopup = false,
  onHide = null,
  onShow = null,
  closeButtonStyle = 'white',
}) => {
  const [windowOpen, setWindowOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    previousNavigation,
  } = useContext(NavigationContext);

  const isNestedTranscribe = /\/audio\/[^/]+\/transcribe\/?$/.test(
    location.pathname,
  );

  const closeButtonClick = () => {
  if (manuallyOpenPopup) {
    setWindowOpen(false);
    setManualOpen(false);
  } else {
    const path = removeViewParamsFromRoute(location.pathname);
      navigate(path);
  }
};


  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      closeButtonClick();
    }
  };

  const backButtonClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const recordPath = location.pathname.replace(
        /\/audio\/[^/]+\/transcribe\/?$/,
        '',
      );
      navigate(recordPath);
   }
  };

  const closeButtonKeyUp = (event) => {
    if (event.key === 'Enter') {
      closeButtonClick(event);
    }
  };

  const backButtonKeyUp = (event) => {
    if (event.key === 'Enter') {
      backButtonClick(event);
    }
  };

  const showRoutePopup = () => {
    setWindowOpen(false);
    setManualOpen(true);
  };

  useEffect(() => {
    window.eventBus?.addEventListener('routePopup.show', showRoutePopup);
    setWindowOpen(!manuallyOpenPopup);

    return () => {
      window.eventBus?.removeEventListener('routePopup.show', showRoutePopup);
      if (onHide) {
        onHide();
      }
      if (window.eventBus) {
        window.eventBus.dispatch('popup.close');
      }
    };
  }, [manuallyOpenPopup, onHide]);

  useEffect(() => {
    if (windowOpen || manualOpen) {
      if (onShow) {
        onShow();
      }
      if (window.eventBus) {
        setTimeout(() => {
          window.eventBus.dispatch('popup.open');
        }, 100);
      }
      window.addEventListener('keydown', handleKeyDown);
    } else {
      if (onHide) {
        onHide();
      }
      if (window.eventBus) {
        setTimeout(() => {
          window.eventBus.dispatch('popup.close');
        }, 100);
      }
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, [windowOpen, manualOpen, onShow, onHide]);

  const shouldShowBackButton = previousNavigation || isNestedTranscribe;

  if (windowOpen || manualOpen) {
    return (
      <div
        className={`popup-wrapper${windowOpen || manualOpen ? " visible" : ""}`}
      >
        {/* eslint-disable jsx-a11y/click-events-have-key-events */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="popup-content-wrapper"
          // klick utanför page content stänger popup
          onClick={(e) => {
            if (e.target.classList?.contains("popup-content-wrapper")) {
              closeButtonClick();
            }
          }}
        >
          <div className="page-content">
            <IconButton
              icon={faXmark}
              label={l("Stäng")}
              tone={closeButtonStyle === "dark" ? "dark" : "light"}
              onClick={closeButtonClick}
              className="absolute top-8 right-8"
            />

            {shouldShowBackButton &&
              !(children.props.manuallyOpenPopup || manuallyOpenPopup) && (
                <IconButton
                  icon={faArrowLeft}
                  label={l("Gå tillbaka")}
                  tone="light"
                  onClick={backButtonClick}
                  className="absolute top-8 right-20"
                />
              )}
            {children}
          </div>
        </div>
      </div>
    );
  }
  return null;
});

RoutePopupWindow.displayName = 'RoutePopupWindow';

export default RoutePopupWindow;

RoutePopupWindow.propTypes = {
  children: PropTypes.node.isRequired,
  manuallyOpenPopup: PropTypes.bool,
  onHide: PropTypes.func,
  onShow: PropTypes.func,
  closeButtonStyle: PropTypes.string,
};
