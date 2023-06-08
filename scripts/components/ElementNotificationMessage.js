import React, {
  useState, useEffect, useRef, useCallback,
} from 'react';

import PropTypes from 'prop-types';

export default function ElementNotificationMessage({
  forgetAfterClick,
  messageId,
  manuallyOpen,
  openTimeout,
  openDuration,
  autoHide,
  closeTrigger,
  placement,
  placementOffsetY,
  placementOffsetX,
  message,
  children,
}) {
  ElementNotificationMessage.propTypes = {
    forgetAfterClick: PropTypes.bool,
    messageId: PropTypes.string.isRequired,
    manuallyOpen: PropTypes.bool,
    openTimeout: PropTypes.number,
    openDuration: PropTypes.number,
    autoHide: PropTypes.bool,
    closeTrigger: PropTypes.string,
    placement: PropTypes.string,
    placementOffsetY: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    placementOffsetX: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    message: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };

  ElementNotificationMessage.defaultProps = {
    forgetAfterClick: false,
    manuallyOpen: false,
    openTimeout: 2000,
    openDuration: 15000,
    autoHide: false,
    placement: 'under',
    placementOffsetY: 0,
    placementOffsetX: 0,
  };
  const [messageContainerWidth, setMessageContainerWidth] = useState(0);
  const [messageContainerHeight, setMessageContainerHeight] = useState(0);
  const [elementContainerWidth, setElementContainerWidth] = useState(0);
  const [elementContainerHeight, setElementContainerHeight] = useState(0);
  const [messageVisible, setMessageVisible] = useState(false);

  const messageContainerRef = useRef();
  const elementContainerRef = useRef();

  const messageClickHandler = useCallback(() => {
    setMessageVisible(false);

    if (forgetAfterClick) {
      localStorage.setItem(messageId, 'read');
    }
  }, [forgetAfterClick, messageId]);

  // The 'show' function has been commented out as in functional components
  // it's not feasible to directly use this function from outside this component.
  // If you need to manipulate the state of this component (in this case, showing
  // the message) from a parent or another component, consider lifting the state up
  // to the parent component, using a context to share state, or adopting a
  // state management library like Redux or MobX.
  //
  // const show = useCallback(() => {
  //   if (localStorage.getItem(messageId) !== 'read') {
  //     setMessageVisible(true);
  //   }
  // }, [messageId]);

  useEffect(() => {
    setMessageContainerWidth(messageContainerRef.current.clientWidth);
    setMessageContainerHeight(messageContainerRef.current.clientHeight);
    setElementContainerWidth(elementContainerRef.current.offsetWidth);
    setElementContainerHeight(elementContainerRef.current.offsetHeight);

    if (closeTrigger && elementContainerRef.current.addEventListener) {
      elementContainerRef.current.addEventListener(closeTrigger, messageClickHandler);
    }

    if (!manuallyOpen) {
      if (forgetAfterClick) {
        if (localStorage.getItem(messageId) !== 'read') {
          setTimeout(() => {
            setMessageVisible(true);
          }, openTimeout || 2000);
        }
      } else {
        setTimeout(() => {
          setMessageVisible(true);
        }, openTimeout || 2000);
      }
    }

    if (autoHide) {
      setTimeout(() => {
        setMessageVisible(false);
      }, openDuration || 15000);
    }

    return () => {
      if (closeTrigger && elementContainerRef.current.addEventListener) {
        elementContainerRef.current.removeEventListener(closeTrigger, messageClickHandler);
      }
    };
  }, [closeTrigger, messageClickHandler, manuallyOpen, forgetAfterClick, messageId, openTimeout, autoHide, openDuration]);

  const getContainerStyle = () => {
    const styleObj = {};
    const place = placement || 'under';
    if (place === 'above') {
      styleObj.top = -messageContainerHeight - 10 + (Number(placementOffsetY) || 0);
      styleObj.left = -(messageContainerWidth / 2) + (elementContainerWidth / 2) + (Number(placementOffsetX) || 0);
    }
    if (place === 'under') {
      styleObj.top = elementContainerHeight + 10 + (Number(placementOffsetY) || 0);
      styleObj.left = -(messageContainerWidth / 2) + (elementContainerWidth / 2) + (Number(placementOffsetX) || 0);
    }
    return styleObj;
  };

  const getArrowStyle = () => {
    const styleObj = {};
    const place = placement || 'under';
    if (place === 'above') {
      styleObj.top = messageContainerHeight;
      styleObj.left = (messageContainerWidth / 2) - 5;
    }
    if (place === 'under') {
      styleObj.top = -10;
      styleObj.left = (messageContainerWidth / 2) - 5;
    }
    return styleObj;
  };

  return (
    <div className="element-notification-message">
      <div className="element-container" ref={elementContainerRef}>
        {children}
      </div>
      <div
        ref={messageContainerRef}
        onClick={messageClickHandler}
        className={`message-container${messageVisible ? ' visible' : ''}`}
        style={getContainerStyle()}
      >
        <div className="message">{message}</div>
        <div className={`arrow arrow-${placement || 'under'}`} style={getArrowStyle()} />
        <div title="stäng" className="close-button white" />
      </div>
    </div>
  );
}

