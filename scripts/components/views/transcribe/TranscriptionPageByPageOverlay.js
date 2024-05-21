import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import TranscriptionForm from './TranscriptionForm';
import ImageMap from '../ImageMap';
import TranscriptionThumbnails from './TranscriptionThumbnails';
import NavigationPanel from './NavigationPanel';
import OverlayHeader from './OverlayHeader';

function TranscriptionPageByPageOverlay({ event: transcriptionOverlayEvent }) {
  const [isVisible, setIsVisible] = useState(false);
  const [transcribeSession, setTranscribesession] = useState('');

  const [recordId, setRecordId] = useState(null);
  const [recordDetails, setRecordDetails] = useState({
    url: '',
    id: '',
    archiveId: '',
    title: '',
    type: '',
    transcriptionType: '',
    placeString: '',
  });
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [messageSent, setMessageSent] = useState(false);

  const [informantNameInput, setInformantNameInput] = useState('');
  const [informantBirthDateInput, setInformantBirthDateInput] = useState('');
  const [informantBirthPlaceInput, setInformantBirthPlaceInput] = useState('');
  const [informantInformationInput, setInformantInformationInput] = useState('');

  const [transcriptionText, setTranscriptionText] = useState('');
  const [comment, setComment] = useState('');

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const thumbnailContainerRef = useRef(null);

  const scrollToActiveThumbnail = (index) => {
    const thumbnails = thumbnailContainerRef.current;
    if (!thumbnails) return;

    const thumbnailRect = thumbnails.children[index].getBoundingClientRect();
    const containerRect = thumbnails.getBoundingClientRect();
    if (thumbnailRect.left < containerRect.left || thumbnailRect.right > containerRect.right) {
      thumbnails.scrollLeft = thumbnailRect.left
        - containerRect.left
        + thumbnails.scrollLeft
        - (thumbnailRect.width / 2);
    }
  };

  const transcribeCancel = async () => {
    if (!messageSent) {
      const data = {
        recordid: recordId,
        transcribesession: transcribeSession,
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
    // Spara den aktuella transkriberingstexten och kommentaren innan navigering
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[currentPageIndex].text = transcriptionText;
      newPages[currentPageIndex].comment = comment;
      return newPages;
    });

    // Uppdatera den aktuella sidan och återställ text och kommentar
    setCurrentPageIndex(index);
    setTranscriptionText(pages[index]?.text || '');
    setComment(pages[index]?.comment || '');
  };

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
      scrollToActiveThumbnail(newIndex);
    }
  };

  const goToNextTranscribePage = () => {
    const nextIndex = pages.findIndex((page, index) => index > currentPageIndex && page.transcriptionstatus === 'readytotranscribe');
    if (nextIndex !== -1) {
      navigatePages(nextIndex);
      scrollToActiveThumbnail(nextIndex);
    }
  };

  const transcribeStart = (recordid) => {
    const data = {
      recordid,
    };

    const formData = new FormData();
    formData.append('json', JSON.stringify(data));

    fetch(`${config.restApiUrl}transcribestart/`, {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.success && json.success === 'true') {
          let transcribesession = false;
          if (json.data) {
            transcribesession = json.data.transcribesession;
          }
          setMessageSent(false);
          setTranscribesession(transcribesession);
        } else {
          setMessageSent(false);
        }
      })
      .catch((error) => {
        console.error(`Error when starting transcription: ${error}`);
      });
  };

  const handleHideOverlay = () => {
    if (pages.some(page => page.unsavedChanges)) {
      const confirmLeave = window.confirm("Det finns osparade ändringar. Är du säker på att du vill stänga?");
      if (!confirmLeave) return;
    }
    window.eventBus.dispatch('overlay.hide');
  };

  useEffect(() => {
    setIsVisible(true);
    setRecordId(transcriptionOverlayEvent.target.id);

    // Initialisera pages med isSent satt till false och inkludera comment
    const initialPages = (transcriptionOverlayEvent.target.images || []).map((page) => ({
      ...page,
      isSent: false,
      unsavedChanges: false,
      text: page.text || '',
      comment: page.comment || '',
    }));
    setPages(initialPages);

    // Lås hela dokumentet när vyn öppnas
    transcribeStart(transcriptionOverlayEvent.target.id);

    // Ställ in den första sidan för transkribering
    setCurrentPageIndex(0);
    setTranscriptionText(initialPages[0]?.text || '');
    setComment(initialPages[0]?.comment || '');

    setRecordDetails({
      url: transcriptionOverlayEvent.target.url,
      id: transcriptionOverlayEvent.target.id,
      archiveId: transcriptionOverlayEvent.target.archiveId,
      title: transcriptionOverlayEvent.target.title,
      type: transcriptionOverlayEvent.target.type,
      transcriptionType: transcriptionOverlayEvent.target.transcriptionType,
      placeString: transcriptionOverlayEvent.target.placeString,
    });

    return () => {
      transcribeCancel();
    };
  }, []);

  const sendButtonClickHandler = () => {
    const text = transcriptionText;
    const isMinimum2Words = text.trim().indexOf(' ') !== -1;

    if (!isMinimum2Words) {
      alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
    } else {
      const data = {
        transcribeSession,
        url: recordDetails.url,
        from_email: emailInput,
        from_name: nameInput,
        subject: 'Crowdsource: Transkribering',
        informantName: informantNameInput,
        informantBirthDate: informantBirthDateInput,
        informantBirthPlace: informantBirthPlaceInput,
        informantInformation: informantInformationInput,
        message: transcriptionText,
        messageComment: comment,
        recordid: recordId,
        page: currentPageIndex + 1,
        transcribesession: transcribeSession,
      };

      axios.post(`${config.restApiUrl}transcribe/`, { json: JSON.stringify(data) })
        .then((response) => {
          const { responseData = data } = response;
          if (responseData.success) {
            // Markera sidan som skickad och sparad
            setPages((prevPages) => {
              const newPages = [...prevPages];
              newPages[currentPageIndex].isSent = true;
              newPages[currentPageIndex].unsavedChanges = false;
              return newPages;
            });

            if (window.eventBus) {
              window.eventBus.dispatch('overlay.transcribe.sent');
            }

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
      case 'title':
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

    // Markera som osparad när en förändring sker
    setPages((prevPages) => {
      const newPages = [...prevPages];
      newPages[currentPageIndex].isSent = false;
      newPages[currentPageIndex].unsavedChanges = true;
      return newPages;
    });
  };

  return (
    <div className="overlay-container visible">
      <div className="overlay-window large">
        <OverlayHeader recordDetails={recordDetails} handleHideOverlay={handleHideOverlay} />
        <div className="row">
          <div className="four columns">
            <TranscriptionForm
              recordDetails={recordDetails}
              currentPageIndex={currentPageIndex}
              pages={pages}
              transcriptionText={transcriptionText}
              informantNameInput={informantNameInput}
              informantBirthDateInput={informantBirthDateInput}
              informantBirthPlaceInput={informantBirthPlaceInput}
              informantInformationInput={informantInformationInput}
              nameInput={nameInput}
              emailInput={emailInput}
              comment={comment}
              inputChangeHandler={inputChangeHandler}
              sendButtonClickHandler={sendButtonClickHandler}
            />
          </div>
          <div className="eight columns">
            {pages.length > 0 && (
              <ImageMap image={`${config.imageUrl}${pages[currentPageIndex].source}`} />
            )}
            <div className="row">
              <NavigationPanel
                currentPageIndex={currentPageIndex}
                pages={pages}
                goToPreviousPage={goToPreviousPage}
                goToNextPage={goToNextPage}
                goToNextTranscribePage={goToNextTranscribePage}
              />
            </div>
            <TranscriptionThumbnails
              thumbnailContainerRef={thumbnailContainerRef}
              pages={pages}
              navigatePages={navigatePages}
              currentPageIndex={currentPageIndex}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TranscriptionPageByPageOverlay;
