/* eslint-disable react/require-default-props */
import {
  useEffect, useState, useCallback, useRef,
} from 'react';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import clipboard from '../../../utils/clipboard';

export default function ShareButtons({
  manualInit = false,
  path = '',
  title = '',
  hideLink = false,
}) {
  //   const [initialized, setInitialized] = useState(false);
  const [copyMessageVisible, setCopyMessageVisible] = useState(false);
  const countdownRef = useRef(null);
  const [countdown, setCountdown] = useState(5);

  const linkClickHandler = useCallback((event) => {
    event.preventDefault();
    if (clipboard.copy(path)) {
      setCopyMessageVisible(true);
      setCountdown(500); // 500 hundredths of a second, equals to 5 seconds
      countdownRef.current = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 10); // decrement the countdown every 10ms
      setTimeout(() => {
        setCopyMessageVisible(false);
        clearInterval(countdownRef.current);
      }, 5000);
    }
  }, [path]);

  const handleCopyLinkClick = useCallback((event) => {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(event.target);
    selection.removeAllRanges();
    selection.addRange(range);
  }, []);

  useEffect(() => () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
  }, [manualInit]);

  return (
    <div className="share-buttons">
      {title && title !== ''
        && (
          <div>
            <label>{title}</label>
            <div className="u-cf" />
          </div>
        )}
      {!hideLink
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
            <span className={`copy-link ${copyMessageVisible ? 'copy-message' : ''}`} onClick={handleCopyLinkClick}>
              {copyMessageVisible
                ? (
                  <>
                    Kopierat till urklipp
                    &nbsp;
                    <svg viewBox="0 0 36 36" className="progress-ring" height="16" width={16}>
                      <path
                        className="progress-ring"
                        stroke="grey"
                        fill="none"
                        strokeDasharray={`${countdown * 0.2}, 100`} // 100 / 500 = 0.2
                        d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                  </>
                )
                : path}
            </span>
          </div>
        )}
    </div>
  );
}

ShareButtons.propTypes = {
  manualInit: PropTypes.bool,
  path: PropTypes.string,
  title: PropTypes.string,
  hideLink: PropTypes.bool,
};
