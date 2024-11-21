/* eslint-disable react/require-default-props */
import {
  useEffect, useState, useContext, memo,
} from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { l } from '../lang/Lang';
import { NavigationContext } from '../NavigationContext';

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

  const {
    previousNavigation,
  } = useContext(NavigationContext);

  const closeButtonClick = () => {
    if (manuallyOpenPopup) {
      setWindowOpen(false);
      setManualOpen(false);
    } else {
      navigate('/');
    }
  };

  const backButtonClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/');
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
    if (window.eventBus) {
      window.eventBus.addEventListener('routePopup.show', showRoutePopup);
    }
    setWindowOpen(!manuallyOpenPopup);

    return () => {
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
    } else {
      if (onHide) {
        onHide();
      }
      if (window.eventBus) {
        setTimeout(() => {
          window.eventBus.dispatch('popup.close');
        }, 100);
      }
    }
  }, [windowOpen, manualOpen, onShow, onHide]);

  const shouldShowBackButton = previousNavigation;

  if (windowOpen || manualOpen) {
    return (
      <div className={`popup-wrapper${windowOpen || manualOpen ? ' visible' : ''}`}>
        <div className="popup-content-wrapper">
          <div className="page-content">
            <button
              type="button"
              tabIndex={0}
              aria-label="Close"
              title={l('Stäng')}
              className={`close-button${closeButtonStyle === 'dark' ? '' : ' white'}`}
              onClick={closeButtonClick}
              onKeyUp={closeButtonKeyUp}
            />
            {shouldShowBackButton && !(children.props.manuallyOpenPopup || manuallyOpenPopup) && (
              <button
                type="button"
                aria-label="Back"
                title={l('Gå tillbaka')}
                className="back-button white"
                onClick={backButtonClick}
                onKeyUp={backButtonKeyUp}
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

export default RoutePopupWindow;

RoutePopupWindow.propTypes = {
  children: PropTypes.node.isRequired,
  manuallyOpenPopup: PropTypes.bool,
  onHide: PropTypes.func,
  onShow: PropTypes.func,
  closeButtonStyle: PropTypes.string,
};
