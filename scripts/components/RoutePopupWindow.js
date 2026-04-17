/* eslint-disable react/require-default-props */
import {
  useEffect, useState, useContext, memo, useRef, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation } from 'react-router-dom';
import { l } from '../lang/Lang';
import { NavigationContext } from '../NavigationContext';
import { focusDialogOnOpen, getFocusableElements } from '../utils/focusHelper';
import { removeViewParamsFromRoute } from '../utils/routeHelper';
import HeaderActions from './views/HeaderActions';

const RoutePopupWindow = memo(({
  children,
  manuallyOpenPopup = false,
  onHide = null,
  onShow = null,
  closeButtonStyle = 'light',
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

  const getOrderedFocusableElements = useCallback(() => {
    const pageContent = pageContentRef.current;
    const focusableElements = getFocusableElements(pageContent);

    if (focusableElements.length === 0) {
      return focusableElements;
    }

    const headerLogos = focusableElements.filter(
      (element) => element.dataset.routePopupHeaderLogo,
    );
    const headerActions = focusableElements.filter(
      (element) => element.dataset.routePopupHeaderAction,
    );
    const contactButtons = focusableElements.filter(
      (element) => element.classList?.contains('feedback-button'),
    );

    if (
      headerLogos.length === 0
      && headerActions.length === 0
      && contactButtons.length === 0
    ) {
      return focusableElements;
    }

    const prioritizedElements = [
      ...headerLogos,
      ...contactButtons,
      ...headerActions,
    ];
    const prioritizedSet = new Set(prioritizedElements);
    const remainingElements = focusableElements.filter(
      (element) => !prioritizedSet.has(element),
    );

    return [
      ...prioritizedElements,
      ...remainingElements,
    ];
  }, []);

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
    const focusableElements = getOrderedFocusableElements();

    if (!pageContent) return;
    if (focusableElements.length === 0) {
      event.preventDefault();
      pageContent.focus();
      return;
    }

    const { activeElement } = document;
    const activeIndex = focusableElements.indexOf(activeElement);

    event.preventDefault();

    if (activeIndex < 0) {
      if (event.shiftKey) {
        focusableElements[focusableElements.length - 1].focus();
      } else {
        focusableElements[0].focus();
      }
      return;
    }

    const nextIndex = event.shiftKey
      ? (activeIndex - 1 + focusableElements.length) % focusableElements.length
      : (activeIndex + 1) % focusableElements.length;

    focusableElements[nextIndex].focus();
  }, [getOrderedFocusableElements, isEventFromNestedModal]);

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
      const focusableElements = getOrderedFocusableElements();
      focusDialogOnOpen(pageContentRef.current, focusableElements);
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
  }, [windowOpen, manualOpen, trapTabKey, getOrderedFocusableElements]);

  const shouldShowBackButton = previousNavigation || isNestedTranscribe;
  const showBackButtonInRail = shouldShowBackButton
    && !(children.props.manuallyOpenPopup || manuallyOpenPopup);

  if (windowOpen || manualOpen) {
    return (
      <div
        className={`popup-wrapper${windowOpen || manualOpen ? ' visible' : ''}`}
      >
        {/* eslint-disable jsx-a11y/click-events-have-key-events */}
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          className="popup-content-wrapper [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)]"
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
            <HeaderActions
              showBack={showBackButtonInRail}
              onBack={backButtonClick}
              onClose={closeButtonClick}
              closeTone={closeButtonStyle === 'dark' ? 'dark' : 'light'}
            />
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
