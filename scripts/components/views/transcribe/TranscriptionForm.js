import { useState } from "react";
import Uppteckningsblankett from "./transcriptionForms/Uppteckningsblankett";
import Fritext from "./transcriptionForms/Fritext";
import { l } from "../../../lang/Lang";

export default function TranscriptionForm({
  sending,
  recordDetails,
  currentPageIndex,
  pages,
  transcriptionText,
  informantNameInput,
  informantBirthDateInput,
  informantBirthPlaceInput,
  informantInformationInput,
  nameInput,
  emailInput,
  comment,
  inputChangeHandler,
  sendButtonClickHandler,
}) {
  const [emailValid, setEmailValid] = useState(true);

  const validateEmail = (email) =>
    email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));

  const commonProps = {
    messageInput: transcriptionText,
    inputChangeHandler,
    pageIndex: currentPageIndex,
    numberOfPages: pages.length,
    transcriptionstatus: pages[currentPageIndex]?.transcriptionstatus,
  };

  const uppteckningsblankettProps = {
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    title: recordDetails.title,
    ...commonProps,
  };

  const renderTranscribeForm = () => {
    switch (pages[currentPageIndex]?.transcriptiontype) {
      case "fritext":
        return <Fritext {...commonProps} />;
      case "uppteckningsblankett":
      default:
        return <Uppteckningsblankett {...uppteckningsblankettProps} />;
    }
  };

  const disableInput =
    pages[currentPageIndex]?.transcriptionstatus !== "readytotranscribe" &&
    pages[currentPageIndex]?.transcriptionstatus !== null;

  const sendButtonLabel = pages[currentPageIndex]?.isSent
    ? "Sidan har skickats"
    : `Skicka sida ${currentPageIndex + 1} (av ${pages.length})`;

  return (
    <div className="text-sm">
      {renderTranscribeForm()}

      {(pages[currentPageIndex]?.transcriptionstatus === "readytotranscribe" ||
        pages[currentPageIndex]?.isSent) && (
        <>
          {/* Kommentar */}
          <label
            htmlFor="transcription_comment"
            className="block mb-0 font-semibold"
          >
            {l(
              `Kommentar till sidan ${currentPageIndex + 1} (av ${
                pages.length
              })`
            )}
          </label>
          <textarea
            id="transcription_comment"
            name="messageCommentInput"
            lang="sv"
            spellCheck="false"
            disabled={disableInput}
            value={comment}
            onChange={inputChangeHandler}
            className="w-full border border-gray-300 rounded mb-1 p-2 leading-relaxed h-40 font-serif"
          />

          {/* GDPR / info blurb */}
          <p className="mb-4">
            {l(
              "Vill du att vi anger att det är du som har skrivit av uppteckningen? Ange i så fall ditt namn och din e-postadress nedan. E-postadressen publiceras inte."
            )}
            <br />
            {l("Vi hanterar personuppgifter enligt dataskyddsförordningen. ")}
            <a
              href="https://www.isof.se/om-oss/behandling-av-personuppgifter.html"
              target="_blank"
              rel="noreferrer"
              className="underline text-isof font-semibold"
            >
              {l("Läs mer.")}
            </a>
          </p>

          {/* Namn & e-post */}
          <div className="grid gap-4 md:grid-cols-2 mb-4">
            <div>
              <label
                htmlFor="transcription_name"
                className="block font-semibold"
              >
                Ditt namn (frivilligt)
              </label>
              <input
                id="transcription_name"
                name="nameInput"
                autoComplete="name"
                type="text"
                disabled={disableInput}
                value={nameInput}
                onChange={inputChangeHandler}
                className="w-full border border-gray-300 rounded p-2"
              />
            </div>

            <div>
              <label
                htmlFor="transcription_email"
                className="block font-semibold"
              >
                Din e-postadress (frivilligt)
              </label>
              <input
                id="transcription_email"
                name="emailInput"
                autoComplete="email"
                type="email"
                disabled={disableInput}
                value={emailInput}
                onChange={inputChangeHandler}
                onBlur={handleEmailBlur}
                className={`w-full border rounded p-2 ${
                  emailValid ? "border-gray-300" : "border-red-500"
                }`}
              />
              {!emailValid && (
                <p className="text-xs text-red-600 mt-1">
                  Ogiltig e-postadress
                </p>
              )}
            </div>
          </div>

          {/* Skicka-knapp */}
          <button
            type="button"
            onClick={sendButtonClickHandler}
            disabled={disableInput || sending}
            data-gotonext="true"
            className={`px-6 py-2 rounded text-white font-semibold transition ${
              sending || disableInput
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-isof hover:bg-darker-isof"
            }`}
          >
            {sending ? "Skickar…" : sendButtonLabel}
          </button>

          {/* Tack-meddelande */}
          {pages[currentPageIndex]?.isSent && (
            <p className="mt-4 text-green-700">
              Tack för din avskrift. Efter granskning kommer den att publiceras.
            </p>
          )}
        </>
      )}
    </div>
  );
}
