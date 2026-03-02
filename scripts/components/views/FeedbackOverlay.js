import { faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  useState, useEffect, useRef, useCallback, useId,
} from 'react';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';
import { getFocusableElements } from '../../utils/focusHelper';
import { IconButton } from '../IconButton';

// Main CSS: ui-components/overlay.less

export default function FeedbackOverlay() {
  const [visible, setVisible] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [nameInputValue, setNameInputValue] = useState('');
  const [emailInputValue, setEmailInputValue] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [messageSentError, setMessageSentError] = useState(false);
  const [type, setType] = useState(null);
  const [title, setTitle] = useState(null);
  const [appUrl, setAppUrl] = useState(null);
  const dialogRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const titleId = useId();
  const emailErrorId = useId();

  const location = useLocation();

  const [emailValid, setEmailValid] = useState(true);

  const validateEmail = (email) => {
    // En enkel regex för att validera e-postadresser
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email === '' || regex.test(email);
  };

  const handleEmailBlur = (event) => {
    const isValid = validateEmail(event.target.value);
    setEmailValid(isValid);
  };

  useEffect(() => {
    const feedbackHandler = (event) => {
      setVisible(true);
      setType(event.target.type);
      setTitle(event.target.title);
      setAppUrl(event.target.appUrl);
    };

    const hideHandler = () => {
      setVisible(false);
    };

    if (window.eventBus) {
      window.eventBus.addEventListener('overlay.feedback', feedbackHandler);
      window.eventBus.addEventListener('overlay.hide', hideHandler);
    }

    // Cleanup
    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.feedback', feedbackHandler);
        window.eventBus.removeEventListener('overlay.hide', hideHandler);
      }
    };
  }, []);

  const closeOverlay = useCallback(() => {
    setVisible(false);
    setMessageSent(false);
    setMessageSentError(false);
    setMessageInputValue('');
    setNameInputValue('');
    setEmailInputValue('');
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    restoreFocusRef.current = document.activeElement;
    const animationFrameId = window.requestAnimationFrame(() => {
      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
        return;
      }
      dialogRef.current?.focus();
    });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeOverlay();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(dialogRef.current);
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialogRef.current?.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const { activeElement } = document;
      const activeInsideDialog = dialogRef.current?.contains(activeElement);

      if (event.shiftKey) {
        if (!activeInsideDialog || activeElement === first || activeElement === dialogRef.current) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!activeInsideDialog || activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(animationFrameId);
      try {
        restoreFocusRef.current?.focus?.();
      } catch {
        // Ignore restore-focus errors when previous element no longer exists.
      }
    };
  }, [visible, closeOverlay]);

  const messageInputChangeHandler = (event) => {
    setMessageInputValue(event.target.value);
  };

  const nameInputChangeHandler = (event) => {
    setNameInputValue(event.target.value);
  };

  const emailInputChangeHandler = (event) => {
    setEmailInputValue(event.target.value);
  };

  const sendButtonClickHandler = () => {
    let subject = appUrl;
    if (subject.charAt(subject.length - 1) === '/') subject = subject.substr(0, subject.length - 1);
    const data = {
      from_email: emailInputValue,
      from_name: nameInputValue,
      subject: `${subject.split(/[/]+/).pop()}: Feedback`,
      message: `${type}: ${title}\n${
        location.pathname}\n\n`
        + `Från: ${nameInputValue} (${emailInputValue})\n\n${
          messageInputValue}`,
    };

    const formData = new FormData();
    formData.append('json', JSON.stringify(data));

    fetch(`${config.restApiUrl}feedback/`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json()).then((json) => {
        if (json.success === true || json.success === 'true') {
          setMessageSent(true);
          setMessageSentError(false);
        } else {
          setMessageSent(true);
          setMessageSentError(true);
        }
      });
  };

  let overlayContent;
  if (messageSent === true && messageSentError === false) {
    overlayContent = (
      <div>
        <p>{l('Vi återkommer så fort vi kan. Tack.')}</p>
        <p>
          <br />
          <button className="button-primary" onClick={closeOverlay} type="button">Stäng</button>
        </p>
      </div>
    );
  } else if (messageSent === true && messageSentError === true) {
    overlayContent = (
      <div>
        <p>{l('Något gick fel. Meddelande kunde inte skickas. Vänligen försök senare, eller kontakta oss på karttjanster@isof.se')}</p>
        <p>
          <br />
          <button className="button-primary" onClick={closeOverlay} type="button">Stäng</button>
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div>
        <p>{config.siteOptions.feedbackText || 'Har du frågor eller synpunkter på hur applikationen fungerar? Har du hittat fel, till exempel i avskrifterna? Kontakta oss gärna!'}</p>
        <hr />
        <label htmlFor="feedback_name">
          Ditt namn:
          <input
            id="feedback_name"
            autoComplete="name"
            className="u-full-width"
            type="text"
            value={nameInputValue}
            onChange={nameInputChangeHandler}
          />
        </label>
        <label htmlFor="feedback_email">
          Din e-post adress:
          <input
            id="feedback_email"
            autoComplete="email"
            className={`u-full-width ${emailValid ? '' : 'invalid'}`}
            type="email"
            onBlur={handleEmailBlur}
            value={emailInputValue}
            onChange={emailInputChangeHandler}
            aria-invalid={!emailValid}
            aria-describedby={!emailValid ? emailErrorId : undefined}
          />
          {!emailValid && (
            <span id={emailErrorId} className="form-help error" aria-live="polite">
              {l('Ogiltig e-postadress')}
            </span>
          )}
        </label>
        <label htmlFor="feedback_message">
          Meddelande:
          <textarea
            lang="sv"
            spellCheck="false"
            id="feedback_message"
            className="u-full-width"
            value={messageInputValue}
            onChange={messageInputChangeHandler}
          />
        </label>
        <button className="button-primary" onClick={sendButtonClickHandler} type="button">Skicka</button>
      </div>
    );
  }

  return (
    <div className={`overlay-container !z-[4100] ${visible ? ' visible' : ''}`}>
      <div
        ref={dialogRef}
        className="overlay-window"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="overlay-header">
          <span id={titleId}>{l('Frågor och synpunkter')}</span>
          <IconButton
            icon={faXmark}
            label={l('Stäng')}
            tone="light"
            onClick={closeOverlay}
            className="absolute right-4 top-3"
          />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}
