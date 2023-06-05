import { useState, useEffect } from 'react';
import config from '../../config';

export default function ContributeinfoOverlay() {
  const [state, setState] = useState({
    visible: false,
    messageInputValue: '',
    nameInputValue: '',
    emailInputValue: '',
    messageSent: false,
    type: '',
    title: '',
    country: '',
    url: '',
    appUrl: '',
    id: '',
  });

  useEffect(() => {
    const contributeInfoListener = (event) => setState({
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
      window.eventBus.addEventListener('overlay.contributeinfo', contributeInfoListener);
      window.eventBus.addEventListener('overlay.hide', hideOverlayListener);
    }

    return () => {
      if (window.eventBus) {
        window.eventBus.removeEventListener('overlay.contributeinfo', contributeInfoListener);
        window.eventBus.removeEventListener('overlay.hide', hideOverlayListener);
      }
    };
  }, []);

  const closeButtonClickHandler = () => {
    setState({
      ...state,
      visible: false,
      messageSent: false,
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
    let subject = state.appUrl;
    if (subject.charAt(subject.length - 1) == '/') subject = subject.substr(0, subject.length - 1);
    const data = {
      from_email: state.emailInputValue,
      from_name: state.nameInputValue,
      subject: `${subject.split(/[/]+/).pop()}: ContributeInfo`,
      recordid: state.id,
      message: `${state.type}: ${state.title}\n${
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
        if (json.success) {
          setState({
            ...state,
            messageSent: true,
          });
        }
      });
  };

  // Rendering logic
  let overlayContent;

  if (state.messageSent) {
    overlayContent = (
      <div>
        <p>{l('Tack för ditt bidrag. Meddelande skickat.')}</p>
        <p>
          <br />
          <button className="button-primary" onClick={closeButtonClickHandler}>Stäng</button>
        </p>
      </div>
    );
  } else {
    overlayContent = (
      <div>
        <p>
          {config.siteOptions.contributeInfoText || 'Känner du till någon av personerna som nämns: en upptecknare, någon som intervjuats eller som nämns i en berättelse? Vid 1900-talets början var arkiven framför allt intresserade av berättelserna, inte berättarna. Därför vet vi idag ganska lite om människorna i arkiven. Kontakta oss gärna nedan om du har information om eller fotografier på någon av personerna som nämns på uppteckningen! Vill du vara med och bevara minnen och berättelser från vår tid till framtiden? På Institutets webbplats publiceras regelbundet frågelistor om olika ämnen. '}
          <a href="https://www.isof.se/folkminnen/beratta-for-oss.html"><strong>{l('Läs mer.')}</strong></a>
        </p>
        <p>
          Du är nu på sidan '
          <a href={state.url}>{state.title}</a>
          ' men kan också använda formuläret för mer generella förslag och synpunkter.
          <br />
          <br />
        </p>
        <hr />
        <label htmlFor="contribute_name">Ditt namn:</label>
        <input id="contribute_name" autoComplete="name" className="u-full-width" type="text" value={state.nameInputValue} onChange={nameInputChangeHandler} />
        <label htmlFor="contribute_email">Din e-post adress:</label>
        <input id="contribute_email" autoComplete="email" className="u-full-width" type="email" value={state.emailInputValue} onChange={emailInputChangeHandler} />
        <label htmlFor="contribute_message">Meddelande:</label>
        <textarea lang="sv" spellCheck="false" id="contribute_message" className="u-full-width" value={state.messageInputValue} onChange={messageInputChangeHandler} />
        <button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button>
      </div>
    );
  }

  return (
    <div className={`overlay-container feedback-overlay-container${state.visible ? ' visible' : ''}`}>
      <div className="overlay-window">
        <div className="overlay-header">
          {l('Vet du mer?')}
          <button title="stäng" className="close-button white" onClick={closeButtonClickHandler} />
        </div>
        {overlayContent}
      </div>
    </div>
  );
}