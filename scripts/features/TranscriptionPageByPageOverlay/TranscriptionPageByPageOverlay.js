import {
  useState, useEffect, useRef, useCallback,
} from 'react';
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
import TranscriptionInstructions from './ui/TranscriptionInstructions';
import DiscardChangesDialog from './ui/DiscardChangesDialog';
import TranscriptionError from './ui/TranscriptionError';
import TranscriptionDraftNotice from './ui/TranscriptionDraftNotice';
import useTranscriptionDrafts, { sameDraft } from './hooks/useTranscriptionDrafts';
import useTranscriptionApi from './hooks/useTranscriptionApi';
import useTranscriptionForm, {
  getPersistedContributorFields,
  INITIAL_FIELDS,
} from './hooks/useTranscriptionForm';
import { toastError, toastOk } from '../../utils/toast';
import ContributeInfoSection from '../../components/views/ContributeInfoSection';

const TRANSCRIPTION_INSTRUCTIONS_ID = 'transcription-instructions';

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
  const [showInstructions, setShowInstructions] = useState(false);
  const [sessionStarting, setSessionStarting] = useState(false);
  const [sessionStartError, setSessionStartError] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  const thumbnailContainerRef = useRef(null);
  const prevPageIndexRef = useRef(0);
  const cancelRef = useRef(null);
  const sessionCancelledRef = useRef(false);
  const initialMediaRef = useRef({ recordId: null, value: null });
  const instructionsHeadingRef = useRef(null);
  const instructionsTriggerRef = useRef(null);
  const initializedRecordRef = useRef(null);
  const retryRef = useRef(null);
  const liveRef = useRef(null);
  liveRef.current = {
    recordId: data?.id, pages, currentPageIndex, session: null,
  };

  if (data?.id && initialMediaRef.current.recordId !== data.id) {
    initialMediaRef.current = {
      recordId: data.id,
      value: new URLSearchParams(location.search).get('media'),
    };
  }

  const {
    session, sending, error, start, cancel, send, waitForCancellation,
  } = useTranscriptionApi();
  liveRef.current.session = session;
  const drafts = useTranscriptionDrafts(recordDetails?.id, pages, setPages);
  const flushDrafts = drafts.flush;
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
    flushDrafts();
    setCurrentPageIndex(index);
  }, [saveCurrentPageDraft, flushDrafts]);

  useEffect(() => {
    if (!data?.id || initializedRecordRef.current === data.id) return;
    flushDrafts();
    initializedRecordRef.current = data.id;

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
    setSaveNotice('');
    setFields({
      ...INITIAL_FIELDS,
      ...getPersistedContributorFields(),
    });
    setShowMetaFields(true);
    setPages(initialPages);
    setCurrentPageIndex(startIndex);
    requestAnimationFrame(() => scrollToActiveThumbnail(startIndex));
    document.title = `${l('Skriv av')} ${getTitleText(data)} – ${config.siteTitle}`;
  }, [data, flushDrafts, scrollToActiveThumbnail, setFields]);

  useEffect(() => {
    if (!data?.id) return undefined;
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
  }, [data?.id, start]);

  useEffect(() => {
    cancelRef.current = cancel;
  }, [cancel]);

  useEffect(() => {
    if (!data?.id) return undefined;

    const handlePageHide = (event) => {
      if (event.persisted) return;
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
    if (!recordDetails?.id || retryRef.current) return;
    const recordId = recordDetails.id;
    const attempt = {};
    retryRef.current = attempt;
    sessionCancelledRef.current = false;
    setSessionStarting(true);
    setSessionStartError(false);
    await waitForCancellation();
    const started = liveRef.current.recordId === recordId && await start(recordId);
    if (liveRef.current.recordId === recordId) {
      setSessionStartError(!started);
      setSessionStarting(false);
    }
    if (retryRef.current === attempt) retryRef.current = null;
  }, [recordDetails, start, waitForCancellation]);

  useEffect(() => {
    const show = async (event) => {
      if (!event.persisted) return;
      const recordId = data?.id;
      await waitForCancellation();
      if (recordId === liveRef.current.recordId && !liveRef.current.session) retrySession();
    };
    window.addEventListener('pageshow', show);
    return () => window.removeEventListener('pageshow', show);
  }, [data?.id, retrySession, waitForCancellation]);

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
    setSaveNotice('');
    const words = (fields.messageInput || '').trim().split(/\s+/).filter(Boolean);

    if (words.length < 2) {
      toastError(
        l('Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'),
      );
      return;
    }

    saveCurrentPageDraft();
    flushDrafts();
    if (!pages.length) return;

    const goToNext = e.currentTarget.dataset.gotonext === 'true';
    const payload = buildPayload();
    const sentRecordId = recordDetails.id;
    const sentIndex = currentPageIndex;
    const snapshot = { ...pages[sentIndex] };

    if (!fields.informantNameInput?.trim()) {
      delete payload.informantName;
      delete payload.informantBirthDate;
      delete payload.informantBirthPlace;
      delete payload.informantInformation;
    }

    const ok = await send(payload);
    if (!ok || liveRef.current.recordId !== sentRecordId) return;
    const unchanged = sameDraft(liveRef.current.pages[sentIndex], snapshot);
    drafts.saved(snapshot.source, snapshot);
    if (!unchanged) {
      setSaveNotice(l('Den inskickade avskriften har sparats. Dina senare ändringar finns kvar som utkast och har inte skickats in.'));
    }

    toastOk(l(`Sida ${currentPageIndex + 1} sparad – tack!`), {
      duration: 8000,
    });

    setPages((prev) => {
      const next = [...prev];
      if (!sameDraft(next[sentIndex], snapshot)) return prev;
      next[sentIndex] = {
        ...next[sentIndex],
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

    if (goToNext && unchanged && liveRef.current.currentPageIndex === sentIndex) {
      goToNextTranscribePage();
    }
    window.eventBus?.dispatch?.('overlay.transcribe.sent');
  };

  const toggleInstructions = (event) => {
    instructionsTriggerRef.current = event.currentTarget;
    setShowInstructions((visible) => !visible);
  };

  const openInstructions = (event) => {
    instructionsTriggerRef.current = event.currentTarget;
    setShowInstructions(true);
    window.requestAnimationFrame(() => instructionsHeadingRef.current?.focus());
  };

  const closeInstructions = () => {
    setShowInstructions(false);
    window.requestAnimationFrame(() => instructionsTriggerRef.current?.focus());
  };

  if (!recordDetails) return null;

  const currentPage = pages[currentPageIndex];
  const isPdf = currentPage?.source?.toLowerCase().endsWith('.pdf');
  const imageDescription = currentPage
    ? currentPage.text?.trim()
      || currentPage.comment?.trim()
      || `${recordDetails.title || 'Accession'}, ${l('sida')} ${
        currentPageIndex + 1
      }`
    : '';

  return (
    <div
      className="transcription-page-by-page"
      aria-busy={sessionStarting || undefined}
    >
      <DiscardChangesDialog
        open={showDiscardDialog}
        onCancel={cancelNavigation}
        onConfirm={confirmNavigation}
      />

      <OverlayHeader
        recordDetails={recordDetails}
        progressCurrent={currentPageIndex + 1}
        progressTotal={pages.length}
      />
      <div className="mb-6 flex flex-nowrap items-start gap-3 print:hidden [&>div]:!w-auto">
        {!config.siteOptions.hideContactButton && (
          <TranscriptionHelpButton
            className="button button-primary mb-4 flex h-10 items-center justify-center border border-solid border-white px-3 !text-base !leading-none tracking-normal !text-white no-underline transition-opacity duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            expanded={showInstructions}
            controls={TRANSCRIPTION_INSTRUCTIONS_ID}
            onClick={toggleInstructions}
          />
        )}
        <TranscribeButton
          className="button button-primary"
          random
          label="Skriv av annan slumpmässig accession"
          transcriptionstatus="readytotranscribe"
        />
      </div>

      {showInstructions && (
        <section
          id={TRANSCRIPTION_INSTRUCTIONS_ID}
          aria-labelledby={`${TRANSCRIPTION_INSTRUCTIONS_ID}-heading`}
          className="mb-6 rounded-lg border border-border bg-surface p-4 text-body shadow-sm"
        >
          <h2
            id={`${TRANSCRIPTION_INSTRUCTIONS_ID}-heading`}
            ref={instructionsHeadingRef}
            tabIndex={-1}
            className="mt-0 focus:outline-none"
          >
            {l('Instruktioner')}
          </h2>
          <TranscriptionInstructions />
          <button
            type="button"
            className="button button-secondary mt-4"
            onClick={closeInstructions}
          >
            {l('Dölj instruktioner')}
          </button>
        </section>
      )}

      <p id="transcription-session-status" role="status" aria-atomic="true" className="mb-4 text-muted">
        {sessionStarting ? l('Startar transkriberingssession…') : !session && l('Sessionen saknas. Du kan fortsätta skriva, men behöver återansluta innan du skickar avskriften.')}
      </p>
      <TranscriptionError
        error={error?.operation === 'start' ? error : null}
        messageId="transcription-start-error"
      />
      {sessionStartError && (
        <div className="mb-6">
          <button
            type="button"
            className="button button-primary mt-3"
            onClick={retrySession}
            disabled={sessionStarting}
            aria-describedby={error?.operation === 'start' ? 'transcription-start-error' : undefined}
          >
            {l('Försök återansluta')}
          </button>
        </div>
      )}
      <TranscriptionDraftNotice
        candidates={drafts.candidates}
        storageError={drafts.storageError}
        restored={drafts.restored}
        onRestore={(key) => {
          drafts.restore(key);
          document.getElementById('transcription_text_always')?.focus();
        }}
        onDismiss={() => {
          drafts.dismiss();
          document.getElementById('transcription_text_always')?.focus();
        }}
      />
      <p role="status" aria-atomic="true" className="text-body">{saveNotice}</p>
      {!pages.length && (
        <p role="status" className="rounded-lg border border-border bg-surface-muted p-4">
          {l('Det finns inga bildsidor att skriva av i den här accessionen.')}
        </p>
      )}

      {!!pages.length && (
        <div className="row">
          <div className="four columns">
            <TranscriptionForm
              sending={sending}
              sessionUnavailable={!session || sessionStarting || sessionStartError}
              error={error?.operation === 'save' ? error : null}
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
              instructionsExpanded={showInstructions}
              instructionsId={TRANSCRIPTION_INSTRUCTIONS_ID}
              onInstructionsOpen={openInstructions}
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
        title={recordDetails.title || l('Accession')}
        type="Accession"
        id={recordDetails.id}
      />
    </div>
  );
}
