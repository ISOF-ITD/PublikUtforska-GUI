import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { createParamsFromPlacesRoute, createParamsFromRecordRoute, createSearchRoute } from '../utils/routeHelper';

// Main CSS: ui-components/poupwindow.less

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

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const params = useParams();

    // if placeId exists in params, save it to localStorage to navigate back to place view
    // when closing the popup
  useEffect(() => {
    const { placeId } = params;
    if (placeId && localStorage.getItem(`placeViewId-${window.sessionId}`) !== placeId) {
      localStorage.setItem(`placeViewId-${window.sessionId}`, placeId);
    }
  }, [params.placeId]);

  const closeButtonClick = () => {
    if (children.props.manuallyOpenPopup || manuallyOpenPopup) {
      setWindowOpen(false);
      setManualOpen(false);
    } else if (routeId === 'record' || routeId === 'transcribe-record') {
      const params = createParamsFromRecordRoute(pathname);
      delete params.record_id;
      // read placeId from localStorage
      const placeViewId = localStorage.getItem(`placeViewId-${window.sessionId}`);
      const navigationPath = `${routeId === 'transcribe-record' ? '/transcribe/' : '/'}${
        // add placeId to search route if it exists in localStorage
        placeViewId
          ? `places/${placeViewId}/`
          : ''
      }${
        createSearchRoute(params).replace(/^\//, '')
      }`;
      navigate(navigationPath);
    } else if (routeId === 'place' || routeId === 'transcribe-place') {
      // delete placeid from localStorage, since we're navigating away from the place view
      localStorage.removeItem(`placeViewId-${window.sessionId}`);

      const params = createParamsFromPlacesRoute(pathname);
      delete params.place_id;
      const navigationPath = `${routeId === 'transcribe-place' ? '/transcribe/' : '/'}${
        // create search route, but remove leading slash if it exists
        createSearchRoute(params).replace(/^\//, '')
      }`;
      navigate(navigationPath);
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
