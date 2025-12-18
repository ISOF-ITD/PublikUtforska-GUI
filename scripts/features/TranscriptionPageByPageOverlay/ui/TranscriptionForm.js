import { useCallback, useMemo, useState, useId, useEffect } from "react";
import Uppteckningsblankett from "./Uppteckningsblankett";
import { l } from "../../../lang/Lang";
import ContributorInfoFields from "./ContributorInfoFields";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleChevronDown,
  faCircleChevronUp,
  faInfoCircle,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

const field =
  "w-full border border-gray-300 rounded-lg p-3 font-serif leading-relaxed " +
  "disabled:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-isof " +
  "focus:border-isof transition !mb-2";

export default function TranscriptionForm({
  sending,
  recordDetails,
  currentPageIndex,
  pages,
  transcriptionText,
  pagenumberInput = "",
  foneticSignsInput = false,
  unreadableInput = false,
  informantNameInput,
  informantBirthDateInput,
  informantBirthPlaceInput,
  informantInformationInput,
  nameInput,
  emailInput,
  titleInput,
  comment,
  inputChangeHandler,
  sendButtonClickHandler,
  showMetaFields,
  onToggleMetaFields,
}) {
  const [emailValid, setEmailValid] = useState(true);
  const emailId = useId();
  const commentId = useId();

  const validateEmail = useCallback(
    (email) => email === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );

  const page = pages[currentPageIndex] ?? {};
  const disableInput = page.transcriptionstatus !== "readytotranscribe";
  const isSent = !!page.isSent;
  const isReadyToTranscribe = page.transcriptionstatus === "readytotranscribe";

  const SNABBGUIDE_KEY = "transcription.snabbguide.dismissed.v1";
  const [showSnabbguide, setShowSnabbguide] = useState(false);

  useEffect(() => {
    if (!isReadyToTranscribe) return;
    try {
      const dismissed = localStorage.getItem(SNABBGUIDE_KEY) === "1";
      setShowSnabbguide(!dismissed);
    } catch {
      setShowSnabbguide(true); // if localStorage is blocked
    }
  }, [isReadyToTranscribe]);

  const dismissSnabbguide = () => {
    setShowSnabbguide(false);
    try {
      localStorage.setItem(SNABBGUIDE_KEY, "1");
    } catch {}
  };

  const sendButtonLabel = isSent
    ? l("Sidan har skickats")
    : l(`Skicka sida ${currentPageIndex + 1} (av ${pages.length})`);

  const commonProps = useMemo(
    () => ({
      messageInput: transcriptionText,
      inputChangeHandler,
      pageIndex: currentPageIndex,
      numberOfPages: pages.length,
      transcriptionstatus: page.transcriptionstatus,
      disableInput,
      titleInput,
    }),
    [
      transcriptionText,
      inputChangeHandler,
      currentPageIndex,
      pages.length,
      page.transcriptionstatus,
      disableInput,
      titleInput,
    ]
  );

  const uppteckningsProps = {
    informantNameInput,
    informantBirthDateInput,
    informantBirthPlaceInput,
    informantInformationInput,
    title: recordDetails.title,
    titleInput,
    ...commonProps,
  };

  const handleEmailBlur = (e) => setEmailValid(validateEmail(e.target.value));
  const wordCount = transcriptionText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const formValid = wordCount >= 2 && emailValid;

  return (
    <div className="space-y-3 min-w-0 max-w-full px-2 flex flex-col items-stretch">
      <div className="flex items-center justify-center w-full">
        <button
          type="button"
          onClick={onToggleMetaFields}
          className="text-sm w-full flex items-center gap-2 !m-0"
        >
          {showMetaFields ? (
            <span className="w-full flex items-center lg:justify-between">
              {l("Dölj uppgifter om uppteckningen")}{" "}
              <FontAwesomeIcon className="text-lg" icon={faCircleChevronUp} />
            </span>
          ) : (
            <span className="w-full flex items-center lg:justify-between">
              {l("Visa uppgifter om uppteckningen")}{" "}
              <FontAwesomeIcon className="text-lg" icon={faCircleChevronDown} />
            </span>
          )}
        </button>
      </div>

      {/* 1) META: toggleable */}
      {showMetaFields && (
        <Uppteckningsblankett
          {...uppteckningsProps}
          disableInput={false}
          showMeta={true}
          showText={false}
        />
      )}

      {/* 2) TEXT: always visible */}
      <fieldset
        className="space-y-2 bg-white shadow-sm rounded-lg p-3 border border-gray-200"
        disabled={disableInput}
      >
        {/* Only in state readytotranscribe */}
        {isReadyToTranscribe && showSnabbguide && (
          <div className="bg-isof/5 text-sm text-gray-800 rounded-md p-2 mb-2 relative">
            <a
              type="button"
              onClick={dismissSnabbguide}
              className="absolute right-2 top-2 !p-1 rounded hover:bg-black/5 hover:cursor-pointer"
              aria-label={l("Stäng snabbguide")}
            >
              <FontAwesomeIcon icon={faXmark} />
            </a>
            <strong className="flex items-center mb-1 gap-2">
              <FontAwesomeIcon icon={faInfoCircle} />
              {l("Snabbguide (se även gärna instruktionerna ovanför)")}
            </strong>
            <ul className="list-disc list-inside space-y-0.5 !my-0">
              <li>{l("Skriv av texten precis som den står, även stavfel.")}</li>
              <li>
                {l("Skriv av texten rad för rad, med samma radbrytningar.")}
              </li>
              <li>{l("Använd ### för ord du inte kan läsa.")}</li>
            </ul>
          </div>
        )}

        <label
          htmlFor="transcription_text_always"
          className="font-semibold block"
        >
          {l("Text på sidan")} {currentPageIndex + 1} {l("(av")} {pages.length})
        </label>
        <textarea
          id="transcription_text_always"
          name="messageInput"
          lang="sv"
          spellCheck="false"
          value={transcriptionText}
          onChange={inputChangeHandler}
          className="w-full min-h-[14rem] max-h-80 rounded border p-2 font-serif leading-relaxed resize-y disabled:bg-gray-100"
        />
        <span className="text-sm text-gray-600 self-end" aria-live="polite">
          {wordCount} {l("ord")}
        </span>
      </fieldset>

      {/* 2b) PAGE META: page number + flags */}
      {/* Only in state readytotranscribe */}
      {isReadyToTranscribe && (
        <fieldset
          className="space-y-3 bg-white shadow-sm rounded-lg p-3 border border-gray-200"
          disabled={disableInput}
        >
          <div className="flex flex-col">
            <label
              htmlFor="transcription_pagenumber"
              className="font-semibold mb-1"
            >
              Sidnummer
            </label>
            <input
              id="transcription_pagenumber"
              name="pagenumberInput"
              type="text"
              value={pagenumberInput ?? ""}
              onChange={inputChangeHandler}
              className="w-32 rounded border p-2 font-serif disabled:bg-gray-100"
            />
            <span className="text-xs text-gray-500 mt-1">
              Du kan ändra sidnummer om det inte stämmer
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="foneticSignsInput"
                checked={!!foneticSignsInput}
                onChange={inputChangeHandler}
              />
              <span>
                Innehåller landsmålsalfabetet eller andra fonetiska tecken
              </span>
            </label>

            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                name="unreadableInput"
                checked={!!unreadableInput}
                onChange={inputChangeHandler}
              />
              <span>Sidan är svårläst eller delvis oläslig (###)</span>
            </label>
          </div>
        </fieldset>
      )}

      {/* 3) Comment + contributor + send */}
      {(isReadyToTranscribe || isSent) && (
        <fieldset
          className="space-y-6 bg-white shadow-sm rounded-lg p-5 border border-gray-200"
          disabled={disableInput}
        >
          <div>
            <label
              htmlFor={commentId}
              className="font-semibold block mb-1 leading-snug"
            >
              {l(
                `Kommentar till sidan ${currentPageIndex + 1} (av ${
                  pages.length
                })`
              )}
            </label>
            <textarea
              id={commentId}
              name="messageCommentInput"
              lang="sv"
              spellCheck="false"
              value={comment}
              onChange={inputChangeHandler}
              className={field + " h-20 resize-y"}
            />
            <span className="text-xs text-gray-500">
              {l(
                "Har du stött på något problem med avskriften eller har du någon annan kommentar till den? Skriv då i kommentarsfältet."
              )}
            </span>
          </div>

          {/* 4) contributor + send */}
          {/* Only in state readytotranscribe */}
          {isReadyToTranscribe && (
            <>
              <ContributorInfoFields
                nameInput={nameInput}
                emailInput={emailInput}
                onChange={inputChangeHandler}
                emailId={emailId}
                emailValid={emailValid}
                onEmailBlur={handleEmailBlur}
                disabled={disableInput}
              />

              {/* Only in state readytotranscribe */}
              <button
                type="button"
                onClick={sendButtonClickHandler}
                data-gotonext="true"
                className={`
                  inline-flex items-center justify-center gap-2 px-6 py-2 rounded-lg
                  font-semibold text-white shadow transition
                  ${
                    sending || disableInput || !formValid
                      ? "bg-gray-400 !cursor-not-allowed !hover:text-white"
                      : "!bg-isof hover:!text-white hover:!bg-darker-isof hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-darker-isof"
                  }
                `}
                disabled={disableInput || sending || !formValid}
                title={
                  !formValid
                    ? l(
                        "Knappen aktiveras när du har skrivit minst två ord i Text-fältet"
                      )
                    : undefined
                }
              >
                {sending ? l("Skickar…") : sendButtonLabel}
              </button>
            </>
          )}

          {isSent && (
            <p className="mt-4" aria-live="polite">
              {l(
                "Tack för din avskrift. Efter granskning kommer den att publiceras."
              )}
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}
