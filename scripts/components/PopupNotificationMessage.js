import { useEffect, useState } from 'react';

import propTypes from 'prop-types';

export default function PopupNotificationMessage({ duration }) {
  PopupNotificationMessage.propTypes = {
    duration: propTypes.number,
  };

  PopupNotificationMessage.defaultProps = {
    duration: 5000,
  };

  const [message, setMessage] = useState(null);
  const [visible, setVisible] = useState(false);
  let timeout = null;

  const popupNotificationReceivedHandler = (event, receivedMessage) => {
    if (receivedMessage && receivedMessage !== '') {
      if (receivedMessage.indexOf('<br>') > 0) {
        setMessage(receivedMessage);
        setVisible(true);
      } else {
        const setMessageFunction = () => {
          setMessage(receivedMessage);
          setVisible(true);
          timeout = setTimeout(() => {
            setVisible(false);
            timeout = null;
          }, duration);
        };

        if (timeout) {
          clearTimeout(timeout);
          setVisible(false);
          setTimeout(() => {
            setMessageFunction();
          }, 600);
        } else {
          setMessageFunction();
        }
      }
    }
  };

  const popupNotificationCloseHandler = () => {
    setVisible(false);
  };

  useEffect(() => {
    window.eventBus.addEventListener('popup-notification.notify', popupNotificationReceivedHandler);
    window.eventBus.addEventListener('screen-clicked', popupNotificationCloseHandler);

    // Clean up function
    return () => {
      window.eventBus.removeEventListener('popup-notification.notify', popupNotificationReceivedHandler);
      window.eventBus.removeEventListener('screen-clicked', popupNotificationCloseHandler);
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  return (
    <div className={`popup-notification-message${visible ? ' visible' : ''}`}>
      <div className="message-container" dangerouslySetInnerHTML={{ __html: message }} />
    </div>
  );
}
