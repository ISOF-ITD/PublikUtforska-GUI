import {
  useState, useEffect, useRef, useCallback,
} from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  useBlocker, useLocation, useNavigate, useOutletContext,
} from 'react-router-dom';
import config from '../../config';
import { l } from '../../lang/Lang';
import { getPlaceString, getTitleText } from '../../utils/helpers';
import TranscriptionForm from './ui/TranscriptionForm';
import ImageMap from './ui/ImageMap';
import TranscriptionThumbnails from './ui/TranscriptionThumbnails';
import NavigationPanel from './ui/NavigationPanel';
import OverlayHeader from './ui/OverlayHeader';
import TranscribeButton from './ui/TranscribeButton';
import TranscriptionHelpButton from './ui/TranscriptionHelpButton';
import useTranscriptionApi from './hooks/useTranscriptionApi';
import useTranscriptionForm, {
  getPersistedContributorFields,
  INITIAL_FIELDS,
} from './hooks/useTranscriptionForm';
import { toastError, toastOk } from '../../utils/toast';
import ContributeInfoSection from '../../components/views/ContributeInfoSection';

/*
TranscriptionPageByPageOverlay feature is handling the transcribe page-by-page use case for users.
*/
export default function TranscriptionPage() {
  const { data } = useOutletContext() || {};
  const location = useLocation();
  const navigate = useNavigate();
  const [recordDetails, setRecordDetails] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showMetaFields, setShowMetaFields] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [sessionStartError, setSessionStartError] = useState(false);

  const thumbnailContainerRef = useRef(null);
  const prevPageIndexRef = useRef(0);
  const cancelRef = useRef(null);
  const sessionCancelledRef = useRef(false);
  const initialMediaRef = useRef({ recordId: null, value: null });
  const discardCancelButtonRef = useRef(null);

  if (data?.id && initialMediaRef.current.recordId !== data.id) {
    initialMediaRef.current = {
      recordId: data.id,
      value: new URLSearchParams(location.search).get('media'),
    };
  }

  const {
    session, sending, start, cancel, send,
  } = useTranscriptionApi();
  const {
    fields,
    handleInputChange,
    setFields,
  } = useTranscriptionForm();
  const hasUnsavedChanges = pages.some((page) => page.unsavedChanges);
  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (!hasUnsavedChanges) return false;
    if (currentLocation.pathname !== nextLocation.pathname) return true;

    const currentParams = new URLSearchParams(currentLocation.search);
    const nextParams = new URLSearchParams(nextLocation.search);
    currentParams.delete('media');
    nextParams.delete('media');
    return currentParams.toString() !== nextParams.toString();
  });

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
      'nameInput',
      'emailInput',
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

  const transcribeCancel = useCallback(async () => {
    sessionCancelledRef.current = true;
    if (recordDetails?.id) {
      try {
        await cancel(recordDetails.id);
      } catch {
        /* Ignore cancel errors so local cleanup can continue. */
      }
    }
  }, [cancel, recordDetails]);

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

  useEffect(() => {
    if (!data?.id) return undefined;

    const initialPages = (data.media || [])
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
    const { value: requestedMedia } = initialMediaRef.current;
    let startIndex = initialPages.findIndex((page) => [
      page.media_id,
      page.id,
      page.source,
    ].some((identifier) => String(identifier) === requestedMedia));

    if (startIndex === -1 && /^\d+$/.test(requestedMedia || '')) {
      const requestedIndex = Number(requestedMedia);
      startIndex = requestedIndex < initialPages.length ? requestedIndex : -1;
    }
    if (startIndex === -1) {
      startIndex = initialPages.findIndex(
        (page) => page.transcriptionstatus === 'readytotranscribe',
      );
    }
    if (startIndex === -1) startIndex = 0;

    setRecordDetails({
      url: `${config.siteUrl}/records/${data.id}`,
      id: data.id,
      archiveId: data.archive?.archive_id || data.archive_id,
      title: getTitleText(data),
      type: data.type || data.recordtype,
      transcriptionType: data.transcriptiontype,
      placeString: getPlaceString(data.places || []),
    });
    setShowDiscardDialog(false);
    setFields({
      ...INITIAL_FIELDS,
      ...getPersistedContributorFields(),
    });
    setShowMetaFields(true);
    setPages(initialPages);
    setCurrentPageIndex(startIndex);
    requestAnimationFrame(() => scrollToActiveThumbnail(startIndex));
    document.title = `${l('Skriv av')} ${getTitleText(data)} – ${config.siteTitle}`;

    let active = true;
    sessionCancelledRef.current = false;
    setSessionStarting(true);
    setSessionStartError(false);
    start(data.id).then((started) => {
      if (active) setSessionStartError(!started);
    }).finally(() => {
      if (active) setSessionStarting(false);
    });

    return () => {
      active = false;
      if (!sessionCancelledRef.current) cancelRef.current?.(data.id);
    };
  }, [data, scrollToActiveThumbnail, setFields, start]);

  useEffect(() => {
    cancelRef.current = cancel;
  }, [cancel]);

  useEffect(() => {
    if (!data?.id) return undefined;

    const handlePageHide = () => {
      if (sessionCancelledRef.current) return;
      sessionCancelledRef.current = true;
      cancelRef.current?.(data.id);
    };
    window.addEventListener('pagehide', handlePageHide);
    return () => window.removeEventListener('pagehide', handlePageHide);
  }, [data?.id]);

  useEffect(() => {
    if (blocker.state === 'blocked') setShowDiscardDialog(true);
  }, [blocker.state]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!hasUnsavedChanges) return;
      event.preventDefault();
      Reflect.set(event, 'returnValue', '');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const confirmNavigation = useCallback(async () => {
    setShowDiscardDialog(false);
    await transcribeCancel();
    blocker.proceed?.();
  }, [blocker, transcribeCancel]);

  const cancelNavigation = useCallback(() => {
    setShowDiscardDialog(false);
    blocker.reset?.();
  }, [blocker]);

  const retrySession = useCallback(async () => {
    if (!recordDetails?.id) return;
    sessionCancelledRef.current = false;
    setSessionStarting(true);
    setSessionStartError(false);
    const started = await start(recordDetails.id);
    setSessionStartError(!started);
    setSessionStarting(false);
  }, [recordDetails, start]);

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

  useEffect(() => {
    const page = pages[currentPageIndex];
    if (!page) return;

    const media = page.media_id ?? page.id ?? page.source ?? currentPageIndex;
    const params = new URLSearchParams(location.search);
    if (params.get('media') === String(media)) return;

    params.set('media', media);
    navigate({
      pathname: location.pathname,
      search: `?${params.toString()}`,
      hash: location.hash,
    }, { replace: true });
  }, [currentPageIndex, location.hash, location.pathname, location.search, navigate, pages]);

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

  if (!recordDetails) return null;

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
    <div
      className="transcription-page-by-page"
      aria-busy={sessionStarting || undefined}
    >
      <Dialog
        open={showDiscardDialog}
        onClose={cancelNavigation}
        initialFocus={discardCancelButtonRef}
        className="relative z-[3200]"
      >
        <div
          className="fixed inset-0 bg-[var(--color-overlay-strong)]"
          aria-hidden="true"
        />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel
            role="alertdialog"
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 text-body shadow-xl"
          >
            <DialogTitle className="text-lg font-semibold">
              {l('Lämna utan att spara?')}
            </DialogTitle>
            <p className="mt-3 text-sm text-muted">
              {l('Det finns osparade ändringar. Är du säker på att du vill lämna sidan?')}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                ref={discardCancelButtonRef}
                type="button"
                onClick={cancelNavigation}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {l('Avbryt')}
              </button>
              <button
                type="button"
                onClick={confirmNavigation}
                className="button button-primary rounded-lg px-4 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {l('Lämna sidan')}
              </button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <OverlayHeader
        recordDetails={recordDetails}
        progressCurrent={currentPageIndex + 1}
        progressTotal={pages.length}
      />
      <div className="mb-6 flex flex-nowrap items-start gap-3 print:hidden [&>div]:!w-auto">
        {!config.siteOptions.hideContactButton && (
          <TranscriptionHelpButton
            className="button button-primary mb-4 flex h-10 items-center justify-center border border-solid border-white px-3 !text-base !leading-none tracking-normal !text-white no-underline transition-opacity duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          />
        )}
        <TranscribeButton
          className="button button-primary"
          random
          label="Skriv av annan slumpmässig uppteckning"
          transcriptionstatus="readytotranscribe"
        />
      </div>

      {sessionStarting && (
        <p role="status" className="mb-4 text-muted">
          {l('Startar transkriberingssession…')}
        </p>
      )}
      {sessionStartError && (
        <div role="alert" className="mb-6 rounded-lg border border-border bg-surface-muted p-4">
          <p>{l('Det gick inte att starta transkriberingssessionen.')}</p>
          <button
            type="button"
            className="button button-primary mt-3"
            onClick={retrySession}
            disabled={sessionStarting}
          >
            {l('Försök igen')}
          </button>
        </div>
      )}
      {!pages.length && (
        <p role="status" className="rounded-lg border border-border bg-surface-muted p-4">
          {l('Det finns inga bildsidor att skriva av i den här uppteckningen.')}
        </p>
      )}

      {!!pages.length && (
        <div className="row">
          <div className="four columns">
            <TranscriptionForm
              sending={sending || sessionStarting || sessionStartError}
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
      )}
      <ContributeInfoSection
        title={recordDetails.title || l('Uppteckning')}
        type="Uppteckning"
        id={recordDetails.id}
      />
    </div>
  );
}
