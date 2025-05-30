import { useState } from 'react';
import Uppteckningsblankett from './transcriptionForms/Uppteckningsblankett';
import Fritext from './transcriptionForms/Fritext';
import { l } from '../../../lang/Lang';

function TranscriptionForm({
  sending,
  recordDetails,
  currentPageIndex,
  pages,
  transcriptionText,
  informantNameInput,
  informantBirthDateInput,
  informantBirthPlaceInput,
  informantInformationInput,
  nameInput,
  emailInput,
  comment,
  inputChangeHandler,
  sendButtonClickHandler,
}) {
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

  const commonProps = {
    messageInput: transcriptionText,
    inputChangeHandler,
    pageIndex: currentPageIndex,
    numberOfPages: pages.length,
    transcriptionstatus: pages[currentPageIndex]?.transcriptionstatus,
  };

  const fritextProps = {
    ...commonProps,
  };

  const uppteckningsblankettProps = {
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    title: recordDetails.title,
    ...commonProps,
  };

  const renderTranscribeForm = () => {
    switch (pages[currentPageIndex]?.transcriptiontype) {
      case 'uppteckningsblankett':
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Uppteckningsblankett {...uppteckningsblankettProps} />;
      case 'fritext':
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Fritext {...fritextProps} />;
      default:
        // eslint-disable-next-line react/jsx-props-no-spreading
        return <Uppteckningsblankett {...uppteckningsblankettProps} />;
    }
  };

  const disableInput = (
    pages[currentPageIndex]?.transcriptionstatus !== 'readytotranscribe'
    && pages[currentPageIndex]?.transcriptionstatus !== null
  );

  const sendButtonLabel = pages[currentPageIndex]?.isSent ? 'Sidan har skickats' : `Skicka sida ${currentPageIndex + 1} (av ${pages.length})`;

  return (
    <div>
      {renderTranscribeForm()}
      {(pages[currentPageIndex]?.transcriptionstatus === 'readytotranscribe' || pages[currentPageIndex]?.isSent) && (
        <>
          <label htmlFor="transcription_comment" className="u-full-width margin-bottom-zero">{l(`Kommentar till sidan ${currentPageIndex + 1} (av ${pages.length})`)}</label>
          <textarea
            disabled={disableInput}
            lang="sv"
            spellCheck="false"
            id="transcription_comment"
            name="messageCommentInput"
            className="u-full-width margin-bottom-minimal"
            type="text"
            value={comment}
            onChange={inputChangeHandler}
          />
          <p>
            {l('Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.')}
            <br />
            {l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}
            <a href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html" target="_blank" rel="noreferrer"><strong>{l('Läs mer.')}</strong></a>
          </p>

          <label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
          <input id="transcription_name" autoComplete="name" name="nameInput" className="u-full-width" type="text" value={nameInput} onChange={inputChangeHandler} disabled={disableInput} />
          <label htmlFor="transcription_email">Din e-post adress (frivilligt):</label>
          <input
            id="transcription_email"
            autoComplete="email"
            name="emailInput"
            className={`u-full-width ${emailValid ? '' : 'invalid'}`}
            type="email"
            value={emailInput}
            onChange={inputChangeHandler}
            onBlur={handleEmailBlur}
            disabled={disableInput}
          />

          <button
            className="button-primary"
            onClick={sendButtonClickHandler}
            type="button"
            data-gotonext="true"
            disabled={disableInput || sending}
          >
            {sending ? 'Skickar…' : sendButtonLabel}
          </button>
          {
            pages[currentPageIndex]?.isSent
            && (
              <p>
                Tack för din avskrift. Efter granskning kommer den att publiceras.
              </p>
            )
          }
        </>
      )}
    </div>
  );
}

export default TranscriptionForm;
