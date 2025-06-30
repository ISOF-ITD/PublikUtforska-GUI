import { useState, useEffect, useRef } from "react";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import TranscriptionForm from "./TranscriptionForm";
import ImageMap from "../ImageMap";
import TranscriptionThumbnails from "./TranscriptionThumbnails";
import NavigationPanel from "./NavigationPanel";
import OverlayHeader from "./OverlayHeader";
import TranscribeButton from "./TranscribeButton";
import useTranscriptionApi from "./hooks/useTranscriptionApi";
import useTranscriptionForm from "./hooks/useTranscriptionForm";

export default function TranscriptionPageByPageOverlay() {
  /* visibility & record data */
  const [visible, setVisible] = useState(false);
  const [recordDetails, setRecordDetails] = useState(null); // url, id, title...
  const [pages, setPages] = useState([]); // { source, text, ... }
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  /* thumbnails need a ref to auto-scroll the active one into view */
  const thumbnailContainerRef = useRef(null);

  /* Centralised API + form handling */
  const { session, sending, start, cancel, send } = useTranscriptionApi();
  const {
    fields,
    handleInputChange,
    reset: resetForm,
    setFields,
  } = useTranscriptionForm();

  useEffect(() => {
    setRecordDetails((prev) =>
      prev ? { ...prev, title: fields.titleInput || prev.title } : prev
    );
  }, [fields.titleInput]);

  /* ------------------------------------------------------------ */
  /* Scroll helper: ensure active thumbnail stays in view         */
  /* ------------------------------------------------------------ */
  const scrollToActiveThumbnail = (index) => {
    const thumbs = thumbnailContainerRef.current;
    if (!thumbs) return;
    const thumbRect = thumbs.children[index].getBoundingClientRect();
    const contRect = thumbs.getBoundingClientRect();
    if (thumbRect.left < contRect.left || thumbRect.right > contRect.right) {
      thumbs.scrollLeft =
        thumbRect.left -
        contRect.left +
        thumbs.scrollLeft -
        thumbRect.width / 2;
    }
  };

  /* ------------------------------------------------------------ */
  /* Event-listeners: show / hide overlay                         */
  /* ------------------------------------------------------------ */
  useEffect(() => {
    /* show overlay + kick off transcribeStart */
    const showHandler = async (e) => {
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

      /* prep page array with per-page meta */
      const initialPages = (t.images || []).map((p) => ({
        ...p,
        isSent: false,
        unsavedChanges: false,
        text: p.text || "",
        comment: p.comment || "",
      }));
      setPages(initialPages);

      /* focus first “readytotranscribe” page (or fall back to first) */
      const startIdx = initialPages.findIndex(
        (p) => p.transcriptionstatus === "readytotranscribe"
      );
      setCurrentPageIndex(startIdx !== -1 ? startIdx : 0);
      requestAnimationFrame(() =>
        scrollToActiveThumbnail(startIdx !== -1 ? startIdx : 0)
      );

      /* backend session */
      start(t.id);

      /* show the overlay */
      setVisible(true);
    };

    /* hide overlay on global request */
    const hideHandler = () => handleHideOverlay();

    window.eventBus.addEventListener(
      "overlay.transcribePageByPage",
      showHandler
    );
    window.eventBus.addEventListener("overlay.hide", hideHandler);
    return () => {
      window.eventBus.removeEventListener(
        "overlay.transcribePageByPage",
        showHandler
      );
      window.eventBus.removeEventListener("overlay.hide", hideHandler);
    };
  }, [start]);

  /* ------------------------------------------------------------ */
  /* Close / cancel helpers                                       */
  /* ------------------------------------------------------------ */
  const resetEverything = () => {
    setVisible(false);
    setRecordDetails(null);
    setPages([]);
    setCurrentPageIndex(0);
    resetForm();
  };

  const transcribeCancel = async () => {
    await cancel(recordDetails?.id);
    resetEverything();
  };

  const handleHideOverlay = () => {
    if (pages.some((p) => p.unsavedChanges)) {
      const ok = window.confirm(
        "Det finns osparade ändringar. Är du säker på att du vill stänga?"
      );
      if (!ok) return;
    }
    transcribeCancel();
  };

  /* ------------------------------------------------------------ */
  /* Page navigation helpers                                      */
  /* ------------------------------------------------------------ */
  const saveCurrentPageDraft = () => {
    setPages((prev) => {
      const next = [...prev];
      next[currentPageIndex].text = fields.messageInput;
      next[currentPageIndex].comment = fields.messageCommentInput;
      return next;
    });
  };

  const navigatePages = (index) => {
    saveCurrentPageDraft();
    setCurrentPageIndex(index);

    /* fill form with existing page data (if any) */
    const page = pages[index];
    if (
      page.transcriptionstatus &&
      page.transcriptionstatus !== "readytotranscribe"
    ) {
      setFields((prev) => ({
        ...prev,
        messageInput: page.text || "",
        messageCommentInput: page.comment || "",
      }));
    } else if (page.unsavedChanges) {
      setFields((prev) => ({
        ...prev,
        messageInput: page.text || "",
        messageCommentInput: page.comment || "",
      }));
    } else {
      setFields((prev) => ({
        ...prev,
        messageInput: "",
        messageCommentInput: "",
      }));
    }

    scrollToActiveThumbnail(index);
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) navigatePages(currentPageIndex - 1);
  };

  const goToNextPage = () => {
    if (currentPageIndex < pages.length - 1)
      navigatePages(currentPageIndex + 1);
  };

  const goToNextTranscribePage = () => {
    const nextIdx = pages.findIndex(
      (p, i) =>
        i > currentPageIndex && p.transcriptionstatus === "readytotranscribe"
    );
    if (nextIdx !== -1) navigatePages(nextIdx);
  };

  /* ------------------------------------------------------------ */
  /* Send-button handler                                          */
  /* ------------------------------------------------------------ */

  const buildPayload = () => {
    return {
      recordid: recordDetails.id,
      transcribesession: session,
      url: recordDetails.url,
      recordtitle: fields.titleInput || recordDetails.title,
      message: fields.messageInput,
      page: pages[currentPageIndex].source,
      messageComment: fields.messageCommentInput,
      informantName: fields.informantNameInput,
      informantBirthDate: fields.informantBirthDateInput,
      informantBirthPlace: fields.informantBirthPlaceInput,
      informantInformation: fields.informantInformationInput,
      from_name: fields.nameInput,
      from_email: fields.emailInput,
    };
  };

  const sendButtonClickHandler = async (e) => {
    if (fields.messageInput.trim().indexOf(" ") === -1) {
      alert(
        l(
          'Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'
        )
      );
      return;
    }
    const goToNext = e.currentTarget.dataset.gotonext === "true";

    const payload = buildPayload();

    // If the string is empty after .trim(), it results false
    if (!fields.informantNameInput.trim()) {
      delete payload.informantName;
      delete payload.informantBirthDate;
      delete payload.informantBirthPlace;
      delete payload.informantInformation;
    }

    const ok = await send(payload);

    if (ok) {
      /* mark page as sent + clean unsaved flags */
      setPages((prev) => {
        const next = [...prev];
        next[currentPageIndex] = {
          ...next[currentPageIndex],
          isSent: true,
          unsavedChanges: false,
          transcriptionstatus: "transcribed",
        };
        return next;
      });

      /* optional auto-advance */
      if (goToNext) goToNextTranscribePage();
    }
  };

  /* ------------------------------------------------------------ */
  /* Render                                                       */
  /* ------------------------------------------------------------ */
  if (!visible || !recordDetails) return null;

  /* thumbnail list */
  const thumbnails = pages.map((p, idx) =>
    p?.source?.toLowerCase().endsWith(".pdf") ? null : (
      <img
        key={idx}
        data-index={idx}
        className="image-item"
        src={`${config.imageUrl}${p.source}`}
        alt=""
        onClick={() => navigatePages(idx)}
      />
    )
  );

  return (
    <div className="overlay-container visible transcription-page-by-page-overlay">
      <div className="overlay-window large">
        {/* ── header ────────────────────────────────────────── */}
        <div className="overlay-header">
          <OverlayHeader
            recordDetails={recordDetails}
            handleHideOverlay={handleHideOverlay}
            transcribeCancel={transcribeCancel}
            progressCurrent={currentPageIndex + 1}
            progressTotal={pages.length}
          />
          {/* Stäng-knapp */}
          <button
            type="button"
            title="stäng"
            className="close-button white"
            onClick={handleHideOverlay}
            aria-label="Stäng"
          />
          <div className="next-random-record-button-container">
            <TranscribeButton
              className="button button-primary next-random-record-button"
              random
              label="Skriv av annan slumpmässig uppteckning"
              transcribeCancel={transcribeCancel}
            />
          </div>
        </div>

        {/* ── content ───────────────────────────────────────── */}
        <div className="row">
          {/* -------- Left column: the form ---------- */}
          <div className="four columns">
            <TranscriptionForm
              sending={sending}
              recordDetails={{
                ...recordDetails,
                title: fields.titleInput || recordDetails.title,
              }}
              currentPageIndex={currentPageIndex}
              pages={pages}
              titleInput={fields.titleInput}
              transcriptionText={fields.messageInput}
              informantNameInput={fields.informantNameInput}
              informantBirthDateInput={fields.informantBirthDateInput}
              informantBirthPlaceInput={fields.informantBirthPlaceInput}
              informantInformationInput={fields.informantInformationInput}
              nameInput={fields.nameInput}
              emailInput={fields.emailInput}
              comment={fields.messageCommentInput}
              inputChangeHandler={handleInputChange}
              sendButtonClickHandler={sendButtonClickHandler}
            />
          </div>

          {/* -------- Right column: image + nav ------ */}
          <div className="eight columns">
            {pages.length > 0 && (
              <ImageMap
                image={`${config.imageUrl}${pages[currentPageIndex].source}`}
              />
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
            >
              {thumbnails}
            </TranscriptionThumbnails>
          </div>
        </div>
      </div>
    </div>
  );
}
