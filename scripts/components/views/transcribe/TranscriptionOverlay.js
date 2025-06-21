import React, { useState, useEffect, useCallback } from "react";
import config from "../../../config";
import { l } from "../../../lang/Lang";
import ImageMap from "../ImageMap";
import TranscribeButton from "./TranscribeButton";
import FeedbackButton from "../FeedbackButton";
import ContributeInfoButton from "../ContributeInfoButton";
import TranscriptionHelpButton from "./TranscriptionHelpButton";
import Fritext from "./transcriptionForms/Fritext";
import Uppteckningsblankett from "./transcriptionForms/Uppteckningsblankett";
import useTranscriptionApi from "./hooks/useTranscriptionApi";
import useTranscriptionForm from "./hooks/useTranscriptionForm";
import ContributorInfoFields from "./transcriptionForms/ContributorInfoFields";

export default function TranscriptionOverlay(props) {
  const [visible, setVisible] = useState(false);
  const [record, setRecord] = useState(null);
  const [emailValid, setEmailValid] = useState(true);
  const [randomRecord, setRandomRecord] = useState(false);

  const { session, sending, start, cancel, send } = useTranscriptionApi();
  const { fields, handleInputChange, reset } = useTranscriptionForm();
  const [sent, setSent] = useState(false);

  /* ───── helpers ─────────────────────────────────────────── */
  const close = () => {
    cancel(record?.id);
    setVisible(false);
    reset();
    setSent(false);
  };

  const handleOverlayShow = useCallback(
    (evt) => {
      const r = evt.detail || evt.target || {};
      if (!r.id) {
        console.error("overlay.transcribe event is missing an id");
        return;
      }
      setRecord(r);
      setRandomRecord(!!r.random);
      start(r.id);
      setVisible(true);
    },
    [start]
  );

  useEffect(() => {
    window.eventBus?.addEventListener("overlay.transcribe", handleOverlayShow);
    window.eventBus?.addEventListener("overlay.hide", close);
    return () => {
      window.eventBus?.removeEventListener(
        "overlay.transcribe",
        handleOverlayShow
      );
      window.eventBus?.removeEventListener("overlay.hide", close);
    };
  }, [handleOverlayShow]);

  const buildPayload = () => ({
    recordid: record.id,
    url: record.url,
    recordtitle: fields.titleInput || record.title,
    message: fields.messageInput,
    messageComment: fields.messageCommentInput,
    informantName: fields.informantNameInput,
    informantBirthDate: fields.informantBirthDateInput,
    informantBirthPlace: fields.informantBirthPlaceInput,
    informantInformation: fields.informantInformationInput,
    from_name: fields.nameInput,
    from_email: fields.emailInput,
  });

  const sendHandler = async () => {
    if (fields.messageInput.trim().split(/\s+/).length < 2) {
      alert(
        l(
          'Avskriften kan inte sparas. Fältet "Text" ska innehålla en avskrift!'
        )
      );
      return;
    }
    const ok = await send(buildPayload());
    if (ok) {
      window.eventBus?.dispatch("overlay.transcribe.sent");
      setSent(true);
    }
  };

  if (!visible || !record) return null;

  /* ------- success view ------------------------- */
  if (sent) {
    return (
      <div className="overlay-container visible">
        <div className="overlay-window small flex flex-col items-center gap-6 p-8">
          <p className="text-lg text-center">
            {l(
              "Tack för din avskrift. Efter granskning kommer den att publiceras."
            )}
          </p>
          <div className="flex gap-4">
            {/* Goes straight to another random record */}
            <TranscribeButton
              className="button button-primary"
              random
              label={l("Skriv av en slumpmässigt utvald uppteckning")}
              transcribeCancel={close}
            />
            <button className="button-primary" onClick={close}>
              {l("Stäng")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overlay-container visible">
      <div className="overlay-window large">
        {/* ── header ───────────────────────────────────────── */}
        <div className="overlay-header">
          {l("Skriv av")} {record.title ? <>“{record.title}”</> : "uppteckning"}
          <button
            className="close-button white"
            title="stäng"
            onClick={close}
          />
          {!config.siteOptions.hideContactButton && (
            <>
              <FeedbackButton
                title={record.title}
                type="Uppteckning"
                {...props}
              />
              <ContributeInfoButton
                title={record.title}
                type="Uppteckning"
                {...props}
              />
              <TranscriptionHelpButton
                title={record.title}
                type="Uppteckning"
                {...props}
              />
            </>
          )}
        </div>

        {/* ── content ─────────────────────────────────────── */}
        <div className="row">
          <div className="four columns space-y-4">
            {record.transcriptionType === "fritext" ? (
              <Fritext {...fields} inputChangeHandler={handleInputChange} />
            ) : (
              <Uppteckningsblankett
                {...fields}
                titleInput={fields.titleInput}
                inputChangeHandler={handleInputChange}
              />
            )}
            <ContributorInfoFields
              {...fields}
              inputChangeHandler={handleInputChange}
              emailValid={emailValid}
              setEmailValid={setEmailValid}
            />
            <button
              type="button"
              className="button-primary"
              onClick={sendHandler}
              disabled={sending}
            >
              {sending ? l("Skickar…") : l("Skicka")}
            </button>
          </div>

          <div className="eight columns">
            {record.images?.[0] && (
              <ImageMap
                image={`${config.imageUrl}${record.images[0].source}`}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
