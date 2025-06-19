import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import config from "../../../config";
import ImageMap from "../ImageMap";
import { l } from "../../../lang/Lang";

import ContributeInfoButton from "../ContributeInfoButton";
import FeedbackButton from "../FeedbackButton";
import TranscriptionHelpButton from "./TranscriptionHelpButton";

import Uppteckningsblankett from "./transcriptionForms/Uppteckningsblankett";
import Fritext from "./transcriptionForms/Fritext";

import { getPlaceString } from "../../../utils/helpers";
import TranscribeButton from "./TranscribeButton";

/* ──────────────────────────────────────────────────────────
   Local helpers
   ──────────────────────────────────────────────────────── */
// 1) Keeps fetches from updating state after unmount
const useAbortController = () => {
  const controllerRef = useRef(null);
  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);
  return controllerRef;
};

// 2) Resets all “form” fields and overlay state
const getDefaultState = () => ({
  /* visibility */
  visible: false,
  messageSent: false,
  messageOnFailure: "",

  /* overlay meta */
  randomRecord: false,
  url: "",
  id: null,
  archiveId: null,
  title: "",
  imageIndex: 0,
  placeString: "",
  transcribeSession: null,
  type: "",
  transcriptionType: "",
  images: [],

  /* form inputs */
  informantNameInput: "",
  informantBirthDateInput: "",
  informantBirthPlaceInput: "",
  informantInformationInput: "",
  messageInput: "",
  messageCommentInput: "",
  nameInput: "",
  emailInput: "",
  titleInput: "",
});

