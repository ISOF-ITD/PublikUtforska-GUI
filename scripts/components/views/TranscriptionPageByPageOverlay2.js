import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { l } from '../../lang/Lang';
import Uppteckningsblankett from './transcriptionForms/Uppteckningsblankett';
import Fritext from './transcriptionForms/Fritext';

function TranscriptionPageComponent() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [message, setMessage] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [comment, setComment] = useState('');
  const [pages, setPages] = useState([]);
  const [informantNameInput, setInformantNameInput] = useState('');
  const [informantBirthDateInput, setInformantBirthDateInput] = useState('');
  const [informantBirthPlaceInput, setInformantBirthPlaceInput] = useState('');
  const [informantInformationInput, setInformantInformationInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [transcribeSession, setTranscribesession] = useState('');
  const [readytotranscribe, setReadytotranscribe] = useState(false);
  const [recordDetails, setRecordDetails] = useState({
    url: '',
    id: '', // Kontrollera att detta värde hanteras korrekt
    archiveId: '',
    title: '',
    type: '',
    transcriptionType: '',
    placeString: '',
  });

  const transcribeStart = (recordid, imageSource) => {
    // if (page.transcriptionstatus === 'readytotranscribe') {
    const data = {
      recordid,
      page: imageSource,
    };

    const formData = new FormData();
    formData.append('json', JSON.stringify(data));

    fetch(`${config.restApiUrl}transcribestart/`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json()).then((json) => {
        let responseSuccess = false;
        if (json.success) {
          if (json.success === 'true') {
            let transcribesession = false;
            if (json.data) {
              transcribesession = json.data.transcribesession;
            }
            responseSuccess = true;
            // localStorage.setItem(`transcribesession ${recordid}`, transcribesession);
            // Do not show any message:
            setMessageSent(false);
            setTranscribesession(transcribesession);
            setReadytotranscribe(true);
          }
        }
        if (!responseSuccess) {
          setMessageSent(false);
          // Inactivate "Skicka in"-button
          setReadytotranscribe(false);
        }
      });
    // }
  };

  const transcribeCancel = (keepOverlayVisible = false) => {
    setIsVisible(keepOverlayVisible);

    if (!messageSent) {
      // Supposing the `transcribesession` and `recordDetails.id` contain the necessary details.
      const data = {
        recordid: recordDetails.id,
        transcribesession: transcribeSession,
        page: pages[currentPageIndex]?.source, // This assumes `pages` stores the current pages' data and `currentPageIndex` is the index of the current page
      };

      const formData = new FormData();
      formData.append('json', JSON.stringify(data));

      fetch(`${config.restApiUrl}transcribecancel/`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          // Here you can add any follow-up actions after successful cancellation
        })
        .catch((error) => {
          console.error(`Error when cancelling transcription: ${error}`);
        });
    } else {
      return null;
    }
  };

  useEffect(() => {
    const handleShowOverlay = (event) => {
      setIsVisible(true);
      setRecordDetails({
        url: event.target.url,
        id: event.target.id, // Antag att ID hämtas från event.target
        archiveId: event.target.archiveId,
        title: event.target.title,
        type: event.target.type,
        transcriptionType: event.target.transcriptionType,
        placeString: event.target.placeString,
      });
      setPages(event.target.images || []);
      transcribeStart(event.target.id, event.target.images[0].source);
    };

    const handleHideOverlay = () => {
      // Clear transcribe fields:
      setInformantName('');
      setInformantBirthDate('');
      setInformantBirthPlace('');
      setInformantInformation('');
      setTitle('');
      setMessageComment('');
      setMessageOnFailure(json.message);
      setIsVisible(false);
      transcribeCancel();
    };

    window.eventBus.addEventListener('overlay.transcribePageByPage', handleShowOverlay);
    window.eventBus.addEventListener('overlay.hide', handleHideOverlay);

    return () => {
      window.eventBus.removeEventListener('overlay.transcribePageByPage', handleShowOverlay);
      window.eventBus.removeEventListener('overlay.hide', handleHideOverlay);
    };
  }, []);

  /* Viktiga punkter att notera om navigatePages():
Dynamisk Textladdning: Den nya sidans transcriptionText laddas dynamiskt baserat på pages
arrayen. Det är viktigt att varje objekt i pages innehåller relevant transkriptionstext
om detta är avsett. Om inte, behöver du implementera en metod för att ladda denna text
när en sida visas.

Bibehåll Konstant Information: Eftersom title och informant-informationen inte förändras
per sida, rörs dessa inte i navigatePages funktionen. De ska initieras och hanteras separat
så att de inte återställs eller ändras när en ny sida visas.

Testning och Anpassning: Det är viktigt att testa denna implementering i din miljö för att
säkerställa att det fungerar som förväntat med din nuvarande datastruktur och applikationslogik.
https://chat.openai.com/g/g-x4U0ey6jN-react-mentor/c/5cb791e3-9e25-45d0-bab8-2356dedc8f24
 */
  const navigatePages = (index) => {
    // Avbryter nuvarande transkription innan sidbyte
    transcribeCancel(); // Denna funktion bör anpassas om den behöver hantera specifika uppgifter vid avbrytande

    setCurrentPageIndex(index);
    const newPageTranscriptionText = pages[index]?.transcriptionText || '';
    setTranscriptionText(newPageTranscriptionText);

    // Fortsätt med att initiera transkriptionen för den nya sidan
    if (pages[index] && pages[index].source) {
      transcribeStart(recordDetails.id, pages[index].source);
    }
  };

  const sendButtonClickHandler = () => {
    const text = message;
    const isMinimum2Words = text.trim().indexOf(' ') !== -1;

    if (!isMinimum2Words) {
      alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
    } else {
      const data = {
        transcribeSession,
        url: recordDetails.url,
        recordid: recordDetails.id,
        recordtitle: recordDetails.title,
        from_email: emailInput,
        from_name: nameInput,
        subject: 'Crowdsource: Transkribering',
        informantName: informantNameInput,
        informantBirthDate: informantBirthDateInput,
        informantBirthPlace: informantBirthPlaceInput,
        informantInformation: informantInformationInput,
        message,
        messageComment: comment,
      };

      axios.post(`${config.restApiUrl}transcribe/`, data)
        .then((response) => {
          const { responseData = data } = response;
          if (responseData.success) {
            // send signal to current view to re-mount
            if (window.eventBus) {
              window.eventBus.dispatch('overlay.transcribe.sent');
            }
            // Clear transcribe fields and show thank you message:
            setComment('');
            setMessage('');
            setInformantNameInput('');
            setInformantBirthDateInput('');
            setInformantBirthPlaceInput('');
            setInformantInformationInput('');
            setEmailInput('');
            setNameInput('');
          } else {
            console.error(`Server does not respond for: ${recordDetails.url}`);
          }
        })
        .catch((error) => {
          console.error(`Error when sending data: ${error}`);
        });
    }
  };

  if (!isVisible) return null;

  const inputChangeHandler = (event) => {
    debugger;
  };

  const renderTranscribeForm = () => {
    // write a switch-statement for the different transcription types
    // and return the correct form
    switch (recordDetails.transcriptionType) {
      case 'uppteckningsblankett':
        return (
          <Uppteckningsblankett
            informantNameInput={informantNameInput}
            informantBirthDateInput={informantBirthDateInput}
            informantBirthPlaceInput={informantBirthPlaceInput}
            informantInformationInput={informantInformationInput}
            title={recordDetails.title}
            messageInput={transcriptionText}
            inputChangeHandler={inputChangeHandler}
          />
        );
      case 'fritext':
        return (
          <Fritext
            messageInput={transcriptionText}
            inputChangeHandler={inputChangeHandler}
          />
        );
      default:
        return (
          <Uppteckningsblankett
            informantNameInput={informantNameInput}
            informantBirthDateInput={informantBirthDateInput}
            informantBirthPlaceInput={informantBirthPlaceInput}
            informantInformationInput={informantInformationInput}
            title={recordDetails.title}
            messageInput={transcriptionText}
            inputChangeHandler={inputChangeHandler}
          />
        );
    }
  };

  return (
    <div className="overlay-container visible">
      <div className="overlay-window large">
        <div className="overlay-header">
          Skriv av
          {' '}
          {recordDetails.title}
          {' '}
          -
          {' '}
          {recordDetails.type}
          <button title="stäng" className="close-button white" onClick={() => setIsVisible(false)}>Stäng</button>
        </div>
        <div className="row">
          <div className="four columns">
            {/*
					<p><a href="https://www.isof.se/om-oss/kartor/sagenkartan/transkribera.html"><strong>{l('Läs mer om att skriva av.')}</strong></a><br/><br/></p>

					<hr/>

					*/}
            {renderTranscribeForm()}

            <label htmlFor="transcription_comment" className="u-full-width margin-bottom-zero">{l('Kommentar till avskriften:')}</label>
            <textarea lang="sv" spellCheck="false" id="transcription_comment" name="messageCommentInput" className="u-full-width margin-bottom-minimal" type="text" value={comment} onChange={inputChangeHandler} />
            <p>
              {l('Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte.')}
              <br />
              {l('Vi hanterar personuppgifter enligt dataskyddsförordningen. ')}
              <a href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html" target="_blank" rel="noreferrer"><strong>{l('Läs mer.')}</strong></a>
            </p>

            <label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
            <input id="transcription_name" autoComplete="name" name="nameInput" className="u-full-width" type="text" value={nameInput} onChange={inputChangeHandler} />
            <label htmlFor="transcription_email">Din e-post adress (frivilligt):</label>
            <input id="transcription_email" autoComplete="" name="emailInput" className="u-full-width" type="email" value={emailInput} onChange={inputChangeHandler} />

            <button className="button-primary" onClick={sendButtonClickHandler}>Skicka</button>
          </div>
          <div className="eight columns">
            {pages.length > 0 && (
              <img
                className="main-image"
                src={`${config.imageUrl}${pages[currentPageIndex].source}`}
                alt={`Sida ${currentPageIndex + 1}`}
              />
            )}
            <div className="image-thumbnails">
              {pages.map((page, index) => (
                page.source && page.source.indexOf('.pdf') === -1 && (
                  <img
                    key={index}
                    className="thumbnail"
                    src={`${config.imageUrl}${page.source}`}
                    alt={`Thumbnail ${index + 1}`}
                    onClick={() => navigatePages(index)}
                  />
                )
              ))}
            </div>
          </div>
        </div>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default TranscriptionPageComponent;
