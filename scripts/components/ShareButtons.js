import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import clipboard from '../utils/clipboard';

export default function ShareButtons({
  manualInit,
  path,
  title,
  hideLink,
}) {
  ShareButtons.propTypes = {
    manualInit: PropTypes.bool,
    path: PropTypes.string,
    title: PropTypes.string,
    hideLink: PropTypes.bool,
  };

  ShareButtons.defaultProps = {
    manualInit: false,
    path: '',
    title: '',
    hideLink: false,
  };
  const [initialized, setInitialized] = useState(false);
  const [fbInitialized, setFbInitialized] = useState(false);
  const [twitterInitialized, setTwitterInitialized] = useState(false);

  const linkClickHandler = useCallback((event) => {
    event.preventDefault();
    if (clipboard.copy(path)) {
      if (window.eventBus) {
        window.eventBus.dispatch('popup-notification.notify', null, l('Länk har kopierats.'));
      }
    }
  }, [path]);

  const handleCopyLinkClick = useCallback((event) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(event.target);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  const initialize = () => {
    if (initialized) {
      return;
    }
    const fbInit = () => {
      try {
        if (FB) {
          FB.XFBML.parse();
          setFbInitialized(true);
          if (fbInitialized && twitterInitialized) {
            setInitialized(true);
          }
        }
      } catch (e) {
        setTimeout(fbInit, 2000);
      }
    };
    fbInit();

    const twitterInit = () => {
      try {
        if (twttr) {
          twttr.widgets.load();
          setTwitterInitialized(true);
          if (fbInitialized && twitterInitialized) {
            setInitialized(true);
          }
        }
      } catch (e) {
        setTimeout(twitterInit, 2000);
      }
    };
    twitterInit();
  };

  useEffect(() => {
    if (!manualInit) {
      setTimeout(() => {
        initialize();
      }, 500);
    }
  }, [manualInit]);

  return (
    <div className="share-buttons">
      { title && title !== ''
        && (
        <div>
          <label>{title}</label>
          <div className="u-cf" />
        </div>
        )}
      { !hideLink
        && (
        <div>
          <a
            onClick={linkClickHandler}
            style={
            {
              cursor: 'pointer',
            }
          }
          >
            <FontAwesomeIcon icon={faCopy} />
          </a>
          &nbsp;
          <span className="copy-link" onClick={handleCopyLinkClick}>
            {path}
          </span>
        </div>
        )}
    </div>
  );
}
