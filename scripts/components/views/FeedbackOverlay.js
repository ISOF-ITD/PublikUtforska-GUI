import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';

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

  const closeButtonClickHandler = () => {
    setVisible(false);
    setMessageSent(false);
    setMessageSentError(false);
    setMessageInputValue('');
    setNameInputValue('');
    setEmailInputValue('');
  };

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
    if (subject.charAt(subject.length - 1) == '/') subject = subject.substr(0, subject.length - 1);
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
          <button className="button-primary" onClick={closeButtonClickHandler} type="button">Stäng</button>
        </p>
      </div>
    );
  } else if (messageSent === true && messageSentError === true) {
    overlayContent = (
      <div>
        <p>{l('Något gick fel. Meddelande kunde inte skickas. Vänligen försök senare, eller kontakta oss på karttjanster@isof.se')}</p>
        <p>
          <br />
          <button className="button-primary" onClick={closeButtonClickHandler} type="button">Stäng</button>
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div>
        <p>{config.siteOptions.feedbackText || 'Har du frågor eller synpunkter på hur applikationen fungerar? Har du hittat fel, till exempel i avskrifterna? Kontakta oss gärna!'}</p>
        <p>
          Du är nu på sidan '
          <Link to={location.pathname}>{location.pathname}</Link>
          ' men kan också använda formuläret för mer generella förslag och synpunkter.
          <br />
          <br />
        </p>
        <hr />
        <label htmlFor="feedback_name">Ditt namn:</label>
        <input id="feedback_name" autoComplete="name" className="u-full-width" type="text" value={nameInputValue} onChange={nameInputChangeHandler} />
        <label htmlFor="feedback_email">Din e-post adress:</label>
        <input 
          id="feedback_email" 
          autoComplete="email" 
          className={`u-full-width ${emailValid ? '' : 'invalid'}`} 
          type="email" 
          onBlur={handleEmailBlur}
          value={emailInputValue} 
          onChange={emailInputChangeHandler} 
        />
        <label htmlFor="feedback_message">Meddelande:</label>
        <textarea lang="sv" spellCheck="false" id="feedback_message" className="u-full-width" value={messageInputValue} onChange={messageInputChangeHandler} />
        <button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button>
      </div>
    );
  }

  return (
    <div className={`overlay-container feedback-overlay-container${visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {l('Frågor och synpunkter')}
          <button title="stäng" className="close-button white" type="button" onClick={closeButtonClickHandler} />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}
