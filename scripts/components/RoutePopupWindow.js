import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

// Main CSS: ui-components/poupwindow.less

export default function RoutePopupWindow({
  children,
  onClose,
  manuallyOpenPopup,
  onHide,
  onShow,
  closeButtonStyle,
}) {
  RoutePopupWindow.propTypes = {
    children: PropTypes.node.isRequired,
    onClose: PropTypes.func,
    manuallyOpenPopup: PropTypes.bool,
    onHide: PropTypes.func,
    onShow: PropTypes.func,
    closeButtonStyle: PropTypes.string,
  };

  RoutePopupWindow.defaultProps = {
    onClose: null,
    manuallyOpenPopup: false,
    onHide: null,
    onShow: null,
    closeButtonStyle: 'white',
  };

  const [windowOpen, setWindowOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);

  const closeButtonClick = () => {
    if (children.props.manuallyOpenPopup || manuallyOpenPopup) {
      setWindowOpen(false);
      setManualOpen(false);
    } else if (onClose) {
      // TODO: turn this component into a functional component
      // and use the useLocation hook instead of this:
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
