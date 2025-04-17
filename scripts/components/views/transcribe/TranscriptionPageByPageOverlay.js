import { useState, useEffect, useRef } from 'react';
import config from '../../../config';
import { l } from '../../../lang/Lang';
import TranscriptionForm from './TranscriptionForm';
import ImageMap from '../ImageMap';
import TranscriptionThumbnails from './TranscriptionThumbnails';
import NavigationPanel from './NavigationPanel';
import OverlayHeader from './OverlayHeader';

/**
 * Sida‑för‑sida‑overlay som hanterar sin egen synlighet via eventBus
 * och har en “Slumpa ny uppteckning”‑knapp i headern.
 */
export default function TranscriptionPageByPageOverlay() {
  /* ------------------------------------------------------------ */
  /* Synlighet & dokumentdata                                     */
  /* ------------------------------------------------------------ */
  const [visible, setVisible] = useState(false);
  const [recordDetails, setRecordDetails] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  /* ------------------------------------------------------------ */
  /* Formulärfält                                                 */
  /* ------------------------------------------------------------ */
  const [messageSent, setMessageSent] = useState(false);
  const [informantNameInput, setInformantNameInput] = useState('');
  const [informantBirthDateInput, setInformantBirthDateInput] = useState('');
  const [informantBirthPlaceInput, setInformantBirthPlaceInput] = useState('');
  const [informantInformationInput, setInformantInformationInput] = useState('');
  const [transcriptionText, setTranscriptionText] = useState('');
  const [comment, setComment] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  /* ------------------------------------------------------------ */
  /* Sessions & refs                                              */
  /* ------------------------------------------------------------ */
  const [transcribesession, setTranscribesession] = useState(null);
  let transcribesessionLocal = null; // fallback innan state uppdaterats
  const thumbnailContainerRef = useRef(null);

  /* ------------------------------------------------------------ */
  /* Utils                                                        */
  /* ------------------------------------------------------------ */
  const scrollToActiveThumbnail = (index) => {
    const thumbnails = thumbnailContainerRef.current;
    if (!thumbnails) return;
    const thumbRect = thumbnails.children[index].getBoundingClientRect();
    const contRect = thumbnails.getBoundingClientRect();
    if (thumbRect.left < contRect.left || thumbRect.right > contRect.right) {
      thumbnails.scrollLeft = thumbRect.left - contRect.left + thumbnails.scrollLeft - thumbRect.width / 2;
    }
  };

  /* ------------------------------------------------------------ */
  /* Event‑listeners                                              */
  /* ------------------------------------------------------------ */
  useEffect(() => {
    const showHandler = (e) => {
      const t = e.target;
      setRecordDetails({
        url: t.url,
        id: t.id,
        archiveId: t.archiveId,
        title: t.title,
        type: t.type,
        transcriptionType: t.transcriptionType,
        placeString: t.placeString,
      });

      const initial = (t.images || []).map((p) => ({
        ...p,
        isSent: false,
        unsavedChanges: false,
        text: p.text || '',
        comment: p.comment || '',
      }));
      setPages(initial);

      const startIdx = initial.findIndex((p) => p.transcriptionstatus === 'readytotranscribe');
      setCurrentPageIndex(startIdx !== -1 ? startIdx : 0);

      transcribeStart(t.id);
      requestAnimationFrame(() => scrollToActiveThumbnail(startIdx !== -1 ? startIdx : 0));

      setVisible(true);
    };

    const hideHandler = () => setVisible(false);

    window.eventBus.addEventListener('overlay.transcribePageByPage', showHandler);
    window.eventBus.addEventListener('overlay.hide', hideHandler);
    return () => {
      window.eventBus.removeEventListener('overlay.transcribePageByPage', showHandler);
      window.eventBus.removeEventListener('overlay.hide', hideHandler);
    };
  }, []);

  /* ------------------------------------------------------------ */
  /* Backend‑helpers                                              */
  /* ------------------------------------------------------------ */
  const transcribeStart = (recordid) => {
    const fd = new FormData();
    fd.append('json', JSON.stringify({ recordid }));
    fetch(`${config.restApiUrl}transcribestart/`, { method: 'POST', body: fd })
      .then((r) => r.json())
      .then((j) => {
        if (j.success === 'true') {
          if (j.data) {
            transcribesessionLocal = j.data.transcribesession;
            setTranscribesession(j.data.transcribesession);
          }
          setMessageSent(false);
        } else {
          alert(j.message || 'Ett fel inträffade.');
          handleHideOverlay();
        }
      })
      .catch((err) => console.error('transcribeStart error:', err));
  };

  const transcribeCancel = async () => {
    if (!messageSent && recordDetails) {
      const fd = new FormData();
      fd.append('json', JSON.stringify({
        recordid: recordDetails.id,
        transcribesession: transcribesession || transcribesessionLocal,
      }));
      try {
        await fetch(`${config.restApiUrl}transcribecancel/`, { method: 'POST', body: fd });
      } catch (err) {
        console.error('transcribeCancel error:', err);
      }
    }
  };

  /* ------------------------------------------------------------ */
  /* Close / navigation helpers                                   */
  /* ------------------------------------------------------------ */
  const handleHideOverlay = () => {
    if (pages.some((p) => p.unsavedChanges)) {
      if (!window.confirm('Det finns osparade ändringar. Är du säker på att du vill stänga?')) return;
    }
    window.eventBus.dispatch('overlay.hide');
  };

  const navigatePages = (index) => {
    setPages((prev) => {
      const next = [...prev];
      next[currentPageIndex].text = transcriptionText;
      next[currentPageIndex].comment = comment;
      return next;
    });
    setCurrentPageIndex(index);

    const page = pages[index];
    if (page.transcriptionstatus && page.transcriptionstatus !== 'readytotranscribe') {
      setTranscriptionText(page.text || '');
    } else if (page.unsavedChanges) {
      setTranscriptionText(page.text || '');
    } else {
      setTranscriptionText('');
    }
    setComment(page.comment || '');
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      navigatePages(currentPageIndex - 1);
      scrollToActiveThumbnail(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      navigatePages(currentPageIndex + 1);
      scrollToActiveThumbnail(currentPageIndex + 1);
    }
  };

  const goToNextTranscribePage = () => {
    const nextIdx = pages.findIndex((p, i) => i > currentPageIndex && p.transcriptionstatus === 'readytotranscribe');
    if (nextIdx !== -1) {
      navigatePages(nextIdx);
      scrollToActiveThumbnail(nextIdx);
    }
  };

  /* ------------------------------------------------------------ */
  /* Skicka‑knapp                                                 */
  /* ------------------------------------------------------------ */
  const sendButtonClickHandler = (e) => {
    if (transcriptionText.trim().indexOf(' ') === -1) {
      alert(l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'));
      return;
    }
    const goToNext = e.target.getAttribute('data-gotonext') === 'true';

    const fd = new FormData();
    fd.append('json', JSON.stringify({
      transcribesession,
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
      recordid: recordDetails.id,
      page: pages[currentPageIndex].source,
    }));

    const btn = e.target;
    btn.textContent = 'Skickar…';

    fetch(`${config.restApiUrl}transcribe/`, { method: 'POST', body: fd })
      .then((r) => r.json())
      .then((j) => {
        if (j.success === 'true') {
          setPages((prev) => {
            const next = [...prev];
            next[currentPageIndex] = { ...next[currentPageIndex], isSent: true, unsavedChanges: false, transcriptionstatus: 'transcribed' };
            return next;
          });
          if (goToNext) goToNextTranscribePage();
          if (window.eventBus) window.eventBus.dispatch('overlay.transcribe.sent');
        } else {
          btn.textContent = 'Skicka';
          console.error('Serverfel:', j);
        }
      })
      .catch((err) => {
        btn.textContent = 'Skicka';
        console.error('send error:', err);
      });
  };

  /* ------------------------------------------------------------ */
  /* Input change handler                                         */
  /* ------------------------------------------------------------ */
  const inputChangeHandler = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'transcriptionText':
      case 'messageInput':
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
      case 'nameInput':
        setNameInput(value);
        break;
      case 'emailInput':
        setEmailInput(value);
        break;
      case 'messageCommentInput':
        setComment(value);
        break;
      case 'title':
        setRecordDetails((prev) => ({ ...prev, title: value }));
        break;
      default:
        console.log('Okänt fält:', name);
    }

    setPages((prev) => {
      const next = [...prev];
      next[currentPageIndex].isSent = false;
      next[currentPageIndex].unsavedChanges = true;
      return next;
    });
  };

  /* ------------------------------------------------------------ */
  /* Render                                                       */
  /* ------------------------------------------------------------ */
  if (!visible || !recordDetails) return null;

  return (
    <div className='overlay-container visible transcription-page-by-page-overlay'>
      <div className='overlay-window large'>
        <OverlayHeader
          recordDetails={recordDetails}
          handleHideOverlay={handleHideOverlay}
          transcribeCancel={transcribeCancel}
        />

        <div className='row'>
          <div className='four columns'>
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

          <div className='eight columns'>
            {pages.length > 0 && (
              <ImageMap image={`${config.imageUrl}${pages[currentPageIndex].source}`} />
            )}

            <div className='row'>
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
  
