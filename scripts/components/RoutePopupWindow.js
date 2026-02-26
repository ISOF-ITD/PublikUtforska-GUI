/* eslint-disable react/require-default-props */
import {
  useEffect, useState, useContext, memo, useRef, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { faArrowLeft, faXmark } from '@fortawesome/free-solid-svg-icons';
import { l } from '../lang/Lang';
import { NavigationContext } from '../NavigationContext';
import { getFocusableElements } from '../utils/focusHelper';
import { removeViewParamsFromRoute } from '../utils/routeHelper';
import { IconButton } from './IconButton';

const RoutePopupWindow = memo(({
  children,
  manuallyOpenPopup = false,
  onHide = null,
  onShow = null,
  closeButtonStyle = 'white',
}) => {
  const [windowOpen, setWindowOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const pageContentRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const {
    previousNavigation,
  } = useContext(NavigationContext);

  // If another modal is opened on top of this popup (for example an image dialog),
  // we should not trap its keyboard events here. That modal should control focus itself.
  const isEventFromNestedModal = useCallback((event) => {
    const pageContent = pageContentRef.current;
    if (!pageContent || !(event.target instanceof Element)) {
      return false;
    }

    const modalElement = event.target.closest('[aria-modal="true"]');
    return Boolean(modalElement && !pageContent.contains(modalElement));
  }, []);

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
    if (isEventFromNestedModal(event)) return;

    if (event.key === 'Escape') {
      closeButtonClick();
    }
  };

  // Keyboard focus trap: Tab and Shift+Tab cycle inside the popup.
  // This prevents keyboard users from moving focus to background content
  // while RecordView/PlaceView is still open.
  const trapTabKey = useCallback((event) => {
    if (event.key !== 'Tab' || isEventFromNestedModal(event)) return;

    const pageContent = pageContentRef.current;
    const focusableElements = getFocusableElements(pageContent);

    if (!pageContent) return;
    if (focusableElements.length === 0) {
      event.preventDefault();
      pageContent.focus();
      return;
    }

    const first = focusableElements[0];
    const last = focusableElements[focusableElements.length - 1];
    const { activeElement } = document;
    const activeInsidePopup = pageContent.contains(activeElement);

    if (event.shiftKey) {
      if (!activeInsidePopup || activeElement === first || activeElement === pageContent) {
        event.preventDefault();
        last.focus();
      }
      return;
    }

    if (!activeInsidePopup || activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, [getFocusableElements, isEventFromNestedModal]);

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

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [windowOpen, manualOpen, onShow, onHide]);

  // When popup opens: store previous focus and move focus into popup.
  // When popup closes: restore focus so keyboard users continue where they left off.
  useEffect(() => {
    if (!(windowOpen || manualOpen)) return undefined;

    restoreFocusRef.current = document.activeElement;

    const animationFrameId = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements(pageContentRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }
      pageContentRef.current?.focus();
    });

    document.addEventListener('keydown', trapTabKey);

    return () => {
      document.removeEventListener('keydown', trapTabKey);
      window.cancelAnimationFrame(animationFrameId);
      try {
        restoreFocusRef.current?.focus?.();
      } catch (err) {
        // Ignore restore-focus failures when the previous node no longer exists.
      }
    };
  }, [windowOpen, manualOpen, trapTabKey]);

  const shouldShowBackButton = previousNavigation || isNestedTranscribe;

  if (windowOpen || manualOpen) {
    return (
      <div
        className={`popup-wrapper${windowOpen || manualOpen ? ' visible' : ''}`}
      >
        {/* eslint-disable jsx-a11y/click-events-have-key-events */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="popup-content-wrapper"
          // klick utanför page content stänger popup
          onClick={(e) => {
            if (e.target.classList?.contains('popup-content-wrapper')) {
              closeButtonClick();
            }
          }}
        >
          <div
            ref={pageContentRef}
            className="page-content"
            // Tell screenreader users that the content behind
            // the popup is inert/inactive while this dialog is open:
            role="dialog"
            aria-modal="true"
            aria-label={l('Postdetaljer')}
            tabIndex={-1}
          >
            <IconButton
              icon={faXmark}
              label={l('Stäng')}
              tone={closeButtonStyle === 'dark' ? 'dark' : 'light'}
              onClick={closeButtonClick}
              className="absolute top-8 right-8"
            />

            {shouldShowBackButton
              && !(children.props.manuallyOpenPopup || manuallyOpenPopup) && (
                <IconButton
                  icon={faArrowLeft}
                  label={l('Gå tillbaka')}
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
