import { useEffect, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createSearchRoute, createParamsFromSearchRoute } from '../utils/routeHelper';
import { NavigationContext } from '../NavigationContext';

// Main CSS: ui-components/poupwindow.less

const useNavigationCount = () => {
  const [navigationCount, setNavigationCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    setNavigationCount((prevCount) => prevCount + 1);
  }, [location]);

  return navigationCount;
};

export default function RoutePopupWindow({
  children,
  onClose,
  manuallyOpenPopup,
  onHide,
  onShow,
  closeButtonStyle,
  routeId,
}) {
  RoutePopupWindow.propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    manuallyOpenPopup: PropTypes.bool,
    onHide: PropTypes.func,
    onShow: PropTypes.func,
    closeButtonStyle: PropTypes.string,
    routeId: PropTypes.string,
  };

  RoutePopupWindow.defaultProps = {
    onClose: null,
    manuallyOpenPopup: false,
    onHide: null,
    onShow: null,
    closeButtonStyle: 'white',
    routeId: null,
  };

  const [windowOpen, setWindowOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const navigationCount = useNavigationCount();

  const navigate = useNavigate();
  const params = useParams();

  const {
    previousNavigation,
    addToNavigationHistory,
    removeLatestFromNavigationHistory,
    clearNavigationHistory,
  } = useContext(NavigationContext);

  useEffect(() => {
    const { recordId, placeId, personId } = params;
    if (recordId || placeId || personId) {
      addToNavigationHistory(
        recordId
          ? 'record'
          : placeId
            ? 'place'
            : 'person',
        recordId || placeId || personId,
      );
    }
  }, [params.recordId, params.placeId, params.personId]);

  // on unmount, clear navigation history
  useEffect(() => () => clearNavigationHistory(), []);

  const closeButtonClick = () => {
    if (children.props.manuallyOpenPopup || manuallyOpenPopup) {
      setWindowOpen(false);
      setManualOpen(false);
    } else if (routeId === 'record' || routeId === 'transcribe-record' || routeId === 'place' || routeId === 'transcribe-place' || routeId === 'person' || routeId === 'transcribe-person') {
      // remove latest navigation from navigationHistory
      const { type, id } = previousNavigation || { type: null, id: null };
      const navigationPath = `${routeId.startsWith('transcribe') ? '/transcribe/' : '/'}${
        // add placeId to search route if it exists in context
        id
          ? `${type}s/${id}/`
          : ''
      }${
        createSearchRoute(createParamsFromSearchRoute(params['*'])).replace(/^\//, '')
      }`;
      // Check if a back navigation would navigate out of our app
      if (window.history.length - 1 > navigationCount) {
        // It would not, so we can safely use window.history.back()
        window.history.back();
      } else {
        // It would, so we navigate programmatically instead
        navigate(navigationPath);
      }

      removeLatestFromNavigationHistory();
    } else if (onClose) {
      onClose();
    }
  };

  const closeButtonKeyUp = (event) => {
    if (event.keyCode === 13) {
      closeButtonClick(event);
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

    // componentWillUnmount
    return () => {
      if (onHide) {
        onHide();
      }
      if (window.eventBus) {
        window.eventBus.dispatch('popup.close');
      }
    };
  }, []);

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

  // when this component receives changes, scroll to top of popup
  useEffect(() => {
    // get all popup windows
    const els = document.getElementsByClassName('popup-content-wrapper');
    if (els.length > 0) {
      // in the last popup window, scroll to top
      els[els.length - 1].scrollTop = 0;
    }
  }, [children]);

  if (windowOpen || manualOpen) {
    // TODO: do we want to render the popup even if it's not visible?
    return (
      <div className={`popup-wrapper${windowOpen || manualOpen ? ' visible' : ''}`}>
        {
          // this.props.children && this.props.children.props.manuallyOpenPopup &&
          // <a className="popup-open-button map-floating-control map-bottom-control visible" onClick={this.openButtonClickHandler} onKeyUp={this.openButtonKeyUpHandler} tabIndex={0}><strong>{l(this.props.children.props.openButtonLabel)}</strong></a>
        }
        <div className="popup-content-wrapper">
          <div className="page-content">
            <a tabIndex={0} className={`close-button${closeButtonStyle == 'dark' ? '' : closeButtonStyle == 'white' ? ' white' : ' white'}`} onClick={closeButtonClick} onKeyUp={closeButtonKeyUp} />
            {children}
          </div>
        </div>
      </div>
    );
  }
  return null;
}
