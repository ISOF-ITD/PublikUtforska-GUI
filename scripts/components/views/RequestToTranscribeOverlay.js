import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';

export default function RequestToTranscribeOverlay() {
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

  const [state, setState] = useState({
    visible: false,
    messageInputValue: '',
    nameInputValue: '',
    emailInputValue: '',
    messageSent: false,
    messageSentError: false,
    type: '',
    title: '',
    country: '',
    url: '',
    appUrl: '',
    id: '',
  });

  const location = useLocation();

  useEffect(() => {
    const RequestToTranscribeListener = (event) => setState({
      ...state,
      visible: true,
      type: event.target.type,
      title: event.target.title,
      country: event.target.country,
      url: event.target.url,
      appUrl: event.target.appUrl,
      id: event.target.id,
    });

    const hideOverlayListener = () => setState({ ...state, visible: false });

    if (window.eventBus) {
      window.eventBus.addEventListener('overlay.requesttotranscribe', RequestToTranscribeListener);
      window.eventBus.addEventListener('overlay.hide', hideOverlayListener);
    }

    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.requesttotranscribe', RequestToTranscribeListener);
        window.eventBus.removeEventListener('overlay.hide', hideOverlayListener);
      }
    };
  }, []);

  const closeButtonClickHandler = () => {
    setState({
      ...state,
      visible: false,
      messageSent: false,
      messageSentError: false,
      messageInputValue: '',
      nameInputValue: '',
      emailInputValue: '',
    });
  };

  const messageInputChangeHandler = (event) => {
    setState({
      ...state,
      messageInputValue: event.target.value,
    });
  };

  const nameInputChangeHandler = (event) => {
    setState({
      ...state,
      nameInputValue: event.target.value,
    });
  };

  const emailInputChangeHandler = (event) => {
    setState({
      ...state,
      emailInputValue: event.target.value,
    });
  };

  const sendButtonClickHandler = () => {
    // Send message only if email address is valid
    if (!state.emailInputValue || !validateEmail(state.emailInputValue)) return;

    let subject = state.appUrl;
    if (subject.charAt(subject.length - 1) == '/') subject = subject.substr(0, subject.length - 1);
    const data = {
      from_email: state.emailInputValue,
      from_name: state.nameInputValue,
      subject: `${subject.split(/[/]+/).pop()}: RequestToTranscribe`,
      recordid: state.id,
      message: `${state.type}: ${state.title}\n${
        location.pathname}\n\n${
        state.url}\n\n`
                + `Från: ${state.nameInputValue} (${state.emailInputValue})\n\n${
                  state.messageInputValue}`,
    };

    const formData = new FormData();
    formData.append('json', JSON.stringify(data));

    fetch(`${config.restApiUrl}feedback/`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json()).then((json) => {
        if (json.success === true || json.success === 'true') {
          setState({
            ...state,
            messageSent: true,
            messageSentError: false,
          });
        } else {
          setState({
            ...state,
            messageSent: true,
            messageSentError: true,
          });
        }
      });
  };

  // Rendering logic
  let overlayContent;

  if (state.messageSent === true && state.messageSentError === false) {
    overlayContent = (
      <div>
        <p>{l('Formulär inskickat.')}</p>
        <p>
          <br />
          <button
            className="button-primary"
            onClick={closeButtonClickHandler}
            type="button"
          >
            Stäng
          </button>
        </p>
      </div>
    );
  }
    else if (state.messageSent === true && state.messageSentError === true) {
    overlayContent = (
      <div>
        <p>{l('Något gick fel. Meddelande kunde inte skickas. Vänligen försök senare, eller kontakta oss på karttjanster@isof.se')}</p>
        <p>
          <br />
          <button
            className="button-primary"
            onClick={closeButtonClickHandler}
            type="button"
          >
            Stäng
          </button>
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div>
        <p>
          Önskar du transkribera materialet på sidan '
          <strong>{state.id}</strong>
          '?
          <br />
          Skicka då in detta formulär. Isof behandlar inkomna förfrågningar i mån av tid.
          <br />
          <br />
          Tack för visat intresse!
        </p>
        <hr />
        <label htmlFor="contribute_name">Ditt namn:</label>
        <input id="contribute_name" autoComplete="name" className="u-full-width" type="text" value={state.nameInputValue} onChange={nameInputChangeHandler} />
        <label htmlFor="contribute_email">Din e-post adress:</label>
        <input 
          id="contribute_email" 
          autoComplete="email" 
          className={`u-full-width ${emailValid ? '' : 'invalid'}`} 
          type="email" 
          required 
          value={state.emailInputValue} 
          onBlur={handleEmailBlur}
          onChange={emailInputChangeHandler}
        />
        <label htmlFor="contribute_message">Meddelande:</label>
        <textarea lang="sv" spellCheck="false" id="contribute_message" className="u-full-width" required value={state.messageInputValue} onChange={messageInputChangeHandler} />
        <button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button>
      </div>
    );
  }

  return (
    <div className={`overlay-container feedback-overlay-container${state.visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {l('Vill du transkribera materialet?')}
          <button title="stäng" className="close-button white" onClick={closeButtonClickHandler} />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}
