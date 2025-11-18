import { useState, useEffect, useRef, useCallback } from "react";
import config from "../../config";
import { l } from "../../lang/Lang";
import TranscriptionForm from "./ui/TranscriptionForm";
import ImageMap from "./ui/ImageMap";
import TranscriptionThumbnails from "./ui/TranscriptionThumbnails";
import NavigationPanel from "./ui/NavigationPanel";
import OverlayHeader from "./ui/OverlayHeader";
import TranscribeButton from "./ui/TranscribeButton";
import useTranscriptionApi from "./hooks/useTranscriptionApi";
import useTranscriptionForm from "./hooks/useTranscriptionForm";
import { toastOk } from "../../utils/toast";

export default function TranscriptionPageByPageOverlay () {
  /* visibility & record data */
  const [visible, setVisible] = useState(false);
  const [recordDetails, setRecordDetails] = useState(null); // url, id, title...
  const [pages, setPages] = useState([]); // { source, text, ... }
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showMetaFields, setShowMetaFields] = useState(false);

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

  // --- Helper: Extract page number from filename ---
  const getPageNumberFromSource = (source) => {
    if (!source) return "";
    // Matches "_0001." patterns at end of file names before extension
    const match = source.match(/_(\d+)\.[^.]+$/); 
    if (match && match[1]) {
      return parseInt(match[1], 10).toString(); // Remove leading zeros
    }
    return "";
  };

  const handleFormChange = (e) => {
    const { name, type, checked, value } = e.target;
    const val = type === "checkbox" ? checked : value;

    // update central form state
    handleInputChange(e);
    // Define which fields are page-specific
    const pageLevelFields = [
      "messageInput", 
      "messageCommentInput", 
      "pagenumberInput", 
      "foneticSignsInput", 
      "unreadableInput"
    ];
    
    if (!pageLevelFields.includes(name)) return;

    // also update the current page, so the effect won’t overwrite with old text
    setPages((prev) => {
      const next = [...prev];
      const page = next[currentPageIndex];
      if (!page) return prev;

      // Map form names back to data keys
      let updateObj = {};
      if (name === "messageInput") updateObj.text = val;
      else if (name === "messageCommentInput") updateObj.comment = val;
      else if (name === "pagenumberInput") updateObj.pagenumber = val;
      else if (name === "foneticSignsInput") updateObj.fonetic_signs = val;
      else if (name === "unreadableInput") updateObj.unreadable = val;

      next[currentPageIndex] = {
        ...page,
        unsavedChanges: true,
        ...updateObj
      };
      return next;
    });
  };

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
    if (recordDetails?.id) {
      try {
        await cancel(recordDetails.id);
      } catch {}
    }
    resetEverything();
  };

  /* ------------------------------------------------------------ */
  /* Page navigation helpers                                      */
  /* ------------------------------------------------------------ */
  const saveCurrentPageDraft = useCallback(() => {
    setPages((prev) => {
      const next = [...prev];
      if (!next[currentPageIndex]) return prev;
      
      // Save all form fields back to the page object
      next[currentPageIndex] = {
        ...next[currentPageIndex],
        text: fields.messageInput,
        comment: fields.messageCommentInput,
        pagenumber: fields.pagenumberInput,
        fonetic_signs: fields.foneticSignsInput,
        unreadable: fields.unreadableInput,
        unsavedChanges: false,
      };
      return next;
    });
  }, [
    currentPageIndex, 
    fields.messageInput, 
    fields.messageCommentInput,
    fields.pagenumberInput,
    fields.foneticSignsInput,
    fields.unreadableInput
  ]);

  const navigatePages = useCallback(
    (index) => {
      saveCurrentPageDraft();
      setCurrentPageIndex(index);
    },
    [saveCurrentPageDraft]
  );

  useEffect(() => {
    setRecordDetails((prev) =>
      prev ? { ...prev, title: fields.titleInput || prev.title } : prev
    );
  }, [fields.titleInput]);

  /* ------------------------------------------------------------ */
  /* Scroll helper: ensure active thumbnail stays in view         */
  /* ------------------------------------------------------------ */
  const scrollToActiveThumbnail = (index) => {
    const cont = thumbnailContainerRef.current;
    if (!cont) return;
    const el = cont.querySelector(`#thumb-${index}`);
    if (!el) return;
    el.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  };

  const handleHideOverlay = useCallback(() => {
    if (pages.some((p) => p.unsavedChanges)) {
      const ok = window.confirm(
        "Det finns osparade ändringar. Är du säker på att du vill stänga?"
      );
      if (!ok) return;
    }
    transcribeCancel();
  }, [pages, transcribeCancel]);

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
      // prefill form fields from the record
      setFields((prev) => ({
        ...prev,
        titleInput: t.title || "",
      }));

      /* prep page array with per-page meta */
      const initialPages = (t.images || []).map((p) => {
        const alreadyTranscribed =
          p.transcriptionstatus &&
          p.transcriptionstatus !== "readytotranscribe";
        
        // Logic: Use existing pagenumber, or extract from source, or default to empty
        const calculatedPageNum = p.pagenumber !== null 
          ? p.pagenumber 
          : getPageNumberFromSource(p.source);

        return {
          ...p,
          isSent: alreadyTranscribed,
          unsavedChanges: false,
          text: p.text || "",
          comment: p.comment || "",
          // Map new fields
          pagenumber: calculatedPageNum, 
          fonetic_signs: p.fonetic_signs || false,
          unreadable: p.unreadable || false,
        };
      });

      setPages(initialPages);

      /* focus first “readytotranscribe” page (or fall back to first) */
      const startIdx = initialPages.findIndex(
        (p) => p.transcriptionstatus === "readytotranscribe"
      );
      setCurrentPageIndex(startIdx !== -1 ? startIdx : 0);
      requestAnimationFrame(() =>
        scrollToActiveThumbnail(startIdx !== -1 ? startIdx : 0)
      );

      setShowMetaFields(t.transcriptionType === "uppteckningsblankett");

      /* backend session */
      start(t.id);

      /* show the overlay */
      setVisible(true);
    };

    /* hide overlay on global request */
    const hideHandler = () => handleHideOverlay();

    window.eventBus.addEventListener("overlay.transcribePageByPage", showHandler);
    window.eventBus.addEventListener("overlay.close", hideHandler);
    return () => {
      window.eventBus.removeEventListener(
        "overlay.transcribePageByPage",
        showHandler
      );
      window.eventBus.removeEventListener("overlay.close", hideHandler);
    };
  }, [start, handleHideOverlay, scrollToActiveThumbnail]);

  // whenever index changes, (re)hydrate the form from pages[index]
  useEffect(() => {
    if (!pages.length) return;
    const page = pages[currentPageIndex];

    const shouldPrefill =
      (page.transcriptionstatus &&
        page.transcriptionstatus !== "readytotranscribe") ||
      page.unsavedChanges;

    setFields((prev) => ({
      ...prev,
      messageInput: shouldPrefill ? page.text || "" : "",
      messageCommentInput: shouldPrefill ? page.comment || "" : "",
      pagenumberInput: page.pagenumber || "",
      foneticSignsInput: page.fonetic_signs || false,
      unreadableInput: page.unreadable || false,
    }));
    requestAnimationFrame(() => scrollToActiveThumbnail(currentPageIndex));
  }, [currentPageIndex, pages, setFields]);

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
      pagenumber: fields.pagenumberInput,
      fonetic_signs: fields.foneticSignsInput,
      unreadable: fields.unreadableInput,
      informantName: fields.informantNameInput,
      informantBirthDate: fields.informantBirthDateInput,
      informantBirthPlace: fields.informantBirthPlaceInput,
      informantInformation: fields.informantInformationInput,
      from_name: fields.nameInput,
      from_email: fields.emailInput,
    };
  };

  const sendButtonClickHandler = async (e) => {
    const words = (fields.messageInput || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (words.length < 2) {
      alert(
        l(
          'Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'
        )
      );
      return;
    }
    saveCurrentPageDraft();
    if (!pages.length) return;

    const goToNext = e.currentTarget.dataset.gotonext === "true";
    const payload = buildPayload();

    // If the string is empty after .trim(), it results false
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
        transcriptionstatus: "transcribed",
        text: fields.messageInput ?? "",
        comment: fields.messageCommentInput ?? "",
        pagenumber: fields.pagenumberInput,
        fonetic_signs: fields.foneticSignsInput,
        unreadable: fields.unreadableInput,
      };
      return next;
    });

    if (goToNext) goToNextTranscribePage();
    window.eventBus?.dispatch?.("overlay.transcribe.sent");
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
        id={`thumb-${idx}`}
        data-index={idx}
        className="image-item"
        src={`${config.imageUrl}${p.source}`}
        alt={`Uppteckning ${recordDetails.id} – ${l("sida")} ${idx + 1}`}
        loading="lazy"
        onClick={() => navigatePages(idx)}
      />
    )
  );
  const currentPage = pages[currentPageIndex];
  const isPdf = currentPage?.source?.toLowerCase().endsWith(".pdf");

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
          <div className="relative h-2">
            <TranscribeButton
              className="button button-primary absolute right-0 top-2"
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
              onToggleMetaFields={() => setShowMetaFields((v) => !v)}
            />
          </div>

          {/* -------- Right column: image + nav ------ */}
          <div className="eight columns">
            {currentPage && !isPdf && (
              <ImageMap image={`${config.imageUrl}${currentPage.source}`} />
            )}
            {currentPage && isPdf && (
              <p>
                Den här sidan är en PDF.{" "}
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
            >
              {thumbnails}
            </TranscriptionThumbnails>
          </div>
        </div>
      </div>
    </div>
  );
}