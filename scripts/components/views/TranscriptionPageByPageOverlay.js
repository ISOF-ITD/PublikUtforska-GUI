import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';
import { l } from '../../lang/Lang';
import Uppteckningsblankett from './transcriptionForms/Uppteckningsblankett';
import Fritext from './transcriptionForms/Fritext';
import ImageMap from './ImageMap';

function TranscriptionPageByPageOverlay() {
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

  // add a ref for the active thumbnail container
  const thumbnailContainerRef = useRef(null);

  // scroll sideways to active thumbnail, when buttons are clicked
  const scrollToActiveThumbnail = (index) => {
    const thumbnails = thumbnailContainerRef.current;
    if (!thumbnails) return;
  
    // kolla om den aktiva thumbnailen är utanför (höger + vänster) den synliga ytan:
    const thumbnailRect = thumbnails.children[index].getBoundingClientRect();
    const containerRect = thumbnails.getBoundingClientRect();
    if (thumbnailRect.left < containerRect.left || thumbnailRect.right > containerRect.right) {
      thumbnails.scrollLeft = thumbnailRect.left
        - containerRect.left
        + thumbnails.scrollLeft
        - (thumbnailRect.width / 2);
    }
  };
  


  const transcribeCancel = async (keepOverlayVisible = false) => {
    console.log('cancel');
    setIsVisible(keepOverlayVisible);

    if (!messageSent) {
      const data = {
        recordid: recordDetails.id,
        transcribesession: transcribeSession,
        page: pages[currentPageIndex]?.source,
      };

      const formData = new FormData();
      formData.append('json', JSON.stringify(data));

      try {
        const response = await fetch(`${config.restApiUrl}transcribecancel/`, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        // Hantera svaret vid framgång
      } catch (error) {
        console.error(`Error when cancelling transcription: ${error}`);
      }
    }
  };

  const navigatePages = async (index) => {
    await transcribeCancel(true);
    setCurrentPageIndex(index);

    const newPageTranscriptionText = pages[index]?.text || '';
    setTranscriptionText(newPageTranscriptionText);

    if (pages[index] && pages[index].source) {
      transcribeStart(recordDetails.id, pages[index].source);
    }
  };

  // functions for navigation
  const goToPreviousPage = () => {
    const newIndex = currentPageIndex - 1;
    if (newIndex >= 0) {
      navigatePages(newIndex);
      scrollToActiveThumbnail(newIndex);
    }
  };
  const goToNextPage = () => {
    const newIndex = currentPageIndex + 1;
    if (newIndex < pages.length) {
      navigatePages(newIndex);
          // Scrolla till den aktiva thumbnailen
      scrollToActiveThumbnail(newIndex);
    }
  };
  const goToNextTranscribePage = () => {
    console.log(pages);
    const nextIndex = pages.findIndex((page, index) => index > currentPageIndex && page.transcriptionstatus === 'readytotranscribe');
    if (nextIndex !== -1) {
      navigatePages(nextIndex);
      scrollToActiveThumbnail(nextIndex);
    }
  };

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

  const handleHideOverlay = () => {
    // Clear transcribe fields:
    setInformantNameInput('');
    setInformantBirthDateInput('');
    setInformantBirthPlaceInput('');
    setInformantInformationInput('');
    setNameInput('');
    setMessage('');
    setComment('');
    setIsVisible(false);
    transcribeCancel();
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

    window.eventBus.addEventListener('overlay.transcribePageByPage', handleShowOverlay);
    window.eventBus.addEventListener('overlay.hide', handleHideOverlay);

    return () => {
      window.eventBus.removeEventListener('overlay.transcribePageByPage', handleShowOverlay);
      window.eventBus.removeEventListener('overlay.hide', handleHideOverlay);
    };
  }, []);

  const sendButtonClickHandler = () => {
    const text = transcriptionText;
    const isMinimum2Words = text.trim().indexOf(' ') !== -1;

    if (!isMinimum2Words) {
      alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
    } else {
      // fråga: ska övergripande dokumentegenskapen skickas in separat?
      // med andra ord: när skickas page-id till servern?
      // annan idé/fråga: är bara sida 1 uppteckningsblankett, och de andra är fritext? dvs transcriptionType på sidnivå?

      // på one_record är transcriptiontype "sidaforsida".
      // sidorna har egna transcriptiontypes.
      // det finns en django eaction som skapar one records sida för sida
      // som default får alla media "fritext"
      // men de kan byta senare. t ex "uppteckning"
      // så: fältet som "berättat av" etc ligger på sida/media-nivå
      // transcriptionstatus för själva sida_för_sida är
      // - så länge det finns undertranscription sidor så är den undertranscription
      // - one_record blir "published" när alla undersidor är published (sker inte automatiskt, kan senare
      //   läggas till med ny kod i djangoadmin model save.)

      // Användningsfall:
      // https://github.com/ISOF-ITD/kartplattformen_common/blob/master/anvandningsfall/transkribera_uppteckning_sida_for_sida.md

      // transcriptiontype på one_record är: "transcriptiontype": "sida",
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
        message: transcriptionText,
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
    const { name, value } = event.target;
    switch (name) {
      case 'transcriptionText':
        setTranscriptionText(value);
        break;
      case 'informantNameInput':
        setInformantNameInput(value);
        break;
      case 'informantBirthDateInput':
        setInformantBirthDateInput(value);
        break;
      case 'informantBirthPlaceInput':
        setInformantBirthPlaceInput(value);
        break;
      case 'informantInformationInput':
        setInformantInformationInput(value);
        break;
      case 'title': // Uppdatera titeln inom recordDetails
        setRecordDetails((prevDetails) => ({
          ...prevDetails,
          title: value,
        }));
        break;
      case 'nameInput':
        setNameInput(value);
        break;
      case 'emailInput':
        setEmailInput(value);
        break;
      case 'messageCommentInput':
        setComment(value);
        break;
      case 'messageInput':
        setTranscriptionText(value);
        break;
      default:
        console.log(`Okänt fält: ${name}`);
    }
  };

  const renderTranscribeForm = () => {
    const commonProps = {
      messageInput: transcriptionText,
      inputChangeHandler,
      pageIndex: currentPageIndex,
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

    switch (pages[currentPageIndex].transcriptiontype) {
      case 'uppteckningsblankett':
        return <Uppteckningsblankett {...uppteckningsblankettProps} />;
      case 'fritext':
        return <Fritext {...fritextProps} />;
      default:
        return <Uppteckningsblankett {...uppteckningsblankettProps} />;
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
          <button title="stäng" className="close-button white" onClick={() => handleHideOverlay()}>Stäng</button>
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

            <button className="button-primary" onClick={sendButtonClickHandler}>
              Skicka sida
              {currentPageIndex + 1}
            </button>
          </div>
          <div className="eight columns">
            {pages.length > 0 && (
              // <img
              //   className="main-image"
              //   src={`${config.imageUrl}${pages[currentPageIndex].source}`}
              //   alt={`Sida ${currentPageIndex + 1}`}
              // />
              <ImageMap image={`${config.imageUrl}${pages[currentPageIndex].source}`} />
            )}
            <div className="row">
              <div className="navigation-panel">
                <button
                  className="button"
                  onClick={goToPreviousPage}
                  disabled={currentPageIndex === 0}
                  type="button"
                >
                  Föregående sida
                </button>
                <button
                  className="button"
                  onClick={goToNextPage}
                  disabled={currentPageIndex === pages.length - 1}
                  type="button"
                >
                  Nästa sida
                </button>
                <button
                  className="button"
                  onClick={goToNextTranscribePage}
                  // make disabled if none of the following pages can be transcribed
                  disabled={pages.slice(currentPageIndex + 1).every(page => page.transcriptionstatus !== 'readytotranscribe')}
                >
                  Nästa sida att skriva av
                </button>
              </div>

            </div>
            <div className="image-thumbnails" ref={thumbnailContainerRef}>
              {pages.map((page, index) => (
                page.source && page.source.indexOf('.pdf') === -1 && (
                  <div
                    className="thumbnail-container"
                    key={index}
                    onClick={() => navigatePages(index)}
                    title={JSON.stringify(page, null, 2)}
                    >
                    <img
                      className={`thumbnail ${index === currentPageIndex ? 'active' : ''}`}
                      src={`${config.imageUrl}${page.source}`}
                      alt={`Thumbnail ${index + 1}`}
                      
                    />
                    <div className="page-number">
                      {`${index + 1} av ${pages.length}`}
                    </div>
                  </div>
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

export default TranscriptionPageByPageOverlay;