export default function TranscriptionOverlay(props) {
  /* ───── State ───────────────────────────────────────── */
  const [state, setState] = useState(() => getDefaultState());

  const abortController = useAbortController();

  /* ───── Derived convenience vars ────────────────────── */
  const {
    visible,
    messageSent,
    messageOnFailure,
    randomRecord,
    url,
    id,
    archiveId,
    title,
    imageIndex,
    placeString,
    transcribeSession,
    type,
    transcriptionType,
    images,

    /* form fields */
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    messageInput,
    messageCommentInput,
    nameInput,
    emailInput,
  } = state;

  /* ───── Helpers that change many state keys together ─── */
  const clearForm = useCallback((keepOverlayVisible = false) => {
    setState((prev) => ({
      ...getDefaultState(),
      visible: keepOverlayVisible,
    }));
  }, []);

  /* ───── Remote calls ─────────────────────────────────── */
  const transcribeStart = useCallback(
    async (recordId) => {
      if (!recordId) return;
      abortController.current = new AbortController();
      const body = new FormData();
      body.append("json", JSON.stringify({ recordid: recordId }));
      try {
        const res = await fetch(`${config.restApiUrl}transcribestart/`, {
          method: "POST",
          body,
          signal: abortController.current.signal,
        });
        const json = await res.json();
        if (json.success === "true") {
          setState((s) => ({
            ...s,
            messageSent: false,
            transcribeSession: json.data?.transcribesession || null,
          }));
        } else {
          setState((s) => ({
            ...s,
            messageSent: true,
            messageOnFailure: json.message || "Failure!",
          }));
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("transcribeStart error:", err);
          setState((s) => ({
            ...s,
            messageSent: true,
            messageOnFailure: "Failure!",
          }));
        }
      }
    },
    [abortController]
  );

  const transcribeCancel = useCallback(
    (keepOverlayVisible = false) => {
      if (!messageSent && id && transcribeSession) {
        const fd = new FormData();
        fd.append(
          "json",
          JSON.stringify({ recordid: id, transcribesession: transcribeSession })
        );
        fetch(`${config.restApiUrl}transcribecancel/`, {
          method: "POST",
          body: fd,
        }).catch((err) => console.error("transcribeCancel error:", err));
      }
      clearForm(keepOverlayVisible);
    },
    [messageSent, id, transcribeSession, clearForm]
  );

  /* ───── Event handlers ───────────────────────────────── */
  const closeButtonClickHandler = () => transcribeCancel(false);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setState((prev) => {
      const next = { ...prev, [name]: value };
      // typing in the title field should also update `title`
      if (name === "titleInput") next.title = value;
      return next;
    });
  }, []);

  const mediaImageClickHandler = (e) =>
    setState((prev) => ({
      ...prev,
      imageIndex: parseInt(e.currentTarget.dataset.index, 10),
    }));

  const sendButtonClickHandler = useCallback(async () => {
    /* minimum two words */
    if (messageInput.trim().split(/\s+/).length < 2) {
      alert(
        l(
          'Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'
        )
      );
      return;
    }

    const payload = {
      transcribesession: transcribeSession,
      url,
      recordid: id,
      recordtitle: title,
      from_email: emailInput,
      from_name: nameInput,
      subject: "Crowdsource: Transkribering",
      informantName: informantNameInput,
      informantBirthDate: informantBirthDateInput,
      informantBirthPlace: informantBirthPlaceInput,
      informantInformation: informantInformationInput,
      message: messageInput,
      messageComment: messageCommentInput,
    };
    const fd = new FormData();
    fd.append("json", JSON.stringify(payload));

    try {
      const res = await fetch(`${config.restApiUrl}transcribe/`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        window.eventBus?.dispatch("overlay.transcribe.sent");
        setState((s) => ({
          ...s,
          messageSent: true,
          messageOnFailure: json.message,
          /* clear form inputs only */
          informantNameInput: "",
          informantBirthDateInput: "",
          informantBirthPlaceInput: "",
          informantInformationInput: "",
          messageInput: "",
          messageCommentInput: "",
          nameInput: "",
          emailInput: "",
        }));
      } else {
        console.log("Server did not respond for: " + url);
      }
    } catch (err) {
      console.error("sendButtonClickHandler error:", err);
    }
  }, [
    messageInput,
    transcribeSession,
    url,
    id,
    title,
    emailInput,
    nameInput,
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    messageCommentInput,
  ]);

  /* ───── Render helpers ───────────────────────────────── */
  const renderTranscribeForm = useMemo(() => {
    const commonProps = { inputChangeHandler: handleInputChange };
    if (transcriptionType === "fritext") {
      return <Fritext messageInput={messageInput} {...commonProps} />;
    }
    /* default and 'uppteckningsblankett' */
    return (
      <Uppteckningsblankett
        informantNameInput={informantNameInput}
        informantBirthDateInput={informantBirthDateInput}
        informantBirthPlaceInput={informantBirthPlaceInput}
        informantInformationInput={informantInformationInput}
        title={title}
        messageInput={messageInput}
        {...commonProps}
      />
    );
  }, [
    transcriptionType,
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    messageInput,
    title,
    handleInputChange,
  ]);

  /* ───── EventBus wiring ──────────────────────────────── */
  useEffect(() => {
    const handleOverlayTranscribe = (evt) => {
      const {
        id: recId,
        url: recUrl,
        title: recTitle,
        archiveId: recArchiveId,
        images: recImages = [],
        transcriptionType: recTranscriptionType = "",
        placeString: recPlaceString = "",
        random = false,
        type: recType = "",
      } = evt.target;

      setState((s) => ({
        ...s,
        visible: true,
        id: recId ?? null,
        url: recUrl ?? "",
        title: recTitle ?? "",
        archiveId: recArchiveId ?? null,
        images: recImages,
        transcriptionType: recTranscriptionType,
        placeString: recPlaceString,
        randomRecord: !!random,
        type: recType,
        imageIndex: 0,
      }));

      transcribeStart(recId);
    };

    const handleOverlayHide = () => setState((s) => ({ ...s, visible: false }));

    window.eventBus?.addEventListener(
      "overlay.transcribe",
      handleOverlayTranscribe
    );
    window.eventBus?.addEventListener("overlay.hide", handleOverlayHide);

    return () => {
      window.eventBus?.removeEventListener(
        "overlay.transcribe",
        handleOverlayTranscribe
      );
      window.eventBus?.removeEventListener("overlay.hide", handleOverlayHide);
    };
  }, [transcribeStart]);

  /* ───── Early exit ───────────────────────────────────── */
  if (!visible) return null;

  /* ───── Render UI ────────────────────────────────────── */
  const imageItems =
    images?.map((mediaItem, idx) =>
      mediaItem?.source?.toLowerCase().endsWith(".pdf") ? null : (
        <img
          key={idx}
          data-index={idx}
          className="image-item"
          src={`${config.imageUrl}${mediaItem.source}`}
          alt=""
          onClick={mediaImageClickHandler}
        />
      )
    ) || [];

  const overlayContent = messageSent ? (
    <div>
      <p>
        {l(
          messageOnFailure ||
            "Tack för din avskrift som nu skickats till Institutet för språk och folkminnen. Efter granskning kommer den att publiceras."
        )}
      </p>
      <p>
        <br />
        <TranscribeButton
          className="button button-primary"
          random
          label={
            randomRecord
              ? l("Skriv av en till slumpmässig uppteckning")
              : l("Skriv av en slumpmässigt utvald uppteckning")
          }
        />
        &nbsp;
        <button className="button-primary" onClick={closeButtonClickHandler}>
          Stäng
        </button>
      </p>
    </div>
  ) : (
    <div className="row">
      {/* ── Left column ─────────────────────────── */}
      <div className="four columns">
        {renderTranscribeForm}

        <label
          htmlFor="transcription_comment"
          className="u-full-width margin-bottom-zero"
        >
          {l("Kommentar till avskriften:")}
        </label>
        <textarea
          lang="sv"
          spellCheck="false"
          id="transcription_comment"
          name="messageCommentInput"
          className="u-full-width margin-bottom-minimal"
          value={messageCommentInput}
          onChange={handleInputChange}
        />
        <p>
          {l(
            "Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte."
          )}
          <br />
          {l("Vi hanterar personuppgifter enligt dataskyddsförordningen. ")}
          <a
            href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
            target="_blank"
            rel="noreferrer"
          >
            <strong>{l("Läs mer.")}</strong>
          </a>
        </p>

        <label htmlFor="transcription_name">Ditt namn (frivilligt):</label>
        <input
          id="transcription_name"
          autoComplete="name"
          name="nameInput"
          className="u-full-width"
          type="text"
          value={nameInput}
          onChange={handleInputChange}
        />
        <label htmlFor="transcription_email">
          Din e-post adress (frivilligt):
        </label>
        <input
          id="transcription_email"
          autoComplete="email"
          name="emailInput"
          className="u-full-width"
          type="email"
          value={emailInput}
          onChange={handleInputChange}
        />

        <button className="button-primary" onClick={sendButtonClickHandler}>
          Skicka
        </button>
      </div>

      {/* ── Right column ────────────────────────── */}
      <div className="eight columns">
        <ImageMap
          image={
            images?.[imageIndex]
              ? `${config.imageUrl}${images[imageIndex].source}`
              : null
          }
        />
        <div className="image-list">{imageItems}</div>
      </div>
    </div>
  );

  return (
    <div className="overlay-container visible">
      <div className="overlay-window large">
        <div className="overlay-header">
          {l("Skriv av")} {title ? <>&quot;{title}&quot;</> : "uppteckning"}
          {archiveId && (
            <small>
              &nbsp;(ur {archiveId}
              {placeString ? ` ${placeString}` : ""})
            </small>
          )}
          {randomRecord && !messageSent && (
            <div className="next-random-record-button-container">
              <TranscribeButton
                label={l("Skriv av annan slumpmässig uppteckning")}
                random
                transcribeCancel={transcribeCancel}
                className="button button-primary next-random-record-button"
              />
            </div>
          )}
          <button
            title="stäng"
            className="close-button white"
            onClick={closeButtonClickHandler}
          />
          {!config.siteOptions.hideContactButton && (
            <>
              <FeedbackButton title={title} type="Uppteckning" {...props} />
              <ContributeInfoButton
                title={title}
                type="Uppteckning"
                {...props}
              />
              <TranscriptionHelpButton
                title={title}
                type="Uppteckning"
                {...props}
              />
            </>
          )}
        </div>
        {overlayContent}
      </div>
    </div>
  );
}
