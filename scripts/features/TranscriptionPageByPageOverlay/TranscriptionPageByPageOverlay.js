import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import config from '../../config';
import { l } from '../../lang/Lang';
import TranscriptionForm from './ui/TranscriptionForm';
import ImageMap from './ui/ImageMap';
import TranscriptionThumbnails from './ui/TranscriptionThumbnails';
import NavigationPanel from './ui/NavigationPanel';
import OverlayHeader from './ui/OverlayHeader';
import TranscribeButton from './ui/TranscribeButton';
import useTranscriptionApi from './hooks/useTranscriptionApi';
import useTranscriptionForm, {
  getPersistedContributorFields,
  INITIAL_FIELDS,
} from './hooks/useTranscriptionForm';
import { toastError, toastOk } from '../../utils/toast';
import { IconButton } from '../../components/IconButton';

/*
TranscriptionPageByPageOverlay feature is handling the transcribe page-by-page use case for users.
*/
export default function TranscriptionPageByPageOverlay() {
  const [visible, setVisible] = useState(false);
  const [recordDetails, setRecordDetails] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showMetaFields, setShowMetaFields] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const thumbnailContainerRef = useRef(null);
  const prevPageIndexRef = useRef(0);

  const {
    session, sending, start, cancel, send,
  } = useTranscriptionApi();
  const {
    fields,
    handleInputChange,
    reset: resetForm,
    setFields,
  } = useTranscriptionForm();

  const getPageNumberFromSource = (source) => {
    if (!source) return '';
    const match = source.match(/_(\d+)\.[^.]+$/);
    if (match && match[1]) {
      return parseInt(match[1], 10).toString();
    }
    return '';
  };

  const scrollToActiveThumbnail = useCallback((index) => {
    const cont = thumbnailContainerRef.current;
    if (!cont) return;
    const el = cont.querySelector(`#thumb-${index}`);
    if (!el) return;
    el.scrollIntoView({
      block: 'nearest',
      inline: 'center',
      behavior: 'smooth',
    });
  }, []);

  const handleFormChange = (e) => {
    const {
      name, type, checked, value,
    } = e.target;
    const val = type === 'checkbox' ? checked : value;

    handleInputChange(e);

    const pageLevelFields = [
      'messageInput',
      'messageCommentInput',
      'pagenumberInput',
      'foneticSignsInput',
      'unreadableInput',
      'informantNameInput',
      'informantBirthDateInput',
      'informantBirthPlaceInput',
      'informantInformationInput',
      'titleInput',
    ];

    if (!pageLevelFields.includes(name)) return;

    setPages((prev) => {
      const next = [...prev];
      const page = next[currentPageIndex];
      if (!page) return prev;

      const updateObj = {};
      if (name === 'messageInput') updateObj.text = val;
      else if (name === 'messageCommentInput') updateObj.comment = val;
      else if (name === 'pagenumberInput') updateObj.pagenumber = val;
      else if (name === 'foneticSignsInput') updateObj.fonetic_signs = val;
      else if (name === 'unreadableInput') updateObj.unreadable = val;
      else if (name === 'informantNameInput') updateObj.informantName = val;
      else if (name === 'informantBirthDateInput') {
        updateObj.informantBirthDate = val;
      } else if (name === 'informantBirthPlaceInput') {
        updateObj.informantBirthPlace = val;
      } else if (name === 'informantInformationInput') {
        updateObj.informantInformation = val;
      } else if (name === 'titleInput') {
        updateObj.titleDraft = val;
      }

      next[currentPageIndex] = {
        ...page,
        unsavedChanges: true,
        ...updateObj,
      };
      return next;
    });
  };

  const resetEverything = useCallback(() => {
    setVisible(false);
    setRecordDetails(null);
    setPages([]);
    setCurrentPageIndex(0);
    setShowMetaFields(false);
    setShowDiscardDialog(false);
    resetForm();
  }, [resetForm]);

  const transcribeCancel = useCallback(async () => {
    if (recordDetails?.id) {
      try {
        await cancel(recordDetails.id);
      } catch {
        /* Ignore cancel errors so local cleanup can continue. */
      }
    }
    resetEverything();
  }, [cancel, recordDetails, resetEverything]);

  const saveCurrentPageDraft = useCallback(() => {
    setPages((prev) => {
      const next = [...prev];
      const page = next[currentPageIndex];
      if (!page) return prev;

      next[currentPageIndex] = {
        ...page,
        text: fields.messageInput,
        comment: fields.messageCommentInput,
        pagenumber: fields.pagenumberInput,
        fonetic_signs: fields.foneticSignsInput,
        unreadable: fields.unreadableInput,
        informantName: fields.informantNameInput,
        informantBirthDate: fields.informantBirthDateInput,
        informantBirthPlace: fields.informantBirthPlaceInput,
        informantInformation: fields.informantInformationInput,
        titleDraft: fields.titleInput,
      };
      return next;
    });
  }, [
    currentPageIndex,
    fields.foneticSignsInput,
    fields.informantBirthDateInput,
    fields.informantBirthPlaceInput,
    fields.informantInformationInput,
    fields.informantNameInput,
    fields.messageCommentInput,
    fields.messageInput,
    fields.pagenumberInput,
    fields.titleInput,
    fields.unreadableInput,
  ]);

  const navigatePages = useCallback((index) => {
    saveCurrentPageDraft();
    setCurrentPageIndex(index);
  }, [saveCurrentPageDraft]);

  const handleHideOverlay = useCallback(() => {
    if (pages.some((page) => page.unsavedChanges)) {
      setShowDiscardDialog(true);
      return;
    }
    transcribeCancel();
  }, [pages, transcribeCancel]);

  const confirmHideOverlay = useCallback(() => {
    setShowDiscardDialog(false);
    transcribeCancel();
  }, [transcribeCancel]);

  const cancelHideOverlay = useCallback(() => {
    setShowDiscardDialog(false);
  }, []);

  useEffect(() => {
    const showHandler = (e) => {
      const t = e.detail || e.target || {};
      setRecordDetails({
        url: t.url,
        id: t.id,
        archiveId: t.archiveId,
        title: t.title,
        type: t.type,
        transcriptionType: t.transcriptionType,
        placeString: t.placeString,
      });

      setShowDiscardDialog(false);
      setFields({
        ...INITIAL_FIELDS,
        ...getPersistedContributorFields(),
      });

      const initialPages = (t.images || [])
        .filter(
          (page) => page?.type !== 'pdf'
            && !page?.source?.toLowerCase().endsWith('.pdf'),
        )
        .map((page) => {
          const alreadyTranscribed = page.transcriptionstatus
            && page.transcriptionstatus !== 'readytotranscribe';
          const hasBackendPageNum = page.pagenumber !== undefined
            && page.pagenumber !== null
            && String(page.pagenumber).trim() !== '';
          const calculatedPageNum = hasBackendPageNum
            ? String(page.pagenumber)
            : getPageNumberFromSource(page.source);

          return {
            ...page,
            isSent: alreadyTranscribed,
            unsavedChanges: false,
            text: page.text || '',
            comment: page.comment || '',
            pagenumber: calculatedPageNum,
            fonetic_signs: page.fonetic_signs || false,
            unreadable: page.unreadable || false,
            informantName: page.informantName || '',
            informantBirthDate: page.informantBirthDate || '',
            informantBirthPlace: page.informantBirthPlace || '',
            informantInformation: page.informantInformation || '',
            titleDraft: page.title || '',
          };
        });

      const resolveStartIndex = () => {
        if (!initialPages.length) return 0;

        if (
          typeof t.initialPageIndex === 'number'
          && t.initialPageIndex >= 0
          && t.initialPageIndex < initialPages.length
        ) {
          return t.initialPageIndex;
        }

        if (t.initialPageSource) {
          const sourceIndex = initialPages.findIndex(
            (page) => page.source === t.initialPageSource,
          );
          if (sourceIndex !== -1) return sourceIndex;
        }

        const readyIndex = initialPages.findIndex(
          (page) => page.transcriptionstatus === 'readytotranscribe',
        );
        return readyIndex !== -1 ? readyIndex : 0;
      };

      const startIdx = resolveStartIndex();
      setShowMetaFields(true);
      setPages(initialPages);
      setCurrentPageIndex(startIdx);
      requestAnimationFrame(() => scrollToActiveThumbnail(startIdx));
      start(t.id);
      setVisible(true);
    };

    const hideHandler = () => handleHideOverlay();

    window.eventBus.addEventListener(
      'overlay.transcribePageByPage',
      showHandler,
    );
    window.eventBus.addEventListener('overlay.close', hideHandler);

    return () => {
      window.eventBus.removeEventListener(
        'overlay.transcribePageByPage',
        showHandler,
      );
      window.eventBus.removeEventListener('overlay.close', hideHandler);
    };
  }, [handleHideOverlay, scrollToActiveThumbnail, setFields, start]);

  useEffect(() => {
    if (!pages.length) return;

    const page = pages[currentPageIndex];
    const shouldPrefill = (
      page.transcriptionstatus
      && page.transcriptionstatus !== 'readytotranscribe'
    ) || page.unsavedChanges;

    setFields((prev) => ({
      ...prev,
      messageInput: shouldPrefill ? page.text || '' : '',
      messageCommentInput: shouldPrefill ? page.comment || '' : '',
      pagenumberInput: page.pagenumber || '',
      foneticSignsInput: page.fonetic_signs || false,
      unreadableInput: page.unreadable || false,
      informantNameInput: page.informantName || '',
      informantBirthDateInput: page.informantBirthDate || '',
      informantBirthPlaceInput: page.informantBirthPlace || '',
      informantInformationInput: page.informantInformation || '',
      titleInput: page.titleDraft || '',
    }));

    if (prevPageIndexRef.current !== currentPageIndex) {
      requestAnimationFrame(() => scrollToActiveThumbnail(currentPageIndex));
      prevPageIndexRef.current = currentPageIndex;
    }
  }, [currentPageIndex, pages, scrollToActiveThumbnail, setFields]);

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) navigatePages(currentPageIndex - 1);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1) {
      navigatePages(currentPageIndex + 1);
    }
  };

  const goToNextTranscribePage = () => {
    const nextIdx = pages.findIndex(
      (page, index) => (
        index > currentPageIndex
        && page.transcriptionstatus === 'readytotranscribe'
      ),
    );
    if (nextIdx !== -1) navigatePages(nextIdx);
  };

  const buildPayload = () => ({
    recordid: recordDetails.id,
    transcribesession: session,
    url: recordDetails.url,
    recordtitle: fields.titleInput,
    message: fields.messageInput,
    page: pages[currentPageIndex].source,
    messageComment: fields.messageCommentInput,
    pagenumber: fields.pagenumberInput,
    fonetic_signs: fields.foneticSignsInput,
    unreadable: fields.unreadableInput,
    informantName: fields.informantNameInput,
    informantBirthDate: fields.informantBirthDateInput,
    informantBirthPlace: fields.informantBirthPlaceInput,
    informantInformation: fields.informantInformationInput,
    from_name: fields.nameInput,
    from_email: fields.emailInput,
  });

  const sendButtonClickHandler = async (e) => {
    const words = (fields.messageInput || '').trim().split(/\s+/).filter(Boolean);

    if (words.length < 2) {
      toastError(
        l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'),
      );
      return;
    }

    saveCurrentPageDraft();
    if (!pages.length) return;

    const goToNext = e.currentTarget.dataset.gotonext === 'true';
    const payload = buildPayload();

    if (!fields.informantNameInput?.trim()) {
      delete payload.informantName;
      delete payload.informantBirthDate;
      delete payload.informantBirthPlace;
      delete payload.informantInformation;
    }

    const ok = await send(payload);
    if (!ok) return;

    toastOk(l(`Sida ${currentPageIndex + 1} sparad – tack!`), {
      duration: 8000,
    });

    setPages((prev) => {
      const next = [...prev];
      next[currentPageIndex] = {
        ...next[currentPageIndex],
        isSent: true,
        unsavedChanges: false,
        transcriptionstatus: 'transcribed',
        text: fields.messageInput ?? '',
        comment: fields.messageCommentInput ?? '',
        pagenumber: fields.pagenumberInput,
        fonetic_signs: fields.foneticSignsInput,
        unreadable: fields.unreadableInput,
        informantName: fields.informantNameInput,
        informantBirthDate: fields.informantBirthDateInput,
        informantBirthPlace: fields.informantBirthPlaceInput,
        informantInformation: fields.informantInformationInput,
        titleDraft: fields.titleInput,
      };
      return next;
    });

    if (goToNext) goToNextTranscribePage();
    window.eventBus?.dispatch?.('overlay.transcribe.sent');
  };

  if (!visible || !recordDetails) return null;

  const currentPage = pages[currentPageIndex];
  const isPdf = currentPage?.source?.toLowerCase().endsWith('.pdf');
  const imageDescription = currentPage
    ? currentPage.text?.trim()
      || currentPage.comment?.trim()
      || `${recordDetails.title || 'Uppteckning'}, ${l('sida')} ${
        currentPageIndex + 1
      }`
    : '';

  return (
    <div className="overlay-container [backdrop-filter:blur(6px)] [-webkit-backdrop-filter:blur(6px)] visible transcription-page-by-page-overlay">
      {showDiscardDialog && (
        <div className="fixed inset-0 z-[3200] flex items-center justify-center bg-black/50 p-4">
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transcription-discard-title"
          >
            <h2 id="transcription-discard-title" className="text-lg font-semibold">
              {l('Stäng utan att spara?')}
            </h2>
            <p className="mt-3 text-sm text-gray-700">
              {l('Det finns osparade ändringar. Är du säker på att du vill stänga?')}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelHideOverlay}
                className="rounded-lg border border-gray-300 px-4 py-2"
              >
                {l('Avbryt')}
              </button>
              <button
                type="button"
                onClick={confirmHideOverlay}
                className="rounded-lg bg-isof px-4 py-2 font-semibold text-white"
              >
                {l('Stäng')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="overlay-window large">
        <div className="overlay-header">
          <OverlayHeader
            recordDetails={recordDetails}
            handleHideOverlay={handleHideOverlay}
            transcribeCancel={transcribeCancel}
            progressCurrent={currentPageIndex + 1}
            progressTotal={pages.length}
          />
          <IconButton
            icon={faXmark}
            label={l('Stäng')}
            tone="light"
            onClick={handleHideOverlay}
            size="sm"
            className="absolute right-8 top-0 !mt-0"
          />
          <div className="relative h-2">
            <TranscribeButton
              className="button button-primary absolute right-0 top-2"
              random
              label="Skriv av annan slumpmässig uppteckning"
              transcribeCancel={transcribeCancel}
            />
          </div>
        </div>

        <div className="row">
          <div className="four columns">
            <TranscriptionForm
              sending={sending}
              currentPageIndex={currentPageIndex}
              pages={pages}
              titleInput={fields.titleInput}
              transcriptionText={fields.messageInput}
              pagenumberInput={fields.pagenumberInput}
              foneticSignsInput={fields.foneticSignsInput}
              unreadableInput={fields.unreadableInput}
              informantNameInput={fields.informantNameInput}
              informantBirthDateInput={fields.informantBirthDateInput}
              informantBirthPlaceInput={fields.informantBirthPlaceInput}
              informantInformationInput={fields.informantInformationInput}
              nameInput={fields.nameInput}
              emailInput={fields.emailInput}
              comment={fields.messageCommentInput}
              inputChangeHandler={handleFormChange}
              sendButtonClickHandler={sendButtonClickHandler}
              showMetaFields={showMetaFields}
              onToggleMetaFields={() => setShowMetaFields((value) => !value)}
            />
          </div>

          <div className="eight columns transcription-image-column">
            {currentPage && !isPdf && (
              <ImageMap
                image={`${config.imageUrl}${currentPage.source}`}
                description={imageDescription}
              />
            )}
            {currentPage && isPdf && (
              <p>
                Den här sidan är en PDF.
                {' '}
                <a
                  href={`${config.imageUrl}${currentPage.source}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Öppna i ny flik
                </a>
              </p>
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
